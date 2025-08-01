interface TaskFiltersProps {
  filters: {
    filter: "all" | "pending" | "completed";
    category: string;
    priority: "" | "low" | "medium" | "high";
    sortBy: "dueDate" | "priority" | "created";
  };
  categories: string[];
  onChange: (filters: any) => void;
}

export function TaskFilters({
  filters,
  categories,
  onChange,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {/* Status Filter */}
      <select
        value={filters.filter}
        onChange={(e) =>
          onChange((prev: any) => ({ ...prev, filter: e.target.value }))
        }
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
      >
        <option value="all">All Tasks</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>

      {/* Category Filter */}
      <select
        value={filters.category}
        onChange={(e) =>
          onChange((prev: any) => ({ ...prev, category: e.target.value }))
        }
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {/* Priority Filter */}
      <select
        value={filters.priority}
        onChange={(e) =>
          onChange((prev: any) => ({ ...prev, priority: e.target.value }))
        }
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
      >
        <option value="">All Priorities</option>
        <option value="high">High Priority</option>
        <option value="medium">Medium Priority</option>
        <option value="low">Low Priority</option>
      </select>

      {/* Sort By */}
      <select
        value={filters.sortBy}
        onChange={(e) =>
          onChange((prev: any) => ({ ...prev, sortBy: e.target.value }))
        }
        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors bg-white"
      >
        <option value="created">Sort by Created</option>
        <option value="dueDate">Sort by Due Date</option>
        <option value="priority">Sort by Priority</option>
      </select>
    </div>
  );
}
