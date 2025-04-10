import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
// Import a potentially different modal for change confirmation later
// import CrmChangeFlightDetailsModal from '../../../components/itinerary/modals/change/CrmChangeFlightDetailsModal';
// For now, reuse the add modal structure, will adjust confirmation logic
import CrmAddFlightDetailsModal from '../../../components/itinerary/modals/add/CrmAddFlightDetailsModal';
// --- NEW: Import Heroicon ---
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
// --- END NEW ---

// Reusing the Result Card from the Add flow for now
const CrmFlightResultCard = ({ flight, onSelect, isLoading }) => {
    const segments = flight.sg || [];
    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];
    
    // Basic Info
    const airlineName = firstSegment?.al?.alN || 'Airline N/A';
    const flightNumber = firstSegment?.al?.fN || '';
    const price = flight.pF ? flight.pF.toLocaleString('en-IN', { style: 'currency', currency: flight.cr || 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 'N/A';
    const stops = segments.length - 1;
    
    // Origin & Destination
    const originAirportCode = firstSegment?.or?.aC || 'N/A';
    const originTerminal = firstSegment?.or?.tr ? `T${firstSegment.or.tr}` : '';
    const departureTime = firstSegment?.or?.dT ? new Date(firstSegment.or.dT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';
    const destinationAirportCode = lastSegment?.ds?.aC || 'N/A';
    const destinationTerminal = lastSegment?.ds?.tr ? `T${lastSegment.ds.tr}` : '';
    const arrivalTime = lastSegment?.ds?.aT ? new Date(lastSegment.ds.aT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : 'N/A';

    // Details
    const isRefundable = flight.iR === true;
    const isLCC = flight.iL === true;
    const checkInBaggage = firstSegment?.bg || 'N/A';
    const cabinBaggage = firstSegment?.cBg || 'N/A';
    const accumulatedDurationMinutes = lastSegment?.aD;
    let totalDurationStr = 'N/A';
    if (typeof accumulatedDurationMinutes === 'number') {
        const hours = Math.floor(accumulatedDurationMinutes / 60);
        const minutes = accumulatedDurationMinutes % 60;
        totalDurationStr = `${hours}h ${minutes}m`;
    }
    const fareType = flight.fareIdentifier?.name || '';
    const cabinClassCode = firstSegment?.cC;
    let cabinClassStr = 'N/A';
    switch (cabinClassCode) {
        case 1: cabinClassStr = 'All'; break; 
        case 2: cabinClassStr = 'Economy'; break;
        case 3: cabinClassStr = 'Premium Economy'; break;
        case 4: cabinClassStr = 'Business'; break;
        case 5: cabinClassStr = 'Premium Business'; break;
        case 6: cabinClassStr = 'First'; break;
        default: cabinClassStr = 'Unknown';
    }

    return (
        <div className="border rounded-lg p-4 mb-4 shadow-sm bg-white transition-shadow hover:shadow-md">
            {/* Top Row: Airline, Stops, Duration, Fare Type */}
            <div className="flex justify-between items-center text-sm mb-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">{airlineName} {flightNumber.trim()}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isLCC ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{isLCC ? 'LCC' : 'Full Service'}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                    <span>{stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`}</span>
                    <span>{totalDurationStr}</span>
                    {fareType && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{fareType}</span>}
                </div>
            </div>

            {/* Middle Row: Origin/Destination Times & Codes */}
            <div className="grid grid-cols-3 gap-4 items-center mb-3">
                <div className="text-left">
                    <p className="font-medium text-xl text-gray-800">{departureTime}</p>
                    <p className="text-gray-600">{originAirportCode} {originTerminal}</p>
                </div>
                <div className="text-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="text-right">
                    <p className="font-medium text-xl text-gray-800">{arrivalTime}</p>
                    <p className="text-gray-600">{destinationAirportCode} {destinationTerminal}</p>
                </div>
            </div>

            {/* Bottom Row: Baggage, Class, Refundable, Price, Select */}
            <div className="flex justify-between items-end text-sm text-gray-600">
                <div className="flex flex-col gap-1">
                     <span title="Cabin Class">Class: {cabinClassStr}</span>
                     <span title="Check-in Baggage">Baggage: {checkInBaggage}</span>
                     <span title="Cabin Baggage">Cabin: {cabinBaggage}</span>
                     <span className={`${isRefundable ? 'text-green-600' : 'text-red-600'} font-medium`}>
                        {isRefundable ? 'Refundable' : 'Non-Refundable'}
                    </span>
                </div>
                 <div className="text-right">
                    <p className="font-semibold text-blue-600 text-xl mb-1">
                        {price}
                    </p>
                     <button 
                        className={`px-4 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 ${isLoading ? 'animate-pulse' : ''}`}
                        onClick={onSelect} 
                        disabled={isLoading}
                    >
                        {isLoading ? 'Selecting...' : 'Select Flight'}
                    </button>
                 </div>
            </div>
        </div>
    );
};


const CrmChangeFlightPage = () => {
    const { itineraryToken: itineraryTokenFromParams } = useParams(); // Get token if passed via URL
    const location = useLocation();
    const navigate = useNavigate();

    const [flights, setFlights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State from navigation
    const [searchParams, setSearchParams] = useState(null); 
    const [inquiryToken, setInquiryToken] = useState(null); 
    const [itineraryToken, setItineraryToken] = useState(itineraryTokenFromParams); 
    const [cityName, setCityName] = useState(null); 
    const [date, setDate] = useState(null); 
    const [oldFlightDetails, setOldFlightDetails] = useState(null); // Context for the flight being changed

    // State for selection process
    const [selectingFlight, setSelectingFlight] = useState(false);
    const [traceId, setTraceId] = useState(null); // Store traceId from search response

    // State for the details modal (reusing 'add' modal for structure temporarily)
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedFlightDetails, setSelectedFlightDetails] = useState(null); // This will hold the NEW selected flight
    const [isReplacingFlight, setIsReplacingFlight] = useState(false); // Loading state for the final replace API call

    useEffect(() => {
        // Extract state passed from navigation
        if (location.state) {
            setSearchParams(location.state.searchParams);
            setInquiryToken(location.state.inquiryToken);
            setItineraryToken(location.state.itineraryToken || itineraryTokenFromParams); // Prioritize state
            setCityName(location.state.cityName);
            setDate(location.state.date);
            setOldFlightDetails(location.state.oldFlightDetails); // Get the old flight context
            
            // Log the received context
            console.log("CHANGE FLIGHT Received context:", {
                searchParams: location.state.searchParams,
                inquiryToken: location.state.inquiryToken,
                itineraryToken: location.state.itineraryToken,
                cityName: location.state.cityName,
                date: location.state.date,
                oldFlightDetails: location.state.oldFlightDetails // Log old flight context
            });

        } else {
            setError("Search parameters or context not found. Please initiate search again.");
            setLoading(false);
            // Optionally navigate back or show a persistent error
            // navigate(-1); 
        }
    }, [location.state, itineraryTokenFromParams]);

    useEffect(() => {
        // Fetch flights only when searchParams and inquiryToken are available
        if (!searchParams || !inquiryToken) {
            return; // Wait until parameters are set
        }

        const fetchFlights = async () => {
            setLoading(true);
            setError(null);
            console.log("CHANGE FLIGHT Fetching flights with params:", searchParams);

            try {
                // API call remains the same as the 'add' flow for searching
                const apiRequestBody = {
                    origin: {
                        code: searchParams.departureCity?.iata,
                        city: searchParams.departureCity?.city
                    },
                    destination: {
                        code: searchParams.arrivalCity?.iata,
                        city: searchParams.arrivalCity?.city
                    },
                    departureDate: searchParams.date,
                    departureTime: searchParams.departureTime,
                    travelersDetails: {
                        adults: searchParams.travelers?.rooms?.[0]?.adults || 1,
                        children: searchParams.travelers?.rooms?.[0]?.children || 0,
                        infants: searchParams.travelers?.rooms?.[0]?.infants || 0
                    },
                    type: 'ONE_WAY' // Or determine based on searchParams if needed
                };

                console.log("CHANGE FLIGHT Sending API Request Body:", apiRequestBody);

                const response = await fetch(
                    `http://localhost:5000/api/itinerary/flights/${inquiryToken}`, // Use the same search route
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

                if (data.success && data.data?.flights) {
                    setFlights(data.data.flights);
                    setTraceId(data.data.traceId); 
                } else {
                    setFlights([]); 
                    toast.info(data.message || "No flights found matching your criteria.");
                }

            } catch (err) {
                console.error("CHANGE FLIGHT Error fetching flights:", err);
                setError(err.message);
                toast.error(`Error fetching flights: ${err.message}`);
                setFlights([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchFlights();

    }, [searchParams, inquiryToken]);

    // --- Handle Selecting a Flight (Opens Details Modal) ---
    const handleSelectFlight = async (resultIndex) => {
        if (!traceId || !itineraryToken || !inquiryToken || resultIndex === undefined) {
            toast.error("Missing necessary information to select flight details.");
            console.error("CHANGE FLIGHT Selection error: Missing context", { traceId, itineraryToken, inquiryToken, resultIndex });
            return;
        }

        setSelectingFlight(true); 
        setError(null);
        console.log(`CHANGE FLIGHT Fetching details for flight resultIndex: ${resultIndex}, traceId: ${traceId}`);

        try {
            // 1. Call the selectFlight endpoint (same as add flow)
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
                        flightType: "ONE_WAY" // Or determine based on context
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
            
            // Store the NEW detailed data and open the modal
            setSelectedFlightDetails(selectedFlightData.data); 
            setIsDetailsModalOpen(true);

        } catch (err) {
            console.error("CHANGE FLIGHT Error fetching flight details:", err);
            setError(err.message);
            toast.error(`Error fetching details: ${err.message}`);
            setSelectedFlightDetails(null); 
        } finally {
            setSelectingFlight(false); 
        }
    };

    // --- Handle Confirming and REPLACING the Flight (From Modal) ---
    const handleConfirmChangeFlight = async () => {
        // This function will be passed to the details modal's 'onConfirm' prop
        if (!selectedFlightDetails || !oldFlightDetails || !oldFlightDetails.flightCode) {
            toast.warn("Cannot replace flight: Missing new or old flight details.");
            console.error("Replace error: Missing data", { selectedFlightDetails, oldFlightDetails });
            return;
        }
        
        // TODO: Determine the correct flight type if needed for the replace API
        const flightTypeToReplace = oldFlightDetails.type || 'departure_flight'; // Example default

        setIsReplacingFlight(true); 
        try {
            if (!itineraryToken || !inquiryToken || !cityName || !date) {
                throw new Error('Missing critical context (token, city, date) for replacing flight.');
            }

            // *** THIS IS THE KEY DIFFERENCE: Call the REPLACE endpoint ***
            // Assuming a PUT request to /api/itinerary/:itineraryToken/flight
            // The body structure might need adjustment based on the backend controller
            const response = await fetch(`http://localhost:5000/api/itinerary/${itineraryToken}/flight`, { // Changed from /add-flight
                method: 'PUT', // Use PUT for replace/update
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    'X-Inquiry-Token': inquiryToken
                },
                body: JSON.stringify({
                    cityName: cityName,     
                    date: date,             
                    newFlightDetails: selectedFlightDetails, // The full selected NEW flight data
                    oldFlightCode: oldFlightDetails.flightCode, // Pass identifier for the flight to replace (IF NEEDED by backend)
                    type: flightTypeToReplace // Pass the type of the flight being replaced/added
                }),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                // Handle partial success if transfers fail, similar to replaceHotel?
                if (result.partialSuccess && result.transferUpdateFailed) {
                    toast.warning(result.message || 'Flight replaced, but automatic transfer updates failed.');
                    // Still proceed to close modal and navigate, but with warning
                } else {
                    throw new Error(result.message || 'Failed to replace flight in itinerary');
                }
            }

            console.log('Flight replaced successfully:', result);
            toast.success("Flight replaced in itinerary successfully!");
            handleCloseDetailsModal(); 
            
            // Navigate back using the state method (consistent with add flow)
            if (itineraryToken && inquiryToken) {
                navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
            } else {
                 toast.error("Could not determine itinerary to return to.");
                 navigate('/bookings'); // Fallback
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

    return (
        // --- UPDATED: Page container with background ---
        <div className="px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3 bg-gray-100 min-h-screen">
            {/* --- NEW: Sticky Header (similar to CrmChangeHotelPage) --- */}
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
                        {/* Subtitle with flight details */}
                        {searchParams && (
                            <p className="text-xs text-gray-500 truncate">
                                {searchParams.departureCity?.iata || 'N/A'} &rarr; {searchParams.arrivalCity?.iata || 'N/A'} on {searchParams.date ? new Date(searchParams.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'N/A'}
                                {oldFlightDetails && ` (Replacing: ${oldFlightDetails.flightCode})`}
                            </p>
                        )}
                    </div>
                </div>
                {/* Optional: Add Modify Search button here if needed for flights */}
                {/* <div className="flex-shrink-0 ml-4">
                     <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm ...">
                        Modify Search
                     </button>
                </div> */}
            </div>
            {/* --- END NEW Header --- */}

            {loading && (
                <div className="text-center py-16">
                    <p className="text-gray-600">Loading available flights...</p>
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 mx-auto max-w-2xl" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            {!loading && !error && flights.length > 0 && (
                <div className="mt-6">
                    {flights.length > 0 ? (
                        flights.map((flight) => (
                            <CrmFlightResultCard 
                                key={flight.rI} 
                                flight={flight} 
                                onSelect={() => handleSelectFlight(flight.rI)} 
                                isLoading={selectingFlight && selectedFlightDetails?.resultIndex === flight.rI} // Check if this flight is being selected
                            />
                        ))
                    ) : (
                         <div className="text-center py-10 text-gray-500">
                            <p>No alternative flights found matching your search criteria.</p>
                         </div>
                    )}
                </div>
            )}

            {/* --- NEW: No Results State (when !loading, !error, flights is empty) --- */}
            {!loading && !error && flights.length === 0 && (
                <p className="text-center text-gray-500 mt-10">No alternative flights found matching the criteria.</p>
            )}

            {/* Details Modal (Using Add Modal Structure for now) */}
            <CrmAddFlightDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={handleCloseDetailsModal}
                onConfirm={handleConfirmChangeFlight} // Pass the REPLACE handler
                flightDetails={selectedFlightDetails} // The NEW flight details
                isLoading={isReplacingFlight} // Use the replacing state
                // TODO: Pass oldFlightDetails for price comparison if needed in modal
                // oldFlightPrice={oldFlightDetails?.price} 
            />
        </div>
    );
};

export default CrmChangeFlightPage;
