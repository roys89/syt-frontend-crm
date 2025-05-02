import { ArrowPathIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import BookingVoucherModal from '../hotels/BookingVoucherModal'; // Renamed from HotelBookingVoucherModal for consistency

// Component dedicated to displaying Hotel Bookings
const HotelBookingsTabContent = () => {
  const [hotelBookings, setHotelBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHotelVoucherModal, setShowHotelVoucherModal] = useState(false);
  const [hotelVoucherDetails, setHotelVoucherDetails] = useState(null);
  const [isLoadingHotelVoucher, setIsLoadingHotelVoucher] = useState(false);
  const [loadingVoucherForId, setLoadingVoucherForId] = useState(null); // Track which voucher is loading
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await bookingService.getCrmHotelBookings();
        if (response.success && Array.isArray(response.data)) {
          // Add type for consistency if needed elsewhere, though not strictly necessary here
          setHotelBookings(response.data.map(item => ({ ...item, type: 'hotel' })));
        } else {
          throw new Error(response.message || 'Failed to fetch hotel bookings or invalid data format');
        }
      } catch (err) {
        console.error("Error fetching hotel bookings:", err);
        setError(err.message || 'Could not load hotel bookings.');
        setHotelBookings([]); // Clear data on error
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, []); // Fetch only on component mount

  // Format date function (copied)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Get status badge color (copied)
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render hotel-specific details (moved and adapted)
  const renderHotelBookingDetails = (item) => {
    const hotelName = item.providerBookingResponse?.results?.[0]?.data?.[0]?.hotelDetails?.name || 'Hotel Details Unavailable';
    return (
      <div>
        <div className="font-medium text-gray-900 truncate w-40" title={hotelName}>{hotelName}</div>
        <div className="text-xs text-gray-500">Hotel Booking</div>
      </div>
    );
  };

  // View Hotel Voucher Handler (moved and adapted)
  const handleViewHotelVoucher = async (item) => {
    // Prevent multiple voucher loads for the same or different items
    if (isLoadingHotelVoucher) return; 

    const bookingCode = item.bookingRefId;
    // Attempt to get check-in/city from common locations, might need adjustment based on final CRM structure
    const checkInDate = item.checkIn || item.providerBookingResponse?.results?.[0]?.data?.[0]?.checkIn;
    const cityName = item.providerBookingResponse?.results?.[0]?.data?.[0]?.hotelDetails?.address?.city?.name;

    if (!bookingCode) {
      toast.error('Booking reference ID not found for this hotel booking.');
      return;
    }

    console.log('Attempting to fetch hotel voucher for:', { bookingCode, date: checkInDate, city: cityName });
    setIsLoadingHotelVoucher(true);
    setLoadingVoucherForId(bookingCode); // Set which voucher is loading
    setHotelVoucherDetails(null);

    try {
      const voucherResponse = await bookingService.getHotelBookingDetails(bookingCode, checkInDate, cityName);
      if (voucherResponse.success) {
        console.log('Hotel voucher details retrieved successfully:', voucherResponse.data);
        const finalVoucherData = {
            ...voucherResponse.data,
            crmBookingRefId: bookingCode // Pass the ID used for the call
        };
        setHotelVoucherDetails(finalVoucherData);
        setShowHotelVoucherModal(true);
        toast.success('Hotel voucher details loaded.');
      } else {
        throw new Error(voucherResponse.message || 'Failed to get hotel voucher details');
      }
    } catch (error) {
      console.error('Error getting hotel voucher details:', error);
      toast.error(`Failed to get hotel voucher: ${error.message || 'Unknown error'}`);
      setShowHotelVoucherModal(false);
    } finally {
      setIsLoadingHotelVoucher(false);
      setLoadingVoucherForId(null); // Clear loading state
    }
  };

  // Cancel Hotel Booking Handler
  const handleCancelHotelBooking = async (item) => {
    const bookingCode = item.bookingRefId;
    const traceId = item.traceId; // Get traceId from the item

    if (!bookingCode) {
      toast.error('Booking reference ID not found.');
      return;
    }
    if (!traceId) {
      // Although unlikely based on the example, handle missing traceId defensively
      toast.error('Trace ID not found for this booking. Cannot cancel.');
      return;
    }

    // Simple confirmation dialog
    if (!window.confirm(`Are you sure you want to attempt cancellation for booking ${bookingCode}? This action might have consequences based on provider policies.`)) {
      return;
    }

    if (isCancelling) return; // Prevent multiple cancellations

    console.log('Attempting to cancel hotel booking:', bookingCode);
    setIsCancelling(true);
    setCancellingBookingId(bookingCode);

    try {
      // Call the service function (we'll create this next)
      const response = await bookingService.cancelHotelBooking(bookingCode, traceId);

      if (response.success) {
        toast.success(`Cancellation request for booking ${bookingCode} processed. Status may take time to update.`);
        // TODO: Optionally refresh the list or update the item's status locally
        // For now, we just show a toast. Refreshing might be better UX.
        // fetchHotelData(); // Example: Re-fetch data
      } else {
        throw new Error(response.message || 'Cancellation request failed.');
      }
    } catch (error) {
      console.error('Error cancelling hotel booking:', error);
      toast.error(`Cancellation failed for ${bookingCode}: ${error.message || 'Unknown error'}`);
    } finally {
      setIsCancelling(false);
      setCancellingBookingId(null);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="text-center py-12">
        <ArrowPathIcon className="animate-spin h-8 w-8 text-[#13804e] mx-auto mb-4" />
        <p className="text-sm text-[#093923]/60">Loading hotel bookings...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg">
        <h3 className="text-lg font-medium text-[#dc2626]">Error Loading Hotel Bookings</h3>
        <p className="mt-2 text-sm text-[#dc2626]/80">{error}</p>
      </div>
    );
  }

  // No Data Message
  if (!hotelBookings || hotelBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
        <h3 className="text-lg font-medium text-[#093923]">
          No hotel bookings found.
        </h3>
        <p className="mt-2 text-sm text-[#13804e]">
          You currently don't have any assigned hotel bookings.
        </p>
      </div>
    );
  }

  // Hotel Bookings Table
  return (
    <>
      <div className="overflow-x-auto shadow-lg ring-1 ring-[#093923]/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-[#093923]/10">
          <thead className="bg-[#093923]/5">
            {/* Hotel Specific Headers */}
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                Client
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Hotel Details
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Booking Ref ID
              </th>
               <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                 Provider Ref
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
                Amount
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#093923]/5">
            {hotelBookings.map((item) => {
              // Client Name Logic (using first guest from guestDetails)
              let clientName = 'N/A';
              let clientContact = '-';
              if (Array.isArray(item.guestDetails) && item.guestDetails.length > 0) {
                const firstGuest = item.guestDetails[0];
                clientName = `${firstGuest.title || ''} ${firstGuest.firstName || ''} ${firstGuest.lastName || ''}`.trim();
                clientContact = firstGuest.email || '-';
              }
              if (!clientName.trim()) clientName = 'N/A';

              const bookingCode = item.bookingRefId || item._id; // Use bookingRefId primarily

              return (
                <tr key={bookingCode} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                  {/* Client */}
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900 truncate w-32" title={clientName}>{clientName}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={clientContact}>{clientContact}</div>
                  </td>
                  {/* Hotel Details */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80">
                    {renderHotelBookingDetails(item)}
                  </td>
                  {/* Booking Ref ID */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.bookingRefId || 'N/A'}
                  </td>
                    {/* Provider Ref */}
                    <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                        {item.providerConfirmationNumber || '-'}
                    </td>
                  {/* Date Added */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  {/* Payment Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.paymentDetails?.paymentStatus)} capitalize`}>
                      {item.paymentDetails?.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                  {/* Booking Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)} capitalize`}>
                      {item.status || 'Unknown'}
                    </span>
                  </td>
                  {/* Assigned To */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.agentDetails?.name || 'Unassigned'}
                  </td>
                  {/* Amount */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {(item.paymentDetails?.finalRate != null) ? `${item.paymentDetails.currency || '₹'}${item.paymentDetails.finalRate.toLocaleString()}` : 'N/A'}
                  </td>
                  {/* Actions */}
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleViewHotelVoucher(item)}
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`View Voucher for ${item.bookingRefId}`}
                        disabled={isLoadingHotelVoucher} // Disable if *any* voucher is loading
                      >
                        <span className="sr-only">View Voucher</span>
                        {/* Show spinner only for the specific item being loaded */}
                        {isLoadingHotelVoucher && loadingVoucherForId === item.bookingRefId ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                      {/* Cancel Button */}
                      <button
                        onClick={() => handleCancelHotelBooking(item)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`Cancel Booking ${item.bookingRefId}`}
                        disabled={isCancelling || item.status === 'Cancelled'} // Disable if already cancelling or cancelled
                      >
                        <span className="sr-only">Cancel Booking</span>
                        {/* Show spinner only for the specific item being cancelled */}
                        {isCancelling && cancellingBookingId === item.bookingRefId ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          // Simple X icon for cancel
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                      {/* Add other hotel-specific actions here if needed */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Render the Hotel Voucher Modal */}
      <BookingVoucherModal
        isOpen={showHotelVoucherModal}
        onClose={() => setShowHotelVoucherModal(false)}
        voucherDetails={hotelVoucherDetails}
      />
    </>
  );
};

export default HotelBookingsTabContent; 