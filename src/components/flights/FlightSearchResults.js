import { BriefcaseIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';

// Helper functions
const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
};

const formatPrice = (amount, currency) => {
  if (!amount || !currency) return 'N/A';
  return `${currency} ${amount.toLocaleString()}`;
};

// Format time (from ISO string to local time) - make more error resistant
const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  try {
    return format(new Date(timeStr), 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error, timeStr);
    return 'Invalid time';
  }
};

// Update the renderSegment function to handle direct sg objects
const renderSegment = (segment, index) => {
  if (!segment) return <div key={index} className="text-red-500 p-2">Missing segment data</div>;
  
  // For inbound flights that match our expected structure (from the API example)
  if (segment.departure && segment.arrival && segment.airline) {
    // All data is available directly on the segment object
  return (
            <React.Fragment key={index}>
              {index > 0 && (
                <div className="py-2">
                  <div className="border-t border-gray-200"></div>
                  <div className="flex justify-center -mt-3">
                    <span className="bg-white px-2 text-xs text-gray-500">
                      Connection {formatDuration(segment.groundTime || 0)}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-semibold">
                  {formatTime(segment.departure.time)}
                      </span>
                      <span className="text-gray-500">
                  {segment.departure.airport.code}
                      </span>
                {segment.departure.airport.terminal && (
                        <span className="text-xs text-gray-400">
                          T{segment.departure.airport.terminal}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">
                        {formatDuration(segment.duration)}
                      </span>
                      <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-lg font-semibold">
                  {formatTime(segment.arrival.time)}
                      </span>
                      <span className="text-gray-500">
                  {segment.arrival.airport.code}
                      </span>
                {segment.arrival.airport.terminal && (
                        <span className="text-xs text-gray-400">
                          T{segment.arrival.airport.terminal}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <div className="text-sm text-gray-500">
                {segment.airline.name} {segment.airline.flightNumber}
                {segment.airline.fareClass && (
                        <span className="ml-1 text-xs text-gray-400">
                          ({segment.airline.fareClass})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      {segment.baggage && (
                        <span className="mr-2">Baggage: {segment.baggage}</span>
                      )}
                      {segment.cabinBaggage && (
                        <span>Cabin: {segment.cabinBaggage}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </React.Fragment>
    );
  }
  
  // For other segment formats, maintain backward compatibility
  // Handle both legacy (sg/al/or/ds) and normalized (segments/airline/departure/arrival) formats
  
  // Departure extraction
  let departureCode, departureTerminal, departureTime;
  if (segment.departure) {
    // Normalized format
    departureCode = segment.departure.airport?.code || 'N/A';
    departureTerminal = segment.departure.airport?.terminal || '';
    departureTime = formatTime(segment.departure.time);
  } else if (segment.or) {
    // Legacy format
    departureCode = segment.or.aC || 'N/A';
    departureTerminal = segment.or.tr || '';
    departureTime = formatTime(segment.or.dT);
  } else {
    // Fallback
    departureCode = 'N/A';
    departureTerminal = '';
    departureTime = 'N/A';
  }
  
  // Arrival extraction
  let arrivalCode, arrivalTerminal, arrivalTime;
  if (segment.arrival) {
    // Normalized format
    arrivalCode = segment.arrival.airport?.code || 'N/A';
    arrivalTerminal = segment.arrival.airport?.terminal || '';
    arrivalTime = formatTime(segment.arrival.time);
  } else if (segment.ds) {
    // Legacy format
    arrivalCode = segment.ds.aC || 'N/A';
    arrivalTerminal = segment.ds.tr || '';
    arrivalTime = formatTime(segment.ds.aT);
  } else {
    // Fallback
    arrivalCode = 'N/A';
    arrivalTerminal = '';
    arrivalTime = 'N/A';
  }
  
  // Airline information extraction
  let airlineName, flightNumber, fareClass;
  if (segment.airline) {
    // Normalized format
    airlineName = segment.airline.name || 'N/A';
    flightNumber = segment.airline.flightNumber || '';
    fareClass = segment.airline.fareClass || '';
  } else if (segment.al) {
    // Legacy format
    airlineName = segment.al.alN || 'N/A';
    flightNumber = segment.al.fN ? segment.al.fN.trim() : '';
    fareClass = segment.al.fC || '';
  } else {
    // Fallback
    airlineName = 'N/A';
    flightNumber = '';
    fareClass = '';
  }
  
  // Baggage and duration extraction
  const baggage = segment.baggage || segment.bg || 'N/A';
  const cabinBaggage = segment.cabinBaggage || segment.cBg || 'N/A';
  const duration = segment.duration || segment.dr || 0;
  const groundTime = segment.groundTime || segment.gT || 0;

  // If we are missing critical data like departure/arrival times, show a simplified view
  if (departureTime === 'N/A' && arrivalTime === 'N/A') {
    return (
      <div key={index} className="p-3 border border-gray-200 rounded-md bg-gray-50 my-2">
        <div className="text-sm text-gray-600 font-semibold">Flight Details Available</div>
        <div className="text-xs text-gray-500 mt-1">
          <span className="block">From: {departureCode}</span>
          <span className="block">To: {arrivalCode}</span>
          {airlineName !== 'N/A' && <span className="block">Airline: {airlineName}</span>}
          {baggage !== 'N/A' && <span className="block">Baggage: {baggage}</span>}
        </div>
      </div>
    );
  }

  return (
    <React.Fragment key={index}>
      {index > 0 && (
        <div className="py-2">
          <div className="border-t border-gray-200"></div>
          <div className="flex justify-center -mt-3">
            <span className="bg-white px-2 text-xs text-gray-500">
              Connection {formatDuration(groundTime)}
            </span>
          </div>
        </div>
      )}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold">
                {departureTime}
              </span>
              <span className="text-gray-500">
                {departureCode}
              </span>
              {departureTerminal && (
                <span className="text-xs text-gray-400">
                  T{departureTerminal}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">
                {formatDuration(duration)}
              </span>
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="text-lg font-semibold">
                {arrivalTime}
              </span>
              <span className="text-gray-500">
                {arrivalCode}
              </span>
              {arrivalTerminal && (
                <span className="text-xs text-gray-400">
                  T{arrivalTerminal}
                </span>
              )}
            </div>
          </div>
          <div className="mt-1 flex justify-between">
            <div className="text-sm text-gray-500">
              {airlineName} {flightNumber}
              {fareClass && (
                <span className="ml-1 text-xs text-gray-400">
                  ({fareClass})
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400">
              {baggage && (
                <span className="mr-2">Baggage: {baggage}</span>
              )}
              {cabinBaggage && (
                <span>Cabin: {cabinBaggage}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

// FlightCard for rendering flight information - Updated to remove inbound preview from outbound tab
const FlightCard = ({ flight, onSelect, isSelected }) => {
  // State for managing selected inbound option and expanded state
  const [selectedInboundIndex, setSelectedInboundIndex] = useState(0);
  const [inboundExpanded, setInboundExpanded] = useState(false);
  
  // Improved function to process inbound options safely
  const processInboundOptions = (flight) => {
    let allInboundOptions = [];
    
    if (flight.inboundOptions && Array.isArray(flight.inboundOptions)) {
      // Check if inboundOptions is already a flat array of objects
      if (flight.inboundOptions.length > 0 && typeof flight.inboundOptions[0] === 'object' && !Array.isArray(flight.inboundOptions[0])) {
        // Direct mapping for the new format where each item is already a flight object
        allInboundOptions = flight.inboundOptions.map((option, index) => ({
          index,
          price: option.price || flight.price,
          isRefundable: option.isRefundable !== undefined ? option.isRefundable : flight.isRefundable,
          fareClass: option.fareClass || flight.fareClass,
          segments: option.segments || [],
          provider: option.provider,
          resultIndex: option.resultIndex
        }));
      } 
      // Legacy format handling (array of arrays)
      else {
        for (let i = 0; i < flight.inboundOptions.length; i++) {
          const optionArray = flight.inboundOptions[i];
          
          if (Array.isArray(optionArray) && optionArray.length > 0) {
            const inboundOption = optionArray[0];
            
            if (inboundOption) {
              // Ensure we have valid segments
              let segmentsToUse = [];
              
              if (inboundOption.segments && Array.isArray(inboundOption.segments) && inboundOption.segments.length > 0) {
                // If segments array exists and has values, use it directly
                segmentsToUse = inboundOption.segments;
              } else if (inboundOption.departure && inboundOption.arrival) {
                // If the option itself is a segment-like object, use it as a segment
                segmentsToUse = [inboundOption];
              }
              
              allInboundOptions.push({
                index: i,
                price: inboundOption.price || flight.price,
                isRefundable: inboundOption.isRefundable !== undefined ? inboundOption.isRefundable : flight.isRefundable,
                fareClass: inboundOption.fareClass || flight.fareClass,
                segments: segmentsToUse,
                provider: inboundOption.provider,
                resultIndex: inboundOption.resultIndex
              });
            }
          }
        }
      }
    }
    
    console.log('Processed inbound options:', allInboundOptions.length, allInboundOptions[0]);
    return allInboundOptions;
  };
  
  // Emergency check for completely empty flight object
  if (!flight) {
    console.error("Received null or undefined flight object");
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 border-red-300">
        <p className="text-red-500">Invalid flight data</p>
      </div>
    );
  }

  // Log everything to debug
  console.log('FlightCard received flight:', flight);

  // Price extraction with fallbacks for every format
  const displayPrice = {
    amount: flight.price?.amount || flight.pF || 0,
    currency: flight.price?.currency || flight.cr || 'INR'
  };

  // Get segments from flight (handle both normalized segments and raw sg format)
  const getSegments = (flight) => {
    if (flight.segments && Array.isArray(flight.segments)) {
      return flight.segments;
    }
    
    if (flight.sg && Array.isArray(flight.sg)) {
      return flight.sg;
    }
    
    return [];
  };

  // Determine flight type
  const isDomesticRoundTripCombined = flight.outbound && flight.inbound;
  const hasOutboundSegments = flight.outboundSegments && flight.outboundSegments.length > 0;
  const hasOutboundFlight = flight.outboundFlight && Array.isArray(flight.outboundFlight) && flight.outboundFlight.length > 0;
  // Enhanced detection for international round trips
  const hasInboundOptions = flight.inboundOptions && Array.isArray(flight.inboundOptions) && flight.inboundOptions.length > 0;
  const isInternationalRoundTrip = (hasOutboundSegments || hasOutboundFlight) && hasInboundOptions;
  const isOneWay = !isDomesticRoundTripCombined && !isInternationalRoundTrip;

  // Show debug logs for flight structure detection
  console.log('Flight structure detection:', {
    isDomesticRoundTripCombined,
    hasOutboundSegments,
    hasOutboundFlight,
    hasInboundOptions,
    isInternationalRoundTrip,
    isRoundTrip: flight.isRoundTrip
  });

  // Get appropriate segments based on flight type
  let segments = [];
  let outboundSegments = [];
  let inboundSegments = [];
  
  // For storing all available inbound options
  let allInboundOptions = [];

  if (isDomesticRoundTripCombined) {
    outboundSegments = getSegments(flight.outbound);
    inboundSegments = getSegments(flight.inbound);
  } else if (isInternationalRoundTrip) {
    // For outbound, try both possible formats
    outboundSegments = hasOutboundSegments ? flight.outboundSegments : 
                      (hasOutboundFlight ? flight.outboundFlight : []);
    
    // For inbound, collect all options from the nested structure
    allInboundOptions = processInboundOptions(flight);
    
    // Add debugging to verify options are properly processed
    console.log('Processed inbound options:', {
      count: allInboundOptions.length,
      firstOption: allInboundOptions[0],
      hasSegments: allInboundOptions[0]?.segments?.length > 0
    });
    
    // We no longer need to set initial inbound segments here since we're not showing them in outbound tab
  } else {
    // One-way flight
    segments = getSegments(flight);
  }

  // Refundable status with fallbacks
  const isRefundable = flight.isRefundable !== undefined ? flight.isRefundable : 
                     (flight.iR !== undefined ? flight.iR : false);

  
  // Function to toggle inbound options expansion
  const toggleInboundExpanded = () => {
    setInboundExpanded(!inboundExpanded);
  };
  
  // Function to handle inbound option selection
  const selectInboundOption = (index) => {
    setSelectedInboundIndex(index);
    setInboundExpanded(false); // Collapse after selection
  };

  // For domestic round trip combined flights
  if (isDomesticRoundTripCombined) {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border p-4 ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        } hover:shadow-md transition-shadow cursor-pointer`}
        onClick={() => onSelect(flight)}
      >
        <div className="space-y-6">
          {/* Outbound section */}
          <div>
            <div className="text-sm font-semibold text-blue-600 mb-2">Outbound</div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {outboundSegments.length > 0 ? (
                  outboundSegments.map((segment, index) => renderSegment(segment, index))
                ) : (
                  <div className="text-red-500">No outbound segment data available</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Inbound section */}
          <div>
            <div className="text-sm font-semibold text-blue-600 mb-2">Inbound</div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {inboundSegments.length > 0 ? (
                  inboundSegments.map((segment, index) => renderSegment(segment, index))
                ) : (
                  <div className="text-red-500">No inbound segment data available</div>
                )}
              </div>
            </div>
        </div>
        
          {/* Price info */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
                {displayPrice.currency} {displayPrice.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                Round Trip {isRefundable ? ' • Refundable' : ' • Non-refundable'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // For international round trips (OUTBOUND ONLY)
  if (isInternationalRoundTrip) {
    return (
      <div 
        className={`bg-white rounded-lg shadow-sm border p-4 ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        } hover:shadow-md transition-shadow cursor-pointer`}
        onClick={() => onSelect(flight)}
      >
        <div className="space-y-6">
          {/* Outbound section only - no inbound preview */}
          <div>
            <div className="text-sm font-semibold text-blue-600 mb-2">Outbound Flight</div>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {outboundSegments.length > 0 ? (
                  outboundSegments.map((segment, index) => renderSegment(segment, index))
                ) : (
                  <div className="text-red-500">No outbound segment data available</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Price info - with return options text on the same row */}
          <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between items-center">
            {/* Return flight options count */}
            {allInboundOptions.length > 0 && (
              <div className="text-sm text-gray-600">
                {allInboundOptions.length} return flight option{allInboundOptions.length !== 1 ? 's' : ''}
              </div>
            )}
            
            {/* Price */}
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {displayPrice.currency} {displayPrice.amount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {isRefundable ? 'Refundable' : 'Non-refundable'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // For one-way flights (unchanged)
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border p-4 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onSelect(flight)}
    >
      <div className="flex justify-between items-start">
        {/* Segments */}
        <div className="flex-1">
          {segments.length > 0 ? (
            segments.map((segment, index) => renderSegment(segment, index))
          ) : (
            <div className="text-red-500">No segment data available</div>
          )}
        </div>
      </div>
      
      {/* Flight details, price and select button in same row */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <div className="flex flex-wrap items-center gap-4">
          {/* Baggage Info */}
          {segments[0] && (
          <div className="flex items-center space-x-1">
              <BriefcaseIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">
                {segments[0].baggage || segments[0].bg || 'No baggage'}
            </span>
          </div>
          )}
          
          {/* Duration Info */}
          {segments.length > 0 && (
          <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4 text-gray-500 mr-1" />
            <span className="text-sm text-gray-500">
              {formatDuration(
                  segments.reduce((total, segment) => total + (segment.duration || segment.dr || 0), 0)
              )}
            </span>
          </div>
          )}
          
          {/* Stops Info */}
          <div className="flex items-center space-x-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6 10a2 2 0 012-2h4a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4z" />
            </svg>
            <span className="text-sm text-gray-500">
              {segments.length <= 1 
                ? 'Non-stop' 
                : `${segments.length - 1} stop${segments.length !== 2 ? 's' : ''}`
              }
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {displayPrice.currency} {displayPrice.amount.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">
            {isRefundable ? 'Refundable' : 'Non-refundable'}
          </div>
        </div>
      </div>
    </div>
  );
};

// New FlightSummaryPanel component for the right side with proper price calculation
const FlightSummaryPanel = ({ 
  selectedOutboundFlight, 
  selectedInboundFlight, 
  flightStructureType,
  selectedInboundOptionIndex = 0,
  onCreateItinerary 
}) => {
  // Function to calculate total price with correct logic for each flight type
  const calculateTotalPrice = () => {
    let total = 0;
    let currency = 'INR';
    
    if (selectedOutboundFlight) {
      // Add outbound flight price (same for all flight types)
      total += selectedOutboundFlight.price?.amount || 0;
      currency = selectedOutboundFlight.price?.currency || 'INR';
      
      // Add inbound flight price based on flight type
      if (flightStructureType === 'DOMESTIC_ROUND_TRIP' && selectedInboundFlight) {
        // For domestic round trip, add the selected inbound flight price
        total += selectedInboundFlight.price?.amount || 0;
      } 
      else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && 
               selectedInboundOptionIndex !== null && 
               selectedOutboundFlight.inboundOptions && 
               selectedOutboundFlight.inboundOptions.length > selectedInboundOptionIndex) {
        
        // For international round trip, add the selected inbound option price
        // Handle array of arrays format
        if (Array.isArray(selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex])) {
          const inboundOption = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex][0];
          if (inboundOption && inboundOption.price) {
            total += inboundOption.price.amount || 0;
          }
        } 
        // Handle direct object format
        else if (selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex] && 
                 selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex].price) {
          total += selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex].price.amount || 0;
        }
      }
    }
    
    return { amount: total, currency };
  };
  
  // Extract relevant data for outbound flight
  const getOutboundFlightData = () => {
    if (!selectedOutboundFlight) return null;
    
    let segments = [];
    let airline = '';
    let flightNumber = '';
    let departure = {};
    let arrival = {};
    let baseFare = 0;
    let tax = 0;
    let price = { amount: 0, currency: 'INR' };
    
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      segments = selectedOutboundFlight.segments || [];
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
      }
      baseFare = selectedOutboundFlight.price?.baseFare || 0;
      tax = selectedOutboundFlight.price?.tax || 0;
      price = selectedOutboundFlight.price || { amount: 0, currency: 'INR' };
    } 
    else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      segments = selectedOutboundFlight.outboundSegments || [];
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
      }
      baseFare = selectedOutboundFlight.price?.baseFare || 0;
      tax = selectedOutboundFlight.price?.tax || 0;
      price = selectedOutboundFlight.price || { amount: 0, currency: 'INR' };
    }
    else {
      // ONE_WAY
      segments = selectedOutboundFlight.segments || [];
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
      }
      baseFare = selectedOutboundFlight.price?.baseFare || 0;
      tax = selectedOutboundFlight.price?.tax || 0;
      price = selectedOutboundFlight.price || { amount: 0, currency: 'INR' };
    }
    
    return {
      airline,
      flightNumber,
      departure,
      arrival,
      baseFare,
      tax,
      price
    };
  };
  
  // Extract relevant data for inbound flight
  const getInboundFlightData = () => {
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP' && selectedInboundFlight) {
      // For domestic round trip
      const segments = selectedInboundFlight.segments || [];
      let airline = '';
      let flightNumber = '';
      let departure = {};
      let arrival = {};
      
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
      }
      
      return {
        airline,
        flightNumber,
        departure,
        arrival,
        baseFare: selectedInboundFlight.price?.baseFare || 0,
        tax: selectedInboundFlight.price?.tax || 0,
        price: selectedInboundFlight.price || { amount: 0, currency: 'INR' }
      };
    } 
    else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && 
             selectedInboundOptionIndex !== null && 
             selectedOutboundFlight?.inboundOptions) {
      
      // For international round trips, extract from selected inbound option
      let inboundOption;
      
      // Handle array of arrays format
      if (Array.isArray(selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex])) {
        inboundOption = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex][0];
      } 
      // Handle direct object format
      else {
        inboundOption = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex];
      }
      
      if (!inboundOption) return null;
      
      const segments = inboundOption.segments || [];
      let airline = '';
      let flightNumber = '';
      let departure = {};
      let arrival = {};
      
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
      }
      
      return {
        airline,
        flightNumber,
        departure,
        arrival,
        baseFare: inboundOption.price?.baseFare || 0,
        tax: inboundOption.price?.tax || 0,
        price: inboundOption.price || { amount: 0, currency: 'INR' }
      };
    }
    
    return null;
  };

  const outboundData = getOutboundFlightData();
  const inboundData = getInboundFlightData();
  const totalPrice = calculateTotalPrice();

  if (!selectedOutboundFlight) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Flight Summary</h3>
        <div className="text-gray-500 py-10 text-center">
          <p className="mb-2">No flight selected</p>
          <p className="text-sm">Select a flight to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Flight Summary</h3>
      
      {/* Outbound Flight Information */}
      {outboundData && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-600 mb-2">Outbound</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{outboundData.airline} {outboundData.flightNumber}</span>
            </div>
            {outboundData.departure && outboundData.arrival && (
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>{outboundData.departure.airport?.code}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span>{outboundData.arrival.airport?.code}</span>
                </div>
                <div className="mt-1">
                  {outboundData.departure.time && (
                    <span className="text-xs text-gray-500">
                      {formatTime(outboundData.departure.time)} - {formatTime(outboundData.arrival.time)}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="text-sm">
              <div className="flex justify-between font-medium mt-1">
                <span>Fare:</span>
                <span>{outboundData.price.currency} {outboundData.price.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Inbound Flight Information */}
      {inboundData && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-blue-600 mb-2">Inbound</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{inboundData.airline} {inboundData.flightNumber}</span>
            </div>
            {inboundData.departure && inboundData.arrival && (
              <div className="text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>{inboundData.departure.airport?.code}</span>
                  <ChevronRightIcon className="h-4 w-4" />
                  <span>{inboundData.arrival.airport?.code}</span>
                </div>
                <div className="mt-1">
                  {inboundData.departure.time && (
                    <span className="text-xs text-gray-500">
                      {formatTime(inboundData.departure.time)} - {formatTime(inboundData.arrival.time)}
                    </span>
                  )}
                </div>
              </div>
            )}
            <div className="text-sm">
              <div className="flex justify-between font-medium mt-1">
                <span>Fare:</span>
                <span>{inboundData.price.currency} {inboundData.price.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Divider */}
      <div className="border-t border-gray-200 my-4"></div>
      
      {/* Total */}
      <div className="mb-6">
        <div className="flex justify-between text-lg font-semibold text-blue-700">
          <span>Total:</span>
          <span>{totalPrice.currency} {totalPrice.amount.toLocaleString()}</span>
        </div>
      </div>
      
      {/* CTA Button */}
      {selectedOutboundFlight && (
        flightStructureType === 'ONE_WAY' ||
        (flightStructureType === 'DOMESTIC_ROUND_TRIP' && selectedInboundFlight) ||
        (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex !== null)
      ) && (
        <button
          onClick={onCreateItinerary}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors"
        >
          Create Itinerary
        </button>
      )}
      
      {flightStructureType === 'DOMESTIC_ROUND_TRIP' && !selectedInboundFlight && (
        <div className="text-sm text-gray-500 text-center p-3 bg-blue-50 rounded-md">
          Please select an inbound flight to continue
        </div>
      )}
      
      {flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex === null && (
        <div className="text-sm text-gray-500 text-center p-3 bg-blue-50 rounded-md">
          Please select an inbound option to continue
        </div>
      )}
    </div>
  );
};

const FlightSearchResults = ({ 
  flights = [], 
  traceId, 
  pagination,
  onSelectFlight,
  selectedFlight,
  onLoadMore,
  loadMoreManually,
  loading,
  isRoundTrip = false,
  isDomestic = false,
  isOutbound = true,
  isLoadingMore = false,
  allChunksLoaded = false,
  loadingProgress = 0,
  selectedAirline = null,
  // New props for the summary panel
  selectedOutboundFlight = null,
  selectedInboundFlight = null,
  flightStructureType = 'ONE_WAY',
  selectedInboundOptionIndex = null,
  onCreateItinerary = null
}) => {
  // Debug logs
  console.log('╔════════════════════ FLIGHT SEARCH RESULTS COMPONENT ════════════════════╗');
  console.log('PROPS: ', {
    flightsLength: flights?.length || 0,
    isDomestic,
    isRoundTrip,
    isOutbound,
    paginationTotal: pagination?.total,
    hasCallback: !!onSelectFlight,
    firstFlight: flights?.[0],
    flightType: isDomestic ? 'domestic' : 'non-domestic',
    tripType: isRoundTrip ? 'round-trip' : 'one-way',
    isLoadingMore,
    allChunksLoaded,
    loadingProgress
  });
  
  const [sortBy, setSortBy] = useState('priceAsc');
  const [sortedFlights, setSortedFlights] = useState([]);
  const [expandedFlightId, setExpandedFlightId] = useState(null);

  // Filter flights by airline if selected
  const filteredFlights = selectedAirline
    ? flights.filter(flight => {
        // For domestic round trip combined flights
        if (flight.outbound && flight.inbound) {
          return flight.outbound.segments?.some(segment => 
            segment.airline?.name === selectedAirline
          ) || flight.inbound.segments?.some(segment => 
            segment.airline?.name === selectedAirline
          );
        }
        
        // For international round trips
        if (flight.outboundSegments) {
          return flight.outboundSegments?.some(segment => 
            segment.airline?.name === selectedAirline
          ) || flight.inboundOptions?.some(option => 
            option.segments?.some(segment => 
              segment.airline?.name === selectedAirline
            )
          );
        }
        
        // For one-way flights
        return flight.segments?.some(segment => 
          segment.airline?.name === selectedAirline
        );
      })
    : flights;

  // Use filteredFlights for sorting and display
  useEffect(() => {
    if (filteredFlights && filteredFlights.length > 0) {
      console.log('Setting initial sorted flights', { count: filteredFlights.length });
      setSortedFlights(filteredFlights);
    }
  }, [filteredFlights]);

  // Apply sorting to filtered flights
  useEffect(() => {
    if (filteredFlights && filteredFlights.length > 0) {
      console.log('Sorting flights:', { count: filteredFlights.length, sortBy });
      let sorted = [...filteredFlights];
      
      switch (sortBy) {
        case 'priceAsc':
          sorted = sorted.sort((a, b) => 
            (a.price?.amount || 0) - (b.price?.amount || 0)
          );
          break;
        case 'priceDesc':
          sorted = sorted.sort((a, b) => 
            (b.price?.amount || 0) - (a.price?.amount || 0)
          );
          break;
        case 'durationAsc':
          sorted = sorted.sort((a, b) => {
            // Function to calculate total duration based on flight type
            const getFlightDuration = (flight) => {
              // For domestic round trip combined flights
              if (flight.outbound && flight.inbound) {
                const outboundDuration = (flight.outbound.segments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
                const inboundDuration = (flight.inbound.segments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
                return outboundDuration + inboundDuration;
              }
              
              // For international round trips
              if (flight.outboundSegments) {
                return (flight.outboundSegments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
              }
              
              // For one-way flights
              return (flight.segments || []).reduce(
                (total, segment) => total + (segment.duration || 0), 0
              );
            };
            
            return getFlightDuration(a) - getFlightDuration(b);
          });
          break;
        case 'durationDesc':
          sorted = sorted.sort((a, b) => {
            // Function to calculate total duration based on flight type
            const getFlightDuration = (flight) => {
              // For domestic round trip combined flights
              if (flight.outbound && flight.inbound) {
                const outboundDuration = (flight.outbound.segments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
                const inboundDuration = (flight.inbound.segments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
                return outboundDuration + inboundDuration;
              }
              
              // For international round trips
              if (flight.outboundSegments) {
                return (flight.outboundSegments || []).reduce(
                  (total, segment) => total + (segment.duration || 0), 0
                );
              }
              
              // For one-way flights
              return (flight.segments || []).reduce(
                (total, segment) => total + (segment.duration || 0), 0
              );
            };
            
            return getFlightDuration(b) - getFlightDuration(a);
          });
          break;
        default:
          break;
      }
      
      console.log('Finished sorting flights:', { 
        original: filteredFlights.length,
        sorted: sorted.length,
        firstSortedPrice: sorted[0]?.price?.amount
      });
      setSortedFlights(sorted);
    } else {
      console.log('No flights to sort');
      setSortedFlights([]);
    }
  }, [filteredFlights, sortBy]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const toggleFlightDetails = (flightId) => {
    setExpandedFlightId(expandedFlightId === flightId ? null : flightId);
  };

  // Check if we have any flights to display
  if (!flights || flights.length === 0) {
    console.log('❌ NO FLIGHTS TO DISPLAY:', {
      flights,
      flightsLength: flights?.length || 0,
      isDomestic,
      isRoundTrip,
      isOutbound,
      flightType: isDomestic ? 'domestic' : 'non-domestic',
      tripType: isRoundTrip ? 'round-trip' : 'one-way'
    });
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500 font-bold text-lg mb-4">No flights found. Try different search criteria.</p>
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
    );
  }

  console.log('✅ RENDERING FLIGHTS:', {
    flightsCount: flights.length,
    sortedFlightsCount: sortedFlights.length,
    firstFlight: flights[0],
    isDomestic,
    isRoundTrip,
    isOutbound
  });

  return (
    <div className="space-y-4">
      {/* Sort options */}
      <div className="flex flex-wrap items-center justify-between bg-white rounded-lg shadow-sm p-3 mb-4">
        <div className="text-sm text-gray-600 font-medium">
          {flights.length} {isRoundTrip ? 'round trip' : 'one-way'} flight{flights.length !== 1 ? 's' : ''} found
        </div>
        <div className="flex items-center mt-2 md:mt-0">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => handleSortChange(e.target.value)}
          className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="priceAsc">Price: Low to High</option>
          <option value="priceDesc">Price: High to Low</option>
          <option value="durationAsc">Duration: Shortest</option>
          <option value="durationDesc">Duration: Longest</option>
        </select>
        </div>
      </div>

      {/* Flight results */}
      <div className="space-y-4">
        {flights.length > 0 && sortedFlights.length === 0 ? (
          <>
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
              <p className="text-gray-600 font-medium">Sorting flights...</p>
            </div>
          </>
        ) : (
          sortedFlights.map((flight, index) => (
            <FlightCard
              key={flight.resultIndex || index}
              flight={flight}
              onSelect={onSelectFlight}
              isSelected={selectedFlight?.resultIndex === flight.resultIndex}
            />
          ))
        )}
      </div>

      {/* Loading and Load more UI */}
      {isLoadingMore ? (
        <div className="flex justify-center mt-6 mb-2">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            <span className="mt-2 text-sm text-gray-600">Loading more flights...</span>
          </div>
        </div>
      ) : allChunksLoaded ? (
        <div className="flex justify-center mt-6">
          <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm">
            All available flights loaded
          </div>
        </div>
      ) : pagination && loadMoreManually && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMoreManually}
            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Continue Loading ({loadingProgress}% complete)
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightSearchResults; 
export { FlightSummaryPanel };
