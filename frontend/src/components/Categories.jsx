import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Categories.css';

const Categories = () => {
	const sectionRef = useRef(null);
	const sliderRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

	const categories = [
		{
			id: 1,
			title: 'Prints',
			description: 'Unique artistic prints from renowned and emerging artists',
			image: '/images/prints.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=print',
		},
		{
			id: 2,
			title: 'Porcelain',
			description: 'Exquisite porcelain pieces with timeless craftsmanship',
			image: '/images/porcelains.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=porcelain',
		},
		{
			id: 3,
			title: 'Vintage Furnishings',
			description: 'Classic furniture pieces with character and history',
			image: '/images/vintage-furnishing.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=vintage_furnishing',
		},
		{
			id: 4,
			title: 'Japanese Woodblock Prints',
			description: 'Authentic and elegant ukiyo-e–inspired woodblock prints',
			image: '/images/japanese-woodblock-print.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=japanese_woodblock_prints',
		},
		{
			id: 5,
			title: 'Posters',
			description: 'Artistic posters curated for style, inspiration, and visual impact',
			image: '/images/posters.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=poster',
		},
		{
			id: 6,
			title: 'Ornaments',
			description: 'Decorative ornaments curated for craftsmanship and charm',
			image: '/images/ornaments.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=ornaments',
		},
		{
			id: 7,
			title: 'Lighting',
			description: 'Statement lamps and lighting with refined details',
			image: '/images/lighting.webp',
			link: '/shop?sort=date_desc&page=1&limit=24&types=lighting',
		},
	];

	// Set up the intersection observer
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
			setCurrentIndex(0);
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Calculate items per view
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
	const totalSlides = Math.max(1, categories.length - (itemsPerView - 1));

	// Navigation functions
	const nextSlide = () => {
		setCurrentIndex((prevIndex) => {
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
		if (categories.length === 0) return;

		const interval = setInterval(() => {
			if (isVisible) {
				nextSlide();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [isVisible, currentIndex, totalSlides]);

	// Calculate the transform position
	const getSliderTransform = () => {
		const itemsPerView = getItemsPerView();
		return `translateX(-${currentIndex * (100 / itemsPerView)}%)`;
	};

	return (
		<section
			className={`categories-section ${isVisible ? 'fade-in' : ''}`}
			ref={sectionRef}
			aria-label="Categories Carousel"
		>
			<div className="section-header">
				<h2 className="section-title">Our Collections</h2>
				<div className="title-underline"></div>
				<p className="section-subtitle">
					Explore our curated categories of fine art and antiques
				</p>
			</div>

			<div className="categories-slider-container">
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
						className="categories-container"
						ref={sliderRef}
						style={{
							transform: getSliderTransform(),
						}}
					>
						{categories.map((category) => (
							<div key={category.id} className="category-card">
								<Link to={category.link} className="category-image-link">
									<div className="category-image-container">
										<img
											src={category.image}
											alt={category.title}
											className="category-image"
											onError={(e) => {
												e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
											}}
										/>
										<div className="category-image-overlay"></div>
									</div>
								</Link>
								<div className="category-content">
									<Link to={category.link} className="category-title-link">
										<h3 className="category-title">{category.title}</h3>
									</Link>
									<p className="category-description">{category.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{!isMobile && (
					<button
						className="slider-button next"
						onClick={nextSlide}
						aria-label="Next slide"
					>
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
						aria-label="Next slide"
					>
						&#10095;
					</button>
				)}
			</div>
		</section>
	);
};

export default Categories;