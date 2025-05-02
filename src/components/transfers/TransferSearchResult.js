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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Available Vehicles</h2>
        <button
          onClick={onBackToSearch}
          className="text-sm font-medium text-[#093923] hover:text-[#13804e] transition-colors"
        >
          ← Back to Search
        </button>
      </div>

      {/* Journey Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
        <h3 className="text-lg font-medium mb-3 text-gray-700">Journey Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-gray-500">Pickup Location:</p>
            <p className="font-medium text-gray-800">{formData.origin.display_address}</p>
          </div>
          <div>
            <p className="text-gray-500">Drop-off Location:</p>
            <p className="font-medium text-gray-800">{formData.destination.display_address}</p>
          </div>
          <div>
            <p className="text-gray-500">Pickup Date & Time:</p>
            <p className="font-medium text-gray-800">{formData.pickupDate} at {formData.pickupTime}</p>
          </div>
        </div>
      </div>

      {/* Vehicle Options */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-[#093923]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : searchResults?.quotes?.length > 0 ? (
        <div className="space-y-6">
          {searchResults.quotes.map((quote) => (
            <div
              key={quote.quote_id}
              className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col md:flex-row"
            >
              {/* Vehicle Image */}
              <div className="md:w-1/3 h-48 md:h-auto bg-gray-100 flex-shrink-0">
                <img
                  src={quote.vehicle.image}
                  alt={quote.vehicle.class}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/img/placeholder.png'; }}
                />
              </div>

              {/* Vehicle Details & Price */}
              <div className="flex flex-col justify-between md:w-2/3 p-5">
                {/* Top section: Name & Capacity */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{quote.vehicle.similar_type || quote.vehicle.class}</h3>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <UserGroupIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                    <span>Up to {quote.vehicle.capacity} passengers</span>
                    <span className="mx-2 text-gray-300">|</span>
                    <svg className="h-4 w-4 mr-1.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <span>Max {quote.vehicle.maxLuggage || 'N/A'} luggage</span>
                  </div>
                  {/* Optional: Add tags if available */}
                  {quote.vehicle.tags && quote.vehicle.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {quote.vehicle.tags.split(' ').map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Bottom section: Price & Button */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="text-left">
                    <div className="text-xl font-bold text-[#093923]">
                      ₹{parseFloat(quote.fare).toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                    </div>
                    <div className="text-xs text-gray-500">
                      Total Price
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${ 
                      selectedQuote?.quote_id === quote.quote_id
                        ? 'bg-[#13804e]' 
                        : 'bg-[#093923] hover:bg-[#13804e]'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]`}
                    onClick={() => handleSelectTransfer(quote)}
                  >
                    {selectedQuote?.quote_id === quote.quote_id ? 'Selected' : 'Select'}
                  </button>
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