import React, { useState } from 'react';
import '../styles/Modal.css';

const DeleteConfirmModal = ({ item, onConfirm, onCancel }) => {
	const [confirmText, setConfirmText] = useState('');

	const handleConfirm = () => {
		if (confirmText.toLowerCase() === 'confirm') {
			onConfirm();
		}
	};

	return (
		<div className="modal-overlay">
			<div className="modal-content">
				<h3>Delete Item</h3>
				<p>Are you sure you want to delete <strong>{item.title}</strong>?</p>
				<p>This action cannot be undone.</p>

				<div className="confirm-input">
					<label>Type "confirm" to delete:</label>
					<input
						type="text"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						autoFocus
					/>
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
						disabled={confirmText.toLowerCase() !== 'confirm'}
					>
						Delete
					</button>
				</div>
			</div>
		</div>
	);
};

export default DeleteConfirmModal;