import React, { useState, useEffect } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const PeriodSelector = ({ periods, selectedPeriod, onChange, setPeriods, onSelectComplete}) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newPeriodName, setNewPeriodName] = useState('');
	const [newPeriodDisplayName, setNewPeriodDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [sortedPeriods, setSortedPeriods] = useState([]);

	// Sort periods in ascending chronological order
	useEffect(() => {
		if (periods && periods.length > 0) {
			const sorted = [...periods].sort((a, b) => {
				// Helper function to extract century or year from period name
				const extractTimeValue = (period) => {
					const name = period.name.toLowerCase();

					// Check for century format (e.g., "18th_century")
					const centuryMatch = name.match(/(\d+)(?:st|nd|rd|th)_century/);
					if (centuryMatch) {
						return parseInt(centuryMatch[1]) * 100; // Convert century to approximate year
					}

					// Check for decade format (e.g., "1950s")
					const decadeMatch = name.match(/(\d{4})s/);
					if (decadeMatch) {
						return parseInt(decadeMatch[1]);
					}

					// Check for year range format (e.g., "1900_1950")
					const rangeMatch = name.match(/(\d{4})_(\d{4})/);
					if (rangeMatch) {
						return parseInt(rangeMatch[1]); // Sort by start year
					}

					// Check for single year format
					const yearMatch = name.match(/\d{4}/);
					if (yearMatch) {
						return parseInt(yearMatch[0]);
					}

					// For periods that don't match any pattern, place at the beginning
					// This handles prehistoric or ancient eras like "stone_age" or "bronze_age"
					return -10000;
				};

				return extractTimeValue(a) - extractTimeValue(b);
			});

			setSortedPeriods(sorted);
		} else {
			setSortedPeriods([]);
		}
	}, [periods]);

	const handlePeriodSelect = (period) => {
		onChange(period);

		// Automatically go to the next step
		if (onSelectComplete) {
			onSelectComplete();
		}
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
				{sortedPeriods.map((period) => (
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