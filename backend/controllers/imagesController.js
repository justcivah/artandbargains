const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const B2 = require('backblaze-b2');

// Configure Backblaze
const b2 = new B2({
	applicationKeyId: process.env.BACKBLAZE_KEY_ID,
	applicationKey: process.env.BACKBLAZE_APPLICATION_KEY
});

// Initialize B2 authorization
let b2Auth = null;
let bucketId = process.env.BACKBLAZE_BUCKET_ID;

// Function to ensure B2 is authorized
async function ensureB2Auth() {
	if (!b2Auth) {
		await b2.authorize();
		b2Auth = await b2.getUploadUrl({ bucketId });
	}
	return b2Auth;
}

// Generate a unique filename
function generateUniqueFilename(originalname) {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const randomString = crypto.randomBytes(8).toString('hex');
	const extension = path.extname(originalname);
	return `${timestamp}_${randomString}${extension}`;
}

// Configure multer for memory storage (files will be in req.file.buffer)
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024 // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only image files
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only image files are allowed'));
		}
	}
});

// Upload a single image to Backblaze
exports.uploadImage = [
	upload.single('image'),
	async (req, res) => {
		try {
			if (!req.file) {
				return res.status(400).json({ error: 'No file uploaded' });
			}

			// Ensure B2 is authorized
			await ensureB2Auth();

			// Generate a unique filename
			const filename = generateUniqueFilename(req.file.originalname);

			// Upload the file to Backblaze
			const fileInfo = await b2.uploadFile({
				uploadUrl: b2Auth.uploadUrl,
				uploadAuthToken: b2Auth.authorizationToken,
				fileName: filename,
				data: req.file.buffer,
				contentType: req.file.mimetype,
				info: {
					uploaded_by: req.user ? req.user.email : 'admin',
					original_name: req.file.originalname
				}
			});

			// Get the download URL
			const downloadUrl = `${process.env.BACKBLAZE_DOWNLOAD_URL}/file/${bucketId}/${filename}`;

			// Return the file information
			res.json({
				success: true,
				fileId: fileInfo.fileId,
				fileName: filename,
				fileUrl: downloadUrl
			});
		} catch (error) {
			console.error('Error uploading image:', error);
			res.status(500).json({ error: 'Failed to upload image' });
		}
	}
];

// Upload multiple images to Backblaze
exports.uploadMultipleImages = [
	upload.array('images', 10), // Max 10 images
	async (req, res) => {
		try {
			if (!req.files || req.files.length === 0) {
				return res.status(400).json({ error: 'No files uploaded' });
			}

			// Process each file
			const uploadPromises = req.files.map(async (file) => {
				// Ensure B2 is authorized
				await ensureB2Auth();

				// Generate a unique filename
				const filename = generateUniqueFilename(file.originalname);

				// Upload the file to Backblaze
				const fileInfo = await b2.uploadFile({
					uploadUrl: b2Auth.uploadUrl,
					uploadAuthToken: b2Auth.authorizationToken,
					fileName: filename,
					data: file.buffer,
					contentType: file.mimetype,
					info: {
						uploaded_by: req.user ? req.user.email : 'admin',
						original_name: file.originalname
					}
				});

				// Get the download URL
				const downloadUrl = `${process.env.BACKBLAZE_DOWNLOAD_URL}/file/${bucketId}/${filename}`;

				// Return the file information
				return {
					success: true,
					fileId: fileInfo.fileId,
					fileName: filename,
					fileUrl: downloadUrl
				};
			});

			// Wait for all uploads to complete
			const results = await Promise.all(uploadPromises);
			res.json(results);
		} catch (error) {
			console.error('Error uploading multiple images:', error);
			res.status(500).json({ error: 'Failed to upload images' });
		}
	}
];