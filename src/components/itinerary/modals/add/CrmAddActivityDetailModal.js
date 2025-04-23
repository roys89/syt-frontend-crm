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
    
    // Handle range format like "4-5 Hrs" - extract the maximum value
    const rangeMatch = durationString.match(/(\d+)\s*-\s*(\d+)\s*(hour|hr|hrs?)/i);
    if (rangeMatch && rangeMatch[2]) {
        // Use the maximum value from the range (second number)
        const maxHours = parseInt(rangeMatch[2], 10);
        return maxHours * 60; // Convert hours to minutes
    }
    
    let totalMinutes = 0;
    const hoursMatch = durationString.match(/(\d+)\s*(hour|hr|hrs?)/i);
    const minutesMatch = durationString.match(/(\d+)\s*(minute|min|mins?)/i);

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

// --- ADD categorizeTravelers Helper Function ---
const categorizeTravelers = (ages, apiAgeBands) => {
  const counts = { ADULT: 0, CHILD: 0, INFANT: 0, SENIOR: 0, YOUTH: 0 };
  const defaultBand = 'ADULT';
  const validAgeBands = Array.isArray(apiAgeBands) ? apiAgeBands : [];

  if (validAgeBands.length === 0) {
    console.warn('categorizeTravelers (Add Modal): No valid ageBands provided, using default counts.');
    counts[defaultBand] = ages.length;
  } else {
    ages.forEach(age => {
      let matched = false;
      for (const band of validAgeBands) {
        if (band && typeof band.startAge === 'number' && typeof band.endAge === 'number' && band.ageBand &&
            age >= band.startAge && age <= band.endAge) {
          if (counts.hasOwnProperty(band.ageBand)) {
            counts[band.ageBand]++;
            matched = true;
            break;
          } else {
            console.warn(`categorizeTravelers (Add Modal): Unknown ageBand type '${band.ageBand}' found.`);
          }
        }
      }
      if (!matched) {
        counts[defaultBand]++;
        console.warn(`categorizeTravelers (Add Modal): Age ${age} did not fit any defined band, assigned to ${defaultBand}.`);
      }
    });
  }

  const groupCodeString = `${counts.ADULT}|${counts.CHILD}|${counts.INFANT}|${counts.SENIOR}|${counts.YOUTH}`;

  return {
    groupCode: groupCodeString // Only need the string for modifiedGroupCode construction
  };
};
// --- END categorizeTravelers ---

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
    // --- State Refactoring ---
    const [productInfoLoading, setProductInfoLoading] = useState(false);
    const [productInfoError, setProductInfoError] = useState(null);
    const [productInfo, setProductInfo] = useState(null); // Stores response from /product-info

    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [availabilityDetails, setAvailabilityDetails] = useState([]); // Stores packages from /availability-detail

    const [selectedPackage, setSelectedPackage] = useState(null); // User's chosen package from availabilityDetails

    // State for traveler inputs
    const [numberOfTravelers, setNumberOfTravelers] = useState(1); // Default or derive from travelersDetails
    const [travelerAges, setTravelerAges] = useState([{ age: '' }]);

    const [manualStartTime, setManualStartTime] = useState('');

    const [bookingStatus, setBookingStatus] = useState({ // For the final add action
        loading: false,
        error: null,
        success: false,
        message: ''
    });
    // --- End State Refactoring ---

    // --- Initialize Traveler Count/Ages from props ---
    useEffect(() => {
        if (isOpen && travelersDetails) {
            let initialCount = 0;
            const initialAges = [];
            if (travelersDetails.rooms && travelersDetails.rooms.length > 0) {
                travelersDetails.rooms.forEach(room => {
                    if (Array.isArray(room.adults)) {
                        initialCount += room.adults.length;
                        room.adults.forEach(() => initialAges.push({ age: '' })); // Placeholder age for adults
                    }
                    if (Array.isArray(room.children)) {
                        initialCount += room.children.length;
                        room.children.forEach(age => initialAges.push({ age: age ? String(age) : '' })); // Use provided child age or empty string
                    }
                });
            }
            // Fallback if rooms structure is missing/empty but we have counts
            else if (travelersDetails.adults || travelersDetails.children) {
                 initialCount = (travelersDetails.adults || 0) + (travelersDetails.children || 0);
                 for(let i=0; i < (travelersDetails.adults || 0); i++) initialAges.push({ age: ''}); // Adults placeholders
                 // No direct ages available in this structure, use placeholders for children too
                 for(let i=0; i < (travelersDetails.children || 0); i++) initialAges.push({ age: ''});
            }

            if (initialCount < 1) initialCount = 1; // Ensure at least 1 traveler
            if (initialAges.length === 0) initialAges.push({ age: '' }); // Ensure at least one age input

            setNumberOfTravelers(initialCount);
            setTravelerAges(initialAges.slice(0, initialCount)); // Ensure ages array matches count
        }
    }, [isOpen, travelersDetails]);
    // --- End Traveler Init ---

    // --- Fetch Product Info Only ---
    const fetchProductInfoOnly = useCallback(async () => {
        if (!selectedActivity?.code || !searchId || !inquiryToken || !city || !date || !travelersDetails) {
             console.error("Add Modal: Missing data for fetching product info:", { selectedActivity, searchId, inquiryToken, city, date, travelersDetails });
             setProductInfoError("Internal error: Missing required data to fetch product info.");
             return;
        }

        setProductInfoLoading(true);
        setProductInfoError(null);
        setProductInfo(null); // Clear previous info
        setAvailabilityDetails([]); // Clear old packages
        setSelectedPackage(null); // Reset selection
        setAvailabilityError(null); // Clear package errors
        setBookingStatus({ loading: false, error: null, success: false, message: '' }); // Reset final status

        try {
            console.log(`Add Modal: Fetching product info for activity code: ${selectedActivity.code} using searchId: ${searchId}`);
            // Use the /product-info endpoint
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
                        // Pass necessary context for the backend service call
                        city: { name: city }, // Assuming backend controller expects city.name
                        date: date,
                        searchId: searchId,
                        groupCode: selectedActivity.groupCode // Use groupCode from initial search
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activity product info (${response.status})`);
            }

            const data = await response.json();
            console.log("Add Modal: Fetched activity product info:", data);

            // REMOVE: The check for modifiedGroupCode is no longer valid here
            // Check if essential data like modifiedGroupCode is present in the flat structure
            if (!data || !data.title || !data.productCode) { 
                throw new Error("Invalid response structure received for product info (missing title or productCode).");
            }
            setProductInfo(data); 

        } catch (err) {
            console.error("Add Modal: Error fetching product info:", err);
            setProductInfoError(err.message);
        } finally {
            setProductInfoLoading(false);
        }
    }, [selectedActivity, searchId, inquiryToken, city, date, travelersDetails]);
    // --- End Fetch Product Info ---

    // Trigger fetch when modal opens
    useEffect(() => {
        if (isOpen && selectedActivity) {
            fetchProductInfoOnly();
        }
         // Cleanup on close
        if (!isOpen) {
            setProductInfo(null);
            setAvailabilityDetails([]);
            setSelectedPackage(null);
            setProductInfoError(null);
            setAvailabilityError(null);
            setManualStartTime('');
            setTravelerAges([{ age: '' }]); // Reset ages
            setNumberOfTravelers(1);
            setBookingStatus({ loading: false, error: null, success: false, message: '' });
        }
    }, [isOpen, selectedActivity, fetchProductInfoOnly]);

    // --- Traveler Input Handlers ---
    const handleTravelerCountChange = (newCount) => {
        if (newCount >= 1 && newCount <= (productInfo?.bookingRequirements?.maxTravelersPerBooking || 15)) { // Use max from productInfo if available
          setNumberOfTravelers(newCount);
          const newAges = Array(newCount).fill().map((_, index) =>
            travelerAges[index] || { age: '' }
          );
          setTravelerAges(newAges);
           setAvailabilityDetails([]); // Reset packages if travelers change
           setSelectedPackage(null);
           setAvailabilityError(null);
        } else if (newCount > (productInfo?.bookingRequirements?.maxTravelersPerBooking || 15)) {
            toast.warn(`Maximum ${productInfo?.bookingRequirements?.maxTravelersPerBooking || 15} travelers allowed.`);
        }
    };

    const handleAgeChange = (index, value) => {
        const newAges = [...travelerAges];
        newAges[index] = { age: value };
        setTravelerAges(newAges);
         setAvailabilityDetails([]); // Reset packages if ages change
         setSelectedPackage(null);
         setAvailabilityError(null);
    };
    // --- End Traveler Input Handlers ---

    // --- Fetch Availability Details (Packages) ---
    const fetchAvailabilityDetails = async () => {
        // Validation
        if (!productInfo) { // Basic check if initial product info is loaded
            setAvailabilityError("Product info not loaded yet.");
            return;
        }
        if (travelerAges.some(t => !t.age || isNaN(parseInt(t.age)))) {
             setAvailabilityError("Please enter a valid age for all travelers.");
             return;
        }
        // Age band validation (remains the same)
        const ages = travelerAges.map(t => parseInt(t.age));
        const ageBands = productInfo.ageBands || [];
        let validAges = true;
        ages.forEach(age => {
            const band = ageBands.find(b => age >= b.startAge && age <= b.endAge);
            if (!band) {
                validAges = false;
            }
        });
        if (!validAges) {
             setAvailabilityError("One or more traveler ages do not fit the allowed age bands for this activity.");
             return; // Block the call if ages are invalid based on bands
        }

        setAvailabilityLoading(true);
        setAvailabilityError(null);
        setAvailabilityDetails([]); // Clear previous results
        setSelectedPackage(null); // Reset selection

        try {
            // --- Calculate modifiedGroupCode --- 
            const baseGroupCode = selectedActivity?.groupCode?.split('-')[0];
            if (!baseGroupCode) {
                throw new Error("Could not determine base group code from selected activity.");
            }
            const currentAges = travelerAges.map(t => parseInt(t.age));
            const { groupCode: ageDistribution } = categorizeTravelers(currentAges, productInfo.ageBands);
            const calculatedModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
            console.log(`Add Modal: Calculated modifiedGroupCode: ${calculatedModifiedGroupCode}`);
            // --- End Calculation --- 

            // --- Fetch Availability Details using calculated modifiedGroupCode --- 
            console.log(`Add Modal: Fetching availability details using searchId ${searchId} and calculated modifiedGroupCode ${calculatedModifiedGroupCode}`);
            const availabilityResponse = await fetch(
                `http://localhost:5000/api/itinerary/availability-detail/${selectedActivity.code}`, // activityCode in URL
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                    },
                    body: JSON.stringify({
                        searchId: searchId,
                        modifiedGroupCode: calculatedModifiedGroupCode, // ADD: Send calculated code
                        city: { name: city },
                        date: date,
                    })
                }
            );

            if (!availabilityResponse.ok) {
                const errorData = await availabilityResponse.json().catch(() => ({ message: availabilityResponse.statusText }));
                throw new Error(errorData.message || `Failed to fetch availability details (${availabilityResponse.status})`);
            }

            const data = await availabilityResponse.json(); // Expecting the array of options directly
            console.log("Add Modal: Fetched availability details (packages):", data);
            // --- End Step 2 (Now only step) ---

            if (!Array.isArray(data)) {
                 throw new Error("Invalid response structure received for availability details.");
            }

            if (data.length === 0) {
                setAvailabilityError("No packages found for the selected criteria and traveler ages.");
            } else {
                setAvailabilityDetails(data);
                 // Optionally auto-select the first package
                 handlePackageSelect(data[0]);
            }

        } catch (err) {
            console.error("Add Modal: Error fetching availability details:", err);
            setAvailabilityError(err.message);
        } finally {
            setAvailabilityLoading(false);
        }
    };
    // --- End Fetch Availability Details ---

    // --- Handle Package Selection ---
    const handlePackageSelect = (pkg) => {
        if (pkg && typeof pkg === 'object') { // Basic validation
            console.log("Add Modal: Selecting package:", pkg);
            setSelectedPackage(pkg);
        } else {
             console.warn("Add Modal: Attempted to select invalid package:", pkg);
        }
    };
    // --- End Package Selection ---

    // --- Handle final Add Confirmation ---
    const handleConfirmAdd = async () => {
        // **Updated Validation**
        if (!selectedPackage) { // Check if a package is selected
            toast.error("Please select an available package first.");
            return;
        }
        if (!productInfo) {
            toast.error("Activity product details are missing. Cannot add.");
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
            // Use departure time from the SELECTED PACKAGE
            const hasDepartureTime = selectedPackage.departureTime && validateAndNormalizeTime(selectedPackage.departureTime);

            if (hasDepartureTime) {
                finalStartTime = selectedPackage.departureTime;
                console.log(`Add Modal: Using package departure time: ${finalStartTime}`);
            } else {
                finalStartTime = validateAndNormalizeTime(manualStartTime);
                console.log(`Add Modal: Using manual start time: ${finalStartTime}`);
                if (!finalStartTime) {
                     setBookingStatus({ loading: false, success: false, error: true, message: 'Please enter a valid start time (HH:MM).' });
                     return;
                }
            }

            // --- Parse Duration from Product Info ---
            const durationInMinutes = parseDurationToMinutes(productInfo.duration); // Use productInfo
            console.log(`Add Modal: Parsed duration '${productInfo.duration}' to ${durationInMinutes} minutes.`);
            if (durationInMinutes === null) {
                console.error("Add Modal: Could not parse duration from product info.");
                setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine activity duration.' });
                return;
            }

            // --- Calculate End Time & Time Slot ---
            const finalEndTime = calculateEndTime(finalStartTime, durationInMinutes);
            const finalTimeSlot = getTimeSlot(finalStartTime);
            console.log(`Add Modal: Calculated End Time: ${finalEndTime}, Time Slot: ${finalTimeSlot}`);

            // --- Recalculate modifiedGroupCode for the final payload ---
            const baseGroupCode = selectedActivity?.groupCode?.split('-')[0];
            if (!baseGroupCode) {
                setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine base group code.'});
                return;
            }
            const currentAges = travelerAges.map(t => parseInt(t.age));
            const { groupCode: ageDistribution } = categorizeTravelers(currentAges, productInfo.ageBands);
            const finalModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
            console.log(`Add Modal: Final modifiedGroupCode for add request: ${finalModifiedGroupCode}`);
            // --- End Recalculation ---

            // Construct the newActivityDetails payload using ProductInfo and SelectedPackage
            const newActivityDetailsPayload = {
                searchId: searchId,
                activityType: productInfo.activityType || 'online',
                activityCode: selectedActivity.code,
                activityName: selectedPackage.title || productInfo.title || selectedActivity.title, // Prefer package title
                activityProvider: 'GRNC',
                selectedTime: finalStartTime,
                endTime: finalEndTime,
                timeSlot: finalTimeSlot,
                isFlexibleTiming: !hasDepartureTime,
                bookingStatus: 'pending',
                departureTime: {
                    time: finalStartTime,
                    code: selectedPackage.code // Use Tour Grade Code from the selected package
                },
                packageDetails: { // Use details from the selected package
                    amount: selectedPackage.amount,
                    currency: selectedPackage.currency,
                    ratekey: selectedPackage.ratekey,
                    title: selectedPackage.title,
                    departureTime: selectedPackage.departureTime, // Optional departure time from package
                    description: selectedPackage.description // Optional description from package
                },
                // General info primarily from productInfo
                images: productInfo.images || (selectedActivity.imgURL ? [{variants:[{url: selectedActivity.imgURL}]}] : []),
                description: productInfo.description || selectedActivity.description || '',
                groupCode: finalModifiedGroupCode, // Use the code calculated based on current traveler ages
                duration: durationInMinutes,
                departurePoint: productInfo.departurePoint || null,
                inclusions: productInfo.inclusions || [],
                exclusions: productInfo.exclusions || [],
                additionalInfo: productInfo.additionalInfo || [],
                itinerary: productInfo.itinerary || null,
                bookingRequirements: productInfo.bookingRequirements || null,
                pickupHotellist: productInfo.PickupHotellist || null, // Note casing diff
                bookingQuestions: productInfo.bookingQuestions || [],
                cancellationFromTourDate: productInfo.cancellationFromTourDate || [],
                ageBands: productInfo.ageBands || [],
            };

            // --- Format currentTravelersDetails for the final add request ---
             const adultThreshold = productInfo.ageBands?.find(b => b.ageBand === 'ADULT')?.startAge || 12;
             const finalTravelersDetails = { 
                 rooms: [{ 
                     adults: travelerAges.filter(t => parseInt(t.age) >= adultThreshold).map(t => parseInt(t.age)), 
                     children: travelerAges.filter(t => parseInt(t.age) < adultThreshold).map(t => parseInt(t.age))
                 }]
             };
             console.log("Add Modal: Final Travelers Details for add request:", finalTravelersDetails);
             // --- End Formatting ---

            const requestBody = {
                cityName: city,
                date: date,
                newActivityDetails: newActivityDetailsPayload,
                searchId: searchId,
                
            };

            console.log("Add Modal: Submitting POST /activity request:", JSON.stringify(requestBody, null, 2));

            // Call the existing POST /activity endpoint
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
                let errorMessage = `Failed to add activity (${response.status})`;
                if (responseData && responseData.message) errorMessage = responseData.message;
                else if (responseData && responseData.error) errorMessage = responseData.error;
                throw new Error(errorMessage);
            }

            setBookingStatus({ loading: false, success: true, error: null, message: 'Activity added successfully!' });
            setTimeout(() => { if (onActivityAdded) onActivityAdded(); }, 1500);

        } catch (err) {
            console.error("Add Modal: Error confirming activity add:", err);
            setBookingStatus({ loading: false, success: false, error: true, message: err.message || "An unknown error occurred." });
        }
    };
    // --- End Handlers ---

    if (!isOpen || !selectedActivity) return null;

    // Derived Display Values (use productInfo primarily now)
    const displayTitle = productInfo?.title || selectedActivity?.title || 'Activity Details';
    const displayImages = productInfo?.images && productInfo.images.length > 0
        ? productInfo.images
        : (selectedActivity.imgURL ? [{ variants: [{ url: selectedActivity.imgURL }], caption: 'Activity Image' }] : []);
    const displayDescription = productInfo?.description || selectedActivity?.description || '';
    const ageBands = productInfo?.ageBands || [];
    const bookingRequirements = productInfo?.bookingRequirements || {};

    // Updated check: Only depends on valid ages now
    const canGetPackages = !travelerAges.some(t => !t.age || isNaN(parseInt(t.age)));

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
                        disabled={productInfoLoading || availabilityLoading || bookingStatus.loading} // Disable if any loading
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5 space-y-6">
                    {productInfoLoading && (
                        <div className="text-center p-10">
                            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading activity details...</p>
                        </div>
                    )}
                     {productInfoError && !productInfoLoading && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">Could not load activity details: {productInfoError}</span>
                        </div>
                    )}
                     {!productInfoLoading && productInfo && (
                        <>
                             {/* --- Images, Description, Duration etc. from productInfo --- */}
                             {displayImages.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
                                    {displayImages.map((image, index) => ( <img key={index} src={image.variants[0].url} alt={image.caption || `Activity image ${index + 1}`} className="h-48 w-auto max-w-xs object-cover rounded-lg flex-shrink-0 border border-gray-200" onError={(e) => { e.target.style.display = 'none'; }} /> ))}
                                </div>
                             )}
                             {displayDescription && ( <div className="text-gray-700"> <h3 className="text-base font-semibold mb-1">Description</h3> <p className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: displayDescription }} /> </div> )}
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
                             {productInfo.inclusions?.length > 0 && (
                                <div>
                                    <h3 className="text-base font-semibold mb-1">Inclusions</h3>
                                    <ul className="list-disc list-inside text-sm space-y-0.5 text-gray-600">
                                        {productInfo.inclusions.map((inc, i) => <li key={`inc-${i}`}>{inc.description || inc.otherDescription}</li>)}
                                    </ul>
                                </div>
                             )}
                             {/* ... Exclusions, Additional Info etc. ... */}
                             {/* --- End Product Info Display --- */}


                             {/* --- Traveler Inputs & Tour Grade --- */}
                             <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-4">
                                 {/* Row 1: Heading and Traveler Count */} 
                                 <div className="flex justify-between items-center mb-3">
                                     <h3 className="text-base font-semibold text-gray-800">Configure Travelers & Options</h3>
                                     {/* Traveler Count Controls */} 
                                     <div className="flex items-center gap-2">
                                         <span className="text-sm font-medium text-gray-700 hidden sm:inline">Travelers:</span>
                                         <button 
                                            onClick={() => handleTravelerCountChange(numberOfTravelers - 1)} 
                                            className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                            disabled={numberOfTravelers <= 1}
                                         >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
                                        </button>
                                         <span className="font-medium text-gray-900 text-lg w-8 text-center">{numberOfTravelers}</span>
                                         <button 
                                            onClick={() => handleTravelerCountChange(numberOfTravelers + 1)} 
                                            className="p-1.5 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                                            disabled={numberOfTravelers >= (productInfo?.bookingRequirements?.maxTravelersPerBooking || 15)}
                                         >
                                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
                                         </button>
                                     </div>
                                 </div>

                                {/* Row 2: Traveler Ages Grid */} 
                                {numberOfTravelers > 0 && (
                                     <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">Traveler Ages</label>
                                         {/* Grid for Age Inputs - Reworked Styling */}
                                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                             {travelerAges.map((traveler, index) => (
                                                 // --- Input directly in the grid cell --- 
                                                 <div key={index}> {/* Simple div container for key */}
                                                     <input 
                                                        type="number" 
                                                        min="0" 
                                                        max="120" 
                                                        value={traveler.age} 
                                                        onChange={(e) => handleAgeChange(index, e.target.value)} 
                                                        // --- Apply modern styling directly to input --- 
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out" 
                                                        placeholder={`Age (Traveler ${index + 1})`} 
                                                     />
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                )}

                                {/* Row 3: Age Bands and Get Packages Button */} 
                                <div className="flex flex-col sm:flex-row justify-between items-center pt-3 gap-3">
                                    {/* Display Age Bands Info */}
                                     <div className="text-xs text-gray-500 flex-shrink-0 pr-4 text-left w-full sm:w-auto">
                                        {ageBands.length > 0 ? (
                                           <> 
                                            <strong>Age Bands:</strong> {ageBands.map(b => `${b.ageBand} (${b.startAge}-${b.endAge})`).join(', ')}
                                           </>
                                        ) : ( 
                                            <span>Age band info not available.</span> 
                                        )}
                                    </div>
                                    {/* "Get Packages" Button */} 
                                    <div className="w-full sm:w-auto flex-shrink-0">
                                        <button
                                            onClick={fetchAvailabilityDetails}
                                            disabled={!canGetPackages || availabilityLoading}
                                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                                        >
                                            {availabilityLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                                            {availabilityLoading ? 'Loading Packages...' : 'Get Available Packages'}
                                        </button>
                                        {availabilityError && <p className="text-red-600 text-xs mt-1 sm:text-right">{availabilityError}</p>}
                                    </div>
                                </div>
                             </div>
                             {/* --- End Traveler & Tour Grade --- */}


                             {/* --- Display Available Packages --- */}
                             {!availabilityLoading && availabilityDetails.length > 0 && (
                                 <div className="mt-4">
                                     <h3 className="text-base font-semibold mb-2">Available Packages</h3>
                                     <div className="space-y-3">
                                         {availabilityDetails.map(pkg => (
                                             <ActivityOptionCard
                                                 key={pkg.ratekey || pkg.title}
                                                 option={pkg} // Pass the package object as option
                                                 selected={selectedPackage?.ratekey === pkg.ratekey}
                                                 onSelect={() => handlePackageSelect(pkg)}
                                             />
                                         ))}
                                     </div>
                                 </div>
                             )}
                            {/* --- End Packages --- */}

                             {/* --- Manual Time Input (Conditional) --- */}
                             {selectedPackage && !selectedPackage.departureTime && (
                                 <div className="mt-4">
                                     <label htmlFor="manualStartTime" className="block text-sm font-medium text-gray-700 mb-1">Select Start Time</label>
                                     <input type="time" id="manualStartTime" name="manualStartTime" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                                     <p className="mt-1 text-xs text-gray-500">This package has flexible timing. Please select a start time.</p>
                                 </div>
                             )}
                             {/* --- End Manual Time --- */}

                             {/* --- Selected Package Summary (optional) --- */}
                              {selectedPackage && (
                                <div className="mt-4 p-3 bg-green-50 rounded border border-green-200 text-sm">
                                    <h4 className="font-semibold text-green-800 mb-1">Selected Package: {selectedPackage.title}</h4>
                                    <p>Price: {formatCurrency(selectedPackage.amount, selectedPackage.currency)}</p>
                                    <p>Time: {selectedPackage.departureTime || (manualStartTime ? `${manualStartTime} (Manual)` : 'Requires manual time selection')}</p>
                                    {/* Add other relevant summary details */}
                                </div>
                              )}
                             {/* --- End Summary --- */}
                        </>
                     )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                     {/* Booking Status Message */}
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
                     {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium" disabled={bookingStatus.loading || productInfoLoading || availabilityLoading}>Cancel</button>
                        <button
                            onClick={handleConfirmAdd}
                            className="px-5 py-2 rounded-md text-white text-sm font-medium bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={!selectedPackage || productInfoLoading || availabilityLoading || bookingStatus.loading || bookingStatus.success || (!selectedPackage.departureTime && !validateAndNormalizeTime(manualStartTime))} // More robust disabling
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