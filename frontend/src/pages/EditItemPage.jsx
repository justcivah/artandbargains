import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	fetchItem, updateItem, fetchItemTypes, fetchCategories, fetchPeriods,
	fetchMediumTypes, fetchConditionTypes, fetchContributors
} from '../api/itemsApi';
import { uploadMultipleImages } from '../api/imagesApi';
import TypeSelector from '../components/add-item-steps/TypeSelector';
import CategorySelector from '../components/add-item-steps/CategorySelector';
import ItemDetailsForm from '../components/add-item-steps/ItemDetailsForm';
import ContributorsForm from '../components/add-item-steps/ContributorsForm';
import PeriodSelector from '../components/add-item-steps/PeriodSelector';
import InventoryForm from '../components/add-item-steps/InventoryForm';
import MediumTypeSelector from '../components/add-item-steps/MediumTypeSelector';
import DimensionsForm from '../components/add-item-steps/DimensionsForm';
import ConditionTypeSelector from '../components/add-item-steps/ConditionTypeSelector';
import ImageUploader from '../components/add-item-steps/ImageUploader';
import '../styles/AddItemPage.css';
import '../styles/EditItemPage.css';

const EditItemPage = () => {
	const { itemId } = useParams();
	const navigate = useNavigate();

	// Track expanded sections
	const [expandedSections, setExpandedSections] = useState({});

	// Metadata states
	const [itemTypes, setItemTypes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [conditionTypes, setConditionTypes] = useState([]);
	const [contributorsList, setContributorsList] = useState([]);

	// Add state to track image order
	const [imagesOrder, setImagesOrder] = useState([]);

	// Form states
	const [formData, setFormData] = useState({
		itemType: '',
		categories: [],
		title: '',
		dateInfo: {
			type: 'exact',
			yearExact: '',
			yearRangeStart: '',
			yearRangeEnd: '',
			periodText: '',
			circa: false
		},
		contributors: [],
		primaryContributor: null,
		period: '',
		inventoryQuantity: 1,
		mediumTypes: [],
		mediumDescription: '',
		dimensions: {
			height: '',
			width: '',
			depth: '',
			diameter: ''
		},
		dimensionsUnit: 'cm',
		conditionType: '',
		conditionDescription: '',
		price: '',
		description: '',
		images: [],
		primaryImageIndex: 0,
		existingImages: []
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load item data and metadata
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				// Fetch all metadata in parallel
				const [item, types, cats, pers, mediums, conditions, contributors] = await Promise.all([
					fetchItem(itemId.replace("ITEM#", "")),
					fetchItemTypes(),
					fetchCategories(),
					fetchPeriods(),
					fetchMediumTypes(),
					fetchConditionTypes(),
					fetchContributors()
				]);

				setItemTypes(types);
				setCategories(cats);
				setPeriods(pers);
				setMediumTypes(mediums);
				setConditionTypes(conditions);
				setContributorsList(contributors);

				// Set form data from item
				const dateInfo = {};
				if (item.date_info.year_exact !== null) {
					dateInfo.type = 'exact';
					dateInfo.yearExact = item.date_info.year_exact;
				} else if (item.date_info.year_range_start !== null && item.date_info.year_range_end !== null) {
					dateInfo.type = 'range';
					dateInfo.yearRangeStart = item.date_info.year_range_start;
					dateInfo.yearRangeEnd = item.date_info.year_range_end;
				} else {
					dateInfo.type = 'period';
					dateInfo.periodText = item.date_info.period_text;
				}
				dateInfo.circa = item.date_info.circa || false;

				// Format contributors
				const formattedContributors = item.contributors.map(contrib => {
					const contributor = contributors.find(c => c.name === contrib.contributor_id);
					return {
						position: contrib.position,
						contributor: contributor
					};
				});

				// Process dimensions from item data
				let dimensionsData = {};
				let dimensionsUnit = 'cm';

				if (item.dimensions) {
					// Extract the unit from dimensions, default to 'cm' if not found
					dimensionsUnit = item.dimensions.unit || 'cm';

					// Process each dimension part (excluding unit)
					Object.keys(item.dimensions).forEach(key => {
						if (key !== 'unit') {
							dimensionsData[key] = {
								height: item.dimensions[key].height || '',
								width: item.dimensions[key].width || '',
								depth: item.dimensions[key].depth || '',
								diameter: item.dimensions[key].diameter || ''
							};
						}
					});
				}

				setFormData({
					itemType: item.item_type,
					categories: item.categories,
					title: item.title,
					dateInfo,
					contributors: formattedContributors,
					primaryContributor: item.primary_contributor_display,
					period: item.period,
					inventoryQuantity: item.inventory_quantity,
					mediumTypes: item.medium.types,
					mediumDescription: item.medium.description,
					dimensions: dimensionsData,
					dimensionsUnit: dimensionsUnit,
					conditionType: item.condition.status,
					conditionDescription: item.condition.description,
					price: item.price,
					description: item.description,
					images: [], // New images to upload
					primaryImageIndex: 0,
					existingImages: item.images || []
				});

				// Initialize the image order with existing images
				if (item.images && item.images.length > 0) {
					setImagesOrder(item.images.map(img => ({
						type: 'existing',
						url: img.url
					})));
				}

				// Auto-expand first section
				setExpandedSections({ "item-type": true });

				setLoading(false);
			} catch (err) {
				setError('Error loading item data: ' + err.message);
				console.error('Error loading item data:', err);
				setLoading(false);
			}
		};

		loadData();
	}, [itemId]);

	// Update form data
	const updateFormData = (field, value) => {
		setFormData(prevData => ({
			...prevData,
			[field]: value
		}));
	};

	// Toggle a section's expanded state
	const toggleSection = (sectionId) => {
		setExpandedSections(prev => ({
			...prev,
			[sectionId]: !prev[sectionId]
		}));
	};

	// Handle form submission
	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);

			// Upload new images first to get their URLs
			let newUploadedImages = [];
			if (formData.images.length > 0) {
				const uploadResults = await uploadMultipleImages(formData.images);
				newUploadedImages = uploadResults.map(result => ({
					url: result.fileUrl,
					is_primary: false // Will be set correctly later
				}));
			}

			// Create final image array based on the order from the order state
			let finalImageUrls = [];

			// Use the imagesOrder to arrange images in the correct order
			imagesOrder.forEach((orderItem, index) => {
				if (orderItem.type === 'existing') {
					// Find existing image by URL
					const existingImage = formData.existingImages.find(img => img.url === orderItem.url);
					if (existingImage) {
						// Add to final array, first image will be primary
						finalImageUrls.push({
							...existingImage,
							is_primary: index === 0
						});
					}
				} else if (orderItem.type === 'new') {
					// New image - use index to find in newUploadedImages
					const imageIndex = orderItem.index;
					if (imageIndex >= 0 && imageIndex < newUploadedImages.length) {
						finalImageUrls.push({
							...newUploadedImages[imageIndex],
							is_primary: index === 0
						});
					}
				}
			});

			// Prepare date information - FIXED: include type field
			const dateInfo = {
				type: formData.dateInfo.type, // Adding the type field
				circa: formData.dateInfo.circa
			};

			if (formData.dateInfo.type === 'exact') {
				dateInfo.year_exact = parseInt(formData.dateInfo.yearExact) || null;
				dateInfo.year_range_start = null;
				dateInfo.year_range_end = null;
				dateInfo.period_text = null;
			} else if (formData.dateInfo.type === 'range') {
				dateInfo.year_exact = null;
				dateInfo.year_range_start = parseInt(formData.dateInfo.yearRangeStart) || null;
				dateInfo.year_range_end = parseInt(formData.dateInfo.yearRangeEnd) || null;
				dateInfo.period_text = null;
			} else {
				dateInfo.year_exact = null;
				dateInfo.year_range_start = null;
				dateInfo.year_range_end = null;
				dateInfo.period_text = formData.dateInfo.periodText;
			}

			// Prepare dimensions with unit included at top level
			const dimensionsWithUnit = {
				...formData.dimensions,
				unit: formData.dimensionsUnit
			};

			// Format the dimensions to remove empty values
			const cleanedDimensions = {};
			Object.keys(dimensionsWithUnit).forEach(key => {
				if (key === 'unit') {
					cleanedDimensions.unit = dimensionsWithUnit.unit;
				} else {
					// Only include parts that have at least one dimension value
					const part = dimensionsWithUnit[key];
					const hasValue = part.height || part.width || part.depth || part.diameter;

					if (hasValue) {
						cleanedDimensions[key] = {};

						// Only include non-empty dimension values
						if (part.height) cleanedDimensions[key].height = parseFloat(part.height);
						if (part.width) cleanedDimensions[key].width = parseFloat(part.width);
						if (part.depth) cleanedDimensions[key].depth = parseFloat(part.depth);
						if (part.diameter) cleanedDimensions[key].diameter = parseFloat(part.diameter);
					}
				}
			});

			// Format contributors
			const contributors = formData.contributors.map(contrib => ({
				position: contrib.position,
				contributor_id: contrib.contributor.name
			}));

			// Prepare the item data for DynamoDB
			const itemData = {
				metadata: {
					PK: itemId,
					title: formData.title,
					title_lower: formData.title.toLowerCase(),
					categories: formData.categories,
					date_info: dateInfo,
					contributors: contributors,
					primary_contributor_display: formData.primaryContributor,
					primary_contributor_display_lower: formData.primaryContributor.toLowerCase(),
					description: formData.description,
					description_lower: formData.description.toLowerCase(),
					price: parseFloat(formData.price),
					item_type: formData.itemType,
					period: formData.period,
					inventory_quantity: parseInt(formData.inventoryQuantity),
					medium: {
						types: formData.mediumTypes,
						description: formData.mediumDescription
					},
					dimensions: cleanedDimensions,
					condition: {
						status: formData.conditionType,
						description: formData.conditionDescription
					},
					images: finalImageUrls
				},
				categories: formData.categories,
				mediumTypes: formData.mediumTypes,
				contributors: contributors,
				conditionType: formData.conditionType
			};

			// Update the item in DynamoDB
			await updateItem(itemData);

			// Navigate back to admin page
			navigate('/admin');
		} catch (err) {
			setError('Error updating item: ' + err.message);
			console.error('Error updating item:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Check if form is valid before submission
	const isFormValid = () => {
		// Validate all required fields
		const hasValidItemType = !!formData.itemType;
		const hasValidCategories = formData.categories.length > 0;
		const hasValidBasicInfo = !!formData.title && !!formData.description && !!formData.price;

		let hasValidDateInfo = false;
		if (formData.dateInfo.type === 'exact') {
			hasValidDateInfo = !!formData.dateInfo.yearExact;
		} else if (formData.dateInfo.type === 'range') {
			hasValidDateInfo = !!formData.dateInfo.yearRangeStart && !!formData.dateInfo.yearRangeEnd;
		} else {
			hasValidDateInfo = !!formData.dateInfo.periodText;
		}

		const hasValidContributors = formData.contributors.length > 0 && !!formData.primaryContributor;
		const hasValidPeriod = !!formData.period;
		const hasValidInventory = formData.inventoryQuantity >= 0;
		const hasValidMedium = formData.mediumTypes.length > 0;

		const dims = formData.dimensions;
		const hasValidDimensions = !!dims.height || !!dims.width || !!dims.depth || !!dims.diameter;

		const hasValidCondition = !!formData.conditionType;
		const hasValidImages = formData.existingImages.length > 0 || formData.images.length > 0;

		return (
			hasValidItemType &&
			hasValidCategories &&
			hasValidBasicInfo &&
			hasValidDateInfo &&
			hasValidContributors &&
			hasValidPeriod &&
			hasValidInventory &&
			hasValidMedium &&
			hasValidDimensions &&
			hasValidCondition &&
			hasValidImages
		);
	};

	// Check if specific section is valid
	const isSectionValid = (sectionId) => {
		switch (sectionId) {
			case "item-type":
				return !!formData.itemType;
			case "category":
				return formData.categories.length > 0;
			case "item-details":
				return !!formData.title && !!formData.description && !!formData.price;
			case "date-info":
				if (formData.dateInfo.type === 'exact') {
					return !!formData.dateInfo.yearExact;
				} else if (formData.dateInfo.type === 'range') {
					return !!formData.dateInfo.yearRangeStart && !!formData.dateInfo.yearRangeEnd;
				} else {
					return !!formData.dateInfo.periodText;
				}
			case "contributors":
				return formData.contributors.length > 0 && !!formData.primaryContributor;
			case "period":
				return !!formData.period;
			case "inventory":
				return formData.inventoryQuantity >= 0;
			case "medium":
				return formData.mediumTypes.length > 0;
			case "dimensions":
				const dimensionParts = Object.keys(formData.dimensions).filter(key => key !== 'unit');
				return dimensionParts.some(part => {
					const dims = formData.dimensions[part];
					return dims.height || dims.width || dims.depth || dims.diameter;
				});
			case "condition":
				return !!formData.conditionType;
			case "images":
				return formData.existingImages.length > 0 || formData.images.length > 0;
			default:
				return false;
		}
	};

	if (loading) {
		return <div className="add-item-loading">Loading item data...</div>;
	}

	if (error) {
		return <div className="add-item-error">{error}</div>;
	}

	// Define the sections for the accordion
	const sections = [
		{
			id: "item-type",
			title: "Item Type",
			content: (
				<TypeSelector
					itemTypes={itemTypes}
					selectedType={formData.itemType}
					onChange={(type) => updateFormData('itemType', type)}
					setItemTypes={setItemTypes}
				/>
			)
		},
		{
			id: "category",
			title: "Categories",
			content: (
				<CategorySelector
					categories={categories}
					selectedCategories={formData.categories}
					onChange={(cats) => updateFormData('categories', cats)}
					setCategories={setCategories}
				/>
			)
		},
		{
			id: "item-details",
			title: "Item Details",
			content: (
				<ItemDetailsForm
					title={formData.title}
					description={formData.description}
					price={formData.price}
					onTitleChange={(title) => updateFormData('title', title)}
					onDescriptionChange={(desc) => updateFormData('description', desc)}
					onPriceChange={(price) => updateFormData('price', price)}
				/>
			)
		},
		{
			id: "date-info",
			title: "Date Information",
			content: (
				<ItemDetailsForm
					dateInfo={formData.dateInfo}
					onDateInfoChange={(dateInfo) => updateFormData('dateInfo', dateInfo)}
					isDateStep={true}
				/>
			)
		},
		{
			id: "contributors",
			title: "Contributors",
			content: (
				<ContributorsForm
					contributors={formData.contributors}
					primaryContributor={formData.primaryContributor}
					contributorsList={contributorsList}
					onChange={(contributors) => updateFormData('contributors', contributors)}
					onPrimaryChange={(primary) => updateFormData('primaryContributor', primary)}
					setContributorsList={setContributorsList}
				/>
			)
		},
		{
			id: "period",
			title: "Period",
			content: (
				<PeriodSelector
					periods={periods}
					selectedPeriod={formData.period}
					onChange={(period) => updateFormData('period', period)}
					setPeriods={setPeriods}
				/>
			)
		},
		{
			id: "inventory",
			title: "Inventory",
			content: (
				<InventoryForm
					inventoryQuantity={formData.inventoryQuantity}
					onChange={(qty) => updateFormData('inventoryQuantity', qty)}
				/>
			)
		},
		{
			id: "medium",
			title: "Medium",
			content: (
				<MediumTypeSelector
					mediumTypes={mediumTypes}
					selectedMediumTypes={formData.mediumTypes}
					mediumDescription={formData.mediumDescription}
					onChange={(types) => updateFormData('mediumTypes', types)}
					onDescriptionChange={(desc) => updateFormData('mediumDescription', desc)}
					setMediumTypes={setMediumTypes}
				/>
			)
		},
		{
			id: "dimensions",
			title: "Dimensions",
			content: (
				<DimensionsForm
					dimensions={formData.dimensions}
					unit={formData.dimensionsUnit}
					onChange={(dimensions) => updateFormData('dimensions', dimensions)}
					onUnitChange={(unit) => updateFormData('dimensionsUnit', unit)}
				/>
			)
		},
		{
			id: "condition",
			title: "Condition",
			content: (
				<ConditionTypeSelector
					conditionTypes={conditionTypes}
					selectedConditionType={formData.conditionType}
					conditionDescription={formData.conditionDescription}
					onChange={(type) => updateFormData('conditionType', type)}
					onDescriptionChange={(desc) => updateFormData('conditionDescription', desc)}
					setConditionTypes={setConditionTypes}
				/>
			)
		},
		{
			id: "images",
			title: "Images",
			content: (
				<div className="image-management-section">
					<p className="section-description">
						Manage your item images below. Upload new images or reorder existing ones.
						The first image in the list will always be the primary image shown to customers.
					</p>

					<ImageUploader
						images={formData.images}
						primaryIndex={formData.primaryImageIndex}
						onChange={(images) => updateFormData('images', images)}
						onPrimaryChange={(index) => updateFormData('primaryImageIndex', index)}
						existingImages={formData.existingImages}
						onExistingImagesChange={(images) => updateFormData('existingImages', images)}
						onOrderChange={setImagesOrder}
					/>
				</div>
			)
		}
	];

	return (
		<div className="add-item-page">
			<div className="add-item-header">
				<h1>Edit Item: {formData.title}</h1>
				<button
					className="cancel-button"
					onClick={() => navigate('/admin')}
				>
					Cancel
				</button>
			</div>

			<div className="edit-item-accordion">
				{sections.map((section) => (
					<div
						key={section.id}
						className={`accordion-section ${expandedSections[section.id] ? 'expanded' : ''} ${isSectionValid(section.id) ? 'valid' : 'invalid'}`}
					>
						<div
							className="accordion-header"
							onClick={() => toggleSection(section.id)}
						>
							<h3>{section.title}</h3>
							<div className="header-indicators">
								<span className="validation-indicator">
									{isSectionValid(section.id) ? '✓' : '✗'}
								</span>
								<span className="accordion-indicator">
									{expandedSections[section.id] ? '▲' : '▼'}
								</span>
							</div>
						</div>
						{expandedSections[section.id] && (
							<div className="accordion-content">
								{section.content}
							</div>
						)}
					</div>
				))}
			</div>

			<div className="add-item-navigation">
				<button
					className="submit-button"
					onClick={handleSubmit}
					disabled={!isFormValid() || isSubmitting}
				>
					{isSubmitting ? 'Saving Changes...' : 'Save Changes'}
				</button>
			</div>
		</div>
	);
};

export default EditItemPage;