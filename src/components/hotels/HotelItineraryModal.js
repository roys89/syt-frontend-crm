import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import GuestInfoModal from './GuestInfoModal';

const HotelItineraryModal = ({ hotel, itineraryData, onClose, onSubmit }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState({});
  const [expandedSections, setExpandedSections] = useState({
    facilities: false,
    gallery: false,
    policies: false,
    attractions: false,
    reviews: false
  });
  const [activeImageCategory, setActiveImageCategory] = useState(null);
  const [bookingStatus] = useState({
    loading: false,
    success: false,
    error: null,
    message: null,
    partialSuccess: false
  });
  const [roomRatesResponse, setRoomRatesResponse] = useState(null);

  // Get hotel data from itineraryData
  const hotelData = itineraryData?.data?.results?.[0]?.data?.[0]?.hotel;
  const roomRateData = itineraryData?.data?.results?.[0]?.data?.[0]?.roomRate?.[0];

  const handleRoomSelect = (recommendation) => {
    if (!recommendation?.rates) return;
  
    // Get all rooms from the recommendation
    const selectedRooms = recommendation.rates.map(rateId => {
      const rate = getRateDetails(rateId);
      if (!rate?.occupancies) return null;
  
      const occupancy = rate.occupancies[0];
      const room = getRoomDetailsFromOccupancy(occupancy);
      if (!room) return null;
  
      return {
        rateId: rateId,
        roomId: occupancy.roomId,
        occupancy: {
          adults: occupancy.numOfAdults,
          childAges: occupancy.childAges || []
        },
        roomDetails: {
          ...room,
          recommendationId: recommendation.id
        }
      };
    }).filter(Boolean); // Remove any null entries
  
    // Update selected rooms with all rooms from the recommendation
    setSelectedRooms(selectedRooms);
  };

  const handleConfirmSelection = async () => {
    try {
      setIsLoading(true);
      if (selectedRooms.length === 0) {
        toast.error('No room selected');
        return;
      }
    
      // Get the recommendation ID from the first selected room
      const recommendationId = selectedRooms[0].roomDetails?.recommendationId;
      if (!recommendationId) {
        toast.error('Invalid room selection');
        return;
      }
    
      // Get the rates from the recommendation
      const recommendation = roomRateData?.recommendations?.[recommendationId];
      if (!recommendation?.rates) {
        toast.error('No rates available for selected room');
        return;
      }
    
      // Get data from the correct paths
      const traceId = itineraryData?.data?.results?.[0]?.traceId;
      const items = itineraryData?.data?.results?.[0]?.items;
      const itinerary = itineraryData?.data?.results?.[0]?.itinerary?.code;
    
      console.log('Selected rooms:', selectedRooms);
      console.log('Current itineraryData:', itineraryData);
    
      // Prepare the request payload using each room's specific occupancy
      const requestPayload = {
        roomsAndRateAllocations: selectedRooms.map(room => ({
          rateId: room.rateId,
          roomId: room.roomId,
          occupancy: {
            adults: room.occupancy.adults,
            childAges: room.occupancy.childAges || []
          }
        })),
        traceId: traceId,
        recommendationId: recommendationId,
        itineraryCode: itinerary,
        items: items
      };
    
      console.log('Room rates request payload:', requestPayload);
    
      const response = await bookingService.selectRoomRates(requestPayload);
    
      console.log('Room rates API response:', response);
    
      if (response.success) {
        setRoomRatesResponse(response);
        console.log('Room rates response data structure:', JSON.stringify(response, null, 2));
        console.log('Selected rooms and rates:', response?.data?.data?.results?.[0]?.items?.[0]?.selectedRoomsAndRates);
        toast.success('Room rates selected successfully');
        setShowGuestInfoModal(true);
      } else {
        toast.error(response.message || 'Failed to select room rates');
      }
    } catch (error) {
      console.error('Error selecting room rates:', error);
      toast.error('Failed to select room rates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestInfoSubmit = async (bookingData) => {
    try {
      setIsLoading(true);
      
      if (bookingData.results && bookingData.results[0] && bookingData.results[0].data) {
        // We received booking confirmation data
        setShowGuestInfoModal(false);
        // Pass booking data to parent
        onSubmit(bookingData);
      } else {
        // We received guest allocation data (old flow)
        const traceId = itineraryData?.data?.results?.[0]?.traceId;
        const items = itineraryData?.data?.results?.[0]?.items;
        const itineraryCode = itineraryData?.data?.results?.[0]?.code;
        
        if (!traceId || !items || !itineraryCode) {
          throw new Error("Missing required itinerary data");
        }
    
        const selectedRoomsAndRates = items[0]?.selectedRoomsAndRates || [];
        if (selectedRoomsAndRates.length === 0) {
          throw new Error("No rooms were selected");
        }
      }
    } catch (error) {
      console.error('Error processing booking data:', error);
      toast.error(error.message || 'Failed to complete booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Group recommendations by standardized room type
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

  // Helper functions
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

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderCollapsibleSection = (title, content, sectionId, count) => {
    // Skip rendering the reviews section
    if (sectionId === "reviews") return null;
    
    const isExpanded = expandedSections[sectionId];
    return (
      <div className="border-t pt-6 mt-6">
        <div 
          onClick={() => toggleSection(sectionId)}
          className="flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center">
            <h3 className="text-lg font-semibold">{title}</h3>
            {count !== undefined && (
              <span className="ml-2 text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? "transform rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isExpanded && (
          <div className="mt-4 animate-fadeIn">
            {content}
          </div>
        )}
      </div>
    );
  };

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
                <p className="font-medium">{room.name}</p>
                <div className="text-xs sm:text-sm text-gray-600">
                  <p>Adults: {occupancy.numOfAdults}</p>
                  {occupancy.numOfChildren > 0 && (
                    <p>
                      Children: {occupancy.numOfChildren}
                      {occupancy.childAges?.length > 0 &&
                        ` (Ages: ${occupancy.childAges.join(", ")})`}
                    </p>
                  )}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-gray-600">
                  <p>{rate.refundable ? "Refundable" : "Non-refundable"}</p>
                  {rate.boardBasis?.description && (
                    <p>{rate.boardBasis.description}</p>
                  )}
                </div>
              </div>
            );
          });
        })}
        <div className="text-right font-semibold text-base sm:text-lg text-blue-600">
          {firstRate?.currency || "USD"} {totalPrice.toLocaleString()}
        </div>
      </div>
    );
  };

  const renderRoomTypeSection = (groupId, recommendations) => {
    const standardRoom = roomRateData?.standardizedRooms?.[groupId];
    if (!standardRoom) return null;
  
    const isExpanded = expandedSections[groupId];
    const hasImage = standardRoom.images?.[0]?.links;
    const imageUrl = imageErrorMap[groupId] 
      ? "/api/placeholder/96/96"
      : (hasImage ? standardRoom.images[0].links.find((l) => l.size === "Standard")?.url : "/api/placeholder/96/96");
  
    return (
      <div key={groupId} className="mb-3 sm:mb-4">
        <div
          onClick={() => toggleSection(groupId)}
          className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-200 transition-all duration-200"
        >
          <div className="flex items-center space-x-3 sm:space-x-4">
            <img
              src={imageUrl}
              alt={standardRoom.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-sm"
              onError={() => {
                if (!imageErrorMap[groupId]) {
                  setImageErrorMap(prev => ({
                    ...prev,
                    [groupId]: true
                  }));
                }
              }}
            />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {standardRoom.name}
              </h3>
              {standardRoom.type && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">{standardRoom.type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center ml-2 sm:ml-4">
            <div className="text-xs sm:text-sm text-gray-600 mr-2 bg-gray-100 px-2 py-1 rounded-full">
              {recommendations.length} option{recommendations.length !== 1 ? "s" : ""}
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${
                isExpanded ? "transform rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 space-y-2">
            {recommendations.map((rec, index) => {
              // Get the first room ID from the first rate's first occupancy
              const firstRate = rec.rates?.[0];
              const firstOccupancy = getRateDetails(firstRate)?.occupancies?.[0];
              const roomId = firstOccupancy?.roomId;
              
              // Check if this specific recommendation is selected
              const isSelected = selectedRooms.some(room => room.roomDetails.recommendationId === rec.id);

              return (
                <div
                  key={rec.id}
                  onClick={() => handleRoomSelect(rec)}
                  className={`cursor-pointer p-3 sm:p-4 rounded-lg ${
                    isSelected
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-white border border-gray-100 hover:border-blue-200"
                  } transition-all duration-200 shadow-sm`}
                >
                  {renderRecommendationDetails(rec)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Get image URL with fallback
  const imageUrl = hotel.images?.[0]?.links?.find((link) => link.size === "Standard")?.url 
    || hotel.heroImage 
    || "/api/placeholder/800/400";

  // Get image categories from the API response
  useEffect(() => {
    if (hotel.imagesAndCaptions && Object.keys(hotel.imagesAndCaptions).length > 0) {
      setActiveImageCategory(Object.keys(hotel.imagesAndCaptions)[0]);
    }
  }, [hotel.imagesAndCaptions]);
  
  const groupedRecommendations = getGroupedRecommendations();

  return (
    <>
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg w-full">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{hotel.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {hotel.starRating && (
                <div className="flex items-center text-yellow-400">
                  {[...Array(parseInt(hotel.starRating))].map((_, i) => (
                    <span key={i} className="text-xl">★</span>
                  ))}
                </div>
              )}
              
              {hotel.reviews?.[0]?.rating && (
                <div className="flex items-center bg-green-50 px-2 py-1 rounded">
                  <span className="font-bold text-green-700">{hotel.reviews[0].rating}/5</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{hotel.reviews[0].count} reviews</span>
                </div>
              )}
              
              {hotel.contact?.address?.city?.name && (
                <span className="text-sm text-gray-600">
                  {hotel.contact.address.city.name}, {hotel.contact.address.country?.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Results
          </button>
        </div>

        {/* Content */}
        <div>
          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main Hotel Image and Info */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative rounded-lg overflow-hidden shadow-md">
                    <img
                      src={imageUrl}
                      alt={hotel.name}
                      className="w-full h-64 sm:h-80 object-cover"
                      onError={(e) => {
                        if (!imageError) {
                          setImageError(true);
                          e.target.src = "/api/placeholder/400/300";
                        }
                      }}
                    />
                    {hotel.type && (
                      <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {hotel.type}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {hotel.descriptions?.find(desc => desc.type === "headline") && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h3 className="text-blue-800 font-medium">
                          {hotel.descriptions.find(desc => desc.type === "headline").text}
                        </h3>
                      </div>
                    )}

                    {hotel.descriptions?.find(desc => desc.type === "location") && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">Location</h4>
                        <p className="text-gray-600 text-sm">
                          {hotel.descriptions.find(desc => desc.type === "location").text}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            
              {/* Description from API */}
              {hotel.descriptions?.find(desc => desc.type === "amenities") && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">About This Property</h3>
                  <p className="text-gray-600">
                    {hotel.descriptions.find(desc => desc.type === "amenities").text}
                  </p>
                </div>
              )}

              {/* Room Types */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Available Room Types</h3>
                <div className="space-y-4">
                  {Object.entries(groupedRecommendations).map(([groupId, recs]) => 
                    renderRoomTypeSection(groupId, recs)
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Info Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                {hotel.contact?.address && (
                  <div className="flex items-start mb-4">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p>{hotel.contact.address.line1}</p>
                      {hotel.contact.address.line2 && <p>{hotel.contact.address.line2}</p>}
                      <p>{hotel.contact.address.city?.name}, {hotel.contact.address.country?.name}</p>
                      <p>{hotel.contact.address.postalCode}</p>
                    </div>
                  </div>
                )}
                
                {hotel.contact?.phones && hotel.contact.phones.length > 0 && (
                  <div className="flex items-start mb-4">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p>{hotel.contact.phones[0]}</p>
                    </div>
                  </div>
                )}
                
                {hotel.contact?.email && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p>{hotel.contact.email}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hotel Info Card */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Hotel Highlights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Check-in</span>
                    <span className="font-medium">{hotel.checkinInfo?.beginTime || '3:00 PM'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Check-out</span>
                    <span className="font-medium">{hotel.checkoutInfo?.time || '12:00 PM'}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {hotel.facilityGroups?.slice(0, 8).map(group => (
                      <div key={group.id} className="flex items-center">
                        <div className="bg-blue-100 p-1 rounded-full mr-2 flex-shrink-0">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 truncate">{group.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Rating Card */}
              {hotel.reviews && hotel.reviews[0] && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Guest Reviews</h3>
                  <div className="flex items-center mb-4">
                    <div className="bg-green-100 text-green-800 text-2xl font-bold rounded-lg p-3 mr-3 flex-shrink-0">
                      {hotel.reviews[0].rating}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Overall Rating</div>
                      <div className="text-sm text-gray-600">Based on {hotel.reviews[0].count} reviews</div>
                    </div>
                  </div>
                  
                  {hotel.reviews[0].categoryratings && (
                    <div className="space-y-2">
                      {hotel.reviews[0].categoryratings.map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {category.category.replace('_', ' ')}
                          </span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 rounded-full bg-gray-200 mr-2">
                              <div 
                                className="h-2 rounded-full bg-green-600" 
                                style={{ width: `${Math.min(100, (parseFloat(category.rating) / 5) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{category.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Facilities & Amenities */}
          {hotel.groupedFacilities && hotel.groupedFacilities.length > 0 && renderCollapsibleSection(
            "Facilities & Amenities",
            <div>
              {hotel.groupedFacilities.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hotel.groupedFacilities.map((group) => (
                    <div key={group.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="font-medium text-gray-800 mb-2">{group.name}</h4>
                      <div className="space-y-2">
                        {group.facilities.map((facility) => (
                          <div key={facility.id} className="flex items-center">
                            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600">{facility.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>,
            "facilities",
            hotel.facilities?.length
          )}

          {/* Nearby Attractions */}
          {hotel.nearByAttractions && hotel.nearByAttractions.length > 0 && renderCollapsibleSection(
            "Nearby Attractions",
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotel.nearByAttractions.map((attraction, index) => (
                <div key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{attraction.name}</h4>
                    <p className="text-sm text-gray-600">
                      {attraction.distance} {attraction.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>,
            "attractions",
            hotel.nearByAttractions?.length
          )}

          {/* Image Gallery */}
          {hotel.imagesAndCaptions && Object.keys(hotel.imagesAndCaptions).length > 0 && renderCollapsibleSection(
            "Image Gallery",
            <div>
              <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                {Object.keys(hotel.imagesAndCaptions).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveImageCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${
                      activeImageCategory === category
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    {hotel.imagesAndCaptions[category].captionLabel || category}
                    <span className="ml-1 text-xs">
                      ({hotel.imagesAndCaptions[category].images.length})
                    </span>
                  </button>
                ))}
              </div>
              
              {activeImageCategory && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {hotel.imagesAndCaptions[activeImageCategory].images.map((image, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden shadow-sm group">
                      <img
                        src={image.links?.find(link => link.size === "Standard")?.url}
                        alt={`${hotel.name} - ${hotel.imagesAndCaptions[activeImageCategory].captionLabel} ${index + 1}`}
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                          {image.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>,
            "gallery",
            Object.values(hotel.imagesAndCaptions || {}).reduce((count, category) => count + category.images.length, 0)
          )}

          {/* Reviews */}
          {hotel.reviews && hotel.reviews.length > 0 && renderCollapsibleSection(
            "Guest Reviews",
            <div>
              {hotel.reviews[0]?.categoryratings && (
                <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex items-center mb-3">
                    <div className="bg-green-100 text-green-800 text-xl font-bold rounded-lg p-3 mr-3">
                      {hotel.reviews[0].rating}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Overall Rating</h4>
                      <p className="text-sm text-gray-600">Based on {hotel.reviews[0].count} reviews</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.reviews[0].categoryratings.map((category, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 capitalize">
                          {category.category.replace('_', ' ')}
                        </span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 rounded-full bg-gray-200 mr-2">
                            <div 
                              className="h-2 rounded-full bg-green-600" 
                              style={{ width: `${Math.min(100, (parseFloat(category.rating) / 5) * 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{category.rating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>,
            "reviews",
            hotel.reviews?.[0]?.count
          )}

          {/* Hotel Policies */}
          {(hotel.policies || hotel.checkinInfo) && renderCollapsibleSection(
            "Hotel Policies",
            <div className="space-y-4">
              {hotel.checkinInfo && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Check-in Information</h4>
                  <div className="flex flex-wrap text-sm text-gray-600">
                    <div className="w-full sm:w-1/2 lg:w-1/3 mb-2">
                      <span className="font-medium">Check-in time: </span>
                      {hotel.checkinInfo.beginTime} - {hotel.checkinInfo.endTime}
                    </div>
                    {hotel.checkinInfo.minAge && (
                      <div className="w-full sm:w-1/2 lg:w-1/3 mb-2">
                        <span className="font-medium">Minimum check-in age: </span>
                        {hotel.checkinInfo.minAge}
                      </div>
                    )}
                  </div>
                  
                  {hotel.checkinInfo.instructions && hotel.checkinInfo.instructions.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium text-gray-800 mb-1">Instructions:</h5>
                      <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: hotel.checkinInfo.instructions[0] }} />
                    </div>
                  )}
                  
                  {hotel.checkinInfo.specialInstructions && hotel.checkinInfo.specialInstructions.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium text-gray-800 mb-1">Special Instructions:</h5>
                      <p className="text-sm text-gray-600">{hotel.checkinInfo.specialInstructions[0]}</p>
                    </div>
                  )}
                </div>
              )}
              
              {hotel.checkoutInfo && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Check-out Information</h4>
                  <p className="text-sm text-gray-600">Check-out time: {hotel.checkoutInfo.time}</p>
                </div>
              )}
              
              {hotel.policies && hotel.policies.map((policy, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {policy.type === "know_before_you_go" ? "Important Information" : policy.type.replace(/_/g, ' ')}
                  </h4>
                  <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: policy.text }} />
                </div>
              ))}

              {hotel.descriptions?.find(desc => desc.type === "spoken_languages") && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Spoken Languages</h4>
                  <p className="text-sm text-gray-600">
                    {hotel.descriptions.find(desc => desc.type === "spoken_languages").text}
                  </p>
                </div>
              )}
            </div>,
            "policies"
          )}

          {/* Facilities and other sections */}
          <div className="mt-6">
            {/* Facilities Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Facilities & Amenities */}
              {hotel.groupedFacilities && hotel.groupedFacilities.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Facilities & Amenities</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotel.groupedFacilities.slice(0, 10).map((group) => (
                      <div key={group.id} className="border border-gray-100 rounded-lg p-4">
                        <h4 className="font-medium text-gray-800 mb-2">{group.name}</h4>
                        <div className="space-y-2">
                          {group.facilities.slice(0, 4).map((facility) => (
                            <div key={facility.id} className="flex items-center">
                              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-sm text-gray-600">{facility.name}</span>
                            </div>
                          ))}
                          {group.facilities.length > 4 && (
                            <div className="text-sm text-blue-600">
                              +{group.facilities.length - 4} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Nearby Attractions */}
              {hotel.nearByAttractions && hotel.nearByAttractions.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">Nearby Attractions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotel.nearByAttractions.slice(0, 8).map((attraction, index) => (
                      <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                        <div className="bg-blue-100 p-1 rounded-full mr-3 mt-1 flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800">{attraction.name}</h4>
                          <p className="text-sm text-gray-600">
                            {attraction.distance} {attraction.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Confirm Selection</h3>
              <p className="text-gray-600 mb-4">Select a room type to continue with your booking.</p>
              
              {selectedRooms.length > 0 ? (
                <div className="bg-green-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center text-green-800 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Room Selected</span>
                  </div>
                  <p className="text-sm text-green-700">
                    You've selected {selectedRooms.length} room{selectedRooms.length > 1 ? 's' : ''}. Click "Confirm Selection" to proceed.
                  </p>
                </div>
              ) : (
                <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                  <div className="flex items-center text-yellow-800 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Room Not Selected</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Please select a room from the available options.
                  </p>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="w-1/2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedRooms.length === 0 || isLoading}
                  className={`w-1/2 px-4 py-2 rounded-lg text-white font-medium ${
                    selectedRooms.length === 0 || isLoading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } transition-colors`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </div>
                  ) : (
                    "Confirm Selection"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Information Modal */}
      <GuestInfoModal
        isOpen={showGuestInfoModal}
        onClose={() => setShowGuestInfoModal(false)}
        selectedRoomsAndRates={roomRatesResponse?.data?.data?.results?.[0]?.items?.[0]?.selectedRoomsAndRates || []}
        onSubmit={handleGuestInfoSubmit}
        itineraryCode={itineraryData?.data?.results?.[0]?.itinerary?.code}
        traceId={itineraryData?.data?.results?.[0]?.traceId}
      />
    </>
  );
};

export default HotelItineraryModal;