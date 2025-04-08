import { Disclosure, Transition } from '@headlessui/react';
import { CalendarDaysIcon, ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/solid'; // Use solid icons for headers
import React, { useEffect, useState } from 'react'; // Import hooks
import bookingService from '../../../services/bookingService'; // Import bookingService
import { calculateItineraryTotal } from '../../../utils/priceCalculations'; // Import calculation function
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

// Helper function to format currency
const formatAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'N/A'; // Or some default like ₹0.00
  }
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CrmItineraryDisplay = ({ itinerary, onUpdateItinerary }) => {
  // State for markups and calculated totals
  const [markupSettings, setMarkupSettings] = useState(null);
  const [calculatedTotals, setCalculatedTotals] = useState(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [errorSettings, setErrorSettings] = useState(null);

  // Fetch markup settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      setErrorSettings(null);
      try {
        const settings = await bookingService.getMarkupSettings();
        setMarkupSettings(settings); // Stores { markups: {...}, tcsRates: {...} }
      } catch (error) {
        console.error("Error fetching markup settings:", error);
        setErrorSettings(error.message || 'Failed to load pricing configuration.');
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Calculate totals when itinerary or settings change
  useEffect(() => {
    if (itinerary && markupSettings) {
      const totals = calculateItineraryTotal(itinerary, markupSettings.markups, markupSettings.tcsRates);
      setCalculatedTotals(totals);
    } else {
       console.log("Skipping total calculation - missing itinerary or markupSettings.", { hasItinerary: !!itinerary, hasSettings: !!markupSettings });
       setCalculatedTotals(null); // Reset totals if data is incomplete
    }
  }, [itinerary, markupSettings]); // Recalculate if itinerary or settings change

  // Check for the correct path: itinerary.cities
  if (!itinerary || !itinerary.cities || itinerary.cities.length === 0) {
    console.error("Itinerary data received is missing or has no cities:", itinerary);
    return <p className="text-red-500">Error: Itinerary data is missing or invalid.</p>;
  }

  // --- Extract necessary props for children --- 
  const travelersDetails = itinerary.travelersDetails;
  const itineraryToken = itinerary.itineraryToken; 
  // Assuming inquiryToken is also part of the main itinerary object after load/generation
  // If not, it might need to be passed separately from ItineraryBookingPage
  const inquiryToken = itinerary.inquiryToken; 
  // --- End Extraction ---

  // Calculate summary details
  const totalTravelers = getTotalTravelers(travelersDetails);
  const tripDuration = getTripDuration(itinerary.cities);
  const cityCount = itinerary.cities.length;

  // Optional: Extract top-level info if needed
  const itineraryTitle = itineraryToken ? `Itinerary: ${itineraryToken}` : 'Itinerary Details';

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

  const handleBookTrip = () => {
    console.log("Book Trip Clicked (Placeholder)");
    // Add booking logic here
    alert("Booking action not yet implemented.");
  };
  // --- End Placeholder Button Handlers ---

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-sm">
      {/* Header Section (Title and Overview Bar) - Placed above the grid */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-indigo-700 border-b pb-2 mb-4">{itineraryTitle}</h2>
        <div className="flex flex-wrap justify-between items-center gap-4 p-3 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg shadow-sm">
           {/* Overview items */}
           <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
            <span><strong>{tripDuration}</strong> Days</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
            <span><strong>{cityCount}</strong> {cityCount === 1 ? 'City' : 'Cities'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor"><path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0115 11a5 5 0 011 9.9M9 11a5 5 0 00-4.93 4.001A6.97 6.97 0 009 16a6.97 6.97 0 004.93-1.999A5 5 0 009 11z" /></svg>
            <span><strong>{totalTravelers}</strong> Travelers</span>
          </div>
        </div>
      </div>

      {/* Grid Layout for Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Itinerary Days */}
        <div className="lg:col-span-8 space-y-6">
          {itinerary.cities.map((city, cityIndex) => {
            const cityStartDate = new Date(city.startDate);
            const cityEndDate = new Date(city.endDate);
            const cityDayCount = city.days?.length || 0;
            const startDayForCity = dayCounter;
            const endDayForCity = startDayForCity + cityDayCount - 1;
            const cityDays = city.days && city.days.length > 0 ? (
              city.days.map((day) => {
                const currentDayNumber = dayCounter++;
                // --- Pass city context along with day data ---
                const dayWithContext = { 
                    ...day, 
                    cityContext: { // Create a specific context object
                        name: city.city, 
                        country: city.country 
                    }
                }; 
                return (
                  <CrmItineraryDay
                    key={day.date || `day-${currentDayNumber}`}
                    day={dayWithContext} // Pass the modified day object with context
                    dayNumber={currentDayNumber}
                    travelersDetails={travelersDetails}
                    itineraryToken={itineraryToken}
                    inquiryToken={inquiryToken}
                    onUpdateItinerary={onUpdateItinerary}
                  />
                );
              })
            ) : (
              <p className="text-sm text-gray-500 italic p-4">No scheduled days for {city.city}.</p>
            );
            // No counter decrement needed as it increments globally

            return (
              <Disclosure defaultOpen={cityIndex === 0} key={city.cityCode || `city-${cityIndex}`} as="div" className="bg-white rounded-lg overflow-hidden shadow-md">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="sticky top-0 z-20 w-full text-left bg-gradient-to-r from-purple-600 to-indigo-600 p-4 shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75">
                      {/* City Header Content */}
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
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel as="div" className="p-4 space-y-0">
                        {cityDays}
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            );
          })}
        </div>

        {/* Right Column: Sticky Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-6 space-y-6">
             {/* Price Summary Section - Moved Here */}
             <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Price Summary</h3>
                 {loadingSettings ? (
                    <p className="text-sm text-gray-500">Loading pricing...</p>
                  ) : errorSettings ? (
                    <p className="text-sm text-red-500">Error: {errorSettings}</p>
                  ) : calculatedTotals ? (
                    <div className="space-y-2">
                      {/* --- Segment Breakdown --- */}
                      {Object.entries(calculatedTotals.segmentTotals).map(([segment, amount]) => (
                        amount > 0 && (
                          <div key={segment} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 capitalize">{segment}</span>
                            <span className="font-medium text-gray-700">{formatAmount(amount)}</span>
                          </div>
                        )
                      ))}
                      {/* --- End Segment Breakdown --- */}

                      {/* Divider before Subtotal if segments were shown */}
                      {Object.values(calculatedTotals.segmentTotals).some(amount => amount > 0) && (
                        <div className="pt-2 mt-2 border-t border-gray-100"></div>
                      )}

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-800">{formatAmount(calculatedTotals.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">TCS ({calculatedTotals.tcsRate}%)</span>
                        <span className="font-medium text-gray-800">{formatAmount(calculatedTotals.tcsAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-base font-bold pt-2 mt-2 border-t border-gray-200">
                        <span className="text-indigo-700">Grand Total</span>
                        <span className="text-indigo-700">{formatAmount(calculatedTotals.grandTotal)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Price details unavailable.</p>
                  )}
              </div>
              {/* Important Notes Section */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm text-xs text-yellow-800 space-y-2">
                <h4 className="font-semibold text-sm text-yellow-900 mb-1">Important Notes:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Flight quotes are typically valid for 15 minutes after search.</li>
                  <li>Hotel quotes are typically valid for 60 minutes after search.</li>
                  <li>Prices are dynamic and subject to change until booking is confirmed. A final price verification occurs before payment.</li>
                  <li>TCS (Tax Collected at Source) applies as per government regulations. See <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="underline font-medium hover:text-yellow-900">Terms & Conditions</a> for details.</li>
                </ul>
              </div>
              {/* End Important Notes Section */}
              {/* Action Buttons Section - Moved Here */}
              <div className="p-4 bg-white rounded-lg shadow-md space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Actions</h3>
                  <button
                    onClick={handleBookTrip}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2 font-medium"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Book Trip (Placeholder)
                  </button>
                  <button
                    onClick={handleModify}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    Modify Itinerary
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 transition duration-150 ease-in-out shadow-sm flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
                    Download PDF
                  </button>
              </div>



            </div>
          </div>
        </div>
      </div> 
  );
};

export default CrmItineraryDisplay;
