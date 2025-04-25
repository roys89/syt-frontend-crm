import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import React, { useEffect, useRef, useState } from 'react';

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
    // Calculate duration if not provided
    const duration = segment.duration || 
      (segment.departure.time && segment.arrival.time ? 
        Math.round((new Date(segment.arrival.time) - new Date(segment.departure.time)) / (1000 * 60)) : 
        0);
    
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
                  {formatDuration(duration)}
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
const FlightCard = ({ 
  flight, 
  onSelect, 
  isSelected, 
  isOutbound, 
  flightStructureType,
  selectedOutboundFlight,
  selectedInboundFlight
}) => {
  // State for managing selected inbound option, expanded state, and group expansion
  const [selectedInboundIndex, setSelectedInboundIndex] = useState(0);
  const [inboundExpanded, setInboundExpanded] = useState(false);
  const [groupExpanded, setGroupExpanded] = useState(false);
  const [selectedGroupFlightIndex, setSelectedGroupFlightIndex] = useState(null);
  
  // Additional state for inbound option grouping
  const [inboundGroupExpanded, setInboundGroupExpanded] = useState({});
  const [selectedInboundGroupIndex, setSelectedInboundGroupIndex] = useState({});
  
  // Improved function to process inbound options safely with grouping support
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
          resultIndex: option.resultIndex,
          groupId: option.groupId // Preserve groupId for grouping inbound options
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
              } else if (inboundOption.sg && Array.isArray(inboundOption.sg) && inboundOption.sg.length > 0) {
                // If sg array exists, use it
                segmentsToUse = inboundOption.sg;
              } else if (inboundOption.departure && inboundOption.arrival) {
                // If the option itself is a segment-like object, use it as a segment
                segmentsToUse = [inboundOption];
              }
              
              allInboundOptions.push({
                index: i,
                price: inboundOption.price || { amount: inboundOption.pF, currency: inboundOption.cr },
                isRefundable: inboundOption.isRefundable !== undefined ? inboundOption.isRefundable : inboundOption.iR,
                fareClass: inboundOption.fareClass || inboundOption.pFC,
                segments: segmentsToUse,
                provider: inboundOption.provider || inboundOption.pr,
                resultIndex: inboundOption.resultIndex || inboundOption.rI,
                groupId: inboundOption.groupId // Preserve groupId for grouping inbound options
              });
            }
          }
        }
      }
    }
    
    // Group inbound options by groupId
    const groupedInboundOptions = groupInboundOptionsByGroupId(allInboundOptions);
    
    return groupedInboundOptions;
  };
  
  // Function to group inbound options by groupId
  const groupInboundOptionsByGroupId = (inboundOptions) => {
    if (!inboundOptions || inboundOptions.length === 0) return [];
    
    // Create a map to store options by groupId
    const groupMap = new Map();
    
    
    // First, group options by groupId
    inboundOptions.forEach(option => {
      const groupId = option.groupId;
      
      // Skip options without groupId - keep them as individual options
      if (groupId === undefined || groupId === null) {
        return;
      }
      
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      
      groupMap.get(groupId).push(option);
    });
    

    
    // Create the final array with grouped options
    let result = [];
    
    // Add options that belong to groups
    groupMap.forEach((options, groupId) => {
      if (options.length === 0) return;
      
      // Take the first option as primary
      const firstOption = options[0];
      
      // Add debug info to option for UI visibility
      firstOption._debugHasGroup = true;
      firstOption._debugGroupSize = options.length;
      
      // If there are more options in the group, add them as groupOptions
      if (options.length > 1) {
        firstOption.groupOptions = options.slice(1);
      }
      
      result.push(firstOption);
    });
    
    // Add back all options that don't have a groupId or weren't grouped
    inboundOptions.forEach(option => {
      const groupId = option.groupId;
      if (groupId === undefined || groupId === null) {
        option._debugHasGroup = false;
        result.push(option);
      }
    });
    
    console.log('Grouped inbound options result:', {
      totalOriginal: inboundOptions.length,
      totalGrouped: result.length,
      withGroups: result.filter(f => f.groupOptions && f.groupOptions.length > 0).length
    });
    
    return result;
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

  // Get group flights if available
  const groupFlights = flight.groupFlights || [];
  const hasGroupFlights = Array.isArray(groupFlights) && groupFlights.length > 0;

  // Price extraction with fallbacks for every format
  const displayPrice = {
    amount: flight.price?.amount || flight.pF || 0,
    currency: flight.price?.currency || flight.cr || 'INR'
  };

  // Get segments from flight (handle both normalized segments and raw sg format)
  const getSegments = (flight) => {
    if (!flight) return [];

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

  // Function to toggle group expansion
  const toggleGroupExpanded = () => {
    setGroupExpanded(!groupExpanded);
    // Reset selected group flight when collapsing
    if (groupExpanded) {
      setSelectedGroupFlightIndex(null);
    }
  };

  // Handle selection of a flight from the group
  const handleSelectGroupFlight = (groupFlight, index, event) => {
    // Stop event propagation to prevent parent div click handler
    event.stopPropagation();
    
    // Update the selected group flight index
    setSelectedGroupFlightIndex(index);
    
    // For DOMESTIC_ROUND_TRIP, ensure we log selection details
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      console.log('Domestic round trip group flight selection:', {
        flightId: groupFlight.resultIndex,
        hasOutbound: !!groupFlight.outbound,
        hasInbound: !!groupFlight.inbound,
        isOutboundTab: isOutbound,
        fromGroupIndex: index,
        structure: groupFlight
      });
    }
    
    // Call the parent onSelect handler with the selected group flight
    onSelect(groupFlight);
  };

  // Handle main flight selection
  const handleMainFlightSelect = (event) => {
    // If a group flight is selected, don't select the main flight
    if (selectedGroupFlightIndex !== null) {
      // Reset the selection instead
      setSelectedGroupFlightIndex(null);
    }
    
    // For domestic round trip, ensure we send the correct flight structure
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {

      
      // Call parent onSelect with the flight object containing rI
      onSelect({
        rI: flight.rI,
        sg: flight.sg,
        pF: flight.pF,
        cr: flight.cr,
        iR: flight.iR,
        pFC: flight.pFC
      });
    } else {
      // For other flight types, call parent onSelect with the original flight
      onSelect(flight);
    }
  };

  // Additional helper to check if this flight is selected
  const isThisFlightSelected = () => {
    // For DOMESTIC_ROUND_TRIP, ensure we're only highlighting the correct flight
    // based on whether we're in the outbound or inbound tab
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      // We need to explicitly compare the resultIndex (flight ID)
      if (isOutbound) {
        // Check both resultIndex and rI properties for compatibility with all data structures
        const flightId = flight.resultIndex || flight.rI;
        const selectedId = selectedOutboundFlight?.resultIndex || selectedOutboundFlight?.rI;
        return flightId === selectedId;
      } else {
        // Check both resultIndex and rI properties for compatibility with all data structures
        const flightId = flight.resultIndex || flight.rI;
        const selectedId = selectedInboundFlight?.resultIndex || selectedInboundFlight?.rI;
        return flightId === selectedId;
      }
    }
    
    // For other flight types, just use isSelected prop as is
    return isSelected;
  };

  // Function to toggle inbound group expansion
  const handleToggleInboundGroup = (optionIndex) => {
    setInboundGroupExpanded(prev => ({
      ...prev,
      [optionIndex]: !prev[optionIndex]
    }));
  };

  // Function to handle selection of a grouped inbound option
  const handleSelectGroupInboundOption = (option, groupIndex, optionIndex, event) => {
    // Stop event propagation
    event.stopPropagation();
    
    // Update the selected inbound group option index
    setSelectedInboundGroupIndex(prev => ({
      ...prev,
      [optionIndex]: groupIndex
    }));
    
    // Select this inbound option
    selectInboundOption(optionIndex);
  };

  // Render inbound option with its group options
  const renderInboundOptionWithGroups = (option, optionIndex) => {
    // Check if this inbound option has grouped options
    const hasGroupOptions = option.groupOptions && option.groupOptions.length > 0;
    const isExpanded = inboundGroupExpanded[optionIndex] || false;
    const selectedGroupIndex = selectedInboundGroupIndex[optionIndex] || null;
    
    // Check if this option is actually selected based on its resultIndex
    const isOptionSelected = isOutbound 
      ? selectedOutboundFlight?.resultIndex === option.resultIndex
      : selectedInboundFlight?.resultIndex === option.resultIndex;
    
    return (
      <div key={`inbound-option-${optionIndex}`} className="border border-gray-200 rounded-md mb-3">
        {/* Main inbound option */}
        <div 
          className={`p-4 ${(selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null ? 'bg-[#eefbf3]' : 'bg-white'}`}
          onClick={() => selectInboundOption(optionIndex)}
        >
          
          {/* Flight segments */}
          <div className="mb-4">
            {option.segments.length > 0 ? (
              option.segments.map((segment, segIndex) => renderSegment(segment, segIndex))
            ) : (
              <div className="text-red-500">No segment data available</div>
            )}
          </div>
          
          {/* Price and selection */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-left">
              <div className="text-lg font-semibold text-[#13804e]">
                {option.price?.currency || 'INR'} {(option.price?.amount || 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                {option.isRefundable ? 'Refundable' : 'Non-refundable'}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Group options button */}
              {hasGroupOptions && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleInboundGroup(optionIndex);
                  }}
                  className="text-white bg-[#093923] hover:bg-[#062918] px-3 py-2 rounded text-sm font-medium flex items-center"
                >
                  {isExpanded ? 'Hide' : 'View'} {option.groupOptions.length} more
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Check if already selected to toggle selection
                  if ((selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null) {
                    // Deselect this option
                    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
                      if (isOutbound) {
                        onSelect({ resultIndex: null, type: 'clear_outbound' });
                      } else {
                        onSelect({ resultIndex: null, type: 'clear_inbound' });
                      }
                    } else {
                      onSelect({ resultIndex: null, type: 'clear_selection' });
                    }
                  } else {
                    selectInboundOption(optionIndex);
                  }
                }}
                className={`relative group px-4 py-2 text-sm font-medium rounded-md overflow-hidden transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a7e0ba] focus:ring-opacity-50 ${ 
                  (selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null 
                    ? 'bg-[#093923] text-white' // Selected State: Solid dark green
                    : 'bg-white text-[#13804e] border border-[#13804e]' // Default State: White bg, green text/border
                }`}
              >
                {/* Background fill for hover (only when not selected) */}
                {!((selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null) && (
                  <span className="absolute inset-0 bg-[#093923] w-0 group-hover:w-full transition-all duration-300 ease-in-out z-0"></span>
                )}
                {/* Text element */}
                <span className={`relative z-10 ${!((selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null) ? 'group-hover:text-white' : ''}`}> 
                  {(selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null ? 'Selected' : 'Select'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Grouped inbound options */}
        {hasGroupOptions && isExpanded && (
          <div className="border-t border-gray-200 p-2 bg-gray-50">
            <div className="space-y-3">
              {option.groupOptions.map((groupOption, groupIndex) => {
                // Check if this group option is actually selected by checking its ID
                const isGroupOptionSelected = isOutbound 
                  ? selectedOutboundFlight?.resultIndex === groupOption.resultIndex
                  : selectedInboundFlight?.resultIndex === groupOption.resultIndex;
                
                return (
                  <div 
                    key={`group-option-${optionIndex}-${groupIndex}`}
                    className={`p-3 border rounded-md ${
                      (selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected
                        ? 'border-[#13804e] ring-2 ring-[#a7e0ba] bg-white'
                        : 'border-gray-200 bg-white'
                    }`}
                    onClick={(e) => handleSelectGroupInboundOption(groupOption, groupIndex, optionIndex, e)}
                  >
                    {/* Flight segments */}
                    <div className="mb-3">
                      {groupOption.segments.length > 0 ? (
                        groupOption.segments.map((segment, segIndex) => renderSegment(segment, segIndex))
                      ) : (
                        <div className="text-red-500">No segment data available</div>
                      )}
                    </div>
                    
                    {/* Price and selection */}
                    <div className="flex justify-between items-center mt-3">
                      <div className="text-left">
                        <div className="text-lg font-semibold text-[#13804e]">
                          {groupOption.price?.currency || 'INR'} {(groupOption.price?.amount || 0).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {groupOption.isRefundable ? 'Refundable' : 'Non-refundable'}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle selection if already selected, otherwise select
                          if ((selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected) {
                            // Deselect this option
                            if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
                              if (isOutbound) {
                                onSelect({ resultIndex: null, type: 'clear_outbound' });
                              } else {
                                onSelect({ resultIndex: null, type: 'clear_inbound' });
                              }
                            } else {
                              onSelect({ resultIndex: null, type: 'clear_selection' });
                            }
                          } else {
                            handleSelectGroupInboundOption(groupOption, groupIndex, optionIndex, e);
                          }
                        }}
                        className={`relative group px-4 py-2 text-sm font-medium rounded-md overflow-hidden transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a7e0ba] focus:ring-opacity-50 ${ 
                          (selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected 
                            ? 'bg-[#093923] text-white' // Selected state
                            : 'bg-white text-[#13804e] border border-[#13804e]' // Default state
                        }`}
                      >
                        {/* Background fill for hover (only when not selected) */}
                        {!((selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected) && (
                          <span className="absolute inset-0 bg-[#093923] w-0 group-hover:w-full transition-all duration-300 ease-in-out z-0"></span>
                        )}
                        {/* Text element */}
                        <span className={`relative z-10 ${!((selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected) ? 'group-hover:text-white' : ''}`}> 
                          {(selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected ? 'Selected' : 'Select'}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render group flights if expanded
  const renderGroupFlights = () => {
    if (!hasGroupFlights || !groupExpanded) return null;
    
    return (
      <div className="mt-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">More options with this airline</h4>
        <div className="space-y-3">
          {groupFlights.map((groupFlight, index) => {
            if (!groupFlight) return null;
            
            // Check if this group flight is selected
            let isGroupFlightSelected = selectedGroupFlightIndex === index;
            
            // For DOMESTIC_ROUND_TRIP, verify against the actual selected flight by ID
            if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
              if (isOutbound && selectedOutboundFlight) {
                isGroupFlightSelected = selectedGroupFlightIndex === index && 
                  selectedOutboundFlight.resultIndex === groupFlight.resultIndex;
              } else if (!isOutbound && selectedInboundFlight) {
                isGroupFlightSelected = selectedGroupFlightIndex === index && 
                  selectedInboundFlight.resultIndex === groupFlight.resultIndex;
              }
            }
            
            // Handle different flight types for group flights
            let groupSegments = [];
            
            if (isOneWay) {
              groupSegments = getSegments(groupFlight);
            } else if (isDomesticRoundTripCombined) {
              // Skip rendering if either outbound or inbound is missing
              if (!groupFlight.outbound || !groupFlight.inbound) return null;
            } else if (isInternationalRoundTrip) {
              if (hasOutboundSegments) {
                if (!groupFlight.outboundSegments || groupFlight.outboundSegments.length === 0) return null;
              } else if (hasOutboundFlight) {
                if (!groupFlight.outboundFlight || groupFlight.outboundFlight.length === 0) return null;
              } else {
                return null;
              }
            }
            
            return (
              <div 
                key={`group-flight-${index}`}
                className={`p-4 border rounded-md ${isGroupFlightSelected ? 'border-[#13804e] ring-2 ring-[#a7e0ba]' : 'border-gray-200'} bg-white shadow-sm hover:shadow-md transition-shadow`}
                onClick={(e) => handleSelectGroupFlight(groupFlight, index, e)}
              >
                {/* One-way flight */}
                {isOneWay && (
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {groupSegments.length > 0 ? (
                        groupSegments.map((segment, segIndex) => renderSegment(segment, segIndex))
                      ) : (
                        <div className="text-red-500">No segment data available</div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Domestic round trip */}
                {isDomesticRoundTripCombined && (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-[#13804e] mb-2">Outbound</div>
                      <div className="flex-1">
                        {getSegments(groupFlight.outbound).length > 0 ? (
                          getSegments(groupFlight.outbound).map((segment, segIndex) => 
                            renderSegment(segment, segIndex)
                          )
                        ) : (
                          <div className="text-red-500">No outbound segment data available</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#13804e] mb-2">Inbound</div>
                      <div className="flex-1">
                        {getSegments(groupFlight.inbound).length > 0 ? (
                          getSegments(groupFlight.inbound).map((segment, segIndex) => 
                            renderInboundOptionWithGroups(segment, segIndex)
                          )
                        ) : (
                          <div className="text-red-500">No inbound segment data available</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* International round trip with outbound and inbound options */}
                {isInternationalRoundTrip && (
                  <div className="space-y-6">
                    {/* Outbound section */}
                    <div>
                      <div className="text-sm font-semibold text-[#13804e] mb-2">Outbound</div>
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
                    
                    {/* Only show "Return options available" text for outbound tab */}
                    {isOutbound && (
                      <div className="text-sm text-gray-500 italic">
                        {allInboundOptions.length} return options available
                      </div>
                    )}
                    
                    {/* Show inbound options if we're in the inbound tab */}
                    {!isOutbound && renderInboundOptions()}
                  </div>
                )}
                
                {/* Price and select button for each group flight */}
                <div className="mt-4 flex justify-between items-center">
                  <div className="text-left">
                    <div className="text-lg font-semibold text-[#13804e]">
                      {groupFlight.price?.currency || displayPrice.currency} {(groupFlight.price?.amount || displayPrice.amount).toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {groupFlight.isRefundable !== undefined ? (groupFlight.isRefundable ? 'Refundable' : 'Non-refundable') : isRefundable ? 'Refundable' : 'Non-refundable'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Toggle selection if already selected, otherwise select it
                      if (isGroupFlightSelected) {
                        setSelectedGroupFlightIndex(null);
                        // For DOMESTIC_ROUND_TRIP mode, we need to clear the correct selection
                        if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
                          // Notify parent component that selection should be cleared
                          if (isOutbound) {
                            onSelect({ resultIndex: null, type: 'clear_outbound' });
                          } else {
                            onSelect({ resultIndex: null, type: 'clear_inbound' });
                          }
                        } else {
                          // For other flight types, use general clear_selection
                          onSelect({ resultIndex: null, type: 'clear_selection' });
                        }
                      } else {
                        handleSelectGroupFlight(groupFlight, index, e);
                      }
                    }}
                    className={`relative group px-4 py-2 text-sm font-medium rounded-md overflow-hidden transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a7e0ba] focus:ring-opacity-50 ${ 
                      isGroupFlightSelected
                        ? 'bg-[#093923] text-white'
                        : 'bg-white text-[#13804e] border border-[#13804e]'
                    }`}
                  >
                    {isGroupFlightSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // For international round trips - render inbound options section
  const renderInboundOptions = () => {
    if (!isInternationalRoundTrip || !allInboundOptions || allInboundOptions.length === 0) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-600">No return flight options available.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {allInboundOptions.map((option, index) => renderInboundOptionWithGroups(option, index))}
      </div>
    );
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-sm border p-4 ${
          isThisFlightSelected() ? 'border-[#13804e] ring-2 ring-[#a7e0ba]' : 'border-gray-200'
        } hover:shadow-md transition-shadow cursor-pointer`}
        onClick={handleMainFlightSelect}
      >
        
        {/* Main content area */}
        <div className="space-y-6">
          {/* One-way flight */}
          {isOneWay && (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                {segments.length > 0 ? (
                  segments.map((segment, index) => renderSegment(segment, index))
                ) : (
                  <div className="text-red-500">No segment data available</div>
                )}
              </div>
            </div>
          )}
          
          {/* Display outbound and inbound for domestic round trip */}
          {isDomesticRoundTripCombined && (
            <div className="space-y-6">
              {/* Outbound section */}
              <div>
                <div className="text-sm font-semibold text-[#13804e] mb-2">Outbound</div>
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
                <div className="text-sm font-semibold text-[#13804e] mb-2">Inbound</div>
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
            </div>
          )}
          
          {/* International round trip with outbound and inbound options */}
          {isInternationalRoundTrip && (
            <div className="space-y-6">
              {/* Outbound section */}
              <div>
                <div className="text-sm font-semibold text-[#13804e] mb-2">Outbound</div>
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
              
              {/* Only show "Return options available" text for outbound tab */}
              {isOutbound && (
                <div className="text-sm text-gray-500 italic">
                  {allInboundOptions.length} return options available
                </div>
              )}
              
              {/* Show inbound options if we're in the inbound tab */}
              {!isOutbound && renderInboundOptions()}
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-left">
            <div className="text-2xl font-bold text-[#13804e]">
              {displayPrice.currency} {displayPrice.amount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {isRefundable ? 'Refundable' : 'Non-refundable'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Group flights button */}
            {hasGroupFlights && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleGroupExpanded();
                }}
                className="text-white bg-[#093923] hover:bg-[#062918] px-3 py-2 rounded text-sm font-medium flex items-center"
              >
                {groupExpanded ? 'Hide' : 'View'} {groupFlights.length} more
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-4 w-4 ml-1 transition-transform ${groupExpanded ? 'rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                
                // Toggle selection - if already selected, clear the selection
                if (isThisFlightSelected()) {
                  // Check which flight structure we're dealing with
                  if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
                    // Notify parent component that selection should be cleared
                    if (isOutbound) {
                      onSelect({ resultIndex: null, type: 'clear_outbound' });
                    } else {
                      onSelect({ resultIndex: null, type: 'clear_inbound' });
                    }
                  } else {
                    // For other flight types, just pass a clear action
                    onSelect({ resultIndex: null, type: 'clear_selection' });
                  }
                } else {
                  // Select this flight
                  handleMainFlightSelect(e);
                }
              }}
              className={`relative group px-4 py-2 text-sm font-medium rounded-md overflow-hidden transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a7e0ba] focus:ring-opacity-50 ${ 
                isThisFlightSelected()
                  ? 'bg-[#093923] text-white'
                  : 'bg-white text-[#13804e] border border-[#13804e]'
              }`}
            >
              {isThisFlightSelected() ? 'Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Group flights section - moved outside the main card */}
      {renderGroupFlights()}
    </>
  );
};

// New FlightSummaryPanel component for the right side with proper price calculation
const FlightSummaryPanel = ({ 
  selectedOutboundFlight, 
  selectedInboundFlight, 
  flightStructureType,
  selectedInboundOptionIndex = null, // Default to null to clearly indicate no selection
  onCreateItinerary 
}) => {
  // Add isCreatingItinerary state
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  
  // Debug log for component inputs
  useEffect(() => {
    console.log('FlightSummaryPanel received props:', {
      flightStructureType,
      outboundFlightId: selectedOutboundFlight?.resultIndex || selectedOutboundFlight?.rI, // Added rI fallback
      inboundFlightId: selectedInboundFlight?.resultIndex || selectedInboundFlight?.rI, // Added rI fallback
      selectedInboundOptionIndex
    });
    
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      console.log('Domestic RT Flight Structure:', {
        outbound: selectedOutboundFlight ? {
          hasOutbound: !!selectedOutboundFlight.outbound,
          hasInbound: !!selectedOutboundFlight.inbound,
          structure: selectedOutboundFlight
        } : 'No outbound flight selected',
        inbound: selectedInboundFlight ? {
          hasOutbound: !!selectedInboundFlight.outbound,
          hasInbound: !!selectedInboundFlight.inbound,
          structure: selectedInboundFlight
        } : 'No inbound flight selected'
      });
    }
  }, [selectedOutboundFlight, selectedInboundFlight, flightStructureType, selectedInboundOptionIndex]);

  // Function to calculate total price with correct logic for each flight type
  const calculateTotalPrice = () => {
    let total = 0;
    let currency = 'INR';
    
    if (!selectedOutboundFlight) {
      return { amount: 0, currency };
    }

    // --- INTERNATIONAL_ROUND_TRIP Logic ---
    if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      // If an inbound option IS selected, its price is the total round trip price
      if (selectedInboundOptionIndex !== null && 
          selectedOutboundFlight.inboundOptions &&
          selectedInboundOptionIndex >= 0 && // Ensure index is valid
          selectedInboundOptionIndex < selectedOutboundFlight.inboundOptions.length) {
        
        const selectedOptionData = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex];
        const option = Array.isArray(selectedOptionData) ? selectedOptionData[0] : selectedOptionData;

        if (option) {
          if (option.price?.amount !== undefined) {
            total = option.price.amount;
            currency = option.price.currency || currency;
          } else if (typeof option.pF === 'number') { // Legacy format
            total = option.pF;
            currency = option.cr || currency;
          }
          console.log('International RT - Using Inbound Option Price as Total:', { total, currency });
          return { amount: total, currency };
        }
      }
      
      // If NO inbound option is selected yet, show the outbound flight's price (might be just outbound leg)
      if (selectedOutboundFlight.price?.amount !== undefined) {
        total = selectedOutboundFlight.price.amount;
        currency = selectedOutboundFlight.price.currency || currency;
      } else if (selectedOutboundFlight.outbound?.price?.amount !== undefined) { // Handle nested outbound price
        total = selectedOutboundFlight.outbound.price.amount;
        currency = selectedOutboundFlight.outbound.price.currency || currency;
      } else if (typeof selectedOutboundFlight.pF === 'number') { // Legacy format
        total = selectedOutboundFlight.pF;
        currency = selectedOutboundFlight.cr || currency;
      }
      console.log('International RT - Using Outbound Price (Inbound not selected):', { total, currency });
      return { amount: total, currency };
    }

    // --- ONE_WAY Logic ---
    if (flightStructureType === 'ONE_WAY') {
      if (selectedOutboundFlight.price?.amount !== undefined) {
        total = selectedOutboundFlight.price.amount;
        currency = selectedOutboundFlight.price.currency || currency;
      } else if (typeof selectedOutboundFlight.pF === 'number') { // Legacy format
        total = selectedOutboundFlight.pF;
        currency = selectedOutboundFlight.cr || currency;
      }
      console.log('One Way - Using Outbound Price:', { total, currency });
      return { amount: total, currency };
    }
    
    // --- DOMESTIC_ROUND_TRIP Logic (Summing parts) ---
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      let outboundPrice = 0;
      // Get outbound price (check multiple formats)
      if (selectedOutboundFlight.price?.amount !== undefined) {
        outboundPrice = selectedOutboundFlight.price.amount;
        currency = selectedOutboundFlight.price.currency || currency;
      } else if (selectedOutboundFlight.outbound?.price?.amount !== undefined) {
        outboundPrice = selectedOutboundFlight.outbound.price.amount;
        currency = selectedOutboundFlight.outbound.price.currency || currency;
      } else if (typeof selectedOutboundFlight.pF === 'number') { // Legacy format
        outboundPrice = selectedOutboundFlight.pF;
        currency = selectedOutboundFlight.cr || currency;
      }
      total += outboundPrice;
      console.log('Domestic RT - Outbound price added:', outboundPrice);

      // Get inbound price if selected
      if (selectedInboundFlight) {
        let inboundPrice = 0;
        if (selectedInboundFlight.price?.amount !== undefined) {
          inboundPrice = selectedInboundFlight.price.amount;
        } else if (selectedInboundFlight.inbound?.price?.amount !== undefined) {
          inboundPrice = selectedInboundFlight.inbound.price.amount;
        } else if (typeof selectedInboundFlight.pF === 'number') { // Legacy format
          inboundPrice = selectedInboundFlight.pF;
        }
        total += inboundPrice;
        console.log('Domestic RT - Inbound price added:', inboundPrice);
      }
      console.log('Domestic RT - Final Total:', { total, currency });
      return { amount: total, currency };
    }

    // Fallback if type is unknown (should not happen)
    console.warn('Unknown flightStructureType in calculateTotalPrice:', flightStructureType);
    return { amount: 0, currency };
  };
  
  // Function to extract relevant data for outbound flight
  const getOutboundFlightData = () => {
    if (!selectedOutboundFlight) return null;

    // Log the received object for debugging
    console.log('[DEBUG] getOutboundFlightData - Received selectedOutboundFlight:', JSON.stringify(selectedOutboundFlight, null, 2));

    let segments = [];
    let airline = '';
    let flightNumber = '';
    let departure = { airport: {}, city: {} }; // Initialize nested objects
    let arrival = { airport: {}, city: {} };   // Initialize nested objects
    let price = { amount: 0, currency: 'INR' };
    let baseFare = 0;
    let tax = 0;
    let duration = 0;
    let stops = 0;
    let fareClass = '';
    let baggage = '';
    let cabinBaggage = '';
    
    // --- Define the segment source based on flight type ---
    let segmentsToUse = [];
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      segmentsToUse = selectedOutboundFlight.sg || []; // Domestic uses sg
    } else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      // Intl RT: Prioritize outboundSegments, then outboundFlight, then segments, then sg
      if (selectedOutboundFlight.outboundSegments && Array.isArray(selectedOutboundFlight.outboundSegments)) {
        segmentsToUse = selectedOutboundFlight.outboundSegments;
        console.log('Using selectedOutboundFlight.outboundSegments for segments', segmentsToUse);
      } else if (selectedOutboundFlight.outboundFlight && Array.isArray(selectedOutboundFlight.outboundFlight)) {
        segmentsToUse = selectedOutboundFlight.outboundFlight;
        console.log('Using selectedOutboundFlight.outboundFlight for segments', segmentsToUse);
      } else if (selectedOutboundFlight.segments && Array.isArray(selectedOutboundFlight.segments)) {
        segmentsToUse = selectedOutboundFlight.segments;
        console.log('Using selectedOutboundFlight.segments for segments', segmentsToUse);
      } else if (selectedOutboundFlight.sg && Array.isArray(selectedOutboundFlight.sg)) {
        segmentsToUse = selectedOutboundFlight.sg; // Legacy fallback
        console.log('Using selectedOutboundFlight.sg for segments', segmentsToUse);
      }
    } else { // ONE_WAY
      // One Way: Prioritize segments, then sg
      if (selectedOutboundFlight.segments && Array.isArray(selectedOutboundFlight.segments)) {
        segmentsToUse = selectedOutboundFlight.segments;
      } else if (selectedOutboundFlight.sg && Array.isArray(selectedOutboundFlight.sg)) {
        segmentsToUse = selectedOutboundFlight.sg; // Legacy fallback
      }
    }
    // ------------------------------------------------------

    // --- Extract details using segmentsToUse ---
    if (segmentsToUse.length > 0) {
      const firstSegment = segmentsToUse[0];
      const lastSegment = segmentsToUse[segmentsToUse.length - 1];

      // Use optional chaining and nullish coalescing for robust access
      airline = firstSegment.al?.alN ?? firstSegment.airline?.name ?? '';
      flightNumber = firstSegment.al?.fN?.trim() ?? firstSegment.airline?.flightNumber ?? ''; // Added trim for legacy fN
      // Prioritize full fare class code, format it, fallback to simple code
      fareClass = firstSegment.al?.fCFC 
        ? firstSegment.al.fCFC.replace(/_/g, ' ').replace(/^.*?_/, '') // Remove prefix like E_
        : (firstSegment.al?.fC ?? firstSegment.airline?.fareClass ?? 'Economy'); // Fallback includes default
      
      // Departure extraction (Prioritize normalized, then legacy)
      departure = {
        airport: {
          code: firstSegment.departure?.airport?.code ?? firstSegment.or?.aC ?? '',
          terminal: firstSegment.departure?.airport?.terminal ?? firstSegment.or?.tr ?? '',
          name: firstSegment.departure?.airport?.name ?? firstSegment.or?.aN ?? '' // Added fallback for airport name
        },
        city: {
          // Check both normalized and legacy locations for city name
          name: firstSegment.departure?.city?.name ?? firstSegment.or?.cN ?? '' 
        },
        time: firstSegment.departure?.time ?? firstSegment.or?.dT
      };
      
      // Arrival extraction (Prioritize normalized, then legacy)
      arrival = {
        airport: {
          code: lastSegment.arrival?.airport?.code ?? lastSegment.ds?.aC ?? '',
          terminal: lastSegment.arrival?.airport?.terminal ?? lastSegment.ds?.tr ?? '',
          name: lastSegment.arrival?.airport?.name ?? lastSegment.ds?.aN ?? '' // Added fallback for airport name
        },
        city: {
          // Check both normalized and legacy locations for city name
          name: lastSegment.arrival?.city?.name ?? lastSegment.ds?.cN ?? '' 
        },
        time: lastSegment.arrival?.time ?? lastSegment.ds?.aT
      };
      
      baggage = firstSegment.bg ?? firstSegment.baggage ?? '';
      cabinBaggage = firstSegment.cBg ?? firstSegment.cabinBaggage ?? '';
      
      // Calculate total duration and stops
      duration = segmentsToUse.reduce((total, segment) => {
        // Check both dr (legacy) and duration (normalized)
        const segmentDuration = segment.dr ?? segment.duration ?? 0;
        console.log(`Segment duration (from ${segment.dr !== undefined ? 'dr' : 'duration'}):`, segmentDuration);
        return total + segmentDuration;
      }, 0);
      console.log('Calculated total duration (minutes):', duration);
      stops = segmentsToUse.length > 1 ? segmentsToUse.length - 1 : 0;
    } else {
        console.log('No segments found to extract details from.');
    }
    // ---------------------------------------------
    
    // --- Price extraction (remains mostly the same, uses selectedOutboundFlight directly) ---
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      if (selectedOutboundFlight.pF) {
        price = { 
          amount: selectedOutboundFlight.pF, 
          currency: selectedOutboundFlight.cr || 'INR' 
        };
        baseFare = selectedOutboundFlight.bF || Math.round(price.amount * 0.85) || 0;
        tax = price.amount - baseFare;
      }
    } else { // Intl RT or One Way
      if (selectedOutboundFlight.price?.amount) {
        price = selectedOutboundFlight.price;
        // Pax breakdown might be available for base/tax
        const paxBreakdown = selectedOutboundFlight.paxFareBreakUp?.[0];
        baseFare = paxBreakdown?.baseFare ?? Math.round(price.amount * 0.85) ?? 0;
        tax = paxBreakdown?.tax ?? Math.round(price.amount * 0.15) ?? 0;
      } else if (typeof selectedOutboundFlight.pF === 'number') { // Legacy
        price = { 
          amount: selectedOutboundFlight.pF, 
          currency: selectedOutboundFlight.cr || 'INR' 
        };
        baseFare = selectedOutboundFlight.bF || Math.round(price.amount * 0.85) || 0;
        tax = price.amount - baseFare;
      }
    }
    // ------------------------------------------------------------------------------
    
    console.log('Extracted outbound data:', { airline, flightNumber, price, duration, stops });
    
    return {
      airline,
      flightNumber,
      departure,
      arrival,
      baseFare,
      tax,
      price,
      duration,
      stops,
      fareClass,
      baggage,
      cabinBaggage
    };
  };
  
  // Function to extract relevant data for inbound flight
  const getInboundFlightData = () => {
    let inboundDataSource = null;
    let isDomestic = flightStructureType === 'DOMESTIC_ROUND_TRIP';
    let isInternational = flightStructureType === 'INTERNATIONAL_ROUND_TRIP';

    // Determine the source of inbound data
    if (isDomestic) {
      inboundDataSource = selectedInboundFlight;
    } else if (isInternational && selectedInboundOptionIndex !== null && selectedOutboundFlight?.inboundOptions) {
      let optionContainer = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex];
      inboundDataSource = Array.isArray(optionContainer) ? optionContainer[0] : optionContainer;
    }

    if (!inboundDataSource) {
      // console.log('No valid source for inbound flight data.'); // Keep logs minimal
      return null;
    }

    // Initialize variables
    let segments = [];
    let airline = '';
    let flightNumber = '';
    let departure = { airport: {}, city: {} };
    let arrival = { airport: {}, city: {} };
    let price = { amount: 0, currency: 'INR' };
    let baseFare = 0;
    let tax = 0;
    let duration = 0;
    let stops = 0;
    let baggage = '';
    let cabinBaggage = '';

    // --- Extract Data Based on Flight Type ---
    if (isDomestic) {
      segments = inboundDataSource.sg || []; // Domestic uses sg
      if (segments.length > 0) {
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        airline = firstSegment.al?.alN ?? '';
        flightNumber = firstSegment.al?.fN?.trim() ?? '';

        departure = {
          airport: {
            code: firstSegment.or?.aC ?? '',
            terminal: firstSegment.or?.tr ?? '',
            name: firstSegment.or?.aN ?? ''
          },
          city: { name: firstSegment.or?.cN ?? '' }, // Use cN for city
          time: firstSegment.or?.dT
        };

        arrival = {
          airport: {
            code: lastSegment.ds?.aC ?? '',
            terminal: lastSegment.ds?.tr ?? '',
            name: lastSegment.ds?.aN ?? ''
          },
          city: { name: lastSegment.ds?.cN ?? '' }, // Use cN for city
          time: lastSegment.ds?.aT
        };

        baggage = firstSegment.bg ?? '';
        cabinBaggage = firstSegment.cBg ?? '';
        duration = segments.reduce((total, segment) => total + (segment.dr ?? 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;

        // Price from the source object directly
        if (inboundDataSource.pF) {
          price = { amount: inboundDataSource.pF, currency: inboundDataSource.cr || 'INR' };
          baseFare = inboundDataSource.bF || Math.round(price.amount * 0.85) || 0;
          // Correct tax calculation for domestic using baseFare
          tax = price.amount - baseFare; 
        }
      } else {
        console.log('No segments found in domestic inbound source.');
      }
    } else if (isInternational) {
       // Use the already determined 'inboundDataSource' which points to the selected option
      segments = inboundDataSource.segments || []; // Intl uses segments array
       if (segments.length > 0) {
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        airline = firstSegment.airline?.name ?? '';
        flightNumber = firstSegment.airline?.flightNumber ?? '';

        departure = {
          airport: {
            code: firstSegment.departure?.airport?.code ?? '',
            terminal: firstSegment.departure?.airport?.terminal ?? '',
            name: firstSegment.departure?.airport?.name ?? ''
           },
          city: { name: firstSegment.departure?.city?.name ?? '' },
          time: firstSegment.departure?.time
        };

        arrival = {
          airport: {
            code: lastSegment.arrival?.airport?.code ?? '',
            terminal: lastSegment.arrival?.airport?.terminal ?? '',
            name: lastSegment.arrival?.airport?.name ?? ''
          },
          city: { name: lastSegment.arrival?.city?.name ?? '' },
          time: lastSegment.arrival?.time
        };

        baggage = firstSegment.baggage ?? '';
        cabinBaggage = firstSegment.cabinBaggage ?? '';
        duration = segments.reduce((total, segment) => total + (segment.duration ?? 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;

        // Price extraction from the selected option
        if (inboundDataSource.price?.amount !== undefined) {
          price = inboundDataSource.price;
          // Use baseFare/tax directly if available in price object (common for Intl)
          baseFare = inboundDataSource.price.baseFare ?? inboundDataSource.bF ?? Math.round(price.amount * 0.85) ?? 0;
          tax = inboundDataSource.price.tax ?? (price.amount - baseFare) ?? 0;
        } else if (typeof inboundDataSource.pF === 'number') { // Legacy on option
          price = { amount: inboundDataSource.pF, currency: inboundDataSource.cr || 'INR' };
          baseFare = inboundDataSource.bF || Math.round(price.amount * 0.85) || 0;
          tax = price.amount - baseFare;
        }
      } else {
         console.log('No segments found in international inbound option.');
      }
    }

    // --- Final checks and return ---
    // Only return data if we successfully extracted key info like airline and city names
    if (airline && departure.city?.name && arrival.city?.name) {
      console.log('[FINAL] Extracted inbound data:', { airline, flightNumber, departure, arrival, price, duration, stops });
      return {
        airline,
        flightNumber,
        departure, // Should now contain correct city name
        arrival,   // Should now contain correct city name
        baseFare,
        tax,
        price,
        duration,
        stops,
        baggage,
        cabinBaggage
      };
    } else {
      console.warn('[WARN] Failed to extract sufficient inbound details. Returning null.', { isDomestic, isInternational, inboundDataSource });
      return null; // Return null if essential data is missing
    }
  };

  const outboundData = getOutboundFlightData();
  const inboundData = getInboundFlightData();
  const totalPrice = calculateTotalPrice();

  // Determine if the price shown is the final round trip price (for Intl RT)
  const isFinalIntlPrice = flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex !== null;

  // Function to handle the create itinerary button click with loading state
  const handleCreateItinerary = async () => {
    if (isCreatingItinerary) return;
    
    setIsCreatingItinerary(true);
    try {
      await onCreateItinerary();
    } finally {
      // In case onCreateItinerary doesn't have error handling
      setIsCreatingItinerary(false);
    }
  };

  if (!selectedOutboundFlight) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg shadow-md border border-gray-200 h-full flex flex-col justify-center">
        <h3 className="text-xl font-semibold mb-6 text-gray-800 text-center px-4">Flight Summary</h3>
        <div className="text-gray-500 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium mb-2">No flight selected</p>
          <p className="text-base">Select a flight to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-6 rounded-lg shadow-xl border border-gray-200 h-full flex flex-col">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b border-gray-300 pb-3">Flight Summary</h3>
      
      {/* Add pb-4 to give button room to scale on hover */}
      <div className="flex-grow space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-4">
        {/* Departure (Outbound) Flight Information */}
        {outboundData && (
          <div className="mb-6">
            {/* Departure Header & Airline */} 
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-[#093923]">Departure</h4>
              <span className="font-semibold text-gray-700 text-right">{outboundData.airline} {outboundData.flightNumber}</span>
            </div>
            
            <div className="space-y-3 bg-white px-3 py-4 rounded-md shadow-sm border border-gray-100">


              {/* Cities & Times */} 
              <div className="flex justify-between items-center">
                {outboundData.departure && outboundData.arrival && (
                  <div className="text-xs text-gray-700">
                    <div className="flex items-center space-x-2">
                      {/* Display City Name if available, otherwise fallback to Code */}
                      <span title={outboundData.departure.airport?.name}>{outboundData.departure.city?.name || outboundData.departure.airport?.code}</span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      <span title={outboundData.arrival.airport?.name}>{outboundData.arrival.city?.name || outboundData.arrival.airport?.code}</span>
                    </div>
                  </div>
                )}
                {outboundData.departure.time && (
                  <span className="text-xs text-gray-500 text-right whitespace-nowrap">
                    {formatTime(outboundData.departure.time)} - {formatTime(outboundData.arrival.time)}
                  </span>
                )}
              </div>

              {/* Separator */} 
              <div className="border-t border-gray-200 my-2"></div>

              {/* Additional flight details (Duration, Baggage) */}
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm text-gray-600 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <span className="block text-xs font-medium text-gray-500">Duration:</span>
                    <span>{formatDuration(outboundData.duration || 0)}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-medium text-gray-500">Stops:</span>
                    <span>{outboundData.stops === 0 ? 'Non-stop' : `${outboundData.stops} stop${outboundData.stops !== 1 ? 's' : ''}`}</span>
                  </div>
                  {outboundData.baggage && (
                    <div className="text-center">
                      <span className="block text-xs font-medium text-gray-500">Baggage:</span>
                      <span>{outboundData.baggage}</span>
                    </div>
                  )}
                  {outboundData.cabinBaggage && (
                    <div className="text-center">
                      <span className="block text-xs font-medium text-gray-500">Cabin:</span>
                      <span>{outboundData.cabinBaggage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditionally show outbound fare only if NOT Intl RT final price */}
              {!isFinalIntlPrice && (
                <div className="text-sm">
                  <div className="flex justify-between font-medium mt-1">
                    <span>Fare:</span>
                    <span>{outboundData.price.currency} {outboundData.price.amount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Divider between Departure and Return */}
        {outboundData && inboundData && (
          <div className="border-t border-gray-300 my-6"></div>
        )}
        
        {/* Inbound Flight Information */}
        {inboundData && (
          <div className="mb-6">
            {/* Return Header & Airline */} 
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-semibold text-[#093923]">Return</h4>
              <span className="font-semibold text-gray-700 text-right">{inboundData.airline} {inboundData.flightNumber}</span>
            </div>
            
            <div className="space-y-3 bg-white px-3 py-4 rounded-md shadow-sm border border-gray-100">

              {/* Cities & Times */} 
              <div className="flex justify-between items-center">
                {inboundData.departure && inboundData.arrival && (
                  <div className="text-xs text-gray-700">
                    <div className="flex items-center space-x-2">
                      {/* Display City Name if available, otherwise fallback to Code */}
                      <span title={inboundData.departure.airport?.name}>{inboundData.departure.city?.name || inboundData.departure.airport?.code}</span>
                      <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                      <span title={inboundData.arrival.airport?.name}>{inboundData.arrival.city?.name || inboundData.arrival.airport?.code}</span>
                    </div>
                  </div>
                )}
                {inboundData.departure.time && (
                  <span className="text-xs text-gray-500 text-right whitespace-nowrap">
                    {formatTime(inboundData.departure.time)} - {formatTime(inboundData.arrival.time)}
                  </span>
                )}
              </div>

              {/* Separator */} 
              <div className="border-t border-gray-200 my-2"></div>

              {/* Additional flight details (Duration, Baggage) */}
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-sm text-gray-600 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <span className="block text-xs font-medium text-gray-500">Duration:</span>
                    <span>{formatDuration(inboundData.duration || 0)}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs font-medium text-gray-500">Stops:</span>
                    <span>{inboundData.stops === 0 ? 'Non-stop' : `${inboundData.stops} stop${inboundData.stops !== 1 ? 's' : ''}`}</span>
                  </div>
                  {inboundData.baggage && (
                    <div className="text-center">
                      <span className="block text-xs font-medium text-gray-500">Baggage:</span>
                      <span>{inboundData.baggage}</span>
                    </div>
                  )}
                  {inboundData.cabinBaggage && (
                    <div className="text-center">
                      <span className="block text-xs font-medium text-gray-500">Cabin:</span>
                      <span>{inboundData.cabinBaggage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Conditionally show inbound fare only if NOT Intl RT final price */}
              {!isFinalIntlPrice && (
                <div className="text-sm">
                  <div className="flex justify-between font-medium mt-1">
                    <span>Fare:</span>
                    <span>{inboundData.price.currency} {inboundData.price.amount.toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Divider */}
        <div className="border-t border-gray-300 my-6 pt-6"></div>
        
        {/* Total */}
        <div className="mb-6">
          <div className="flex justify-between text-2xl font-bold text-[#093923] mb-3">
            <span>Total:</span>
            <span>{totalPrice.currency} {totalPrice.amount.toLocaleString()}</span>
          </div>
          
          {/* Fare breakdown - Conditionally hide/adjust for Intl RT final price */}
          {!isFinalIntlPrice && (
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Base fare:</span>
                <span>{totalPrice.currency} {(outboundData?.baseFare + (inboundData?.baseFare || 0)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & fees:</span>
                <span>{totalPrice.currency} {(outboundData?.tax + (inboundData?.tax || 0)).toLocaleString()}</span>
              </div>
            </div>
          )}
          {isFinalIntlPrice && (
             <div className="mt-1 text-xs text-gray-500">
               (Total round trip fare)
             </div>
          )}
        </div>
        
        {/* CTA Button */}
        {selectedOutboundFlight && (
          flightStructureType === 'ONE_WAY' ||
          (flightStructureType === 'DOMESTIC_ROUND_TRIP' && selectedInboundFlight) ||
          (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex !== null)
        ) && (
          <button
            onClick={handleCreateItinerary}
            disabled={isCreatingItinerary}
            className={`relative group w-full py-3.5 ${isCreatingItinerary ? 'bg-[#13804e]/70' : 'bg-[#13804e]'} text-white text-lg font-semibold rounded-lg shadow-lg overflow-hidden transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#a7e0ba] focus:ring-opacity-75`}
          >
            {/* Background fill element */}
            <span className={`absolute inset-0 bg-[#062918] w-0 ${!isCreatingItinerary && 'group-hover:w-full'} transition-all duration-300 ease-in-out z-0`}></span>
            {/* Text element */}
            <span className="relative z-10 flex items-center justify-center">
              {isCreatingItinerary && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isCreatingItinerary ? 'Creating Itinerary...' : 'Create Itinerary'}
            </span>
          </button>
        )}
        
        {/* Messages for incomplete selection */}
        {flightStructureType === 'DOMESTIC_ROUND_TRIP' && !selectedInboundFlight && (
          <div className="text-sm text-gray-600 text-center p-4 bg-[#eefbf3] border border-[#a7e0ba] rounded-md mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-[#13804e]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Please select a return flight to continue
          </div>
        )}
        
        {flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex === null && (
          <div className="text-sm text-gray-600 text-center p-4 bg-[#eefbf3] border border-[#a7e0ba] rounded-md mt-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2 text-[#13804e]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Please select a return option to continue
          </div>
        )}
      </div>
    </div>
  );
};

const FlightSearchResults = ({ 
  flights = [], 
  traceId, 
  onSelectFlight,
  selectedFlight,
  loading,
  isRoundTrip = false,
  isDomestic = false,
  isOutbound = true,
  selectedAirline = null,
  // Props for the summary panel
  selectedOutboundFlight = null,
  selectedInboundFlight = null,
  flightStructureType = 'ONE_WAY',
  selectedInboundOptionIndex = null,
  onCreateItinerary = null
}) => {
  const [sortBy, setSortBy] = useState('priceAsc');
  const [sortedFlights, setSortedFlights] = useState([]);
  const [visibleFlights, setVisibleFlights] = useState([]);
  const [visibleCount, setVisibleCount] = useState(100);
  const loadingRef = useRef(null);

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

  // Group flights by groupId
  const groupFlightsByGroupId = (flightsToGroup) => {
    if (!flightsToGroup || flightsToGroup.length === 0) return [];
    
    // Create a map to store flights by groupId
    const groupMap = new Map();
    
    
    // First, group flights by groupId
    flightsToGroup.forEach(flight => {
      const groupId = flight.groupId;
      
      // Skip flights without groupId - keep them as individual flights
      if (groupId === undefined || groupId === null) {
        return;
      }
      
      if (!groupMap.has(groupId)) {
        groupMap.set(groupId, []);
      }
      
      groupMap.get(groupId).push(flight);
    });
    

    
    // Create the final array with grouped flights
    let result = [];
    
    // Add flights that belong to groups
    groupMap.forEach((flights, groupId) => {
      if (flights.length === 0) return;
      
      // Take the first flight as primary
      const firstFlight = flights[0];
      
      // Add debug info to flight for UI visibility
      firstFlight._debugHasGroup = true;
      firstFlight._debugGroupSize = flights.length;
      
      // If there are more flights in the group, add them as groupFlights
      if (flights.length > 1) {
        firstFlight.groupFlights = flights.slice(1);
      }
      
      // Special handling for international round trip inbound options
      if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && 
          firstFlight.inboundOptions && 
          Array.isArray(firstFlight.inboundOptions)) {
        // Keep the original inbound options structure intact
        console.log('Preserving international round trip inbound options');
      }
      
      result.push(firstFlight);
    });
    
    // Add back all flights that don't have a groupId or weren't grouped
    flightsToGroup.forEach(flight => {
      const groupId = flight.groupId;
      if (groupId === undefined || groupId === null) {
        flight._debugHasGroup = false;
        result.push(flight);
      }
    });
    
    console.log('Grouped flights result:', {
      totalOriginal: flightsToGroup.length,
      totalGrouped: result.length,
      withGroups: result.filter(f => f.groupFlights && f.groupFlights.length > 0).length
    });
    
    // Sort the result array
    result.sort((a, b) => {
      // Use the same sorting logic as the current sortBy state
      switch (sortBy) {
        case 'priceAsc':
          return (a.price?.amount || a.pF || 0) - (b.price?.amount || b.pF || 0);
        case 'priceDesc':
          return (b.price?.amount || b.pF || 0) - (a.price?.amount || a.pF || 0);
        default:
          return (a.price?.amount || a.pF || 0) - (b.price?.amount || b.pF || 0);
      }
    });
    
    return result;
  };

  // Use filteredFlights for grouping, sorting and display
  useEffect(() => {
    if (filteredFlights && filteredFlights.length > 0) {
      // First group the flights by groupId
      const groupedFlights = groupFlightsByGroupId(filteredFlights);
      console.log('Setting grouped flights', { 
        originalCount: filteredFlights.length,
        groupedCount: groupedFlights.length
      });
      
      // Now sort the grouped flights
      let sorted = [...groupedFlights];
      
      switch (sortBy) {
        case 'priceAsc':
          sorted = sorted.sort((a, b) => 
            (a.price?.amount || a.pF || 0) - (b.price?.amount || b.pF || 0)
          );
          break;
        case 'priceDesc':
          sorted = sorted.sort((a, b) => 
            (b.price?.amount || b.pF || 0) - (a.price?.amount || a.pF || 0)
          );
          break;
        case 'durationAsc':
          sorted = sorted.sort((a, b) => {
            const getFlightDuration = (flight) => {
              if (flight.outbound && flight.inbound) {
                const outboundDuration = (flight.outbound.segments || flight.outbound.sg || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
                const inboundDuration = (flight.inbound.segments || flight.inbound.sg || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
                return outboundDuration + inboundDuration;
              }
              
              if (flight.outboundSegments) {
                return (flight.outboundSegments || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
              }
              
              if (flight.outboundFlight) {
                return (flight.outboundFlight || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
              }
              
              return (flight.segments || flight.sg || []).reduce(
                (total, segment) => total + (segment.duration || segment.dr || 0), 0
              );
            };
            
            return getFlightDuration(a) - getFlightDuration(b);
          });
          break;
        case 'durationDesc':
          sorted = sorted.sort((a, b) => {
            const getFlightDuration = (flight) => {
              if (flight.outbound && flight.inbound) {
                const outboundDuration = (flight.outbound.segments || flight.outbound.sg || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
                const inboundDuration = (flight.inbound.segments || flight.inbound.sg || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
                return outboundDuration + inboundDuration;
              }
              
              if (flight.outboundSegments) {
                return (flight.outboundSegments || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
              }
              
              if (flight.outboundFlight) {
                return (flight.outboundFlight || []).reduce(
                  (total, segment) => total + (segment.duration || segment.dr || 0), 0
                );
              }
              
              return (flight.segments || flight.sg || []).reduce(
                (total, segment) => total + (segment.duration || segment.dr || 0), 0
              );
            };
            
            return getFlightDuration(b) - getFlightDuration(a);
          });
          break;
        default:
          break;
      }
      
      setSortedFlights(sorted);
    }
  }, [filteredFlights, sortBy]);

  // Apply sorting to grouped flights
  useEffect(() => {
    if (sortedFlights && sortedFlights.length > 0) {
      console.log('Setting visible flights:', { count: sortedFlights.length, sortBy });
      setVisibleFlights(sortedFlights.slice(0, visibleCount));
    } else {
      setVisibleFlights([]);
    }
  }, [sortedFlights, visibleCount]);

  // Handle intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: '20px',
      threshold: 1.0
    };

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && visibleFlights.length < sortedFlights.length) {
        setVisibleCount(prev => Math.min(prev + 100, sortedFlights.length));
      }
    }, options);

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [sortedFlights.length, visibleFlights.length]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  // Check if we have any flights to display
  if (!flights || flights.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500 font-bold text-lg mb-4">No flights found. Try different search criteria.</p>
        {loading && (
          <div className="flex justify-center mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#093923]"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort options */}
      <div className="flex flex-wrap items-center justify-between bg-white rounded-lg shadow-sm p-3 mb-4">
        <div className="text-sm text-gray-600 font-medium">
          {flights.length} {isRoundTrip ? 'round trip' : 'one-way'} flight{flights.length !== 1 ? 's' : ''} found ({sortedFlights.length} unique options)
        </div>
        <div className="flex items-center mt-2 md:mt-0">
          <span className="text-sm text-gray-600 mr-2">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-[#13804e] focus:ring-[#13804e] sm:text-sm"
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
        {visibleFlights.map((flight, index) => (
          <FlightCard
            key={flight.resultIndex || index}
            flight={flight}
            onSelect={onSelectFlight}
            isSelected={
              // For DOMESTIC_ROUND_TRIP, we need to check the correct flight structure
              flightStructureType === 'DOMESTIC_ROUND_TRIP'
                ? isOutbound
                  ? selectedOutboundFlight?.resultIndex === flight.resultIndex && 
                    selectedOutboundFlight?.outbound?.segments?.length > 0
                  : selectedInboundFlight?.resultIndex === flight.resultIndex && 
                    selectedInboundFlight?.inbound?.segments?.length > 0
                : selectedFlight?.resultIndex === flight.resultIndex
            }
            isOutbound={isOutbound}
            flightStructureType={flightStructureType}
            selectedOutboundFlight={selectedOutboundFlight}
            selectedInboundFlight={selectedInboundFlight}
          />
        ))}
        
        {/* Loading indicator for infinite scroll */}
        {visibleFlights.length < sortedFlights.length && (
          <div ref={loadingRef} className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#093923]"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlightSearchResults;
export { FlightSummaryPanel };

