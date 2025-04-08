import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import LocationMapPicker from '../../../common/LocationMapPicker';

const CrmTransferSearchFormModal = ({ isOpen, onClose, onSearch, initialData }) => {
    // State for transfer search fields
    const [searchDate, setSearchDate] = useState('');
    const [pickupTime, setPickupTime] = useState('10:00'); // Default time
    const [pickupLocation, setPickupLocation] = useState({ display_address: '', lat: null, long: null });
    const [dropoffLocation, setDropoffLocation] = useState({ display_address: '', lat: null, long: null });
    const [errors, setErrors] = useState({});

    // Pre-fill form when modal opens or initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setSearchDate(initialData.date || '');
            // Reset locations and time
            setPickupLocation({ display_address: '', lat: null, long: null });
            setDropoffLocation({ display_address: '', lat: null, long: null });
            setPickupTime('10:00');
            setErrors({}); // Clear errors on open
        }
    }, [isOpen, initialData]);

    // Handlers for LocationMapPicker
    const handlePickupSelect = (location) => {
        console.log("Pickup selected:", location);
        setPickupLocation({
            display_address: location.display_address || '',
            lat: location.lat || null,
            long: location.long || null
        });
        setErrors(prev => ({ ...prev, pickup: undefined })); // Clear pickup error on selection
    };

    const handleDropoffSelect = (location) => {
        console.log("Dropoff selected:", location);
        setDropoffLocation({
            display_address: location.display_address || '',
            lat: location.lat || null,
            long: location.long || null
        });
        setErrors(prev => ({ ...prev, dropoff: undefined })); // Clear dropoff error on selection
    };

    const validateForm = () => {
        const newErrors = {};
        if (!pickupLocation.lat || !pickupLocation.long || !pickupLocation.display_address) {
            newErrors.pickup = 'Please select a valid pickup location from the map.';
        }
        if (!dropoffLocation.lat || !dropoffLocation.long || !dropoffLocation.display_address) {
            newErrors.dropoff = 'Please select a valid dropoff location from the map.';
        }
        if (!searchDate) {
            newErrors.date = 'Please select a date.';
        }
         // Basic time validation (you might want more robust checks)
        if (!pickupTime || !/^\d{2}:\d{2}$/.test(pickupTime)) {
             newErrors.time = 'Please enter a valid time (HH:MM).';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }

    const handleSearchClick = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            // Consider using toast notifications for better UX
           alert("Please fix the errors indicated in the form.");
           return;
        }

        // Pass the structured data back
        onSearch({
            date: searchDate,
            time: pickupTime,
            origin: pickupLocation,      // Pass the full location object
            destination: dropoffLocation // Pass the full location object
            // passengers: ... // Add if needed
        });
    };

    if (!isOpen) return null;

    // Determine initial map center (e.g., based on city if provided)
    // Placeholder: Default to a generic location if city data isn't readily available
    const initialMapCenter = { lat: 19.0760, lng: 72.8777 }; // Default to Mumbai

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
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
                <form onSubmit={handleSearchClick} className="flex-grow overflow-y-auto p-5 space-y-5">
                    {/* Date & Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="transfer-date" className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                id="transfer-date"
                                type="date"
                                value={searchDate}
                                onChange={(e) => {
                                    setSearchDate(e.target.value);
                                    setErrors(prev => ({ ...prev, date: undefined }));
                                }}
                                className={`w-full px-3 py-2 border ${errors.date ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                required
                            />
                             {errors.date && <p className="mt-1 text-xs text-red-600">{errors.date}</p>}
                        </div>
                        <div>
                            <label htmlFor="transfer-time" className="block text-sm font-medium text-gray-700 mb-1">
                                Pickup Time *
                            </label>
                            {/* Consider using AnalogClock component if available */}
                            <input
                                id="transfer-time"
                                type="time"
                                value={pickupTime}
                                onChange={(e) => {
                                    setPickupTime(e.target.value);
                                    setErrors(prev => ({ ...prev, time: undefined }));
                                }}
                                className={`w-full px-3 py-2 border ${errors.time ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                required
                            />
                            {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
                        </div>
                    </div>

                    {/* Pickup & Dropoff Map Pickers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Pickup Location */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pickup Location *
                            </label>
                            <LocationMapPicker
                                placeholder="Search or click map for pickup..."
                                onLocationSelect={handlePickupSelect}
                                initialCenter={initialMapCenter}
                                value={pickupLocation.lat && pickupLocation.long ? { lat: pickupLocation.lat, lng: pickupLocation.long } : null}
                            />
                            {pickupLocation.display_address && (
                                <div className="mt-2 p-2 text-xs bg-indigo-50 rounded border border-indigo-100 text-indigo-700">
                                    Selected: {pickupLocation.display_address}
                                </div>
                            )}
                            {errors.pickup && <p className="mt-1 text-xs text-red-600">{errors.pickup}</p>}
                        </div>

                        {/* Dropoff Location */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dropoff Location *
                            </label>
                             <LocationMapPicker
                                placeholder="Search or click map for dropoff..."
                                onLocationSelect={handleDropoffSelect}
                                initialCenter={initialMapCenter}
                                value={dropoffLocation.lat && dropoffLocation.long ? { lat: dropoffLocation.lat, lng: dropoffLocation.long } : null}
                            />
                             {dropoffLocation.display_address && (
                                <div className="mt-2 p-2 text-xs bg-gray-50 rounded border border-gray-200 text-gray-700">
                                    Selected: {dropoffLocation.display_address}
                                </div>
                             )}
                            {errors.dropoff && <p className="mt-1 text-xs text-red-600">{errors.dropoff}</p>}
                        </div>
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
                        form="transfer-search-form"
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