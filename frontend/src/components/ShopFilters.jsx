import React, { useState, useEffect } from 'react';
import '../styles/ShopFilters.css';

const ShopFilters = ({
	itemTypes,
	categories,
	periods,
	mediumTypes,
	conditionTypes,
	contributors,
	selectedFilters,
	onFilterChange,
	onResetFilters
}) => {
	const [expanded, setExpanded] = useState(true);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// State for expanded filters sections
	const [expandedSections, setExpandedSections] = useState({
		type: true,
		category: true,
		period: true,
		contributor: true,
		mediumType: true,
		condition: true,
		price: true
	});

	// State for search inputs in filter sections
	const [filterSearches, setFilterSearches] = useState({
		type: '',
		category: '',
		period: '',
		contributor: '',
		mediumType: '',
		condition: ''
	});

	// State for showing all items in a filter section
	const [showAll, setShowAll] = useState({
		type: false,
		category: false,
		period: false,
		contributor: false,
		mediumType: false,
		condition: false
	});

	// Track window resize for responsive behavior
	useEffect(() => {
		const handleResize = () => {
			const width = window.innerWidth;
			setWindowWidth(width);

			// Auto-collapse on mobile/tablet, expand on desktop
			if (width <= 992) {
				setExpanded(false);
			} else {
				setExpanded(true);
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize(); // Call once on mount

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Toggle a filter section
	const toggleSection = (section) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	// Toggle showing all items in a filter section
	const toggleShowAll = (section) => {
		setShowAll(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	// Update filter search
	const handleFilterSearch = (section, value) => {
		setFilterSearches(prev => ({
			...prev,
			[section]: value
		}));
	};

	// Filter items based on search
	const filterItems = (items, section) => {
		if (!filterSearches[section]) return items;

		const search = filterSearches[section].toLowerCase();
		return items.filter(item => {
			const displayName = item.display_name ? item.display_name.toLowerCase() : '';
			const name = item.name ? item.name.toLowerCase() : '';

			return displayName.includes(search) || name.includes(search);
		});
	};

	// Limit items shown unless "show all" is enabled
	const getLimitedItems = (items, section) => {
		const filtered = filterItems(items, section);

		if (showAll[section] || filtered.length <= 8 || filterSearches[section]) {
			return filtered;
		}

		return filtered.slice(0, 8);
	};

	return (
		<aside className={`shop-filters ${expanded ? 'expanded' : 'collapsed'}`}>
			<div className="filters-header">
				<h2>Filters</h2>
				<button
					className="toggle-filters-btn"
					onClick={() => setExpanded(!expanded)}
					aria-label={expanded ? 'Collapse filters' : 'Expand filters'}
				>
					{expanded ? '−' : '+'}
				</button>
			</div>

			{expanded && (
				<div className="filters-content">
					<div className="search-filter">
						<div className="search-input-container">
							<span className="search-icon">
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<circle cx="11" cy="11" r="8"></circle>
									<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
								</svg>
							</span>
							<input
								type="text"
								placeholder="Search items..."
								value={selectedFilters.search}
								onChange={(e) => onFilterChange('search', e.target.value)}
								className="search-input"
							/>
						</div>
					</div>

					{/* Price Range Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('price')}
						>
							<h3>Price Range</h3>
							<span className={`toggle-icon ${expandedSections.price ? 'open' : 'closed'}`}>
								{expandedSections.price ? '−' : '+'}
							</span>
						</div>

						{expandedSections.price && (
							<div className="filter-body">
								<div className="price-range">
									<div className="price-input">
										<label htmlFor="min-price">Min $</label>
										<input
											type="number"
											id="min-price"
											min="0"
											value={selectedFilters.minPrice}
											onChange={(e) => onFilterChange('minPrice', e.target.value)}
										/>
									</div>
									<div className="price-input">
										<label htmlFor="max-price">Max $</label>
										<input
											type="number"
											id="max-price"
											min="0"
											value={selectedFilters.maxPrice}
											onChange={(e) => onFilterChange('maxPrice', e.target.value)}
										/>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Item Type Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('type')}
						>
							<h3>Item Type</h3>
							<span className={`toggle-icon ${expandedSections.type ? 'open' : 'closed'}`}>
								{expandedSections.type ? '−' : '+'}
							</span>
						</div>

						{expandedSections.type && (
							<div className="filter-body">
								{itemTypes.length > 8 && (
									<div className="filter-search">
										<div className="search-input-container">
											<span className="search-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<circle cx="11" cy="11" r="8"></circle>
													<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
												</svg>
											</span>
											<input
												type="text"
												placeholder="Search types..."
												value={filterSearches.type}
												onChange={(e) => handleFilterSearch('type', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(itemTypes, 'type').map((type) => (
										<div key={type.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.types.includes(type.name)}
													onChange={() => onFilterChange('types', type.name)}
												/>
												<span className="option-name">{type.display_name}</span>
												{/* <span className="option-count">(42)</span> */}
											</label>
										</div>
									))}
								</div>

								{itemTypes.length > 8 && !filterSearches.type && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('type')}
									>
										{showAll.type ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Categories Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('category')}
						>
							<h3>Categories</h3>
							<span className={`toggle-icon ${expandedSections.category ? 'open' : 'closed'}`}>
								{expandedSections.category ? '−' : '+'}
							</span>
						</div>

						{expandedSections.category && (
							<div className="filter-body">
								{categories.length > 8 && (
									<div className="filter-search">
										<div className="search-input-container">
											<span className="search-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<circle cx="11" cy="11" r="8"></circle>
													<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
												</svg>
											</span>
											<input
												type="text"
												placeholder="Search categories..."
												value={filterSearches.category}
												onChange={(e) => handleFilterSearch('category', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(categories, 'category').map((category) => (
										<div key={category.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.categories.includes(category.name)}
													onChange={() => onFilterChange('categories', category.name)}
												/>
												<span className="option-name">{category.display_name}</span>
												{/* <span className="option-count">(23)</span> */}
											</label>
										</div>
									))}
								</div>

								{categories.length > 8 && !filterSearches.category && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('category')}
									>
										{showAll.category ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Periods Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('period')}
						>
							<h3>Period</h3>
							<span className={`toggle-icon ${expandedSections.period ? 'open' : 'closed'}`}>
								{expandedSections.period ? '−' : '+'}
							</span>
						</div>

						{expandedSections.period && (
							<div className="filter-body">
								{periods.length > 8 && (
									<div className="filter-search">
										<div className="search-input-container">
											<span className="search-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<circle cx="11" cy="11" r="8"></circle>
													<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
												</svg>
											</span>
											<input
												type="text"
												placeholder="Search periods..."
												value={filterSearches.period}
												onChange={(e) => handleFilterSearch('period', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(periods, 'period').map((period) => (
										<div key={period.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.periods.includes(period.name)}
													onChange={() => onFilterChange('periods', period.name)}
												/>
												<span className="option-name">{period.display_name}</span>
												{/* <span className="option-count">(15)</span> */}
											</label>
										</div>
									))}
								</div>

								{periods.length > 8 && !filterSearches.period && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('period')}
									>
										{showAll.period ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Contributors Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('contributor')}
						>
							<h3>Authors</h3>
							<span className={`toggle-icon ${expandedSections.contributor ? 'open' : 'closed'}`}>
								{expandedSections.contributor ? '−' : '+'}
							</span>
						</div>

						{expandedSections.contributor && (
							<div className="filter-body">
								{contributors.length > 8 && (
									<div className="filter-search">
										<div className="search-input-container">
											<span className="search-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<circle cx="11" cy="11" r="8"></circle>
													<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
												</svg>
											</span>
											<input
												type="text"
												placeholder="Search authors..."
												value={filterSearches.contributor}
												onChange={(e) => handleFilterSearch('contributor', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(contributors, 'contributor').map((contributor) => (
										<div key={contributor.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.contributors.includes(contributor.name)}
													onChange={() => onFilterChange('contributors', contributor.name)}
												/>
												<span className="option-name">{contributor.display_name}</span>
												{/* <span className="option-count">(8)</span> */}
											</label>
										</div>
									))}
								</div>

								{contributors.length > 8 && !filterSearches.contributor && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('contributor')}
									>
										{showAll.contributor ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Medium Types Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('mediumType')}
						>
							<h3>Medium</h3>
							<span className={`toggle-icon ${expandedSections.mediumType ? 'open' : 'closed'}`}>
								{expandedSections.mediumType ? '−' : '+'}
							</span>
						</div>

						{expandedSections.mediumType && (
							<div className="filter-body">
								{mediumTypes.length > 8 && (
									<div className="filter-search">
										<div className="search-input-container">
											<span className="search-icon">
												<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<circle cx="11" cy="11" r="8"></circle>
													<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
												</svg>
											</span>
											<input
												type="text"
												placeholder="Search mediums..."
												value={filterSearches.mediumType}
												onChange={(e) => handleFilterSearch('mediumType', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(mediumTypes, 'mediumType').map((mediumType) => (
										<div key={mediumType.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.mediumTypes.includes(mediumType.name)}
													onChange={() => onFilterChange('mediumTypes', mediumType.name)}
												/>
												<span className="option-name">{mediumType.display_name}</span>
												{/* <span className="option-count">(12)</span> */}
											</label>
										</div>
									))}
								</div>

								{mediumTypes.length > 8 && !filterSearches.mediumType && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('mediumType')}
									>
										{showAll.mediumType ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Condition Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('condition')}
						>
							<h3>Condition</h3>
							<span className={`toggle-icon ${expandedSections.condition ? 'open' : 'closed'}`}>
								{expandedSections.condition ? '−' : '+'}
							</span>
						</div>

						{expandedSections.condition && (
							<div className="filter-body">
								<div className="filter-options">
									{conditionTypes.map((condition) => (
										<div key={condition.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.conditions.includes(condition.name)}
													onChange={() => onFilterChange('conditions', condition.name)}
												/>
												<span className="option-name">{condition.display_name}</span>
												{/* <span className="option-count">(19)</span> */}
											</label>
										</div>
									))}
								</div>
							</div>
						)}
					</div>

					<button
						className="reset-filters-btn"
						onClick={onResetFilters}
					>
						Clear All Filters
					</button>
				</div>
			)}
		</aside>
	);
};

export default ShopFilters;