import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
	fetchItems, deleteItem,
	fetchItemTypes, fetchSubjects, fetchTechniques, fetchMediumTypes,
	updateMetadata, deleteMetadata
} from '../api/itemsApi';
import { fetchContributors, deleteContributor } from '../api/contributorsApi';
import SearchBar from '../components/SearchBar.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import EditMetadataModal from '../components/EditMetadataModal.jsx';
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

	// Metadata states
	const [types, setTypes] = useState([]);
	const [filteredTypes, setFilteredTypes] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [filteredSubjects, setFilteredSubjects] = useState([]);
	const [techniques, setTechniques] = useState([]);
	const [filteredTechniques, setFilteredTechniques] = useState([]);
	const [mediumTypes, setMediumTypes] = useState([]);
	const [filteredMediumTypes, setFilteredMediumTypes] = useState([]);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');

	// Delete modal state
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [contributorToDelete, setContributorToDelete] = useState(null);
	const [metadataToDelete, setMetadataToDelete] = useState(null);
	const [deleteType, setDeleteType] = useState(''); // 'item', 'contributor', 'type', 'subject', 'technique', 'medium'

	// Edit metadata modal state
	const [showEditModal, setShowEditModal] = useState(false);
	const [metadataToEdit, setMetadataToEdit] = useState(null);
	const [metadataEditType, setMetadataEditType] = useState('');

	const navigate = useNavigate();

	// Save active tab to localStorage when it changes
	useEffect(() => {
		localStorage.setItem('adminActiveTab', activeTab);

		// Clear search query when changing tabs
		setSearchQuery('');
	}, [activeTab]);

	// Load all data on component mount
	useEffect(() => {
		const loadAllData = async () => {
			try {
				setLoading(true);
				// Fetch all data types in parallel
				const [
					itemsData,
					contributorsData,
					typesData,
					subjectsData,
					techniquesData,
					mediumTypesData
				] = await Promise.all([
					fetchItems(),
					fetchContributors(),
					fetchItemTypes(),
					fetchSubjects(),
					fetchTechniques(),
					fetchMediumTypes()
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

				// Process metadata
				const sortedTypes = typesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
				setTypes(sortedTypes);
				setFilteredTypes(sortedTypes);

				const sortedSubjects = subjectsData.sort((a, b) => a.display_name.localeCompare(b.display_name));
				setSubjects(sortedSubjects);
				setFilteredSubjects(sortedSubjects);

				const sortedTechniques = techniquesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
				setTechniques(sortedTechniques);
				setFilteredTechniques(sortedTechniques);

				const sortedMediumTypes = mediumTypesData.sort((a, b) => a.display_name.localeCompare(b.display_name));
				setMediumTypes(sortedMediumTypes);
				setFilteredMediumTypes(sortedMediumTypes);

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

	// Handle search for metadata
	const handleMetadataSearch = (query, metadataItems, setFilteredItems) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setFilteredItems(metadataItems);
			return;
		}

		const normalizedQuery = normalizeText(query.toLowerCase());
		const filtered = metadataItems.filter(item => {
			// Search by display name
			const displayNameMatch = item.display_name &&
				normalizeText(item.display_name.toLowerCase()).includes(normalizedQuery);

			// Search by name
			const nameMatch = item.name &&
				normalizeText(item.name.toLowerCase()).includes(normalizedQuery);

			return displayNameMatch || nameMatch;
		});

		setFilteredItems(filtered);
	};

	// Handle search based on active tab
	const handleSearch = (query) => {
		switch (activeTab) {
			case 'items':
				handleItemSearch(query);
				break;
			case 'contributors':
				handleContributorSearch(query);
				break;
			case 'types':
				handleMetadataSearch(query, types, setFilteredTypes);
				break;
			case 'subjects':
				handleMetadataSearch(query, subjects, setFilteredSubjects);
				break;
			case 'techniques':
				handleMetadataSearch(query, techniques, setFilteredTechniques);
				break;
			case 'mediums':
				handleMetadataSearch(query, mediumTypes, setFilteredMediumTypes);
				break;
			default:
				break;
		}
	};

	// Delete item handlers
	const handleDeleteItemClick = (item, e) => {
		e.stopPropagation();
		setItemToDelete(item);
		setContributorToDelete(null);
		setMetadataToDelete(null);
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
		setMetadataToDelete(null);
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

	// Delete metadata handlers
	const handleDeleteMetadataClick = (metadata, type, e) => {
		e.stopPropagation();
		setMetadataToDelete(metadata);
		setItemToDelete(null);
		setContributorToDelete(null);
		setDeleteType(type);
		setShowDeleteModal(true);
	};

	const confirmDeleteMetadata = async () => {
		if (!metadataToDelete) return;

		try {
			// Extract id from PK (e.g., "TYPE#print" -> "print")
			const metadataId = metadataToDelete.name;
			const metadataCategory = deleteType; // 'types', 'subjects', 'techniques', 'mediums'

			await deleteMetadata(metadataCategory, metadataId);

			// Update state based on the type
			switch (deleteType) {
				case 'types':
					setTypes(types.filter(t => t.PK !== metadataToDelete.PK));
					setFilteredTypes(filteredTypes.filter(t => t.PK !== metadataToDelete.PK));
					break;
				case 'subjects':
					setSubjects(subjects.filter(s => s.PK !== metadataToDelete.PK));
					setFilteredSubjects(filteredSubjects.filter(s => s.PK !== metadataToDelete.PK));
					break;
				case 'techniques':
					setTechniques(techniques.filter(t => t.PK !== metadataToDelete.PK));
					setFilteredTechniques(filteredTechniques.filter(t => t.PK !== metadataToDelete.PK));
					break;
				case 'mediums':
					setMediumTypes(mediumTypes.filter(m => m.PK !== metadataToDelete.PK));
					setFilteredMediumTypes(filteredMediumTypes.filter(m => m.PK !== metadataToDelete.PK));
					break;
				default:
					break;
			}

			setShowDeleteModal(false);
			setMetadataToDelete(null);
		} catch (err) {
			if (err.response && err.response.status === 409) {
				setError(`Cannot delete this ${deleteType.slice(0, -1)} because it is used by one or more items.`);
			} else {
				setError(`Error deleting ${deleteType.slice(0, -1)}: ${err.message}`);
			}
			console.error(`Error deleting ${deleteType.slice(0, -1)}:`, err);
		}
	};

	// Edit metadata handlers
	const handleEditMetadataClick = (metadata, type, e) => {
		e.stopPropagation();
		setMetadataToEdit(metadata);
		setMetadataEditType(type);
		setShowEditModal(true);
	};

	const confirmEditMetadata = async (newDisplayName) => {
		if (!metadataToEdit || !newDisplayName || newDisplayName === metadataToEdit.display_name) {
			setShowEditModal(false);
			setMetadataToEdit(null);
			return;
		}

		try {
			// Format the update data
			const updateData = {
				...metadataToEdit,
				display_name: newDisplayName
			};

			// Make the API call to update
			const result = await updateMetadata(metadataEditType, metadataToEdit.name, updateData);

			// Update the appropriate state
			switch (metadataEditType) {
				case 'types':
					const updatedTypes = types.map(type =>
						type.name === metadataToEdit.name ? { ...type, display_name: newDisplayName } : type
					);
					setTypes(updatedTypes);
					setFilteredTypes(updatedTypes);
					break;
				case 'subjects':
					const updatedSubjects = subjects.map(subject =>
						subject.name === metadataToEdit.name ? { ...subject, display_name: newDisplayName } : subject
					);
					setSubjects(updatedSubjects);
					setFilteredSubjects(updatedSubjects);
					break;
				case 'techniques':
					const updatedTechniques = techniques.map(technique =>
						technique.name === metadataToEdit.name ? { ...technique, display_name: newDisplayName } : technique
					);
					setTechniques(updatedTechniques);
					setFilteredTechniques(updatedTechniques);
					break;
				case 'mediums':
					const updatedMediumTypes = mediumTypes.map(medium =>
						medium.name === metadataToEdit.name ? { ...medium, display_name: newDisplayName } : medium
					);
					setMediumTypes(updatedMediumTypes);
					setFilteredMediumTypes(updatedMediumTypes);
					break;
				default:
					break;
			}

			// Display success message if there were affected items
			if (result && result.affectedItems > 0) {
				setError(null);
				setError(`Updated ${result.affectedItems} items that referenced this ${metadataEditType.slice(0, -1)}.`);
				setTimeout(() => setError(null), 3000);
			}

			setShowEditModal(false);
			setMetadataToEdit(null);
		} catch (err) {
			setError(`Error updating ${metadataEditType.slice(0, -1)}: ${err.message}`);
			console.error(`Error updating ${metadataEditType.slice(0, -1)}:`, err);
		}
	};

	// General delete confirmation handler
	const confirmDelete = () => {
		if (deleteType === 'item') {
			confirmDeleteItem();
		} else if (deleteType === 'contributor') {
			confirmDeleteContributor();
		} else {
			confirmDeleteMetadata();
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setItemToDelete(null);
		setContributorToDelete(null);
		setMetadataToDelete(null);
	};

	const cancelEdit = () => {
		setShowEditModal(false);
		setMetadataToEdit(null);
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

	if (loading) {
		return <div className="admin-loading">Loading...</div>;
	}

	if (error) {
		return <div className="admin-error">{error}</div>;
	}

	// Get the appropriate placeholder text based on the active tab
	const getPlaceholderText = () => {
		switch (activeTab) {
			case 'items':
				return "Search articles by title, description or contributor...";
			case 'contributors':
				return "Search contributors by name or bio...";
			case 'types':
				return "Search types by name...";
			case 'subjects':
				return "Search subjects by name...";
			case 'techniques':
				return "Search techniques by name...";
			case 'mediums':
				return "Search medium types by name...";
			default:
				return "Search...";
		}
	};

	// Get the count text based on the active tab
	const getCountText = () => {
		switch (activeTab) {
			case 'items':
				return `${filteredItems.length} items found`;
			case 'contributors':
				return `${filteredContributors.length} contributors found`;
			case 'types':
				return `${filteredTypes.length} types found`;
			case 'subjects':
				return `${filteredSubjects.length} subjects found`;
			case 'techniques':
				return `${filteredTechniques.length} techniques found`;
			case 'mediums':
				return `${filteredMediumTypes.length} medium types found`;
			default:
				return "";
		}
	};

	// Render metadata list (reusable for types, subjects, techniques, mediums)
	const renderMetadataList = (items, type) => {
		return (
			<>
				<div className="items-count">
					{getCountText()}
				</div>

				<div className="items-list">
					{items.length === 0 ? (
						<div className="no-items">No {type} found. Try a different search term.</div>
					) : (
						items.map(item => (
							<div
								className="item-card metadata-card"
								key={item.PK}
							>
								<div className="metadata-info">
									<h3>{item.display_name}</h3>
									<div className="metadata-details">
										<div><strong>System Name:</strong> {item.name}</div>
									</div>
								</div>
								<div className="item-actions">
									<button
										className="edit-button"
										onClick={(e) => handleEditMetadataClick(item, type, e)}
									>
										Edit
									</button>
									<button
										className="delete-button"
										onClick={(e) => handleDeleteMetadataClick(item, type, e)}
									>
										Delete
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</>
		);
	};

	return (
		<div className="admin-page">
			<div className="admin-header">
				<h1>Art & Bargains Admin</h1>
				<div className="admin-actions">
					{activeTab === 'items' && (
						<Link to="/admin/items/new" className="add-item-button">Add New Item</Link>
					)}
				</div>
			</div>

			{/* Tab Navigation */}
			<div className="admin-tabs">
				<button
					className={`tab-button ${activeTab === 'items' ? 'active' : ''}`}
					onClick={() => setActiveTab('items')}
				>
					Articles
				</button>
				<button
					className={`tab-button ${activeTab === 'contributors' ? 'active' : ''}`}
					onClick={() => setActiveTab('contributors')}
				>
					Contributors
				</button>
				<button
					className={`tab-button ${activeTab === 'types' ? 'active' : ''}`}
					onClick={() => setActiveTab('types')}
				>
					Types
				</button>
				<button
					className={`tab-button ${activeTab === 'subjects' ? 'active' : ''}`}
					onClick={() => setActiveTab('subjects')}
				>
					Subjects
				</button>
				<button
					className={`tab-button ${activeTab === 'techniques' ? 'active' : ''}`}
					onClick={() => setActiveTab('techniques')}
				>
					Techniques
				</button>
				<button
					className={`tab-button ${activeTab === 'mediums' ? 'active' : ''}`}
					onClick={() => setActiveTab('mediums')}
				>
					Mediums
				</button>
			</div>

			<SearchBar
				searchQuery={searchQuery}
				onSearch={handleSearch}
				placeholder={getPlaceholderText()}
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
											<span className="item-type">
												{types.find(type => type.name === item.item_type)?.display_name || item.item_type.replace(/_/g, ' ')}
											</span>
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

			{/* Types Tab Content */}
			{activeTab === 'types' && renderMetadataList(filteredTypes, 'types')}

			{/* Subjects Tab Content */}
			{activeTab === 'subjects' && renderMetadataList(filteredSubjects, 'subjects')}

			{/* Techniques Tab Content */}
			{activeTab === 'techniques' && renderMetadataList(filteredTechniques, 'techniques')}

			{/* Medium Types Tab Content */}
			{activeTab === 'mediums' && renderMetadataList(filteredMediumTypes, 'mediums')}

			{/* Delete Confirmation Modal */}
			{showDeleteModal && (
				<DeleteConfirmModal
					item={deleteType === 'item' ? itemToDelete : (deleteType === 'contributor' ? contributorToDelete : metadataToDelete)}
					entityType={deleteType}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>
			)}

			{/* Edit Metadata Modal */}
			{showEditModal && (
				<EditMetadataModal
					metadata={metadataToEdit}
					type={metadataEditType}
					onConfirm={confirmEditMetadata}
					onCancel={cancelEdit}
				/>
			)}
		</div>
	);
};

export default AdminPage;