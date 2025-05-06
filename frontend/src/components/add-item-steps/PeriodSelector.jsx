import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const PeriodSelector = ({ periods, selectedPeriod, onChange, setPeriods }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newPeriodName, setNewPeriodName] = useState('');
	const [newPeriodDisplayName, setNewPeriodDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handlePeriodSelect = (period) => {
		onChange(period);
	};

	const handleCreatePeriod = async (e) => {
		e.preventDefault();

		if (!newPeriodName || !newPeriodDisplayName) {
			setError('Both name and display name are required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Format the period name
			const formattedName = newPeriodName.toLowerCase().replace(/\s+/g, '_');

			// Create the new period
			const newPeriodData = {
				PK: `PERIOD#${formattedName}`,
				name: formattedName,
				display_name: newPeriodDisplayName,
				entity_type: 'period'
			};

			await createEntity('periods', newPeriodData);

			// Update the list of periods
			setPeriods([...periods, newPeriodData]);

			// Select the new period
			onChange(formattedName);

			// Close the modal
			setShowCreateModal(false);
			setNewPeriodName('');
			setNewPeriodDisplayName('');
		} catch (err) {
			setError('Error creating period: ' + err.message);
			console.error('Error creating period:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="step-container">
			<h2>Select Period</h2>
			<p className="step-description">
				Choose the historical period this item belongs to.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="selector-grid">
				{periods.map((period) => (
					<div
						key={period.PK}
						className={`selector-item ${selectedPeriod === period.name ? 'selected' : ''}`}
						onClick={() => handlePeriodSelect(period.name)}
					>
						<div className="selector-label">{period.display_name}</div>
					</div>
				))}

				<div
					className="selector-item add-new"
					onClick={() => setShowCreateModal(true)}
				>
					<div className="selector-icon">+</div>
					<div className="selector-label">Add New Period</div>
				</div>
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Period</h3>
						<form onSubmit={handleCreatePeriod}>
							<div className="form-group">
								<label htmlFor="periodName">Name (for system):</label>
								<input
									type="text"
									id="periodName"
									value={newPeriodName}
									onChange={(e) => setNewPeriodName(e.target.value)}
									placeholder="e.g. 18th_century"
									autoFocus
								/>
								<small>Use lowercase with underscores instead of spaces</small>
							</div>

							<div className="form-group">
								<label htmlFor="periodDisplayName">Display Name:</label>
								<input
									type="text"
									id="periodDisplayName"
									value={newPeriodDisplayName}
									onChange={(e) => setNewPeriodDisplayName(e.target.value)}
									placeholder="e.g. 18th Century"
								/>
								<small>This is how the period will be displayed to users</small>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={() => {
										setShowCreateModal(false);
										setNewPeriodName('');
										setNewPeriodDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newPeriodName || !newPeriodDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Period'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default PeriodSelector;