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

// Search for items with filtering, sorting, and pagination
exports.searchItems = async (req, res) => {
	try {
		// Extract query parameters
		const {
			search,
			types,
			subjects,
			techniques,
			contributors,
			periods,
			mediumTypes,
			minPrice,
			maxPrice,
			sort,
			page = 1,
			limit = 24
		} = req.query;

		// Start with a base scan operation for all items
		let params = {
			TableName: TABLE_NAME,
			FilterExpression: "SK = :sk AND entity_type = :entityType",
			ExpressionAttributeValues: {
				":sk": "METADATA",
				":entityType": "item"
			}
		};

		// Add search term filter if provided
		if (search) {
			const searchTerm = search.toLowerCase();
			params.FilterExpression += " AND (contains(title_lower, :search) OR contains(description_lower, :search) OR contains(primary_contributor_display_lower, :search))";
			params.ExpressionAttributeValues[":search"] = searchTerm;
		}

		// Add type filter
		if (types && types.length) {
			const typeArray = Array.isArray(types) ? types : [types];
			const typeValues = typeArray.map((t, i) => `:type${i}`);

			params.FilterExpression += ` AND item_type IN (${typeValues.join(', ')})`;

			typeArray.forEach((type, i) => {
				params.ExpressionAttributeValues[`:type${i}`] = type;
			});
		}

		// Add price range filters
		if (minPrice) {
			params.FilterExpression += " AND price >= :minPrice";
			params.ExpressionAttributeValues[":minPrice"] = Number(minPrice);
		}

		if (maxPrice) {
			params.FilterExpression += " AND price <= :maxPrice";
			params.ExpressionAttributeValues[":maxPrice"] = Number(maxPrice);
		}

		// Add period filter
		if (periods && periods.length) {
			const periodArray = Array.isArray(periods) ? periods : [periods];
			const periodValues = periodArray.map((p, i) => `:period${i}`);

			params.FilterExpression += ` AND period IN (${periodValues.join(', ')})`;

			periodArray.forEach((period, i) => {
				params.ExpressionAttributeValues[`:period${i}`] = period;
			});
		}

		// Execute the scan
		const result = await dynamoDB.send(new ScanCommand(params));

		// Post-process to further filter by subjects, techniques, contributors, and mediumTypes
		// as these require multiple queries or more complex filtering
		let filteredItems = result.Items;

		// Apply additional client-side filtering for subjects (if needed)
		if (subjects && subjects.length) {
			const subjectArray = Array.isArray(subjects) ? subjects : [subjects];

			// Need to handle this via a separate query for each subject since 
			// they're in separate records linked by GSI3
			const subjectPromises = subjectArray.map(subject => {
				const subjectParams = {
					TableName: TABLE_NAME,
					IndexName: 'SubjectArticleIndex',
					KeyConditionExpression: "GSI7PK = :subject",
					ExpressionAttributeValues: {
						":subject": `SUBJECT#${subject}`
					}
				};
				return dynamoDB.send(new QueryCommand(subjectParams));
			});

			const subjectResults = await Promise.all(subjectPromises);
			const itemIdsBySubject = new Set();

			subjectResults.forEach(result => {
				result.Items.forEach(item => {
					itemIdsBySubject.add(item.PK);
				});
			});

			filteredItems = filteredItems.filter(item => itemIdsBySubject.has(item.PK));
		}

		// Apply additional client-side filtering for techniques (if needed)
		if (techniques && techniques.length) {
			const techniqueArray = Array.isArray(techniques) ? techniques : [techniques];

			const techniquePromises = techniqueArray.map(technique => {
				const techniqueParams = {
					TableName: TABLE_NAME,
					IndexName: 'TechniqueArticleIndex',
					KeyConditionExpression: "GSI6PK = :technique",
					ExpressionAttributeValues: {
						":technique": `TECHNIQUE#${technique}`
					}
				};
				return dynamoDB.send(new QueryCommand(techniqueParams));
			});

			const techniqueResults = await Promise.all(techniquePromises);
			const itemIdsByTechnique = new Set();

			techniqueResults.forEach(result => {
				result.Items.forEach(item => {
					itemIdsByTechnique.add(item.PK);
				});
			});

			filteredItems = filteredItems.filter(item => itemIdsByTechnique.has(item.PK));
		}

		// Apply additional client-side filtering for contributors (if needed)
		if (contributors && contributors.length) {
			const contributorArray = Array.isArray(contributors) ? contributors : [contributors];

			const contributorPromises = contributorArray.map(contributor => {
				const contributorParams = {
					TableName: TABLE_NAME,
					IndexName: 'ContributorArticleIndex',
					KeyConditionExpression: "GSI4PK = :contributor",
					ExpressionAttributeValues: {
						":contributor": `CONTRIBUTOR#${contributor}`
					}
				};
				return dynamoDB.send(new QueryCommand(contributorParams));
			});

			const contributorResults = await Promise.all(contributorPromises);
			const itemIdsByContributor = new Set();

			contributorResults.forEach(result => {
				result.Items.forEach(item => {
					itemIdsByContributor.add(item.PK);
				});
			});

			filteredItems = filteredItems.filter(item => itemIdsByContributor.has(item.PK));
		}

		// Apply additional client-side filtering for medium types (if needed)
		if (mediumTypes && mediumTypes.length) {
			const mediumTypeArray = Array.isArray(mediumTypes) ? mediumTypes : [mediumTypes];

			const mediumTypePromises = mediumTypeArray.map(mediumType => {
				const mediumTypeParams = {
					TableName: TABLE_NAME,
					IndexName: 'MediumTypeArticleIndex',
					KeyConditionExpression: "GSI3PK = :mediumType",
					ExpressionAttributeValues: {
						":mediumType": `MEDIUMTYPE#${mediumType}`
					}
				};
				return dynamoDB.send(new QueryCommand(mediumTypeParams));
			});

			const mediumTypeResults = await Promise.all(mediumTypePromises);
			const itemIdsByMediumType = new Set();

			mediumTypeResults.forEach(result => {
				result.Items.forEach(item => {
					itemIdsByMediumType.add(item.PK);
				});
			});

			filteredItems = filteredItems.filter(item => itemIdsByMediumType.has(item.PK));
		}

		// Apply sorting
		if (sort) {
			switch (sort) {
				case 'date_desc':
					filteredItems.sort((a, b) => new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp));
					break;
				case 'date_asc':
					filteredItems.sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));
					break;
				case 'price_asc':
					filteredItems.sort((a, b) => a.price - b.price);
					break;
				case 'price_desc':
					filteredItems.sort((a, b) => b.price - a.price);
					break;
				case 'alpha_asc':
					filteredItems.sort((a, b) => a.title.localeCompare(b.title));
					break;
				case 'alpha_desc':
					filteredItems.sort((a, b) => b.title.localeCompare(a.title));
					break;
				default:
					// Default sort by newest
					filteredItems.sort((a, b) => new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp));
			}
		} else {
			// Default sort by newest
			filteredItems.sort((a, b) => new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp));
		}

		// Apply pagination
		const startIndex = (page - 1) * limit;
		const endIndex = page * limit;

		const paginatedItems = filteredItems.slice(startIndex, endIndex);

		// Prepare pagination metadata
		const totalPages = Math.ceil(filteredItems.length / limit);

		res.json({
			items: paginatedItems,
			pagination: {
				total: filteredItems.length,
				page: parseInt(page),
				limit: parseInt(limit),
				totalPages
			}
		});
	} catch (error) {
		console.error('Error searching items:', error);
		res.status(500).json({ error: 'Failed to search items: ' + error.message });
	}
};

