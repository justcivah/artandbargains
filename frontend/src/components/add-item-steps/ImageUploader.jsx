import React, { useState, useRef } from 'react';
import '../../styles/StepComponents.css';

const ImageUploader = ({ images, primaryIndex, onChange, onPrimaryChange }) => {
	const fileInputRef = useRef(null);
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState(null);
	const [processing, setProcessing] = useState(false);

	// Process image - resize, compress, and convert to webp
	const processImage = (file) => {
		return new Promise((resolve, reject) => {
			// Create image element to load the file
			const img = new Image();
			img.onload = () => {
				// Get dimensions
				let width = img.width;
				let height = img.height;

				// Determine scale factor to resize longest side to 2000px
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

			// Update images
			const newImages = [...images, ...processedImages];
			onChange(newImages);

			// If this is the first image, set it as primary
			if (images.length === 0 && processedImages.length > 0) {
				onPrimaryChange(0);
			}
		} catch (err) {
			console.error('Image processing error:', err);
			setError('Failed to process one or more images. Please try again.');
		} finally {
			setProcessing(false);
		}
	};

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

	const handleRemoveImage = (index) => {
		const newImages = [...images];
		newImages.splice(index, 1);
		onChange(newImages);

		// Update primary index if needed
		if (primaryIndex === index) {
			onPrimaryChange(newImages.length > 0 ? 0 : -1);
		} else if (primaryIndex > index) {
			onPrimaryChange(primaryIndex - 1);
		}
	};

	const handleSetPrimary = (index) => {
		onPrimaryChange(index);
	};

	return (
		<div className="step-container">
			<h2>Item Images</h2>
			<p className="step-description">
				Upload images of the item. Images will be automatically resized, compressed, and converted to WebP format.
				The primary image will be used as the main display image.
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
					<p className="upload-hint">Images will be converted to WebP with longest side at 2000px</p>
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

			{images.length > 0 && (
				<div className="uploaded-images">
					<h3>Uploaded Images ({images.length})</h3>
					<div className="image-preview-grid">
						{images.map((image, index) => (
							<div
								key={index}
								className={`image-preview-item ${index === primaryIndex ? 'primary' : ''}`}
							>
								<div className="image-preview">
									<img src={URL.createObjectURL(image)} alt={`Preview ${index + 1}`} />
								</div>
								<div className="image-actions">
									<div className="image-name">
										{image.name}
										<span className="image-type">WebP</span>
									</div>
									<div className="image-controls">
										<label className={`primary-control ${index === primaryIndex ? 'is-primary' : ''}`}>
											<input
												type="radio"
												name="primaryImage"
												checked={index === primaryIndex}
												onChange={() => handleSetPrimary(index)}
											/>
											{index === primaryIndex ? 'Primary Image' : 'Set as Primary'}
										</label>
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