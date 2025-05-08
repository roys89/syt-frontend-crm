import { ArrowLeftIcon } from '@heroicons/react/24/solid'; // Use solid icons
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CrmHotelSearchModifyModal from '../../../components/itinerary/modals/add/CrmHotelSearchModifyModal'; // Import the search modify modal
import CrmChangeHotelDetailModal from '../../../components/itinerary/modals/change/CrmChangeHotelDetailModal'; // Import the new modal
import CrmHotelFilterModal from '../../../components/itinerary/modals/change/CrmHotelFilterModal'; // Import the filter modal

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


// Placeholder for Hotel Card component - adapt or create a specific one
const CrmChangeHotelOptionCard = ({ hotel, existingHotelPrice, onSelectHotel }) => {
    // Safely access nested properties with optional chaining and defaults
    const currentPrice = hotel?.availability?.rate?.finalRate ?? 0;
    const currency = hotel?.availability?.rate?.currency ?? 'INR';
    const imageUrl = hotel?.images?.[0]?.links?.find(link => link.size === 'Standard')?.url
                   ?? hotel?.heroImage
                   ?? '/api/placeholder/400/300';
    const hotelName = hotel?.name ?? 'Hotel Name N/A';

    const priceDifference = currentPrice - (existingHotelPrice || 0);
    const priceStatus = priceDifference === 0 ? 'same' : priceDifference > 0 ? 'increased' : 'decreased';

    return (
        <div
            className="border rounded-lg overflow-hidden shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
            onClick={() => onSelectHotel(hotel)}
        >
            <div className="relative h-40 w-full flex-shrink-0">
                 <img
                    src={imageUrl}
                    alt={hotelName}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.target.src = '/api/placeholder/400/300'; }}
                 />
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h4 className="font-semibold text-gray-800 truncate mb-1 text-sm" title={hotelName}>{hotelName}</h4>
                {/* TODO: Add rating, location if available in API response */}
                <div className="mt-auto">
                    <p className="text-base font-bold text-blue-600">
                        {currencyFormatter(currentPrice, currency)}
                    </p>
                    {priceStatus !== 'same' && (
                        <p className={`text-xs font-medium ${priceStatus === 'increased' ? 'text-red-600' : 'text-green-600'}`}>
                            {priceStatus === 'increased' ? '+' : '-'}{currencyFormatter(Math.abs(priceDifference), currency)} vs current
                        </p>
                    )}
                    {priceStatus === 'same' && (
                        <p className="text-xs text-gray-500">Same price as current</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const CrmChangeHotelsPage = () => {
    let { itineraryToken, city, checkIn, checkOut } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // State for traveler details, initialized from navigation state
    const [currentTravelersDetails, setCurrentTravelersDetails] = useState(null); 

    // Extract other state (remains constant for this page instance unless search is modified)
    const { existingHotelPrice, oldHotelCode, inquiryToken } = location.state || {};

    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [traceId, setTraceId] = useState(null);

    const [isModifySearchModalOpen, setIsModifySearchModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedHotelForModal, setSelectedHotelForModal] = useState(null);

    // --- NEW: State from CrmAddHotelResultsPage for Filters/Sorting/Pagination ---
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
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 }); // For modal range limits
    const [currentSort, setCurrentSort] = useState('relevance'); // Default sort
    const [maxPriceFilter, setMaxPriceFilter] = useState(null); // Actual max price value for sortBy
    const [isMaxPriceFilterActive, setIsMaxPriceFilterActive] = useState(false);
    const [selectedPricePointValue, setSelectedPricePointValue] = useState('max'); // UI state for price points
    const [totalCount, setTotalCount] = useState(0);
    const [filteredCount, setFilteredCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const loadingRef = useRef(null);
    const fetchInitiatedRef = useRef(false); // To prevent double initial fetch
    // --- END: New State ---

    // --- NEW: Helper to get the sort object --- 
    const getCurrentSortObject = (sortValue) => {
        const sortMapping = {
            'priceAsc': { finalRate: 'asc', label: 'Price: Low to High', id: 2, value: 1 },
            'priceDesc': { finalRate: 'desc', label: 'Price: High to Low', id: 2, value: 2 },
            'ratingDesc': { rating: 'desc', label: 'Rating: High to Low', id: 3, value: 2 },
            'nameAsc': { name: 'asc', label: 'Name: A to Z', id: 4, value: 1 },
            'relevance': { label: 'Relevance', id: 1, value: 1 }
        };
        return sortMapping[sortValue] || sortMapping['relevance']; // Default to relevance
    };
    // --- END: Helper --- 

    // Fetch hotels function - Modified to accept params and handle pagination
    const fetchHotels = useCallback(async (pageNumber = 1, filters = null, sortBy = null, directMaxPrice = null) => {
        // Guard clause: Wait until currentTravelersDetails is properly set
        if (!currentTravelersDetails || !inquiryToken || !city || !checkIn || !checkOut) {
             console.log("ChangePage: Skipping fetch: Required data or traveler details missing.");
             return;
        }
        
        // Construct occupancies from the current state
        let occupancies = currentTravelersDetails.rooms.map(room => ({
                numOfAdults: room.adults?.length || 0,
            childAges: room.children?.map(age => age ?? 0) || []
            }));
             if (occupancies.some(occ => occ.numOfAdults < 1)) {
                 setError("Invalid guest configuration: Each room needs at least one adult.");
            setLoading(pageNumber === 1 ? false : true); // Stop initial loading, keep loadingMore
            setLoadingMore(false);
            return;
        }

        // Set loading states based on page number
        if (pageNumber === 1) {
        setLoading(true);
            setHotels([]); // Clear hotels only when fetching page 1
            setCurrentPage(1);
            setHasMore(true);
            setTraceId(null); // Reset traceId for new searches/filter changes
        } else {
            setLoadingMore(true);
        }
        setError(null);

        console.log(`ChangePage: Fetching hotels page ${pageNumber} via POST for ${city}... Filters:`, filters, `Sort:`, sortBy, `MaxPrice:`, directMaxPrice);
        
        try {
            const apiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${encodeURIComponent(city)}/${checkIn}/${checkOut}`; 

            // --- Construct API request body --- 
            const requestBody = {
                occupancies: occupancies, 
                page: pageNumber,
                nationality: "IN" // Assuming default, adjust if needed
            };

            // Add traceId for pagination (page > 1)
            if (pageNumber > 1 && traceId) {
                requestBody.traceId = traceId;
            }

            // Add filterBy if filters are provided
            if (filters && Object.keys(filters).length > 0) {
                const cleanFilters = { ...filters }; // Copy to avoid mutating state
                // Ensure no null/empty values are sent in filterBy
                Object.keys(cleanFilters).forEach(key => {
                    if (cleanFilters[key] === null || cleanFilters[key] === '' || (Array.isArray(cleanFilters[key]) && cleanFilters[key].length === 0)) {
                        delete cleanFilters[key];
                    }
                });
                if (Object.keys(cleanFilters).length > 0) {
                    requestBody.filterBy = cleanFilters;
                }
            }

            // Construct and add sortBy (including finalRate)
            let finalSortBy = {};
            const baseSortObject = sortBy || getCurrentSortObject(currentSort); // Use provided sortBy or current state
            if (baseSortObject) {
                // Use the full sort object with id, value, and label
                finalSortBy = { ...baseSortObject };
                
                // If we have a max price filter, add it to finalRate (overriding asc/desc value if present)
                const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : (isMaxPriceFilterActive ? maxPriceFilter : null);
                if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                }
            } else {
                 finalSortBy = getCurrentSortObject('relevance'); // Default to relevance
                 const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : (isMaxPriceFilterActive ? maxPriceFilter : null);
                 if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                }
            }
            requestBody.sortBy = finalSortBy;
            // --- END: Construct API request body --- 

            console.log("ChangePage: Sending API Request Body:", JSON.stringify(requestBody, null, 2));
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    'X-Inquiry-Token': inquiryToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody) 
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(errorData.message || `Failed to fetch hotels (${response.status})`);
            }

            const responseData = await response.json();
            console.log("ChangePage: API Response (POST):", responseData);

            const resultData = responseData?.data?.results?.[0]; // Access results correctly
            const newHotels = resultData?.data || []; // Access hotels within results.data

            if (responseData?.success && resultData) {
                 setHotels(prev => pageNumber === 1 ? newHotels : [...prev, ...newHotels]);
                 if (resultData.traceId) setTraceId(resultData.traceId);
                 setCurrentPage(resultData.currentPage || pageNumber);
                 setHasMore(!!resultData.nextPage);
                 if (resultData.totalCount !== undefined) setTotalCount(resultData.totalCount);
                 if (resultData.filteredCount !== undefined) {
                     setFilteredCount(resultData.filteredCount);
                 } else if (resultData.totalCount !== undefined) {
                     setFilteredCount(resultData.totalCount); // Fallback if filteredCount is missing
                 }
                 // Update price range based on new results (optional, might cause shifts)
                 // updatePriceRange(newHotels); 
            } else {
                 if (pageNumber === 1) setHotels([]);
                 setHasMore(false);
                 const message = responseData?.data?.message || responseData?.message || "No hotels found matching criteria.";
                 console.warn("ChangePage: " + message);
                 if (pageNumber === 1 && !error) setError(message); // Set error only on page 1 if no other error exists
            }

        } catch (err) {
            console.error("ChangePage: Error fetching hotels:", err);
            setError(err.message);
            if (pageNumber === 1) setHotels([]);
            setHasMore(false);
        } finally {
            if (pageNumber === 1) {
            setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    // MODIFIED Dependencies
    }, [inquiryToken, city, checkIn, checkOut, currentTravelersDetails, traceId, currentSort, isMaxPriceFilterActive, maxPriceFilter]);

    // --- NEW: Load More Hotels function --- 
    const loadMoreHotels = useCallback(() => {
        if (loading || loadingMore || !hasMore) {
            return;
        }
        console.log("ChangePage: Loading more hotels...");
        // Fetch next page using current filters/sort state
        const currentSortObject = getCurrentSortObject(currentSort);
        fetchHotels(currentPage + 1, serverFilters, currentSortObject, maxPriceFilter);
    }, [loading, loadingMore, hasMore, currentPage, fetchHotels, serverFilters, currentSort, maxPriceFilter]);
    // --- END: Load More --- 

    // --- NEW: Filter/Sort Handlers from CrmAddHotelResultsPage ---
    // Handle filter changes (no-op, apply button triggers action)
    const handleFilterChange = useCallback((type, value) => {
        console.log(`Filter change (type: ${type}) - skipping immediate update`);
    }, []);

    // Handle Apply Filters button click
    const handleServerFilterApply = useCallback((newFilters) => {
        console.log("Applying server filters to API request:", newFilters);

        // --- Processing logic copied from CrmAddHotelResultsPage --- 
        const processedFilters = { ...newFilters };
        // Boolean filters
        if ('freeBreakfast' in processedFilters) processedFilters.freeBreakfast = Boolean(processedFilters.freeBreakfast);
        if ('isRefundable' in processedFilters) processedFilters.isRefundable = Boolean(processedFilters.isRefundable);
        // Review Ratings
        if (processedFilters.reviewRatings && Array.isArray(processedFilters.reviewRatings)) {
            processedFilters.reviewRatings = processedFilters.reviewRatings
                .map(r => Number(r))
                .filter(r => !isNaN(r) && r >= 1 && r <= 5);
            if (processedFilters.reviewRatings.length === 0) delete processedFilters.reviewRatings;
        }
        // Type filter
        if ('type' in processedFilters && typeof processedFilters.type === 'string' && processedFilters.type.trim() !== '') {
            processedFilters.type = processedFilters.type.trim();
        } else { delete processedFilters.type; }
        // Tags filter
        if ('tags' in processedFilters && Array.isArray(processedFilters.tags) && processedFilters.tags.length > 0) {
            processedFilters.tags = processedFilters.tags.map(tag => String(tag).trim()).filter(tag => tag);
            if (processedFilters.tags.length === 0) delete processedFilters.tags;
        } else { delete processedFilters.tags; }
        // Hotel Name
        if (!processedFilters.hotelName || processedFilters.hotelName.trim() === '') {
             delete processedFilters.hotelName;
        }
        // Ratings
        if (processedFilters.ratings && Array.isArray(processedFilters.ratings)) {
            processedFilters.ratings = processedFilters.ratings.map(r => Number(r)).filter(r => !isNaN(r));
            if (processedFilters.ratings.length === 0) delete processedFilters.ratings;
        } else { delete processedFilters.ratings; }
        // Facilities
        if (processedFilters.facilities && Array.isArray(processedFilters.facilities)) {
            processedFilters.facilities = processedFilters.facilities.map(f => String(f).trim()).filter(f => f);
            if (processedFilters.facilities.length === 0) delete processedFilters.facilities;
        } else { delete processedFilters.facilities; }

        // --- Separate finalRate --- 
        let newMaxPrice = null;
        const originalPricePoint = processedFilters.finalRate;
        setSelectedPricePointValue(originalPricePoint === null ? 'max' : originalPricePoint);

        if (originalPricePoint !== null && typeof originalPricePoint === 'number' && !isNaN(originalPricePoint)) {
            const perNightPerAdultRate = originalPricePoint;
            const startDate = new Date(checkIn);
            const endDate = new Date(checkOut);
            const numberOfNights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            let totalAdults = currentTravelersDetails?.rooms?.reduce((sum, room) => sum + (Array.isArray(room.adults) ? room.adults.length : 0), 0) || 1;
            totalAdults = Math.max(1, totalAdults);
            newMaxPrice = perNightPerAdultRate * numberOfNights * totalAdults;
        }
        delete processedFilters.finalRate;
        setMaxPriceFilter(newMaxPrice);
        setIsMaxPriceFilterActive(newMaxPrice !== null);
        
        // Update main filter state
        setServerFilters(processedFilters);

        // Reset pagination and fetch page 1
        setCurrentPage(1);
        setHasMore(true);
        const currentSortObject = getCurrentSortObject(currentSort);
        
        // Fetch hotels with the newly processed filters and price
        fetchHotels(1, processedFilters, currentSortObject, newMaxPrice); // Pass page number and filters/sort/price

    }, [checkIn, checkOut, currentTravelersDetails, fetchHotels, currentSort]);

    // Handle Sort Change
    const handleSortChange = useCallback((sortValue) => {
        setCurrentSort(sortValue);
        const newSortObject = getCurrentSortObject(sortValue);
        // Re-fetch page 1 with current filters and new sort
        setCurrentPage(1);
        setHasMore(true);
        fetchHotels(1, serverFilters, newSortObject, maxPriceFilter); // Pass page number and filters/sort/price
    }, [serverFilters, maxPriceFilter, fetchHotels]);

    // Handle Filter Reset
    const handleFilterReset = useCallback(() => {
        const resetFilters = {
            freeBreakfast: false, isRefundable: false, hotelName: '', ratings: [],
            facilities: [], reviewRatings: null, type: null, tags: null
        };
        setServerFilters(resetFilters);
        setCurrentSort('relevance');
        setMaxPriceFilter(null);
        setIsMaxPriceFilterActive(false);
        setSelectedPricePointValue('max');
        setCurrentPage(1);
        setHasMore(true);
        const defaultSortObject = getCurrentSortObject('relevance');
        // Fetch page 1 with no filters and default sort
        fetchHotels(1, null, defaultSortObject, null); // Pass page number and null filters/price
    }, [fetchHotels]);
    // --- END: Filter/Sort Handlers ---

    // --- NEW: Infinite Scroll useEffects --- 
    useEffect(() => {
        // Intersection Observer setup
        if (loading || hotels.length === 0 || loadingMore || !hasMore) return;
        const options = { root: null, rootMargin: '300px', threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                loadMoreHotels();
            }
        }, options);
        const currentLoadingRef = loadingRef.current;
        if (currentLoadingRef) observer.observe(currentLoadingRef);
        return () => {
            if (currentLoadingRef) observer.unobserve(currentLoadingRef);
            observer.disconnect();
        };
    }, [loading, loadingMore, hasMore, loadMoreHotels, hotels.length]);

    useEffect(() => {
        // Scroll event listener fallback
        if (loading || hotels.length === 0 || loadingMore || !hasMore) return;
        const handleScroll = () => {
            if (loading || loadingMore || !hasMore) return;
            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 300) {
                loadMoreHotels();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, loadingMore, hasMore, loadMoreHotels, hotels.length]);
    // --- END: Infinite Scroll --- 

    // Effect for Initialization and Synchronization
    useEffect(() => {
        console.log("useEffect triggered. Location state:", location.state);
        // Basic validation on mount/navigation
        if (!location.state || !inquiryToken || !oldHotelCode || !itineraryToken) {
            toast.error("Missing required hotel change context. Returning to bookings.");
            navigate(`/bookings`);
            return;
        }
        
        // Get traveler details from navigation state
        const navigatedTravelersDetails = location.state.travelersDetails || null;

        // Synchronize state: If the details from navigation don't match the current state,
        // update the state and skip fetching in this cycle. The state update will trigger the effect again.
        if (JSON.stringify(navigatedTravelersDetails) !== JSON.stringify(currentTravelersDetails)) {
            console.log("Synchronizing traveler details from location state.");
            setCurrentTravelersDetails(navigatedTravelersDetails); 
            // Return early; the fetch will happen in the next render after state is updated.
            return; 
        }

        // If state is synchronized and populated, proceed to fetch.
        if (currentTravelersDetails && !fetchInitiatedRef.current) {
            console.log("ChangePage: Traveler details synchronized, calling initial fetchHotels (Page 1).");
            fetchInitiatedRef.current = true; // Mark initial fetch as initiated
            // Initial fetch (Page 1) with no filters and default sort
            const defaultSortObject = getCurrentSortObject('relevance');
            fetchHotels(1, null, defaultSortObject, null); // Explicitly call page 1, no filters/price
        } else if (!currentTravelersDetails && !fetchInitiatedRef.current) {
            console.log("ChangePage: Traveler details synchronized but null/empty, skipping fetch.");
             if (loading) setLoading(false); 
        } else if (fetchInitiatedRef.current) {
            console.log("ChangePage: Initial fetch already initiated, skipping.");
        }

    // Depend on location.state object itself (for changes via navigate) and the core IDs.
    // Also depend on fetchHotels and currentTravelersDetails for the synchronization logic.
    }, [location.state, navigate, itineraryToken, inquiryToken, oldHotelCode, fetchHotels, currentTravelersDetails, fetchInitiatedRef.current]);

    // --- Hotel Detail Modal Control ---
    const handleSelectHotel = (hotel) => {
        console.log("Selected hotel for detail modal:", hotel);
        setSelectedHotelForModal(hotel);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setTimeout(() => setSelectedHotelForModal(null), 300);
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

        // <<< REMOVED: setCurrentTravelersDetails(updatedTravelersDetails); >>> 
        // State will be updated via useEffect after navigation completes.

        handleCloseModifySearchModal();

        console.log("Navigating with new search params and traveler details:", newSearchParams);
        // Navigate with new dates in URL params and updated travelersDetails in state
        navigate(
            `/crm/itinerary/${itineraryToken}/change-hotel/${encodeURIComponent(city)}/${newCheckIn}/${newCheckOut}`,
            {
                state: { 
                    // Keep original state values needed
                    existingHotelPrice,
                    oldHotelCode,
                    inquiryToken,
                    // Pass the UPDATED travelers details via navigation state
                    travelersDetails: updatedTravelersDetails 
                },
                replace: true 
            }
        );
        // The useEffect hook will handle fetching after navigation is complete and state is synchronized.
    };

    // --- Navigation ---
    const handleBackToItinerary = () => {
        if (itineraryToken && inquiryToken) {
            console.log(`Navigating back to /bookings/itinerary with state:`, { itineraryToken, inquiryToken });
            navigate('/bookings/itinerary', { 
                state: { 
                    itineraryToken: itineraryToken, 
                    inquiryToken: inquiryToken 
                }
            });
        } else {
            console.error("Cannot navigate back: itineraryToken or inquiryToken missing.");
            toast.error("Could not determine which itinerary to return to.");
            navigate('/bookings');
        }
    };

    // --- Success Handler (Called from Detail Modal) ---
    const handleHotelChangedSuccessfully = () => {
        toast.success("Hotel successfully changed in the itinerary!");
        handleCloseDetailModal();
        handleBackToItinerary();
    };

    return (
        <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3 bg-gray-100 min-h-screen">
            {/* Header - Changed background to bg-slate-50 */}
                        <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 bg-slate-50 p-4 py-3 rounded-lg shadow-lg sticky top-0 z-10">
                <div className="flex items-center gap-3 flex-grow min-w-0">
                     <button
                        onClick={handleBackToItinerary}
                        className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0" // Adjusted hover for new bg
                        title="Back to Itinerary"
                     >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div className="flex-grow min-w-0">
                        <h1 className="text-xl font-bold text-gray-800 truncate">
                            Change Hotel in {city}
                        </h1>
                        <p className="text-xs text-gray-500 truncate">
                            Check-in: {checkIn} | Check-out: {checkOut}
                        </p>
                    </div>
                </div>
                 {/* Modify Search button - Updated onClick */}
                 <div className="flex-shrink-0 ml-4">
                     <button 
                        onClick={handleOpenModifySearchModal} // <<< Use the new handler
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        title="Modify Search Criteria"
                     >
                         Modify Search
                     </button>
                 </div>
            </div>

            {/* --- NEW: Main Content Area with Filter --- */}
            <div className="mt-6 flex flex-col md:flex-row gap-6">
                 {/* Left Sidebar with Filter */} 
                 <aside className="w-full md:w-72 lg:w-80 flex-shrink-0">
                    <CrmHotelFilterModal
                        initialFilters={{
                            search: serverFilters.hotelName || '',
                            price: [priceRange.min, serverFilters.finalRate ?? priceRange.max], // This structure might need review based on modal's expectation
                            starRating: serverFilters.ratings || [],
                            amenities: [], // UI only - needs mapping if modal expects it
                            reviewRatingsSelected: serverFilters.reviewRatings || [],
                            serverFilters: serverFilters // Pass the raw serverFilters
                        }}
                        priceRange={priceRange} // Overall min/max bounds for the modal UI
                        currentSort={currentSort}
                        currentPricePoint={selectedPricePointValue} // Pass the selected price point
                        onFilterChange={handleFilterChange}
                        onSortChange={handleSortChange}
                        onServerFilterApply={handleServerFilterApply}
                        onFilterReset={handleFilterReset}
                        totalCount={totalCount}
                        filteredCount={filteredCount}
                        isServerFiltering={true}
                    />
                 </aside>
                 
                 {/* Right Content Area */} 
                 <main className="flex-1 flex flex-col">
                {/* Loading/Error State */}
                     {loading && currentPage === 1 && (
                    <div className="text-center py-10">
                        <p className="text-gray-600">Loading available hotels...</p>
                    </div>
                )}
                     {error && !loadingMore && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Hotels Grid */}
                     {!loading && hotels.length > 0 && (
                         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                        {hotels.map((hotel, index) => (
                            <CrmChangeHotelOptionCard
                                     key={hotel.id || `hotel-${index}`}
                                hotel={hotel}
                                existingHotelPrice={existingHotelPrice || 0}
                                onSelectHotel={handleSelectHotel}
                            />
                        ))}
                    </div>
                )}

                     {/* No Results Message */} 
                     {!loading && !error && hotels.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">No alternative hotels found matching the criteria.</p>
                )}
                     
                     {/* Pagination Loader / End Message */} 
                     {!loading && (
                         <div 
                             ref={loadingRef}
                             className="py-8 text-center"
                             style={{ minHeight: '100px' }}
                             id="scroll-loader"
                         >
                             {loadingMore ? (
                                 <div className="flex flex-col items-center">
                                     {/* Replace Hourglass with a simpler loader if needed */} 
                                     {/* <Hourglass size="30" color="#6366F1" /> */}
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
            {/* --- END: New Layout --- */}

            {/* Detail Modal - Rendered conditionally */} 
            {isDetailModalOpen && selectedHotelForModal && (
                 <CrmChangeHotelDetailModal
                    isOpen={isDetailModalOpen} 
                    onClose={handleCloseDetailModal} 
                    selectedHotel={selectedHotelForModal} 
                    itineraryToken={itineraryToken}
                    inquiryToken={inquiryToken}
                    traceId={traceId}
                    city={city}
                    date={checkIn} // Use checkIn from current URL params
                    dates={{ checkIn, checkOut }} // Use checkIn/Out from current URL params
                    oldHotelCode={oldHotelCode} 
                    existingHotelPrice={existingHotelPrice} 
                    onHotelChanged={handleHotelChangedSuccessfully} 
                />
            )}

            {/* Modify Search Modal - Pass currentTravelersDetails from state */}
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


export default CrmChangeHotelsPage; 