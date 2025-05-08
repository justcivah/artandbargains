import React, { useState, useRef, useEffect } from 'react';
import '../../styles/StepComponents.css';

const ImageUploader = ({
	images,
	primaryIndex,
	onChange,
	onPrimaryChange,
	existingImages = [],
	onExistingImagesChange,
	onOrderChange
}) => {
	const fileInputRef = useRef(null);
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState(null);
	const [processing, setProcessing] = useState(false);

	// Combined array for the UI - this will handle all images together
	const [combinedImages, setCombinedImages] = useState([]);

	// Store created object URLs to clean up later
	const [objectUrls, setObjectUrls] = useState([]);

	// Add a state to track if we're handling our own reordering
	const [isInternalUpdate, setIsInternalUpdate] = useState(false);

	// Flag to prevent rebuilding during order changes
	const orderChangeRef = useRef(false);

	// Initialize combined array on component mount
	useEffect(() => {
		rebuildCombinedImages();
	}, []); // Run only once on mount

	// Handle incoming prop changes, but only if they're not from our own updates
	useEffect(() => {
		if (!isInternalUpdate && !orderChangeRef.current) {
			rebuildCombinedImages();
		}
		setIsInternalUpdate(false);
	}, [images, existingImages, isInternalUpdate]); // Added isInternalUpdate as dependency

	// Function to rebuild the combined images array from props
	const rebuildCombinedImages = () => {
		// Clean up any previously created object URLs to prevent memory leaks
		objectUrls.forEach(url => URL.revokeObjectURL(url));
		const newObjectUrls = [];

		// Create combined array with both existing and new images
		const combined = [
			...existingImages.map(img => ({
				type: 'existing',
				data: img,
				preview: img.url,
				id: `existing-${img.url}-${Date.now()}`
			})),
			...images.map((img, idx) => {
				const objectUrl = URL.createObjectURL(img);
				newObjectUrls.push(objectUrl);
				return {
					type: 'new',
					data: img,
					preview: objectUrl,
					id: `new-${idx}-${Date.now()}`
				};
			})
		];

		setCombinedImages(combined);
		setObjectUrls(newObjectUrls);
	};

	// Clean up object URLs on component unmount
	useEffect(() => {
		return () => {
			objectUrls.forEach(url => URL.revokeObjectURL(url));
		};
	}, [objectUrls]);

	// Process image - resize, compress, and convert to webp
	const processImage = (file) => {
		return new Promise((resolve, reject) => {
			// Create image element to load the file
			const img = new Image();
			img.onload = () => {
				// Get dimensions
				let width = img.width;
				let height = img.height;

				// Determine scale factor to resize longest side to 2048px
				const maxSize = 2048;
				let scaleFactor = 1;

				if (width > height && width > maxSize) {
					scaleFactor = maxSize / width;
				} else if (height > width && height > maxSize) {
					scaleFactor = maxSize / height;
				} else if (width === height && width > maxSize) {
					scaleFactor = maxSize / width;
				}

				// Calculate new dimensions
				const newWidth = Math.round(width * scaleFactor);
				const newHeight = Math.round(height * scaleFactor);

				// Create canvas for resizing
				const canvas = document.createElement('canvas');
				canvas.width = newWidth;
				canvas.height = newHeight;

				// Draw image on canvas with new dimensions
				const ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0, newWidth, newHeight);

				// Convert to webp with quality setting (0.8 = 80% quality, good balance)
				canvas.toBlob((blob) => {
					if (!blob) {
						reject(new Error('Canvas to Blob conversion failed'));
						return;
					}

					// Create new file from blob
					const fileName = file.name.replace(/\.[^/.]+$/, "") + '.webp';
					const processedFile = new File([blob], fileName, {
						type: 'image/webp',
						lastModified: new Date().getTime()
					});

					resolve(processedFile);
				}, 'image/webp', 0.8); // 0.8 quality provides good compression
			};

			img.onerror = () => {
				reject(new Error('Failed to load image'));
			};

			// Load image from file
			img.src = URL.createObjectURL(file);
		});
	};

	// Handle file selection for upload
	const handleFileSelection = async (files) => {
		if (!files || files.length === 0) return;

		// Check file types
		const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
		if (invalidFiles.length > 0) {
			setError('Only image files are allowed');
			return;
		}

		setProcessing(true);
		setError(null);

		try {
			// Process all images
			const processedImages = await Promise.all(
				Array.from(files).map(file => processImage(file))
			);

			// Create new object URLs for the processed images
			const newObjectUrls = [];
			const newItems = processedImages.map((img, idx) => {
				const objectUrl = URL.createObjectURL(img);
				newObjectUrls.push(objectUrl);
				return {
					type: 'new',
					data: img,
					preview: objectUrl,
					id: `new-${images.length + idx}-${Date.now()}`
				};
			});

			// Update our combined images array
			const updatedCombined = [...combinedImages, ...newItems];
			setCombinedImages(updatedCombined);

			// Add the new object URLs to our tracking array
			setObjectUrls([...objectUrls, ...newObjectUrls]);

			// Set the internal update flag
			setIsInternalUpdate(true);

			// Update the parent with the new images
			updateParentState(updatedCombined);
		} catch (err) {
			console.error('Image processing error:', err);
			setError('Failed to process one or more images. Please try again.');
		} finally {
			setProcessing(false);
		}
	};

	// Helper to update the parent state after reordering
	const updateParentState = (reorderedImages) => {
		// Set the flag to indicate we're handling our own update
		setIsInternalUpdate(true);
		orderChangeRef.current = true;

		// Extract existing and new images from the combined array
		const newExistingImages = [];
		const newUploadedImages = [];

		// Create an order array to track the final position of all images
		const imagesOrder = [];

		// First image will be primary
		let firstImageIsNew = false;
		let newImagePrimaryIndex = -1;

		reorderedImages.forEach((img, index) => {
			if (img.type === 'existing') {
				// For existing images, copy the data and update primary flag
				const isFirst = index === 0;
				newExistingImages.push({
					...img.data,
					is_primary: isFirst
				});

				// Add to order array
				imagesOrder.push({
					type: 'existing',
					url: img.data.url
				});
			} else {
				// For new images, just add the File object
				newUploadedImages.push(img.data);

				// Add to order array with current index
				imagesOrder.push({
					type: 'new',
					index: newUploadedImages.length - 1
				});

				// If this is the first image in the combined list and it's new
				if (index === 0) {
					firstImageIsNew = true;
					newImagePrimaryIndex = newUploadedImages.length - 1;
				}
			}
		});

		// Update parent state - check if callbacks exist before calling them
		if (typeof onExistingImagesChange === 'function') {
			onExistingImagesChange(newExistingImages);
		}

		if (typeof onChange === 'function') {
			onChange(newUploadedImages);
		}

		// Send the ordering information to the parent
		if (typeof onOrderChange === 'function') {
			onOrderChange(imagesOrder);
		}

		// Update primary index for new images
		if (firstImageIsNew && typeof onPrimaryChange === 'function') {
			onPrimaryChange(newImagePrimaryIndex);
		} else if (typeof onPrimaryChange === 'function') {
			onPrimaryChange(-1); // No primary among new images
		}

		// Reset the order change flag after a short delay to allow state updates to complete
		setTimeout(() => {
			orderChangeRef.current = false;
		}, 50);
	};

	// Move an image left in the order
	const handleMoveLeft = (index) => {
		if (index <= 0) return; // Can't move first image left

		orderChangeRef.current = true; // Set flag to prevent rebuild during reorder

		const reorderedImages = [...combinedImages];
		// Swap with previous
		const temp = reorderedImages[index];
		reorderedImages[index] = reorderedImages[index - 1];
		reorderedImages[index - 1] = temp;

		// Update the UI immediately
		setCombinedImages(reorderedImages);

		// Update parent state
		updateParentState(reorderedImages);
	};

	// Move an image right in the order
	const handleMoveRight = (index) => {
		if (index >= combinedImages.length - 1) return; // Can't move last image right

		orderChangeRef.current = true; // Set flag to prevent rebuild during reorder

		const reorderedImages = [...combinedImages];
		// Swap with next
		const temp = reorderedImages[index];
		reorderedImages[index] = reorderedImages[index + 1];
		reorderedImages[index + 1] = temp;

		// Update the UI immediately
		setCombinedImages(reorderedImages);

		// Update parent state
		updateParentState(reorderedImages);
	};

	// Remove an image from the list
	const handleRemoveImage = (index) => {
		orderChangeRef.current = true; // Set flag to prevent rebuild during operation

		const reorderedImages = [...combinedImages];
		reorderedImages.splice(index, 1);

		// Update the UI immediately
		setCombinedImages(reorderedImages);

		// Update parent state
		updateParentState(reorderedImages);
	};

	// UI event handlers
	const handleFileBrowse = () => {
		fileInputRef.current.click();
	};

	const handleFileInputChange = (e) => {
		handleFileSelection(e.target.files);
		// Reset file input
		e.target.value = '';
	};

	const handleDragEnter = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);

		const files = e.dataTransfer.files;
		handleFileSelection(files);
	};

	return (
		<div className="step-container">
			<h2>Item Images</h2>
			<p className="step-description">
				Upload images of the item. Images will be automatically resized, compressed, and converted to WebP format.
				The first image in order will be used as the primary image. Use the arrow buttons to reorder images.
			</p>

			{error && <div className="step-error">{error}</div>}

			{processing && (
				<div className="processing-indicator">
					<div className="spinner"></div>
					<span>Processing images...</span>
				</div>
			)}

			<div
				className={`image-upload-area ${dragging ? 'dragging' : ''} ${processing ? 'disabled' : ''}`}
				onDragEnter={!processing ? handleDragEnter : null}
				onDragLeave={!processing ? handleDragLeave : null}
				onDragOver={!processing ? handleDragOver : null}
				onDrop={!processing ? handleDrop : null}
				onClick={!processing ? handleFileBrowse : null}
			>
				<div className="upload-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
						<path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
					</svg>
				</div>
				<div className="upload-text">
					<p>Drag and drop images here, or click to browse</p>
					<p className="upload-hint">Images will be converted to WebP with longest side at 2048px</p>
				</div>
				<input
					type="file"
					ref={fileInputRef}
					className="file-input"
					accept="image/*"
					multiple
					onChange={handleFileInputChange}
					disabled={processing}
				/>
			</div>

			{combinedImages.length > 0 && (
				<div className="uploaded-images">
					<h3>All Images ({combinedImages.length})</h3>
					<div className="image-preview-grid">
						{combinedImages.map((image, index) => (
							<div
								key={image.id}
								className={`image-preview-item ${index === 0 ? 'primary' : ''}`}
							>
								<div className="image-preview">
									<img src={image.preview} alt={`Preview ${index + 1}`} />
									{image.type === 'new' && (
										<span className="image-badge new-badge">New</span>
									)}
									{index === 0 && (
										<span className="image-badge primary-badge">Primary</span>
									)}
								</div>
								<div className="image-actions">
									<div className="image-name">
										{image.type === 'existing' ? 'Existing Image' : image.data.name}
										{image.type === 'new' && <span className="image-type">WebP</span>}
									</div>
									<div className="image-controls">
										<div className="image-order-controls">
											<button
												type="button"
												className="order-button move-left"
												onClick={() => handleMoveLeft(index)}
												disabled={index === 0}
												aria-label="Move left"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											</button>
											<button
												type="button"
												className="order-button move-right"
												onClick={() => handleMoveRight(index)}
												disabled={index === combinedImages.length - 1}
												aria-label="Move right"
											>
												<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
													<path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
												</svg>
											</button>
										</div>
										<button
											type="button"
											className="remove-image"
											onClick={(e) => {
												e.stopPropagation();
												handleRemoveImage(index);
											}}
										>
											Remove
										</button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default ImageUploader;