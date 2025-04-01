/**
 * Transformer for TravClan flight API responses
 * This standardizes the provider's response format for the frontend components
 */

// Flight structure type constants
const ONE_WAY = 'ONE_WAY';
const DOMESTIC_ROUND_TRIP = 'DOMESTIC_ROUND_TRIP';
const INTERNATIONAL_ROUND_TRIP = 'INTERNATIONAL_ROUND_TRIP';

/**
 * Add this debug log function at the top of the file, near the imports
 * @param {Array} flightsArray - Array of flight objects
 * @param {String} label - Label for the log
 */
const logGroupIdsInFlights = (flightsArray, label) => {
  if (!Array.isArray(flightsArray)) {
    console.log(`${label}: Not an array`);
    return;
  }
  
  const groupIds = flightsArray.map(f => f.groupId);
  const withGroupId = groupIds.filter(id => id !== undefined).length;
  console.log(`${label}: ${flightsArray.length} flights, ${withGroupId} have groupId`);
  console.log(`Sample groupIds:`, groupIds.slice(0, 5));
};

/**
 * Transform TC flight search response to standard format
 * @param {Object} response - Original TC flight search response
 * @returns {Object} - Standardized flight search response
 */
export const transformTCFlightSearchResponse = (response, flightStructureType = '') => {
  try {
    if (!response || !response.data) {
      console.error('Invalid response object for flight transformation');
      return { success: false, message: 'Invalid response' };
    }
    
    // Extract flights array from response
    let flightsData = response.data.flights || [];
    
    // Debug log for incoming flights
    logGroupIdsInFlights(flightsData, 'INCOMING FLIGHTS BEFORE TRANSFORM');
    
    let transformedFlights = [];
    let isRoundTrip = response.data.isRoundTrip === true || flightStructureType === INTERNATIONAL_ROUND_TRIP;
    let isDomestic = response.data.isDomestic === true;
    
    console.log('TC Transformer received response:', response);
    
    if (!response.data.flights) {
      console.log('No flights data in response');
      flightsData = [];
      
      // For backward compatibility with older API response format
      if (response.data.outboundFlights && response.data.inboundFlights) {
        console.log('Found separate outbound/inbound arrays');
        flightsData = [...response.data.outboundFlights, ...response.data.inboundFlights];
        isRoundTrip = true;
        isDomestic = true;
      }
    }
    
    // ONE WAY FORMAT:
    if (response.data.flightStructureType === ONE_WAY || (!response.data.isRoundTrip && !isRoundTrip)) {
      console.log('Transforming one-way flights');
      
      transformedFlights = flightsData.map(flight => {
        try {
          // Check if already transformed
          if (flight.segments && Array.isArray(flight.segments) && flight.segments.length > 0 && flight.segments[0].departure) {
            // Make sure groupId is preserved for already transformed flights
            return {
              ...flight,
              isRoundTrip: false,
              groupId: flight.groupId  // Preserve groupId from original flight
            };
          }
          
          // Extract and transform segments
          const segments = (flight.sg || flight.segments || []).map(segment => extractSegment(segment));
          
          return {
            resultIndex: flight.resultIndex || flight.rI,
            segments,
            price: {
              amount: parseFloat(flight.price?.amount || flight.pF || 0),
              currency: flight.price?.currency || flight.cr || 'INR',
              baseFare: parseFloat(flight.price?.baseFare || flight.bF || 0),
              tax: parseFloat(flight.price?.tax || flight.tAS || 0)
            },
            isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
            isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
            fareClass: flight.fareClass || flight.pFC,
            provider: flight.provider || flight.pr,
            availableSeats: flight.availableSeats || flight.sA,
            stopCount: flight.stopCount || flight.sC || 0,
            isRoundTrip: false,
            groupId: flight.groupId // Add groupId
          };
        } catch (err) {
          console.error('Error transforming one-way flight:', err);
          return null;
        }
      }).filter(Boolean); // Remove any nulls from failed transforms
    }
    // INTERNATIONAL ROUND TRIP FORMAT:
    else if (response.data.flightStructureType === INTERNATIONAL_ROUND_TRIP || isRoundTrip) {
      console.log('Transforming international round trip flights');
      
      transformedFlights = flightsData.map(flight => {
        try {
          // Check if flight is already transformed
          if (flight.outboundSegments && Array.isArray(flight.outboundSegments)) {
            return {
              ...flight,
              isRoundTrip: true,
              groupId: flight.groupId // Preserve groupId
            };
          }
          
          // Transform outbound segments
          const outboundSegments = (flight.outboundFlight || []).map(segment => extractSegment(segment));
          let inboundOptions = [];
          
          // Handle different inbound options formats
          if (flight.inboundOptions && Array.isArray(flight.inboundOptions)) {
            // Handle pre-transformed options
            inboundOptions = flight.inboundOptions;
          } 
          else if (flight.inboundFlights && Array.isArray(flight.inboundFlights) && flight.inboundFlights.length > 0) {
            // Handle alternative format
            inboundOptions = flight.inboundFlights.map(option => {
              if (Array.isArray(option) && option.length > 0) {
                const inboundFlight = option[0];
                if (inboundFlight) {
                  return {
                    resultIndex: inboundFlight.resultIndex || inboundFlight.rI,
                    price: {
                      amount: parseFloat(inboundFlight.price?.amount || inboundFlight.pF || 0),
                      currency: inboundFlight.price?.currency || inboundFlight.cr || 'INR',
                      baseFare: parseFloat(inboundFlight.price?.baseFare || inboundFlight.bF || 0),
                      tax: parseFloat(inboundFlight.price?.tax || inboundFlight.tAS || 0)
                    },
                    isRefundable: inboundFlight.isRefundable !== undefined ? inboundFlight.isRefundable : inboundFlight.iR,
                    isLowCost: inboundFlight.isLowCost !== undefined ? inboundFlight.isLowCost : inboundFlight.iL,
                    fareClass: inboundFlight.fareClass || inboundFlight.pFC,
                    provider: inboundFlight.provider || inboundFlight.pr,
                    availableSeats: inboundFlight.availableSeats || inboundFlight.sA,
                    groupId: inboundFlight.groupId, // Preserve groupId for inbound flights
                    
                    segments: (inboundFlight.sg || inboundFlight.segments || []).map(segment => 
                      extractSegment(segment)
                    )
                  };
                }
              }
              return null;
            }).filter(Boolean); // Filter out nulls
          }
          
          return {
            resultIndex: flight.resultIndex || flight.rI,
            outboundSegments,
            inboundOptions,
            price: {
              amount: parseFloat(flight.price?.amount || flight.pF || 0),
              currency: flight.price?.currency || flight.cr || 'INR',
              baseFare: parseFloat(flight.price?.baseFare || flight.bF || 0),
              tax: parseFloat(flight.price?.tax || flight.tAS || 0)
            },
            isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
            isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
            fareClass: flight.fareClass || flight.pFC,
            provider: flight.provider || flight.pr,
            availableSeats: flight.availableSeats || flight.sA,
            isRoundTrip: true,
            stopCount: flight.stopCount || flight.sC || 0,
            groupId: flight.groupId // Preserve groupId
          };
        } catch (err) {
          console.error('Error transforming round trip flight:', err);
          return null;
        }
      }).filter(Boolean); // Remove any nulls from failed transforms
    }
    // DOMESTIC ROUND TRIP FORMAT:
    else if (response.data.flightStructureType === DOMESTIC_ROUND_TRIP) {
      console.log('Transforming domestic round trip flights');
      
      transformedFlights = flightsData.map(flight => {
        try {
          // Check if already transformed
          if (flight.outboundSegments && Array.isArray(flight.outboundSegments) && 
              flight.inboundSegments && Array.isArray(flight.inboundSegments)) {
            return {
              ...flight,
              isRoundTrip: true,
              groupId: flight.groupId // Preserve groupId
            };
          }
          
          // Process outbound segments
          const outboundSegments = (flight.outboundSegments || flight.outboundFlight || []).map(segment => 
            extractSegment(segment)
          );
          
          // Process inbound segments
          const inboundSegments = (flight.inboundSegments || flight.inboundFlight || []).map(segment => 
            extractSegment(segment)
          );
          
          return {
            resultIndex: flight.resultIndex || flight.rI,
            outboundSegments,
            inboundSegments,
            price: {
              amount: parseFloat(flight.price?.amount || flight.pF || 0),
              currency: flight.price?.currency || flight.cr || 'INR',
              baseFare: parseFloat(flight.price?.baseFare || flight.bF || 0),
              tax: parseFloat(flight.price?.tax || flight.tAS || 0)
            },
            isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
            isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
            fareClass: flight.fareClass || flight.pFC,
            provider: flight.provider || flight.pr,
            availableSeats: flight.availableSeats || flight.sA,
            stopCount: flight.stopCount || flight.sC || 0,
            isRoundTrip: true,
            groupId: flight.groupId // Add groupId
          };
        } catch (err) {
          console.error('Error transforming domestic round trip flight:', err);
          return null;
        }
      }).filter(Boolean); // Remove any nulls from failed transforms
    }
    
    // Extract pagination, filters and other metadata
    const pagination = response.data.pagination || {};
    const priceRange = response.data.priceRange || { min: 0, max: 0 };
    const availableFilters = response.data.availableFilters || {};
    const traceId = response.data.traceId;
    
    // Debug log for outgoing flights
    logGroupIdsInFlights(transformedFlights, 'OUTGOING FLIGHTS BEFORE RETURN');

    return {
      success: true,
      provider: response.provider || 'TC',
      data: {
        flights: transformedFlights,
        pagination,
        priceRange,
        availableFilters,
        traceId,
        isDomestic,
        isRoundTrip,
        totalTravelers: response.data.totalTravelers || response.data.paxCount
      }
    };
  } catch (err) {
    console.error('Error transforming flight search response:', err);
    return { success: false, message: 'Error transforming flight search response' };
  }
};

