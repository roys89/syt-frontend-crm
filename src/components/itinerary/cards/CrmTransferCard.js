import { TruckIcon } from '@heroicons/react/24/outline'; // For placeholder
import React from 'react';
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

const CrmTransferCard = ({ transfer }) => {
  // --- Data Extraction (Mirroring B2C TransferCard.js structure) ---
  // console.log("Raw transfer prop in CrmTransferCard:", JSON.stringify(transfer, null, 2)); // DEBUG

  const details = transfer?.details;
  const selectedQuote = details?.selectedQuote;
  const routeDetails = selectedQuote?.routeDetails;
  const vehicle = selectedQuote?.quote?.vehicle;

  const transferType = formatTransferType(transfer?.type); // Type from top level
  const provider = selectedQuote?.quote?.provider?.pr_name || 'Provider N/A';

  // Pickup/Dropoff Locations & Times
  const pickupLocation = details?.origin?.display_address || 'Pickup Location N/A';
  const pickupTime = routeDetails?.pickup_date; // Use pickup_date directly
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
  // --- End Data Extraction ---

  // Basic check: Explicitly check against fallback strings
  if (transferType === 'Transfer' && pickupLocation === 'Pickup Location N/A' && dropoffLocation === 'Dropoff Location N/A') {
     console.warn("CrmTransferCard: Missing almost all transfer data (type, pickup, dropoff):", transfer);
     return (
       <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
         <p>Transfer - Very Incomplete information.</p>
       </div>
     );
  }

  return (
    // Use flex layout: image on left, content on right
    <div className="flex gap-4 border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
       {/* Image Section */}
       {imageUrl ? (
         <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
           <img src={imageUrl} alt={transferType} className="w-full h-full object-cover" />
         </div>
       ) : (
         <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border">
           <TruckIcon className="w-12 h-12 text-gray-300" />
         </div>
       )}

       {/* Content Section */}
       <div className="flex-grow space-y-3">
         {/* Header: Transfer Type and Provider */}
         <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b pb-2 gap-1">
            <h4 className="text-md md:text-lg font-semibold text-orange-700 leading-tight">{transferType}</h4>
            {provider !== 'Provider N/A' && (
               <span className="text-xs font-medium text-gray-500 flex-shrink-0 mt-1">Provider: {provider}</span>
            )}
         </div>

         {/* Body: Pickup, Dropoff, Details */}
         <div className="text-sm text-gray-800 space-y-2">
            {/* Pickup Info */}
            <div className="flex items-start gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <div>
                  <span className="font-medium text-gray-600">Pickup:</span> {pickupLocation}
                  {formattedPickupTime !== 'N/A' && formattedPickupTime !== 'Invalid Time' && (
                      <span className="ml-2 text-xs text-gray-500">({formattedPickupTime})</span>
                  )}
               </div>
            </div>

            {/* Dropoff Info */}
            <div className="flex items-start gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
               <div>
                   <span className="font-medium text-gray-600">Dropoff:</span> {dropoffLocation}
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
                       <span>{formattedDuration}</span>
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
       </div>
    </div>
  );
};

export default CrmTransferCard;
