import { TruckIcon } from '@heroicons/react/24/outline'; // For placeholder
import { EyeIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CrmTransferViewModal from '../modals/view/CrmTransferViewModal';
// Optional: Add icons if desired
// import { TruckIcon, MapPinIcon } from '@heroicons/react/24/solid';

// --- Helper Functions ---
const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        // Use specific locale for consistency if needed, else rely on user default
        return new Date(dateTimeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Invalid time format:", dateTimeString, e);
        return 'Invalid Time';
    }
};

const formatDate = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        return new Date(dateTimeString).toLocaleDateString('en-US', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        });
    } catch (e) {
        console.error("Invalid date format:", dateTimeString, e);
        return 'Invalid Date';
    }
};

const formatDuration = (minutes) => {
    // Now expects minutes directly
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let durationStr = '';
    if (h > 0) durationStr += `${h}h`;
    if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m}m`;
    return durationStr || 'N/A'; // Return N/A if 0 or invalid
};

const formatTransferType = (type) => {
    if (!type || typeof type !== 'string') return 'Transfer';
    return type.split(/[_\s]+/) // Split by underscore or space
               .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
               .join(' ');
};
// --- End Helper Functions ---

const CrmTransferCard = ({ 
  transfer, 
  itineraryDay, // Contains date
  itineraryToken, 
  inquiryToken, 
  onUpdate // Function to refresh itinerary
}) => {
  // State declarations at the top of the component
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false); // Add removing state
  
  // --- Data Extraction (Mirroring B2C TransferCard.js structure) ---
  // console.log("Raw transfer prop in CrmTransferCard:", JSON.stringify(transfer, null, 2)); // DEBUG

  const details = transfer?.details;
  const selectedQuote = details?.selectedQuote;
  const quotation_id = details?.quotation_id; // Use quotation_id from details level
  const routeDetails = selectedQuote?.quote?.routeDetails; // Keep this for other details if needed
  const vehicle = selectedQuote?.quote?.vehicle;

  // Extract date and city name from itineraryDay or details if possible
  const date = itineraryDay?.date; // Get date from parent day object
  const cityName = details?.origin?.city || details?.destination?.city; // Get city from origin or destination

  const transferType = formatTransferType(transfer?.type); // Type from top level
  const provider = selectedQuote?.quote?.provider?.pr_name || 'Provider N/A';

  // Pickup/Dropoff Locations & Times
  const pickupLocation = details?.origin?.display_address || 'Pickup Location N/A';
  // Adjust pickupTime extraction if it comes directly from details, not routeDetails anymore
  const pickupTime = details?.selectedQuote?.routeDetails?.pickup_date;
  const formattedPickupTime = formatTime(pickupTime);

  const dropoffLocation = details?.destination?.display_address || 'Dropoff Location N/A';
  // B2C doesn't explicitly show dropoff time, derive if possible or omit
  // const dropoffTime = ?;
  // const formattedDropoffTime = formatTime(dropoffTime);

  // Vehicle Info
  const vehicleInfo = vehicle ? `${vehicle.ve_class || ''} - ${vehicle.ve_similar_types || 'Vehicle'}`.trim().replace(/^- | -$/, '') : 'Vehicle Info N/A';

  // Duration & Distance (Duration is often in minutes in B2C structure)
  const durationMinutes = details?.duration;
  const formattedDuration = formatDuration(durationMinutes);
  const distance = details?.distance; // Often a string like "15 km"

  // Image URL
  const imageUrl = vehicle?.vehicleImages?.ve_im_url || null;

  // Basic check: Explicitly check against fallback strings
  if (transferType === 'Transfer' && pickupLocation === 'Pickup Location N/A' && dropoffLocation === 'Dropoff Location N/A') {
     console.warn("CrmTransferCard: Missing almost all transfer data (type, pickup, dropoff):", transfer);
     return (
       <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
         <p>Transfer - Very Incomplete information.</p>
       </div>
     );
  }

  // Button handlers
  const handleRemoveTransfer = async () => {
      if (!itineraryToken || !inquiryToken || !cityName || !date || !quotation_id) {
          toast.error("Cannot remove transfer: Missing required information.");
          console.error("Missing data for remove transfer:", { itineraryToken, inquiryToken, cityName, date, quotation_id });
          return;
      }

      // Optional: Confirmation
      // if (!window.confirm(`Are you sure you want to remove this ${transferType} transfer?`)) {
      //     return;
      // }

      setIsRemoving(true);
      try {
          const response = await fetch(
              `http://localhost:5000/api/itinerary/${itineraryToken}/transfer`, // Use relative path
              {
                  method: 'DELETE',
                  headers: {
                      'Content-Type': 'application/json',
                      'X-Inquiry-Token': inquiryToken,
                      // Auth handled by interceptor/context
                      'Authorization': `Bearer ${localStorage.getItem('crmToken')}` 
                  },
                  body: JSON.stringify({
                      cityName: cityName, 
                      date: date,         
                      quotation_id: quotation_id // Use quotation_id as the identifier
                  }),
              }
          );

          const result = await response.json();

          if (!response.ok) {
              throw new Error(result.message || 'Failed to remove transfer');
          }

          toast.success(`${transferType} transfer removed successfully.`);
          window.location.reload(); // Force page reload

      } catch (error) {
          console.error('Error removing transfer:', error);
          toast.error(`Error removing transfer: ${error.message}`);
      } finally {
          setIsRemoving(false);
      }
  };

  const handleViewTransfer = () => {
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
  };

  const handleModifyTransfer = () => { // Adding Modify handler for consistency
      toast.info("Modify Transfer action placeholder");
  };

  return (
    <>
      <div className="relative flex flex-col md:flex-row border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
        {/* Image Section - Updated width, height, flex-shrink */}
        <div className="relative w-full h-48 md:w-64 md:h-64 md:flex-shrink-0 bg-gray-200">
          {imageUrl ? (
            <img src={imageUrl} alt={transferType} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-48 md:h-64 flex items-center justify-center bg-gray-100">
              <TruckIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content Section - Updated padding */}
        <div className="flex flex-col justify-between w-full p-3 md:p-4">
          {/* Header Information */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <h3 className="text-xl font-bold text-gray-800">{transferType} Transfer</h3>
              {provider !== 'Provider N/A' && (
                 <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{provider}</span>
              )}
            </div>

            {/* Transfer Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium text-gray-700">Pick-up</p>
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">{pickupLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{formatDate(pickupTime)} - {formattedPickupTime}</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-medium text-gray-700">Drop-off</p>
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-gray-700">{dropoffLocation}</span>
                </div>
                {/* Dropoff time omitted as it's not explicitly in B2C data */}
              </div>
            </div>

            {/* Additional Details Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-gray-600">
                {vehicleInfo !== 'Vehicle Info N/A' && (
                   <div className="flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                       </svg>
                       <span>{vehicleInfo}</span>
                   </div>
               )}
               {formattedDuration !== 'N/A' && (
                    <div className="flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                       <span>{formattedDuration || details.duration}</span>
                    </div>
               )}
                {distance && (
                   <div className="flex items-center gap-1">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                       </svg>
                        <span>{distance}</span>
                   </div>
               )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end mt-4 pt-3 border-t">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
              <button
                onClick={handleViewTransfer}
                className="p-2 bg-green-900 text-white rounded-md hover:bg-green-800"
                aria-label="View Transfer"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleRemoveTransfer}
                className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Remove Transfer"
                disabled={isRemoving} // Disable button
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <CrmTransferViewModal 
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        transferData={transfer}
      />
    </>
  );
};

export default CrmTransferCard;
