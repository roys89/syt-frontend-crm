import {
    AdjustmentsHorizontalIcon,
    ArrowsUpDownIcon,
    ArrowUturnLeftIcon,
    MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

// Helper to format currency for display
const formatCurrency = (value) => {
    return `₹${Math.round(value).toLocaleString('en-IN')}`;
};

const CrmActivityFilterMenu = ({ 
    priceRange, 
    filters, 
    onFilterChange, 
    onSortChange, 
    currentSort,
}) => {
    const [localPriceRange, setLocalPriceRange] = useState(filters.price || [0, 10000]);
    const [localSearch, setLocalSearch] = useState(filters.search || '');
    const [debounceTimeout, setDebounceTimeout] = useState(null);

    // Update local state when external filters or price range changes
    useEffect(() => {
        // Ensure price filter respects the actual min/max derived from fetched data
        const initialMin = priceRange.min ?? 0;
        const initialMax = priceRange.max ?? 10000;
        setLocalPriceRange(filters.price || [initialMin, initialMax]);
        setLocalSearch(filters.search || '');
    }, [filters, priceRange]);

    // Handle price slider input change (updates local state for immediate feedback)
    const handlePriceInputChange = (index, value) => {
        const newRange = [...localPriceRange];
        // Basic validation: ensure value is a number and within bounds
        let numValue = parseFloat(value);
        if (isNaN(numValue)) numValue = index === 0 ? priceRange.min : priceRange.max;
        numValue = Math.max(priceRange.min, Math.min(priceRange.max, numValue));

        // Prevent min from exceeding max and vice-versa
        if (index === 0 && numValue > newRange[1]) {
            numValue = newRange[1];
        }
        if (index === 1 && numValue < newRange[0]) {
            numValue = newRange[0];
        }
        
        newRange[index] = numValue;
        setLocalPriceRange(newRange);
    };
    
    // Apply price filter when inputs lose focus (or slider is committed)
    const handlePriceChangeCommitted = () => {
        // Optional: Add validation if needed before calling onFilterChange
         if (localPriceRange[0] > localPriceRange[1]) {
             // Maybe swap them or show an error? For now, just apply.
             console.warn("Min price is greater than max price");
         }
        onFilterChange('price', localPriceRange);
    };

    // Handle search input change with debounce
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalSearch(value);

        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        const timeoutId = setTimeout(() => {
            onFilterChange('search', value);
        }, 300);
        setDebounceTimeout(timeoutId);
    };
    
     // Cleanup timeout on unmount
     useEffect(() => {
         return () => {
             if (debounceTimeout) {
                 clearTimeout(debounceTimeout);
             }
         };
     }, [debounceTimeout]);

    // Reset all filters
    const handleResetFilters = () => {
        onFilterChange('reset');
    };

    // Sort options
    const sortOptions = [
        { value: 'priceAsc', label: 'Price: Low to High' },
        { value: 'priceDesc', label: 'Price: High to Low' },
        { value: 'nameAsc', label: 'Name: A to Z' }
        // Add rating sort if available/needed later
    ];

    const minPrice = priceRange.min ?? 0;
    const maxPrice = priceRange.max ?? 10000;
    const priceStep = Math.max(100, Math.floor((maxPrice - minPrice) / 100)); // Example step logic

    return (
        <div className="p-4 bg-white rounded-lg shadow border border-gray-200 space-y-5">
            {/* Filter Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-md font-semibold text-gray-800">Filters</h3>
                </div>
                <button 
                    onClick={handleResetFilters}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    title="Reset Filters"
                >
                    <ArrowUturnLeftIcon className="h-4 w-4"/>
                    Reset
                </button>
            </div>

            {/* Search Filter */}
            <div className="space-y-1.5">
                <label htmlFor="activity-search" className="block text-sm font-medium text-gray-700">
                    Search Activities
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        id="activity-search"
                        placeholder="Search by name..."
                        value={localSearch}
                        onChange={handleSearchChange}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                    Price Range
                </label>
                {/* Simple Input Range for now - Slider is complex with Tailwind only */}
                 <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        value={Math.round(localPriceRange[0])} 
                        onChange={(e) => handlePriceInputChange(0, e.target.value)} 
                        onBlur={handlePriceChangeCommitted} // Apply on blur
                        min={minPrice}
                        max={maxPrice}
                        step={priceStep}
                        className="w-full border border-gray-300 rounded-md shadow-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Minimum price"
                    />
                     <span className="text-gray-500">-</span>
                     <input 
                        type="number" 
                        value={Math.round(localPriceRange[1])} 
                        onChange={(e) => handlePriceInputChange(1, e.target.value)} 
                        onBlur={handlePriceChangeCommitted} // Apply on blur
                        min={minPrice}
                        max={maxPrice}
                        step={priceStep}
                        className="w-full border border-gray-300 rounded-md shadow-sm px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="Maximum price"
                    />
                </div>
                 <div className="flex justify-between text-xs text-gray-500">
                     <span>{formatCurrency(minPrice)}</span>
                     <span>{formatCurrency(maxPrice)}</span>
                 </div>
                {/* TODO: Consider adding a dedicated slider component library if needed */} 
            </div>

            {/* Sort Options */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                    <ArrowsUpDownIcon className="h-5 w-5 text-indigo-600" />
                    <h3 className="text-md font-semibold text-gray-800">Sort By</h3>
                </div>
                <fieldset>
                    <legend className="sr-only">Sort options</legend>
                    <div className="space-y-1">
                        {sortOptions.map((option) => (
                            <div key={option.value} className="flex items-center">
                                <input
                                    id={`sort-${option.value}`}
                                    name="sort-option"
                                    type="radio"
                                    value={option.value}
                                    checked={currentSort === option.value}
                                    onChange={(e) => onSortChange(e.target.value)}
                                    className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                />
                                <label htmlFor={`sort-${option.value}`} className="ml-2 block text-sm text-gray-700">
                                    {option.label}
                                </label>
                            </div>
                        ))}
                    </div>
                </fieldset>
            </div>
        </div>
    );
};

export default CrmActivityFilterMenu; 