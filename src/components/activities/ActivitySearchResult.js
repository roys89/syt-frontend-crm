import React, { useState } from 'react';

const ActivitySearchResult = ({ 
  searchResults, 
  formData, 
  onSelectActivity, 
  onBackToSearch, 
  isLoading 
}) => {
  const [displayCount, setDisplayCount] = useState(50);
  const displayedResults = searchResults.slice(0, displayCount);

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 50);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
        <button
          onClick={onBackToSearch}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Back to Search
        </button>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-lg font-medium">
          {formData.selectedCities.map(city => city.name).join(', ')}
        </div>
        <div className="text-sm text-gray-500">
          {formData.fromDate} • {formData.travelers.adults} Adult{formData.travelers.adults > 1 ? 's' : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : searchResults.length === 0 ? (
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
                    <span className="text-2xl font-bold text-indigo-600">
                      {activity.currency} {activity.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">per person</span>
                  </div>
                  <button
                    onClick={() => onSelectActivity(activity)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Select Activity
                  </button>
                </div>
              </div>
            ))}
          </div>

          {displayCount < searchResults.length && (
            <div className="mt-6 text-center">
              <button
                onClick={handleLoadMore}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Load More Activities
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivitySearchResult; 