import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const CrmHotelFilterModal = ({ 
    initialFilters,
    priceRange: propsPriceRange = { min: 0, max: 10000 },
    currentSort,
    onFilterChange,
    onSortChange,
    onServerFilterApply,
    onFilterReset,
    totalCount,
    filteredCount,
    isServerFiltering = false,
    currentPricePoint = 'max'
}) => {
    // Local state for UI interaction
    const [localFilters, setLocalFilters] = useState(initialFilters || { 
        search: '',
        price: [propsPriceRange.min, propsPriceRange.max],
        starRating: [],
        amenities: [],
        reviewRatingsSelected: [],
        serverFilters: {
            freeBreakfast: false,
            isRefundable: false,
            hotelName: '',
            ratings: [],
            facilities: [],
            reviewRatings: null,
            type: null,
            tags: null,
            finalRate: 10000 // Default max rate
        }
    });
    
    // Use the prop to set the internal state for the selected price point
    const [selectedPricePoint, setSelectedPricePoint] = useState(currentPricePoint);
    
    // Define price points - in 2000 increments
    const pricePoints = [2000, 4000, 6000, 8000, 10000, 'max'];

    // Update internal state ONLY when the prop changes
    useEffect(() => {
        setSelectedPricePoint(currentPricePoint);
    }, [currentPricePoint]);

    // Handle search input changes
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setLocalFilters(prev => ({ 
            ...prev, 
            search: value,
            serverFilters: {
                ...prev.serverFilters,
                hotelName: value // Also update server-side hotel name filter
            }
        }));
        onFilterChange('search', value);
        
        if (!isServerFiltering) {
            // If not using server filtering immediately, update local UI filters
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters,
                hotelName: value
            });
        }
    };

    // --- Handle price point selection ---
    const handlePricePointSelect = (point) => {
        // Don't process if already selected - prevents loops
        if (point === selectedPricePoint) return;
        
        setSelectedPricePoint(point); // Update internal state
        
        // Prepare the finalRate value to send up (null for 'max')
        const finalRateValue = point === 'max' ? null : point;

        // Update the serverFilters within local state immediately
        setLocalFilters(prev => ({
            ...prev,
            serverFilters: {
                ...prev.serverFilters,
                finalRate: finalRateValue 
            }
        }));
        
        // Inform parent component of price change (for potential immediate UI updates)
        onFilterChange('price', [propsPriceRange.min, point === 'max' ? propsPriceRange.max : point]);
        
        if (!isServerFiltering) {
            // If using client-side filtering, update the full serverFilters object
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters, // Use the already updated localFilters
                finalRate: finalRateValue
            });
        }
    };

    // Star rating handler
    const toggleStarRating = (rating) => {
        const newRatings = localFilters.starRating.includes(rating)
            ? localFilters.starRating.filter(r => r !== rating)
            : [...localFilters.starRating, rating];
        
        // Sync with server-side ratings format
        const newServerRatings = [...newRatings]; // Copy for server-side format
        
        setLocalFilters(prev => ({ 
            ...prev, 
            starRating: newRatings,
            serverFilters: {
                ...prev.serverFilters,
                ratings: newServerRatings
            }
        }));
        
        onFilterChange('starRating', newRatings);
        
        if (!isServerFiltering) {
            // If not using server filtering immediately, update local UI filters
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters,
                ratings: newServerRatings
            });
        }
    };
    
    // Review Rating handler (multi-select)
    const toggleReviewRating = (value) => {
        // Check if the value is already selected
        const isAlreadySelected = localFilters.reviewRatingsSelected.includes(value);
        
        // Create new selection array by either adding or removing the value
        let newSelectedRatings = isAlreadySelected
            ? localFilters.reviewRatingsSelected.filter(r => r !== value)
            : [...localFilters.reviewRatingsSelected, value];
        
        // Sort the array to keep it in descending order
        newSelectedRatings.sort((a, b) => b - a);
        
        // Convert to API format (array of numbers) or null if empty
        const reviewRatings = newSelectedRatings.length > 0 ? newSelectedRatings : null;
        
        setLocalFilters(prev => ({ 
            ...prev, 
            reviewRatingsSelected: newSelectedRatings,
            serverFilters: {
                ...prev.serverFilters,
                reviewRatings: reviewRatings
            }
        }));
        
        // Update via callback for local filtering
        onFilterChange('reviewRatingsSelected', newSelectedRatings);
        
        if (!isServerFiltering) {
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters, 
                reviewRatings: reviewRatings
            });
        }
    };
    
    // Amenity toggle handler
    const toggleAmenity = (amenity) => {
        const newAmenities = localFilters.amenities.includes(amenity)
            ? localFilters.amenities.filter(a => a !== amenity)
            : [...localFilters.amenities, amenity];
        
        // Handle special amenities that map to specific API fields
        let updatedServerFilters = { ...localFilters.serverFilters };
        
        // Breakfast is a special boolean flag in the API
        if (amenity === 'breakfast') {
            updatedServerFilters.freeBreakfast = newAmenities.includes('breakfast');
        }
        
        // Map local amenities to facilities for API
        const facilitiesMap = {
            'wifi': 'WiFi',
            'pool': 'Swimming Pool',
            'spa': 'Spa',
            'gym': 'Fitness Center',
            'restaurant': 'Restaurant',
            'parking': 'Parking',
            'aircon': 'Air Conditioning',
            'pets': 'Pet Friendly',
            'beach': 'Beach Access'
        };
        
        // Build facilities array for API - include ALL selected amenities that map to facilities
        const apiFacilities = newAmenities
            .filter(a => a !== 'breakfast' && facilitiesMap[a]) // Exclude breakfast, handled separately
            .map(a => facilitiesMap[a]);
            
        // Only set facilities if we have any
        updatedServerFilters.facilities = apiFacilities.length > 0 ? apiFacilities : null;
        
        setLocalFilters(prev => ({ 
            ...prev, 
            amenities: newAmenities,
            serverFilters: updatedServerFilters
        }));
        
        onFilterChange('amenities', newAmenities);
        
        if (!isServerFiltering) {
            // If not using server filtering immediately, update local UI filters
            onFilterChange('serverFilters', updatedServerFilters);
        }
    };

    // Toggle breakfast specifically (separate from other amenities)
    const toggleBreakfast = (checked) => {
        // Update amenities list for UI consistency
        const newAmenities = checked
            ? [...localFilters.amenities.filter(a => a !== 'breakfast'), 'breakfast']
            : localFilters.amenities.filter(a => a !== 'breakfast');
            
        setLocalFilters(prev => ({
            ...prev,
            amenities: newAmenities,
            serverFilters: {
                ...prev.serverFilters,
                freeBreakfast: checked
            }
        }));
        
        onFilterChange('amenities', newAmenities);
        
        if (!isServerFiltering) {
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters,
                freeBreakfast: checked
            });
        }
    };

    // Toggle refundable only
    const toggleRefundable = (checked) => {
        setLocalFilters(prev => ({
            ...prev,
            serverFilters: {
                ...prev.serverFilters,
                isRefundable: checked
            }
        }));
        
        if (!isServerFiltering) {
            onFilterChange('serverFilters', {
                ...localFilters.serverFilters,
                isRefundable: checked
            });
        }
    };

    // Handle sort selection
    const handleSortChange = (e) => {
        const value = e.target.value;
        onSortChange(value);
    };
    
    // Reset all filters
    const handleResetFilters = () => {
        if (onFilterReset) {
            onFilterReset(); // Use the dedicated reset handler if provided
        } else {
            // Reset local state manually if no handler provided
            const defaultMax = propsPriceRange.max;
            const defaultFilters = {
                freeBreakfast: false,
                isRefundable: false,
                hotelName: '',
                ratings: [],
                facilities: [],
                reviewRatings: null,
                type: null,       // Reset type
                tags: null,       // Reset tags
                finalRate: defaultMax // Reset finalRate
            };
            setLocalFilters(prev => ({
                ...prev,
                search: '',
                price: [propsPriceRange.min, defaultMax],
                starRating: [],
                amenities: [],
                reviewRatingsSelected: [],
                serverFilters: defaultFilters
            }));
             setSelectedPricePoint('max');
             // Also call onFilterChange to sync parent if needed
             onFilterChange('reset');
        }
    };
    
    // Apply server-side filters
    const handleApplyServerFilters = () => {
        if (onServerFilterApply) {
            // Pass the latest serverFilters object from local state
            onServerFilterApply(localFilters.serverFilters);
        }
    };
    
    // Common hotel amenities
    const amenities = [
        { id: 'wifi', name: 'Free WiFi' },
        { id: 'breakfast', name: 'Free Breakfast' },
        { id: 'pool', name: 'Swimming Pool' },
        { id: 'parking', name: 'Free Parking' },
        { id: 'spa', name: 'Spa' },
        { id: 'gym', name: 'Fitness Center' },
        { id: 'restaurant', name: 'Restaurant' },
        { id: 'aircon', name: 'Air Conditioning' },
        { id: 'pets', name: 'Pet Friendly' },
        { id: 'beach', name: 'Beach Access' }
    ];
    
    // Review rating options
    const ratingOptions = [
        { value: 5, label: 'Excellent (5)' },
        { value: 4, label: 'Very Good (4)' },
        { value: 3, label: 'Good (3)' },
        { value: 2, label: 'Pleasant (2)' },
        { value: 1, label: 'Fair (1)' }
    ];

    // --- NEW: Handle Type Change --- 
    const handleTypeChange = (e) => {
        const value = e.target.value;
        setLocalFilters(prev => ({
            ...prev,
            serverFilters: {
                ...prev.serverFilters,
                type: value || null // Set to null if empty
            }
        }));
        if (!isServerFiltering) {
            onFilterChange('serverFilters', { ...localFilters.serverFilters, type: value || null });
        }
    };
    
    // --- NEW: Handle Tags Change (Simple comma-separated input) --- 
    const handleTagsChange = (e) => {
        const value = e.target.value;
        const tagsArray = value ? value.split(',').map(tag => tag.trim()).filter(tag => tag) : null;
        setLocalFilters(prev => ({
            ...prev,
            serverFilters: {
                ...prev.serverFilters,
                tags: tagsArray
            }
        }));
         if (!isServerFiltering) {
            onFilterChange('serverFilters', { ...localFilters.serverFilters, tags: tagsArray });
        }
    };
    // --- END: New Handlers ---

    return (
        <div className="bg-white rounded-lg shadow p-4 w-full">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center">
                    <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-medium text-gray-800">Filter Hotels</h3>
                </div>
                
                {/* Hotel count display */}
                {isServerFiltering && (
                    <div className="text-sm text-gray-600">
                        {filteredCount !== undefined && totalCount !== undefined ? (
                            filteredCount !== totalCount ? (
                                <span>{filteredCount} of {totalCount} hotels</span>
                            ) : (
                                <span>{totalCount} hotels</span>
                            )
                        ) : null}
                    </div>
                )}
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
                        value={localFilters.search || ''}
                        onChange={handleSearchChange}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-sm"
                        placeholder="Hotel name or location..."
                    />
                </div>
            </div>

            {/* Replace Price Range slider with Price Point buttons */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Max Price (₹ per night)
                    </label>
                    <span className="text-xs text-gray-500">
                        {selectedPricePoint === 'max' ? 'No Limit' : `Up to ₹${selectedPricePoint}`}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    {pricePoints.map(point => (
                        <button
                            key={point}
                            type="button"
                            onClick={() => handlePricePointSelect(point)}
                            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors
                                ${selectedPricePoint === point 
                                   ? 'bg-[#093923] text-white'
                                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {point === 'max' ? 'Max' : `₹${point.toLocaleString()}`}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    *Price per night per person
                </p>
            </div>
            
            {/* Payment Options */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment & Meal Options
                </label>
                <div className="space-y-2">
                    <div className="flex items-center">
                        <input
                            id="refundable"
                            type="checkbox"
                            checked={localFilters.serverFilters.isRefundable}
                            onChange={(e) => toggleRefundable(e.target.checked)}
                            className="h-4 w-4 text-[#093923] border-gray-300 rounded focus:ring-[#093923]"
                        />
                        <label htmlFor="refundable" className="ml-2 block text-sm text-gray-700">
                            Refundable Only
                        </label>
                    </div>
                    <div className="flex items-center">
                        <input
                            id="breakfast"
                            type="checkbox"
                            checked={localFilters.serverFilters.freeBreakfast}
                            onChange={(e) => toggleBreakfast(e.target.checked)}
                            className="h-4 w-4 text-[#093923] border-gray-300 rounded focus:ring-[#093923]"
                        />
                        <label htmlFor="breakfast" className="ml-2 block text-sm text-gray-700">
                            Free Breakfast
                        </label>
                    </div>
                </div>
            </div>
            
            {/* Star Rating */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Star Rating
                </label>
                <div className="flex flex-nowrap gap-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                        <button
                            key={rating}
                            onClick={() => toggleStarRating(rating)}
                            className={`flex items-center justify-center px-2.5 py-1.5 rounded-md focus:outline-none text-sm transition-colors ${
                                localFilters.starRating.includes(rating)
                                    ? 'bg-[#093923]/10 text-[#093923] border border-[#093923]/30'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            <span className="mr-1">{rating}</span>
                            <StarIcon className="h-4 w-4" />
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Review Rating (multi-select) */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Rating
                </label>
                <div className="space-y-2">
                    {ratingOptions.map((option) => (
                        <div key={option.value} className="flex items-center">
                            <input
                                id={`rating-${option.value}`}
                                type="checkbox"
                                checked={localFilters.reviewRatingsSelected.includes(option.value)}
                                onChange={() => toggleReviewRating(option.value)}
                                className="h-4 w-4 text-[#093923] border-gray-300 rounded focus:ring-[#093923]"
                            />
                            <label
                                htmlFor={`rating-${option.value}`}
                                className="ml-2 block text-sm text-gray-700"
                            >
                                {option.label}
                            </label>
                        </div>
                    ))}
                    
                    {localFilters.reviewRatingsSelected.length > 0 && (
                        <button
                            onClick={() => {
                                setLocalFilters(prev => ({
                                    ...prev,
                                    reviewRatingsSelected: [],
                                    serverFilters: {
                                        ...prev.serverFilters,
                                        reviewRatings: null
                                    }
                                }));
                                onFilterChange('reviewRatingsSelected', []);
                                if (!isServerFiltering) {
                                    onFilterChange('serverFilters', {
                                        ...localFilters.serverFilters,
                                        reviewRatings: null
                                    });
                                }
                            }}
                            className="mt-2 text-xs text-[#093923] hover:text-[#093923]/80"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            </div>
            
            {/* Amenities */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amenities
                </label>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                    {amenities
                     .filter(amenity => amenity.id !== 'breakfast') // Remove breakfast from this list
                     .map((amenity) => (
                        <div key={amenity.id} className="flex items-center">
                            <input
                                id={`amenity-${amenity.id}`}
                                type="checkbox"
                                checked={localFilters.amenities.includes(amenity.id)}
                                onChange={() => toggleAmenity(amenity.id)}
                                className="h-4 w-4 text-[#093923] border-gray-300 rounded focus:ring-[#093923]"
                            />
                            <label
                                htmlFor={`amenity-${amenity.id}`}
                                className="ml-2 block text-sm text-gray-700"
                            >
                                {amenity.name}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Sort Options */}
            <div className="mb-6">
                <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                </label>
                <select
                    id="sort"
                    name="sort"
                    value={currentSort || 'relevance'}
                    onChange={handleSortChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-sm rounded-md"
                >
                    <option value="relevance">Relevance</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="ratingDesc">Rating: High to Low</option>
                    <option value="nameAsc">Name: A to Z</option>
                </select>
            </div>
            
            {/* --- NEW: Property Type Filter --- */}
            <div className="mb-6">
                 <label htmlFor="property-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Property Type
                 </label>
                 <input
                    type="text"
                    id="property-type"
                    value={localFilters.serverFilters.type || ''}
                    onChange={handleTypeChange}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-sm"
                    placeholder="e.g., Hotel, Apartment" 
                 />
             </div>
             {/* --- END: Property Type Filter --- */}
             
             {/* --- NEW: Tags Filter --- */}
             <div className="mb-6">
                 <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                     Tags (comma-separated)
                 </label>
                 <input
                     type="text"
                     id="tags"
                     value={localFilters.serverFilters.tags ? localFilters.serverFilters.tags.join(', ') : ''}
                     onChange={handleTagsChange}
                     className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-sm"
                     placeholder="e.g., Luxury, Budget, Beachfront"
                 />
             </div>
             {/* --- END: Tags Filter --- */}

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                {isServerFiltering && (
                    <button
                        type="button"
                        onClick={handleApplyServerFilters}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
                    >
                        Apply Filters
                    </button>
                )}
                
                <button
                    type="button"
                    onClick={handleResetFilters}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
                >
                    Reset All Filters
                </button>
            </div>
        </div>
    );
};

export default CrmHotelFilterModal; 