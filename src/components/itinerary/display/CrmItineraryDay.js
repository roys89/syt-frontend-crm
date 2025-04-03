import { Disclosure, Transition } from '@headlessui/react';
import {
    ChevronDownIcon,
} from '@heroicons/react/24/solid';
import React, { useState } from 'react';

import CrmActivityCard from '../cards/CrmActivityCard';
import CrmFlightCard from '../cards/CrmFlightCard';
import CrmHotelCard from '../cards/CrmHotelCard';
import CrmTransferCard from '../cards/CrmTransferCard';

// Simple wrapper to add consistent spacing and potentially an icon later if needed
const ItineraryItemWrapper = ({ children }) => {
    return (
        // Only apply bottom margin for spacing between items, NO left margin
        <div className="mb-4">
             {children}
        </div>
    );
};

const CrmItineraryDay = ({ day, dayNumber }) => {
    const [isOpen, setIsOpen] = useState(true);

    // Keep data extraction as separate arrays
    const flights = day.flights || day.flightDetails || [];
    const hotels = day.hotels || day.hotelDetails || [];
    const activities = day.activities || day.activityDetails || [];
    const transfers = day.transfers || day.transferDetails || [];

    const hasItems = flights.length > 0 || hotels.length > 0 || activities.length > 0 || transfers.length > 0;
    const itemCount = flights.length + hotels.length + activities.length + transfers.length;

    const dateStr = day.date ? new Date(day.date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Date N/A';

    return (
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
                                <CrmFlightCard flight={flight} />
                            </ItineraryItemWrapper>
                        ))}

                        {/* Render Transfers */}
                        {transfers.map((transfer, index) => (
                             <ItineraryItemWrapper key={transfer.id || transfer.bookingId || `transfer-${index}`}>
                                <CrmTransferCard transfer={transfer} />
                            </ItineraryItemWrapper>
                        ))}

                        {/* Render Hotels */}
                        {hotels.map((hotel, index) => (
                            <ItineraryItemWrapper key={hotel.id || hotel.bookingId || `hotel-${index}`}>
                                <CrmHotelCard hotel={hotel} />
                            </ItineraryItemWrapper>
                        ))}

                        {/* Render Activities */}
                        {activities.map((activity, index) => (
                            <ItineraryItemWrapper key={activity.id || activity.bookingId || `activity-${index}`}>
                                <CrmActivityCard activity={activity} />
                             </ItineraryItemWrapper>
                        ))}
                    </Disclosure.Panel>
                </Transition>
            </>
          )}
        </Disclosure>
    );
};

export default CrmItineraryDay;
