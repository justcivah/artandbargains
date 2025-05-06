const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import middleware
const authMiddleware  = require('./middleware/authMiddleware');

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
app.get('/api/items/generateId', authMiddleware.authenticateAdmin, itemsController.generateId);
app.get('/api/items', authMiddleware.authenticateAdmin, itemsController.getItems);
app.get('/api/items/:id', authMiddleware.authenticateAdmin, itemsController.getItem);
app.post('/api/items', authMiddleware.authenticateAdmin, itemsController.createItem);
app.put('/api/items/:id', authMiddleware.authenticateAdmin, itemsController.updateItem);
app.delete('/api/items/:id', authMiddleware.authenticateAdmin, itemsController.deleteItem);

// Metadata endpoints
app.get('/api/itemTypes', authMiddleware.authenticateAdmin, metadataController.getItemTypes);
app.post('/api/itemTypes', authMiddleware.authenticateAdmin, metadataController.createItemType);
app.get('/api/categories', authMiddleware.authenticateAdmin, metadataController.getCategories);
app.post('/api/categories', authMiddleware.authenticateAdmin, metadataController.createCategory);
app.get('/api/periods', authMiddleware.authenticateAdmin, metadataController.getPeriods);
app.post('/api/periods', authMiddleware.authenticateAdmin, metadataController.createPeriod);
app.get('/api/mediumTypes', authMiddleware.authenticateAdmin, metadataController.getMediumTypes);
app.post('/api/mediumTypes', authMiddleware.authenticateAdmin, metadataController.createMediumType);
app.get('/api/conditionTypes', authMiddleware.authenticateAdmin, metadataController.getConditionTypes);
app.post('/api/conditionTypes', authMiddleware.authenticateAdmin, metadataController.createConditionType);

// Contributors endpoints
app.get('/api/contributors', authMiddleware.authenticateAdmin, contributorsController.getContributors);
app.post('/api/contributors', authMiddleware.authenticateAdmin, contributorsController.createContributor);

// Image upload endpoint
app.post('/api/images/upload', authMiddleware.authenticateAdmin, imagesController.uploadImage);
app.post('/api/images/uploadMultiple', authMiddleware.authenticateAdmin, imagesController.uploadMultipleImages);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});