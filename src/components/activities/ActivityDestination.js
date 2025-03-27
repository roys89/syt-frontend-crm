import { MagnifyingGlassIcon, MapPinIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

const removeDuplicates = (array) => {
  const uniqueItems = new Set();
  return array.filter(item => {
    if (!uniqueItems.has(item.name)) {
      uniqueItems.add(item.name);
      return true;
    }
    return false;
  });
};

const ActivityDestination = ({ selectedCities, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinations, setDestinations] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);

  // Search destinations when query changes
  useEffect(() => {
    const debounceSearch = setTimeout(() => {
      if (searchQuery) {
        const searchDestinations = async () => {
          setLoading(true);
          try {
            const response = await axios.get(`http://localhost:5000/api/destinations/search`, {
              params: { query: searchQuery }
            });
            const deduplicatedResults = removeDuplicates(response.data);
            setDestinations(deduplicatedResults);
          } catch (error) {
            console.error('Error searching destinations:', error);
          } finally {
            setLoading(false);
          }
        };
        searchDestinations();
      } else {
        setDestinations([]);
      }
    }, 300);

    return () => clearTimeout(debounceSearch);
  }, [searchQuery]);

  // Fetch cities when destination is selected
  const handleDestinationSelect = async (destination) => {
    if (!destination) return;
    
    try {
      setSelectedDestination(destination);
      const response = await axios.get(`http://localhost:5000/api/destinations/cities`, {
        params: { 
          destination: destination.name.split(' - ')[0],
          destinationType: destination.type 
        }
      });
      setAvailableCities(response.data);
      onSelect(null); // Reset parent component
    } catch (error) {
      console.error('Error fetching cities:', error);
      setAvailableCities([]);
    }
  };

  // Handle city selection
  const handleCitySelect = (city) => {
    onSelect([city]); // Pass as array to maintain compatibility
  };

  // Handle city removal
  const handleRemoveCity = () => {
    onSelect(null);
  };

  return (
    <div className="w-full space-y-4">
      {/* Destination Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50">
            <MagnifyingGlassIcon className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Search Destinations</h3>
            <p className="text-xs text-gray-500">Search for countries, regions, or cities</p>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search destinations..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>

        {destinations.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-gray-200">
            {destinations.map((destination) => (
              <button
                key={destination.name}
                type="button"
                onClick={() => handleDestinationSelect(destination)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 text-sm ${
                  selectedDestination?.name === destination.name ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{destination.name}</div>
                <div className="text-xs text-gray-500 capitalize">{destination.type}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City Selection Section */}
      {availableCities.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-50">
              <PlusIcon className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Select City</h3>
              <p className="text-xs text-gray-500">Choose a city for your activities</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-2">
            {availableCities.map((city) => (
              <label 
                key={city.destination_id} 
                className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer text-sm border border-gray-200 ${
                  selectedCities?.[0]?.destination_id === city.destination_id ? 'bg-indigo-50 border-indigo-200' : ''
                }`}
              >
                <input
                  type="radio"
                  name="city"
                  checked={selectedCities?.[0]?.destination_id === city.destination_id}
                  onChange={() => handleCitySelect(city)}
                  className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="truncate">
                  <div className="font-medium text-gray-900 truncate">{city.city}</div>
                  <div className="text-xs text-gray-500 truncate">{city.country}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Selected City Display */}
      <AnimatePresence>
        {selectedCities?.[0] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50">
                  <MapPinIcon className="w-3.5 h-3.5 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{selectedCities[0].city}</div>
                  <div className="text-xs text-gray-500">{selectedCities[0].country}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveCity}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivityDestination; 