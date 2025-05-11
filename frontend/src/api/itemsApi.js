import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// Add auth token to all requests
const authHeader = () => {
	const token = localStorage.getItem('admin_token');
	return token ? { Authorization: `Bearer ${token}` } : {};
};

// Create axios instance with common config
const api = axios.create({
	baseURL: API_URL,
	headers: {
		'Content-Type': 'application/json',
		...authHeader()
	}
});

// Intercept requests to add auth token if it was updated
api.interceptors.request.use(config => {
	config.headers = {
		...config.headers,
		...authHeader()
	};
	return config;
});

// Fetch all items
export const fetchItems = async () => {
	try {
		const response = await api.get('/api/items');
		return response.data;
	} catch (error) {
		console.error('Error fetching items:', error);
		throw error;
	}
};

// Fetch a single item by ID
export const fetchItem = async (itemId) => {
	try {
		const response = await api.get(`/api/items/${encodeURIComponent(itemId)}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching item ${itemId}:`, error);
		throw error;
	}
};

// Get latest items
export const fetchRecentItems = async (limit = 10) => {
	try {
		const response = await api.get(`/api/items/recent?limit=${limit}`);
		return response.data;
	} catch (error) {
		console.error('Error fetching recent items:', error);
		throw error;
	}
};

export const searchItems = async (params = {}) => {
	try {
		// Convert params object to URL query string
		const queryParams = new URLSearchParams();

		Object.entries(params).forEach(([key, value]) => {
			if (Array.isArray(value)) {
				value.forEach(val => queryParams.append(key, val));
			} else if (value !== undefined && value !== null && value !== '') {
				queryParams.append(key, value);
			}
		});

		const queryString = queryParams.toString();
		const response = await api.get(`/api/items/search?${queryString}`);
		return response.data;
	} catch (error) {
		console.error('Error searching items:', error);
		throw error;
	}
};

// Delete an item
export const deleteItem = async (itemId) => {
	try {
		const response = await api.delete(`/api/items/${encodeURIComponent(itemId)}`);
		return response.data;
	} catch (error) {
		console.error(`Error deleting item ${itemId}:`, error);
		throw error;
	}
};

// Create a new item
export const createItem = async (itemData) => {
	try {
		const response = await api.post('/api/items', itemData);
		return response.data;
	} catch (error) {
		console.error('Error creating item:', error);
		throw error;
	}
};

// Update an existing item
export const updateItem = async (itemData) => {
	try {
		const response = await api.put(`/api/items/${encodeURIComponent(itemData.metadata.PK)}`, itemData);
		return response.data;
	} catch (error) {
		console.error('Error updating item:', error);
		throw error;
	}
};

// Fetch all item types
export const fetchItemTypes = async () => {
	try {
		const response = await api.get('/api/itemTypes');
		return response.data;
	} catch (error) {
		console.error('Error fetching item types:', error);
		throw error;
	}
};

// Fetch all subjects
export const fetchSubjects = async () => {
	try {
		const response = await api.get('/api/subjects');
		return response.data;
	} catch (error) {
		console.error('Error fetching subjects:', error);
		throw error;
	}
};

// Fetch all techniques
export const fetchTechniques = async () => {
	try {
		const response = await api.get('/api/techniques');
		return response.data;
	} catch (error) {
		console.error('Error fetching techniques:', error);
		throw error;
	}
};

// Fetch all periods
export const fetchPeriods = async () => {
	try {
		const response = await api.get('/api/periods');
		return response.data;
	} catch (error) {
		console.error('Error fetching periods:', error);
		throw error;
	}
};

// Fetch all medium types
export const fetchMediumTypes = async () => {
	try {
		const response = await api.get('/api/mediumTypes');
		return response.data;
	} catch (error) {
		console.error('Error fetching medium types:', error);
		throw error;
	}
};

// Fetch all condition types
export const fetchConditionTypes = async () => {
	try {
		const response = await api.get('/api/conditionTypes');
		return response.data;
	} catch (error) {
		console.error('Error fetching condition types:', error);
		throw error;
	}
};

// Fetch all contributors
export const fetchContributors = async () => {
	try {
		const response = await api.get('/api/contributors');
		return response.data;
	} catch (error) {
		console.error('Error fetching contributors:', error);
		throw error;
	}
};

// Fetch a single contributor by ID
export const fetchContributor = async (contributorId) => {
	try {
		const response = await api.get(`/api/contributors/${encodeURIComponent(contributorId)}`);
		return response.data;
	} catch (error) {
		console.error(`Error fetching contributor ${contributorId}:`, error);
		throw error;
	}
};

// Create a new entity (item type, category, period, etc.)
export const createEntity = async (entityType, entityData) => {
	try {
		const endpoint = `/api/${entityType}`;
		const response = await api.post(endpoint, entityData);
		return response.data;
	} catch (error) {
		console.error(`Error creating ${entityType}:`, error);
		throw error;
	}
};