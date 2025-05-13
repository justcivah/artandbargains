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

	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'Shop - Art & Bargains';
	}, []);

	// Helper function to determine if contributor is primary
	const isPrimaryContributor = (contributor, index) => {
		// Assume the first contributor is primary 
		// Alternative logic: check if position is artist/creator/etc.
		return index === 0 ||
			contributor.position.toLowerCase() === 'artist' ||
			contributor.position.toLowerCase() === 'creator';
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

	// Format dimensions for display
	const formatDimensions = (dimensions) => {
		if (!dimensions) return 'Dimensions not specified';

		// Filter out the unit key to get only dimension parts
		const dimensionParts = Object.keys(dimensions).filter(key => key !== 'unit');

		if (dimensionParts.length === 0) {
			return 'Dimensions not specified';
		}

		// Get the unit
		const unit = dimensions.unit || 'cm';

		// We will handle this in the render function directly
		return { dimensionParts, unit };
	};

	// Format item type for display
	const formatItemType = (type) => {
		if (!type) return '';

		return type
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	if (loading) {
		return (
			<div className="shop-items-loading">
				<div className="loading-spinner" aria-label="Loading content"></div>
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<div className="navbar-spacer"></div>
				<div className="item-detail-error">
					<h2>Error Loading Item</h2>
					<p>An error occurred while fetching the item from our database. Please try again later.</p>
					<Link to="/shop" className="back-to-shop">Back to Shop</Link>
				</div>
			</div>
		);
	}

	if (!item) {
		return (
			<div>
				<div className="navbar-spacer"></div>
				<div className="item-detail-error">
					<h2>Item Not Found</h2>
					<p>The item you're looking for doesn't exist or has been removed.</p>
					<Link to="/shop" className="back-to-shop">Back to Shop</Link>
				</div>
			</div>
		);
	}

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
							<div className="item-categories">
								<span className="label">Subject:</span>
								<div className="categories-list">
									{item.subject && (
										<span className="item-category">
											{formatItemType(item.subject)}
										</span>
									)}
								</div>
							</div>

							<div className="item-categories">
								<span className="label">Technique:</span>
								<div className="categories-list">
									{item.technique && (
										<span className="item-category">
											{formatItemType(item.technique)}
										</span>
									)}
								</div>
							</div>

							<h1 className="item-title">{item.title} ({formatDateInfo(item.date_info)})</h1>

							<div className="item-contributors">
								{item.contributors && item.contributors.map((contributor, index) => (
									<div key={index} className="contributor-entry">
										<span className="contributor-position">
											{contributor.position.charAt(0).toUpperCase() + contributor.position.slice(1)}:
										</span>
										<span
											className={`contributor-name ${isPrimaryContributor(contributor, index) ? 'primary-contributor' : ''}`}
										>
											{contributor.display_name || contributorDetails[contributor.contributor_id]?.display_name || contributor.contributor_id}
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

							{item.dimensions && (
								<div className="item-section">
									<h3>Dimensions</h3>
									{typeof formatDimensions(item.dimensions) === 'string' ? (
										<p>{formatDimensions(item.dimensions)}</p>
									) : (
										<div className="multiple-dimensions">
											{formatDimensions(item.dimensions).dimensionParts.map(part => {
												const partDimensions = item.dimensions[part];
												const dimensionUnit = formatDimensions(item.dimensions).unit;
												const dimensionValues = [];

												if (partDimensions.height) dimensionValues.push(`Height: ${partDimensions.height} ${dimensionUnit}`);
												if (partDimensions.width) dimensionValues.push(`Width: ${partDimensions.width} ${dimensionUnit}`);
												if (partDimensions.depth) dimensionValues.push(`Depth: ${partDimensions.depth} ${dimensionUnit}`);
												if (partDimensions.diameter) dimensionValues.push(`Diameter: ${partDimensions.diameter} ${dimensionUnit}`);

												if (dimensionValues.length === 0) return null;

												return (
													<div key={part} className="dimension-part-display">
														<p>
															<strong>{part.charAt(0).toUpperCase() + part.slice(1)}:</strong>{' '}
															{dimensionValues.join(', ')}
														</p>
													</div>
												);
											})}
										</div>
									)}
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
							<button className="contact-button">Contact Us</button>
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