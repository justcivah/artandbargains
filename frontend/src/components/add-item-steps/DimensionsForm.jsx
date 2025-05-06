import React from 'react';
import '../../styles/StepComponents.css';

const DimensionsForm = ({ dimensions, unit, onChange, onUnitChange }) => {
	const handleDimensionChange = (field, value) => {
		onChange({
			...dimensions,
			[field]: value
		});
	};

	return (
		<div className="step-container">
			<h2>Item Dimensions</h2>
			<p className="step-description">
				Enter the dimensions of the item. Only fill in the fields that are relevant for this item.
			</p>

			<div className="dimensions-unit-selector">
				<label>Unit of Measurement:</label>
				<div className="radio-group">
					<label className="radio-label">
						<input
							type="radio"
							name="dimensionsUnit"
							value="cm"
							checked={unit === 'cm'}
							onChange={() => onUnitChange('cm')}
						/>
						Centimeters (cm)
					</label>

					<label className="radio-label">
						<input
							type="radio"
							name="dimensionsUnit"
							value="inches"
							checked={unit === 'inches'}
							onChange={() => onUnitChange('inches')}
						/>
						Inches (in)
					</label>
				</div>
			</div>

			<div className="dimensions-form">
				<div className="form-group">
					<label htmlFor="dimensionHeight">Height:</label>
					<div className="dimension-input-group">
						<input
							type="number"
							id="dimensionHeight"
							value={dimensions.height}
							onChange={(e) => handleDimensionChange('height', e.target.value)}
							placeholder="0"
							step="0.1"
							min="0"
						/>
						<div className="dimension-unit">{unit}</div>
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="dimensionWidth">Width:</label>
					<div className="dimension-input-group">
						<input
							type="number"
							id="dimensionWidth"
							value={dimensions.width}
							onChange={(e) => handleDimensionChange('width', e.target.value)}
							placeholder="0"
							step="0.1"
							min="0"
						/>
						<div className="dimension-unit">{unit}</div>
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="dimensionDepth">Depth:</label>
					<div className="dimension-input-group">
						<input
							type="number"
							id="dimensionDepth"
							value={dimensions.depth}
							onChange={(e) => handleDimensionChange('depth', e.target.value)}
							placeholder="0"
							step="0.1"
							min="0"
						/>
						<div className="dimension-unit">{unit}</div>
					</div>
				</div>

				<div className="form-group">
					<label htmlFor="dimensionDiameter">Diameter:</label>
					<div className="dimension-input-group">
						<input
							type="number"
							id="dimensionDiameter"
							value={dimensions.diameter}
							onChange={(e) => handleDimensionChange('diameter', e.target.value)}
							placeholder="0"
							step="0.1"
							min="0"
						/>
						<div className="dimension-unit">{unit}</div>
					</div>
				</div>
			</div>

			<div className="dimensions-preview">
				<div className="preview-label">Item Dimensions:</div>
				<div className="preview-dimensions">
					{(!dimensions.height && !dimensions.width && !dimensions.depth && !dimensions.diameter) && (
						<span className="no-dimensions">No dimensions provided</span>
					)}

					{dimensions.height && (
						<span className="dimension">Height: {dimensions.height} {unit}</span>
					)}

					{dimensions.width && (
						<span className="dimension">Width: {dimensions.width} {unit}</span>
					)}

					{dimensions.depth && (
						<span className="dimension">Depth: {dimensions.depth} {unit}</span>
					)}

					{dimensions.diameter && (
						<span className="dimension">Diameter: {dimensions.diameter} {unit}</span>
					)}
				</div>
			</div>
		</div>
	);
};

export default DimensionsForm;