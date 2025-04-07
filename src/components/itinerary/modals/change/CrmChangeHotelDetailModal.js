import axios from 'axios';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react'; // Using lucide-react
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Simple currency formatter helper (can be moved to a utils file)
const currencyFormatter = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    // Ensure currencyCode is a valid 3-letter string, otherwise default to INR
    const code = typeof currencyCode === 'string' && currencyCode.trim().length === 3
                 ? currencyCode.trim().toUpperCase()
                 : 'INR';
    try {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: code, // Use the cleaned/validated code
            minimumFractionDigits: 0, // Adjust as needed
            maximumFractionDigits: 0  // Adjust as needed
        }).format(amount);
    } catch (e) {
        console.error(`Currency formatting error: ${e.message}. Code used: ${code}, Original input: ${currencyCode}`);
        // Fallback display if Intl fails
        return `${code} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
};

// Placeholder for rendering room/rate details - adapt based on actual data structure
const RoomRateOption = ({ recommendation, roomRateData, selected, onSelect }) => {
    const calculateTotalPrice = (rec) => {
        if (!rec?.rates || !roomRateData?.rates) return 0;
        return rec.rates.reduce((total, rateId) => {
            const rate = roomRateData.rates[rateId];
            return total + (rate?.finalRate || 0);
        }, 0);
    };

    const getRoomDetailsFromOccupancy = (occupancy) => {
        if (!occupancy || !roomRateData?.rooms) return null;
        const room = roomRateData.rooms[occupancy.roomId];
        return room ? { ...room, occupancyDetails: occupancy } : null;
    };

    const totalPrice = calculateTotalPrice(recommendation);
    const currency = recommendation.rates?.[0] ? (roomRateData.rates?.[recommendation.rates[0]]?.currency ?? 'INR') : 'INR';

    // Get details for the first room/rate for display purposes
    const firstRateId = recommendation.rates?.[0];
    const firstRate = firstRateId ? roomRateData.rates?.[firstRateId] : null;
    const firstOccupancy = firstRate?.occupancies?.[0];
    const firstRoom = firstOccupancy ? getRoomDetailsFromOccupancy(firstOccupancy) : null;
    const boardBasis = firstRate?.boardBasis?.description || 'Board basis N/A';
    const refundable = firstRate?.refundable ? 'Refundable' : 'Non-refundable';

    return (
        <div
            onClick={onSelect}
            className={`p-3 border rounded-lg cursor-pointer transition-all duration-150 ${selected ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
        >
            <div className="flex justify-between items-start">
                <div>
                    {firstRoom && (
                        <p className="font-medium text-gray-800 text-sm">{firstRoom.name}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {boardBasis} <span className="mx-1">•</span> {refundable}
                    </p>
                    <p className="text-xs text-gray-500">
                        {recommendation.rates?.length} rate{recommendation.rates?.length !== 1 ? 's' : ''} included
                    </p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                    <p className="font-semibold text-lg text-blue-600">
                        {currencyFormatter(totalPrice, currency)}
                    </p>
                    <p className="text-xs text-gray-500">Total price</p>
                </div>
            </div>
        </div>
    );
};

const CrmChangeHotelDetailModal = ({
    isOpen,
    onClose,
    selectedHotel, // The NEW hotel selected from the CrmChangeHotelsPage
    itineraryToken,
    inquiryToken,
    traceId,
    city,
    date, // Check-in date
    dates, // { checkIn, checkOut }
    oldHotelCode, // The code of the hotel being replaced
    existingHotelPrice, // Price of the hotel being replaced
    onHotelChanged // Callback function on success
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

    // Fetch detailed room/rate info when modal opens or selectedHotel changes
    useEffect(() => {
        if (isOpen && selectedHotel && inquiryToken && traceId) {
            const fetchHotelDetails = async () => {
                setDetailsLoading(true);
                setDetailsError(null);
                setBookingStatus({ loading: false, error: null, success: false, message: '' }); // Reset status
                setSelectedRecommendation(null); // Reset selection
                setHotelDetails(null); // Clear previous details
                console.log(`Fetching details for hotel ${selectedHotel.id || selectedHotel.hotel_code} using inquiry ${inquiryToken} and traceId ${traceId}`);
                try {
                    const hotelIdToFetch = selectedHotel.id || selectedHotel.hotel_code;
                    if (!hotelIdToFetch) {
                        throw new Error("Selected hotel is missing a valid ID.");
                    }

                    const apiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelIdToFetch}/details`;
                    const response = await axios.get(apiUrl, {
                        params: { 
                            traceId: traceId,
                            cityName: city,
                            checkIn: date, 
                        }, 
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            "X-Inquiry-Token": inquiryToken,
                        },
                    });
                    setHotelDetails(response.data);
                    console.log("Fetched hotel details:", response.data);
                } catch (error) {
                    console.error("Error fetching hotel details:", error);
                    setDetailsError(error.response?.data?.message || error.message || "Failed to load hotel room details.");
                } finally {
                    setDetailsLoading(false);
                }
            };
            fetchHotelDetails();
        } else if (isOpen && !traceId) {
            console.error("Cannot fetch hotel details: traceId is missing.");
            setDetailsError("Required traceId is missing to fetch details.");
            setDetailsLoading(false);
        }
    }, [isOpen, selectedHotel, inquiryToken, traceId, city, date]); // Added traceId to dependencies

    // --- Booking Logic ---
    const handleConfirmChange = async () => {
        const currentTraceId = traceId;
        
        console.log("Checking confirmation data:", {
            selectedRecommendationExists: !!selectedRecommendation,
            roomRateDataExists: !!roomRateData,
            currentTraceIdExists: !!currentTraceId,
        });
        
        if (!selectedRecommendation || !roomRateData || !currentTraceId) {
            toast.warn("Please select a room option first, or wait for details to load.");
            console.error("Missing data for confirmation:", { selectedRecommendation, roomRateData, currentTraceId });
            return;
        }

        setBookingStatus({ loading: true, error: null, success: false, message: 'Selecting room...' });

        try {
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

            console.log("Select Room Request Data:", selectRoomRequestData);

            const hotelIdForSelect = selectedHotel.id || selectedHotel.hotel_code;
            if (!hotelIdForSelect) {
                console.error("Selected hotel object:", selectedHotel);
                throw new Error("Cannot select room: selected hotel ID is missing from the prop.");
            }
            
            const selectRoomResponse = await axios.post(
                `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelIdForSelect}/select-room`,
                selectRoomRequestData,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        "X-Inquiry-Token": inquiryToken,
                    },
                }
            );

            console.log("Select Room Response:", selectRoomResponse.data);
            setBookingStatus(prev => ({ ...prev, message: 'Updating itinerary...' }));

            const newHotelDataFromSelect = selectRoomResponse.data.data;
            if (!newHotelDataFromSelect || !newHotelDataFromSelect.staticContent || !newHotelDataFromSelect.hotelDetails) {
                console.error("Invalid select-room response structure:", newHotelDataFromSelect);
                throw new Error("Invalid response received after selecting room. Cannot proceed with replacement.");
            }

            const newHotelDetailsPayload = {
                ...newHotelDataFromSelect,
                checkIn: dates.checkIn,
                checkOut: dates.checkOut,
                bookingStatus: 'pending',
                staticContent: [{
                    id: newHotelDataFromSelect.staticContent[0]?.id,
                    name: newHotelDataFromSelect.staticContent[0]?.name,
                    descriptions: newHotelDataFromSelect.staticContent[0]?.descriptions,
                    contact: newHotelDataFromSelect.staticContent[0]?.contact,
                    images: newHotelDataFromSelect.staticContent[0]?.images,
                    facilities: newHotelDataFromSelect.staticContent[0]?.facilities,
                }],
                hotelDetails: {
                    name: newHotelDataFromSelect.hotelDetails.name,
                    starRating: newHotelDataFromSelect.hotelDetails.starRating,
                    reviews: newHotelDataFromSelect.hotelDetails.reviews,
                    geolocation: newHotelDataFromSelect.hotelDetails.geolocation || newHotelDataFromSelect.hotelDetails.geoCode,
                    address: newHotelDataFromSelect.hotelDetails.address
                }
            };

            const replaceHotelRequest = {
                cityName: city,
                date: date,
                oldHotelCode: oldHotelCode,
                newHotelDetails: newHotelDetailsPayload
            };

            console.log("Replace Hotel Request Data:", JSON.stringify(replaceHotelRequest, null, 2));

            const replaceHotelResponse = await axios.put(
                `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`,
                replaceHotelRequest,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        "X-Inquiry-Token": inquiryToken,
                    },
                }
            );

            if (replaceHotelResponse.data.success) {
                setBookingStatus({ loading: false, success: true, error: null, message: 'Hotel changed successfully!' });
                toast.success("Hotel replaced in itinerary!");
                if (onHotelChanged) {
                    onHotelChanged();
                }
                setTimeout(onClose, 1500);
            } else {
                throw new Error(replaceHotelResponse.data.message || "Failed to update itinerary with the new hotel.");
            }

        } catch (error) {
            console.error("Error changing hotel:", error);
            let errorMessage = "Failed to change hotel.";
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

    const modalTitle = selectedHotel?.name || 'Select Room Option';
    const currentTotalPrice = selectedRecommendation ? selectedRecommendation.rates?.reduce((total, rateId) => total + (roomRateData.rates?.[rateId]?.finalRate || 0), 0) : 0;
    const priceDifference = currentTotalPrice - (existingHotelPrice || 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
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

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5 space-y-5">
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

                    {/* Display price comparison info */} 
                    {selectedRecommendation && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md mt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Selected Option Price:</span>
                                <span className="font-semibold text-base text-gray-800">
                                    {currencyFormatter(currentTotalPrice, roomRateData?.rates?.[selectedRecommendation.rates[0]]?.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm text-gray-600">Original Hotel Price:</span>
                                <span className="text-sm text-gray-500">
                                    {currencyFormatter(existingHotelPrice)}
                                </span>
                            </div>
                             {priceDifference !== 0 && (
                                <div className={`flex justify-between items-center mt-1 pt-1 border-t border-gray-100 ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    <span className="text-sm font-medium">Difference:</span>
                                    <span className="text-sm font-medium">
                                         {priceDifference > 0 ? '+' : '-'}{currencyFormatter(Math.abs(priceDifference), roomRateData?.rates?.[selectedRecommendation.rates[0]]?.currency)}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer with Action Button & Status */} 
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0">
                    {/* Status Display */} 
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
                            onClick={handleConfirmChange}
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
                                'Confirm Change'
                             )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmChangeHotelDetailModal; 