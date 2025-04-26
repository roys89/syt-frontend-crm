import { ArrowPathIcon, EyeIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import ShareItineraryButton from '../itinerary/ShareItineraryButton';

// This component now holds the content previously directly in BookingsPage for the 'Bookings' main tab.
// It fetches real itinerary, hotel, and flight data.

const BookingsTabContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // Sub-tab ID
  const [itineraries, setItineraries] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]); // State for hotel bookings
  const [flightBookings, setFlightBookings] = useState([]); // State for flight bookings
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null); // State for delete loading
  const navigate = useNavigate(); // Hook for navigation

  // Fetch data based on active sub tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setItineraries([]); // Clear all data on tab change before fetching
      setHotelBookings([]);
      setFlightBookings([]);

      try {
        let promises = [];
        if (activeSubTab === 'all' || activeSubTab === 'itinerary') {
          promises.push(bookingService.getCrmItineraries());
        }
        if (activeSubTab === 'all' || activeSubTab === 'hotel') {
          promises.push(bookingService.getCrmHotelBookings());
        }
        if (activeSubTab === 'all' || activeSubTab === 'flight') {
          promises.push(bookingService.getCrmFlightBookings());
        }
        // TODO: Add similar logic for activity and transfer when implemented

        if (promises.length > 0) {
          const results = await Promise.allSettled(promises);

          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              if (!result.value.success || !Array.isArray(result.value.data)) {
                console.warn(`Fetched data invalid for type index ${index}:`, result.value);
                // Optionally set specific error for this type
              } else {
                const type = 
                  (activeSubTab === 'all' && index === 0) || activeSubTab === 'itinerary' ? 'itinerary' :
                  (activeSubTab === 'all' && index === 1 && (promises.length === 3 || promises.length === 2)) || activeSubTab === 'hotel' ? 'hotel' :
                  (activeSubTab === 'all' && index === 2 && promises.length === 3) || (activeSubTab === 'all' && index === 1 && promises.length === 2 && !hotelBookings.length) || activeSubTab === 'flight' ? 'flight' :
                  'unknown'; // Fallback

                const typedData = result.value.data.map(item => ({ ...item, type }));
                
                if (type === 'itinerary') setItineraries(typedData);
                else if (type === 'hotel') setHotelBookings(typedData);
                else if (type === 'flight') setFlightBookings(typedData);
              }
            } else {
              console.error(`Error fetching data for type index ${index}:`, result.reason);
              // Set a general error or specific error for this type
              setError(result.reason?.message || `Could not load data for one or more types.`);
            }
          });
        }
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(err.message || 'Could not load bookings.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeSubTab, deletingItemId]); // Re-run if tab changes OR if deletingItemId becomes null

  // Filter data based on active sub tab
  const filteredData = (() => {
    if (activeSubTab === 'itinerary') return itineraries;
    if (activeSubTab === 'hotel') return hotelBookings;
    if (activeSubTab === 'flight') return flightBookings;
    if (activeSubTab === 'all') {
      // Combine all fetched data for the 'all' tab
      return [...itineraries, ...hotelBookings, ...flightBookings];
    }
    // For other tabs (activity, transfer), return empty array for now
    return [];
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
        // Display flightType and bookingRefId as primary details
        // Origin/Destination not directly available in the list view data
        return (
          <div>
            <div className="font-medium text-gray-900 truncate w-40" title={item.bookingRefId}>{item.bookingRefId}</div>
            <div className="text-xs text-gray-500">
              {item.flightType ? item.flightType.replace('_', ' ') : 'Flight'}
            </div>
          </div>
        );
      case 'hotel':
        // Extract details from providerBookingResponse if needed, or use top-level fields if available
        const hotelName = item.providerBookingResponse?.results?.[0]?.data?.[0]?.hotelDetails?.name || 'Hotel Name N/A';
        const checkIn = item.providerBookingResponse?.results?.[0]?.data?.[0]?.checkIn || item.checkIn; // Use top-level if exists
        const checkOut = item.providerBookingResponse?.results?.[0]?.data?.[0]?.checkOut || item.checkOut; // Use top-level if exists
        return (
          <div>
            <div className="font-medium text-gray-900 truncate w-40" title={hotelName}>{hotelName}</div>
            <div className="text-xs text-gray-500">{formatDate(checkIn)} to {formatDate(checkOut)}</div>
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
       <div className="border-b border-[#093923]/10 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Sub Tabs">
          {bookingSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              disabled={loading}
              className={`${
                activeSubTab === tab.id
                  ? 'border-[#13804e] text-[#13804e]'
                  : 'border-transparent text-[#093923]/60 hover:text-[#093923] hover:border-[#093923]/30'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ease duration-200`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

       {/* Loading State */}
       {loading && (
        <div className="text-center py-12">
            <ArrowPathIcon className="animate-spin h-8 w-8 text-[#13804e] mx-auto mb-4" />
            <p className="text-sm text-[#093923]/60">Loading bookings...</p>
        </div>
       )}

       {/* Error State */}
       {!loading && error && (
        <div className="text-center py-12 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg">
          <h3 className="text-lg font-medium text-[#dc2626]">Error Loading Bookings</h3>
          <p className="mt-2 text-sm text-[#dc2626]/80">{error}</p>
        </div>
       )}

       {/* Data Table - Render only if not loading and no error */} 
       {!loading && !error && (
         <> 
           {filteredData.length === 0 ? (
             <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
               <h3 className="text-lg font-medium text-[#093923]">
                 No {activeSubTab !== 'all' ? `${activeSubTab} ` : ''} bookings found
                 {activeSubTab !== 'all' ? ` for this type` : ''}.
               </h3>
               <p className="mt-2 text-sm text-[#13804e]">
                 You currently don't have any assigned bookings in this category.
               </p>
               <div className="mt-6">
                   <Link
                     to="/bookings/create"
                     className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
                   >
                     <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                     New Booking
                   </Link>
                 </div>
             </div>
           ) : (
             <div className="overflow-x-auto shadow-lg ring-1 ring-[#093923]/5 sm:rounded-xl">
               <table className="min-w-full divide-y divide-[#093923]/10">
                 <thead className="bg-[#093923]/5">
                   <tr>
                     <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                       Type
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Client
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Details / Ref ID
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Date Added
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Payment
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Booking
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Provider Ref
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                       Itinerary/Trace ID
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                         Assigned To
                     </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                         Amount
                     </th>
                     <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                       <span className="sr-only">Actions</span>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-[#093923]/5">
                   {filteredData.map((item) => {
                     // --- Find Lead Passenger for Client Column ---
                     let leadPassenger = null;
                     if (item.type === 'flight' && Array.isArray(item.passengerDetails)) {
                       leadPassenger = item.passengerDetails.find(p => p.isLeadPassenger);
                       // Fallback to first passenger if no lead is marked (optional)
                       // if (!leadPassenger && item.passengerDetails.length > 0) {
                       //   leadPassenger = item.passengerDetails[0];
                       // }
                     }
                     const clientName = 
                       leadPassenger ? `${leadPassenger.title || ''} ${leadPassenger.firstName} ${leadPassenger.lastName}`.trim() :
                       item.clientName || `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() || 'N/A';
                     const clientContact = leadPassenger?.phoneNumber || '-';
                     // ---------------------------------------------
                     
                     return (
                       <tr key={item._id || item.itineraryToken} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                         <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                           <div className={`flex items-center`}>
                             <div className={`h-6 w-1 ${getTypeIndicator(item.type)} mr-3`}></div>
                             <span className="font-medium text-[#093923] capitalize">{item.type}</span>
                           </div>
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80">
                           <div className="font-medium text-gray-900">{clientName}</div>
                           <div className="text-xs text-gray-500">{clientContact}</div>
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80">
                           {renderBookingDetails(item)}
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                           {formatDate(item.createdAt)}
                         </td>
                         <td className="px-3 py-4 text-sm whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.paymentDetails?.paymentStatus || item.paymentStatus)} capitalize`}>
                             {item.paymentDetails?.paymentStatus || item.paymentStatus || 'Unknown'}
                           </span>
                         </td>
                         <td className="px-3 py-4 text-sm whitespace-nowrap">
                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status || item.overallBookingStatus || item.bookingStatus)} capitalize`}>
                               {/* Use appropriate status based on type */} 
                               {item.type === 'itinerary' ? item.bookingStatus :
                                item.type === 'hotel' ? item.status :
                                item.type === 'flight' ? item.overallBookingStatus :
                                'N/A'}
                           </span>
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                           {/* Show provider confirmation / PNR based on type */} 
                           {item.type === 'hotel' ? item.providerConfirmationNumber :
                            item.type === 'flight' ? item.pnr :
                            item.type === 'itinerary' ? item.bookingId : 
                             '-'} 
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                           {/* Show Itinerary Token / Trace ID */} 
                           {item.type === 'itinerary' ? item.itineraryToken :
                            item.traceId || '-'}
                         </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                              {item.agentDetails?.name || 'Unassigned'}
                           </td>
                         <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                               {/* Show final amount based on type */} 
                               {(item.paymentDetails?.finalRate != null) ? `${item.paymentDetails.currency || '₹'}${item.paymentDetails.finalRate.toLocaleString()}` :
                                (item.paymentDetails?.finalTotalAmount != null) ? `${item.paymentDetails.currency || '₹'}${item.paymentDetails.finalTotalAmount.toLocaleString()}` :
                                item.type === 'itinerary' ? `${item.totalDays || '?'} Days` : // Itinerary shows duration
                                'N/A'
                                }
                             </td>
                         <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex items-center justify-end space-x-3">
                              {item.type === 'itinerary' && (
                                  <button 
                                    onClick={() => handleViewItineraryClick(item)}
                                    className="text-[#13804e] hover:text-[#0d5c3a] p-1 rounded hover:bg-[#13804e]/10 transition-colors ease duration-200"
                                    title={`View/Modify Itinerary ${item.itineraryToken}`}
                                  >
                                    <span className="sr-only">View/Modify Itinerary</span>
                                    <EyeIcon className="h-5 w-5" />
                                  </button>
                              )}
                              
                              {item.type === 'itinerary' && item.itineraryToken && (
                                <button
                                  onClick={() => handleDeleteItinerary(item)}
                                  className="text-[#dc2626] hover:text-[#b91c1c] p-1 rounded hover:bg-[#dc2626]/10 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                              {item.type === 'itinerary' && (
                                <ShareItineraryButton 
                                  itineraryToken={item.itineraryToken}
                                  inquiryToken={item.inquiryToken}
                                />
                              )}
                            </div>
                          </td>
                       </tr>
                     );
                   })}
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