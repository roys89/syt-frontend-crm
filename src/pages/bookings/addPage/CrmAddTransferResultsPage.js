import { ArrowLeft, Clock, Users } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
// import bookingService from '../../../services/bookingService'; // Will uncomment later
// import CrmTransferResultCard from '../../../components/itinerary/cards/CrmTransferResultCard'; // Will create later

// --- NEW: Import Hourglass loader ---
import { Hourglass } from 'ldrs/react';
import 'ldrs/react/Hourglass.css'; // Ensure CSS is imported

// Import the Quote Modal
import CrmAddTransferQuoteModal from '../../../components/itinerary/modals/add/CrmAddTransferQuoteModal';

// --- Inline Transfer Result Card Component ---
const CrmTransferResultCard = ({ quote, overallDuration, onSelect }) => {
    // Destructure directly from quote where possible
    const { quote_id, fare, currency, vehicle } = quote || {};
    // Destructure from nested vehicle object
    const { capacity, class: vehicleClass, similar_type: vehicleName, image: vehicleImage } = vehicle || {}; // Added image

    // Parse fare amount safely
    const amount = parseFloat(fare);

    // Format price
    const displayPrice = !isNaN(amount) && currency
        ? `${currency}${amount.toFixed(2)}`
        : 'N/A';
    
    const displayDuration = overallDuration ? `${overallDuration} mins` : 'N/A';

    // Placeholder image path (adjust if needed)
    const placeholderImage = "/img/placeholder.png";

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row items-start gap-4">
            {/* Image Section */}
            <div className="w-full sm:w-32 h-24 sm:h-auto flex-shrink-0 mb-3 sm:mb-0">
                <img 
                    src={vehicleImage || placeholderImage}
                    alt={vehicleName || 'Vehicle'}
                    className="w-full h-full object-cover rounded-md bg-gray-100"
                    onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }} // Fallback on error
                />
            </div>

            {/* Details Section (takes remaining space) */}
            <div className="flex-grow flex flex-col sm:flex-row justify-between items-start w-full gap-4">
                {/* Left Side: Vehicle Info */}
                <div className="flex-grow">
                    <h3 className="font-semibold text-gray-800 text-base md:text-lg">{vehicleName || 'Vehicle N/A'}</h3>
                    <p className="text-sm text-gray-600 mb-1">Type: {vehicleClass || 'N/A'}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            Capacity: {capacity || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {displayDuration}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Provider: N/A | ID: {quote_id || 'N/A'}</p>
                </div>

                {/* Right Side: Price & Action */} 
                <div className="text-left sm:text-right flex-shrink-0 w-full sm:w-auto">
                    <p className="text-lg md:text-xl font-bold text-cyan-700 mb-1 sm:mb-2">
                        {displayPrice}
                    </p>
                    <button
                        onClick={() => onSelect(quote)} 
                        className="w-full sm:w-auto px-4 py-1.5 bg-cyan-600 text-white text-sm font-medium rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                    >
                        Select Transfer
                    </button>
                </div>
            </div>
        </div>
    );
};
// -------------------------------------------

const CrmAddTransferResultsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    // Combine state and params, ensuring required tokens are present
    const { 
        searchParams, 
        itineraryToken: itineraryTokenFromState, 
        inquiryToken: inquiryTokenFromState 
    } = location.state || {}; 
    
    const itineraryToken = params.itineraryToken || itineraryTokenFromState;
    const inquiryToken = inquiryTokenFromState; // Assuming inquiryToken only comes from state
    const city = params.city;
    const date = params.date;

    const [results, setResults] = useState([]);
    const [overallDuration, setOverallDuration] = useState(null);
    const [quotationId, setQuotationId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTransfer, setSelectedTransfer] = useState(null); // Stores the *summary* quote object from results list

    const [isAdding, setIsAdding] = useState(false); // Loading state for the final ADD action
    const [addError, setAddError] = useState('');   // Error state for the final ADD action

    // --- useEffect for fetching search results ---
    useEffect(() => {
        console.log("Location state:", location.state);
        console.log("Route params:", params);
        console.log("Context: City=", city, "Date=", date, "itineraryToken=", itineraryToken, "inquiryToken=", inquiryToken);
        console.log("Search Params:", searchParams);

        if (!searchParams || !searchParams.origin || !searchParams.destination || !searchParams.date || !searchParams.time || !city || !date || !itineraryToken || !inquiryToken) {
            console.error("Incomplete search/context data for fetching results.");
            setError("Missing required context or search parameters. Please go back and search again.");
            setLoading(false);
            return;
        }

        const fetchResults = async () => {
             setLoading(true);
             setError(null);
             setResults([]);
             setOverallDuration(null);
             setQuotationId(null); // Reset quotationId before fetch
             try {
                 const payload = {
                    origin: searchParams.origin,
                    destination: searchParams.destination,
                    pickupDate: searchParams.date,
                    pickupTime: searchParams.time,
                    journey_type: 'one_way'
                };
                const apiUrl = `http://localhost:5000/api/itinerary/${itineraryToken}/transfers/search`;
                console.log(`📡 Fetching Search Results: POST ${apiUrl}`, payload);

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Inquiry-Token': inquiryToken, 
                        Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                    },
                    body: JSON.stringify(payload)
                 });
                const data = await response.json();
                console.log('📡 Search Results Response:', data);
                
                if (!response.ok) {
                    throw new Error(data.message || `Failed to fetch transfers (${response.status})`);
                }

                if (data.success && data.data?.data?.quotes) {
                    setResults(data.data.data.quotes);
                    setOverallDuration(data.data.data.duration);
                    setQuotationId(data.data.data.quotation_id);
                } else {
                    const message = data?.data?.message || data?.message || "No quotes found or API response format incorrect.";
                    console.warn(message, data);
                    setResults([]);
                    setOverallDuration(null);
                    setQuotationId(null);
                    if (!data?.success && response.ok) {
                       setError(message); // Set error only if backend explicitly failed
                    }
                }
             } catch (err) {
                console.error("Error fetching transfer search results:", err);
                setError(err.message || "An error occurred while searching for transfers.");
                setResults([]);
                setOverallDuration(null);
                setQuotationId(null);
             } finally {
                setLoading(false);
             }
        };
        fetchResults();
    }, [searchParams, itineraryToken, inquiryToken, city, date, location.state, params]);

    // --- Modal Handling ---
    const handleSelectTransfer = (quoteSummary) => {
        console.log("handleSelectTransfer called. Quote Summary:", quoteSummary);
        // Need quote_id from the summary and the overall quotationId from state
        if (quoteSummary?.quote_id && quotationId) { 
            console.log(`Selected Transfer Quote ID: ${quoteSummary.quote_id}, Overall Quotation ID: ${quotationId}`);
            setSelectedTransfer(quoteSummary); // Store the summary object
            setModalOpen(true);        
        } else {
            console.error("Cannot open modal: Missing quote_id in selected quote or overall quotationId from search results.");
            alert("Could not select transfer. Required information missing (quote ID or quotation ID).");
        }
    };

    const handleCloseAddModal = () => {
        setModalOpen(false);
        setSelectedTransfer(null); 
        setAddError(''); 
    };

    // --- Modified handleConfirmTransferAdd ---
    // Expects object from modal: { fetchedDetails, userInput }
    const handleConfirmTransferAdd = async (confirmationData) => {
        // Destructure data from modal callback
        const { fetchedDetails, userInput } = confirmationData || {};
        const numTravelersFromInput = userInput?.numTravelers; // Get from modal input
        
        console.log("handleConfirmTransferAdd received:", confirmationData);

        // --- Validation --- 
        if (!fetchedDetails) {
             console.error("Add confirmation: Missing fetched details from modal.");
             setAddError("Confirmation failed: Missing transfer details.");
             return;
        }
        if (!quotationId) {
             console.error("Add confirmation: Missing overall quotationId.");
             setAddError("Confirmation failed: Missing overall Quotation ID.");
             return;
        }
        if (!searchParams?.origin || !searchParams?.destination) {
            console.error("Add confirmation: Missing origin/destination in searchParams.");
             setAddError("Confirmation failed: Missing original location data.");
             return;
        }
        if (!numTravelersFromInput || numTravelersFromInput <= 0) {
            console.error("Add confirmation: Invalid number of travelers from input.", numTravelersFromInput);
             setAddError("Confirmation failed: Please enter a valid number of travelers (at least 1).");
             return; // Keep modal open if travelers invalid
        }

        setAddError('');
        setIsAdding(true);

        try {
            // --- Construct transferData (Cleaned) --- 
            const originData = {
                ...(searchParams.origin),
                type: searchParams.origin.type || 'location' // Add default type if missing
            };
            const destinationData = {
                ...(searchParams.destination),
                type: searchParams.destination.type || 'location' // Add default type if missing
            };
            
            // Clone fetchedDetails and remove nested origin/destination if they exist
            const cleanedDetails = { ...fetchedDetails };
            delete cleanedDetails.origin;       // Remove if exists
            delete cleanedDetails.destination;  // Remove if exists
            
            // Combine cleaned details with origin/destination from searchParams
            const transferDataToSend = {
                ...cleanedDetails,         // Use cleaned details
                origin: originData,          
                destination: destinationData 
            };
            // ------------------------------------------

            // --- Construct final payload --- 
            const payload = {
                cityName: city,    
                date: date,        
                transferData: transferDataToSend, 
                quotation_id: quotationId, 
                totalTravelers: numTravelersFromInput // Use value from modal input
                // flightNumber: userInput?.pickupDetails // Example optional data
            };
            // ------------------------------

            console.log('Sending payload to addTransfer backend:', payload);

            const apiUrl = `http://localhost:5000/api/itinerary/${itineraryToken}/add-transfer`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Inquiry-Token': inquiryToken,
                    Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                },
                body: JSON.stringify(payload)
            });

            const responseData = await response.json(); 
            console.log('Add Transfer Raw Response Status:', response.status);
            console.log('Add Transfer Response Data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || `Failed to add transfer (${response.status})`);
            }
            if (!responseData.success) {
                throw new Error(responseData.message || 'Backend reported failure adding transfer.');
            }

            // --- Corrected Success Handling --- 
            console.log("Transfer added successfully via backend.");
            // TODO: Show success toast/message
            
            // --- CORRECTED NAVIGATION --- 
            navigate('/bookings/itinerary', { state: { itineraryToken, inquiryToken } });
            // --------------------------

        } catch (err) {
            console.error("Error in handleConfirmTransferAdd:", err);
            setAddError(err.message || 'An unexpected error occurred while adding the transfer.');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-100 px-4 md:px-6 lg:px-8 pb-4 md:pb-6 lg:pb-8 pt-1 md:pt-2 lg:pt-3 min-h-screen">
             {/* Header - Styled like CrmAddHotelResultsPage */}
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-200 bg-white p-4 py-3 rounded-lg shadow-lg sticky top-0 z-10">
                {/* Left side: Back button and Titles */}
                <div className="flex items-center gap-3 flex-grow min-w-0">
                     <button
                        onClick={() => navigate(-1)} 
                        className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        title="Go Back"
                     >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex-grow min-w-0">
                        <h1 className="text-xl font-bold text-gray-800 truncate">
                            Add Transfer Results {city && date ? `for ${city} on ${date}` : ''}
                        </h1>
                        {/* Subtitle with Origin/Destination */} 
                        <p className="text-xs text-gray-500 truncate" title={`${searchParams?.origin?.display_address || 'Origin N/A'} to ${searchParams?.destination?.display_address || 'Destination N/A'}`}>
                            From: {searchParams?.origin?.display_address || 'Origin N/A'} <span className="mx-1">|</span> To: {searchParams?.destination?.display_address || 'Destination N/A'}
                        </p>
                    </div>
                </div>
                {/* Right side: Can add Modify Search button here later if needed */}
                {/* <div className="flex-shrink-0 ml-4"> ... </div> */}
            </div>

            {/* Body */}
            <div className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8">
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <Hourglass size="40" color="#6366F1" />
                        <p className="ml-3 text-gray-600">Searching for transfers...</p>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center items-center py-10">
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-2xl text-center" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    </div>
                )}

                {!loading && !error && results.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        No transfers found matching your criteria. Try adjusting your search.
                    </div>
                )}

                 {!loading && !error && results.length > 0 && (
                    <div className="space-y-4">
                         {results.map((quoteSummary) => (
                            <CrmTransferResultCard
                                key={quoteSummary.quote_id} 
                                quote={quoteSummary} // Pass the summary object
                                overallDuration={overallDuration} 
                                onSelect={handleSelectTransfer} // Opens modal, passes summary
                            />
                         ))}
                    </div>
                 )}
            </div>

             {/* Render Modal - Pass necessary IDs for fetching inside modal */} 
             {modalOpen && selectedTransfer && (
                <CrmAddTransferQuoteModal
                    isOpen={modalOpen}
                    onClose={handleCloseAddModal} 
                    onConfirm={handleConfirmTransferAdd} // Expects { fetchedDetails, userInput }
                    // Pass minimal details needed for the modal to fetch full data
                    transferDetails={{
                        quote_id: selectedTransfer.quote_id, // ID of the selected quote summary
                        quotationId: quotationId, // Overall quotation ID from search
                        cityName: city, 
                        date: date,
                        inquiryToken: inquiryToken, // Pass token needed for fetch
                        itineraryToken: itineraryToken // Pass token needed for fetch
                        // Pass other context like pickup/dropoff text if needed for display fallback
                        // pickupLocation: searchParams?.origin, 
                        // dropoffLocation: searchParams?.destination
                    }}
                    isAdding={isAdding} // Pass the ADDING state for the final save action
                    addError={addError} // Pass the ADD error for the final save action
                />
            )}
        </div>
    );
};

export default CrmAddTransferResultsPage;
