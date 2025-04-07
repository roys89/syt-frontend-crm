import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
// Consider adding adult/child/infant count inputs if needed

const CrmFlightSearchFormModal = ({ isOpen, onClose, onSearch, initialData }) => {
    // State for flight search fields
    const [departureDate, setDepartureDate] = useState('');
    const [originAirport, setOriginAirport] = useState(''); // Expect IATA code or city name
    const [destinationAirport, setDestinationAirport] = useState(''); // Expect IATA code or city name
    // Add state for return date if needed for round trips
    // const [returnDate, setReturnDate] = useState('');
    // Add state for passenger counts if needed
    const [adults, setAdults] = useState(1);

    // Pre-fill form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setDepartureDate(initialData.date || '');
            // TODO: Potentially pre-fill origin/destination based on itinerary context
            // Example: Pre-fill origin based on current day's city (needs airport mapping)
            // setOriginAirport(getAirportCodeForCity(initialData.city) || '');
            setOriginAirport(''); // Reset for now
            setDestinationAirport(''); // Reset for now
            // setReturnDate('');
            // setAdults(1);
        }
    }, [isOpen, initialData]);

    const handleSearchClick = (e) => {
        e.preventDefault();
        // Basic validation
        if (!originAirport || !destinationAirport || !departureDate) {
            alert("Please fill in Origin, Destination, and Departure Date.");
            return;
        }
        // Pass the current form state back
        onSearch({
            date: departureDate,
            origin: originAirport.toUpperCase(), // Standardize to uppercase?
            destination: destinationAirport.toUpperCase(),
            // returnDate: returnDate, // Add if round trip
            // adults: adults, // Add passengers
        });
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
                            <label htmlFor="origin-airport" className="block text-sm font-medium text-gray-700 mb-1">
                                Origin
                            </label>
                            <input
                                id="origin-airport"
                                type="text"
                                value={originAirport}
                                onChange={(e) => setOriginAirport(e.target.value)}
                                placeholder="City or Airport Code (e.g., DEL)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                maxLength="3" // If enforcing IATA codes
                            />
                        </div>
                         <div>
                            <label htmlFor="destination-airport" className="block text-sm font-medium text-gray-700 mb-1">
                                Destination
                            </label>
                            <input
                                id="destination-airport"
                                type="text"
                                value={destinationAirport}
                                onChange={(e) => setDestinationAirport(e.target.value)}
                                placeholder="City or Airport Code (e.g., BOM)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                                maxLength="3" // If enforcing IATA codes
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