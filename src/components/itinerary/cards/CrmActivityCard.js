import { TicketIcon } from '@heroicons/react/24/outline'; // For placeholder
import { ArrowPathIcon, EyeIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { toast } from 'react-toastify';

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

const CrmActivityCard = ({ activity, onViewClick }) => {
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

  // Add button handlers before the return statement
  const handleRemoveActivity = () => {
    toast.info("Remove Activity action placeholder");
  };

  const handleChangeActivity = () => {
    toast.info("Change Activity action placeholder");
  };

  const handleViewActivity = () => {
    if (onViewClick) {
      onViewClick();
    } else {
      toast.error("View action is not configured.");
    }
  };

  const handleModifyActivity = () => {
    toast.info("Modify Activity action placeholder");
  };

  return (
    <div className="relative flex flex-col md:flex-row border rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Image Section - Updated width, height, and flex-shrink */}
      <div className="relative w-full h-48 md:w-64 md:h-64 md:flex-shrink-0 bg-gray-200">
        {imageUrl ? (
          <img src={imageUrl} alt={activityName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-48 md:h-64 flex items-center justify-center bg-gray-100">
            <TicketIcon className="w-12 h-12 text-gray-300" />
          </div>
        )}
        {/* Online badge - only show if activity is online */}
        {activity?.isOnline && (
          <div className="absolute top-4 left-4">
            <div className="flex items-center gap-1 bg-gray-800/80 text-white px-3 py-1 rounded-full text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>online</span>
            </div>
          </div>
        )}
      </div>

      {/* Content Section - Updated padding */}
      <div className="flex flex-col justify-between w-full p-3 md:p-4">
        {/* Header Information */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-800">{activityName}</h3>

          {/* Activity Details */}
          <div className="flex flex-wrap gap-4 text-sm">
            {formattedDuration !== 'N/A' && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formattedDuration}</span>
              </div>
            )}

            {formattedTime !== 'N/A' && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formattedTime}</span>
              </div>
            )}

            {address !== 'Location N/A' && (
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{address.split(',')[0]}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {shortDescription && (
            <div className="flex items-start gap-2 text-sm text-gray-700 mt-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="line-clamp-2">{shortDescription}</p>
            </div>
          )}
        </div>

        {/* Buttons section - no rating display if not available */}
        <div className="flex items-center justify-end mt-4 pt-3 border-t">
          <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-end">
            <button
              onClick={handleViewActivity}
              className="p-2 bg-green-900 text-white rounded-md hover:bg-green-800"
              aria-label="View Activity"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={handleModifyActivity}
              className="inline-flex items-center gap-1 px-2.5 py-2.5 bg-blue-900 text-white rounded-md hover:bg-blue-800 font-medium text-xs"
              aria-label="Modify Activity"
            >
              <WrenchScrewdriverIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleChangeActivity}
              className="inline-flex items-center gap-1 px-2.5 py-2.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 font-medium text-xs"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <button
              onClick={handleRemoveActivity}
              className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              aria-label="Remove Activity"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmActivityCard;
