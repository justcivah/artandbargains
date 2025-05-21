import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageGallery from '../components/ImageGallery';
import {
	fetchItem,
	fetchContributor,
	fetchTechniques,
	fetchMediumTypes,
	fetchPeriods
} from '../api/itemsApi';
import '../styles/ItemDetailPage.css';
import ContributorTooltip from '../components/ContributorTooltip';

const ItemDetailPage = () => {
	const { itemId } = useParams();
	const [item, setItem] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [contributorDetails, setContributorDetails] = useState({});
	const [techniques, setTechniques] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);

	// Condition display names mapping - since conditions don't have a separate API endpoint
	const conditionDisplayNames = {
		'poor': 'Poor',
		'fair': 'Fair',
		'good': 'Good',
		'very_good': 'Very Good',
		'excellent': 'Excellent',
		'mint': 'Mint'
	};

	// Check for mobile view on resize
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 992);
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Scroll to top on component mount
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, []);

	// Fetch item data
	useEffect(() => {
		const loadItem = async () => {
			try {
				setLoading(true);
				setError(null);

				// Fetch data from APIs in parallel 
				const [itemData, techniquesData, mediumTypesData, periodsData] = await Promise.all([
					fetchItem(itemId),
					fetchTechniques(),
					fetchMediumTypes(),
					fetchPeriods()
				]);

				// Set state with fetched data
				setItem(itemData);
				setTechniques(techniquesData);
				setMediumTypes(mediumTypesData);
				setPeriods(periodsData);

				// Preload contributor data
				if (itemData.contributors && itemData.contributors.length > 0) {
					const contributorPromises = itemData.contributors.map(async (contrib) => {
						try {
							const contributorData = await fetchContributor(contrib.contributor_id);
							return [contrib.contributor_id, contributorData];
						} catch (err) {
							console.error(`Error fetching contributor ${contrib.contributor_id}:`, err);
							return [contrib.contributor_id, null];
						}
					});

					const contributorsData = await Promise.all(contributorPromises);
					const contributorsMap = Object.fromEntries(contributorsData);
					setContributorDetails(contributorsMap);
				}
			} catch (err) {
				console.error(`Error fetching item ${itemId}:`, err);
				setError('Failed to load item. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		loadItem();
	}, [itemId]);

	// Get technique display name
	const getTechniqueDisplayName = (techniqueSlug) => {
		if (!techniqueSlug || !techniques.length) return formatItemType(techniqueSlug);

		const technique = techniques.find(t => t.name === techniqueSlug);
		return technique ? technique.display_name : formatItemType(techniqueSlug);
	};

	// Get medium type display name
	const getMediumTypeDisplayName = (mediumSlug) => {
		if (!mediumSlug || !mediumTypes.length) return formatItemType(mediumSlug);

		const medium = mediumTypes.find(m => m.name === mediumSlug);
		return medium ? medium.display_name : formatItemType(mediumSlug);
	};

	// Get period display name
	const getPeriodDisplayName = (periodSlug) => {
		if (!periodSlug || !periods.length) return formatItemType(periodSlug);

		const period = periods.find(p => p.name === periodSlug);
		return period ? period.display_name : formatItemType(periodSlug);
	};

	// Get condition display name
	const getConditionDisplayName = (conditionSlug) => {
		if (!conditionSlug) return '';

		return conditionDisplayNames[conditionSlug] || formatItemType(conditionSlug);
	};

	// Update page title when item loads
	useEffect(() => {
		if (item) {
			document.title = `${item.title} - Art & Bargains`;
		} else {
			document.title = 'Item Details - Art & Bargains';
		}
	}, [item]);

	// Also scroll to top when itemId changes (navigating between items)
	useEffect(() => {
		window.scrollTo({ top: 0, behavior: 'instant' });
	}, [itemId]);

	// Get ordered contributors list with primary contributor first
	const getOrderedContributors = () => {
		if (!item || !item.contributors || item.contributors.length === 0) return [];

		const contributors = [...item.contributors];
		const primaryDisplayName = item.primary_contributor_display;

		// Find the primary contributor
		const primaryIndex = contributors.findIndex(contrib => {
			const displayName = contrib.display_name ||
				contributorDetails[contrib.contributor_id]?.display_name ||
				contrib.contributor_id;
			return displayName === primaryDisplayName;
		});

		// If primary contributor found, move to first position
		if (primaryIndex > 0) {
			const [primaryContributor] = contributors.splice(primaryIndex, 1);
			contributors.unshift(primaryContributor);
		}

		return contributors;
	};

	// Format date info for display
	const formatDateInfo = (dateInfo) => {
		if (!dateInfo) return 'Unknown date';

		if (dateInfo.type === 'exact' && dateInfo.year_exact) {
			return dateInfo.circa ? `Circa ${dateInfo.year_exact}` : `${dateInfo.year_exact}`;
		} else if (dateInfo.type === 'range' && dateInfo.year_range_start) {
			return `${dateInfo.year_range_start} - ${dateInfo.year_range_end}`;
		} else if (dateInfo.type === 'period' && dateInfo.period_text) {
			return dateInfo.period_text;
		}

		return 'Unknown date';
	};

	// Format dimensions for display - Updated to return each dimension on a new row
	const formatDimensions = (dimensions) => {
		if (!dimensions) return null;

		const unit = dimensions.unit || 'cm';
		const elements = [];

		// Iterate through all properties except 'unit'
		Object.entries(dimensions).forEach(([partName, measurements]) => {
			// Skip the unit property
			if (partName === 'unit') return;

			// Handle each part's measurements
			if (typeof measurements === 'object' && measurements !== null) {
				const measurementParts = [];

				Object.entries(measurements).forEach(([measurementType, value]) => {
					// Format the measurement type (capitalize first letter)
					const formattedMeasurementType = measurementType.charAt(0).toUpperCase() + measurementType.slice(1);
					measurementParts.push(`${formattedMeasurementType} ${value}${unit}`);
				});

				// Format the part name (capitalize first letter, replace underscores with spaces)
				const formattedPartName = partName
					.split('_')
					.map(word => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');

				elements.push(
					<div key={partName}>
						<b>{formattedPartName}:</b> {measurementParts.join(', ')}
					</div>
				);
			}
		});

		return <>{elements}</>;
	};

	// Format item type for display
	const formatItemType = (type) => {
		if (!type) return '';

		return type
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	// Get contributor display name
	const getContributorDisplayName = (contributor) => {
		return contributor.display_name ||
			contributorDetails[contributor.contributor_id]?.display_name ||
			contributor.contributor_id;
	};

	// Render title component to be used in mobile view
	const renderItemTitle = () => (
		<div className="item-header">
			{/* Only show categories div if technique exists */}
			{item.technique && (
				<div className="item-categories single-line">
					<span className="item-category">
						{getTechniqueDisplayName(item.technique)}
					</span>
				</div>
			)}

			<h1 className="item-title">
				{item.title} ({formatDateInfo(item.date_info)}){primaryContributorName && ` - ${primaryContributorName}`}
			</h1>
		</div>
	);

	if (loading) {
		return (
			<div className="item-detail-page">
				<div className="navbar-spacer"></div>
				<div className="shop-items-loading">
					<div className="loading-spinner" aria-label="Loading content"></div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="item-detail-page">
				<div className="navbar-spacer"></div>
				<div className="item-detail-error">
					<h2>Error Loading Item</h2>
					<p>{error}</p>
					<Link to="/shop" className="back-to-shop">Back to Shop</Link>
				</div>
			</div>
		);
	}

	if (!item) {
		return (
			<div className="item-detail-page">
				<div className="navbar-spacer"></div>
				<div className="item-detail-error">
					<h2>Item Not Found</h2>
					<p>The item you're looking for doesn't exist or has been removed.</p>
					<Link to="/shop" className="back-to-shop">Back to Shop</Link>
				</div>
			</div>
		);
	}

	const orderedContributors = getOrderedContributors();
	const primaryContributorName = item.primary_contributor_display;

	return (
		<main className="item-detail-page">
			<div className="navbar-spacer"></div>

			<div className="item-detail-container">
				<div className="item-breadcrumb">
					<Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{item.title}</span>
				</div>

				{/* Mobile-only title that appears above the gallery */}
				{isMobile && (
					<div className="mobile-title-container">
						{renderItemTitle()}
					</div>
				)}

				<div className="item-detail-grid">
					{/* Left side: Images */}
					<div className="item-images">
						<ImageGallery images={item.images} />
					</div>

					{/* Right side: Information */}
					<div className="item-info">
						{/* Title only shown on desktop */}
						<div className="desktop-title-container">
							{renderItemTitle()}
						</div>

						<div className="item-details">
							{/* Authors section - moved from header to details */}
							{orderedContributors && orderedContributors.length > 0 && (
								<div className="item-section">
									<h3>Authors</h3>
									{orderedContributors.map((contributor, index) => (
										<div key={index} className="contributor-entry">
											<b>{contributor.position.charAt(0).toUpperCase() + contributor.position.slice(1)}</b>:
											<ContributorTooltip
												contributor={contributor}
												contributorData={contributorDetails[contributor.contributor_id]}
											/>
										</div>
									))}
								</div>
							)}

							<div className="item-section">
								<h3>Description</h3>
								<p>{item.description}</p>
							</div>

							{item.medium && (
								<div className="item-section">
									<h3>Medium</h3>
									{item.medium.types && item.medium.types.length > 0 && (
										<div className="medium-types">
											{item.medium.types.map((type, index) => (
												<span key={index} className="medium-type">
													{getMediumTypeDisplayName(type)}
												</span>
											))}
										</div>
									)}
									{item.medium.description && (
										<p className="medium-description">{item.medium.description}</p>
									)}
								</div>
							)}

							{item.condition && (
								<div className="item-section">
									<h3>Condition</h3>
									<div className="condition-status">
										{getConditionDisplayName(item.condition.status)}
									</div>
									{item.condition.description && (
										<p className="condition-description">{item.condition.description}</p>
									)}
								</div>
							)}

							{item.dimensions && formatDimensions(item.dimensions) && (
								<div className="item-section">
									<h3>Dimensions</h3>
									<div>{formatDimensions(item.dimensions)}</div>
								</div>
							)}

							{item.period && (
								<div className="item-section">
									<h3>Period</h3>
									<p>{getPeriodDisplayName(item.period)}</p>
								</div>
							)}

							{item.provenance && (
								<div className="item-section">
									<h3>Provenance</h3>
									<p>{item.provenance}</p>
								</div>
							)}
						</div>

						<div className='price-container'>
							<div className="item-price">
								${item.price.toFixed(2)}
							</div>

							<div className="item-availability">
								{item.inventory_quantity > 0 ? (
									<span className="in-stock">In Stock: {item.inventory_quantity} available</span>
								) : (
									<span className="out-of-stock">Out of Stock</span>
								)}
							</div>
						</div>

						{item.inventory_quantity > 0 && (
							<div className="item-interest-section">
								<p className="interest-text">Interested in this piece?</p>
								<Link
									to={'/contact?subject=' + encodeURIComponent(item.title + " (" + formatDateInfo(item.date_info) + ") - " + primaryContributorName) + '#contact-form'}
									className="contact-button">
									Contact Us
								</Link>
								<div className="shipping-info">
									<p><strong>Ships from:</strong> Como 22100, Italy</p>
									<p>Shipping rates may vary by destination and complexity</p>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
};

export default ItemDetailPage;