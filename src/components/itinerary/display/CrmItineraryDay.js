import { Disclosure, Transition } from '@headlessui/react';
import {
    ChevronDownIcon,
    PlusIcon,
} from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

import CrmActivityCard from '../cards/CrmActivityCard';
import CrmFlightCard from '../cards/CrmFlightCard';
import CrmHotelCard from '../cards/CrmHotelCard';
import CrmTransferCard from '../cards/CrmTransferCard';
import CrmActivityViewModal from '../modals/CrmActivityViewModal';

// Simple wrapper to add consistent spacing and potentially an icon later if needed
const ItineraryItemWrapper = ({ children }) => {
    return (
        // Only apply bottom margin for spacing between items, NO left margin
        <div className="mb-4">
             {children}
        </div>
    );
};

// Accept the new props: travelersDetails, itineraryToken, inquiryToken
const CrmItineraryDay = ({ day, dayNumber, travelersDetails, itineraryToken, inquiryToken }) => {
    // Use singular isOpen state for the Disclosure itself
    // const [isOpen, setIsOpen] = useState(true); // Disclosure controls its own open state

    // --- State for View Modals ---
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemType, setSelectedItemType] = useState(null); // e.g., 'activity', 'flight'
    // --- End State ---

    // Keep data extraction as separate arrays
    const flights = day.flights || day.flightDetails || [];
    const hotels = day.hotels || day.hotelDetails || [];
    const activities = day.activities || day.activityDetails || [];
    const transfers = day.transfers || day.transferDetails || [];

    const hasItems = flights.length > 0 || hotels.length > 0 || activities.length > 0 || transfers.length > 0;
    const itemCount = flights.length + hotels.length + activities.length + transfers.length;

    const dateStr = day.date ? new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A';

    // --- Modal Control Functions ---
    const openViewModal = (item, type) => {
        console.log(`Opening view modal for ${type}:`, item);
        setSelectedItem(item);
        setSelectedItemType(type);
        setIsViewModalOpen(true);
    };

    const closeViewModal = () => {
        setIsViewModalOpen(false);
        // Delay clearing data slightly to allow modal fade-out
        setTimeout(() => {
            setSelectedItem(null);
            setSelectedItemType(null);
        }, 300); // Match modal transition duration
    };
    // --- End Modal Control --- 

    // --- Placeholder Button Handlers ---
    const handleAddActivity = () => {
        toast.info(`Add Activity placeholder for Day ${dayNumber}`);
    };

    const handleAddTransfer = () => {
        toast.info(`Add Transfer placeholder for Day ${dayNumber}`);
    };

    const handleAddHotel = () => {
        toast.info(`Add Hotel placeholder for Day ${dayNumber}`);
    };

    const handleAddFlight = () => {
        toast.info(`Add Flight placeholder for Day ${dayNumber}`);
    };
    // --- End Handlers ---

    return (
        <>
            <Disclosure defaultOpen={true} as="div" className="mb-6">
              {({ open }) => (
                 <>
                    {/* Day Header - Make it the Disclosure Button */}
                    <Disclosure.Button className="sticky top-0 z-10 w-full text-left bg-gradient-to-b from-white via-white to-transparent pb-2 mb-3 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                         <div className="flex justify-between items-center py-2 border-b border-indigo-100">
                             <h3 className="text-lg md:text-xl font-semibold text-indigo-800">
                                <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded mr-2">Day {dayNumber}</span>
                                 {dateStr}
                             </h3>
                              <div className="flex items-center">
                                 {!open && itemCount > 0 && (
                                    <span className="text-sm font-medium text-gray-500 mr-2">
                                        {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                    </span>
                                 )}
                                 <ChevronDownIcon
                                    className={`${ open ? 'rotate-180 transform' : '' } h-5 w-5 text-indigo-600 transition-transform duration-200`}
                                 />
                              </div>
                         </div>
                    </Disclosure.Button>

                    {/* Collapsible Panel */}
                     <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                     >
                        <Disclosure.Panel as="div" className="pt-2">
                            {!hasItems && (
                                <ItineraryItemWrapper>
                                    <div className="text-sm text-gray-500 italic py-4 pl-4">
                                        No items scheduled for this day.
                                    </div>
                                 </ItineraryItemWrapper>
                            )}

                            {/* Render Flights */}
                            {flights.map((flight, index) => (
                                <ItineraryItemWrapper key={flight.id || flight.bookingId || `flight-${index}`}>
                                    <CrmFlightCard 
                                        flight={flight} 
                                        travelersDetails={travelersDetails} 
                                        itineraryToken={itineraryToken} 
                                        inquiryToken={inquiryToken} 
                                    />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Transfers */}
                            {transfers.map((transfer, index) => (
                                 <ItineraryItemWrapper key={transfer.id || transfer.bookingId || `transfer-${index}`}>
                                    <CrmTransferCard transfer={transfer} onViewClick={() => openViewModal(transfer, 'transfer')} />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Hotels - Pass travelersDetails */}
                            {hotels.map((hotel, index) => (
                                <ItineraryItemWrapper key={hotel.id || hotel.bookingId || `hotel-${index}`}>
                                    <CrmHotelCard
                                        hotel={hotel}
                                        travelersDetails={travelersDetails}
                                        onViewClick={() => openViewModal(hotel, 'hotel')}
                                    />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Activities */}
                            {activities.map((activity, index) => (
                                <ItineraryItemWrapper key={activity.id || activity.bookingId || `activity-${index}`}>
                                    <CrmActivityCard activity={activity} onViewClick={() => openViewModal(activity, 'activity')} />
                                 </ItineraryItemWrapper>
                            ))}

                            {/* --- Add Item Buttons Area --- */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="p-3 border border-dashed border-gray-300 rounded-md flex flex-wrap items-center gap-3">
                                    <button
                                        onClick={handleAddActivity}
                                        className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium text-sm shadow-sm transition-colors"
                                        title="Add Activity to this day"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                        Add Activity
                                    </button>
                                    <button
                                        onClick={handleAddTransfer}
                                        className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 font-medium text-sm shadow-sm transition-colors"
                                        title="Add Transfer to this day"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                        Add Transfer
                                    </button>
                                    <button
                                        onClick={handleAddHotel}
                                        className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm shadow-sm transition-colors"
                                        title="Add Hotel starting this day"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                        Add Hotel
                                    </button>
                                    <button
                                        onClick={handleAddFlight}
                                        className="flex-1 min-w-[150px] inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 font-medium text-sm shadow-sm transition-colors"
                                        title="Add Flight departing this day"
                                    >
                                        <PlusIcon className="h-5 w-5" />
                                        Add Flight
                                    </button>
                                </div>
                            </div>
                            {/* --- End Add Item Buttons Area --- */}
                        </Disclosure.Panel>
                    </Transition>
                </>
              )}
            </Disclosure>

            {/* Render Modals Conditionally */}
            {selectedItemType === 'activity' && (
                <CrmActivityViewModal
                    isOpen={isViewModalOpen}
                    onClose={closeViewModal}
                    activityData={selectedItem}
                />
            )}
            {/* Add similar blocks for Flight, Hotel, Transfer modals later */}
            {/* {selectedItemType === 'flight' && <CrmFlightViewModal ... />} */}
            {/* {selectedItemType === 'hotel' && <CrmHotelViewModal ... />} */}
            {/* {selectedItemType === 'transfer' && <CrmTransferViewModal ... />} */}
        </>
    );
};

export default CrmItineraryDay;
