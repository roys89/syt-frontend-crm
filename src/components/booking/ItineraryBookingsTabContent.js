import { ArrowPathIcon, EyeIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import ShareItineraryButton from '../itinerary/ShareItineraryButton';

// Component dedicated to displaying Itinerary Bookings
const ItineraryBookingsTabContent = () => {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItineraryData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming getCrmItineraries fetches the booked itineraries
        const response = await bookingService.getCrmItineraries(); 
        if (response.success && Array.isArray(response.data)) {
          setItineraries(response.data.map(item => ({ ...item, type: 'itinerary' })));
        } else {
          throw new Error(response.message || 'Failed to fetch itinerary bookings or invalid data format');
        }
      } catch (err) {
        console.error("Error fetching itinerary bookings:", err);
        setError(err.message || 'Could not load itinerary bookings.');
        setItineraries([]);
      } finally {
        setLoading(false);
      }
    };

    if (!deletingItemId) { // Avoid refetching during delete confirmation
       fetchItineraryData();
    }
  }, [deletingItemId]); // Refetch if deletingItemId changes (becomes null after delete)

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'confirmed': case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render itinerary-specific details
  const renderItineraryBookingDetails = (item) => {
    return (
      <div>
        <div className="font-medium text-gray-900 truncate w-40" title={item.itineraryToken}>{item.itineraryToken}</div>
        <div className="text-xs text-gray-500">
          {item.totalDays ? `${item.totalDays} Days` : '-'} | Starts: {formatDate(item.startDate)}
        </div>
      </div>
    );
  };

  // View Itinerary Handler
  const handleViewItineraryClick = (item) => {
    if (item.itineraryToken && item.inquiryToken) { 
      console.log(`Navigating to Itinerary Booking page for itineraryToken: ${item.itineraryToken} (inquiry: ${item.inquiryToken})`);
      navigate('/bookings/itinerary', { state: { itineraryToken: item.itineraryToken, inquiryToken: item.inquiryToken } });
    } else {
       console.warn(`View Itinerary clicked but itineraryToken or inquiryToken missing.`);
       toast.warn('Cannot view itinerary details - missing required information.');
    }
  };

  // Delete Itinerary Handler
  const handleDeleteItinerary = async (item) => {
    if (deletingItemId) return;
    const { itineraryToken, type } = item;
    const itemIdentifier = itineraryToken || item._id;
    const itemTypeLabel = type || 'itinerary';

    if (!itemIdentifier) {
      toast.error('Cannot delete: Item identifier is missing.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete this ${itemTypeLabel} (${itemIdentifier})? This action might be irreversible.`)) {
      setDeletingItemId(itemIdentifier);
      try {
        if (itineraryToken) {
          await bookingService.deleteItinerary(itineraryToken);
          toast.success(`Itinerary ${itineraryToken} deleted successfully.`);
          // Data will refetch via useEffect when deletingItemId is reset
        } else {
          toast.warn(`Deletion not implemented for this item.`);
        }
      } catch (error) {
        console.error(`Error deleting ${itemTypeLabel} ${itemIdentifier}:`, error);
        toast.error(`Failed to delete ${itemTypeLabel}. ${error.message || ''}`);
      } finally {
        setDeletingItemId(null); // Reset deleting state, triggering refetch
      }
    }
  };

   // Loading State
  if (loading) {
    return (
      <div className="text-center py-12">
        <ArrowPathIcon className="animate-spin h-8 w-8 text-[#13804e] mx-auto mb-4" />
        <p className="text-sm text-[#093923]/60">Loading itinerary bookings...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg">
        <h3 className="text-lg font-medium text-[#dc2626]">Error Loading Itinerary Bookings</h3>
        <p className="mt-2 text-sm text-[#dc2626]/80">{error}</p>
      </div>
    );
  }

  // No Data Message
  if (!itineraries || itineraries.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
        <h3 className="text-lg font-medium text-[#093923]">
          No itinerary bookings found.
        </h3>
        <p className="mt-2 text-sm text-[#13804e]">
          You currently don't have any assigned itinerary bookings.
        </p>
      </div>
    );
  }

  // Itinerary Bookings Table
  return (
    <>
      <div className="overflow-x-auto shadow-lg ring-1 ring-[#093923]/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-[#093923]/10">
          <thead className="bg-[#093923]/5">
             {/* Itinerary Specific Headers */}
             <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                Client
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Itinerary Details
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                 Booking ID
               </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Date Added
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Payment Status
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Booking Status
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Assigned To
              </th>
               <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                 Total Amount
               </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#093923]/5">
            {itineraries.map((item) => {
               // --- MODIFICATION START: Use clientName/clientEmail from API response ---
               const clientName = item.clientName && item.clientName !== 'N/A' ? item.clientName : 'N/A';
               const clientContact = item.clientEmail || '-';
               // --- MODIFICATION END ---

              const itemIdentifier = item.itineraryToken || item._id;

              return (
                <tr key={itemIdentifier} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                  {/* Client */}
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900 truncate w-32" title={clientName}>{clientName}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={clientContact}>{clientContact}</div>
                  </td>
                  {/* Itinerary Details */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80">
                    {renderItineraryBookingDetails(item)}
                  </td>
                  {/* Booking ID */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                     {item.bookingId || 'N/A'} {/* Assuming bookingId exists */}
                   </td>
                  {/* Date Added */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  {/* Payment Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.paymentStatus)} capitalize`}>
                      {item.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                  {/* Booking Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.bookingStatus)} capitalize`}>
                       {item.bookingStatus || 'Unknown'}
                     </span>
                  </td>
                  {/* Assigned To */}
                  {/* --- MODIFICATION START: Use assignedTo.name --- */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.assignedTo?.name || 'Unassigned'}
                  </td>
                  {/* --- MODIFICATION END --- */}
                   {/* Total Amount */}
                   <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                     {(item.finalTotalAmount != null) ? `${item.currency || '₹'}${item.finalTotalAmount.toLocaleString()}` : 'N/A'}
                   </td>
                  {/* Actions */}
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                     <div className="flex items-center justify-end space-x-3">
                      <button 
                        onClick={() => handleViewItineraryClick(item)}
                        disabled={!item.itineraryToken || !item.inquiryToken} 
                        className="text-[#13804e] hover:text-[#0d5c3a] disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded hover:bg-[#13804e]/10 transition-colors ease duration-200"
                        title={!item.itineraryToken || !item.inquiryToken ? 'Missing token(s)' : `View/Modify Itinerary ${item.itineraryToken}`}
                      >
                        <EyeIcon className="h-5 w-5" aria-hidden="true" />
                       </button>
                       {item.itineraryToken && (
                         <ShareItineraryButton 
                           itineraryToken={item.itineraryToken}
                           inquiryToken={item.inquiryToken} // Pass inquiry token if available/needed for sharing
                         />
                       )}
                       <button
                         onClick={() => handleDeleteItinerary(item)}
                         className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                         title={`Delete Itinerary ${itemIdentifier}`}
                         disabled={deletingItemId === itemIdentifier}
                       >
                         <span className="sr-only">Delete</span>
                         {deletingItemId === itemIdentifier ? (
                           <ArrowPathIcon className="h-5 w-5 animate-spin" />
                         ) : (
                           <TrashIcon className="h-5 w-5" />
                         )}
                       </button>
                     </div>
                   </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* No modal needed specifically for Itinerary Bookings List view */}
    </>
  );
};

export default ItineraryBookingsTabContent; 