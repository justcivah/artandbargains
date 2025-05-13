import React from 'react';
import '../../styles/StepComponents.css';

// Hardcoded condition types
const LOCAL_CONDITION_TYPES = [
	{
		name: 'like_new',
		display_name: 'Like New',
		PK: 'CONDITIONTYPE#like_new',
		entity_type: 'condition_type'
	},
	{
		name: 'excellent',
		display_name: 'Excellent',
		PK: 'CONDITIONTYPE#excellent',
		entity_type: 'condition_type'
	},
	{
		name: 'very_good',
		display_name: 'Very Good',
		PK: 'CONDITIONTYPE#very_good',
		entity_type: 'condition_type'
	},
	{
		name: 'good',
		display_name: 'Good',
		PK: 'CONDITIONTYPE#good',
		entity_type: 'condition_type'
	},
	{
		name: 'poor',
		display_name: 'Poor',
		PK: 'CONDITIONTYPE#poor',
		entity_type: 'condition_type'
	},
	{
		name: 'damaged',
		display_name: 'Damaged',
		PK: 'CONDITIONTYPE#damaged',
		entity_type: 'condition_type'
	}
];

const ConditionTypeSelector = ({
	selectedConditionType,
	conditionDescription,
	onChange,
	onDescriptionChange
}) => {
	const handleConditionSelect = (condition) => {
		onChange(condition);
	};

	return (
		<div className="step-container">
			<h2>Item Condition</h2>
			<p className="step-description">
				Select the condition of this item and provide any additional details about its condition.
			</p>

			<div className="selector-grid">
				{LOCAL_CONDITION_TYPES.map((condition) => (
					<div
						key={condition.PK}
						className={`selector-item ${selectedConditionType === condition.name ? 'selected' : ''}`}
						onClick={() => handleConditionSelect(condition.name)}
					>
						<div className="selector-label">{condition.display_name}</div>
					</div>
				))}
			</div>

			<div className="form-group">
				<label htmlFor="conditionDescription">Condition Details (optional):</label>
				<textarea
					id="conditionDescription"
					value={conditionDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Add any additional details about the condition if needed..."
					rows={3}
				/>
				<small>
					Example: "Minor scratches on the base" or "Colors remain vibrant and fresh"
				</small>
			</div>
		</div>
	);
};

export default ConditionTypeSelector;