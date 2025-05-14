import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShopFilters from '../components/ShopFilters';
import ShopItems from '../components/ShopItems';
import ShopPagination from '../components/ShopPagination';
import {
	searchItems, fetchItemTypes, fetchSubjects, fetchTechniques,
	fetchPeriods, fetchMediumTypes, fetchContributors
} from '../api/itemsApi';
import '../styles/ShopPage.css';

const ShopPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const heroRef = useRef(null);
	const hasInitialized = useRef(false);
	const isInitialPageLoad = useRef(true);

	// Hero visibility state
	const [isHeroInView, setIsHeroInView] = useState(false);

	// Loading and error states
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [metadataLoaded, setMetadataLoaded] = useState(false);

	// Items and pagination
	const [items, setItems] = useState([]);
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		limit: 24,
		totalPages: 0
	});

	// Filter metadata states
	const [itemTypes, setItemTypes] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [techniques, setTechniques] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [contributors, setContributors] = useState([]);

	// Initialize selected filters from URL params
	const [selectedFilters, setSelectedFilters] = useState(() => {
		const params = new URLSearchParams(location.search);
		return {
			search: params.get('search') || '',
			types: params.getAll('types') || [],
			subjects: params.getAll('subjects') || [],
			techniques: params.getAll('techniques') || [],
			periods: params.getAll('periods') || [],
			contributors: params.getAll('contributors') || [],
			mediumTypes: params.getAll('mediumTypes') || [],
			conditions: params.getAll('conditions') || [],
			minPrice: params.get('minPrice') || '',
			maxPrice: params.get('maxPrice') || '',
			sort: params.get('sort') || 'date_desc',
			page: parseInt(params.get('page') || '1'),
			limit: parseInt(params.get('limit') || '24')
		};
	});

	// Only scroll to top on initial page load
	useEffect(() => {
		if (isInitialPageLoad.current) {
			window.scrollTo(0, 0);
			isInitialPageLoad.current = false;
		}
		document.title = 'Shop - Art & Bargains';
	}, []);

	// Set up hero section intersection observer
	useEffect(() => {
		const heroObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach(entry => {
					setIsHeroInView(entry.isIntersecting);
				});
			},
			{ threshold: 0.1 }
		);

		if (heroRef.current) {
			heroObserver.observe(heroRef.current);
		}

		return () => {
			if (heroRef.current) {
				heroObserver.unobserve(heroRef.current);
			}
		};
	}, []);

	// Load filter metadata on component mount
	useEffect(() => {
		const loadFilterMetadata = async () => {
			try {
				const [
					typesData,
					subjectsData,
					techniquesData,
					periodsData,
					mediumTypesData,
					contributorsData
				] = await Promise.all([
					fetchItemTypes(),
					fetchSubjects(),
					fetchTechniques(),
					fetchPeriods(),
					fetchMediumTypes(),
					fetchContributors()
				]);

				setItemTypes(typesData);
				setSubjects(subjectsData);
				setTechniques(techniquesData);
				setPeriods(periodsData);
				setMediumTypes(mediumTypesData);
				setContributors(contributorsData);
				setMetadataLoaded(true);
			} catch (err) {
				console.error('Error loading filter metadata:', err);
				setError('Failed to load filter options. Please try again later.');
				setMetadataLoaded(true);
			}
		};

		loadFilterMetadata();
	}, []);

	// Load items when ready
	useEffect(() => {
		// Wait for metadata to load
		if (!metadataLoaded) {
			return;
		}

		// Prevent double initialization
		if (hasInitialized.current) {
			return;
		}
		hasInitialized.current = true;

		const loadItems = async () => {
			try {
				setLoading(true);
				setError(null);

				console.log('Loading items with filters:', selectedFilters);
				const result = await searchItems(selectedFilters);

				setItems(result.items);
				setPagination(result.pagination);
			} catch (err) {
				console.error('Error loading items:', err);
				setError('Failed to load items. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		loadItems();
	}, [metadataLoaded]); // Only depend on metadataLoaded for initial load

	// Handle filter changes after initialization
	useEffect(() => {
		// Skip initial render
		if (!hasInitialized.current) {
			return;
		}

		const loadItems = async () => {
			try {
				setLoading(true);
				setError(null);

				console.log('Loading items with updated filters:', selectedFilters);
				const result = await searchItems(selectedFilters);

				setItems(result.items);
				setPagination(result.pagination);
			} catch (err) {
				console.error('Error loading items:', err);
				setError('Failed to load items. Please try again later.');
			} finally {
				setLoading(false);
			}
		};

		loadItems();
	}, [selectedFilters]); // React to filter changes

	// Update URL when filters change (but not on initial load)
	useEffect(() => {
		// Skip URL update on initial render
		if (!hasInitialized.current) {
			return;
		}

		const params = new URLSearchParams();

		if (selectedFilters.search) params.append('search', selectedFilters.search);
		if (selectedFilters.sort !== 'date_desc') params.append('sort', selectedFilters.sort);
		if (selectedFilters.page > 1) params.append('page', selectedFilters.page.toString());
		if (selectedFilters.limit !== 24) params.append('limit', selectedFilters.limit.toString());
		if (selectedFilters.minPrice) params.append('minPrice', selectedFilters.minPrice);
		if (selectedFilters.maxPrice) params.append('maxPrice', selectedFilters.maxPrice);

		selectedFilters.types.forEach(type => params.append('types', type));
		selectedFilters.subjects.forEach(subject => params.append('subjects', subject));
		selectedFilters.techniques.forEach(technique => params.append('techniques', technique));
		selectedFilters.periods.forEach(period => params.append('periods', period));
		selectedFilters.contributors.forEach(contributor => params.append('contributors', contributor));
		selectedFilters.mediumTypes.forEach(mediumType => params.append('mediumTypes', mediumType));
		selectedFilters.conditions.forEach(condition => params.append('conditions', condition));

		const newUrl = params.toString() ? `${location.pathname}?${params.toString()}` : location.pathname;
		navigate(newUrl, { replace: true });
	}, [selectedFilters, navigate, location.pathname]);

	// Handle filter changes
	const handleFilterChange = useCallback((filterType, value) => {
		setSelectedFilters(prev => {
			const newFilters = filterType === 'page' ? { ...prev } : { ...prev, page: 1 };

			if (filterType === 'search' ||
				filterType === 'sort' ||
				filterType === 'limit' ||
				filterType === 'page' ||
				filterType === 'minPrice' ||
				filterType === 'maxPrice') {
				newFilters[filterType] = value;
			} else {
				if (Array.isArray(newFilters[filterType])) {
					if (newFilters[filterType].includes(value)) {
						newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
					} else {
						newFilters[filterType] = [...newFilters[filterType], value];
					}
				}
			}

			return newFilters;
		});
	}, []);

	// Reset all filters
	const handleResetFilters = useCallback(() => {
		setSelectedFilters({
			search: '',
			types: [],
			subjects: [],
			techniques: [],
			periods: [],
			contributors: [],
			mediumTypes: [],
			conditions: [],
			minPrice: '',
			maxPrice: '',
			sort: 'date_desc',
			page: 1,
			limit: 24
		});
	}, []);

	// Handle page change
	const handlePageChange = useCallback((newPage) => {
		handleFilterChange('page', newPage);
	}, [handleFilterChange]);

	return (
		<main className="shop-page">
			<div className="navbar-spacer"></div>

			<div className={`shop-hero-background ${isHeroInView ? 'visible' : 'hidden'}`}>
				<div className="shop-hero-overlay"></div>
			</div>

			<section className="shop-hero" ref={heroRef}>
				<div className="shop-hero-content">
					<h1 className="shop-title">Our Collection</h1>
					<div className="title-underline centered-underline"></div>
					<p className="shop-subtitle">
						Explore our curated collection of art, prints, and one-of-a-kind pieces,
						thoughtfully selected by our team
					</p>
				</div>
			</section>

			<div className="shop-content-container">
				<div className="shop-container">
					<ShopFilters
						itemTypes={itemTypes}
						subjects={subjects}
						techniques={techniques}
						periods={periods}
						mediumTypes={mediumTypes}
						contributors={contributors}
						selectedFilters={selectedFilters}
						onFilterChange={handleFilterChange}
						onResetFilters={handleResetFilters}
					/>

					<div className="shop-content">
						<div className="shop-controls">
							<div className="shop-results-info">
								<p className="results-count">
									{loading ? 'Loading items...' :
										error ? 'Error loading items' :
											`${pagination.total} items found`}
								</p>
							</div>

							<div className="shop-sorting">
								<div className="sorting-control">
									<label htmlFor="sort-select">Sort by:</label>
									<select
										id="sort-select"
										value={selectedFilters.sort}
										onChange={(e) => handleFilterChange('sort', e.target.value)}
									>
										<option value="date_desc">Newest First</option>
										<option value="date_asc">Oldest First</option>
										<option value="price_asc">Price: Low to High</option>
										<option value="price_desc">Price: High to Low</option>
										<option value="alpha_asc">A - Z</option>
										<option value="alpha_desc">Z - A</option>
									</select>
								</div>

								<div className="view-control">
									<label htmlFor="limit-select">Show:</label>
									<select
										id="limit-select"
										value={selectedFilters.limit}
										onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
									>
										<option value="24">24</option>
										<option value="48">48</option>
										<option value="96">96</option>
									</select>
								</div>
							</div>
						</div>

						<ShopItems
							items={items}
							loading={loading}
							error={error}
						/>

						{!loading && !error && pagination.totalPages > 1 && (
							<ShopPagination
								currentPage={pagination.page}
								totalPages={pagination.totalPages}
								onPageChange={handlePageChange}
							/>
						)}
					</div>
				</div>
			</div>
		</main>
	);
};

export default ShopPage;