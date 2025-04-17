import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const CrmActivityFilterMdal = ({ 
    initialFilters, 
    priceRange, 
    currentSort, 
    onFilterChange, 
    onSortChange 
}) => {
    // Local state for UI interaction
    const [localFilters, setLocalFilters] = useState(initialFilters || { search: '', price: [0, 10000] });
    const [priceInput, setPriceInput] = useState({
        min: localFilters.price[0],
        max: localFilters.price[1]
    });

    // Update local state when props change
    useEffect(() => {
        if (initialFilters) {
            setLocalFilters(initialFilters);
            setPriceInput({
                min: initialFilters.price[0],
                max: initialFilters.price[1]
            });
        }
    }, [initialFilters]);

    // Handle search input changes
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalFilters(prev => ({ ...prev, search: value }));
        onFilterChange('search', value);
    };

    // Handle price slider changes
    const handlePriceChange = (e, type) => {
        const value = parseInt(e.target.value, 10) || 0;
        
        // Update local UI state
        setPriceInput(prev => ({ ...prev, [type]: value }));
        
        // Only update actual filters after a short delay to avoid too many rerenders
        const newPriceRange = type === 'min' 
            ? [value, localFilters.price[1]] 
            : [localFilters.price[0], value];
            
        // Update parent component state immediately
        onFilterChange('price', newPriceRange);
    };

    // Handle sort selection
    const handleSortChange = (e) => {
        const value = e.target.value;
        onSortChange(value);
    };

    // Reset all filters
    const handleResetFilters = () => {
        onFilterChange('reset');
    };

    return (
        <div className="bg-white rounded-lg shadow p-4 w-full">
            <div className="flex items-center border-b border-gray-200 pb-4 mb-4">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
                <h3 className="text-lg font-medium text-gray-800">Filter Activities</h3>
            </div>

            {/* Search Input */}
            <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                </label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="search"
                        id="search"
                        value={localFilters.search}
                        onChange={handleSearchChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Activity name..."
                    />
                </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="price-range" className="block text-sm font-medium text-gray-700">
                        Price Range (₹)
                    </label>
                    <span className="text-xs text-gray-500">
                        ₹{priceInput.min} - ₹{priceInput.max}
                    </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <label htmlFor="min-price" className="sr-only">Minimum Price</label>
                        <input
                            type="number"
                            id="min-price"
                            min={priceRange.min}
                            max={priceInput.max}
                            value={priceInput.min}
                            onChange={(e) => handlePriceChange(e, 'min')}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="max-price" className="sr-only">Maximum Price</label>
                        <input
                            type="number"
                            id="max-price"
                            min={priceInput.min}
                            max={priceRange.max}
                            value={priceInput.max}
                            onChange={(e) => handlePriceChange(e, 'max')}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                </div>
                
                <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={priceInput.min}
                    onChange={(e) => handlePriceChange(e, 'min')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <input
                    type="range"
                    min={priceRange.min}
                    max={priceRange.max}
                    value={priceInput.max}
                    onChange={(e) => handlePriceChange(e, 'max')}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2"
                />
            </div>

            {/* Sort Options */}
            <div className="mb-6">
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                </label>
                <select
                    id="sort"
                    name="sort"
                    value={currentSort}
                    onChange={handleSortChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                </select>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t border-gray-200">
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Reset All Filters
                </button>
            </div>
        </div>
    );
};

export default CrmActivityFilterMdal; 