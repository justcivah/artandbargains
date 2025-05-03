import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/RecentAdditions.css';

const RecentAdditions = () => {
	const sectionRef = useRef(null);
	const sliderRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// Updated data structure with title, author, year, description and using actual image URLs
	const recentItems = [
		{
			id: 1,
			title: 'Abstract Geometric Print',
			author: 'Sarah Johnson',
			year: 2023,
			description: 'A modern interpretation of geometric patterns with vibrant color palettes that create depth and movement.',
			category: 'Prints',
			price: 189.99,
			image: 'https://images.desenio.com/zoom/17414_1.jpg',
			link: '/shop/prints/abstract-geometric'
		},
		{
			id: 2,
			title: 'Vintage Blue Porcelain Vase',
			author: 'Ming Dynasty Collection',
			year: 1657,
			description: 'An exquisite reproduction of traditional blue porcelain with intricate hand-painted details.',
			category: 'Porcelain',
			price: 249.99,
			image: 'https://image.made-in-china.com/155f0j00utWoEzIGTebp/Wholesale-Vintage-Chinese-Style-Home-Decor-Blue-and-White-Porcelain-Ceramic-Vase.webp',
			link: '/shop/porcelain/blue-vase'
		},
		{
			id: 3,
			title: 'Mid-century Side Table',
			author: 'Charles Eames',
			year: 1952,
			description: 'Authentic mid-century design featuring walnut veneer and tapered legs with brass accents.',
			category: 'Furnishings',
			price: 399.99,
			image: 'https://images.artfulhome.com/item_images/Additional/P/7901-8000/7918/eventh/7cf0e8a9-8caf-4e83-a5bb-9795be9769e5_262111_event_h.jpg',
			link: '/shop/furnishings/mid-century-table'
		},
		{
			id: 4,
			title: 'Botanical Illustration',
			author: 'Emma Blackwell',
			year: 2021,
			description: 'Detailed botanical prints featuring native flora with scientifically accurate renderings.',
			category: 'Prints',
			price: 159.99,
			image: 'https://artandbargains.com/wp-content/uploads/2020/08/Aconit-Napel-Phytographie-Medicale-by-Joseph-Roques-1821.jpg',
			link: '/shop/prints/botanical'
		},
		{
			id: 5,
			title: 'Art Deco Tea Set',
			author: 'Clarice Cliff',
			year: 1934,
			description: 'A complete tea service for four featuring geometric patterns and gold accents in classic Art Deco style.',
			category: 'Porcelain',
			price: 329.99,
			image: 'https://i.etsystatic.com/21435935/r/il/4e8130/2817245925/il_1588xN.2817245925_g7r5.jpg',
			link: '/shop/porcelain/art-deco-tea-set'
		}
	];

	// Always show 3 items regardless of screen size as requested
	const getItemsPerView = () => {
		return 3; // Always show 3 items
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
			setWindowWidth(window.innerWidth);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Calculate total number of slides (pages)
	const totalSlides = Math.max(1, recentItems.length - 2);

	// Navigation functions
	const nextSlide = () => {
		setCurrentIndex((prevIndex) => {
			// Only go up to the max slide index (items.length - 3) to ensure 3 items always visible
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
		const interval = setInterval(() => {
			if (isVisible) {
				nextSlide();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [isVisible, currentIndex]);

	// Calculate the transform position based on current index
	const getSliderTransform = () => {
		const itemsPerView = getItemsPerView();
		// Calculate percentage to move based on the number of items in view
		// We're shifting by 1 item at a time rather than by itemsPerView
		return `translateX(-${currentIndex * (100 / itemsPerView)}%)`;
	};

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
				<button
					className="slider-button prev"
					onClick={prevSlide}
					aria-label="Previous slide"
				>
					&#10094;
				</button>

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
									</div>
									<div className="item-info">
										<span className="item-category">{item.category}</span>
										<h3 className="item-title">{item.title}</h3>
										<div className="item-meta">
											<span className="item-author">By {item.author}</span>
											<span className="item-year">({item.year})</span>
										</div>
										<p className="item-description">{item.description}</p>
										<span className="item-price">${item.price.toFixed(2)}</span>
									</div>
								</Link>
							</div>
						))}
					</div>
				</div>

				<button
					className="slider-button next"
					onClick={nextSlide}
					aria-label="Next slide">
					&#10095;
				</button>
			</div>

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

			<div className="view-all-container">
				<Link to="/shop/new-arrivals" className="view-all-button">
					View All New Arrivals
				</Link>
			</div>
		</section>
	);
};

export default RecentAdditions;