import React, { useState } from 'react';
import '../styles/Modal.css';

const DeleteConfirmModal = ({ item, entityType = 'item', onConfirm, onCancel }) => {
	const [confirmText, setConfirmText] = useState('');
	const [error, setError] = useState('');

	if (!item) return null;

	const isContributor = entityType === 'contributor';
	const itemName = isContributor
		? item.display_name
		: item.title;

	const confirmationWord = 'DELETE';

	const confirmTextMatches = confirmText === confirmationWord;

	const handleConfirm = () => {
		if (confirmText !== confirmationWord) {
			setError(`Please type "${confirmationWord}" to confirm deletion.`);
			return;
		}
		onConfirm();
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h3>Confirm Deletion</h3>

				<p>
					Are you sure you want to delete the {isContributor ? 'contributor' : 'item'}:
					<strong> {itemName}</strong>?
				</p>

				{isContributor && (
					<div className="warning-message">
						<p><strong>Warning:</strong> Deleting a contributor will remove them from all associated items.
							This action can only be completed if the contributor is not used as a primary contributor for any items.</p>
					</div>
				)}

				<div className="confirm-input">
					<label>
						Type <strong>{confirmationWord}</strong> to confirm:
					</label>
					<input
						type="text"
						value={confirmText}
						onChange={(e) => {
							setConfirmText(e.target.value);
							setError('');
						}}
						autoFocus
					/>
					{error && <div className="error-message">{error}</div>}
				</div>

				<div className="modal-actions">
					<button
						className="cancel-button"
						onClick={onCancel}
					>
						Cancel
					</button>
					<button
						className="confirm-button"
						onClick={handleConfirm}
						disabled={!confirmTextMatches}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;