import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.Cloud_name,
    api_key: process.env.API_key,
    api_secret: process.env.API_secret,
    secure: true,
});

// Example: force WebP format
const webpUrl = cloudinary.url("shoes", {
    format: "webp",    // always convert to WebP
    quality: "good",   // let Cloudinary optimize quality
});


// Example: deliver auto format (WebP/AVIF if supported, else fallback)
const autoOptimizedUrl = cloudinary.url("shoes", {
    fetch_format: "auto", // webp/avif for supported browsers, jpeg/png fallback
    quality: "good",
});


export default cloudinary;