/**
 * Transform TC flight fare rules response to standard format
 * @param {Object} response - Original TC fare rules response
 * @returns {Object} - Standardized fare rules response
 */
export const transformTCFareRulesResponse = (response) => {
  if (!response.success || !response.data) {
    return response; // Return original if invalid
  }

  return {
    success: response.success,
    provider: 'TC',
    data: {
      fareRules: response.data.fareRules || [],
      cancellationCharges: response.data.cancellationCharges || [],
      dateChangeCharges: response.data.dateChangeCharges || []
    }
  };
};

/**
 * Transform TC flight booking response to standard format
 * @param {Object} response - Original TC booking response
 * @returns {Object} - Standardized booking response
 */
export const transformTCBookingResponse = (response) => {
  if (!response.success) {
    return response; // Return original if invalid
  }

  return {
    success: response.success,
    provider: 'TC',
    data: {
      bookingId: response.data.bookingId,
      status: response.data.status,
      flightDetails: response.data.bookingDetails,
      pnr: response.data.bookingResponse?.pnr || '',
      ticketNumbers: response.data.bookingResponse?.ticketNumbers || []
    }
  };
};

const tcTransformer = {
  transformTCFlightSearchResponse,
  transformTCFareRulesResponse,
  transformTCBookingResponse
};

