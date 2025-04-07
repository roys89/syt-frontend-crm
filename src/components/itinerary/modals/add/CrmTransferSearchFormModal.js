
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const CrmTransferSearchFormModal = ({ isOpen, onClose, onSearch, initialData }) => {
    // State for transfer search fields
    const [searchDate, setSearchDate] = useState('');
    const [pickupTime, setPickupTime] = useState('10:00'); // Default time
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    // Consider adding state for number of passengers if needed

    // Pre-fill form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setSearchDate(initialData.date || '');
            // Reset other fields or potentially pre-fill locations if logic exists
            setPickupLocation('');
            setDropoffLocation('');
            setPickupTime('10:00'); // Reset time
        }
    }, [isOpen, initialData]);

    const handleSearchClick = (e) => {
        e.preventDefault();
        // Basic validation (can be enhanced)
        if (!pickupLocation || !dropoffLocation || !searchDate || !pickupTime) {
             // Consider using toast notifications for better UX
            alert("Please fill in all required fields: Date, Time, Pickup, and Dropoff locations.");
            return;
        }
        // Pass the current form state back
        onSearch({
            date: searchDate,
            time: pickupTime,
            pickup: pickupLocation,
            dropoff: dropoffLocation,
            // passengers: ... // Add if needed
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-lg shadow-xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Search Transfers in {initialData?.city || 'N/A'}
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
                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="transfer-date" className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                            </label>
                            <input
                                id="transfer-date"
                                type="date"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="transfer-time" className="block text-sm font-medium text-gray-700 mb-1">
                                Pickup Time
                            </label>
                            <input
                                id="transfer-time"
                                type="time"
                                value={pickupTime}
                                onChange={(e) => setPickupTime(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                    </div>

                    {/* Pickup Location */}
                    <div>
                        <label htmlFor="pickup-location" className="block text-sm font-medium text-gray-700 mb-1">
                            Pickup Location
                        </label>
                        <input
                            id="pickup-location"
                            type="text"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="e.g., Airport, Hotel Name, Address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                        {/* TODO: Consider adding autocomplete or type selection (Airport, Hotel, Point) */}
                    </div>

                    {/* Dropoff Location */}
                     <div>
                        <label htmlFor="dropoff-location" className="block text-sm font-medium text-gray-700 mb-1">
                            Dropoff Location
                        </label>
                        <input
                            id="dropoff-location"
                            type="text"
                            value={dropoffLocation}
                            onChange={(e) => setDropoffLocation(e.target.value)}
                            placeholder="e.g., Hotel Name, Airport, Address"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            required
                        />
                         {/* TODO: Consider adding autocomplete or type selection */}
                    </div>

                     {/* TODO: Add field for number of passengers if required by API */}

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
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                    >
                        Search Transfers
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default CrmTransferSearchFormModal;