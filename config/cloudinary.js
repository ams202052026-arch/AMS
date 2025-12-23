/**
 * Cloudinary Configuration
 * For uploading business documents and images
 */

const cloudinary = require('cloudinary').v2;
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use memory storage for multer (files will be in req.files as buffers)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    // Allow only specific file types
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, PNG, and PDF files are allowed'));
    }
};

// File filter for service images
const serviceImageFilter = (req, file, cb) => {
    // Allow only image file types
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
    }
};

// Multer upload instance for service images (handles optional file uploads)
const uploadServiceImage = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for images
    fileFilter: (req, file, cb) => {
        // Allow only image file types
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(file.originalname.toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only JPG, JPEG, PNG, and WEBP image files are allowed'));
        }
    }
});

// Multer upload instance
const uploadBusinessDocuments = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

// Function to upload buffer to Cloudinary
const uploadToCloudinary = (buffer, filename, folder = 'business-documents') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: folder,
                public_id: filename,
                resource_type: 'auto'
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        ).end(buffer);
    });
};

module.exports = {
    cloudinary,
    uploadBusinessDocuments,
    uploadServiceImage,
    uploadToCloudinary
};
