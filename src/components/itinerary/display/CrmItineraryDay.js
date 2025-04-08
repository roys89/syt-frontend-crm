import { Disclosure, Transition } from '@headlessui/react';
import {
    ChevronDownIcon,
    PlusIcon,
} from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import CrmActivityCard from '../cards/CrmActivityCard';
import CrmFlightCard from '../cards/CrmFlightCard';
import CrmHotelCard from '../cards/CrmHotelCard';
import CrmTransferCard from '../cards/CrmTransferCard';
import CrmHotelSearchModifyModal from '../modals/change/CrmHotelSearchModifyModal';
import CrmActivityViewModal from '../modals/view/CrmActivityViewModal';

// --- Placeholder Imports for NEW Search Form Modals ---
// TODO: Create these files and components
// REMOVED PLACEHOLDER: const CrmActivitySearchFormModal = (...) 
// REMOVED PLACEHOLDER: const CrmTransferSearchFormModal = (...) 
// REMOVED PLACEHOLDER: const CrmFlightSearchFormModal = (...) 
// --- End Placeholder Imports ---

// --- Import Actual Search Form Modals ---
import CrmActivitySearchFormModal from '../modals/add/CrmActivitySearchFormModal';
import CrmFlightSearchFormModal from '../modals/add/CrmFlightSearchFormModal';
import CrmTransferSearchFormModal from '../modals/add/CrmTransferSearchFormModal';
// --- End Imports ---

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
const CrmItineraryDay = ({ day, dayNumber, travelersDetails, itineraryToken, inquiryToken, onUpdateItinerary }) => {
    // Use singular isOpen state for the Disclosure itself
    // const [isOpen, setIsOpen] = useState(true); // Disclosure controls its own open state

    // --- State for View Modals ---
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemType, setSelectedItemType] = useState(null); // e.g., 'activity', 'flight'

    // State to control the Hotel Search Modify Modal
    const [isHotelSearchModalOpen, setIsHotelSearchModalOpen] = useState(false);

    // --- State for NEW Search Modals ---
    const [isActivitySearchModalOpen, setIsActivitySearchModalOpen] = useState(false);
    const [isTransferSearchModalOpen, setIsTransferSearchModalOpen] = useState(false);
    const [isFlightSearchModalOpen, setIsFlightSearchModalOpen] = useState(false);
    // --- End State for NEW Search Modals ---

    // --- Extract City Context --- 
    const cityContext = day.cityContext || {}; // Get the context object
    const cityName = cityContext.name || 'Unknown City';
    const countryName = cityContext.country || 'Unknown Country';
    // --- End Extract City Context ---

    const navigate = useNavigate();

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

    // --- Action Button Handlers (Updated) --- 
    const handleAddActivity = () => {
        // toast.info(`Add Activity placeholder for Day ${dayNumber}`);
        if (!cityName || !day.date || !itineraryToken || !inquiryToken) { // Check cityName
             console.error("Cannot add activity: Missing context", { cityName, date: day.date, itineraryToken, inquiryToken });
             toast.error("Missing required context to add activity.");
             return;
        }
        console.log("Opening Add Activity Search Modal");
        setIsActivitySearchModalOpen(true);
    };

    const handleAddTransfer = () => {
        // toast.info(`Add Transfer placeholder for Day ${dayNumber}`);
         if (!cityName || !day.date || !itineraryToken || !inquiryToken) { // Check cityName
             console.error("Cannot add transfer: Missing context", { cityName, date: day.date, itineraryToken, inquiryToken });
             toast.error("Missing required context to add transfer.");
             return;
        }
        console.log("Opening Add Transfer Search Modal");
        setIsTransferSearchModalOpen(true);
    };

    // Updated handleAddHotel (opens modal)
    const handleAddHotel = () => {
        if (!cityName || !day.date || !itineraryToken || !inquiryToken || !travelersDetails) { // Check cityName
            console.error("Missing required context for adding hotel:", { city: cityName, date: day.date, itineraryToken, inquiryToken, travelersDetails });
            toast.error("Cannot initiate add hotel process: Missing context.");
            return;
        }
        console.log("Opening Add Hotel Search Modal");
        setIsHotelSearchModalOpen(true);
    };

    const handleAddFlight = () => {
        // toast.info(`Add Flight placeholder for Day ${dayNumber}`);
         if (!cityName || !day.date || !itineraryToken || !inquiryToken) { // Check cityName
             console.error("Cannot add flight: Missing context", { cityName, date: day.date, itineraryToken, inquiryToken });
             toast.error("Missing required context to add flight.");
             return;
        }
        console.log("Opening Add Flight Search Modal");
        setIsFlightSearchModalOpen(true);
    };

    // --- Handlers for Navigating from Modals ---
    
    // Existing handler for hotel
    const handleSearchFromModal = (searchParams) => {
        // ... implementation unchanged ...
         const { checkIn: modalCheckIn, checkOut: modalCheckOut, travelersDetails: modalTravelersDetails } = searchParams;
        setIsHotelSearchModalOpen(false); // Close the modal first
        if (!cityName || !itineraryToken || !inquiryToken || !modalCheckIn || !modalCheckOut || !modalTravelersDetails) { // Check cityName
             console.error("Cannot navigate to results: Missing data from modal or context", { city: cityName, itineraryToken, inquiryToken, searchParams });
             toast.error("Failed to start hotel search. Missing required information.");
             return;
        }
        console.log(`Navigating to hotel results for ${cityName} from ${modalCheckIn} to ${modalCheckOut}`);
        navigate(
            `/crm/itinerary/${itineraryToken}/add-hotel-results/${encodeURIComponent(cityName)}/${modalCheckIn}/${modalCheckOut}`,
            { state: { inquiryToken, travelersDetails: modalTravelersDetails }}
        );
    };

    // Modified handler for Activity
    const handleSearchFromActivityModal = (searchParams) => {
        setIsActivitySearchModalOpen(false);
        console.log("Activity search params from modal:", searchParams);
        // Extract date and any other criteria from the searchParams object
        const { date: activityDate, ...searchCriteria } = searchParams;

        if (!cityName || !countryName || !itineraryToken || !inquiryToken || !activityDate || !travelersDetails) {
             console.error("Cannot navigate to activity results: Missing data", { 
                 city: cityName, 
                 country: countryName, 
                 itineraryToken, 
                 inquiryToken, 
                 activityDate, 
                 travelersDetails, 
                 searchCriteria 
             });
             toast.error("Failed to start activity search. Missing required information.");
             return;
        }

        const targetPath = `/crm/itinerary/${itineraryToken}/add-activity/${encodeURIComponent(cityName)}/${activityDate}`;
        const stateToPass = {
            inquiryToken,
            travelersDetails,
            searchCriteria, // Pass along any extra criteria from the modal
            countryName,    // Pass country name needed for API call on results page
            city: cityName, // Pass city name for consistency
            date: activityDate // Pass the selected date
        };

        console.log(`Navigating to: ${targetPath} with state:`, stateToPass);
        navigate(targetPath, { state: stateToPass });
    };

    // New handler for Transfer
    const handleSearchFromTransferModal = (searchParams) => {
        setIsTransferSearchModalOpen(false);
        console.log("Transfer search params from modal:", searchParams);
        // Destructure directly from searchParams passed from the modal
        const { date: transferDate = day.date, origin, destination, time } = searchParams;

        if (!cityName || !itineraryToken || !inquiryToken || !transferDate || !origin || !destination || !time) { // Check cityName
             console.error("Cannot navigate to transfer results: Missing data", { city: cityName, itineraryToken, inquiryToken, transferDate, origin, destination, time });
             toast.error("Failed to start transfer search. Missing required information.");
             return;
        }

        const targetPath = `/crm/itinerary/${itineraryToken}/add-transfer-results/${encodeURIComponent(cityName)}/${transferDate}`;
        
        // Construct the state object to pass
        const stateToPass = {
            searchParams: searchParams, // Pass the full object received from modal
            itineraryToken: itineraryToken,
            inquiryToken: inquiryToken,
            city: cityName, // Use cityName consistent with other handlers
            date: transferDate // Use the date from searchParams
        };

        console.log(`Navigating to: ${targetPath} with explicit state:`, stateToPass);

        // Pass the state object correctly
        navigate(targetPath, { state: stateToPass });
    };

    // New handler for Flight
    const handleSearchFromFlightModal = (searchParams) => {
        setIsFlightSearchModalOpen(false);
        console.log("Flight search params from modal:", searchParams);
        // TODO: Define actual parameters needed for flight search (e.g., origin, dest, dates)
        const { date: flightDate = day.date, origin = 'FROM', destination = 'TO' } = searchParams;

         if (!itineraryToken || !inquiryToken || !flightDate) {
             console.error("Cannot navigate to flight results: Missing data", { itineraryToken, inquiryToken, flightDate });
             toast.error("Failed to start flight search. Missing required information.");
             return;
        }

        console.log(`Navigating to flight results from ${origin} to ${destination} on ${flightDate}`);
        navigate(
            // TODO: Define final route structure
            `/crm/itinerary/${itineraryToken}/add-flight-results/${flightDate}/${origin}/${destination}`,
            { state: { inquiryToken, searchParams } } // Pass relevant state
        );
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
                                        date={day.date}
                                        city={cityName} // Use extracted city name
                                        onUpdate={onUpdateItinerary}
                                    />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Transfers */}
                            {transfers.map((transfer, index) => (
                                 <ItineraryItemWrapper key={transfer.id || transfer.bookingId || `transfer-${index}`}>
                                    <CrmTransferCard 
                                        transfer={transfer} 
                                        onViewClick={() => openViewModal(transfer, 'transfer')} 
                                        itineraryDay={day} // Keep passing full day if needed, or pass context
                                        city={cityName} // Pass extracted city name
                                        itineraryToken={itineraryToken}
                                        inquiryToken={inquiryToken}
                                        onUpdate={onUpdateItinerary}
                                    />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Hotels - Pass travelersDetails */}
                            {hotels.map((hotel, index) => (
                                <ItineraryItemWrapper key={hotel.id || hotel.bookingId || `hotel-${index}`}>
                                    <CrmHotelCard
                                        hotel={hotel}
                                        travelersDetails={travelersDetails}
                                        itineraryDay={day} // Keep passing full day if needed, or pass context
                                        city={cityName} // Pass extracted city name
                                        onUpdateItinerary={onUpdateItinerary}
                                        itineraryToken={itineraryToken}
                                        inquiryToken={inquiryToken}
                                    />
                                </ItineraryItemWrapper>
                            ))}

                            {/* Render Activities - Pass additional props */}
                            {activities.map((activity, index) => (
                                <ItineraryItemWrapper key={activity.id || activity.bookingId || `activity-${index}`}>
                                    <CrmActivityCard 
                                        activity={activity} 
                                        onViewClick={() => openViewModal(activity, 'activity')} 
                                        // --- Pass required context --- 
                                        itineraryToken={itineraryToken}
                                        inquiryToken={inquiryToken}
                                        travelersDetails={travelersDetails}
                                        city={cityName} // Use extracted city name
                                        country={countryName} // <-- Pass the country name here
                                        date={day.date} // Pass the specific day's date
                                        onUpdate={onUpdateItinerary}
                                        // --- End passing context --- 
                                    />
                                 </ItineraryItemWrapper>
                            ))}

                            {/* --- Add Item Buttons Area --- */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="p-3 border border-dashed border-gray-300 rounded-md flex flex-wrap items-center gap-3">
                                    {/* Updated onClick handlers */}
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

            {/* Render the Hotel Search Modal */}
            {isHotelSearchModalOpen && (
                <CrmHotelSearchModifyModal
                    isOpen={isHotelSearchModalOpen}
                    onClose={() => setIsHotelSearchModalOpen(false)} // Simple close handler
                    // Pre-fill with current day's context
                    currentSearch={{
                        city: cityName, // Use extracted city name
                        checkIn: day.date, // Day's date is the check-in
                        checkOut: day.date ? (() => {
                            try {
                                const checkInDate = new Date(day.date);
                                const checkOutDate = new Date(checkInDate);
                                checkOutDate.setDate(checkOutDate.getDate() + 1);
                                return checkOutDate.toISOString().split('T')[0];
                            } catch (e) {
                                console.error("Error calculating default checkout date:", e);
                                return ''; // Return empty string on error
                            }
                        })() : '', // Default check-out
                        travelersDetails: travelersDetails // Current travelers context
                    }}
                    onSearchUpdate={handleSearchFromModal} // Use the new handler
                />
            )}

            {/* --- Render NEW Search Modals --- */}
            {isActivitySearchModalOpen && (
                 <CrmActivitySearchFormModal
                    isOpen={isActivitySearchModalOpen}
                    onClose={() => setIsActivitySearchModalOpen(false)}
                    // TODO: Pass relevant pre-fill data (city, date)
                    initialData={{ city: cityName, date: day.date }} // Use extracted city name
                    onSearch={handleSearchFromActivityModal}
                 />
            )}
             {isTransferSearchModalOpen && (
                 <CrmTransferSearchFormModal
                    isOpen={isTransferSearchModalOpen}
                    onClose={() => setIsTransferSearchModalOpen(false)}
                     // TODO: Pass relevant pre-fill data (city, date)
                    initialData={{ city: cityName, date: day.date }} // Use extracted city name
                    onSearch={handleSearchFromTransferModal}
                 />
            )}
             {isFlightSearchModalOpen && (
                 <CrmFlightSearchFormModal
                    isOpen={isFlightSearchModalOpen}
                    onClose={() => setIsFlightSearchModalOpen(false)}
                     // TODO: Pass relevant pre-fill data (date?)
                    initialData={{ date: day.date }}
                    onSearch={handleSearchFromFlightModal}
                 />
            )}
            {/* --- End NEW Search Modals --- */}
        </>
    );
};

export default CrmItineraryDay;
