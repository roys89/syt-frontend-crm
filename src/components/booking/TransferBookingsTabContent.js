import { ArrowPathIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
// --- Import Transfer specific components if needed later ---
import TransferBookingVoucherModal from '../transfers/TransferBookingVoucherModal'; // Make sure this is imported
// import ProviderDetailsModal from './ProviderDetailsModal'; // Assuming a generic one can be used or a specific one created

// Component dedicated to displaying Transfer Bookings
const TransferBookingsTabContent = () => {
  const [transferBookings, setTransferBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // --- State for Voucher Modal (Corrected to use Provider Data) ---
  const [showTransferVoucherModal, setShowTransferVoucherModal] = useState(false);
  const [transferVoucherDetails, setTransferVoucherDetails] = useState(null); // Will store PROVIDER details now
  const [isLoadingTransferVoucher, setIsLoadingTransferVoucher] = useState(false);
  const [loadingVoucherForId, setLoadingVoucherForId] = useState(null); // Tracks loading by provider bookingRefId
  // Add state to hold the ref ID specifically for the modal prop
  const [voucherProviderRefId, setVoucherProviderRefId] = useState(null);
  // Add state for cancellation
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellingId, setCancellingId] = useState(null); // Track which booking is being cancelled
  // const [isProviderDetailsModalOpen, setIsProviderDetailsModalOpen] = useState(false);
  // const [selectedProviderDetails, setSelectedProviderDetails] = useState(null);

  useEffect(() => {
    const fetchTransferData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the correct service function for transfers
        const response = await bookingService.getCrmTransferBookings();
        if (response.success && Array.isArray(response.data)) {
          // Add a type property for potential future use if combining lists
          setTransferBookings(response.data.map(item => ({ ...item, type: 'transfer' })));
        } else {
          throw new Error(response.message || 'Failed to fetch transfer bookings or invalid data format');
        }
      } catch (err) {
        console.error("Error fetching transfer bookings:", err);
        setError(err.message || 'Could not load transfer bookings.');
        setTransferBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTransferData();
  }, []);

  // Format date function (reusable)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle potential date string formats (ISO or YYYY-MM-DD)
      const date = new Date(dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`); // Assume UTC if only date
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Get status badge color (reusable)
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    // Normalize status for comparison
    const lowerStatus = status.toLowerCase().replace(/\s+/g, ''); // Remove spaces and lower case
    switch (lowerStatus) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending':
      case 'pendingconfirmation': // Handle potential variations
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

   // Get provider status - Reflects the success of the initial booking call to the provider
   const getProviderStatus = (providerResponse) => {
     if (providerResponse === undefined || providerResponse === null) {
        return 'Unknown'; // No provider response stored
     }
     // Check the 'success' field within the stored provider response
     if (providerResponse.success === true) {
         // Optional: Check nested data if structure is consistent
         // if (providerResponse.data?.status === true) {
         //    return 'Booked'; // Provider confirmed booking creation
         // }
         return 'Booked'; // Initial booking API call was successful
     } else if (providerResponse.success === false) {
         return 'Failed'; // Initial booking API call failed
     } else {
         return 'Unknown'; // Success field not found or has unexpected value
     }
   };

  // Render transfer-specific details
  const renderTransferBookingDetails = (item) => {
    const origin = item.transferDetails?.origin?.display_address || 'N/A';
    const destination = item.transferDetails?.destination?.display_address || 'N/A';
    const pickupDate = item.transferDetails?.pickupDate ? formatDate(item.transferDetails.pickupDate) : 'N/A';
    const pickupTime = item.transferDetails?.pickupTime || 'N/A';
    const vehicleClass = item.transferDetails?.vehicle?.class || 'N/A';

    const detailsString = `${origin} → ${destination}`;
    const dateTimeString = `On ${pickupDate} at ${pickupTime}`;

    return (
      <div>
        <div className="font-medium text-gray-900 truncate w-48" title={detailsString}>
          {detailsString}
        </div>
        <div className="text-xs text-gray-500" title={dateTimeString}>{dateTimeString}</div>
        <div className="text-xs text-gray-500">Vehicle: {vehicleClass}</div>
      </div>
    );
  };

  // --- View Voucher Handler (CORRECTED: Calls getTransferBookingDetails) --- 
  const handleViewTransferVoucher = async (item) => {
    if (isLoadingTransferVoucher) return; // Prevent double clicks

    // *** Use the PROVIDER'S booking reference ID ***
    const providerBookingRef = item.bookingRefId; 

    if (!providerBookingRef || providerBookingRef === 'N/A') {
      toast.error('Provider Booking Reference ID not found. Cannot fetch live details.');
      return;
    }

    console.log('[TabContent] Attempting to fetch LIVE transfer details for Provider Ref ID:', providerBookingRef);
    setIsLoadingTransferVoucher(true);
    setLoadingVoucherForId(providerBookingRef); // Indicate which row is loading using provider ID
    setTransferVoucherDetails(null); // Clear previous details
    setVoucherProviderRefId(null); // Clear previous ref ID

    try {
      // *** Call the service to get LIVE details from the PROVIDER ***
      const response = await bookingService.getTransferBookingDetails(providerBookingRef); 
      console.log('[TabContent] LIVE Provider API Response (getTransferBookingDetails):', response); // Log the response

      // *** Check the structure of the LIVE provider response ***
      // Adapt this check based on the actual successful response structure 
      if (response && response.success && response.data) { // Assuming { success: true, data: {...} } structure
        console.log('[TabContent] LIVE Transfer details retrieved successfully:', response.data);
        
        // *** IMPORTANT: Store the PROVIDER'S data structure ***
        setTransferVoucherDetails(response.data); 
        setVoucherProviderRefId(providerBookingRef); // Set the ref ID for the modal prop
        setShowTransferVoucherModal(true); // Open the modal
        toast.success('Live transfer details loaded.');
      } else {
        const errorMessage = response?.message || response?.error?.message || 'Failed to get live transfer details (Invalid data or booking not found).';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('[TabContent] Error getting live transfer details:', error);
      const message = error.message || 'An unknown error occurred while fetching live details.';
      toast.error(`Failed to get live transfer details: ${message}`);
      setShowTransferVoucherModal(false); // Don't open modal on error
    } finally {
      setIsLoadingTransferVoucher(false);
      setLoadingVoucherForId(null); // Reset loading indicator
    }
  };
  // --- End CORRECTED Handler ---

  // --- UPDATED Cancel Handler --- 
  const handleCancelTransfer = async (item) => {
    const providerBookingRef = item.bookingRefId;
    const crmBookingId = item._id; // For potential local update

    if (!providerBookingRef || providerBookingRef === 'N/A') {
      toast.error('Provider Booking Reference ID not found. Cannot cancel booking.');
      return;
    }

    // Optional: Confirmation dialog
    if (!window.confirm(`Are you sure you want to attempt cancellation for booking ${providerBookingRef}? This action might be irreversible.`)) {
        return;
    }

    console.log(`[TabContent] Attempting to cancel transfer booking: Provider Ref ${providerBookingRef}, CRM ID ${crmBookingId}`);
    setIsCancelling(true);
    setCancellingId(providerBookingRef); // Track by provider ref ID

    try {
        const response = await bookingService.cancelCrmTransferBooking(providerBookingRef);
        console.log('[TabContent] Cancellation API response:', response);

        if (response.success) {
            toast.success(response.message || `Booking ${providerBookingRef} cancelled successfully!`);
            // Option 1: Refetch the entire list
            // fetchTransferData(); // You might need to extract fetchTransferData or pass it
            
            // Option 2: Update local state (example: mark as cancelled)
            setTransferBookings(prevBookings => 
                prevBookings.map(booking => 
                    booking.bookingRefId === providerBookingRef 
                        ? { ...booking, status: 'Cancelled' } // Update status locally
                        : booking
                )
            );
        } else {
             // Handle logical failure from backend/provider
             throw new Error(response.message || `Failed to cancel booking ${providerBookingRef}.`);
        }

    } catch (error) {
        console.error(`[TabContent] Error cancelling transfer ${providerBookingRef}:`, error);
        toast.error(`Cancellation failed: ${error.message || 'Please try again or contact support.'}`);
    } finally {
        setIsCancelling(false);
        setCancellingId(null);
    }
  };
  // --- End Cancel Handler ---

  // --- Placeholder Handler for Amend ---
  const handleAmendTransfer = (item) => {
    console.log("Amend Transfer clicked for CRM ID:", item._id, "Provider Ref:", item.bookingRefId);
    toast.info(`Amendment for ${item.bookingRefId || item._id} is not yet implemented.`);
  };

  // --- Placeholder Handlers for future modals ---
  const handleViewProviderDetails = (details) => { console.log("View Provider Details:", details); toast.info("Provider details view not implemented yet."); };
  // --- End Placeholder Handlers ---

  // Loading State
  if (loading) {
    return (
      <div className="text-center py-12">
        <ArrowPathIcon className="animate-spin h-8 w-8 text-[#13804e] mx-auto mb-4" />
        <p className="text-sm text-[#093923]/60">Loading transfer bookings...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg">
        <h3 className="text-lg font-medium text-[#dc2626]">Error Loading Transfer Bookings</h3>
        <p className="mt-2 text-sm text-[#dc2626]/80">{error}</p>
      </div>
    );
  }

  // No Data Message
  if (!transferBookings || transferBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
        <h3 className="text-lg font-medium text-[#093923]">
          No transfer bookings found.
        </h3>
        <p className="mt-2 text-sm text-[#13804e]">
          You currently don't have any assigned transfer bookings.
        </p>
      </div>
    );
  }

  // Transfer Bookings Table
  return (
    <>
      <div className="overflow-x-auto shadow-lg ring-1 ring-[#093923]/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-[#093923]/10">
          <thead className="bg-[#093923]/5">
            {/* Transfer Specific Headers */}
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                Guest
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Transfer Details
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923] whitespace-nowrap">
                Booking Ref ID (Provider)
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Date Added
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Booking Status
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Payment Status
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Provider Status
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
            {transferBookings.map((item) => {
              // Guest Name Logic
              const guestName = `${item.guestDetails?.firstName || ''} ${item.guestDetails?.lastName || ''}`.trim() || 'N/A';
              const guestContact = item.guestDetails?.phone || '-';
              const providerBookingRef = item.bookingRefId || 'N/A'; // Provider's ID
              const crmBookingId = item._id; // MongoDB ID
              const isCurrentCancelling = isCancelling && cancellingId === providerBookingRef;

              return (
                <tr key={crmBookingId} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                  {/* Guest */}
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900 truncate w-32" title={guestName}>{guestName}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={guestContact}>{guestContact}</div>
                    <div className="text-xs text-gray-500">Pax: {item.guestDetails?.totalPassengers || 'N/A'}</div>
                  </td>
                  {/* Transfer Details */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80">
                    {renderTransferBookingDetails(item)}
                  </td>
                  {/* Booking Ref ID (Provider) */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {providerBookingRef}
                  </td>
                  {/* Date Added */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  {/* Booking Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)} capitalize`}>
                      {item.status || 'Unknown'}
                    </span>
                  </td>
                  {/* Payment Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.paymentDetails?.paymentStatus)} capitalize`}>
                      {item.paymentDetails?.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                  {/* Provider Status */}
                   <td className="px-3 py-4 text-sm whitespace-nowrap">
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(getProviderStatus(item.providerBookingResponse))} capitalize`}>
                         {getProviderStatus(item.providerBookingResponse)}
                       </span>
                   </td>
                  {/* Assigned To */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.agentDetails?.name || 'Unassigned'}
                  </td>
                  {/* Amount */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {(item.paymentDetails?.fare != null) ? `${item.paymentDetails.currency || '₹'} ${item.paymentDetails.fare.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A'}
                  </td>
                  {/* Actions */}
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                     <div className="flex items-center justify-end space-x-3">
                      {/* View Voucher/Details Button - Calls CORRECTED handler */}
                      <button
                        onClick={() => handleViewTransferVoucher(item)} // Use CORRECTED handler
                        className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={`View LIVE Details for ${providerBookingRef || crmBookingId}`}
                        disabled={isLoadingTransferVoucher || !providerBookingRef || providerBookingRef === 'N/A' || isCurrentCancelling} // Disable if loading or no provider ref or cancelling
                      >
                        <span className="sr-only">View Live Details</span>
                        {/* Show spinner when loading details for this provider ref */}
                        {isLoadingTransferVoucher && loadingVoucherForId === providerBookingRef ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>

                      {/* Amend Button (Placeholder) */}
                      <button
                         onClick={() => handleAmendTransfer(item)}
                         className="text-yellow-600 hover:text-yellow-800 p-1 rounded hover:bg-yellow-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                         title={`Amend Booking ${providerBookingRef || crmBookingId} (Not Implemented)`}
                         disabled={isCurrentCancelling} // Disable if cancelling
                       >
                         <span className="sr-only">Amend Booking</span>
                         <PencilSquareIcon className="h-5 w-5" />
                      </button>

                      {/* Cancel Button - UPDATED */} 
                      <button
                         onClick={() => handleCancelTransfer(item)} 
                         className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100 transition-colors ease duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                         title={`Cancel Booking ${providerBookingRef || crmBookingId}`}
                         disabled={isCurrentCancelling || item.status === 'Cancelled'} // Disable if cancelling or already cancelled
                       >
                         <span className="sr-only">Cancel Booking</span>
                         {isCurrentCancelling ? (
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

      {/* Render the Transfer Voucher Modal */}
      {/* WARNING: This modal expects CRM data structure for now */}
      {/* It will likely break until updated */}
      <TransferBookingVoucherModal
         isOpen={showTransferVoucherModal}
         onClose={() => {
             setShowTransferVoucherModal(false);
             setTransferVoucherDetails(null); 
             setVoucherProviderRefId(null); // Clear ref ID on close
         }}
         transferVoucherDetails={transferVoucherDetails} 
         providerBookingRef={voucherProviderRefId} // Pass the stored ref ID
       />

      {/* Render the Provider Details Modal */}
      {/* <ProviderDetailsModal
         isOpen={isProviderDetailsModalOpen}
         onClose={() => setIsProviderDetailsModalOpen(false)}
         details={selectedProviderDetails} // Needs adaptation for transfer provider data
       /> */}
      {/* --- End Placeholder Modals --- */}
    </>
  );
};

export default TransferBookingsTabContent; 