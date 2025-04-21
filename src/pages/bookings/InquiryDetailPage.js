import { ArrowLeftIcon, CalendarDaysIcon, CheckCircleIcon, CheckIcon, CogIcon, GlobeAltIcon, MagnifyingGlassIcon, MapPinIcon, PencilIcon, PencilSquareIcon, TagIcon, UsersIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Import axios
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector'; // Import AirportSelector
import RoomArrangementModal from '../../components/booking/RoomArrangementModal'; // Import RoomArrangementModal
import LoadingSpinner from '../../components/common/LoadingSpinner'; // Assuming a spinner component exists
import config from '../../config'; // Import config
import bookingService from '../../services/bookingService';

const InquiryDetailPage = () => {
  const { inquiryToken } = useParams();
  const navigate = useNavigate();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    selectedCities: [],
    departureCity: null,
    departureDates: { startDate: '', endDate: '' },
    travelersDetails: { type: '', rooms: [] },
    preferences: { selectedInterests: [], budget: '' },
    includeInternational: false,
    includeGroundTransfer: true,
    includeFerryTransport: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // --- State for City Search/Selection in Edit Mode ---
  const [citySearchInput, setCitySearchInput] = useState('');
  const [citySearchResults, setCitySearchResults] = useState([]); // For initial search dropdown
  const [isSearchingCities, setIsSearchingCities] = useState(false); // For initial search
  const [citySearchError, setCitySearchError] = useState(null);
  const [initialDestination, setInitialDestination] = useState(null); // Store selected initial destination
  const [citiesForGrid, setCitiesForGrid] = useState([]); // Store cities for the grid display
  const [isFetchingGridCities, setIsFetchingGridCities] = useState(false);
  const [gridFetchError, setGridFetchError] = useState(null);
  // ----------------------------------------------------

  // Define interest options (same as in ItineraryBookingPage)
  const interestOptions = [
    "Adventure", "Art & Culture", "History", "Leisure", "Shopping", "Beaches",
    "Visit Like Locals", "Hill stations", "Must see", "Nature", "Hidden gems",
    "Wildlife", "Food & Nightlife", "Festival",
  ];

  // Define budget options (can be used if we make budget buttons)
  const budgetOptions = ["Pocket Friendly", "Somewhere In-Between", "Luxury"];

  // Use useCallback to memoize fetch function
  const fetchInquiryDetails = useCallback(async () => {
    if (!inquiryToken) {
      setError('No inquiry token provided.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use the specific function imported
      const response = await bookingService.getInquiryDetailsByToken(inquiryToken);
      setInquiry(response.data); 
      setEditData(response.data); // Initialize edit data
    } catch (err) {
      console.error('Error fetching inquiry details:', err);
      setError(err.message || 'Failed to load inquiry details.');
      toast.error(err.message || 'Failed to load inquiry details.');
    } finally {
      setLoading(false);
    }
  }, [inquiryToken]);

  useEffect(() => {
    fetchInquiryDetails();
  }, [fetchInquiryDetails]); // Dependency: memoized fetch function

  const formatDate = (dateString, forInput = false) => {
    if (!dateString) return forInput ? '' : 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return forInput ? '' : 'Invalid Date'; // Check for invalid date object
      if (forInput) {
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for input type="date"
      }
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return forInput ? '' : 'Invalid Date';
    }
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    
    // Handle nested properties (e.g., preferences.budget)
    if (name.includes('.')) {
      const [parentKey, childKey] = name.split('.');
      setEditData(prev => ({
        ...prev,
        [parentKey]: {
          ...prev[parentKey],
          [childKey]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setEditData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // Specific handler for nested date fields
  const handleDateChange = (event) => {
    const { name, value } = event.target;
    const [parentKey, childKey] = name.split('.'); // e.g., 'departureDates.startDate'
    setEditData(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value // Store date as YYYY-MM-DD string
      }
    }));
  };

  // --- Handler for Interest Buttons --- 
  const handleInterestChange = (interest) => {
    setEditData(prev => {
      const currentInterests = prev.preferences?.selectedInterests || [];
      const updatedInterests = currentInterests.includes(interest)
        ? currentInterests.filter((item) => item !== interest)
        : [...currentInterests, interest];
      return {
        ...prev,
        preferences: {
          ...prev.preferences,
          selectedInterests: updatedInterests
        }
      };
    });
  };
  // ------------------------------------

  // --- Handler for Budget Buttons --- 
  const handleBudgetChange = (budget) => {
    setEditData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        budget: budget
      }
    }));
  };
  // ----------------------------------

  // --- Handler for Traveler Type Buttons --- 
  const handleTravelerTypeChange = (type) => {
    setEditData(prev => ({
      ...prev,
      travelersDetails: {
        ...prev.travelersDetails,
        type: type
      }
    }));
  };
  // -----------------------------------------

  // --- Handler for saving rooms from Modal --- 
  const handleSaveRooms = (updatedRooms) => {
    setEditData(prev => ({
      ...prev,
      travelersDetails: {
        ...prev.travelersDetails,
        rooms: updatedRooms
      }
    }));
    setIsRoomModalOpen(false); // Close modal on save
  };
  // -------------------------------------------

  // --- Function to generate room summary string --- 
  const getRoomSummary = useCallback((roomsData) => {
    const rooms = roomsData || [];
    if (rooms.length === 0) return 'No rooms configured';
    return rooms.map((room, index) => {
      const adultsCount = Array.isArray(room.adults) ? room.adults.length : 0;
      const childrenCount = Array.isArray(room.children) ? room.children.length : 0;
      return `Room ${index + 1}: ${adultsCount} Adult${adultsCount !== 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Child${childrenCount !== 1 ? 'ren' : ''}` : ''}`;
    }).join('; ');
  }, []);
  // ----------------------------------------------

  // --- City Add/Remove Handlers (Now for the grid) --- 
  const handleToggleCitySelection = (cityToToggle) => {
    setEditData(prev => {
      const currentCities = prev.selectedCities || [];
      const isSelected = currentCities.some(city => city.destination_id === cityToToggle.destination_id);

      let updatedCities;
      if (isSelected) {
        // Remove the city
        updatedCities = currentCities.filter(city => city.destination_id !== cityToToggle.destination_id);
      } else {
        // Add the city (ensure necessary structure)
        const newCity = {
            destination_id: cityToToggle.destination_id, 
            name: cityToToggle.name, 
            city: cityToToggle.city || cityToToggle.name, 
            country: cityToToggle.country, 
            type: cityToToggle.type, 
            imageUrl: cityToToggle.imageUrl, // Include image if available/needed
            rating: cityToToggle.rating // Include rating if available/needed
            // Add other fields if required by backend/validation
        };
        updatedCities = [...currentCities, newCity];
      }
      
      return {
        ...prev,
        selectedCities: updatedCities
      };
    });
  };

  // --- Handler for removing city tag (remains similar) --- 
  const handleRemoveCityTag = (cityToRemove) => {
    setEditData(prev => ({
      ...prev,
      selectedCities: (prev.selectedCities || []).filter(city => city.destination_id !== cityToRemove.destination_id)
    }));
  };
  // ------------------------------------------------------

  // --- useEffect for Initial Destination Search --- 
  useEffect(() => {
    if (citySearchInput.length <= 2) {
      setCitySearchResults([]);
      setCitySearchError(null);
      return;
    }

    const fetchInitialDestinations = async () => {
      setIsSearchingCities(true); // Still indicates searching
      setCitySearchError(null);
      try {
        const response = await axios.get(
          `${config.API_B2C_URL}/destinations/search?query=${encodeURIComponent(citySearchInput)}`
        );
        setCitySearchResults(response.data && Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error searching initial destinations:', error);
        setCitySearchError('Failed to search destinations.');
        setCitySearchResults([]);
      } finally {
        setIsSearchingCities(false);
      }
    };

    const debounceTimer = setTimeout(fetchInitialDestinations, 300);
    return () => clearTimeout(debounceTimer);
  }, [citySearchInput]);
  // ---------------------------------------------

  // --- useEffect for Fetching City Grid based on Initial Destination --- 
  useEffect(() => {
    if (!initialDestination) {
        setCitiesForGrid([]); // Clear grid if no initial destination is selected
        return;
    }

    const fetchCitiesForGrid = async () => {
        setIsFetchingGridCities(true);
        setGridFetchError(null);
        try {
            let destinationName = initialDestination.name;
            // Handle names like "Thailand - Bangkok" if necessary (adjust if needed)
            if (destinationName.includes(' - ')) {
                destinationName = destinationName.split(' - ')[0];
            }

            const response = await axios.get(
                `${config.API_B2C_URL}/destinations/cities?destination=${encodeURIComponent(destinationName)}&destinationType=${initialDestination.type}`
            );
            setCitiesForGrid(response.data && Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching cities for grid:', error);
            setGridFetchError('Failed to load cities for the selected destination.');
            setCitiesForGrid([]);
        } finally {
            setIsFetchingGridCities(false);
        }
    };

    fetchCitiesForGrid();
  }, [initialDestination]); // Trigger when initialDestination changes
  // ------------------------------------------------------------------

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset editData to original inquiry data on cancel
      setEditData(inquiry);
      // Reset city search/selection state
      setCitySearchInput('');
      setCitySearchResults([]);
      setCitySearchError(null);
      setInitialDestination(null);
      setCitiesForGrid([]);
      setGridFetchError(null);
    } else {
      // When entering edit mode, ensure editData has selectedCities array
      setEditData(prev => ({ ...prev, selectedCities: prev.selectedCities || [] }));
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setError(null);
    try {
      // Include selectedCities in the payload
      const updatePayload = {
        selectedCities: editData.selectedCities, // Send the updated array
        departureCity: editData.departureCity,
        departureDates: editData.departureDates,
        travelersDetails: editData.travelersDetails,
        preferences: editData.preferences,
        includeInternational: editData.includeInternational,
        includeGroundTransfer: editData.includeGroundTransfer,
        includeFerryTransport: editData.includeFerryTransport,
      };
      
      // Filter out null/undefined values just before sending? Optional but safer.
      Object.keys(updatePayload).forEach(key => {
          if (updatePayload[key] === undefined || updatePayload[key] === null) {
              // Decide whether to delete the key or send null based on backend expectations
              // delete updatePayload[key]; 
          }
      });

      console.log("Submitting Update Payload:", updatePayload);

      const response = await bookingService.updateInquiryDetails(inquiryToken, updatePayload);
      
      // Direct API response handling - the API returns the updated inquiry directly
      // Check if we got an object with an _id which indicates success
      if (response && response._id) {
        setInquiry(response);
        setEditData(response);
        setIsEditing(false);
        toast.success('Inquiry updated successfully!');
      } else {
        // Handle unexpected response format
        throw new Error('Failed to update inquiry: Unexpected response format');
      }
    } catch (err) {
      console.error('Error saving inquiry details:', err);
      setError(err.message || 'Failed to save changes.');
      toast.error(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const renderDetailItem = (Icon, label, value, editModeValue) => (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="font-medium text-gray-800">{label}:</span>
      <span>{isEditing ? editModeValue : (value || 'N/A')}</span>
    </div>
  );

  if (loading) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg text-center">
        <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800">Error Loading Inquiry</h2>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          onClick={() => navigate(-1)} 
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Go Back
        </button>
      </div>
    );
  }

  if (!inquiry) {
    return <div className="p-6 text-center text-gray-500">Inquiry details not found.</div>;
  }

  // --- Calculate derived data ONLY if inquiry is loaded ---
  const destinations = inquiry.selectedCities?.map(c => c.city || c.name).join(', ') || 'N/A'; // Added || c.name for safety
  const interests = inquiry.preferences?.selectedInterests?.join(', ') || 'N/A';
  const departureDate = formatDate(inquiry.departureDates?.startDate);
  const returnDate = formatDate(inquiry.departureDates?.endDate);
  const createdDate = formatDate(inquiry.createdAt);
  const customerName = inquiry.userInfo ? `${inquiry.userInfo.firstName || ''} ${inquiry.userInfo.lastName || ''}`.trim() : 'N/A';
  const agentName = inquiry.agents?.[0]?.agentName || 'Unassigned';
  const budget = inquiry.preferences?.budget || 'N/A';
  const travelerTypeDisplay = inquiry.travelersDetails?.type || 'N/A';
  // --------------------------------------------------------

  const travelerTypes = ['couple', 'family', 'friends', 'solo']; // Define traveler types

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inquiry Details</h1>
          <p className="mt-1 text-sm text-gray-500 font-mono break-all">Token: {inquiry.itineraryInquiryToken}</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back
          </button>
          {!isEditing ? (
            <button 
              onClick={handleEditToggle}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" />
              Edit
            </button>
          ) : (
            <div className="flex space-x-3">
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
              >
                {isSaving ? <LoadingSpinner small /> : <CheckIcon className="-ml-1 mr-2 h-5 w-5" />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={handleEditToggle} // Cancel
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5 text-red-500" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Inquiry Summary</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Customer</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{customerName}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.userInfo?.email || 'N/A'}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.userInfo?.countryCode} {inquiry.userInfo?.phoneNumber || 'N/A'}</dd>
            </div>
             <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Date Received</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{createdDate}</dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned Agent</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{agentName}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Travel Details</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {/* Display error message if saving failed */} 
          {error && !loading && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8"> {/* Adjusted gap */}
            
            {/* Destinations - Updated Edit Mode UI with Search & Grid */}
            <div className="md:col-span-2"> 
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MapPinIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div className="flex-grow">
                  <span className="font-medium text-gray-800">Destinations:</span>
                  {isEditing ? (
                    <div className="mt-1 space-y-4">
                      {/* Display selected cities as removable tags */} 
                      <div className="flex flex-wrap gap-2">
                        {(editData.selectedCities || []).length > 0 ? (
                          (editData.selectedCities || []).map((city) => (
                            <span key={city.destination_id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {city.name || city.city}
                              <button
                                type="button"
                                className="ml-1.5 flex-shrink-0 text-indigo-500 hover:text-indigo-700 focus:outline-none focus:text-indigo-700"
                                onClick={() => handleRemoveCityTag(city)} // Use specific tag remove handler
                              >
                                <XMarkIcon className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-gray-500 italic">No destinations selected. Use search below to add.</p>
                        )}
                      </div>

                      {/* Initial Destination Search Input & Dropdown */}
                      <div className="relative">
                         <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search destinations (country, continent, city)..."
                          value={citySearchInput}
                          onChange={(e) => setCitySearchInput(e.target.value)}
                          className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                         {/* Initial Search Results Dropdown */} 
                        {(isSearchingCities || citySearchResults.length > 0 || citySearchError) && (
                          <div className="mt-1 w-full absolute z-20 bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
                            {isSearchingCities ? (
                              <div className="px-3 py-2 text-center text-xs text-gray-500">Searching...</div>
                            ) : citySearchError ? (
                              <div className="px-3 py-2 text-center text-xs text-red-600">{citySearchError}</div>
                            ) : citySearchResults.length > 0 ? (
                              citySearchResults.map((option) => (
                                <div
                                  key={option.destination_id || option.name} 
                                  onClick={() => { // Set Initial Destination on click
                                    setInitialDestination(option); 
                                    setCitySearchInput(''); // Clear search
                                    setCitySearchResults([]); // Clear dropdown
                                  }}
                                  className="px-3 py-1.5 flex items-center justify-between cursor-pointer hover:bg-gray-100 text-sm"
                                >
                                  <span>{option.name}</span>
                                  <span className="text-xs text-gray-400 capitalize ml-2">{option.type}</span>
                                </div>
                              ))
                            ) : (
                               <div className="px-3 py-2 text-center text-xs text-gray-500">No results found.</div>
                             )}
                          </div>
                        )}
                      </div>

                      {/* City Grid Display (based on initialDestination) */}
                      {initialDestination && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                           <h4 className="text-sm font-medium text-gray-700 mb-2">Select cities within: <span className="font-semibold">{initialDestination.name}</span></h4>
                           {isFetchingGridCities ? (
                              <div className="text-center py-4"><LoadingSpinner small /></div>
                            ) : gridFetchError ? (
                               <p className="text-xs text-red-600">Error: {gridFetchError}</p>
                            ) : citiesForGrid.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                    {citiesForGrid.map((city) => {
                                        const isSelected = (editData.selectedCities || []).some(sc => sc.destination_id === city.destination_id);
                                        return (
                                          <div
                                            key={city.destination_id}
                                            onClick={() => handleToggleCitySelection(city)} // Add/Remove from editData
                                            className={`relative h-36 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group border-2
                                              ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-300 ring-offset-1' : 'border-gray-200 hover:border-indigo-400'}`}
                                          >
                                            <img
                                              src={city.imageUrl || './placeholder-image.jpg'} // Add a placeholder
                                              alt={city.name}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 right-0 p-2">
                                              <h3 className="text-white text-xs font-semibold truncate">{city.name}</h3>
                                              {/* Optional: Display rating or country */}
                                            </div>
                                             {isSelected && (
                                                <div className="absolute top-1 right-1 bg-indigo-600 rounded-full p-0.5">
                                                    <CheckIcon className="h-3 w-3 text-white" />
                                                </div>
                                            )}
                                          </div>
                                        );
                                    })}
                                </div>
                            ) : (
                               <p className="text-xs text-gray-500 italic">No specific cities found for this destination.</p>
                            )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1">{destinations}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Departure City - Uses AirportSelector */}
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <GlobeAltIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                 <span className="font-medium text-gray-800">Departure City{editData.includeInternational ? '*' : ''}</span>
                {isEditing ? (
                  <div className="mt-1">
                    <AirportSelector
                      value={editData.departureCity}
                      onChange={(airport) => {
                         setEditData(prev => ({ ...prev, departureCity: airport }));
                      }}
                      placeholder="Search departure city/airport..."
                      disabled={!editData.includeInternational}
                    />
                     {!editData.includeInternational && <p className="mt-1 text-xs text-gray-500">Optional for domestic travel.</p>}
                  </div>
                ) : (
                  <p className="mt-1">{inquiry.departureCity?.name || (inquiry.includeInternational ? 'N/A' : 'Domestic')}</p>
                )}
              </div>
            </div>

            {/* Dates remain the same using renderDetailItem */}
            {renderDetailItem(CalendarDaysIcon, "Departure Date", departureDate, 
              <input 
                type="date" 
                name="departureDates.startDate" 
                value={formatDate(editData.departureDates?.startDate, true)} 
                onChange={handleDateChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            )}
            {renderDetailItem(CalendarDaysIcon, "Return Date", returnDate,
              <input 
                type="date" 
                name="departureDates.endDate" 
                value={formatDate(editData.departureDates?.endDate, true)} 
                onChange={handleDateChange} 
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            )}

            {/* Travelers Section - Type buttons and Modal */}
            <div className="md:col-span-1">
              <div className="flex items-start space-x-2 text-sm text-gray-600 mb-2">
                 <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-gray-800">Travelers:</span>
              </div>
              {isEditing ? (
                <div className="space-y-3 pl-7">
                  <div>
                     <span className="block text-xs font-medium text-gray-500 mb-1">Type:</span>
                     <div className="flex flex-wrap gap-2">
                      {travelerTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleTravelerTypeChange(type)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border capitalize
                            ${editData.travelersDetails?.type === type 
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                          `}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                     <span className="block text-xs font-medium text-gray-500 mb-1">Rooms:</span>
                    <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg">
                       <p className="text-xs text-gray-800 truncate pr-2">{getRoomSummary(editData.travelersDetails?.rooms)}</p>
                      <button
                        type="button"
                        onClick={() => setIsRoomModalOpen(true)}
                        className="inline-flex items-center px-2 py-1 border border-indigo-300 rounded-md shadow-sm text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex-shrink-0"
                      >
                        <PencilIcon className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pl-7">
                  <p className="text-sm text-gray-600">Type: <span className="capitalize">{travelerTypeDisplay}</span></p>
                  <p className="text-sm text-gray-600">Rooms: {getRoomSummary(inquiry.travelersDetails?.rooms)}</p>
                </div>
              )}
            </div>
            
            {/* Budget - Use button grid for editing */}
            <div className="md:col-span-1">
              <div className="flex items-start space-x-2 text-sm text-gray-600 mb-2">
                <TagIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-gray-800">Budget:</span>
              </div>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 mt-1 pl-7">
                  {budgetOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleBudgetChange(option)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${editData.preferences?.budget === option 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600'}
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-600 pl-7">{budget}</span>
              )}
            </div>

            {/* Interests - already updated */}
            <div className="md:col-span-1">
              <div className="flex items-start space-x-2 text-sm text-gray-600 mb-2">
                <CogIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <span className="font-medium text-gray-800">Interests:</span>
              </div>
              {isEditing ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => handleInterestChange(interest)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${(editData.preferences?.selectedInterests || []).includes(interest)
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600'}
                      `}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-sm text-gray-600 pl-7">{interests}</span>
              )}
            </div>
            
            {/* Boolean fields - Render using renderDetailItem */} 
            {renderDetailItem(CheckCircleIcon, "Include Intl Flights", inquiry.includeInternational ? 'Yes' : 'No', 
              <input 
                type="checkbox" 
                name="includeInternational" 
                checked={editData.includeInternational || false} 
                onChange={handleInputChange} 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            )}
            {renderDetailItem(CheckCircleIcon, "Include Ground Transfer", inquiry.includeGroundTransfer ? 'Yes' : 'No', 
              <input 
                type="checkbox" 
                name="includeGroundTransfer" 
                checked={editData.includeGroundTransfer || false} 
                onChange={handleInputChange} 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            )}
            {renderDetailItem(CheckCircleIcon, "Include Ferry Transfer", inquiry.includeFerryTransport ? 'Yes' : 'No',
              <input 
                type="checkbox" 
                name="includeFerryTransport" 
                checked={editData.includeFerryTransport || false} 
                onChange={handleInputChange} 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Render RoomArrangementModal */} 
       <RoomArrangementModal 
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        initialRooms={editData.travelersDetails?.rooms || [{ adults: [30], children: [] }]}
        onSave={handleSaveRooms}
      />

      {/* TODO: Add more sections if needed, e.g., display raw JSON, associated itinerary link etc. */}
      {/* TODO: Implement proper handling for Destinations */}

    </div>
  );
};

export default InquiryDetailPage; 