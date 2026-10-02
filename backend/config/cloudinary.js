const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Uploads an image held in memory (from multer) and resolves with Cloudinary's result
const uploadBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: 'grill-and-barbeque/menu',
          transformation: [{ width: 1000, crop: 'limit' }, { quality: 'auto' }], // keeps files small
        },
        (err, result) => (err ? reject(err) : resolve(result))
      )
      .end(buffer);
  });

module.exports = { cloudinary, uploadBuffer };