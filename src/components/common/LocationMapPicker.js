import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import React, { useCallback, useEffect, useRef, useState } from 'react';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCoCGpVUFkz1USMyaSjxGLvusIuHPBqBiw';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
  border: '1px solid #e5e7eb'
};

// Define libraries array outside of component to prevent unnecessary re-renders
const libraries = ['places'];

const LocationMapPicker = ({ 
  value, 
  onChange, 
  placeholder = "Search location...",
  onLocationSelect,
  initialCenter = { lat: 19.0760, lng: 72.8777 }, // Default to Mumbai, India
  initialZoom = 12
}) => {
  // Use the official hook for loading the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });
  
  const mapRef = useRef(null);
  const placesServiceRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mapError, setMapError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(initialCenter);
  const [mapCenter, setMapCenter] = useState(initialCenter);
  const searchTimeout = useRef(null);
  const [debugInfo, setDebugInfo] = useState('');

  // Use value prop if provided (controlled component)
  useEffect(() => {
    if (value && (value.lat !== undefined && value.lng !== undefined)) {
      console.log("Using value prop:", value);
      setCurrentLocation(value);
      setMapCenter(value);
    }
  }, [value]);

  // Handle load error
  useEffect(() => {
    if (loadError) {
      console.error("Error loading Google Maps API:", loadError);
      setMapError("Failed to load map. Please refresh the page or try again later.");
    }
  }, [loadError]);

  const onMapLoad = useCallback((map) => {
    console.log("Map loaded successfully");
    mapRef.current = map;
    // Create a PlacesService instance when the map loads
    if (window.google && window.google.maps) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    }
  }, []);

  // Function to center map on location
  const centerMapOnLocation = (lat, lng, zoom = 15) => {
    if (mapRef.current) {
      console.log(`Centering map on: ${lat}, ${lng} with zoom: ${zoom}`);
      setMapCenter({ lat, lng });
      // Force a slight delay to ensure map is ready
      setTimeout(() => {
        mapRef.current.panTo({ lat, lng });
        mapRef.current.setZoom(zoom);
      }, 100);
    } else {
      console.error("Map reference not available for panning");
    }
  };

  const onMapClick = useCallback((e) => {
    const position = e.latLng;
    const lat = position.lat();
    const lng = position.lng();
    
    console.log(`Map clicked at: ${lat}, ${lng}`);
    
    // Update marker position and map center
    setCurrentLocation({ lat, lng });
    setMapCenter({ lat, lng });
    setDebugInfo(`Map clicked at: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    
    // Get address from coordinates (reverse geocoding)
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setDebugInfo(`Found address: ${formattedAddress}`);
          
          // Send complete location data back to parent
          onLocationSelect && onLocationSelect({
            lat,
            long: lng,
            display_address: formattedAddress,
            place_name: formattedAddress
          });
        } else {
          setDebugInfo(`Geocoding failed: ${status}`);
          // If reverse geocoding fails, just use coordinates as address
          onLocationSelect && onLocationSelect({
            lat,
            long: lng,
            display_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      });
    } else {
      // Fallback if Google API not available
      onLocationSelect && onLocationSelect({
        lat,
        long: lng,
        display_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  }, [onLocationSelect]);

  const onMarkerDragEnd = useCallback((e) => {
    const position = e.latLng;
    const lat = position.lat();
    const lng = position.lng();
    
    console.log(`Marker dragged to: ${lat}, ${lng}`);
    
    // Update marker position and map center
    setCurrentLocation({ lat, lng });
    setMapCenter({ lat, lng });
    setDebugInfo(`Marker dragged to: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    
    // Get address from coordinates (reverse geocoding)
    if (window.google) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setDebugInfo(`Found address: ${formattedAddress}`);
          
          // Send complete location data back to parent
          onLocationSelect && onLocationSelect({
            lat,
            long: lng,
            display_address: formattedAddress,
            place_name: formattedAddress
          });
        } else {
          setDebugInfo(`Geocoding failed: ${status}`);
          // If reverse geocoding fails, just use coordinates as address
          onLocationSelect && onLocationSelect({
            lat,
            long: lng,
            display_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
          });
        }
      });
    } else {
      // Fallback if Google API not available
      onLocationSelect && onLocationSelect({
        lat,
        long: lng,
        display_address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      });
    }
  }, [onLocationSelect]);

  // Handle search input change with direct search
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear any existing timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // If query is empty, clear results
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    // Only search if Google Maps is loaded
    if (!isLoaded || !window.google) {
      return;
    }
    
    // Debounce the search
    searchTimeout.current = setTimeout(() => {
      console.log("Searching for:", query);
      setIsSearching(true);
      setDebugInfo(`Searching for: ${query}`);
      
      // Ensure PlacesService is available
      if (!placesServiceRef.current) {
        console.error('PlacesService is not initialized.');
        setDebugInfo('Places service not available');
        setIsSearching(false);
        setSearchResults([]);
        return;
      }

      try {
        // --- Prioritize TextSearch for finding named places --- 
        const request = {
            query: query, // Use the raw query without adding ", India"
            fields: ['name', 'formatted_address', 'geometry', 'place_id', 'types'], // Request needed fields
            locationBias: mapRef.current?.getCenter() // Bias towards the current map center
            // bounds: mapRef.current?.getBounds() // Can use bounds instead of/with locationBias if preferred
        };

        placesServiceRef.current.textSearch(request, (results, status) => {
            console.log("TextSearch results:", status, results);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const formattedResults = results.map(place => ({
                place_id: place.place_id,
                name: place.name, // <-- Capture the place name
                description: place.name, // Use name as primary description
                formatted_address: place.formatted_address,
                location: place.geometry.location,
                types: place.types
              }));
              setSearchResults(formattedResults);
              setDebugInfo(`Found ${formattedResults.length} places`);
            } else {
              // --- Optional Fallback: Geocoder (only if textSearch fails completely) ---
              // console.log("TextSearch failed, trying Geocoder...");
              // const geocoder = new window.google.maps.Geocoder();
              // geocoder.geocode({ address: query }, (geoResults, geoStatus) => {
              //    console.log("Geocoder fallback results:", geoStatus, geoResults);
              //    if (geoStatus === "OK" && geoResults && geoResults.length > 0) {
              //        const formattedGeoResults = geoResults.map(place => ({
              //           place_id: place.place_id, // Geocoder might not always provide place_id
              //           name: place.formatted_address, // Geocoder provides formatted_address
              //           description: place.formatted_address,
              //           formatted_address: place.formatted_address,
              //           location: place.geometry.location,
              //           types: place.types
              //        }));
              //        setSearchResults(formattedGeoResults);
              //        setDebugInfo(`Found ${formattedGeoResults.length} locations via Geocoder`);
              //    } else {
              //        setSearchResults([]);
              //        setDebugInfo(`No results found for: ${query}`);
              //    }
              // });
              setSearchResults([]); // Keep simple: if textSearch fails, show no results
              setDebugInfo(`No results found for: ${query} (Status: ${status})`);
            }
            setIsSearching(false);
          }
        );
      } catch (error) {
        console.error("Error during search:", error);
        setSearchResults([]);
        setIsSearching(false);
        setDebugInfo(`Search error: ${error.message}`);
      }
    }, 500); // 500ms debounce
  };

  // Handle search result selection
  const handleResultSelect = (result) => {
    if (!isLoaded || !window.google) {
      setDebugInfo('Google Maps not loaded');
      return;
    }

    try {
      console.log("Selected result:", result);
      
      // Extracting location from result
      const location = result.location;
      if (!location) {
        setDebugInfo('No location data in result');
        return;
      }
      
      // Ensure we get lat/lng as numbers
      let lat, lng;
      
      // Check if location is a LatLng object or just an object with lat/lng properties
      if (typeof location.lat === 'function' && typeof location.lng === 'function') {
        lat = location.lat();
        lng = location.lng();
      } else if (location.lat && location.lng) {
        lat = parseFloat(location.lat);
        lng = parseFloat(location.lng);
      } else {
        setDebugInfo('Invalid location format');
        return;
      }
      
      console.log(`Selected location: ${lat}, ${lng}`);
      // Use result.name first for display, fallback to formatted_address
      const displayName = result.name || result.formatted_address || result.description;
      setDebugInfo(`Selected: ${displayName}`);
      
      // Update marker position and map center
      const newLocation = { lat, lng };
      setCurrentLocation(newLocation);
      setMapCenter(newLocation);
      
      // Send complete location data back to parent, prioritizing name
      onLocationSelect && onLocationSelect({
        lat,
        long: lng,
        display_address: displayName, // Use the determined display name
        place_name: result.name || displayName, // Prioritize the actual place name if available
        place_id: result.place_id
      });
      
      // Clear search query and results
      setSearchQuery('');
      setSearchResults([]);
      
      // Center map on selected location with higher zoom level
      centerMapOnLocation(lat, lng, 16);
      
    } catch (error) {
      console.error('Error selecting location:', error);
      setDebugInfo(`Selection error: ${error.message}`);
    }
  };

  // Render loading state
  if (!isLoaded) {
    return (
      <div className="relative">
        <div className="mb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={placeholder}
              disabled
            />
          </div>
        </div>
        <div className="w-full h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadError || mapError) {
    return (
      <div className="relative">
        <div className="mb-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder={placeholder}
              disabled
            />
          </div>
        </div>
        <div className="w-full h-[300px] bg-red-50 rounded-lg flex flex-col items-center justify-center p-4">
          <p className="text-red-600 mb-2">Failed to load Google Maps</p>
          <p className="text-sm text-red-500 mb-4">{loadError?.message || mapError}</p>
          <button 
            className="px-3 py-2 bg-indigo-600 text-white rounded-md text-sm"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Render map when everything is loaded properly
  return (
    <div className="relative">
      {/* Search Input */}
      <div className="mb-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={placeholder}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
          {searchResults.map((result, index) => (
            <button
              key={index}
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              onClick={() => handleResultSelect(result)}
            >
              <div className="text-sm text-gray-900">{result.description || result.formatted_address}</div>
              {result.formatted_address && result.description !== result.formatted_address && (
                <div className="text-xs text-gray-500">{result.formatted_address}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={initialZoom}
        onLoad={onMapLoad}
        onClick={onMapClick}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
        }}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
            draggable={true}
            onDragEnd={onMarkerDragEnd}
            animation={window.google?.maps.Animation.DROP}
          />
        )}
      </GoogleMap>
      
      {/* Debug info */}
      <div className="text-xs text-gray-500 mt-1">
        {debugInfo || (searchResults.length > 0 ? `Found ${searchResults.length} results` : '')}
        {currentLocation && ` | Marker at: ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`}
      </div>
    </div>
  );
};

export default LocationMapPicker;