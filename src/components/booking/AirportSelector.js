// src/components/booking/AirportSelector.js
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon, MapPinIcon } from '@heroicons/react/20/solid';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';

const AirportSelector = ({ label, placeholder, value, onChange, error, fullWidth }) => {
  const [airports, setAirports] = useState([]);
  const [query, setQuery] = useState('');
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

  const filteredAirports =
    query === ''
      ? airports
      : airports.filter((airport) => {
          const searchString = query.toLowerCase();
          return (
            airport.city?.toLowerCase().includes(searchString) ||
            airport.name?.toLowerCase().includes(searchString) ||
            airport.iata?.toLowerCase().includes(searchString) ||
            airport.code?.toLowerCase().includes(searchString) ||
            airport.country?.toLowerCase().includes(searchString)
          );
        });

  return (
    <div className={`${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <Combobox value={value} onChange={onChange}>
        <div className="relative">
          <div className={`relative w-full overflow-hidden rounded-lg bg-white text-left transition-all duration-200 ${
            error 
              ? 'border-2 border-red-500' 
              : 'border border-gray-300 shadow-sm hover:border-gray-400 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200'
          }`}>
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <Combobox.Input
              className="w-full border-none py-3 pl-10 pr-10 text-sm text-gray-900 focus:ring-0 focus:outline-none"
              displayValue={(airport) => {
                if (!airport || (!airport.city && !airport.name && !airport.code && !airport.iata)) {
                  return '';
                }
                return `${airport.city || airport.name} (${airport.code || airport.iata})`;
              }}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder || "Search for a city or airport..."}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery('')}
          >
            <Combobox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {isLoading ? (
                <div className="relative cursor-default select-none py-3 px-4 text-gray-700">
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading airports...</span>
                  </div>
                </div>
              ) : filteredAirports.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-3 px-4 text-gray-700">
                  Nothing found. Try different keywords.
                </div>
              ) : (
                filteredAirports.map((airport) => (
                  <Combobox.Option
                    key={airport.iata || airport.code}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-3 pl-10 pr-4 ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={{
                      name: airport.name,
                      code: airport.iata || airport.code,
                      city: airport.city,
                      country: airport.country,
                      lat: airport.latitude,
                      long: airport.longitude
                    }}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          <span className="font-medium">{airport.city || airport.name}</span> <span className="font-bold text-sm">({airport.iata || airport.code})</span>
                          <span className={`text-xs ${active ? 'text-indigo-100' : 'text-gray-500'}`}> - {airport.name}, {airport.country}</span>
                        </span>
                        {selected ? (
                          <span
                            className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                              active ? 'text-white' : 'text-indigo-600'
                            }`}
                          >
                            <CheckIcon className="h-5 w-5" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
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
  fullWidth: PropTypes.bool
};

export default AirportSelector;