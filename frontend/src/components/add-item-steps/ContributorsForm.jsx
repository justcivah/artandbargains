import React, { useState } from 'react';
import { createEntity } from '../../api/itemsApi';
import '../../styles/StepComponents.css';

const ContributorsForm = ({
	contributors,
	primaryContributor,
	contributorsList,
	onChange,
	onPrimaryChange,
	setContributorsList
}) => {
	const [showCreateModal, setShowCreateModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState(null);
	const [searchQueries, setSearchQueries] = useState({});

	// New contributor form fields
	const [contributorType, setContributorType] = useState('individual');
	const [firstName, setFirstName] = useState('');
	const [middleName, setMiddleName] = useState('');
	const [lastName, setLastName] = useState('');
	const [displayName, setDisplayName] = useState('');
	const [birthYear, setBirthYear] = useState('');
	const [deathYear, setDeathYear] = useState('');
	const [isLiving, setIsLiving] = useState(false);
	const [orgName, setOrgName] = useState('');
	const [orgDisplayName, setOrgDisplayName] = useState('');
	const [foundingYear, setFoundingYear] = useState('');
	const [dissolutionYear, setDissolutionYear] = useState('');
	const [isActive, setIsActive] = useState(false);
	const [bio, setBio] = useState('');

	// Contributor position options
	const positionOptions = [
		'engraver',
		'lithographer',
		'etcher',
		'delineavit',
		'cartographer',
		'publisher',
		'artist',
		'photographer',
		'designer',
		'manufacturer',
		'printer'
	];

	// Filter and sort contributors based on search query
	const filterContributors = (searchQuery) => {
		// Helper function to remove accents/diacritical marks
		const removeAccents = (str) => {
			return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		};

		if (!searchQuery) {
			return contributorsList.sort((a, b) => {
				const nameA = a.display_name || '';
				const nameB = b.display_name || '';
				return nameA.localeCompare(nameB);
			});
		}

		// Normalize the search query to remove accents
		const search = removeAccents(searchQuery.toLowerCase());

		return contributorsList
			.filter(contributor => {
				// Normalize each field to remove accents before comparing
				const displayName = contributor.display_name
					? removeAccents(contributor.display_name.toLowerCase())
					: '';
				const id = contributor.name
					? removeAccents(contributor.name.toLowerCase())
					: '';
				const type = contributor.contributor_type
					? removeAccents(contributor.contributor_type.toLowerCase())
					: '';

				return displayName.includes(search) ||
					id.includes(search) ||
					type.includes(search);
			})
			.sort((a, b) => {
				const nameA = a.display_name || '';
				const nameB = b.display_name || '';
				return nameA.localeCompare(nameB);
			});
	};

	// Update search query for a specific contributor row
	const handleSearchChange = (index, value) => {
		setSearchQueries({
			...searchQueries,
			[index]: value
		});
	};

	// Add a new contributor to the list
	const handleAddContributor = () => {
		const newContributor = {
			position: positionOptions[0],
			contributor: null
		};
		onChange([...contributors, newContributor]);
	};

	// Remove a contributor from the list
	const handleRemoveContributor = (index) => {
		const updatedContributors = [...contributors];
		updatedContributors.splice(index, 1);
		onChange(updatedContributors);

		// Update primary contributor if needed
		if (primaryContributor && index === contributors.findIndex(c => c.contributor && c.contributor.display_name === primaryContributor)) {
			onPrimaryChange('');
		}

		// Clean up search query for this index
		const updatedQueries = { ...searchQueries };
		delete updatedQueries[index];
		setSearchQueries(updatedQueries);
	};

	// Update a contributor's position
	const handlePositionChange = (index, position) => {
		const updatedContributors = [...contributors];
		updatedContributors[index].position = position;
		onChange(updatedContributors);
	};

	// Update a contributor's selection
	const handleContributorSelect = (index, contributor) => {
		const updatedContributors = [...contributors];
		updatedContributors[index].contributor = contributor;
		onChange(updatedContributors);

		// If this is the first contributor, set it as primary
		if (!primaryContributor && contributor) {
			onPrimaryChange(contributor.display_name);
		}
	};

	// Handle contributor dropdown change with auto-select first filtered item
	const handleContributorDropdownChange = (index, value) => {
		if (value) {
			const selected = contributorsList.find(c => c.PK === value);
			handleContributorSelect(index, selected);
		} else {
			// If empty value selected, check if there's a search query and auto-select first result
			const searchQuery = searchQueries[index];
			if (searchQuery) {
				const filteredList = filterContributors(searchQuery);
				if (filteredList.length > 0) {
					handleContributorSelect(index, filteredList[0]);
				} else {
					handleContributorSelect(index, null);
				}
			} else {
				handleContributorSelect(index, null);
			}
		}
	};

	// Update search query and auto-select first result
	const handleSearchChangeWithAutoSelect = (index, value) => {
		handleSearchChange(index, value);

		// Auto-select first filtered result if there's a search query
		if (value) {
			const filteredList = filterContributors(value);
			if (filteredList.length > 0) {
				handleContributorSelect(index, filteredList[0]);
			}
		}
	};

	// Set a contributor as primary
	const handleSetPrimary = (contributor) => {
		onPrimaryChange(contributor.display_name);
	};

	// Helper function to capitalize first letter of each word
	const capitalizeFirstLetter = (string) => {
		if (!string) return '';
		return string.split(' ').map(word =>
			word.charAt(0).toUpperCase() + word.slice(1)
		).join(' ');
	};

	// Update isLiving based on death year
	const handleDeathYearChange = (value) => {
		setDeathYear(value);
		setIsLiving(!value);
	};

	// Update isActive based on dissolution year
	const handleDissolutionYearChange = (value) => {
		setDissolutionYear(value);
		setIsActive(!value);
	};

	// Check if contributor already exists
	const checkContributorExists = (id, type) => {
		const existingContributor = contributorsList.find(c => {
			const contributorId = c.PK.replace('CONTRIBUTOR#', '');
			return contributorId === id && c.contributor_type === type;
		});
		return existingContributor;
	};

	// Create a new contributor
	const handleCreateContributor = async (e) => {
		e.preventDefault();

		try {
			setIsSubmitting(true);
			setError(null);

			let newContributorData;
			let contributorId;

			if (contributorType === 'individual') {
				// Validate required fields
				if ((!firstName && !lastName) || !displayName) {
					setError('At least one name (first or last) and display name are required');
					setIsSubmitting(false);
					return;
				}

				// Format the contributor ID
				contributorId = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`.replace(/\s+/g, '_');

				// Check if contributor already exists
				const existing = checkContributorExists(contributorId, 'individual');
				if (existing) {
					setError(`A contributor named "${existing.display_name}" already exists with this name combination.`);
					setIsSubmitting(false);
					return;
				}

				newContributorData = {
					PK: `CONTRIBUTOR#${contributorId}`,
					contributor_type: 'individual',
					first_name: firstName,
					middle_name: middleName || null,
					last_name: lastName,
					display_name: displayName,
					birth_year: birthYear ? parseInt(birthYear) : null,
					death_year: deathYear ? parseInt(deathYear) : null,
					is_living: isLiving,
					bio: bio,
					entity_type: 'contributor',
					name: contributorId // Include name for compatibility
				};
			} else {
				// Validate required fields
				if (!orgName || !orgDisplayName) {
					setError('Organization name and display name are required');
					setIsSubmitting(false);
					return;
				}

				// Format the contributor ID
				contributorId = orgName.toLowerCase().replace(/\s+/g, '_');

				// Check if contributor already exists
				const existing = checkContributorExists(contributorId, 'organization');
				if (existing) {
					setError(`An organization named "${existing.display_name}" already exists with this name.`);
					setIsSubmitting(false);
					return;
				}

				newContributorData = {
					PK: `CONTRIBUTOR#${contributorId}`,
					contributor_type: 'organization',
					name: contributorId, // Ensure name is set consistently
					display_name: orgDisplayName,
					founding_year: foundingYear ? parseInt(foundingYear) : null,
					dissolution_year: dissolutionYear ? parseInt(dissolutionYear) : null,
					is_active: isActive,
					bio: bio,
					entity_type: 'contributor'
				};
			}

			// Create the contributor in database
			try {
				await createEntity('contributors', newContributorData);
			} catch (error) {
				throw new Error(`Failed to create contributor: ${error.message}`);
			}

			// Update the list of contributors
			setContributorsList([...contributorsList, newContributorData]);

			// Add the newly created contributor to the current list and select it
			if (contributors.length > 0) {
				const lastEmptyIndex = contributors.findIndex(c => !c.contributor);
				if (lastEmptyIndex >= 0) {
					handleContributorSelect(lastEmptyIndex, newContributorData);
				}
			}

			// Close the modal
			setShowCreateModal(false);

			// Reset form fields
			resetForm();
		} catch (err) {
			setError('Error creating contributor: ' + err.message);
			console.error('Error creating contributor:', err);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Reset the form
	const resetForm = () => {
		setContributorType('individual');
		setFirstName('');
		setMiddleName('');
		setLastName('');
		setDisplayName('');
		setBirthYear('');
		setDeathYear('');
		setIsLiving(false);
		setOrgName('');
		setOrgDisplayName('');
		setFoundingYear('');
		setDissolutionYear('');
		setIsActive(true);
		setBio('');
		setError(null);
	};

	return (
		<div className="step-container">
			<h2>Contributors</h2>
			<p className="step-description">
				Add the contributors who created this item. You can add multiple contributors with different roles.
			</p>

			{error && <div className="step-error">{error}</div>}

			<div className="contributors-list">
				{contributors.length === 0 && (
					<div className="no-contributors">
						No contributors added. Click the button below to add a contributor.
					</div>
				)}

				{contributors.map((contributor, index) => {
					const searchQuery = searchQueries[index] || '';
					const filteredList = filterContributors(searchQuery);
					const hasSearchQuery = searchQuery.trim().length > 0;
					const noSearchResults = hasSearchQuery && filteredList.length === 0;

					return (
						<div key={index} className="contributor-row">
							<div className="contributor-header">
								<div className="contributor-position-header">
									<label>Position:</label>
								</div>
								<div className="contributor-select-header">
									<label>Contributor:</label>
								</div>
								<div className="primary-header">
									{/* Empty space to maintain grid layout */}
								</div>
							</div>

							<div className="contributor-content">
								<div className="contributor-position">
									<select
										value={contributor.position}
										onChange={(e) => handlePositionChange(index, e.target.value)}
										className="position-select"
									>
										{positionOptions.map(option => (
											<option key={option} value={option}>
												{option.charAt(0).toUpperCase() + option.slice(1)}
											</option>
										))}
									</select>
								</div>

								<div className="contributor-select">
									<div className="contributor-dropdown-container">
										{contributorsList.length > 8 && (
											<input
												type="text"
												placeholder="Search contributors..."
												value={searchQuery}
												onChange={(e) => handleSearchChangeWithAutoSelect(index, e.target.value)}
												className="contributor-search-input"
												style={{
													width: '100%',
													padding: '6px 10px',
													marginBottom: '8px',
													border: '1px solid #ddd',
													borderRadius: '4px',
													fontSize: '0.85rem'
												}}
											/>
										)}
										<select
											value={contributor.contributor ? contributor.contributor.PK : ''}
											onChange={(e) => handleContributorDropdownChange(index, e.target.value)}
											className="contributor-dropdown"
										>
											<option value="">-- Select Contributor --</option>
											{filteredList.map(c => (
												<option key={c.PK} value={c.PK}>
													{c.display_name} ({c.contributor_type === 'individual' ? 'Individual' : 'Organization'})
												</option>
											))}
										</select>
									</div>
								</div>
								<div className="actions-container">
									{(!contributor.contributor || noSearchResults) && (
										<button
											type="button"
											className="create-button"
											onClick={() => setShowCreateModal(true)}
										>
											Create New
										</button>
									)}
									{contributor.contributor && !noSearchResults && (
										<div className="primary-selector">
											<label className="radio-label">
												<input
													type="radio"
													name="primaryContributor"
													checked={primaryContributor === contributor.contributor.display_name}
													onChange={() => handleSetPrimary(contributor.contributor)}
												/>
												Primary
											</label>
										</div>
									)}
									<button
										type="button"
										className="remove-button"
										onClick={() => handleRemoveContributor(index)}
									>
										Remove
									</button>
								</div>
							</div>
						</div>
					);
				})}

				<button
					type="button"
					className="add-contributor-button"
					onClick={handleAddContributor}
				>
					+ Add Contributor
				</button>
			</div>

			{showCreateModal && (
				<div className="modal-overlay">
					<div className="modal-content modal-lg">
						<h3>Create New Contributor</h3>

						<div className="contributor-type-selector">
							<label>Contributor Type:</label>
							<div className="radio-group">
								<label className="radio-label">
									<input
										type="radio"
										name="contributorType"
										value="individual"
										checked={contributorType === 'individual'}
										onChange={() => setContributorType('individual')}
									/>
									Individual
								</label>

								<label className="radio-label">
									<input
										type="radio"
										name="contributorType"
										value="organization"
										checked={contributorType === 'organization'}
										onChange={() => setContributorType('organization')}
									/>
									Organization
								</label>
							</div>
						</div>

						<form onSubmit={handleCreateContributor}>
							{/* Individual Form */}
							{contributorType === 'individual' && (
								<>
									<div className="form-row">
										<div className="form-group">
											<label htmlFor="firstName">First Name:</label>
											<input
												type="text"
												id="firstName"
												value={firstName}
												onChange={(e) => {
													const f = capitalizeFirstLetter(e.target.value);

													setFirstName(f);
													setDisplayName(`${f}${middleName ? ` ${middleName.trim().split(' ').map(word => `${word.charAt(0)}.`).join(' ')}` : ''}${lastName ? ` ${lastName}` : ''}`);
												}}
											/>
										</div>

										<div className="form-group">
											<label htmlFor="middleName">Middle Name:</label>
											<input
												type="text"
												id="middleName"
												value={middleName}
												onChange={(e) => {
													const m = capitalizeFirstLetter(e.target.value);

													setMiddleName(m);
													setDisplayName(`${firstName}${m ? ` ${m.trim().split(' ').map(word => `${word.charAt(0)}.`).join(' ')}` : ''}${lastName ? ` ${lastName}` : ''}`);
												}}
											/>
										</div>

										<div className="form-group">
											<label htmlFor="lastName">Last Name:</label>
											<input
												type="text"
												id="lastName"
												value={lastName}
												onChange={(e) => {
													const l = capitalizeFirstLetter(e.target.value);

													setLastName(l);
													setDisplayName(`${firstName}${middleName ? ` ${middleName.trim().split(' ').map(word => `${word.charAt(0)}.`).join(' ')}` : ''}${l ? ` ${l}` : ''}`);
												}}
											/>
										</div>
									</div>

									<div className="form-row">
										<div className="form-group">
											<label htmlFor="displayName">Display Name:</label>
											<input
												type="text"
												id="displayName"
												value={displayName}
												onChange={(e) => setDisplayName(e.target.value)}
												required
											/>
											<small>Auto-generated from name fields, but can be edited</small>
										</div>
									</div>

									<div className="form-row">
										<div className="form-group">
											<label htmlFor="birthYear">Birth Year:</label>
											<input
												type="number"
												id="birthYear"
												value={birthYear}
												onChange={(e) => setBirthYear(e.target.value)}
											/>
										</div>

										<div className="form-group">
											<label htmlFor="deathYear">Death Year:</label>
											<input
												type="number"
												id="deathYear"
												value={deathYear}
												onChange={(e) => handleDeathYearChange(e.target.value)}
											/>
										</div>
									</div>

									<div className="form-group checkbox-group">
										<label className="checkbox-label">
											<input
												type="checkbox"
												checked={isLiving}
												onChange={(e) => setIsLiving(e.target.checked)}
											/>
											Is still living
										</label>
									</div>
								</>
							)}

							{/* Organization Form */}
							{contributorType === 'organization' && (
								<>
									<div className="form-row">
										<div className="form-group">
											<label htmlFor="orgName">Organization Name:</label>
											<input
												type="text"
												id="orgName"
												value={orgName}
												onChange={(e) => {
													const o = capitalizeFirstLetter(e.target.value);

													setOrgName(o);
													setOrgDisplayName(o);
												}}
												required
											/>
										</div>
									</div>

									<div className="form-row">
										<div className="form-group">
											<label htmlFor="orgDisplayName">Display Name:</label>
											<input
												type="text"
												id="orgDisplayName"
												value={orgDisplayName}
												onChange={(e) => setOrgDisplayName(e.target.value)}
												required
											/>
											<small>Auto-generated from organization name, but can be edited</small>
										</div>
									</div>

									<div className="form-row">
										<div className="form-group">
											<label htmlFor="foundingYear">Founding Year:</label>
											<input
												type="number"
												id="foundingYear"
												value={foundingYear}
												onChange={(e) => setFoundingYear(e.target.value)}
											/>
										</div>

										<div className="form-group">
											<label htmlFor="dissolutionYear">Dissolution Year:</label>
											<input
												type="number"
												id="dissolutionYear"
												value={dissolutionYear}
												onChange={(e) => handleDissolutionYearChange(e.target.value)}
											/>
										</div>
									</div>

									<div className="form-group checkbox-group">
										<label className="checkbox-label">
											<input
												type="checkbox"
												checked={isActive}
												onChange={(e) => setIsActive(e.target.checked)}
											/>
											Is still active
										</label>
									</div>
								</>
							)}

							{/* Bio (for both types) */}
							<div className="form-group">
								<label htmlFor="bio">Bio:</label>
								<textarea
									id="bio"
									value={bio}
									onChange={(e) => setBio(e.target.value)}
									rows={3}
									placeholder="Brief biography..."
								/>
							</div>

							<div className="modal-actions">
								<button
									type="button"
									className="cancel-button"
									onClick={() => {
										setShowCreateModal(false);
										resetForm();
									}}
									disabled={isSubmitting}
								>
									Cancel
								</button>
								<button
									type="submit"
									className="confirm-button"
									disabled={isSubmitting}
								>
									{isSubmitting ? 'Creating...' : 'Create Contributor'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ContributorsForm;