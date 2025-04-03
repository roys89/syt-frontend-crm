import React from 'react';
// Optional: Add icons if desired
// import { PlaneIcon } from '@heroicons/react/24/solid';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

// --- Helper Functions ---
const formatTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        return new Date(dateTimeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Invalid time format:", dateTimeString, e);
        return 'Invalid Time';
    }
};

const formatDate = (dateTimeString) => {
     if (!dateTimeString) return 'N/A';
     try {
         // Use locale 'en-GB' for dd/mm/yyyy or 'en-CA' for yyyy-mm-dd, 'en-US' for mm/dd/yyyy
         return new Date(dateTimeString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
     } catch (e) {
        console.error("Invalid date format:", dateTimeString, e);
         return 'Invalid Date';
     }
};

const formatDuration = (minutes) => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
};
// --- End Helper Functions ---

const CrmFlightCard = ({ flight }) => {
  // --- Data Extraction with Null Checks ---
  // Assuming structure similar to B2C: flight -> flightData -> segments[]
  const flightData = flight?.flightData;
  const segment = flightData?.segments?.[0]; // Use the first segment

  // Add placeholder image URL - replace with actual logic if image data is available
  const imageUrl = flight?.imageUrl || flightData?.airlineLogoUrl || null; // Example: Look for image URL

  if (!segment) {
    console.warn("CrmFlightCard: Missing flight segment data for flight:", flight);
    // Provide a basic fallback if segment data is missing but flight object exists
    const airlineName = flight?.airlineName || flight?.airline || 'N/A';
    const flightNum = flight?.flightNumber || 'N/A';
    return (
       <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
         <p className="font-semibold">{airlineName} {flightNum}</p>
         <p>Flight data segment is missing or incomplete.</p>
         {/* Optionally log raw flight object here for debugging */}
         {/* <pre className="text-xs mt-2">{JSON.stringify(flight, null, 2)}</pre> */}
       </div>
    );
  }

  const airline = flightData.airline || 'N/A';
  const flightNumber = segment.flightNumber || 'N/A'; // Flight number often on segment
  const flightCode = flightData.flightCode || 'N/A'; // Flight code might be on flightData

  const departureAirport = segment.origin || 'N/A';
  // Assuming city info might not be directly available in segment, check flightData or higher level if needed
  const departureCity = flightData.originCity || segment.originCity || ''; // Example fallback
  const departureTime = segment.departureTime;

  const arrivalAirport = segment.destination || 'N/A';
  const arrivalCity = flightData.destinationCity || segment.destinationCity || ''; // Example fallback
  const arrivalTime = segment.arrivalTime;

  const durationMinutes = segment.duration; // Assuming duration is in minutes
  const formattedDuration = formatDuration(durationMinutes);

  // Optional: Extract class/baggage if available
  const flightClass = flightData.fareDetails?.cabinClass || flightData.class || 'N/A';
  // --- End Data Extraction ---

  return (
    // Use flex layout: image on left, content on right
    <div className="flex gap-4 border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
      {/* Image Section (Placeholder) */}
      {imageUrl ? (
         <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
            <img src={imageUrl} alt={airline} className="w-full h-full object-cover" />
          </div>
      ) : (
           <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border">
               <PaperAirplaneIcon className="w-12 h-12 text-gray-300" />
            </div>
      )}

       {/* Content Section */}
       <div className="flex-grow space-y-3">
          {/* Header: Airline and Flight Code/Number */}
          <div className="flex justify-between items-start border-b pb-2">
             <div>
                 <h4 className="text-md md:text-lg font-semibold text-indigo-700 leading-tight">{airline}</h4>
                 <span className="text-xs md:text-sm font-medium text-gray-600 block">{flightCode !== 'N/A' ? flightCode : flightNumber}</span>
             </div>
             {flightClass !== 'N/A' && (
                 <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded h-fit mt-1">{flightClass}</span>
             )}
          </div>

          {/* Body: Origin -> Duration -> Destination */}
          <div className="flex items-center justify-between space-x-2 text-sm">
             {/* Origin */}
             <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate" title={`${departureAirport} ${departureCity ? `(${departureCity})` : ''}`}>{departureAirport} {departureCity ? `(${departureCity})` : ''}</p>
                <p className="text-gray-600">{formatTime(departureTime)}</p>
                <p className="text-xs text-gray-500">{formatDate(departureTime)}</p>
             </div>
             {/* Duration & Flight Path Graphic Placeholder */}
             <div className="text-center flex-shrink-0 px-1 md:px-2">
                <p className="text-xs text-gray-500">{formattedDuration}</p>
                <div className="w-full h-px bg-indigo-200 my-1 relative">
                   <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                   <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-1.5 bg-indigo-500 rounded-full"></span>
                   {/* Optional: Airplane Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 16.571V11a1 1 0 112 0v5.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                </div>
             </div>
             {/* Destination */}
             <div className="text-right flex-1 min-w-0">
                 <p className="font-semibold text-gray-800 truncate" title={`${arrivalAirport} ${arrivalCity ? `(${arrivalCity})` : ''}`}>{arrivalAirport} {arrivalCity ? `(${arrivalCity})` : ''}</p>
                 <p className="text-gray-600">{formatTime(arrivalTime)}</p>
                 <p className="text-xs text-gray-500">{formatDate(arrivalTime)}</p>
            </div>
          </div>
           {/* Optional Footer can go here */}
       </div>
    </div>
  );
};

export default CrmFlightCard;
