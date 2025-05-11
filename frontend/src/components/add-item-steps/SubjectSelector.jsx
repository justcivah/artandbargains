import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const SubjectSelector = ({ subjects, selectedSubject, onChange, setSubjects, onSelectComplete }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newSubjectDisplayName, setNewSubjectDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

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
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="selector-grid">
				{subjects.map((subject) => (
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