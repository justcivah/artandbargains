import React from 'react';
import '../styles/ShopPagination.css';

const ShopPagination = ({ currentPage, totalPages, onPageChange }) => {
	// Generate array of page numbers to display
	const getPageNumbers = () => {
		const pageNumbers = [];

		// Always include first and last page
		// For small number of pages, show all
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				pageNumbers.push(i);
			}
			return pageNumbers;
		}

		// For larger number of pages, show a window around current page
		// Always include 1 and totalPages
		pageNumbers.push(1);

		// Add ellipsis if needed
		if (currentPage > 3) {
			pageNumbers.push('...');
		}

		// Add pages around current page
		const start = Math.max(2, currentPage - 1);
		const end = Math.min(totalPages - 1, currentPage + 1);

		for (let i = start; i <= end; i++) {
			pageNumbers.push(i);
		}

		// Add ellipsis if needed
		if (currentPage < totalPages - 2) {
			pageNumbers.push('...');
		}

		// Add last page if not already included
		if (totalPages > 1) {
			pageNumbers.push(totalPages);
		}

		return pageNumbers;
	};

	const pageNumbers = getPageNumbers();

	return (
		<div className="shop-pagination">
			<button
				className="pagination-arrow"
				onClick={() => onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				aria-label="Previous page"
			>
				&laquo;
			</button>

			<div className="pagination-numbers">
				{pageNumbers.map((page, index) => {
					if (page === '...') {
						return <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>;
					}

					return (
						<button
							key={page}
							className={`pagination-number ${currentPage === page ? 'active' : ''}`}
							onClick={() => onPageChange(page)}
							aria-label={`Page ${page}`}
							aria-current={currentPage === page ? 'page' : undefined}
						>
							{page}
						</button>
					);
				})}
			</div>

			<button
				className="pagination-arrow"
				onClick={() => onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				aria-label="Next page"
			>
				&raquo;
			</button>
		</div>
	);
};

export default ShopPagination;