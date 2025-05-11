import React, { useState } from 'react';
import '../../styles/StepComponents.css';

const DimensionsForm = ({ dimensions, onChange, onUnitChange, unit = 'cm' }) => {
	const [newPartName, setNewPartName] = useState('');
	const [showAddForm, setShowAddForm] = useState(false);

	// Get all dimension parts (excluding unit)
	const dimensionParts = Object.keys(dimensions).filter(key => key !== 'unit');

	// Handle dimension change for a specific part and field
	const handleDimensionChange = (part, field, value) => {
		const updatedDimensions = {
			...dimensions,
			[part]: {
				...dimensions[part],
				[field]: value
			}
		};
		onChange(updatedDimensions);
	};

	// Add a new dimension part
	const addDimensionPart = () => {
		if (!newPartName.trim()) return;

		const partName = newPartName.trim().toLowerCase();

		const updatedDimensions = {
			...dimensions,
			[partName]: {
				height: '',
				width: '',
				depth: '',
				diameter: ''
			}
		};

		onChange(updatedDimensions);
		setNewPartName('');
		setShowAddForm(false);
	};

	// Remove a dimension part
	const removeDimensionPart = (part) => {
		const updatedDimensions = { ...dimensions };
		delete updatedDimensions[part];
		onChange(updatedDimensions);
	};

	return (
		<div className="step-container">
			<h2>Item Dimensions</h2>
			<p className="step-description">
				Add dimensions for different parts of the item. You can add multiple dimension sets
				(e.g., "frame", "sheet", etc.) to precisely describe your item.
			</p>

			{/* Unit selector */}
			<div className="form-group dimensions-unit-selector">
				<label htmlFor="dimensionsUnit">Measurement Unit:</label>
				<select
					id="dimensionsUnit"
					value={unit}
					onChange={(e) => onUnitChange(e.target.value)}
					className="unit-select"
				>
					<option value="cm">Centimeters (cm)</option>
					<option value="mm">Millimeters (mm)</option>
				</select>
			</div>

			{/* Existing dimension parts */}
			{dimensionParts.length > 0 ? (
				dimensionParts.map((part) => (
					<div key={part} className="dimension-part">
						<div className="dimension-part-header">
							<h3 className="dimension-part-title">
								{part.charAt(0).toUpperCase() + part.slice(1)} Dimensions
							</h3>
							<button
								type="button"
								className="remove-button"
								onClick={() => removeDimensionPart(part)}
							>
								Remove
							</button>
						</div>

						<div className="dimensions-form">
							<div className="form-group">
								<label htmlFor={`${part}-height`}>Height:</label>
								<div className="dimension-input-group">
									<input
										type="number"
										id={`${part}-height`}
										value={dimensions[part].height || ''}
										onChange={(e) => handleDimensionChange(part, 'height', e.target.value)}
										placeholder="0"
										step="0.1"
										min="0"
									/>
									<div className="dimension-unit">{unit}</div>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor={`${part}-width`}>Width:</label>
								<div className="dimension-input-group">
									<input
										type="number"
										id={`${part}-width`}
										value={dimensions[part].width || ''}
										onChange={(e) => handleDimensionChange(part, 'width', e.target.value)}
										placeholder="0"
										step="0.1"
										min="0"
									/>
									<div className="dimension-unit">{unit}</div>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor={`${part}-depth`}>Depth:</label>
								<div className="dimension-input-group">
									<input
										type="number"
										id={`${part}-depth`}
										value={dimensions[part].depth || ''}
										onChange={(e) => handleDimensionChange(part, 'depth', e.target.value)}
										placeholder="0"
										step="0.1"
										min="0"
									/>
									<div className="dimension-unit">{unit}</div>
								</div>
							</div>

							<div className="form-group">
								<label htmlFor={`${part}-diameter`}>Diameter:</label>
								<div className="dimension-input-group">
									<input
										type="number"
										id={`${part}-diameter`}
										value={dimensions[part].diameter || ''}
										onChange={(e) => handleDimensionChange(part, 'diameter', e.target.value)}
										placeholder="0"
										step="0.1"
										min="0"
									/>
									<div className="dimension-unit">{unit}</div>
								</div>
							</div>
						</div>
					</div>
				))
			) : (
				<div className="no-dimensions-message">
					<p>No dimensions added yet. Click the button below to add dimensions for a specific part.</p>
				</div>
			)}

			{/* Add new dimension part form */}
			{showAddForm ? (
				<div className="add-dimension-form">
					<div className="form-group">
						<label htmlFor="newPartName">Part Name:</label>
						<input
							type="text"
							id="newPartName"
							value={newPartName}
							onChange={(e) => setNewPartName(e.target.value)}
							placeholder="e.g., Frame, Sheet, Canvas"
						/>
						<small>Enter a name for the part you want to add dimensions for</small>
					</div>

					<div className="form-actions">
						<button
							type="button"
							className="cancel-button"
							onClick={() => {
								setShowAddForm(false);
								setNewPartName('');
							}}
						>
							Cancel
						</button>
						<button
							type="button"
							className="confirm-button"
							onClick={addDimensionPart}
							disabled={!newPartName.trim()}
						>
							Add Dimension
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					className="add-dimension-button"
					onClick={() => setShowAddForm(true)}
				>
					+ Add New Dimension
				</button>
			)}

			{/* Dimensions preview */}
			{dimensionParts.length > 0 && (
				<div className="dimensions-preview">
					<div className="preview-label">Item Dimensions Summary:</div>

					{dimensionParts.map(part => {
						const partDims = dimensions[part];
						const hasDimensions = partDims.height || partDims.width || partDims.depth || partDims.diameter;

						return (
							<div key={part} className="part-dimensions">
								<h4>{part.charAt(0).toUpperCase() + part.slice(1)}:</h4>
								<div className="preview-dimensions">
									{!hasDimensions ? (
										<span className="no-dimensions">No dimensions provided</span>
									) : (
										<>
											{partDims.height && (
												<span className="dimension">Height: {partDims.height} {unit}</span>
											)}
											{partDims.width && (
												<span className="dimension">Width: {partDims.width} {unit}</span>
											)}
											{partDims.depth && (
												<span className="dimension">Depth: {partDims.depth} {unit}</span>
											)}
											{partDims.diameter && (
												<span className="dimension">Diameter: {partDims.diameter} {unit}</span>
											)}
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default DimensionsForm;