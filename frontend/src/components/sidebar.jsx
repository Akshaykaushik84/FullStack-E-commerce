const Sidebar = ({ categories = [], selectedCategory = "All", onCategoryChange }) => {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-[2rem] sm:p-5 lg:sticky lg:top-28">
      <div className="mb-3 sm:mb-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--brand-500)] sm:text-xs sm:tracking-[0.3em]">
          Browse
        </p>
        <h3 className="mt-1.5 text-base font-semibold text-slate-900 sm:mt-2 sm:text-xl">Categories</h3>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-3 lg:overflow-visible">
        {categories.map((category) => {
          const isActive = category === selectedCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-xl px-3 py-2 text-left text-xs font-medium transition sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm lg:w-full ${
                isActive
                  ? "bg-[var(--brand-600)] text-white shadow-lg shadow-blue-100"
                  : "bg-slate-50 text-slate-600 hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
