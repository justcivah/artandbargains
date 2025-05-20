import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchItems, deleteItem } from '../api/itemsApi';
import { fetchContributors, deleteContributor } from '../api/contributorsApi';
import SearchBar from '../components/SearchBar.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import '../styles/AdminPage.css';

const AdminPage = () => {
	// Get the active tab from localStorage or default to 'items'
	const [activeTab, setActiveTab] = useState(() => {
		return localStorage.getItem('adminActiveTab') || 'items';
	});

	// Items state
	const [items, setItems] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);

	// Contributors state
	const [contributors, setContributors] = useState([]);
	const [filteredContributors, setFilteredContributors] = useState([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Delete modal state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [contributorToDelete, setContributorToDelete] = useState(null);
	const [deleteType, setDeleteType] = useState(''); // 'item' or 'contributor'

	const navigate = useNavigate();

	// Save active tab to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('adminActiveTab', activeTab);
	}, [activeTab]);

	// Load both items and contributors data on component mount
	useEffect(() => {
		const loadAllData = async () => {
			try {
				setLoading(true);
				// Fetch both data types in parallel
				const [itemsData, contributorsData] = await Promise.all([
					fetchItems(),
					fetchContributors()
				]);

				// Process items data
				const sortedItems = itemsData.sort((a, b) => {
					return new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp);
				});
				setItems(sortedItems);
				setFilteredItems(sortedItems);

				// Process contributors data
				const sortedContributors = contributorsData.sort((a, b) => {
					return a.display_name.localeCompare(b.display_name);
				});
				setContributors(sortedContributors);
				setFilteredContributors(sortedContributors);

				setLoading(false);
			} catch (err) {
				setError('Error loading data: ' + err.message);
				console.error('Error loading data:', err);
				setLoading(false);
			}
		};

		loadAllData();
	}, []);

	useEffect(() => {
		// Scroll to top when component mounts
		window.scrollTo(0, 0);

		// Set page title
		document.title = 'Admin - Art & Bargains';
	}, []);

	// Helper function to normalize text by removing accents
	const normalizeText = (text) => {
		if (!text) return '';
		return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
	};

	// Helper function to get the primary contributor with position
	const getPrimaryContributorDisplay = (item) => {
		if (!item.contributors || item.contributors.length === 0) {
			return item.primary_contributor_display || 'Unknown';
		}

		// Find the primary contributor - first check for artist/creator position
		let primaryContributor = item.contributors.find(contributor =>
			contributor.position?.toLowerCase() === 'artist' ||
			contributor.position?.toLowerCase() === 'creator'
		);

		// If no artist/creator found, use the first contributor
		if (!primaryContributor) {
			primaryContributor = item.contributors[0];
		}

		const name = primaryContributor.display_name || item.primary_contributor_display || 'Unknown';
		const position = primaryContributor.position;

		if (position) {
			return `${name} (${position.charAt(0).toUpperCase() + position.slice(1)})`;
		}

		return name;
	};

	// Handle search for items
	const handleItemSearch = (query) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setFilteredItems(items);
			return;
		}

		const normalizedQuery = normalizeText(query.toLowerCase());
		const filtered = items.filter(item => {
			// Normalize and search by title
			const titleMatch = item.title && normalizeText(item.title.toLowerCase()).includes(normalizedQuery);
			// Normalize and search by description
			const descMatch = item.description && normalizeText(item.description.toLowerCase()).includes(normalizedQuery);
			// Normalize and search by main contributor
			const contributorMatch = item.primary_contributor_display &&
				normalizeText(item.primary_contributor_display.toLowerCase()).includes(normalizedQuery);

			return titleMatch || descMatch || contributorMatch;
		});

		setFilteredItems(filtered);
	};

	// Handle search for contributors
	const handleContributorSearch = (query) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setFilteredContributors(contributors);
			return;
		}

		const normalizedQuery = normalizeText(query.toLowerCase());
		const filtered = contributors.filter(contributor => {
			// Search by display name
			const displayNameMatch = contributor.display_name &&
				normalizeText(contributor.display_name.toLowerCase()).includes(normalizedQuery);

			// Search by first name
			const firstNameMatch = contributor.first_name &&
				normalizeText(contributor.first_name.toLowerCase()).includes(normalizedQuery);

			// Search by last name
			const lastNameMatch = contributor.last_name &&
				normalizeText(contributor.last_name.toLowerCase()).includes(normalizedQuery);

			// Search by bio
			const bioMatch = contributor.bio &&
				normalizeText(contributor.bio.toLowerCase()).includes(normalizedQuery);

			return displayNameMatch || firstNameMatch || lastNameMatch || bioMatch;
		});

		setFilteredContributors(filtered);
	};

	// Handle search based on active tab
	const handleSearch = (query) => {
		if (activeTab === 'items') {
			handleItemSearch(query);
		} else if (activeTab === 'contributors') {
			handleContributorSearch(query);
		}
	};

	// Delete item handlers
	const handleDeleteItemClick = (item, e) => {
		e.stopPropagation();
		setItemToDelete(item);
		setContributorToDelete(null);
		setDeleteType('item');
		setShowDeleteModal(true);
	};

	const confirmDeleteItem = async () => {
		if (!itemToDelete) return;

		try {
			await deleteItem(itemToDelete.PK.replace('ITEM#', ''));
			setItems(items.filter(item => item.PK !== itemToDelete.PK));
			setFilteredItems(filteredItems.filter(item => item.PK !== itemToDelete.PK));
			setShowDeleteModal(false);
			setItemToDelete(null);
		} catch (err) {
			setError('Error deleting item: ' + err.message);
			console.error('Error deleting item:', err);
		}
	};

	// Delete contributor handlers
	const handleDeleteContributorClick = (contributor, e) => {
		e.stopPropagation();
		setContributorToDelete(contributor);
		setItemToDelete(null);
		setDeleteType('contributor');
		setShowDeleteModal(true);
	};

	const confirmDeleteContributor = async () => {
		if (!contributorToDelete) return;

		try {
			// Extract id from PK (e.g., "CONTRIBUTOR#john_doe" -> "john_doe")
			const contributorId = contributorToDelete.name || contributorToDelete.PK.replace('CONTRIBUTOR#', '');
			await deleteContributor(contributorId);
			setContributors(contributors.filter(c => c.PK !== contributorToDelete.PK));
			setFilteredContributors(filteredContributors.filter(c => c.PK !== contributorToDelete.PK));
			setShowDeleteModal(false);
			setContributorToDelete(null);
		} catch (err) {
			setError('Error deleting contributor: ' + err.message);
			console.error('Error deleting contributor:', err);
		}
	};

	// General delete confirmation handler
	const confirmDelete = () => {
		if (deleteType === 'item') {
			confirmDeleteItem();
		} else if (deleteType === 'contributor') {
			confirmDeleteContributor();
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setItemToDelete(null);
		setContributorToDelete(null);
	};

	const getMainImage = (item) => {
		if (!item.images || !item.images.length) {
			return 'https://via.placeholder.com/100x100?text=No+Image';
		}

		const mainImage = item.images.find(img => img.is_primary);
		return mainImage ? mainImage.url : item.images[0].url;
	};

	const handleItemClick = (item, e) => {
		// Don't navigate if clicking on action buttons
		if (e.target.closest('.item-actions')) {
			return;
		}

		// Remove "ITEM#" from the PK to get just the ID
		const itemId = item.PK.replace('ITEM#', '');

		// Navigate to the shop item detail page
		navigate(`/shop/item/${itemId}`);
	};

	const handleContributorClick = (contributor, e) => {
		// Don't navigate if clicking on action buttons
		if (e.target.closest('.item-actions')) {
			return;
		}

		// Extract id from PK or use name property
		const contributorId = contributor.name || contributor.PK.replace('CONTRIBUTOR#', '');

		// Navigate to edit contributor page
		navigate(`/admin/contributors/${contributorId}/edit`);
	};

	// Format years for display (handle null values)
	const formatYear = (year) => {
		return year ? year : '-';
	};

	// Format contributor type for display
	const formatContributorType = (type) => {
		if (!type) return '';
		return type.charAt(0).toUpperCase() + type.slice(1);
	};

	if (loading) {
		return <div className="admin-loading">Loading...</div>;
	}

	if (error) {
		return <div className="admin-error">{error}</div>;
	}

	return (
		<div className="admin-page">
			<div className="admin-header">
				<h1>Art & Bargains Admin</h1>
				<div className="admin-actions">
					{activeTab === 'items' && (
						<Link to="/admin/items/new" className="add-item-button">Add New Item</Link>
					)}
					{/* Removed "Add New Contributor" button as requested */}
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="admin-tabs">
				<button
					className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
					onClick={() => {
						setActiveTab('items');
						setSearchQuery('');
					}}
				>
					Articles
				</button>
				<button
					className={`tab-button ${activeTab === 'contributors' ? 'active' : ''}`}
					onClick={() => {
						setActiveTab('contributors');
						setSearchQuery('');
					}}
				>
					Contributors
				</button>
			</div>

			<SearchBar
				searchQuery={searchQuery}
				onSearch={handleSearch}
				placeholder={activeTab === 'items'
					? "Search articles by title, description or contributor..."
					: "Search contributors by name or bio..."}
			/>

			{/* Items Tab Content */}
			{activeTab === 'items' && (
				<>
					<div className="items-count">
						{filteredItems.length} items found
					</div>

					<div className="items-list">
						{filteredItems.length === 0 ? (
							<div className="no-items">No items found. Try a different search term.</div>
						) : (
							filteredItems.map(item => (
								<div
									className="item-card"
									key={`${item.PK}-${item.SK}`}
									onClick={(e) => handleItemClick(item, e)}
								>
									<div className="item-image">
										<img src={getMainImage(item)} alt={item.title} />
									</div>
									<div className="item-details">
										<h3>{item.title}</h3>
										<div className="item-meta">
											<span className="item-type">{item.item_type.replace(/_/g, ' ')}</span>
											{item.categories && (
												<div className="item-categories">
													{Array.isArray(item.categories)
														? item.categories.map((category, index) => (
															<span className="category-badge" key={index}>
																{category.replace(/_/g, ' ')}
															</span>
														))
														: <span className="category-badge">
															{item.categories.replace(/_/g, ' ')}
														</span>
													}
												</div>
											)}
										</div>
										<div className="item-contributor">
											<strong>By:</strong> {getPrimaryContributorDisplay(item)}
										</div>
										<div className={`item-inventory ${(item.inventory_quantity || 0) > 0 ? 'in-stock' : 'out-of-stock'}`}>
											<strong>{(item.inventory_quantity || 0) > 0
												? `Stock: ${item.inventory_quantity} ${item.inventory_quantity === 1 ? 'unit' : 'units'}`
												: 'Out of stock'}
											</strong>
										</div>
									</div>
									<div className="item-actions">
										<Link to={`/admin/items/${encodeURIComponent(item.PK)}/edit`} className="edit-button">Edit</Link>
										<button
											className="delete-button"
											onClick={(e) => handleDeleteItemClick(item, e)}
										>
											Delete
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</>
			)}

			{/* Contributors Tab Content */}
			{activeTab === 'contributors' && (
				<>
					<div className="items-count">
						{filteredContributors.length} contributors found
					</div>

					<div className="items-list">
						{filteredContributors.length === 0 ? (
							<div className="no-items">No contributors found. Try a different search term.</div>
						) : (
							filteredContributors.map(contributor => (
								<div
									className="item-card contributor-card"
									key={contributor.PK}
									onClick={(e) => handleContributorClick(contributor, e)}
								>
									<div className="contributor-info">
										<h3>{contributor.display_name}</h3>
										<div className="contributor-meta">
											<span className={`contributor-type ${contributor.contributor_type}`}>
												{contributor.contributor_type === 'individual' ? 'Individual' : 'Organization'}
											</span>
										</div>
										<div className="contributor-details">
											{contributor.contributor_type === 'individual' ? (
												<>
													<div className="contributor-years">
														{(contributor.birth_year || contributor.death_year) && (
															<div className="contributor-years">
																{contributor.birth_year && contributor.birth_year}
																{contributor.birth_year && contributor.death_year && " - "}
																{contributor.death_year && contributor.death_year}
															</div>
														)}
													</div>
													<div className="contributor-names">
														<strong>Name:</strong> {contributor.first_name || ''} {contributor.middle_name || ''} {contributor.last_name || ''}
													</div>
												</>
											) : (
												<>
													<div className="contributor-years">
														{(contributor.founding_year || contributor.dissolution_year) && (
															<div className="contributor-years">
																{contributor.founding_year && contributor.founding_year}
																{contributor.founding_year && contributor.dissolution_year && " - "}
																{contributor.dissolution_year && contributor.dissolution_year}
															</div>
														)}
													</div>
												</>
											)}
											{contributor.bio && (
												<div className="contributor-bio">
													<strong>Bio:</strong> {contributor.bio.length > 100 ? contributor.bio.substring(0, 100) + '...' : contributor.bio}
												</div>
											)}
										</div>
									</div>
									<div className="item-actions">
										<Link
											to={`/admin/contributors/${contributor.name || contributor.PK.replace('CONTRIBUTOR#', '')}/edit`}
											className="edit-button"
										>
											Edit
										</Link>
										<button
											className="delete-button"
											onClick={(e) => handleDeleteContributorClick(contributor, e)}
										>
											Delete
										</button>
									</div>
								</div>
							))
						)}
					</div>
				</>
			)}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<DeleteConfirmModal
					item={deleteType === 'item' ? itemToDelete : contributorToDelete}
					entityType={deleteType}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>
			)}
		</div>
	);
};

export default AdminPage;