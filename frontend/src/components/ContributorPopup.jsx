import React from 'react';
import '../styles/ContributorPopup.css';

const ContributorPopup = ({ contributor }) => {
	if (!contributor) return null;

	return (
		<div className="contributor-popup">
			<h4>{contributor.display_name}</h4>

			{contributor.contributor_type === 'individual' ? (
				<div className="contributor-info">
					<span className="contributor-type">Individual</span>
					<p className="contributor-dates">
						<span className="label">Lifespan:</span> {contributor.birth_year} - {contributor.death_year || 'Present'}
						{contributor.is_living ? ' (Living)' : ''}
					</p>
				</div>
			) : (
				<div className="contributor-info">
					<span className="contributor-type">Organization</span>
					<p className="contributor-dates">
						<span className="label">Established:</span> {contributor.founding_year}
						{contributor.dissolution_year ? ` - ${contributor.dissolution_year}` : ''}
						{contributor.is_active ? ' (Active)' : ''}
					</p>
				</div>
			)}

			{contributor.bio && (
				<div className="bio-section">
					<span className="label">Biography:</span>
					<p className="contributor-bio">{contributor.bio}</p>
				</div>
			)}
		</div>
	);
};

export default ContributorPopup;