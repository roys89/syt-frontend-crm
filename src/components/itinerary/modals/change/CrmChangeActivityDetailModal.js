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
        if (!selectedActivity?.code || !searchId || !inquiryToken || !city || !date || !travelersDetails) {
             console.error("Missing data for fetching activity details:", { 
                 selectedActivity, searchId, inquiryToken, city, date, travelersDetails 
             });
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
            console.log(`Fetching product info for activity code: ${selectedActivity.code} using searchId: ${searchId}`);
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
                        groupCode: selectedActivity.groupCode
                    })
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch activity details (${response.status})`);
            }

            const data = await response.json();
            console.log("Fetched activity product info:", data);
            
            if (!data || !data.availabilityDetails) {
                 console.warn("Response format might be unexpected:", data);
                 throw new Error("Activity details or options not found in the response.");
            }
            setActivityDetails(data);

        } catch (err) {
            console.error("Error fetching activity details:", err);
            setDetailsError(err.message);
        } finally {
            setDetailsLoading(false);
        }
    }, [selectedActivity, searchId, inquiryToken, city, date, travelersDetails]);

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
    const productInfo = activityDetails?.productInfo || {};

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
                    {detailsLoading && (
                        <div className="text-center p-10">
                            <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading activity details...</p>
                        </div>
                    )}

                    {detailsError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 m-4 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{detailsError}</span>
                        </div>
                    )}

                    {!detailsLoading && !detailsError && activityDetails && (
                        <div className="p-4 space-y-6">
                            {/* Image Gallery */}
                            {productInfo.images && productInfo.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {productInfo.images.map((image, index) => (
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
                            {productInfo.description && (
                                <div className="text-gray-700">
                                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                                    <p className="text-sm">{productInfo.description}</p>
                                </div>
                            )}

                            {/* Duration & Departure */}
                            <div className="grid grid-cols-2 gap-4">
                                {productInfo.duration && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Duration</h4>
                                        <p className="text-sm">{productInfo.duration}</p>
                                    </div>
                                )}
                                {productInfo.departurePoint && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-600">Departure Point</h4>
                                        <p className="text-sm">{productInfo.departurePoint}</p>
                                    </div>
                                )}
                            </div>

                            {/* Inclusions */}
                            {productInfo.inclusions && productInfo.inclusions.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Inclusions</h3>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {productInfo.inclusions.map((inclusion, index) => (
                                            <li key={index} className="text-gray-700">
                                                {inclusion.otherDescription}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Itinerary */}
                            {productInfo.itinerary?.itineraryItems && productInfo.itinerary.itineraryItems.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Itinerary</h3>
                                    <ul className="space-y-3 text-sm">
                                        {productInfo.itinerary.itineraryItems.map((item, index) => (
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
                            {productInfo.additionalInfo && productInfo.additionalInfo.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Additional Information</h3>
                                    <ul className="list-disc list-inside text-sm space-y-1">
                                        {productInfo.additionalInfo.map((info, index) => (
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