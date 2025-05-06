const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const B2 = require('backblaze-b2');

// Configure Backblaze B2 client with Application Key ID and Application Key
const b2 = new B2({
	applicationKeyId: process.env.BACKBLAZE_KEY_ID,
	applicationKey: process.env.BACKBLAZE_APPLICATION_KEY,
});

// Get bucket ID and download URL from environment
const bucketId = process.env.BACKBLAZE_BUCKET_ID;
const bucketName = process.env.BACKBLAZE_BUCKET_NAME;
const downloadUrlBase = process.env.BACKBLAZE_DOWNLOAD_URL;

// Multer setup: memory storage, size limit, image-only filter
const upload = multer({
	storage: multer.memoryStorage(),
	// Max 10MB
	limits: { fileSize: 10 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) cb(null, true);
		else cb(new Error('Only image files are allowed'));
	}
});

// Helper to create a unique filename
function generateUniqueFilename(originalName) {
	const random = crypto.randomBytes(32).toString('hex');
	const ext = path.extname(originalName);
	return `${random}${ext}`;
}

// Core upload function: authorize, get upload URL, then upload buffer
async function uploadBufferToB2(buffer, originalName) {
	await b2.authorize();

	const uploadUrlResponse = await b2.getUploadUrl({ bucketId });
	const filename = generateUniqueFilename(originalName);

	const response = await b2.uploadFile({
		uploadUrl: uploadUrlResponse.data.uploadUrl,
		uploadAuthToken: uploadUrlResponse.data.authorizationToken,
		fileName: filename,
		data: buffer
	});

	const fileUrl = `${downloadUrlBase}/file/${bucketName}/${filename}`;
	return { fileId: response.fileId, fileName: filename, fileUrl };
}

// Single image upload handler
exports.uploadImage = [
	upload.single('image'),
	async (req, res) => {
		try {
			if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
			const result = await uploadBufferToB2(
				req.file.buffer,
				req.file.originalname
			);
			res.json({ success: true, ...result });
		} catch (err) {
			console.error('Upload error:', err);
			res.status(500).json({ error: 'Failed to upload image', details: err.message });
		}
	}
];

// Multiple images upload handler (up to 10 files)
exports.uploadMultipleImages = [
	upload.array('images', 10),
	async (req, res) => {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({ error: 'No files uploaded' });
		}

		const results = await Promise.all(req.files.map(async (file) => {
			try {
				const info = await uploadBufferToB2(
					file.buffer,
					file.originalname
				);
				return { success: true, ...info };
			} catch (err) {
				console.error(`Error uploading ${file.originalname}:`, err);
				return { success: false, fileName: file.originalname, error: err.message };
			}
		}));

		res.json(results);
	}
];