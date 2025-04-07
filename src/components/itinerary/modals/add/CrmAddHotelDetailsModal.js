import axios from 'axios';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'; // Using lucide-react
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// --- Helper Functions ---
const currencyFormatter = (amount, currencyCode = 'USD') => {
    if (amount == null || isNaN(amount)) {
        return 'N/A'; // Or some placeholder for invalid amounts
    }
    try {
        return new Intl.NumberFormat(undefined, { // Use locale default or specify e.g., 'en-US'
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch (error) {
        console.error("Currency formatting error:", error);
        // Fallback for unsupported currency codes
        return `${currencyCode} ${amount.toFixed(2)}`;
    }
};

// --- Sub-Components ---
const RoomRateOption = ({ recommendation, roomRateData, selected, onSelect }) => {
    if (!recommendation || !roomRateData || !roomRateData.rates) {
        return <div className="text-sm text-red-500">Rate data incomplete.</div>;
    }

    // Aggregate details from the selected rate IDs in the recommendation
    const ratesInRecommendation = recommendation.rates
        .map(rateId => roomRateData.rates[rateId])
        .filter(Boolean); // Filter out any undefined rates if IDs don't match

    if (ratesInRecommendation.length === 0) {
        return <div className="text-sm text-gray-500">No valid rates found for this option.</div>;
    }

    // Example: Use the first rate for display purposes or aggregate
    const displayRate = ratesInRecommendation[0];
    const totalRate = ratesInRecommendation.reduce((sum, rate) => sum + (rate.finalRate || 0), 0);
    const currency = displayRate.currency || 'USD'; // Default currency

    // Generate a simple description (can be improved)
    const description = ratesInRecommendation.map(rate => {
        const occupancy = rate.occupancies?.[0];
        const adults = occupancy?.numOfAdults || 0;
        const children = occupancy?.numOfChildren || 0;
        let occDesc = `${adults} Adult${adults !== 1 ? 's' : ''}`;
        if (children > 0) {
            occDesc += `, ${children} Child${children !== 1 ? 'ren' : ''}`;
        }
        return `${rate.roomDescription || 'Room'} (${occDesc})`;
    }).join('; ');

    return (
        <div
            className={`border p-3 rounded-md cursor-pointer transition-all duration-150 ${selected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-300 bg-white hover:border-gray-400'}`}
            onClick={onSelect}
        >
            <div className="flex justify-between items-start">
                <div className="flex-grow mr-4">
                    <p className={`font-medium text-sm ${selected ? 'text-blue-800' : 'text-gray-800'}`}>{description}</p>
                    {/* Add more details if needed, e.g., cancellation policy */}                    
                    {displayRate.cancellationPolicy && (
                        <p className={`text-xs mt-1 ${selected ? 'text-blue-600' : 'text-gray-500'}`}>
                             {displayRate.cancellationPolicy.description}
                        </p>
                    )}
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className={`font-semibold text-base ${selected ? 'text-blue-700' : 'text-gray-900'}`}>{currencyFormatter(totalRate, currency)}</p>
                    <p className={`text-xs ${selected ? 'text-blue-500' : 'text-gray-500'}`}>Total price</p>
                </div>
            </div>
        </div>
    );
};

const CrmAddHotelDetailsModal = ({
    isOpen,
    onClose,
    selectedHotel, // The NEW hotel selected from the results page
    itineraryToken,
    inquiryToken,
    traceId,
    city,
    date, // Check-in date
    dates, // { checkIn, checkOut }
    // REMOVED: oldHotelCode
    // REMOVED: existingHotelPrice
    onHotelAdded // RENAMED: Callback function on success
}) => {
    const [detailsLoading, setDetailsLoading] = useState(true);
    const [detailsError, setDetailsError] = useState(null);
    const [hotelDetails, setHotelDetails] = useState(null); // Stores detailed response including roomRate
    const [selectedRecommendation, setSelectedRecommendation] = useState(null);
    const [bookingStatus, setBookingStatus] = useState({
        loading: false,
        error: null,
        success: false,
        message: ''
    });

    // Extracted data after loading
    const roomRateData = hotelDetails?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

    // Fetch detailed room/rate info (remains the same)
    useEffect(() => {
        if (isOpen && selectedHotel && inquiryToken && traceId) {
            const fetchHotelDetails = async () => {
                setDetailsLoading(true);
                setDetailsError(null);
                setBookingStatus({ loading: false, error: null, success: false, message: '' }); // Reset status
                setSelectedRecommendation(null); // Reset selection
                setHotelDetails(null); // Clear previous details
                console.log(`AddHotelDetailsModal: Fetching details for hotel ${selectedHotel.id || selectedHotel.hotel_code} using inquiry ${inquiryToken} and traceId ${traceId}`);
                try {
                    const hotelIdToFetch = selectedHotel.id || selectedHotel.hotel_code;
                    if (!hotelIdToFetch) throw new Error("Selected hotel is missing a valid ID.");

                    // Use the existing getHotelDetails endpoint
                    const apiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelIdToFetch}/details`;
                    const response = await axios.get(apiUrl, {
                        params: { traceId, cityName: city, checkIn: date }, // Pass correct params
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('crmToken')}`, // Use CRM token
                            "X-Inquiry-Token": inquiryToken,
                        },
                    });
                    setHotelDetails(response.data);
                    console.log("AddHotelDetailsModal: Fetched hotel details:", response.data);
                } catch (error) {
                    console.error("AddHotelDetailsModal: Error fetching hotel details:", error);
                    setDetailsError(error.response?.data?.message || error.message || "Failed to load hotel room details.");
                } finally {
                    setDetailsLoading(false);
                }
            };
            fetchHotelDetails();
        } else if (isOpen && !traceId) {
            console.error("AddHotelDetailsModal: Cannot fetch hotel details: traceId is missing.");
            setDetailsError("Required traceId is missing to fetch details.");
            setDetailsLoading(false);
        }
    }, [isOpen, selectedHotel, inquiryToken, traceId, city, date]);

    // --- Booking Logic (Adapted for ADD) ---
    const handleConfirmAdd = async () => {
        const currentTraceId = traceId; // Use traceId from props/state

        console.log("AddHotelDetailsModal: Checking confirmation data:", {
            selectedRecommendationExists: !!selectedRecommendation,
            roomRateDataExists: !!roomRateData,
            currentTraceIdExists: !!currentTraceId,
        });

        if (!selectedRecommendation || !roomRateData || !currentTraceId) {
            toast.warn("Please select a room option first, or wait for details to load.");
            console.error("AddHotelDetailsModal: Missing data for confirmation:", { selectedRecommendation, roomRateData, currentTraceId });
            return;
        }

        setBookingStatus({ loading: true, error: null, success: false, message: 'Selecting room...' });

        try {
            // --- Step 1: Call selectHotelRoom (Same as Change Flow) --- 
            const selectedRates = selectedRecommendation.rates
                .map((rateId) => roomRateData.rates[rateId])
                .filter(Boolean);

            if (selectedRates.length !== selectedRecommendation.rates.length) {
                throw new Error("Could not find all details for the selected rates.");
            }

            const roomsAndRateAllocations = selectedRates.map((rate) => ({
                rateId: rate.id,
                roomId: rate.occupancies?.[0]?.roomId,
                occupancy: {
                    adults: rate.occupancies?.[0]?.numOfAdults,
                    ...(rate.occupancies?.[0]?.numOfChildren > 0 && {
                        childAges: rate.occupancies?.[0]?.childAges,
                    }),
                },
            }));

            if (roomsAndRateAllocations.some(alloc => !alloc.roomId || !alloc.rateId)) {
                throw new Error("Selected rate details are incomplete.");
            }

            const selectRoomRequestData = {
                roomsAndRateAllocations,
                recommendationId: selectedRecommendation.id,
                items: hotelDetails?.data?.results?.[0]?.items,
                itineraryCode: hotelDetails?.data?.results?.[0]?.itinerary.code,
                traceId: currentTraceId,
                inquiryToken,
                cityName: city,
                date: date, // Check-in date
            };

            console.log("AddHotelDetailsModal: Select Room Request Data:", selectRoomRequestData);

            const hotelIdForSelect = selectedHotel.id || selectedHotel.hotel_code;
            if (!hotelIdForSelect) {
                throw new Error("Cannot select room: selected hotel ID is missing.");
            }

            const selectRoomResponse = await axios.post(
                `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelIdForSelect}/select-room`,
                selectRoomRequestData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        "X-Inquiry-Token": inquiryToken,
                    },
                }
            );

            console.log("AddHotelDetailsModal: Select Room Response:", selectRoomResponse.data);
            setBookingStatus(prev => ({ ...prev, message: 'Adding hotel to itinerary...' }));

            const finalHotelPayload = selectRoomResponse.data?.data; // The data needed to add
            if (!finalHotelPayload) {
                 console.error("Invalid select-room response structure:", selectRoomResponse.data);
                 throw new Error("Invalid response received after selecting room. Cannot add hotel.");
            }

            // --- Step 2: Call the NEW Add Hotel Endpoint --- 
            const addHotelRequest = {
                cityName: city, // The city where the day belongs
                date: date,     // The specific date (check-in) to add the hotel to
                newHotelDetails: { // Wrap the payload as expected by the backend controller
                    success: true, // Assume success from select-room step
                    data: finalHotelPayload, 
                    checkIn: dates.checkIn, // Use dates from props
                    checkOut: dates.checkOut,
                    message: `Added hotel: ${finalHotelPayload?.hotelDetails?.name || 'Unknown'}`
                }
            };

            console.log("AddHotelDetailsModal: Add Hotel Request Data:", JSON.stringify(addHotelRequest, null, 2));

            const addHotelResponse = await axios.post(
                `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`, // Use the NEW POST endpoint
                addHotelRequest, 
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        "X-Inquiry-Token": inquiryToken, // Pass inquiry token in headers
                    },
                }
            );

            if (addHotelResponse.data?.success) {
                setBookingStatus({ loading: false, success: true, error: null, message: 'Hotel added successfully!' });
                toast.success("Hotel added to itinerary!");
                if (onHotelAdded) {
                    onHotelAdded(); // Call the success callback
                }
                setTimeout(onClose, 1500); // Close modal after a delay
            } else {
                throw new Error(addHotelResponse.data?.message || "Failed to add hotel to the itinerary.");
            }

        } catch (error) {
            console.error("AddHotelDetailsModal: Error adding hotel:", error);
            let errorMessage = "Failed to add hotel.";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.message || error.message;
            } else if (error instanceof Error) {
                errorMessage = error.message;
            }
            setBookingStatus({ loading: false, success: false, error: true, message: errorMessage });
            toast.error(`Error: ${errorMessage}`);
        }
    };

    // Get all recommendations linearly
    const allRecommendations = roomRateData ? Object.entries(roomRateData.recommendations || {}).map(([id, rec]) => ({ ...rec, id })) : [];

    if (!isOpen) return null;

    const modalTitle = selectedHotel?.name ? `Select Room - ${selectedHotel.name}` : 'Select Room Option'; // Improved title
    
    // No price difference calculation needed for adding

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header (remains the same) */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg flex-shrink-0">
                     <h2 className="text-lg font-semibold text-gray-800 truncate pr-4" title={modalTitle}>
                        {modalTitle}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                        disabled={bookingStatus.loading}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body (remains largely the same, just rendering options) */}
                <div className="flex-grow overflow-y-auto p-5 space-y-5">
                    {/* ... Loading/Error states ... */}
                    {detailsLoading && (
                        <div className="text-center p-10">
                            <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                            <p className="mt-2 text-gray-600">Loading room options...</p>
                        </div>
                    )}
                    {detailsError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error! </strong>
                            <span className="block sm:inline">{detailsError}</span>
                        </div>
                    )}

                    {!detailsLoading && !detailsError && roomRateData && (
                        <div className="space-y-3">
                            <h3 className="text-base font-medium text-gray-700 mb-3">Available Room Options</h3>
                            {allRecommendations.length > 0 ? (
                                allRecommendations.map(rec => (
                                    <RoomRateOption
                                        key={rec.id}
                                        recommendation={rec}
                                        roomRateData={roomRateData}
                                        selected={selectedRecommendation?.id === rec.id}
                                        onSelect={() => setSelectedRecommendation(rec)}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 italic">No specific room recommendations found for this hotel.</p>
                            )}
                        </div>
                    )}
                     {!detailsLoading && !detailsError && !roomRateData && (
                         <p className="text-gray-500 italic">Room rate details are not available for this hotel.</p>
                    )}

                    {/* Selected Option Price Display (no comparison) */}
                     {selectedRecommendation && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Selected Option Price:</span>
                                <span className="font-semibold text-base text-gray-800">
                                    {currencyFormatter(
                                        selectedRecommendation.rates?.reduce((total, rateId) => total + (roomRateData.rates?.[rateId]?.finalRate || 0), 0),
                                        roomRateData?.rates?.[selectedRecommendation.rates[0]]?.currency
                                    )}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer with Action Button & Status (Adapted for ADD) */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                    {/* Status Display (remains the same) */}
                    {/* ... Status messages ... */}
                    <div className="h-6 mb-2 text-center">
                        {bookingStatus.loading && (
                            <div className="flex items-center justify-center text-blue-600 text-sm">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>{bookingStatus.message || 'Processing...'}</span>
                            </div>
                        )}
                        {bookingStatus.success && (
                            <div className="flex items-center justify-center text-green-600 text-sm font-medium">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                <span>{bookingStatus.message || 'Success!'}</span>
                            </div>
                        )}
                        {bookingStatus.error && (
                            <div className="flex items-center justify-center text-red-600 text-sm font-medium">
                                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
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
                            onClick={handleConfirmAdd} // Call the ADD handler
                            disabled={!selectedRecommendation || bookingStatus.loading || bookingStatus.success || detailsLoading || detailsError || !roomRateData}
                            className={`px-5 py-2 rounded-md text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center
                                ${!selectedRecommendation || detailsLoading || detailsError || !roomRateData
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : bookingStatus.loading || bookingStatus.success
                                        ? 'bg-blue-300 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                             {bookingStatus.loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                'Confirm & Add Hotel' // Updated button text
                             )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmAddHotelDetailsModal;
