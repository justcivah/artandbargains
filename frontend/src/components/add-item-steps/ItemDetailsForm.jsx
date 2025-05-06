import React from 'react';
import '../../styles/StepComponents.css';

const ItemDetailsForm = ({
	title,
	description,
	price,
	dateInfo,
	onTitleChange,
	onDescriptionChange,
	onPriceChange,
	onDateInfoChange,
	isDateStep = false
}) => {

	// Handle date info changes
	const handleDateTypeChange = (type) => {
		onDateInfoChange({ ...dateInfo, type });
	};

	const handleDateFieldChange = (field, value) => {
		onDateInfoChange({ ...dateInfo, [field]: value });
	};

	// Basic info form (title, description, price)
	if (!isDateStep) {
		return (
			<div className="step-container">
				<h2>Item Details</h2>
				<p className="step-description">
					Enter the basic information about this item.
				</p>

				<div className="form-group">
					<label htmlFor="title">Title:</label>
					<input
						type="text"
						id="title"
						value={title}
						onChange={(e) => onTitleChange(e.target.value)}
						placeholder="e.g. Antique Map of Europe"
						autoFocus
					/>
				</div>

				<div className="form-group">
					<label htmlFor="description">Description:</label>
					<textarea
						id="description"
						value={description}
						onChange={(e) => onDescriptionChange(e.target.value)}
						placeholder="Detailed description of the item..."
						rows={5}
					/>
				</div>

				<div className="form-group">
					<label htmlFor="price">Price (in USD):</label>
					<input
						type="number"
						id="price"
						value={price}
						onChange={(e) => onPriceChange(e.target.value)}
						placeholder="0.00"
						min="0"
						step="0.01"
					/>
				</div>
			</div>
		);
	}

	// Date info form
	return (
		<div className="step-container">
			<h2>Date Information</h2>
			<p className="step-description">
				Specify when this item was created. You can choose from three different date formats.
			</p>

			<div className="date-type-selector">
				<label>Date Type:</label>
				<div className="radio-group">
					<label className="radio-label">
						<input
							type="radio"
							name="dateType"
							value="exact"
							checked={dateInfo.type === 'exact'}
							onChange={() => handleDateTypeChange('exact')}
						/>
						Exact Year
					</label>

					<label className="radio-label">
						<input
							type="radio"
							name="dateType"
							value="range"
							checked={dateInfo.type === 'range'}
							onChange={() => handleDateTypeChange('range')}
						/>
						Year Range
					</label>

					<label className="radio-label">
						<input
							type="radio"
							name="dateType"
							value="period"
							checked={dateInfo.type === 'period'}
							onChange={() => handleDateTypeChange('period')}
						/>
						Period Text
					</label>
				</div>
			</div>

			{/* Different form fields based on selected date type */}
			{dateInfo.type === 'exact' && (
				<div className="form-group">
					<label htmlFor="yearExact">Year:</label>
					<input
						type="number"
						id="yearExact"
						value={dateInfo.yearExact}
						onChange={(e) => handleDateFieldChange('yearExact', e.target.value)}
						placeholder="e.g. 1850"
					/>
				</div>
			)}

			{dateInfo.type === 'range' && (
				<>
					<div className="form-group">
						<label htmlFor="yearRangeStart">Start Year:</label>
						<input
							type="number"
							id="yearRangeStart"
							value={dateInfo.yearRangeStart}
							onChange={(e) => handleDateFieldChange('yearRangeStart', e.target.value)}
							placeholder="e.g. 1840"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="yearRangeEnd">End Year:</label>
						<input
							type="number"
							id="yearRangeEnd"
							value={dateInfo.yearRangeEnd}
							onChange={(e) => handleDateFieldChange('yearRangeEnd', e.target.value)}
							placeholder="e.g. 1860"
						/>
					</div>
				</>
			)}

			{dateInfo.type === 'period' && (
				<div className="form-group">
					<label htmlFor="periodText">Period Description:</label>
					<input
						type="text"
						id="periodText"
						value={dateInfo.periodText}
						onChange={(e) => handleDateFieldChange('periodText', e.target.value)}
						placeholder="e.g. Mid-19th century"
					/>
				</div>
			)}

			<div className="form-group">
				<label className="checkbox-label">
					<input
						type="checkbox"
						checked={dateInfo.circa}
						onChange={(e) => handleDateFieldChange('circa', e.target.checked)}
					/>
					Circa (approximate date)
				</label>
			</div>
		</div>
	);
};

export default ItemDetailsForm;