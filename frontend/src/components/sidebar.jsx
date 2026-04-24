const Sidebar = ({ categories = [], selectedCategory = "All", onCategoryChange }) => {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:sticky lg:top-28">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-500)]">
          Browse
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Categories</h3>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {categories.map((category) => {
          const isActive = category === selectedCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`shrink-0 rounded-2xl px-4 py-3 text-left text-sm font-medium transition lg:w-full ${
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
