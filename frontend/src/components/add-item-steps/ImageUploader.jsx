import React, { useState, useRef } from 'react';
import '../../styles/StepComponents.css';

const ImageUploader = ({ images, primaryIndex, onChange, onPrimaryChange }) => {
	const fileInputRef = useRef(null);
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState(null);

	const handleFileSelection = (files) => {
		if (!files || files.length === 0) return;

		// Check file types
		const invalidFiles = Array.from(files).filter(file => !file.type.startsWith('image/'));
		if (invalidFiles.length > 0) {
			setError('Only image files are allowed');
			return;
		}

		// Update images
		const newImages = [...images, ...files];
		onChange(newImages);

		// If this is the first image, set it as primary
		if (images.length === 0 && files.length > 0) {
			onPrimaryChange(0);
		}

		// Clear error
		setError(null);
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
				Upload images of the item. The primary image will be used as the main display image.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div
				className={`image-upload-area ${dragging ? 'dragging' : ''}`}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}
				onClick={handleFileBrowse}
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
					<p className="upload-hint">Supported formats: JPG, PNG, GIF</p>
				</div>
				<input
					type="file"
					ref={fileInputRef}
					className="file-input"
					accept="image/*"
					multiple
					onChange={handleFileInputChange}
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
									<div className="image-name">{image.name}</div>
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