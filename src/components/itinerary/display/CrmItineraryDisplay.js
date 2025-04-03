import { Disclosure, Transition } from '@headlessui/react';
import { CalendarDaysIcon, ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/solid'; // Use solid icons for headers
import React from 'react';
import CrmItineraryDay from './CrmItineraryDay'; // Assuming Day component is in the same directory

// Helper function to get total number of travelers
const getTotalTravelers = (travelersDetails) => {
  if (!travelersDetails || !travelersDetails.rooms) return 0;
  return travelersDetails.rooms.reduce((total, room) => {
    const adults = room.adults ? room.adults.length : 0;
    const children = room.children ? room.children.length : 0;
    return total + adults + children;
  }, 0);
};

// Helper function to get duration of trip in days
const getTripDuration = (cities) => {
  if (!cities || cities.length === 0) return 0;
  try {
    // Ensure dates are valid Date objects
    const startDate = new Date(cities[0].startDate);
    const endDate = new Date(cities[cities.length - 1].endDate);
    // Basic validation
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid start or end date", { start: cities[0].startDate, end: cities[cities.length - 1].endDate });
        return cities[0]?.days?.length ? cities.reduce((sum, city) => sum + (city.days?.length || 0), 0) : 'N/A'; // Fallback to summing days per city if dates invalid
    }
    const timeDiff = endDate.getTime() - startDate.getTime();
    // Calculate days difference, adding 1 to include both start and end days
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return daysDiff > 0 ? daysDiff : 1; // Ensure at least 1 day is shown
  } catch (e) {
      console.error("Error calculating trip duration:", e);
      return 'N/A';
  }
};

const CrmItineraryDisplay = ({ itinerary }) => {
  // Check for the correct path: itinerary.cities
  if (!itinerary || !itinerary.cities || itinerary.cities.length === 0) {
    console.error("Itinerary data received is missing or has no cities:", itinerary);
    return <p className="text-red-500">Error: Itinerary data is missing or invalid.</p>;
  }

  // Calculate summary details
  const totalTravelers = getTotalTravelers(itinerary.travelersDetails);
  const tripDuration = getTripDuration(itinerary.cities);
  const cityCount = itinerary.cities.length;

  // Optional: Extract top-level info if needed
  const itineraryTitle = itinerary.itineraryToken ? `Itinerary: ${itinerary.itineraryToken}` : 'Itinerary Details';
  // Add price display logic later if needed

  let dayCounter = 1; // Initialize day counter

  // --- Placeholder Button Handlers ---
  const handleModify = () => {
    console.log("Modify Itinerary Clicked (Placeholder)");
    // Add actual modification logic here, likely involving parent component state/callbacks
    alert("Modification action not yet implemented.");
  };

  const handleDownloadPdf = () => {
    console.log("Download PDF Clicked (Placeholder)");
    // Add PDF generation logic here
    alert("PDF Download not yet implemented.");
  };
  // --- End Placeholder Button Handlers ---

  return (
    <div className="space-y-6 p-4 bg-gray-100 rounded-lg shadow-sm">
      {/* Header Title */}
      <h2 className="text-2xl font-bold text-indigo-700 border-b pb-2 mb-4">{itineraryTitle}</h2>

      {/* Trip Overview Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4 p-3 mb-6 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span><strong>{tripDuration}</strong> Days</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span><strong>{cityCount}</strong> {cityCount === 1 ? 'City' : 'Cities'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11a5 5 0 011 9.9M9 11a5 5 0 00-4.93 4.001A6.97 6.97 0 009 16a6.97 6.97 0 004.93-1.999A5 5 0 009 11z" />
          </svg>
          <span><strong>{totalTravelers}</strong> Travelers</span>
        </div>
      </div>

      {/* Itinerary Sections per City - Use Disclosure */}
      {itinerary.cities.map((city, cityIndex) => {
        const cityStartDate = new Date(city.startDate);
        const cityEndDate = new Date(city.endDate);
        const cityDayCount = city.days?.length || 0;
        const startDayForCity = dayCounter; // Track the starting day number
        const endDayForCity = startDayForCity + cityDayCount - 1;

        // Capture the days for this city to render in the panel
        const cityDays = city.days && city.days.length > 0 ? (
          city.days.map((day) => {
            const currentDayNumber = dayCounter++; // Use and increment the global day counter
            return (
              <CrmItineraryDay
                key={day.date || `day-${currentDayNumber}`}
                day={day}
                dayNumber={currentDayNumber}
              />
            );
          })
        ) : (
          <p className="text-sm text-gray-500 italic p-4">No scheduled days for {city.city}.</p>
        );

        // Decrement counter after loop to correctly set for next city's start
        if (city.days && city.days.length > 0) dayCounter -= city.days.length;

        return (
          <Disclosure defaultOpen={cityIndex === 0} key={city.cityCode || `city-${cityIndex}`} as="div" className="mb-8 bg-white rounded-lg overflow-hidden shadow-md">
            {({ open }) => (
              <>
                {/* City Header as Disclosure Button */}
                <Disclosure.Button className="sticky top-0 z-20 w-full text-left bg-gradient-to-r from-purple-600 to-indigo-600 p-4 shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center">
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-1 sm:mb-0">
                      <MapPinIcon className="w-6 h-6 flex-shrink-0" />
                      {city.city}{city.country ? `, ${city.country}` : ''}
                    </h3>
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-indigo-100 font-medium flex items-center gap-1.5">
                        <CalendarDaysIcon className="w-4 h-4" />
                        Days {startDayForCity} - {endDayForCity}
                        {!isNaN(cityStartDate.getTime()) && !isNaN(cityEndDate.getTime()) &&
                          ` (${cityStartDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${cityEndDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})`
                        }
                      </p>
                      <ChevronDownIcon
                         className={`${ open ? 'rotate-180 transform' : '' } h-5 w-5 text-indigo-100 transition-transform duration-200`}
                      />
                    </div>
                  </div>
                </Disclosure.Button>

                {/* Collapsible Panel for Days */}
                 <Transition
                    enter="transition duration-100 ease-out"
                    enterFrom="transform scale-95 opacity-0"
                    enterTo="transform scale-100 opacity-100"
                    leave="transition duration-75 ease-out"
                    leaveFrom="transform scale-100 opacity-100"
                    leaveTo="transform scale-95 opacity-0"
                 >
                    <Disclosure.Panel as="div" className="p-4 space-y-0">
                       {cityDays} {/* Render the prepared day components */}
                    </Disclosure.Panel>
                 </Transition>
              </>
            )}
          </Disclosure>
        );
      })}

      {/* Action Buttons Section */}
      <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-end">
          <button
            onClick={handleModify}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Modify Itinerary
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2"
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
              </svg>
              Download PDF
          </button>
      </div>
    </div>
  );
};

export default CrmItineraryDisplay;
