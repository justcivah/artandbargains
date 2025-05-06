import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const MediumTypeSelector = ({
	mediumTypes,
	selectedMediumTypes,
	mediumDescription,
	onChange,
	onDescriptionChange,
	setMediumTypes
}) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newMediumName, setNewMediumName] = useState('');
	const [newMediumDisplayName, setNewMediumDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleMediumSelect = (medium) => {
		// Toggle selection
		const updatedMediums = [...selectedMediumTypes];
		const index = updatedMediums.indexOf(medium);

		if (index === -1) {
			updatedMediums.push(medium);
		} else {
			updatedMediums.splice(index, 1);
		}

		onChange(updatedMediums);
	};

	const handleCreateMedium = async (e) => {
		e.preventDefault();

		if (!newMediumName || !newMediumDisplayName) {
			setError('Both name and display name are required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Format the medium name
			const formattedName = newMediumName.toLowerCase().replace(/\s+/g, '_');

			// Create the new medium
			const newMediumData = {
				PK: `MEDIUMTYPE#${formattedName}`,
				name: formattedName,
				display_name: newMediumDisplayName,
				entity_type: 'medium_type'
			};

			await createEntity('mediumTypes', newMediumData);

			// Update the list of mediums
			setMediumTypes([...mediumTypes, newMediumData]);

			// Select the new medium
			onChange([...selectedMediumTypes, formattedName]);

			// Close the modal
			setShowCreateModal(false);
			setNewMediumName('');
			setNewMediumDisplayName('');
		} catch (err) {
			setError('Error creating medium type: ' + err.message);
			console.error('Error creating medium type:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="step-container">
			<h2>Select Medium Types</h2>
			<p className="step-description">
				Choose the materials or mediums used to create this item. You can select multiple types.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="selector-grid">
				{mediumTypes.map((medium) => (
					<div
						key={medium.PK}
						className={`selector-item ${selectedMediumTypes.includes(medium.name) ? 'selected' : ''}`}
						onClick={() => handleMediumSelect(medium.name)}
					>
						<div className="selector-label">{medium.display_name}</div>
					</div>
				))}

				<div
					className="selector-item add-new"
					onClick={() => setShowCreateModal(true)}
				>
					<div className="selector-icon">+</div>
					<div className="selector-label">Add New Medium</div>
				</div>
			</div>

			<div className="selected-items">
				<strong>Selected Medium Types: </strong>
				{selectedMediumTypes.length === 0 ? (
					<span className="no-selection">None selected</span>
				) : (
					selectedMediumTypes.map((mediumName, index) => {
						const medium = mediumTypes.find(m => m.name === mediumName);
						return (
							<span key={mediumName} className="selected-item">
								{medium ? medium.display_name : mediumName}
								{index < selectedMediumTypes.length - 1 ? ', ' : ''}
							</span>
						);
					})
				)}
			</div>

			<div className="form-group">
				<label htmlFor="mediumDescription">Medium Description:</label>
				<textarea
					id="mediumDescription"
					value={mediumDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Describe the medium in more detail..."
					rows={3}
				/>
				<small>
					Example: "Watercolor on laid paper" or "Mahogany with brass fittings"
				</small>
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Medium Type</h3>
						<form onSubmit={handleCreateMedium}>
							<div className="form-group">
								<label htmlFor="mediumName">Name (for system):</label>
								<input
									type="text"
									id="mediumName"
									value={newMediumName}
									onChange={(e) => setNewMediumName(e.target.value)}
									placeholder="e.g. watercolor"
									autoFocus
								/>
								<small>Use lowercase with underscores instead of spaces</small>
							</div>

							<div className="form-group">
								<label htmlFor="mediumDisplayName">Display Name:</label>
								<input
									type="text"
									id="mediumDisplayName"
									value={newMediumDisplayName}
									onChange={(e) => setNewMediumDisplayName(e.target.value)}
									placeholder="e.g. Watercolor"
								/>
								<small>This is how the medium will be displayed to users</small>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={() => {
										setShowCreateModal(false);
										setNewMediumName('');
										setNewMediumDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newMediumName || !newMediumDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Medium Type'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default MediumTypeSelector;