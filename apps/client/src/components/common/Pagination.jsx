export function Pagination({ pagination, onPageChange, isLoading = false }) {
  if (!pagination) return null;

  const { currentPage = 1, totalPages = 1, totalRecords = 0, hasPrevPage = false, hasNextPage = false } = pagination;

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Showing page <strong>{currentPage}</strong> of <strong>{totalPages || 1}</strong>
        <span className="pagination-total">({totalRecords} total {totalRecords === 1 ? 'record' : 'records'})</span>
      </div>

      <div className="pagination-actions">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasPrevPage || isLoading}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          &larr; Prev
        </button>

        <span className="pagination-current-pill">
          Page {currentPage}
        </span>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={!hasNextPage || isLoading}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
}
