import { ArrowPathIcon, CurrencyDollarIcon, EyeIcon, PaperAirplaneIcon, TrashIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import CrmFlightViewModal from '../modals/CrmFlightViewModal';
import CrmSeatSelectionModal from '../modals/CrmSeatSelectionModal';

// --- Helper Functions (Assuming these are defined or imported elsewhere if needed) ---
// Example placeholder functions - replace with actual implementations if available
const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') return 'N/A';
    if (timeString.includes('T')) {
      try {
         const date = new Date(timeString);
         return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      } catch (e) { return 'Invalid Time'; }
    }
    return timeString.toUpperCase(); // Assuming HH:MM AM/PM
};
const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    try {
      const date = new Date(dateString);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const correctedDate = new Date(date.getTime() + userTimezoneOffset);
      return isNaN(correctedDate.getTime()) ? 'Invalid Date' : correctedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short'}); // Short format likely for card
    } catch (e) { return 'Invalid Date'; }
};
const formatDuration = (duration) => {
  if (typeof duration === 'string' && duration.match(/\d+h( \d+m)?/)) return duration; // Keep format like '3h 55m'
  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    let durationStr = '';
    if (h > 0) durationStr += `${h}h`;
    if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m}m`;
    return durationStr || null;
  }
  return 'N/A';
};
// --- End Helper Functions ---

const CrmFlightCard = ({ flight, dayIndex, itemIndex, itineraryToken, inquiryToken, travelersDetails, onUpdate }) => {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedFlightDataForView, setSelectedFlightDataForView] = useState(null);

  // State for Seat Selection Modal
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);

  // Robust checks for data structure
  if (!flight || !flight.flightData || !flight.flightData.segments || flight.flightData.segments.length === 0) {
    console.warn('Flight data, flightData object, or segments array is missing/empty for card', { dayIndex, itemIndex, flight });
    return <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">Incomplete flight data. Cannot render card.</div>;
  }
  if (!travelersDetails) {
     console.warn('Travelers details missing for CrmFlightCard, needed for seat selection', { dayIndex, itemIndex });
     // Decide how to handle - maybe disable seat button or show error?
   }

  const { flightData } = flight;
  const segment = flightData.segments[0];

  // Data extraction for the card UI (using segment primarily)
  const airline = flightData.airline || segment.airline?.name || 'Airline N/A';
  const flightNumber = segment.flightNumber || 'N/A';
  const flightCode = flightData.flightCode || 'N/A'; // May differ from segment.flightNumber

  const departureAirportCode = flightData.originAirport?.code || segment.origin || 'N/A';
  const departureCity = flightData.originAirport?.city || '';
  const departureTime = segment.departureTime;

  const arrivalAirportCode = flightData.arrivalAirport?.code || segment.destination || 'N/A';
  const arrivalCity = flightData.arrivalAirport?.city || '';
  const arrivalTime = segment.arrivalTime;

  // Use direct flightDuration from flightData if available, else calculate from segment
  const formattedDuration = formatDuration(flightData.flightDuration || segment.duration);

  // Optional: Class, Image
  const flightClass = flightData.fareDetails?.cabinClass || 'Economy';
  const imageUrl = null; // Example: flight?.imageUrl || flightData?.airlineLogoUrl || null;

  // Check if seat map exists to enable the button
  const hasSeatMap = flightData.seatMap && flightData.seatMap.length > 0 && flightData.seatMap.some(s => s.rows && s.rows.length > 0);
  // Check if seats are already selected (basic check)
  const isSeatSelected = flightData.isSeatSelected || (flightData.selectedSeats && flightData.selectedSeats.length > 0);

  // --- Button Handlers ---
  const handleRemoveFlight = () => {
    toast.info("Remove Flight action placeholder");
  };
  const handleChangeFlight = () => {
    toast.info("Change Flight action placeholder");
  };
  const handleViewFlight = () => {
    setSelectedFlightDataForView(flight);
    setIsViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedFlightDataForView(null);
  };

  // Seat Modal Handlers
  const handleOpenSeatModal = () => {
      if (!hasSeatMap) {
          toast.info("Seat map is not available for this flight.");
          return;
      }
       if (!travelersDetails) {
          toast.error("Traveler details are missing, cannot select seats.");
          return;
      }
      if (!itineraryToken || !inquiryToken) {
         toast.error("Missing necessary tokens for seat selection.");
         return;
      }
      setIsSeatModalOpen(true);
  };
  const handleCloseSeatModal = (updateTriggered) => {
      setIsSeatModalOpen(false);
      if (updateTriggered && onUpdate) {
          console.log("Seat selection update triggered, calling onUpdate...");
          onUpdate(); // Call parent update function if seats were changed
      }
  };

  // --- End Button Handlers ---

  return (
    <> {/* Fragment needed for sibling Modals */}
      <div className="relative flex flex-col md:flex-row border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
        {/* Image Section - Updated width, height, flex-shrink */}
        <div className="relative w-full h-48 md:w-64 md:h-64 md:flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt={airline} className="w-full h-full object-cover" />
          ) : (
            // Updated placeholder height
            <PaperAirplaneIcon className="w-10 h-10 text-gray-300" /> // No div wrapper needed here
          )}
        </div>

        {/* Content Section - Updated padding */}
        <div className="flex flex-col justify-between w-full p-3 md:p-4">
          {/* Header Information */}
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800">{airline}</h3>
              <span className="text-xs md:text-sm text-gray-600 block">{flightCode !== 'N/A' ? flightCode : flightNumber}</span>
            </div>
            {flightClass && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full self-start mt-1">{flightClass}</span>
            )}
          </div>

          {/* Flight Path Display (Reverted) */}
          <div className="flex items-center justify-between space-x-1 md:space-x-2 text-xs md:text-sm my-2 md:my-3">
            {/* Origin */}
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate" title={`${departureAirportCode} ${departureCity}`}>
                {departureAirportCode}
              </p>
              <p className="text-gray-600">{formatTime(departureTime)}</p>
              <p className="text-xs text-gray-500">{formatDate(departureTime)}</p>
            </div>

            {/* Duration & Flight Path Graphic */}
            <div className="text-center flex-shrink-0 px-1 md:px-2">
              <p className="text-xs text-gray-500 mb-0.5">{formattedDuration}</p>
              <div className="w-full h-px bg-gray-300 my-1 relative">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-1 md:h-1.5 md:w-1.5 bg-gray-500 rounded-full"></span>
                <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1 w-1 md:h-1.5 md:w-1.5 bg-gray-500 rounded-full"></span>
                {/* Simple line or icon */}
                <PaperAirplaneIcon className="h-3 w-3 md:h-4 md:w-4 text-gray-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5" />
              </div>
            </div>

            {/* Destination */}
            <div className="text-right flex-1 min-w-0">
              <p className="font-medium text-gray-700 truncate" title={`${arrivalAirportCode} ${arrivalCity}`}>
                {arrivalAirportCode}
              </p>
              <p className="text-gray-600">{formatTime(arrivalTime)}</p>
              <p className="text-xs text-gray-500">{formatDate(arrivalTime)}</p>
            </div>
          </div>

          {/* Action Buttons (Reverted Icons) */}
          <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1.5 md:space-x-2 flex-wrap gap-y-1 justify-end">
              <button
                onClick={handleViewFlight}
                className="p-1.5 md:p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                aria-label="View Flight"
                title="View Details"
              >
                <EyeIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={handleChangeFlight}
                className="p-1.5 md:p-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
                aria-label="Change Flight"
                title="Change Flight"
              >
                <ArrowPathIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={handleOpenSeatModal}
                className={`p-1.5 md:p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-1 ${!hasSeatMap || !travelersDetails ? 'bg-gray-400 cursor-not-allowed' : (isSeatSelected ? 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500')}`}
                aria-label={isSeatSelected ? "Change Seats" : "Choose Seats"}
                title={isSeatSelected ? "Change Seats/Extras" : "Choose Seats/Extras"}
                disabled={!hasSeatMap || !travelersDetails}
              >
                <CurrencyDollarIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
              <button
                onClick={handleRemoveFlight}
                className="p-1.5 md:p-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                aria-label="Remove Flight"
                title="Remove Flight"
              >
                <TrashIcon className="h-4 w-4 md:h-5 md:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedFlightDataForView && (
         <CrmFlightViewModal
           isOpen={isViewModalOpen}
           onClose={handleCloseViewModal}
           flightData={selectedFlightDataForView}
         />
      )}

      {/* Seat Selection Modal */}
      {isSeatModalOpen && flight && itineraryToken && inquiryToken && travelersDetails && (
          <CrmSeatSelectionModal
            isOpen={isSeatModalOpen}
            onClose={handleCloseSeatModal}
            flight={flight}
            itineraryToken={itineraryToken}
            inquiryToken={inquiryToken}
            travelersDetails={travelersDetails}
          />
      )}
    </>
  );
};

export default CrmFlightCard;
