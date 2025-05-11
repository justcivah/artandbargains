import React, { useState, useEffect } from 'react';
import '../styles/ShopFilters.css';

const ShopFilters = ({
	itemTypes = [],
	subjects = [],
	techniques = [],
	periods = [],
	mediumTypes = [],
	contributors = [],
	selectedFilters,
	onFilterChange,
	onResetFilters
}) => {
	const [expanded, setExpanded] = useState(true);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);

	// State for expanded filters sections
	const [expandedSections, setExpandedSections] = useState({
		type: true,
		subject: true,
		technique: true,
		period: true,
		contributor: true,
		mediumType: true,
		condition: true,
		price: true
	});

	// State for search inputs in filter sections
	const [filterSearches, setFilterSearches] = useState({
		type: '',
		subject: '',
		technique: '',
		period: '',
		contributor: '',
		mediumType: '',
		condition: ''
	});

	// State for showing all items in a filter section
	const [showAll, setShowAll] = useState({
		type: false,
		subject: false,
		technique: false,
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
		if (!items || !filterSearches[section]) return items || [];

		const search = filterSearches[section].toLowerCase();
		return items.filter(item => {
			const displayName = item.display_name ? item.display_name.toLowerCase() : '';
			const name = item.name ? item.name.toLowerCase() : '';

			return displayName.includes(search) || name.includes(search);
		});
	};

	// Sort periods from newest to oldest
	const sortPeriods = (periods) => {
		if (!periods) return [];

		// Create a copy of the periods array to avoid modifying the original
		return [...periods].sort((a, b) => {
			// Extract years or century information from period names if possible
			const getTimeValue = (period) => {
				const name = period.display_name.toLowerCase();

				// Check for century patterns (e.g., "21st century", "19th century")
				const centuryMatch = name.match(/(\d+)(st|nd|rd|th)\s+century/i);
				if (centuryMatch) {
					return -parseInt(centuryMatch[1]); // Negative because higher century = newer
				}

				// Check for year ranges (e.g., "1950-1960", "1800s")
				const yearRangeMatch = name.match(/(\d{4})s|\d{4}-\d{4}|\d{4}/);
				if (yearRangeMatch) {
					return -parseInt(yearRangeMatch[0].match(/\d{4}/)[0]); // Negative for descending order
				}

				// For eras without clear numeric indicators, use this rough ordering
				// Adjust these values based on your actual periods
				if (name.includes("contemporary") || name.includes("modern")) return -2000;
				if (name.includes("post-war") || name.includes("postwar")) return -1950;
				if (name.includes("inter-war") || name.includes("interwar")) return -1930;
				if (name.includes("pre-war") || name.includes("prewar")) return -1910;
				if (name.includes("victorian")) return -1880;
				if (name.includes("renaissance")) return -1500;
				if (name.includes("medieval")) return -1200;
				if (name.includes("ancient")) return -500;

				// Default value for items that don't match any pattern
				return 0;
			};

			return getTimeValue(a) - getTimeValue(b);
		});
	};

	// Limit items shown unless "show all" is enabled
	const getLimitedItems = (items, section) => {
		if (!items) return [];

		// Sort periods if this is the period section
		const itemsToProcess = section === 'period' ? sortPeriods(items) : items;
		const filtered = filterItems(itemsToProcess, section);

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

								<div className="filter-options item-type-options">
									{getLimitedItems(itemTypes, 'type').map((type) => (
										<div key={type.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.types.includes(type.name)}
													onChange={() => onFilterChange('types', type.name)}
												/>
												<span className="option-name">{type.display_name}</span>
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

					{/* Subject Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('subject')}
						>
							<h3>Subject</h3>
							<span className={`toggle-icon ${expandedSections.subject ? 'open' : 'closed'}`}>
								{expandedSections.subject ? '−' : '+'}
							</span>
						</div>

						{expandedSections.subject && (
							<div className="filter-body">
								{subjects.length > 8 && (
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
												placeholder="Search subjects..."
												value={filterSearches.subject}
												onChange={(e) => handleFilterSearch('subject', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(subjects, 'subject').map((subject) => (
										<div key={subject.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.subjects.includes(subject.name)}
													onChange={() => onFilterChange('subjects', subject.name)}
												/>
												<span className="option-name">{subject.display_name}</span>
											</label>
										</div>
									))}
								</div>

								{subjects.length > 8 && !filterSearches.subject && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('subject')}
									>
										{showAll.subject ? 'Show Less' : 'Show More'}
									</button>
								)}
							</div>
						)}
					</div>

					{/* Technique Filter */}
					<div className="filter-section">
						<div
							className="filter-header"
							onClick={() => toggleSection('technique')}
						>
							<h3>Technique</h3>
							<span className={`toggle-icon ${expandedSections.technique ? 'open' : 'closed'}`}>
								{expandedSections.technique ? '−' : '+'}
							</span>
						</div>

						{expandedSections.technique && (
							<div className="filter-body">
								{techniques.length > 8 && (
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
												placeholder="Search techniques..."
												value={filterSearches.technique}
												onChange={(e) => handleFilterSearch('technique', e.target.value)}
											/>
										</div>
									</div>
								)}

								<div className="filter-options">
									{getLimitedItems(techniques, 'technique').map((technique) => (
										<div key={technique.name} className="filter-option">
											<label>
												<input
													type="checkbox"
													checked={selectedFilters.techniques.includes(technique.name)}
													onChange={() => onFilterChange('techniques', technique.name)}
												/>
												<span className="option-name">{technique.display_name}</span>
											</label>
										</div>
									))}
								</div>

								{techniques.length > 8 && !filterSearches.technique && (
									<button
										className="show-more-btn"
										onClick={() => toggleShowAll('technique')}
									>
										{showAll.technique ? 'Show Less' : 'Show More'}
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