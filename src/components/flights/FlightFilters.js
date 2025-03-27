import {
    AdjustmentsHorizontalIcon,
    ArrowPathIcon,
    CurrencyDollarIcon,
    PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

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
    stops: []
  });

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
      stops: []
    });
    onApplyFilters(null); // Pass null to reset to default view
  };

  // Generate sorted list of airlines from flight data
  const airlineOptions = airlines || 
    [...new Set(flights?.map(flight => flight.airline?.name))]
      .filter(Boolean)
      .sort();

  // Determine available stop counts from data
  const stopOptions = stopCounts ? 
    Object.keys(stopCounts).sort((a, b) => {
      if (a === "2+") return 1;
      if (b === "2+") return -1;
      return parseInt(a) - parseInt(b);
    }) : 
    ['0', '1', '2+'];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2 text-gray-600" />
          Filter Results
        </h3>
        <button
          onClick={resetFilters}
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
        >
          <ArrowPathIcon className="h-4 w-4 mr-1" />
          Reset Filters
        </button>
      </div>
      
      {/* Price filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <CurrencyDollarIcon className="h-4 w-4 mr-1 text-gray-600" />
          Price Range
        </h4>
        <div className="flex space-x-2">
          <div className="flex-1">
            <label className="sr-only">Min Price</label>
            <input
              type="number"
              min={priceRange?.min || 0}
              max={filters.price.max}
              value={filters.price.min}
              onChange={(e) => handlePriceChange('min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Min"
              disabled={loading}
            />
          </div>
          <div className="flex-1">
            <label className="sr-only">Max Price</label>
            <input
              type="number"
              min={filters.price.min}
              max={priceRange?.max || 10000}
              value={filters.price.max}
              onChange={(e) => handlePriceChange('max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              placeholder="Max"
              disabled={loading}
            />
          </div>
        </div>
      </div>
      
      {/* Airline filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2 flex items-center">
          <PaperAirplaneIcon className="h-4 w-4 mr-1 text-gray-600" />
          Airlines
        </h4>
        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
          {airlineOptions.length > 0 ? (
            airlineOptions.map((airline) => (
              <div key={airline} className="flex items-center">
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
                  className="ml-2 text-sm text-gray-700"
                >
                  {airline}
                  {stopCounts && (
                    <span className="text-xs text-gray-500 ml-1">
                      ({flights.filter(f => f.airline?.name === airline).length})
                    </span>
                  )}
                </label>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">No airlines available</div>
          )}
        </div>
      </div>
      
      {/* Stops filter */}
      <div className="mb-4">
        <h4 className="text-sm font-medium mb-2">Stops</h4>
        <div className="flex flex-wrap gap-2">
          {stopOptions.map((stop) => (
            <button
              key={stop}
              onClick={() => handleStopToggle(stop)}
              className={`px-3 py-1 rounded-full text-sm ${
                filters.stops.includes(stop)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              {stop === '0' ? 'Direct' : stop === '1' ? '1 Stop' : '2+ Stops'}
              {stopCounts && stopCounts[stop] && (
                <span className="ml-1">({stopCounts[stop]})</span>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Apply filters button */}
      <button
        onClick={applyFilters}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition"
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
            Applying...
          </span>
        ) : (
          'Apply Filters'
        )}
      </button>
    </div>
  );
};

export default FlightFilters; 