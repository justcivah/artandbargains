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
import ImageUploader from '../components/add-item-steps//ImageUploader';
import StepIndicator from '../components/add-item-steps/StepIndicator';
import '../styles/AddItemPage.css';

const EditItemPage = () => {
	const { itemId } = useParams();
	const navigate = useNavigate();
	const [currentStep, setCurrentStep] = useState(1);
	const totalSteps = 11;

	// Metadata states
	const [itemTypes, setItemTypes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [conditionTypes, setConditionTypes] = useState([]);
	const [contributorsList, setContributorsList] = useState([]);

	// Form states
	const [formData, setFormData] = useState({
		itemType: '',
		categories: [],
		title: '',
		dateInfo: {
			type: 'exact', // 'exact', 'range', or 'period'
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
		existingImages: [] // For already uploaded images
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
					fetchItem(itemId),
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

				// Now fetch categories for this item
				const itemCategoryRecords = await fetchItem(itemId, "CATEGORY#");
				const itemCategories = itemCategoryRecords ? [itemCategoryRecords.SK.replace("CATEGORY#", "")] : [];

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

				setFormData({
					itemType: item.item_type,
					categories: itemCategories,
					title: item.title,
					dateInfo,
					contributors: formattedContributors,
					primaryContributor: item.primary_contributor_display,
					period: item.period,
					inventoryQuantity: item.inventory_quantity,
					mediumTypes: item.medium.types,
					mediumDescription: item.medium.description,
					dimensions: {
						height: item.dimensions.height || '',
						width: item.dimensions.width || '',
						depth: item.dimensions.depth || '',
						diameter: item.dimensions.diameter || ''
					},
					dimensionsUnit: item.dimensions.unit || 'cm',
					conditionType: item.condition.status,
					conditionDescription: item.condition.description,
					price: item.price,
					description: item.description,
					images: [], // New images to upload
					primaryImageIndex: 0,
					existingImages: item.images || []
				});

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

	// Navigate to next step
	const handleNext = () => {
		if (currentStep < totalSteps) {
			setCurrentStep(currentStep + 1);
			window.scrollTo(0, 0);
		}
	};

	// Navigate to previous step
	const handlePrevious = () => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1);
			window.scrollTo(0, 0);
		}
	};

	// Handle form submission
	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);

			// Upload new images to Backblaze
			let imageUrls = [...formData.existingImages];

			// Upload new images if any
			if (formData.images.length > 0) {
				const uploadResults = await uploadMultipleImages(formData.images);
				const newImages = uploadResults.map((result, index) => ({
					url: result.fileUrl,
					is_primary: false // Will set the primary flag below
				}));

				imageUrls = [...imageUrls, ...newImages];
			}

			// Set primary image flag
			// First, mark all images as non-primary
			imageUrls = imageUrls.map(img => ({ ...img, is_primary: false }));

			// Determine the index of the primary image
			let primaryIndex = formData.primaryImageIndex;
			if (primaryIndex >= 0 && primaryIndex < formData.images.length) {
				// If it's a new image, calculate the index in the combined array
				primaryIndex = formData.existingImages.length + primaryIndex;
			}

			// Mark the primary image
			if (primaryIndex >= 0 && primaryIndex < imageUrls.length) {
				imageUrls[primaryIndex].is_primary = true;
			} else if (imageUrls.length > 0) {
				// Default to first image if index is invalid
				imageUrls[0].is_primary = true;
			}

			// Prepare date information
			const dateInfo = {};
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
			dateInfo.circa = formData.dateInfo.circa;

			// Prepare dimensions
			const dimensions = {};
			if (formData.dimensions.height) dimensions.height = parseFloat(formData.dimensions.height);
			if (formData.dimensions.width) dimensions.width = parseFloat(formData.dimensions.width);
			if (formData.dimensions.depth) dimensions.depth = parseFloat(formData.dimensions.depth);
			if (formData.dimensions.diameter) dimensions.diameter = parseFloat(formData.dimensions.diameter);
			dimensions.unit = formData.dimensionsUnit;

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
					date_info: dateInfo,
					contributors: contributors,
					primary_contributor_display: formData.primaryContributor,
					description: formData.description,
					price: parseFloat(formData.price),
					item_type: formData.itemType,
					period: formData.period,
					inventory_quantity: parseInt(formData.inventoryQuantity),
					medium: {
						types: formData.mediumTypes,
						description: formData.mediumDescription
					},
					dimensions: dimensions,
					condition: {
						status: formData.conditionType,
						description: formData.conditionDescription
					},
					images: imageUrls
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

	// Render the current step
	const renderStep = () => {
		switch (currentStep) {
			case 1:
				return (
					<TypeSelector
						itemTypes={itemTypes}
						selectedType={formData.itemType}
						onChange={(type) => updateFormData('itemType', type)}
						setItemTypes={setItemTypes}
					/>
				);
			case 2:
				return (
					<CategorySelector
						categories={categories}
						selectedCategories={formData.categories}
						onChange={(cats) => updateFormData('categories', cats)}
						setCategories={setCategories}
					/>
				);
			case 3:
				return (
					<ItemDetailsForm
						title={formData.title}
						description={formData.description}
						price={formData.price}
						onTitleChange={(title) => updateFormData('title', title)}
						onDescriptionChange={(desc) => updateFormData('description', desc)}
						onPriceChange={(price) => updateFormData('price', price)}
					/>
				);
			case 4:
				return (
					<ItemDetailsForm
						dateInfo={formData.dateInfo}
						onDateInfoChange={(dateInfo) => updateFormData('dateInfo', dateInfo)}
						isDateStep={true}
					/>
				);
			case 5:
				return (
					<ContributorsForm
						contributors={formData.contributors}
						primaryContributor={formData.primaryContributor}
						contributorsList={contributorsList}
						onChange={(contributors) => updateFormData('contributors', contributors)}
						onPrimaryChange={(primary) => updateFormData('primaryContributor', primary)}
						setContributorsList={setContributorsList}
					/>
				);
			case 6:
				return (
					<PeriodSelector
						periods={periods}
						selectedPeriod={formData.period}
						onChange={(period) => updateFormData('period', period)}
						setPeriods={setPeriods}
					/>
				);
			case 7:
				return (
					<InventoryForm
						inventoryQuantity={formData.inventoryQuantity}
						onChange={(qty) => updateFormData('inventoryQuantity', qty)}
					/>
				);
			case 8:
				return (
					<MediumTypeSelector
						mediumTypes={mediumTypes}
						selectedMediumTypes={formData.mediumTypes}
						mediumDescription={formData.mediumDescription}
						onChange={(types) => updateFormData('mediumTypes', types)}
						onDescriptionChange={(desc) => updateFormData('mediumDescription', desc)}
						setMediumTypes={setMediumTypes}
					/>
				);
			case 9:
				return (
					<DimensionsForm
						dimensions={formData.dimensions}
						unit={formData.dimensionsUnit}
						onChange={(dimensions) => updateFormData('dimensions', dimensions)}
						onUnitChange={(unit) => updateFormData('dimensionsUnit', unit)}
					/>
				);
			case 10:
				return (
					<ConditionTypeSelector
						conditionTypes={conditionTypes}
						selectedConditionType={formData.conditionType}
						conditionDescription={formData.conditionDescription}
						onChange={(type) => updateFormData('conditionType', type)}
						onDescriptionChange={(desc) => updateFormData('conditionDescription', desc)}
						setConditionTypes={setConditionTypes}
					/>
				);
			case 11:
				return (
					<div className="image-management-step">
						<h2>Manage Images</h2>
						<p className="step-description">
							You can add new images or change the primary image. Existing images are shown below.
						</p>

						{formData.existingImages.length > 0 && (
							<div className="existing-images">
								<h3>Existing Images</h3>
								<div className="image-preview-grid">
									{formData.existingImages.map((image, index) => (
										<div
											key={`existing-${index}`}
											className={`image-preview-item ${image.is_primary ? 'primary' : ''}`}
										>
											<div className="image-preview">
												<img src={image.url} alt={`Item ${index + 1}`} />
											</div>
											<div className="image-actions">
												<div className="image-name">Existing Image {index + 1}</div>
												<label className={`primary-control ${image.is_primary ? 'is-primary' : ''}`}>
													<input
														type="radio"
														name="primaryImage"
														checked={image.is_primary}
														onChange={() => {
															// Create a new array with updated primary flags
															const updatedImages = formData.existingImages.map((img, i) => ({
																...img,
																is_primary: i === index
															}));
															updateFormData('existingImages', updatedImages);
															updateFormData('primaryImageIndex', -1); // Reset new image primary
														}}
													/>
													{image.is_primary ? 'Primary Image' : 'Set as Primary'}
												</label>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="new-images-section">
							<h3>Add New Images</h3>
							<ImageUploader
								images={formData.images}
								primaryIndex={formData.primaryImageIndex}
								onChange={(images) => updateFormData('images', images)}
								onPrimaryChange={(index) => updateFormData('primaryImageIndex', index)}
							/>
						</div>
					</div>
				);
			default:
				return <div>Invalid step</div>;
		}
	};

	// Validate if the current step is complete
	const isStepComplete = () => {
		switch (currentStep) {
			case 1:
				return !!formData.itemType;
			case 2:
				return formData.categories.length > 0;
			case 3:
				return !!formData.title && !!formData.description && !!formData.price;
			case 4:
				if (formData.dateInfo.type === 'exact') {
					return !!formData.dateInfo.yearExact;
				} else if (formData.dateInfo.type === 'range') {
					return !!formData.dateInfo.yearRangeStart && !!formData.dateInfo.yearRangeEnd;
				} else {
					return !!formData.dateInfo.periodText;
				}
			case 5:
				return formData.contributors.length > 0 && !!formData.primaryContributor;
			case 6:
				return !!formData.period;
			case 7:
				return formData.inventoryQuantity >= 0;
			case 8:
				return formData.mediumTypes.length > 0 && !!formData.mediumDescription;
			case 9:
				// At least one dimension should be provided
				const dims = formData.dimensions;
				return !!dims.height || !!dims.width || !!dims.depth || !!dims.diameter;
			case 10:
				return !!formData.conditionType;
			case 11:
				// Either existing images or new images should be present
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

			<StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

			<div className="add-item-content">
				{renderStep()}
			</div>

			<div className="add-item-navigation">
				{currentStep > 1 && (
					<button
						className="prev-button"
						onClick={handlePrevious}
						disabled={isSubmitting}
					>
						Previous
					</button>
				)}

				{currentStep < totalSteps ? (
					<button
						className="next-button"
						onClick={handleNext}
						disabled={!isStepComplete() || isSubmitting}
					>
						Next
					</button>
				) : (
					<button
						className="submit-button"
						onClick={handleSubmit}
						disabled={!isStepComplete() || isSubmitting}
					>
						{isSubmitting ? 'Saving Changes...' : 'Save Changes'}
					</button>
				)}
			</div>
		</div>
	);
};

export default EditItemPage;