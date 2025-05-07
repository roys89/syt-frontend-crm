import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
// Import a potentially different modal for change confirmation later
// import CrmChangeFlightDetailsModal from '../../../components/itinerary/modals/change/CrmChangeFlightDetailsModal';
// For now, reuse the add modal structure, will adjust confirmation logic
import CrmAddFlightDetailsModal from '../../../components/itinerary/modals/add/CrmAddFlightDetailsModal';
// --- Import Icons ---
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
// --- END IMPORTS ---

// --- NEW: Cabin Class Mapping ---
const cabinClassMap = {
    1: "All",
    2: "Economy",
    3: "Premium Economy",
    4: "Business",
    5: "Premium Business",
    6: "First"
};
const getCabinClassName = (code) => cabinClassMap[code] || 'Unknown';
// --- END NEW ---

// --- NEW: Airline Logo Map --- (Assuming paths relative to public folder)
// const airlineLogos = { ... };
// const DEFAULT_AIRLINE_LOGO = '...'; 

// --- Updated Flight Result Card ---
const CrmFlightResultCard = ({ flight, onSelect, isLoading }) => {
    const segments = flight.sg || [];
    if (segments.length === 0) return null; // Don't render if no segments

    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    const stops = segments.length - 1;

    // --- Data Extraction ---
    const airlineName = firstSegment.al?.alN || 'Airline N/A';
    const airlineCode = firstSegment.al?.alC || '';
    const flightNumber = firstSegment.al?.fN || '';
    const fullFlightCode = `${airlineCode} ${flightNumber}`.trim();

    const price = flight.fF ? flight.fF.toLocaleString('en-IN', { style: 'currency', currency: flight.cr || 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A';
    
    const departureTime = firstSegment.or?.dT ? new Date(firstSegment.or.dT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
    const departureAirport = `${firstSegment.or?.aC || 'N/A'}${firstSegment.or?.tr ? ` (T${firstSegment.or.tr})` : ''}`;
    const departureCity = firstSegment.or?.cN || '';

    const arrivalTime = lastSegment.ds?.aT ? new Date(lastSegment.ds.aT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 'N/A';
    const arrivalAirport = `${lastSegment.ds?.aC || 'N/A'}${lastSegment.ds?.tr ? ` (T${lastSegment.ds.tr})` : ''}`;
    const arrivalCity = lastSegment.ds?.cN || '';

    const isRefundable = flight.iR === true;
    const isLCC = flight.iL === true;
    const checkInBaggage = firstSegment.bg || 'N/A';
    const cabinBaggage = firstSegment.cBg || 'N/A';
    const cabinClassStr = getCabinClassName(firstSegment.cC);
    const fareIdentifier = flight.fareIdentifier?.name;

    // Calculate total duration
    let totalDurationStr = 'N/A';
    if (stops > 0 && lastSegment.aD) { // Use accumulated duration if available for multi-segment
         const hours = Math.floor(lastSegment.aD / 60);
         const minutes = lastSegment.aD % 60;
         totalDurationStr = `${hours}h ${minutes}m`;
    } else if (firstSegment.dr) { // Use first segment duration for direct or if aD is missing
        const hours = Math.floor(firstSegment.dr / 60);
        const minutes = firstSegment.dr % 60;
        totalDurationStr = `${hours}h ${minutes}m`;
    } // Could add logic to sum segment durations if aD is not present

    // --- Layover Info ---
    let layoverInfo = null;
    if (stops > 0) {
        const layoverSegment = segments[0]; // Layover is *after* the first segment
        const layoverAirport = layoverSegment.ds?.aC || 'N/A';
        const layoverDurationMinutes = layoverSegment.gT; // Layover time *before* next segment departs
        if (typeof layoverDurationMinutes === 'number') {
            const hours = Math.floor(layoverDurationMinutes / 60);
            const minutes = layoverDurationMinutes % 60;
            layoverInfo = `${hours}h ${minutes}m layover at ${layoverAirport}`;
        }
    }

    return (
        <div className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow mb-4 border border-gray-100">
            <div className="flex flex-col sm:flex-row">
                {/* Left Section: Airline Logo, Name & Flight Code */} 
                <div className="sm:w-1/5 p-3 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/50">
                     {/* --- Updated Airline Logo Fetch --- */}
                     <img
                        // Construct URL using airline code
                        src={`https://pics.avs.io/80/40/${airlineCode}.png`} 
                        alt={`${airlineName} logo`}
                        className="h-8 w-auto object-contain mb-1"
                        onError={(e) => {
                             // More robust error handling: hide image, show placeholder text/icon
                             e.target.style.display = 'none'; // Hide broken image
                             // Optionally, find a sibling placeholder element and show it
                             // e.g., e.target.nextSibling.style.display = 'block'; 
                             // For simplicity, we'll just rely on the text below
                        }}
                    />
                    {/* Optional: Placeholder to show on error */} 
                    {/* <span style={{display: 'none'}} className="text-xs text-gray-400">(No logo)</span> */}
                    {/* --- End Airline Logo --- */}
                     <p className="text-sm font-semibold text-gray-800 text-center mt-1">{airlineName}</p>
                     <p className="text-xs text-gray-500">{fullFlightCode}</p>
                 </div>

                {/* Middle Section: Journey Details */} 
                <div className="sm:w-3/5 p-3 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                         {/* Departure */}
                         <div className="text-left">
                             <p className="text-lg font-bold text-gray-900">{departureTime}</p>
                             <p className="text-xs text-gray-600">{departureAirport}</p>
                             <p className="text-xs text-gray-500">{departureCity}</p>
                         </div>
                         {/* Duration & Stops */}
                         <div className="text-center px-2 flex-shrink-0">
                             <p className="text-sm font-medium text-gray-700">{totalDurationStr}</p>
                             <div className="w-full h-px bg-gray-300 my-0.5"></div>
                             <p className="text-xs text-gray-500">
                                {stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}
                             </p>
                             {layoverInfo && (
                                 <p className="text-[11px] text-orange-600 mt-0.5">{layoverInfo}</p>
                             )}
                         </div>
                         {/* Arrival */}
                         <div className="text-right">
                             <p className="text-lg font-bold text-gray-900">{arrivalTime}</p>
                             <p className="text-xs text-gray-600">{arrivalAirport}</p>
                             <p className="text-xs text-gray-500">{arrivalCity}</p>
                         </div>
                     </div>
                     {/* Tags: Fare Type, LCC, Refundable */} 
                     <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1">
                         {fareIdentifier && (
                             <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                 {fareIdentifier}
                             </span>
                         )}
                         <span className={`px-2 py-0.5 rounded-full font-medium ${isLCC ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                             {isLCC ? 'LCC' : 'Full Service'}
                         </span>
                         <span className={`px-2 py-0.5 rounded-full font-medium ${isRefundable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {isRefundable ? 'Refundable' : 'Non-Refundable'} 
                         </span>
                     </div>
                 </div>

                {/* Right Section: Price, Baggage & Action */} 
                 <div className="sm:w-1/5 p-3 flex flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50/50">
                    <div className="text-center sm:text-right w-full">
                         <p className="text-xl font-bold text-[#093923] mb-0.5">{price}</p>
                         {/* Baggage Info */}
                         <div className="text-[11px] text-gray-500 space-y-0.5">
                             <p>Check-in: {checkInBaggage}</p>
                             <p>Cabin: {cabinBaggage}</p>
                             <p>Class: {cabinClassStr}</p>
                         </div>
                    </div>
                    <button
                        onClick={onSelect}
                        disabled={isLoading}
                         className={`mt-2 w-full sm:w-auto relative group overflow-hidden inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white ${isLoading ? 'bg-[#093923]/50 cursor-not-allowed' : 'bg-[#093923] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]'} transition-colors`}
                     >
                         {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading...</span>
                            </>
                         ) : (
                             <>
                                 <span className="relative z-10">Select Flight</span>
                                 {/* Hover effect (optional) */}
                                 <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
                            </>
                        )}
                    </button>
                 </div>
            </div>
        </div>
    );
};

// --- Embedded Filter Component (Slider Removed) ---
const EmbeddedFlightFilter = ({
    activeFilters,
    onFiltersChange,
    priceRange, // Still needed for reset logic
    availableAirlines = [],
    stopCounts = {},
    availableCabinClasses = []
}) => {
    // Removed slider state and handlers

    // --- Event Handlers (Stop, Airline, Cabin Class - Unchanged) ---
    const handleStopChange = (stopValue) => {
        onFiltersChange({
            ...activeFilters,
            stops: activeFilters.stops === stopValue ? null : stopValue
        });
    };

    const handleAirlineChange = (airlineName) => {
        const currentAirlines = activeFilters.airlines || [];
        const newAirlines = currentAirlines.includes(airlineName)
            ? currentAirlines.filter(a => a !== airlineName)
            : [...currentAirlines, airlineName];
        onFiltersChange({ ...activeFilters, airlines: newAirlines });
    };

    const handleCabinClassChange = (cabinClassName) => {
        const currentClasses = activeFilters.cabinClasses || [];
        const newClasses = currentClasses.includes(cabinClassName)
            ? currentClasses.filter(c => c !== cabinClassName)
            : [...currentClasses, cabinClassName];
        onFiltersChange({ ...activeFilters, cabinClasses: newClasses });
    };

    // --- Reset Handler (Price Range Filter Removed) ---
    const handleReset = () => {
        onFiltersChange({ // Update parent directly
            // priceRange: [priceRange?.min || 0, priceRange?.max || 100000], // Removed price reset
            priceRange: activeFilters.priceRange, // Keep existing price range on reset
            airlines: [],
            stops: null,
            cabinClasses: [],
        });
    };

    // Removed formatPrice and slider-related variables

    return (
        <div className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-200 flex-shrink-0">
            {/* Header with Reset Button */}
            <div className="flex justify-between items-center pb-3 border-b mb-4">
                <h3 className="text-md font-semibold text-gray-800">Filter By</h3>
                {/* Theme Color Applied */}
                <button
                    onClick={handleReset}
                    className="text-xs font-medium text-[#13804e] hover:text-[#093923]"
                >
                    Reset All
                </button>
            </div>

            <div className="space-y-5">
                {/* Stops Filter */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Stops</h4>
                    <div className="space-y-1">
                        {[0, 1, 2].map((stopValue) => {
                            const label = stopValue === 0 ? 'Non-Stop' : `${stopValue} Stop${stopValue > 1 ? 's' : ''}`;
                            const count = stopCounts[stopValue] || 0;
                            const isChecked = activeFilters.stops === stopValue;
                            return (
                                <label key={stopValue} className="flex items-center justify-between text-sm text-gray-600 cursor-pointer">
                                    <span className="flex items-center">
                                        {/* Theme Color Applied */}
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => handleStopChange(stopValue)}
                                            className="h-4 w-4 rounded border-gray-300 text-[#093923] focus:ring-[#13804e] mr-2"
                                        />
                                        {label}
                                    </span>
                                    <span className="text-gray-400 text-xs">({count})</span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                {/* Price Range Filter Removed */}
                
                {/* Cabin Class Filter */}
                {availableCabinClasses.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cabin Class</h4>
                        <div className="space-y-1">
                            {availableCabinClasses.map((cabinClass) => (
                                <label key={cabinClass} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                    {/* Theme Color Applied */}
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.cabinClasses?.includes(cabinClass)}
                                        onChange={() => handleCabinClassChange(cabinClass)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#093923] focus:ring-[#13804e] mr-2"
                                    />
                                    {cabinClass}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Airlines Filter */}
                {availableAirlines.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Airlines</h4>
                         <div className="space-y-1 max-h-40 overflow-y-auto pr-2 border rounded-md p-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {availableAirlines.map((airline) => (
                                <label key={airline} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                    {/* Theme Color Applied */}
                                    <input
                                        type="checkbox"
                                        checked={activeFilters.airlines?.includes(airline)}
                                        onChange={() => handleAirlineChange(airline)}
                                        className="h-4 w-4 rounded border-gray-300 text-[#093923] focus:ring-[#13804e] mr-2"
                                    />
                                    {airline}
                                </label>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
// --- END Embedded Filter Component ---

// --- NEW: Skeleton Loader Component ---
const FlightCardSkeleton = () => (
    <div className="bg-white shadow rounded-lg overflow-hidden mb-4 border border-gray-100 animate-pulse">
        <div className="flex flex-col sm:flex-row">
            {/* Left Section Skeleton */}
            <div className="sm:w-1/5 p-3 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-100 bg-gray-50/50">
                <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 w-16 bg-gray-200 rounded"></div>
            </div>

            {/* Middle Section Skeleton */}
            <div className="sm:w-3/5 p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    {/* Departure Skeleton */}
                    <div className="text-left w-1/3 pr-2">
                        <div className="h-5 w-12 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                    {/* Duration/Stops Skeleton */}
                    <div className="text-center px-2 flex-shrink-0 w-1/3 flex flex-col items-center">
                        <div className="h-4 w-10 bg-gray-200 rounded mb-1"></div>
                        <div className="w-full h-px bg-gray-300 my-1"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded"></div>
                    </div>
                    {/* Arrival Skeleton */}
                    <div className="text-right w-1/3 pl-2">
                        <div className="h-5 w-12 bg-gray-200 rounded mb-1 ml-auto"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded mb-1 ml-auto"></div>
                        <div className="h-3 w-12 bg-gray-200 rounded ml-auto"></div>
                    </div>
                </div>
                 {/* Tags Skeleton */}
                 <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1">
                    <div className="h-4 w-16 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded-full"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded-full"></div>
                 </div>
            </div>

            {/* Right Section Skeleton */}
            <div className="sm:w-1/5 p-3 flex flex-col justify-between items-center sm:items-end border-t sm:border-t-0 sm:border-l border-gray-100 bg-gray-50/50">
                <div className="text-center sm:text-right w-full">
                    <div className="h-6 w-20 bg-gray-200 rounded mb-2 ml-auto"></div>
                    <div className="space-y-1">
                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 w-full bg-gray-200 rounded"></div>
                        <div className="h-3 w-3/4 bg-gray-200 rounded ml-auto"></div>
                    </div>
                </div>
                <div className="h-7 w-24 bg-gray-200 rounded-md mt-2"></div>
            </div>
        </div>
    </div>
);
// --- END Skeleton Loader Component ---

// --- NEW: Filter Sidebar Skeleton Loader Component ---
const FilterSidebarSkeleton = () => (
    <div className="w-full bg-white p-4 rounded-lg shadow-md border border-gray-200 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center pb-3 border-b mb-4">
            <div className="h-5 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
        </div>

        <div className="space-y-5">
            {/* Stops Filter Skeleton */}
            <div>
                <div className="h-4 w-12 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                        <div className="h-3 w-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                        <div className="h-3 w-6 bg-gray-200 rounded"></div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                        <div className="h-3 w-6 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>

             {/* Cabin Class Filter Skeleton */}
            <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-3"></div>
                 <div className="space-y-2">
                     <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                     <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                 </div>
            </div>

            {/* Airlines Filter Skeleton */}
            <div>
                <div className="h-4 w-16 bg-gray-200 rounded mb-3"></div>
                <div className="space-y-2 border rounded-md p-2 h-32 overflow-hidden">
                     <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                     <div className="h-4 w-full bg-gray-200 rounded"></div>
                     <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                     <div className="h-4 w-5/6 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);
// --- END Filter Sidebar Skeleton Loader Component ---

const CrmChangeFlightPage = () => {
    const { itineraryToken: itineraryTokenFromParams } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    // --- STATE ---
    const [allFlights, setAllFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Context State
    const [searchParams, setSearchParams] = useState(null);
    const [inquiryToken, setInquiryToken] = useState(null);
    const [itineraryToken, setItineraryToken] = useState(itineraryTokenFromParams);
    const [cityName, setCityName] = useState(null);
    const [date, setDate] = useState(null);
    const [oldFlightDetails, setOldFlightDetails] = useState(null);

    // Selection & Modal State
    const [loadingFlightIndex, setLoadingFlightIndex] = useState(null);
    const [traceId, setTraceId] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedFlightDetails, setSelectedFlightDetails] = useState(null);
    const [isReplacingFlight, setIsReplacingFlight] = useState(false);

    // --- Filter State ---
    const [activeFilters, setActiveFilters] = useState({
        priceRange: null,
        airlines: [],
        stops: null,
        cabinClasses: [],
    });
    const [filterOptions, setFilterOptions] = useState({
        priceRange: { min: 0, max: 100000 },
        availableAirlines: [],
        stopCounts: {},
        availableCabinClasses: [],
    });

    // --- EFFECTS (fetchFlights logic mostly unchanged, but no initial price range set in activeFilters) ---
    useEffect(() => {
        // Extract state passed from navigation
        if (location.state) {
            setSearchParams(location.state.searchParams);
            setInquiryToken(location.state.inquiryToken);
            setItineraryToken(location.state.itineraryToken || itineraryTokenFromParams);
            setCityName(location.state.cityName);
            setDate(location.state.date);
            setOldFlightDetails(location.state.oldFlightDetails);
            console.log("CHANGE FLIGHT Received context:", location.state);
        } else {
            setError("Search parameters or context not found. Please initiate search again.");
            setLoading(false);
        }
    }, [location.state, itineraryTokenFromParams]);

    useEffect(() => {
        // Fetch flights only when searchParams and inquiryToken are available
        if (!searchParams || !inquiryToken) {
            return;
        }

        const fetchFlights = async () => {
            setLoading(true);
            setError(null);
            setAllFlights([]);
            console.log("CHANGE FLIGHT Fetching flights with params:", searchParams);

            try {
                const apiRequestBody = {
                    origin: { code: searchParams.departureCity?.iata, city: searchParams.departureCity?.city },
                    destination: { code: searchParams.arrivalCity?.iata, city: searchParams.arrivalCity?.city },
                    departureDate: searchParams.date,
                    departureTime: searchParams.departureTime,
                    travelersDetails: {
                        adults: searchParams.travelers?.rooms?.[0]?.adults || 1,
                        children: searchParams.travelers?.rooms?.[0]?.children || 0,
                        infants: searchParams.travelers?.rooms?.[0]?.infants || 0
                    },
                    type: 'ONE_WAY'
                };

                console.log("CHANGE FLIGHT Sending API Request Body:", apiRequestBody);

                const response = await fetch(
                    `http://localhost:5000/api/itinerary/flights/${inquiryToken}`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                            'X-Inquiry-Token': inquiryToken
                        },
                        body: JSON.stringify(apiRequestBody)
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(errorData.message || `Flight search failed (${response.status})`);
                }

                const data = await response.json();
                console.log("CHANGE FLIGHT search response:", data);

                if (data.success && data.data) {
                    const fetchedFlights = data.data.flights || [];
                    setAllFlights(fetchedFlights);
                    setTraceId(data.data.traceId);

                    // Extract Filter Options
                    const priceData = data.data.priceRange || { min: 0, max: 100000 };
                    const airlinesData = data.data.availableFilters?.airlines || [];
                    const stopsData = data.data.availableFilters?.stopCounts || {};
                    const uniqueCabinClassCodes = [...new Set(fetchedFlights.map(f => f.sg?.[0]?.cC).filter(Boolean))];
                    const uniqueCabinClassNames = uniqueCabinClassCodes
                        .map(getCabinClassName)
                        .filter(name => name !== 'Unknown' && name !== 'All');
                    
                    setFilterOptions({
                        priceRange: priceData,
                        availableAirlines: airlinesData.sort(),
                        stopCounts: stopsData,
                        availableCabinClasses: [...new Set(uniqueCabinClassNames)].sort()
                    });

                    // Initialize activeFilters (WITHOUT price range initially)
                    setActiveFilters(prev => ({
                        ...prev,
                        priceRange: null, // Start with no price filter active
                        airlines: [],
                        stops: null,
                        cabinClasses: [],
                    }));

                } else {
                    setAllFlights([]);
                    toast.info(data.message || "No flights found matching your criteria.");
                    setFilterOptions({ priceRange: { min: 0, max: 100000 }, availableAirlines: [], stopCounts: {}, availableCabinClasses: [] });
                    setActiveFilters({ priceRange: null, airlines: [], stops: null, cabinClasses: [] }); // Reset active filters too
                }

            } catch (err) {
                console.error("CHANGE FLIGHT Error fetching flights:", err);
                setError(err.message);
                toast.error(`Error fetching flights: ${err.message}`);
                setAllFlights([]);
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();

    }, [searchParams, inquiryToken]);

    // --- Filtering Logic (useMemo - Modified to IGNORE priceRange if null) ---
    const filteredFlights = useMemo(() => {
        if (!activeFilters || !allFlights) return allFlights || [];

        return allFlights.filter(flight => {
            const firstSegment = flight.sg?.[0];
            if (!firstSegment) return false;

            // Price Filter (Only apply if activeFilters.priceRange is set)
            // if (activeFilters.priceRange && flight.fF) {
            //     if (flight.fF < activeFilters.priceRange[0] || flight.fF > activeFilters.priceRange[1]) {
            //         return false;
            //     }
            // }

            // Stops Filter
            const stops = flight.sg.length - 1;
            if (activeFilters.stops !== null && stops !== activeFilters.stops) {
                return false;
            }

            // Airlines Filter
            const airlineName = firstSegment.al?.alN;
            if (activeFilters.airlines?.length > 0 && !activeFilters.airlines.includes(airlineName)) {
                return false;
            }

            // Cabin Class Filter
            const cabinClassName = getCabinClassName(firstSegment.cC);
            if (activeFilters.cabinClasses?.length > 0 && !activeFilters.cabinClasses.includes(cabinClassName)) {
                return false;
            }

            return true;
        });
    }, [allFlights, activeFilters]);

    // --- HANDLERS (Filter handlers simplified, Select/Confirm unchanged) ---
    const handleFiltersChange = (newFilters) => {
        console.log("Updating filters:", newFilters);
        setActiveFilters(newFilters);
    };
    const handleResetFilters = () => {
        handleFiltersChange({ // Reset state
            priceRange: null, // Reset price filter too
            airlines: [],
            stops: null,
            cabinClasses: [],
        });
    };
    // --- Select/Confirm Flight Handlers (MODIFIED) ---
    const handleSelectFlight = async (resultIndex) => {
        if (!traceId || !itineraryToken || !inquiryToken || resultIndex === undefined) {
            toast.error("Missing necessary information to select flight details.");
            return;
        }
        setLoadingFlightIndex(resultIndex);
        setError(null);
        console.log(`CHANGE FLIGHT Fetching details for flight resultIndex: ${resultIndex}, traceId: ${traceId}`);
        try {
            const selectResponse = await fetch(
                `http://localhost:5000/api/itinerary/flights/${inquiryToken}/select`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        'X-Inquiry-Token': inquiryToken
                    },
                    body: JSON.stringify({
                        items: [{ type: "FLIGHT", resultIndex: resultIndex }],
                        traceId: traceId,
                        flightType: "ONE_WAY"
                    })
                }
            );
            if (!selectResponse.ok) {
                const errorData = await selectResponse.json().catch(() => ({ message: selectResponse.statusText }));
                throw new Error(errorData.details?.error || errorData.message || `Failed to fetch flight details (${selectResponse.status})`);
            }
            const selectedFlightData = await selectResponse.json();
            console.log("CHANGE FLIGHT Detailed Flight Data received:", selectedFlightData);
            if (!selectedFlightData.success || !selectedFlightData.data) {
                throw new Error(selectedFlightData.message || "Failed to parse detailed flight data after selection.");
            }
            setSelectedFlightDetails(selectedFlightData.data);
            setIsDetailsModalOpen(true);
        } catch (err) {
            console.error("CHANGE FLIGHT Error fetching flight details:", err);
            setError(err.message);
            toast.error(`Error fetching details: ${err.message}`);
            setSelectedFlightDetails(null);
        } finally {
            setLoadingFlightIndex(null);
        }
    };

    const handleConfirmChangeFlight = async () => {
        if (!selectedFlightDetails || !oldFlightDetails || !oldFlightDetails.flightCode) {
            toast.warn("Cannot replace flight: Missing new or old flight details.");
            console.error("Replace error: Missing data", { selectedFlightDetails, oldFlightDetails });
            return;
        }
        const flightTypeToReplace = oldFlightDetails.type || 'departure_flight';
        setIsReplacingFlight(true);
        try {
            if (!itineraryToken || !inquiryToken || !cityName || !date) {
                throw new Error('Missing critical context (token, city, date) for replacing flight.');
            }
            const response = await fetch(`http://localhost:5000/api/itinerary/${itineraryToken}/flight`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    'X-Inquiry-Token': inquiryToken
                },
                body: JSON.stringify({
                    cityName: cityName,
                    date: date,
                    newFlightDetails: selectedFlightDetails,
                    oldFlightCode: oldFlightDetails.flightCode,
                    type: flightTypeToReplace
                }),
            });
            const result = await response.json();
            if (!response.ok || !result.success) {
                if (result.partialSuccess && result.transferUpdateFailed) {
                    toast.warning(result.message || 'Flight replaced, but automatic transfer updates failed.');
                } else {
                    throw new Error(result.message || 'Failed to replace flight in itinerary');
                }
            }
            console.log('Flight replaced successfully:', result);
            toast.success("Flight replaced in itinerary successfully!");
            handleCloseDetailsModal();
            if (itineraryToken && inquiryToken) {
                navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
            } else {
                toast.error("Could not determine itinerary to return to.");
                navigate('/bookings');
            }
        } catch (error) {
            console.error('Error replacing flight:', error);
            toast.error(`Error replacing flight: ${error.message}`);
        } finally {
            setIsReplacingFlight(false);
        }
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setTimeout(() => setSelectedFlightDetails(null), 300);
    };


    // --- RENDER ---
    return (
        <div className="flex flex-col md:flex-row bg-gray-100 min-h-screen">
            <div className="flex-grow px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 bg-slate-50 p-4 py-3 rounded-lg shadow-lg sticky top-0 z-10">
                    <div className="flex items-center gap-3 flex-grow min-w-0">
                        <button
                            onClick={() => navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } })}
                            className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-slate-100 transition-colors flex-shrink-0"
                            title="Back to Itinerary"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="flex-grow min-w-0">
                            <h1 className="text-xl font-bold text-gray-800 truncate">
                                Change Flight {cityName ? `in ${cityName}` : ''}
                            </h1>
                            {searchParams && (
                                <p className="text-xs text-gray-500 truncate">
                                    {searchParams.departureCity?.iata || 'N/A'} &rarr; {searchParams.arrivalCity?.iata || 'N/A'} on {searchParams.date ? new Date(searchParams.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                                    {oldFlightDetails && ` (Replacing: ${oldFlightDetails.flightCode})`}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="w-full lg:w-64 xl:w-72 flex-shrink-0">
                         {/* Conditional Rendering: Show actual filters or filter skeleton */}
                         {!loading && filterOptions.availableAirlines.length > 0 ? (
                             <EmbeddedFlightFilter
                                activeFilters={activeFilters}
                                onFiltersChange={handleFiltersChange}
                                priceRange={filterOptions.priceRange} // Still needed for reset logic, even if not used for filtering
                                availableAirlines={filterOptions.availableAirlines}
                                stopCounts={filterOptions.stopCounts}
                                availableCabinClasses={filterOptions.availableCabinClasses}
                            />
                         ) : loading ? (
                             // Use the new Filter Sidebar Skeleton
                             <FilterSidebarSkeleton />
                         ) : (
                            // Optional: Show a message or empty state if filters aren't available after loading
                            <div className="w-full h-96 bg-white p-4 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
                                <p className="text-sm text-gray-500">Filters unavailable.</p>
                            </div>
                         )}
                     </div>

                    <div className="flex-grow min-w-0">
                         {/* Loading State for Results: Show Skeleton */}
                         {loading && (
                            <div>
                                {/* Render multiple skeletons */}
                                {[...Array(3)].map((_, index) => <FlightCardSkeleton key={index} />)}
                            </div>
                        )}

                        {/* Error State for Results */} 
                        {error && !loading && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 mx-auto" role="alert">
                                <strong className="font-bold">Error: </strong>
                                <span className="block sm:inline"> {error}</span>
                            </div>
                        )}

                        {/* Flight Results List (Render only when not loading and no error) */}
                        {!loading && !error && (
                            <div>
                                {filteredFlights.length > 0 ? (
                                    filteredFlights.map((flight) => (
                                        <CrmFlightResultCard
                                            key={flight.rI}
                                            flight={flight}
                                            onSelect={() => handleSelectFlight(flight.rI)}
                                            isLoading={loadingFlightIndex === flight.rI}
                                        />
                                    ))
                                ) : (
                                    // No Results Message
                                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow p-6">
                                        {allFlights.length > 0 ? (
                                            <>
                                                <p className="mb-2 font-semibold">No flights match the current filters.</p>
                                                {/* Theme Color Applied */}
                                                <button
                                                    onClick={handleResetFilters}
                                                    className="text-sm text-[#13804e] hover:text-[#093923] font-medium underline"
                                                >
                                                    Reset Filters
                                                </button>
                                            </>
                                        ) : (
                                            <p>No alternative flights found matching the initial search criteria.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <CrmAddFlightDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                onConfirm={handleConfirmChangeFlight}
                flightDetails={selectedFlightDetails}
                isLoading={isReplacingFlight}
            />
        </div>
    );
};

export default CrmChangeFlightPage;
