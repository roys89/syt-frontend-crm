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
          className={`p-4 ${(selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null ? 'bg-blue-50' : 'bg-white'}`}
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
              <div className="text-lg font-semibold text-blue-600">
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
                  className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium flex items-center"
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
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  (selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-blue-600 border border-blue-600'
                }`}
              >
                {(selectedInboundIndex === optionIndex || isOptionSelected) && selectedGroupIndex === null ? 'Selected' : 'Select'}
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
                        ? 'border-blue-500 ring-2 ring-blue-200 bg-white'
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
                        <div className="text-lg font-semibold text-blue-600">
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
                        className={`px-4 py-2 text-sm font-medium rounded-md ${
                          (selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border border-blue-600'
                        }`}
                      >
                        {(selectedInboundIndex === optionIndex && selectedGroupIndex === groupIndex) || isGroupOptionSelected ? 'Selected' : 'Select'}
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
                className={`p-4 border rounded-md ${isGroupFlightSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} bg-white shadow-sm hover:shadow-md transition-shadow`}
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
                      <div className="text-sm font-medium text-blue-600 mb-2">Outbound</div>
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
                      <div className="text-sm font-medium text-blue-600 mb-2">Inbound</div>
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
                    <div className="text-lg font-semibold text-blue-600">
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
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      isGroupFlightSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-blue-600 border border-blue-600'
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
          isThisFlightSelected() ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
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
            </div>
          )}
          
          {/* International round trip with outbound and inbound options */}
          {isInternationalRoundTrip && (
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
            <div className="text-2xl font-bold text-blue-600">
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
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium flex items-center"
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
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                isThisFlightSelected()
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-600'
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
  selectedInboundOptionIndex = 0,
  onCreateItinerary 
}) => {
  // Debug log for component inputs
  useEffect(() => {
    console.log('FlightSummaryPanel received props:', {
      flightStructureType,
      outboundFlightId: selectedOutboundFlight?.resultIndex,
      inboundFlightId: selectedInboundFlight?.resultIndex,
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
    
    if (flightStructureType === 'ONE_WAY') {
      // For one-way flights, use direct price
      if (selectedOutboundFlight.price?.amount !== undefined) {
        total = selectedOutboundFlight.price.amount;
        currency = selectedOutboundFlight.price.currency || currency;
      } else if (typeof selectedOutboundFlight.pF === 'number') {
        // Legacy format
        total = selectedOutboundFlight.pF;
        currency = selectedOutboundFlight.cr || currency;
      }
      return { amount: total, currency };
    }
    
    // For round trips (domestic or international)
    
    // Add outbound flight price
    let outboundPrice = 0;
    
    // Check all possible price formats
    if (selectedOutboundFlight.price?.amount !== undefined) {
      outboundPrice = selectedOutboundFlight.price.amount;
      currency = selectedOutboundFlight.price.currency || currency;
    } else if (selectedOutboundFlight.outbound?.price?.amount !== undefined) {
      outboundPrice = selectedOutboundFlight.outbound.price.amount;
      currency = selectedOutboundFlight.outbound.price.currency || currency;
    } else if (typeof selectedOutboundFlight.pF === 'number') {
      // Legacy format
      outboundPrice = selectedOutboundFlight.pF;
      currency = selectedOutboundFlight.cr || currency;
    }
    
    total += outboundPrice;
    console.log('Outbound price added:', outboundPrice);
    
    // Add inbound flight price based on flight type
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      if (selectedOutboundFlight.inbound?.price?.amount !== undefined) {
        // For combined structure in single flight object
        total += selectedOutboundFlight.inbound.price.amount;
        console.log('Inbound price from outbound flight:', selectedOutboundFlight.inbound.price.amount);
      } else if (selectedInboundFlight) {
        // For separate outbound and inbound flights
        let inboundPrice = 0;
        
        // Check all possible price formats for inbound
        if (selectedInboundFlight.price?.amount !== undefined) {
          inboundPrice = selectedInboundFlight.price.amount;
        } else if (selectedInboundFlight.inbound?.price?.amount !== undefined) {
          inboundPrice = selectedInboundFlight.inbound.price.amount;
        } else if (typeof selectedInboundFlight.pF === 'number') {
          // Legacy format
          inboundPrice = selectedInboundFlight.pF;
        }
        
        total += inboundPrice;
        console.log('Inbound price from separate flight:', inboundPrice);
      }
    } else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && 
              selectedOutboundFlight.inboundOptions && 
              selectedInboundOptionIndex !== null) {
      // For international round trips, get price from the selected inbound option
      const selectedOption = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex];
      
      if (selectedOption) {
        let inboundPrice = 0;
        
        // Check if it's an array (some API formats nest it)
        if (Array.isArray(selectedOption) && selectedOption.length > 0) {
          const option = selectedOption[0];
          if (option.price?.amount !== undefined) {
            inboundPrice = option.price.amount;
          } else if (typeof option.pF === 'number') {
            inboundPrice = option.pF;
          }
        } else {
          // Direct option object
          if (selectedOption.price?.amount !== undefined) {
            inboundPrice = selectedOption.price.amount;
          } else if (typeof selectedOption.pF === 'number') {
            inboundPrice = selectedOption.pF;
          }
        }
        
        total += inboundPrice;
        console.log('International inbound option price:', inboundPrice);
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
    let price = { amount: 0, currency: 'INR' };
    let baseFare = 0;
    let tax = 0;
    let duration = 0;
    let stops = 0;
    let fareClass = '';
    let baggage = '';
    let cabinBaggage = '';
    

    
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      // For domestic round trip, use the direct structure
      segments = selectedOutboundFlight.sg || [];
      if (segments.length > 0) {
        airline = segments[0].al?.alN || '';
        flightNumber = segments[0].al?.fN || '';
        fareClass = segments[0].al?.fC || '';
        departure = {
          airport: {
            code: segments[0].or?.aC || '',
            terminal: segments[0].or?.tr || ''
          },
          time: segments[0].or?.dT
        };
        arrival = {
          airport: {
            code: segments[segments.length - 1].ds?.aC || '',
            terminal: segments[segments.length - 1].ds?.tr || ''
          },
          time: segments[segments.length - 1].ds?.aT
        };
        baggage = segments[0].bg || '';
        cabinBaggage = segments[0].cBg || '';
        
        // Calculate total duration and stops
        duration = segments.reduce((total, segment) => total + (segment.dr || 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;
      }
      
      // Price extraction with fallbacks
      if (selectedOutboundFlight.pF) {
        price = { 
          amount: selectedOutboundFlight.pF, 
          currency: selectedOutboundFlight.cr || 'INR' 
        };
      }
      
      baseFare = selectedOutboundFlight.bF || Math.round(price.amount * 0.85) || 0;
      tax = price.amount - baseFare;
    }
    else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      segments = selectedOutboundFlight.segments || [];
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        fareClass = segments[0].airline?.fareClass || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
        baggage = segments[0].baggage || '';
        cabinBaggage = segments[0].cabinBaggage || '';
        
        // Calculate total duration and stops
        duration = segments.reduce((total, segment) => total + (segment.duration || 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;
      }
      
      // Price extraction with fallbacks
      if (selectedOutboundFlight.price?.amount) {
        price = selectedOutboundFlight.price;
      } else if (typeof selectedOutboundFlight.pF === 'number') {
        price = { 
          amount: selectedOutboundFlight.pF, 
          currency: selectedOutboundFlight.cr || 'INR' 
        };
      }
      
      baseFare = price.baseFare || Math.round(price.amount * 0.85) || 0;
      tax = price.tax || Math.round(price.amount * 0.15) || 0;
    }
    else {
      // ONE_WAY
      segments = selectedOutboundFlight.segments || [];
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        fareClass = segments[0].airline?.fareClass || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
        baggage = segments[0].baggage || '';
        cabinBaggage = segments[0].cabinBaggage || '';
        
        // Calculate total duration and stops
        duration = segments.reduce((total, segment) => total + (segment.duration || 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;
      }
      
      // Price extraction with fallbacks
      if (selectedOutboundFlight.price?.amount) {
        price = selectedOutboundFlight.price;
      } else if (typeof selectedOutboundFlight.pF === 'number') {
        price = { 
          amount: selectedOutboundFlight.pF, 
          currency: selectedOutboundFlight.cr || 'INR' 
        };
      }
      
      baseFare = price.baseFare || Math.round(price.amount * 0.85) || 0;
      tax = price.tax || Math.round(price.amount * 0.15) || 0;
    }
    
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
  
  // Extract relevant data for inbound flight
  const getInboundFlightData = () => {
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      console.log('Getting domestic inbound data:', {
        fromInbound: !!selectedInboundFlight,
        inboundPrice: selectedInboundFlight?.pF,
        inboundCurrency: selectedInboundFlight?.cr
      });
      
      if (selectedInboundFlight) {
        const segments = selectedInboundFlight.sg || [];
        let airline = '';
        let flightNumber = '';
        let departure = {};
        let arrival = {};
        let price = { amount: 0, currency: 'INR' };
        let duration = 0;
        let stops = 0;
        let fareClass = '';
        let baggage = '';
        let cabinBaggage = '';
        
        if (segments.length > 0) {
          airline = segments[0].al?.alN || '';
          flightNumber = segments[0].al?.fN || '';
          fareClass = segments[0].al?.fC || '';
          departure = {
            airport: {
              code: segments[0].or?.aC || '',
              terminal: segments[0].or?.tr || ''
            },
            time: segments[0].or?.dT
          };
          arrival = {
            airport: {
              code: segments[segments.length - 1].ds?.aC || '',
              terminal: segments[segments.length - 1].ds?.tr || ''
            },
            time: segments[segments.length - 1].ds?.aT
          };
          baggage = segments[0].bg || '';
          cabinBaggage = segments[0].cBg || '';
          
          // Calculate total duration and stops
          duration = segments.reduce((total, segment) => total + (segment.dr || 0), 0);
          stops = segments.length > 1 ? segments.length - 1 : 0;
        }
        
        // Price extraction with fallbacks
        if (selectedInboundFlight.pF) {
          price = { 
            amount: selectedInboundFlight.pF, 
            currency: selectedInboundFlight.cr || 'INR' 
          };
        }
        
        console.log('Extracted inbound price:', price);
        
        return {
          airline,
          flightNumber,
          departure,
          arrival,
          baseFare: selectedInboundFlight.bF || Math.round(price.amount * 0.85) || 0,
          tax: price.amount - (selectedInboundFlight.bF || Math.round(price.amount * 0.85) || 0),
          price,
          duration,
          stops,
          fareClass,
          baggage,
          cabinBaggage
        };
      }
      
      return null;
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
      let price = { amount: 0, currency: 'INR' };
      let duration = 0;
      let stops = 0;
      let fareClass = '';
      let baggage = '';
      let cabinBaggage = '';
      
      if (segments.length > 0) {
        airline = segments[0].airline?.name || '';
        flightNumber = segments[0].airline?.flightNumber || '';
        fareClass = segments[0].airline?.fareClass || '';
        departure = segments[0].departure || {};
        arrival = segments[segments.length - 1].arrival || {};
        baggage = segments[0].baggage || '';
        cabinBaggage = segments[0].cabinBaggage || '';
        
        // Calculate total duration and stops
        duration = segments.reduce((total, segment) => total + (segment.duration || 0), 0);
        stops = segments.length > 1 ? segments.length - 1 : 0;
      }
      
      // Price extraction with fallbacks
      if (inboundOption.price?.amount) {
        price = inboundOption.price;
      } else if (typeof inboundOption.pF === 'number') {
        price = { 
          amount: inboundOption.pF, 
          currency: inboundOption.cr || 'INR' 
        };
      }
      
      return {
        airline,
        flightNumber,
        departure,
        arrival,
        baseFare: price.baseFare || Math.round(price.amount * 0.85) || 0,
        tax: price.tax || Math.round(price.amount * 0.15) || 0,
        price,
        duration,
        stops,
        fareClass,
        baggage,
        cabinBaggage
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
              {outboundData.stops > 0 && (
                <span className="text-xs py-1 px-2 bg-gray-100 rounded-full">
                  {outboundData.stops} {outboundData.stops === 1 ? 'stop' : 'stops'}
                </span>
              )}
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
            
            {/* Additional flight details */}
            <div className="bg-gray-50 p-2 rounded-md text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs font-medium">Duration:</span>
                  <span>{formatDuration(outboundData.duration || 0)}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium">Class:</span>
                  <span>{outboundData.fareClass || 'Economy'}</span>
                </div>
                {outboundData.baggage && (
                  <div>
                    <span className="block text-xs font-medium">Baggage:</span>
                    <span>{outboundData.baggage}</span>
                  </div>
                )}
                {outboundData.cabinBaggage && (
                  <div>
                    <span className="block text-xs font-medium">Cabin:</span>
                    <span>{outboundData.cabinBaggage}</span>
                  </div>
                )}
              </div>
            </div>
            
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
              {inboundData.stops > 0 && (
                <span className="text-xs py-1 px-2 bg-gray-100 rounded-full">
                  {inboundData.stops} {inboundData.stops === 1 ? 'stop' : 'stops'}
                </span>
              )}
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
            
            {/* Additional flight details */}
            <div className="bg-gray-50 p-2 rounded-md text-sm text-gray-600">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="block text-xs font-medium">Duration:</span>
                  <span>{formatDuration(inboundData.duration || 0)}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium">Class:</span>
                  <span>{inboundData.fareClass || 'Economy'}</span>
                </div>
                {inboundData.baggage && (
                  <div>
                    <span className="block text-xs font-medium">Baggage:</span>
                    <span>{inboundData.baggage}</span>
                  </div>
                )}
                {inboundData.cabinBaggage && (
                  <div>
                    <span className="block text-xs font-medium">Cabin:</span>
                    <span>{inboundData.cabinBaggage}</span>
                  </div>
                )}
              </div>
            </div>
            
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
        
        {/* Fare breakdown */}
        <div className="mt-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Base fare:</span>
            <span>{totalPrice.currency} {(outboundData?.baseFare + (inboundData?.baseFare || 0)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Taxes & fees:</span>
            <span>{totalPrice.currency} {(outboundData?.tax + (inboundData?.tax || 0)).toLocaleString()}</span>
          </div>
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
      
      {/* Messages for incomplete selection */}
      {flightStructureType === 'DOMESTIC_ROUND_TRIP' && !selectedInboundFlight && (
        <div className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-md mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Please select an inbound flight to continue
        </div>
      )}
      
      {flightStructureType === 'INTERNATIONAL_ROUND_TRIP' && selectedInboundOptionIndex === null && (
        <div className="text-sm text-gray-600 text-center p-3 bg-blue-50 rounded-md mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Please select an inbound option to continue
        </div>
      )}
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-3"></div>
            <p className="text-gray-600 font-medium">Loading flights...</p>
          </div>
        ) : (
          <>
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FlightSearchResults;
export { FlightSummaryPanel };

