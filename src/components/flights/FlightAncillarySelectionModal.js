import { Dialog, Tab, Transition } from '@headlessui/react';
import {
    ArrowRightIcon // Import ArrowRight for direction tabs
    ,





























    ExclamationTriangleIcon,
    PaperAirplaneIcon,
    ShoppingCartIcon,
    UserGroupIcon, // Assuming we might use this for meals or general travelers
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { Fragment, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

// --- Reusable Helper Components (from CrmSeatSelectionModal) ---

// SeatButton Component (slightly adapted for ssr data if needed)
const SeatButton = ({ seat, onClick, isSelected, isSelectedByOther, disabled }) => {
    const handleClick = () => {
        if (!seat.isBooked && !disabled && !isSelectedByOther) {
            onClick();
        }
    };

    // Style based on ssr data: seat.isBooked, seat.amt (price)
    let bgColor = 'bg-white hover:bg-gray-100';
    let textColor = 'text-gray-700';
    let borderColor = 'border-gray-300';
    let cursor = 'cursor-pointer';

    if (seat.isBooked || disabled || isSelectedByOther) {
        bgColor = 'bg-gray-300';
        textColor = 'text-gray-500';
        borderColor = 'border-gray-400';
        cursor = 'cursor-not-allowed';
    } else if (isSelected) {
        bgColor = 'bg-indigo-600 hover:bg-indigo-700';
        textColor = 'text-white';
        borderColor = 'border-indigo-700';
    }

    // Use seat.isAisle from ssr data
    const isAisle = seat.isAisle; // Assuming ssr provides this boolean

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={seat.isBooked || disabled || isSelectedByOther}
            // Use seat.code, seat.amt from ssr data
            className={`w-10 h-10 md:w-12 md:h-12 rounded border flex flex-col items-center justify-center text-xs font-medium transition-colors ${bgColor} ${textColor} ${borderColor} ${cursor} ${isAisle ? 'ml-4 md:ml-6' : ''}`}
        >
            <span>{seat.code}</span>
            {!seat.isBooked && seat.amt > 0 && ( // Use seat.amt
                <span className={`text-[0.6rem] ${isSelected ? 'text-indigo-100' : 'text-gray-500'}`}>₹{seat.amt}</span>
            )}
        </button>
    );
};


// OptionCard Component (Generic for Baggage/Meals)
const OptionCard = ({ option, isSelected, onClick, disabled, descriptionKey = 'dsc', priceKey = 'amt', codeKey = 'code' }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full p-4 border rounded-lg text-left transition-colors flex justify-between items-center ${isSelected
            ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-400'
            : 'bg-white hover:bg-gray-50 border-gray-200'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
    >
        <div>
            <p className={`font-medium ${isSelected ? 'text-indigo-800' : 'text-gray-800'}`}>
                {option[descriptionKey]} {/* Use 'dsc' from ssr */}
            </p>
            {/* Add other details if available, e.g., weight for baggage */}
            {/* {option.weight && <p className="text-xs text-gray-500">Weight: {option.weight}kg</p>} */}
        </div>
        <p className={`font-semibold ${isSelected ? 'text-indigo-800' : 'text-gray-900'}`}>
            ₹{(option[priceKey] || 0).toLocaleString('en-IN')} {/* Use 'amt' from ssr */}
        </p>
    </button>
);

// --- Main Modal Component ---

const FlightAncillarySelectionModal = ({
    isOpen,
    onClose,
    itineraryDetails, // Contains the full response including ssr
    priceDetails, // From recheckRate (optional, maybe needed for context)
    passengerFormData, // Passenger details collected from PassengerInfoModal
    onSuccess, // Callback when selections are confirmed
}) => {
    // Debug passenger form data
    // console.log("FlightAncillarySelectionModal - passengerFormData:", passengerFormData);
    
    const [activeView, setActiveView] = useState("seats"); // 'seats', 'baggage', 'meal'
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
    const [activePassengerId, setActivePassengerId] = useState(null); // ID of passenger currently making selections

    // State to store selections PER PASSENGER, PER SEGMENT
    const [passengerSelections, setPassengerSelections] = useState({});

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [activePhysicalLegIndex, setActivePhysicalLegIndex] = useState(0);

    // --- NEW State for International Round Trip Direction ---
    const [activeDirectionIndex, setActiveDirectionIndex] = useState(0); // 0 for outbound, 1 for return
    // --------------------------------------------------------

    // --- Flight Type Detection ---
    const flightType = useMemo(() => 
        itineraryDetails?.flightType || 'ONE_WAY',
        [itineraryDetails]
    );
    const isInternationalRoundTrip = useMemo(() => 
        flightType === 'INTERNATIONAL_ROUND_TRIP', 
        [flightType]
    );
    // ---------------------------

    // Extract flight segments and ssr data
    const flightSegments = useMemo(() => {
        // This might need adjustment if itineraryItems structure changes for INT RT
        // For now, assume it still contains one item for INT RT
        return itineraryDetails?.data?.results?.itineraryItems?.map(item => {
            const itemFlight = item?.itemFlight;
            // For International RT, segments array contains TWO inner arrays: [outbound_legs], [return_legs]
            // For others, it might be [ [legs] ] or just [legs]
            let segmentsStructure = itemFlight?.segments || [];
            
            return {
                itemCode: item.itemCode,
                // Top-level origin/destination might represent the *overall* trip for INT RT
                origin: item.itemFlight?.origin, 
                destination: item.itemFlight?.destination,
                // ... other top-level properties ...
                airlineName: item.itemFlight?.airlineName,
                flightNumber: item.itemFlight?.flightNumber,
                departureAt: item.itemFlight?.departureAt, // Overall departure
                arrivalAt: item.itemFlight?.arrivalAt,     // Overall arrival (of return leg)
                ssr: item.itemFlight?.ssr, // Contains ssr for potentially BOTH directions
                // Store the raw segments structure; we'll pick the direction later
                segmentsRaw: segmentsStructure 
            };
        }) || [];
    }, [itineraryDetails]);

    // Determine number of passengers needing seats/ancillaries
    const totalPassengers = useMemo(() => {
        return (itineraryDetails?.data?.results?.adultCount || 0) +
               (itineraryDetails?.data?.results?.childCount || 0) || 1; 
    }, [itineraryDetails]);

    // Derive passenger list from formData keys for tabs/dropdown
    const passengerList = useMemo(() => {
        // console.log("Building passengerList from formData:", passengerFormData);
        const entries = passengerFormData ? Object.entries(passengerFormData) : [];
        // console.log("Object.entries result:", entries);
        
        const result = entries.map(([id, data]) => {
            // console.log(`Processing passenger ID: ${id}, data:`, data);
            const displayName = data.firstName || data.lastName || `Traveler ${id !== 'null' ? id : ''}`.trim();
            const passenger = { id, ...data, displayName: displayName || 'Traveler' };
            // console.log("Created passenger object:", passenger);
            return passenger;
        });
        
        // console.log("Final passengerList:", result);
        return result;
    }, [passengerFormData]);

    // Initialize state when modal opens or itineraryDetails changes
    useEffect(() => {
        if (isOpen && flightSegments.length > 0 && passengerList.length > 0) {
            // console.log("Initializing modal with passengers:", passengerList);
            setIsLoading(true);
            setError("");

            // Reset physical leg index when modal opens/data changes
            setActivePhysicalLegIndex(0);
            setActiveDirectionIndex(0); // Reset direction for INT RT

            try {
                // Initialize selections state for each passenger
                const initialSelections = {};
                passengerList.forEach(pax => {
                    initialSelections[pax.id] = {
                        seats: [],
                        baggage: [],
                        meals: []
                        // TODO: Load existing selections if re-opening the modal
                    };
                });
                setPassengerSelections(initialSelections);

                // Set the first passenger as active
                if (passengerList.length > 0) {
                    // console.log("Setting active passenger ID to:", passengerList[0].id);
                    setActivePassengerId(passengerList[0].id);
                } else {
                    console.warn("No passengers in list to set active");
                }

                setActiveSegmentIndex(0); // Reset to first segment tab
                setActiveView('seats'); // Reset to seats view

            } catch (err) {
                console.error("Error initializing ancillary state:", err);
                setError("Could not load ancillary options.");
                setPassengerSelections({});
            } finally {
                setIsLoading(false);
            }

        } else if (!isOpen) {
            // Optional: Reset state when modal closes
            // setSelectedSeats([]);
            // setSelectedBaggage([]);
            // setSelectedMeals([]);
            // setError("");
        }
    }, [isOpen, flightSegments, passengerList]); // Rerun when modal opens or flight data changes

    // Calculate total additional cost for ancillaries
    const additionalCost = useMemo(() => {
        let total = 0;
        // Iterate through passenger selections
        Object.values(passengerSelections).forEach(paxSel => {
            paxSel.seats?.forEach(seatSel => {
                if (seatSel.seat && typeof seatSel.seat.amt === 'number') {
                    total += seatSel.seat.amt;
                }
            });
            paxSel.baggage?.forEach(bagSel => {
                if (bagSel.option && typeof bagSel.option.amt === 'number') {
                    total += bagSel.option.amt;
                }
            });
            paxSel.meals?.forEach(mealSel => {
                if (mealSel.option && typeof mealSel.option.amt === 'number') {
                    total += mealSel.option.amt;
                }
            });
        });
        return total;
    }, [passengerSelections]);


    // --- Handlers ---
    const handleSeatClick = (segmentIndex, rowIndex, seatIndex) => {
        setError("");
        // ---- DEBUG LOG ----
        console.log('[DEBUG] handleSeatClick - Start. activePhysicalLeg:', JSON.stringify(activePhysicalLeg));
        // -------------------
        if (!activePassengerId || !activePhysicalLeg) {
             console.warn('[DEBUG] handleSeatClick - Aborted: No active passenger or physical leg.');
             return; // Added log here too
        }

        // Ensure seatMapData is derived correctly using the memoized accessor
        if (!currentPhysicalLegSeatMap || !currentPhysicalLegSeatMap.rowSeats || !currentPhysicalLegSeatMap.rowSeats[rowIndex] || !currentPhysicalLegSeatMap.rowSeats[rowIndex].seats) {
            console.error("Seat map data not found for click");
            return;
        }
        const clickedSeatData = currentPhysicalLegSeatMap.rowSeats[rowIndex].seats[seatIndex];
        const physicalOrigin = activePhysicalLeg.or.aC;
        const physicalDestination = activePhysicalLeg.ds.aC;

        console.log(`[handleSeatClick] Attempting selection for Pax: ${activePassengerId}, Segment: ${segmentIndex}, Physical Leg: ${physicalOrigin} -> ${physicalDestination}, Seat: ${clickedSeatData.code}`);

        setPassengerSelections(prev => {
            const newSelections = JSON.parse(JSON.stringify(prev)); // Deep copy to avoid mutation issues
            const currentPaxSelections = newSelections[activePassengerId] || { seats: [], baggage: [], meals: [] };

            // Check if seat is selected by another passenger FOR THIS PHYSICAL LEG
            let isSelectedByOther = false;
            Object.entries(newSelections).forEach(([paxId, paxSel]) => {
                if (paxId !== activePassengerId) {
                    if (paxSel.seats.some(s => s.origin === physicalOrigin && s.destination === physicalDestination && s.seat.code === clickedSeatData.code)) {
                        isSelectedByOther = true;
                    }
                }
            });

            if (isSelectedByOther || clickedSeatData.isBooked) {
                console.log(`[handleSeatClick] Seat ${clickedSeatData.code} is booked or selected by other. Ignoring.`);
                return prev; // Cannot select booked or other-selected seat
            }

            // Calculate current selections for this PHYSICAL LEG
            const currentSelectedCount = Object.values(newSelections).reduce((total, paxSel) =>
                total + paxSel.seats.filter(s => s.origin === physicalOrigin && s.destination === physicalDestination).length
            , 0);

            // Check if the active passenger already has a seat selected for this PHYSICAL LEG
            const activePaxSeatIndex = currentPaxSelections.seats.findIndex(s => s.origin === physicalOrigin && s.destination === physicalDestination);
            const activePaxCurrentSeat = activePaxSeatIndex !== -1 ? currentPaxSelections.seats[activePaxSeatIndex] : null;

            if (!activePaxCurrentSeat && currentSelectedCount >= totalPassengers) {
                setError(`You can only select ${totalPassengers} seat${totalPassengers > 1 ? 's' : ''} per flight segment.`);
                console.log(`[handleSeatClick] Seat limit reached for ${physicalOrigin} -> ${physicalDestination}.`);
                return prev; 
            }

            const newSeatSelection = {
                origin: physicalOrigin,
                destination: physicalDestination,
                seat: {
                    code: clickedSeatData.code,
                    seatNo: clickedSeatData.seatNo,
                    price: clickedSeatData.amt, // Use price from clicked data
                    amt: clickedSeatData.amt   // Store amt as well for consistency
                }
            };

            if (activePaxCurrentSeat?.seat.code === clickedSeatData.code) {
                console.log(`[handleSeatClick] Deselecting seat ${clickedSeatData.code} for leg ${physicalOrigin} -> ${physicalDestination}.`);
                currentPaxSelections.seats.splice(activePaxSeatIndex, 1);
            } else {
                console.log(`[handleSeatClick] Selecting seat ${clickedSeatData.code} for leg ${physicalOrigin} -> ${physicalDestination}.`);
                if (activePaxSeatIndex !== -1) {
                    currentPaxSelections.seats[activePaxSeatIndex] = newSeatSelection;
                } else {
                    currentPaxSelections.seats.push(newSeatSelection);
                }
            }

            newSelections[activePassengerId] = currentPaxSelections;
            console.log(`[handleSeatClick] Updated passengerSelections state for Pax ${activePassengerId}:`, JSON.stringify(newSelections[activePassengerId]));
            return newSelections;
        });
    };

    const handleBaggageSelect = (segmentIndex, option) => {
        if (!activePassengerId) return;

        // BUG FIX: Use direction-specific origin/destination, not overall segment
        // const overallSegment = flightSegments[segmentIndex]; 
        // if (!overallSegment) return;
        // const overallOrigin = overallSegment.origin;
        // const overallDestination = overallSegment.destination;
        const directionOrigin = currentDirectionOrigin; // Use the memoized direction origin
        const directionDestination = currentDirectionDestination; // Use the memoized direction destination

        if (!directionOrigin || !directionDestination) {
            console.error("[handleBaggageSelect] Missing direction origin/destination. Cannot save selection.");
            return;
        }

        console.log(`[handleBaggageSelect] Attempting selection for Pax: ${activePassengerId}, Direction: ${directionOrigin} -> ${directionDestination}, Option: ${option.code}`);

        setPassengerSelections(prev => {
            const newSelections = JSON.parse(JSON.stringify(prev));
            const currentPaxSelections = newSelections[activePassengerId] || { seats: [], baggage: [], meals: [] };
             // Find using direction-specific keys
            const segmentBaggageIndex = currentPaxSelections.baggage.findIndex(b => b.origin === directionOrigin && b.destination === directionDestination);

            const newBaggageSelection = {
                origin: directionOrigin,       // Save with direction origin
                destination: directionDestination, // Save with direction destination
                option: { code: option.code, price: option.amt, dsc: option.dsc, amt: option.amt }
            };

            if (segmentBaggageIndex !== -1) {
                if (currentPaxSelections.baggage[segmentBaggageIndex].option.code === option.code) {
                    console.log(`[handleBaggageSelect] Deselecting baggage ${option.code} for ${directionOrigin} -> ${directionDestination}.`);
                    currentPaxSelections.baggage.splice(segmentBaggageIndex, 1);
                } else {
                    console.log(`[handleBaggageSelect] Changing baggage selection to ${option.code} for ${directionOrigin} -> ${directionDestination}.`);
                    currentPaxSelections.baggage[segmentBaggageIndex] = newBaggageSelection;
                }
            } else {
                console.log(`[handleBaggageSelect] Selecting baggage ${option.code} for ${directionOrigin} -> ${directionDestination}.`);
                currentPaxSelections.baggage.push(newBaggageSelection);
            }

            newSelections[activePassengerId] = currentPaxSelections;
            console.log(`[handleBaggageSelect] Updated passengerSelections state for Pax ${activePassengerId}:`, JSON.stringify(newSelections[activePassengerId]));
            return newSelections;
        });
    };

    const handleMealSelect = (segmentIndex, option) => {
        if (!activePassengerId) return;

        // BUG FIX: Use PHYSICAL LEG origin/destination for meals
        const physicalOrigin = activePhysicalLeg?.or?.aC; 
        const physicalDestination = activePhysicalLeg?.ds?.aC;

        if (!physicalOrigin || !physicalDestination) {
            console.error("[handleMealSelect] Missing physical leg origin/destination. Cannot save selection.");
            return;
        }

        console.log(`[handleMealSelect] Attempting selection for Pax: ${activePassengerId}, Physical Leg: ${physicalOrigin} -> ${physicalDestination}, Option: ${option.code}`);

        setPassengerSelections(prev => {
            const newSelections = JSON.parse(JSON.stringify(prev));
            const currentPaxSelections = newSelections[activePassengerId] || { seats: [], baggage: [], meals: [] };
            // Find using physical leg keys
            const segmentMealIndex = currentPaxSelections.meals.findIndex(m => m.origin === physicalOrigin && m.destination === physicalDestination);

            const newMealSelection = {
                origin: physicalOrigin,       // Save with physical leg origin
                destination: physicalDestination, // Save with physical leg destination
                option: { code: option.code, price: option.amt, dsc: option.dsc, amt: option.amt }
            };

            if (segmentMealIndex !== -1) {
                if (currentPaxSelections.meals[segmentMealIndex].option.code === option.code) {
                    console.log(`[handleMealSelect] Deselecting meal ${option.code} for ${physicalOrigin} -> ${physicalDestination}.`);
                    currentPaxSelections.meals.splice(segmentMealIndex, 1);
                } else {
                    console.log(`[handleMealSelect] Changing meal selection to ${option.code} for ${physicalOrigin} -> ${physicalDestination}.`);
                    currentPaxSelections.meals[segmentMealIndex] = newMealSelection;
                }
            } else {
                console.log(`[handleMealSelect] Selecting meal ${option.code} for ${physicalOrigin} -> ${physicalDestination}.`);
                currentPaxSelections.meals.push(newMealSelection);
            }

            newSelections[activePassengerId] = currentPaxSelections;
            console.log(`[handleMealSelect] Updated passengerSelections state for Pax ${activePassengerId}:`, JSON.stringify(newSelections[activePassengerId]));
            return newSelections;
        });
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        setError("");
        try {
            // --- Reconstruct passenger data with nested SSR --- 
            const finalPassengerData = Object.entries(passengerSelections).map(([paxId, selections]) => {
                const originalData = passengerFormData[paxId] || {};

                // Format SSR object for this passenger
                const ssr = {
                    seat: selections.seats.map(s => ({
                        origin: s.origin,
                        destination: s.destination,
                        code: s.seat.code, // Use seat.code
                        amt: s.seat.price, // Use seat.price (which is seat.amt)
                        seat: s.seat.seatNo // Use seat.seatNo
                    })),
                    baggage: selections.baggage.map(b => ({
                        origin: b.origin,
                        destination: b.destination,
                        code: b.option.code,
                        amt: b.option.price,
                        dsc: b.option.dsc
                    })),
                    meal: selections.meals.map(m => ({
                        origin: m.origin,
                        destination: m.destination,
                        code: m.option.code,
                        amt: m.option.price,
                        dsc: m.option.dsc
                    }))
                };

                return {
                    ...originalData, // Include original passenger details
                    isLeadPax: passengerList.find(p => p.id === paxId)?.isLeadPax || false,
                    ssr // Add the formatted SSR selections
                };
            });

            console.log("Final Passenger Data for onSuccess:", JSON.stringify(finalPassengerData, null, 2));

            // --- Call the onSuccess prop passed from FlightItineraryModal ---
            if (onSuccess) {
                // Assume onSuccess will throw an error if the underlying API call fails
                await onSuccess(finalPassengerData); // Pass the fully reconstructed passenger data

                 // --- MOVE SUCCESS TOAST HERE ---
                 // Only show success if onSuccess completed without throwing an error
                toast.success("Ancillary selections confirmed.");
                // onClose(); // Let the parent modal handle closing after its logic
            }

            // --- REMOVE SUCCESS TOAST FROM HERE ---
            // toast.success("Ancillary selections confirmed.");
            // onClose(); // Let the parent modal handle closing after its logic

        } catch (err) { // This catch block will now handle errors thrown by onSuccess
            console.error("Error confirming selections:", err);
            setError(err.message || 'An unexpected error occurred.');
            toast.error(err.message || 'Failed to confirm selections.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset state if needed, although useEffect handles re-init on open
        onClose();
    };

    // --- Get Current Data based on Context (Segment, Direction, Physical Leg) ---
    // Wrap currentSegmentData in useMemo to satisfy exhaustive-deps
    const currentSegmentData = useMemo(() => {
        return flightSegments[activeSegmentIndex] || {}; 
    }, [flightSegments, activeSegmentIndex]);

    const currentDirectionSegments = useMemo(() => { 
        // For INT RT, segmentsRaw is [[out], [in]]; select based on direction index
        // For others, segmentsRaw might be [[legs]] or [legs] - handle gracefully
        const raw = currentSegmentData.segmentsRaw;
        if (!raw) return []; // Handle case where segmentsRaw is undefined
        
        if (isInternationalRoundTrip && Array.isArray(raw) && raw.length > activeDirectionIndex) {
            return raw[activeDirectionIndex] || []; // Get outbound or return legs array
        } else if (Array.isArray(raw) && Array.isArray(raw[0]) && !isInternationalRoundTrip) {
            // Domestic structure like [[legs]] or potentially single leg international
            return raw[0] || []; 
        } else if (Array.isArray(raw) && !Array.isArray(raw[0]) && !isInternationalRoundTrip) {
             // Structure like [legs] (e.g., simple one-way)
             // This case might be less common with the [[legs]] structure, but handle defensively
            return raw; 
        }
        console.warn("Could not determine currentDirectionSegments structure:", raw);
        return [];
    }, [currentSegmentData, activeDirectionIndex, isInternationalRoundTrip]);

    // Determine the origin and destination for the entire current direction (outbound/inbound)
    const currentDirectionOrigin = useMemo(() => {
        // Add explicit check for non-empty array
        if (!currentDirectionSegments || currentDirectionSegments.length === 0) {
            return null;
        }
        return currentDirectionSegments[0]?.or?.aC ?? null; // Use nullish coalescing for default
    }, [currentDirectionSegments]);

    const currentDirectionDestination = useMemo(() => {
        // Add explicit check for non-empty array
        if (!currentDirectionSegments || currentDirectionSegments.length === 0) {
            return null;
        }
        return currentDirectionSegments[currentDirectionSegments.length - 1]?.ds?.aC ?? null; // Use nullish coalescing
    }, [currentDirectionSegments]);

    // Get the currently selected physical leg object
    const activePhysicalLeg = useMemo(() => {
         // Add explicit check for non-empty array and valid index
        if (!currentDirectionSegments || currentDirectionSegments.length === 0 || activePhysicalLegIndex < 0 || activePhysicalLegIndex >= currentDirectionSegments.length) {
            return null;
        }
        return currentDirectionSegments[activePhysicalLegIndex];
    }, [currentDirectionSegments, activePhysicalLegIndex]);


    // Determine origin and destination for the specific active physical leg (for seats)
    const activePhysicalLegOrigin = useMemo(() => {
        // Check if activePhysicalLeg exists before accessing properties
        return activePhysicalLeg?.or?.aC ?? null;
    }, [activePhysicalLeg]);

    const activePhysicalLegDestination = useMemo(() => {
        // Check if activePhysicalLeg exists before accessing properties
        return activePhysicalLeg?.ds?.aC ?? null;
    }, [activePhysicalLeg]);

    // --- SSR Data Accessors (Now based on Current Direction/Leg) ---
    // Seat Map Data - PRIORITIZE physical leg, FALLBACK to overall direction
    const currentPhysicalLegSeatMap = useMemo(() => { 
        const physicalOrigin = activePhysicalLeg?.or?.aC;
        const physicalDestination = activePhysicalLeg?.ds?.aC;
        const directionOrigin = currentDirectionOrigin;
        const directionDestination = currentDirectionDestination;

        if (!currentSegmentData?.ssr?.seat) return null; // No seat data at all

        // 1. Try finding seat map for the specific active physical leg
        if (physicalOrigin && physicalDestination) {
            const physicalLegMap = currentSegmentData.ssr.seat.find(s => 
                s.origin === physicalOrigin && 
                s.destination === physicalDestination
            );
            if (physicalLegMap) return physicalLegMap;
        }

        // 2. If no physical leg map, try finding one for the overall direction
        if (directionOrigin && directionDestination) {
             const directionMap = currentSegmentData.ssr.seat.find(s => 
                s.origin === directionOrigin && 
                s.destination === directionDestination
            );
             if (directionMap) {
                console.log(`SeatMap: Found overall direction map (${directionOrigin}->${directionDestination}) as fallback for physical leg (${physicalOrigin}->${physicalDestination}).`);
                return directionMap;
             }
        }
        
        return null; // Return null if neither is found
    }, [currentSegmentData?.ssr?.seat, activePhysicalLeg, currentDirectionOrigin, currentDirectionDestination]);

    // Baggage Options - Based on OVERALL direction
    const currentDirectionBaggageOptions = useMemo(() => { 
        // Check if direction origin/destination are valid before searching
        if (!currentDirectionOrigin || !currentDirectionDestination) return [];
        // Find the baggage SSR entry matching the OVERALL ORIGIN/DESTINATION of the CURRENT DIRECTION
        return currentSegmentData.ssr?.baggage?.find(b => 
            b.origin === currentDirectionOrigin && 
            b.destination === currentDirectionDestination
        )?.options || [];
    }, [currentSegmentData?.ssr?.baggage, currentDirectionOrigin, currentDirectionDestination]);

    // Meal Options - NOW BASED ON ACTIVE PHYSICAL LEG
    const currentPhysicalLegMealOptions = useMemo(() => { 
        const physicalOrigin = activePhysicalLeg?.or?.aC;
        const physicalDestination = activePhysicalLeg?.ds?.aC;

        // Check if physical leg origin/destination are valid before searching
        if (!physicalOrigin || !physicalDestination) return []; 
        // Find the meal SSR entry matching the ACTIVE PHYSICAL LEG
        return currentSegmentData.ssr?.meal?.find(m => 
            m.origin === physicalOrigin && 
            m.destination === physicalDestination
        )?.options || [];
    }, [currentSegmentData?.ssr?.meal, activePhysicalLeg]);

    // --- Active Passenger Selections Accessors (Now based on Current Direction/Leg) ---
    const activePaxCurrentSelections = passengerSelections[activePassengerId] || { seats: [], baggage: [], meals: [] };
    
    // Seat Selection - Based on PHYSICAL LEG
    const activePaxSeatSelection = useMemo(() => { 
        const physicalOrigin = activePhysicalLeg?.or?.aC;
        const physicalDestination = activePhysicalLeg?.ds?.aC;
        // Check if physical leg origin/destination are valid before searching
        if (!physicalOrigin || !physicalDestination) return null;
        return activePaxCurrentSelections.seats.find(s => 
            s.origin === physicalOrigin && 
            s.destination === physicalDestination
        ) || null; // Return null if not found
    }, [activePaxCurrentSelections.seats, activePhysicalLeg]);
    
    // Baggage Selection - Based on OVERALL DIRECTION
    const activePaxBaggageSelection = useMemo(() => { 
        // Check if direction origin/destination are valid before searching
        if (!currentDirectionOrigin || !currentDirectionDestination) return null;
        return activePaxCurrentSelections.baggage.find(b => 
            b.origin === currentDirectionOrigin && 
            b.destination === currentDirectionDestination
        ) || null; // Return null if not found
    }, [activePaxCurrentSelections.baggage, currentDirectionOrigin, currentDirectionDestination]);
    
    // Meal Selection - NOW BASED ON ACTIVE PHYSICAL LEG
    const activePaxMealSelection = useMemo(() => { 
        const physicalOrigin = activePhysicalLeg?.or?.aC;
        const physicalDestination = activePhysicalLeg?.ds?.aC;
        // Check if physical leg origin/destination are valid before searching
        if (!physicalOrigin || !physicalDestination) return null;
        return activePaxCurrentSelections.meals.find(m => 
            m.origin === physicalOrigin && 
            m.destination === physicalDestination
        ) || null; // Return null if not found
    }, [activePaxCurrentSelections.meals, activePhysicalLeg]);

    // --- Total Selected Seat Count (for current physical leg) ---
    const currentPhysicalLegTotalSelectedSeats = useMemo(() => {
        // Check if physical leg origin/destination are valid before filtering
        if (!activePhysicalLegOrigin || !activePhysicalLegDestination) return 0;
        return Object.values(passengerSelections).reduce((total, paxSel) =>
            total + paxSel.seats.filter(s => 
                s.origin === activePhysicalLegOrigin && 
                s.destination === activePhysicalLegDestination
            ).length
        , 0);
    }, [passengerSelections, activePhysicalLegOrigin, activePhysicalLegDestination]);

    // Calculate selected count for the current segment for UI feedback
    // Count seats selected for the ACTIVE PHYSICAL LEG across all passengers
    const currentSegmentTotalSelectedSeats = useMemo(() => Object.values(passengerSelections).reduce((total, paxSel) =>
        total + paxSel.seats.filter(s => 
            activePhysicalLeg && 
            s.origin === activePhysicalLeg.or.aC && 
            s.destination === activePhysicalLeg.ds.aC
        ).length
    , 0), [passengerSelections, activePhysicalLeg]);

    // --- Debugging Logs Before Render ---
    console.log(`[Render] Active Pax ID: ${activePassengerId}, Active Segment: ${activeSegmentIndex}, Active Physical Leg: ${activePhysicalLegIndex}`);
    if (activePhysicalLeg) {
        console.log(`[Render] Reading Seat Selection for Key: ${activePhysicalLeg.or.aC} -> ${activePhysicalLeg.ds.aC}`);
        console.log(`[Render] Found Seat Selection:`, activePaxSeatSelection);
        // Log meal info based on physical leg
        console.log(`[Render] Reading Meal Selection for Key: ${activePhysicalLeg.or.aC} -> ${activePhysicalLeg.ds.aC}`);
        console.log(`[Render] Found Meal Selection:`, activePaxMealSelection);
    } else {
        console.log("[Render] No active physical leg for Seat/Meal selection reading.");
    }
    if (currentDirectionOrigin && currentDirectionDestination) { // Log baggage info based on overall direction
        console.log(`[Render] Reading Baggage Selection for Key: ${currentDirectionOrigin} -> ${currentDirectionDestination}`);
        console.log(`[Render] Found Baggage Selection:`, activePaxBaggageSelection);
    } else {
        console.log("[Render] Cannot read Baggage selection: Missing current direction origin/destination.");
    }

    // Render Logic
    if (!isOpen) return null; // Don't render if not open

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[60]" onClose={handleClose}> {/* Higher z-index */}
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-blue-500 flex-shrink-0 rounded-t-xl">
                                    <div>
                                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-white">
                                            Select Seats & Extras
                                        </Dialog.Title>
                                         {/* Display basic flight info if available */}
                                         {currentSegmentData.airlineName && (
                                             <p className="text-sm text-indigo-100 mt-1">
                                                 {currentSegmentData.airlineName} {currentSegmentData.flightNumber} -
                                                 <span className='font-medium ml-2 text-white'>
                                                    {passengerList.find(p => p.id === activePassengerId)?.displayName || 'Traveler'}
                                                 </span>
                                             </p>
                                         )}
                                    </div>
                                    <button
                                        onClick={handleClose}
                                        className="p-1.5 rounded-full text-white hover:text-white hover:bg-indigo-700/50 focus:outline-none focus:ring-2 focus:ring-white"
                                        aria-label="Close modal"
                                        disabled={isLoading}
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Error Display */}
                                {error && (
                                    <div className="p-4 bg-red-50 border-l-4 border-red-400 flex-shrink-0">
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

                                {/* Main Content Area (Scrollable) */}
                                <div className="flex-grow overflow-y-auto">
                                    {/* Loading Indicator */}
                                    {isLoading && !error && (
                                        <div className="p-10 text-center text-gray-500">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                                            <p className="mt-2">Loading options...</p>
                                        </div>
                                    )}

                                    {/* Main Tabs */}
                                    {!isLoading && flightSegments.length > 0 && (
                                        <>
                                            {/* Passenger Tabs (Outermost Control) */}
                                            <div className="px-5 pt-5 flex-shrink-0">
                                                <h4 className="text-sm font-medium text-gray-600 mb-2">Select Traveler</h4>
                                                <Tab.Group selectedIndex={passengerList.findIndex(p => p.id === activePassengerId)} onChange={(index) => setActivePassengerId(passengerList[index].id)}>
                                                    <Tab.List className="flex space-x-1 rounded-lg bg-indigo-900/10 p-1">
                                                        {passengerList.map((pax) => (
                                                            <Tab key={pax.id} className={({ selected }) => `w-full rounded-lg py-2 text-sm font-medium leading-5 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60 ${selected ? 'bg-white text-indigo-700 shadow-md' : 'text-indigo-600 hover:bg-white/[0.7] hover:text-indigo-700'}`}>
                                                                {pax.displayName}
                                                            </Tab>
                                                        ))}
                                                    </Tab.List>
                                                </Tab.Group>
                                            </div>

                                            {/* --- Direction Tabs (International Round Trip Only) --- */}
                                            {isInternationalRoundTrip && currentSegmentData?.segmentsRaw?.length === 2 && (
                                                <div className="px-5 pt-4 flex-shrink-0">
                                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Select Journey Direction</h4>
                                                    <Tab.Group 
                                                        selectedIndex={activeDirectionIndex} 
                                                        onChange={(index) => { 
                                                            setActiveDirectionIndex(index); 
                                                            setActivePhysicalLegIndex(0); // Reset leg index when direction changes
                                                        }}
                                                    >
                                                        <Tab.List className="flex space-x-1 rounded-xl bg-green-900/10 p-1">
                                                            {/* Outbound Tab */}
                                                            <Tab className={({ selected }) => `w-full rounded-lg py-2.5 px-2 text-sm font-medium leading-5 text-green-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2 ${selected ? 'bg-white shadow-md' : 'text-green-600 hover:bg-white/[0.7] hover:text-green-700'}`}>
                                                                Outbound: {currentSegmentData.segmentsRaw[0]?.[0]?.or?.aC} <ArrowRightIcon className="inline h-3 w-3 mx-1" /> {currentSegmentData.segmentsRaw[0]?.[currentSegmentData.segmentsRaw[0]?.length - 1]?.ds?.aC}
                                                            </Tab>
                                                            {/* Return Tab */}
                                                            <Tab className={({ selected }) => `w-full rounded-lg py-2.5 px-2 text-sm font-medium leading-5 text-green-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-green-400 focus:outline-none focus:ring-2 ${selected ? 'bg-white shadow-md' : 'text-green-600 hover:bg-white/[0.7] hover:text-green-700'}`}>
                                                                Return: {currentSegmentData.segmentsRaw[1]?.[0]?.or?.aC} <ArrowRightIcon className="inline h-3 w-3 mx-1" /> {currentSegmentData.segmentsRaw[1]?.[currentSegmentData.segmentsRaw[1]?.length - 1]?.ds?.aC}
                                                            </Tab>
                                                        </Tab.List>
                                                    </Tab.Group>
                                                </div>
                                            )}
                                            {/* --------------------------------------------------------- */}

                                            {/* Overall Segment Tabs (Hide for INT RT, maybe use for multi-city?) */}
                                            {!isInternationalRoundTrip && flightSegments.length > 1 && (
                                                <div className="px-5 pt-4 flex-shrink-0">
                                                    <h4 className="text-sm font-medium text-gray-600 mb-2">Flight Segments</h4>
                                                    <Tab.Group selectedIndex={activeSegmentIndex} onChange={(index) => { setActiveSegmentIndex(index); setActivePhysicalLegIndex(0); /* Reset leg index */ }}>
                                                        <Tab.List className="flex space-x-1 rounded-xl bg-indigo-900/10 p-1">
                                                            {flightSegments.map((segment, index) => (
                                                                <Tab key={`${segment.origin}-${segment.destination}-${index}`} className={({ selected }) => `w-full rounded-lg py-2.5 px-2 text-sm font-medium leading-5 text-indigo-700 ring-white ring-opacity-60 ring-offset-2 ring-offset-indigo-400 focus:outline-none focus:ring-2 ${selected ? 'bg-white shadow-md' : 'text-indigo-500 hover:bg-white/[0.7] hover:text-indigo-700'}`}>
                                                                    {segment.origin} → {segment.destination}
                                                                </Tab>
                                                            ))}
                                                        </Tab.List>
                                                    </Tab.Group>
                                                </div>
                                            )}
                                             {!isInternationalRoundTrip && flightSegments.length === 1 && (
                                                <div className="px-5 pt-4 flex-shrink-0">
                                                     {/* Display single segment info */}
                                                     <div className="py-2 px-2 bg-indigo-50 rounded-lg">
                                                         <p className="text-sm font-medium text-indigo-700">
                                                             Flight: {flightSegments[0]?.origin} → {flightSegments[0]?.destination}
                                                         </p>
                                                     </div>
                                                </div>
                                            )}

                                            {/* Ancillary Type Tabs */}
                                            <Tab.Group
                                                selectedIndex={['seats', 'baggage', 'meal'].indexOf(activeView)}
                                                onChange={(index) => setActiveView(['seats', 'baggage', 'meal'][index])}
                                                as="div" className="flex flex-col flex-grow mt-4" // Allow this group to take remaining space
                                            >
                                                <Tab.List className="flex border-b border-gray-200 bg-white flex-shrink-0 sticky top-0 z-10 px-5">
                                                    {/* Seat Tab - Always shown if SSR exists? Maybe add check? For now, always show. */}
                                                    <Tab className={({ selected }) => `flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                                        <PaperAirplaneIcon className='w-5 h-5' /> Seats
                                                    </Tab>
                                                     {/* Baggage Tab - Use DIRECTION-specific options for visibility */}
                                                    {currentDirectionBaggageOptions.length > 0 && (
                                                        <Tab className={({ selected }) => `flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                                            <ShoppingCartIcon className='w-5 h-5' /> Baggage
                                                        </Tab>
                                                    )}
                                                     {/* Meal Tab - Use PHYSICAL LEG-specific options for visibility */}
                                                    {currentPhysicalLegMealOptions.length > 0 && (
                                                        <Tab className={({ selected }) => `flex-1 py-3 px-1 text-sm font-medium flex items-center justify-center gap-2 focus:outline-none ${selected ? 'border-b-2 border-indigo-500 text-indigo-600' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                                            <UserGroupIcon className='w-5 h-5' /> Meals
                                                        </Tab>
                                                    )}
                                                </Tab.List>

                                                {/* Ancillary Tab Panels (Seats/Baggage/Meals) */}
                                                <Tab.Panels className="flex-grow p-5 bg-gray-50 overflow-y-auto">
                                                    {/* Seats Panel */}
                                                    <Tab.Panel className="focus:outline-none">
                                                        {/* Physical Leg Tabs INSIDE Seat Panel */}
                                                        {activeView === 'seats' && Array.isArray(currentDirectionSegments) && currentDirectionSegments.length > 1 && (
                                                            <>
                                                              {/* ---- DEBUG LOG ---- */}
                                                              {console.log('[DEBUG] Rendering Physical Leg Tabs. currentDirectionSegments:', JSON.stringify(currentDirectionSegments))}
                                                              {/* ------------------- */}
                                                              <div className="mb-5">
                                                                  <h4 className="text-sm font-medium text-gray-600 mb-2">Flight Connections</h4>
                                                                  <Tab.Group selectedIndex={activePhysicalLegIndex} onChange={setActivePhysicalLegIndex}>
                                                                      <Tab.List className="flex space-x-1 rounded-md bg-gray-100 p-1">
                                                                          {currentDirectionSegments.map((leg, index) => (
                                                                              <Tab 
                                                                                   /* Add optional chaining for key generation */
                                                                                  key={`${leg?.or?.aC ?? `leg-${index}-or`}-${leg?.ds?.aC ?? `leg-${index}-ds`}-seat`}
                                                                                  className={({ selected }) => `w-full rounded-md py-2 px-2 text-xs font-medium leading-5 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-400 ring-white ring-opacity-60 ${selected ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-white/[0.7] hover:text-gray-800'}`}>
                                                                                  {/* Add optional chaining and default text */}
                                                                                  {leg?.or?.aC ?? 'N/A'} → {leg?.ds?.aC ?? 'N/A'}
                                                                              </Tab>
                                                                          ))}
                                                                      </Tab.List>
                                                                  </Tab.Group>
                                                              </div>
                                                            </> // Closing tag for the fragment
                                                        )}

                                                        {/* Use currentPhysicalLegSeatMap */}
                                                        {currentPhysicalLegSeatMap && currentPhysicalLegSeatMap.rowSeats?.length > 0 ? (
                                                          <div className="space-y-5 bg-white p-5 rounded-lg shadow-sm">
                                                                <p className="text-sm text-gray-600 text-center font-medium pb-2 border-b border-gray-100">
                                                                    Select seat for {passengerList.find(p => p.id === activePassengerId)?.displayName || 'Traveler'}.
                                                                    <span className="ml-2 text-indigo-600">Selected: {currentSegmentTotalSelectedSeats}/{totalPassengers}</span>
                                                                </p>
                                                                <div className="py-3">
                                                                    {currentPhysicalLegSeatMap.rowSeats.map((row, rowIndex) => (
                                                                        <div key={`row-${rowIndex}`} className="flex justify-center items-center space-x-1 md:space-x-1.5 my-2">
                                                                            {row.seats.map((seat, seatIndex) => (
                                                                                seat.code ? ( // Render only if seat has a code
                                                                                    <SeatButton
                                                                                        key={seat.code}
                                                                                        seat={seat}
                                                                                        onClick={() => handleSeatClick(activeSegmentIndex, rowIndex, seatIndex)}
                                                                                        isSelected={activePaxSeatSelection?.seat.code === seat.code}
                                                                                        isSelectedByOther={Object.entries(passengerSelections).some(([paxId, paxSel]) =>
                                                                                            paxId !== activePassengerId && paxSel.seats.some(s => activePhysicalLeg && s.origin === activePhysicalLeg.or.aC && s.destination === activePhysicalLeg.ds.aC && s.seat.code === seat.code)
                                                                                        )}
                                                                                        disabled={isLoading}
                                                                                    />
                                                                                ) : ( // Render a spacer for null code seats (aisle)
                                                                                    <div key={`spacer-${rowIndex}-${seatIndex}`} className="w-10 h-10 md:w-12 md:h-12"></div>
                                                                                )
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                 {/* Legend */}
                                                                 <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 text-xs pt-4 text-gray-600 border-t border-gray-100">
                                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-300 bg-white"></span>Available</span>
                                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-indigo-600 bg-indigo-600"></span>Selected</span>
                                                                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-gray-400 bg-gray-300"></span>Unavailable</span>
                                                                </div>
                                                            </div>
                                                        ) : <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">Seat map not available for this physical leg.</div>}
                                                    </Tab.Panel>

                                                    {/* Baggage Panel */}
                                                    <Tab.Panel className="focus:outline-none">
                                                        {/* Use direction-specific options here */}
                                                        {currentDirectionBaggageOptions.length > 0 ? (
                                                            <div className="space-y-4 bg-white p-5 rounded-lg shadow-sm">
                                                                <p className="text-sm text-gray-700 font-medium pb-3 border-b border-gray-100">
                                                                    Select additional baggage for {passengerList.find(p => p.id === activePassengerId)?.displayName || 'Traveler'}
                                                                    {/* Indicate direction if applicable (INT RT) */}
                                                                    {isInternationalRoundTrip && ` (${currentDirectionOrigin} → ${currentDirectionDestination})`}
                                                                </p>
                                                                <div className="grid gap-3 pt-2">
                                                                    {/* Use direction-specific options here */}
                                                                    {currentDirectionBaggageOptions.map(option => (
                                                                        <OptionCard
                                                                            key={option.code}
                                                                            option={option}
                                                                            isSelected={activePaxBaggageSelection?.option.code === option.code}
                                                                            onClick={() => handleBaggageSelect(activeSegmentIndex, option)} // segmentIndex not really used now
                                                                            disabled={isLoading}
                                                                            descriptionKey="dsc"
                                                                            priceKey="amt"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">No additional baggage options available for this {isInternationalRoundTrip ? 'direction' : 'segment'}.</div>}
                                                    </Tab.Panel>

                                                    {/* Meal Panel */}
                                                    <Tab.Panel className="focus:outline-none">
                                                        {/* Physical Leg Tabs INSIDE Meal Panel */} 
                                                        {activeView === 'meal' && currentDirectionSegments && currentDirectionSegments.length > 1 && (
                                                            <div className="mb-5">
                                                                <h4 className="text-sm font-medium text-gray-600 mb-2">Select Meal for Connection</h4>
                                                                <Tab.Group selectedIndex={activePhysicalLegIndex} onChange={setActivePhysicalLegIndex}>
                                                                    <Tab.List className="flex space-x-1 rounded-md bg-gray-100 p-1">
                                                                        {currentDirectionSegments.map((leg, index) => (
                                                                            <Tab 
                                                                                key={`${leg?.or?.aC ?? `leg-${index}-or`}-${leg?.ds?.aC ?? `leg-${index}-ds`}-meal`}
                                                                                className={({ selected }) => `w-full rounded-md py-2 px-2 text-xs font-medium leading-5 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-400 ring-white ring-opacity-60 ${selected ? 'bg-white text-indigo-700 shadow' : 'text-gray-600 hover:bg-white/[0.7] hover:text-gray-800'}`}>
                                                                                {leg?.or?.aC ?? 'N/A'} → {leg?.ds?.aC ?? 'N/A'}
                                                                                {/* Indicate if meals exist for this specific leg */} 
                                                                                {currentSegmentData.ssr?.meal?.some(m => m.origin === leg?.or?.aC && m.destination === leg?.ds?.aC && m.options?.length > 0) ? '' : ' (N/A)'}
                                                                            </Tab>
                                                                        ))}
                                                                    </Tab.List>
                                                                </Tab.Group>
                                                            </div>
                                                        )}

                                                        {/* Use currentPhysicalLegMealOptions */}
                                                        {currentPhysicalLegMealOptions.length > 0 ? (
                                                            <div className="space-y-4 bg-white p-5 rounded-lg shadow-sm">
                                                                <p className="text-sm text-gray-700 font-medium pb-3 border-b border-gray-100">
                                                                    Select meal for {passengerList.find(p => p.id === activePassengerId)?.displayName || 'Traveler'} ({activePhysicalLeg?.or?.aC ?? 'N/A'} → {activePhysicalLeg?.ds?.aC ?? 'N/A'})
                                                                </p>
                                                                <div className="grid gap-3 pt-2">
                                                                    {currentPhysicalLegMealOptions.map(option => (
                                                                        <OptionCard
                                                                            key={option.code}
                                                                            option={option}
                                                                            isSelected={activePaxMealSelection?.option.code === option.code}
                                                                            onClick={() => handleMealSelect(activeSegmentIndex, option)} // segmentIndex is not really used now
                                                                            disabled={isLoading}
                                                                            descriptionKey="dsc"
                                                                            priceKey="amt"
                                                                        />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm">No meal options available for this specific connection.</div>}
                                                    </Tab.Panel>
                                                </Tab.Panels>
                                             </Tab.Group> {/* Close Ancillary Tab.Group */}
                                        </>
                                     )}
 
                                     {/* No Options Message */}
                                      {!isLoading && flightSegments.length === 0 && !error && (
                                         <div className="text-center text-gray-500 p-10 bg-white m-5 rounded-lg shadow-sm">
                                            <p>No ancillary options available or itinerary data is missing.</p>
                                         </div>
                                     )}
                                </div>

                                {/* Footer with Summary and Actions */}
                                <div className="p-5 border-t border-gray-200 bg-indigo-50 flex-shrink-0 rounded-b-xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                                        <div className="bg-white py-2 px-4 rounded-lg shadow-sm border border-indigo-100">
                                            <p className="text-sm font-medium text-gray-700">Additional Cost:</p>
                                            <p className="text-lg font-semibold text-indigo-600">₹{additionalCost.toLocaleString('en-IN')}</p>
                                        </div>
                                        <div className="flex w-full sm:w-auto gap-3">
                                            <button
                                                type="button"
                                                className="flex-1 sm:flex-none inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                onClick={handleClose}
                                                disabled={isLoading}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className={`flex-1 sm:flex-none inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                onClick={handleSubmit}
                                                disabled={isLoading || !flightSegments.length} // Disable if loading or no segments
                                            >
                                                {isLoading ? (
                                                    <>
                                                        <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                                                        Saving...
                                                    </>
                                                ) : 'Confirm Selections'}
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

export default FlightAncillarySelectionModal; 