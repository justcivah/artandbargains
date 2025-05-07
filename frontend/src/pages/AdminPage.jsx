import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchItems, deleteItem } from '../api/itemsApi';
import SearchBar from '../components/SearchBar.jsx';
import DeleteConfirmModal from '../components/DeleteConfirmModal.jsx';
import '../styles/AdminPage.css';

const AdminPage = () => {
	const [items, setItems] = useState([]);
	const [filteredItems, setFilteredItems] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [searchQuery, setSearchQuery] = useState('');
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);

	useEffect(() => {
		loadItems();
	}, []);

	const loadItems = async () => {
		try {
			setLoading(true);
			const data = await fetchItems();
			// Sort by insertion_timestamp in descending order (newest first)
			const sortedItems = data.sort((a, b) => {
				return new Date(b.insertion_timestamp) - new Date(a.insertion_timestamp);
			});

			setItems(sortedItems);
			setFilteredItems(sortedItems);
		} catch (err) {
			setError('Error loading items: ' + err.message);
			console.error('Error loading items:', err);
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = (query) => {
		setSearchQuery(query);

		if (!query.trim()) {
			setFilteredItems(items);
			return;
		}

		const lowercaseQuery = query.toLowerCase();
		const filtered = items.filter(item => {
			// Search by title
			const titleMatch = item.title && item.title.toLowerCase().includes(lowercaseQuery);
			// Search by description
			const descMatch = item.description && item.description.toLowerCase().includes(lowercaseQuery);
			// Search by main contributor
			const contributorMatch = item.primary_contributor_display &&
				item.primary_contributor_display.toLowerCase().includes(lowercaseQuery);

			return titleMatch || descMatch || contributorMatch;
		});

		setFilteredItems(filtered);
	};

	const handleDeleteClick = (item) => {
		setItemToDelete(item);
		setShowDeleteModal(true);
	};

	const confirmDelete = async () => {
		if (!itemToDelete) return;

		try {
			await deleteItem(itemToDelete.PK, itemToDelete.SK);
			setItems(items.filter(item => item.PK !== itemToDelete.PK || item.SK !== itemToDelete.SK));
			setFilteredItems(filteredItems.filter(item => item.PK !== itemToDelete.PK || item.SK !== itemToDelete.SK));
			setShowDeleteModal(false);
			setItemToDelete(null);
		} catch (err) {
			setError('Error deleting item: ' + err.message);
			console.error('Error deleting item:', err);
		}
	};

	const cancelDelete = () => {
		setShowDeleteModal(false);
		setItemToDelete(null);
	};

	const getMainImage = (item) => {
		if (!item.images || !item.images.length) {
			return 'https://via.placeholder.com/100x100?text=No+Image';
		}

		const mainImage = item.images.find(img => img.is_primary);
		return mainImage ? mainImage.url : item.images[0].url;
	};

	if (loading) {
		return <div className="admin-loading">Loading items...</div>;
	}

	if (error) {
		return <div className="admin-error">{error}</div>;
	}

	return (
		<div className="admin-page">
			<div className="admin-header">
				<h1>Art & Bargains Admin</h1>
				<Link to="/admin/items/new" className="add-item-button">Add New Item</Link>
			</div>

			<SearchBar
				searchQuery={searchQuery}
				onSearch={handleSearch}
				placeholder="Search by title, description or contributor..."
			/>

			<div className="items-count">
				{filteredItems.length} items found
			</div>

			<div className="items-list">
				{filteredItems.length === 0 ? (
					<div className="no-items">No items found. Try a different search term.</div>
				) : (
					filteredItems.map(item => (
						<div className="item-card" key={`${item.PK}-${item.SK}`}>
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
									<strong>By:</strong> {item.primary_contributor_display}
								</div>
							</div>
							<div className="item-actions">
								<Link to={`/admin/items/${encodeURIComponent(item.PK)}/edit`} className="edit-button">Edit</Link>
								<button
									className="delete-button"
									onClick={() => handleDeleteClick(item)}
								>
									Delete
								</button>
							</div>
						</div>
					))
				)}
			</div>

			{showDeleteModal && (
				<DeleteConfirmModal
					item={itemToDelete}
					onConfirm={confirmDelete}
					onCancel={cancelDelete}
				/>
			)}
		</div>
	);
};

export default AdminPage;