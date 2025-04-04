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
import bookingService from '../../../services/bookingService'; // Import the service

// --- Helper Components ---
const SeatButton = ({ seat, onClick, isSelected, disabled, maxSeatsReached }) => {
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
        bgColor = 'bg-indigo-600 hover:bg-indigo-700';
        textColor = 'text-white';
        borderColor = 'border-indigo-700';
    } else if (maxSeatsReached) {
        // Optional: Style differently if max seats reached but this seat is not selected
        // bgColor = 'bg-yellow-100';
        // textColor = 'text-yellow-700';
        cursor = 'cursor-not-allowed'; // Prevent selection
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={seat.isBooked || disabled || (maxSeatsReached && !isSelected)} // Disable if booked, loading, or max reached & not selected
            className={`w-10 h-10 md:w-12 md:h-12 rounded border flex flex-col items-center justify-center text-xs font-medium transition-colors ${bgColor} ${textColor} ${borderColor} ${cursor} ${seat.type?.isAisle ? 'ml-4 md:ml-6' : ''}`}
        >
            <span>{seat.code}</span>
            {!seat.isBooked && seat.price > 0 && (
                <span className={`text-[0.6rem] ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>₹{seat.price}</span>
            )}
            {seat.isBooked && (
                <XMarkIcon className="w-4 h-4 text-gray-600 absolute" />
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
            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400'
            : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div>
            <p className={`font-medium text-sm ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                {option[descriptionKey]}
            </p>
            {option.weight && <p className="text-xs text-gray-500">Weight: {option.weight}kg</p>} 
        </div>
        <p className={`font-semibold text-sm ${isSelected ? 'text-indigo-800' : 'text-gray-900'}`}>
            ₹{option[priceKey]?.toLocaleString('en-IN') || '0'}
        </p>
    </button>
);
// --- End Helper Components ---

const CrmSeatSelectionModal = ({ isOpen, onClose, flight, itineraryToken, inquiryToken, travelersDetails }) => {
    const [activeView, setActiveView] = useState("seats");
    const [activeFlightSegment, setActiveFlightSegment] = useState(0);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [selectedBaggage, setSelectedBaggage] = useState([]);
    const [selectedMeal, setSelectedMeal] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const flightData = flight?.flightData; // Use optional chaining

    // --- CORRECTED maxSeats Calculation --- 
    const maxSeats = useMemo(() => {
        let count = 0;
        if (travelersDetails && Array.isArray(travelersDetails.rooms)) {
            travelersDetails.rooms.forEach(room => {
                if (room && Array.isArray(room.adults)) {
                    count += room.adults.length;
                }
                if (room && Array.isArray(room.children)) {
                    count += room.children.length;
                }
                // Add infants here if they need seats 
                // if (room && Array.isArray(room.infants)) { 
                //     count += room.infants.length; 
                // } 
            });
        }
        // Return calculated count or default to 1 if calculation yields 0 or less
        return count > 0 ? count : 1; 
    }, [travelersDetails]); // Recalculate only if travelersDetails changes
    // --- END CORRECTED maxSeats Calculation ---

    // Initialize state when flightData changes
    useEffect(() => {
        if (flightData) {
            // Initialize Seats
            const initialSeatMap = flightData.seatMap?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                rows: segment.rows.map(row => ({
                    seats: (row.seats || []).filter(seat => seat && seat.code !== null).map(seat => ({
                        ...seat,
                        isSelected: flightData.selectedSeats?.some(selSeg =>
                            selSeg.origin === segment.origin && selSeg.destination === segment.destination &&
                            selSeg.rows?.some(selRow => selRow.seats?.some(selSeat => selSeat.code === seat.code))
                        ) || false
                    }))
                }))
            })) || [];
            setSelectedSeats(initialSeatMap);

            // Initialize Baggage
            const initialBaggage = flightData.baggageOptions?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                options: segment.options || [],
                selectedOption: flightData.selectedBaggage?.find(selSeg =>
                    selSeg.origin === segment.origin && selSeg.destination === segment.destination
                )?.options?.[0] || null
            })) || [];
            setSelectedBaggage(initialBaggage);

            // Initialize Meals
            const initialMeals = flightData.mealOptions?.map(segment => ({
                origin: segment.origin,
                destination: segment.destination,
                resultIdentifier: segment.resultIdentifier,
                options: segment.options || [],
                selectedOption: flightData.selectedMeal?.find(selSeg =>
                    selSeg.origin === segment.origin && selSeg.destination === segment.destination
                )?.options?.[0] || null
            })) || [];
            setSelectedMeal(initialMeals);

            setActiveFlightSegment(0); // Reset to first segment tab
            setError(''); // Clear previous errors
        } else {
            // Reset if no flight data
            setSelectedSeats([]);
            setSelectedBaggage([]);
            setSelectedMeal([]);
        }
    }, [flightData]); // Rerun only when flightData changes

    // Calculate total additional cost
    const additionalCost = useMemo(() => {
        let total = 0;
        selectedSeats.forEach(segment => {
            segment.rows.forEach(row => {
                row.seats.forEach(seat => {
                    if (seat.isSelected && typeof seat.price === 'number') {
                        total += seat.price;
                    }
                });
            });
        });
        selectedBaggage.forEach(segment => {
            if (segment.selectedOption && typeof segment.selectedOption.price === 'number') {
                total += segment.selectedOption.price;
            }
        });
        selectedMeal.forEach(segment => {
            if (segment.selectedOption && typeof segment.selectedOption.price === 'number') {
                total += segment.selectedOption.price;
            }
        });
        return total;
    }, [selectedSeats, selectedBaggage, selectedMeal]);

    // --- Handlers ---
    const handleSeatClick = (segmentIndex, rowIndex, seatIndex) => {
        setError(""); // Clear error on interaction
        setSelectedSeats(prev => {
            const newSeats = [...prev];
            const segment = newSeats[segmentIndex];
            const seatToToggle = segment.rows[rowIndex].seats[seatIndex];

            // Calculate current selections for this segment
            const currentSelectedCount = segment.rows.reduce((count, row) =>
                count + row.seats.filter(s => s.isSelected).length, 0);

            if (!seatToToggle.isSelected && currentSelectedCount >= maxSeats) {
                setError(`You can only select ${maxSeats} seat${maxSeats > 1 ? 's' : ''} per flight segment.`);
                return prev; // Prevent exceeding max seats
            }

            // Create updated segment data
            newSeats[segmentIndex] = {
                ...segment,
                rows: segment.rows.map((row, rIdx) => {
                    if (rIdx !== rowIndex) return row;
                    return {
                        ...row,
                        seats: row.seats.map((seat, sIdx) => {
                            if (sIdx !== seatIndex) return seat;
                            return { ...seat, isSelected: !seat.isSelected }; // Toggle selection
                        }),
                    };
                }),
            };
            return newSeats;
        });
    };

    const handleBaggageSelect = (segmentIndex, option) => {
        setSelectedBaggage(prev => {
            const newBaggage = [...prev];
            const currentSelection = newBaggage[segmentIndex].selectedOption;
            newBaggage[segmentIndex] = {
                ...newBaggage[segmentIndex],
                // Toggle: if same option clicked, deselect; otherwise select new option
                selectedOption: currentSelection?.code === option.code ? null : option,
            };
            return newBaggage;
        });
    };

    const handleMealSelect = (segmentIndex, option) => {
        setSelectedMeal(prev => {
            const newMeal = [...prev];
            const currentSelection = newMeal[segmentIndex].selectedOption;
            newMeal[segmentIndex] = {
                ...newMeal[segmentIndex],
                selectedOption: currentSelection?.code === option.code ? null : option,
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
                                priceBracket: seat.priceBracket
                            }))
                        })).filter(row => row.seats.length > 0)
                    })),
                baggageOptions: selectedBaggage
                    .filter(segment => segment.selectedOption)
                    .map(segment => ({
                        origin: segment.origin,
                        destination: segment.destination,
                        resultIdentifier: segment.resultIdentifier,
                        options: [segment.selectedOption]
                    })),
                mealOptions: selectedMeal
                    .filter(segment => segment.selectedOption)
                    .map(segment => ({
                        origin: segment.origin,
                        destination: segment.destination,
                        resultIdentifier: segment.resultIdentifier,
                        options: [segment.selectedOption]
                    }))
            };

            console.log("Submitting selections:", transformedSelections);

            const result = await bookingService.updateFlightSelections({
                itineraryToken,
                inquiryToken,
                selections: transformedSelections
            });

            console.log("Update successful:", result);
            toast.success("Flight selections updated successfully!");
            onClose(); // Close modal on success

            // TODO: Potentially update the itinerary state in the parent component
            // You might need to pass a callback function like `onSelectionUpdate` from the parent
            // and call it here with the `result` data.

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

                                {/* Main Tabs */}
                                <Tab.Group 
                                    selectedIndex={['seats', 'baggage', 'meal'].indexOf(activeView)} 
                                    onChange={(index) => setActiveView(['seats', 'baggage', 'meal'][index])} 
                                    className="flex-grow flex-col overflow-y-auto"
                                >
                                    <Tab.List className="flex border-b border-gray-200 bg-white flex-shrink-0 sticky top-0 z-10">
                                        <Tab as={Fragment}>
                                            {({ selected }) => (
                                                <button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <PaperAirplaneIcon className='w-5 h-5' /> Seats </button>)
                                            }
                                        </Tab>
                                        {selectedBaggage.length > 0 && (
                                            <Tab as={Fragment}>
                                                {({ selected }) => (<button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <ShoppingCartIcon className='w-5 h-5' /> Baggage </button>)}
                                            </Tab>
                                        )}
                                        {selectedMeal.length > 0 && (
                                            <Tab as={Fragment}>
                                                {({ selected }) => (<button className={`flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}> <UserGroupIcon className='w-5 h-5' /> Meals </button>)}
                                            </Tab>
                                        )}
                                    </Tab.List>

                                    {/* Tab Panels (Scrollable Content within Tab.Group) */}
                                    <div className="flex-grow p-4 sm:p-6 bg-gray-50/50">
                                        {/* Segment Tabs (Common for all panels) */}
                                        {flightData.segments && flightData.segments.length > 1 && (
                                            <Tab.Group selectedIndex={activeFlightSegment} onChange={setActiveFlightSegment}>
                                                <Tab.List className="flex space-x-1 rounded-xl bg-indigo-900/20 p-1 mb-4">
                                                    {flightData.segments.map((segment, index) => (
                                                        <Tab key={`${segment.origin}-${segment.destination}`} className={({ selected }) =>`w-full rounded-lg py-2 text-sm font-medium leading-5 text-indigo-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2 ${selected ? 'bg-white shadow' : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'}`}>
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
                                                        <p className="text-sm text-gray-600 text-center">Select up to {maxSeats} seat{maxSeats > 1 ? 's' : ''}. Selected: {currentSegmentSelectedSeatCount}/{maxSeats}</p>
                                                        {currentSegmentSeats.rows.map((row, rowIndex) => (
                                                            <div key={rowIndex} className="flex justify-center items-center space-x-1 md:space-x-1.5">
                                                                {row.seats.map((seat, seatIndex) => (
                                                                    <SeatButton
                                                                        key={seat.code}
                                                                        seat={seat}
                                                                        onClick={() => handleSeatClick(activeFlightSegment, rowIndex, seatIndex)}
                                                                        isSelected={seat.isSelected}
                                                                        disabled={isLoading}
                                                                        maxSeatsReached={maxSeatsReachedForCurrentSegment}
                                                                    />
                                                                ))}
                                                            </div>
                                                        ))}
                                                         {/* Legend */}
                                                         <div className="flex justify-center gap-4 text-xs pt-4 text-gray-600">
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 bg-white"></span>Available</span>
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-indigo-600 bg-indigo-600"></span>Selected</span>
                                                            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-400 bg-gray-300"></span>Booked</span>
                                                        </div>
                                                    </div>
                                                ) : <p className="text-center text-gray-500">Seat map not available for this segment.</p>}
                                            </Tab.Panel>

                                            {/* Baggage Panel */}
                                            <Tab.Panel className="focus:outline-none">
                                                {currentSegmentBaggage && currentSegmentBaggage.options.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-gray-600">Select additional checked baggage for this segment.</p>
                                                        {currentSegmentBaggage.options.map(option => (
                                                            <OptionCard
                                                                key={option.code}
                                                                option={option}
                                                                isSelected={currentSegmentBaggage.selectedOption?.code === option.code}
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
                                                        <p className="text-sm text-gray-600">Select a meal preference for this segment.</p>
                                                        {currentSegmentMeal.options.map(option => (
                                                            <OptionCard
                                                                key={option.code}
                                                                option={option}
                                                                isSelected={currentSegmentMeal.selectedOption?.code === option.code}
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
                                            <p className="text-lg font-semibold text-indigo-600">₹{additionalCost.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                onClick={handleClose}
                                                disabled={isLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={`inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
