import React, { useState, useEffect, useCallback, useRef } from "react";
import "../styles/ShopFilters.css";

const ShopFilters = ({
	itemTypes = [],
	subjects = [],
	techniques = [],
	periods = [],
	mediumTypes = [],
	contributors = [],
	selectedFilters,
	onFilterChange,
	onResetFilters,
}) => {
	const [expanded, setExpanded] = useState(true);
	const [windowWidth, setWindowWidth] = useState(window.innerWidth);
	const filtersRef = useRef(null);
	const resizeTimeoutRef = useRef(null);

	// State for expanded filters sections
	const [expandedSections, setExpandedSections] = useState({
		type: true,
		subject: true,
		technique: true,
		period: true,
		contributor: true,
		mediumType: true,
		condition: true,
		price: true,
	});

	// State for search inputs in filter sections
	const [filterSearches, setFilterSearches] = useState({
		type: "",
		subject: "",
		technique: "",
		period: "",
		contributor: "",
		mediumType: "",
		condition: "",
	});

	// State for showing all items in a filter section
	const [showAll, setShowAll] = useState({
		type: false,
		subject: false,
		technique: false,
		period: false,
		contributor: false,
		mediumType: false,
		condition: false,
	});

	// Debounced resize handler
	const handleResize = useCallback(() => {
		if (resizeTimeoutRef.current) {
			clearTimeout(resizeTimeoutRef.current);
		}

		resizeTimeoutRef.current = setTimeout(() => {
			const width = window.innerWidth;
			const previousWidth = windowWidth;
			setWindowWidth(width);

			// Only auto-collapse/expand on significant size changes (not during scroll)
			const significantChange = Math.abs(width - previousWidth) > 50;

			if (significantChange) {
				if (width <= 992) {
					setExpanded(false);
				} else {
					setExpanded(true);
				}
			}
		}, 150);
	}, [windowWidth]);

	// Track window resize for responsive behavior
	useEffect(() => {
		// Set initial state based on screen size
		if (window.innerWidth <= 992) {
			setExpanded(false);
		}

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [handleResize]);

	// Toggle main filters visibility
	const toggleFilters = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			setExpanded((prev) => !prev);
		},
		[]
	);

	// Toggle a filter section
	const toggleSection = useCallback(
		(section) => (e) => {
			e.preventDefault();
			e.stopPropagation();
			setExpandedSections((prev) => ({
				...prev,
				[section]: !prev[section],
			}));
		},
		[]
	);

	// Toggle showing all items in a filter section
	const toggleShowAll = useCallback(
		(section) => (e) => {
			e.preventDefault();
			e.stopPropagation();
			setShowAll((prev) => ({
				...prev,
				[section]: !prev[section],
			}));
		},
		[]
	);

	// Update filter search
	const handleFilterSearch = useCallback((section, value) => {
		setFilterSearches((prev) => ({
			...prev,
			[section]: value,
		}));
	}, []);

	// Handle main search input
	const handleMainSearch = useCallback(
		(e) => {
			e.stopPropagation();
			onFilterChange("search", e.target.value);
		},
		[onFilterChange]
	);

	// Handle item type selection (single selection)
	const handleItemTypeSelection = useCallback(
		(typeName) => {
			const isCurrentlySelected = selectedFilters.types.includes(typeName);
			const hasOtherSelected =
				selectedFilters.types.length > 0 && !isCurrentlySelected;

			if (isCurrentlySelected) {
				// If clicking the currently selected type, deselect it
				onFilterChange("types", typeName);
			} else {
				// If there are other types selected, remove them first
				if (hasOtherSelected) {
					// Remove all currently selected types
					selectedFilters.types.forEach((selectedType) => {
						onFilterChange("types", selectedType);
					});
				}

				// Clear all other filter checkboxes when selecting a new item type
				// Clear subjects
				selectedFilters.subjects.forEach((subject) => {
					onFilterChange("subjects", subject);
				});

				// Clear techniques
				selectedFilters.techniques.forEach((technique) => {
					onFilterChange("techniques", technique);
				});

				// Clear periods
				selectedFilters.periods.forEach((period) => {
					onFilterChange("periods", period);
				});

				// Clear contributors
				selectedFilters.contributors.forEach((contributor) => {
					onFilterChange("contributors", contributor);
				});

				// Clear medium types
				selectedFilters.mediumTypes.forEach((mediumType) => {
					onFilterChange("mediumTypes", mediumType);
				});

				// Then add the new type
				onFilterChange("types", typeName);
			}
		},
		[selectedFilters.types, selectedFilters.subjects, selectedFilters.techniques,
		selectedFilters.periods, selectedFilters.contributors, selectedFilters.mediumTypes, onFilterChange]
	);

	// Handle checkbox filter changes
	const handleCheckboxChange = useCallback(
		(filterType, value) => (e) => {
			e.stopPropagation();
			onFilterChange(filterType, value);
		},
		[onFilterChange]
	);

	// Handle price input changes
	const handlePriceChange = useCallback(
		(priceType) => (e) => {
			e.stopPropagation();
			onFilterChange(priceType, e.target.value);
		},
		[onFilterChange]
	);

	// Filter items based on search
	const filterItems = useCallback((items, section) => {
		if (!items || !filterSearches[section]) return items || [];

		const search = filterSearches[section].toLowerCase();
		return items.filter((item) => {
			const displayName = item.display_name
				? item.display_name.toLowerCase()
				: "";
			const name = item.name ? item.name.toLowerCase() : "";

			return displayName.includes(search) || name.includes(search);
		});
	}, [filterSearches]);

	// Sort periods from newest to oldest
	const sortPeriods = useCallback((periods) => {
		if (!periods) return [];

		return [...periods].sort((a, b) => {
			const getTimeValue = (period) => {
				const name = period.display_name.toLowerCase();

				const centuryMatch = name.match(/(\d+)(st|nd|rd|th)\s+century/i);
				if (centuryMatch) {
					return -parseInt(centuryMatch[1]);
				}

				const yearRangeMatch = name.match(/(\d{4})s|\d{4}-\d{4}|\d{4}/);
				if (yearRangeMatch) {
					return -parseInt(yearRangeMatch[0].match(/\d{4}/)[0]);
				}

				if (name.includes("contemporary") || name.includes("modern"))
					return -2000;
				if (name.includes("post-war") || name.includes("postwar"))
					return -1950;
				if (name.includes("inter-war") || name.includes("interwar"))
					return -1930;
				if (name.includes("pre-war") || name.includes("prewar")) return -1910;
				if (name.includes("victorian")) return -1880;
				if (name.includes("renaissance")) return -1500;
				if (name.includes("medieval")) return -1200;
				if (name.includes("ancient")) return -500;

				return 0;
			};

			return getTimeValue(a) - getTimeValue(b);
		});
	}, []);

	// Sort items alphabetically by display_name
	const sortAlphabetically = useCallback((items) => {
		if (!items) return [];

		return [...items].sort((a, b) => {
			const nameA = (a.display_name || a.name || "").toLowerCase().trim();
			const nameB = (b.display_name || b.name || "").toLowerCase().trim();
			return nameA.localeCompare(nameB, undefined, {
				numeric: true,
				sensitivity: 'base'
			});
		});
	}, []);

	// Limit items shown unless "show all" is enabled
	const getLimitedItems = useCallback(
		(items, section) => {
			if (!items) return [];

			let itemsToProcess;

			// Apply sorting based on section
			if (section === "period") {
				itemsToProcess = sortPeriods(items);
			} else {
				itemsToProcess = sortAlphabetically(items);
			}

			const filtered = filterItems(itemsToProcess, section);

			if (
				showAll[section] ||
				filtered.length <= 8 ||
				filterSearches[section]
			) {
				return filtered;
			}

			return filtered.slice(0, 8);
		},
		[sortPeriods, sortAlphabetically, filterItems, showAll, filterSearches]
	);

	// Prevent event bubbling for content clicks
	const handleContentClick = useCallback((e) => {
		e.stopPropagation();
	}, []);

	// Handle search input events
	const handleSearchInputEvents = useCallback((e) => {
		e.stopPropagation();
	}, []);

	// Handle filter search input events
	const handleFilterSearchInput = useCallback(
		(section) => (e) => {
			e.stopPropagation();
			handleFilterSearch(section, e.target.value);
		},
		[handleFilterSearch]
	);

	return (
		<div className="filters-container" ref={filtersRef}>
			{/* Search box outside filters */}
			<div className="search-container">
				<div className="search-input-container">
					<span className="search-icon">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</span>
					<input
						type="text"
						placeholder="Search items..."
						value={selectedFilters.search || ""}
						onChange={handleMainSearch}
						onClick={handleSearchInputEvents}
						onFocus={handleSearchInputEvents}
						onTouchStart={handleSearchInputEvents}
						className="search-input"
					/>
				</div>
			</div>

			{/* Filters box */}
			<aside className={`shop-filters ${expanded ? "expanded" : "collapsed"}`}>
				<div className="filters-header" onClick={toggleFilters}>
					<h2>Filters</h2>
					<button
						className="toggle-filters-btn"
						onClick={toggleFilters}
						onTouchStart={handleSearchInputEvents}
						aria-label={expanded ? "Collapse filters" : "Expand filters"}
					>
						{expanded ? "−" : "+"}
					</button>
				</div>

				{expanded && (
					<div className="filters-content" onClick={handleContentClick}>
						{/* Item Type Filter with Badges - One per row */}
						<div className="filter-section">
							<div className="filter-header" onClick={toggleSection("type")}>
								<h3>Item Type</h3>
								<span
									className={`toggle-icon ${expandedSections.type ? "open" : "closed"
										}`}
								>
									{expandedSections.type ? "−" : "+"}
								</span>
							</div>

							{expandedSections.type && (
								<div className="filter-body">
									{itemTypes.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search types..."
													value={filterSearches.type}
													onChange={handleFilterSearchInput("type")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-badges-vertical">
										{getLimitedItems(itemTypes, "type").map((type) => (
											<div
												key={type.name}
												className={`filter-badge ${selectedFilters.types.includes(type.name)
													? "selected"
													: ""
													}`}
												onClick={(e) => {
													e.stopPropagation();
													handleItemTypeSelection(type.name);
												}}
												onTouchStart={handleSearchInputEvents}
											>
												<span className="badge-text">{type.display_name}</span>
											</div>
										))}
									</div>

									{itemTypes.length > 8 && !filterSearches.type && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("type")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.type ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Subject Filter */}
						<div className="filter-section">
							<div className="filter-header" onClick={toggleSection("subject")}>
								<h3>Subject</h3>
								<span
									className={`toggle-icon ${expandedSections.subject ? "open" : "closed"
										}`}
								>
									{expandedSections.subject ? "−" : "+"}
								</span>
							</div>

							{expandedSections.subject && (
								<div className="filter-body">
									{subjects.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search subjects..."
													value={filterSearches.subject}
													onChange={handleFilterSearchInput("subject")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-options">
										{getLimitedItems(subjects, "subject").map((subject) => (
											<div key={subject.name} className="filter-option">
												<label onTouchStart={handleSearchInputEvents}>
													<input
														type="checkbox"
														checked={selectedFilters.subjects.includes(
															subject.name
														)}
														onChange={handleCheckboxChange(
															"subjects",
															subject.name
														)}
														onClick={handleSearchInputEvents}
													/>
													<span className="option-name">
														{subject.display_name}
													</span>
												</label>
											</div>
										))}
									</div>

									{subjects.length > 8 && !filterSearches.subject && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("subject")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.subject ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Technique Filter */}
						<div className="filter-section">
							<div
								className="filter-header"
								onClick={toggleSection("technique")}
							>
								<h3>Technique</h3>
								<span
									className={`toggle-icon ${expandedSections.technique ? "open" : "closed"
										}`}
								>
									{expandedSections.technique ? "−" : "+"}
								</span>
							</div>

							{expandedSections.technique && (
								<div className="filter-body">
									{techniques.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search techniques..."
													value={filterSearches.technique}
													onChange={handleFilterSearchInput("technique")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-options">
										{getLimitedItems(techniques, "technique").map(
											(technique) => (
												<div key={technique.name} className="filter-option">
													<label onTouchStart={handleSearchInputEvents}>
														<input
															type="checkbox"
															checked={selectedFilters.techniques.includes(
																technique.name
															)}
															onChange={handleCheckboxChange(
																"techniques",
																technique.name
															)}
															onClick={handleSearchInputEvents}
														/>
														<span className="option-name">
															{technique.display_name}
														</span>
													</label>
												</div>
											)
										)}
									</div>

									{techniques.length > 8 && !filterSearches.technique && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("technique")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.technique ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Periods Filter */}
						<div className="filter-section">
							<div className="filter-header" onClick={toggleSection("period")}>
								<h3>Period</h3>
								<span
									className={`toggle-icon ${expandedSections.period ? "open" : "closed"
										}`}
								>
									{expandedSections.period ? "−" : "+"}
								</span>
							</div>

							{expandedSections.period && (
								<div className="filter-body">
									{periods.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search periods..."
													value={filterSearches.period}
													onChange={handleFilterSearchInput("period")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-options">
										{getLimitedItems(periods, "period").map((period) => (
											<div key={period.name} className="filter-option">
												<label onTouchStart={handleSearchInputEvents}>
													<input
														type="checkbox"
														checked={selectedFilters.periods.includes(
															period.name
														)}
														onChange={handleCheckboxChange(
															"periods",
															period.name
														)}
														onClick={handleSearchInputEvents}
													/>
													<span className="option-name">
														{period.display_name}
													</span>
												</label>
											</div>
										))}
									</div>

									{periods.length > 8 && !filterSearches.period && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("period")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.period ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Contributors Filter */}
						<div className="filter-section">
							<div
								className="filter-header"
								onClick={toggleSection("contributor")}
							>
								<h3>Authors</h3>
								<span
									className={`toggle-icon ${expandedSections.contributor ? "open" : "closed"
										}`}
								>
									{expandedSections.contributor ? "−" : "+"}
								</span>
							</div>

							{expandedSections.contributor && (
								<div className="filter-body">
									{contributors.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search authors..."
													value={filterSearches.contributor}
													onChange={handleFilterSearchInput("contributor")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-options">
										{getLimitedItems(contributors, "contributor").map(
											(contributor) => (
												<div key={contributor.name} className="filter-option">
													<label onTouchStart={handleSearchInputEvents}>
														<input
															type="checkbox"
															checked={selectedFilters.contributors.includes(
																contributor.name
															)}
															onChange={handleCheckboxChange(
																"contributors",
																contributor.name
															)}
															onClick={handleSearchInputEvents}
														/>
														<span className="option-name">
															{contributor.display_name}
														</span>
													</label>
												</div>
											)
										)}
									</div>

									{contributors.length > 8 && !filterSearches.contributor && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("contributor")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.contributor ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Medium Types Filter */}
						<div className="filter-section">
							<div
								className="filter-header"
								onClick={toggleSection("mediumType")}
							>
								<h3>Medium</h3>
								<span
									className={`toggle-icon ${expandedSections.mediumType ? "open" : "closed"
										}`}
								>
									{expandedSections.mediumType ? "−" : "+"}
								</span>
							</div>

							{expandedSections.mediumType && (
								<div className="filter-body">
									{mediumTypes.length > 8 && (
										<div className="filter-search">
											<div className="search-input-container">
												<span className="search-icon">
													<svg
														xmlns="http://www.w3.org/2000/svg"
														width="14"
														height="14"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<circle cx="11" cy="11" r="8"></circle>
														<line
															x1="21"
															y1="21"
															x2="16.65"
															y2="16.65"
														></line>
													</svg>
												</span>
												<input
													type="text"
													placeholder="Search mediums..."
													value={filterSearches.mediumType}
													onChange={handleFilterSearchInput("mediumType")}
													onClick={handleSearchInputEvents}
													onFocus={handleSearchInputEvents}
													onTouchStart={handleSearchInputEvents}
												/>
											</div>
										</div>
									)}

									<div className="filter-options">
										{getLimitedItems(mediumTypes, "mediumType").map(
											(mediumType) => (
												<div key={mediumType.name} className="filter-option">
													<label onTouchStart={handleSearchInputEvents}>
														<input
															type="checkbox"
															checked={selectedFilters.mediumTypes.includes(
																mediumType.name
															)}
															onChange={handleCheckboxChange(
																"mediumTypes",
																mediumType.name
															)}
															onClick={handleSearchInputEvents}
														/>
														<span className="option-name">
															{mediumType.display_name}
														</span>
													</label>
												</div>
											)
										)}
									</div>

									{mediumTypes.length > 8 && !filterSearches.mediumType && (
										<button
											className="show-more-btn"
											onClick={toggleShowAll("mediumType")}
											onTouchStart={handleSearchInputEvents}
										>
											{showAll.mediumType ? "Show Less" : "Show More"}
										</button>
									)}
								</div>
							)}
						</div>

						{/* Price Range Filter */}
						<div className="filter-section">
							<div className="filter-header" onClick={toggleSection("price")}>
								<h3>Price Range</h3>
								<span
									className={`toggle-icon ${expandedSections.price ? "open" : "closed"
										}`}
								>
									{expandedSections.price ? "−" : "+"}
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
												value={selectedFilters.minPrice || ""}
												onChange={handlePriceChange("minPrice")}
												onClick={handleSearchInputEvents}
												onFocus={handleSearchInputEvents}
												onTouchStart={handleSearchInputEvents}
											/>
										</div>
										<div className="price-input">
											<label htmlFor="max-price">Max $</label>
											<input
												type="number"
												id="max-price"
												min="0"
												value={selectedFilters.maxPrice || ""}
												onChange={handlePriceChange("maxPrice")}
												onClick={handleSearchInputEvents}
												onFocus={handleSearchInputEvents}
												onTouchStart={handleSearchInputEvents}
											/>
										</div>
									</div>
								</div>
							)}
						</div>

						<button
							className="reset-filters-btn"
							onClick={onResetFilters}
							onTouchStart={handleSearchInputEvents}
						>
							Clear All Filters
						</button>
					</div>
				)}
			</aside>
		</div>
	);
};

export default ShopFilters;