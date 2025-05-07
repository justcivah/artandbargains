import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const TypeSelector = ({ itemTypes, selectedType, onChange, setItemTypes, onSelectComplete }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTypeDisplayName, setNewTypeDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleTypeSelect = (type) => {
		onChange(type);

		// Automatically go to the next step
		if (onSelectComplete) {
			onSelectComplete();
		}
	};

	const handleCreateType = async (e) => {
		e.preventDefault();

		if (!newTypeDisplayName) {
			setError('Display name is required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Generate the system name from display name
			// Convert to lowercase, replace spaces with underscores, remove special characters
			const formattedName = newTypeDisplayName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');

			// Create the new type
			const newTypeData = {
				PK: `TYPE#${formattedName}`,
				name: formattedName,
				display_name: newTypeDisplayName,
				entity_type: 'item_type'
			};

			await createEntity('itemTypes', newTypeData);

			// Update the list of types
			setItemTypes([...itemTypes, newTypeData]);

			// Select the new type
			onChange(formattedName);

			// Close the modal
			setShowCreateModal(false);
			setNewTypeDisplayName('');
		} catch (err) {
			setError('Error creating type: ' + err.message);
			console.error('Error creating type:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="step-container">
			<h2>Select Item Type</h2>
			<p className="step-description">
				Choose the type of item you want to add. Item types define the main category of the item.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="selector-grid">
				{itemTypes.map((type) => (
					<div
						key={type.PK}
						className={`selector-item ${selectedType === type.name ? 'selected' : ''}`}
						onClick={() => handleTypeSelect(type.name)}
					>
						<div className="selector-label">{type.display_name}</div>
					</div>
				))}

				<div
					className="selector-item add-new"
					onClick={() => setShowCreateModal(true)}
				>
				</div>
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Item Type</h3>
						<form onSubmit={handleCreateType}>
							<div className="form-group">
								<label htmlFor="typeDisplayName">Display Name:</label>
								<input
									type="text"
									id="typeDisplayName"
									value={newTypeDisplayName}
									onChange={(e) => setNewTypeDisplayName(e.target.value)}
									placeholder="e.g. Antique Clocks"
									autoFocus
								/>
								<small>The system name will be automatically generated</small>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={() => {
										setShowCreateModal(false);
										setNewTypeDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newTypeDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Type'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default TypeSelector;