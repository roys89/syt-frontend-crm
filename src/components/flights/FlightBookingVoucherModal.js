import { format } from 'date-fns';
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle, Clock, Clock10, Luggage, Mail, Phone, PlaneLanding, PlaneTakeoff, User } from 'lucide-react';
import React from 'react';

// Helper to format date/time
const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return 'N/A';
  try {
    return format(new Date(dateTimeString), 'dd MMM yyyy, HH:mm');
  } catch (e) {
    return 'Invalid Date';
  }
};

// Helper to format duration
const formatDuration = (durationMinutes) => {
  if (durationMinutes === null || durationMinutes === undefined) return 'N/A';
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  let formatted = '';
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0 || hours === 0) formatted += `${minutes}m`;
  return formatted.trim();
};

const FlightBookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
  if (!isOpen) return null;

  // Safely access nested data
  const itineraryResults = voucherDetails?.flight_itinerary?.responseData?.results;
  const itineraryItems = itineraryResults?.itineraryItems || [];
  const passengers = itineraryResults?.passengers || [];

  const getStatusIcon = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'PENDING':
        return <Clock10 className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-lg shadow-2xl w-full max-w-5xl mx-auto my-6 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0 bg-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-indigo-800">Booking Voucher</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-red-600 focus:outline-none p-1.5 rounded-full hover:bg-red-100 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="px-6 py-6 flex-grow overflow-y-auto">
          {voucherDetails ? (
            <div className="space-y-8">
              {/* Booking Status & Summary */}
              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> </svg>
                  Booking Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                  <div className="col-span-1">
                    <p className="text-sm font-medium text-gray-500">Booking Code</p>
                    <p className="font-semibold text-indigo-700 text-lg break-words">{voucherDetails.bmsBookingCode || 'N/A'}</p>
                  </div>
                  {voucherDetails.pnr && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Overall PNR</p>
                      <p className="font-semibold text-gray-800">{voucherDetails.pnr}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="font-semibold text-xl text-gray-800">
                      ₹{itineraryResults?.totalAmount?.toLocaleString('en-IN') || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Booking Date</p>
                    <p className="font-medium text-gray-700">
                      {formatDateTime(voucherDetails?.addtional_booking_details?.createdAt || voucherDetails?.flight_itinerary?.createdAt)}
                    </p>
                  </div>
                  <div className="col-span-2 md:col-span-1 flex items-center gap-2">
                     {getStatusIcon(voucherDetails.bookingStatus)}
                  <div>
                         <p className="text-sm font-medium text-gray-500">Status</p>
                         <p className={`font-semibold text-lg capitalize ${ 
                      voucherDetails.bookingStatus === 'CONFIRMED' 
                        ? 'text-green-600' 
                            : voucherDetails.bookingStatus === 'PENDING'
                            ? 'text-orange-600'
                        : 'text-red-600'
                    }`}>
                          {voucherDetails.bookingStatus?.toLowerCase() || 'N/A'}
                    </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flight Details - Iterate through itinerary items */}
              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /> </svg>
                    Flight Details
                  </h3>
                {itineraryItems.length > 0 ? (
                  itineraryItems.map((item, itemIndex) => {
                    const flight = item.itemFlight;
                    if (!flight) return null;
                    // Access the segments correctly - it's an array containing one array of segment objects
                    const physicalSegments = flight.segments?.[0] || [];

                    return (
                      <div key={item.itemCode || itemIndex} className="mb-6 last:mb-0 p-4 border border-gray-100 rounded-md bg-indigo-50/30">
                        <h4 className="text-lg font-semibold text-indigo-800 mb-3 border-b border-indigo-100 pb-2">
                          Journey: {flight.origin} <ArrowRight className="inline h-4 w-4 mx-1" /> {flight.destination}
                           <span className="text-sm font-normal text-gray-600 ml-3"> (PNR: {flight.pnrDetails?.[0]?.pnr || flight.pnr || 'N/A'})</span>
                        </h4>
                        <div className="space-y-4">
                          {physicalSegments.map((segment, segIndex) => (
                            <div key={segIndex}>
                              {/* Segment Separator and Layover Info (if not first segment) */} 
                              {segIndex > 0 && (
                                <div className="flex items-center gap-2 my-3 text-sm text-indigo-700 bg-indigo-100/50 px-3 py-1.5 rounded-full border border-indigo-200 w-fit mx-auto">
                                   <Clock className="h-4 w-4" />
                                  <span>Layover in {physicalSegments[segIndex-1].ds.cN} ({physicalSegments[segIndex-1].ds.aC}): {formatDuration(segment.gT)}</span>
                                </div>
                              )}
                              
                              {/* Segment Details Card */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                 <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                       <img 
                                          src={`https://pics.avs.io/40/24/${segment.al.alC}.png`} 
                                          alt={segment.al.alN}
                                          className="h-6 w-auto object-contain rounded-sm bg-gray-100 p-0.5 border border-gray-200"
                                          onError={(e) => { e.target.style.display = 'none'; /* Hide if image fails */ }}
                                        />
                                        <span className="font-semibold text-gray-800">{segment.al.alN} <span className="text-gray-500 font-normal">{segment.al.fN?.trim()}</span></span>
                                    </div>
                                    <span className="text-sm text-gray-600">Duration: {formatDuration(segment.dr)}</span>
                                 </div>
                                 
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    {/* Departure Info */}
                                    <div className="flex items-start gap-2">
                                      <PlaneTakeoff className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                                        <p className="font-medium text-gray-700">{segment.or.aC} <span className="text-gray-500">({segment.or.cN})</span></p>
                                        <p className="text-xs text-gray-500">{segment.or.aN}, Terminal {segment.or.tr || 'N/A'}</p>
                                        <p className="text-xs text-gray-600 font-medium mt-0.5">{formatDateTime(segment.or.dT)}</p>
                                      </div>
                    </div>
                                    {/* Arrival Info */}
                                    <div className="flex items-start gap-2">
                                      <PlaneLanding className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                                        <p className="font-medium text-gray-700">{segment.ds.aC} <span className="text-gray-500">({segment.ds.cN})</span></p>
                                        <p className="text-xs text-gray-500">{segment.ds.aN}, Terminal {segment.ds.tr || 'N/A'}</p>
                                        <p className="text-xs text-gray-600 font-medium mt-0.5">{formatDateTime(segment.ds.aT)}</p>
                                      </div>
                    </div>
                                     {/* Baggage Info */}
                                     <div className="flex items-start gap-2 col-span-1 md:col-span-2 border-t border-gray-100 pt-2 mt-1">
                                        <Luggage className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div>
                                            <p className="text-xs text-gray-500">
                                                Check-in: <span className="font-medium text-gray-700">{segment.bg || 'N/A'}</span> |
                                                Cabin: <span className="font-medium text-gray-700">{segment.cBg || 'N/A'}</span> |
                                                Class: <span className="font-medium text-gray-700">{segment.al?.fC || 'N/A'}</span>
                                            </p>
                                        </div>
                                     </div>
                    </div>
                  </div>
                </div>
              ))}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 p-4 text-center">No flight details found in itinerary.</p>
                )}
              </div>

               {/* Passenger Details */}
              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-3 flex items-center gap-2">
                  <User className="h-6 w-6 text-indigo-600" />
                  Passengers
                </h3>
                {passengers.length > 0 ? (
                  passengers.map((pax, index) => (
                     <div key={pax.id || index} className="mb-4 last:mb-0 p-4 border border-gray-100 rounded-md bg-indigo-50/30">
                      <div className="flex justify-between items-start mb-3 pb-2 border-b border-indigo-100">
                        <h4 className="text-lg font-semibold text-indigo-800">
                          {pax.title} {pax.firstName} {pax.lastName} 
                          <span className="text-base font-normal text-gray-600 ml-2">({pax.paxTypeName || 'N/A'})</span>
                        </h4>
                         {pax.isLeadPax && <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">Lead Pax</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3 text-sm mb-3">
                        <div className="flex items-center gap-2">
                           <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                           <span className="font-medium text-gray-700 break-all">{pax.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                           <span className="font-medium text-gray-700">{pax.contactNumber ? `${pax.cellCountryCode || ''}-${pax.contactNumber}` : 'N/A'}</span>
                        </div>
                         {pax.dateOfBirth && (
                          <div className="flex items-center gap-2">
                             <CalendarDays className="h-4 w-4 text-gray-500 flex-shrink-0" />
                             <span className="font-medium text-gray-700">{format(new Date(pax.dateOfBirth), 'dd MMM yyyy')}</span>
                          </div>
                        )}
                      </div>
                      {/* Display selected SSR */}
                      {(pax.ssr?.seat?.length > 0 || pax.ssr?.baggage?.length > 0 || pax.ssr?.meal?.length > 0) && (
                        <div className="mt-3 pt-3 border-t border-indigo-100">
                          <h5 className="text-base font-medium text-gray-700 mb-2">Selected Extras:</h5>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                             {pax.ssr.seat?.map((s, i) => <div key={`seat-${i}`} className="text-gray-600"><span className="font-medium text-indigo-700">{s.code} Seat</span> ({s.origin}→{s.destination}) - ₹{s.amt}</div>)}
                             {pax.ssr.baggage?.map((b, i) => <div key={`bag-${i}`} className="text-gray-600"><span className="font-medium text-indigo-700">{b.dsc} Baggage</span> ({b.origin}→{b.destination}) - ₹{b.amt}</div>)}
                             {pax.ssr.meal?.map((m, i) => <div key={`meal-${i}`} className="text-gray-600"><span className="font-medium text-indigo-700">{m.dsc} Meal</span> ({m.origin}→{m.destination}) - ₹{m.amt}</div>)}
                           </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                   <p className="text-sm text-gray-500 p-4 text-center">No passenger details found.</p>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-12">
              {/* Add a simple loading spinner */} 
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 font-medium">Loading voucher details...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-white rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingVoucherModal; 