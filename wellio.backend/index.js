const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
const { OpenAI } = require("openai");



app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});



// Middleware for parsing URL-encoded bodies with a size limit

app.use(express.urlencoded({ limit: '10mb', extended: true }));



app.use(cors());

// MongoDB connection
mongoose.connect('mongodb+srv://veeradyani2:S%40nju_143@cluster0.uafyz.mongodb.net/wellio?retryWrites=true&w=majority');


app.get("/", (req, res) => {
    res.send("Express app is running");
});

// Multer configuration for image upload
const uploadPath = path.join('/tmp', 'upload', 'images');

// Ensure the `/tmp/upload/images` directory exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true }); // Create the directory if it doesn't exist
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath); // Use the writable `/tmp` directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix); // Generate a unique filename
    },
});

const upload = multer({ storage: storage });


app.use('/images', express.static(path.join(__dirname, 'upload/images')));


// Endpoint for uploading product images
app.post("/upload", upload.single('product'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
        if (error) {
            return res.status(500).json({ success: 0, message: "Image upload failed", error });
        }

        res.json({
            success: 1,
            image_url: result.secure_url // Use the secure URL provided by Cloudinary
        });
    });
});


// For faculty

app.post("/upload-faculty", upload.single('image'), (req, res) => {
    const path = req.file.path; // Get the path of the uploaded file (from multer)

    // Upload the image to Cloudinary
    cloudinary.uploader.upload(path, { folder: "faculty_images" }, (error, result) => {
        if (error) {
            console.error("Error uploading to Cloudinary:", error);
            return res.status(500).json({ success: 0, message: "Image upload failed" });
        }

        // Respond with the Cloudinary image URL
        res.json({
            success: 1,
            image_url: result.secure_url // This is the persistent Cloudinary URL
        });
    });
});


// Simplified User Schema
const Users = mongoose.model('Users', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    status: { type: String, required: false },
    doctor: { type: String, required: true },
    address: { type: String, required: true },
    date: { type: Date, default: Date.now }
}));

const pendingVerifications = {}; // Store pending email verifications

app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, doctor, status, address } = req.body;

        // Validate required fields
        if (!name || !email || !password || !doctor || !address) {
            return res.status(400).json({ success: false, errors: "All fields are required." });
        }

        // Check for existing user
        const existingUser = await Users.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, errors: "Email is already registered." });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store temporarily for verification
        pendingVerifications[email] = {
            name,
            email,
            password,
            status,
            doctor, // string
            address,
            verificationCode,
            createdAt: Date.now()
        };

        // Send email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to Wellio – Verify Your Email',
            html: `
            <html>
                <body style="background-color: #1d3c34; color: white; font-family: Arial, sans-serif; padding: 20px;">
                    <h1 style="color: #4CAF50;">Welcome to Wellio, ${name}!</h1>
                    <p style="font-size: 18px;">Thank you for signing up.</p>
                    <p style="font-size: 18px;">Your verification code is:</p>
                    <h2 style="font-size: 32px; color: #ffffff; background-color: #4CAF50; display: inline-block; padding: 10px 20px; border-radius: 8px;">
                        ${verificationCode}
                    </h2>
                    <p style="font-size: 14px; margin-top: 20px;">Enter this code in the app to complete your registration.</p>
                    <p style="font-size: 14px;">If you didn’t request this, you can safely ignore this email.</p>
                </body>
            </html>
        `
        });

        res.json({ success: true, message: "Please verify your email address." });

    } catch (error) {
        console.error("Error during signup:", error);
        res.status(500).json({ error: "Signup failed." });
    }
});

app.post('/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const pendingUser = pendingVerifications[email];

        if (!pendingUser) {
            return res.status(400).json({ success: false, errors: "Verification expired or invalid email." });
        }

        if (pendingUser.verificationCode !== verificationCode) {
            return res.status(400).json({ success: false, errors: "Invalid verification code." });
        }

        // Save verified user to DB
        const user = new Users({
            name: pendingUser.name,
            email: pendingUser.email,
            password: pendingUser.password,
            status: pendingUser.status,
            doctor: pendingUser.doctor,
            address: pendingUser.address
        });

        await user.save();

        // ✅ Add this user to the doctor's patients list
        const doctor = await Doctors.findOne({ name: pendingUser.doctor });
        if (doctor) {
            if (!doctor.patients.includes(email)) {
                doctor.patients.push(email);
                await doctor.save();
            }
        } else {
            console.warn(`Doctor with name "${pendingUser.doctor}" not found.`);
        }

        delete pendingVerifications[email]; // Cleanup

        res.json({ success: true, message: "Email verified successfully." });
    } catch (error) {
        console.error("Error during verification:", error);
        res.status(500).json({ error: "Verification failed." });
    }
});

