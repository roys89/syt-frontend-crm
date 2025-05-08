import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CrmAddHotelDetailsModal from '../../../components/itinerary/modals/add/CrmAddHotelDetailsModal'; // Import the details modal
import CrmHotelSearchModifyModal from '../../../components/itinerary/modals/add/CrmHotelSearchModifyModal'; // Re-use modify search modal
import CrmHotelFilterModal from '../../../components/itinerary/modals/change/CrmHotelFilterModal'; // Import the filter modal

// --- NEW: Import Hourglass loader ---
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css'; // Ensure CSS is imported

// --- NEW: Star Rating Component ---
import { StarIcon } from '@heroicons/react/24/solid';

// Simple currency formatter helper (can be moved to a utils file)
const currencyFormatter = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'N/A';
    const code = typeof currencyCode === 'string' && currencyCode.trim().length === 3 ? currencyCode.trim().toUpperCase() : 'INR';
    try {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: code, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
    } catch (e) {
        console.error(`Currency formatting error: ${e.message}. Code used: ${code}, Original input: ${currencyCode}`);
        return `${code} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
};

// --- NEW: Star Rating Component ---
const StarRating = ({ rating }) => {
    const totalStars = 5;
    const filledStars = Math.round(parseFloat(rating) || 0); // Round rating to nearest integer
    return (
        <div className="flex items-center">
            {[...Array(totalStars)].map((_, index) => (
                <StarIcon
                    key={index}
                    className={`h-4 w-4 ${index < filledStars ? 'text-yellow-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
};
// --- END: Star Rating Component ---

// Placeholder Hotel Card component - adapt as needed
const CrmAddHotelOptionCard = ({ hotel, onSelectHotel }) => {
    // Removed carousel state: const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const currentPrice = hotel?.availability?.rate?.finalRate ?? 0;
    const currency = hotel?.availability?.rate?.currency ?? 'INR';

    // --- Reverted: Get single image URL (prefer Xxl) ---
    const imageUrl = hotel?.images?.[0]?.links?.find(link => link.size === 'Xxl')?.url
                   ?? hotel?.heroImage // Fallback to heroImage
                   ?? '/img/placeholder.png'; // Fallback to placeholder
    // Removed logic to extract all imageUrls
    // --- END: Reverted Image URL logic ---

    const hotelName = hotel?.name ?? 'Hotel Name N/A';
    const starRating = hotel?.starRating;
    // Get complete address
    const address = hotel?.contact?.address || {};
    const addressLine1 = address.line1 || '';
    const addressLine2 = address.line2 || '';
    const city = address.city?.name || '';
    const state = address.state?.name || '';
    const country = address.country?.name || '';
    const postalCode = address.postalCode || '';
    
    // Combine address components into a formatted address
    const formattedAddress = [addressLine1, addressLine2]
        .filter(Boolean)
        .join(', ');
    
    const formattedLocation = [city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    
    const review = hotel?.reviews?.[0]; // Get first review object
    const facilities = hotel?.facilities || [];
    
    // Additional details from the API response
    const chainName = hotel?.chainName;
    const hotelType = hotel?.type || hotel?.category;
    
    // Payment/Cancellation options
    const options = hotel?.availability?.options || {};
    const isFreeBreakfast = options.freeBreakfast;
    const isFreeCancellation = options.freeCancellation;
    const isPayAtHotel = options.payAtHotel;
    const isRefundable = options.refundable;

    // Simple check for key facilities
    const hasWifi = facilities.some(f => f.name?.toLowerCase().includes('wifi'));
    const hasPool = facilities.some(f => f.name?.toLowerCase().includes('pool'));
    const hasSpa = facilities.some(f => f.name?.toLowerCase().includes('spa'));
    const hasParking = facilities.some(f => f.name?.toLowerCase().includes('parking'));
    const hasRestaurant = facilities.some(f => f.name?.toLowerCase().includes('restaurant'));
    const hasGym = facilities.some(f => f.name?.toLowerCase().includes('fitness') || f.name?.toLowerCase().includes('gym'));
    const hasBeach = facilities.some(f => f.name?.toLowerCase().includes('beach'));
    
    // Create an array of available highlights
    const availableHighlights = [
        { key: 'wifi', condition: hasWifi, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>, text: 'WiFi' },
        { key: 'pool', condition: hasPool, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>, text: 'Pool' },
        { key: 'spa', condition: hasSpa, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>, text: 'Spa' },
        { key: 'gym', condition: hasGym, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>, text: 'Gym' },
        { key: 'restaurant', condition: hasRestaurant, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3zM19 9H5M19 15H5M12 3v18" /></svg>, text: 'Restaurant' },
        { key: 'parking', condition: hasParking, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a5.5 5.5 0 00-5.5 5.5c0 3.584 2.6 6.68 5.5 11 2.9-4.32 5.5-7.416 5.5-11A5.5 5.5 0 0012 2zm0 8.5a3 3 0 110-6 3 3 0 010 6z" /></svg>, text: 'Parking' }, // Example icon
        { key: 'breakfast', condition: isFreeBreakfast, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, text: 'Breakfast'}, // Example icon
        { key: 'beach', condition: hasBeach, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-7 7 2 2-7 7 12-4 3-3-4-4 3-3-4zM3 12v8h18v-8" /></svg>, text: 'Beach'}, // Example icon
    ].filter(h => h.condition);

    const maxHighlightsToShow = 4;
    const highlightsToShow = availableHighlights.slice(0, maxHighlightsToShow);
    const remainingHighlightCount = availableHighlights.length - highlightsToShow.length;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white cursor-pointer relative z-0"
            onClick={() => onSelectHotel(hotel)}>
            
            {/* Main Grid: Image(4) + Content(6) + Price(2) = 12 */}
            <div className="grid grid-cols-12" style={{ minHeight: '180px' }}>
                {/* Image container - Reverted to single static image */}
                <div className="col-span-12 sm:col-span-4 h-48 sm:h-auto relative"> 
                 {/* Render single image */}
                 <img
                    src={imageUrl}
                    alt={hotelName}
                    className={`w-full h-full object-cover absolute inset-0`} // Removed transition/opacity classes
                    onError={(e) => { e.target.src = '/img/placeholder.png'; }}
                 />
                 {/* Removed image mapping logic */}
                    {chainName && (
                        <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs py-1 px-2 m-2 rounded z-10"> {/* Adjusted z-index */}
                            {chainName}
                        </div>
                    )}
                    {starRating && (
                        <div className="absolute top-0 right-0 bg-yellow-400/90 text-black font-semibold text-xs py-1 px-2 m-2 rounded z-10"> {/* Adjusted z-index */}
                            {starRating} ★
                        </div>
                    )}
                </div>
                
                {/* Content area - ADJUSTED to 6 columns (for Hotel Info + Highlights) */}
                <div className="col-span-12 sm:col-span-6 p-4">
                    {/* Inner Grid: Hotel Info(3) + Highlights(3) = 6 */}
                    <div className="grid grid-cols-6 gap-2 h-full">
                        {/* Hotel info - INCREASED to 4 columns */}
                        <div className="col-span-12 sm:col-span-4 overflow-hidden">
                            <div className="flex flex-col h-full">
                                {/* Hotel name and type - Removed truncate from h3 */}
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base" title={hotelName}>
                                        {hotelName}
                                    </h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-600 flex-wrap">
                                        {hotelType && <span className="mr-2 bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs font-medium">{hotelType}</span>}
                                        {city && <span className="truncate">{city}</span>}
                                    </div>
                                </div>
                                
                                {/* Address */}
                                <div className="mt-1.5">
                                    {formattedAddress && (
                                        <p className="text-xs text-gray-600 truncate" title={formattedAddress}>
                                            {formattedAddress}
                                        </p>
                                    )}
                                    {formattedLocation && (
                                        <p className="text-xs text-gray-600 truncate" title={formattedLocation}>
                                            {formattedLocation}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Reviews */}
                                {review && review.rating && (
                                    <div className="flex items-center mt-1.5 flex-wrap">
                                        <span className="bg-blue-600 text-white font-bold px-1.5 py-0.5 rounded text-xs mr-1">
                                            {parseFloat(review.rating).toFixed(1)}
                                        </span>
                                        <span className="text-xs font-medium text-gray-800 mr-1">
                                            {review.rating >= 4.5 ? 'Exceptional' : 
                                            review.rating >= 4.0 ? 'Excellent' : 
                                            review.rating >= 3.5 ? 'Very Good' : 
                                            review.rating >= 3.0 ? 'Good' : 'Average'}
                                        </span>
                                        {review.count && <span className="text-gray-500 text-xs">({review.count} reviews)</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Highlighted Amenities Column - takes 3 columns */}
                        <div className="hidden sm:block sm:col-span-2 border-l border-gray-200 pl-3">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Highlights</h4>
                            <ul className="space-y-1.5">
                                {highlightsToShow.map(highlight => (
                                    <li key={highlight.key} className="flex items-center text-xs text-gray-600">
                                        {highlight.icon}
                                        <span>{highlight.text}</span>
                                    </li>
                                ))}
                                {remainingHighlightCount > 0 && (
                                     <li className="flex items-center text-xs text-blue-600 font-medium mt-1.5">
                                         +{remainingHighlightCount} more
                                     </li>
                                )}
                            </ul>
            </div>
                    </div> {/* End Inner Grid */}
                </div> {/* End Content Area */}
                
                {/* Price & Book section - DECREASED to 2 columns, direct child of main grid */}
                <div className="col-span-12 sm:col-span-2 grid grid-cols-1 pt-3 sm:pt-0 mt-3 sm:mt-0 border-t sm:border-t-0 sm:border-l border-gray-200">
                    <div className="w-full flex flex-col justify-between h-full p-2 sm:p-3">
                        <div className="text-right mb-3">
                            <div className="font-bold text-blue-700 text-lg sm:text-xl">
                        {currencyFormatter(currentPrice, currency)}
                            </div>
                        </div>
                        
                        <div className="w-full">
                            <button 
                                className="bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition-colors w-full" // Reduced padding slightly for narrower column
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectHotel(hotel);
                                }}
                            >
                                View Details
                            </button>
                            {isRefundable && (
                                <p className="text-xs text-green-600 mt-1 text-center">Refundable</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Placeholder for the Rate Modal Component
const CrmAddHotelRateModalPlaceholder = ({ isOpen, onClose }) => { // Added isOpen/onClose for basic rendering
    if (!isOpen) return null;
    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Add Hotel Rate Modal (Placeholder)</h2>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
            </div>
        </div>
    );
} // TODO: Replace with actual import and component


const CrmAddHotelResultsPage = () => {
    let { itineraryToken, city, checkIn, checkOut } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { inquiryToken, travelersDetails: initialTravelersDetails } = location.state || {};

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [traceId, setTraceId] = useState(null);
    const [currentTravelersDetails, setCurrentTravelersDetails] = useState(initialTravelersDetails || { rooms: [{ adults: 1, children: [] }] });
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [selectedHotelForModal, setSelectedHotelForModal] = useState(null);
    const [isModifySearchModalOpen, setIsModifySearchModalOpen] = useState(false);

    // Filter State
    const [serverFilters, setServerFilters] = useState({
        freeBreakfast: false,
        isRefundable: false,
        hotelName: '',
        ratings: [],
        facilities: [],
        reviewRatings: null,
        type: null,
        tags: null
    });
    
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
    const [currentSort, setCurrentSort] = useState('relevance');
    const [maxPriceFilter, setMaxPriceFilter] = useState(null);
    // --- NEW: Track if max price filter is actively set by user ---
    const [isMaxPriceFilterActive, setIsMaxPriceFilterActive] = useState(false);
    
    // --- NEW: State to store the selected price point ('max' or number) ---
    const [selectedPricePointValue, setSelectedPricePointValue] = useState('max');
    
    // Results count information
    const [totalCount, setTotalCount] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    
    // Reference to loading element for infinite scroll
    const loadingRef = useRef(null);
    
    // Ref to prevent double fetch
    const fetchInitiatedRef = useRef(false);

    // Fetch Hotels with filters
    const fetchHotels = useCallback(async (pageNumber, currentCity, currentCheckIn, currentCheckOut, currentInquiryToken, currentTravelers, filters = null, sortBy = null, directMaxPrice = null) => {
        // Set loading states
        if (pageNumber === 1) {
        setLoading(true);
            setHotels([]);
            setCurrentPage(1);
            setHasMore(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);

        // Reset traceId only on new searches
        if (pageNumber === 1) setTraceId(null);

        // Validate required parameters
        if (!currentInquiryToken) {
             setError("Missing inquiry token. Cannot fetch hotels.");
             setLoading(false);
             return;
        }
        if (!currentTravelers || !currentTravelers.rooms) {
             setError("Missing or invalid traveler details. Cannot fetch hotels.");
             setLoading(false);
             return;
        }

        // Calculate occupancies
        let occupancies = [];
        try {
             occupancies = currentTravelers.rooms.map(room => ({
                 numOfAdults: Array.isArray(room.adults) ? room.adults.length : 0,
                 childAges: Array.isArray(room.children) ? room.children.map(age => age ?? 0) : []
            }));
             if (occupancies.some(occ => occ.numOfAdults < 1)) {
                 throw new Error("Invalid guest configuration: Each room needs at least one adult.");
             }
        } catch (mappingError) {
             console.error("Error mapping traveler details to occupancies:", mappingError, currentTravelers);
             setError("Invalid traveler details format.");
             setLoading(false);
             return;
        }

        console.log(`AddHotelResultsPage: Fetching page ${pageNumber} via POST for ${currentCity}...`);

        try {
            const apiUrl = `http://localhost:5000/api/itinerary/hotels/${currentInquiryToken}/${encodeURIComponent(currentCity)}/${currentCheckIn}/${currentCheckOut}`;

            // Prepare request body - Base structure
            const requestBody = {
                occupancies,
                page: pageNumber,
                // Default nationality, adjust if needed
                nationality: "IN"
            };

            // Add traceId for pagination
            if (pageNumber > 1 && traceId) {
                console.log(`AddHotelResultsPage: Including traceId for pagination: ${traceId}`);
                requestBody.traceId = traceId;
            }

            // Prepare filterBy object from filters, excluding sortBy and finalRate (which goes into sortBy)
            let filterBy = {};
            if (filters && Object.keys(filters).length > 0) {
                // Deep copy to prevent mutations and exclude sortBy and finalRate
                const { sortBy: removedSortBy, finalRate: removedFinalRate, ...restFilters } = filters;
                filterBy = JSON.parse(JSON.stringify(restFilters));

                // Clean up empty/null values from filterBy
                Object.keys(filterBy).forEach(key => {
                    if (
                        filterBy[key] === null ||
                        filterBy[key] === '' ||
                        (Array.isArray(filterBy[key]) && filterBy[key].length === 0)
                    ) {
                        delete filterBy[key];
                    }
                });

                 // Add finalRate if it exists and is a number
                 if (typeof filters.finalRate === 'number' && !isNaN(filters.finalRate)) {
                    filterBy.finalRate = filters.finalRate;
                 }

                // Only add filterBy to request body if it has properties
                if (Object.keys(filterBy).length > 0) {
                    requestBody.filterBy = filterBy;
                }
            }

            // Add sortBy to the root of the request body
            // Modify sortBy structure to include finalRate if it exists
            let finalSortBy = {};
            if (sortBy) {
                // Use the full sort object directly with id, value and label
                finalSortBy = { ...sortBy };
                
                // Add max price if available
                const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : 
                                      (isMaxPriceFilterActive ? maxPriceFilter : null);
                if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                    console.log(`AddHotelResultsPage: Including finalRate ${activeMaxPrice} in sortBy`, finalSortBy);
                }
            } else {
                // Default to relevance
                finalSortBy = getCurrentSortObject('relevance');
                
                // Only include finalRate in the request if explicit max price is set
                const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : 
                                      (isMaxPriceFilterActive ? maxPriceFilter : null);
                if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                    console.log(`AddHotelResultsPage: Including finalRate ${activeMaxPrice} in sortBy (default)`, finalSortBy);
                }
            }
            requestBody.sortBy = finalSortBy; // Assign the fully constructed object

            console.log(`AddHotelResultsPage: Search Request:`, JSON.stringify(requestBody, null, 2));

            // Make API request
            const response = await fetch(apiUrl, {
                 method: 'POST',
                 headers: {
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    "X-Inquiry-Token": currentInquiryToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: response.statusText }));
                 throw new Error(errorData.message || `Failed to fetch hotels (${response.status})`);
             }

            const responseData = await response.json();
            console.log("AddHotelResultsPage: API Response:", responseData);

            const resultData = responseData?.data?.results?.[0];

            if (responseData?.success && resultData) {
                // Process hotel data
                const newHotels = resultData.data || [];
                
                // Update hotels list
                setHotels(prev => pageNumber === 1 ? newHotels : [...prev, ...newHotels]);
                
                // Update traceId for pagination
                if (resultData.traceId) {
                    setTraceId(resultData.traceId);
                }
                
                // Update pagination state
                setCurrentPage(resultData.currentPage || pageNumber);
                setHasMore(!!resultData.nextPage);
                
                // Update count information
                if (resultData.totalCount !== undefined) {
                    setTotalCount(resultData.totalCount);
                }
                if (resultData.filteredCount !== undefined) {
                    setFilteredCount(resultData.filteredCount);
                } else if (resultData.totalCount !== undefined) {
                    setFilteredCount(resultData.totalCount);
                }
            } else {
                // Handle error or no results
                if (pageNumber === 1) setHotels([]);
                setHasMore(false);
                const message = responseData?.data?.message || responseData?.message || "No hotels found matching your criteria.";
                console.warn("AddHotelResultsPage: " + message, responseData);
                if (pageNumber === 1) setError(message);
            }
        } catch (err) {
            console.error(`AddHotelResultsPage: Error fetching page ${pageNumber}:`, err);
            setError(err.message || 'An unknown error occurred while fetching hotels.');
            if (pageNumber === 1) setHotels([]);
            setHasMore(false);
        } finally {
            if (pageNumber === 1) {
            setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, []);

    // Initialize search on component mount
    useEffect(() => {
        if (!inquiryToken || !city || !checkIn || !checkOut || !initialTravelersDetails) {
            setError("Missing required information to load results.");
            setLoading(false);
            setHasMore(false);
            return;
        }

        // Only fetch on initial mount
        if (!fetchInitiatedRef.current) {
            console.log("AddHotelResultsPage: Initial fetch");
            fetchInitiatedRef.current = true;
            setCurrentTravelersDetails(initialTravelersDetails);
            // Initial fetch with no filters
            fetchHotels(1, city, checkIn, checkOut, inquiryToken, initialTravelersDetails, null);
        }
        
        return () => { 
            fetchInitiatedRef.current = false;
        };
    }, [city, checkIn, checkOut, inquiryToken, initialTravelersDetails, fetchHotels]);

    // Handle price range updates from initial data
    useEffect(() => {
        if (hotels.length > 0) {
            const prices = hotels
                .map(hotel => hotel?.availability?.rate?.finalRate)
                .filter(price => typeof price === 'number' && !isNaN(price));
            if (prices.length > 0) {
                const minPrice = Math.floor(Math.min(...prices));
                const maxPrice = Math.ceil(Math.max(...prices));
                setPriceRange({ min: minPrice, max: maxPrice });
            }
        }
    }, [hotels]);

    // Load more hotels when user scrolls
    const loadMoreHotels = useCallback(() => {
        if (loading || loadingMore || !hasMore) {
            console.log("Cannot load more:", loading ? "Still loading" : loadingMore ? "Already loading more" : "No more results");
            return;
        }
        console.log("Loading more hotels...");
        setLoadingMore(true);
        // Fetch next page with active filters
        // --- Ensure we get the correct current sort object ---
        const currentSortObject = getCurrentSortObject(currentSort);
        // --- Pass the current serverFilters and maxPriceFilter state ---
        fetchHotels(currentPage + 1, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, serverFilters, currentSortObject, maxPriceFilter);
    // --- MODIFIED: Add maxPriceFilter and currentSort to dependencies ---
    }, [loading, loadingMore, hasMore, currentPage, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, fetchHotels, serverFilters, currentSort, maxPriceFilter]);

    // Set up intersection observer for infinite scrolling
    useEffect(() => {
        if (loading || hotels.length === 0 || loadingMore || !hasMore) {
            return;
        }

        const options = {
            root: null,
            rootMargin: '300px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
                loadMoreHotels();
            }
        }, options);

        const currentLoadingRef = loadingRef.current;
        if (currentLoadingRef) {
            observer.observe(currentLoadingRef);
        }

        return () => {
            if (currentLoadingRef) {
                observer.unobserve(currentLoadingRef);
            }
            observer.disconnect();
        };
    }, [loading, loadingMore, hasMore, loadMoreHotels, hotels.length]);

    // Set up scroll event listener as fallback
    useEffect(() => {
        if (loading || hotels.length === 0) {
            return;
        }
        
        const handleScroll = () => {
            if (loading || loadingMore || !hasMore) {
                return;
            }

            const scrollTop = window.scrollY || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = Math.max(
                document.body.scrollHeight, 
                document.documentElement.scrollHeight,
                document.body.offsetHeight, 
                document.documentElement.offsetHeight,
                document.body.clientHeight, 
                document.documentElement.clientHeight
            );
            
            const buffer = 300;
            const atBottom = windowHeight + scrollTop >= documentHeight - buffer;
            
            if (atBottom) {
                loadMoreHotels();
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore, loadMoreHotels, hotels.length]);

    // Fix handleFilterChange - restore proper functionality
    const handleFilterChange = useCallback((type, value) => {
        // Restore original implementation, which should be a no-op
        // but might be referenced by other components
    }, []);

    // Remove unnecessary guards that broke functionality
    const handleServerFilterApply = useCallback((newFilters) => {
        console.log("Applying server filters to API request:", newFilters);

        // Create a processed copy of the filters with correct types
        const processedFilters = { ...newFilters };

        // Ensure boolean values are proper booleans
        if ('freeBreakfast' in processedFilters) {
            processedFilters.freeBreakfast = Boolean(processedFilters.freeBreakfast);
        }
        if ('isRefundable' in processedFilters) {
            processedFilters.isRefundable = Boolean(processedFilters.isRefundable);
        }

        // Ensure reviewRatings is in the correct format (array of numbers between 1-5)
        if (processedFilters.reviewRatings && Array.isArray(processedFilters.reviewRatings)) {
            // Make sure values are within the valid range
            processedFilters.reviewRatings = processedFilters.reviewRatings
                .map(r => Number(r))
                .filter(r => !isNaN(r) && r >= 1 && r <= 5);

            // If empty after filtering, remove the property
            if (processedFilters.reviewRatings.length === 0) {
                delete processedFilters.reviewRatings;
            }
        }

        // Ensure finalRate is a number or null
        if ('finalRate' in processedFilters) {
            const finalRateNum = Number(processedFilters.finalRate);
            processedFilters.finalRate = !isNaN(finalRateNum) ? finalRateNum : null;
            if (processedFilters.finalRate === null) {
                 delete processedFilters.finalRate; // Remove if invalid or null
            }
        }

        // --- Process type filter --- 
        if ('type' in processedFilters && typeof processedFilters.type === 'string' && processedFilters.type.trim() !== '') {
            processedFilters.type = processedFilters.type.trim();
        } else {
             delete processedFilters.type; // Remove if invalid or empty
        }
        
        // --- Process tags filter --- 
        if ('tags' in processedFilters && Array.isArray(processedFilters.tags) && processedFilters.tags.length > 0) {
            // Ensure tags are strings and non-empty after trim
            processedFilters.tags = processedFilters.tags.map(tag => String(tag).trim()).filter(tag => tag);
            if (processedFilters.tags.length === 0) {
                 delete processedFilters.tags; // Remove if empty after processing
            }
        } else {
            delete processedFilters.tags; // Remove if not a valid array
        }

        // --- Separate finalRate filter for sortBy --- 
        let newMaxPrice = null;
        // --- NEW: Get original price point value from filters --- 
        const originalPricePoint = processedFilters.finalRate; // This is the per-night/adult rate or null
        setSelectedPricePointValue(originalPricePoint === null ? 'max' : originalPricePoint);
        
        // Calculate total max price only if a numeric point was selected
        if (originalPricePoint !== null && typeof originalPricePoint === 'number' && !isNaN(originalPricePoint)) {
            const perNightPerAdultRate = originalPricePoint;
            
            // Calculate number of nights
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            const numberOfNights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            
            // Calculate total adults
            let totalAdults = 0;
            if (currentTravelersDetails && Array.isArray(currentTravelersDetails.rooms)) {
                // Sum adults across all rooms
                totalAdults = currentTravelersDetails.rooms.reduce((sum, room) => {
                    const adultsInRoom = Array.isArray(room.adults) ? room.adults.length : 
                                        (typeof room.adults === 'number' ? room.adults : 0);
                    return sum + adultsInRoom;
                }, 0);
            }
            
            // Ensure we have at least one adult
            totalAdults = Math.max(1, totalAdults);
            
            // Calculate total max price
            const totalMaxPrice = perNightPerAdultRate * numberOfNights * totalAdults;
            
            console.log(`AddHotelResultsPage: Calculated finalRate: ${perNightPerAdultRate}/night/adult × ${numberOfNights} nights × ${totalAdults} adults = ${totalMaxPrice}`);
            
            newMaxPrice = totalMaxPrice;
        }
        
        // IMPORTANT: Remove finalRate from the filters object itself as it's handled separately
        delete processedFilters.finalRate; 
        setMaxPriceFilter(newMaxPrice); // Update the separate state
        setIsMaxPriceFilterActive(newMaxPrice !== null);

        // Update filter state (this now includes type, tags, etc., but NOT finalRate)
        // We still set the state for consistency, but pass the processed object directly
        setServerFilters(processedFilters); 

        // Reset pagination and fetch with new filters and current sort
        setCurrentPage(1);
        setHasMore(true);

        // Get the current sort object
        const currentSortObject = getCurrentSortObject(currentSort);

        // MODIFIED: Pass the *processedFilters* directly to fetchHotels
        // along with the newMaxPrice
        fetchHotels(1, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, processedFilters, currentSortObject, newMaxPrice);
    }, [city, checkIn, checkOut, inquiryToken, currentTravelersDetails, fetchHotels, currentSort]); // Removed serverFilters dependency as we pass directly

    // Helper to get the sort object based on the currentSort string
    const getCurrentSortObject = (sortValue) => {
        // Map UI sort values to API sort format
        const sortMapping = {
            'priceAsc': { finalRate: 'asc', label: 'Price: Low to High', id: 2, value: 1 },
            'priceDesc': { finalRate: 'desc', label: 'Price: High to Low', id: 2, value: 2 },
            'ratingDesc': { rating: 'desc', label: 'Rating: High to Low', id: 3, value: 2 },
            'nameAsc': { name: 'asc', label: 'Name: A to Z', id: 4, value: 1 },
            'relevance': { label: 'Relevance', id: 1, value: 1 }
        };
        return sortMapping[sortValue] || sortMapping['relevance']; // Default to relevance
    };

    // Handle filter reset
    const handleFilterReset = useCallback(() => {
        // Reset server filters (excluding sortBy, which is handled separately)
        const resetFilters = {
            freeBreakfast: false,
            isRefundable: false,
            hotelName: '',
            ratings: [],
            facilities: [],
            reviewRatings: null,
            type: null,
            tags: null,
            // finalRate: null // Explicitly reset finalRate - NO LONGER IN resetFilters
        };

        setServerFilters(resetFilters);
        setCurrentSort('relevance'); // Reset sort to relevance
        setMaxPriceFilter(null);    // Reset max price filter state
        setIsMaxPriceFilterActive(false); // Reset active flag
        setSelectedPricePointValue('max'); // --- NEW: Reset selected price point value ---

        // Fetch without filters, using default sort (relevance)
        const defaultSortObject = getCurrentSortObject('relevance');
        fetchHotels(1, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, null, defaultSortObject, null);
    }, [city, checkIn, checkOut, inquiryToken, currentTravelersDetails, fetchHotels]);

    // Handle sort change
    const handleSortChange = useCallback((sortValue) => {
        setCurrentSort(sortValue);

        // Get the new sort object
        const newSortObject = getCurrentSortObject(sortValue);

        // Re-fetch with the current filters and the new sort option
        // serverFilters state already holds the current filter values (type, tags, etc.)
        // maxPriceFilter state holds the current max price
        fetchHotels(1, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, serverFilters, newSortObject, maxPriceFilter);

    }, [serverFilters, maxPriceFilter, city, checkIn, checkOut, inquiryToken, currentTravelersDetails, fetchHotels]);

    // --- Rate Modal Control ---
    const handleSelectHotel = (hotel) => {
        if (!traceId) {
            toast.error("Cannot proceed: Search trace ID is missing.");
            return;
        }
        console.log("AddHotelResultsPage: Selected hotel for rate modal:", hotel);
        setSelectedHotelForModal(hotel);
        setIsRateModalOpen(true);
    };

    const handleCloseRateModal = () => {
        setIsRateModalOpen(false);
        setTimeout(() => setSelectedHotelForModal(null), 300); // Delay clearing
    };

    // --- Modify Search Modal Control & Logic ---
    const handleOpenModifySearchModal = () => {
        setIsModifySearchModalOpen(true);
    };

    const handleCloseModifySearchModal = () => {
        setIsModifySearchModalOpen(false);
    };

    const handlePerformNewSearch = (newSearchParams) => {
        const { checkIn: newCheckIn, checkOut: newCheckOut, travelersDetails: updatedTravelersDetails } = newSearchParams;
        handleCloseModifySearchModal();
        console.log("AddHotelResultsPage: Navigating with new search params - Resetting to page 1");
        // Reset fetch flag is handled by navigation/remount
        navigate(
            `/crm/itinerary/${itineraryToken}/add-hotel-results/${encodeURIComponent(city)}/${newCheckIn}/${newCheckOut}`,
            {
                state: { inquiryToken, travelersDetails: updatedTravelersDetails },
                replace: true 
            }
        );
        // Component remounts, useEffect handles fetching page 1
    };

    // --- Navigation and Success Handlers ---
    const handleBackToItinerary = () => {
        if (itineraryToken && inquiryToken) {
            navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
        } else {
            toast.error("Could not determine which itinerary to return to.");
            navigate('/bookings');
        }
    };

    const handleHotelAddedSuccessfully = () => {
        toast.success("Hotel successfully added to the itinerary!");
        handleCloseRateModal();
        handleBackToItinerary(); // Navigate back after success
    };

    return (
        <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3 bg-gray-100 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 bg-white p-4 py-3 rounded-lg shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                     <button
                        onClick={handleBackToItinerary}
                        className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Back to Itinerary"
                     >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-grow min-w-0">
                        <h1 className="text-xl font-bold text-gray-800 truncate">
                            Add Hotel in {city}
                        </h1>
                        <p className="text-xs text-gray-500 truncate">
                            Check-in: {checkIn} | Check-out: {checkOut}
                            {filteredCount !== 0 && totalCount !== 0 && (
                                <span className="ml-2 font-semibold">
                                    {filteredCount === totalCount ? 
                                        `${totalCount} hotels found` : 
                                        `${filteredCount} of ${totalCount} hotels`}
                                </span>
                            )}
                        </p>
                    </div>
                </div>
                 {/* Modify Search button */}
                 <div className="flex-shrink-0 ml-4">
                     <button
                        onClick={handleOpenModifySearchModal}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Modify Search Criteria"
                        disabled={loading} // Disable while loading initial results
                     >
                         Modify Search
                     </button>
                 </div>
            </div>

            {/* Main Content Area */}
            <div className="mt-6 flex">
                {/* Left Sidebar with Filter */}
                <aside className="w-full md:w-72 lg:w-80 flex-shrink-0">
                    <div>
                        <CrmHotelFilterModal
                            initialFilters={{
                                search: serverFilters.hotelName || '',
                                price: [priceRange.min, serverFilters.finalRate ?? priceRange.max],
                                starRating: serverFilters.ratings || [],
                                amenities: [], // UI only - derived from server filters
                                reviewRatingsSelected: serverFilters.reviewRatings || [],
                                serverFilters: { 
                                    ...serverFilters,
                                    // Add finalRate back for the modal UI from the separate state
                                    finalRate: maxPriceFilter ?? priceRange.max 
                                },
                                // --- NEW: Pass selected price point value --- 
                                currentPricePoint: selectedPricePointValue
                            }}
                            priceRange={priceRange}
                            currentSort={currentSort}
                            onFilterChange={handleFilterChange}
                            onSortChange={handleSortChange}
                            onServerFilterApply={handleServerFilterApply}
                            onFilterReset={handleFilterReset}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            isServerFiltering={true}
                        />
                    </div>
                </aside>
                
                {/* Right Content Area */}
                <main className="flex-1 flex flex-col ml-0 md:ml-6">
                    {/* Filter Visibility for Mobile */}
                    <div className="md:hidden mb-4">
                        <CrmHotelFilterModal
                            initialFilters={{
                                search: serverFilters.hotelName || '',
                                price: [priceRange.min, serverFilters.finalRate ?? priceRange.max],
                                starRating: serverFilters.ratings || [],
                                amenities: [], // UI only - derived from server filters
                                reviewRatingsSelected: serverFilters.reviewRatings || [],
                                serverFilters: {
                                    ...serverFilters,
                                    finalRate: maxPriceFilter ?? priceRange.max,
                                    // --- NEW: Pass selected price point value --- 
                                    currentPricePoint: selectedPricePointValue
                                } // Pass the full serverFilters object
                            }}
                            priceRange={priceRange}
                            currentSort={currentSort}
                            onFilterChange={handleFilterChange}
                            onSortChange={handleSortChange}
                            onServerFilterApply={handleServerFilterApply}
                            onFilterReset={handleFilterReset}
                            totalCount={totalCount}
                            filteredCount={filteredCount}
                            isServerFiltering={true}
                        />
                    </div>
                
                {loading && (
                    <div className="text-center flex flex-row items-center justify-center py-10">
                        <Hourglass size="40" color="#6366F1" />
                        <p className="text-gray-600 ml-3">Loading available hotels...</p>
                    </div>
                )}
                {error && !loadingMore && (
                    <div className="flex-grow flex items-center justify-center py-10">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl text-center" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                )}

                {!loading && hotels.length > 0 && (
                    <div className="grid grid-cols-1 gap-5 mb-6">
                        {hotels.map((hotel, index) => (
                            <CrmAddHotelOptionCard
                                key={hotel.id || `hotel-${index}`}
                                hotel={hotel}
                                onSelectHotel={handleSelectHotel}
                            />
                        ))}
                    </div>
                )}

                {!loading && !error && hotels.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">No hotels found matching the criteria.</p>
                )}

                {!loading && (
                    <div 
                        ref={loadingRef}
                        className="py-8 text-center"
                        style={{ minHeight: '100px' }}
                        id="scroll-loader"
                    >
                        {loadingMore ? (
                            <div className="flex flex-col items-center">
                                <Hourglass size="30" color="#6366F1" />
                                <p className="text-sm text-gray-500 mt-2">Loading more hotels...</p>
                            </div>
                        ) : !hasMore && hotels.length > 0 ? (
                            <p className="text-center text-gray-500 py-2 text-sm">You've reached the end of the results.</p>
                        ) : hasMore && hotels.length > 0 ? (
                            <p className="text-gray-400 text-xs">Scroll for more</p>
                        ) : null}
                    </div>
                )}
                </main>
            </div>

            {/* Use CrmAddHotelDetailsModal */}
            {isRateModalOpen && selectedHotelForModal && (
                 <CrmAddHotelDetailsModal
                    isOpen={isRateModalOpen}
                    onClose={handleCloseRateModal}
                    selectedHotel={selectedHotelForModal}
                    itineraryToken={itineraryToken}
                    inquiryToken={inquiryToken}
                    traceId={traceId}
                    city={city}
                    date={checkIn} // Pass checkIn date
                    dates={{ checkIn, checkOut }}
                    onHotelAdded={handleHotelAddedSuccessfully}
                    // No oldHotelCode or existingHotelPrice needed for adding
                    // We will need to adjust CrmAddHotelDetailsModal internally later
                />
            )}

            {/* Modify Search Modal */}
            {isModifySearchModalOpen && (
                <CrmHotelSearchModifyModal
                    isOpen={isModifySearchModalOpen}
                    onClose={handleCloseModifySearchModal}
                    currentSearch={{ city, checkIn, checkOut, travelersDetails: currentTravelersDetails }}
                    onSearchUpdate={handlePerformNewSearch}
                />
            )}
        </div>
    );
};

export default CrmAddHotelResultsPage;
