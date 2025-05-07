import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const CategorySelector = ({ categories, selectedCategories, onChange, setCategories }) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [newCategoryDisplayName, setNewCategoryDisplayName] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleCategorySelect = (category) => {
		// Toggle category selection
		const updatedCategories = [...selectedCategories];
		const index = updatedCategories.indexOf(category);

		if (index === -1) {
			updatedCategories.push(category);
		} else {
			updatedCategories.splice(index, 1);
		}

		onChange(updatedCategories);
	};

	const handleCreateCategory = async (e) => {
		e.preventDefault();

		if (!newCategoryDisplayName) {
			setError('Display name is required');
			return;
		}

		try {
			setIsSubmitting(true);
			setError(null);

			// Generate the system name from display name
			// Convert to lowercase, replace spaces with underscores, remove special characters
			const formattedName = newCategoryDisplayName
				.toLowerCase()
				.replace(/\s+/g, '_')
				.replace(/[^a-z0-9_]/g, '');

			// Create the new category
			const newCategoryData = {
				PK: `CATEGORY#${formattedName}`,
				name: formattedName,
				display_name: newCategoryDisplayName,
				entity_type: 'category'
			};

			await createEntity('categories', newCategoryData);

			// Update the list of categories
			setCategories([...categories, newCategoryData]);

			// Select the new category
			const updatedCategories = [...selectedCategories, formattedName];
			onChange(updatedCategories);

			// Close the modal
			setShowCreateModal(false);
			setNewCategoryDisplayName('');
		} catch (err) {
			setError('Error creating category: ' + err.message);
			console.error('Error creating category:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="step-container">
			<h2>Select Categories</h2>
			<p className="step-description">
				Choose one or more categories for this item. You can select multiple categories.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="selector-grid">
				{categories.map((category) => (
					<div
						key={category.PK}
						className={`selector-item ${selectedCategories.includes(category.name) ? 'selected' : ''}`}
						onClick={() => handleCategorySelect(category.name)}
					>
						<div className="selector-label">{category.display_name}</div>
					</div>
				))}

				<div
					className="selector-item add-new"
					onClick={() => setShowCreateModal(true)}
				>
				</div>
			</div>

			<div className="selected-items">
				<strong>Selected Categories: </strong>
				{selectedCategories.length === 0 ? (
					<span className="no-selection">None selected</span>
				) : (
					selectedCategories.map((categoryName, index) => {
						const category = categories.find(c => c.name === categoryName);
						return (
							<span key={categoryName} className="selected-item">
								{category ? category.display_name : categoryName}
								{index < selectedCategories.length - 1 ? ', ' : ''}
							</span>
						);
					})
				)}
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content">
						<h3>Create New Category</h3>
						<form onSubmit={handleCreateCategory}>
							<div className="form-group">
								<label htmlFor="categoryDisplayName">Display Name:</label>
								<input
									type="text"
									id="categoryDisplayName"
									value={newCategoryDisplayName}
									onChange={(e) => setNewCategoryDisplayName(e.target.value)}
									placeholder="e.g. Japanese Woodblock"
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
										setNewCategoryDisplayName('');
										setError(null);
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={!newCategoryDisplayName || isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Category'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default CategorySelector;