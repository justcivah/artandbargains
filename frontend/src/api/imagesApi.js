import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Add auth token to all requests
const authHeader = () => {
	const token = localStorage.getItem('admin_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generate a unique filename for the image (can be handled on the backend)
export const generateUniqueFilename = (originalFilename) => {
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const randomString = Math.random().toString(36).substring(2, 10);
	const extension = originalFilename.split('.').pop();

	return `${timestamp}_${randomString}.${extension}`;
};

// Upload a single image
export const uploadImage = async (file) => {
	try {
		// Create form data
		const formData = new FormData();
		formData.append('image', file);

		// Upload the image
		const response = await axios({
			method: 'POST',
			url: `${API_URL}/api/images/upload`,
			data: formData,
			headers: {
				'Content-Type': 'multipart/form-data',
				...authHeader()
			}
		});

		return response.data;
	} catch (error) {
		console.error('Error uploading image:', error);
		throw error;
	}
};

// Upload multiple images
export const uploadMultipleImages = async (files) => {
	try {
		// Create form data with multiple files
		const formData = new FormData();

		// Append each file
		Array.from(files).forEach((file, index) => {
			formData.append('images', file);
		});

		// Upload the images
		const response = await axios({
			method: 'POST',
			url: `${API_URL}/api/images/uploadMultiple`,
			data: formData,
			headers: {
				'Content-Type': 'multipart/form-data',
				...authHeader()
			}
		});

		return response.data;
	} catch (error) {
		console.error('Error uploading multiple images:', error);
		throw error;
	}
};