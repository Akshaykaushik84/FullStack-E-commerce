const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const start = Math.max(currentPage - 2, 1);
  const end = Math.min(start + 4, totalPages);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 sm:gap-3 ${className}`}>
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 sm:rounded-2xl sm:px-4 sm:text-sm"
      >
        Prev
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`h-9 min-w-9 rounded-xl px-2.5 text-xs font-semibold transition sm:h-11 sm:min-w-11 sm:rounded-2xl sm:px-4 sm:text-sm ${
            page === currentPage
              ? "bg-[var(--brand-600)] text-white shadow-lg shadow-blue-100"
              : "border border-slate-200 bg-white text-slate-600 hover:border-[var(--brand-200)] hover:text-[var(--brand-600)]"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 sm:rounded-2xl sm:px-4 sm:text-sm"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
