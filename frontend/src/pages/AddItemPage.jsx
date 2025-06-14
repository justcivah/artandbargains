import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	createItem, fetchItemTypes, fetchSubjects, fetchTechniques, fetchPeriods,
	fetchMediumTypes, fetchContributors
} from '../api/itemsApi';
import { uploadMultipleImages } from '../api/imagesApi';
import TypeSelector from '../components/add-item-steps/TypeSelector';
import SubjectSelector from '../components/add-item-steps/SubjectSelector';
import TechniqueSelector from '../components/add-item-steps/TechniqueSelector';
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
	const totalSteps = 12;

	// Metadata states
	const [itemTypes, setItemTypes] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [techniques, setTechniques] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [contributorsList, setContributorsList] = useState([]);

	// Add state to track image order
	const [imagesOrder, setImagesOrder] = useState([]);

	// Form states
	const [formData, setFormData] = useState({
		itemType: '',
		subject: '',
		technique: '', // This will remain empty if no technique is selected
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
		dimensions: {},
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

	// Load metadata from DynamoDB
	useEffect(() => {
		const loadMetadata = async () => {
			try {
				setLoading(true);

				// Fetch all metadata in parallel
				const [types, subjs, techs, pers, mediums, contributors] = await Promise.all([
					fetchItemTypes(),
					fetchSubjects(),
					fetchTechniques(),
					fetchPeriods(),
					fetchMediumTypes(),
					fetchContributors()
				]);

				setItemTypes(types);
				setSubjects(subjs);
				setTechniques(techs);
				setPeriods(pers);
				setMediumTypes(mediums);
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

	const generateIdFromTitle = (title) => {
		const normalizedTitle = title
			.toLowerCase()
			.replace(/'/g, '-')
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-');

		const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
		let code = '';
		for (let i = 0; i < 6; i++) {
			code += chars.charAt(Math.floor(Math.random() * chars.length));
		}

		return `${normalizedTitle}-${code}`;
	}

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
			// If we're at step 2 (Subject) and the item type is not "print", 
			// skip step 3 (Technique) and go directly to step 4 (ItemDetailsForm)
			if (currentStep === 2 && formData.itemType !== 'print') {
				setCurrentStep(4);
			} else {
				setCurrentStep(currentStep + 1);
			}
			window.scrollTo(0, 0);
		}
	};

	// Navigate to previous step
	const handlePrevious = () => {
		if (currentStep > 1) {
			// If we're at step 4 (ItemDetailsForm) and the item type is not "print", 
			// skip step 3 (Technique) and go back to step 2 (Subject)
			if (currentStep === 4 && formData.itemType !== 'print') {
				setCurrentStep(2);
			} else {
				setCurrentStep(currentStep - 1);
			}
			window.scrollTo(0, 0);
		}
	};

	// Handle form submission
	const handleSubmit = async () => {
		try {
			setIsSubmitting(true);

			// Generate a new item ID
			const itemId = `ITEM#${generateIdFromTitle(formData.title)}`;

			// Upload images to Backblaze
			let imageUrls = [];
			if (formData.images.length > 0) {
				const uploadResults = await uploadMultipleImages(formData.images);

				// If we have an order array from ImageUploader, use it
				if (imagesOrder.length > 0) {
					imageUrls = imagesOrder.map((orderItem, index) => {
						const imageIndex = orderItem.index;
						if (imageIndex >= 0 && imageIndex < uploadResults.length) {
							return {
								url: uploadResults[imageIndex].fileUrl,
								is_primary: index === 0
							};
						}
						return null;
					}).filter(img => img !== null);
				} else {
					imageUrls = uploadResults.map((result, index) => ({
						url: result.fileUrl,
						is_primary: index === formData.primaryImageIndex
					}));
				}
			}

			// Prepare date information
			const dateInfo = {
				type: formData.dateInfo.type,
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
					const part = dimensionsWithUnit[key];
					const hasValue = part.height || part.width || part.depth || part.diameter;

					if (hasValue) {
						cleanedDimensions[key] = {};
						if (part.height) cleanedDimensions[key].height = parseFloat(part.height);
						if (part.width) cleanedDimensions[key].width = parseFloat(part.width);
						if (part.depth) cleanedDimensions[key].depth = parseFloat(part.depth);
						if (part.diameter) cleanedDimensions[key].diameter = parseFloat(part.diameter);
					}
				}
			});

			// Format contributors for API
			const contributors = formData.contributors.map(contrib => {
				let contributorId;
				if (contrib.contributor.PK && contrib.contributor.PK.includes('#')) {
					contributorId = contrib.contributor.PK.split('#')[1];
				} else {
					contributorId = contrib.contributor.name;
				}

				return {
					position: contrib.position,
					contributor_id: contributorId
				};
			});

			// Prepare the item data for DynamoDB
			const itemData = {
				metadata: {
					PK: itemId,
					title: formData.title,
					title_lower: formData.title.toLowerCase(),
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
					images: imageUrls,
					subject: formData.subject,
					// Only include technique if it's not empty
					...(formData.technique && { technique: formData.technique })
				},
				subject: formData.subject,
				// Only include technique if it's not empty
				...(formData.technique && { technique: formData.technique }),
				mediumTypes: formData.mediumTypes,
				contributors: contributors,
				conditionType: formData.conditionType,
				itemId: itemId
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

	// Get adjusted total steps based on whether we skip step 3
	const getAdjustedTotalSteps = () => {
		return formData.itemType === 'print' ? totalSteps : totalSteps - 1;
	};

	// Get adjusted current step for the step indicator
	const getAdjustedCurrentStep = () => {
		// If we're past step 3 and item type is not print, decrease the step number by 1
		if (currentStep > 3 && formData.itemType !== 'print') {
			return currentStep - 1;
		}
		return currentStep;
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
						onSelectComplete={handleNext}
					/>
				);
			case 2:
				return (
					<SubjectSelector
						subjects={subjects}
						selectedSubject={formData.subject}
						onChange={(subject) => updateFormData('subject', subject)}
						setSubjects={setSubjects}
						onSelectComplete={handleNext}
						selectedItemType={formData.itemType}
					/>
				);
			case 3:
				// Only render the technique selector if the item type is print
				if (formData.itemType === 'print') {
					return (
						<TechniqueSelector
							techniques={techniques}
							selectedTechnique={formData.technique}
							onChange={(technique) => updateFormData('technique', technique)}
							setTechniques={setTechniques}
							onSelectComplete={handleNext}
						/>
					);
				} else {
					// Safety fallback - this shouldn't normally be reached due to our navigation logic
					setCurrentStep(4);
					return null;
				}
			case 4:
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
			case 5:
				return (
					<ItemDetailsForm
						dateInfo={formData.dateInfo}
						onDateInfoChange={(dateInfo) => updateFormData('dateInfo', dateInfo)}
						isDateStep={true}
					/>
				);
			case 6:
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
			case 7:
				return (
					<PeriodSelector
						periods={periods}
						selectedPeriod={formData.period}
						onChange={(period) => updateFormData('period', period)}
						setPeriods={setPeriods}
						onSelectComplete={handleNext}
					/>
				);
			case 8:
				return (
					<InventoryForm
						inventoryQuantity={formData.inventoryQuantity}
						onChange={(qty) => updateFormData('inventoryQuantity', qty)}
					/>
				);
			case 9:
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
			case 10:
				return (
					<DimensionsForm
						dimensions={formData.dimensions}
						unit={formData.dimensionsUnit}
						onChange={(dimensions) => updateFormData('dimensions', dimensions)}
						onUnitChange={(unit) => updateFormData('dimensionsUnit', unit)}
					/>
				);
			case 11:
				return (
					<ConditionTypeSelector
						selectedConditionType={formData.conditionType}
						conditionDescription={formData.conditionDescription}
						onChange={(type) => updateFormData('conditionType', type)}
						onDescriptionChange={(desc) => updateFormData('conditionDescription', desc)}
					/>
				);
			case 12:
				return (
					<ImageUploader
						images={formData.images}
						primaryIndex={formData.primaryImageIndex}
						onChange={(images) => updateFormData('images', images)}
						onPrimaryChange={(index) => updateFormData('primaryImageIndex', index)}
						existingImages={formData.existingImages}
						onExistingImagesChange={(images) => updateFormData('existingImages', images)}
						onOrderChange={setImagesOrder}
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
				return !!formData.subject;
			case 3:
				// Technique is optional, so always return true
				return true;
			case 4:
				return !!formData.title && !!formData.description && !!formData.price;
			case 5:
				if (formData.dateInfo.type === 'exact') {
					return !!formData.dateInfo.yearExact;
				} else if (formData.dateInfo.type === 'range') {
					return !!formData.dateInfo.yearRangeStart && !!formData.dateInfo.yearRangeEnd;
				} else {
					return !!formData.dateInfo.periodText;
				}
			case 6:
				return formData.contributors.length > 0 && !!formData.primaryContributor;
			case 7:
				return !!formData.period;
			case 8:
				return formData.inventoryQuantity >= 0;
			case 9:
				return formData.mediumTypes.length > 0;
			case 10:
				// At least one dimension should be provided
				const dimensionParts = Object.keys(formData.dimensions).filter(key => key !== 'unit');
				return dimensionParts.some(part => {
					const dims = formData.dimensions[part];
					return dims.height || dims.width || dims.depth || dims.diameter;
				});
			case 11:
				return !!formData.conditionType;
			case 12:
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

			<StepIndicator
				currentStep={getAdjustedCurrentStep()}
				totalSteps={getAdjustedTotalSteps()}
			/>

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