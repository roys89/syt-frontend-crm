import { Dialog, Tab, Transition } from '@headlessui/react';
import {
    ExclamationTriangleIcon,
    PaperAirplaneIcon,
    ShoppingCartIcon,
    UserGroupIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify'; // For error/loading feedback
import bookingService from '../../../../services/bookingService'; // Import the service

// --- Helper Components ---
const SeatButton = ({ seat, onClick, isSelected, disabled, maxSeatsReached, passengerName }) => {
    const handleClick = () => {
        if (!seat.isBooked && !disabled) {
            onClick();
        }
    };

    let bgColor = 'bg-white hover:bg-gray-100';
    let textColor = 'text-gray-700';
    let borderColor = 'border-gray-300';
    let cursor = 'cursor-pointer';

    if (seat.isBooked || disabled) {
        bgColor = 'bg-gray-300';
        textColor = 'text-gray-500';
        borderColor = 'border-gray-400';
        cursor = 'cursor-not-allowed';
    } else if (isSelected) {
        bgColor = 'bg-[#093923] hover:bg-[#13804e]';
        textColor = 'text-white';
        borderColor = 'border-[#093923]';
    } else if (maxSeatsReached) {
        cursor = 'cursor-not-allowed';
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={seat.isBooked || disabled || (maxSeatsReached && !isSelected)}
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded border flex flex-col items-center justify-center text-xs font-medium transition-colors ${bgColor} ${textColor} ${borderColor} ${cursor} ${seat.type?.isAisle ? 'ml-4 md:ml-6' : ''}`}
        >
            <span>{seat.code}</span>
            {!seat.isBooked && seat.price > 0 && (
                <span className={`text-[0.6rem] ${isSelected ? 'text-green-100' : 'text-gray-500'}`}>₹{seat.price}</span>
            )}
            {seat.isBooked && (
                <XMarkIcon className="w-4 h-4 text-gray-600 absolute" />
            )}
            {isSelected && passengerName && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-[#093923] text-white text-[0.6rem] px-1 py-0.5 rounded whitespace-nowrap">
                    {passengerName}
                </div>
            )}
        </button>
    );
};

const OptionCard = ({ option, isSelected, onClick, disabled, descriptionKey = 'description', priceKey = 'price' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full p-3 border rounded-md text-left transition-colors flex justify-between items-center ${isSelected
            ? 'bg-[#e6f2ed] border-[#13804e]/50 ring-1 ring-[#13804e]'
            : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div>
            <p className={`font-medium text-sm ${isSelected ? 'text-[#093923]' : 'text-gray-800'}`}>
                {option[descriptionKey]}
            </p>
            {option.weight && <p className="text-xs text-gray-500">Weight: {option.weight}kg</p>} 
        </div>
        <p className={`font-semibold text-sm ${isSelected ? 'text-[#093923]' : 'text-gray-900'}`}>
            ₹{option[priceKey]?.toLocaleString('en-IN') || '0'}
        </p>
    </button>
);
// --- End Helper Components ---

const CrmSeatSelectionModal = ({ isOpen, onClose, flight, itineraryToken, inquiryToken, travelersDetails }) => {
    const [activeView, setActiveView] = useState("seats");
    const [activeFlightSegment, setActiveFlightSegment] = useState(0);
    const [activePassengerIndex, setActivePassengerIndex] = useState(0); // Track active passenger
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedBaggage, setSelectedBaggage] = useState([]);
    const [selectedMeal, setSelectedMeal] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const flightData = flight?.flightData; // Use optional chaining

    // --- Extract passengers from travelersDetails --- 
    const passengers = useMemo(() => {
        let passengerList = [];
        if (travelersDetails && Array.isArray(travelersDetails.rooms)) {
            travelersDetails.rooms.forEach((room, roomIndex) => {
                // Add adults
                if (room && Array.isArray(room.adults)) {
                    room.adults.forEach((adult, adultIndex) => {
                        passengerList.push({
                            id: `r${roomIndex}a${adultIndex}`,
                            type: 'Adult',
                            age: adult,
                            name: room.adultNames?.[adultIndex] || `Adult ${passengerList.length + 1}`,
                            roomIndex,
                            personIndex: adultIndex
                        });
                    });
                }
                // Add children
                if (room && Array.isArray(room.children)) {
                    room.children.forEach((childAge, childIndex) => {
                        passengerList.push({
                            id: `r${roomIndex}c${childIndex}`,
                            type: 'Child',
                            age: childAge,
                            name: room.childNames?.[childIndex] || `Child ${passengerList.length + 1}`,
                            roomIndex,
                            personIndex: childIndex
                        });
                    });
                }
            });
        }
        // If no passengers found, add a default one
        if (passengerList.length === 0) {
            passengerList.push({
                id: 'default',
                type: 'Adult',
                age: 30,
                name: 'Passenger 1',
                roomIndex: 0,
                personIndex: 0
            });
        }
        return passengerList;
    }, [travelersDetails]);
    // --- END Passenger Extraction ---

    // --- CORRECTED maxSeats Calculation --- 
    const maxSeats = useMemo(() => passengers.length, [passengers]);
    // --- END CORRECTED maxSeats Calculation ---

    // Recalculate selected seat count - function referenced but missing
    const recalculateSelectedSeatCount = () => {
        // This is a no-op function since the count is calculated via useMemo
        // We keep it to maintain the API called in the clear button
        console.log("Recalculating seat count");
    };

    // Initialize state when flightData changes
    useEffect(() => {
        if (flightData) {
            // Initialize Seats with enhanced structure to track passenger assignments
            const initialSeatMap = flightData.seatMap?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                rows: segment.rows.map(row => ({
                    seats: (row.seats || []).filter(seat => seat && seat.code !== null).map(seat => {
                        // Check if this seat is already selected in existing data and by which passenger
                        let isSelected = false;
                        let passengerId = null;
                        let passengerIndex = null;
                        let passengerName = null;
                        
                        if (flightData.selectedSeats) {
                            for (const selSeg of flightData.selectedSeats) {
                                if (selSeg.origin === segment.origin && selSeg.destination === segment.destination) {
                                    for (const selRow of selSeg.rows || []) {
                                        for (const selSeat of selRow.seats || []) {
                                            if (selSeat.code === seat.code) {
                                                isSelected = true;
                                                // Use saved passenger info if available, otherwise default to first passenger
                                                passengerId = selSeat.passengerId || passengers[0]?.id;
                                                passengerIndex = selSeat.passengerIndex !== undefined ? selSeat.passengerIndex : 0;
                                                passengerName = selSeat.passengerName || passengers[passengerIndex]?.name;
                                                break;
                                            }
                                        }
                                        if (isSelected) break;
                                    }
                                }
                                if (isSelected) break;
                            }
                        }

                        return {
                        ...seat,
                            isSelected,
                            passengerId,
                            passengerIndex,
                            passengerName
                        };
                    })
                }))
            })) || [];
            setSelectedSeats(initialSeatMap);

            // Initialize Baggage - per passenger
            const initialBaggage = flightData.baggageOptions?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                options: segment.options || [],
                // Initialize selection for each passenger
                passengerSelections: passengers.map(passenger => ({
                    passengerId: passenger.id,
                    selectedOption: null // Will be populated from existing selections if available
                }))
            })) || [];
            
            // Populate existing baggage selections if any
            if (flightData.selectedBaggage && flightData.selectedBaggage.length > 0) {
                flightData.selectedBaggage.forEach(selBag => {
                    const segmentIndex = initialBaggage.findIndex(
                        seg => seg.origin === selBag.origin && seg.destination === selBag.destination
                    );
                    if (segmentIndex >= 0 && selBag.options && selBag.options.length > 0) {
                        // Map each option to the correct passenger using passengerIndex
                        selBag.options.forEach(option => {
                            const passengerIdx = option.passengerIndex !== undefined 
                                ? option.passengerIndex 
                                : 0; // Default to first passenger if not specified
                            
                            if (passengerIdx < initialBaggage[segmentIndex].passengerSelections.length) {
                                initialBaggage[segmentIndex].passengerSelections[passengerIdx].selectedOption = option;
                            }
                        });
                    }
                });
            }
            setSelectedBaggage(initialBaggage);

            // Initialize Meals - per passenger
            const initialMeals = flightData.mealOptions?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                options: segment.options || [],
                // Initialize selection for each passenger
                passengerSelections: passengers.map(passenger => ({
                    passengerId: passenger.id,
                    selectedOption: null // Will be populated from existing selections if available
                }))
            })) || [];
            
            // Populate existing meal selections if any
            if (flightData.selectedMeal && flightData.selectedMeal.length > 0) {
                flightData.selectedMeal.forEach(selMeal => {
                    const segmentIndex = initialMeals.findIndex(
                        seg => seg.origin === selMeal.origin && seg.destination === selMeal.destination
                    );
                    if (segmentIndex >= 0 && selMeal.options && selMeal.options.length > 0) {
                        // Map each option to the correct passenger using passengerIndex
                        selMeal.options.forEach(option => {
                            const passengerIdx = option.passengerIndex !== undefined 
                                ? option.passengerIndex 
                                : 0; // Default to first passenger if not specified
                            
                            if (passengerIdx < initialMeals[segmentIndex].passengerSelections.length) {
                                initialMeals[segmentIndex].passengerSelections[passengerIdx].selectedOption = option;
                            }
                        });
                    }
                });
            }
            setSelectedMeal(initialMeals);

            setActiveFlightSegment(0); // Reset to first segment tab
            setActivePassengerIndex(0); // Reset to first passenger
            setError(''); // Clear previous errors
        } else {
            // Reset if no flight data
            setSelectedSeats([]);
            setSelectedBaggage([]);
            setSelectedMeal([]);
        }
    }, [flightData, passengers]); // Rerun when flightData or passengers changes

    // Calculate total additional cost for all passengers
    const additionalCost = useMemo(() => {
        let total = 0;
        // Sum all seat prices
        selectedSeats.forEach(segment => {
            segment.rows.forEach(row => {
                row.seats.forEach(seat => {
                    if (seat.isSelected && typeof seat.price === 'number') {
                        total += seat.price;
                    }
                });
            });
        });
        
        // Sum all baggage prices for all passengers
        selectedBaggage.forEach(segment => {
            segment.passengerSelections.forEach(passengerSelection => {
                if (passengerSelection.selectedOption && typeof passengerSelection.selectedOption.price === 'number') {
                    total += passengerSelection.selectedOption.price;
            }
            });
        });
        
        // Sum all meal prices for all passengers
        selectedMeal.forEach(segment => {
            segment.passengerSelections.forEach(passengerSelection => {
                if (passengerSelection.selectedOption && typeof passengerSelection.selectedOption.price === 'number') {
                    total += passengerSelection.selectedOption.price;
            }
            });
        });
        
        return total;
    }, [selectedSeats, selectedBaggage, selectedMeal]);

    // --- Updated Handlers ---
    const handleSeatClick = (segmentIndex, rowIndex, seatIndex) => {
        setError(""); // Clear error on interaction
        setSelectedSeats(prev => {
            const newSeats = [...prev];
            const segment = newSeats[segmentIndex];
            const seatToToggle = segment.rows[rowIndex].seats[seatIndex];

            // If the seat is already selected
            if (seatToToggle.isSelected) {
                // If the seat is assigned to current passenger, deselect it
                if (seatToToggle.passengerIndex === activePassengerIndex) {
                    // Create updated segment data - deselect the seat
                    newSeats[segmentIndex] = {
                        ...segment,
                        rows: segment.rows.map((row, rIdx) => {
                            if (rIdx !== rowIndex) return row;
                            return {
                                ...row,
                                seats: row.seats.map((seat, sIdx) => {
                                    if (sIdx !== seatIndex) return seat;
                                    return { 
                                        ...seat, 
                                        isSelected: false,
                                        passengerId: null,
                                        passengerIndex: null
                                    };
                                }),
                            };
                        }),
                    };
                } else {
                    // Seat belongs to another passenger, show error
                    setError(`This seat is already assigned to ${passengers[seatToToggle.passengerIndex]?.name}`);
                    return prev; // No change
                }
            } else {
                // Seat is not selected, check if current passenger already has a seat
                const hasExistingSeat = segment.rows.some(row => 
                    row.seats.some(seat => 
                        seat.isSelected && seat.passengerIndex === activePassengerIndex
                    )
                );
                
                if (hasExistingSeat) {
                    // Replace the existing seat for this passenger
                    newSeats[segmentIndex] = {
                        ...segment,
                        rows: segment.rows.map(row => ({
                            ...row,
                            seats: row.seats.map(seat => {
                                // Deselect the old seat for this passenger
                                if (seat.isSelected && seat.passengerIndex === activePassengerIndex) {
                                    return { ...seat, isSelected: false, passengerId: null, passengerIndex: null };
                                }
                                // Select the new seat if it's the one we clicked
                                if (seat === seatToToggle) {
                                    return { 
                                        ...seat, 
                                        isSelected: true, 
                                        passengerId: passengers[activePassengerIndex]?.id, 
                                        passengerIndex: activePassengerIndex 
                                    };
                                }
                                return seat;
                            })
                        }))
                    };
                } else {
                    // Calculate current selections for this segment (across all passengers)
            const currentSelectedCount = segment.rows.reduce((count, row) =>
                count + row.seats.filter(s => s.isSelected).length, 0);

                    if (currentSelectedCount >= maxSeats) {
                setError(`You can only select ${maxSeats} seat${maxSeats > 1 ? 's' : ''} per flight segment.`);
                return prev; // Prevent exceeding max seats
            }

                    // Create updated segment data - select the new seat for this passenger
            newSeats[segmentIndex] = {
                ...segment,
                rows: segment.rows.map((row, rIdx) => {
                    if (rIdx !== rowIndex) return row;
                    return {
                        ...row,
                        seats: row.seats.map((seat, sIdx) => {
                            if (sIdx !== seatIndex) return seat;
                                    return { 
                                        ...seat, 
                                        isSelected: true,
                                        passengerId: passengers[activePassengerIndex]?.id,
                                        passengerIndex: activePassengerIndex
                                    };
                        }),
                    };
                }),
            };
                }
            }
            
            return newSeats;
        });
    };

    // Updated handler for baggage selection per passenger
    const handleBaggageSelect = (segmentIndex, option) => {
        setSelectedBaggage(prev => {
            const newBaggage = [...prev];
            const currentPassengerSelection = newBaggage[segmentIndex].passengerSelections[activePassengerIndex];
            const currentOption = currentPassengerSelection.selectedOption;
            
            // Create updated passenger selections
            const updatedPassengerSelections = [...newBaggage[segmentIndex].passengerSelections];
            updatedPassengerSelections[activePassengerIndex] = {
                ...currentPassengerSelection,
                // Toggle: if same option clicked, deselect; otherwise select new option
                selectedOption: currentOption?.code === option.code ? null : option,
            };
            
            newBaggage[segmentIndex] = {
                ...newBaggage[segmentIndex],
                passengerSelections: updatedPassengerSelections
            };
            
            return newBaggage;
        });
    };

    // Updated handler for meal selection per passenger
    const handleMealSelect = (segmentIndex, option) => {
        setSelectedMeal(prev => {
            const newMeal = [...prev];
            const currentPassengerSelection = newMeal[segmentIndex].passengerSelections[activePassengerIndex];
            const currentOption = currentPassengerSelection.selectedOption;
            
            // Create updated passenger selections
            const updatedPassengerSelections = [...newMeal[segmentIndex].passengerSelections];
            updatedPassengerSelections[activePassengerIndex] = {
                ...currentPassengerSelection,
                // Toggle: if same option clicked, deselect; otherwise select new option
                selectedOption: currentOption?.code === option.code ? null : option,
            };
            
            newMeal[segmentIndex] = {
                ...newMeal[segmentIndex],
                passengerSelections: updatedPassengerSelections
            };
            
            return newMeal;
        });
    };

    const handleSubmit = async () => {
        if (!itineraryToken || !inquiryToken) {
            setError("Missing necessary tokens to save selections.");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            // Transform selections into the format expected by the API
            const transformedSelections = {
                flightCode: flightData.flightCode,
                seatMap: selectedSeats
                    .filter(segment => segment.rows.some(row => row.seats.some(seat => seat.isSelected)))
                    .map(segment => ({
                        origin: segment.origin,
                        destination: segment.destination,
                        resultIdentifier: segment.resultIdentifier,
                        rows: segment.rows.map(row => ({
                            seats: row.seats.filter(seat => seat.isSelected).map(seat => ({
                                code: seat.code,
                                seatNo: seat.seatNo,
                                price: seat.price,
                                type: seat.type,
                                priceBracket: seat.priceBracket,
                                // Include passenger information for proper mapping
                                passengerId: seat.passengerId,
                                passengerIndex: seat.passengerIndex,
                                passengerName: passengers[seat.passengerIndex]?.name || `Traveler ${seat.passengerIndex + 1}`,
                                passengerType: passengers[seat.passengerIndex]?.type || 'Adult'
                            }))
                        })).filter(row => row.seats.length > 0)
                    })),
                // Convert baggage selections for API format
                baggageOptions: selectedBaggage
                    .filter(segment => segment.passengerSelections.some(ps => ps.selectedOption))
                    .map(segment => {
                        // Collect all selected options across passengers with passenger information
                        const allOptions = segment.passengerSelections
                            .filter(ps => ps.selectedOption)
                            .map((ps, idx) => ({
                                ...ps.selectedOption,
                                passengerId: ps.passengerId,
                                passengerIndex: idx,
                                passengerName: passengers[idx]?.name || `Traveler ${idx + 1}`,
                                passengerType: passengers[idx]?.type || 'Adult'
                            }));
                            
                        return {
                        origin: segment.origin,
                        destination: segment.destination,
                        resultIdentifier: segment.resultIdentifier,
                            options: allOptions
                        };
                    }),
                // Convert meal selections for API format
                mealOptions: selectedMeal
                    .filter(segment => segment.passengerSelections.some(ps => ps.selectedOption))
                    .map(segment => {
                        // Collect all selected options across passengers with passenger information
                        const allOptions = segment.passengerSelections
                            .filter(ps => ps.selectedOption)
                            .map((ps, idx) => ({
                                ...ps.selectedOption,
                                passengerId: ps.passengerId,
                                passengerIndex: idx,
                                passengerName: passengers[idx]?.name || `Traveler ${idx + 1}`,
                                passengerType: passengers[idx]?.type || 'Adult'
                            }));
                            
                        return {
                        origin: segment.origin,
                        destination: segment.destination,
                        resultIdentifier: segment.resultIdentifier,
                            options: allOptions
                        };
                    })
            };

            console.log("Submitting selections:", transformedSelections);

            const result = await bookingService.updateFlightSelections({
                itineraryToken,
                inquiryToken,
                selections: transformedSelections
            });

            console.log("Update successful:", result);
            toast.success("Flight selections updated successfully!");
            onClose(true); // Close modal on success with update flag

        } catch (err) {
            console.error("Error updating selections:", err);
            setError(err.message || 'An unexpected error occurred. Please try again.');
            toast.error(err.message || 'Failed to update selections.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state if needed, although useEffect handles re-init on open
        onClose();
    };

    // Check if data is ready
    if (!flightData || !selectedSeats.length) {
        // Show a loading state or null while initializing
        // Or return null if isOpen is false, managed by Transition
        return null; 
    }

    const currentSegmentSeats = selectedSeats[activeFlightSegment];
    const currentSegmentBaggage = selectedBaggage[activeFlightSegment];
    const currentSegmentMeal = selectedMeal[activeFlightSegment];

    // Calculate selected count for the current segment for UI feedback
    const currentSegmentSelectedSeatCount = currentSegmentSeats?.rows.reduce(
        (count, row) => count + row.seats.filter(s => s.isSelected).length, 0
    ) || 0;
    const maxSeatsReachedForCurrentSegment = currentSegmentSelectedSeatCount >= maxSeats;

    // Current passenger selections for active segment
    const currentPassengerBaggageSelection = currentSegmentBaggage?.passengerSelections?.[activePassengerIndex]?.selectedOption;
    const currentPassengerMealSelection = currentSegmentMeal?.passengerSelections?.[activePassengerIndex]?.selectedOption;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                {/* Modal Content */}
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                                    <div>
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                            Select Seats & Extras
                                        </Dialog.Title>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {flightData.airline} - Flight {flightData.flightCode}
                                            <span className='ml-4'>({maxSeats} Traveler{maxSeats > 1 ? 's' : ''})</span>
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        aria-label="Close modal"
                                        disabled={isLoading}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-400">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{error}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Passenger Tabs - New Addition */}
                                {passengers.length > 1 && (
                                    <div className="px-4 pt-3 pb-2 bg-white sticky top-0 z-10 border-b border-gray-200 flex flex-wrap justify-between items-start">
                                        <div className="w-1/2">
                                            <div className="flex overflow-x-auto no-scrollbar space-x-2">
                                                {passengers.map((passenger, index) => (
                                                    <button
                                                        key={passenger.id}
                                                        onClick={() => setActivePassengerIndex(index)}
                                                        className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap shadow-sm transition-all focus:outline-none ${
                                                            activePassengerIndex === index
                                                                ? 'bg-[#093923] text-white border border-[#13804e]'
                                                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                    >
                                                        {passenger.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Selecting for: <span className="font-medium text-gray-700">{passengers[activePassengerIndex]?.name}</span>
                                            </p>
                                        </div>
                                        
                                        {/* Current seat assignments in top right */}
                                        {activeView === 'seats' && selectedSeats?.length > 0 && (
                                            <div className="flex-1 flex flex-wrap gap-1 justify-end items-start pl-2 max-w-[50%]">
                                                <h4 className="w-full text-xs font-medium text-gray-700 text-right mb-1">Current seat assignments:</h4>
                                                {passengers.map((passenger, idx) => {
                                                    // Find seat assigned to this passenger in current segment
                                                    let assignedSeat = null;
                                                    selectedSeats[activeFlightSegment]?.rows?.forEach(row => {
                                                        row.seats.forEach(seat => {
                                                            if (seat.isSelected && seat.passengerIndex === idx) {
                                                                assignedSeat = seat;
                                                            }
                                                        });
                                                    });
                                                    
                                                    // Only show if they have an assigned seat
                                                    if (!assignedSeat) return null;
                                                    
                                                    return (
                                                        <div 
                                                            key={passenger.id}
                                                            className={`text-xs rounded-lg px-2 py-1 border border-indigo-200 ${
                                                                idx === activePassengerIndex ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-50 text-indigo-700'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{passenger.name.split(' ')[0]}</span>
                                                            <span className="ml-1 font-bold">
                                                                • {assignedSeat.code}
                                                                {assignedSeat.price > 0 && <span className="text-[0.6rem] ml-0.5">₹{assignedSeat.price}</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Current baggage selections in top right */}
                                        {activeView === 'baggage' && selectedBaggage?.length > 0 && (
                                            <div className="flex-1 flex flex-wrap gap-1 justify-end items-start pl-2 max-w-[50%]">
                                                <h4 className="w-full text-xs font-medium text-gray-700 text-right mb-1">Current baggage selections:</h4>
                                                {passengers.map((passenger, idx) => {
                                                    // Find baggage selected by this passenger
                                                    const selection = selectedBaggage[activeFlightSegment]?.passengerSelections[idx]?.selectedOption;
                                                    
                                                    // Only show if they have a selection
                                                    if (!selection) return null;
                                                    
                                                    return (
                                                        <div 
                                                            key={passenger.id}
                                                            className={`text-xs rounded-lg px-2 py-1 border border-indigo-200 ${
                                                                idx === activePassengerIndex ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-50 text-indigo-700'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{passenger.name.split(' ')[0]}</span>
                                                            <span className="ml-1">
                                                                • {selection.description.split(' ')[0]}
                                                                {selection.price > 0 && <span className="text-[0.6rem] ml-0.5">₹{selection.price}</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        
                                        {/* Current meal selections in top right */}
                                        {activeView === 'meal' && selectedMeal?.length > 0 && (
                                            <div className="flex-1 flex flex-wrap gap-1 justify-end items-start pl-2 max-w-[50%]">
                                                <h4 className="w-full text-xs font-medium text-gray-700 text-right mb-1">Current meal selections:</h4>
                                                {passengers.map((passenger, idx) => {
                                                    // Find meal selected by this passenger
                                                    const selection = selectedMeal[activeFlightSegment]?.passengerSelections[idx]?.selectedOption;
                                                    
                                                    // Only show if they have a selection
                                                    if (!selection) return null;
                                                    
                                                    return (
                                                        <div 
                                                            key={passenger.id}
                                                            className={`text-xs rounded-lg px-2 py-1 border border-indigo-200 ${
                                                                idx === activePassengerIndex ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'bg-indigo-50 text-indigo-700'
                                                            }`}
                                                        >
                                                            <span className="font-medium">{passenger.name.split(' ')[0]}</span>
                                                            <span className="ml-1">
                                                                • {selection.description.split(' ')[0]}
                                                                {selection.price > 0 && <span className="text-[0.6rem] ml-0.5">₹{selection.price}</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Main Tabs */}
                                <Tab.Group 
                                    selectedIndex={['seats', 'baggage', 'meal'].indexOf(activeView)} 
                                    onChange={(index) => setActiveView(['seats', 'baggage', 'meal'][index])} 
                                    className="flex-grow flex-col overflow-y-auto"
                                >
                                    <Tab.List className="flex border-b border-gray-200 bg-white flex-shrink-0 sticky top-0 z-10">
                                        <Tab as={Fragment}>
                                            {({ selected }) => (
                                                <button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-[#093923] text-[#093923]' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <PaperAirplaneIcon className='w-5 h-5' /> Seats </button>)
                                            }
                                        </Tab>
                                        {selectedBaggage.length > 0 && (
                                            <Tab as={Fragment}>
                                                {({ selected }) => (<button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-[#093923] text-[#093923]' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <ShoppingCartIcon className='w-5 h-5' /> Baggage </button>)}
                                            </Tab>
                                        )}
                                        {selectedMeal.length > 0 && (
                                            <Tab as={Fragment}>
                                                {({ selected }) => (<button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-[#093923] text-[#093923]' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <UserGroupIcon className='w-5 h-5' /> Meals </button>)}
                                            </Tab>
                                        )}
                                    </Tab.List>

                                    {/* Tab Panels (Scrollable Content within Tab.Group) */}
                                    <div className="flex-grow p-4 sm:p-6 bg-gray-50/50">
                                        {/* Segment Tabs (Common for all panels) */}
                                        {flightData.segments && flightData.segments.length > 1 && (
                                            <Tab.Group selectedIndex={activeFlightSegment} onChange={setActiveFlightSegment}>
                                                <Tab.List className="flex space-x-1 rounded-xl bg-[#e6f2ed] p-1 mb-4">
                                                    {flightData.segments.map((segment, index) => (
                                                        <Tab key={`${segment.origin}-${segment.destination}`} className={({ selected }) =>`w-full rounded-lg py-2 text-sm font-medium leading-5 text-[#093923] ring-white ring-opacity-60 ring-offset-2 ring-offset-[#13804e]/50 focus:outline-none focus:ring-2 ${selected ? 'bg-white shadow' : 'text-[#13804e] hover:bg-white/[0.3] hover:text-[#093923]'}`}>
                                                            {segment.origin} → {segment.destination}
                                                        </Tab>
                                                    ))}
                                                </Tab.List>
                                            </Tab.Group>
                                        )}

                                        {/* Panel Content */}
                                        <Tab.Panels>
                                            {/* Seats Panel */}
                                            <Tab.Panel className="focus:outline-none">
                                                {currentSegmentSeats ? (
                                                    <div className="space-y-4">
                                                        {/* Seat Grid */}
                                                        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                                        {currentSegmentSeats.rows.map((row, rowIndex) => (
                                                                <div key={rowIndex} className="flex justify-center items-center space-x-1 md:space-x-1.5 mb-1.5">
                                                                {row.seats.map((seat, seatIndex) => (
                                                                    <SeatButton
                                                                        key={seat.code}
                                                                        seat={seat}
                                                                        onClick={() => handleSeatClick(activeFlightSegment, rowIndex, seatIndex)}
                                                                        isSelected={seat.isSelected}
                                                                        disabled={isLoading}
                                                                        maxSeatsReached={maxSeatsReachedForCurrentSegment}
                                                                            passengerName={seat.isSelected ? 
                                                                                (seat.passengerName || passengers[seat.passengerIndex]?.name || `Traveler ${seat.passengerIndex + 1}`) 
                                                                                : null}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ))}
                                                            
                                                         {/* Legend */}
                                                            <div className="flex justify-center gap-4 text-xs pt-4 mt-2 text-gray-600 border-t border-gray-100">
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 bg-white"></span>Available</span>
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-indigo-600 bg-indigo-600"></span>Selected</span>
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-400 bg-gray-300"></span>Booked</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : <p className="text-center text-gray-500">Seat map not available for this segment.</p>}
                                            </Tab.Panel>

                                            {/* Baggage Panel */}
                                            <Tab.Panel className="focus:outline-none">
                                                {currentSegmentBaggage && currentSegmentBaggage.options.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-gray-600">Select additional checked baggage for {passengers[activePassengerIndex]?.name} on this segment.</p>
                                                        {currentSegmentBaggage.options.map(option => (
                                                            <OptionCard
                                                                key={option.code}
                                                                option={option}
                                                                isSelected={currentPassengerBaggageSelection?.code === option.code}
                                                                onClick={() => handleBaggageSelect(activeFlightSegment, option)}
                                                                disabled={isLoading}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : <p className="text-center text-gray-500">No additional baggage options available for this segment.</p>}
                                            </Tab.Panel>

                                            {/* Meal Panel */}
                                            <Tab.Panel className="focus:outline-none">
                                                {currentSegmentMeal && currentSegmentMeal.options.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-gray-600">Select a meal preference for {passengers[activePassengerIndex]?.name} on this segment.</p>
                                                        {currentSegmentMeal.options.map(option => (
                                                            <OptionCard
                                                                key={option.code}
                                                                option={option}
                                                                isSelected={currentPassengerMealSelection?.code === option.code}
                                                                onClick={() => handleMealSelect(activeFlightSegment, option)}
                                                                disabled={isLoading}
                                                            />
                                                        ))}
                                                    </div>
                                                ) : <p className="text-center text-gray-500">No meal options available for this segment.</p>}
                                            </Tab.Panel>
                                        </Tab.Panels>
                                    </div>
                                </Tab.Group>

                                {/* Footer with Summary and Actions */}
                                <div className="p-4 sm:p-5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Additional Cost:</p>
                                            <p className="text-lg font-semibold text-[#093923]">₹{additionalCost.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200"
                                                onClick={handleClose}
                                                disabled={isLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={`inline-flex justify-center items-center rounded-lg border border-transparent bg-[#093923] px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[#13804e] focus:outline-none focus:ring-2 focus:ring-[#13804e] focus:ring-offset-2 transition-all duration-200 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={handleSubmit}
                                                disabled={isLoading}
                                            >
                                                {isLoading ? 'Loading...' : 'Confirm Selection'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CrmSeatSelectionModal;
