import { BuildingOffice2Icon } from '@heroicons/react/24/outline'; // For placeholder
import React from 'react';

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    // Using en-GB for dd/mm/yyyy format
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    console.error("Invalid date format:", dateString, e);
    return 'Invalid Date';
  }
};

const StarRating = ({ rating }) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    // Basic check for invalid rating
    if (isNaN(fullStars) || fullStars < 0 || fullStars > 5) {
        return <span className="text-xs text-gray-500">N/A</span>;
    }

    return (
        <div className="flex items-center">
            {[...Array(fullStars)].map((_, i) => (
                <svg key={`full-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            {halfStar && (
                 <svg key="half" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            )}
            {[...Array(emptyStars)].map((_, i) => (
                 <svg key={`empty-${i}`} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};
// --- End Helper Functions ---

const CrmHotelCard = ({ hotel }) => {
  // --- Data Extraction (Mirroring B2C HotelCard.js structure) ---
  // console.log("Raw hotel prop in CrmHotelCard:", JSON.stringify(hotel, null, 2)); // DEBUG

  const hotelDetails = hotel?.data?.items?.[0];
  const hotelStatic = hotel?.data?.hotelDetails;
  const staticContent = hotel?.data?.staticContent?.[0];

  const hotelName = hotelStatic?.name || 'Hotel Name N/A';
  const rating = parseInt(hotelStatic?.starRating) || 0;

  const locationInfo = hotelStatic?.address;
  const address = locationInfo ? [locationInfo.line1, locationInfo.line2, locationInfo.city?.name].filter(Boolean).join(', ') : 'Address N/A';

  // Get Check-in/Check-out from the top level of the `hotel` object passed from the day
  const checkInDate = hotel?.checkIn;
  const checkOutDate = hotel?.checkOut;

  // Get room details (assuming first selected room for display)
  const roomAndRate = hotelDetails?.selectedRoomsAndRates?.[0];
  const roomType = roomAndRate?.room?.name || 'Room Details N/A';
  const boardBasis = roomAndRate?.rate?.boardBasis?.description || 'Board Basis N/A';

  // Get image URL (using logic similar to B2C)
  const imageUrl = staticContent?.heroImage || staticContent?.images?.[0]?.links?.[0]?.url || null;
  // --- End Data Extraction ---

  // Revised Basic check: Show if we have dates or a name
   if (hotelName === 'Hotel Name N/A' && !checkInDate && !checkOutDate) {
    console.warn("CrmHotelCard: Missing essential hotel data (name and dates):", hotel);
    return (
      <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
        <p>Incomplete hotel information (Missing Name & Dates).</p>
      </div>
    );
  }

  return (
    // Use flex layout: image on left, content on right
    <div className="flex gap-4 border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image Section */}
      {imageUrl ? (
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
          <img src={imageUrl} alt={hotelName} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border">
          <BuildingOffice2Icon className="w-12 h-12 text-gray-300" />
        </div>
      )}

      {/* Content Section */}
      <div className="flex-grow space-y-2">
        {/* Header: Hotel Name and Rating */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-start border-b pb-2 gap-1">
           <h4 className="text-md md:text-lg font-semibold text-green-700 truncate leading-tight" title={hotelName}>{hotelName}</h4>
          <div className="flex items-center flex-shrink-0">
             <StarRating rating={rating} />
             {rating > 0 && <span className="ml-1 text-xs text-gray-600">({rating.toFixed(1)})</span>}
          </div>
        </div>

        {/* Body: Dates, Room Info, Address */}
        <div className="text-sm text-gray-800 space-y-1.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
            <p><span className="font-medium text-gray-600">Check-in:</span> {formatDate(checkInDate)}</p>
            <p><span className="font-medium text-gray-600">Check-out:</span> {formatDate(checkOutDate)}</p>
          </div>
          <p><span className="font-medium text-gray-600">Room:</span> {roomType} <span className="text-xs text-gray-500">({boardBasis})</span></p>
          {address !== 'Address N/A' && <p><span className="font-medium text-gray-600">Address:</span> {address}</p>}
        </div>
        {/* Optional Footer Placeholder */}
      </div>
    </div>
  );
};

export default CrmHotelCard;
