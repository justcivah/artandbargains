const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');

// Import controllers
const itemsController = require('./controllers/itemsController');
const metadataController = require('./controllers/metadataController');
const contributorsController = require('./controllers/contributorsController');
const imagesController = require('./controllers/imagesController');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login endpoint
app.post('/api/auth/login', authMiddleware.login);

// Items endpoints
app.get('/api/items/recent', itemsController.getRecentItems);
app.get('/api/items/search', itemsController.searchItems);
app.get('/api/items', itemsController.getItems);
app.post('/api/items', authMiddleware.authenticateAdmin, itemsController.createItem);
app.get('/api/items/:id', itemsController.getItem);
app.put('/api/items/:id', authMiddleware.authenticateAdmin, itemsController.updateItem);
app.delete('/api/items/:id', authMiddleware.authenticateAdmin, itemsController.deleteItem);

// Metadata endpoints
app.get('/api/itemTypes', metadataController.getItemTypes);
app.post('/api/itemTypes', authMiddleware.authenticateAdmin, metadataController.createItemType);
app.get('/api/subjects', metadataController.getSubjects);
app.post('/api/subjects', authMiddleware.authenticateAdmin, metadataController.createSubject);
app.get('/api/techniques', metadataController.getTechniques);
app.post('/api/techniques', authMiddleware.authenticateAdmin, metadataController.createTechnique);
app.get('/api/periods', metadataController.getPeriods);
app.post('/api/periods', authMiddleware.authenticateAdmin, metadataController.createPeriod);
app.get('/api/mediumTypes', metadataController.getMediumTypes);
app.post('/api/mediumTypes', authMiddleware.authenticateAdmin, metadataController.createMediumType);
app.get('/api/conditionTypes', metadataController.getConditionTypes);
app.post('/api/conditionTypes', authMiddleware.authenticateAdmin, metadataController.createConditionType);

// Contributors endpoints
app.get('/api/contributors', contributorsController.getContributors);
app.get('/api/contributors/:id', contributorsController.getContributor);
app.post('/api/contributors', authMiddleware.authenticateAdmin, contributorsController.createContributor);
app.put('/api/contributors/:id', authMiddleware.authenticateAdmin, contributorsController.updateContributor);
app.delete('/api/contributors/:id', authMiddleware.authenticateAdmin, contributorsController.deleteContributor);

// Image upload endpoint
app.post('/api/images/upload', authMiddleware.authenticateAdmin, imagesController.uploadImage);
app.post('/api/images/uploadMultiple', authMiddleware.authenticateAdmin, imagesController.uploadMultipleImages);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});