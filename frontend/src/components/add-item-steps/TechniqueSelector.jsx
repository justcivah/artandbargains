import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const TechniqueSelector = ({ techniques, selectedTechnique, onChange, setTechniques, onSelectComplete }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newTechniqueDisplayName, setNewTechniqueDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Filter and sort techniques based on search query
	const filteredTechniques = techniques
		.filter(technique => {
			if (!searchQuery) return true;

			const search = searchQuery.toLowerCase();
			const displayName = technique.display_name ? technique.display_name.toLowerCase() : '';
			const name = technique.name ? technique.name.toLowerCase() : '';

			return displayName.includes(search) || name.includes(search);
		})
		.sort((a, b) => {
			// Sort alphabetically by display_name
			const nameA = a.display_name || '';
			const nameB = b.display_name || '';
			return nameA.localeCompare(nameB);
		});

	const handleTechniqueSelect = (technique) => {
		if (selectedTechnique === technique) {
			// If clicking the same technique, deselect it
			onChange('');
		} else {
			// Select the new technique
			onChange(technique);
			// Automatically go to next step after selection
			if (onSelectComplete) {
				onSelectComplete();
			}
		}
	};

	const handleClearSelection = () => {
		onChange('');
	};

	const handleCreateTechnique = async (e) => {
		e.preventDefault();

		if (!newTechniqueDisplayName) {
			setError('Display name is required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Generate the system name from display name
			const formattedName = newTechniqueDisplayName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');

			// Create the new technique
			const newTechniqueData = {
				PK: `TECHNIQUE#${formattedName}`,
				name: formattedName,
				display_name: newTechniqueDisplayName,
				entity_type: 'technique'
			};

			await createEntity('techniques', newTechniqueData);

			// Update the list of techniques
			setTechniques([...techniques, newTechniqueData]);

			// Select the new technique
			onChange(formattedName);

			// Close the modal
			setShowCreateModal(false);
			setNewTechniqueDisplayName('');
		} catch (err) {
			setError('Error creating technique: ' + err.message);
			console.error('Error creating technique:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Handle going to next step
	const handleContinue = () => {
		if (onSelectComplete) {
			onSelectComplete();
		}
	};

	return (
		<div className="step-container">
			<h2>Select Technique (Optional)</h2>
			<p className="step-description">
				Choose a technique for this item, or skip this step if not applicable.
			</p>

			{error && <div className="step-error">{error}</div>}

			{/* Search input */}
			{techniques.length > 8 && (
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
							placeholder="Search techniques..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			)}

			<div className="selector-grid">
				{filteredTechniques.map((technique) => (
					<div
						key={technique.PK}
						className={`selector-item ${selectedTechnique === technique.name ? 'selected' : ''}`}
						onClick={() => handleTechniqueSelect(technique.name)}
					>
						<div className="selector-label">{technique.display_name}</div>
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
				<strong>Selected Technique: </strong>
				{!selectedTechnique ? (
					<span className="no-selection">None selected (optional)</span>
				) : (
					<>
						<span className="selected-item">
							{techniques.find(t => t.name === selectedTechnique)?.display_name || selectedTechnique}
						</span>
						<button
							className="clear-button"
							onClick={handleClearSelection}
						>
							Clear
						</button>
					</>
				)}
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Technique</h3>
						<form onSubmit={handleCreateTechnique}>
							<div className="form-group">
								<label htmlFor="techniqueDisplayName">Display Name:</label>
								<input
									type="text"
									id="techniqueDisplayName"
									value={newTechniqueDisplayName}
									onChange={(e) => setNewTechniqueDisplayName(e.target.value)}
									placeholder="e.g. Woodcut"
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
										setNewTechniqueDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newTechniqueDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Technique'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default TechniqueSelector;