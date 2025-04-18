import React, { useEffect, useState } from 'react';

const ActivitySearchResult = ({ 
  searchResults, 
  formData, 
  onSelectActivity, 
  onBackToSearch, 
  isLoading,
  activeFilters = {}
}) => {
  const [displayCount, setDisplayCount] = useState(50);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(null);

  // Apply filters to search results
  useEffect(() => {
    let results = [...searchResults];

    // Filter by name
    if (activeFilters.nameSearch) {
      const searchTerm = activeFilters.nameSearch.toLowerCase();
      results = results.filter(activity => 
        activity.title.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by price range
    if (activeFilters.priceRange) {
      if (activeFilters.priceRange.min && !isNaN(activeFilters.priceRange.min)) {
        results = results.filter(activity => 
          activity.amount >= parseFloat(activeFilters.priceRange.min)
        );
      }
      if (activeFilters.priceRange.max && !isNaN(activeFilters.priceRange.max)) {
        results = results.filter(activity => 
          activity.amount <= parseFloat(activeFilters.priceRange.max)
        );
      }
    }

    // Sort results
    if (activeFilters.sortBy) {
      switch (activeFilters.sortBy) {
        case 'price_low_high':
          results.sort((a, b) => a.amount - b.amount);
          break;
        case 'price_high_low':
          results.sort((a, b) => b.amount - a.amount);
          break;
        // 'relevance' is default ordering, so we don't need to sort
        default:
          break;
      }
    }

    setFilteredResults(results);
  }, [searchResults, activeFilters]);

  const displayedResults = filteredResults.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 50);
  };

  // Wrap the onSelectActivity handler to manage loading state
  const handleSelectActivity = async (activity) => {
    try {
      setLoadingActivity(activity.code);
      await onSelectActivity(activity);
    } finally {
      setLoadingActivity(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2 text-gray-600">
          <span className="text-lg font-medium">{formData.selectedCities.map(city => city.name).join(', ')}</span>
          <span className="text-gray-400">•</span>
          <span>{formData.fromDate}</span>
          <span className="text-gray-400">•</span>
          <span>{formData.travelers.adults} Adult{formData.travelers.adults > 1 ? 's' : ''}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#093923]"></div>
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No activities found for the selected criteria</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedResults.map((activity) => (
              <div
                key={activity.code}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="relative h-48">
                  <img
                    src={activity.imgURL}
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {activity.title}
                  </h3>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-[#093923]">
                      {activity.currency} {activity.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">per person</span>
                  </div>
                  <button
                    onClick={() => handleSelectActivity(activity)}
                    disabled={loadingActivity === activity.code}
                    className="relative w-full group overflow-hidden bg-[#093923] text-white py-2 px-4 rounded-lg hover:bg-[#093923] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loadingActivity === activity.code ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Selecting...
                        </>
                      ) : (
                        'Select Activity'
                      )}
                    </span>
                    <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {displayCount < filteredResults.length && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="relative group overflow-hidden inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#093923] hover:bg-[#093923] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] transition-colors"
              >
                <span className="relative z-10">Load More Activities</span>
                <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivitySearchResult;