/**
 * Transformer for TravClan flight API responses
 * This standardizes the provider's response format for the frontend components
 */

/**
 * Transform TC flight search response to standard format
 * @param {Object} response - Original TC flight search response
 * @returns {Object} - Standardized flight search response
 */
export const transformTCFlightSearchResponse = (response) => {
  console.log('TC Transformer received response:', response);
  
  // Early validation
  if (!response || !response.success || !response.data) {
    console.error('Invalid TC flight search response:', response);
    return {
      success: false,
      message: 'Invalid response format from flight provider'
    };
  }
  
  // DOMESTIC ROUND TRIP FORMAT:
  // If response contains separate outboundFlights and inboundFlights arrays at top level
  if (response.data.outboundFlights && response.data.inboundFlights) {
    console.log('DOMESTIC ROUND TRIP detected with separate outbound/inbound arrays');
    
    // Transform the outbound flights
    const transformedOutboundFlights = response.data.outboundFlights.map(flight => {
      const segmentsArray = flight.segments || flight.sg || [];
      
      return {
        ...flight,
        price: {
          amount: parseFloat(flight.price?.amount || flight.pF || 0),
          currency: flight.price?.currency || flight.cr || 'INR',
          baseFare: flight.price?.baseFare || flight.bF || 0, 
          tax: flight.price?.tax || flight.tAS || 0
        },
        isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
        isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
        fareClass: flight.fareClass || flight.pFC,
        availableSeats: flight.availableSeats || flight.sA,
        resultIndex: flight.resultIndex || flight.rI,
        segments: segmentsArray.map(segment => extractSegment(segment))
      };
    });
    
    // Transform the inbound flights
    const transformedInboundFlights = response.data.inboundFlights.map(flight => {
      const segmentsArray = flight.segments || flight.sg || [];
      
      return {
        ...flight,
        price: {
          amount: parseFloat(flight.price?.amount || flight.pF || 0),
          currency: flight.price?.currency || flight.cr || 'INR',
          baseFare: flight.price?.baseFare || flight.bF || 0, 
          tax: flight.price?.tax || flight.tAS || 0
        },
        isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
        isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
        fareClass: flight.fareClass || flight.pFC,
        availableSeats: flight.availableSeats || flight.sA,
        resultIndex: flight.resultIndex || flight.rI,
        segments: segmentsArray.map(segment => extractSegment(segment))
      };
    });
    
    return {
      success: true,
      provider: response.provider || 'TC',
      data: {
        outboundFlights: transformedOutboundFlights,
        inboundFlights: transformedInboundFlights,
        pagination: response.data.pagination || {},
        priceRange: response.data.priceRange || { min: 0, max: 0 },
        availableFilters: response.data.availableFilters || {},
        traceId: response.data.traceId,
        isDomestic: true,
        isRoundTrip: true,
        totalTravelers: response.data.totalTravelers
      }
    };
  }
  
  // Extract flight data for ONE WAY and INTERNATIONAL ROUND TRIP
  let flightsData = [];
  let isRoundTrip = false;
  
  // Determine the source of the flight data
  if (response.data.flights && Array.isArray(response.data.flights)) {
    flightsData = response.data.flights;
    isRoundTrip = flightsData.length > 0 && (
      flightsData[0].outboundSegments || 
      flightsData[0].isRoundTrip || 
      (response.data.isRoundTrip === true)
    );
  } else if (response.data.results && response.data.results.outboundFlights) {
    flightsData = response.data.results.outboundFlights;
    isRoundTrip = response.data.isRoundTrip === true || response.data.results.inboundFlights !== undefined;
  }
  
  console.log(`Found ${flightsData.length} flights, detected as ${isRoundTrip ? 'ROUND TRIP' : 'ONE WAY'}`);
  
  // Transform flight data to standard format
  let transformedFlights = [];
  
  if (isRoundTrip) {
    // INTERNATIONAL ROUND TRIP FORMAT:
    // Flights with outboundSegments and inboundOptions/inboundFlights
    console.log('Transforming international round trip flights');
    
    transformedFlights = flightsData.map(flight => {
      try {
        // Get outbound segments
        const outboundSegments = (flight.outboundSegments || flight.outboundFlight || []).map(segment => {
          return extractSegment(segment);
        });
        
        // Get inbound segments (potentially nested structure)
        let inboundOptions = [];
        
        if (flight.inboundOptions && Array.isArray(flight.inboundOptions) && flight.inboundOptions.length > 0) {
          // Transform each inbound option, preserving its structure
          inboundOptions = flight.inboundOptions.map(optionArray => {
            if (Array.isArray(optionArray) && optionArray.length > 0) {
              const inboundFlight = optionArray[0]; // Get the first flight in the option
              
              // Only proceed if we have a valid flight object
              if (inboundFlight) {
                return {
                  // Preserve the flight-level metadata
                  resultIndex: inboundFlight.resultIndex,
                  price: {
                    amount: parseFloat(inboundFlight.price?.amount || 0),
                    currency: inboundFlight.price?.currency || 'INR',
                    baseFare: parseFloat(inboundFlight.price?.baseFare || 0),
                    tax: parseFloat(inboundFlight.price?.tax || 0)
                  },
                  isRefundable: inboundFlight.isRefundable,
                  isLowCost: inboundFlight.isLowCost,
                  fareClass: inboundFlight.fareClass,
                  provider: inboundFlight.provider,
                  airlineRemark: inboundFlight.airlineRemark,
                  availableSeats: inboundFlight.availableSeats,
                  
                  // Transform the segments properly
                  segments: (inboundFlight.segments || []).map(segment => extractSegment(segment))
                };
              }
            }
            // Return an empty object if option doesn't match expected structure
            return {};
          });
        } else if (flight.inboundFlights && Array.isArray(flight.inboundFlights) && flight.inboundFlights.length > 0) {
          // Handle alternative format
          inboundOptions = flight.inboundFlights.map(option => {
            if (Array.isArray(option) && option.length > 0) {
              const inboundFlight = option[0];
              if (inboundFlight) {
                return {
                  resultIndex: inboundFlight.resultIndex,
                  price: {
                    amount: parseFloat(inboundFlight.price?.amount || inboundFlight.pF || 0),
                    currency: inboundFlight.price?.currency || inboundFlight.cr || 'INR',
                    baseFare: parseFloat(inboundFlight.price?.baseFare || inboundFlight.bF || 0),
                    tax: parseFloat(inboundFlight.price?.tax || inboundFlight.tAS || 0)
                  },
                  isRefundable: inboundFlight.isRefundable !== undefined ? inboundFlight.isRefundable : inboundFlight.iR,
                  isLowCost: inboundFlight.isLowCost !== undefined ? inboundFlight.isLowCost : inboundFlight.iL,
                  fareClass: inboundFlight.fareClass || inboundFlight.pFC,
                  provider: inboundFlight.provider,
                  availableSeats: inboundFlight.availableSeats || inboundFlight.sA,
                  
                  segments: (inboundFlight.sg || inboundFlight.segments || []).map(segment => 
                    extractSegment(segment)
                  )
                };
              }
            }
            return {};
          }).filter(option => Object.keys(option).length > 0);
        }
        
        return {
          resultIndex: flight.resultIndex || flight.rI,
          outboundSegments,
          inboundOptions,
          price: {
            amount: parseFloat(flight.price?.amount || flight.pF || 0),
            currency: flight.price?.currency || flight.cr || 'INR',
            baseFare: flight.price?.baseFare || flight.bF || 0, 
            tax: flight.price?.tax || flight.tAS || 0
          },
          isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
          isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
          fareClass: flight.fareClass || flight.pFC,
          availableSeats: flight.availableSeats || flight.sA,
          stopCount: flight.stopCount || flight.sC || 0,
          isRoundTrip: true
        };
      } catch (err) {
        console.error('Error transforming international round trip flight:', err, flight);
        return null;
      }
    }).filter(Boolean); // Remove any nulls from failed transforms
  } else {
    // ONE WAY FORMAT:
    // Flights with segments array
    console.log('Transforming one-way flights');
    
    transformedFlights = flightsData.map(flight => {
      try {
        // If the data is already transformed
        if (flight.segments && Array.isArray(flight.segments) && flight.segments.length > 0 && flight.segments[0].departure) {
          return {
            ...flight,
            isRoundTrip: false
          };
        }
        
        // Transform from TC format
        const segmentsArray = flight.segments || flight.sg || [];
        
        return {
          resultIndex: flight.resultIndex || flight.rI,
          segments: segmentsArray.map(segment => extractSegment(segment)),
          price: {
            amount: parseFloat(flight.price?.amount || flight.pF || 0),
            currency: flight.price?.currency || flight.cr || 'INR',
            baseFare: flight.price?.baseFare || flight.bF || 0, 
            tax: flight.price?.tax || flight.tAS || 0
          },
          isRefundable: flight.isRefundable !== undefined ? flight.isRefundable : flight.iR,
          isLowCost: flight.isLowCost !== undefined ? flight.isLowCost : flight.iL,
          fareClass: flight.fareClass || flight.pFC,
          availableSeats: flight.availableSeats || flight.sA,
          stopCount: flight.stopCount || flight.sC || 0,
          isRoundTrip: false
        };
      } catch (err) {
        console.error('Error transforming one-way flight:', err);
        return null;
      }
    }).filter(Boolean); // Remove any nulls from failed transforms
  }
  
  // Extract pagination, filters and other metadata
  const pagination = response.data.pagination || {};
  const priceRange = response.data.priceRange || { min: 0, max: 0 };
  const availableFilters = response.data.availableFilters || {};
  const traceId = response.data.traceId;
  const isDomestic = response.data.isDomestic === true;
  
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