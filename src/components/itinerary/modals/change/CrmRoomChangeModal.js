import axios from 'axios';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // Use toast for feedback

// Loading Skeleton Component (Copied from B2C)
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 w-1/4 bg-gray-200 rounded"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
          <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const CrmRoomChangeModal = ({
  isOpen, // Controlled by parent
  onClose, // Function to close modal
  hotel, // Full hotel object might not be needed, but pass for now
  hotelId,
  traceId,
  itineraryToken,
  inquiryToken,
  city,
  date, // The specific date for this hotel stay (Check-in)
  dates, // Object { checkIn, checkOut }
  existingPrice, // Price of the current room(s)
  // No onUpdate prop needed if we are just reloading
}) => {

  // Internal State
  const [isFetchingRooms, setIsFetchingRooms] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [hotelRoomDetails, setHotelRoomDetails] = useState(null); // Stores the response from /rooms
  const [expandedSections, setExpandedSections] = useState({});

  // Derived data helper
  const roomRateData = hotelRoomDetails?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

  // Fetch room recommendations when modal opens or key props change
  useEffect(() => {
    if (isOpen && hotelId && traceId && inquiryToken && city && date) {
      const fetchRoomDetails = async () => {
        setIsFetchingRooms(true);
        setFetchError(null);
        setHotelRoomDetails(null); // Clear previous details
        setSelectedRecommendation(null); // Clear selection
        setExpandedSections({}); // Collapse sections
        try {
          // Use the checkIn date from the 'dates' prop for the API call
          const checkInDateForAPI = dates?.checkIn || date;
          const response = await axios.get(
            // Use relative path assuming proxy is set up, or full URL
            `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/rooms`,
            {
              params: {
                traceId,
                cityName: city,
                checkIn: checkInDateForAPI, // Use checkIn date
              },
              headers: {
                'X-Inquiry-Token': inquiryToken,
                'Authorization': `Bearer ${localStorage.getItem('crmToken')}` // CRM Auth Token
              },
            }
          );
          setHotelRoomDetails(response.data);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to fetch room options.";
            console.error("Error fetching room details:", error);
            setFetchError(errorMsg);
            toast.error(`Error fetching rooms: ${errorMsg}`);
        } finally {
          setIsFetchingRooms(false);
        }
      };
      fetchRoomDetails();
    } else {
        // Clear data if modal is closed or required props are missing
        setHotelRoomDetails(null);
        setFetchError(null);
        setIsFetchingRooms(false);
        setSelectedRecommendation(null);
        setConfirmError(null);
    }
  // Use dates.checkIn in dependency array if it's the primary date used
  }, [isOpen, hotelId, traceId, inquiryToken, city, dates?.checkIn]); // Updated dependencies


  // --- Helper functions (Adapted from B2C) ---
  const getRateDetails = (rateId) => roomRateData?.rates?.[rateId];

  const getRoomDetailsFromOccupancy = (occupancy) => {
    if (!occupancy || !roomRateData?.rooms) return null;
    const room = roomRateData.rooms[occupancy.roomId];
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

  const calculateTotalPrice = (recommendation) => {
    if (!recommendation?.rates) return 0;
    return recommendation.rates.reduce((total, rateId) => {
      const rate = getRateDetails(rateId);
      return total + (rate?.finalRate || 0);
    }, 0);
  };

  const getGroupedRecommendations = () => {
    if (!roomRateData?.recommendations) return {};
    return Object.entries(roomRateData.recommendations).reduce(
      (acc, [recKey, rec]) => {
        if (!rec?.rates) return acc;
        const groupId = rec.groupId;
        if (!acc[groupId]) {
          acc[groupId] = [];
        }
        acc[groupId].push({ ...rec, id: recKey });
        return acc;
      },
      {}
    );
  };

  const toggleSection = (groupId) => {
    setExpandedSections(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };
  // --- End Helper Functions ---

  // --- Handle Room Change Confirmation ---
  const handleConfirm = async () => {
    if (!selectedRecommendation || !roomRateData || !hotelRoomDetails) return;

    setIsConfirming(true);
    setConfirmError(null);

    try {
      // 1. Prepare room allocations for select-room API
      const selectedRates = selectedRecommendation.rates
        .map((rateId) => roomRateData.rates[rateId])
        .filter(Boolean);

      const roomsAndRateAllocations = selectedRates.map((rate) => ({
        rateId: rate.id,
        roomId: rate.occupancies[0].roomId,
        occupancy: {
          adults: rate.occupancies[0].numOfAdults,
          ...(rate.occupancies[0].numOfChildren > 0 && {
            childAges: rate.occupancies[0].childAges,
          }),
        },
      }));

      // 2. Call select-room API
      const selectRoomResponse = await axios.post(
        `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${hotelId}/select-room`,
        {
          roomsAndRateAllocations,
          recommendationId: selectedRecommendation.id,
          items: hotelRoomDetails?.data?.results?.[0]?.items, // Pass items from /rooms response
          itineraryCode: hotelRoomDetails?.data?.results?.[0]?.itinerary?.code, // Pass itinerary code
          traceId: hotelRoomDetails?.data?.results?.[0]?.traceId, // Use traceId from /rooms response
          inquiryToken, // Already have this prop
          cityName: city, // Already have this prop
          checkIn: dates.checkIn, // Pass check-in from dates prop
        },
        {
          headers: {
            'X-Inquiry-Token': inquiryToken,
            'Authorization': `Bearer ${localStorage.getItem('crmToken')}` // CRM Auth
          },
        }
      );

      if (!selectRoomResponse.data || !selectRoomResponse.data.success) {
        throw new Error(selectRoomResponse.data.message || 'Failed to select room rate.');
      }

      toast.success("Room rate selected successfully.");

      // 3. Call replace-room API
      const replaceRoomResponse = await axios.put(
        `http://localhost:5000/api/itinerary/${itineraryToken}/room`,
        {
          cityName: city,
          date: dates.checkIn, // Use the checkIn date prop
          newHotelDetails: { // Construct payload based on API needs
            ...selectRoomResponse.data.data,
            // Ensure checkIn/checkOut are correctly formatted if needed
            checkIn: selectRoomResponse.data.data.searchRequestLog.checkIn,
            checkOut: selectRoomResponse.data.data.searchRequestLog.checkOut
          }
        },
        {
          headers: {
            'X-Inquiry-Token': inquiryToken,
            'Authorization': `Bearer ${localStorage.getItem('crmToken')}` // CRM Auth
          },
        }
      );

      if (!replaceRoomResponse.data || !replaceRoomResponse.data.success) {
          throw new Error(replaceRoomResponse.data.message || 'Failed to update itinerary with new room.');
      }

      toast.success("Room updated successfully in itinerary!");

      // Close modal and reload page
      onClose();
      window.location.reload();

    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || "Failed to change room";
        console.error("Error changing room:", error);
        setConfirmError(errorMsg);
        toast.error(`Error: ${errorMsg}`);
    } finally {
        setIsConfirming(false);
    }
  };
  // --- End Confirmation Handler ---

  // --- Render Functions (Adapted from B2C) ---
  const renderRecommendationDetails = (recommendation) => {
    if (!recommendation?.rates) return null;
    const rates = recommendation.rates.map((rateId) => getRateDetails(rateId));
    const totalPrice = calculateTotalPrice(recommendation);
    const firstRate = rates[0];

    return (
      <div className="space-y-3">
        {rates.map((rate, index) => {
          if (!rate?.occupancies) return null;
          return rate.occupancies.map((occupancy, occIndex) => {
            const room = getRoomDetailsFromOccupancy(occupancy);
            if (!room) return null;
            return (
              <div key={`${index}-${occIndex}`} className="border-b pb-3 last:border-b-0">
                <p className="font-medium text-sm sm:text-base">{room.name}</p>
                <div className="text-xs sm:text-sm text-gray-600">
                  <p>Adults: {occupancy.numOfAdults}</p>
                  {occupancy.numOfChildren > 0 && (
                    <p>
                      Children: {occupancy.numOfChildren}
                      {occupancy.childAges?.length > 0 && ` (Ages: ${occupancy.childAges.join(", ")})`}
                    </p>
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  <p>{rate.refundable ? "Refundable" : "Non-refundable"}</p>
                  {rate.boardBasis?.description && (<p>{rate.boardBasis.description}</p>)}
                </div>
              </div>
            );
          });
        })}
        <div className="text-right font-semibold text-base sm:text-lg text-indigo-600">
          {firstRate?.currency || "INR"} {totalPrice.toLocaleString('en-IN')}
        </div>
      </div>
    );
  };

  const renderRoomTypeSection = (groupId, recommendations) => {
    const standardRoom = roomRateData?.standardizedRooms?.[groupId];
    if (!standardRoom) return null;
    const isExpanded = expandedSections[groupId];

    return (
      <div key={groupId} className="mb-3 sm:mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:border-indigo-300 transition-all duration-200"
        >
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{standardRoom.name}</h3>
            {standardRoom.type && (<p className="text-xs sm:text-sm text-gray-500 truncate">{standardRoom.type}</p>)}
          </div>
          <div className="flex items-center ml-2 sm:ml-4">
            <div className="text-xs sm:text-sm text-gray-600 mr-2">{recommendations.length} option{recommendations.length !== 1 ? "s" : ""}</div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2 pl-4 md:pl-6">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                onClick={() => setSelectedRecommendation(rec)}
                className={`cursor-pointer p-3 sm:p-4 rounded-lg transition-all duration-200 shadow-sm ${ selectedRecommendation?.id === rec.id
                    ? "bg-indigo-50 border-2 border-indigo-400"
                    : "bg-white border border-gray-200 hover:border-indigo-300"
                }`}
              >
                {renderRecommendationDetails(rec)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  // --- End Render Functions ---

  // Don't render modal if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 pt-10 backdrop-blur-sm">
      {/* Modal Content */}
      <div className="bg-gray-50 w-full md:rounded-lg h-full md:h-auto md:w-[90%] md:max-w-3xl md:max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 p-4 border-b flex justify-between items-center rounded-t-lg flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Change Room Option</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-colors"
            disabled={isConfirming}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow">
          {isFetchingRooms ? (
            <LoadingSkeleton />
          ) : fetchError ? (
             <div className="text-center text-red-600 bg-red-50 p-4 rounded border border-red-200">
                <AlertTriangle className="w-5 h-5 inline mr-2"/> Error: {fetchError}
             </div>
          ) : hotelRoomDetails && roomRateData ? (
            <div className="space-y-4">
              {/* Price Alert */}
              {typeof existingPrice === 'number' && selectedRecommendation && (
                 <div className={`rounded-md p-3 text-sm ${ existingPrice > calculateTotalPrice(selectedRecommendation)
                     ? "bg-green-50 border border-green-200 text-green-800"
                     : "bg-yellow-50 border border-yellow-200 text-yellow-800"
                 }`}>                   Current price: ₹{existingPrice.toLocaleString('en-IN')}{selectedRecommendation && ` → New price: ₹${calculateTotalPrice(selectedRecommendation).toLocaleString('en-IN')}`}                 </div>
              )}

              {/* Room Types */}
              <div className="space-y-3 sm:space-y-4">
                {Object.keys(getGroupedRecommendations()).length > 0 ?
                  Object.entries(getGroupedRecommendations()).map(([groupId, recs]) =>
                    renderRoomTypeSection(groupId, recs)
                  ) :
                  <p className="text-center text-gray-500 italic py-4">No alternative room options found for this hotel.</p>
                }
              </div>
            </div>
          ) : (
             <div className="text-center text-gray-500 italic py-4">
                Loading room options...
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t p-4 rounded-b-lg flex-shrink-0">
          {confirmError && (
            <div className="text-red-600 text-sm mb-2 text-center">
                <AlertTriangle className="w-4 h-4 inline mr-1"/> {confirmError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors"
              disabled={isConfirming}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedRecommendation || isConfirming || isFetchingRooms}
              className={`px-4 py-2 rounded-md text-white text-sm font-medium transition-colors flex items-center justify-center ${ (!selectedRecommendation || isConfirming || isFetchingRooms)
                ? "bg-indigo-300 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            }`}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  Confirming...
                </>
              ) : (
                "Confirm New Room"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrmRoomChangeModal;
