import React, { useState, useRef, useEffect } from 'react';
import '../styles/ContributorTooltip.css';

const ContributorTooltip = ({ contributor, contributorData }) => {
	const [isPinned, setIsPinned] = useState(false);
	const [tooltipStyle, setTooltipStyle] = useState({});
	const containerRef = useRef(null);
	const tooltipRef = useRef(null);

	// Format years info based on contributor type
	const getYearsInfo = () => {
		if (!contributorData) return null;

		if (contributorData.contributor_type === 'individual') {
			if (contributorData.is_living && contributorData.birth_year) {
				return `${contributorData.birth_year} - Present`;
			} else if (contributorData.birth_year && contributorData.death_year) {
				return `${contributorData.birth_year} - ${contributorData.death_year}`;
			} else if (contributorData.birth_year) {
				return `b. ${contributorData.birth_year}`;
			}
		} else if (contributorData.contributor_type === 'organization') {
			if (contributorData.is_active && contributorData.founding_year) {
				return `Est. ${contributorData.founding_year} - Present`;
			} else if (contributorData.founding_year && contributorData.dissolution_year) {
				return `Est. ${contributorData.founding_year} - ${contributorData.dissolution_year}`;
			} else if (contributorData.founding_year) {
				return `Est. ${contributorData.founding_year}`;
			}
		}
		return null;
	};

	const yearsInfo = getYearsInfo();
	const hasBio = contributorData && contributorData.bio;

	// Only show tooltip if we have EITHER years info OR bio
	const showTooltip = (!!yearsInfo || !!hasBio) && !!contributorData;

	// Calculate and adjust tooltip position
	useEffect(() => {
		if (!showTooltip || !tooltipRef.current || !containerRef.current) return;

		const calculatePosition = () => {
			const containerRect = containerRef.current.getBoundingClientRect();
			const tooltipRect = tooltipRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;

			// Default position (centered below)
			let leftPos = '50%';
			let transform = 'translateX(-50%)';

			// Check if tooltip would overflow right side
			if (containerRect.left + (tooltipRect.width / 2) > viewportWidth - 20) {
				const overflowRight = (containerRect.left + (tooltipRect.width / 2)) - (viewportWidth - 20);
				leftPos = `calc(50% - ${overflowRight}px)`;
			}

			// Check if tooltip would overflow left side
			if (containerRect.left - (tooltipRect.width / 2) < 20) {
				const overflowLeft = 20 - (containerRect.left - (tooltipRect.width / 2));
				leftPos = `calc(50% + ${overflowLeft}px)`;
			}

			// Mobile full-width adjustment
			if (viewportWidth <= 576) {
				leftPos = '50%';
				transform = 'translateX(-50%)';
			}

			setTooltipStyle({
				left: leftPos,
				transform: transform
			});
		};

		// Calculate initial position
		calculatePosition();

		// Recalculate on resize
		window.addEventListener('resize', calculatePosition);

		return () => {
			window.removeEventListener('resize', calculatePosition);
		};
	}, [showTooltip, isPinned]);

	// Handle click on the contributor name
	const handleNameClick = (e) => {
		if (!showTooltip) return;
		e.stopPropagation();
		setIsPinned(!isPinned); // Toggle pinned state
	};

	// Handle clicks outside the tooltip
	useEffect(() => {
		if (!isPinned) return;

		const handleClickOutside = (event) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target) &&
				tooltipRef.current &&
				!tooltipRef.current.contains(event.target)
			) {
				setIsPinned(false);
			}
		};

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	}, [isPinned]);

	if (!showTooltip) {
		// If no tooltip data, just return the name
		return (
			<span className="contributor-name">
				{contributor.display_name || contributorData?.display_name || contributor.contributor_id}
			</span>
		);
	}

	return (
		<div className="contributor-tooltip-container" ref={containerRef}>
			<span
				className="contributor-name-with-tooltip"
				onClick={handleNameClick}
			>
				{contributor.display_name || contributorData?.display_name || contributor.contributor_id}
				<span className="tooltip-icon">?</span>
			</span>

			<div
				ref={tooltipRef}
				className={`contributor-tooltip ${isPinned ? 'pinned' : ''}`}
				style={tooltipStyle}
			>
				<div className="contributor-tooltip-header">
					<h4>{contributorData.display_name}</h4>
					{yearsInfo && <div className="contributor-years">{yearsInfo}</div>}
				</div>
				{hasBio && <p className="contributor-bio">{contributorData.bio}</p>}
			</div>
		</div>
	);
};

export default ContributorTooltip;