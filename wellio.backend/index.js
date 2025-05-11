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
const { GoogleGenerativeAI } = require('@google/generative-ai');



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

        // Check if doctor exists
        const doctorUser = await Doctors.findOne({ email: doctor });
        if (!doctorUser) {
            return res.status(404).json({ success: false, errors: "Doctor not found." });
        }

        // Generate verification code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Temporarily store user info
        pendingVerifications[email] = {
            name,
            email,
            password,
            status,
            doctor,
            address,
            verificationCode,
            createdAt: Date.now()
        };

        // Add patient to doctor's patients array if not already present
        if (!doctorUser.patients.includes(email)) {
            doctorUser.patients.push(email);
            await doctorUser.save();
        }

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

// Helper function to generate random numbers within a range
function getRandomInRange(min, max, fixed = 1) {
    return parseFloat((Math.random()) * (max - min) + min).toFixed(fixed);
}

// Generate vitals for each user
function generateVitals() {
    return users.map(user => {
        const steps = user.vitals?.steps 
            ? user.vitals.steps + Math.floor(Math.random() * 50) 
            : Math.floor(getRandomInRange(1000, 3000, 0));
            
        const caloriesBurned = user.vitals?.caloriesBurned 
            ? user.vitals.caloriesBurned + Math.floor(Math.random() * 50) 
            : Math.floor(getRandomInRange(500, 800, 0));

        return {
            ...user,
            vitals: {
                bloodPressure: `${Math.floor(getRandomInRange(110, 120, 0))}/${Math.floor(getRandomInRange(70, 80, 0))}`,
                oxygenLevel: getRandomInRange(96, 100, 1),
                heartbeat: getRandomInRange(60, 100, 0),
                temperature: getRandomInRange(97, 99, 1),
                breathingRate: getRandomInRange(12, 18, 0),
                heartRateVariability: getRandomInRange(40, 80, 0),
                vo2Max: getRandomInRange(35, 45, 1),
                sleepDuration: getRandomInRange(7, 8.5, 1),
                steps: steps,
                caloriesBurned: caloriesBurned,
                noiseLevel: getRandomInRange(30, 70, 0)
            }
        };
    });
}

// Cache for vitals data
let cachedVitals = generateVitals();
let lastUpdateTime = Date.now();
const UPDATE_INTERVAL = 90 * 1; // 1.5 minutes

