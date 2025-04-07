import { ArrowPathIcon, MinusIcon, PlusIcon, TrashIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/solid';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Default constraints (can be overridden by props if needed later)
const MAX_ROOMS = 5;
const MAX_ADULTS_PER_ROOM = 6;
const MAX_CHILDREN_PER_ROOM = 4;

const CrmHotelSearchModifyModal = ({
    isOpen,
    onClose,
    currentSearch, // { city, checkIn, checkOut, travelersDetails }
    onSearchUpdate // Function to call with new { checkIn, checkOut, travelersDetails }
}) => {
    // --- State for Main Form --- 
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [currentTravelersDetails, setCurrentTravelersDetails] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // --- State for Multi-View --- 
    const [view, setView] = useState('dates'); // 'dates' or 'rooms'

    // --- Initialize/Reset State --- 
    useEffect(() => {
        if (isOpen) {
            setView('dates'); // Always start in date view
            setIsLoading(false);
            if (currentSearch) {
            setCheckInDate(currentSearch.checkIn || '');
            setCheckOutDate(currentSearch.checkOut || '');
                // Initialize traveler details robustly
                const initialRooms = currentSearch.travelersDetails?.rooms?.length > 0
                    ? currentSearch.travelersDetails.rooms.map(room => ({
                        adults: Array.isArray(room.adults) ? room.adults.map(age => age ?? 30) : Array(room.adults || 1).fill(30), // Default age 30 if needed
                        children: Array.isArray(room.children) ? room.children.map(age => age ?? 0) : [] // Default age 0 if needed
                      }))
                    : [{ adults: [30], children: [] }]; // Default: 1 adult room
                setCurrentTravelersDetails(prev => ({ 
                    ...(prev || {}), // Preserve other potential details if needed
                    rooms: JSON.parse(JSON.stringify(initialRooms))
                }));
            } else {
                 // Fallback if no currentSearch
                 setCurrentTravelersDetails({ rooms: [{ adults: [30], children: [] }] });
            }
        } 
    }, [isOpen, currentSearch]); // Rerun on open or if initial search data changes

    // === Room Arrangement Logic (Integrated) ===
    const rooms = currentTravelersDetails?.rooms || [];

    const addRoom = () => {
        if (rooms.length < MAX_ROOMS) {
            const updatedRooms = [...rooms, { adults: [30], children: [] }];
            setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
        }
    };

    const removeRoom = (index) => {
        if (rooms.length > 1) {
            const updatedRooms = rooms.filter((_, i) => i !== index);
            setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
        }
    };

    // --- Adult Management ---
    const addAdult = (roomIndex) => {
        const updatedRooms = rooms.map((room, i) => {
            if (i === roomIndex && room.adults.length < MAX_ADULTS_PER_ROOM) {
                return { ...room, adults: [...room.adults, null] }; // Add adult with null age initially
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const removeAdult = (roomIndex, adultIndex) => {
        const updatedRooms = rooms.map((room, i) => {
            if (i === roomIndex && room.adults.length > 1) { // Prevent removing last adult
                const newAdults = room.adults.filter((_, aIndex) => aIndex !== adultIndex);
                return { ...room, adults: newAdults };
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const handleAdultAgeChange = (roomIndex, adultIndex, age) => {
        const value = age === '' ? null : parseInt(age, 10);
        if (isNaN(value) && age !== '') return; // Prevent NaN
        const updatedRooms = rooms.map((room, rIndex) => {
            if (rIndex === roomIndex) {
                const newAdults = [...room.adults];
                newAdults[adultIndex] = value; // Allow null or number
                return { ...room, adults: newAdults };
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };
    // --- End Adult Management ---

    // --- Child Management ---
    const addChild = (roomIndex) => {
        const updatedRooms = rooms.map((room, i) => {
            if (i === roomIndex && room.children.length < MAX_CHILDREN_PER_ROOM) {
                return { ...room, children: [...room.children, null] }; // Add child with null age
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const removeChild = (roomIndex, childIndex) => {
        const updatedRooms = rooms.map((room, i) => {
            if (i === roomIndex) {
                const newChildren = room.children.filter((_, cIndex) => cIndex !== childIndex);
                return { ...room, children: newChildren };
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };

    const handleChildAgeChange = (roomIndex, childIndex, age) => {
        const value = age === '' ? null : parseInt(age, 10);
        if (value !== null && (isNaN(value) || value < 0 || value > 17)) return; // Validate 0-17 or null
        
        const updatedRooms = rooms.map((room, rIndex) => {
            if (rIndex === roomIndex) {
                const newChildren = [...room.children];
                newChildren[childIndex] = value;
                return { ...room, children: newChildren };
            }
            return room;
        });
        setCurrentTravelersDetails(prev => ({ ...prev, rooms: updatedRooms }));
    };
    // --- End Child Management ---

    const validateRooms = () => {
        const hasInvalidAges = rooms.some(room =>
            room.adults.some(age => age === null || age === undefined || age < 18 || age > 120) ||
            room.children.some(age => age === null || age === undefined || age < 0 || age > 17) // Added child range check
        );
        if (hasInvalidAges) {
            toast.error("Please ensure all adult ages are between 18-120 and child ages are between 0-17.");
            return false;
        }
        if (rooms.some(room => room.adults.length < 1)) {
            toast.error("Each room must have at least one adult.");
            return false;
        }
        return true;
    };

    const handleSaveRoomsAndSwitchBack = () => {
        if (validateRooms()) {
            // The state `currentTravelersDetails` is already updated by individual handlers
            setView('dates'); // Switch back to date view
        } 
    };
    // === End Room Arrangement Logic ===

    // === Main Search Logic ===
    const handleSearch = () => {
        // Basic date validation
        if (!checkInDate || !checkOutDate || checkOutDate <= checkInDate) {
            toast.error("Please select valid check-in and check-out dates.");
            return;
        }
        const today = new Date().toISOString().split('T')[0];
        if (checkInDate < today) {
            toast.error("Check-in date cannot be in the past.");
            return;
        }
        // Final check on room config before submitting the search
        if (!validateRooms()) {
            return; // Stop if room validation fails
        }

        setIsLoading(true);
        onSearchUpdate({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            travelersDetails: currentTravelersDetails // Pass the final (potentially modified) details
        });
        // Parent handles closing modal after initiating search/navigation
    };
    // === End Main Search Logic ===

    // === View Switching Logic ===
    const switchToRoomView = () => setView('rooms');
    const switchToDateView = () => setView('dates');
    // === End View Switching Logic ===
    
    // === Guest Summary Text ===
    const guestSummary = (() => {
        if (!rooms || rooms.length === 0) return "No guests specified";
        const totalRooms = rooms.length;
        const totalAdults = rooms.reduce((sum, room) => sum + (room.adults?.length || 0), 0);
        const totalChildren = rooms.reduce((sum, room) => sum + (room.children?.length || 0), 0);
        return `${totalRooms} Room${totalRooms !== 1 ? 's' : ''}, ${totalAdults} Adult${totalAdults !== 1 ? 's' : ''}${totalChildren > 0 ? `, ${totalChildren} Child${totalChildren !== 1 ? 'ren' : ''}` : ''}`;
    })();
    // === End Guest Summary Text ===

    if (!isOpen) return null;

    // === Conditional Rendering based on View ===
    const renderDateView = () => (
        <>
            {/* Form Body for Dates/Summary */}
                <div className="p-6 space-y-4">
                     {/* City (Display Only) */}
                     <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input type="text" value={currentSearch?.city || 'N/A'} readOnly className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed" aria-label="City (read-only)"/>
                    </div>
                    {/* Check-in Date */}
                    <div>
                    <label htmlFor="checkin-date" className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                    <input type="date" id="checkin-date" value={checkInDate} onChange={(e) => setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" disabled={isLoading}/>
                    </div>
                    {/* Check-out Date */}
                    <div>
                    <label htmlFor="checkout-date" className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                    <input type="date" id="checkout-date" value={checkOutDate} onChange={(e) => setCheckOutDate(e.target.value)} min={checkInDate || new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" disabled={isLoading}/>
                    </div>
                {/* Guests/Rooms Button */} 
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guests & Rooms</label>
                    <button type="button" onClick={switchToRoomView} className="w-full flex items-center justify-between px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500" disabled={isLoading}>
                        <span className="text-sm text-gray-700">{guestSummary}</span>
                        <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </button>
                </div>
            </div>
            {/* Footer for Dates View */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" disabled={isLoading}>Cancel</button>
                <button type="button" onClick={handleSearch} disabled={isLoading || !checkInDate || !checkOutDate} className={`inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isLoading || !checkInDate || !checkOutDate ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}>
                    {isLoading ? (<><ArrowPathIcon className="animate-spin -ml-1 mr-2 h-4 w-4" aria-hidden="true" />Searching...</>) : ('Search Hotels')}
                </button>
            </div>
        </>
    );

    const renderRoomView = () => (
        <>
            {/* Body for Room Arrangement */}
            <div className="p-4 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scrollbar-thumb-rounded">
                <div className="space-y-5">
                    {rooms.map((room, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            {/* Room Header */} 
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-gray-900">Room {index + 1}</h4>
                                {rooms.length > 1 && (
                                    <button type="button" onClick={() => removeRoom(index)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Remove Room" disabled={rooms.length <= 1}>
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            {/* Adult Section */} 
                            <div className="mb-6 pb-6 border-b border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-medium text-gray-600">Adults (18+)</label>
                                    <div className="flex items-center space-x-2">
                                        <button type="button" onClick={() => addAdult(index)} disabled={room.adults.length >= MAX_ADULTS_PER_ROOM} className="p-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Add Adult">
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="text-sm font-medium w-6 text-center">{room.adults.length}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {room.adults.map((age, adultIndex) => (
                                        <div key={`adult-${adultIndex}`} className="relative flex items-center">
                                            <input type="number" min="18" max="120" value={age ?? ''} onChange={(e) => handleAdultAgeChange(index, adultIndex, e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-12 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:ring-offset-1 sm:text-sm appearance-none" placeholder="Age"/>
                                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">yrs</span>
                                            {room.adults.length > 1 && (
                                                <button type="button" onClick={() => removeAdult(index, adultIndex)} className="ml-1 text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100 absolute -right-5 top-1/2 transform -translate-y-1/2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1" aria-label="Remove Adult" disabled={room.adults.length <= 1}>
                                                    <MinusIcon className="h-3.5 w-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Children Section */} 
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-medium text-gray-600">Children (0-17)</label>
                                    <div className="flex items-center space-x-2">
                                        <button type="button" onClick={() => addChild(index)} disabled={room.children.length >= MAX_CHILDREN_PER_ROOM} className="p-1 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Add Child">
                                            <PlusIcon className="h-4 w-4" />
                                        </button>
                                        <span className="text-sm font-medium w-6 text-center">{room.children.length}</span>
                                    </div>
                                </div>
                                {room.children && room.children.length > 0 && (
                                    <>
                                        <p className="text-xs text-gray-500 mb-2">Age of child{room.children.length !== 1 ? 'ren' : ''} at time of check-out</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                            {room.children.map((age, childIndex) => (
                                                <div key={`child-${childIndex}`} className="relative flex items-center">
                                                    <input type="number" min="0" max="17" value={age ?? ''} onChange={(e) => handleChildAgeChange(index, childIndex, e.target.value)} className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-12 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:ring-offset-1 sm:text-sm appearance-none" placeholder="Age"/>
                                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs pointer-events-none">yrs</span>
                                                    <button type="button" onClick={() => removeChild(index, childIndex)} className="ml-1 text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-100 absolute -right-5 top-1/2 transform -translate-y-1/2 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1" aria-label="Remove Child">
                                                        <MinusIcon className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Add Room Button */} 
                {rooms.length < MAX_ROOMS && (
                    <button type="button" onClick={addRoom} className="mt-4 w-full inline-flex justify-center items-center px-3 py-2 border border-dashed border-indigo-300 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500">
                        <PlusIcon className="h-4 w-4 mr-1" />Add Another Room
                    </button>
                )}
            </div>
            {/* Footer for Room View */} 
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between gap-3">
                 <button type="button" onClick={switchToDateView} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Back</button>
                 <button type="button" onClick={handleSaveRoomsAndSwitchBack} className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Done</button>
            </div>
        </>
    );

    return (
        <div className={`fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm ${isOpen ? '' : 'hidden'}`}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
                {/* Header - Dynamic Title */} 
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {view === 'dates' ? 'Modify Hotel Search' : 'Arrange Rooms & Guests'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100" disabled={isLoading}>
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Render correct view */} 
                {view === 'dates' && renderDateView()} 
                {view === 'rooms' && renderRoomView()}
                
            </div>
        </div>
    );
};

export default CrmHotelSearchModifyModal;