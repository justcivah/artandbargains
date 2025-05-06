import React from 'react';
import '../../styles/StepComponents.css';

const InventoryForm = ({ inventoryQuantity, onChange }) => {
	return (
		<div className="step-container">
			<h2>Inventory Information</h2>
			<p className="step-description">
				Specify the quantity of this item available in inventory.
			</p>

			<div className="form-group">
				<label htmlFor="inventoryQuantity">Quantity:</label>
				<input
					type="number"
					id="inventoryQuantity"
					value={inventoryQuantity}
					onChange={(e) => onChange(parseInt(e.target.value) || 0)}
					min="0"
					step="1"
				/>
				<small>Enter 0 if the item is out of stock</small>
			</div>

			<div className="inventory-status">
				<div className="status-label">Status:</div>
				<div className={`status-value ${inventoryQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
					{inventoryQuantity > 0 ? 'In Stock' : 'Out of Stock'}
				</div>
			</div>
		</div>
	);
};

export default InventoryForm;