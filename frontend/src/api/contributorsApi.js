import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Helper function to get the JWT token
const getAuthHeader = () => {
	const token = localStorage.getItem('admin_token');
	return {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	};
};

// Fetch all contributors
export const fetchContributors = async () => {
	try {
		const response = await axios.get(`${API_URL}/api/contributors`);
		return response.data;
	} catch (error) {
		console.error('Error fetching contributors:', error);
		throw error;
	}
};

// Fetch a single contributor by ID
export const fetchContributor = async (id) => {
	try {
		const response = await axios.get(`${API_URL}/api/contributors/${id}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching contributor ${id}:`, error);
		throw error;
	}
};

// Create a new contributor
export const createContributor = async (contributorData) => {
	try {
		const response = await axios.post(
			`${API_URL}/api/contributors`,
			contributorData,
			getAuthHeader()
		);
		return response.data;
	} catch (error) {
		console.error('Error creating contributor:', error);
		throw error;
	}
};

// Update an existing contributor
export const updateContributor = async (id, contributorData) => {
	try {
		const response = await axios.put(
			`${API_URL}/api/contributors/${id}`,
			contributorData,
			getAuthHeader()
		);
		return response.data;
	} catch (error) {
		console.error(`Error updating contributor ${id}:`, error);
		throw error;
	}
};

// Delete a contributor
export const deleteContributor = async (id) => {
	try {
		const response = await axios.delete(
			`${API_URL}/api/contributors/${id}`,
			getAuthHeader()
		);
		return response.data;
	} catch (error) {
		console.error(`Error deleting contributor ${id}:`, error);
		throw error;
	}
};