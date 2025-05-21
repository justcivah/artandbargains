import React, { useState } from 'react';
import '../styles/Modal.css';

const EditMetadataModal = ({ metadata, type, onConfirm, onCancel }) => {
	const [newDisplayName, setNewDisplayName] = useState(metadata?.display_name || '');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!newDisplayName.trim()) {
			setError('Display name cannot be empty');
			return;
		}

		if (newDisplayName === metadata.display_name) {
			onCancel();
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			await onConfirm(newDisplayName);
		} catch (err) {
			setError(`Error updating ${type}: ${err.message}`);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Get a friendly type name for display
	const getTypeName = () => {
		switch (type) {
			case 'types':
				return 'Type';
			case 'subjects':
				return 'Subject';
			case 'techniques':
				return 'Technique';
			case 'mediums':
				return 'Medium Type';
			default:
				return type.slice(0, -1);
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h2>Edit {getTypeName()}</h2>
				{error && <div className="error-message">{error}</div>}
				<form onSubmit={handleSubmit}>
					<div className="form-group">
						<label htmlFor="systemName">System Name:</label>
						<input
							type="text"
							id="systemName"
							value={metadata?.name || ''}
							disabled
						/>
						<small>System name cannot be changed</small>
					</div>
					<div className="form-group">
						<label htmlFor="displayName">Display Name:</label>
						<input
							type="text"
							id="displayName"
							value={newDisplayName}
							onChange={(e) => setNewDisplayName(e.target.value)}
							required
							autoFocus
						/>
						<small>This is how the {getTypeName().toLowerCase()} will be displayed to users</small>
					</div>

					<div className="warning-message">
						<strong>Note:</strong> Changing the display name will update it in all articles where this {getTypeName().toLowerCase()} is used.
					</div>

					<div className="modal-actions">
						<button
							type="button"
							className="cancel-button"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</button>
						<button
							type="submit"
							className="confirm-button"
							disabled={isSubmitting || !newDisplayName.trim() || newDisplayName === metadata?.display_name}
						>
							{isSubmitting ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default EditMetadataModal;