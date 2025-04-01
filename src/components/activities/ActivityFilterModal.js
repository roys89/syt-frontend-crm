import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const ActivityFilterModal = ({ isOpen, onClose, onApplyFilters, initialFilters }) => {
  const [filters, setFilters] = useState({
    nameSearch: '',
    priceRange: {
      min: '',
      max: '',
    },
    sortBy: 'relevance', // 'relevance', 'price_low_high', 'price_high_low'
    ...initialFilters
  });

  useEffect(() => {
    if (initialFilters) {
      setFilters(prev => ({
        ...prev,
        ...initialFilters
      }));
    }
  }, [initialFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFilters(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleReset = () => {
    setFilters({
      nameSearch: '',
      priceRange: {
        min: '',
        max: '',
      },
      sortBy: 'relevance'
    });
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-md text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close panel</span>
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Name search */}
            <div>
              <label htmlFor="nameSearch" className="block text-sm font-medium text-gray-700">
                Activity Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="nameSearch"
                  id="nameSearch"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Search by name"
                  value={filters.nameSearch}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Price range */}
            <div>
              <h3 className="text-sm font-medium text-gray-700">Price Range</h3>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priceRange.min" className="block text-xs text-gray-500">
                    Min Price
                  </label>
                  <input
                    type="number"
                    name="priceRange.min"
                    id="priceRange.min"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Min"
                    min="0"
                    value={filters.priceRange.min}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label htmlFor="priceRange.max" className="block text-xs text-gray-500">
                    Max Price
                  </label>
                  <input
                    type="number"
                    name="priceRange.max"
                    id="priceRange.max"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Max"
                    min="0"
                    value={filters.priceRange.max}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Sort by */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={filters.sortBy}
                onChange={handleInputChange}
              >
                <option value="relevance">Relevance</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 border-t space-y-2">
          <button
            type="button"
            className="w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleReset}
          >
            Reset Filters
          </button>
          <button
            type="button"
            className="w-full rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={handleApply}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFilterModal; 