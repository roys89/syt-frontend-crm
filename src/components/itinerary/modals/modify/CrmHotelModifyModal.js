import { Dialog, Transition } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/20/solid'; // Example icon
import { CalendarIcon, ArrowPathIcon as LoadingIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RoomArrangementModal from '../../../booking/RoomArrangementModal'; // Import the existing modal

// Helper to format date for input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent date shifts
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date for input:", dateString, e);
    return '';
  }
};

// Helper to get total guests from room config
const getTotalGuests = (rooms) => {
  if (!rooms) return 0;
  return rooms.reduce((total, room) => {
    const adults = room.adults ? room.adults.length : 0;
    const children = room.children ? room.children.length : 0;
    return total + adults + children;
  }, 0);
};

// Helper function adapted from HotelItineraryModal to process search results
const getRateDetailsFromResult = (rateId, searchResults) => {
    return searchResults?.results?.[0]?.data?.[0]?.roomRate?.[0]?.rates?.[rateId];
};

const getRoomDetailsFromOccupancyFromResult = (occupancy, searchResults) => {
    if (!occupancy || !searchResults?.results?.[0]?.data?.[0]?.roomRate?.[0]?.rooms) return null;
    const room = searchResults.results[0].data[0].roomRate[0].rooms[occupancy.roomId];
    if (!room) return null;
    return {
        ...room,
        occupancyDetails: {
            adults: occupancy.numOfAdults,
            children: occupancy.numOfChildren || 0,
            childAges: occupancy.childAges || [],
        },
    };
};

const calculateTotalPriceFromResult = (recommendation, searchResults) => {
    if (!recommendation?.rates) return 0;
    return recommendation.rates.reduce((total, rateId) => {
        const rate = getRateDetailsFromResult(rateId, searchResults);
        return total + (rate?.finalRate || 0);
    }, 0);
};

// --- Helpers adapted from HotelItineraryModal --- 
const getRateDetails = (rateId, itineraryData) => {
    // Adjust path based on where rates are stored in the createHotelItinerary response
    return itineraryData?.data?.results?.[0]?.data?.[0]?.roomRate?.[0]?.rates?.[rateId];
};

const getRoomDetailsFromOccupancy = (occupancy, itineraryData) => {
    if (!occupancy) return null;
    // Adjust path based on where rooms are stored in the createHotelItinerary response
    const roomsData = itineraryData?.data?.results?.[0]?.data?.[0]?.roomRate?.[0]?.rooms;
    if (!roomsData) return null;
    const room = roomsData[occupancy.roomId];
    if (!room) return null;
    return {
        ...room,
        occupancyDetails: {
            adults: occupancy.numOfAdults,
            children: occupancy.numOfChildren || 0,
            childAges: occupancy.childAges || [],
        },
    };
};

const calculateTotalPrice = (recommendation, itineraryData) => {
    if (!recommendation?.rates) return 0;
    return recommendation.rates.reduce((total, rateId) => {
        const rate = getRateDetails(rateId, itineraryData);
        return total + (rate?.finalRate || 0);
    }, 0);
};
// --- End Helpers --- 

