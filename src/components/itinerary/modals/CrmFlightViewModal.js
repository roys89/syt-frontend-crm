import { Dialog, Transition } from '@headlessui/react';
import {
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    CurrencyRupeeIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    MapPinIcon,
    PaperAirplaneIcon,
    ShoppingCartIcon, // For baggage
    TagIcon,
    XCircleIcon, // For non-refundable
    XMarkIcon
} from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';

// --- Helper Functions (Adapt or reuse) ---
const formatFlightTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  // Handle simple 'HH:MM AM/PM'
  if (timeString.match(/^\d{1,2}:\d{2} (AM|PM)$/i)) {
    return timeString.toUpperCase();
  }
  // Handle ISO 8601 format (e.g., "2024-07-10T10:00:00")
  if (timeString.includes('T') && timeString.includes(':')) {
    try {
      const date = new Date(timeString);
      return isNaN(date.getTime()) ? 'Invalid Time' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return 'Invalid Time'; }
  }
  return timeString; // Return as is if format is unknown
};

const formatFlightDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
   try {
     const date = new Date(dateString);
     // Adjust for potential timezone issues if the date string doesn't specify one
     const userTimezoneOffset = date.getTimezoneOffset() * 60000;
     const correctedDate = new Date(date.getTime() + userTimezoneOffset);
     return isNaN(correctedDate.getTime()) ? 'Invalid Date' : correctedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
   } catch (e) { return 'Invalid Date'; }
};

// Simple duration formatter (assuming '3h 55m' format or minutes number)
const formatFlightDuration = (duration) => {
  if (typeof duration === 'string') return duration;
  if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
    const h = Math.floor(duration / 60);
    const m = duration % 60;
    let durationStr = '';
    if (h > 0) durationStr += `${h}h`;
    if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m}m`;
    return durationStr || null;
  }
  return null;
};

const formatAmount = (amount, currency = 'INR') => {
  if (typeof amount !== 'number' || isNaN(amount)) return null;
  const symbols = { INR: '₹', USD: '$', EUR: '€' }; // Add more as needed
  const symbol = symbols[currency] || currency; // Fallback to currency code
  return `${symbol}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; // Assuming whole numbers often for flight fares
};
// --- End Helper Functions ---

// --- Sub-components for Readability ---
const DetailItem = ({ icon: Icon, label, value, className = '' }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
      <span className="font-medium text-gray-600 w-28 flex-shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => (
  <h4 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2 pt-3 border-t border-gray-100 first:pt-0 first:border-t-0">
    <Icon className="h-5 w-5 text-indigo-600" />
    {title}
  </h4>
);

// Component to render HTML safely
const DangerousHTML = ({ htmlContent }) => {
  if (!htmlContent) return null;
  // Basic sanitization example (replace with a robust library like DOMPurify if needed)
  const sanitizedHtml = htmlContent
      .replace(/<script.*?>.*?<\/script>/gi, '') // Remove script tags
      .replace(/onerror/gi, 'data-onerror'); // Defuse onerror attributes
  return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
};


// --- End Sub-components ---

