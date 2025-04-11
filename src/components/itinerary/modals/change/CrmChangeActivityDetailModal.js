import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/solid';
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
    return (
        <div
            onClick={onSelect}
            className={`p-3 border rounded-lg cursor-pointer transition-all duration-150 
                ${selected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'}
            `}
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex-grow">
                    <p className="font-medium text-gray-800 text-sm">{option.title || 'Option Title N/A'}</p>
                    {option.description && (
                         <p className="text-xs text-gray-500 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: option.description }} />
                    )}
                    {option.departureTime && (
                        <p className="text-xs text-indigo-600 mt-1">Departure: {option.departureTime}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-base text-blue-600">
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
    if (totalMinutes === 0 && /^\d+$/.test(durationString.trim())) {
        totalMinutes = parseInt(durationString.trim(), 10);
    }

    // Allow 0 minutes, return null only if parsing failed or resulted in negative
    return totalMinutes >= 0 ? totalMinutes : null; 
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

  if (endHours >= 20 && totalStartMinutes < (20*60)) { // Only clamp if it *crosses* 20:00
      return '20:00';
  }

  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

// --- ADD categorizeTravelers Helper Function ---
const categorizeTravelers = (travelerAgesObject, apiAgeBands) => {
  // Convert travelersDetails format to simple age array
  const ages = [];
  if (travelerAgesObject?.rooms?.[0]?.adults) {
    // Need a representative age for adults based on bands
    const adultBand = apiAgeBands?.find(b => b.ageBand === 'ADULT');
    const representativeAdultAge = adultBand ? adultBand.startAge : 30; // Default 30 if no ADULT band
    ages.push(...Array(travelerAgesObject.rooms[0].adults.length).fill(representativeAdultAge));
  }
  if (travelerAgesObject?.rooms?.[0]?.children) {
    ages.push(...travelerAgesObject.rooms[0].children.map(age => parseInt(age)));
  }
  // TODO: Add logic if travelersDetails uses other formats (infants, seniors, youth)

  const counts = { ADULT: 0, CHILD: 0, INFANT: 0, SENIOR: 0, YOUTH: 0 };
  const defaultBand = 'ADULT';
  const validAgeBands = Array.isArray(apiAgeBands) ? apiAgeBands : [];

  if (validAgeBands.length === 0) {
    console.warn('categorizeTravelers (Change Modal): No valid ageBands provided, using default counts.');
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
            console.warn(`categorizeTravelers (Change Modal): Unknown ageBand type '${band.ageBand}' found.`);
          }
        }
      }
      if (!matched) {
        counts[defaultBand]++;
        console.warn(`categorizeTravelers (Change Modal): Age ${age} did not fit any defined band, assigned to ${defaultBand}.`);
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

const CrmChangeActivityDetailModal = ({
    isOpen,
    onClose,
    selectedActivity,
    itineraryToken,
    inquiryToken,
    searchId,
    travelersDetails, 
    city, 
    date, 
    oldActivityCode,
    existingPrice,
    onActivityChanged
}) => {
    // State Refactoring
    const [productInfoLoading, setProductInfoLoading] = useState(false);
    const [productInfoError, setProductInfoError] = useState(null);
    const [productInfoData, setProductInfoData] = useState(null); // Holds response from /product-info

    const [availabilityLoading, setAvailabilityLoading] = useState(false);
    const [availabilityError, setAvailabilityError] = useState(null);
    const [availableOptions, setAvailableOptions] = useState([]); // Holds response from /availability-detail
    
    const [selectedOption, setSelectedOption] = useState(null); 
    const [priceComparison, setPriceComparison] = useState(null); 
    const [manualStartTime, setManualStartTime] = useState('');
    const [bookingStatus, setBookingStatus] = useState({
        loading: false,
        error: null,
        success: false,
        message: ''
    });

    // --- Fetch Product Info Only --- 
    const fetchProductInfo = useCallback(async () => {
        if (!selectedActivity?.code || !searchId || !inquiryToken || !city || !date ) { // Removed travelersDetails check
             console.error("Change Modal: Missing data for fetching product info:", { 
                 selectedActivity, searchId, inquiryToken, city, date 
             });
             setProductInfoError("Internal error: Missing required data to fetch product info.");
             return;
        }

        setProductInfoLoading(true);
        setProductInfoError(null);
        setProductInfoData(null); // Clear previous info
        setAvailableOptions([]); // Clear old options
        setSelectedOption(null); 
        setAvailabilityError(null);
        setPriceComparison(null); 
        setBookingStatus({ loading: false, error: null, success: false, message: '' });

        try {
            console.log(`Change Modal: Fetching product info for activity code: ${selectedActivity.code}`);
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
                        // travelersDetails: travelersDetails, // REMOVED
                        searchId: searchId,
                        // groupCode: selectedActivity.groupCode // REMOVED - Not needed for initial product info
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activity product info (${response.status})`);
            }

            const data = await response.json();
            console.log("Change Modal: Fetched activity product info:", data);
            
            // Basic validation of product info structure
            if (!data || !data.title || !data.productCode) { 
                 throw new Error("Invalid product info structure received (missing title or productCode).");
            }
            setProductInfoData(data);
            // --- Trigger availability fetch on success ---
            fetchAvailabilityDetails(data); // Pass fetched data directly
            // -------------------------------------------

        } catch (err) {
            console.error("Change Modal: Error fetching product info:", err);
            setProductInfoError(err.message);
        } finally {
            setProductInfoLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedActivity, searchId, inquiryToken, city, date]); // travelersDetails removed from dependencies

    // --- ADD fetchAvailabilityDetails --- 
    const fetchAvailabilityDetails = useCallback(async (fetchedProductInfo) => {
        if (!fetchedProductInfo || !travelersDetails || !selectedActivity?.groupCode || !searchId || !city || !date) {
             console.error("Change Modal: Missing data for fetching availability details:", {
                 fetchedProductInfo, travelersDetails, selectedActivity, searchId, city, date
             });
             setAvailabilityError("Internal error: Cannot fetch options.");
             return;
        }

        setAvailabilityLoading(true);
        setAvailabilityError(null);
        setAvailableOptions([]); // Clear previous results
        setSelectedOption(null); // Reset selection

        try {
            // --- Calculate modifiedGroupCode --- 
            const baseGroupCode = selectedActivity.groupCode.split('-')[0];
            if (!baseGroupCode) {
                throw new Error("Could not determine base group code from selected activity.");
            }
             // Use the travelersDetails prop here
            const { groupCode: ageDistribution } = categorizeTravelers(travelersDetails, fetchedProductInfo.ageBands);
            const calculatedModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
            console.log(`Change Modal: Calculated modifiedGroupCode for availability: ${calculatedModifiedGroupCode}`);
            // --- End Calculation --- 

            // --- Fetch Availability Details using calculated modifiedGroupCode --- 
            console.log(`Change Modal: Fetching availability details using searchId ${searchId} and modifiedGroupCode ${calculatedModifiedGroupCode}`);
            const availabilityResponse = await fetch(
                `http://localhost:5000/api/itinerary/availability-detail/${selectedActivity.code}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                    },
                    body: JSON.stringify({
                        searchId: searchId,
                        modifiedGroupCode: calculatedModifiedGroupCode, // Send calculated code
                        city: { name: city },
                        date: date,
                    })
                }
            );

            if (!availabilityResponse.ok) {
                const errorData = await availabilityResponse.json().catch(() => ({ message: availabilityResponse.statusText }));
                throw new Error(errorData.message || `Failed to fetch availability details (${availabilityResponse.status})`);
            }

            const data = await availabilityResponse.json(); 
            console.log("Change Modal: Fetched availability details (options):", data);

            if (!Array.isArray(data)) {
                 throw new Error("Invalid response structure received for availability details.");
            }

            if (data.length === 0) {
                setAvailabilityError("No options found for the current travelers and selected activity.");
            } else {
                setAvailableOptions(data);
                // Optionally auto-select first option? Maybe not for 'change' flow.
            }

        } catch (err) {
            console.error("Change Modal: Error fetching availability details:", err);
            setAvailabilityError(err.message);
        } finally {
            setAvailabilityLoading(false);
        }
    }, [selectedActivity, searchId, inquiryToken, city, date, travelersDetails]); // Added travelersDetails dependency
    // --- END fetchAvailabilityDetails --- 

    useEffect(() => {
        if (isOpen && selectedActivity) {
            fetchProductInfo(); // Trigger the product info fetch first
        }
        // Cleanup on close
        if (!isOpen) {
            setProductInfoData(null);
            setAvailableOptions([]);
            setSelectedOption(null);
            setProductInfoError(null);
            setAvailabilityError(null);
            setProductInfoLoading(false);
            setAvailabilityLoading(false);
            setManualStartTime(''); 
            setPriceComparison(null);
            setBookingStatus({ loading: false, error: null, success: false, message: '' });
        }
    }, [isOpen, selectedActivity, fetchProductInfo]); // fetchProductInfo is stable due to useCallback

    // --- Handle option selection and price comparison --- 
    const handleOptionSelect = (option) => {
        setSelectedOption(option);
        
        // Calculate price comparison against the OLD activity price
        const newPrice = option.amount;
        const priceDifference = newPrice - (existingPrice || 0);
        setPriceComparison({
            existingPrice: existingPrice || 0,
            newPrice,
            priceDifference,
            currency: option.currency || 'INR' // Use currency from the selected option
        });
    };

    // --- Handle final confirmation --- 
    const handleConfirmChange = async () => {
        if (!selectedOption || !productInfoData) {
            toast.error("Please select an activity option first.");
            return;
        }
        if (!itineraryToken || !oldActivityCode || !city || !date || !inquiryToken || !travelersDetails) {
             toast.error("Cannot confirm change: Missing essential itinerary context.");
             console.error("Change Modal: Missing context for POST request:", { itineraryToken, oldActivityCode, city, date, inquiryToken, travelersDetails });
             return;
        }

        setBookingStatus({ loading: true, error: null, success: false, message: 'Updating itinerary...' });

        try {
            // --- Determine Start Time --- 
            let finalStartTime = null;
            const hasDepartureTime = selectedOption.departureTime && validateAndNormalizeTime(selectedOption.departureTime);

            if (hasDepartureTime) {
                finalStartTime = selectedOption.departureTime;
                console.log(`Change Modal: Using provided departure time: ${finalStartTime}`);
            } else {
                finalStartTime = validateAndNormalizeTime(manualStartTime);
                console.log(`Change Modal: Using manual start time: ${finalStartTime}`);
                if (!finalStartTime) {
                     setBookingStatus({ loading: false, success: false, error: true, message: 'Please enter a valid start time (HH:MM).' });
                     return; // Stop if manual time is invalid
                }
            }

            // --- Parse Duration to Minutes --- 
            const durationInMinutes = parseDurationToMinutes(productInfoData?.duration);
            console.log(`Change Modal: Parsed duration '${productInfoData?.duration}' to ${durationInMinutes} minutes.`);
             if (durationInMinutes === null) {
                console.error("Change Modal: Could not parse duration from product info.");
                setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine activity duration.' });
                return;
            }

            // --- Calculate End Time & Time Slot ---
            const finalEndTime = calculateEndTime(finalStartTime, durationInMinutes);
            const finalTimeSlot = getTimeSlot(finalStartTime);
            console.log(`Change Modal: Calculated End Time: ${finalEndTime}, Time Slot: ${finalTimeSlot}`);

            // --- Recalculate modifiedGroupCode for the final payload ---
            const baseGroupCode = selectedActivity?.groupCode?.split('-')[0];
            if (!baseGroupCode) {
                setBookingStatus({ loading: false, success: false, error: true, message: 'Could not determine base group code.'});
                return;
            }
            // Use the travelersDetails prop here for calculation
            const { groupCode: ageDistribution } = categorizeTravelers(travelersDetails, productInfoData.ageBands);
            const finalModifiedGroupCode = `${baseGroupCode}-${ageDistribution}`;
            console.log(`Change Modal: Final modifiedGroupCode for change request: ${finalModifiedGroupCode}`);
            // --- End Recalculation ---

            // Construct the newActivityDetails payload matching CrmAddActivityDetailModal
            const newActivityDetailsPayload = {
                searchId: searchId, 
                activityType: productInfoData.activityType || 'online', // Use fetched type 
                activityCode: selectedActivity.code,
                activityName: selectedOption.title || selectedActivity.title, 
                activityProvider: 'GRNC',
                selectedTime: finalStartTime, 
                endTime: finalEndTime, 
                timeSlot: finalTimeSlot, 
                isFlexibleTiming: !hasDepartureTime, 
                bookingStatus: 'pending', 
                departureTime: { 
                    time: finalStartTime,
                    code: selectedOption.code // Use Tour Grade Code from the selected package
                },
                packageDetails: { 
                    amount: selectedOption.amount,
                    currency: selectedOption.currency, 
                    ratekey: selectedOption.ratekey,
                    title: selectedOption.title,
                    departureTime: selectedOption.departureTime, 
                    description: selectedOption.description
                },
                // Use data from productInfoData (the actual product info)
                images: productInfoData.images || (selectedActivity.imgURL ? [{variants:[{url: selectedActivity.imgURL}]}] : []),
                description: productInfoData.description || selectedActivity.description || '',
                groupCode: finalModifiedGroupCode, // Use the code calculated based on travelersDetails prop
                duration: durationInMinutes, 
                departurePoint: productInfoData.departurePoint || null,
                inclusions: productInfoData.inclusions || [],
                exclusions: productInfoData.exclusions || [],
                additionalInfo: productInfoData.additionalInfo || [],
                itinerary: productInfoData.itinerary || null,
                bookingRequirements: productInfoData.bookingRequirements || null,
                pickupHotellist: productInfoData.PickupHotellist || null, // Note casing 
                bookingQuestions: productInfoData.bookingQuestions || [],
                cancellationFromTourDate: productInfoData.cancellationFromTourDate || [],
                // tourGrade: productInfoData.tourGrades?.[0] || null, // Find based on selectedOption.code
                tourGrade: productInfoData.tourGrades?.find(tg => tg.encryptgradeCode === selectedOption.code) || null,
                ageBands: productInfoData.ageBands || [],
            };

            const requestBody = {
                cityName: city,
                date: date,
                oldActivityCode: oldActivityCode,
                newActivityDetails: newActivityDetailsPayload,
                travelersDetails: travelersDetails // Send the original travelersDetails prop for context
            };

            console.log("Change Modal: Submitting POST /activity request:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(
                `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken, // Pass inquiry token here
                    },
                    body: JSON.stringify(requestBody),
                }
            );

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `Failed to replace activity (${response.status})`);
            }

            // Success
            setBookingStatus({ loading: false, success: true, error: null, message: 'Activity changed successfully!' });
            if (onActivityChanged) {
                onActivityChanged(); // Trigger callback (which handles toast and navigation)
            }
            // Optionally close modal after a delay
            // setTimeout(onClose, 1500); 

        } catch (err) {
            console.error("Error confirming activity change:", err);
            setBookingStatus({ loading: false, success: false, error: true, message: err.message || "An unknown error occurred." });
            toast.error(`Error: ${err.message}`);
        }
    };

    if (!isOpen) return null;

    const productInfo = productInfoData || {};

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800 truncate pr-4" title={productInfo?.title || selectedActivity?.title || 'Select Option'}>
                        {productInfo?.title || selectedActivity?.title || 'Select Option'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={bookingStatus.loading}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-grow overflow-y-auto">
                    {productInfoLoading && (
                        <div className="text-center p-10">
                            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading activity details...</p>
                        </div>
                    )}

                    {productInfoError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{productInfoError}</span>
                        </div>
                    )}

                    {!productInfoLoading && !productInfoError && productInfoData && (
                        <div className="p-4 space-y-6">
                            {/* Image Gallery */}
                            {productInfoData.images && productInfoData.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {productInfoData.images.map((image, index) => (
                                        <img
                                            key={index}
                                            src={image.variants[0].url}
                                            alt={image.caption || `Activity image ${index + 1}`}
                                            className="h-48 w-72 object-cover rounded-lg flex-shrink-0"
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Description */}
                            {productInfoData.description && (
                                <div className="text-gray-700">
                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                    <p className="text-sm">{productInfoData.description}</p>
                                </div>
                            )}

                            {/* Duration & Departure */}
                            <div className="grid grid-cols-2 gap-4">
                                {productInfoData.duration && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Duration</h4>
                                        <p className="text-sm">{productInfoData.duration}</p>
                                    </div>
                                )}
                                {productInfoData.departurePoint && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Departure Point</h4>
                                        <p className="text-sm">{productInfoData.departurePoint}</p>
                                    </div>
                                )}
                            </div>

                            {/* Inclusions */}
                            {productInfoData.inclusions && productInfoData.inclusions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Inclusions</h3>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {productInfoData.inclusions.map((inclusion, index) => (
                                            <li key={index} className="text-gray-700">
                                                {inclusion.otherDescription}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Itinerary */}
                            {productInfoData.itinerary?.itineraryItems && productInfoData.itinerary.itineraryItems.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Itinerary</h3>
                                    <ul className="space-y-3 text-sm">
                                        {productInfoData.itinerary.itineraryItems.map((item, index) => (
                                            <li key={index} className="text-gray-700 border-l-2 border-blue-200 pl-3">
                                                {item.name && <strong className="block font-medium text-gray-800">{item.name}</strong>}
                                                {item.description && <p className="mt-0.5">{item.description}</p>}
                                                {/* Add duration or other fields if needed: item.duration, item.stopduration */} 
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Additional Info */}
                            {productInfoData.additionalInfo && productInfoData.additionalInfo.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {productInfoData.additionalInfo.map((info, index) => (
                                            <li key={index} className="text-gray-700">
                                                {info.description}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Available Options */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Available Options</h3>
                                {availabilityLoading && (
                                    <div className="text-center p-5">
                                        <ArrowPathIcon className="h-6 w-6 text-blue-500 animate-spin mx-auto" />
                                        <p className="mt-1 text-sm text-gray-500">Loading options...</p>
                                    </div>
                                )}
                                {availabilityError && !availabilityLoading && (
                                     <p className="text-red-600 italic px-3 py-2 bg-red-50 rounded border border-red-200">Error: {availabilityError}</p>
                                )}
                                {!availabilityLoading && !availabilityError && (
                                     <div className="space-y-3">
                                        {availableOptions.length > 0 ? (
                                            availableOptions.map(option => (
                                                <ActivityOptionCard
                                                    key={option.ratekey}
                                                    option={option}
                                                    selected={selectedOption?.ratekey === option.ratekey}
                                                    onSelect={() => handleOptionSelect(option)}
                                                />
                                            ))
                                        ) : (
                                            <p className="text-gray-500 italic">No specific options found for this activity.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Price Comparison */}
                            {selectedOption && priceComparison && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                                    <h3 className="text-lg font-semibold mb-2">Price Comparison</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Selected Option:</span>
                                            <span className="font-semibold">
                                                {formatCurrency(priceComparison.newPrice, priceComparison.currency)}
                                            </span>
                                        </div>
                                        {/* Display Determined Time Info */} 
                                        {selectedOption && (selectedOption.departureTime || manualStartTime) && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Selected Time:</span>
                                                 <span className="font-semibold text-gray-800">{selectedOption.departureTime || manualStartTime || 'N/A'}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Current Activity:</span>
                                            <span>
                                                {formatCurrency(priceComparison.existingPrice, priceComparison.currency)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-200">
                                            <span className="font-semibold">Price Difference:</span>
                                            <span className={`font-semibold ${
                                                priceComparison.priceDifference > 0 
                                                    ? 'text-red-600' 
                                                    : priceComparison.priceDifference < 0 
                                                        ? 'text-green-600' 
                                                        : 'text-gray-600'
                                            }`}>
                                                {priceComparison.priceDifference >= 0 ? '+' : ''}
                                                {formatCurrency(priceComparison.priceDifference, priceComparison.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- Manual Time Input --- */}
                            {!productInfoLoading && !availabilityLoading && productInfoData && selectedOption && !selectedOption.departureTime && (
                                <div className="mt-4">
                                    <label htmlFor="manualStartTime" className="block text-sm font-medium text-gray-700 mb-1">Select Start Time</label>
                                    <input
                                        type="time"
                                        id="manualStartTime"
                                        name="manualStartTime"
                                        value={manualStartTime}
                                        onChange={(e) => setManualStartTime(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        required
                                    />
                                     <p className="mt-1 text-xs text-gray-500">Please select the desired start time for this activity.</p>
                                </div>
                            )}
                            {/* --- End Manual Time Input --- */}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                    {/* Status Message */}
                    {bookingStatus.message && (
                        <div className={`mb-3 p-3 rounded-md text-sm flex items-center gap-2 ${
                            bookingStatus.success 
                                ? 'bg-green-50 text-green-700' 
                                : bookingStatus.error 
                                    ? 'bg-red-50 text-red-700' 
                                    : 'bg-blue-50 text-blue-700'
                        }`}>
                            {bookingStatus.success && <CheckCircleIcon className="h-5 w-5" />}
                            {bookingStatus.error && <ExclamationTriangleIcon className="h-5 w-5" />}
                            <span>{bookingStatus.message}</span>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            disabled={bookingStatus.loading}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmChange}
                            disabled={!selectedOption || bookingStatus.loading || bookingStatus.success}
                            className={`px-4 py-2 rounded-md text-white font-medium ${
                                !selectedOption || bookingStatus.success
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : bookingStatus.loading
                                        ? 'bg-blue-400 cursor-wait'
                                        : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {bookingStatus.loading ? (
                                <div className="flex items-center gap-2">
                                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                    <span>Processing...</span>
                                </div>
                            ) : (
                                'Confirm Change'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmChangeActivityDetailModal; 