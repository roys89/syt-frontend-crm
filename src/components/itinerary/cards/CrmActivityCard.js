import { TicketIcon } from '@heroicons/react/24/outline'; // For placeholder
import { ArrowPathIcon, EyeIcon, TrashIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { toast } from 'react-toastify';

// Import the CHANGE Activity Detail modal
import CrmChangeActivityDetailModal from '../modals/change/CrmChangeActivityDetailModal';
// Import the RoomArrangementModal component
import RoomArrangementModal from '../../booking/RoomArrangementModal';

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

// Updated formatDuration to handle input in hours
const formatDuration = (totalHours) => {
    if (typeof totalHours !== 'number' || isNaN(totalHours) || totalHours <= 0) return 'N/A';
    // Calculate full hours and remaining minutes
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60); // Convert fractional part of hour to minutes
    
    let durationStr = '';
    if (h > 0) durationStr += `${h} hour${h > 1 ? 's' : ''}`;
    if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m} minute${m > 1 ? 's' : ''}`;
    
    return durationStr || 'N/A'; // Return formatted string or N/A if calculation results in zero
};

const truncateDescription = (text, maxLength = 100) => {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};
// --- End Helper Functions ---

const CrmActivityCard = ({ 
    activity, 
    onViewClick, 
    itineraryToken, 
    inquiryToken, 
    travelersDetails, 
    city, 
    country,
    date, 
    onUpdate
}) => {
    // State for the Modify modal flow
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);         // Step 1: Room/Travelers Edit
    const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);       // Step 2: Activity Change
    const [initialRoomsForModal, setInitialRoomsForModal] = useState([]); // State for RoomArrangementModal, expects array of rooms
    const [confirmedTravelersDetails, setConfirmedTravelersDetails] = useState(null); // State for final change modal, expects { rooms: [...] } format
    // State to hold the activity data formatted for the modal
    const [activityForModal, setActivityForModal] = useState(null);

    const navigate = useNavigate(); // Initialize navigate hook
    const [isRemoving, setIsRemoving] = useState(false); // State for loading indicator

    // --- Data Extraction (Based on Itinerary.js ActivitySchema) ---
    const activityName = activity?.activityName || 'N/A';
    // Duration is in HOURS
    const durationHours = activity?.duration;
    const formattedDuration = formatDuration(durationHours);
    // Time might be specific selected time or a general departure time object
    const time = activity?.selectedTime || activity?.departureTime?.time;
    const endTime = activity?.endTime; // Extract endTime
    const formattedTime = formatTime(time);
    const formattedEndTime = formatTime(endTime); // Format endTime

    // Address can be full or constructed
    const address = activity?.fullAddress ||
                    [activity?.street, activity?.city, activity?.country]
                      .filter(Boolean).join(', ') ||
                    'Location N/A';

    const description = activity?.description || '';
    const shortDescription = truncateDescription(description);

    // Add placeholder image URL - replace with actual logic
    const imageUrl = activity?.imageUrl || activity?.images?.[0]?.variants?.[0]?.url || null;

    // Get price and code needed for changing
    const existingPrice = activity?.packageDetails?.amount || 0;
    const oldActivityCode = activity?.activityCode;

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
    const handleRemoveActivity = async () => {
        if (!itineraryToken || !inquiryToken || !city || !date || !oldActivityCode) {
            toast.error("Cannot remove activity: Missing required information.");
            console.error("Missing data for remove activity:", { itineraryToken, inquiryToken, city, date, oldActivityCode });
            return;
        }

        // Optional: Add a confirmation dialog
        // if (!window.confirm(`Are you sure you want to remove ${activityName}?`)) {
        //     return;
        // }

        setIsRemoving(true);
        try {
            const response = await fetch(
                `http://localhost:5000/api/itinerary/${itineraryToken}/activity`, // Use relative path
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                        // Assuming token is handled by an interceptor or context
                        'Authorization': `Bearer ${localStorage.getItem('crmToken')}` 
                    },
                    body: JSON.stringify({
                        cityName: city,
                        date: date,
                        activityCode: oldActivityCode
                    }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Failed to remove activity');
            }

            toast.success(`${activityName} removed successfully.`);
            window.location.reload(); // Force page reload

        } catch (error) {
            console.error('Error removing activity:', error);
            toast.error(`Error removing activity: ${error.message}`);
        } finally {
            setIsRemoving(false);
        }
    };

    // --- Modified Change Activity Handler --- 
    const handleChangeActivity = () => {
        // 1. Validate required props
        if (!itineraryToken || !oldActivityCode || !inquiryToken || !city || !country || !date) {
            toast.error("Cannot initiate activity change: Missing required context.");
            console.error("Missing context for navigation:", { 
                itineraryToken, oldActivityCode, inquiryToken, city, country, date 
            });
            return;
        }

        // 2. Prepare state for the change page
        const navigationState = {
            oldActivityCode: oldActivityCode,
            existingPrice: existingPrice,
            inquiryToken: inquiryToken,
            travelersDetails: travelersDetails, // Pass traveler details
            city: city, 
            country: country,
            date: date, 
        };

        // 3. Define the target route
        const targetRoute = `/crm/change-activity/${itineraryToken}/${encodeURIComponent(city)}/${date}`;

        // 4. Log and Navigate
        console.log(`Navigating to ${targetRoute} with state:`, navigationState);
        navigate(targetRoute, { state: navigationState });
    };
    // --- End Modified Handler --- 

    const handleViewActivity = () => {
        if (onViewClick) {
            onViewClick();
        } else {
            toast.error("View action is not configured.");
        }
    };

    const handleModifyActivity = () => {
        // Validate required data for opening the modal
        if (!activity || !itineraryToken || !inquiryToken || !city || !date || !travelersDetails || !activity.searchId || !activity.activityCode) {
            toast.error("Cannot modify activity: Missing required context.");
            console.error("Missing data for modify modal:", { activity, itineraryToken, inquiryToken, city, date, travelersDetails });
            return;
        }

        // --- Transform activity data for the CrmChangeActivityDetailModal --- 
        const transformedActivity = {
            // Map itinerary fields to fields expected by the modal (based on results page usage)
            code: activity.activityCode,          // activityCode -> code
            title: activity.activityName,         // activityName -> title
            amount: activity.packageDetails?.amount || 0, // packageDetails.amount -> amount
            imgURL: activity.images?.[0]?.variants?.[0]?.url || null, // First image -> imgURL
            groupCode: activity.groupCode,         // Pass through groupCode
            description: activity.description,     // Pass through description (modal might use this)
            searchId: activity.searchId,           // Pass through searchId
            activityType: activity.activityType,   // Pass through activityType
            // Include other potential fields if the Add modal expects them from search results
        };

        console.log("Preparing activity for modification:", transformedActivity);
        setActivityForModal(transformedActivity); // Store the transformed data

        // --- Transform initial travelersDetails for RoomArrangementModal --- 
        // RoomArrangementModal expects an array of rooms like [{ adults: [30, 25], children: [5] }]
        // travelersDetails is { rooms: [{ adults: [30, 25], children: [5] }] }
        const initialRooms = travelersDetails?.rooms?.map(room => ({ 
            // Ensure adults/children are arrays of numbers (provide default age if needed)
            adults: Array.isArray(room.adults) 
                ? room.adults.map(age => age ?? 30) // Default age 30 if null/undefined
                : Array(room.adults || 1).fill(30), // If it's just a count, create array
            children: Array.isArray(room.children) 
                ? room.children.map(age => age ?? 5) // Default age 5 if null/undefined
                : [] 
        })) || [{ adults: [30], children: [] }]; // Default if travelersDetails is missing

        console.log("Initial rooms for RoomArrangementModal:", initialRooms);
        setInitialRoomsForModal(initialRooms);

        // Open the Room Arrangement modal first
        setIsRoomModalOpen(true);
    };

    // Handler for saving changes from RoomArrangementModal
    const handleRoomSave = (updatedRooms) => {
        if (!activityForModal) { 
            toast.error("Error: Activity data is missing.");
            return;
        }
        console.log("Room arrangement confirmed:", updatedRooms);
        
        // --- Transform updatedRooms (array) back into itinerary format { rooms: [...] } --- 
        const finalTravelersForChangeModal = {
             // Assuming travelersDetails structure might have other props like 'type'
             // If not, this can be simplified
             ...(travelersDetails || {}),
             rooms: updatedRooms.map(room => ({ // Map the updated rooms array
                adults: room.adults.filter(age => age !== null && age !== undefined), // Ensure only valid ages are kept
                children: room.children.filter(age => age !== null && age !== undefined)
             }))
        };
        console.log("Final travelers for change modal:", finalTravelersForChangeModal);

        // Store the final travelers details in state for the change modal
        setConfirmedTravelersDetails(finalTravelersForChangeModal); 

        setIsRoomModalOpen(false);    // Close room modal
        setIsChangeModalOpen(true);    // Open activity change modal
    };

    // Handler for closing the Room Arrangement modal without saving
    const handleCloseRoomModal = () => {
        setIsRoomModalOpen(false);
        // Optionally reset initialRoomsForModal if needed
        // setInitialRoomsForModal([]);
    };

    // Handler for closing the final change modal
    const handleCloseChangeModal = () => {
        setIsChangeModalOpen(false);
        setActivityForModal(null);
        setConfirmedTravelersDetails(null); // Clear confirmed travelers state
        // Optionally reset initialRoomsForModal if needed
        // setInitialRoomsForModal([]);
    };

    // Callback for when the modal successfully modifies the activity
    const handleActivityModifiedSuccessfully = () => {
        handleCloseChangeModal(); // Close the change modal and cleanup state
        toast.success("Activity modified successfully!");
        // Call the onUpdate prop passed from CrmItineraryDay to refresh data
        if (onUpdate) {
            onUpdate(); 
        } else {
             // Fallback if onUpdate isn't provided
             console.warn("onUpdate prop not provided to CrmActivityCard, attempting page reload.");
             window.location.reload(); 
        }
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

                        {(formattedTime !== 'N/A' || formattedEndTime !== 'N/A') && (
                            <div className="flex items-center gap-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                    {formattedTime !== 'N/A' ? formattedTime : ''}
                                    {formattedTime !== 'N/A' && formattedEndTime !== 'N/A' ? ' - ' : ''}
                                    {formattedEndTime !== 'N/A' ? formattedEndTime : ''}
                                </span>
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
                            className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Remove Activity"
                            disabled={isRemoving} // Disable button when removing
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- Step 1: Room Arrangement Modal --- */} 
            {isRoomModalOpen && (
                <RoomArrangementModal
                    isOpen={isRoomModalOpen}
                    onClose={handleCloseRoomModal} // Close handler for room modal
                    initialRooms={initialRoomsForModal} // Pass the prepared initial rooms array
                    onSave={handleRoomSave} // Save handler to process changes
                    // Optional: Pass max constraints if needed, otherwise defaults are used
                    // maxRooms={1} // Activities typically involve a single group/room concept
                    // maxAdultsPerRoom={...} 
                    // maxChildrenPerRoom={...}
                />
            )}

            {/* --- Step 2: Activity Change Modal --- */} 
            {isChangeModalOpen && activityForModal && (
                <CrmChangeActivityDetailModal
                    isOpen={isChangeModalOpen}
                    onClose={handleCloseChangeModal} // Use specific close handler
                    selectedActivity={activityForModal} // Pass potentially transformed activity
                    itineraryToken={itineraryToken}
                    inquiryToken={inquiryToken}
                    // Use the searchId FROM THE CURRENT activity object
                    searchId={activityForModal.searchId} 
                    // Pass the travelers details transformed BACK to itinerary format
                    travelersDetails={confirmedTravelersDetails} // Use the state variable instead
                    city={city} // Pass city prop
                    date={date} // Pass date prop
                    // Pass oldActivityCode to signal modification intent
                    oldActivityCode={activity.activityCode} // Use original activityCode here
                    // Pass existing price separately if needed
                    existingPrice={existingPrice} 
                    // Use the correct prop for the change modal callback
                    onActivityChanged={handleActivityModifiedSuccessfully} 
                />
            )}
        </div>
    );
};

export default CrmActivityCard;
