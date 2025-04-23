import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'; // Added for Map
import axios from 'axios';
import { AlertTriangle, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, HelpCircle, Hotel, Info, Languages, ListChecks, Loader2, MapPin, MessageSquare, ParkingCircle, ShieldCheck, Sparkles, Star, UserCheck, Utensils, Wifi, X } from 'lucide-react'; // Added more icons
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

// --- Google Map Config ---
const containerStyle = {
    width: '100%',
    height: '250px', // Adjust height as needed
    borderRadius: '8px'
};
// --- End Google Map Config ---

// Renamed and adapted from HotelItineraryModal
const RoomRateOptionCard = ({ recommendation, roomRateData, selected, onSelect }) => {
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

    const calculateTotalPrice = useCallback((rec) => {
        if (!rec?.rates || !roomRateData?.rates) return 0;
        return rec.rates.reduce((total, rateId) => {
            const rate = roomRateData.rates[rateId];
            return total + (rate?.finalRate || 0);
        }, 0);
    }, [roomRateData]);

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
            className={`px-2 py-4 border rounded-lg cursor-pointer transition-all duration-150 ${selected ? 'bg-[#e9f9ee] border-[#22c35e] ring-2 ring-[#a3eec1]' : 'bg-white border-gray-200 hover:border-[#a3eec1]'
                }`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1 overflow-hidden mr-3">
                    {firstRoom && (
                        <p className="font-semibold text-[#093923] text-base truncate" title={firstRoom.name}>{firstRoom.name}</p>
                    )}
                    {!firstRoom && <p className="font-semibold text-[#093923] text-base">Room Details Unavailable</p>}
                </div>
                {/* Selection Indicator */}
                {selected && (
                    <div className="flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-[#22c35e]" />
                    </div>
                )}
            </div>

            {/* Features/Occupancy (Example, adapt based on your data) */}
            {firstRoom?.occupancyDetails && (
                    <p className="text-xs text-gray-500 mt-1">
                    Sleeps {firstRoom.occupancyDetails.adults} Adult{firstRoom.occupancyDetails.adults !== 1 ? 's' : ''}
                    {firstRoom.occupancyDetails.children > 0 && `, ${firstRoom.occupancyDetails.children} Child${firstRoom.occupancyDetails.children !== 1 ? 'ren' : ''}`}
                </p>
            )}

             {/* Refundability, Board Basis, and Price */}
             <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-100">
                <div className='text-xs text-gray-500'>
                    <p>{boardBasis}</p>
                    <p className={`${firstRate?.refundable ? 'text-green-600' : 'text-orange-600'}`}>{refundable}</p>
                    <p className="mt-1">
                        {recommendation.rates?.length} rate{recommendation.rates?.length !== 1 ? 's' : ''} included
                    </p>
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                    <p className="font-semibold text-lg text-[#093923]">
                        {currencyFormatter(totalPrice, currency)}
                    </p>
                    <p className="text-xs text-gray-500">Total price</p>
                </div>
            </div>

             {/* Warning if not selected (Optional) */}
            {!selected && (
                <div className="mt-2 text-center text-xs text-gray-400">
                    Click to select this option
                </div>
            )}
        </div>
    );
};

// --- Helper Function for Rich Text (e.g., Attractions description) ---
const RenderHtmlString = ({ htmlString }) => {
    if (!htmlString) return null;
    // Basic sanitization (replace with a proper library like DOMPurify if needed for security)
    const sanitizedHtml = htmlString.replace(/<script.*?>.*?<\/script>/gi, '');
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};

// --- New Card Components ---

