import { BriefcaseIcon, CheckCircleIcon, ShoppingBagIcon, TicketIcon, XCircleIcon } from '@heroicons/react/24/outline'; // Using outline icons
import { X } from 'lucide-react';
import React from 'react';

// Helper to format currency consistently
const formatCurrency = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    // Simple formatting for now, enhance as needed
    return `${currencyCode} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const CrmAddFlightDetailsModal = ({ isOpen, onClose, onConfirm, flightDetails, isLoading }) => {
    if (!isOpen || !flightDetails) return null;

    // Safely extract data with defaults
    const {
        airline,
        flightCode,
        origin,
        destination,
        departureDate,
        departureTime,
        arrivalTime,
        flightDuration,
        originAirport,
        arrivalAirport,
        fareDetails,
        segments = [],
        fareRules,
        seatMap = [],
        mealOptions = [],
        baggageOptions = []
    } = flightDetails;

    const firstSegment = segments[0] || {};
    const checkInBaggage = firstSegment.baggage || 'N/A';
    const cabinBaggage = firstSegment.cabinBaggage || 'N/A';

    // Basic check for ancillary availability
    const hasSeatMap = seatMap.length > 0 && seatMap[0]?.rows?.length > 0;
    const hasMealOptions = mealOptions.length > 0 && mealOptions[0]?.options?.length > 0;
    const hasExtraBaggage = baggageOptions.length > 0 && baggageOptions[0]?.options?.length > 0;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex justify-between items-center rounded-t-lg z-10">
                    <h2 className="text-xl font-semibold text-gray-800">
                        Confirm Flight Details
                    </h2>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1.5 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-grow overflow-y-auto p-5 space-y-5">
                    {/* Flight Summary */}
                    <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                         <div className="flex justify-between items-start mb-3">
                            <div>
                                <p className="text-sm text-gray-500">Airline</p>
                                <p className="text-lg font-semibold text-gray-900">{airline || 'N/A'} ({flightCode || 'N/A'})</p>
                            </div>
                             <div className="text-right">
                                <p className="text-sm text-gray-500">Total Price</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {formatCurrency(fareDetails?.finalFare, fareDetails?.currency)}
                                </p>
                            </div>
                         </div>
                         <div className="grid grid-cols-3 gap-4 text-center text-sm text-gray-700">
                            <div>
                                <p className="font-semibold text-base">{departureTime || 'N/A'}</p>
                                <p>{originAirport?.code || origin || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{originAirport?.name || ''}</p>
                                <p className="text-xs text-gray-500">{departureDate ? new Date(departureDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                             <div className="self-center">
                                <p className="text-gray-500">{flightDuration || 'N/A'}</p>
                                <div className="w-full h-px bg-gray-300 my-1"></div>
                                <p className="text-gray-500">{fareDetails?.isLowCost ? 'LCC' : 'Full Service'}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-base">{arrivalTime || 'N/A'}</p>
                                <p>{arrivalAirport?.code || destination || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{arrivalAirport?.name || ''}</p>
                                {/* Arrival date might be different, check landingTime */}
                                <p className="text-xs text-gray-500">{flightDetails.landingTime ? new Date(flightDetails.landingTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</p>
                            </div>
                         </div>
                    </div>
                    
                    {/* Fare & Baggage Details */}
                    <div className="space-y-3">
                        <h3 className="text-md font-semibold text-gray-700 border-b pb-1">Fare & Baggage</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                             <div>
                                <p><span className="font-medium text-gray-600">Base Fare:</span> {formatCurrency(fareDetails?.baseFare, fareDetails?.currency)}</p>
                                <p><span className="font-medium text-gray-600">Taxes & Surcharges:</span> {formatCurrency(fareDetails?.taxAndSurcharge, fareDetails?.currency)}</p>
                                {fareDetails?.serviceFee > 0 && 
                                    <p><span className="font-medium text-gray-600">Service Fee:</span> {formatCurrency(fareDetails?.serviceFee, fareDetails?.currency)}</p>
                                }
                                <p className="font-bold"><span className="font-medium text-gray-600">Total:</span> {formatCurrency(fareDetails?.finalFare, fareDetails?.currency)}</p>
                             </div>
                             <div>
                                <p><span className="font-medium text-gray-600">Check-in Baggage:</span> {checkInBaggage}</p>
                                <p><span className="font-medium text-gray-600">Cabin Baggage:</span> {cabinBaggage}</p>
                                <p className={fareDetails?.isRefundable ? 'text-green-600' : 'text-red-600'}>
                                    {fareDetails?.isRefundable ? 
                                        <><CheckCircleIcon className="h-4 w-4 inline mr-1"/> Refundable</> : 
                                        <><XCircleIcon className="h-4 w-4 inline mr-1"/> Non-Refundable</>
                                    }
                                </p>
                             </div>
                        </div>
                    </div>

                    {/* Fare Rules */}
                    {fareRules && (
                        <div>
                            <h3 className="text-md font-semibold text-gray-700 border-b pb-1 mb-2">Fare Rules</h3>
                            {/* Use dangerouslySetInnerHTML carefully, assuming rules are trusted HTML */}
                             <div 
                                className="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-3 rounded border border-gray-200"
                                dangerouslySetInnerHTML={{ __html: fareRules }} 
                             />
                        </div>
                    )}

                    {/* Ancillaries Availability */}
                     <div>
                         <h3 className="text-md font-semibold text-gray-700 border-b pb-1 mb-2">Optional Add-ons</h3>
                         <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className={hasSeatMap ? 'text-green-600' : 'text-gray-400'}>
                                <TicketIcon className="h-4 w-4 inline mr-1"/> Seats {hasSeatMap ? 'Available' : 'Unavailable'}
                            </span>
                            <span className={hasMealOptions ? 'text-green-600' : 'text-gray-400'}>
                                 <BriefcaseIcon className="h-4 w-4 inline mr-1"/> Meals {hasMealOptions ? 'Available' : 'Unavailable'}
                            </span>
                             <span className={hasExtraBaggage ? 'text-green-600' : 'text-gray-400'}>
                                 <ShoppingBagIcon className="h-4 w-4 inline mr-1"/> Extra Baggage {hasExtraBaggage ? 'Available' : 'Unavailable'}
                             </span>
                         </div>
                         <p className="text-xs text-gray-500 mt-1">Note: Specific seats, meals, and extra baggage can be added after booking, if available.</p>
                     </div>

                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200 rounded-b-lg flex justify-end gap-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="px-5 py-2 rounded-md text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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