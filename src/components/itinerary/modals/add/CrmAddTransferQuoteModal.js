import { Clock, Loader2, MapPin, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// import bookingService from '../../../../services/bookingService'; // For later API calls

const CrmAddTransferQuoteModal = ({
    isOpen,
    onClose,
    onConfirm, // Parent function to call API, expects fetched details object
    transferDetails, // Contains minimal IDs: quote_id, quotationId, cityName, date
    isAdding, // Loading state for the ADD action (from parent)
    addError // Error state for the ADD action (from parent)
}) => {
    // --- Internal State for Fetching Details ---
    const [details, setDetails] = useState(null); // State for the fetched full details
    const [fetchLoading, setFetchLoading] = useState(false); // Loading state for fetching details
    const [fetchError, setFetchError] = useState(null); // Error state for fetching details
    // -------------------------------------------
    
    // State for optional user input can remain if needed
    const [pickupDetails, setPickupDetails] = useState(''); 
    const [dropoffDetails, setDropoffDetails] = useState(''); 
    // --- Add State for Number of Travelers --- 
    const [numTravelers, setNumTravelers] = useState(2); // Default to 2, or adjust
    // ----------------------------------------

    // Destructure IDs from props
    const { quote_id, quotationId, cityName, date, inquiryToken, itineraryToken } = transferDetails || {}; // Add inquiryToken if passed

    // --- Reinstated useEffect for Fetching Details ---
    useEffect(() => {
        // Create an AbortController for cleanup
        const controller = new AbortController();
        const signal = controller.signal;

        if (isOpen && quote_id && quotationId) { 
            console.log("Modal UseEffect: Fetching details for quote:", quote_id, "quotation:", quotationId);
            
            // Reset state before fetch
            setDetails(null);
            setFetchError(null);
            setFetchLoading(true);
            setPickupDetails(''); // Reset user input fields too
            setDropoffDetails('');

            const fetchQuoteDetails = async () => {
                try {
                    // Assuming itineraryToken is needed and available (needs to be passed in transferDetails)
                    if (!itineraryToken) throw new Error ("Missing itineraryToken for details fetch");
                    if (!inquiryToken) throw new Error ("Missing inquiryToken for details fetch");

                    const apiUrl = `http://localhost:5000/api/itinerary/${itineraryToken}/transfers/quote-details`;
                    const payload = {
                        quotationId: quotationId,
                        quoteId: quote_id // Use quote_id from props
                    };
                    console.log(`📡 Fetching Quote Details: POST ${apiUrl}`, payload);

                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Inquiry-Token': inquiryToken, // Use inquiryToken from props
                            Authorization: `Bearer ${localStorage.getItem('crmToken')}`,
                        },
                        body: JSON.stringify(payload),
                        signal: signal // Pass the abort signal to fetch
                    });

                    // Check if the request was aborted before processing response
                    if (signal.aborted) {
                        console.log("Quote details fetch aborted.");
                        return; // Don't proceed if aborted
                    }

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: `HTTP error! Status: ${response.status}` }));
                        throw new Error(errorData.message || `Failed to fetch quote details (${response.status})`);
                    }

                    const result = await response.json();
                     // Check again if aborted before setting state
                    if (signal.aborted) {
                        console.log("Quote details fetch aborted before setting state.");
                        return;
                    }
                    console.log("📡 Quote Details Response:", result);

                    if (result.success && result.data) {
                         setDetails(result.data); // Set the fetched full details
                    } else {
                        throw new Error(result.message || "Failed to parse quote details from API response.");
                    }

                 } catch (err) {
                     // Avoid setting error state if the error was due to aborting
                     if (err.name === 'AbortError') {
                         console.log('Fetch aborted', err.message);
                     } else {
                         console.error("Error fetching quote details in modal:", err);
                         setFetchError(err.message || "Failed to load detailed quote information.");
                     }
                 } finally {
                     // Ensure loading is set to false even if aborted
                     if (!signal.aborted) {
                        setFetchLoading(false);
                     }
                 }
            };
            
            fetchQuoteDetails();
        } else if (isOpen) {
            console.warn("Modal opened but missing quote_id or quotationId in props.");
            setFetchError("Required information missing to load details.");
        }

        // --- Cleanup Function --- 
        return () => {
            console.log("Modal UseEffect Cleanup: Aborting fetch.");
            controller.abort(); // Abort the fetch request on cleanup
        };
        // -----------------------

    }, [isOpen, quote_id, quotationId, inquiryToken, itineraryToken]); // Removed transferDetails from dependencies
    // ---------------------------------------------------

    // --- Modified handleConfirm ---
    // Calls parent's onConfirm, passing back the fetched details
    const handleConfirm = () => {
        // Prevent confirm if details haven't loaded, or if parent is already adding
        if (fetchLoading || isAdding || !details) return; 
        
        console.log("Modal confirm clicked. Passing back details and input.");
        
        // Prepare object to pass back, including any user input
        const confirmationData = {
            fetchedDetails: details, // The full details object fetched by the modal
            userInput: {
                pickupDetails: pickupDetails || null,
                dropoffDetails: dropoffDetails || null,
                numTravelers: numTravelers // Add the number of travelers
            }
        };
        
        onConfirm(confirmationData); // Call the parent function with the fetched details + input
    };
    // ---------------------------

    // --- Updated Display Logic ---
    if (!isOpen) return null; // Only render if open

    // Display loading state for fetching details
    if (fetchLoading) {
        return (
             <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xl rounded-lg shadow-xl p-6">
                    <div className="flex justify-center items-center py-6">
                        <Loader2 className="w-6 h-6 text-cyan-600 animate-spin" />
                        <p className="ml-2 text-gray-600">Loading quote details...</p>
                    </div>
                </div>
            </div>
        );
    }
    
    // Display error state for fetching details
    if (fetchError) {
        return (
             <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-xl rounded-lg shadow-xl p-6">
                     {/* Header with Close Button */} 
                    <div className="pb-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-red-600">Error</h2>
                        <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    {/* Error Message */} 
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
                        <strong className="font-bold">Failed to load details: </strong>
                        <span className="block sm:inline">{fetchError}</span>
                    </div>
                    {/* Footer with Close Button */} 
                    <div className="pt-4 border-t border-gray-200 flex justify-end">
                         <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium">Close</button>
                    </div>
                </div>
            </div>
        );
    }

    // If details are loaded, display the main modal content
    if (!details) { 
        // This case should ideally be covered by loading/error states, but acts as a fallback
        return null; 
    }

    // Destructure from the fetched 'details' state
    const vehicleInfo = details.quote?.vehicle || {};
    const routeInfo = details.routeDetails || {};
    const imageInfo = vehicleInfo.vehicleImages || {};

    const displayPriceAmount = details.quote?.fare;
    const displayPriceCurrency = details.currency;
    const displayPrice = (displayPriceAmount && displayPriceCurrency)
        ? `${displayPriceCurrency}${parseFloat(displayPriceAmount).toFixed(2)}`
        : 'N/A';

    const displayDuration = routeInfo.duration ? `${routeInfo.duration} mins` : 'N/A';
    const displayVehicleName = vehicleInfo.ve_similar_types || 'Vehicle N/A';
    const displayVehicleCapacity = vehicleInfo.ve_max_capacity || 'N/A';
    const displayVehicleClass = vehicleInfo.ve_class || 'N/A';
    const vehicleImage = imageInfo.ve_im_url;
    const placeholderImage = "/img/placeholder.png";
    
    // Use origin/destination from fetched details if available, fallback to props?
    // Assuming fetched details contain the canonical origin/destination addresses
    const pickupAddress = routeInfo.from || transferDetails?.pickupLocation?.display_address || 'N/A'; 
    const dropoffAddress = routeInfo.to || transferDetails?.dropoffLocation?.display_address || 'N/A';

    // Use date/time from fetched details or construct from props
    const displayDateTime = routeInfo.pickup_date || `${date}`; // Adjust formatting as needed

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-xl rounded-lg shadow-xl max-h-[85vh] flex flex-col">
                {/* Header */} 
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Confirm Transfer Addition
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isAdding} // Disable close if parent is adding?
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */} 
                <div className="flex-grow overflow-y-auto p-5 space-y-4">
                     {/* Display Error from Parent's ADD Action */} 
                     {addError && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Add Error: </strong>
                            <span className="block sm:inline">{addError}</span>
                        </div>
                    )}

                    {/* Transfer Summary Section - Use fetched 'details' state */} 
                    <div className="border border-gray-200 rounded-md p-4 space-y-3">
                         {/* ... display logic using variables derived from 'details' state ... */} 
                         <div className="flex gap-4 items-start mb-3">
                             <img 
                                src={vehicleImage || placeholderImage}
                                alt={displayVehicleName}
                                className="w-24 h-16 object-cover rounded-md border border-gray-200 bg-gray-100 flex-shrink-0"
                                onError={(e) => { e.target.onerror = null; e.target.src = placeholderImage; }}
                            />
                            <div>
                                <h3 className="text-base font-medium text-gray-800">
                                    {displayVehicleName} - {displayPrice}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">Quote ID: {details.quote?.quote_id || quote_id}</p>
                                <p className="text-xs text-gray-500">For: {cityName} on {date}</p> 
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm border-t pt-3">
                            <p className="flex items-center"><Users className="w-4 h-4 mr-2 text-gray-500"/> Capacity: {displayVehicleCapacity}</p>
                            <p className="flex items-center"><Clock className="w-4 h-4 mr-2 text-gray-500"/> Duration: {displayDuration}</p>
                            {/* --- Add Num Travelers Input --- */} 
                            <div> 
                                <label htmlFor="numTravelersInput" className="flex items-center text-sm font-medium text-gray-700">
                                    <Users className="w-4 h-4 mr-2 text-gray-500"/> Number of Travelers:
                                </label>
                                <input 
                                    type="number"
                                    id="numTravelersInput"
                                    value={numTravelers}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setNumTravelers(val > 0 ? val : 1); // Ensure positive number, min 1
                                    }}
                                    min="1"
                                    // Optionally add max based on capacity? max={displayVehicleCapacity}
                                    className="mt-1 w-20 px-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm"
                                />
                            </div>
                            {/* ----------------------------- */} 
                            <p>Vehicle Type: {displayVehicleClass}</p>
                        </div>
                    </div>

                     {/* Pickup/Dropoff Info - Use fetched 'details' state */} 
                     <div className="border border-gray-200 rounded-md p-4 space-y-3">
                          {/* ... display logic ... */} 
                         <h3 className="text-base font-medium text-gray-800 mb-2 border-b pb-2">
                             Pickup & Dropoff
                         </h3>
                          <div className="text-sm space-y-2">
                            <p><strong className="font-medium">Date & Time:</strong> {displayDateTime}</p> 
                            <div className="flex items-start"> 
                                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0"/>
                                <div><strong className="font-medium">From:</strong> {pickupAddress}</div>
                            </div>
                            <div className="flex items-start"> 
                                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-red-600 flex-shrink-0"/>
                                <div><strong className="font-medium">To:</strong> {dropoffAddress}</div>
                            </div>
                        </div>
                         {/* Optional User Input Fields */} 
                          <div className="mt-4">
                            <label htmlFor="pickupDetails" className="block text-sm font-medium text-gray-700 mb-1">Pickup Notes (Optional)</label>
                            <textarea id="pickupDetails" rows={2} value={pickupDetails} onChange={(e) => setPickupDetails(e.target.value)} placeholder="e.g., Meet at arrivals hall, Flight number..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm" />
                        </div>
                         <div className="mt-2">
                            <label htmlFor="dropoffDetails" className="block text-sm font-medium text-gray-700 mb-1">Dropoff Notes (Optional)</label>
                            <textarea id="dropoffDetails" rows={2} value={dropoffDetails} onChange={(e) => setDropoffDetails(e.target.value)} placeholder="e.g., Hotel confirmation number..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 text-sm" />
                        </div>
                     </div>
                </div>

                {/* Footer */} 
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isAdding} // Disable if parent is adding
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        // Disable button if fetching details OR if parent is adding OR if details failed to load
                        disabled={fetchLoading || isAdding || !details}
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {/* Show parent's adding state */}
                        {isAdding ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            'Confirm & Add to Itinerary'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmAddTransferQuoteModal;
