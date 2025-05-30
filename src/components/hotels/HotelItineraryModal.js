import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Popover } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import GuestInfoModal from './GuestInfoModal';

// Map Container Style
const containerStyle = {
  width: '100%',
  height: '250px', // Adjust height as needed
  borderRadius: '8px'
};

// Define libraries array as a static constant
const GOOGLE_MAPS_LIBRARIES = ['marker']; // Explicitly load marker library if needed

const HotelItineraryModal = ({ hotel, itineraryData, onClose, onSubmit }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [showGuestInfoModal, setShowGuestInfoModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState('');

  // --- NEW STATE for flags ---
  const [isPanMandatory, setIsPanMandatory] = useState(false);
  const [isPassportMandatory, setIsPassportMandatory] = useState(false);
  // ---

  // --- NEW STATE for initial price check ---
  const [initialPriceCheckStatus, setInitialPriceCheckStatus] = useState('idle'); // 'idle', 'checking', 'price-changed', 'confirmed'
  const [initialPriceData, setInitialPriceData] = useState(null);
  // --- END NEW STATE ---

  const detailedHotelData = itineraryData?.data?.results?.[0]?.data?.[0];
  const roomRateData = detailedHotelData?.roomRate?.[0];
  const images = detailedHotelData?.images || [];
  const geoCode = detailedHotelData?.geoCode; // Get geoCode

  // --- Google Maps Loader ---
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  // Define mapCenter and memoize it using useMemo
  const center = useMemo(() => {
    if (geoCode?.lat && geoCode?.long) {
      // Ensure coordinates are parsed as numbers
      const lat = parseFloat(geoCode.lat);
      const lng = parseFloat(geoCode.long);
      // Add validation for NaN
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    return null; // Return null if no valid coords
  }, [geoCode]);
  // --- End Google Maps Loader ---

  const goToPrevious = useCallback((e) => {
      e.stopPropagation();
      const isFirstSlide = currentImageIndex === 0;
      const newIndex = isFirstSlide ? images.length - 1 : currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
  }, [currentImageIndex, images.length]);

  const goToNext = useCallback((e) => {
      e.stopPropagation();
      const isLastSlide = currentImageIndex === images.length - 1;
      const newIndex = isLastSlide ? 0 : currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
  }, [currentImageIndex, images.length]);

  const getImageUrl = useCallback((imageIndex) => {
    const image = images[imageIndex];
    if (!image) return '/api/placeholder/800/400';
    const imageUrl = image.links?.find((link) => link.size === 'Xxl')?.url
           || image.links?.[0]?.url
           || '/api/placeholder/800/400';
    return imageErrorMap[imageIndex] ? '/api/placeholder/400/300' : imageUrl;
  }, [images, imageErrorMap]);

  const getBestImageUrl = useCallback((image) => {
      if (!image) return '/api/placeholder/1200/800';
      return image.links?.find((link) => link.size === 'Xxl')?.url
             || image.links?.find((link) => link.size === 'Standard')?.url
             || image.links?.[0]?.url
             || '/api/placeholder/1200/800';
  }, []);

  const openLightbox = useCallback((imageUrl) => {
      if (!imageUrl) return;
      setLightboxImageUrl(imageUrl);
      setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
      setIsLightboxOpen(false);
      setLightboxImageUrl('');
  }, []);

  useEffect(() => {
    setCurrentImageIndex(0);
    setImageErrorMap({});
  }, [detailedHotelData?.id]);

  const getRateDetails = useCallback((rateId) => roomRateData?.rates?.[rateId], [roomRateData]);

  const getRoomDetailsFromOccupancy = useCallback((occupancy) => {
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
  }, [roomRateData]);

  const calculateTotalPrice = useCallback((recommendation) => {
    if (!recommendation?.rates) return 0;
    return recommendation.rates.reduce((total, rateId) => {
      const rate = getRateDetails(rateId);
      return total + (rate?.finalRate || 0);
    }, 0);
  }, [getRateDetails]);

  const handleRoomSelect = useCallback((recommendation) => {
    if (!recommendation?.rates) return;
    const selectedRoomsData = recommendation.rates.map(rateId => {
        const rate = getRateDetails(rateId);
        if (!rate?.occupancies) return null;
        const occupancy = rate.occupancies[0];
        const room = getRoomDetailsFromOccupancy(occupancy);
        if (!room) return null;
        return {
          rateId: rateId,
          roomId: occupancy.roomId,
          occupancy: { adults: occupancy.numOfAdults, childAges: occupancy.childAges || [] },
          roomDetails: { ...room, recommendationId: recommendation.id }
        };
      }).filter(Boolean);
    setSelectedRooms(selectedRoomsData);
  }, [getRateDetails, getRoomDetailsFromOccupancy]);

  // Function to proceed to Guest Info Modal
  const proceedToGuestInfo = (bookingFlags = {}) => { // Accept flags as argument
    // --- Set flags before opening modal ---

    // Hard set state values directly and ensure they're converted to boolean
    const panMandatory = Boolean(bookingFlags.isPanMandatory);
    const passportMandatory = Boolean(bookingFlags.isPassportMandatory);
    
    console.log('Setting PAN mandatory flag:', panMandatory, 'Source value:', bookingFlags.isPanMandatory);
    console.log('Setting Passport mandatory flag:', passportMandatory);

    setIsPanMandatory(panMandatory);
    setIsPassportMandatory(passportMandatory);

    // ---

    // This is async, so do this after setting states
    setShowGuestInfoModal(true);
    setInitialPriceCheckStatus('confirmed'); // Mark price as confirmed
  };

  const handleConfirmSelection = useCallback(async () => {
      try {
        // --- Start initial price check ---
        setIsLoading(true);
        setInitialPriceCheckStatus('checking');
        setInitialPriceData(null);
        // ---

        if (selectedRooms.length === 0) {
          toast.error('No room selected');
          // --- Reset loading states ---
          setIsLoading(false);
          setInitialPriceCheckStatus('idle');
          // ---
          return;
        }

        const recommendationId = selectedRooms[0].roomDetails?.recommendationId;
        if (!recommendationId) {
          toast.error('Invalid room selection');
          setIsLoading(false);
          setInitialPriceCheckStatus('idle');
          return;
        }

        const recommendation = roomRateData?.recommendations?.[recommendationId];
        if (!recommendation?.rates) {
          toast.error('No rates available for selected room');
          setIsLoading(false);
          setInitialPriceCheckStatus('idle');
          return;
        }

        const traceId = itineraryData?.data?.results?.[0]?.traceId;
        const items = itineraryData?.data?.results?.[0]?.items;
        const itinerary = itineraryData?.data?.results?.[0]?.itinerary?.code;

        if (!traceId || !items || !itinerary) {
            toast.error('Missing required itinerary data for selection.');
            setIsLoading(false);
            setInitialPriceCheckStatus('idle');
            return;
        }

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

          // --- Extract flags from response ---
          const bookingFlags = {
              isPanMandatory: Boolean(response.data?.data?.results?.[0]?.isPanMandatoryForBooking),
              isPassportMandatory: Boolean(response.data?.data?.results?.[0]?.isPassportMandatoryForBooking)
          };
          
          console.log('Extracted booking flags from API response:', bookingFlags);
          console.log('Raw isPanMandatory value:', response.data?.data?.results?.[0]?.isPanMandatoryForBooking);

          // --- Check for price change ---
          const priceChangeData = response.data?.data?.priceChangeData ||
                                 response.data?.data?.results?.[0]?.items?.[0]?.priceChangeData;
          if (priceChangeData && priceChangeData.isPriceChanged) {
            setInitialPriceData(priceChangeData);
            setInitialPriceCheckStatus('price-changed');
            toast.warning('The price has changed. Please review and confirm.');
             // Set flags here too, as proceedToGuestInfo might be called later on accept
             setIsPanMandatory(bookingFlags.isPanMandatory);
             setIsPassportMandatory(bookingFlags.isPassportMandatory);
          } else {
            toast.success('Room rates confirmed successfully.');
            // Pass flags when proceeding directly
            proceedToGuestInfo(bookingFlags);
          }
          // --- End price change check ---
        } else {
          toast.error(response.message || 'Failed to select room rates');
          setInitialPriceCheckStatus('idle'); // Reset on failure
        }
      } catch (error) {
        console.error('Error selecting room rates:', error);
        toast.error('Failed to select room rates');
        setInitialPriceCheckStatus('idle'); // Reset on error
      } finally {
        // Only stop main loading if not waiting for user confirmation
        if (initialPriceCheckStatus !== 'price-changed') {
           setIsLoading(false);
        }
      }
  }, [selectedRooms, itineraryData, roomRateData, initialPriceCheckStatus]);

  const handleGuestInfoSubmit = useCallback(async (bookingData) => {
    try {
      setIsLoading(true);
      if (bookingData.results?.[0]?.data) {
        setShowGuestInfoModal(false);
        onSubmit(bookingData);
      } else {
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
  }, [itineraryData, onSubmit]);

  const getGroupedRecommendations = useCallback(() => {
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
  }, [roomRateData]);

  const toggleSection = useCallback((sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  }, []);

  const renderCollapsibleSection = useCallback((title, content, sectionId, count) => {
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
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`}
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
  }, [expandedSections, toggleSection]);

  const renderRecommendationDetails = useCallback((recommendation) => {
    if (!recommendation?.rates) return null;

    const rates = recommendation.rates.map((rateId) => getRateDetails(rateId));
    const totalPrice = calculateTotalPrice(recommendation);
    const firstRate = rates[0];

    // Helper function to format date
    const formatDate = (dateString) => {
      if (!dateString) return '';
      try {
        return new Date(dateString).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
      } catch (e) {
        console.error("Error formatting date:", e);
        return '';
      }
    };

    // Determine cancellation text based on the first rate
    let cancellationText = 'Cancellation policy varies'; // Default text
    let cancellationColor = 'text-gray-600'; // Default color

    if (firstRate) {
      if (!firstRate.refundable) {
        cancellationText = 'Non-refundable';
        cancellationColor = 'text-red-600';
      } else {
        const cancellationPolicy = firstRate.cancellationPolicies?.[0];
        const freeCancellationRule = cancellationPolicy?.rules?.find(rule => rule.value === 0 || rule.valueType === 'Nights' && rule.value === 0);
        if (freeCancellationRule?.end) {
          cancellationText = `Free cancellation until ${formatDate(freeCancellationRule.end)}`;
          cancellationColor = 'text-green-600';
        } else {
          // If refundable but no specific free cancellation date found, keep it general
          cancellationText = 'Refundable (check details)';
          cancellationColor = 'text-green-600';
        }
      }
    }

    // Helper to format date and time for popover
    const formatPopoverDateTime = (dateString) => {
      if (!dateString) return 'N/A';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
               ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
      } catch (e) {
        return 'Invalid Date';
      }
    };

    // Helper to format currency
    const currencyFormatter = (amount, currencyCode = 'INR') => {
        if (typeof amount !== 'number' || isNaN(amount)) {
            return 'N/A';
        }
        const code = typeof currencyCode === 'string' && currencyCode.trim().length === 3
                     ? currencyCode.trim().toUpperCase()
                     : 'INR';
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: code,
                minimumFractionDigits: 0,
                maximumFractionDigits: 2 // Allow cents for charges
            }).format(amount);
        } catch (e) {
            return `${code} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        }
    };

    // Generate Popover Content
    const cancellationPolicyContent = (
      <div className="w-80 p-2">
        <h4 className="text-sm font-semibold mb-2 text-gray-700">Cancellation Policy</h4>
        {firstRate && firstRate.cancellationPolicies?.[0]?.rules?.length > 0 ? (
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-1.5 text-left font-medium text-gray-600">Cancelled From</th>
                <th className="border p-1.5 text-left font-medium text-gray-600">Cancelled Till</th>
                <th className="border p-1.5 text-left font-medium text-gray-600">Charges</th>
              </tr>
            </thead>
            <tbody>
              {firstRate.cancellationPolicies[0].rules.map((rule, idx) => {
                let chargeText = 'N/A';
                if (rule.value === 0 || (rule.valueType === 'Nights' && rule.value === 0)) {
                    chargeText = <span className="font-medium text-green-600">Free Cancellation</span>;
                } else if (rule.valueType === 'Percentage') {
                    chargeText = `${rule.value}%`;
                } else if (rule.valueType === 'Nights') {
                    chargeText = `${rule.value} Night${rule.value !== 1 ? 's' : ''}`;
                } else if (rule.valueType === 'Amount') {
                    chargeText = currencyFormatter(rule.value, firstRate.currency);
                }
                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border p-1.5 text-gray-700">{formatPopoverDateTime(rule.start)}</td>
                    <td className="border p-1.5 text-gray-700">{formatPopoverDateTime(rule.end)}</td>
                    <td className="border p-1.5 text-gray-700">{chargeText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-xs text-gray-500">Detailed cancellation policy not available.</p>
        )}
      </div>
    );

    return (
      <div className="space-y-3 overflow-hidden">
        {rates.map((rate, index) => {
          if (!rate?.occupancies) return null;
          return rate.occupancies.map((occupancy, occIndex) => {
            const room = getRoomDetailsFromOccupancy(occupancy);
            if (!room) return null;
            return (
              <div key={`${index}-${occIndex}`} className="pb-3 border-b last:border-b-0">
                <p className="font-medium break-words">{room.name}</p>
                <div className="text-xs sm:text-sm text-gray-600">
                  <p>Adults: {occupancy.numOfAdults}</p>
                  {occupancy.numOfChildren > 0 && (
                    <p>
                      Children: {occupancy.numOfChildren}
                      {occupancy.childAges?.length > 0 && ` (Ages: ${occupancy.childAges.join(", ")})`}
                    </p>
                  )}
                </div>
              </div>
            );
          });
        })}
        {firstRate && (
          <div className="flex justify-between items-end mt-2">
            <div className="text-xs sm:text-sm space-y-1">
              {/* Display Board Basis */}
              {firstRate.boardBasis?.description &&
                <p className="text-gray-600 break-words">{firstRate.boardBasis.description}</p>
              }
              {/* Display Cancellation Policy with Popover */}
              <div className={`flex items-center ${cancellationColor} font-medium break-words`}>
                 <span>{cancellationText}</span>
                 {firstRate && firstRate.cancellationPolicies?.[0]?.rules && (
                   <Popover
                     content={cancellationPolicyContent}
                     title={null} // No default title
                     trigger="click"
                     placement="bottomLeft"
                     overlayClassName="cancellation-popover"
                   >
                     <InformationCircleIcon className="h-4 w-4 ml-1 cursor-pointer text-gray-400 hover:text-gray-600" />
                   </Popover>
                 )}
              </div>
            </div>
            <div className="text-right font-semibold text-base sm:text-lg text-[#093923] pl-2 flex-shrink-0">
              {firstRate?.currency || "USD"} {totalPrice.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  }, [getRateDetails, calculateTotalPrice, getRoomDetailsFromOccupancy]);

  const renderRoomTypeSection = useCallback((groupId, recommendations) => {
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
          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-gray-200 hover:border-[#093923]/30'}`}
        >
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <img
              src={imageUrl}
              alt={standardRoom.name}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
              onError={() => {
                if (!imageErrorMap[groupId]) {
                  setImageErrorMap(prev => ({ ...prev, [groupId]: true }));
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {standardRoom.name}
              </h3>
              {standardRoom.type && (
                <p className="text-xs sm:text-sm text-gray-600 truncate">{standardRoom.type}</p>
              )}
            </div>
          </div>
          <div className="flex items-center ml-2 sm:ml-4 flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-600 mr-2 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
              {recommendations.length} option{recommendations.length !== 1 ? "s" : ""}
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform duration-200 ${isExpanded ? "transform rotate-180" : ""}`}
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
              const isSelected = selectedRooms.some(room => room.roomDetails.recommendationId === rec.id);
              return (
                <div
                  key={rec.id}
                  onClick={() => handleRoomSelect(rec)}
                  className={`cursor-pointer p-3 sm:p-4 rounded-lg ${isSelected ? 'bg-[#093923]/10 border-2 border-[#093923]' : 'bg-white border border-gray-100 hover:border-[#093923]/30'} transition-all duration-200 shadow-sm`}
                >
                  {renderRecommendationDetails(rec)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }, [roomRateData, expandedSections, imageErrorMap, selectedRooms, toggleSection, handleRoomSelect, renderRecommendationDetails]);

  const groupedRecommendations = useMemo(getGroupedRecommendations, [getGroupedRecommendations]);

  useEffect(() => {
    if (detailedHotelData?.imagesAndCaptions && Object.keys(detailedHotelData.imagesAndCaptions).length > 0) {
      setActiveImageCategory(Object.keys(detailedHotelData.imagesAndCaptions)[0]);
    }
  }, [detailedHotelData?.imagesAndCaptions]);

  // Helper to get thumbnail URL
  const getThumbnailUrl = useCallback((image) => {
    if (!image) return '/api/placeholder/80/60';
    return image.links?.find((link) => link.size === 'Small')?.url
           || image.links?.find((link) => link.size === 'Standard')?.url // Fallback to Standard
           || image.links?.[0]?.url // Fallback to first available
           || '/api/placeholder/80/60';
  }, []);

  return (
    <>
      <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg w-full">
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{detailedHotelData?.name || hotel.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {detailedHotelData?.starRating && (
                <div className="flex items-center text-yellow-400">
                  {[...Array(parseInt(detailedHotelData.starRating))].map((_, i) => (
                    <span key={i} className="text-xl">★</span>
                  ))}
                </div>
              )}

              {detailedHotelData?.reviews?.[0]?.rating && (
                <div className="flex items-center bg-[#22c35e]/10 px-2 py-1 rounded">
                  <span className="font-bold text-[#22c35e]">{detailedHotelData.reviews[0].rating}/5</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-sm text-gray-600">{detailedHotelData.reviews[0].count} reviews</span>
                </div>
              )}

              {detailedHotelData?.contact?.address?.city?.name && (
                <span className="text-sm text-gray-600">
                  {detailedHotelData.contact.address.city.name}, {detailedHotelData.contact.address.country?.name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative group overflow-hidden px-6 py-2 bg-[#093923] text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-[#093923] focus:ring-opacity-50"
          >
            <span className="relative z-10">Back to Results</span>
            <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
          </button>
        </div>

        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="relative rounded-lg overflow-hidden shadow-md group bg-gray-200">
                <img
                  src={getImageUrl(currentImageIndex)}
                  alt={`${detailedHotelData?.name || 'Hotel'} - Image ${currentImageIndex + 1}`}
                  className="w-full h-80 sm:h-96 object-cover transition-opacity duration-300 ease-in-out cursor-pointer"
                  key={detailedHotelData?.id + '-main-' + currentImageIndex}
                  onClick={() => openLightbox(getBestImageUrl(images[currentImageIndex]))}
                  onError={() => {
                     if (!imageErrorMap[currentImageIndex]) {
                         setImageErrorMap(prev => ({ ...prev, [currentImageIndex]: true }));
                     }
                  }}
                  loading="lazy"
                />
                {detailedHotelData?.type && (
                  <div className="absolute top-3 left-3 bg-[#093923] text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                    {detailedHotelData.type}
                  </div>
                )}

                {images.length > 1 && (
                  <>
                    <button
                      onClick={goToPrevious}
                      className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hover:bg-black/60 focus:outline-none"
                      aria-label="Previous image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 hover:bg-black/60 focus:outline-none"
                      aria-label="Next image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {images.length > 1 && (
                <div className="w-full overflow-x-auto py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="flex space-x-2 px-1 pb-1">
                    {images.map((image, index) => {
                      const thumbnailUrl = getThumbnailUrl(image);
                      const isSelected = currentImageIndex === index;
                      return (
                        <button
                          key={`thumb-${detailedHotelData?.id || 'hotel'}-${index}`}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden focus:outline-none transition-all duration-200 ease-in-out ${isSelected ? 'ring-2 ring-offset-2 ring-[#093923]' : 'ring-1 ring-gray-300 hover:ring-[#093923]/50'}`}
                          aria-label={`View image ${index + 1}`}
                        >
                          <img
                            src={thumbnailUrl}
                            alt={`Thumbnail ${index + 1}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isSelected ? 'opacity-100' : 'opacity-75 hover:opacity-100'}`}
                            onError={(e) => { e.target.src = '/api/placeholder/80/60'; }}
                            loading="lazy"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {detailedHotelData?.descriptions?.find(desc => desc.type === "amenities") && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-2">About This Property</h3>
                  <p className="text-gray-600">
                    {detailedHotelData.descriptions.find(desc => desc.type === "amenities").text}
                  </p>
                </div>
              )}

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Available Room Types</h3>
                <div className="space-y-4">
                  {Object.entries(groupedRecommendations).map(([groupId, recs]) =>
                    renderRoomTypeSection(groupId, recs)
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(detailedHotelData?.descriptions?.find(desc => desc.type === "headline") || detailedHotelData?.descriptions?.find(desc => desc.type === "location")) && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  {detailedHotelData?.descriptions?.find(desc => desc.type === "headline") && (
                      <div className="bg-[#093923]/10 p-3 rounded-lg mb-4">
                        <h3 className="text-[#093923] font-medium">
                          {detailedHotelData.descriptions.find(desc => desc.type === "headline").text}
                        </h3>
                      </div>
                  )}
                  {detailedHotelData?.descriptions?.find(desc => desc.type === "location") && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-1">Location</h4>
                      <p className="text-gray-600 text-sm">
                        {detailedHotelData.descriptions.find(desc => desc.type === "location").text}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Location Map</h3>
                {loadError && <div className="text-red-600 text-sm">Error loading map. Please check the API key and try again.</div>}
                {!isLoaded && !loadError && <div className="text-gray-500 text-sm">Loading map...</div>}
                {isLoaded && !loadError && center && (
                  <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={15}
                    options={{ // Disable UI controls for a cleaner look
                        streetViewControl: false,
                        mapTypeControl: false,
                        fullscreenControl: false,
                    }}
                  >
                    <Marker position={center} />
                  </GoogleMap>
                )}
                 {isLoaded && !loadError && !center && (
                     <div className="text-gray-500 text-sm">Location coordinates not available.</div>
                 )}
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                {detailedHotelData?.contact?.address && (
                  <div className="flex items-start mb-4">
                    <svg className="w-5 h-5 text-[#093923] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p>{detailedHotelData.contact.address.line1}</p>
                      {detailedHotelData.contact.address.line2 && <p>{detailedHotelData.contact.address.line2}</p>}
                      <p>{detailedHotelData.contact.address.city?.name}, {detailedHotelData.contact.address.country?.name}</p>
                      <p>{detailedHotelData.contact.address.postalCode}</p>
                    </div>
                  </div>
                )}

                {detailedHotelData?.contact?.phones && detailedHotelData.contact.phones.length > 0 && (
                  <div className="flex items-start mb-4">
                    <svg className="w-5 h-5 text-[#093923] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p>{detailedHotelData.contact.phones[0]}</p>
                    </div>
                  </div>
                )}

                {detailedHotelData?.contact?.email && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-[#093923] mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p>{detailedHotelData.contact.email}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Hotel Highlights</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Check-in</span>
                    <span className="font-medium">{detailedHotelData?.checkinInfo?.beginTime || '3:00 PM'}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Check-out</span>
                    <span className="font-medium">{detailedHotelData?.checkoutInfo?.time || '12:00 PM'}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {detailedHotelData?.facilityGroups?.slice(0, 8).map(group => (
                      <div key={group.id} className="flex items-center">
                        <div className="bg-[#093923]/10 p-1 rounded-full mr-2 flex-shrink-0">
                          <svg className="w-3 h-3 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700 truncate">{group.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {detailedHotelData?.reviews && detailedHotelData.reviews[0] && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold mb-3">Guest Reviews</h3>
                  <div className="flex items-center mb-4">
                    <div className="bg-[#22c35e]/10 text-[#22c35e] text-2xl font-bold rounded-lg p-3 mr-3 flex-shrink-0">
                      {detailedHotelData.reviews[0].rating}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">Overall Rating</div>
                      <div className="text-sm text-gray-600">Based on {detailedHotelData.reviews[0].count} reviews</div>
                    </div>
                  </div>

                  {detailedHotelData.reviews[0].categoryratings && (
                    <div className="space-y-2">
                      {detailedHotelData.reviews[0].categoryratings.map((category, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 capitalize">
                            {category.category.replace('_', ' ')}
                          </span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 rounded-full bg-gray-200 mr-2">
                              <div
                                className="h-2 rounded-full bg-[#22c35e]"
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

          {detailedHotelData?.groupedFacilities && detailedHotelData.groupedFacilities.length > 0 && renderCollapsibleSection(
            "Facilities & Amenities",
            <div>
              {detailedHotelData.groupedFacilities.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {detailedHotelData.groupedFacilities.map((group) => (
                    <div key={group.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                      <h4 className="font-medium text-gray-800 mb-2">{group.name}</h4>
                      <div className="space-y-2">
                        {group.facilities.map((facility) => (
                          <div key={facility.id} className="flex items-center">
                            <svg className="w-4 h-4 text-[#22c35e] mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            detailedHotelData?.facilities?.length
          )}

          {detailedHotelData?.nearByAttractions && detailedHotelData.nearByAttractions.length > 0 && renderCollapsibleSection(
            "Nearby Attractions",
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detailedHotelData.nearByAttractions.map((attraction, index) => (
                <div key={index} className="flex items-start bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <div className="bg-[#093923]/10 p-1 rounded-full mr-3 mt-1">
                    <svg className="w-5 h-5 text-[#093923]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            detailedHotelData?.nearByAttractions?.length
          )}

          {detailedHotelData?.imagesAndCaptions && Object.keys(detailedHotelData.imagesAndCaptions).length > 0 && renderCollapsibleSection(
            "Image Gallery",
            <div>
              <div className="flex overflow-x-auto pb-2 mb-4 space-x-2">
                {Object.keys(detailedHotelData.imagesAndCaptions).map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveImageCategory(category)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap ${activeImageCategory === category ? 'bg-[#093923] text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                  >
                    {detailedHotelData.imagesAndCaptions[category].captionLabel || category}
                    <span className="ml-1 text-xs">
                      ({detailedHotelData.imagesAndCaptions[category].images.length})
                    </span>
                  </button>
                ))}
              </div>

              {activeImageCategory && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {detailedHotelData.imagesAndCaptions[activeImageCategory].images.map((image, index) => {
                    const imageUrl = image.links?.find(link => link.size === "Standard")?.url || image.links?.[0]?.url || '/api/placeholder/400/300';
                    const bestUrl = getBestImageUrl(image);
                    return (
                      <div key={index} className="relative rounded-lg overflow-hidden shadow-sm group cursor-pointer" onClick={() => openLightbox(bestUrl)}>
                        <img
                          src={imageUrl}
                          alt={`${detailedHotelData.name} - ${detailedHotelData.imagesAndCaptions[activeImageCategory].captionLabel} ${index + 1}`}
                          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { e.target.src = '/api/placeholder/400/300'; }}
                        />
                        {image.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {image.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>,
            "gallery",
            Object.values(detailedHotelData?.imagesAndCaptions || {}).reduce((count, category) => count + category.images.length, 0)
          )}

          {(detailedHotelData?.policies || detailedHotelData?.checkinInfo) && renderCollapsibleSection(
            "Hotel Policies",
            <div className="space-y-4">
              {detailedHotelData?.checkinInfo && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Check-in Information</h4>
                  <div className="flex flex-wrap text-sm text-gray-600">
                    <div className="w-full sm:w-1/2 lg:w-1/3 mb-2">
                      <span className="font-medium">Check-in time: </span>
                      {detailedHotelData.checkinInfo.beginTime} - {detailedHotelData.checkinInfo.endTime}
                    </div>
                    {detailedHotelData.checkinInfo.minAge && (
                      <div className="w-full sm:w-1/2 lg:w-1/3 mb-2">
                        <span className="font-medium">Minimum check-in age: </span>
                        {detailedHotelData.checkinInfo.minAge}
                      </div>
                    )}
                  </div>

                  {detailedHotelData.checkinInfo.instructions && detailedHotelData.checkinInfo.instructions.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium text-gray-800 mb-1">Instructions:</h5>
                      <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: detailedHotelData.checkinInfo.instructions[0] }} />
                    </div>
                  )}

                  {detailedHotelData.checkinInfo.specialInstructions && detailedHotelData.checkinInfo.specialInstructions.length > 0 && (
                    <div className="mt-2">
                      <h5 className="font-medium text-gray-800 mb-1">Special Instructions:</h5>
                      <p className="text-sm text-gray-600">{detailedHotelData.checkinInfo.specialInstructions[0]}</p>
                    </div>
                  )}
                </div>
              )}

              {detailedHotelData?.checkoutInfo && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Check-out Information</h4>
                  <p className="text-sm text-gray-600">Check-out time: {detailedHotelData.checkoutInfo.time}</p>
                </div>
              )}

              {detailedHotelData?.policies && detailedHotelData.policies.map((policy, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">
                    {policy.type === "know_before_you_go" ? "Important Information" : policy.type.replace(/_/g, ' ')}
                  </h4>
                  <div className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: policy.text }} />
                </div>
              ))}

              {detailedHotelData?.descriptions?.find(desc => desc.type === "spoken_languages") && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <h4 className="font-medium text-gray-800 mb-2">Spoken Languages</h4>
                  <p className="text-sm text-gray-600">
                    {detailedHotelData.descriptions.find(desc => desc.type === "spoken_languages").text}
                  </p>
                </div>
              )}
            </div>,
            "policies"
          )}

          <div className="bg-white p-6 rounded-lg shadow-sm mt-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Selection</h3>

            {/* --- Display Initial Price Change Info --- */}
            {initialPriceCheckStatus === 'price-changed' && initialPriceData && (
              <div className="mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-800">Price has changed</span>
                  <span className="font-bold text-red-600">
                     {initialPriceData.priceChangeAmount > 0 ? '+' : ''}
                     {initialPriceData.currency || 'INR'} {initialPriceData.priceChangeAmount?.toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Previous price:</span>
                    <span>{initialPriceData.currency || 'INR'} {initialPriceData.previousTotalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>New price:</span>
                    <span>{initialPriceData.currency || 'INR'} {initialPriceData.currentTotalAmount?.toLocaleString()}</span>
                  </div>
                  <p className="pt-2">Do you want to accept the new price and proceed?</p>
                </div>
              </div>
            )}
            {/* --- END Display Initial Price Change Info --- */}

            {initialPriceCheckStatus !== 'price-changed' && ( // Hide selection status when price changed
              selectedRooms.length > 0 ? (
                <div className="bg-[#22c35e]/10 p-4 rounded-lg mb-4">
                  <div className="flex items-center text-[#22c35e] mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Room Selected</span>
                  </div>
                  <p className="text-sm text-[#22c35e]">
                    You've selected {selectedRooms.map(room => room.roomDetails.name).join(', ')}. Click "Confirm Selection" to proceed.
                  </p>
                </div>
              ) : (
                <div className="bg-[#093923]/5 p-4 rounded-lg mb-4">
                  <div className="flex items-center text-[#093923]/80 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Room Not Selected</span>
                  </div>
                  <p className="text-sm text-[#093923]/80">
                    Please select a room from the available options.
                  </p>
                </div>
              )
            )}

            <div className="flex justify-between gap-4">
              <button
                onClick={onClose}
                // Disable Back button if price changed and needs confirmation
                disabled={initialPriceCheckStatus === 'price-changed'}
                className={`relative group overflow-hidden w-full sm:w-60 py-2 border border-[#093923] rounded-lg text-[#093923] font-medium transition-opacity ${initialPriceCheckStatus === 'price-changed' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span className="relative z-10 group-hover:text-white">Back</span>
                <div className="absolute inset-0 bg-[#093923] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
              </button>

              {/* --- Conditional Button Logic --- */}
              {initialPriceCheckStatus === 'price-changed' ? (
                // Show Accept/Decline buttons if price changed
                <>
                   <button
                     onClick={() => { // Decline handler
                       setInitialPriceCheckStatus('idle');
                       setInitialPriceData(null);
                       setIsLoading(false); // Stop loading on decline
                     }}
                     className="relative group overflow-hidden w-full sm:w-60 py-2 border border-red-600 rounded-lg text-red-600 font-medium"
                   >
                     <span className="relative z-10 group-hover:text-white">Decline</span>
                     <div className="absolute inset-0 bg-red-600 w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                   </button>
                   <button
                     onClick={() => { // Accept handler
                       proceedToGuestInfo();
                       setIsLoading(false); // Stop loading on accept
                     }}
                     className="relative group overflow-hidden w-full sm:w-60 py-2 rounded-lg text-white font-medium bg-[#22c35e]"
                   >
                     <div className="absolute inset-0 bg-green-700 w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                     <span className="relative z-10">Accept & Add Guests</span>
                   </button>
                </>
              ) : (
                // Show original Confirm Selection button otherwise
                <button
                  onClick={handleConfirmSelection}
                  disabled={selectedRooms.length === 0 || isLoading || initialPriceCheckStatus === 'checking'}
                  className={`relative group overflow-hidden w-full sm:w-60 py-2 rounded-lg text-white font-medium transition-colors ${
                    selectedRooms.length === 0 || isLoading || initialPriceCheckStatus === 'checking' ? 'bg-[#093923]/40 cursor-not-allowed' : 'bg-[#093923]'
                  }`}
                >
                  {(isLoading || initialPriceCheckStatus === 'checking') && ( // Keep spinner logic
                    <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                  )}
                  <span className="relative z-10 flex items-center justify-center">
                    {(isLoading || initialPriceCheckStatus === 'checking') ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Confirm Selection"
                    )}
                  </span>
                </button>
              )}
              {/* --- END Conditional Button Logic --- */}
            </div>
          </div>
        </div>
      </div>

      <GuestInfoModal
        isOpen={showGuestInfoModal}
        onClose={() => setShowGuestInfoModal(false)}
        selectedRoomsAndRates={roomRatesResponse?.data?.data?.results?.[0]?.items?.[0]?.selectedRoomsAndRates || []}
        onSubmit={handleGuestInfoSubmit}
        itineraryCode={itineraryData?.data?.results?.[0]?.itinerary?.code}
        traceId={itineraryData?.data?.results?.[0]?.traceId}
        isPanMandatory={isPanMandatory}
        isPassportMandatory={isPassportMandatory}
      />

      {isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 animate-fadeIn backdrop-blur-sm"
          onClick={closeLightbox}
        >
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <img
              src={lightboxImageUrl}
              alt="Lightbox view"
              className="block max-w-full max-h-full object-contain rounded-lg shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeLightbox}
              className="absolute -top-2 -right-2 sm:top-2 sm:right-2 bg-white/30 text-white rounded-full p-1.5 hover:bg-white/50 transition-colors z-[110] backdrop-blur-sm"
              aria-label="Close lightbox"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default HotelItineraryModal;