const CrmHotelModifyModal = ({ 
    isOpen, 
    onClose, 
    hotelData, 
    travelersDetails, 
    // --- Props for API call moved from CrmHotelCard ---
    itineraryToken, 
    inquiryToken, 
    originalCityName, 
    originalDate, 
    onUpdateItinerary 
}) => {
    // --- Form State ---
    const [hotelName, setHotelName] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [roomConfig, setRoomConfig] = useState([]);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

    // --- Workflow State ---
    const [viewState, setViewState] = useState('form'); // 'form' | 'loading' | 'itinerary' | 'guestInfo' | 'confirming'
    const [itineraryData, setItineraryData] = useState(null); // Stores response from createHotelItinerary
    const [selectedRooms, setSelectedRooms] = useState([]); // Stores selection from itinerary view { rateId, roomId, occupancy, roomDetails, recommendationId }
    const [errorMessage, setErrorMessage] = useState(''); // For displaying errors within the modal
    const [selectRoomResponseData, setSelectRoomResponseData] = useState(null); // Store selectRoomRates response data

    // --- Loading States ---
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
    const [isLoadingSelection, setIsLoadingSelection] = useState(false);
    const [isLoadingReplacement, setIsLoadingReplacement] = useState(false); // New state for replacement API call
    const [isLoadingAllocation, setIsLoadingAllocation] = useState(false);

    // Reset state when modal opens or data changes
    useEffect(() => {
        if (isOpen) {
            setViewState('form');
            setItineraryData(null);
            setSelectedRooms([]);
            setErrorMessage('');
            setIsLoadingReplacement(false); // Reset replacement loading state

            if (hotelData && travelersDetails) {
                setHotelName(hotelData.data?.hotelDetails?.name || 'Hotel Name N/A');
                setCheckInDate(formatDateForInput(hotelData.checkIn));
                setCheckOutDate(formatDateForInput(hotelData.checkOut));
                const initialRooms = travelersDetails?.rooms?.map(room => ({
                    adults: Array.isArray(room.adults) ? room.adults : Array(room.adults || 1).fill(30),
                    children: Array.isArray(room.children) ? room.children : []
                })) || [{ adults: [30], children: [] }];
                setRoomConfig(JSON.parse(JSON.stringify(initialRooms)));
            }
        } else {
             // Optional: Clear sensitive state on close if needed, though useEffect above handles reopen
             setItineraryData(null);
        }
    }, [isOpen, hotelData, travelersDetails]);

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        if (name === 'checkIn') {
            setCheckInDate(value);
            if (value >= checkOutDate) {
                const nextDay = new Date(value);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOutDate(formatDateForInput(nextDay));
            }
        } else if (name === 'checkOut') {
            if (value > checkInDate) {
                setCheckOutDate(value);
            } else {
                toast.warn("Check-out date must be after check-in date.");
                const nextDay = new Date(checkInDate);
                nextDay.setDate(nextDay.getDate() + 1);
                setCheckOutDate(formatDateForInput(nextDay));
            }
        }
    };

    const openRoomModal = () => setIsRoomModalOpen(true);
    const closeRoomModal = () => setIsRoomModalOpen(false);

    const handleRoomSave = (updatedRooms) => setRoomConfig(updatedRooms);

    // --- Main Search & Itinerary Creation Logic ---
    const handleSearchAndCreateItinerary = async () => {
        const hotelId = hotelData?.data?.hotelDetails?.id || hotelData?.data?.staticContent?.[0]?.id;
        if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate || roomConfig.length === 0 || getTotalGuests(roomConfig) === 0 || !hotelId) {
            toast.error("Please ensure dates, guest configuration, and hotel ID are valid.");
            return;
        }

        setIsLoadingSearch(true); 
        setErrorMessage('');
        setItineraryData(null);

        try {
            // <<< Construct occupancies from roomConfig state >>>
            const occupancies = roomConfig.map(room => ({
                numOfAdults: room.adults?.length || 0,
                childAges: room.children || [] // Assuming children array holds ages directly
            }));
            // Basic validation
            if (occupancies.some(occ => occ.numOfAdults < 1)) {
                 throw new Error("Each room must have at least one adult.");
            }

            // <<< Step 1: Search Hotels using POST with occupancies in body >>>
            console.log(`Step 1: Searching availability for hotel ${hotelId} from ${checkInDate} to ${checkOutDate} with occupancies:`, occupancies);
            // Use the same endpoint URL but with POST method
            const searchApiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${encodeURIComponent(originalCityName)}/${checkInDate}/${checkOutDate}?page=1`; 
            
            const searchRequestBody = {
                hotelId: hotelId,
                occupancies: occupancies,
                // Include checkIn/checkOut in body? Backend likely still uses URL params here based on modification.
                // Let's assume backend uses URL dates but body occupancies for now.
                // If backend expects dates in body too, add them here:
                // checkIn: checkInDate, 
                // checkOut: checkOutDate,
                page: 1, // Default page
                limit: 1 // Only need 1 result as we target a specific hotel
            };

            const searchResponse = await fetch(searchApiUrl, {
                method: 'POST', // <<< Use POST method >>>
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`, // <<< Use crmToken >>>
                    'X-Inquiry-Token': inquiryToken,
                    'Content-Type': 'application/json' // <<< Add Content-Type >>>
                },
                body: JSON.stringify(searchRequestBody) // <<< Send payload in body >>>
            });

            const searchData = await searchResponse.json();
            console.log("Search Response (POST):", searchData);
            if (!searchResponse.ok || !searchData.success) {
                // Attempt to parse specific error message if available
                const hotelInfo = searchData?.data?.hotels?.[0];
                if (hotelInfo?.availability?.isAvailable === false) {
                     throw new Error(hotelInfo.availability.message || "Hotel not available for the selected criteria.");
                }
                throw new Error(searchData.message || "No availability found for the selected criteria.");
            }
            
            const newTraceId = searchData?.data?.traceId;
            if (!newTraceId) {
                throw new Error("Could not retrieve traceId from availability search.");
            }
             console.log(`Step 1 Success: Got traceId ${newTraceId}`);

            // --- Step 2: Get Hotel Details (Create Itinerary Equivalent) --- (No change needed here, uses GET)
            console.log(`Step 2: Fetching details using hotelId ${hotelId}, traceId ${newTraceId}`);
            const detailsApiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/details`;
            const detailsResponse = await fetch(`${detailsApiUrl}?traceId=${newTraceId}&cityName=${encodeURIComponent(originalCityName)}&checkIn=${checkInDate}`, { 
                 headers: {
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`, // <<< Use crmToken >>>
                    "X-Inquiry-Token": inquiryToken,
                },
            });

            const detailsData = await detailsResponse.json();
            console.log("Details Response (Itinerary Data):", detailsData);
             if (!detailsResponse.ok || !detailsData.success) {
                throw new Error(detailsData.message || "Failed to fetch hotel details/options.");
            }

            setItineraryData(detailsData); 
            setViewState('itinerary'); 
            toast.success("Availability found, please select room options.");

        } catch (error) {
            console.error("Error during Modify Search/Details Fetch:", error);
            setErrorMessage(error.message || "An error occurred while checking availability.");
            toast.error(error.message || "Failed to check availability.");
            setViewState('form'); 
        } finally {
            setIsLoadingSearch(false); 
        }
    };

    // --- Room Selection Logic (within Itinerary View) ---
    const handleRoomSelect = (recommendation) => {
         if (!recommendation?.rates) return;
        
         // Get all rooms from the recommendation
         const roomsFromRecommendation = recommendation.rates.map(rateId => {
             const rate = getRateDetails(rateId, itineraryData);
             if (!rate?.occupancies) return null;
             const occupancy = rate.occupancies[0]; // Assuming one occupancy per rate
             const room = getRoomDetailsFromOccupancy(occupancy, itineraryData);
             if (!room) return null;
             return {
                 rateId: rateId,
                 roomId: occupancy.roomId,
                 occupancy: { adults: occupancy.numOfAdults, childAges: occupancy.childAges || [] },
                 roomDetails: { ...room, recommendationId: recommendation.id }
             };
         }).filter(Boolean);

        setSelectedRooms(roomsFromRecommendation); // Update selected rooms array
    };

    // --- Confirm Room Selection & Replace Hotel Logic (within Itinerary View) ---
    const handleConfirmSelection = async () => {
        const hotelId = hotelData?.data?.hotelDetails?.id || hotelData?.data?.staticContent?.[0]?.id;
        const currentTraceId = itineraryData?.data?.results?.[0]?.traceId; // Get traceId from stored itineraryData
        
        if (selectedRooms.length === 0 || !currentTraceId || !hotelId) {
            toast.error("Please select a room option first, or required data is missing.");
            console.error("Missing data for selection/replacement:", { selectedRooms, currentTraceId, hotelId });
            return;
        }
        
        // Combine loading states
        setIsLoadingSelection(true); 
        setErrorMessage('');
        
        try {
            // 1. Select Room Rates using B2C endpoint
            const recommendationId = selectedRooms[0]?.roomDetails?.recommendationId;
            if (!recommendationId) throw new Error("Selected room data is incomplete (missing recommendationId).");

            const itineraryCode = itineraryData.data.results[0].itinerary?.code;
            const items = itineraryData.data.results[0].items;

            const roomsAndRateAllocations = selectedRooms.map(room => ({
                rateId: room.rateId,
                roomId: room.roomId,
                occupancy: room.occupancy // Ensure this matches API expectation (e.g., { adults: X, childAges: [...] })
            }));

            const selectRoomRequestPayload = {
                roomsAndRateAllocations,
                traceId: currentTraceId,
                recommendationId,
                itineraryCode,
                items,
                cityName: originalCityName, // Use original city name here? Or the one from itineraryData?
                date: checkInDate,      // Use the new checkInDate from state
                inquiryToken: inquiryToken // Pass inquiryToken
            };

            console.log("Step 1: Calling selectRoomRates...", selectRoomRequestPayload);
            const selectRoomApiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/select-room`;
            const selectRoomResponse = await fetch(selectRoomApiUrl, {
                 method: 'POST',
                 headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'X-Inquiry-Token': inquiryToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(selectRoomRequestPayload)
            });
            
            const selectRoomData = await selectRoomResponse.json();
            console.log("selectRoomRates response:", selectRoomData);

            if (!selectRoomResponse.ok || !selectRoomData.success) {
                throw new Error(selectRoomData.message || "Failed to select room rate.");
            }
            
            toast.success("Room rate selected successfully! Preparing hotel replacement...");
            const newHotelSelectionData = selectRoomData.data; // Use this variable consistently
            
            // 2. Replace Hotel in Itinerary using shared PUT endpoint
            console.log("Step 2: Replacing hotel in main itinerary...");
            const newCheckInDate = checkInDate;   // Date used for selection (from modal state)
            const newCheckOutDate = checkOutDate; // Date used for selection (from modal state)

            // Construct the payload SIMILAR to CrmChangeHotelDetailModal
            const formattedNewHotelDetails = {
                ...newHotelSelectionData,
                checkIn: newCheckInDate,
                checkOut: newCheckOutDate,
                bookingStatus: newHotelSelectionData.bookingStatus || 'pending',
                // Explicitly format staticContent and hotelDetails if needed based on API expectation
                // Check if selectRoomData already contains these in the right structure
                staticContent: newHotelSelectionData.staticContent, 
                hotelDetails: newHotelSelectionData.hotelDetails 
            };
            
            // Validate essential data for payload
            if (!formattedNewHotelDetails.staticContent || !formattedNewHotelDetails.hotelDetails) {
                 console.error("Data from selectRoomRates is missing required staticContent or hotelDetails", newHotelSelectionData);
                 throw new Error("Cannot format replacement payload: essential details missing from select room response.");
            }
            
            if (!originalCityName || !originalDate) {
              throw new Error("Could not determine original city or date for replacement. Required props missing.");
            }

            const replaceHotelRequestPayload = {
                cityName: originalCityName, // Target city from props
                date: originalDate,         // Target date slot from props
                oldHotelCode: hotelData.id, // Use the ID of the hotel being MODIFIED as oldHotelCode
                newHotelDetails: formattedNewHotelDetails, // Formatted payload
            };

            console.log("Calling PUT /api/itinerary/:itineraryToken/hotel with payload:", JSON.stringify(replaceHotelRequestPayload, null, 2));
            const replaceApiUrl = `http://localhost:5000/api/itinerary/${itineraryToken}/hotel`;
            const replaceResponse = await fetch(replaceApiUrl, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'X-Inquiry-Token': inquiryToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(replaceHotelRequestPayload)
            });

            const replaceData = await replaceResponse.json();
            console.log('PUT /hotel response:', replaceData);

            if (!replaceResponse.ok || !replaceData.success) {
                throw new Error(replaceData.message || 'Failed to replace hotel in itinerary.');
            }
            
            // --- Success --- 
            toast.success(replaceData.message || 'Hotel modified successfully!');
            if (replaceData.partialSuccess && replaceData.transferUpdateFailed) {
                toast.warn("Hotel modified, but automatic transfer updates failed. Please check transfers manually.");
            }
            if (onUpdateItinerary) {
                onUpdateItinerary(); // Trigger itinerary refresh
            }
            onClose(); // Close modal

        } catch (error) {
            console.error("Error during Confirm Selection / Replace Hotel:", error);
            setErrorMessage(error.message || "Failed to confirm selection or replace hotel.");
            toast.error(error.message || "Failed to confirm selection or replace hotel.");
            // Stay in itinerary view on error?
        } finally {
            setIsLoadingSelection(false); // Turn off combined loading state
            // setIsLoadingReplacement(false); // No longer separate
        }
    };

    // --- Guest Info Submission Logic --- 
    const handleGuestInfoSubmit = async (/* guestAllocationData ? */) => {
        // This function will be called by GuestInfoModal on success
        // It needs the data structure returned by GuestInfoModal or selectRoomRates response
        setIsLoadingAllocation(true);
        setErrorMessage('');
        
        console.log("Guest Info Submitted (Placeholder)", /* guestAllocationData, */ selectRoomResponseData);
        toast.info("Guest allocation step placeholder. Need to implement allocateGuests call.");

        // TODO: Implement allocateGuests API call using selectRoomResponseData data
        // try {
        //     const allocationPayload = { ... }; // Construct payload for allocateGuests
        //     const allocationResponse = await bookingService.allocateGuests(allocationPayload);
        //     if (allocationResponse.success) {
        //         toast.success("Guests allocated!");
        //         // TODO: Trigger final booking/update step? 
        //         // const finalBookingResponse = await bookingService.bookHotel(...); 
        //         onClose(allocationResponse); // Or pass final booking response back
        //     } else {
        //         throw new Error(allocationResponse.message || "Guest allocation failed.");
        //     }
        // } catch (error) { ... handle error ... } 
        
        setIsLoadingAllocation(false);
        // For now, just close the modal after placeholder
         onClose({ placeholder: true, message: "Guest info submitted, next steps pending." }); 
    };

    // --- Back Button Logic ---
    const handleBack = () => {
        if (viewState === 'itinerary') {
            setViewState('form');
            setItineraryData(null);
            setSelectedRooms([]);
            setErrorMessage('');
        }
        // Add other back transitions if needed (e.g., from guestInfo back to itinerary)
    };

    // --- RENDER FUNCTIONS ---

    const renderLoading = (message = "Loading...") => (
        <div className="flex flex-col items-center justify-center p-10 space-y-3">
            <LoadingIcon className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-gray-600">{message}</p>
        </div>
    );

    const renderSearchForm = () => (
        <>
            {/* Form Content */}
             <div className="mt-2 space-y-4">
                {/* Hotel Name, Dates, Guests Button */}
                 <div>
                      <label className="block text-sm font-medium text-gray-700">Hotel</label>
                      <p className="mt-1 text-md font-semibold text-gray-800 bg-gray-100 p-2 rounded border border-gray-200 truncate" title={hotelName}>
                        {hotelName}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkInModify" className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                        <div className="relative">
                           <input type="date" id="checkInModify" name="checkIn" value={checkInDate} onChange={handleDateChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                           <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="checkOutModify" className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                        <div className="relative">
                           <input type="date" id="checkOutModify" name="checkOut" min={checkInDate ? new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate() + 1)).toISOString().split('T')[0] : ''} value={checkOutDate} onChange={handleDateChange} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                           <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Guests & Rooms</label>
                      <button type="button" onClick={openRoomModal} className="w-full flex justify-between items-center text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                        <span className="flex items-center text-sm text-gray-700">
                            <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                            {getTotalGuests(roomConfig)} Guests, {roomConfig.length} Rooms
                        </span>
                        <span className="text-sm font-medium text-indigo-600">Change</span>
                      </button>
                    </div>
            </div>
            {errorMessage && <p className="text-red-600 text-sm mt-2">{errorMessage}</p>}
            {/* Footer Buttons */}
             <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                 <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" onClick={onClose}>Cancel</button>
                 <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    onClick={handleSearchAndCreateItinerary}
                    disabled={isLoadingSearch || isLoadingItinerary}
                 >
                    {(isLoadingSearch || isLoadingItinerary) && (
                       <LoadingIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                    )}
                     {isLoadingSearch ? 'Searching...' : isLoadingItinerary ? 'Creating Itinerary...' : 'Search Availability'}
                 </button>
             </div>
        </>
    );

    const renderItineraryView = () => {
        if (!itineraryData) return renderLoading("Loading itinerary details...");

        const hotelDisplayData = itineraryData?.data?.results?.[0]?.data?.[0]?.hotel;
        const roomRateDisplayData = itineraryData?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];
        const groupedRecommendations = Object.entries(roomRateDisplayData?.recommendations || {}).reduce(
             (acc, [recKey, rec]) => {
                 if (!rec?.rates) return acc;
                 const groupId = rec.groupId;
                 if (!acc[groupId]) acc[groupId] = [];
                 acc[groupId].push({ ...rec, id: recKey }); 
                 return acc;
             },
             {}
         );
        const standardRoomsData = roomRateDisplayData?.standardizedRooms;

        return (
            <>
                 <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4 mb-4">
                     {/* Display basic hotel info if needed */} 
                     <h4 className="text-md font-medium text-gray-800">Select Room Option for {hotelDisplayData?.name || 'Hotel'}:</h4>
                     {errorMessage && <p className="text-red-600 text-sm mb-2">{errorMessage}</p>}
                     
                     {Object.keys(groupedRecommendations).length > 0 && standardRoomsData ? (
                         Object.entries(groupedRecommendations).map(([groupId, recs]) => {
                             const standardRoom = standardRoomsData[groupId];
                             if (!standardRoom) return null;
                             return (
                                 <div key={groupId} className="mb-3 sm:mb-4">
                                     {/* Header for room type */} 
                                      <div className="flex items-center justify-between p-3 bg-gray-100 rounded-t-lg border border-b-0 border-gray-200">
                                         <h3 className="text-base font-semibold text-gray-900">{standardRoom.name}</h3>
                                         <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded-full">{recs.length} options</span>
                                     </div>
                                     {/* List of recommendations */} 
                                      <div className="space-y-2 border border-t-0 border-gray-200 rounded-b-lg p-2">
                                         {recs.map((rec) => {
                                             const isSelected = selectedRooms.some(sr => sr.roomDetails.recommendationId === rec.id);
                                             const totalPrice = calculateTotalPrice(rec, itineraryData);
                                             const firstRate = getRateDetails(rec.rates?.[0], itineraryData);
                                             return (
                                                 <div key={rec.id} onClick={() => handleRoomSelect(rec)} className={`cursor-pointer p-3 rounded-md ${isSelected ? "bg-blue-50 border border-blue-500 ring-1 ring-blue-500" : "bg-white border border-gray-200 hover:border-blue-300"} transition-all duration-150 shadow-sm`}>
                                                     <div className="space-y-2">
                                                         {rec.rates.map((rateId) => {
                                                             const rate = getRateDetails(rateId, itineraryData);
                                                             if (!rate?.occupancies) return null;
                                                             return rate.occupancies.map((occupancy, occIndex) => {
                                                                 const room = getRoomDetailsFromOccupancy(occupancy, itineraryData);
                                                                 if (!room) return null;
                                                                 return (
                                                                     <div key={`${rateId}-${occIndex}`} className="text-xs sm:text-sm text-gray-600 border-b border-dashed last:border-b-0 pb-1 mb-1">
                                                                          <p>Adults: {occupancy.numOfAdults}{occupancy.numOfChildren > 0 ? `, Children: ${occupancy.numOfChildren}` : ''}</p>
                                                                          {rate.boardBasis?.description && (<p>{rate.boardBasis.description}</p>)}
                                                                          <p>{rate.refundable ? "Refundable" : "Non-refundable"}</p>
                                                                     </div>
                                                                 );
                                                             });
                                                         })}
                                                         <div className="text-right font-semibold text-base text-blue-600">
                                                             {firstRate?.currency || "USD"} {totalPrice.toLocaleString()}
                                                              {isSelected && <CheckCircleIcon className="w-5 h-5 inline-block ml-2 text-green-600" />} 
                                                         </div>
                                                     </div>
                                                 </div>
                                             );
                                         })}
                                     </div>
                                 </div>
                             );
                         })
                     ) : (
                         <p className="text-center text-gray-500 py-4">No room options available in the created itinerary.</p>
                     )}
                 </div>
                 {/* Footer Buttons for Itinerary View - Updated disabled logic */} 
                  <div className="mt-6 flex justify-between items-center border-t pt-4">
                     <button 
                        type="button" 
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" 
                        onClick={handleBack} 
                        disabled={isLoadingSelection || isLoadingReplacement} // Disable if selecting or replacing
                     >
                        Back
                     </button>
                     <button 
                        type="button" 
                        className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed" 
                        onClick={handleConfirmSelection} 
                        disabled={selectedRooms.length === 0 || isLoadingSelection || isLoadingReplacement} // Disable if no selection or loading
                     >
                         {(isLoadingSelection || isLoadingReplacement) && (
                             <LoadingIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                         )}
                         {isLoadingSelection ? 'Selecting Rate...' : isLoadingReplacement ? 'Replacing Hotel...' : 'Confirm Selection'}
                     </button>
                 </div>
            </>
        );
    };

    // --- Main Render --- 
    return (
        <>
            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-40" onClose={(isLoadingSearch || isLoadingItinerary || isLoadingSelection || isLoadingReplacement || isLoadingAllocation) ? () => {} : onClose}>
                     {/* Backdrop */} 
                     <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                         <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                     </Transition.Child>
                    {/* Modal Content */} 
                     <div className="fixed inset-0 overflow-y-auto">
                         <div className="flex min-h-full items-center justify-center p-4 text-center">
                             <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                                 <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                                     {/* Header - Updated disabled logic */} 
                                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center border-b pb-3 mb-4">
                                           <span>{viewState === 'form' ? 'Modify Hotel Stay' : viewState === 'itinerary' ? 'Select New Room/Rate' : 'Provide Guest Details'}</span> 
                                         <button 
                                            type="button" 
                                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" 
                                            onClick={onClose} 
                                            disabled={isLoadingSearch || isLoadingItinerary || isLoadingSelection || isLoadingReplacement || isLoadingAllocation} // Disable close if any loading active
                                         >
                                             <XMarkIcon className="h-6 w-6" />
                                         </button>
                                     </Dialog.Title>
                                     {/* Content based on viewState */} 
                                      <div className="mt-4">
                                         {/* Always render form if viewState is 'form', handle loading within the button */} 
                                         {viewState === 'form' && renderSearchForm()} 
                                         {viewState === 'itinerary' && renderItineraryView()} 
                                         {/* Add rendering for guestInfo state if needed, or handle via separate modal */} 
                                         {isLoadingAllocation && renderLoading("Allocating guests...")} 
                                     </div>
                                 </Dialog.Panel>
                             </Transition.Child>
                         </div>
                     </div>
                </Dialog>
            </Transition>

            {/* Room Arrangement Modal (for form view) */} 
             <RoomArrangementModal isOpen={isRoomModalOpen} onClose={closeRoomModal} initialRooms={roomConfig} onSave={handleRoomSave} />

            {/* Guest Info Modal (conditionally rendered) */} 
             {/* ... (Guest Info placeholder) ... */}
        </>
    );
};

export default CrmHotelModifyModal; 