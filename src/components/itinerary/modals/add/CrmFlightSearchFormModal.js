import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import AirportSelector from '../../../booking/AirportSelector'; // Import the AirportSelector
// Consider adding adult/child/infant count inputs if needed

const CrmFlightSearchFormModal = ({ isOpen, onClose, onSearch, initialData }) => {
    // State for flight search fields
    const [departureDate, setDepartureDate] = useState('');
    const [originAirport, setOriginAirport] = useState(null); // State now holds the airport object
    const [destinationAirport, setDestinationAirport] = useState(null); // State now holds the airport object
    const [departureTime, setDepartureTime] = useState(''); // Add state for departure time
    // Add state for return date if needed for round trips
    // const [returnDate, setReturnDate] = useState('');
    // Add state for passenger counts
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);

    // Pre-fill form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setDepartureDate(initialData.date || '');
            setAdults(initialData.travelersDetails?.adults || 1);
            setChildren(initialData.travelersDetails?.children || 0);
            setInfants(initialData.travelersDetails?.infants || 0);
            // TODO: Potentially pre-fill origin/destination based on itinerary context
            // Example: Pre-fill origin based on current day's city (needs airport mapping)
            // setOriginAirport(getAirportCodeForCity(initialData.city) || '');
            setOriginAirport(null); // Reset airport objects
            setDestinationAirport(null); // Reset airport objects
            setDepartureTime(''); // Reset departure time
            // setReturnDate('');
            // setAdults(1);
        }
    }, [isOpen, initialData]);

    const handleSearchClick = (e) => {
        // Default values mirroring FlightBookingPage
        const provider = 'TC';
        const isRoundTrip = false;
        const cabinClass = 1; // Default to ALL/ECONOMY usually

        e.preventDefault();
        // Basic validation using the airport objects
        if (!originAirport || !originAirport.code || !destinationAirport || !destinationAirport.code || !departureDate) {
            alert("Please select Origin, Destination, and Departure Date.");
            return;
        }
        if (originAirport.code === destinationAirport.code) {
            alert("Origin and Destination cannot be the same.");
            return;
        }

        // Construct the payload in the desired format
        const searchPayload = {
            provider,
            departureCity: {
                city: originAirport.city,
                iata: originAirport.code,
                country: originAirport.country
            },
            arrivalCity: {
                city: destinationAirport.city,
                iata: destinationAirport.code,
                country: destinationAirport.country
            },
            date: departureDate,
            returnDate: "", // Explicitly empty for one-way
            isRoundTrip,
            travelers: {
                rooms: [{
                    adults: adults, // Send the count directly
                    children: children, // Send the count directly
                    infants: infants // Send the count directly
                }]
            },
            departureTime: departureTime || "", // Include departureTime, default to empty string if unset
            returnTime: "", // Explicitly empty
            cabinClass
        };

        // Pass the current form state back
        onSearch(searchPayload); // Pass the correctly structured payload
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Search Flights
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSearchClick} className="flex-grow overflow-y-auto p-5 space-y-4">
                    {/* Origin & Destination */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <AirportSelector
                                label="Origin"
                                placeholder="Select origin airport"
                                value={originAirport}
                                onChange={(airport) => setOriginAirport(airport)} // Update state with selected object
                                required
                            />
                        </div>
                         <div>
                            <AirportSelector
                                label="Destination"
                                placeholder="Select destination airport"
                                value={destinationAirport}
                                onChange={(airport) => setDestinationAirport(airport)} // Update state with selected object
                                required
                            />
                        </div>
                    </div>

                    {/* Departure Date (Return date can be added similarly) */}
                    <div>
                        <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Departure Date
                        </label>
                        <input
                            id="departure-date"
                            type="date"
                            value={departureDate}
                            onChange={(e) => setDepartureDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>

                    {/* Departure Time */}
                    <div>
                        <label htmlFor="departure-time" className="block text-sm font-medium text-gray-700 mb-1">
                            Departure Time (Optional)
                        </label>
                        <input
                            id="departure-time"
                            type="time" // Input type for time
                            value={departureTime}
                            onChange={(e) => setDepartureTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    {/* TODO: Add fields for passenger counts (Adults, Children, Infants) */}
                    
                    <div>
                        <label htmlFor="flight-adults" className="block text-sm font-medium text-gray-700 mb-1">
                            Adults (12+)
                        </label>
                        <input
                            id="flight-adults"
                            type="number"
                            min="1"
                            value={adults}
                            onChange={(e) => setAdults(parseInt(e.target.value, 10) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="flight-children" className="block text-sm font-medium text-gray-700 mb-1">
                            Children (2-11)
                        </label>
                        <input
                            id="flight-children"
                            type="number"
                            min="0"
                            value={children}
                            onChange={(e) => setChildren(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="flight-infants" className="block text-sm font-medium text-gray-700 mb-1">
                            Infants (0-1)
                        </label>
                        <input
                            id="flight-infants"
                            type="number"
                            min="0"
                            value={infants}
                            onChange={(e) => setInfants(parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                </form>

                {/* Footer */}
                 <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                     <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSearchClick}
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                        Search Flights
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default CrmFlightSearchFormModal;