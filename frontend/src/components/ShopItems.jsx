import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/ShopItems.css';

const ShopItems = ({ items, loading, error }) => {
	// Helper function to extract year from date_info
	const getYearFromDateInfo = (dateInfo) => {
		if (!dateInfo) return 'Unknown';

		if (dateInfo.type === 'exact' && dateInfo.year_exact) {
			return dateInfo.circa ? `c. ${dateInfo.year_exact}` : dateInfo.year_exact;
		} else if (dateInfo.type === 'range' && dateInfo.year_range_start) {
			return `${dateInfo.year_range_start}-${dateInfo.year_range_end}`;
		} else if (dateInfo.period_text) {
			return dateInfo.period_text;
		}

		return 'Unknown';
	};

	// Helper function to get the main image URL
	const getMainImage = (item) => {
		if (!item.images || !item.images.length) {
			return 'https://via.placeholder.com/400x300?text=No+Image';
		}

		const mainImage = item.images.find(img => img.is_primary);
		return mainImage ? mainImage.url : item.images[0].url;
	};

	// Format category name for display
	const formatCategory = (category) => {
		if (!category) return 'Other';

		// Convert snake_case to Title Case
		return category
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
			<div className="shop-items-error">
				<p>{error}</p>
			</div>
		);
	}

	if (items.length === 0) {
		return (
			<div className="shop-items-empty">
				<div className="empty-icon">
					<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="8" y1="12" x2="16" y2="12"></line>
					</svg>
				</div>
				<h3 className="empty-title">No items found</h3>
				<p className="empty-message">No items matched your current search criteria.</p>
				<p className="empty-suggestion">Try adjusting your filters or search terms to find what you're looking for.</p>
			</div>
		);
	}

	return (
		<div className="shop-items-grid">
			{items.map((item) => (
				<div key={item.PK} className="shop-item">
					<Link to={`/shop/${item.item_type}/${item.PK.replace('ITEM#', '')}`} className="item-link">
						<div className="item-image-container">
							<img
								src={getMainImage(item)}
								alt={item.title}
								className="item-image"
								onError={(e) => {
									e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
								}}
							/>
							<div className="item-overlay">
								<span className="view-details">View Details</span>
							</div>
						</div>
						<div className="item-info">
							<span className="item-category">{formatCategory(item.item_type)}</span>
							<h3 className="item-title">{item.title}</h3>
							<div className="item-meta">
								<span className="item-author">By {item.primary_contributor_display || 'Unknown'}</span>
								<span className="item-year">({getYearFromDateInfo(item.date_info)})</span>
							</div>
							<p className="item-description">{item.description || 'No description available'}</p>
							<span className="item-price">${item.price.toFixed(2)}</span>
						</div>
					</Link>
				</div>
			))}
		</div>
	);
};

export default ShopItems;