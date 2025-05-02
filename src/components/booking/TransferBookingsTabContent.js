import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';
// --- Import Transfer specific components if needed later ---
// import TransferBookingVoucherModal from '../transfers/TransferBookingVoucherModal';
// import ProviderDetailsModal from './ProviderDetailsModal'; // Assuming a generic one can be used or a specific one created

// Component dedicated to displaying Transfer Bookings
const TransferBookingsTabContent = () => {
  const [transferBookings, setTransferBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // --- Placeholder state for future modals ---
  // const [showTransferVoucherModal, setShowTransferVoucherModal] = useState(false);
  // const [transferVoucherDetails, setTransferVoucherDetails] = useState(null);
  // const [isLoadingTransferVoucher, setIsLoadingTransferVoucher] = useState(false);
  // const [loadingVoucherForId, setLoadingVoucherForId] = useState(null);
  // const [isProviderDetailsModalOpen, setIsProviderDetailsModalOpen] = useState(false);
  // const [selectedProviderDetails, setSelectedProviderDetails] = useState(null);
  // --- End Placeholder State ---

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

  // --- Placeholder Handlers for future modals ---
  // const handleViewTransferVoucher = async (item) => { console.log("View Voucher:", item._id); toast.info("Voucher view not implemented yet."); };
  // const handleViewProviderDetails = (details) => { console.log("View Provider Details:", details); toast.info("Provider details view not implemented yet."); };
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
                Payment Status
              </th>
               <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                 CRM Status
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
                  {/* Payment Status */}
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.paymentDetails?.paymentStatus)} capitalize`}>
                      {item.paymentDetails?.paymentStatus || 'Unknown'}
                    </span>
                  </td>
                   {/* CRM Booking Status */}
                   <td className="px-3 py-4 text-sm whitespace-nowrap">
                     <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)} capitalize`}>
                       {item.status || 'Unknown'}
                     </span>
                   </td>
                  {/* Provider Status */}
                   <td className="px-3 py-4 text-sm whitespace-nowrap">
                     {/* Example: Button to view full provider details if needed */}
                     {/* <div className="flex items-center space-x-1.5"> */}
                       <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(getProviderStatus(item.providerBookingResponse))} capitalize`}>
                         {getProviderStatus(item.providerBookingResponse)}
                       </span>
                       {/* <button
                           onClick={() => handleViewProviderDetails(item.providerBookingResponse)} // Placeholder
                           className="text-gray-400 hover:text-blue-600 p-0.5 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                           title="View Full Provider Details"
                           disabled={!item.providerBookingResponse} // Placeholder disable logic
                         >
                            <InformationCircleIcon className="h-4 w-4" />
                         </button> */}
                     {/* </div> */}
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
                     {/* Placeholder for future actions */}
                     <div className="flex items-center justify-end space-x-3">
                      {/* Example Action: View Voucher */}
                      {/* <button
                         onClick={() => handleViewTransferVoucher(item)}
                         className="text-cyan-600 hover:text-cyan-800 p-1 rounded hover:bg-cyan-100 disabled:opacity-50"
                         title={`View Voucher for ${crmBookingId}`}
                         disabled={true} // Enable when implemented
                       >
                         <span className="sr-only">View Voucher</span>
                         <EyeIcon className="h-5 w-5" />
                       </button> */}
                     </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Placeholder for future Modals --- */}
      {/* Render the Transfer Voucher Modal */}
      {/* <TransferBookingVoucherModal
         isOpen={showTransferVoucherModal}
         onClose={() => setShowTransferVoucherModal(false)}
         voucherDetails={transferVoucherDetails}
       /> */}

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