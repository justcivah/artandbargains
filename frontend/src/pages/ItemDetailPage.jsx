import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ImageGallery from '../components/ImageGallery';
import { fetchItem, fetchContributor } from '../api/itemsApi';
import '../styles/ItemDetailPage.css';

const ItemDetailPage = () => {
	const { itemId } = useParams();
	const [item, setItem] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [contributorDetails, setContributorDetails] = useState({});

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

				// Fetch the item data
				const itemData = await fetchItem(itemId);
				setItem(itemData);

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
		} else if (dateInfo.type === 'text' && dateInfo.period_text) {
			return dateInfo.period_text;
		}

		return 'Unknown date';
	};

	// Format dimensions for display - Updated to return JSX with bold part names
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
					<span key={partName}>
						<b>{formattedPartName}:</b> {measurementParts.join(', ')}
					</span>
				);
			}
		});

		return (
			<>
				{elements.map((element, index) => (
					<React.Fragment key={index}>
						{element}
						{index < elements.length - 1 && ', '}
					</React.Fragment>
				))}
			</>
		);
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

				<div className="item-detail-grid">
					{/* Left side: Images */}
					<div className="item-images">
						<ImageGallery images={item.images} />
					</div>

					{/* Right side: Information */}
					<div className="item-info">
						<div className="item-header">
							{/* Only show categories div if technique exists */}
							{item.technique && (
								<div className="item-categories single-line">
									<span className="item-category">
										{formatItemType(item.technique)}
									</span>
								</div>
							)}

							<h1 className="item-title">
								{item.title} ({formatDateInfo(item.date_info)}){primaryContributorName && ` - ${primaryContributorName}`}
							</h1>

							<div className="item-contributors">
								{orderedContributors.map((contributor, index) => (
									<div key={index} className="contributor-entry">
										<span className="contributor-position">
											{contributor.position.charAt(0).toUpperCase() + contributor.position.slice(1)}:
										</span>
										<span className="contributor-name">
											{getContributorDisplayName(contributor)}
										</span>
									</div>
								))}
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
						</div>

						<div className="item-details">
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
													{formatItemType(type)}
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
										{formatItemType(item.condition.status)}
									</div>
									{item.condition.description && (
										<p className="condition-description">{item.condition.description}</p>
									)}
								</div>
							)}

							{item.dimensions && formatDimensions(item.dimensions) && (
								<div className="item-section">
									<h3>Dimensions</h3>
									<p>{formatDimensions(item.dimensions)}</p>
								</div>
							)}

							{item.period && (
								<div className="item-section">
									<h3>Period</h3>
									<p>{formatItemType(item.period)}</p>
								</div>
							)}

							{item.provenance && (
								<div className="item-section">
									<h3>Provenance</h3>
									<p>{item.provenance}</p>
								</div>
							)}
						</div>

						<div className="item-interest-section">
							<p className="interest-text">Interested in this piece?</p>
							<Link to="/contact" className="contact-button">Contact Us</Link>
							<div className="shipping-info">
								<p><strong>Ships from:</strong> Como 22100, Italy</p>
								<p>Shipping rates may vary by destination and complexity</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
};

export default ItemDetailPage;