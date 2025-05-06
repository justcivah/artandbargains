import React from 'react';
import '../../styles/StepIndicator.css';

const StepIndicator = ({ currentStep, totalSteps }) => {
	const stepLabels = [
		'Item Type',
		'Categories',
		'Basic Info',
		'Date Info',
		'Contributors',
		'Period',
		'Inventory',
		'Medium',
		'Dimensions',
		'Condition',
		'Images'
	];

	return (
		<div className="step-indicator">
			<div className="step-progress">
				<div
					className="step-progress-bar"
					style={{ width: `${(currentStep / totalSteps) * 100}%` }}
				></div>
			</div>

			<div className="step-info">
				<div className="step-count">
					Step {currentStep} of {totalSteps}
				</div>
				<div className="step-label">
					{stepLabels[currentStep - 1]}
				</div>
			</div>
		</div>
	);
};

export default StepIndicator;