import { HomeIcon } from '@heroicons/react/24/outline';
import { ArrowPathIcon, EyeIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CrmHotelModifyModal from '../modals/CrmHotelModifyModal';
import CrmHotelViewModal from '../modals/CrmHotelViewModal';

// --- Helper Functions ---
const formatDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch (e) {
    console.error("Invalid date format:", dateString);
    return dateString;
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

const CrmHotelCard = ({ hotel, travelersDetails }) => {
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

  // State for view modal
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  // State for modify modal
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);

  // Revised Basic check: Show if we have dates or a name
   if (hotelName === 'Hotel Name N/A' && !checkInDate && !checkOutDate) {
    console.warn("CrmHotelCard: Missing essential hotel data (name and dates):", hotel);
    return (
      <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
        <p>Incomplete hotel information (Missing Name & Dates).</p>
      </div>
    );
  }

  // Format check-in/out if needed
  const formattedCheckIn = formatDate(checkInDate);
  const formattedCheckOut = formatDate(checkOutDate);

  // Calculate nights
  const nights = (() => {
    try {
      if (checkInDate === 'N/A' || checkOutDate === 'N/A') return 'N/A';
      const start = new Date(checkInDate);
      const end = new Date(checkOutDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      console.error("Error calculating nights:", e);
      return 'N/A';
    }
  })();

  // Add button handlers before the return statement
  const handleRemoveHotel = () => {
    toast.info("Remove Hotel action placeholder");
  };

  const handleChangeHotel = () => {
    toast.info("Change Hotel action placeholder");
  };

  const handleViewHotel = () => {
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
  };

  const handleChangeRoom = () => {
    toast.info("Change Room action placeholder");
  };

  // Updated: Open the new modify modal
  const handleModifyHotel = () => {
    if (!travelersDetails) {
        toast.error("Cannot modify: Traveler details are missing.");
        return;
    }
    setIsModifyModalOpen(true);
  };
  const handleCloseModifyModal = () => {
    setIsModifyModalOpen(false);
    // Add any logic needed after closing modify, e.g., triggering itinerary refresh
  };

  return (
    <>
      <div className="relative flex flex-col md:flex-row border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
        {/* Image Section - Updated width, height, flex-shrink */}
        <div className="relative w-full h-48 md:w-64 md:h-64 md:flex-shrink-0 bg-gray-200">
          {imageUrl ? (
            <img src={imageUrl} alt={hotelName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-48 md:h-64 flex items-center justify-center bg-gray-100">
              <HomeIcon className="w-12 h-12 text-gray-300" />
            </div>
          )}
        </div>

        {/* Content Section - Updated padding */}
        <div className="flex flex-col justify-between w-full p-3 md:p-4">
          {/* Header Information */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-gray-800">{hotelName}</h3>

            {/* Hotel Details */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium text-gray-600">Check In:</span>
                <span className="ml-2 text-gray-800">{formattedCheckIn}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium text-gray-600">Check Out:</span>
                <span className="ml-2 text-gray-800">{formattedCheckOut}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium text-gray-600">Nights:</span>
                <span className="ml-2 text-gray-800">{nights !== 'N/A' ? `${nights} night${nights > 1 ? 's' : ''}` : 'N/A'}</span>
              </div>
              <div className="col-span-2 md:col-span-1">
                <span className="font-medium text-gray-600">Room Type:</span>
                <span className="ml-2 text-gray-800">{roomType}</span>
              </div>
            </div>

            {/* Location */}
            {address !== 'Address N/A' && (
              <div className="flex items-start gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700 line-clamp-1">{address}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end mt-4 pt-3 border-t">
            <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
              <button
                onClick={handleViewHotel}
                className="p-2 bg-green-900 text-white rounded-md hover:bg-green-800"
                aria-label="View Hotel"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleModifyHotel}
                className="inline-flex items-center gap-1 px-2.5 py-2.5 bg-blue-900 text-white rounded-md hover:bg-blue-800 font-medium text-xs"
                aria-label="Modify Hotel"
              >
                <WrenchScrewdriverIcon className="h-4 w-4" />
                Hotel
              </button>
              <button
                onClick={handleChangeRoom}
                className="inline-flex items-center gap-1 px-2.5 py-2.5 bg-purple-900 text-white rounded-md hover:bg-purple-800 font-medium text-xs"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Room
              </button>
              <button
                onClick={handleChangeHotel}
                className="inline-flex items-center gap-1 px-2.5 py-2.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium text-xs"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Hotel
              </button>
              <button
                onClick={handleRemoveHotel}
                className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                aria-label="Remove Hotel"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hotel view modal */}
      <CrmHotelViewModal 
        isOpen={isViewModalOpen} 
        onClose={handleCloseViewModal} 
        hotelData={hotel} 
      />

      {/* Hotel modify modal */}
      {isModifyModalOpen && (
        <CrmHotelModifyModal
            isOpen={isModifyModalOpen}
            onClose={handleCloseModifyModal}
            hotelData={hotel}
            travelersDetails={travelersDetails}
        />
      )}
    </>
  );
};

export default CrmHotelCard;
