const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const fs = require('fs');
const xlsx = require('xlsx');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary').v2;
const Razorpay = require("razorpay");
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const https = require('https');
require('dotenv').config();



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
mongoose.connect('mongodb+srv://veeradyani2:S%40nju_143@cluster0.uafyz.mongodb.net/pro-library?retryWrites=true&w=majority');


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
//For Orders
// Endpoint for uploading order images
app.post("/upload-order", upload.single('order'), (req, res) => {
    cloudinary.uploader.upload(req.file.path, (error, result) => {
        if (error) {
            return res.status(500).json({ success: 0, message: "Image upload failed", error });
        }
        res.json({
            success: 1,
            image_url: result.secure_url // Returns secure Cloudinary URL
        });
    });
});

// Endpoint for uploading product images
app.post("/upload-product-image", upload.single('image'), (req, res) => {
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


app.listen(port, (error) => {
    if (!error) {
        console.log("Server is running on " + port);
    } else {
        console.log("Server is not running, error - " + error);
    }
});
