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
const contactController = require('./controllers/contactController');
const sitemapController = require('./controllers/sitemapController');
const robotsController = require('./controllers/robotsController');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Keep-alive endpoint
app.get('/api/keep/alive', (req, res) => { res.json({ success: true }); });

// Sitemap endpoints - Add these BEFORE other routes
app.get('/sitemap.xml', sitemapController.generateSitemapWithImages);

// Add robots.txt route
app.get('/robots.txt', robotsController.generateRobotsTxt);

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
app.put('/api/itemTypes/:id', authMiddleware.authenticateAdmin, metadataController.updateItemType);
app.delete('/api/itemTypes/:id', authMiddleware.authenticateAdmin, metadataController.deleteItemType);

app.get('/api/subjects', metadataController.getSubjects);
app.post('/api/subjects', authMiddleware.authenticateAdmin, metadataController.createSubject);
app.put('/api/subjects/:id', authMiddleware.authenticateAdmin, metadataController.updateSubject);
app.delete('/api/subjects/:id', authMiddleware.authenticateAdmin, metadataController.deleteSubject);

app.get('/api/techniques', metadataController.getTechniques);
app.post('/api/techniques', authMiddleware.authenticateAdmin, metadataController.createTechnique);
app.put('/api/techniques/:id', authMiddleware.authenticateAdmin, metadataController.updateTechnique);
app.delete('/api/techniques/:id', authMiddleware.authenticateAdmin, metadataController.deleteTechnique);

app.get('/api/periods', metadataController.getPeriods);
app.post('/api/periods', authMiddleware.authenticateAdmin, metadataController.createPeriod);

app.get('/api/mediumTypes', metadataController.getMediumTypes);
app.post('/api/mediumTypes', authMiddleware.authenticateAdmin, metadataController.createMediumType);
app.put('/api/mediumTypes/:id', authMiddleware.authenticateAdmin, metadataController.updateMediumType);
app.delete('/api/mediumTypes/:id', authMiddleware.authenticateAdmin, metadataController.deleteMediumType);

// Contributors endpoints
app.get('/api/contributors', contributorsController.getContributors);
app.get('/api/contributors/:id', contributorsController.getContributor);
app.post('/api/contributors', authMiddleware.authenticateAdmin, contributorsController.createContributor);
app.put('/api/contributors/:id', authMiddleware.authenticateAdmin, contributorsController.updateContributor);
app.delete('/api/contributors/:id', authMiddleware.authenticateAdmin, contributorsController.deleteContributor);

// Image upload endpoint
app.post('/api/images/upload', authMiddleware.authenticateAdmin, imagesController.uploadImage);
app.post('/api/images/uploadMultiple', authMiddleware.authenticateAdmin, imagesController.uploadMultipleImages);

// Contact endpoint
app.post('/api/contact', contactController.sendContactEmail);

// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});