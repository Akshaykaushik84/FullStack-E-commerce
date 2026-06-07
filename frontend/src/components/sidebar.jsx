const Sidebar = ({ categories = [], selectedCategory = "All", onCategoryChange }) => {
  return (
    <aside className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-28 lg:self-stretch">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-5 sm:py-4 lg:block lg:border-b-0 lg:pb-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--brand-500)] sm:text-xs sm:tracking-[0.3em]">
            Browse
          </p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 sm:text-xl lg:mt-2">
            Categories
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 lg:hidden">
          {categories.length}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto px-3 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5 lg:max-h-none lg:flex-col lg:gap-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pt-2">
        {categories.map((category) => {
          const isActive = category === selectedCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-left text-xs font-medium transition sm:px-4 sm:py-2.5 sm:text-sm lg:w-full lg:whitespace-normal lg:rounded-2xl lg:py-3 ${
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
