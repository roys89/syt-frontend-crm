import { ArrowPathIcon, EyeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import ShareItineraryButton from '../itinerary/ShareItineraryButton';

// This component now holds the content previously directly in BookingsPage for the 'Bookings' main tab.
// It fetches real itinerary data.

const BookingsTabContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // Sub-tab ID
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null); // State for delete loading
  const navigate = useNavigate(); // Hook for navigation

  // Fetch itineraries when the component mounts or the relevant tab is selected
  useEffect(() => {
    const fetchItineraries = async () => {
      if (activeSubTab === 'all' || activeSubTab === 'itinerary') {
        // Fetch if the list is empty OR if an item was just deleted (deletingItemId is null after success)
        if (itineraries.length === 0 || deletingItemId === null) { 
          setLoading(true);
          setError(null);
          try {
            const response = await bookingService.getCrmItineraries();
            if (response.success && Array.isArray(response.data)) {
              // Add a type property for easier filtering/rendering later
              const typedItineraries = response.data.map(it => ({ ...it, type: 'itinerary' }));
              setItineraries(typedItineraries);
            } else {
              throw new Error(response.message || 'Failed to fetch itineraries');
            }
          } catch (err) {
            console.error("Error fetching itineraries:", err);
            setError(err.message || 'Could not load itineraries.');
            setItineraries([]); // Clear itineraries on error
          } finally {
            setLoading(false);
          }
        }
      } else {
        // If a specific non-itinerary tab is selected, clear the itineraries 
        // (or ideally fetch specific data type, but that's not implemented)
        // For now, this ensures the list is empty for types other than 'all' and 'itinerary'
        setItineraries([]); 
      }
    };

    fetchItineraries();
  }, [activeSubTab, itineraries.length, deletingItemId]); // Re-run if tab changes OR if deletingItemId becomes null (after deletion)

  // Filter data based on active sub tab
  const filteredData = (() => {
    // Only show itineraries when 'all' or 'itinerary' tab is selected
    if (activeSubTab === 'all' || activeSubTab === 'itinerary') {
        return itineraries;
    } 
    // For other tabs (flight, hotel, etc.), return empty array as sample data is removed
    // TODO: Implement fetching logic for these specific booking types
    else { 
        return [];
    }
  })();

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid before formatting
      if (isNaN(date.getTime())) return 'Invalid Date'; 
      return date.toLocaleDateString('en-GB', { // Use en-GB for DD/MM/YYYY or desired format
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Get appropriate badge color based on status
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed': // Add completed for itinerary payment status
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing': // Add processing for itinerary payment status
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed': // Add failed for itinerary payment status
        return 'bg-red-100 text-red-800';
      case 'inquiry': // Keep for potential future use
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appropriate icon or indicator for booking/inquiry type
  const getTypeIndicator = (type) => {
    if (!type) return 'text-gray-500 border-gray-500';
    switch (type.toLowerCase()) {
      case 'flight':
        return 'bg-blue-500'; // Use background color for the bar
      case 'hotel':
        return 'bg-red-500';
      case 'activity':
        return 'bg-green-500';
      case 'transfer':
        return 'bg-purple-500';
      case 'itinerary':
        return 'bg-orange-500'; // Orange for itineraries
      default:
        return 'bg-gray-500';
    }
  };

  const bookingSubTabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'itinerary', label: 'Itineraries' },
    { id: 'flight', label: 'Flights' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'activity', label: 'Activities' },
    { id: 'transfer', label: 'Transfers' }
  ];

  // Handler for changing sub tab
  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
  };

  // Function to render details based on type (specific to Bookings)
  const renderBookingDetails = (item) => {
     switch (item.type) {
      case 'flight':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.origin.city} to {item.details.destination.city}</div>
            <div className="text-xs text-gray-500">{item.details.origin.code} → {item.details.destination.code}</div>
          </div>
        );
      case 'hotel':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.hotelName}</div>
            <div className="text-xs text-gray-500">{formatDate(item.details.checkIn)} to {formatDate(item.details.checkOut)}</div>
          </div>
        );
      case 'activity':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.activityName}</div>
            <div className="text-xs text-gray-500">{item.details.location}</div>
          </div>
        );
      case 'transfer':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.origin}</div>
            <div className="text-xs text-gray-500">to {item.details.destination}</div>
          </div>
        );
      case 'itinerary':
        return (
          <div>
            <div className="font-medium text-gray-900 truncate w-40" title={item.itineraryToken}>{item.itineraryToken}</div>
            <div className="text-xs text-gray-500">
                {item.totalDays ? `${item.totalDays} Days` : '-'} | Starts: {formatDate(item.startDate)}
            </div>
          </div>
        );
      default:
        return <span className="text-gray-400">N/A</span>;
    }
  };

  // *** NEW: Handler for View Itinerary Button ***
  const handleViewItineraryClick = (item) => {
    if (item.itineraryToken && item.inquiryToken) { 
      console.log(`Navigating to Itinerary Booking page for itineraryToken: ${item.itineraryToken} (inquiry: ${item.inquiryToken})`);
      // Pass BOTH tokens in state
      navigate('/bookings/itinerary', { state: { itineraryToken: item.itineraryToken, inquiryToken: item.inquiryToken } });
    } else {
       console.warn(`View Itinerary clicked but itineraryToken or inquiryToken missing.`);
       toast.warn('Cannot view itinerary details - missing required information.');
    }
  };

  // *** NEW: Handler for Delete Itinerary Button ***
  const handleDeleteItinerary = async (item) => {
    if (deletingItemId) return; // Prevent multiple deletes

    const { itineraryToken, type } = item;
    const itemIdentifier = itineraryToken || item._id;
    const itemTypeLabel = type || 'item';

    if (!itemIdentifier) {
      toast.error('Cannot delete: Item identifier is missing.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${itemTypeLabel} (${itemIdentifier})? This action might be irreversible.`)) {
      setDeletingItemId(itemIdentifier); 
      try {
        // Assuming deleteItinerary exists for itinerary type
        if (type === 'itinerary' && itineraryToken) {
            await bookingService.deleteItinerary(itineraryToken);
            toast.success(`Itinerary ${itineraryToken} deleted successfully.`);
            // Set itineraries to empty array to trigger refetch in useEffect
            setItineraries([]); 
        } else {
             toast.warn(`Deletion not implemented for type: ${type}`);
        }
      } catch (error) {
        console.error(`Error deleting ${itemTypeLabel} ${itemIdentifier}:`, error);
        toast.error(`Failed to delete ${itemTypeLabel}. ${error.message || ''}`);
      } finally {
        setDeletingItemId(null); // Reset deleting state regardless of outcome
      }
    }
  };

  return (
    <div>
       {/* Sub Tabs for Bookings */}
       <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Sub Tabs">
          {bookingSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              disabled={loading} // Disable tabs while loading
              className={`${
                activeSubTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

       {/* Loading State */}
       {loading && (
        <div className="text-center py-12">
            <ArrowPathIcon className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading bookings...</p>
        </div>
       )}

       {/* Error State */}
       {!loading && error && (
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Error Loading Bookings</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          {/* Optional: Add a retry button here */}
        </div>
       )}

       {/* Data Table - Render only if not loading and no error */} 
       {!loading && !error && (
         <> 
           {filteredData.length === 0 ? (
             <div className="text-center py-12 bg-white shadow rounded-lg">
               <h3 className="text-lg font-medium text-gray-900">
                 No {activeSubTab !== 'all' ? `${activeSubTab} ` : ''} bookings found
                 {activeSubTab !== 'all' ? ` for this type` : ''}.
               </h3>
               <p className="mt-2 text-sm text-gray-500">
                 You currently don't have any assigned bookings in this category.
               </p>
               <div className="mt-6">
                   <Link
                     to="/bookings/create" // Link to general booking creation
                     className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                   >
                     <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                     New Booking
                   </Link>
                 </div>
             </div>
           ) : (
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
               <table className="min-w-full divide-y divide-gray-300">
                 <thead className="bg-gray-50">
                   <tr>
                     {/* Adjusting Headers for Itinerary View */}
                     <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                       Type
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Client
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Details / Token
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Date Added
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Status
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                         Assigned To
                     </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                         Amount / Duration
                     </th>
                     <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                       <span className="sr-only">Actions</span>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {filteredData.map((item) => (
                     <tr key={item.itineraryToken || item._id} className="hover:bg-gray-50">
                       <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                         <div className={`flex items-center`}>
                           <div className={`h-6 w-1 ${getTypeIndicator(item.type)} mr-3`}></div>
                           <span className="font-medium text-gray-900 capitalize">{item.type}</span>
                         </div>
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500">
                         {item.clientName || `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() || 'N/A'}
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500">
                         {renderBookingDetails(item)}
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                         {formatDate(item.createdAt)}
                       </td>
                       <td className="px-3 py-4 text-sm whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)} capitalize`}>
                           {item.status || 'Unknown'}
                         </span>
                       </td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                           {item.assignedTo ? item.assignedTo.name : 'Unassigned'}
                         </td>
                       <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                           {item.type === 'itinerary' 
                             ? (item.totalDays ? `${item.totalDays} Days` : 'N/A')
                             : (item.totalAmount != null ? `₹${item.totalAmount.toLocaleString()}` : 'N/A')
                           }
                         </td>
                       <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-3">
                            {/* View/Modify Button (fixed) */}
                            {item.type === 'itinerary' && (
                                <button 
                                  onClick={() => handleViewItineraryClick(item)}
                                  className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-100"
                                  title={`View/Modify Itinerary ${item.itineraryToken}`}
                                >
                                  <span className="sr-only">View/Modify Itinerary</span>
                                  <EyeIcon className="h-5 w-5" />
                                </button>
                            )}
                            {/* View Inquiry Button (REMOVED) */}
                            
                            {/* Delete Button */}
                            {item.type === 'itinerary' && item.itineraryToken && ( // Only allow deleting itineraries for now
                              <button
                                onClick={() => handleDeleteItinerary(item)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={`Delete Itinerary ${item.itineraryToken}`}
                                disabled={deletingItemId === (item.itineraryToken || item._id)}
                              >
                                <span className="sr-only">Delete</span>
                                {deletingItemId === (item.itineraryToken || item._id) ? (
                                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-5 w-5" />
                                )}
                              </button>
                            )}
                            {/* Share Button (Existing) */}
                            {item.type === 'itinerary' && (
                              <ShareItineraryButton 
                                itineraryToken={item.itineraryToken}
                                inquiryToken={item.inquiryToken}
                              />
                            )}
                          </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </>
       )}
     </div>
  );
};

export default BookingsTabContent; 