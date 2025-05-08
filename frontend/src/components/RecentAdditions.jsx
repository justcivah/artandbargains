import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/RecentAdditions.css';

const RecentAdditions = () => {
	const sectionRef = useRef(null);
	const sliderRef = useRef(null);
	const overflowRef = useRef(null);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(false);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);
	const [isDragging, setIsDragging] = useState(false);
	const [startX, setStartX] = useState(0);
	const [scrollLeft, setScrollLeft] = useState(0);

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

	// Updated to be responsive based on screen width
	const getItemsPerView = () => {
		if (windowWidth <= 576) {
			return 1; // Mobile: show 1 item
		} else if (windowWidth <= 992) {
			return 2; // Tablet: show 2 items
		} else {
			return 3; // Desktop: show 3 items
		}
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

			// Reset current index when switching between mobile and desktop
			if ((width <= 576 && !isMobile) || (width > 576 && isMobile)) {
				setCurrentIndex(0);
				// Reset scroll position when switching to mobile
				if (width <= 576 && overflowRef.current) {
					overflowRef.current.scrollLeft = 0;
				}
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [isMobile]);

	// Calculate total number of slides (pages) based on items per view
	const itemsPerView = getItemsPerView();
	const totalSlides = Math.max(1, recentItems.length - (itemsPerView - 1));

	// Navigation functions
	const nextSlide = () => {
		if (isMobile) return; // Don't use button navigation on mobile

		setCurrentIndex((prevIndex) => {
			// Only go up to the max slide index based on dynamic itemsPerView
			const nextIndex = prevIndex >= totalSlides - 1 ? 0 : prevIndex + 1;
			return nextIndex;
		});
	};

	const prevSlide = () => {
		if (isMobile) return; // Don't use button navigation on mobile

		setCurrentIndex((prevIndex) => {
			const nextIndex = prevIndex === 0 ? totalSlides - 1 : prevIndex - 1;
			return nextIndex;
		});
	};

	const goToSlide = (index) => {
		if (isMobile && overflowRef.current) {
			// On mobile, scroll to the target element
			const itemWidth = overflowRef.current.clientWidth;
			overflowRef.current.scrollTo({
				left: index * itemWidth,
				behavior: 'smooth'
			});
		} else {
			setCurrentIndex(index);
		}
	};

	// Auto-play function
	useEffect(() => {
		// Only auto-play in desktop mode
		if (isMobile) return;

		const interval = setInterval(() => {
			if (isVisible) {
				nextSlide();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [isVisible, currentIndex, totalSlides, isMobile]);

	// Calculate the transform position based on current index and responsive view
	const getSliderTransform = () => {
		if (isMobile) return 'none'; // No transform on mobile, we use native scrolling

		const itemsPerView = getItemsPerView();
		// Calculate percentage to move based on the number of items in view
		return `translateX(-${currentIndex * (100 / itemsPerView)}%)`;
	};

	// Handle scroll events for indicator sync on mobile
	const handleScroll = useCallback(() => {
		if (!isMobile || !overflowRef.current) return;

		const scrollPosition = overflowRef.current.scrollLeft;
		const itemWidth = overflowRef.current.clientWidth;
		const newIndex = Math.round(scrollPosition / itemWidth);

		if (newIndex !== currentIndex) {
			setCurrentIndex(newIndex);
		}
	}, [isMobile, currentIndex]);

	// Set up scroll event listener for mobile
	useEffect(() => {
		const slider = overflowRef.current;
		if (isMobile && slider) {
			slider.addEventListener('scroll', handleScroll);
			return () => slider.removeEventListener('scroll', handleScroll);
		}
	}, [isMobile, handleScroll]);

	// Touch handlers for mobile
	const handleMouseDown = (e) => {
		if (!isMobile || !overflowRef.current) return;

		setIsDragging(true);
		setStartX(e.pageX - overflowRef.current.offsetLeft);
		setScrollLeft(overflowRef.current.scrollLeft);
	};

	const handleTouchStart = (e) => {
		if (!isMobile || !overflowRef.current) return;

		setIsDragging(true);
		setStartX(e.touches[0].pageX - overflowRef.current.offsetLeft);
		setScrollLeft(overflowRef.current.scrollLeft);
	};

	const handleMouseUp = () => {
		setIsDragging(false);
	};

	const handleTouchEnd = () => {
		setIsDragging(false);
	};

	const handleMouseMove = (e) => {
		if (!isDragging || !isMobile || !overflowRef.current) return;

		e.preventDefault();
		const x = e.pageX - overflowRef.current.offsetLeft;
		const walk = (x - startX) * 2; // Adjust the multiplier for faster/slower scrolling
		overflowRef.current.scrollLeft = scrollLeft - walk;
	};

	const handleTouchMove = (e) => {
		if (!isDragging || !isMobile || !overflowRef.current) return;

		const x = e.touches[0].pageX - overflowRef.current.offsetLeft;
		const walk = (x - startX) * 2;
		overflowRef.current.scrollLeft = scrollLeft - walk;
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
				{/* Only render buttons on non-mobile devices */}
				{!isMobile && (
					<button
						className="slider-button prev"
						onClick={prevSlide}
						aria-label="Previous slide"
					>
						&#10094;
					</button>
				)}

				<div
					className="slider-overflow"
					ref={overflowRef}
					onMouseDown={handleMouseDown}
					onMouseUp={handleMouseUp}
					onMouseLeave={handleMouseUp}
					onMouseMove={handleMouseMove}
					onTouchStart={handleTouchStart}
					onTouchEnd={handleTouchEnd}
					onTouchMove={handleTouchMove}
				>
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

				{/* Only render buttons on non-mobile devices */}
				{!isMobile && (
					<button
						className="slider-button next"
						onClick={nextSlide}
						aria-label="Next slide">
						&#10095;
					</button>
				)}
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