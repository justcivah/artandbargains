import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchContributor, updateContributor, createContributor } from '../api/contributorsApi';
import '../styles/EditContributorPage.css';

const EditContributorPage = () => {
	const { contributorId } = useParams();
	const navigate = useNavigate();
	const isNewContributor = contributorId === 'new';

	// Store data for both types separately
	const [individualData, setIndividualData] = useState({
		first_name: '',
		middle_name: '',
		last_name: '',
		display_name: '',
		birth_year: '',
		death_year: '',
		is_living: true
	});

	const [organizationData, setOrganizationData] = useState({
		name: '',
		display_name: '',
		founding_year: '',
		dissolution_year: '',
		is_active: true
	});

	// Store original data to detect changes
	const [originalData, setOriginalData] = useState(null);

	// Form state
	const [formData, setFormData] = useState({
		contributor_type: 'individual',
		bio: '',
		...individualData
	});

	const [loading, setLoading] = useState(!isNewContributor);
	const [error, setError] = useState(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [successMessage, setSuccessMessage] = useState('');

	// Load contributor data if editing existing contributor
	useEffect(() => {
		if (!isNewContributor) {
			const loadContributor = async () => {
				try {
					setLoading(true);
					const contributor = await fetchContributor(contributorId);

					// Store original data for comparison later
					setOriginalData(contributor);

					// Format data for the form
					const commonData = {
						contributor_type: contributor.contributor_type || 'individual',
						bio: contributor.bio || ''
					};

					if (contributor.contributor_type === 'individual') {
						const indivData = {
							first_name: contributor.first_name || '',
							middle_name: contributor.middle_name || '',
							last_name: contributor.last_name || '',
							display_name: contributor.display_name || '',
							birth_year: contributor.birth_year || '',
							death_year: contributor.death_year || '',
							is_living: contributor.is_living !== undefined ? contributor.is_living : true,
						};
						setIndividualData(indivData);
						setFormData({ ...commonData, ...indivData });
					} else {
						const orgData = {
							name: contributor.name || '',
							display_name: contributor.display_name || '',
							founding_year: contributor.founding_year || '',
							dissolution_year: contributor.dissolution_year || '',
							is_active: contributor.is_active !== undefined ? contributor.is_active : true,
						};
						setOrganizationData(orgData);
						setFormData({ ...commonData, ...orgData });
					}

					setLoading(false);
				} catch (err) {
					setError('Error loading contributor: ' + err.message);
					console.error('Error loading contributor:', err);
					setLoading(false);
				}
			};

			loadContributor();
		}
	}, [contributorId, isNewContributor]);

	// Helper function to capitalize first letter of each word
	const capitalizeFirstLetter = (string) => {
		if (!string) return '';
		return string.split(' ').map(word =>
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	};

	// Update form field
	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		const newValue = type === 'checkbox' ? checked : value;

		// Update formData
		setFormData(prev => ({ ...prev, [name]: newValue }));

		// Also update the appropriate type-specific data store
		if (formData.contributor_type === 'individual') {
			if (Object.keys(individualData).includes(name)) {
				setIndividualData(prev => ({ ...prev, [name]: newValue }));
			}

			// For name fields, also update display_name
			if (name === 'first_name' || name === 'middle_name' || name === 'last_name') {
				const firstName = name === 'first_name' ? value : formData.first_name;
				const middleName = name === 'middle_name' ? value : formData.middle_name;
				const lastName = name === 'last_name' ? value : formData.last_name;

				// Format display name: "First M. Last" (initial for middle name)
				const middleInitial = middleName ? `${middleName.trim().split(' ').map(word => `${word.charAt(0)}.`).join(' ')}` : '';
				const displayName = [
					firstName,
					middleInitial,
					lastName
				].filter(Boolean).join(' ');

				setFormData(prev => ({ ...prev, display_name: displayName }));
				setIndividualData(prev => ({ ...prev, display_name: displayName }));
			}

			// Handle special cases
			if (name === 'death_year' && value) {
				setFormData(prev => ({ ...prev, is_living: false }));
				setIndividualData(prev => ({ ...prev, is_living: false }));
			}
			if (name === 'is_living' && checked) {
				setFormData(prev => ({ ...prev, death_year: '' }));
				setIndividualData(prev => ({ ...prev, death_year: '' }));
			}
		}
		else if (formData.contributor_type === 'organization') {
			if (Object.keys(organizationData).includes(name)) {
				setOrganizationData(prev => ({ ...prev, [name]: newValue }));
			}

			// For organization name, also update display_name
			if (name === 'name') {
				setFormData(prev => ({ ...prev, display_name: value }));
				setOrganizationData(prev => ({ ...prev, display_name: value }));
			}

			// Handle special cases
			if (name === 'dissolution_year' && value) {
				setFormData(prev => ({ ...prev, is_active: false }));
				setOrganizationData(prev => ({ ...prev, is_active: false }));
			}
			if (name === 'is_active' && checked) {
				setFormData(prev => ({ ...prev, dissolution_year: '' }));
				setOrganizationData(prev => ({ ...prev, dissolution_year: '' }));
			}
		}

		// Bio field is shared between both types
		if (name === 'bio') {
			// No need to update separate stores for bio as it's shared
		}
	};

	// Handle contributor type change
	const handleTypeChange = (e) => {
		const newType = e.target.value;

		// Save current data to the appropriate store
		if (formData.contributor_type === 'individual') {
			const currentIndividualData = {
				first_name: formData.first_name || '',
				middle_name: formData.middle_name || '',
				last_name: formData.last_name || '',
				display_name: formData.display_name || '',
				birth_year: formData.birth_year || '',
				death_year: formData.death_year || '',
				is_living: formData.is_living !== undefined ? formData.is_living : true
			};
			setIndividualData(currentIndividualData);
		} else {
			const currentOrganizationData = {
				name: formData.name || '',
				display_name: formData.display_name || '',
				founding_year: formData.founding_year || '',
				dissolution_year: formData.dissolution_year || '',
				is_active: formData.is_active !== undefined ? formData.is_active : true
			};
			setOrganizationData(currentOrganizationData);
		}

		// Update form data with the saved data for the new type
		if (newType === 'individual') {
			setFormData({
				contributor_type: newType,
				bio: formData.bio,
				...individualData
			});
		} else {
			setFormData({
				contributor_type: newType,
				bio: formData.bio,
				...organizationData
			});
		}
	};

	// Validate form
	const validateForm = () => {
		// Validate individual contributor
		if (formData.contributor_type === 'individual') {
			// At least one name (first or last) and display name are required
			if ((!formData.first_name && !formData.last_name) || !formData.display_name) {
				setError('For individual contributors, at least one name (first or last) and display name are required');
				return false;
			}
		}
		// Validate organization
		else if (formData.contributor_type === 'organization') {
			if (!formData.name || !formData.display_name) {
				setError('For organization contributors, name and display name are required');
				return false;
			}
		}

		return true;
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();

		// Clear previous messages
		setError(null);
		setSuccessMessage('');

		// Validate form
		if (!validateForm()) {
			return;
		}

		try {
			setIsSubmitting(true);

			// Prepare contributor data
			const contributorData = { ...formData };

			// Format data for API
			if (contributorData.contributor_type === 'individual') {
				// Convert years to integers if provided
				if (contributorData.birth_year) {
					contributorData.birth_year = parseInt(contributorData.birth_year);
				}
				if (contributorData.death_year) {
					contributorData.death_year = parseInt(contributorData.death_year);
				}

				// Clear organization-specific fields
				delete contributorData.founding_year;
				delete contributorData.dissolution_year;
				delete contributorData.is_active;
				delete contributorData.name;
			} else {
				// Convert years to integers if provided
				if (contributorData.founding_year) {
					contributorData.founding_year = parseInt(contributorData.founding_year);
				}
				if (contributorData.dissolution_year) {
					contributorData.dissolution_year = parseInt(contributorData.dissolution_year);
				}

				// Clear individual-specific fields
				delete contributorData.first_name;
				delete contributorData.middle_name;
				delete contributorData.last_name;
				delete contributorData.birth_year;
				delete contributorData.death_year;
				delete contributorData.is_living;
			}

			// Check if the display name has changed
			const displayNameChanged =
				originalData &&
				originalData.display_name !== formData.display_name;

			if (isNewContributor) {
				// Create new contributor
				await createContributor(contributorData);
				// Navigate immediately after successful creation
				navigate('/admin');
			} else {
				try {
					// Update existing contributor
					const response = await updateContributor(contributorId, contributorData);

					// Navigate immediately after successful update
					navigate('/admin');
				} catch (updateError) {
					// Even if there's an error in the response handling, navigate back
					// if the update itself went through
					console.error('Error handling update response:', updateError);
					navigate('/admin');
				}
			}
		} catch (err) {
			setError('Error saving contributor: ' + err.message);
			console.error('Error saving contributor:', err);
			setIsSubmitting(false);
		}
	};

	if (loading) {
		return <div className="contributor-edit-loading">Loading contributor data...</div>;
	}

	return (
		<div className="edit-contributor-page">
			<div className="edit-contributor-header">
				<h1>{isNewContributor ? 'Add New Contributor' : 'Edit Contributor'}</h1>
				<button
					className="cancel-button"
					onClick={() => navigate('/admin')}
				>
					Cancel
				</button>
			</div>

			{error && <div className="edit-contributor-error">{error}</div>}
			{successMessage && <div className="edit-contributor-success">{successMessage}</div>}

			{!isNewContributor && formData.display_name !== originalData?.display_name && (
				<div className="edit-contributor-warning">
					<strong>Note:</strong> Changing the display name will update all items where this contributor
					is listed as the primary contributor.
				</div>
			)}

			<form onSubmit={handleSubmit} className="contributor-form">
				<div className="form-section">
					<div className="form-group">
						<label>Contributor Type:</label>
						<div className="radio-group">
							<label className="radio-label">
								<input
									type="radio"
									name="contributor_type"
									value="individual"
									checked={formData.contributor_type === 'individual'}
									onChange={handleTypeChange}
								/>
								Individual
							</label>
							<label className="radio-label">
								<input
									type="radio"
									name="contributor_type"
									value="organization"
									checked={formData.contributor_type === 'organization'}
									onChange={handleTypeChange}
								/>
								Organization
							</label>
						</div>
					</div>
				</div>

				{/* Individual fields */}
				{formData.contributor_type === 'individual' && (
					<div className="form-section">
						<h2>Individual Information</h2>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="first_name">First Name:</label>
								<input
									type="text"
									id="first_name"
									name="first_name"
									value={formData.first_name}
									onChange={handleInputChange}
								/>
							</div>

							<div className="form-group">
								<label htmlFor="middle_name">Middle Name:</label>
								<input
									type="text"
									id="middle_name"
									name="middle_name"
									value={formData.middle_name}
									onChange={handleInputChange}
								/>
							</div>

							<div className="form-group">
								<label htmlFor="last_name">Last Name:</label>
								<input
									type="text"
									id="last_name"
									name="last_name"
									value={formData.last_name}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						<div className="form-group">
							<label htmlFor="display_name">Display Name:</label>
							<input
								type="text"
								id="display_name"
								name="display_name"
								value={formData.display_name}
								onChange={handleInputChange}
								required
							/>
							<small>How the contributor will be displayed on the site</small>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="birth_year">Birth Year:</label>
								<input
									type="number"
									id="birth_year"
									name="birth_year"
									value={formData.birth_year}
									onChange={handleInputChange}
								/>
							</div>

							<div className="form-group">
								<label htmlFor="death_year">Death Year:</label>
								<input
									type="number"
									id="death_year"
									name="death_year"
									value={formData.death_year}
									onChange={handleInputChange}
									disabled={formData.is_living}
								/>
							</div>
						</div>

						<div className="form-group checkbox-group">
							<label className="checkbox-label">
								<input
									type="checkbox"
									name="is_living"
									checked={formData.is_living}
									onChange={handleInputChange}
								/>
								Is still living
							</label>
						</div>
					</div>
				)}

				{/* Organization fields */}
				{formData.contributor_type === 'organization' && (
					<div className="form-section">
						<h2>Organization Information</h2>

						<div className="form-group">
							<label htmlFor="name">Organization Name:</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								required
							/>
							<small>Used for internal reference and URL structure</small>
						</div>

						<div className="form-group">
							<label htmlFor="display_name">Display Name:</label>
							<input
								type="text"
								id="display_name"
								name="display_name"
								value={formData.display_name}
								onChange={handleInputChange}
								required
							/>
							<small>How the organization will be displayed on the site</small>
						</div>

						<div className="form-row">
							<div className="form-group">
								<label htmlFor="founding_year">Founding Year:</label>
								<input
									type="number"
									id="founding_year"
									name="founding_year"
									value={formData.founding_year}
									onChange={handleInputChange}
								/>
							</div>

							<div className="form-group">
								<label htmlFor="dissolution_year">Dissolution Year:</label>
								<input
									type="number"
									id="dissolution_year"
									name="dissolution_year"
									value={formData.dissolution_year}
									onChange={handleInputChange}
									disabled={formData.is_active}
								/>
							</div>
						</div>

						<div className="form-group checkbox-group">
							<label className="checkbox-label">
								<input
									type="checkbox"
									name="is_active"
									checked={formData.is_active}
									onChange={handleInputChange}
								/>
								Is still active
							</label>
						</div>
					</div>
				)}

				{/* Bio field (for both types) */}
				<div className="form-section">
					<h2>Biography</h2>

					<div className="form-group">
						<label htmlFor="bio">Bio:</label>
						<textarea
							id="bio"
							name="bio"
							value={formData.bio}
							onChange={handleInputChange}
							rows={5}
							placeholder="Enter a brief biography or description..."
						/>
					</div>
				</div>

				<div className="form-actions">
					<button
						type="button"
						className="cancel-button"
						onClick={() => navigate('/admin')}
					>
						Cancel
					</button>
					<button
						type="submit"
						className="save-button"
						disabled={isSubmitting}
					>
						{isSubmitting ? 'Saving...' : (isNewContributor ? 'Create Contributor' : 'Save Changes')}
					</button>
				</div>
			</form>
		</div>
	);
};

export default EditContributorPage;