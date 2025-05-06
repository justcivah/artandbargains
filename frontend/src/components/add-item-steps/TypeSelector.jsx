import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const TypeSelector = ({ itemTypes, selectedType, onChange, setItemTypes }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTypeName, setNewTypeName] = useState('');
	const [newTypeDisplayName, setNewTypeDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleTypeSelect = (type) => {
		onChange(type);
	};

	const handleCreateType = async (e) => {
		e.preventDefault();

		if (!newTypeName || !newTypeDisplayName) {
			setError('Both name and display name are required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Format the type name
			const formattedName = newTypeName.toLowerCase().replace(/\s+/g, '_');

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
			setNewTypeName('');
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
					<div className="selector-icon">+</div>
					<div className="selector-label">Add New Type</div>
				</div>
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Item Type</h3>
						<form onSubmit={handleCreateType}>
							<div className="form-group">
								<label htmlFor="typeName">Name (for system):</label>
								<input
									type="text"
									id="typeName"
									value={newTypeName}
									onChange={(e) => setNewTypeName(e.target.value)}
									placeholder="e.g. antique_clocks"
									autoFocus
								/>
								<small>Use lowercase with underscores instead of spaces</small>
							</div>

							<div className="form-group">
								<label htmlFor="typeDisplayName">Display Name:</label>
								<input
									type="text"
									id="typeDisplayName"
									value={newTypeDisplayName}
									onChange={(e) => setNewTypeDisplayName(e.target.value)}
									placeholder="e.g. Antique Clocks"
								/>
								<small>This is how the type will be displayed to users</small>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={() => {
										setShowCreateModal(false);
										setNewTypeName('');
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
									disabled={!newTypeName || !newTypeDisplayName || isSubmitting}
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