// Login route
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.json({ success: false, errors: "Email not found" });
        }

        if (password !== user.password) {
            return res.json({ success: false, errors: "Incorrect password" });
        }

        const token = jwt.sign(
            {
                user: {
                    id: user.id,
                    email: user.email,
                    appUser: "Patient"
                }
            },
            'secret_ecom',
            { expiresIn: '730h' }
        );

        res.json({ success: true, token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ success: false, errors: "Login failed" });
    }
});

const fetchUser = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
        }

        // Verify token
        const decoded = jwt.verify(token, 'secret_ecom');

        // Get user from database
        const user = await Users.findById(decoded.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, errors: "User not found" });
        }

        // Add user data to request
        req.user = user;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
    }
};

// Forgot password route
app.post("/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate OTP
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = jwt.sign({ userId: user._id }, "secret_ecom", { expiresIn: "15m" });

        // Store OTP temporarily
        pendingVerifications[email] = { resetCode, resetToken, createdAt: Date.now() };

        // Send OTP via Email
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Well.io Password Reset Code",
            html: `
        <html>
            <body style="background-color: #f4f4f4; font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #1d3c34;">Password Reset - Well.io</h2>
                    <p>Hi ${user.name},</p>
                    <p>You requested a password reset. Use the following one-time code to proceed:</p>
                    <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #4CAF50;">${resetCode}</div>
                    <p>This code is valid for 15 minutes.</p>
                    <p>If you didn’t request this, please ignore this email.</p>
                    <p style="margin-top: 30px;">– The Well.io Team</p>
                </div>
            </body>
        </html>
    `
        });
        res.json({ success: true, message: "OTP sent to email", resetToken });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        res.status(500).json({ message: "Error sending OTP" });
    }
});

// ⬇️ 2️⃣ Verify OTP (New Route)
app.post("/verify-forgot-otp", async (req, res) => {
    try {
        const { resetToken, resetCode } = req.body;
        const decoded = jwt.verify(resetToken, "secret_ecom");
        const user = await Users.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if OTP matches
        const pendingReset = pendingVerifications[user.email];
        if (!pendingReset || pendingReset.resetCode !== resetCode) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        res.json({ success: true, message: "OTP verified!" });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        res.status(400).json({ message: "Invalid or expired OTP" });
    }
});

app.post("/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // Verify reset token
        const decoded = jwt.verify(resetToken, "secret_ecom");
        const user = await Users.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Ensure OTP was verified before resetting password
        if (!pendingVerifications[user.email]) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        // Update password (without hashing)
        user.password = newPassword;
        await user.save();

        // Clean up verification record
        delete pendingVerifications[user.email];

        res.json({ success: true, message: "Password reset successful!" });

    } catch (error) {
        console.error("Reset Password Error:", error);
        res.status(400).json({ message: "Invalid or expired token" });
    }
});

