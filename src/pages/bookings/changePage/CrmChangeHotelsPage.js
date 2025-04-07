import { ArrowLeftIcon } from '@heroicons/react/24/solid'; // Use solid icons
import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CrmChangeHotelDetailModal from '../../../components/itinerary/modals/change/CrmChangeHotelDetailModal'; // Import the new modal
import CrmHotelSearchModifyModal from '../../../components/itinerary/modals/change/CrmHotelSearchModifyModal'; // Import the search modify modal

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

    // Fetch hotels function
    const fetchHotels = useCallback(async () => {
        // Guard clause: Wait until currentTravelersDetails is properly set from useEffect
        if (!currentTravelersDetails || !inquiryToken || !city || !checkIn || !checkOut) {
             console.log("Skipping fetch: Required data or synchronized traveler details missing.", { currentTravelersDetails, inquiryToken, city, checkIn, checkOut });
             // Don't set loading/error here, just wait for state sync
             return;
        }
        
        // Construct occupancies from the SYNCHRONIZED state
        let occupancies = [];
        if (currentTravelersDetails && currentTravelersDetails.rooms) {
            occupancies = currentTravelersDetails.rooms.map(room => ({
                numOfAdults: room.adults?.length || 0,
                childAges: room.children?.map(age => age ?? 0) || [] // Handle potential null ages
            }));
             // Basic validation
             if (occupancies.some(occ => occ.numOfAdults < 1)) {
                 setError("Invalid guest configuration: Each room needs at least one adult.");
                 setLoading(false); // Can set loading false here as it's an error state
                 return; // Stop fetch if guest config is invalid
             }
        }

        setLoading(true);
        setError(null);
        setHotels([]);
        setTraceId(null);
        console.log(`Fetching hotels via POST for ${city} from ${checkIn} to ${checkOut} using inquiry ${inquiryToken}. Occupancy:`, occupancies); 
        
        try {
            const apiUrl = `http://localhost:5000/api/itinerary/hotels/${inquiryToken}/${encodeURIComponent(city)}/${checkIn}/${checkOut}`; 
            const requestBody = {
                occupancies: occupancies, 
                page: 1, 
                limit: 100 
            };
            
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

            const data = await response.json();
            console.log("API Response (POST):", data);

            const fetchedHotels = data?.data?.hotels || [];
            setHotels(fetchedHotels);

            const fetchedTraceId = data?.data?.traceId;
            if (fetchedTraceId) {
                setTraceId(fetchedTraceId);
                console.log("Captured traceId:", fetchedTraceId);
            } else {
                console.warn("traceId not found in hotels API response");
            }

        } catch (err) {
            console.error("Error fetching hotels:", err);
            setError(err.message);
            setHotels([]);
        } finally {
            setLoading(false);
        }
    }, [inquiryToken, city, checkIn, checkOut, currentTravelersDetails]);

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
        if (currentTravelersDetails) {
            console.log("Traveler details synchronized, calling fetchHotels.");
            fetchHotels();
        } else {
             console.log("Traveler details synchronized but null/empty, skipping fetch.");
             // If details are intentionally empty/null after sync, ensure loading is false
             if (loading) setLoading(false); 
        }

    // Depend on location.state object itself (for changes via navigate) and the core IDs.
    // Also depend on fetchHotels and currentTravelersDetails for the synchronization logic.
    }, [location.state, navigate, itineraryToken, inquiryToken, oldHotelCode, fetchHotels, currentTravelersDetails]);

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

            {/* Main Content Area */}
            <div className="mt-6">
                {/* Loading/Error State */}
                {loading && (
                    <div className="text-center py-10">
                        <p className="text-gray-600">Loading available hotels...</p>
                        {/* Optional: Add a spinner here */}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* Hotels Grid */}
                {!loading && !error && hotels.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
                        {hotels.map((hotel, index) => (
                            <CrmChangeHotelOptionCard
                                key={hotel.id || `hotel-${index}`} // Use hotel.id if available, otherwise fallback
                                hotel={hotel}
                                existingHotelPrice={existingHotelPrice || 0}
                                onSelectHotel={handleSelectHotel}
                            />
                        ))}
                    </div>
                )}

                {!loading && !error && hotels.length === 0 && !loading && ( // Ensure not loading before showing no results
                    <p className="text-center text-gray-500 mt-10">No alternative hotels found matching the criteria.</p>
                )}
            </div>

            {/* TODO: Add Load More / Pagination controls here */} 

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