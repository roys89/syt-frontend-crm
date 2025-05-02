import { ArrowPathIcon, EyeIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import FlightBookingVoucherModal from '../flights/FlightBookingVoucherModal';
import ProviderDetailsModal from './ProviderDetailsModal';

// Component dedicated to displaying Flight Bookings
const FlightBookingsTabContent = () => {
  const [flightBookings, setFlightBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFlightVoucherModal, setShowFlightVoucherModal] = useState(false);
  const [flightVoucherDetails, setFlightVoucherDetails] = useState(null);
  const [isLoadingFlightVoucher, setIsLoadingFlightVoucher] = useState(false);
  const [loadingVoucherForId, setLoadingVoucherForId] = useState(null);

  // --- NEW: State for Provider Details Modal ---
  const [isProviderDetailsModalOpen, setIsProviderDetailsModalOpen] = useState(false);
  const [selectedProviderDetails, setSelectedProviderDetails] = useState(null);
  // --- END NEW STATE ---

  useEffect(() => {
    const fetchFlightData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await bookingService.getCrmFlightBookings();
        if (response.success && Array.isArray(response.data)) {
          setFlightBookings(response.data.map(item => ({ ...item, type: 'flight' })));
        } else {
          throw new Error(response.message || 'Failed to fetch flight bookings or invalid data format');
        }
      } catch (err) {
        console.error("Error fetching flight bookings:", err);
        setError(err.message || 'Could not load flight bookings.');
        setFlightBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFlightData();
  }, []);

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
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- RE-ADD Helper: Get simplified display status ---
  const getProviderDisplayStatus = (details) => {
    if (!details || !Array.isArray(details) || details.length === 0) {
      return 'N/A';
    }
    if (details.length === 1) {
      return details[0].bookingStatus || 'UNKNOWN';
    }
    return 'Multiple'; // Indicate multiple segments
  };
  // --- END RE-ADD HELPER ---

  // Render flight-specific details
  const renderFlightBookingDetails = (item) => {
    // Use origin/destination cities if available, fallback to codes
    const origin = item.originCity || item.originCode || 'N/A';
    const destination = item.destinationCity || item.destinationCode || 'N/A';
    const stops = item.stops !== undefined ? item.stops : 'N/A'; // Get stops count

    const detailsString = `${origin} → ${destination} (Stops: ${stops})`;

    return (
      <div>
        <div className="font-medium text-gray-900 truncate w-48" title={detailsString}>
          {detailsString}
        </div>
        <div className="text-xs text-gray-500">
          {item.flightType ? item.flightType.replace('_', ' ') : 'Flight'}
        </div>
      </div>
    );
  };

  // View Flight Voucher Handler
  const handleViewFlightVoucher = async (item) => {
    if (isLoadingFlightVoucher) return;
    const bookingCode = item.bmsBookingCode || item.bookingRefId || item.bookingCodes?.[0];
    if (!bookingCode) {
      toast.error('Booking code not found for this flight booking.');
      return;
    }
    console.log('Attempting to fetch flight voucher for:', { bookingCode });
    setIsLoadingFlightVoucher(true);
    setLoadingVoucherForId(bookingCode);
    setFlightVoucherDetails(null);
    try {
      // Assuming provider is TC for now, might need adjustment
      const voucherResponse = await bookingService.getBookingDetails({ provider: 'TC', bmsBookingCode: bookingCode }); 
      if (voucherResponse.success) {
        console.log('Flight voucher details retrieved successfully:', voucherResponse.data);
        setFlightVoucherDetails(voucherResponse.data.booking_details);
        setShowFlightVoucherModal(true);
        toast.success('Flight voucher details loaded.');
      } else {
        throw new Error(voucherResponse.message || 'Failed to get flight voucher details');
      }
    } catch (error) {
      console.error('Error getting flight voucher details:', error);
      toast.error(`Failed to get flight voucher: ${error.message || 'Unknown error'}`);
      setShowFlightVoucherModal(false);
    } finally {
      setIsLoadingFlightVoucher(false);
      setLoadingVoucherForId(null);
    }
  };

  // --- NEW: Handler to open Provider Details Modal ---
  const handleViewProviderDetails = (details) => {
    if (!details || !Array.isArray(details)) {
        toast.info('No provider details available for this booking.');
        setSelectedProviderDetails(null);
        return;
    }
    setSelectedProviderDetails(details);
    setIsProviderDetailsModalOpen(true);
  };
  // --- END NEW HANDLER ---

  // Loading State
  if (loading) {
    return (
      <div className="text-center py-12">
        <ArrowPathIcon className="animate-spin h-8 w-8 text-[#13804e] mx-auto mb-4" />
        <p className="text-sm text-[#093923]/60">Loading flight bookings...</p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="text-center py-12 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg">
        <h3 className="text-lg font-medium text-[#dc2626]">Error Loading Flight Bookings</h3>
        <p className="mt-2 text-sm text-[#dc2626]/80">{error}</p>
      </div>
    );
  }

  // No Data Message
  if (!flightBookings || flightBookings.length === 0) {
    return (
      <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
        <h3 className="text-lg font-medium text-[#093923]">
          No flight bookings found.
        </h3>
        <p className="mt-2 text-sm text-[#13804e]">
          You currently don't have any assigned flight bookings.
        </p>
      </div>
    );
  }

  // Flight Bookings Table
  return (
    <>
      <div className="overflow-x-auto shadow-lg ring-1 ring-[#093923]/5 sm:rounded-xl">
        <table className="min-w-full divide-y divide-[#093923]/10">
          <thead className="bg-[#093923]/5">
            {/* Flight Specific Headers */}
            <tr>
              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                Client
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                Flight Details
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923] whitespace-nowrap">
                Booking Ref ID
              </th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                PNR
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
                 Provider Details
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
            {flightBookings.map((item) => {
              // Client Name Logic (Lead Passenger)
              let leadPassenger = null;
              if (Array.isArray(item.passengerDetails)) {
                 leadPassenger = item.passengerDetails.find(p => p.isLeadPassenger) || item.passengerDetails[0];
              }
              const clientName = leadPassenger ? `${leadPassenger.title || ''} ${leadPassenger.firstName} ${leadPassenger.lastName}`.trim() : 'N/A';
              const clientContact = leadPassenger?.phoneNumber || '-';

              const bookingCode = item.bmsBookingCode || item.bookingRefId || item.bookingCodes?.[0] || item._id;

              return (
                <tr key={bookingCode} className="hover:bg-[#093923]/5 transition-colors ease duration-200">
                  {/* Client */}
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-900 truncate w-32" title={clientName}>{clientName}</div>
                    <div className="text-xs text-gray-500 truncate w-32" title={clientContact}>{clientContact}</div>
                  </td>
                  {/* Flight Details */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80">
                    {renderFlightBookingDetails(item)}
                  </td>
                  {/* Booking Ref ID */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.bmsBookingCode || item.bookingRefId || 'N/A'}
                  </td>
                  {/* PNR */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.pnr || 'N/A'}
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
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.bookingStatus)} capitalize`}>
                      {item.bookingStatus || 'Unknown'}
                    </span>
                  </td>
                  {/* Provider Details */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                        {/* Display Simple Status */}
                        <span 
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(getProviderDisplayStatus(item.providerBookingResponse?.data?.results?.details))} capitalize`}
                        >
                           {getProviderDisplayStatus(item.providerBookingResponse?.data?.results?.details)}
                        </span>
                        {/* Info Icon Button */}
                       <button
                          onClick={() => handleViewProviderDetails(item.providerBookingResponse?.data?.results?.details)}
                          className="text-gray-400 hover:text-blue-600 p-0.5 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="View Provider Status Details"
                          // Optionally disable if no details exist
                          disabled={!item.providerBookingResponse?.data?.results?.details || item.providerBookingResponse.data.results.details.length === 0}
                        >
                           <InformationCircleIcon className="h-4 w-4" />
                        </button>
                     </div>
                  </td>
                  {/* Assigned To */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {item.agentDetails?.name || 'Unassigned'}
                  </td>
                  {/* Amount */}
                  <td className="px-3 py-4 text-sm text-[#093923]/80 whitespace-nowrap">
                    {(item.paymentDetails?.finalTotalAmount != null) ? `${item.paymentDetails.currency || '₹'}${item.paymentDetails.finalTotalAmount.toLocaleString()}` : 'N/A'}
                  </td>
                  {/* Actions */}
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={() => handleViewFlightVoucher(item)}
                        className="text-cyan-600 hover:text-cyan-800 p-1 rounded hover:bg-cyan-100 disabled:opacity-50"
                        title={`View Voucher for ${bookingCode}`}
                        disabled={isLoadingFlightVoucher}
                      >
                        <span className="sr-only">View Voucher</span>
                        {isLoadingFlightVoucher && loadingVoucherForId === bookingCode ? (
                          <ArrowPathIcon className="h-5 w-5 animate-spin" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
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

      {/* Render the Flight Voucher Modal */}
      <FlightBookingVoucherModal
        isOpen={showFlightVoucherModal}
        onClose={() => setShowFlightVoucherModal(false)}
        voucherDetails={flightVoucherDetails}
      />

      {/* Render the Provider Details Modal */}
      <ProviderDetailsModal
        isOpen={isProviderDetailsModalOpen}
        onClose={() => setIsProviderDetailsModalOpen(false)}
        details={selectedProviderDetails}
      />
    </>
  );
};

export default FlightBookingsTabContent; 