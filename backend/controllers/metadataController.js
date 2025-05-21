const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
	DynamoDBDocumentClient,
	ScanCommand,
	PutCommand,
	DeleteCommand,
	QueryCommand
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

// Generic function to check if a metadata entity is in use by any items
async function isMetadataInUse(type, name) {
	try {
		let indexName, keyConditions;

		switch (type) {
			case 'TYPE':
				indexName = 'TypeArticleIndex';
				keyConditions = {
					KeyConditionExpression: "GSI1PK = :typePK",
					ExpressionAttributeValues: {
						":typePK": `TYPE#${name}`
					}
				};
				break;
			case 'SUBJECT':
				indexName = 'SubjectArticleIndex';
				keyConditions = {
					KeyConditionExpression: "GSI7PK = :subjPK",
					ExpressionAttributeValues: {
						":subjPK": `SUBJECT#${name}`
					}
				};
				break;
			case 'TECHNIQUE':
				indexName = 'TechniqueArticleIndex';
				keyConditions = {
					KeyConditionExpression: "GSI6PK = :techPK",
					ExpressionAttributeValues: {
						":techPK": `TECHNIQUE#${name}`
					}
				};
				break;
			case 'MEDIUMTYPE':
				indexName = 'MediumTypeArticleIndex';
				keyConditions = {
					KeyConditionExpression: "GSI3PK = :mediumPK",
					ExpressionAttributeValues: {
						":mediumPK": `MEDIUMTYPE#${name}`
					}
				};
				break;
			default:
				throw new Error(`Unsupported metadata type: ${type}`);
		}

		const params = {
			TableName: TABLE_NAME,
			IndexName: indexName,
			...keyConditions
		};

		const result = await dynamoDB.send(new QueryCommand(params));
		return result.Items.length > 0;
	} catch (error) {
		console.error(`Error checking if ${type} is in use:`, error);
		throw error;
	}
}

// Generic function to update a metadata entity and all references
async function updateMetadataAndReferences(type, name, data) {
	try {
		// First update the metadata entity itself
		const metadataParams = {
			TableName: TABLE_NAME,
			Item: {
				...data,
				PK: `${type}#${name}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new PutCommand(metadataParams));

		// No need to update references for display_name changes since only the
		// metadata entity contains the display_name attribute.
		// items only reference the system name, not the display_name

		// But if there was a need to update references, we'd have code similar
		// to the contributor display name update logic

		// Just return success with 0 affected items since we don't need to update references
		return { success: true, affectedItems: 0 };
	} catch (error) {
		console.error(`Error updating ${type} metadata:`, error);
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

// Update an item type
exports.updateItemType = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		if (!updateData || !updateData.display_name) {
			return res.status(400).json({ error: 'Display name is required' });
		}

		// Update the item type and any references
		const result = await updateMetadataAndReferences('TYPE', id, updateData);

		res.json(result);
	} catch (error) {
		console.error(`Error updating item type ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update item type' });
	}
};

// Delete an item type
exports.deleteItemType = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if this item type is in use
		const isInUse = await isMetadataInUse('TYPE', id);

		if (isInUse) {
			return res.status(409).json({
				error: 'Cannot delete this item type because it is used by one or more items'
			});
		}

		// Delete the item type
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `TYPE#${id}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new DeleteCommand(deleteParams));

		res.json({
			success: true,
			message: 'Item type deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting item type ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete item type' });
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

// Update a subject
exports.updateSubject = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		if (!updateData || !updateData.display_name) {
			return res.status(400).json({ error: 'Display name is required' });
		}

		// Update the subject and any references
		const result = await updateMetadataAndReferences('SUBJECT', id, updateData);

		res.json(result);
	} catch (error) {
		console.error(`Error updating subject ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update subject' });
	}
};

// Delete a subject
exports.deleteSubject = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if this subject is in use
		const isInUse = await isMetadataInUse('SUBJECT', id);

		if (isInUse) {
			return res.status(409).json({
				error: 'Cannot delete this subject because it is used by one or more items'
			});
		}

		// Delete the subject
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `SUBJECT#${id}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new DeleteCommand(deleteParams));

		res.json({
			success: true,
			message: 'Subject deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting subject ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete subject' });
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

// Update a technique
exports.updateTechnique = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		if (!updateData || !updateData.display_name) {
			return res.status(400).json({ error: 'Display name is required' });
		}

		// Update the technique and any references
		const result = await updateMetadataAndReferences('TECHNIQUE', id, updateData);

		res.json(result);
	} catch (error) {
		console.error(`Error updating technique ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update technique' });
	}
};

// Delete a technique
exports.deleteTechnique = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if this technique is in use
		const isInUse = await isMetadataInUse('TECHNIQUE', id);

		if (isInUse) {
			return res.status(409).json({
				error: 'Cannot delete this technique because it is used by one or more items'
			});
		}

		// Delete the technique
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `TECHNIQUE#${id}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new DeleteCommand(deleteParams));

		res.json({
			success: true,
			message: 'Technique deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting technique ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete technique' });
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

// Update a medium type
exports.updateMediumType = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		if (!updateData || !updateData.display_name) {
			return res.status(400).json({ error: 'Display name is required' });
		}

		// Update the medium type and any references
		const result = await updateMetadataAndReferences('MEDIUMTYPE', id, updateData);

		res.json(result);
	} catch (error) {
		console.error(`Error updating medium type ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update medium type' });
	}
};

// Delete a medium type
exports.deleteMediumType = async (req, res) => {
	try {
		const { id } = req.params;

		// Check if this medium type is in use
		const isInUse = await isMetadataInUse('MEDIUMTYPE', id);

		if (isInUse) {
			return res.status(409).json({
				error: 'Cannot delete this medium type because it is used by one or more items'
			});
		}

		// Delete the medium type
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `MEDIUMTYPE#${id}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new DeleteCommand(deleteParams));

		res.json({
			success: true,
			message: 'Medium type deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting medium type ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete medium type' });
	}
};