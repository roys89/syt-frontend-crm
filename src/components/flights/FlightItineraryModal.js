import { format } from 'date-fns';
import { AlertTriangle, Briefcase, Calendar, ChevronDown, ChevronUp, Clock, HelpCircle, Plane, Shield } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import bookingService from '../../services/bookingService';
import FlightAncillarySelectionModal from './FlightAncillarySelectionModal';
import PassengerInfoModal from './PassengerInfoModal';

const FlightItineraryModal = ({ itineraryDetails, onClose, onBookNow }) => {
  const [activeTab, setActiveTab] = useState('flightDetails');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [travelers, setTravelers] = useState(1);
  const [showPassengerInfo, setShowPassengerInfo] = useState(false);
  const [isAllocated, setIsAllocated] = useState(false);
  const [priceDetails, setPriceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSegment, setExpandedSegment] = useState(null);
  const [passengerFormData, setPassengerFormData] = useState(null);
  
  // --- New State for Ancillary Modal ---
  const [showAncillaryModal, setShowAncillaryModal] = useState(false);
  const [dataForAncillaryModal, setDataForAncillaryModal] = useState(null);
  const [confirmedAncillaries, setConfirmedAncillaries] = useState(null);
  const [ancillariesConfirmed, setAncillariesConfirmed] = useState(false);
  const [ancillaryCost, setAncillaryCost] = useState(0);
  // ------------------------------------

  const handleBookNow = async () => {
    // Ensure passengers are allocated AND ancillaries are confirmed before booking
    if (!isAllocated) {
        toast.error("Please allocate passengers first.");
        setShowPassengerInfo(true); // Re-open passenger info if not allocated
        return;
    }
    if (!ancillariesConfirmed) {
        toast.error("Please confirm seat and ancillary selections.");
        // Ensure data is available before potentially reopening ancillary modal
        if (passengerFormData) { // Check if we have data from initial success
            setDataForAncillaryModal(passengerFormData);
            setShowAncillaryModal(true); 
        } else {
            toast.error("Passenger details missing, please add them first.");
      setShowPassengerInfo(true);
        }
      return;
    }

    try {
      setIsLoading(true);
      // Use the latest traceId and itineraryCode (potentially updated by recheck/allocation)
      const traceIdToUse = priceDetails?.traceIdDetails?.traceId || itineraryDetails?.data?.results?.traceId;
      const itineraryCodeToUse = priceDetails?.itineraryCode || itineraryDetails?.data?.results?.itineraryCode;

      // ** TODO: Before booking, potentially make an API call to SAVE confirmedAncillaries **
      // This depends on backend design - ancillaries might be saved implicitly during booking
      // or require a separate save step.
      if (confirmedAncillaries) {
          console.log("Simulating saving ancillaries before final booking:", confirmedAncillaries);
          // Example: await bookingService.saveAncillarySelections(traceIdToUse, itineraryCodeToUse, confirmedAncillaries);
      }

      const response = await bookingService.bookFlight({
        provider: 'TC',
        traceId: traceIdToUse,
        itineraryCode: itineraryCodeToUse
      });

      if (response.success) {
        toast.success('Flight booked successfully!');
        // ** CRITICAL: This calls the page's handleBookingSuccess **
        if (onBookNow) { // Check if the prop exists
          console.log("!!! FlightItineraryModal: Calling onBookNow prop with data:", response.data); // Add log
          onBookNow(response.data); // Pass the booking response data
        }
        // onClose(); // Let the page handle closing/state change
      } else {
        throw new Error(response.message || 'Failed to book flight');
      }
    } catch (error) {
      console.error('Error booking flight:', error);
      toast.error(error.message || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassengerSuccess = (response) => {
    // 'response' is the formData collected from PassengerInfoModal
    console.log("handlePassengerSuccess received data:", response); 
    setIsAllocated(true); // Mark as allocated once passenger info is submitted
    setShowPassengerInfo(false); // Close passenger modal
    setPassengerFormData(response); // Store passenger form data for general use

    // Price update logic (if response contains recheck info - adjust as needed)
    if (response.recheck) {
      console.log("Passenger success response included recheck data:", response.recheck);
      setPriceDetails(response.recheck);
      if (response.recheck.isPriceChanged) {
        // Update overall itinerary state if necessary (better handled via prop updates)
        console.warn("Price changed during passenger info step - UI might need update.");
      }
    }

    // --- Check if any ancillary options exist before opening modal ---
    let hasAnyAncillaries = false;
    try {
      const items = itineraryDetails?.data?.results?.itineraryItems;
      if (items && Array.isArray(items)) {
        hasAnyAncillaries = items.some(item => {
          const ssr = item?.itemFlight?.ssr;
          const hasSeats = ssr?.seat?.some(s => s?.rowSeats?.length > 0);
          const hasBaggage = ssr?.baggage?.some(b => b?.options?.length > 0);
          const hasMeals = ssr?.meal?.some(m => m?.options?.length > 0);
          return hasSeats || hasBaggage || hasMeals;
        });
      }
    } catch (e) {
      console.error("Error checking for ancillaries:", e);
      hasAnyAncillaries = true; // Default to showing modal on error
    }

    if (hasAnyAncillaries) {
      console.log("Ancillary options found, setting data and opening modal.");
      setDataForAncillaryModal(response); // Set data specifically for the modal
      setShowAncillaryModal(true); // Now open the modal
    } else {
      console.log("No ancillary options found, proceeding to allocate/recheck.");
      // If no ancillaries, finalize allocation/recheck immediately
      const finalPassengerData = Object.entries(response).map(([paxId, data]) => ({
        ...data,
        // Determine lead pax based on data structure or assume first is lead
        isLeadPax: passengerFormData ? (passengerFormData[paxId]?.isLeadPax || paxId === '1') : paxId === '1',
        ssr: { seat: [], baggage: [], meal: [] } // Empty SSR
      }));
      handleAllocateAndRecheck(finalPassengerData); 
      setAncillariesConfirmed(true); // Mark as confirmed (no ancillaries needed)
    }
    // ----------------------------------------------------------------
  };

  // --- New Handler for Ancillary Success ---
  const handleAncillarySuccess = async (passengerDataWithSsr) => {
      console.log("Ancillaries selected, final passenger data:", passengerDataWithSsr);
      setConfirmedAncillaries(passengerDataWithSsr); // Store the final combined data

      // Calculate cost from selections (passengerDataWithSsr now includes ssr)
      let currentAncillaryCost = 0;
      passengerDataWithSsr.forEach(pax => {
          pax.ssr?.seat?.forEach(seat => { currentAncillaryCost += seat.amt || 0; });
          pax.ssr?.baggage?.forEach(bag => { currentAncillaryCost += bag.amt || 0; });
          pax.ssr?.meal?.forEach(meal => { currentAncillaryCost += meal.amt || 0; });
      });
      console.log("Calculated ancillary cost:", currentAncillaryCost);
      setAncillaryCost(currentAncillaryCost);

      setAncillariesConfirmed(true);
      setShowAncillaryModal(false);
      setDataForAncillaryModal(null); // Clear modal-specific data

      // Call allocate/recheck with the final combined passenger+ssr data
      handleAllocateAndRecheck(passengerDataWithSsr);

      toast.success("Seats & Extras confirmed. Ready to book.");
  };
  // ----------------------------------------

  // --- Helper function to handle allocation and recheck --- 
  const handleAllocateAndRecheck = async (passengerDataWithSsr) => {
      setIsLoading(true);
      try {
          const traceIdToUse = priceDetails?.traceIdDetails?.traceId || itineraryDetails?.data?.results?.traceId;
          const itineraryCodeToUse = priceDetails?.itineraryCode || itineraryDetails?.data?.results?.itineraryCode;

          if (!traceIdToUse || !itineraryCodeToUse) {
              throw new Error("Missing Trace ID or Itinerary Code for allocation.");
          }

          // Format for bookingArray structure expected by backend
          const bookingArray = [{
              traceId: traceIdToUse,
              passengers: passengerDataWithSsr // Pass the final data with SSR included
          }];

          console.log("Calling allocatePassengers with data:", JSON.stringify(bookingArray, null, 2));

          // Call API to allocate passengers (now includes SSR)
          const allocateResponse = await bookingService.allocatePassengers({
              provider: 'TC',
              bookingArray,
              itineraryCode: itineraryCodeToUse
          });

          console.log("Allocate response:", allocateResponse);
          if (!allocateResponse.success) {
              throw new Error(allocateResponse.message || 'Failed to allocate passengers');
          }

          // Call rate recheck API using potentially updated traceId from allocation
          const recheckTraceId = allocateResponse.data?.traceId || traceIdToUse;
          const recheckItineraryCode = allocateResponse.data?.itineraryCode || itineraryCodeToUse;

          console.log(`Rechecking rate with TraceID: ${recheckTraceId}, ItineraryCode: ${recheckItineraryCode}`);

          const recheckResponse = await bookingService.recheckRate({
              provider: 'TC',
              traceId: recheckTraceId,
              itineraryCode: recheckItineraryCode
          });

           console.log("Recheck response:", recheckResponse);
          if (!recheckResponse.success) {
             // Handle recheck failure? Maybe allow booking anyway but show warning?
             toast.error(recheckResponse.message || 'Failed to recheck rate after allocation, proceeding with previous price.');
             // Keep existing priceDetails if recheck fails?
          } else {
             // Update price details state with the latest info
             setPriceDetails(recheckResponse.data);
             // Show price change alert if needed
             if (recheckResponse.data.isPriceChanged || recheckResponse.data.isBaggageChanged) {
                 const priceDiff = (recheckResponse.data.totalAmount || 0) - (recheckResponse.data.previousTotalAmount || 0);
                 const message = `Price/Baggage updated. ${priceDiff >= 0 ? 'Increase' : 'Decrease'} of ₹${Math.abs(priceDiff).toLocaleString()}. Previous: ₹${recheckResponse.data.previousTotalAmount?.toLocaleString()}, New: ₹${recheckResponse.data.totalAmount?.toLocaleString()}.`;
                 toast.warning(message, { duration: 6000 }); // Longer duration for important info
    }
          }

          setIsAllocated(true); // Mark allocation as successful

      } catch (error) {
          console.error('Error in passenger allocation/recheck process:', error);
          toast.error(error.message || 'Failed to process passenger/ancillary information');
          setIsAllocated(false); // Allocation failed
          setAncillariesConfirmed(false); // Reset ancillary confirmation
      } finally {
          setIsLoading(false);
      }
  };
  // ----------------------------------------

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      return format(new Date(timeStr), 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error, timeStr);
      return 'Invalid time';
    }
  };

  const formatDate = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      return format(new Date(timeStr), 'dd MMM yyyy');
    } catch (error) {
      console.error('Error formatting date:', error, timeStr);
      return 'Invalid date';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  const toggleSegmentExpand = (index) => {
    if (expandedSegment === index) {
      setExpandedSegment(null);
    } else {
      setExpandedSegment(index);
    }
  };

  // Extract data from itineraryDetails
  const results = itineraryDetails?.data?.results;
  const itineraryItems = results?.itineraryItems || [];
  const isInternational = results?.isDomestic === false;
  const flightType = itineraryDetails?.flightType || 
    (isInternational ? 'INTERNATIONAL_ROUND_TRIP' : 
     (itineraryItems.length > 1 ? 'DOMESTIC_ROUND_TRIP' : 'ONE_WAY'));

  const outboundFlightItem = itineraryItems[0] || {};
  const inboundFlightItem = flightType === 'DOMESTIC_ROUND_TRIP' ? (itineraryItems[1] || {}) : null;
  const internationalReturnSegments = flightType === 'INTERNATIONAL_ROUND_TRIP' ? outboundFlightItem.itemFlight?.segments?.[1] : null;

  const getFlight = (item) => item?.itemFlight || {};
  const getSegments = (itemFlight, legIndex = 0) => {
    if (flightType === 'INTERNATIONAL_ROUND_TRIP') {
      // International SSR data might be structured differently, need to check API response
      // For now, assume segments[legIndex] holds the main flight details
      return itemFlight?.segments?.[legIndex] || [];
    }
    // For ONE_WAY and DOMESTIC_ROUND_TRIP, segments are often in itemFlight.segments[0]
    // However, the SSR data (seat/meal/baggage) might be structured per leg (origin-destination)
    // Let's keep returning the main segment info here, ancillary modal handles SSR structure.
    return itemFlight?.segments?.[0] || [];
  };

  const outboundFlight = getFlight(outboundFlightItem);
  const outboundSegments = getSegments(outboundFlight, 0);
  const inboundFlight = flightType === 'DOMESTIC_ROUND_TRIP' ? getFlight(inboundFlightItem) : outboundFlight; // Use outbound for intl return
  const inboundSegments = flightType === 'DOMESTIC_ROUND_TRIP' 
    ? getSegments(inboundFlight, 0) // Domestic inbound uses its own itemFlight.segments[0]
    : internationalReturnSegments || []; // International inbound uses outboundFlight.segments[1]

  // Helper to render a single flight leg (outbound or inbound)
  const renderFlightLeg = (title, flightData, segments, legIndex) => {
    if (!flightData || segments.length === 0) return null;

    return (
      <div className="border rounded-lg overflow-hidden">
        {/* Flight Header */}
        <div className="p-4 bg-gray-50 border-b flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <span className="font-medium text-[#093923]">{flightData.airlineName} {flightData.flightNumber}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(flightData.departureAt)}</span>
            </div>
          </div>
          {/* Conditionally hide price for International Round Trip */}
          {flightType !== 'INTERNATIONAL_ROUND_TRIP' && (
            <div className="text-right">
              <p className="text-lg font-semibold text-[#093923]">
                {flightData.fareQuote.currency} {flightData.fareQuote.finalFare.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">
                {flightData.fareIdentifier.name}
              </p>
            </div>
          )}
        </div>

        {/* Flight Segments */}
        <div className="p-4">
          {segments.map((segment, segIndex) => (
            <div key={segIndex} className="mb-4 last:mb-0">
              {/* Main segment info */}
              <div className="flex items-start">
                {/* Departure */}
                <div className="w-1/4">
                  <p className="text-lg font-semibold">{formatTime(segment.or.dT)}</p>
                  <p className="text-xs font-medium">{formatDate(segment.or.dT)}</p>
                  <p className="text-sm text-gray-600">{segment.or.cN}</p>
                  <p className="text-xs text-gray-500">{segment.or.aN}</p>
                  <p className="text-xs text-gray-500">Terminal {segment.or.tr}</p>
                </div>

                {/* Flight path */}
                <div className="flex-1 px-4">
                  <div className="flex flex-col items-center">
                    <p className="text-xs text-gray-500 mb-1">{formatDuration(segment.dr)}</p>
                    <div className="w-full flex items-center">
                      <div className="h-2 w-2 rounded-full bg-[#093923]"></div>
                      <div className="flex-1 h-0.5 bg-gray-300 mx-1 relative">
                        <div className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2">
                          <Plane className="h-3 w-3 text-[#093923]" />
                        </div>
                      </div>
                      <div className="h-2 w-2 rounded-full bg-[#093923]"></div>
                    </div>
                    <div className="flex items-center justify-center mt-2 space-x-2">
                      <img 
                        src={`https://pics.avs.io/80/40/${segment.al.alC}.png`} 
                        alt={segment.al.alN}
                        className="h-6 w-auto object-contain rounded-sm flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.classList.remove('hidden'); }}
                      />
                      <span className="hidden w-6 h-6 bg-gray-200 rounded-sm text-gray-500 flex items-center justify-center text-xs">?</span> {/* Placeholder icon */}
                      <p className="text-xs text-gray-600 truncate" title={`${segment.al.alN} ${segment.al.fN}`}>
                        {segment.al.alN} {segment.al.fN}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Arrival */}
                <div className="w-1/4 text-right">
                  <p className="text-lg font-semibold">{formatTime(segment.ds.aT)}</p>
                  <p className="text-xs font-medium">{formatDate(segment.ds.aT)}</p>
                  <p className="text-sm text-gray-600">{segment.ds.cN}</p>
                  <p className="text-xs text-gray-500">{segment.ds.aN}</p>
                  <p className="text-xs text-gray-500">Terminal {segment.ds.tr}</p>
                </div>
              </div>

              {/* Expandable details (baggage, class) */}
              <div className="mt-2">
                <button 
                  className="w-full flex justify-between items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                  onClick={() => toggleSegmentExpand(legIndex * 100 + segIndex)} // Use legIndex for unique key
                >
                  <div className="flex items-center">
                    <Briefcase className="h-4 w-4 mr-1 text-[#093923]" />
                    <span>
                      Baggage: {segment.bg} • Cabin: {segment.cBg} • 
                      Class: {segment.al.fC}
                    </span>
                  </div>
                  {expandedSegment === (legIndex * 100 + segIndex) ? 
                    <ChevronUp className="h-4 w-4" /> : 
                    <ChevronDown className="h-4 w-4" />
                  }
                </button>
                
                {expandedSegment === (legIndex * 100 + segIndex) && (
                  <div className="mt-2 p-3 bg-[#093923]/10 rounded-md text-sm">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-medium">Check-in Baggage:</p>
                        <p>{segment.bg}</p>
                      </div>
                      <div>
                        <p className="font-medium">Cabin Baggage:</p>
                        <p>{segment.cBg}</p>
                      </div>
                      <div>
                        <p className="font-medium">Cabin Class:</p>
                        <p>{segment.al.fC || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Aircraft:</p>
                        <p>{segment.al.alC} {segment.al.fN}</p>
                      </div>
                      {segment.sO && (
                        <div className="col-span-2">
                          <p className="font-medium text-orange-600">This is a stopover flight</p>
                          {segment.sD && <p>Duration: {formatDuration(segment.sD)}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- New Close Handler for Ancillary Modal ---
  const closeAncillaryModal = () => {
    setShowAncillaryModal(false);
    setDataForAncillaryModal(null); // Clear the specific data when closing
  };
  // -------------------------------------------

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Flight Itinerary</h2>
            <p className="text-sm text-gray-500">{flightType.replace(/_/g, ' ')}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Back</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {['flightDetails', 'fareDetails', 'fareRules'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${ 
                activeTab === tab
                  ? 'border-[#093923] text-[#093923]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm capitalize`}
            >
              {tab.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Price change alert */}
        {priceDetails && (priceDetails.isPriceChanged || priceDetails.isBaggageChanged) && (
          <div className={`mb-4 p-4 rounded-md ${ 
            priceDetails.totalAmount > priceDetails.previousTotalAmount 
              ? 'bg-[#093923]/10 text-[#093923]' 
              : 'bg-[#22c35e]/10 text-[#22c35e]'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Update</p>
                <p className="text-sm mt-1">
                  Previous Total: ₹{priceDetails.previousTotalAmount.toLocaleString()}
                </p>
                <p className="text-sm">
                  New Total: ₹{priceDetails.totalAmount.toLocaleString()}
                </p>
              </div>
              {priceDetails.isBaggageChanged && (
                <div className="text-sm">
                  <p className="font-medium text-[#093923]">Baggage Policy Changed</p>
                  <p>Please review the updated baggage details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'flightDetails' && (
          <div className="space-y-6">
            {/* Itinerary Summary */}
            <div className="mb-4 p-4 bg-[#093923]/10 rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2">
                <div className="flex items-center mb-2 sm:mb-0">
                  <Plane className="h-5 w-5 text-[#093923] mr-2" />
                  <span className="font-medium">
                    {outboundFlight.origin} - {outboundFlight.destination}
                    {/* Show return origin only if it's a round trip */}
                    {(flightType === 'DOMESTIC_ROUND_TRIP' || flightType === 'INTERNATIONAL_ROUND_TRIP') && 
                     outboundFlight.origin && ` - ${outboundFlight.origin}`}
                  </span>
                </div>
                <div className="text-sm text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-[#093923]" />
                  {outboundFlight.departureAt && formatDate(outboundFlight.departureAt)}
                  {/* Show return arrival date only if it's a round trip and available */}
                  {(flightType === 'DOMESTIC_ROUND_TRIP' && inboundFlight?.arrivalAt) && (
                    <><span className="mx-2">-</span>{formatDate(inboundFlight.arrivalAt)}</>
                  )}
                  {(flightType === 'INTERNATIONAL_ROUND_TRIP' && outboundFlight?.arrivalAt) && (
                     <><span className="mx-2">-</span>{formatDate(outboundFlight.arrivalAt)}</>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-[#093923]" />
                  <span>{outboundFlight.isRefundable ? 'Refundable' : 'Non-Refundable'}</span>
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-3 w-3 mr-1 text-[#093923]" />
                  <span>Cabin: {outboundSegments?.[0]?.al?.fC || 'Economy'}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1 text-[#093923]" />
                  <span>TraceID Valid: {results?.traceIdDetails?.remainingTime || 0} seconds</span>
                </div>
              </div>
            </div>

            {/* Render Outbound Leg */}
            {renderFlightLeg('Departure Flight', outboundFlight, outboundSegments, 0)}

            {/* Render Inbound Leg (if applicable) */}
            {(flightType === 'DOMESTIC_ROUND_TRIP' || flightType === 'INTERNATIONAL_ROUND_TRIP') &&
              renderFlightLeg('Return Flight', inboundFlight, inboundSegments, 1)}
            
          </div>
        )}

        {activeTab === 'fareDetails' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fare Breakdown</h3>
              
              {/* Detailed price breakdown */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Fare</span>
                    <span className="font-medium">₹{results?.baseFare?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-medium">₹{results?.taxAndSurcharge?.toLocaleString()}</span>
                  </div>
                  
                  {/* Additional fees if available */}
                  {results?.tcDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{results?.tcDiscount?.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {results?.insuranceAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance</span>
                      <span className="font-medium">₹{results?.insuranceAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  
                  {/* Display Ancillary Cost if selected */}
                  {ancillaryCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Seats & Extras</span>
                      <span className="font-medium">₹{ancillaryCost.toLocaleString()}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-semibold">Grand Total</span>
                      <span className="text-lg font-semibold text-blue-600">
                        {/* Add ancillary cost to total */}
                        ₹{(results?.totalAmount + ancillaryCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Passenger Breakdown */}
                <div className="border-t pt-3 mt-3">
                  <h4 className="text-base font-medium text-gray-900 mb-2">Per Passenger Breakdown</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    {/* Use outbound flight for pax breakdown, assuming it's consistent */}
                    {outboundFlight?.fareQuote?.paxFareBreakUp?.map((pax, idx) => (
                      <div key={idx} className="mb-2 last:mb-0">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">
                            {pax.paxType === 1 ? 'Adult' : pax.paxType === 2 ? 'Child' : 'Infant'} 
                          </span>
                          <span>₹{(pax.baseFare + pax.tax).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 pl-4">
                          <span>Base Fare</span>
                          <span>₹{pax.baseFare?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 pl-4">
                          <span>Taxes & Fees</span>
                          <span>₹{pax.tax?.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Add Refund/Change Fee Summary */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-[#093923]" />
                Refund & Change Policy Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#093923]/10 p-3 rounded-md">
                  <h4 className="font-medium text-[#093923] mb-1">Cancellation Charges</h4>
                  <p className="text-sm text-[#093923]/80">
                    {outboundFlight?.isRefundable ? 
                      'This ticket is refundable, subject to airline policy and applicable fees.' : 
                      'This ticket is non-refundable.'}
                  </p>
                </div>
                <div className="bg-[#093923]/10 p-3 rounded-md">
                  <h4 className="font-medium text-[#093923] mb-1">Date Change Policy</h4>
                  <p className="text-sm text-[#093923]/80">
                    Date changes are permitted subject to airline policy and applicable fees.
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                * See 'Fare Rules' tab for complete details on cancellation and change policies.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'fareRules' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fare Rules</h3>
              
              {/* Outbound Fare Rules */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Outbound Flight Fare Rules</h4>
                {outboundFlight?.fareRule?.[0]?.fareRuleDetail ? (
                  <div className="bg-gray-50 p-4 rounded-md prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: outboundFlight.fareRule[0].fareRuleDetail }} />
                  </div>
                ) : (
                  <div className="flex items-center p-4 bg-[#093923]/10 rounded-md text-gray-500">
                    <AlertTriangle className="h-5 w-5 mr-2 text-[#093923]" />
                    <p>No outbound fare rules available.</p>
                  </div>
                )}
              </div>
              
              {/* Inbound Fare Rules (if applicable) */}
              {(flightType === 'DOMESTIC_ROUND_TRIP' || flightType === 'INTERNATIONAL_ROUND_TRIP') && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Return Flight Fare Rules</h4>
                  {inboundFlight?.fareRule?.[0]?.fareRuleDetail ? (
                    <div className="bg-gray-50 p-4 rounded-md prose max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: inboundFlight.fareRule[0].fareRuleDetail }} />
                    </div>
                  ) : (
                    <div className="flex items-center p-4 bg-[#093923]/10 rounded-md text-gray-500">
                      <AlertTriangle className="h-5 w-5 mr-2 text-[#093923]" />
                      <p>No return fare rules available.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleBookNow}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Booking...
              </span>
            ) : !isAllocated ? 'Allocate Passenger' : (ancillariesConfirmed ? 'Book Now' : 'Confirm Seats & Extras')}
          </button>
        </div>
      </div>

      <PassengerInfoModal
        isOpen={showPassengerInfo}
        onClose={() => setShowPassengerInfo(false)}
        itineraryDetails={{ 
          // Pass necessary details for passenger form
          ...results,
          adultCount: results?.adultCount || 0,
          childCount: results?.childCount || 0,
          infantCount: results?.infantCount || 0,
          // Ensure paxRules are passed correctly
          paxRules: results?.paxRules
        }}
        onSuccess={handlePassengerSuccess} // Opens Ancillary modal on success
      />

      {/* --- Render Ancillary Modal --- */} 
       <FlightAncillarySelectionModal
        isOpen={showAncillaryModal}
        onClose={closeAncillaryModal} // Use the new handler
        itineraryDetails={itineraryDetails} // Pass the full itinerary details containing ssr
        priceDetails={priceDetails} // Pass rechecked price details if needed
        passengerFormData={dataForAncillaryModal} // Pass the specific data
        onSuccess={handleAncillarySuccess} // Callback for when selections are confirmed
      />
      {/* ------------------------------ */}

    </div>
  );
};

export default FlightItineraryModal;