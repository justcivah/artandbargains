import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchRecentItems } from '../api/itemsApi';
import '../styles/RecentAdditions.css';

const RecentAdditions = () => {
	const sectionRef = useRef(null);
	const sliderRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
	const [recentItems, setRecentItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch recent items from the API
	useEffect(() => {
		const fetchRecentAdditions = async () => {
			try {
				setLoading(true);
				const data = await fetchRecentItems();

				// Transform the API response to match our component's expected format
				const transformedItems = data.map(item => ({
					id: item.PK.replace('ITEM#', ''),
					title: item.title,
					author: item.primary_contributor_display || 'Not Specified',
					year: getYearFromDateInfo(item.date_info),
					description: item.description || 'No description available',
					category: formatCategory(item.item_type),
					price: item.price,
					image: getMainImage(item),
					link: `/shop/item/${item.PK.replace('ITEM#', '')}`,
					inventoryQuantity: item.inventory_quantity || 0
				}));

				setRecentItems(transformedItems);
				setError(null);
			} catch (err) {
				console.error('Error fetching recent items:', err);
				setError('Failed to load recent items. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		fetchRecentAdditions();
	}, []);

	// Helper function to extract year from date_info
	const getYearFromDateInfo = (dateInfo) => {
		if (!dateInfo) return 'Unknown';

		if (dateInfo.type === 'exact' && dateInfo.year_exact) {
			return dateInfo.year_exact;
		} else if (dateInfo.type === 'range' && dateInfo.year_range_start) {
			return dateInfo.year_range_start;
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

	// Check if an item is out of stock
	const isOutOfStock = (item) => {
		return item.inventoryQuantity <= 0;
	};

	// Set up the intersection observer to detect when the section is visible
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
					}
				});
			},
			{ threshold: 0.1 }
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => {
			if (sectionRef.current) {
				observer.unobserve(sectionRef.current);
			}
		};
	}, []);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			setWindowWidth(width);
			setIsMobile(width <= 576);

			// Reset current index when resizing to avoid invalid indices
			setCurrentIndex(0);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Calculate total number of slides (pages) based on items per view
	const getItemsPerView = () => {
		if (windowWidth <= 576) {
			return 1;
		} else if (windowWidth <= 992) {
			return 2;
		} else {
			return 3;
		}
	};

	const itemsPerView = getItemsPerView();
	const totalSlides = Math.max(1, recentItems.length - (itemsPerView - 1));

	// Navigation functions
	const nextSlide = () => {
		setCurrentIndex((prevIndex) => {
			// Only go up to the max slide index based on dynamic itemsPerView
			const nextIndex = prevIndex >= totalSlides - 1 ? 0 : prevIndex + 1;
			return nextIndex;
		});
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => {
			const nextIndex = prevIndex === 0 ? totalSlides - 1 : prevIndex - 1;
			return nextIndex;
		});
	};

	const goToSlide = (index) => {
		setCurrentIndex(index);
	};

	// Auto-play function
	useEffect(() => {
		if (recentItems.length === 0) return;

		const interval = setInterval(() => {
			if (isVisible) {
				nextSlide();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [isVisible, currentIndex, totalSlides, recentItems]);

	// Calculate the transform position based on current index and responsive view
	const getSliderTransform = () => {
		const itemsPerView = getItemsPerView();
		// Calculate percentage to move based on the number of items in view
		return `translateX(-${currentIndex * (100 / itemsPerView)}%)`;
	};

	// Loading state
	if (loading) {
		return (
			<section
				className={`recent-additions-section ${isVisible ? 'fade-in' : ''}`}
				ref={sectionRef}
			>
				<div className="section-header">
					<h2 className="section-title">Recent Additions</h2>
					<div className="title-underline"></div>
					<p className="section-subtitle">
						Loading our newest treasures...
					</p>
				</div>
				<div className="recent-slider-container" style={{ minHeight: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
					<div className="loading-spinner"></div>
				</div>
			</section>
		);
	}

	// Error state
	if (error) {
		return (
			<section
				className={`recent-additions-section ${isVisible ? 'fade-in' : ''}`}
				ref={sectionRef}
			>
				<div className="section-header">
					<h2 className="section-title">Recent Additions</h2>
					<div className="title-underline"></div>
					<p className="section-subtitle">
						{error}
					</p>
				</div>
			</section>
		);
	}

	// Empty state
	if (recentItems.length === 0) {
		return (
			<section
				className={`recent-additions-section ${isVisible ? 'fade-in' : ''}`}
				ref={sectionRef}
			>
				<div className="section-header">
					<h2 className="section-title">Recent Additions</h2>
					<div className="title-underline"></div>
					<p className="section-subtitle">
						No recent items found. Check back soon for new additions!
					</p>
				</div>
			</section>
		);
	}

	return (
		<section
			className={`recent-additions-section ${isVisible ? 'fade-in' : ''}`}
			ref={sectionRef}
			aria-label="Recent Additions Carousel"
		>
			<div className="section-header">
				<h2 className="section-title">Recent Additions</h2>
				<div className="title-underline"></div>
				<p className="section-subtitle">
					Discover our newest treasures added to the collection
				</p>
			</div>

			<div className="recent-slider-container">
				{!isMobile && (
					<button
						className="slider-button prev"
						onClick={prevSlide}
						aria-label="Previous slide"
					>
						&#10094;
					</button>
				)}

				<div className="slider-overflow">
					<div
						className="recent-items-container"
						ref={sliderRef}
						style={{
							transform: getSliderTransform(),
						}}
					>
						{recentItems.map((item, index) => (
							<div
								key={`${item.id}-${index}`}
								className="recent-item"
							>
								<Link to={item.link} className="item-link">
									<div className="item-image-container">
										<img
											src={item.image}
											alt={item.title}
											className="item-image"
											onError={(e) => {
												e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
											}}
										/>
										<div className="item-overlay">
											<span className="view-details">View Details</span>
										</div>
										{isOutOfStock(item) && (
											<div className="out-of-stock-badge">
												Sold
											</div>
										)}
									</div>
									<div className="item-info">
										<span className="item-category">{item.category}</span>
										<h3 className="item-title">{item.title}</h3>
										<div className="item-meta">
											{item.author !== 'Not Specified' && (
												<span className="item-author">By {item.author}</span>
											)}
											<span className="item-year">({item.year})</span>
										</div>
										<p className="item-description">{item.description}</p>
										<div className="item-price-row">
											<span className="item-price">${item.price.toFixed(2)}</span>
											{isOutOfStock(item) && (
												<span className="stock-status">Sold</span>
											)}
										</div>
									</div>
								</Link>
							</div>
						))}
					</div>
				</div>

				{!isMobile && (
					<button
						className="slider-button next"
						onClick={nextSlide}
						aria-label="Next slide">
						&#10095;
					</button>
				)}
			</div>

			<div className="navigation-controls">
				{isMobile && (
					<button
						className="slider-button prev mobile"
						onClick={prevSlide}
						aria-label="Previous slide"
					>
						&#10094;
					</button>
				)}

				<div className="slider-indicators">
					{Array.from({ length: totalSlides }, (_, index) => (
						<button
							key={index}
							className={`indicator ${index === currentIndex ? 'active' : ''}`}
							onClick={() => goToSlide(index)}
							aria-label={`Go to slide ${index + 1}`}
							aria-current={index === currentIndex}
						></button>
					))}
				</div>

				{isMobile && (
					<button
						className="slider-button next mobile"
						onClick={nextSlide}
						aria-label="Next slide">
						&#10095;
					</button>
				)}
			</div>

			<div className="view-all-container">
				<Link to="/shop?sort=date_desc" className="view-all-button">
					View All New Arrivals
				</Link>
			</div>
		</section>
	);
};

export default RecentAdditions;