import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon as X } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Helper function to format currency
const formatCurrency = (amount, currency = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    return `${currency} ${Math.round(amount).toLocaleString('en-IN')}`;
};

// Placeholder for displaying activity options within the modal
const ActivityOptionCard = ({ option, selected, onSelect }) => {
    // Basic check for option object
    if (!option || typeof option !== 'object') {
        console.warn('ActivityOptionCard received invalid option:', option);
        return null; 
    }

    return (
        <div
            onClick={onSelect}
            className={`p-3 border rounded-lg cursor-pointer transition-all duration-150
                ${selected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'}
            `}
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex-grow min-w-0"> {/* Added min-w-0 for better truncation */} 
                    <p className="font-medium text-gray-800 text-sm truncate">{option.title || 'Option Title N/A'}</p>
                    {option.description && (
                         <p className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: option.description }} />
                    )}
                    {option.departureTime && (
                        <p className="text-xs text-indigo-600 mt-1">Departure: {option.departureTime}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0 ml-2"> {/* Added ml-2 */} 
                    <p className="font-semibold text-base text-blue-600 whitespace-nowrap"> {/* Added whitespace-nowrap */} 
                        {formatCurrency(option.amount, option.currency)}
                    </p>
                </div>
            </div>
        </div>
    );
};

// --- Helper function to parse duration string to minutes --- 
const parseDurationToMinutes = (durationString) => {
    if (!durationString || typeof durationString !== 'string') {
        return null; // Or 0 if preferred
    }
    let totalMinutes = 0;
    const hoursMatch = durationString.match(/(\d+)\s*hour/i);
    const minutesMatch = durationString.match(/(\d+)\s*minute/i);

    if (hoursMatch && hoursMatch[1]) {
        totalMinutes += parseInt(hoursMatch[1], 10) * 60; // Convert hours to minutes
    }
    if (minutesMatch && minutesMatch[1]) {
        totalMinutes += parseInt(minutesMatch[1], 10);
    }

    // Handle cases like "30 minutes" or "2 hours" where one part might be missing
    // If neither is found, but it's just a number, assume minutes? (More reasonable now)
    if (totalMinutes === 0 && /^\d+$/.test(durationString.trim())) {
        totalMinutes = parseInt(durationString.trim(), 10);
    }

    return totalMinutes > 0 ? totalMinutes : null; // Return null if parsing yields 0 or less
};

// --- Frontend Time Helper Functions (based on backend logic) ---

// Helper function to validate and normalize time (HH:MM format)
const validateAndNormalizeTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!pattern.test(timeStr)) return null;
    return timeStr; // Already in HH:MM format
};

// Helper function to determine time slot based on hour
const getTimeSlot = (timeStr) => {
  if (!timeStr) return null;
  const validatedTime = validateAndNormalizeTime(timeStr);
  if (!validatedTime) return null;

  const hour = parseInt(validatedTime.split(':')[0], 10);

  if (hour >= 9 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 20) return 'evening';
  return null; // Outside defined slots or invalid
};