// Get recent items
exports.getRecentItems = async (req, res) => {
	try {
		const { limit = 10 } = req.query;
		const parsedLimit = parseInt(limit);

		// Query for all items with METADATA in the sort key
		const params = {
			TableName: TABLE_NAME,
			FilterExpression: "SK = :sk AND entity_type = :entityType",
			ExpressionAttributeValues: {
				":sk": "METADATA",
				":entityType": "item"
			}
		};

		const result = await dynamoDB.send(new ScanCommand(params));

		// Sort by insertion_timestamp in descending order (newest first)
		const sortedItems = result.Items.sort((a, b) => {
			return new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp);
		});

		// Limit the results
		const limitedItems = sortedItems.slice(0, parsedLimit);

		res.json(limitedItems);
	} catch (error) {
		console.error('Error fetching recent items:', error);
		res.status(500).json({ error: 'Failed to fetch recent items' });
	}
};

// Get a single item
exports.getItem = async (req, res) => {
	try {
		const id = "ITEM#" + req.params.id;
		const sk = "METADATA";

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
		const { metadata, subject, technique, mediumTypes, contributors, itemId } = req.body;

		// Use the provided itemId or generate a new one
		const actualItemId = itemId || metadata.PK || `ITEM#${uuidv4()}`;

		// Create a batch of write operations
		const writeRequests = [];

		// Sanitize metadata to handle empty strings, objects, etc.
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
			// Note: GSI5 is for ItemsByPriceIndex based on your schema
			GSI5PK: "ITEMS",
			GSI5SK: `PRICE#${metadata.price.toString().padStart(8, '0')}`
		});

		// Add the main item metadata
		writeRequests.push({
			PutRequest: {
				Item: sanitizedMetadata
			}
		});

		// Add subject - corrected to use GSI7 (SubjectArticleIndex)
		if (subject) {
			writeRequests.push({
				PutRequest: {
					Item: {
						PK: actualItemId,
						SK: `SUBJECT#${subject}`,
						entity_type: "item_subject",
						GSI7PK: `SUBJECT#${subject}`,  // Changed from GSI3PK
						GSI7SK: actualItemId           // Changed from GSI3SK
					}
				}
			});
		}

		// Add technique - corrected to use GSI6 (TechniqueArticleIndex)
		if (technique) {
			writeRequests.push({
				PutRequest: {
					Item: {
						PK: actualItemId,
						SK: `TECHNIQUE#${technique}`,
						entity_type: "item_technique",
						GSI6PK: `TECHNIQUE#${technique}`,  // Changed from GSI4PK
						GSI6SK: actualItemId              // Changed from GSI4SK
					}
				}
			});
		}

		// Add medium types - corrected to use GSI3 (MediumTypeArticleIndex)
		if (mediumTypes && mediumTypes.length > 0) {
			mediumTypes.forEach(mediumType => {
				writeRequests.push({
					PutRequest: {
						Item: {
							PK: actualItemId,
							SK: `MEDIUMTYPE#${mediumType}`,
							entity_type: "item_medium_type",
							GSI3PK: `MEDIUMTYPE#${mediumType}`,  // Changed from GSI5PK
							GSI3SK: actualItemId                 // Changed from GSI5SK
						}
					}
				});
			});
		}

		// Add contributors - corrected to use GSI4 (ContributorArticleIndex)
		if (contributors && contributors.length > 0) {
			contributors.forEach(contributor => {
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
							GSI4PK: `CONTRIBUTOR#${contributor.contributor_id}`,  // Changed from GSI7PK
							GSI4SK: actualItemId                                 // Changed from GSI7SK
						}
					}
				});
			});
		}

		// Execute the batch write operations in chunks
		const BATCH_SIZE = 25;
		for (let i = 0; i < writeRequests.length; i += BATCH_SIZE) {
			const chunk = writeRequests.slice(i, i + BATCH_SIZE);

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
		await deleteItemFromDb(id);

		// Then create the updated item with the request body
		req.body.itemId = id;
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

// Helper function to sort items
function sortItems(items, sortBy) {
	switch (sortBy) {
		case 'newest':
			return items.sort((a, b) => new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp));

		case 'oldest':
			return items.sort((a, b) => new Date(a.insertion_timestamp) - new Date(b.insertion_timestamp));

		case 'price_asc':
			return items.sort((a, b) => a.price - b.price);

		case 'price_desc':
			return items.sort((a, b) => b.price - a.price);

		case 'title_asc':
			return items.sort((a, b) => a.title.localeCompare(b.title));

		case 'title_desc':
			return items.sort((a, b) => b.title.localeCompare(a.title));

		default:
			return items;
	}
}