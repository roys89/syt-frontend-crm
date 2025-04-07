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

const CrmChangeActivityDetailModal = ({
    isOpen,
    onClose,
    selectedActivity, // The NEW activity chosen on the page
    itineraryToken,
    inquiryToken,
    travelersDetails, 
    city, 
    date, 
    oldActivityCode,
    existingPrice, // Price of the OLD activity being replaced
    onActivityChanged // Callback on success
}) => {
    // State for fetching options for the selectedActivity
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState(null);
    const [activityDetails, setActivityDetails] = useState(null); // Stores response from /product-info
    
    // State for user selection within the modal
    const [selectedOption, setSelectedOption] = useState(null); // The specific package/rate chosen
    const [priceComparison, setPriceComparison] = useState(null); // Comparison between NEW option and OLD activity

    // State for the final confirmation API call
    const [bookingStatus, setBookingStatus] = useState({
        loading: false,
        error: null,
        success: false,
        message: ''
    });

    // --- Fetch detailed options when modal opens --- 
    const fetchActivityDetails = useCallback(async () => {
        if (!selectedActivity?.code || !inquiryToken || !city || !date || !travelersDetails) {
             console.error("Missing data for fetching activity details:", { selectedActivity, inquiryToken, city, date, travelersDetails });
             setDetailsError("Internal error: Missing required data to fetch details.");
             return;
        }

        setDetailsLoading(true);
        setDetailsError(null);
        setSelectedOption(null); // Reset selection
        setActivityDetails(null); // Clear previous details
        setPriceComparison(null); // Reset comparison
        setBookingStatus({ loading: false, error: null, success: false, message: '' }); // Reset final status

        try {
            console.log(`Fetching product info for activity code: ${selectedActivity.code}`);
            const response = await fetch(
                `http://localhost:5000/api/itinerary/product-info/${selectedActivity.code}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken,
                    },
                    body: JSON.stringify({
                        // Backend expects city object?
                        city: { name: city }, 
                        date: date,
                        travelersDetails: travelersDetails 
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activity details (${response.status})`);
            }

            const data = await response.json();
            console.log("Fetched activity product info:", data);
            // TODO: Validate the structure of `data` (e.g., check for availabilityDetails)
            if (!data || !data.availabilityDetails) {
                 console.warn("Response format might be unexpected:", data);
                 // Handle cases where details might be missing even if API call succeeds
                 throw new Error("Activity details or options not found in the response.");
            }
            setActivityDetails(data);

        } catch (err) {
            console.error("Error fetching activity details:", err);
            setDetailsError(err.message);
        } finally {
            setDetailsLoading(false);
        }
    }, [selectedActivity, inquiryToken, city, date, travelersDetails]); // Dependencies for fetching

    useEffect(() => {
        if (isOpen && selectedActivity) {
            fetchActivityDetails();
        }
    }, [isOpen, selectedActivity, fetchActivityDetails]);

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
        if (!selectedOption || !activityDetails) {
            toast.error("Please select an activity option first.");
            return;
        }
        if (!itineraryToken || !oldActivityCode || !city || !date || !inquiryToken) {
             toast.error("Cannot confirm change: Missing essential itinerary context.");
             console.error("Missing context for PUT request:", { itineraryToken, oldActivityCode, city, date, inquiryToken });
             return;
        }

        setBookingStatus({ loading: true, error: null, success: false, message: 'Updating itinerary...' });

        try {
            // Construct the newActivityDetails payload based on customer frontend's example
            const newActivityDetailsPayload = {
                activityType: 'online', // Assuming it's usually online from this source?
                activityCode: selectedActivity.code,
                activityName: selectedActivity.title,
                // Include other relevant fields from selectedActivity or activityDetails if needed by backend
                bookingStatus: 'pending', 
                packageDetails: { // Details from the *selected option* within the modal
                    amount: selectedOption.amount,
                    currency: selectedOption.currency, 
                    ratekey: selectedOption.ratekey,
                    title: selectedOption.title,
                    departureTime: selectedOption.departureTime, // Optional
                    description: selectedOption.description // Optional
                },
                // Include fields from activityDetails.productInfo if needed
                images: activityDetails?.productInfo?.images || [],
                description: activityDetails?.productInfo?.description || '',
                // Add other fields like inclusions, exclusions, etc. if the PUT endpoint requires them
            };

            const requestBody = {
                cityName: city,
                date: date,
                oldActivityCode: oldActivityCode,
                newActivityDetails: newActivityDetailsPayload
            };

            console.log("Submitting PUT /activity request:", JSON.stringify(requestBody, null, 2));

            const response = await fetch(
                `http://localhost:5000/api/itinerary/${itineraryToken}/activity`,
                {
                    method: 'PUT',
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

    const availableOptions = activityDetails?.availabilityDetails || [];

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg flex-shrink-0">
                    <h2 className="text-lg font-semibold text-gray-800 truncate pr-4" title={selectedActivity?.title || 'Select Option'}>
                        {selectedActivity?.title || 'Select Option'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={bookingStatus.loading}
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */} 
                <div className="flex-grow overflow-y-auto p-5 space-y-5">
                    {detailsLoading && (
                        <div className="text-center p-10">
                             {/* Simple Loader */} 
                            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading activity options...</p>
                        </div>
                    )}
                    {detailsError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{detailsError}</span>
                            {/* Optionally add a retry button? */}
                        </div>
                    )}

                    {!detailsLoading && !detailsError && activityDetails && (
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-700 mb-3">Available Options</h3>
                             {availableOptions.length > 0 ? (
                                availableOptions.map(option => (
                                    <ActivityOptionCard
                                        key={option.ratekey || option.title} // Use ratekey if available
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

                    {/* Display price comparison info */} 
                     {selectedOption && priceComparison && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-4 text-sm">
                             <div className="flex justify-between items-center">
                                 <span className="text-gray-600">Selected Option Price:</span>
                                 <span className="font-semibold text-gray-800">
                                     {formatCurrency(priceComparison.newPrice, priceComparison.currency)}
                                 </span>
                             </div>
                             <div className="flex justify-between items-center mt-1">
                                 <span className="text-gray-600">Original Activity Price:</span>
                                 <span className="text-gray-500">
                                     {formatCurrency(priceComparison.existingPrice)}
                                 </span>
                             </div>
                             {priceComparison.priceDifference !== 0 && (
                                 <div className={`flex justify-between items-center mt-1 pt-1 border-t border-gray-100 font-medium ${priceComparison.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                     <span>Difference:</span>
                                     <span>
                                          {priceComparison.priceDifference > 0 ? '+' : '-'}{formatCurrency(Math.abs(priceComparison.priceDifference), priceComparison.currency)}
                                     </span>
                                 </div>
                             )}
                         </div>
                     )}
                </div>

                {/* Footer */} 
                 <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                     {/* Status Display */}
                     <div className="h-6 mb-2 text-center">
                         {bookingStatus.loading && (
                             <div className="flex items-center justify-center text-blue-600 text-sm">
                                 <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                                 <span>{bookingStatus.message || 'Processing...'}</span>
                             </div>
                         )}
                         {bookingStatus.success && (
                             <div className="flex items-center justify-center text-green-600 text-sm font-medium">
                                 <CheckCircleIcon className="h-4 w-4 mr-2" />
                                 <span>{bookingStatus.message || 'Success!'}</span>
                             </div>
                         )}
                         {bookingStatus.error && (
                             <div className="flex items-center justify-center text-red-600 text-sm font-medium">
                                 <ExclamationTriangleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                 <span className="truncate" title={bookingStatus.message}>{bookingStatus.message || 'An error occurred.'}</span>
                             </div>
                         )}
                     </div>

                     {/* Action Buttons */}
                     <div className="flex justify-end gap-3">
                         <button
                             onClick={onClose}
                             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
                             disabled={bookingStatus.loading || bookingStatus.success}
                         >
                             Cancel
                         </button>
                         <button
                             onClick={handleConfirmChange}
                             disabled={!selectedOption || bookingStatus.loading || bookingStatus.success || detailsLoading || detailsError}
                             className={`px-5 py-2 rounded-md text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center
                                 ${!selectedOption || detailsLoading || detailsError
                                     ? 'bg-gray-300 cursor-not-allowed'
                                     : bookingStatus.loading || bookingStatus.success
                                         ? 'bg-blue-300 cursor-not-allowed'
                                         : 'bg-blue-600 hover:bg-blue-700'
                                 }`}
                         >
                              {bookingStatus.loading ? (
                                 <ArrowPathIcon className="w-4 h-4 animate-spin" />
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