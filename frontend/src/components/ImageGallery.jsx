import React, { useState } from 'react';
import '../styles/ImageGallery.css';

const ImageGallery = ({ images }) => {
	const [activeImage, setActiveImage] = useState(0);
	const [isZoomed, setIsZoomed] = useState(false);
	const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });

	// Default image if none provided
	const imageList = images && images.length > 0
		? images
		: [{ url: 'https://via.placeholder.com/600x400?text=No+Image', is_primary: true }];

	// Set the main image
	const mainImage = imageList[activeImage]?.url;

	// Handle thumbnail click
	const handleThumbnailClick = (index) => {
		setActiveImage(index);
		setIsZoomed(false);
	};

	// Handle mouse movement for zoom positioning
	const handleMouseMove = (e) => {
		if (!isZoomed) return;

		const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - left) / width) * 100;
		const y = ((e.clientY - top) / height) * 100;

		setZoomPosition({ x, y });
	};

	return (
		<div className="image-gallery">
			<div
				className={`main-image-container ${isZoomed ? 'zoomed' : ''}`}
				onMouseEnter={() => setIsZoomed(true)}
				onMouseLeave={() => setIsZoomed(false)}
				onMouseMove={handleMouseMove}
			>
				<img
					src={mainImage}
					alt="Product"
					className="main-image"
					style={isZoomed ? {
						transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`
					} : {}}
				/>
			</div>

			{imageList.length > 1 && (
				<div className="thumbnails">
					{imageList.map((image, index) => (
						<div
							key={index}
							className={`thumbnail ${activeImage === index ? 'active' : ''}`}
							onClick={() => handleThumbnailClick(index)}
						>
							<img src={image.url} alt={`Thumbnail ${index + 1}`} />
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ImageGallery;