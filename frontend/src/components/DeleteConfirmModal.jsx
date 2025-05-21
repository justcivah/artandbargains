import React from 'react';
import '../styles/Modal.css';

const DeleteConfirmModal = ({ item, entityType, onConfirm, onCancel }) => {
	// Format the entity name for display
	const getDisplayName = () => {
		if (!item) return '';

		switch (entityType) {
			case 'item':
				return item.title || 'this item';
			case 'contributor':
				return item.display_name || 'this contributor';
			case 'types':
			case 'subjects':
			case 'techniques':
			case 'mediums':
				return item.display_name || `this ${entityType.slice(0, -1)}`;
			default:
				return 'this item';
		}
	};

	// Get a proper entity type name for display
	const getEntityTypeName = () => {
		switch (entityType) {
			case 'item':
				return 'article';
			case 'contributor':
				return 'contributor';
			case 'types':
				return 'type';
			case 'subjects':
				return 'subject';
			case 'techniques':
				return 'technique';
			case 'mediums':
				return 'medium type';
			default:
				return entityType;
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h2>Delete Confirmation</h2>
				<p>
					Are you sure you want to delete {getEntityTypeName()} <strong>"{getDisplayName()}"</strong>?
				</p>
				<p>This action cannot be undone.</p>

				<div className="modal-actions">
					<button
						className="cancel-button"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						className="delete-button"
						onClick={onConfirm}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;