// Helper function to calculate end time using duration in minutes
const calculateEndTime = (startTimeStr, durationInMinutes) => {
  const validatedStartTime = validateAndNormalizeTime(startTimeStr);
  if (!validatedStartTime || durationInMinutes == null || durationInMinutes <= 0) {
    return null; // Cannot calculate without valid start time and duration
  }

  const [hours, minutes] = validatedStartTime.split(':').map(Number);
  const totalStartMinutes = hours * 60 + minutes;
  const totalEndMinutes = totalStartMinutes + durationInMinutes;

  const endHours = Math.floor(totalEndMinutes / 60) % 24; // Use modulo 24 for potential next day wrap
  const endMinutes = totalEndMinutes % 60;

  // Clamp to 20:00 if it goes beyond standard operating hours for calculation simplicity here
  // Note: Backend might have slightly different clamping logic
  if (endHours >= 20 && totalStartMinutes < (20*60)) { // Only clamp if it *crosses* 20:00
      return '20:00';
  }

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// --- End Frontend Time Helper Functions ---

const CrmAddActivityDetailModal = ({
    isOpen,
    onClose,
    selectedActivity,
    itineraryToken,
    inquiryToken,
    searchId,
    travelersDetails,
    city,
    date,
    onActivityAdded
}) => {
    // State for the final Add API call status (renamed from isAdding)
    const [bookingStatus, setBookingStatus] = useState({
        loading: false,
        error: null,
        success: false,
        message: ''
    });

    // --- State for fetching/displaying activity details ---
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [activityDetails, setActivityDetails] = useState(null); // Stores full response from /product-info
    const [selectedOption, setSelectedOption] = useState(null); // Tracks user's selection or fallback
    // --- End Details State ---

    // --- State for Manual Time Input ---
    const [manualStartTime, setManualStartTime] = useState('');
    // --- End Manual Time State ---

    // --- Fetch detailed options when modal opens ---
    const fetchActivityDetails = useCallback(async () => {
        if (!selectedActivity?.code || !searchId || !inquiryToken || !city || !date || !travelersDetails) {
             console.error("Add Modal: Missing data for fetching activity details:", {
                 selectedActivity, searchId, inquiryToken, city, date, travelersDetails
             });
             setDetailsError("Internal error: Missing required data to fetch details.");
             // Set fallback immediately if fetch can't proceed
             setSelectedOption({
                 amount: selectedActivity?.amount ?? 0,
                 currency: selectedActivity?.currency || 'INR',
                 ratekey: null,
                 title: selectedActivity?.title || 'Activity',
                 departureTime: null,
                 description: selectedActivity?.description || ''
             });
             return;
        }

        setDetailsLoading(true);
        setDetailsError(null);
        setSelectedOption(null); // Reset selection during load
        setActivityDetails(null); // Clear previous details
        setBookingStatus({ loading: false, error: null, success: false, message: '' }); // Reset final status

        try {
            console.log(`Add Modal: Fetching product info for activity code: ${selectedActivity.code} using searchId: ${searchId}`);
            const response = await fetch(
                `http://localhost:5000/api/itinerary/product-info/${selectedActivity.code}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                    },
                    body: JSON.stringify({
                        city: { name: city },
                        date: date,
                        travelersDetails: travelersDetails,
                        searchId: searchId,
                        groupCode: selectedActivity.groupCode // Pass groupCode if available
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activity details (${response.status})`);
            }

            const data = await response.json();
            console.log("Add Modal: Fetched activity product info:", data);

            if (!data) {
                 throw new Error("Empty response received for activity details.");
            }
            setActivityDetails(data);

            const firstOption = data?.availabilityDetails?.[0];
            if (firstOption && typeof firstOption === 'object') {
                handleOptionSelect(firstOption); // Automatically select first option if valid
            } else {
                 console.log("No specific options found or first option invalid, using fallback.");
                 // Fallback using basic info
                 setSelectedOption({
                     amount: selectedActivity.amount ?? 0,
                     currency: selectedActivity.currency || 'INR',
                     ratekey: null,
                     title: selectedActivity.title || 'Activity',
                     departureTime: null,
                     description: selectedActivity.description || ''
                 });
            }

        } catch (err) {
            console.error("Add Modal: Error fetching activity details:", err);
            setDetailsError(err.message);
             // Fallback on error
            setSelectedOption({
                amount: selectedActivity?.amount ?? 0,
                currency: selectedActivity?.currency || 'INR',
                ratekey: null,
                title: selectedActivity?.title || 'Activity',
                departureTime: null,
                description: selectedActivity?.description || ''
            });
        } finally {
            setDetailsLoading(false);
        }
    }, [selectedActivity, searchId, inquiryToken, city, date, travelersDetails]);

    // Trigger fetch when modal opens
    useEffect(() => {
        if (isOpen && selectedActivity) {
            fetchActivityDetails();
        }
         // Cleanup on close
        if (!isOpen) {
            setActivityDetails(null);
            setSelectedOption(null);
            setDetailsError(null);
            setDetailsLoading(false);
            setManualStartTime(''); // Reset manual time on close
             setBookingStatus({ loading: false, error: null, success: false, message: '' });
        }
    }, [isOpen, selectedActivity, fetchActivityDetails]);

    // --- Handle option selection ---
    const handleOptionSelect = (option) => {
        // Basic validation of the option before setting
        if (option && typeof option === 'object' && typeof option.amount === 'number') {
            console.log("Add Modal: Selecting option:", option);
            setSelectedOption(option);
        } else {
            console.warn("Add Modal: Attempted to select invalid option:", option);
             // Optionally fall back again or show an error
             setSelectedOption({
                 amount: selectedActivity?.amount ?? 0,
                 currency: selectedActivity?.currency || 'INR',
                 ratekey: null,
                 title: selectedActivity?.title || 'Activity',
                 departureTime: null,
                 description: selectedActivity?.description || ''
             });
        }
    };

    // --- Handle final Add Confirmation (Renamed from handleAddActivity) ---
    const handleConfirmAdd = async () => {
        if (!selectedOption) {
            toast.error("Activity details are still loading or missing. Cannot add.");
            return;
        }
        if (!itineraryToken || !inquiryToken || !city || !date) {
            toast.error("Cannot add activity: Missing essential itinerary context.");
            console.error("Add Modal: Missing context for POST request:", { itineraryToken, city, date, inquiryToken });
            return;
        }

        setBookingStatus({ loading: true, error: null, success: false, message: 'Adding activity...' });

        try {
            // --- Determine Start Time --- 
            let finalStartTime = null;
            const hasDepartureTime = selectedOption.departureTime && validateAndNormalizeTime(selectedOption.departureTime);

            if (hasDepartureTime) {
                finalStartTime = selectedOption.departureTime;
                console.log(`Add Modal: Using provided departure time: ${finalStartTime}`);
            } else {
                finalStartTime = validateAndNormalizeTime(manualStartTime);
                console.log(`Add Modal: Using manual start time: ${finalStartTime}`);
                if (!finalStartTime) {
                     setBookingStatus({ loading: false, success: false, error: true, message: 'Please enter a valid start time (HH:MM).' });
                     return; // Stop if manual time is invalid
                }
            }

            // --- Parse Duration to Minutes --- 
            const durationInMinutes = parseDurationToMinutes(activityDetails?.productInfo?.duration);
            console.log(`Add Modal: Parsed duration '${activityDetails?.productInfo?.duration}' to ${durationInMinutes} minutes.`);
            if (durationInMinutes === null) {
                // Handle case where duration couldn't be parsed (might need user input too? For now, error out)
                console.error("Add Modal: Could not parse duration from product info.");
                setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine activity duration.' });
                return;
            }

            // --- Calculate End Time & Time Slot ---
            const finalEndTime = calculateEndTime(finalStartTime, durationInMinutes);
            const finalTimeSlot = getTimeSlot(finalStartTime);
            console.log(`Add Modal: Calculated End Time: ${finalEndTime}, Time Slot: ${finalTimeSlot}`);


            // Construct the newActivityDetails payload
            const newActivityDetailsPayload = {
                searchId: searchId, // Include searchId
                activityType: activityDetails?.productInfo?.activityType || 'online', // Use fetched type or default
                activityCode: selectedActivity.code,
                activityName: selectedOption.title || selectedActivity.title,
                activityProvider: 'GRNC',
                selectedTime: finalStartTime, // Use determined start time
                endTime: finalEndTime, // Include calculated end time
                timeSlot: finalTimeSlot, // Include determined time slot
                isFlexibleTiming: !hasDepartureTime, // Indicate if time was manually set
                bookingStatus: 'pending',
                departureTime: { // Structure based on backend assignTimeSlots
                    time: finalStartTime,
                    code: selectedOption?.ratekey || null // Use ratekey as the code identifier for the selected option
                },
                packageDetails: { // Details from the *selected option* or fallback
                    amount: selectedOption.amount,
                    currency: selectedOption.currency,
                    ratekey: selectedOption.ratekey, // Can be null
                    title: selectedOption.title,
                    departureTime: selectedOption.departureTime, // Optional
                    description: selectedOption.description // Optional
                },
                images: activityDetails?.productInfo?.images || (selectedActivity.imgURL ? [{variants:[{url: selectedActivity.imgURL}]}] : []),
                description: activityDetails?.productInfo?.description || selectedActivity.description || '',
                groupCode: selectedActivity.groupCode || null,
                // Add other fields if needed based on what backend expects for 'add'
                duration: durationInMinutes, // Use the parsed number value (minutes)
                departurePoint: activityDetails?.productInfo?.departurePoint || null,
                inclusions: activityDetails?.productInfo?.inclusions || [],
                exclusions: activityDetails?.productInfo?.exclusions || [],
                additionalInfo: activityDetails?.productInfo?.additionalInfo || [],
                itinerary: activityDetails?.productInfo?.itinerary || null,
                bookingRequirements: activityDetails?.productInfo?.bookingRequirements || null,
                pickupHotellist: activityDetails?.productInfo?.PickupHotellist || null,
                bookingQuestions: activityDetails?.productInfo?.bookingQuestions || [],
                cancellationFromTourDate: activityDetails?.productInfo?.cancellationFromTourDate || [],
                tourGrade: activityDetails?.productInfo?.tourGrades?.[0] || null,
                ageBands: activityDetails?.productInfo?.ageBands || [],
            };

            const requestBody = {
                cityName: city,
                date: date,
                newActivityDetails: newActivityDetailsPayload, // Send the structured payload
                searchId: searchId,
                travelersDetails: travelersDetails // Send traveler details too, as backend might need it for adding
            };

            console.log("Add Modal: Submitting POST /activity request:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(
                `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            const responseData = await response.json();

            if (!response.ok) {
                // Try to parse backend error message
                let errorMessage = `Failed to add activity (${response.status})`;
                if (responseData && responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData && responseData.error) {
                     errorMessage = responseData.error;
                 }
                throw new Error(errorMessage);
            }

            // Success
            setBookingStatus({ loading: false, success: true, error: null, message: 'Activity added successfully!' });
            // Give user time to see success message before triggering callback
            setTimeout(() => {
                if (onActivityAdded) {
                     onActivityAdded();
                }
            }, 1500); // 1.5 second delay

        } catch (err) {
            console.error("Add Modal: Error confirming activity add:", err);
            setBookingStatus({ loading: false, success: false, error: true, message: err.message || "An unknown error occurred." });
            // No need for separate toast, status message is shown
        }
    };
    // --- End Handlers ---

    if (!isOpen || !selectedActivity) return null;

    // Extract details for rendering
    const availableOptions = activityDetails?.availabilityDetails || [];
    const productInfo = activityDetails?.productInfo || {};
    const displayTitle = productInfo?.title || selectedActivity?.title || 'Activity Details';
    const displayImages = productInfo.images && productInfo.images.length > 0
        ? productInfo.images
        : (selectedActivity.imgURL ? [{ variants: [{ url: selectedActivity.imgURL }], caption: 'Activity Image' }] : []);
    const displayDescription = productInfo?.description || selectedActivity?.description || '';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg flex-shrink-0">
                     <h2 className="text-lg font-semibold text-gray-800 truncate pr-4" title={displayTitle}>
                        Add: {displayTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={bookingStatus.loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */} 
                <div className="flex-grow overflow-y-auto p-5">
                    {detailsLoading && (
                        <div className="text-center p-10">
                            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading activity details...</p>
                        </div>
                    )}
                     {detailsError && !detailsLoading && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 mb-4 rounded relative" role="alert">
                            <strong className="font-bold">Warning! </strong>
                            <span className="block sm:inline">Could not load full details: {detailsError}. Basic info will be used.</span>
                        </div>
                    )}
                     {!detailsLoading && (
                        <div className="space-y-4">
                             {/* Image Gallery */}
                             {displayImages.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5"> {/* Negative margin trick for scroll edge */} 
                                    {displayImages.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.variants[0].url}
                                            alt={image.caption || `Activity image ${index + 1}`}
                                            className="h-48 w-auto max-w-xs object-cover rounded-lg flex-shrink-0 border border-gray-200" // Added border 
                                            onError={(e) => { e.target.style.display = 'none'; }} // Hide broken images
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Description */} 
                            {displayDescription && (
                                <div className="text-gray-700">
                                    <h3 className="text-base font-semibold mb-1">Description</h3>
                                    {/* Render HTML safely if description contains it */}
                                    <p className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: displayDescription }} />
                                </div>
                            )}

                            {/* Duration & Departure */} 
                            {(productInfo.duration || productInfo.departurePoint) && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-b border-gray-100 py-3">
                                    {productInfo.duration && (
                                        <div>
                                            <h4 className="font-semibold text-gray-600 mb-0.5">Duration</h4>
                                            <p>{productInfo.duration}</p>
                                        </div>
                                    )}
                                    {productInfo.departurePoint && (
                                        <div>
                                            <h4 className="font-semibold text-gray-600 mb-0.5">Departure Point</h4>
                                            <p>{productInfo.departurePoint}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Inclusions / Exclusions / Additional Info / Itinerary (if fetched) */} 
                            {activityDetails && productInfo && (
                                <>
                                    {productInfo.inclusions?.length > 0 && (
                                        <div>
                                            <h3 className="text-base font-semibold mb-1">Inclusions</h3>
                                            <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                                                {productInfo.inclusions.map((inc, i) => <li key={`inc-${i}`}>{inc.description || inc.otherDescription}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {/* Add similar sections for exclusions, additionalInfo, itinerary if needed */}
                                </>
                            )}

                            {/* Display Options (if available) */} 
                            {activityDetails && availableOptions.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold mb-2">Available Options</h3>
                                    <div className="space-y-3">
                                        {availableOptions.map(option => (
                                            <ActivityOptionCard
                                                key={option.ratekey || option.title} // Use title as fallback key
                                                option={option}
                                                selected={selectedOption?.ratekey === option.ratekey}
                                                onSelect={() => handleOptionSelect(option)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Summary / Fallback Info */} 
                             {selectedOption && (
                                <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                                    <h3 className="text-base font-semibold mb-2">Summary</h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        {selectedOption.title && selectedOption.title !== displayTitle && (
                                             <div className="md:col-span-2">
                                                <span className="text-gray-500">Selected Option:</span>
                                                <p className="mt-0.5 text-gray-900 font-medium">{selectedOption.title}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-500">Date:</span>
                                            <p className="mt-0.5 text-gray-900">{date}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Location:</span>
                                            <p className="mt-0.5 text-gray-900">{city}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Price:</span>
                                            <p className="mt-0.5 text-gray-900 font-medium">{formatCurrency(selectedOption.amount, selectedOption.currency)}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Travelers:</span>
                                            <p className="mt-0.5 text-gray-900">
                                                {travelersDetails?.adults || 0} Adults, {travelersDetails?.children || 0} Children
                                            </p>
                                        </div>
                                     </div>
                                </div>
                             )}

                            {/* --- Manual Time Input --- */}
                            {!detailsLoading && activityDetails && selectedOption && !selectedOption.departureTime && (
                                <div className="mt-4">
                                    <label htmlFor="manualStartTime" className="block text-sm font-medium text-gray-700 mb-1">Select Start Time</label>
                                    <input
                                        type="time"
                                        id="manualStartTime"
                                        name="manualStartTime"
                                        value={manualStartTime}
                                        onChange={(e) => setManualStartTime(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required // Make it visually required, validation is in handleConfirmAdd
                                    />
                                     <p className="mt-1 text-xs text-gray-500">Please select the desired start time for this activity.</p>
                                </div>
                            )}
                            {/* --- End Manual Time Input --- */}

                            {/* Display Determined Time Info */} 
                            {selectedOption && (selectedOption.departureTime || manualStartTime) && (
                                <div>
                                    <span className="text-gray-500">Selected Time:</span>
                                    <p className="mt-0.5 text-gray-900">{selectedOption.departureTime || manualStartTime || 'N/A'}</p>
                                </div>
                            )}
                        </div>
                     )}
                </div>

                {/* Footer */} 
                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                    {bookingStatus.message && (
                        <div className={`mb-3 p-3 rounded-md text-sm flex items-center gap-2 ${
                            bookingStatus.success
                                ? 'bg-green-50 text-green-700'
                                : bookingStatus.error
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-blue-50 text-blue-700'
                        }`}>
                            {bookingStatus.success && <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />}
                            {bookingStatus.error && <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />}
                            {!bookingStatus.success && !bookingStatus.error && bookingStatus.loading && <ArrowPathIcon className="h-5 w-5 animate-spin flex-shrink-0" />}
                            <span className="flex-grow">{bookingStatus.message}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                            disabled={bookingStatus.loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmAdd}
                            className="px-5 py-2 rounded-md text-white text-sm font-medium bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={!selectedOption || detailsLoading || bookingStatus.loading || bookingStatus.success}
                        >
                            {bookingStatus.loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                            {bookingStatus.loading ? 'Adding...' : 'Confirm Add'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmAddActivityDetailModal; 