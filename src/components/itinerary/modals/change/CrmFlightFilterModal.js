import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
// --- REMOVED Slider Imports ---
// import Nouislider from 'nouislider-react';
// import 'nouislider/dist/nouislider.css'; 
import React, { Fragment, useEffect, useState } from 'react';

// Map cabin class codes to names (consistent with CrmChangeFlightPage)
const cabinClassMap = {
    1: "All", // Or should this be filtered out? Assuming 'All' isn't a filterable class.
    2: "Economy",
    3: "Premium Economy",
    4: "Business",
    5: "Premium Business",
    6: "First"
};
const getCabinClassName = (code) => cabinClassMap[code] || 'Unknown';

const CrmFlightFilterModal = ({
    isOpen,
    onClose,
    initialFilters,
    onApplyFilters,
    priceRange,
    availableAirlines = [],
    stopCounts = {},
    availableCabinClasses = [] // Expecting names like 'Economy', 'Business' etc.
}) => {
    const [localFilters, setLocalFilters] = useState(initialFilters);

    // --- REMOVED Slider State ---
    // const [sliderPriceRange, setSliderPriceRange] = useState([0, 100000]);

    // Reset local state when initialFilters change or modal opens
    useEffect(() => {
        // Keep the priceRange from initialFilters, only reset others
        setLocalFilters({
            priceRange: initialFilters?.priceRange || [priceRange?.min || 0, priceRange?.max || 100000],
            airlines: initialFilters?.airlines || [],
            stops: initialFilters?.stops !== undefined ? initialFilters.stops : null,
            cabinClasses: initialFilters?.cabinClasses || []
        });
        // --- REMOVED Slider reset ---
        // const initialPrice = initialFilters?.priceRange || [priceRange?.min || 0, priceRange?.max || 100000];
        // setSliderPriceRange(initialPrice);
    }, [initialFilters, isOpen, priceRange]);

    // --- REMOVED Slider Handlers ---
    // const handleSliderUpdate = (values) => { ... };
    // const handleSliderChange = (values) => { ... };

    const handleStopChange = (stopValue) => {
        setLocalFilters(prev => ({
            ...prev,
            stops: prev.stops === stopValue ? null : stopValue
        }));
    };

    const handleAirlineChange = (airlineName) => {
        setLocalFilters(prev => {
            const currentAirlines = prev.airlines || [];
            const newAirlines = currentAirlines.includes(airlineName)
                ? currentAirlines.filter(a => a !== airlineName)
                : [...currentAirlines, airlineName];
            return { ...prev, airlines: newAirlines };
        });
    };

     const handleCabinClassChange = (cabinClassName) => {
        setLocalFilters(prev => {
            const currentClasses = prev.cabinClasses || [];
            const newClasses = currentClasses.includes(cabinClassName)
                ? currentClasses.filter(c => c !== cabinClassName)
                : [...currentClasses, cabinClassName];
            return { ...prev, cabinClasses: newClasses };
        });
    };

    const handleReset = () => {
        setLocalFilters(prev => ({
            ...prev, // Keep existing priceRange
            airlines: [],
            stops: null,
            cabinClasses: [],
        }));
        // --- REMOVED Slider Reset ---
        // const defaultPrice = [priceRange?.min || 0, priceRange?.max || 100000];
        // setSliderPriceRange(defaultPrice);
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    // --- REMOVED formatPrice and slider range variables ---
    // const formatPrice = price => ...;
    // const minPrice = ...;
    // const maxPrice = ...;
    // const sliderMax = ...;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title
                                    as="h3"
                                    className="text-lg font-medium leading-6 text-gray-900 border-b pb-4 mb-4 flex justify-between items-center"
                                >
                                    Filter Flights
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <XMarkIcon className="h-5 w-5"/>
                                    </button>
                                </Dialog.Title>
                                <div className="mt-2 space-y-6">
                                    {/* Stops Filter */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Stops</h4>
                                        <div className="space-y-1">
                                            {[0, 1, 2].map((stopValue) => {
                                                const label = stopValue === 0 ? 'Non-Stop' : `${stopValue} Stop${stopValue > 1 ? 's' : ''}`;
                                                const count = stopCounts[stopValue] || 0;
                                                const isChecked = localFilters.stops === stopValue;

                                                return (
                                                    <label key={stopValue} className="flex items-center justify-between text-sm text-gray-600 cursor-pointer">
                                                        <span className="flex items-center">
                                                             <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={() => handleStopChange(stopValue)}
                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                                                            />
                                                            {label}
                                                        </span>
                                                        <span className="text-gray-400">({count})</span>
                                                     </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* --- Price Range Filter REMOVED --- */}
                                    {/* 
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range</h4>
                                        <div className="px-1">
                                             <Nouislider ... />
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                                            <span>{formatPrice(sliderPriceRange[0])}</span>
                                            <span>{formatPrice(sliderPriceRange[1])}</span>
                                        </div>
                                    </div>
                                    */}

                                    {/* Cabin Class Filter */}
                                    {availableCabinClasses.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Cabin Class</h4>
                                            <div className="space-y-1">
                                                {availableCabinClasses.map((cabinClass) => (
                                                    <label key={cabinClass} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={localFilters.cabinClasses?.includes(cabinClass)}
                                                            onChange={() => handleCabinClassChange(cabinClass)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                                                        />
                                                        {cabinClass}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Airlines Filter */}
                                    {availableAirlines.length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-700 mb-2">Airlines</h4>
                                            <div className="space-y-1 max-h-32 overflow-y-auto pr-2 border rounded-md p-2">
                                                {availableAirlines.map((airline) => (
                                                    <label key={airline} className="flex items-center text-sm text-gray-600 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={localFilters.airlines?.includes(airline)}
                                                            onChange={() => handleAirlineChange(airline)}
                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-2"
                                                        />
                                                        {airline}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t flex justify-between items-center">
                                     <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={handleReset}
                                    >
                                        Reset Filters
                                    </button>
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={handleApply}
                                    >
                                        Apply Filters
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CrmFlightFilterModal; 