const FacilitiesCard = ({ facilities, groupedFacilities }) => {
    if (!groupedFacilities?.length && !facilities?.length) {
        return <p className="text-sm text-gray-500 italic">No facilities information available.</p>;
    }

    // Prioritize groupedFacilities if available
    const displayFacilities = groupedFacilities?.length > 0 ? groupedFacilities : (
        // Basic grouping if only flat list is available
        facilities?.reduce((acc, facility) => {
            const groupName = facility.groupId ? `Group ${facility.groupId}` : 'General'; // Placeholder grouping
            if (!acc[groupName]) {
                acc[groupName] = { name: groupName, facilities: [] };
            }
            acc[groupName].facilities.push(facility);
            return acc;
        }, {})
    );

    const facilityGroupsArray = Array.isArray(displayFacilities) ? displayFacilities : Object.values(displayFacilities);

    // Simple icon mapping based on keywords (extend as needed)
    const getFacilityIcon = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('wifi') || lowerName.includes('internet')) return <Wifi className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        if (lowerName.includes('pool')) return <Sparkles className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        if (lowerName.includes('park')) return <ParkingCircle className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        if (lowerName.includes('restaurant') || lowerName.includes('dining') || lowerName.includes('bar') || lowerName.includes('breakfast')) return <Utensils className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        if (lowerName.includes('laundry') || lowerName.includes('cleaning')) return <ListChecks className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        if (lowerName.includes('concierge') || lowerName.includes('staff') || lowerName.includes('desk')) return <UserCheck className="w-4 h-4 mr-2 text-[#22c35e] flex-shrink-0" />;
        return <ListChecks className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />;
    };

    return (
        <div className="space-y-4">
            {facilityGroupsArray.map((group, index) => (
                <div key={group.id || index}>
                    <h4 className="text-base font-medium text-[#093923] mb-2">{group.name || 'Amenities'}</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                        {group.facilities?.map(facility => (
                            <li key={facility.id} className="flex items-start text-sm text-gray-600">
                                {getFacilityIcon(facility.name)}
                                <span>{facility.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

const ReviewsCard = ({ reviews }) => {
    const reviewData = reviews?.[0]; // Assuming first review entry is the primary one
    if (!reviewData) {
        return <p className="text-sm text-gray-500 italic">No review information available.</p>;
    }

    const rating = parseFloat(reviewData.rating);
    const count = parseInt(reviewData.count, 10);

    return (
        <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <span className="text-2xl font-bold text-[#093923]">{!isNaN(rating) ? rating.toFixed(1) : 'N/A'}</span>
                <span className="text-sm text-gray-500">/ 5.0 {!isNaN(count) ? `(${count.toLocaleString()} reviews)` : '(reviews)'}</span>
            </div>
            {reviewData.categoryratings?.length > 0 && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {reviewData.categoryratings.map(catRating => (
                        <div key={catRating.category} className="text-sm">
                            <span className="text-gray-600 capitalize">{catRating.category.replace('_', ' ')}: </span>
                            <span className="font-medium text-[#093923]">{parseFloat(catRating.rating).toFixed(1)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AttractionsCard = ({ attractions, description }) => {
    const hasAttractions = attractions?.length > 0;
    const hasDescription = description?.text;

    if (!hasAttractions && !hasDescription) {
        return <p className="text-sm text-gray-500 italic">No nearby attraction information available.</p>;
    }

    return (
        <div className="space-y-3">
            {hasDescription && (
                <div className="text-sm text-gray-600 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <RenderHtmlString htmlString={description.text} />
                </div>
            )}
            {hasAttractions && (
                 <ul className="space-y-1">
                    {attractions.map((attraction, index) => (
                        <li key={index} className="text-sm text-gray-600">
                            <span className="font-medium text-[#093923]">{attraction.name}</span>
                            {attraction.distance && ` - ${attraction.distance} ${attraction.unit || 'Km'}`}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

const PoliciesCard = ({ policies, checkinInfo, checkoutInfo, languagesDesc }) => {
    const knowBeforeYouGo = policies?.find(p => p.type === 'know_before_you_go');
    const spokenLanguages = languagesDesc?.text;

    const hasInfo = knowBeforeYouGo || checkinInfo || checkoutInfo || spokenLanguages;

    if (!hasInfo) {
        return <p className="text-sm text-gray-500 italic">No policy or check-in/out information available.</p>;
    }

    return (
        <div className="space-y-4 text-sm text-gray-700">
            {checkinInfo && (
                <div>
                    <h4 className="text-base font-medium text-[#093923] mb-1.5 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-[#22c35e]" /> Check-in / Check-out
                    </h4>
                    <p><strong>Check-in:</strong> {checkinInfo.beginTime || 'N/A'}{checkinInfo.endTime && ` - ${checkinInfo.endTime}`}</p>
                    <p><strong>Check-out:</strong> {checkoutInfo?.time || 'N/A'}</p>
                    {checkinInfo.minAge && <p><strong>Minimum Check-in Age:</strong> {checkinInfo.minAge}</p>}
                    {checkinInfo.instructions?.length > 0 && (
                         <div className="mt-2 prose prose-sm max-w-none prose-ul:list-disc prose-ul:pl-5 prose-p:my-1">
                            <h5 className="text-sm font-medium text-[#093923] mt-2 mb-1">Instructions:</h5>
                            <RenderHtmlString htmlString={checkinInfo.instructions.join(' ')} />
                         </div>
                    )}
                     {checkinInfo.specialInstructions?.length > 0 && (
                         <div className="mt-2 prose prose-sm max-w-none prose-ul:list-disc prose-ul:pl-5 prose-p:my-1">
                            <h5 className="text-sm font-medium text-[#093923] mt-2 mb-1">Special Instructions:</h5>
                             <RenderHtmlString htmlString={checkinInfo.specialInstructions.join(' ')} />
                         </div>
                    )}
                </div>
            )}
            {knowBeforeYouGo?.text && (
                <div>
                     <h4 className="text-base font-medium text-[#093923] mb-1.5 flex items-center">
                        <HelpCircle className="w-4 h-4 mr-2 text-[#22c35e]" /> Important Information
                    </h4>
                    <p className="whitespace-pre-wrap break-words">{knowBeforeYouGo.text}</p>
                </div>
            )}
            {spokenLanguages && (
                 <div>
                     <h4 className="text-base font-medium text-[#093923] mb-1.5 flex items-center">
                        <Languages className="w-4 h-4 mr-2 text-[#22c35e]" /> Spoken Languages
                    </h4>
                    <p>{spokenLanguages}</p>
                </div>
            )}
            {/* Add other policy types if needed */}
        </div>
    );
};

// --- End New Card Components ---

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

    // --- State from HotelItineraryModal ---
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxImageUrl, setLightboxImageUrl] = useState('');
    const [imageErrorMap, setImageErrorMap] = useState({});
    // --- End State from HotelItineraryModal ---

    // --- State for Collapsible Sections ---
    const [expandedSections, setExpandedSections] = useState({
        facilities: false,
        attractions: false,
        reviews: false,
        policies: false,
    });

    const toggleSection = useCallback((sectionName) => {
        setExpandedSections(prev => ({ ...prev, [sectionName]: !prev[sectionName] }));
    }, []);
    // --- End State for Collapsible Sections ---

    // Extracted data after loading
    // Use optional chaining and default values for robustness
    const detailedHotelData = hotelDetails?.data?.results?.[0]?.data?.[0] ?? {};
    const roomRateData = detailedHotelData?.roomRate?.[0] ?? null;
    const images = detailedHotelData?.images ?? [];
    const geoCode = detailedHotelData?.geoCode ?? null;
    const descriptions = detailedHotelData?.descriptions ?? [];
    const hotelStaticContent = hotelDetails?.data?.results?.[0]?.staticContent?.[0] ?? {};
    const hotelInfo = hotelDetails?.data?.results?.[0]?.hotelDetails ?? {};

    // Add extractions for new data points
    const facilities = detailedHotelData?.facilities ?? [];
    const groupedFacilities = detailedHotelData?.groupedFacilities ?? [];
    const reviews = detailedHotelData?.reviews ?? [];
    const nearByAttractions = detailedHotelData?.nearByAttractions ?? [];
    const policies = detailedHotelData?.policies ?? [];
    const checkinInfo = detailedHotelData?.checkinInfo ?? null;
    const checkoutInfo = detailedHotelData?.checkoutInfo ?? null;
    const spokenLanguagesDesc = descriptions.find(d => d.type === 'spoken_languages');
    const attractionsDesc = descriptions.find(d => d.type === 'attractions');
    const amenitiesDesc = descriptions.find(d => d.type === 'amenities'); // Can potentially merge with FacilitiesCard

    // --- Google Maps Loader ---
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        libraries: ['marker'] // Explicitly load marker library if needed
    });

    const center = useMemo(() => {
        if (geoCode?.lat && geoCode?.long) {
            const lat = parseFloat(geoCode.lat);
            const lng = parseFloat(geoCode.long);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
        return null; // Return null if no valid coords
    }, [geoCode]);
    // --- End Google Maps Loader ---

    // --- Carousel Logic ---
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
        if (!image) return '/api/placeholder/800/400'; // Placeholder
        // Prefer 'Standard' or first available link
        const imageUrl = image.links?.find((link) => link.size === 'Standard')?.url
            || image.links?.[0]?.url
            || '/api/placeholder/800/400';
        return imageErrorMap[imageIndex] ? '/api/placeholder/400/300' : imageUrl; // Fallback on error
    }, [images, imageErrorMap]);

    const getBestImageUrl = useCallback((image) => {
        if (!image) return '/api/placeholder/1200/800';
        // Prefer 'Xxl', then 'Standard', then first available
        return image.links?.find((link) => link.size === 'Xxl')?.url
            || image.links?.find((link) => link.size === 'Standard')?.url
            || image.links?.[0]?.url
            || '/api/placeholder/1200/800';
    }, []);

    const openLightbox = useCallback((index) => {
        const image = images[index];
        if (!image) return;
        const imageUrl = getBestImageUrl(image);
        setLightboxImageUrl(imageUrl);
        setIsLightboxOpen(true);
    }, [images, getBestImageUrl]);

    const closeLightbox = useCallback(() => {
        setIsLightboxOpen(false);
        setLightboxImageUrl('');
    }, []);

    const handleImageError = useCallback((index) => {
        setImageErrorMap(prev => ({ ...prev, [index]: true }));
    }, []);

    // Reset carousel index when hotel changes
    useEffect(() => {
        setCurrentImageIndex(0);
        setImageErrorMap({});
    }, [selectedHotel]); // Reset when the *selectedHotel prop* changes
    // --- End Carousel Logic ---

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
         // Reset state when modal closes or fetch params change significantly
        if (!isOpen) {
            setDetailsLoading(true);
            setDetailsError(null);
            setHotelDetails(null);
            setSelectedRecommendation(null);
            setBookingStatus({ loading: false, error: null, success: false, message: '' });
            setCurrentImageIndex(0);
            setIsLightboxOpen(false);
            setLightboxImageUrl('');
            setImageErrorMap({});
        }
    }, [isOpen, selectedHotel, inquiryToken, traceId, city, date]); // Keep dependencies

    // --- Booking Logic (Remains largely the same, but uses updated data paths) ---
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
            // Ensure selectedRecommendation and roomRateData are available
            if (!selectedRecommendation || !roomRateData) {
                throw new Error("Selected recommendation or room rate data is missing.");
            }

            const selectedRates = selectedRecommendation.rates
                .map((rateId) => roomRateData.rates?.[rateId]) // Use optional chaining
                .filter(Boolean);

            if (selectedRates.length !== selectedRecommendation.rates.length) {
                throw new Error("Could not find all details for the selected rates.");
            }

            const roomsAndRateAllocations = selectedRates.map((rate) => {
                const occupancy = rate.occupancies?.[0]; // Assuming single occupancy per rate for simplicity
                if (!occupancy) throw new Error(`Occupancy data missing for rate ID ${rate.id}`);
                return {
                rateId: rate.id,
                    roomId: occupancy.roomId,
                occupancy: {
                        adults: occupancy.numOfAdults,
                        ...(occupancy.numOfChildren > 0 && {
                            childAges: occupancy.childAges || [], // Ensure childAges is an array
                    }),
                },
                };
            });

            if (roomsAndRateAllocations.some(alloc => !alloc.roomId || !alloc.rateId)) {
                throw new Error("Selected rate details are incomplete.");
            }

            // Extract items and itinerary code correctly from the root structure
            // These values are available in hotelDetails.data.results[0]
            let items = hotelDetails?.data?.results?.[0]?.items;
            let itineraryCode = hotelDetails?.data?.results?.[0]?.itinerary?.code;
            
            console.log("Found items and itinerary code in API response:", { 
                items,
                itineraryCode,
                resultsAvailable: !!hotelDetails?.data?.results?.[0]
            });
            
            // Only use fallbacks if absolutely necessary
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.warn("Items missing from expected location in API response");
                items = detailedHotelData?.items || [];
                
                if (!items || items.length === 0) {
                    items = [{
                        code: "itmf24x",
                        type: "HOTEL"
                    }];
                    console.error("Had to create synthetic items as fallback");
                }
            }
            
            if (!itineraryCode) {
                console.warn("Itinerary code missing from expected location in API response");
                itineraryCode = detailedHotelData?.itinerary?.code || "itrf242";
            }

            const hotelIdForSelect = detailedHotelData?.id || selectedHotel?.id || selectedHotel?.hotel_code; // Prefer ID from details

            if (!hotelIdForSelect) {
                 console.error("Missing hotel ID from fetched details and prop", detailedHotelData, selectedHotel);
                 throw new Error("Cannot select room: hotel ID is missing.");
            }

            const selectRoomRequestData = {
                roomsAndRateAllocations,
                recommendationId: selectedRecommendation.id,
                items: items, // Use items with fallback
                itineraryCode: itineraryCode, // Use code with fallback
                traceId: currentTraceId, // Keep using the traceId passed via props initially
                inquiryToken,
                cityName: city,
                date: date, // Check-in date
            };

            console.log("Select Room Request Data:", selectRoomRequestData);
            
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

            // --- Adapt payload using potentially richer data from selectRoomResponse ---
            const newHotelDataFromSelect = selectRoomResponse.data.data;
            if (!newHotelDataFromSelect) {
                console.error("Invalid select-room response structure:", selectRoomResponse.data);
                throw new Error("Invalid response received after selecting room. Cannot proceed with replacement.");
            }

            // Helper to safely access nested properties
            const safeGet = (obj, path, defaultValue = undefined) => path.split('.').reduce((o, k) => (o || {})[k], obj) ?? defaultValue;

            // Check if we have the minimum required fields to proceed
            const hotelName = safeGet(newHotelDataFromSelect, 'staticContent.0.name') || safeGet(newHotelDataFromSelect, 'hotelDetails.name') || selectedHotel?.name;
            
            if (!hotelName) {
                console.warn("Hotel name missing from API response, using fallback data");
            }

            // Construct the payload for replacing the hotel
            const newHotelDetailsPayload = {
                checkIn: dates.checkIn,
                checkOut: dates.checkOut,
                bookingStatus: 'pending', // Or determine based on context/response
                // Safely access static content properties
                staticContent: [{
                    id: safeGet(newHotelDataFromSelect, 'staticContent.0.id') || selectedHotel?.id || `hotel_${Date.now()}`,
                    name: hotelName,
                    descriptions: safeGet(newHotelDataFromSelect, 'staticContent.0.descriptions', []),
                    contact: safeGet(newHotelDataFromSelect, 'staticContent.0.contact'),
                    images: safeGet(newHotelDataFromSelect, 'staticContent.0.images', []),
                    facilities: safeGet(newHotelDataFromSelect, 'staticContent.0.facilities', []),
                }],
                // Safely access hotel details properties
                hotelDetails: {
                    name: hotelName,
                    starRating: safeGet(newHotelDataFromSelect, 'hotelDetails.starRating') || selectedHotel?.starRating,
                    reviews: safeGet(newHotelDataFromSelect, 'hotelDetails.reviews', []),
                    // Use geoCode if geolocation is missing
                    geolocation: safeGet(newHotelDataFromSelect, 'hotelDetails.geolocation') || safeGet(newHotelDataFromSelect, 'hotelDetails.geoCode') || selectedHotel?.geoCode,
                    address: safeGet(newHotelDataFromSelect, 'hotelDetails.address')
                },
                // Include room/rate details from our processed data
                roomRate: safeGet(newHotelDataFromSelect, 'roomRate') || [{
                    recommendations: {
                        [selectedRecommendation.id]: selectedRecommendation
                    },
                    rates: roomRateData.rates,
                    rooms: roomRateData.rooms
                }],
                // Include fallback items if missing from response
                items: safeGet(newHotelDataFromSelect, 'items', items),
                itinerary: safeGet(newHotelDataFromSelect, 'itinerary') || { code: itineraryCode },
                traceId: safeGet(newHotelDataFromSelect, 'traceId', currentTraceId)
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

    // Use name from fetched details if available, fallback to prop
    const modalTitle = hotelStaticContent?.name || hotelInfo?.name || selectedHotel?.name || 'Select Room Option';
    const currentTotalPrice = selectedRecommendation ? selectedRecommendation.rates?.reduce((total, rateId) => total + (roomRateData?.rates?.[rateId]?.finalRate || 0), 0) : 0;
    const priceDifference = currentTotalPrice - (existingHotelPrice || 0);
    const priceDifferenceCurrency = selectedRecommendation ? (roomRateData?.rates?.[selectedRecommendation.rates[0]]?.currency ?? 'INR') : 'INR';

    // --- Helper to render hotel descriptions ---
    const renderDescription = (desc) => {
        if (!desc?.text) return null;
        return (
            <div key={desc.type || desc.text.substring(0, 10)} className="mb-2 last:mb-0">
                {desc.type && <h4 className="text-sm font-medium text-[#093923] mb-1">{desc.type}</h4>}
                <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{desc.text}</p>
            </div>
        );
    };

    // --- Updated JSX Structure ---
    return (
        <>
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
                {/* Increased max-width for better layout */}
                <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl max-h-[95vh] flex flex-col">
                {/* Header */}
                    <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg flex-shrink-0 z-10">
                        <h2 className="text-xl font-semibold text-[#093923] truncate pr-4" title={modalTitle}>
                        {modalTitle}
                    </h2>
                    <button
                        onClick={onClose}
                            className="p-1.5 text-gray-500 hover:text-[#093923] rounded-full hover:bg-gray-100 transition-colors"
                        disabled={bookingStatus.loading}
                            aria-label="Close modal"
                    >
                            <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                    <div className="flex-grow overflow-y-auto">
                    {detailsLoading && (
                            <div className="flex flex-col items-center justify-center h-full p-10">
                                <Loader2 className="h-12 w-12 text-[#093923] animate-spin mx-auto" />
                                <p className="mt-4 text-lg text-gray-600">Loading Hotel Details...</p>
                        </div>
                    )}
                    {detailsError && (
                            <div className="p-10">
                                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 p-4 rounded-md" role="alert">
                                    <div className="flex">
                                        <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-3" /></div>
                                        <div>
                                            <p className="font-bold">Error Loading Details</p>
                                            <p className="text-sm">{detailsError}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!detailsLoading && !detailsError && hotelDetails && (
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 p-5">
                                {/* Left Column */}
                                <div className="lg:col-span-3 space-y-6">
                                    {/* Image Carousel */}
                                    {images.length > 0 && (
                                        <div className="relative w-full aspect-video bg-gray-200 rounded-lg overflow-hidden shadow">
                                            <img
                                                src={getImageUrl(currentImageIndex)}
                                                alt={`${modalTitle} image ${currentImageIndex + 1}`}
                                                className="w-full h-full object-cover cursor-pointer"
                                                onClick={() => openLightbox(currentImageIndex)}
                                                onError={() => handleImageError(currentImageIndex)}
                                                loading="lazy"
                                            />
                                            {/* Prev Button */}
                                            <button
                                                onClick={goToPrevious}
                                                className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-opacity duration-150 z-10"
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            {/* Next Button */}
                                            <button
                                                onClick={goToNext}
                                                className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-opacity duration-150 z-10"
                                                aria-label="Next image"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                            {/* Dots */}
                                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10">
                                                {images.map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                                        className={`w-2 h-2 rounded-full transition-colors duration-150 ${currentImageIndex === idx ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                                                            }`}
                                                        aria-label={`Go to image ${idx + 1}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {images.length === 0 && (
                                         <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 italic">
                                            No images available
                        </div>
                    )}

                                    {/* About this hotel Card */}
                                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#093923] mb-3 flex items-center">
                                            <Info className="w-5 h-5 mr-2 text-[#22c35e]" /> About this Hotel
                                        </h3>
                                        {descriptions.length > 0 ? (
                                            descriptions.filter(d => d.type !== 'spoken_languages' && d.type !== 'attractions' && d.type !== 'amenities').map(renderDescription)
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No description available.</p>
                                        )}
                                        {/* Display amenities description if FacilitiesCard doesn't cover it well enough */} 
                                        {amenitiesDesc && <div className="mt-3 pt-3 border-t border-gray-100">{renderDescription(amenitiesDesc)}</div>}
                                    </div>

                                    {/* --- Collapsible Cards Start --- */}

                                    {/* Facilities Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('facilities')}
                                            className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-[#093923] hover:bg-gray-50 transition-colors"
                                            aria-expanded={expandedSections.facilities}
                                        >
                                            <span className="flex items-center">
                                                <ListChecks className="w-5 h-5 mr-2 text-[#22c35e]" /> Facilities & Amenities
                                            </span>
                                            {expandedSections.facilities ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        {expandedSections.facilities && (
                                            <div className="p-5 pt-0">
                                                <FacilitiesCard facilities={facilities} groupedFacilities={groupedFacilities} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Attractions Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('attractions')}
                                            className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-[#093923] hover:bg-gray-50 transition-colors"
                                            aria-expanded={expandedSections.attractions}
                                        >
                                            <span className="flex items-center">
                                                <MapPin className="w-5 h-5 mr-2 text-[#22c35e]" /> Nearby Attractions
                                            </span>
                                            {expandedSections.attractions ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        {expandedSections.attractions && (
                                            <div className="p-5 pt-0">
                                                <AttractionsCard attractions={nearByAttractions} description={attractionsDesc} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Reviews Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('reviews')}
                                            className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-[#093923] hover:bg-gray-50 transition-colors"
                                            aria-expanded={expandedSections.reviews}
                                        >
                                            <span className="flex items-center">
                                                <MessageSquare className="w-5 h-5 mr-2 text-[#22c35e]" /> Guest Reviews
                                            </span>
                                            {expandedSections.reviews ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        {expandedSections.reviews && (
                                            <div className="p-5 pt-0">
                                                <ReviewsCard reviews={reviews} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Policies Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <button
                                            onClick={() => toggleSection('policies')}
                                            className="w-full flex justify-between items-center p-5 text-left text-lg font-semibold text-[#093923] hover:bg-gray-50 transition-colors"
                                            aria-expanded={expandedSections.policies}
                                        >
                                            <span className="flex items-center">
                                                <ShieldCheck className="w-5 h-5 mr-2 text-[#22c35e]" /> Policies & Information
                                            </span>
                                            {expandedSections.policies ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                                        </button>
                                        {expandedSections.policies && (
                                            <div className="p-5 pt-0">
                                                <PoliciesCard
                                                    policies={policies}
                                                    checkinInfo={checkinInfo}
                                                    checkoutInfo={checkoutInfo}
                                                    languagesDesc={spokenLanguagesDesc}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* --- Collapsible Cards End --- */}

                                </div>

                                {/* Right Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Headline/Location Card */}
                                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#093923] mb-3 flex items-center">
                                            <MapPin className="w-5 h-5 mr-2 text-[#22c35e]" /> Location & Overview
                                        </h3>
                                        {/* Star Rating - Adjusted to use theme color */}
                                        {hotelInfo.starRating && (
                                            <div className="flex items-center mb-2">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <Star
                                                        key={index}
                                                        className={`w-4 h-4 ${index < Math.round(hotelInfo.starRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                    />
                                                ))}
                                                <span className="ml-2 text-xs text-gray-600">({hotelInfo.starRating} Stars)</span>
                                            </div>
                                        )}
                                        {/* Address */}
                                        {hotelInfo.address && (
                                            <p className="text-sm text-gray-600 mb-3">{hotelInfo.address.street}, {hotelInfo.address.city}, {hotelInfo.address.postalCode}, {hotelInfo.address.country}</p>
                                        )}
                                         {/* Headline Description */}
                                        {renderDescription(descriptions.find(d => d.type === 'Headline') || descriptions.find(d => d.type === 'Location'))}
                                    </div>

                                    {/* Google Map Card */}
                                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#093923] mb-3">Hotel Map</h3>
                                        {loadError && <p className='text-red-500 text-sm'>Error loading map.</p>}
                                        {!isLoaded && !loadError && <p className='text-gray-500 text-sm'>Loading map...</p>}
                                        {isLoaded && !loadError && center && (
                                            <GoogleMap
                                                mapContainerStyle={containerStyle}
                                                center={center}
                                                zoom={15} // Adjust zoom level as needed
                                            >
                                                <Marker position={center} title={modalTitle} />
                                            </GoogleMap>
                                        )}
                                        {isLoaded && !loadError && !center && (
                                            <p className="text-sm text-gray-500 italic">Map coordinates not available.</p>
                                        )}
                                    </div>

                                    {/* Room Selection Card */}
                                    <div className="bg-white p-5 rounded-lg border border-gray-200">
                                        <h3 className="text-lg font-semibold text-[#093923] mb-4 flex items-center">
                                            <Hotel className="w-5 h-5 mr-2 text-[#22c35e]" /> Select Room Option
                                        </h3>
                                        {roomRateData && allRecommendations.length > 0 ? (
                                            <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                                {allRecommendations.map(rec => (
                                                    <RoomRateOptionCard
                                        key={rec.id}
                                        recommendation={rec}
                                        roomRateData={roomRateData}
                                        selected={selectedRecommendation?.id === rec.id}
                                        onSelect={() => setSelectedRecommendation(rec)}
                                    />
                                                ))}
                                            </div>
                            ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                {roomRateData ? 'No specific room recommendations found.' : 'Room rate details are not available for this hotel.'}
                                            </p>
                            )}
                        </div>

                                     {/* Price Comparison Card */}
                    {selectedRecommendation && (
                                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                                            <h4 className="text-base font-medium text-[#093923] mb-3">Price Comparison</h4>
                                            <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Selected Option:</span>
                                                    <span className="font-semibold text-base text-[#093923]">
                                                        {currencyFormatter(currentTotalPrice, priceDifferenceCurrency)}
                                </span>
                            </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-gray-600">Original Hotel:</span>
                                                    <span className="text-sm text-gray-500 line-through">
                                                        {currencyFormatter(existingHotelPrice)} {/* Assume original currency is base like INR */}
                                </span>
                            </div>
                             {priceDifference !== 0 && (
                                                    <div className={`flex justify-between items-center mt-2 pt-2 border-t border-gray-100 ${priceDifference > 0 ? 'text-red-600' : 'text-[#22c35e]'}`}>
                                                        <span className="text-sm font-medium">Difference:</span>
                                                        <span className="text-sm font-semibold">
                                                            {priceDifference > 0 ? '+' : '-'}{currencyFormatter(Math.abs(priceDifference), priceDifferenceCurrency)}
                                                        </span>
                                                    </div>
                                                )}
                                                 {priceDifference === 0 && (
                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 text-gray-600">
                                    <span className="text-sm font-medium">Difference:</span>
                                                        <span className="text-sm font-semibold">
                                                            {currencyFormatter(0, priceDifferenceCurrency)}
                                    </span>
                                </div>
                            )}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        )}
                         {!detailsLoading && !detailsError && !hotelDetails && (
                             <div className="p-10 text-center">
                                 <p className="text-gray-500 italic">Could not load hotel details.</p>
                        </div>
                    )}
                </div>

                {/* Footer with Action Button & Status */} 
                    <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex-shrink-0 z-10">
                    {/* Status Display */} 
                    <div className="h-6 mb-2 text-center">
                        {bookingStatus.loading && (
                                <div className="flex items-center justify-center text-[#093923] text-sm">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                <span>{bookingStatus.message || 'Processing...'}</span>
                            </div>
                        )}
                        {bookingStatus.success && (
                                <div className="flex items-center justify-center text-[#22c35e] text-sm font-medium">
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
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#a3eec1] disabled:opacity-50"
                            disabled={bookingStatus.loading || bookingStatus.success}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmChange}
                            disabled={!selectedRecommendation || bookingStatus.loading || bookingStatus.success || detailsLoading || detailsError || !roomRateData}
                                className={`px-5 py-2 rounded-md text-white text-sm font-medium transition-colors duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]
                                ${!selectedRecommendation || detailsLoading || detailsError || !roomRateData
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : bookingStatus.loading || bookingStatus.success
                                            ? 'bg-[#093923]/50 cursor-not-allowed'
                                            : 'bg-[#093923] hover:bg-opacity-90'
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

            {/* Lightbox Modal */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-fade-in"
                    onClick={closeLightbox} // Close on backdrop click
                >
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 z-10"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking image */}
                        <img
                            src={lightboxImageUrl}
                            alt="Lightbox"
                            className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-lg"
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default CrmChangeHotelDetailModal; 