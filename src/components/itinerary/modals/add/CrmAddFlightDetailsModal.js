import {
    ArrowRightIcon,
    BriefcaseIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    ClockIcon,
    InformationCircleIcon,
    MapPinIcon,
    PaperAirplaneIcon,
    ShoppingBagIcon,
    TicketIcon,
    UserGroupIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import { X } from 'lucide-react';
import React from 'react';

// Helper to format currency consistently
const formatCurrency = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    return `${currencyCode} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return 'Invalid Date';
    }
};

// Helper to format time
const formatTime = (timeString, dateString) => {
    if (!timeString) return 'N/A';
    // If timeString looks like HH:MM AM/PM, use it directly
    if (/^\d{1,2}:\d{2}\s(AM|PM)$/i.test(timeString)) {
        return timeString;
    }
    // Otherwise, assume it might be part of a full timestamp in dateString or just HH:MM
    if (dateString) {
        try {
            // Combine date and time if timeString is just HH:MM or similar
            const dateTimeStr = dateString.includes('T') ? dateString.replace(/T.*/, `T${timeString}`) : `${dateString}T${timeString}`;
             return new Date(dateTimeStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
         } catch (e) { /* fallback */ }
    }
     // Basic fallback if direct parsing or combination fails
    return timeString;
};

// Helper to format duration (minutes to Xh Ym)
const formatDuration = (minutes) => {
    if (typeof minutes !== 'number' || isNaN(minutes) || minutes < 0) {
        return 'N/A';
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    let durationStr = '';
    if (hours > 0) {
        durationStr += `${hours}h`;
    }
    if (mins > 0) {
        durationStr += ` ${mins}m`;
    }
    return durationStr.trim() || '0m'; // Return '0m' if duration is 0
};

// Cabin Class Map (copied for consistency)
const cabinClassMap = {
    1: "All",
    2: "Economy",
    3: "Premium Economy",
    4: "Business",
    5: "Premium Business",
    6: "First"
};
const getCabinClassName = (code) => cabinClassMap[code] || 'Unknown';

const CrmAddFlightDetailsModal = ({ isOpen, onClose, onConfirm, flightDetails, isLoading }) => {
    if (!isOpen || !flightDetails) return null;

    // --- Enhanced Data Extraction ---
    const {
        airline,
        origin,
        destination,
        departureDate,
        landingTime,
        flightDuration,
        originAirport,
        arrivalAirport,
        fareDetails,
        segments = [],
        fareRules,
        seatMap = [],
        mealOptions = [],
        baggageOptions = [],
        bookingDetails,
        metadata
    } = flightDetails;

    const stops = segments.length - 1;
    const fareIdentifierName = bookingDetails?.fareIdentifier?.name;
    const isLCC = fareDetails?.isLowCost ?? metadata?.isLowCostCarrier ?? false;

    // Use helper functions for overall dates
    const formattedOverallDepartureDate = formatDate(departureDate);
    const formattedOverallArrivalDate = formatDate(landingTime);
    
    // Ancillary checks (unchanged)
    const hasSeatMap = seatMap.length > 0 && seatMap.some(s => s.rows?.length > 0);
    const hasMealOptions = mealOptions.length > 0 && mealOptions.some(m => m.options?.length > 0);
    const hasExtraBaggage = baggageOptions.length > 0 && baggageOptions.some(b => b.options?.length > 0);
    // --- End Data Extraction ---

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg z-10">
                    <h2 className="text-xl font-semibold text-gray-800">Confirm Flight Details</h2>
                    <button onClick={onClose} disabled={isLoading} className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50" aria-label="Close modal">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-gray-50/50"> 
                    
                    {/* Top Summary Section */} 
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                             {/* Left: Airline & Route */}
                             <div className="flex items-center gap-3">
                                <img 
                                     src={`https://pics.avs.io/80/40/${segments[0]?.airline?.code || ''}.png`} 
                                     alt={`${airline || 'Airline'} logo`} 
                                     className="h-10 w-auto object-contain flex-shrink-0 rounded"
                                     onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                 <div>
                                     <p className="text-lg font-bold text-gray-900">{airline || 'N/A'}</p>
                                     <p className="text-sm text-gray-600">
                                         {originAirport?.city || origin || 'N/A'} ({originAirport?.code || 'N/A'}) 
                                         <ArrowRightIcon className="w-4 h-4 inline mx-1 text-gray-400"/> 
                                         {arrivalAirport?.city || destination || 'N/A'} ({arrivalAirport?.code || 'N/A'})
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formattedOverallDepartureDate} - {formattedOverallArrivalDate}
                                    </p>
                                 </div>
                             </div>
                              {/* Right: Price & Duration */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-gray-500">Total Price</p>
                                <p className="text-2xl font-bold text-[#093923]">
                                    {formatCurrency(fareDetails?.finalFare, fareDetails?.currency)}
                                </p>
                                 <p className="text-sm text-gray-600 mt-1">Total Duration: {flightDuration || 'N/A'} ({stops === 0 ? 'Direct' : `${stops} Stop${stops > 1 ? 's' : ''}`})</p>
                                  {fareIdentifierName && <span className="mt-1 text-xs bg-[#e6f2ed] text-[#093923] px-1.5 py-0.5 rounded-full inline-block font-medium">{fareIdentifierName}</span>}
                            </div>
                         </div>
                    </div>
                    
                    {/* Segments & Layovers Section */} 
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Flight Segments</h3>
                         <div className="space-y-4">
                            {segments.map((segment, index) => {
                                const segmentDepartureTime = formatTime(segment.departureTime, segment.departureTime); // Pass full timestamp if available
                                const segmentArrivalTime = formatTime(segment.arrivalTime, segment.arrivalTime);
                                const segmentDepartureDate = formatDate(segment.departureTime);
                                const segmentArrivalDate = formatDate(segment.arrivalTime);
                                const segmentDuration = formatDuration(segment.duration);
                                const segmentCabinClass = getCabinClassName(segment.cC); // Check if cC exists
                                const segmentOperatingAirline = segment.airline?.name;
                                const showSegmentOperating = segmentOperatingAirline && airline && segmentOperatingAirline !== airline;
                                const layoverTimeMins = index > 0 ? segments[index-1]?.groundTime : null; // Ground time is AFTER the previous segment

                                return (
                                    <React.Fragment key={index}>
                                        {/* Layover Info Section */} 
                                        {layoverTimeMins !== null && layoverTimeMins > 0 && (
                                            <div className="relative my-3 flex justify-center items-center">
                                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                                    <div className="w-full border-t border-dashed border-gray-300"></div>
                                                </div>
                                                <div className="relative bg-gray-50/50 px-3">
                                                     <span className="text-sm font-medium text-gray-600">
                                                         Layover: {formatDuration(layoverTimeMins)} in {segments[index-1]?.destination || 'N/A'} ({segments[index-1]?.arrivalAirport?.code || 'N/A'})
                                                     </span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Segment Card */}
                                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-3">
                                                <div className="flex items-center gap-2">
                                                    <PaperAirplaneIcon className="w-5 h-5 text-[#13804e] flex-shrink-0"/>
                                                     <div>
                                                        <p className="text-base font-semibold text-gray-800">
                                                            {segment.airline?.name || airline || 'N/A'} - {segment.flightNumber || 'N/A'}
                                                        </p>
                                                         {showSegmentOperating && (
                                                             <p className="text-xs text-gray-500 italic">Operated by {segmentOperatingAirline}</p>
                                                         )}
                                                     </div>
                                                </div>
                                                <div className="text-sm text-gray-600 sm:text-right flex-shrink-0">
                                                     <p>Duration: {segmentDuration}</p>
                                                     {segmentCabinClass !== 'Unknown' && 
                                                         <p className="flex items-center justify-end"><UserGroupIcon className="w-4 h-4 mr-1 inline"/> {segmentCabinClass}</p>
                                                     }
                                                </div>
                                            </div>
                                            
                                             <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2 text-sm border-t pt-3">
                                                 {/* Departure */}
                                                 <div className="space-y-0.5">
                                                      <p className="text-gray-500 flex items-center"><MapPinIcon className="w-4 h-4 mr-1 inline"/> From</p>
                                                     <p className="font-medium">{segment.origin || 'N/A'} ({segment.originAirport?.code || 'N/A'})</p>
                                                     <p className="text-xs text-gray-500">{segment.originAirport?.name || ''}</p>
                                                      {segment.originAirport?.terminal && <p className="text-xs">Terminal: {segment.originAirport.terminal}</p>}
                                                     <p className="text-gray-600 flex items-center text-xs"><CalendarDaysIcon className="w-3 h-3 mr-1 inline"/> {segmentDepartureDate}</p>
                                                     <p className="text-gray-600 flex items-center text-xs"><ClockIcon className="w-3 h-3 mr-1 inline"/> {segmentDepartureTime}</p>
                                                 </div>
                                                 {/* Arrival */}
                                                 <div className="space-y-0.5 md:col-start-3 md:text-right">
                                                      <p className="text-gray-500 flex items-center md:justify-end"><MapPinIcon className="w-4 h-4 mr-1 inline"/> To</p>
                                                     <p className="font-medium">{segment.destination || 'N/A'} ({segment.destinationAirport?.code || 'N/A'})</p>
                                                     <p className="text-xs text-gray-500">{segment.destinationAirport?.name || ''}</p>
                                                     {segment.destinationAirport?.terminal && <p className="text-xs">Terminal: {segment.destinationAirport.terminal}</p>}
                                                      <p className="text-gray-600 flex items-center md:justify-end text-xs"><CalendarDaysIcon className="w-3 h-3 mr-1 inline"/> {segmentArrivalDate}</p>
                                                      <p className="text-gray-600 flex items-center md:justify-end text-xs"><ClockIcon className="w-3 h-3 mr-1 inline"/> {segmentArrivalTime}</p>
                                                 </div>
                                            </div>
                                            {/* Segment Baggage */}
                                            <div className="border-t mt-3 pt-2 text-xs text-gray-600 space-x-4">
                                                <span><span className="font-medium">Check-in:</span> {segment.baggage || 'N/A'}</span>
                                                <span><span className="font-medium">Cabin:</span> {segment.cabinBaggage || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Fare & Policy Section */} 
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Fare & Policy</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            {/* Fare Breakdown */}
                            <div className="space-y-1">
                                <h4 className="font-medium text-gray-700 mb-1">Fare Breakdown</h4>
                                <p><span className="text-gray-600">Base Fare:</span> {formatCurrency(fareDetails?.baseFare, fareDetails?.currency)}</p>
                                <p><span className="text-gray-600">Taxes & Surcharges:</span> {formatCurrency(fareDetails?.taxAndSurcharge, fareDetails?.currency)}</p>
                                {(fareDetails?.serviceFee ?? 0) > 0 && 
                                    <p><span className="text-gray-600">Service Fee:</span> {formatCurrency(fareDetails?.serviceFee, fareDetails?.currency)}</p>
                                }
                                <p className="font-bold mt-1 border-t pt-1"><span className="text-gray-700">Total Price:</span> {formatCurrency(fareDetails?.finalFare, fareDetails?.currency)}</p>
                            </div>
                            {/* Refundability */}
                            <div className="space-y-1">
                                 <h4 className="font-medium text-gray-700 mb-1">Refund Policy</h4>
                                <p className={`flex items-center ${fareDetails?.isRefundable ? 'text-[#13804e]' : 'text-red-600'}`}>
                                    {fareDetails?.isRefundable ? 
                                        <><CheckCircleIcon className="h-5 w-5 inline mr-1.5"/> Refundable</> : 
                                        <><XCircleIcon className="h-5 w-5 inline mr-1.5"/> Non-Refundable</>
                                    }
                                </p>
                                <p className="text-xs text-gray-500">Note: Airline cancellation/change fees may apply as per fare rules.</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Ancillaries Availability Section */} 
                     <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                         <h3 className="text-lg font-semibold text-gray-800 mb-3">Optional Add-ons</h3>
                         <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
                             <span className={`flex items-center ${hasSeatMap ? 'text-[#13804e]' : 'text-gray-400'}`}>
                                 <TicketIcon className="h-5 w-5 inline mr-1.5"/> Seats {hasSeatMap ? 'Available' : 'Unavailable'}
                            </span>
                             <span className={`flex items-center ${hasMealOptions ? 'text-[#13804e]' : 'text-gray-400'}`}>
                                 <BriefcaseIcon className="h-5 w-5 inline mr-1.5"/> Meals {hasMealOptions ? 'Available' : 'Unavailable'}
                            </span>
                             <span className={`flex items-center ${hasExtraBaggage ? 'text-[#13804e]' : 'text-gray-400'}`}>
                                 <ShoppingBagIcon className="h-5 w-5 inline mr-1.5"/> Extra Baggage {hasExtraBaggage ? 'Available' : 'Unavailable'}
                             </span>
                         </div>
                         <p className="text-xs text-gray-500 mt-2 flex items-start">
                            <InformationCircleIcon className="w-3.5 h-3.5 mr-1 mt-0.5 flex-shrink-0"/>
                            <span>Specific add-ons can typically be purchased after booking confirmation via the airline's website, subject to availability and fees.</span>
                         </p>
                     </div>

                    {/* Fare Rules Section */} 
                    {fareRules && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <details> 
                                <summary className="text-lg font-semibold text-gray-800 cursor-pointer hover:text-[#13804e]">Fare Rules</summary>
                                <div 
                                    className="prose prose-sm max-w-none text-gray-600 bg-gray-50/50 p-3 rounded border border-gray-100 mt-2 max-h-48 overflow-y-auto" 
                                    dangerouslySetInnerHTML={{ __html: fareRules }} 
                                />
                            </details>
                        </div>
                    )}

                </div>

                {/* Footer */} 
                <div className="sticky bottom-0 bg-gray-100 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-5 py-2 rounded-md text-white text-sm font-medium bg-[#093923] hover:bg-[#13804e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[150px]`}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                            </>
                        ) : (
                            'Confirm & Add Flight'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrmAddFlightDetailsModal; 