import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createItem, generateItemId, fetchItemTypes, fetchCategories, fetchPeriods,
	fetchMediumTypes, fetchConditionTypes, fetchContributors
} from '../api/itemsApi';
import { uploadMultipleImages } from '../api/imageApi';
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
import StepIndicator from '../components/add-item-steps/StepIndicator';
import '../styles/AddItemPage.css';

const AddItemPage = () => {
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
		primaryImageIndex: 0
	});

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Load metadata from DynamoDB
	useEffect(() => {
		const loadMetadata = async () => {
			try {
				setLoading(true);

				// Fetch all metadata in parallel
				const [types, cats, pers, mediums, conditions, contributors] = await Promise.all([
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

				setLoading(false);
			} catch (err) {
				setError('Error loading metadata: ' + err.message);
				console.error('Error loading metadata:', err);
				setLoading(false);
			}
		};

		loadMetadata();
	}, []);

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

			// Format data for DynamoDB
			const itemId = generateItemId();

			// Upload images to Backblaze
			let imageUrls = [];
			if (formData.images.length > 0) {
				const uploadResults = await uploadMultipleImages(formData.images);
				imageUrls = uploadResults.map((result, index) => ({
					url: result.fileUrl,
					is_primary: index === formData.primaryImageIndex
				}));
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

			// Create the item in DynamoDB
			await createItem(itemData);

			// Navigate back to admin page
			navigate('/admin');
		} catch (err) {
			setError('Error creating item: ' + err.message);
			console.error('Error creating item:', err);
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
					<ImageUploader
						images={formData.images}
						primaryIndex={formData.primaryImageIndex}
						onChange={(images) => updateFormData('images', images)}
						onPrimaryChange={(index) => updateFormData('primaryImageIndex', index)}
					/>
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
				return formData.images.length > 0;
			default:
				return false;
		}
	};

	if (loading) {
		return <div className="add-item-loading">Loading...</div>;
	}

	if (error) {
		return <div className="add-item-error">{error}</div>;
	}

	return (
		<div className="add-item-page">
			<div className="add-item-header">
				<h1>Add New Item</h1>
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
						{isSubmitting ? 'Submitting...' : 'Submit'}
					</button>
				)}
			</div>
		</div>
	);
};

export default AddItemPage;