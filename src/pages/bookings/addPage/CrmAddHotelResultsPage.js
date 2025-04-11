import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import CrmAddHotelDetailsModal from '../../../components/itinerary/modals/add/CrmAddHotelDetailsModal'; // Import the details modal
import CrmHotelSearchModifyModal from '../../../components/itinerary/modals/add/CrmHotelSearchModifyModal'; // Re-use modify search modal
// import CrmAddHotelRateModal from '../../../components/itinerary/modals/add/CrmAddHotelRateModal'; // Import the new rate modal (will be created)

// --- NEW: Import Hourglass loader ---
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css'; // Ensure CSS is imported

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

// Placeholder Hotel Card component - adapt as needed
const CrmAddHotelOptionCard = ({ hotel, onSelectHotel }) => {
    const currentPrice = hotel?.availability?.rate?.finalRate ?? 0;
    const currency = hotel?.availability?.rate?.currency ?? 'INR';
    const imageUrl = hotel?.images?.[0]?.links?.find(link => link.size === 'Standard')?.url
                   ?? hotel?.heroImage
                   ?? '/img/placeholder.png'; // Use static placeholder path
    const hotelName = hotel?.name ?? 'Hotel Name N/A';

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
                    onError={(e) => { e.target.src = '/img/placeholder.png'; }} // Use static placeholder
                 />
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <h4 className="font-semibold text-gray-800 truncate mb-1 text-sm" title={hotelName}>{hotelName}</h4>
                {/* TODO: Add rating, location if available */}
                <div className="mt-auto">
                    <p className="text-base font-bold text-blue-600">
                        {currencyFormatter(currentPrice, currency)}
                    </p>
                     <p className="text-xs text-gray-500">Starting price</p>
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
    const [currentTravelersDetails, setCurrentTravelersDetails] = useState(initialTravelersDetails || { rooms: [{ adults: 1, children: [] }] }); // Initialize with state or default
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [selectedHotelForModal, setSelectedHotelForModal] = useState(null);
    const [isModifySearchModalOpen, setIsModifySearchModalOpen] = useState(false);

    // Ref to prevent double fetch in StrictMode or due to rapid state changes
    const fetchInitiatedRef = useRef(false);

    // --- Fetching Logic ---
    const fetchHotels = useCallback(async (currentCity, currentCheckIn, currentCheckOut, currentInquiryToken, currentTravelers) => {
        setLoading(true);
        setError(null);
        setHotels([]); // Clear previous results
        setTraceId(null); // Reset traceId for new search
        // console.log(`AddHotelResultsPage: Fetching hotels for ${currentCity} from ${currentCheckIn} to ${currentCheckOut}`); // Keep or remove console logs as needed

        if (!currentInquiryToken) {
             setError("Missing inquiry token. Cannot fetch hotels.");
             setLoading(false);
             return;
        }
        if (!currentTravelers || !currentTravelers.rooms) { // Add check for rooms array
             setError("Missing or invalid traveler details. Cannot fetch hotels.");
             setLoading(false);
             return;
        }

        // --- Calculate Occupancies (like in Change Page) ---
        let occupancies = [];
        try {
             occupancies = currentTravelers.rooms.map(room => ({
                // Ensure adults is an array and get length, default to 0
                 numOfAdults: Array.isArray(room.adults) ? room.adults.length : 0, 
                // Ensure children is an array, map ages (defaulting null/undefined to 0), default to empty array
                 childAges: Array.isArray(room.children) ? room.children.map(age => age ?? 0) : [] 
            }));
             // Basic validation (like in Change Page)
             if (occupancies.some(occ => occ.numOfAdults < 1)) {
                 throw new Error("Invalid guest configuration: Each room needs at least one adult.");
             }
        } catch (mappingError) {
             console.error("Error mapping traveler details to occupancies:", mappingError, currentTravelers);
             setError("Invalid traveler details format.");
             setLoading(false);
             return;
        }
        // --- End Occupancy Calculation ---

        console.log(`AddHotelResultsPage: Fetching hotels via POST for ${currentCity} from ${currentCheckIn} to ${currentCheckOut} using inquiry ${currentInquiryToken}. Occupancy:`, occupancies);

        try {
            // --- Correct API URL (like Change Page) ---
            const apiUrl = `http://localhost:5000/api/itinerary/hotels/${currentInquiryToken}/${encodeURIComponent(currentCity)}/${currentCheckIn}/${currentCheckOut}`;
            
            // --- Correct Request Body (like Change Page) ---
            const requestBody = {
                occupancies: occupancies,
                page: 1,
                limit: 100 // Adjust limit as needed
            };

            console.log("AddHotelResultsPage: Search Request Body (using occupancies):", requestBody);

            // Use standard fetch or keep axios, ensure headers are correct
            // Using fetch here to align closer with the provided Change Page example if needed
            const response = await fetch(apiUrl, {
                 method: 'POST',
                 headers: {
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    "X-Inquiry-Token": currentInquiryToken,
                    'Content-Type': 'application/json' // Important for POST with body
                },
                body: JSON.stringify(requestBody)
             });

             if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: response.statusText }));
                 throw new Error(errorData.message || `Failed to fetch hotels (${response.status})`);
             }

            const data = await response.json();
            console.log("AddHotelResultsPage: Search Response (using occupancies):", data);

            // --- Process response (like Change Page) ---
            if (data?.success && data?.data?.hotels) { // Adjust based on actual response structure
                setHotels(data.data.hotels);
                setTraceId(data.data.traceId); // Capture traceId
            } else {
                // Handle cases where success might be true but hotels are missing, or success is false
                setHotels([]); // Ensure hotels are empty
                const message = data?.message || "Hotel search succeeded but no results found or response format incorrect.";
                console.warn("AddHotelResultsPage: " + message, data);
                // Optionally set a soft error/message instead of throwing?
                // setError(message); // Or just let it show "No hotels found"
             }

        } catch (err) {
            console.error("AddHotelResultsPage: Error fetching hotels:", err);
            setError(err.response?.data?.message || err.message || 'An unknown error occurred while fetching hotels.');
            setHotels([]); // Ensure hotels are cleared on error
        } finally {
            setLoading(false);
        }
     // Dependencies now include the structure of travelers details used in occupancy calc
    }, []); // Keep empty if fetch doesn't rely on component state/props directly changing its logic
     // If currentTravelers WAS derived from state inside useCallback, it would need adding.
     // Since it's passed as an argument, and the function logic itself doesn't change based on 
     // component state/props, [] is okay. The calling useEffect handles when to call with new args.

    // --- Initialization and Synchronization Effect ---
    useEffect(() => {
        // Ensure parameters are valid before fetching
        if (!inquiryToken || !city || !checkIn || !checkOut || !initialTravelersDetails) {
            setError("Missing required information (token, city, dates, or traveler details) to load results.");
            setLoading(false);
            return; // Don't fetch if essential info is missing
        }

        // Use Ref to prevent double fetch only during initial load sequence
        if (!fetchInitiatedRef.current) {
            console.log("AddHotelResultsPage: useEffect Triggered - Initial Fetch");
            fetchInitiatedRef.current = true; // Mark fetch as initiated for this mount/param set
            
            // Ensure the state used by other parts (like modify search modal) is set
            setCurrentTravelersDetails(initialTravelersDetails);
            
            // Call fetchHotels directly here with the correct arguments
            fetchHotels(city, checkIn, checkOut, inquiryToken, initialTravelersDetails);
        } else {
            // Logic for subsequent updates if needed (e.g., when navigating back from modify search)
            // Compare the incoming travelers details with the current state
            if (JSON.stringify(initialTravelersDetails) !== JSON.stringify(currentTravelersDetails)) {
                 console.log("AddHotelResultsPage: useEffect Triggered - Traveler details changed, refetching");
                 // Update the state for consistency
                 setCurrentTravelersDetails(initialTravelersDetails);
                 // Call fetchHotels with the NEW details
                 fetchHotels(city, checkIn, checkOut, inquiryToken, initialTravelersDetails);
            } else {
                 console.log("AddHotelResultsPage: useEffect Triggered - Parameters stable, skipping fetch");
            }
        }
        
        // Cleanup function to reset the ref if the component unmounts or critical params change
        return () => {
            // Optionally reset ref if critical params change causing a full remount/reset scenario
             // fetchInitiatedRef.current = false; 
             // ^ Be cautious with resetting this, might reintroduce double fetches 
             // if params update rapidly.
        };

    // Dependencies: fetchHotels is stable, so the effect runs when the parameters change.
    }, [city, checkIn, checkOut, inquiryToken, initialTravelersDetails, fetchHotels]);

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

        console.log("AddHotelResultsPage: Navigating with new search params:", newSearchParams);
        // Reset fetch flag before navigating to allow fetch on new page instance
        fetchInitiatedRef.current = false; 
        navigate(
            `/crm/itinerary/${itineraryToken}/add-hotel-results/${encodeURIComponent(city)}/${newCheckIn}/${newCheckOut}`,
            {
                state: {
                    inquiryToken,
                    travelersDetails: updatedTravelersDetails // Pass the UPDATED details
                },
                replace: true // Replace history entry
            }
        );
        // The component will remount/rerun useEffect due to navigation
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
            <div className="mt-6">
                {loading && (
                    <div className="text-center flex flex-row items-center justify-center py-10"> {/* Updated container */}
                        <Hourglass size="40" color="#6366F1" />
                        <p className="text-gray-600 ml-3">Loading available hotels...</p> {/* Updated text element */}
                    </div>
                )}
                {error && (
                    <div className="flex-grow flex items-center justify-center py-10"> {/* Added flex container */}
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl text-center" role="alert"> {/* Original error box styling, adjusted max-width */}
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                )}

                {!loading && !error && hotels.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
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
