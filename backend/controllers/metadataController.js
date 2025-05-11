const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
	DynamoDBDocumentClient,
	ScanCommand,
	PutCommand
} = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const dynamoDbClient = new DynamoDBClient({
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
	}
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

// Generic function to get metadata by type
async function getMetadataByType(type, entityType) {
	try {
		const params = {
			TableName: TABLE_NAME,
			FilterExpression: "begins_with(PK, :pk) AND SK = :sk AND entity_type = :entityType",
			ExpressionAttributeValues: {
				":pk": `${type}#`,
				":sk": "METADATA",
				":entityType": entityType
			}
		};

		const result = await dynamoDB.send(new ScanCommand(params));
		return result.Items;
	} catch (error) {
		console.error(`Error fetching ${type}:`, error);
		throw error;
	}
}

// Generic function to create metadata
async function createMetadata(data) {
	try {
		const params = {
			TableName: TABLE_NAME,
			Item: {
				...data,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new PutCommand(params));
		return data;
	} catch (error) {
		console.error(`Error creating metadata:`, error);
		throw error;
	}
}

// Get all item types
exports.getItemTypes = async (req, res) => {
	try {
		const items = await getMetadataByType('TYPE', 'item_type');
		res.json(items);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch item types' });
	}
};

// Create a new item type
exports.createItemType = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new item type
		const itemTypeData = {
			PK: `TYPE#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'item_type'
		};

		const result = await createMetadata(itemTypeData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create item type' });
	}
};

// Get all categories
exports.getCategories = async (req, res) => {
	try {
		const categories = await getMetadataByType('CATEGORY', 'category');
		res.json(categories);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch categories' });
	}
};

// Create a new category
exports.createCategory = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new category
		const categoryData = {
			PK: `CATEGORY#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'category'
		};

		const result = await createMetadata(categoryData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create category' });
	}
};

// Get all subjects
exports.getSubjects = async (req, res) => {
	try {
		const subjects = await getMetadataByType('SUBJECT', 'subject');
		res.json(subjects);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch subjects' });
	}
};

// Create a new subject
exports.createSubject = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new subject
		const subjectData = {
			PK: `SUBJECT#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'subject'
		};

		const result = await createMetadata(subjectData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create subject' });
	}
};

// Get all techniques
exports.getTechniques = async (req, res) => {
	try {
		const techniques = await getMetadataByType('TECHNIQUE', 'technique');
		res.json(techniques);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch techniques' });
	}
};

// Create a new technique
exports.createTechnique = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new technique
		const techniqueData = {
			PK: `TECHNIQUE#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'technique'
		};

		const result = await createMetadata(techniqueData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create technique' });
	}
};

// Get all periods
exports.getPeriods = async (req, res) => {
	try {
		const periods = await getMetadataByType('PERIOD', 'period');
		res.json(periods);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch periods' });
	}
};

// Create a new period
exports.createPeriod = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new period
		const periodData = {
			PK: `PERIOD#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'period'
		};

		const result = await createMetadata(periodData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create period' });
	}
};

// Get all medium types
exports.getMediumTypes = async (req, res) => {
	try {
		const mediumTypes = await getMetadataByType('MEDIUMTYPE', 'medium_type');
		res.json(mediumTypes);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch medium types' });
	}
};

// Create a new medium type
exports.createMediumType = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new medium type
		const mediumTypeData = {
			PK: `MEDIUMTYPE#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'medium_type'
		};

		const result = await createMetadata(mediumTypeData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create medium type' });
	}
};

// Get all condition types
exports.getConditionTypes = async (req, res) => {
	try {
		const conditionTypes = await getMetadataByType('CONDITIONTYPE', 'condition_type');
		res.json(conditionTypes);
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch condition types' });
	}
};

// Create a new condition type
exports.createConditionType = async (req, res) => {
	try {
		const { name, display_name } = req.body;

		if (!name || !display_name) {
			return res.status(400).json({ error: 'Name and display name are required' });
		}

		// Format the name
		const formattedName = name.toLowerCase().replace(/\s+/g, '_');

		// Create the new condition type
		const conditionTypeData = {
			PK: `CONDITIONTYPE#${formattedName}`,
			name: formattedName,
			display_name: display_name,
			entity_type: 'condition_type'
		};

		const result = await createMetadata(conditionTypeData);
		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: 'Failed to create condition type' });
	}
};