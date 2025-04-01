import React, { useEffect, useState } from 'react';

const ActivityFilterPanel = ({ onApplyFilters, initialFilters }) => {
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
    const resetFilters = {
      nameSearch: '',
      priceRange: {
        min: '',
        max: '',
      },
      sortBy: 'relevance'
    };
    
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <svg className="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        </div>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {Object.values(filters).some(val => 
            val && (typeof val === 'object' ? 
              Object.values(val).some(v => v !== '') : 
              val !== ''
            )
          ) ? 'Active' : 'No filters'}
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Name search */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label htmlFor="nameSearch" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search by Activity Name
          </label>
          <div className="relative">
            <input
              type="text"
              name="nameSearch"
              id="nameSearch"
              className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Enter activity name"
              value={filters.nameSearch}
              onChange={handleInputChange}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Price range */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
            <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Price Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="priceRange.min" className="block text-xs text-gray-500 mb-1">
                Min Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="priceRange.min"
                  id="priceRange.min"
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Min"
                  min="0"
                  value={filters.priceRange.min}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div>
              <label htmlFor="priceRange.max" className="block text-xs text-gray-500 mb-1">
                Max Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₹</span>
                </div>
                <input
                  type="number"
                  name="priceRange.max"
                  id="priceRange.max"
                  className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Max"
                  min="0"
                  value={filters.priceRange.max}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sort by */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <label htmlFor="sortBy" className="flex items-center text-sm font-medium text-gray-700 mb-2">
            <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Sort Results
          </label>
          <select
            id="sortBy"
            name="sortBy"
            className="block w-full pl-3 pr-10 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none bg-white"
            value={filters.sortBy}
            onChange={handleInputChange}
          >
            <option value="relevance">Relevance</option>
            <option value="price_low_high">Price: Low to High</option>
            <option value="price_high_low">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-gray-200 flex space-x-3">
        <button
          type="button"
          className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          onClick={handleApply}
        >
          Apply Filters
        </button>
        <button
          type="button"
          className="flex-1 py-2.5 px-4 border border-gray-300 text-gray-700 text-sm font-medium rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default ActivityFilterPanel; 