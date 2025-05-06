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

		// For each item, also fetch its categories
		const itemsWithCategories = await Promise.all(
			result.Items.map(async (item) => {
				const categoriesParams = {
					TableName: TABLE_NAME,
					KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
					ExpressionAttributeValues: {
						":pk": item.PK,
						":sk": "CATEGORY#"
					}
				};

				const categoriesResult = await dynamoDB.send(new QueryCommand(categoriesParams));

				// Extract category names from the SK values (format: "CATEGORY#name")
				const categories = categoriesResult.Items.map(cat => {
					const categoryName = cat.SK.replace("CATEGORY#", "");
					return categoryName;
				});

				return {
					...item,
					categories
				};
			})
		);

		res.json(itemsWithCategories);
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

// Create a new item
exports.createItem = async (req, res) => {
	try {
		const { metadata, categories, mediumTypes, contributors, conditionType } = req.body;

		// Assign a new item ID if one isn't provided
		if (!metadata.PK) {
			metadata.PK = `ITEM#${uuidv4()}`;
		}

		// Create a batch of write operations
		const writeRequests = [];

		// Add the main item metadata
		writeRequests.push({
			Put: {
				Item: {
					...metadata,
					SK: "METADATA",
					entity_type: "item",
					insertion_timestamp: new Date().toISOString(),
					// Add GSI indexes
					GSI1PK: `TYPE#${metadata.item_type}`,
					GSI1SK: metadata.PK,
					GSI2PK: `PERIOD#${metadata.period}`,
					GSI2SK: metadata.PK,
					GSI7PK: "ITEMS",
					GSI7SK: `PRICE#${metadata.price.toString().padStart(8, '0')}`
				},
				TableName: TABLE_NAME
			}
		});

		// Add categories
		if (categories && categories.length > 0) {
			categories.forEach(category => {
				writeRequests.push({
					Put: {
						Item: {
							PK: metadata.PK,
							SK: `CATEGORY#${category}`,
							entity_type: "item_category",
							GSI3PK: `CATEGORY#${category}`,
							GSI3SK: metadata.PK
						},
						TableName: TABLE_NAME
					}
				});
			});
		}

		// Add medium types
		if (mediumTypes && mediumTypes.length > 0) {
			mediumTypes.forEach(mediumType => {
				writeRequests.push({
					Put: {
						Item: {
							PK: metadata.PK,
							SK: `MEDIUMTYPE#${mediumType}`,
							entity_type: "item_medium_type",
							GSI4PK: `MEDIUMTYPE#${mediumType}`,
							GSI4SK: metadata.PK
						},
						TableName: TABLE_NAME
					}
				});
			});
		}

		// Add condition type
		if (conditionType) {
			writeRequests.push({
				Put: {
					Item: {
						PK: metadata.PK,
						SK: `CONDITIONTYPE#${conditionType}`,
						entity_type: "item_condition_type",
						GSI5PK: `CONDITIONTYPE#${conditionType}`,
						GSI5SK: metadata.PK
					},
					TableName: TABLE_NAME
				}
			});
		}

		// Add contributors
		if (contributors && contributors.length > 0) {
			contributors.forEach(contributor => {
				writeRequests.push({
					Put: {
						Item: {
							PK: metadata.PK,
							SK: `CONTRIBUTOR#${contributor.contributor_id}`,
							entity_type: "item_contributor",
							positions: contributor.positions,
							GSI6PK: `CONTRIBUTOR#${contributor.contributor_id}`,
							GSI6SK: metadata.PK
						},
						TableName: TABLE_NAME
					}
				});
			});
		}

		// Execute the batch write operations in chunks
		// (DynamoDB limits to 25 items per batch)
		const BATCH_SIZE = 25;
		for (let i = 0; i < writeRequests.length; i += BATCH_SIZE) {
			const chunk = writeRequests.slice(i, i + BATCH_SIZE);

			const batchParams = {
				RequestItems: {
					[TABLE_NAME]: chunk
				}
			};

			await dynamoDB.send(new BatchWriteCommand(batchParams));
		}

		res.status(201).json({
			success: true,
			itemId: metadata.PK,
			message: 'Item created successfully'
		});
	} catch (error) {
		console.error('Error creating item:', error);
		res.status(500).json({ error: 'Failed to create item' });
	}
};

// Update an existing item
exports.updateItem = async (req, res) => {
	try {
		const { id } = req.params;

		// First delete the old item and related records
		await deleteItemFromDb(id);

		// Then create the updated item
		await exports.createItem(req, res);
	} catch (error) {
		console.error(`Error updating item ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update item' });
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
		res.status(500).json({ error: 'Failed to delete item' });
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