export default tcTransformer; 

// Fix for properly extracting segment data from flight objects
const extractSegment = (segment) => {
  if (!segment) return null;
  
  return {
    baggage: segment.baggage || segment.bg,
    cabinBaggage: segment.cabinBaggage || segment.cBg,
    duration: segment.duration || segment.dr,
    groundTime: segment.groundTime || segment.gT || 0,
    stopoverDuration: segment.stopoverDuration || segment.sD,
    cabinClass: segment.cabinClass || segment.cC,
    availableSeats: segment.availableSeats || segment.nOSA,
    accumulatedDuration: segment.accumulatedDuration || segment.aD,
    isStopover: segment.isStopover || segment.sO,
    stopoverPoint: segment.stopoverPoint || segment.sP,
    stopoverArrivalTime: segment.stopoverArrivalTime || segment.sPAT,
    stopoverDepartureTime: segment.stopoverDepartureTime || segment.sPDT,
    departure: {
      airport: {
        code: segment.departure?.airport?.code || segment.or?.aC,
        name: segment.departure?.airport?.name || segment.or?.aN,
        terminal: segment.departure?.airport?.terminal || segment.or?.tr || ''
      },
      city: {
        code: segment.departure?.city?.code || segment.or?.cC,
        name: segment.departure?.city?.name || segment.or?.cN
      },
      country: segment.departure?.country || segment.or?.cnN,
      time: segment.departure?.time || segment.or?.dT
    },
    arrival: {
      airport: {
        code: segment.arrival?.airport?.code || segment.ds?.aC,
        name: segment.arrival?.airport?.name || segment.ds?.aN,
        terminal: segment.arrival?.airport?.terminal || segment.ds?.tr || ''
      },
      city: {
        code: segment.arrival?.city?.code || segment.ds?.cC,
        name: segment.arrival?.city?.name || segment.ds?.cN
      },
      country: segment.arrival?.country || segment.ds?.cnN,
      time: segment.arrival?.time || segment.ds?.aT
    },
    airline: {
      code: segment.airline?.code || segment.al?.alC,
      name: segment.airline?.name || segment.al?.alN,
      flightNumber: segment.airline?.flightNumber || (segment.al?.fN ? segment.al.fN.trim() : ''),
      fareClass: segment.airline?.fareClass || segment.al?.fC,
      fareClassFullCode: segment.airline?.fareClassFullCode || segment.al?.fCFC,
      operatingCarrier: segment.airline?.operatingCarrier || segment.al?.oC
    }
  };
};