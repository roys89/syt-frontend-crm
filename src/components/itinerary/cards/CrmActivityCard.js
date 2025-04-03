import { TicketIcon } from '@heroicons/react/24/outline'; // For placeholder
import React from 'react';

// --- Helper Functions ---
const formatTime = (timeString) => {
    // Assuming timeString is already in a displayable format like "14:00" or includes AM/PM
    if (!timeString || typeof timeString !== 'string') return 'N/A';
    // Basic check if it needs conversion from a full DateTime string (less likely based on schema)
    if (timeString.includes('T') && timeString.includes(':')) {
        try {
            return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch (e) {
            console.error("Invalid time format for conversion:", timeString, e);
            return 'Invalid Time';
        }
    }
    return timeString; // Return as is if already formatted or not a full DateTime
};

const formatDuration = (minutes) => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) return 'N/A';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    let durationStr = '';
    if (h > 0) durationStr += `${h} hour${h > 1 ? 's' : ''}`;
    if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m} minute${m > 1 ? 's' : ''}`;
    return durationStr || 'N/A';
};

const truncateDescription = (text, maxLength = 100) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
// --- End Helper Functions ---

const CrmActivityCard = ({ activity }) => {
  // --- Data Extraction (Based on Itinerary.js ActivitySchema) ---
  const activityName = activity?.activityName || 'N/A';
  // Duration likely in minutes based on schema type: Number
  const durationMinutes = activity?.duration;
  const formattedDuration = formatDuration(durationMinutes);
  // Time might be specific selected time or a general departure time object
  const time = activity?.selectedTime || activity?.departureTime?.time;
  const formattedTime = formatTime(time);

  // Address can be full or constructed
  const address = activity?.fullAddress ||
                  [activity?.street, activity?.city, activity?.country]
                    .filter(Boolean).join(', ') ||
                  'Location N/A';

  const description = activity?.description || '';
  const shortDescription = truncateDescription(description);

  // Add placeholder image URL - replace with actual logic
  const imageUrl = activity?.imageUrl || activity?.images?.[0]?.variants?.[0]?.url || null;

  // Basic check if essential data is missing
  if (activityName === 'N/A') {
    console.warn("CrmActivityCard: Missing essential activity data:", activity);
    return (
      <div className="border rounded-md p-3 bg-white shadow-sm text-red-600">
        <p>Incomplete activity information.</p>
      </div>
    );
  }

  return (
    // Use flex layout: image on left, content on right
    <div className="flex gap-4 border rounded-lg p-4 bg-white shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
       {/* Image Section */}
       {imageUrl ? (
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md overflow-hidden bg-gray-200">
          <img src={imageUrl} alt={activityName} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center border">
          <TicketIcon className="w-12 h-12 text-gray-300" />
        </div>
      )}

       {/* Content Section */}
       <div className="flex-grow space-y-2">
          {/* Header: Activity Name */}
          <div className="flex justify-between items-start border-b pb-2">
             <h4 className="text-md md:text-lg font-semibold text-purple-700 truncate leading-tight" title={activityName}>{activityName}</h4>
             {/* Optional: Add category tag if available */}
          </div>

          {/* Body: Time, Duration, Location, Description */}
          <div className="text-sm text-gray-800 space-y-1.5">
            {/* Time and Duration Row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              {formattedTime !== 'N/A' && (
                 <div className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-600">Time:</span>
                    <span>{formattedTime}</span>
                </div>
            )}
            {formattedDuration !== 'N/A' && (
                <div className="flex items-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium text-gray-600">Duration:</span>
                    <span>{formattedDuration}</span>
                 </div>
            )}
            </div>

            {/* Location Row */}
             {address !== 'Location N/A' && (
                 <div className="flex items-start gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-gray-600">Location:</span>
                    <span>{address}</span>
                </div>
             )}

            {/* Description */}
             {shortDescription && (
                <p className="text-xs text-gray-600 pt-1 italic">{shortDescription}</p>
             )}
          </div>
           {/* Optional Footer Placeholder */}
       </div>
    </div>
  );
};

export default CrmActivityCard;