app.get('/allusers', async (req, res) => {
    try {
        let users = await Users.find({}).sort({ date: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// ... existing code ...

// Merchant Schema
const Doctors = mongoose.model('Doctors', new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    patients: [{ type: String }],
    about: { type: String },
    phone: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
}));

const pendingDoctorVerifications = {}; // Store pending doctor email verifications

app.post('/doctor/signup', async (req, res) => {
    try {
        const { name, email, password, address, phone, about } = req.body;

        // Validate input
        if (!name || !email || !password || !address || !phone) {
            return res.status(400).json({ success: false, errors: "Required fields missing." });
        }

        // Check if email already exists
        const existingDoctor = await Doctors.findOne({ email });
        if (existingDoctor) {
            return res.status(400).json({
                success: false,
                errors: "Email is already registered."
            });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Store pending verification
        pendingDoctorVerifications[email] = {
            name,
            email,
            password,
            address,
            phone,
            about: about || '',
            patients: [],
            verificationCode,
            createdAt: Date.now()
        };

        // Send verification email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Well.io Doctor Account',
            html: `
                <html>
                    <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; color: #333;">
                        <h2 style="color: #1d3c34;">Welcome to Well.io, Dr. ${name}!</h2>
                        <p>Please verify your email to activate your account.</p>
                        <p>Your verification code is: <strong style="font-size: 20px; color: #4CAF50;">${verificationCode}</strong></p>
                        <p>This code expires in 15 minutes.</p>
                        <p>If you didn’t request this, please ignore this email.</p>
                        <br>
                        <p>– The Well.io Team</p>
                    </body>
                </html>
            `
        });

        res.json({ success: true, message: "Please verify your email address." });

    } catch (error) {
        console.error("Error during doctor signup:", error);
        res.status(500).json({ error: "Signup failed." });
    }
});

app.post('/doctor/verify-email', async (req, res) => {
    try {
        const { email, verificationCode } = req.body;
        const pendingDoctor = pendingDoctorVerifications[email];

        // Check if pending verification exists
        if (!pendingDoctor) {
            return res.status(400).json({ success: false, errors: "Verification expired or invalid email." });
        }

        // Check if verification code matches
        if (pendingDoctor.verificationCode !== verificationCode) {
            return res.status(400).json({ success: false, errors: "Invalid verification code." });
        }

        // Create and save verified doctor
        const doctor = new Doctors({
            name: pendingDoctor.name,
            email: pendingDoctor.email,
            password: pendingDoctor.password, // Consider hashing before saving
            address: pendingDoctor.address,
            phone: pendingDoctor.phone,
            about: pendingDoctor.about,
            patients: pendingDoctor.patients,
            isVerified: true
        });

        await doctor.save();
        delete pendingDoctorVerifications[email];

        // Generate token for auto login
        const token = jwt.sign({ doctor: { id: doctor.id } }, 'secret_doctor', { expiresIn: '730h' });

        res.json({
            success: true,
            message: "Email verified successfully.",
            token,
            doctor: {
                id: doctor.id,
                name: doctor.name,
                email: doctor.email
            }
        });

    } catch (error) {
        console.error("Error during doctor email verification:", error);
        res.status(500).json({ error: "Verification failed." });
    }
});


// Merchant login route
const bcrypt = require('bcryptjs');

app.post('/doctor/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const doctor = await Doctors.findOne({ email });

        if (!doctor) {
            return res.json({ success: false, errors: "Email not found" });
        }

        // Here, we are no longer comparing passwords with bcrypt
        // Instead, we can directly assume the password is valid or perform custom logic if needed.
        if (password !== doctor.password) {
            return res.json({ success: false, errors: "Incorrect password" });
        }

        const token = jwt.sign(
            {
                doctor: {
                    id: doctor.id,
                    email: doctor.email,
                    appUser: "Doctor"
                }
            },
            'secret_doctor',
            { expiresIn: '730h' }
        );

        res.json({
            success: true,
            token,
            doctor: {
                id: doctor.id,
                name: doctor.name,
                email: doctor.email
            }
        });

    } catch (error) {
        console.error("Doctor login error:", error);
        res.status(500).json({ success: false, errors: "Login failed" });
    }
});

// Middleware for merchant authentication
const fetchDoctor = async (req, res, next) => {
    try {
        const token = req.header('auth-token');
        if (!token) {
            return res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
        }

        const decoded = jwt.verify(token, 'secret_doctor');
        const doctor = await Doctors.findById(decoded.doctor.id).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, errors: "Doctor not found" });
        }

        req.doctor = doctor;
        next();

    } catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({ success: false, errors: "Please authenticate using a valid token" });
    }
};
app.get('/doctor/profile', fetchDoctor, async (req, res) => {
    try {
        res.json({
            success: true,
            doctor: req.doctor
        });
    } catch (error) {
        console.error("Error fetching doctor profile:", error);
        res.status(500).json({ error: "Failed to fetch doctor profile" });
    }
});

