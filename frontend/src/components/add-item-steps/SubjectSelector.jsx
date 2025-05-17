import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const SubjectSelector = ({ subjects, selectedSubject, onChange, setSubjects, onSelectComplete, selectedItemType }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newSubjectDisplayName, setNewSubjectDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Define subject filtering rules based on item type
	const getFilteredSubjectsByType = (subjects, itemType) => {
		if (!itemType) return subjects;

		const filterRules = {
			'porcelain': ['tableware', 'statue', 'lamp', 'ceramic_decor'],
			'print': ['abstract_art', 'animals', 'landscape', 'manuscripts', 'maps',
				'people', 'photograph', 'ships', 'still_life', 'structures', 'poster'],
			'vintage_furnishing': ['chair', 'hallway_furniture', 'lamp', 'sofa', 'statue']
		};

		// If we have filter rules for this item type, apply them
		if (filterRules[itemType]) {
			return subjects.filter(subject => filterRules[itemType].includes(subject.name));
		}

		// If no specific rules for this type, return all subjects
		return subjects;
	};

	// First filter by item type, then by search query
	const typeFilteredSubjects = getFilteredSubjectsByType(subjects, selectedItemType);

	// Filter and sort subjects based on search query
	const filteredSubjects = typeFilteredSubjects
		.filter(subject => {
			if (!searchQuery) return true;

			const search = searchQuery.toLowerCase();
			const displayName = subject.display_name ? subject.display_name.toLowerCase() : '';
			const name = subject.name ? subject.name.toLowerCase() : '';

			return displayName.includes(search) || name.includes(search);
		})
		.sort((a, b) => {
			// Sort alphabetically by display_name
			const nameA = a.display_name || '';
			const nameB = b.display_name || '';
			return nameA.localeCompare(nameB);
		});

	const handleSubjectSelect = (subject) => {
		// Set the selected subject directly (only one allowed)
		onChange(subject);

		// Automatically go to the next step
		if (onSelectComplete) {
			onSelectComplete();
		}
	};

	const handleCreateSubject = async (e) => {
		e.preventDefault();

		if (!newSubjectDisplayName) {
			setError('Display name is required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Generate the system name from display name
			// Convert to lowercase, replace spaces with underscores, remove special characters
			const formattedName = newSubjectDisplayName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');

			// Create the new subject
			const newSubjectData = {
				PK: `SUBJECT#${formattedName}`,
				name: formattedName,
				display_name: newSubjectDisplayName,
				entity_type: 'subject'
			};

			await createEntity('subjects', newSubjectData);

			// Update the list of subjects
			setSubjects([...subjects, newSubjectData]);

			// Select the new subject
			onChange(formattedName);

			// Close the modal
			setShowCreateModal(false);
			setNewSubjectDisplayName('');
		} catch (err) {
			setError('Error creating subject: ' + err.message);
			console.error('Error creating subject:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="step-container">
			<h2>Select Subject</h2>
			<p className="step-description">
				Choose a subject for this item.
				{selectedItemType && <span className="filtered-notice"> (Options filtered based on the selected item type)</span>}
			</p>

			{error && <div className="step-error">{error}</div>}

			{/* Search input */}
			{typeFilteredSubjects.length > 8 && (
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
							placeholder="Search subjects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>
				</div>
			)}

			{filteredSubjects.length === 0 && (
				<div className="no-results">
					No subjects match the current filters.
					{searchQuery && <span> Try adjusting your search terms.</span>}
				</div>
			)}

			<div className="selector-grid">
				{filteredSubjects.map((subject) => (
					<div
						key={subject.PK}
						className={`selector-item ${selectedSubject === subject.name ? 'selected' : ''}`}
						onClick={() => handleSubjectSelect(subject.name)}
					>
						<div className="selector-label">{subject.display_name}</div>
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
				<strong>Selected Subject: </strong>
				{!selectedSubject ? (
					<span className="no-selection">None selected</span>
				) : (
					<span className="selected-item">
						{subjects.find(s => s.name === selectedSubject)?.display_name || selectedSubject}
					</span>
				)}
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Subject</h3>
						<form onSubmit={handleCreateSubject}>
							<div className="form-group">
								<label htmlFor="subjectDisplayName">Display Name:</label>
								<input
									type="text"
									id="subjectDisplayName"
									value={newSubjectDisplayName}
									onChange={(e) => setNewSubjectDisplayName(e.target.value)}
									placeholder="e.g. Landscape"
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
										setNewSubjectDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newSubjectDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Subject'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default SubjectSelector;