// API endpoint to get vitals
app.get('/api/vitals', (req, res) => {
    const currentTime = Date.now();
    
    // Regenerate vitals if UPDATE_INTERVAL has passed
    if (currentTime - lastUpdateTime > UPDATE_INTERVAL) {
        cachedVitals = generateVitals();
        lastUpdateTime = currentTime;
    }
    
    res.json(cachedVitals);
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const userLastRequest = new Map();

app.post('/api/test-ai', async (req, res) => {
    const { vitals, staticData } = req.body;

    if (!vitals || !staticData) {
        return res.status(400).json({ error: 'Missing required data' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `
You're a virtual health assistant. Based on the following patient information, provide:

1. A brief health **overview**.
2. Identify any **abnormalities** or areas of concern.
3. Suggest **one practical tip** (e.g., if BP is low, "Consider a salty snack"). The tip should not be more than two lines.The overview should be brief and in a way that younare speakinmg to the person, not talking about them.

### Patient Info:
- Age: ${staticData.age}
- Gender: ${staticData.gender}
- Height: ${staticData.height} cm
- Weight: ${staticData.weight} kg
- BMI: ${(staticData.weight / ((staticData.height / 100) ** 2)).toFixed(2)}
- Allergies: ${staticData.allergies}
- Medications: ${staticData.medications}
- Medical History: ${staticData.medicalHistory}
- Family History: ${staticData.familyHistory}
- Lifestyle: ${staticData.lifestyle}
- Sleep: ${staticData.sleep}
- Diet: ${staticData.diet}
- Exercise: ${staticData.exercise}
- Stress Level: ${staticData.stressLevel}
- Hydration: ${staticData.hydration}
- Smoking: ${staticData.smoking}
- Alcohol: ${staticData.alcohol}
- Caffeine: ${staticData.caffeine}
- Screen Time: ${staticData.screenTime}

### Latest Vitals:
${Object.entries(vitals).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Respond in this format:
Overview: ...
Abnormalities: ...
Tip: ...
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const [overview, abnormalities, tip] = text.split(/Overview:|Abnormalities:|Tip:/)
            .map(s => s?.trim())
            .filter(Boolean);

        return res.json({
            overview,
            abnormalities,
            tip
        });
    } catch (error) {
        console.error('Gemini API error:', error.message);
        return res.status(500).json({
            error: 'AI service unavailable',
            details: error.message
        });
    }
});


app.post('/api/doctor-insights', async (req, res) => {
    const { vitals, staticData } = req.body;

    if (!vitals || !staticData) {
        return res.status(400).json({ error: 'Missing required patient data' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = ` 
You are a medical AI assistant providing detailed insights to a doctor about their patient. 
Analyze the following patient data and provide a structured response with key findings (please do not use any bold letters or bullet points, keep the text very plain).:

### Patient Background:
- Name: ${staticData.name || 'Not provided'}
- Age: ${staticData.age}
- Gender: ${staticData.gender}
- BMI: ${(staticData.weight) / ((staticData.height / 100) ** 2).toFixed(1)} (${staticData.height}cm, ${staticData.weight}kg)
- Blood Group: ${staticData.bloodGroup}

### Medical Context:
- Allergies: ${staticData.allergies || 'None reported'}
- Current Medications: ${staticData.medications || 'None'}
- Medical History: ${staticData.medicalHistory || 'None significant'}
- Family History: ${staticData.familyHistory || 'None significant'}

### Lifestyle Factors:
- Activity Level: ${staticData.lifestyle}
- Exercise: ${staticData.exercise}
- Sleep: ${staticData.sleep}
- Diet: ${staticData.diet}
- Stress: ${staticData.stressLevel}
- Habits: ${staticData.smoking}, ${staticData.alcohol}, ${staticData.caffeine}

### Current Vitals:
${Object.entries(vitals).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Provide your analysis in this exact format (keep each section concise but comprehensive):

**1. Key Health Summary**
[2-3 sentence overview of patient's overall health status]

**2. Notable Abnormalities**
- [Bullet point 1 - specific abnormal value with context]
- [Bullet point 2 - if another exists]
- [Flag any values outside normal ranges]

**3. Risk Factors**
- [Primary lifestyle risk factor 1]
- [Secondary risk factor 2]
- [Any concerning combinations]

**4. Recommended Actions**
1. [Primary clinical recommendation]
2. [Secondary suggestion]
3. [Lifestyle modification if needed]

**5. Follow-up Considerations**
- [Specific metrics to monitor]
- [Suggested timeframe for re-evaluation]
- [Any red flags to watch for]
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // More robust parsing function
        const parseInsights = (text) => {
            const sections = {
                summary: '',
                abnormalities: '',
                risks: '',
                actions: '',
                followup: ''
            };

            // Split by numbered sections first
            const sectionPattern = /\n\n\d\./g;
            const parts = text.split(sectionPattern);

            // If we got the expected 5 parts (0-4)
            if (parts.length >= 5) {
                return {
                    summary: parts[0].replace('1. Key Health Summary', '').trim(),
                    abnormalities: parts[1].replace('2. Notable Abnormalities', '').trim(),
                    risks: parts[2].replace('3. Risk Factors', '').trim(),
                    actions: parts[3].replace('4. Recommended Actions', '').trim(),
                    followup: parts[4].replace('5. Follow-up Considerations', '').trim()
                };
            }

            // Fallback: Try to find each section independently
            const findSection = (title) => {
                const regex = new RegExp(`${title}[\\s\\S]*?(?=\\n\\n\\d\\.|$)`, 'i');
                const match = text.match(regex);
                return match ? match[0].replace(title, '').trim() : '';
            };

            return {
                summary: findSection('1. Key Health Summary') || 'No summary available',
                abnormalities: findSection('2. Notable Abnormalities') || 'No abnormalities detected',
                risks: findSection('3. Risk Factors') || 'No significant risk factors',
                actions: findSection('4. Recommended Actions') || 'No specific recommendations',
                followup: findSection('5. Follow-up Considerations') || 'Standard monitoring recommended'
            };
        };

        const insights = parseInsights(text);

        return res.json({
            success: true,
            insights,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Doctor insights error:', error);
        return res.status(500).json({
            error: 'Failed to generate medical insights',
            details: error.message
        });
    }
});

app.post('/api/health-question', async (req, res) => {
    const { vitals, staticData, question } = req.body;

    if (!vitals || !staticData || !question) {
        return res.status(400).json({ error: 'Missing required patient data or question' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Calculate BMI
        const bmi = (staticData.weight) / ((staticData.height / 100) ** 2).toFixed(1);

        const prompt = ` 
You are a medical AI assistant providing specific answers to a patient's health questions based on their data.
The patient has asked: "${question}"

Analyze the following patient data and provide a concise, professional answer (2-4 sentences) in plain text format:

### Patient Background:
- Age: ${staticData.age}
- Gender: ${staticData.gender}
- BMI: ${bmi} (${staticData.height}cm, ${staticData.weight}kg)
- Blood Group: ${staticData.bloodGroup}

### Medical Context:
- Allergies: ${staticData.allergies || 'None reported'}
- Current Medications: ${staticData.medications || 'None'}
- Medical History: ${staticData.medicalHistory || 'None significant'}
- Family History: ${staticData.familyHistory || 'None significant'}

### Lifestyle Factors:
- Activity Level: ${staticData.lifestyle}
- Exercise: ${staticData.exercise}
- Sleep: ${staticData.sleep}
- Diet: ${staticData.diet}
- Stress: ${staticData.stressLevel}
- Habits: ${staticData.smoking}, ${staticData.alcohol}, ${staticData.caffeine}

### Current Vitals:
${Object.entries(vitals).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

Guidelines for your response:
1. Directly address the patient's question first
2. Reference specific data points when relevant
3. Keep the tone professional but approachable
4. If the question requires medical advice beyond your scope, recommend consulting their doctor
5. For numerical values (BP, BMI, etc.), mention whether they're in normal range
6. Limit response to 4 sentences maximum unless complex analysis is needed

Response format (plain text only, no markdown or formatting):
[Your direct answer to the question based on the data provided]
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up the response
        const cleanText = text.replace(/\*\*/g, '') // Remove any bold markers
                             .replace(/^\s*[\n\r]+/gm, '') // Remove empty lines
                             .trim();

        return res.json({
            success: true,
            question,
            answer: cleanText,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Health question error:', error);
        return res.status(500).json({
            error: 'Failed to generate health answer',
            details: error.message
        });
    }
});

app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on " + port);
    } else {
        console.log("Server is not running, error - " + error);
    }
});
