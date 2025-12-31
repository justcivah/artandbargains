import React, { useState, useEffect, useRef } from 'react';
import '../styles/ImageGallery.css';

const ImageGallery = ({ images, isSold = false }) => {
	const [activeImage, setActiveImage] = useState(0);
	const [isZoomed, setIsZoomed] = useState(false);
	const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
	const [isMouseOverImage, setIsMouseOverImage] = useState(false);
	const [isMouseOverArrow, setIsMouseOverArrow] = useState(false);
	const mainImageRef = useRef(null);

	// Default image if none provided
	const imageList = images && images.length > 0
		? images
		: [{ url: 'https://via.placeholder.com/600x400?text=No+Image', is_primary: true }];

	// Set the main image
	const mainImage = imageList[activeImage]?.url;

	// Calculate optimal number of columns based on image count
	const calculateColumnsPerRow = () => {
		const imageCount = imageList.length;

		// Apply the specified column rules
		let columns;
		if (imageCount <= 4) {
			columns = 2; // 1-4 images: 2 columns (bigger thumbnails)
		} else if (imageCount <= 10) {
			columns = 3; // 5-10 images: 3 columns
		} else if (imageCount <= 18) {
			columns = 4; // 11-18 images: 4 columns
		} else if (imageCount <= 28) {
			columns = 5; // 19-28 images: 5 columns
		} else {
			columns = 6; // 28+ images: 6 columns (smaller thumbnails)
		}

		// Responsive adjustments for very small screens
		if (window.innerWidth <= 576) {
			// On mobile, ensure we have at least 3 columns to keep thumbnails smaller
			columns = Math.max(columns, 3);
			// But don't exceed maximum
			columns = Math.min(columns, 6);
		}

		return columns;
	};

	const [columnsPerRow, setColumnsPerRow] = useState(calculateColumnsPerRow());

	// Update columns on window resize
	useEffect(() => {
		const updateColumns = () => {
			setColumnsPerRow(calculateColumnsPerRow());
		};

		window.addEventListener('resize', updateColumns);
		return () => window.removeEventListener('resize', updateColumns);
	}, [imageList.length]);

	// Update columns when image list changes
	useEffect(() => {
		setColumnsPerRow(calculateColumnsPerRow());
	}, [imageList.length]);

	// Handle zoom state based on mouse position
	useEffect(() => {
		if (isMouseOverImage && !isMouseOverArrow) {
			setIsZoomed(true);
		} else {
			setIsZoomed(false);
		}
	}, [isMouseOverImage, isMouseOverArrow]);

	// Scroll to main image with offset for fixed navbar
	const scrollToMainImage = () => {
		if (mainImageRef.current) {
			const navbarHeight = 80; // Adjust this based on your navbar height
			const elementPosition = mainImageRef.current.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	};

	// Handle thumbnail click
	const handleThumbnailClick = (index) => {
		setActiveImage(index);
		scrollToMainImage();
	};

	// Handle navigation arrows
	const handlePrevImage = () => {
		setActiveImage((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
	};

	const handleNextImage = () => {
		setActiveImage((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
	};

	// Handle mouse movement for zoom positioning
	const handleMouseMove = (e) => {
		if (!isZoomed) return;

		const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - left) / width) * 100;
		const y = ((e.clientY - top) / height) * 100;

		setZoomPosition({ x, y });
	};

	// Prepare thumbnails with right alignment in mind
	const renderThumbnails = () => {
		// Calculate how many thumbnails should be in the last row to ensure right alignment
		const totalThumbs = imageList.length;
		const lastRowItems = totalThumbs % columnsPerRow;

		return imageList.map((image, index) => (
			<div
				key={index}
				className={`thumbnail ${activeImage === index ? 'active' : ''}`}
				onClick={() => handleThumbnailClick(index)}
			>
				<img src={image.url} alt={`Thumbnail ${index + 1}`} />
			</div>
		));
	};

	return (
		<div className="image-gallery" ref={mainImageRef}>
			<div className={`main-image-container ${isZoomed ? 'zoomed' : ''}`}>
				<div className="image-backdrop">
					<img
						src={mainImage}
						alt="Product"
						className="main-image"
						onMouseEnter={() => setIsMouseOverImage(true)}
						onMouseLeave={() => setIsMouseOverImage(false)}
						onMouseMove={handleMouseMove}
						style={isZoomed ? {
							transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
						} : {}}
					/>
				</div>

				{/* SOLD Badge */}
				{isSold && (
					<div className="sold-badge">
						SOLD
					</div>
				)}

				{/* Navigation arrows */}
				{imageList.length > 1 && (
					<>
						<button
							className="image-nav-arrow prev"
							onClick={handlePrevImage}
							onMouseEnter={() => setIsMouseOverArrow(true)}
							onMouseLeave={() => setIsMouseOverArrow(false)}
							aria-label="Previous image"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="15 18 9 12 15 6"></polyline>
							</svg>
						</button>
						<button
							className="image-nav-arrow next"
							onClick={handleNextImage}
							onMouseEnter={() => setIsMouseOverArrow(true)}
							onMouseLeave={() => setIsMouseOverArrow(false)}
							aria-label="Next image"
						>
							<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="9 18 15 12 9 6"></polyline>
							</svg>
						</button>
					</>
				)}
			</div>

			{imageList.length > 1 && (
				<div
					className="thumbnails right-aligned"
					style={{
						'--columns': columnsPerRow
					}}
				>
					{renderThumbnails()}
				</div>
			)}
		</div>
	);
};

export default ImageGallery;