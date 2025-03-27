import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';

const ALLOWED_TYPES = ['City', 'State', 'Airport', 'Neighborhood'];

const HotelLocationSearch = ({ label, placeholder, selectedLocation, onChange, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const searchLocations = async () => {
      if (searchTerm.length < 3) {
        setLocations([]);
        return;
      }

      try {
        setIsLoading(true);
        const response = await bookingService.searchHotelLocations(searchTerm);
        
        if (response.success) {
          // Filter locations by allowed types
          const filteredLocations = (response.data.results || []).filter(
            location => ALLOWED_TYPES.includes(location.type)
          );
          setLocations(filteredLocations);
        } else {
          throw new Error(response.message || 'Failed to search locations');
        }
      } catch (error) {
        console.error('Error searching locations:', error);
        toast.error(error.message || 'Failed to search locations');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchLocations, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleSelect = (location) => {
    onChange(location);
    setSearchTerm(location.fullName);
    setShowDropdown(false);
    setLocations([]);
  };

  return (
    <div className="relative">
      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          id="location"
          className={`block w-full pl-10 pr-3 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && (searchTerm.length >= 3 || locations.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto max-h-60 focus:outline-none sm:text-sm">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : locations.length === 0 ? (
            <div className="px-4 py-2 text-gray-500">No locations found</div>
          ) : (
            locations.map((location) => (
              <div
                key={location.id}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-600 hover:text-white"
                onClick={() => handleSelect(location)}
              >
                <div className="flex items-center">
                  <span className="font-normal block truncate">
                    {location.fullName}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {location.type}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

HotelLocationSearch.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  selectedLocation: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string
};

export default HotelLocationSearch; 