// src/components/booking/AirportSelector.js
import { MapPinIcon } from '@heroicons/react/20/solid';
import { Select, Spin } from 'antd';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';

const { Option } = Select;

const AirportSelector = ({ label, placeholder, value, onChange, error, fullWidth, disabled, style, className }) => {
  const [airports, setAirports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAirports = async () => {
      try {
        setIsLoading(true);
        const data = await bookingService.getCitiesWithAirports();
        setAirports(data);
      } catch (error) {
        console.error('Error fetching airports:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAirports();
  }, []);

  // Filter function for search
  const filterOption = (input, option) => {
    const airport = airports.find(a => (a.iata || a.code) === option.value);
    if (!airport) return false;
    
    const searchString = input.toLowerCase();
    return (
      airport.city?.toLowerCase().includes(searchString) ||
      airport.name?.toLowerCase().includes(searchString) ||
      airport.iata?.toLowerCase().includes(searchString) ||
      airport.code?.toLowerCase().includes(searchString) ||
      airport.country?.toLowerCase().includes(searchString)
    );
  };

  // Transform value for Select
  const transformValue = value ? value.code : undefined;

  // Transform onChange handler
  const handleChange = (code) => {
    if (!code) {
      onChange(null);
      return;
    }
    const airport = airports.find(a => (a.iata || a.code) === code);
    if (airport) {
      onChange({
        name: airport.name,
        code: airport.iata || airport.code,
        city: airport.city,
        country: airport.country,
        lat: airport.latitude,
        long: airport.longitude
      });
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className || ''}`} style={style}>
      {label && (
        <label className="block text-sm font-medium text-[#093923] mb-1">
          {label}
        </label>
      )}
      <Select
        showSearch
        value={transformValue}
        onChange={handleChange}
        placeholder={placeholder || "Search for a city or airport..."}
        disabled={disabled}
        loading={isLoading}
        filterOption={filterOption}
        className="w-full"
        status={error ? 'error' : undefined}
        suffixIcon={isLoading ? <Spin size="small" /> : <MapPinIcon className="h-5 w-5 text-gray-400" />}
        optionLabelProp="label"
        dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
        optionFilterProp="children"
        popupMatchSelectWidth={true}
        virtual={true}
      >
        {airports.map((airport) => (
          <Option 
            key={airport.iata || airport.code} 
            value={airport.iata || airport.code}
            label={`${airport.city || airport.name} (${airport.iata || airport.code})`}
          >
            <div className="flex items-center py-1">
              <span className="font-medium">{airport.city || airport.name}</span>
              <span className="font-bold text-sm ml-1">({airport.iata || airport.code})</span>
              <span className="text-xs text-gray-500 ml-1">- {airport.name}, {airport.country}</span>
            </div>
          </Option>
        ))}
      </Select>
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
};

AirportSelector.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  style: PropTypes.object,
  className: PropTypes.string
};

export default AirportSelector;