const CrmFlightViewModal = ({ isOpen, onClose, flightData }) => {
  // Add console log before destructuring to check incoming data
  console.log("Data received by CrmFlightViewModal:", flightData);

  if (!flightData || !flightData.flightData) {
    console.error("CrmFlightViewModal: Invalid or missing nested flightData prop.");
    return null; // Check for nested flightData
  }
  console.log("flightData.flightData content:", flightData.flightData);

  // --- Extract Data ---
  const {
    flightProvider, // Main provider for display, could be same as airline
    flightCode,
    origin, // City name
    destination, // City name
    departureDate,
    departureTime,
    arrivalTime,
    airline, // Specific airline for the flight
    flightDuration,
    price, // Overall price (might use fareDetails.finalFare)
    originAirport, // { name, code, city, terminal }
    arrivalAirport, // { name, code, city, terminal }
    fareDetails, // { baseFare, taxAndSurcharge, finalFare, currency, isRefundable, isLowCost }
    segments, // Array: [{ baggage, cabinBaggage, flightNumber, origin, destination, departureTime, arrivalTime, duration (minutes), airline: { code, name } }]    fareRules,
    // SeatMap, MealOptions, BaggageOptions - For future use if needed
    bookingStatus, // Added from activity example, might apply
    bookingDetails, // Added from activity example
    metadata, // Added from activity example
    fareRules // This is where the error might originate if key is missing
  } = flightData.flightData;

  // --- Format Data ---
  const formattedDeptDate = formatFlightDate(departureDate);
  const formattedDeptTime = formatFlightTime(departureTime);
  const formattedArrivalTime = formatFlightTime(arrivalTime);
  const formattedDuration = formatFlightDuration(flightDuration);
  const finalFareFormatted = formatAmount(fareDetails?.finalFare || price, fareDetails?.currency);
  const baseFareFormatted = formatAmount(fareDetails?.baseFare, fareDetails?.currency);
  const taxFormatted = formatAmount(fareDetails?.taxAndSurcharge, fareDetails?.currency);

  const headerTitle = `${originAirport?.code || origin || '?'} → ${arrivalAirport?.code || destination || '?'}`;
  const subHeaderTitle = `${airline || flightProvider || ''} ${flightCode || ''}`.trim();

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gray-50 p-4 sm:p-5 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                      <div>
                           <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                             {headerTitle}
                           </Dialog.Title>
                           {subHeaderTitle && <p className="text-sm text-gray-500 mt-1">{subHeaderTitle}</p>}
                      </div>
                    <button
                      onClick={onClose}
                      className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      aria-label="Close modal"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">

                  {/* Section 1: Core Flight Summary */}
                  <div className="space-y-2.5">
                    <DetailItem icon={CalendarDaysIcon} label="Departure Date" value={formattedDeptDate} />
                    <DetailItem icon={ClockIcon} label="Departure Time" value={formattedDeptTime} />
                    <DetailItem icon={ClockIcon} label="Arrival Time" value={formattedArrivalTime} />
                    <DetailItem icon={ClockIcon} label="Duration" value={formattedDuration} />
                     {bookingStatus && (
                      <div className="flex items-center gap-2 text-sm pt-1">
                           <TagIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                           <span className="font-medium text-gray-600 w-28 flex-shrink-0">Status:</span>
                           <span className={`text-xs font-semibold px-2 py-0.5 rounded ${bookingStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                             {bookingStatus.toUpperCase()}
                           </span>
                      </div>
                     )}
                  </div>

                  {/* Section 2: Segments */}
                  {segments && segments.length > 0 && (
                    <div>
                      <SectionTitle icon={PaperAirplaneIcon} title={`Segment${segments.length > 1 ? 's' : ''}`} />
                      <div className="space-y-4">
                        {segments.map((segment, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50/70 space-y-2.5 text-sm">
                             <div className="flex justify-between items-center mb-1">
                               <p className="font-semibold text-gray-800">
                                   {segment.origin} → {segment.destination}
                               </p>
                               <p className="text-xs text-gray-500">
                                   {segment.airline?.name} ({segment.airline?.code}) {segment.flightNumber}
                               </p>
                             </div>
                             <DetailItem icon={ClockIcon} label="Departs" value={`${formatFlightDate(segment.departureTime)} at ${formatFlightTime(segment.departureTime)}`} />
                             <DetailItem icon={ClockIcon} label="Arrives" value={`${formatFlightDate(segment.arrivalTime)} at ${formatFlightTime(segment.arrivalTime)}`} />
                             <DetailItem icon={ClockIcon} label="Duration" value={formatFlightDuration(segment.duration)} />
                             <DetailItem icon={ShoppingCartIcon} label="Baggage" value={segment.baggage} />
                             <DetailItem icon={ShoppingCartIcon} label="Cabin Baggage" value={segment.cabinBaggage} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 3: Fare Details */}
                  {fareDetails && (
                    <div>
                      <SectionTitle icon={CurrencyRupeeIcon} title="Fare Details" />
                      <div className="space-y-2.5">
                        <DetailItem icon={CurrencyRupeeIcon} label="Base Fare" value={baseFareFormatted} />
                        <DetailItem icon={CurrencyRupeeIcon} label="Taxes & Fees" value={taxFormatted} />
                        <DetailItem icon={CurrencyRupeeIcon} label="Total Fare" value={finalFareFormatted} className="font-semibold !text-gray-900"/>
                        <DetailItem
                           icon={fareDetails.isRefundable ? CheckCircleIcon : XCircleIcon}
                           label="Refundable"
                           value={fareDetails.isRefundable ? 'Yes' : 'No'}
                           className={fareDetails.isRefundable ? 'text-green-700' : 'text-red-700'}
                         />
                         {typeof fareDetails.isLowCost === 'boolean' && (
                            <DetailItem
                              icon={InformationCircleIcon}
                              label="Type"
                              value={fareDetails.isLowCost ? 'Low Cost Carrier' : 'Full Service Carrier'}
                            />
                         )}
                      </div>
                    </div>
                  )}

                   {/* Section 4: Airport Details */}
                    <div>
                      <SectionTitle icon={MapPinIcon} title="Airport Information" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                          <div className="space-y-1.5 border-r md:border-r-gray-200 md:pr-4">
                              <p className="font-medium text-gray-600 mb-1">Origin ({originAirport?.code})</p>
                              <p className="text-gray-800">{originAirport?.name}</p>
                              {originAirport?.terminal && <p className="text-gray-600">Terminal: {originAirport.terminal}</p>}                              <p className="text-gray-600">{originAirport?.city}, {originAirport?.country}</p>                          </div>
                           <div className="space-y-1.5 md:pl-4">
                              <p className="font-medium text-gray-600 mb-1">Destination ({arrivalAirport?.code})</p>                              <p className="text-gray-800">{arrivalAirport?.name}</p>                              {arrivalAirport?.terminal && <p className="text-gray-600">Terminal: {arrivalAirport.terminal}</p>}                              <p className="text-gray-600">{arrivalAirport?.city}, {arrivalAirport?.country}</p>                         </div>
                      </div>
                    </div>


                  {/* Section 5: Fare Rules */}
                  {fareRules && (
                    <div>
                      <SectionTitle icon={ExclamationTriangleIcon} title="Fare Rules" />
                       {/* Render the HTML content carefully */}
                       <div className="prose prose-sm max-w-none p-3 border border-yellow-200 bg-yellow-50/80 rounded mt-1 text-yellow-900">
                           <DangerousHTML htmlContent={fareRules} />
                       </div>
                       <p className="text-xs text-gray-500 mt-1">Note: Fare rules are displayed as provided by the supplier and may contain HTML formatting.</p>
                    </div>
                  )}


                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
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

export default CrmFlightViewModal;
