const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
	DynamoDBDocumentClient,
	ScanCommand,
	GetCommand,
	BatchWriteCommand,
	QueryCommand,
	DeleteCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

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

// Get all items
exports.getItems = async (req, res) => {
	try {
		// Query for all items with METADATA in the sort key
		const params = {
			TableName: TABLE_NAME,
			FilterExpression: "begins_with(SK, :sk) AND entity_type = :entityType",
			ExpressionAttributeValues: {
				":sk": "METADATA",
				":entityType": "item"
			}
		};

		const result = await dynamoDB.send(new ScanCommand(params));

		res.json(result.Items);
	} catch (error) {
		console.error('Error fetching items:', error);
		res.status(500).json({ error: 'Failed to fetch items' });
	}
};

// Get a single item
exports.getItem = async (req, res) => {
	try {
		const { id } = req.params;
		const { sk = "METADATA" } = req.query;

		const params = {
			TableName: TABLE_NAME,
			Key: {
				PK: id,
				SK: sk
			}
		};

		const result = await dynamoDB.send(new GetCommand(params));

		if (!result.Item) {
			return res.status(404).json({ error: 'Item not found' });
		}

		res.json(result.Item);
	} catch (error) {
		console.error(`Error fetching item ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to fetch item' });
	}
};

// Helper function to sanitize data for DynamoDB
function sanitizeForDynamoDB(obj) {
	if (obj === null || obj === undefined) return null;
	if (typeof obj !== 'object') return obj;

	// Handle arrays
	if (Array.isArray(obj)) {
		return obj.map(item => sanitizeForDynamoDB(item));
	}

	// Handle objects
	const result = {};

	for (const [key, value] of Object.entries(obj)) {
		// Skip undefined values
		if (value === undefined) continue;

		// Convert empty strings to null
		if (value === '') {
			result[key] = null;
			continue;
		}

		// Handle empty objects
		if (value !== null && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
			result[key] = null;
			continue;
		}

		// Recursively sanitize nested objects
		if (value !== null && typeof value === 'object') {
			const sanitized = sanitizeForDynamoDB(value);
			if (sanitized !== undefined) {
				result[key] = sanitized;
			}
			continue;
		}

		// For other values, keep as is
		result[key] = value;
	}

	return result;
}

// Create a new item
exports.createItem = async (req, res) => {
	try {
		const { metadata, categories, mediumTypes, contributors, conditionType, itemId } = req.body;

		// Use the provided itemId or generate a new one
		const actualItemId = itemId || metadata.PK || `ITEM#${uuidv4()}`;

		// Create a batch of write operations with the CORRECT BatchWrite structure
		const writeRequests = [];

		// Sanitize metadata to handle empty strings, objects, etc.
		// Add categories array to main item metadata
		const sanitizedMetadata = sanitizeForDynamoDB({
			...metadata,
			PK: actualItemId,
			SK: "METADATA",
			entity_type: "item",
			insertion_timestamp: new Date().toISOString(),
			GSI1PK: `TYPE#${metadata.item_type}`,
			GSI1SK: actualItemId,
			GSI2PK: `PERIOD#${metadata.period}`,
			GSI2SK: actualItemId,
			GSI7PK: "ITEMS",
			GSI7SK: `PRICE#${metadata.price.toString().padStart(8, '0')}`
		});

		// Add the main item metadata with CORRECT structure (PutRequest instead of Put)
		writeRequests.push({
			PutRequest: {
				Item: sanitizedMetadata
			}
		});

		// Add categories with CORRECT structure
		if (categories && categories.length > 0) {
			categories.forEach(category => {
				writeRequests.push({
					PutRequest: {
						Item: {
							PK: actualItemId,
							SK: `CATEGORY#${category}`,
							entity_type: "item_category",
							GSI3PK: `CATEGORY#${category}`,
							GSI3SK: actualItemId
						}
					}
				});
			});
		}

		// Add medium types with CORRECT structure
		if (mediumTypes && mediumTypes.length > 0) {
			mediumTypes.forEach(mediumType => {
				writeRequests.push({
					PutRequest: {
						Item: {
							PK: actualItemId,
							SK: `MEDIUMTYPE#${mediumType}`,
							entity_type: "item_medium_type",
							GSI4PK: `MEDIUMTYPE#${mediumType}`,
							GSI4SK: actualItemId
						}
					}
				});
			});
		}

		// Add condition type with CORRECT structure
		if (conditionType) {
			writeRequests.push({
				PutRequest: {
					Item: {
						PK: actualItemId,
						SK: `CONDITIONTYPE#${conditionType}`,
						entity_type: "item_condition_type",
						GSI5PK: `CONDITIONTYPE#${conditionType}`,
						GSI5SK: actualItemId
					}
				}
			});
		}

		// Add contributors with CORRECT structure
		if (contributors && contributors.length > 0) {
			contributors.forEach(contributor => {
				// Ensure position is always an array
				const positions = Array.isArray(contributor.position)
					? contributor.position
					: [contributor.position];

				writeRequests.push({
					PutRequest: {
						Item: {
							PK: actualItemId,
							SK: `CONTRIBUTOR#${contributor.contributor_id}`,
							entity_type: "item_contributor",
							positions: positions,
							GSI6PK: `CONTRIBUTOR#${contributor.contributor_id}`,
							GSI6SK: actualItemId
						}
					}
				});
			});
		}

		// Execute the batch write operations in chunks
		// (DynamoDB limits to 25 items per batch)
		const BATCH_SIZE = 25;
		for (let i = 0; i < writeRequests.length; i += BATCH_SIZE) {
			const chunk = writeRequests.slice(i, i + BATCH_SIZE);

			// CORRECT BatchWrite structure
			const batchParams = {
				RequestItems: {
					[TABLE_NAME]: chunk
				}
			};

			try {
				await dynamoDB.send(new BatchWriteCommand(batchParams));
			} catch (batchError) {
				console.error('Error in batch:', JSON.stringify(chunk, null, 2));
				console.error('Batch error:', batchError);
				throw batchError;
			}
		}

		res.status(201).json({
			success: true,
			itemId: actualItemId,
			message: 'Item created successfully'
		});
	} catch (error) {
		console.error('Error creating item:', error);
		res.status(500).json({ error: 'Failed to create item: ' + error.message });
	}
};

// Update an existing item
exports.updateItem = async (req, res) => {
	try {
		const { id } = req.params;

		// First delete the old item and related records
		console.log("deleting old item");
		await deleteItemFromDb(id);

		// Then create the updated item with the request body
		req.body.itemId = id;
		console.log(req.body);
		console.log(req.body.metadata);
		await exports.createItem(req, res);
	} catch (error) {
		console.error(`Error updating item ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update item: ' + error.message });
	}
};

// Delete an item
exports.deleteItem = async (req, res) => {
	try {
		const { id } = req.params;

		await deleteItemFromDb(id);

		res.json({
			success: true,
			message: 'Item deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting item ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete item: ' + error.message });
	}
};

// Generate a new unique item ID
exports.generateId = (req, res) => {
	const itemId = `ITEM#${uuidv4()}`;
	res.json({ itemId });
};

// Helper function to delete an item and all related records
async function deleteItemFromDb(itemId) {
	// First, get all records with the same PK
	const queryParams = {
		TableName: TABLE_NAME,
		KeyConditionExpression: "PK = :pk",
		ExpressionAttributeValues: {
			":pk": itemId
		}
	};

	const queryResult = await dynamoDB.send(new QueryCommand(queryParams));

	// Now delete each record
	const deletePromises = queryResult.Items.map(item => {
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: item.PK,
				SK: item.SK
			}
		};

		return dynamoDB.send(new DeleteCommand(deleteParams));
	});

	await Promise.all(deletePromises);

	return { success: true };
}