app.put('/doctor/update-profile', fetchDoctor, async (req, res) => {
    try {
        const { name, address, phone, about } = req.body;
        const doctor = await Doctors.findById(req.doctor.id);

        doctor.name = name || doctor.name;
        doctor.address = address || doctor.address;
        doctor.phone = phone || doctor.phone;
        doctor.about = about || doctor.about;

        await doctor.save();

        res.json({ success: true, message: 'Profile updated successfully', doctor });
    } catch (error) {
        console.error("Error updating doctor profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

app.post("/doctor/forgot-password", async (req, res) => {
    try {
        const { email } = req.body;
        const doctor = await Doctors.findOne({ email });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetToken = jwt.sign({ doctorId: doctor._id }, "secret_doctor", { expiresIn: "15m" });

        pendingDoctorVerifications[email] = { resetCode, resetToken, createdAt: Date.now() };

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Well.io Doctor Password Reset Code",
            html: `
                <html>
                    <body style="background-color: #f4f4f4; font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                            <h2 style="color: #1d3c34;">Doctor Password Reset - Well.io</h2>
                            <p>Hi Dr. ${doctor.name},</p>
                            <p>You requested a password reset. Use the following one-time code to proceed:</p>
                            <div style="font-size: 24px; font-weight: bold; margin: 20px 0; color: #4CAF50;">${resetCode}</div>
                            <p>This code is valid for 15 minutes.</p>
                            <p>If you didn’t request this, please ignore this email.</p>
                            <p style="margin-top: 30px;">– The Well.io Team</p>
                        </div>
                    </body>
                </html>
            `
        });

        res.json({ success: true, message: "OTP sent to email", resetToken });

    } catch (error) {
        console.error("Doctor Forgot Password Error:", error);
        res.status(500).json({ message: "Error sending OTP" });
    }
});


app.post("/doctor/verify-forgot-otp", async (req, res) => {
    try {
        const { resetToken, resetCode } = req.body;
        const decoded = jwt.verify(resetToken, "secret_doctor");
        const doctor = await Doctors.findById(decoded.doctorId);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        const pendingReset = pendingDoctorVerifications[doctor.email];
        if (!pendingReset || pendingReset.resetCode !== resetCode) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        res.json({ success: true, message: "OTP verified!" });

    } catch (error) {
        console.error("Doctor OTP Verification Error:", error);
        res.status(400).json({ message: "Invalid or expired OTP" });
    }
});

app.post("/doctor/reset-password", async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const decoded = jwt.verify(resetToken, "secret_doctor");
        const doctor = await Doctors.findById(decoded.doctorId);

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (!pendingDoctorVerifications[doctor.email]) {
            return res.status(400).json({ message: "OTP verification required" });
        }

        doctor.password = newPassword; // Should ideally hash this!
        await doctor.save();

        delete pendingDoctorVerifications[doctor.email];

        res.json({ success: true, message: "Password reset successful!" });

    } catch (error) {
        console.error("Doctor Reset Password Error:", error);
        res.status(400).json({ message: "Invalid or expired token" });
    }
});



