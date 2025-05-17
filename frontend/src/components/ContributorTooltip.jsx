import React, { useState, useRef, useEffect } from 'react';
import '../styles/ContributorTooltip.css';

const ContributorTooltip = ({ contributor, contributorData }) => {
  const [isPinned, setIsPinned] = useState(false);
  const containerRef = useRef(null);
  const tooltipRef = useRef(null);
  
  // Format years info based on contributor type - moved up to use in condition check
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
  
  // Handle click on the contributor name
  const handleNameClick = (e) => {
    if (!showTooltip) return; // Don't do anything if no tooltip
    e.stopPropagation(); // Prevent immediate bubbling to document
    setIsPinned(true);
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
    
    // Add click event listener to document
    document.addEventListener('click', handleClickOutside);
    
    // Clean up the event listener
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isPinned]);
  
  if (!showTooltip) {
    // If no tooltip data, just return the name without the underline or tooltip
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
      </span>
      <div
        ref={tooltipRef}
        className={`contributor-tooltip ${isPinned ? 'pinned' : ''}`}
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