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
	const [newMediumDisplayName, setNewMediumDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Filter and sort medium types based on search query
	const filteredMediumTypes = mediumTypes
		.filter(medium => {
			if (!searchQuery) return true;

			const search = searchQuery.toLowerCase();
			const displayName = medium.display_name ? medium.display_name.toLowerCase() : '';
			const name = medium.name ? medium.name.toLowerCase() : '';

			return displayName.includes(search) || name.includes(search);
		})
		.sort((a, b) => {
			// Sort alphabetically by display_name
			const nameA = a.display_name || '';
			const nameB = b.display_name || '';
			return nameA.localeCompare(nameB);
		});

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

		if (!newMediumDisplayName) {
			setError('Display name is required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Generate the system name from display name
			// Convert to lowercase, replace spaces with underscores, remove special characters
			const formattedName = newMediumDisplayName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');

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

			{/* Search input */}
			{mediumTypes.length > 8 && (
				<div className="filter-search">
					<div className="search-input-container">
						<span className="search-icon">
							<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<circle cx="11" cy="11" r="8"></circle>
								<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
							</svg>
						</span>
						<input
							type="text"
							placeholder="Search medium types..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			)}

			<div className="selector-grid">
				{filteredMediumTypes.map((medium) => (
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
					<div className="selector-label"></div>
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
				<label htmlFor="mediumDescription">Medium Description (optional):</label>
				<textarea
					id="mediumDescription"
					value={mediumDescription}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Describe the medium in more detail if needed..."
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
								<label htmlFor="mediumDisplayName">Display Name:</label>
								<input
									type="text"
									id="mediumDisplayName"
									value={newMediumDisplayName}
									onChange={(e) => setNewMediumDisplayName(e.target.value)}
									placeholder="e.g. Watercolor"
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
									disabled={!newMediumDisplayName || isSubmitting}
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