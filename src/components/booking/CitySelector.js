// src/components/booking/CitySelector.js
import { Combobox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import { Fragment, useState } from 'react';
import bookingService from '../../services/bookingService';

const CitySelector = ({ label, placeholder, selectedCity, onChange, error }) => {
  const [cities, setCities] = useState([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create a debounced search function
  const debouncedSearch = debounce(async (searchQuery) => {
    if (searchQuery.length < 2) return;
    
    try {
      setIsLoading(true);
      const data = await bookingService.searchCityById(searchQuery);
      setCities(data);
    } catch (error) {
      console.error('Error searching for cities:', error);
    } finally {
      setIsLoading(false);
    }
  }, 500);

  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <Combobox value={selectedCity} onChange={onChange}>
        <div className="relative mt-1">
          <div className={`relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border ${error ? 'border-red-500' : 'border-gray-300'} focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500`}>
            <Combobox.Input
              className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
              displayValue={(city) => city ? city.name : ''}
              onChange={handleQueryChange}
              placeholder={placeholder || "Search for a city..."}
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
          >
            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {isLoading ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  Searching cities...
                </div>
              ) : cities.length === 0 && query !== '' ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-700">
                  No cities found. Try a different search term.
                </div>
              ) : (
                cities.map((city) => (
                  <Combobox.Option
                    key={city.id}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-10 pr-4 ${
                        active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                      }`
                    }
                    value={{
                      id: city.id,
                      name: city.name,
                      fullName: city.fullName,
                      country: city.country,
                      coordinates: city.coordinates
                    }}
                  >
                    {({ selected, active }) => (
                      <>
                        <span
                          className={`block truncate ${
                            selected ? 'font-medium' : 'font-normal'
                          }`}
                        >
                          {city.fullName}
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

CitySelector.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  selectedCity: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string
};

export default CitySelector;