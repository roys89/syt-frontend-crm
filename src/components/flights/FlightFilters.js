import {
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

// Define time slabs for filtering
const TIME_SLABS = [
  { id: 'early-morning', label: 'Early Morning', range: [0, 6], icon: '🌅' },
  { id: 'morning', label: 'Morning', range: [6, 12], icon: '☀️' },
  { id: 'afternoon', label: 'Afternoon', range: [12, 18], icon: '🌤️' },
  { id: 'evening', label: 'Evening', range: [18, 24], icon: '🌙' }
];

const FlightFilters = ({ 
  flights, 
  priceRange, 
  airlines, 
  stopCounts, 
  onApplyFilters,
  loading
}) => {
  // Initial filter state
  const [filters, setFilters] = useState({
    price: {
      min: priceRange?.min || 0,
      max: priceRange?.max || 10000
    },
    airlines: [],
    stops: [],
    departureTime: [],
    arrivalTime: []
  });

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    departureTime: true,
    arrivalTime: true,
    airlines: true,
    stops: true
  });

  // Toggle section expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update filters when flight data changes
  useEffect(() => {
    if (priceRange) {
      setFilters(prev => ({
        ...prev,
        price: {
          min: priceRange.min,
          max: priceRange.max
        }
      }));
    }
  }, [priceRange]);

  // Handle price filter change
  const handlePriceChange = (type, value) => {
    setFilters(prev => ({
      ...prev,
      price: {
        ...prev.price,
        [type]: parseInt(value)
      }
    }));
  };

  // Handle airline selection
  const handleAirlineToggle = (airline) => {
    setFilters(prev => {
      const updatedAirlines = prev.airlines.includes(airline)
        ? prev.airlines.filter(a => a !== airline)
        : [...prev.airlines, airline];
      
      return {
        ...prev,
        airlines: updatedAirlines
      };
    });
  };

  // Handle stop count selection
  const handleStopToggle = (stopCount) => {
    setFilters(prev => {
      const updatedStops = prev.stops.includes(stopCount)
        ? prev.stops.filter(s => s !== stopCount)
        : [...prev.stops, stopCount];
      
      return {
        ...prev,
        stops: updatedStops
      };
    });
  };

  // Handle time slab toggle for departure time
  const handleDepartureTimeToggle = (slabId) => {
    setFilters(prev => {
      const updatedDepartureTimes = prev.departureTime.includes(slabId)
        ? prev.departureTime.filter(s => s !== slabId)
        : [...prev.departureTime, slabId];
      
      return {
        ...prev,
        departureTime: updatedDepartureTimes
      };
    });
  };

  // Handle time slab toggle for arrival time
  const handleArrivalTimeToggle = (slabId) => {
    setFilters(prev => {
      const updatedArrivalTimes = prev.arrivalTime.includes(slabId)
        ? prev.arrivalTime.filter(s => s !== slabId)
        : [...prev.arrivalTime, slabId];
      
      return {
        ...prev,
        arrivalTime: updatedArrivalTimes
      };
    });
  };

  // Apply filters
  const applyFilters = () => {
    onApplyFilters(filters);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      price: {
        min: priceRange?.min || 0,
        max: priceRange?.max || 10000
      },
      airlines: [],
      stops: [],
      departureTime: [],
      arrivalTime: []
    });
    onApplyFilters(null); // Pass null to reset to default view
  };

  // Generate sorted list of airlines from flight data
  const airlineOptions = airlines || 
    [...new Set(flights?.flatMap(flight => {
      // Check all possible locations for airline info
      if (flight.segments && flight.segments.length > 0) {
        return flight.segments[0].airline?.name;
      }
      else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
        return flight.outboundSegments[0].airline?.name;
      }
      else if (flight.airline?.name) {
        return flight.airline.name;
      }
      // Add legacy format check
      else if (flight.sg && flight.sg.length > 0 && flight.sg[0].al?.alN) {
        return flight.sg[0].al.alN;
      }
      return null;
    }))].filter(Boolean).sort();

  // Determine available stop counts from data
  const stopOptions = stopCounts ? 
    Object.keys(stopCounts).sort((a, b) => {
      if (a === "2+") return 1;
      if (b === "2+") return -1;
      return parseInt(a) - parseInt(b);
    }) : 
    ['0', '1', '2+'];

  // Count flights in each time slab
  const countFlightsInTimeSlab = (flights, timeType) => {
    const counts = {};
    
    TIME_SLABS.forEach(slab => {
      counts[slab.id] = flights.filter(flight => {
        let timeStr;
        
        // Extract time based on flight structure and time type
        if (timeType === 'departure') {
          if (flight.segments && flight.segments.length > 0) {
            timeStr = flight.segments[0].departure?.time;
          } else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
            timeStr = flight.outboundSegments[0].departure?.time;
          } else if (flight.sg && flight.sg.length > 0) {
            timeStr = flight.sg[0].or?.dT;
          }
        } else { // arrival
          if (flight.segments && flight.segments.length > 0) {
            const lastSegment = flight.segments[flight.segments.length - 1];
            timeStr = lastSegment.arrival?.time;
          } else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
            const lastSegment = flight.outboundSegments[flight.outboundSegments.length - 1];
            timeStr = lastSegment.arrival?.time;
          } else if (flight.sg && flight.sg.length > 0) {
            const lastSegment = flight.sg[flight.sg.length - 1];
            timeStr = lastSegment.ds?.aT;
          }
        }
        
        if (!timeStr) return false;
        
        try {
          const date = new Date(timeStr);
          const hours = date.getHours();
          return hours >= slab.range[0] && hours < slab.range[1];
        } catch (error) {
          return false;
        }
      }).length;
    });
    
    return counts;
  };
  
  const departureTimeCounts = countFlightsInTimeSlab(flights, 'departure');
  const arrivalTimeCounts = countFlightsInTimeSlab(flights, 'arrival');

  // Check if any filters are active
  const hasActiveFilters = () => {
    return (
      filters.airlines.length > 0 ||
      filters.stops.length > 0 ||
      filters.departureTime.length > 0 ||
      filters.arrivalTime.length > 0 ||
      (filters.price.min !== priceRange?.min) ||
      (filters.price.max !== priceRange?.max)
    );
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.airlines.length > 0) count += 1;
    if (filters.stops.length > 0) count += 1;
    if (filters.departureTime.length > 0) count += 1;
    if (filters.arrivalTime.length > 0) count += 1;
    if (filters.price.min !== priceRange?.min || filters.price.max !== priceRange?.max) count += 1;
    return count;
  };

  // Render a filter section header
  const renderSectionHeader = (icon, title, section, activeCount = 0) => (
    <div 
      className="flex items-center justify-between cursor-pointer py-2 mb-2 border-b border-gray-200"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center">
        {icon}
        <h4 className="text-sm font-medium ml-2">{title}</h4>
        {activeCount > 0 && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
            {activeCount}
          </span>
        )}
      </div>
      {expandedSections[section] ? 
        <ChevronUpIcon className="h-4 w-4 text-gray-500" /> : 
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      }
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-3 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold flex items-center">
          <FunnelIcon className="h-5 w-5 mr-2 text-gray-600" />
          Filters
          {hasActiveFilters() && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
              {getActiveFilterCount()}
            </span>
          )}
        </h3>
        {hasActiveFilters() && (
          <button
            onClick={resetFilters}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Reset
          </button>
        )}
      </div>
      
      {/* Price filter */}
      <div className="mb-4 border-gray-100">
        {renderSectionHeader(
          <CurrencyDollarIcon className="h-4 w-4 text-gray-600" />,
          "Price Range",
          "price",
          (filters.price.min !== priceRange?.min || filters.price.max !== priceRange?.max) ? 1 : 0
        )}
        
        {expandedSections.price && (
          <div className="mt-2 mb-2">
            <div className="flex justify-between mb-2 text-xs text-gray-500">
              <span>{priceRange?.min || 0}</span>
              <span>{priceRange?.max || 10000}</span>
            </div>
            <div className="flex space-x-3 mb-1">
              <div className="flex-1">
                <input
                  type="number"
                  min={priceRange?.min || 0}
                  max={filters.price.max}
                  value={filters.price.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Min"
                  disabled={loading}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  min={filters.price.min}
                  max={priceRange?.max || 10000}
                  value={filters.price.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                  placeholder="Max"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Stops filter */}
      <div className="mb-4">
        {renderSectionHeader(
          <AdjustmentsHorizontalIcon className="h-4 w-4 text-gray-600" />,
          "Stops",
          "stops",
          filters.stops.length
        )}
        
        {expandedSections.stops && (
          <div className="flex flex-wrap gap-2 mt-2">
            {stopOptions.map((stop) => (
              <button
                key={stop}
                onClick={() => handleStopToggle(stop)}
                className={`px-2 py-1 rounded-full text-sm transition-colors duration-200 ${
                  filters.stops.includes(stop)
                    ? 'bg-blue-600 text-white ring-1 ring-blue-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
                disabled={loading}
              >
                {stop === '0' ? 'Non-stop' : stop === '1' ? '1 Stop' : '2+ Stops'}
                {stopCounts && stopCounts[stop] && (
                  <span className="ml-1 text-xs">({stopCounts[stop]})</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Departure Time filter */}
      <div className="mb-4">
        {renderSectionHeader(
          <ClockIcon className="h-4 w-4 text-gray-600" />,
          "Departure Time",
          "departureTime",
          filters.departureTime.length
        )}
        
        {expandedSections.departureTime && (
          <div className="flex flex-wrap gap-2 mt-2">
            {TIME_SLABS.map((slab) => (
              <button
                key={`dep-${slab.id}`}
                onClick={() => handleDepartureTimeToggle(slab.id)}
                disabled={loading}
                className={`flex items-center justify-between py-1 px-2 text-sm rounded-md transition-colors duration-200 ${
                  filters.departureTime.includes(slab.id)
                    ? 'bg-blue-600 text-white ring-1 ring-blue-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-1">{slab.icon}</span>
                  <span className="whitespace-nowrap text-xs">{slab.label}</span>
                </span>
                <span className={`ml-1 text-xs rounded-full px-1 ${
                  filters.departureTime.includes(slab.id)
                    ? 'bg-blue-500 bg-opacity-30 text-white'
                    : 'bg-gray-200 bg-opacity-50 text-gray-700'
                }`}>
                  {departureTimeCounts[slab.id] || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Arrival Time filter */}
      <div className="mb-4">
        {renderSectionHeader(
          <ClockIcon className="h-4 w-4 text-gray-600" />,
          "Arrival Time",
          "arrivalTime",
          filters.arrivalTime.length
        )}
        
        {expandedSections.arrivalTime && (
          <div className="flex flex-wrap gap-2 mt-2">
            {TIME_SLABS.map((slab) => (
              <button
                key={`arr-${slab.id}`}
                onClick={() => handleArrivalTimeToggle(slab.id)}
                disabled={loading}
                className={`flex items-center justify-between py-1 px-2 text-sm rounded-md transition-colors duration-200 ${
                  filters.arrivalTime.includes(slab.id)
                    ? 'bg-blue-600 text-white ring-1 ring-blue-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span className="flex items-center">
                  <span className="mr-1">{slab.icon}</span>
                  <span className="whitespace-nowrap text-xs">{slab.label}</span>
                </span>
                <span className={`ml-1 text-xs rounded-full px-1 ${
                  filters.arrivalTime.includes(slab.id)
                    ? 'bg-blue-500 bg-opacity-30 text-white'
                    : 'bg-gray-200 bg-opacity-50 text-gray-700'
                }`}>
                  {arrivalTimeCounts[slab.id] || 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Airline filter */}
      <div className="mb-4">
        {renderSectionHeader(
          <PaperAirplaneIcon className="h-4 w-4 text-gray-600" />,
          "Airlines",
          "airlines",
          filters.airlines.length
        )}
        
        {expandedSections.airlines && (
          <div className="mt-2">
            <div className="pr-1">
              {airlineOptions.length > 0 ? (
                airlineOptions.map((airline) => (
                  <div key={airline} className="flex items-center p-1 hover:bg-gray-50 rounded-md">
                    <input
                      type="checkbox"
                      id={`airline-${airline}`}
                      checked={filters.airlines.includes(airline)}
                      onChange={() => handleAirlineToggle(airline)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={loading}
                    />
                    <label 
                      htmlFor={`airline-${airline}`}
                      className="ml-2 text-sm text-gray-800 flex-1 cursor-pointer"
                    >
                      {airline}
                    </label>
                    <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-500">
                      {flights.filter(flight => {
                        // Check airline in all possible locations
                        if (flight.segments && flight.segments.length > 0) {
                          return flight.segments[0].airline?.name === airline;
                        }
                        else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
                          return flight.outboundSegments[0].airline?.name === airline;
                        }
                        else if (flight.airline?.name) {
                          return flight.airline.name === airline;
                        }
                        // Add legacy format check
                        else if (flight.sg && flight.sg.length > 0 && flight.sg[0].al?.alN) {
                          return flight.sg[0].al.alN === airline;
                        }
                        return false;
                      }).length}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 p-2">No airlines available</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Apply filters button */}
      <button
        onClick={applyFilters}
        className={`w-full py-2 rounded font-medium transition-colors duration-200 flex items-center justify-center ${
          hasActiveFilters() 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-gray-100 text-gray-500'
        }`}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Applying...
          </span>
        ) : (
          <>
            <FunnelIcon className="h-4 w-4 mr-2" />
            Apply Filters
          </>
        )}
      </button>
    </div>
  );
};

export default FlightFilters; 