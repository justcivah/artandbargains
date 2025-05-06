import React from 'react';
import '../styles/SearchBar.css';

const SearchBar = ({ searchQuery, onSearch, placeholder }) => {
	const handleChange = (e) => {
		onSearch(e.target.value);
	};

	return (
		<div className="search-bar">
			<input
				type="text"
				placeholder={placeholder || "Search..."}
				value={searchQuery}
				onChange={handleChange}
			/>
			{searchQuery && (
				<button
					className="clear-search"
					onClick={() => onSearch('')}
				>
					✕
				</button>
			)}
		</div>
	);
};

export default SearchBar;