app.get('/alldoctors', async (req, res) => {
    try {
        let doctors = await Doctors.find({}).sort({ date: -1 });
        res.json(doctors);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});


const users = [
  {
    name: "Veer Adyani",
    email: "veeradyani12@gmail.com",
    gender: "Male",
    age: 20,
    height: 170,
    weight: 60,
    bloodGroup: "O+",
    allergies: "None",
    medications: "None",
    medicalHistory: "None",
    familyHistory: "None",
    lifestyle: "Active",
    sleep: "7 hours",
    diet: "Balanced",
    exercise: "Regular",
    stressLevel: "Low",
    hydration: "Adequate",
    smoking: "No",
    alcohol: "No",
    caffeine: "Moderate",
    screenTime: "2 hours"
  },
  {
    name: "Shorya Jain",
    email: "shorya1016@gmail.com",
    gender: "Female",
    age: 22,
    height: 160,
    weight: 55,
    bloodGroup: "A+",
    allergies: "Pollen",
    medications: "Antihistamines",
    medicalHistory: "Asthma",
    familyHistory: "Diabetes",
    lifestyle: "Moderate",
    sleep: "6 hours",
    diet: "Vegetarian",
    exercise: "Occasional",
    stressLevel: "Medium",
    hydration: "Low",
    smoking: "No",
    alcohol: "Occasionally",
    caffeine: "Low",
    screenTime: "5 hours"
  },
  {
    name: "Priya Sharma",
    email: "shorya.2098@gmail.com",
    gender: "Female",
    age: 24,
    height: 165,
    weight: 58,
    bloodGroup: "B+",
    allergies: "Dust",
    medications: "None",
    medicalHistory: "Migraines",
    familyHistory: "Hypertension",
    lifestyle: "Active",
    sleep: "8 hours",
    diet: "Balanced",
    exercise: "Regular",
    stressLevel: "Low",
    hydration: "High",
    smoking: "No",
    alcohol: "No",
    caffeine: "High",
    screenTime: "3 hours"
  },
  {
    name: "Vaidik Sule",
    email: "vaidiksule@gmail.com",
    gender: "Male",
    age: 21,
    height: 175,
    weight: 70,
    bloodGroup: "AB+",
    allergies: "None",
    medications: "None",
    medicalHistory: "None",
    familyHistory: "Heart Disease",
    lifestyle: "Sedentary",
    sleep: "5 hours",
    diet: "High-Protein",
    exercise: "Rare",
    stressLevel: "High",
    hydration: "Low",
    smoking: "Yes",
    alcohol: "Yes",
    caffeine: "High",
    screenTime: "7 hours"
  },
  {
    name: "Ishita Sule",
    email: "vaidiksulemusic@gmail.com",
    gender: "Female",
    age: 23,
    height: 162,
    weight: 52,
    bloodGroup: "O-",
    allergies: "Nuts",
    medications: "Epinephrine",
    medicalHistory: "Allergies",
    familyHistory: "None",
    lifestyle: "Active",
    sleep: "7.5 hours",
    diet: "Gluten-Free",
    exercise: "Regular",
    stressLevel: "Medium",
    hydration: "Adequate",
    smoking: "No",
    alcohol: "Rarely",
    caffeine: "Low",
    screenTime: "4 hours"
  }
];


// Generate random vitals
function getRandomVital({ min, max, abnormalMin, abnormalMax }) {
  const isAbnormal = Math.random() < 0.3; // 30% chance abnormal
  if (!isAbnormal) return +(Math.random() * (max - min) + min).toFixed(1);
  return Math.random() < 0.5
    ? +(Math.random() * (abnormalMin.max - abnormalMin.min) + abnormalMin.min).toFixed(1)
    : +(Math.random() * (abnormalMax.max - abnormalMax.min) + abnormalMax.min).toFixed(1);
}

function getUserVitals() {
  return users.map(user => {
    return {
      ...user,
      vitals: {
        bloodPressure: `${Math.floor(getRandomVital({ min: 90, max: 120, abnormalMin: { min: 70, max: 89 }, abnormalMax: { min: 121, max: 160 } }))}/${Math.floor(getRandomVital({ min: 60, max: 80, abnormalMin: { min: 40, max: 59 }, abnormalMax: { min: 81, max: 100 } }))}`,
        oxygenLevel: getRandomVital({ min: 95, max: 100, abnormalMin: { min: 80, max: 89 }, abnormalMax: { min: 101, max: 105 } }),
        heartbeat: getRandomVital({ min: 60, max: 100, abnormalMin: { min: 30, max: 59 }, abnormalMax: { min: 101, max: 150 } }),
        temperature: getRandomVital({ min: 97, max: 99, abnormalMin: { min: 95, max: 96.9 }, abnormalMax: { min: 99.1, max: 103 } }),
        breathingRate: getRandomVital({ min: 12, max: 20, abnormalMin: { min: 6, max: 11 }, abnormalMax: { min: 21, max: 30 } }),
        heartRateVariability: getRandomVital({ min: 20, max: 100, abnormalMin: { min: 5, max: 19 }, abnormalMax: { min: 101, max: 150 } }), // ms
        vo2Max: getRandomVital({ min: 35, max: 50, abnormalMin: { min: 20, max: 34 }, abnormalMax: { min: 51, max: 70 } }), // ml/kg/min
        sleepDuration: getRandomVital({ min: 6, max: 9, abnormalMin: { min: 3, max: 5.9 }, abnormalMax: { min: 9.1, max: 12 } }), // in hours
        steps: Math.floor(getRandomVital({ min: 5000, max: 12000, abnormalMin: { min: 0, max: 4999 }, abnormalMax: { min: 12001, max: 20000 } })), // steps
        caloriesBurned: Math.floor(getRandomVital({ min: 1500, max: 2500, abnormalMin: { min: 800, max: 1499 }, abnormalMax: { min: 2501, max: 3500 } })), // kcal
        noiseLevel: getRandomVital({ min: 30, max: 80, abnormalMin: { min: 10, max: 29 }, abnormalMax: { min: 81, max: 100 } }) // dB
      }
    };
  });
};


app.get('/api/vitals', (req, res) => {
    res.json(getUserVitals());
});

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/get-health-ai', async (req, res) => {
  const { vitalsHistory, staticData } = req.body;

  if (!vitalsHistory || !staticData) {
    return res.status(400).json({ error: 'Missing vitals or static data' });
  }

  const tipPrompt = `
You are a health assistant. Based on this 10-minute rolling vitals data:\n
${JSON.stringify(vitalsHistory, null, 2)}\n
Give a short, friendly, personalized one-sentence health tip.
`;

  const summaryPrompt = `
You are a smart health analyst. Based on the vitals:\n
${JSON.stringify(vitalsHistory, null, 2)}\n
and static patient data (like allergies, diet, exercise, lifestyle):\n
${JSON.stringify(staticData, null, 2)}\n
Give a short summary of their health in two sentences and suggest one improvement.
`;

  try {
    const [tipResponse, summaryResponse] = await Promise.all([
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: tipPrompt }],
      }),
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: summaryPrompt }],
      }),
    ]);

    const tip = tipResponse.choices[0].message.content.trim();
    const summary = summaryResponse.choices[0].message.content.trim();

    return res.json({ tip, summary });
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on " + port);
    } else {
        console.log("Server is not running, error - " + error);
    }
});
