import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ShopFilters from '../components/ShopFilters';
import ShopItems from '../components/ShopItems';
import ShopPagination from '../components/ShopPagination';
import {
	searchItems, fetchItemTypes, fetchCategories, fetchPeriods, fetchMediumTypes,
	fetchConditionTypes, fetchContributors
} from '../api/itemsApi';
import '../styles/ShopPage.css';

const ShopPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const heroRef = useRef(null);
	const [isHeroInView, setIsHeroInView] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [items, setItems] = useState([]);
	const [pagination, setPagination] = useState({
		total: 0,
		page: 1,
		limit: 24,
		totalPages: 0
	});

	// Filter states
	const [itemTypes, setItemTypes] = useState([]);
	const [categories, setCategories] = useState([]);
	const [periods, setPeriods] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [conditionTypes, setConditionTypes] = useState([]);
	const [contributors, setContributors] = useState([]);

	// Selected filter states
	const [selectedFilters, setSelectedFilters] = useState({
		search: '',
		types: [],
		categories: [],
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

	// Parse URL params on initial load
	useEffect(() => {
		const params = new URLSearchParams(location.search);

		const initialFilters = {
			search: params.get('search') || '',
			types: params.getAll('types') || [],
			categories: params.getAll('categories') || [],
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

		setSelectedFilters(initialFilters);
	}, [location.search]);

	// Set up hero section intersection observer
	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'Shop - Art & Bargains';

		const heroObserverOptions = {
			threshold: 0.1
		};

		const heroObserverCallback = (entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					setIsHeroInView(true);
				} else {
					setIsHeroInView(false);
				}
			});
		};

		const heroObserver = new IntersectionObserver(heroObserverCallback, heroObserverOptions);

		if (heroRef.current) {
			heroObserver.observe(heroRef.current);
		}

		return () => {
			if (heroRef.current) {
				heroObserver.unobserve(heroRef.current);
			}
		};
	}, []);

	// Load metadata for filters
	useEffect(() => {
		const loadFilterMetadata = async () => {
			try {
				const [
					typesData,
					categoriesData,
					periodsData,
					mediumTypesData,
					conditionTypesData,
					contributorsData
				] = await Promise.all([
					fetchItemTypes(),
					fetchCategories(),
					fetchPeriods(),
					fetchMediumTypes(),
					fetchConditionTypes(),
					fetchContributors()
				]);

				setItemTypes(typesData);
				setCategories(categoriesData);
				setPeriods(periodsData);
				setMediumTypes(mediumTypesData);
				setConditionTypes(conditionTypesData);
				setContributors(contributorsData);
			} catch (err) {
				console.error('Error loading filter metadata:', err);
				setError('Failed to load filter options. Please try again later.');
			}
		};

		loadFilterMetadata();
	}, []);

	// Load items based on filters
	useEffect(() => {
		const loadItems = async () => {
			try {
				setLoading(true);
				setError(null);

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
	}, [selectedFilters]);

	// Update URL when filters change
	useEffect(() => {
		const params = new URLSearchParams();

		if (selectedFilters.search) params.append('search', selectedFilters.search);
		if (selectedFilters.sort) params.append('sort', selectedFilters.sort);
		if (selectedFilters.page) params.append('page', selectedFilters.page);
		if (selectedFilters.limit) params.append('limit', selectedFilters.limit);
		if (selectedFilters.minPrice) params.append('minPrice', selectedFilters.minPrice);
		if (selectedFilters.maxPrice) params.append('maxPrice', selectedFilters.maxPrice);

		selectedFilters.types.forEach(type => params.append('types', type));
		selectedFilters.categories.forEach(category => params.append('categories', category));
		selectedFilters.periods.forEach(period => params.append('periods', period));
		selectedFilters.contributors.forEach(contributor => params.append('contributors', contributor));
		selectedFilters.mediumTypes.forEach(mediumType => params.append('mediumTypes', mediumType));
		selectedFilters.conditions.forEach(condition => params.append('conditions', condition));

		navigate(`${location.pathname}?${params.toString()}`, { replace: true });
	}, [selectedFilters, navigate, location.pathname]);

	// Handle filter changes
	const handleFilterChange = (filterType, value) => {
		setSelectedFilters(prev => {
			// Reset to page 1 when filters change
			const newFilters = { ...prev, page: 1 };

			if (filterType === 'search' ||
				filterType === 'sort' ||
				filterType === 'limit' ||
				filterType === 'page' ||
				filterType === 'minPrice' ||
				filterType === 'maxPrice') {
				// Single value filters
				newFilters[filterType] = value;
			} else {
				// Multi-select filters (checkboxes)
				if (Array.isArray(newFilters[filterType])) {
					if (newFilters[filterType].includes(value)) {
						// Remove value if already selected
						newFilters[filterType] = newFilters[filterType].filter(item => item !== value);
					} else {
						// Add value if not already selected
						newFilters[filterType] = [...newFilters[filterType], value];
					}
				}
			}

			return newFilters;
		});
	};

	// Reset all filters
	const handleResetFilters = () => {
		setSelectedFilters({
			search: '',
			types: [],
			categories: [],
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
	};

	// Set page
	const handlePageChange = (newPage) => {
		setSelectedFilters(prev => ({
			...prev,
			page: newPage
		}));
	};

	return (
		<main className="shop-page">
			{/* Navbar spacer to prevent content from being covered by fixed navbar */}
			<div className="navbar-spacer"></div>

			{/* Fixed background - only shown when shop-hero is in viewport */}
			<div className={`shop-hero-background ${isHeroInView ? 'visible' : 'hidden'}`}>
				<div className="shop-hero-overlay"></div>
			</div>

			{/* Hero Section */}
			<section className="shop-hero" ref={heroRef}>
				<div className="shop-hero-content">
					<h1 className="shop-title">Our Collection</h1>
					<div className="title-underline centered-underline"></div>
					<p className="shop-subtitle">Explore our curated collection of art, prints, and one-of-a-kind pieces, thoughtfully selected by our team</p>
				</div>
			</section>

			{/* Shop content */}
			<div className="shop-content-container">
				<div className="shop-container">
					<ShopFilters
						itemTypes={itemTypes}
						categories={categories}
						periods={periods}
						mediumTypes={mediumTypes}
						conditionTypes={conditionTypes}
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