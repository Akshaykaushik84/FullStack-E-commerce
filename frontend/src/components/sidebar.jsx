const Sidebar = ({ categories = [], selectedCategory = "All", onCategoryChange }) => {
  return (
    <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--brand-500)]">
          Browse
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-900">Categories</h3>
      </div>

      <div className="flex flex-wrap gap-3 lg:flex-col">
        {categories.map((category) => {
          const isActive = category === selectedCategory;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange(category)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
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
