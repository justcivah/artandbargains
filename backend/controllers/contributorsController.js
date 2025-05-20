const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
	DynamoDBDocumentClient,
	ScanCommand,
	GetCommand,
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

// Get all contributors
exports.getContributors = async (req, res) => {
	try {
		const params = {
			TableName: TABLE_NAME,
			FilterExpression: "begins_with(PK, :pk) AND SK = :sk AND entity_type = :entityType",
			ExpressionAttributeValues: {
				":pk": "CONTRIBUTOR#",
				":sk": "METADATA",
				":entityType": "contributor"
			}
		};

		const result = await dynamoDB.send(new ScanCommand(params));

		// Add 'name' property for frontend compatibility
		const contributors = result.Items.map(contributor => {
			return {
				...contributor,
				name: contributor.PK.replace("CONTRIBUTOR#", "")
			};
		});

		res.json(contributors);
	} catch (error) {
		console.error('Error fetching contributors:', error);
		res.status(500).json({ error: 'Failed to fetch contributors' });
	}
};

// Create a new contributor
exports.createContributor = async (req, res) => {
	try {
		const contributorData = req.body;

		// Validate required fields
		if (contributorData.contributor_type === 'individual') {
			// At least one name (first or last) is required
			if ((!contributorData.first_name && !contributorData.last_name) || !contributorData.display_name) {
				return res.status(400).json({
					error: 'For individual contributors, at least one name (first or last) and display name are required'
				});
			}
		} else if (contributorData.contributor_type === 'organization') {
			if (!contributorData.name || !contributorData.display_name) {
				return res.status(400).json({
					error: 'For organization contributors, name and display name are required'
				});
			}
		} else {
			return res.status(400).json({
				error: 'Contributor type must be either "individual" or "organization"'
			});
		}

		// Generate contributor ID
		let contributorId;

		if (contributorData.contributor_type === 'individual') {
			if (contributorData.first_name && contributorData.last_name) {
				contributorId = `${contributorData.first_name.toLowerCase()}_${contributorData.last_name.toLowerCase()}`.replace(/\s+/g, '_');
			} else if (contributorData.first_name) {
				contributorId = contributorData.first_name.toLowerCase().replace(/\s+/g, '_');
			} else {
				contributorId = contributorData.last_name.toLowerCase().replace(/\s+/g, '_');
			}
		} else {
			contributorId = contributorData.name.toLowerCase().replace(/\s+/g, '_');
		}

		// Prepare contributor data
		const contributor = {
			PK: `CONTRIBUTOR#${contributorId}`,
			SK: "METADATA",
			entity_type: "contributor",
			...contributorData
		};

		// Ensure name fields are null if not provided (for individual contributors)
		if (contributorData.contributor_type === 'individual') {
			if (!contributorData.first_name) {
				contributor.first_name = null;
			}
			if (!contributorData.last_name) {
				contributor.last_name = null;
			}

			// Convert years to integers if provided
			if (contributorData.birth_year) {
				contributor.birth_year = parseInt(contributorData.birth_year);
			}

			if (contributorData.death_year) {
				contributor.death_year = parseInt(contributorData.death_year);

				// Set is_living to false if death_year is provided
				contributor.is_living = false;
			}
		}

		// Special handling for organizations
		if (contributorData.contributor_type === 'organization') {
			// Convert years to integers if provided
			if (contributorData.founding_year) {
				contributor.founding_year = parseInt(contributorData.founding_year);
			}

			if (contributorData.dissolution_year) {
				contributor.dissolution_year = parseInt(contributorData.dissolution_year);

				// Set is_active to false if dissolution_year is provided
				contributor.is_active = false;
			}
		}

		// Check if contributor already exists
		const existingParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `CONTRIBUTOR#${contributorId}`,
				SK: "METADATA"
			}
		};

		const existingResult = await dynamoDB.send(new GetCommand(existingParams));

		if (existingResult.Item) {
			return res.status(409).json({
				error: 'Contributor already exists',
				contributor: existingResult.Item
			});
		}

		// Save the contributor to DynamoDB
		const params = {
			TableName: TABLE_NAME,
			Item: contributor
		};

		await dynamoDB.send(new PutCommand(params));

		// Add 'name' property for frontend compatibility
		const result = {
			...contributor,
			name: contributorId
		};

		res.status(201).json(result);
	} catch (error) {
		console.error('Error creating contributor:', error);
		res.status(500).json({ error: 'Failed to create contributor' });
	}
};

