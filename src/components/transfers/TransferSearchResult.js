import { UserGroupIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const TransferSearchResult = ({ 
  searchResults, 
  formData, 
  onSelectTransfer, 
  onBackToSearch,
  isLoading 
}) => {
  const [selectedQuote, setSelectedQuote] = useState(null);

  const handleSelectTransfer = (quote) => {
    setSelectedQuote(quote);
    onSelectTransfer(quote);
  };

  const formatDuration = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Available Vehicles</h2>
        <button
          onClick={onBackToSearch}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Back to Search
        </button>
      </div>

      {/* Journey Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Journey Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Pickup Location</p>
            <p className="font-medium">{formData.origin.display_address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Drop-off Location</p>
            <p className="font-medium">{formData.destination.display_address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Pickup Date & Time</p>
            <p className="font-medium">{formData.pickupDate} at {formData.pickupTime}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Options */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : searchResults?.quotes?.length > 0 ? (
        <div className="space-y-6">
          {searchResults.quotes.map((quote) => (
            <div
              key={quote.quote_id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex flex-col md:flex-row">
                {/* Vehicle Image */}
                <div className="md:w-1/3 h-48 bg-gray-100">
                  <img
                    src={quote.vehicle.image}
                    alt={quote.vehicle.class}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Vehicle Details */}
                <div className="md:w-2/3 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      {/* Vehicle Type Badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          quote.vehicle.premium ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {quote.vehicle.premium ? 'Premium' : 'Standard'}
                        </span>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          {quote.vehicle.class}
                        </span>
                      </div>

                      {/* Vehicle Name */}
                      <h3 className="text-lg font-bold text-gray-900">{quote.vehicle.similar_type}</h3>

                      {/* Vehicle Features */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <UserGroupIcon className="h-4 w-4 mr-2" />
                          <span>Up to {quote.vehicle.capacity} passengers</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                          <span>Max {quote.vehicle.maxLuggage} luggage</span>
                        </div>
                      </div>

                      {/* Vehicle Tags */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {quote.vehicle.tags.split(' ').map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Price and Select Button */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">
                        ₹{parseFloat(quote.fare).toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        One Way
                      </div>
                      <button
                        type="button"
                        className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                          selectedQuote?.quote_id === quote.quote_id
                            ? 'bg-indigo-700'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                        onClick={() => handleSelectTransfer(quote)}
                      >
                        {selectedQuote?.quote_id === quote.quote_id ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No vehicles available for your search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default TransferSearchResult; 