// Get a single contributor
exports.getContributor = async (req, res) => {
	try {
		const { id } = req.params;

		const params = {
			TableName: TABLE_NAME,
			Key: {
				PK: `CONTRIBUTOR#${id}`,
				SK: "METADATA"
			}
		};

		const result = await dynamoDB.send(new GetCommand(params));

		if (!result.Item) {
			return res.status(404).json({ error: 'Contributor not found' });
		}

		// Add 'name' property for frontend compatibility
		const contributor = {
			...result.Item,
			name: id
		};

		res.json(contributor);
	} catch (error) {
		console.error(`Error fetching contributor ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to fetch contributor' });
	}
};

// Update a contributor
exports.updateContributor = async (req, res) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		// Get the existing contributor
		const getParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `CONTRIBUTOR#${id}`,
				SK: "METADATA"
			}
		};

		const existingResult = await dynamoDB.send(new GetCommand(getParams));

		if (!existingResult.Item) {
			return res.status(404).json({ error: 'Contributor not found' });
		}

		// Get the old display name for reference updating
		const oldDisplayName = existingResult.Item.display_name;
		const newDisplayName = updateData.display_name;
		
		// Check if display name has changed
		const displayNameChanged = oldDisplayName !== newDisplayName;

		// Merge existing data with update data
		const updatedContributor = {
			...existingResult.Item,
			...updateData,
			PK: `CONTRIBUTOR#${id}`,
			SK: "METADATA",
			entity_type: "contributor"
		};

		// Special handling for individuals
		if (updatedContributor.contributor_type === 'individual') {
			// Convert years to integers if provided
			if (updatedContributor.birth_year) {
				updatedContributor.birth_year = parseInt(updatedContributor.birth_year);
			}

			if (updatedContributor.death_year) {
				updatedContributor.death_year = parseInt(updatedContributor.death_year);

				// Set is_living to false if death_year is provided
				updatedContributor.is_living = false;
			}
		}

		// Special handling for organizations
		if (updatedContributor.contributor_type === 'organization') {
			// Convert years to integers if provided
			if (updatedContributor.founding_year) {
				updatedContributor.founding_year = parseInt(updatedContributor.founding_year);
			}

			if (updatedContributor.dissolution_year) {
				updatedContributor.dissolution_year = parseInt(updatedContributor.dissolution_year);

				// Set is_active to false if dissolution_year is provided
				updatedContributor.is_active = false;
			}
		}

		// Save the updated contributor
		const params = {
			TableName: TABLE_NAME,
			Item: updatedContributor
		};

		await dynamoDB.send(new PutCommand(params));

		// Initialize affectedItemsCount to track how many items are affected
		let affectedItemsCount = 0;

		// If display name changed, update all items that reference this contributor
		if (displayNameChanged) {
			try {
				// Find all items that reference this contributor using GSI4 (ContributorArticleIndex)
				const queryParams = {
					TableName: TABLE_NAME,
					IndexName: 'ContributorArticleIndex',
					KeyConditionExpression: "GSI4PK = :contributorKey",
					ExpressionAttributeValues: {
						":contributorKey": `CONTRIBUTOR#${id}`
					}
				};

				const affectedItems = await dynamoDB.send(new QueryCommand(queryParams));

				if (affectedItems.Items && affectedItems.Items.length > 0) {
					// Get unique item IDs from the results
					const itemIDs = [...new Set(affectedItems.Items.map(item => item.PK))];
					
					// Track the number of items affected
					affectedItemsCount = itemIDs.length;

					// Update each affected item
					for (const itemID of itemIDs) {
						// Get the item metadata
						const getItemParams = {
							TableName: TABLE_NAME,
							Key: {
								PK: itemID,
								SK: "METADATA"
							}
						};

						const itemResult = await dynamoDB.send(new GetCommand(getItemParams));
						
						if (itemResult.Item) {
							const item = itemResult.Item;
							let updated = false;

							// Check if this contributor is the primary contributor
							if (item.primary_contributor_display === oldDisplayName) {
								// Update primary contributor display name
								item.primary_contributor_display = newDisplayName;
								item.primary_contributor_display_lower = newDisplayName.toLowerCase();
								updated = true;
							}

							// Update the item in DynamoDB if changes were made
							if (updated) {
								const updateItemParams = {
									TableName: TABLE_NAME,
									Item: item
								};

								await dynamoDB.send(new PutCommand(updateItemParams));
							}
						}
					}
				}
			} catch (referenceError) {
				console.error(`Error updating references for contributor ${id}:`, referenceError);
				// Continue with the response even if reference update fails
			}
		}

		// Add 'name' property for frontend compatibility
		const result = {
			...updatedContributor,
			name: id
		};

		res.json({
			success: true,
			contributor: result,
			affectedItems: affectedItemsCount
		});
	} catch (error) {
		console.error(`Error updating contributor ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to update contributor: ' + error.message });
	}
};

// Delete a contributor
exports.deleteContributor = async (req, res) => {
	try {
		const { id } = req.params;

		// First check if the contributor exists
		const getParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `CONTRIBUTOR#${id}`,
				SK: "METADATA"
			}
		};

		const existingResult = await dynamoDB.send(new GetCommand(getParams));

		if (!existingResult.Item) {
			return res.status(404).json({ error: 'Contributor not found' });
		}

		// Next, check if the contributor is used by any items
		const queryParams = {
			TableName: TABLE_NAME,
			IndexName: 'ContributorArticleIndex', // Using GSI4
			KeyConditionExpression: "GSI4PK = :pk",
			ExpressionAttributeValues: {
				":pk": `CONTRIBUTOR#${id}`
			}
		};

		const queryResult = await dynamoDB.send(new QueryCommand(queryParams));

		if (queryResult.Items && queryResult.Items.length > 0) {
			return res.status(409).json({
				error: 'Cannot delete contributor because it is used by one or more items',
				itemCount: queryResult.Items.length
			});
		}

		// Delete the contributor
		const deleteParams = {
			TableName: TABLE_NAME,
			Key: {
				PK: `CONTRIBUTOR#${id}`,
				SK: "METADATA"
			}
		};

		await dynamoDB.send(new DeleteCommand(deleteParams));

		res.json({
			success: true,
			message: 'Contributor deleted successfully'
		});
	} catch (error) {
		console.error(`Error deleting contributor ${req.params.id}:`, error);
		res.status(500).json({ error: 'Failed to delete contributor' });
	}
};