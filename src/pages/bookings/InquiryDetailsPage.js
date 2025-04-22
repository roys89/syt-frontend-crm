import { ArrowLeftIcon, CalendarDaysIcon, CheckIcon, CogIcon, GlobeAltIcon, MagnifyingGlassIcon, MapPinIcon, PencilIcon, PencilSquareIcon, TagIcon, UsersIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { DatePicker } from 'antd';
import axios from 'axios'; // Import axios
import dayjs from 'dayjs';
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

  // Update handleDateChange to handle RangePicker
  const handleDateChange = (dates) => {
    if (!dates || !dates[0] || !dates[1]) {
      setEditData(prev => ({
        ...prev,
        departureDates: {
          startDate: '',
          endDate: ''
        }
      }));
      return;
    }

    setEditData(prev => ({
      ...prev,
      departureDates: {
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
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
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-4xl mx-auto">
        <div className="bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg text-center p-8 w-full">
          <XCircleIcon className="h-12 w-12 text-[#dc2626]/80 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#dc2626]">Error Loading Inquiry</h2>
          <p className="text-[#dc2626]/80 mt-2">{error}</p>
        <button 
          onClick={() => navigate(-1)} 
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#dc2626]/50 transition-all ease duration-200"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
          Go Back
        </button>
        </div>
      </div>
    );
  }

  if (!inquiry) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-center text-[#093923]/60">
          <p className="text-lg">Inquiry details not found.</p>
        </div>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#093923]">Inquiry Details</h1>
          <p className="mt-1 text-sm text-[#13804e] font-mono break-all">Token: {inquiry.itineraryInquiryToken}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" />
            Back
          </button>
          {!isEditing ? (
            <button 
              onClick={handleEditToggle}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" />
              Edit
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={handleSaveChanges}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isSaving ? 'bg-[#13804e]/50 cursor-not-allowed' : 'bg-[#13804e] hover:bg-[#0d5c3a]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200`}
              >
                {isSaving ? <LoadingSpinner small /> : <CheckIcon className="-ml-1 mr-2 h-5 w-5" />}
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button 
                onClick={handleEditToggle}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200 disabled:opacity-50"
              >
                <XMarkIcon className="-ml-1 mr-2 h-5 w-5 text-[#dc2626]" />
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#093923]/10 mb-8">
        <div className="px-6 py-5 bg-[#093923]/5 border-b border-[#093923]/10">
          <h3 className="text-lg font-medium text-[#093923]">Inquiry Summary</h3>
        </div>
        <div className="border-t border-[#093923]/10">
          <dl className="divide-y divide-[#093923]/10">
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-[#093923]/60">Customer</dt>
              <dd className="mt-1 text-sm text-[#093923] sm:mt-0 sm:col-span-2">{customerName}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-[#093923]/60">Email</dt>
              <dd className="mt-1 text-sm text-[#093923] sm:mt-0 sm:col-span-2">{inquiry.userInfo?.email || 'N/A'}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-[#093923]/60">Phone</dt>
              <dd className="mt-1 text-sm text-[#093923] sm:mt-0 sm:col-span-2">{inquiry.userInfo?.countryCode} {inquiry.userInfo?.phoneNumber || 'N/A'}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-[#093923]/60">Date Received</dt>
              <dd className="mt-1 text-sm text-[#093923] sm:mt-0 sm:col-span-2">{createdDate}</dd>
            </div>
            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm font-medium text-[#093923]/60">Assigned Agent</dt>
              <dd className="mt-1 text-sm text-[#093923] sm:mt-0 sm:col-span-2">{agentName}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Travel Details Card */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#093923]/10">
        <div className="px-6 py-5 bg-[#093923]/5 border-b border-[#093923]/10">
          <h3 className="text-lg font-medium text-[#093923]">Travel Details</h3>
        </div>
        <div className="border-t border-[#093923]/10 p-6">
          {error && !loading && (
            <div className="mb-6 p-4 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-lg text-[#dc2626]">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Destinations - Full Width */}
            <div className="md:col-span-2 space-y-1">
              {/* Icon and Label Row */}
              <div className="flex items-center space-x-3">
                <MapPinIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                <span className="block text-sm font-medium text-[#093923]">Destinations</span>
              </div>
              {/* Content Row - Removed pl-8 */}
              <div>
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Current selection tags */}
                    <div className="flex flex-wrap gap-2">
                      {(editData.selectedCities || []).length > 0 ? (
                        (editData.selectedCities || []).map((city) => (
                          <span key={city.destination_id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#13804e]/10 text-[#13804e]">
                            {city.name || city.city}
                            <button
                              type="button"
                              className="ml-1.5 flex-shrink-0 text-[#13804e] hover:text-[#0d5c3a] focus:outline-none focus:text-[#0d5c3a]"
                              onClick={() => handleRemoveCityTag(city)}
                            >
                              <XMarkIcon className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-[#093923]/50 italic">No destinations selected. Use search below to add.</p>
                      )}
                    </div>

                    {/* Destination Search Input */} 
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#093923]/40" />
                      <input
                        type="text"
                        placeholder="Search destinations (country, continent, city)..."
                        value={citySearchInput}
                        onChange={(e) => setCitySearchInput(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-[#093923]/20 rounded-lg shadow-sm focus:outline-none focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm transition-all ease duration-200"
                      />
                      {(isSearchingCities || citySearchResults.length > 0 || citySearchError) && (
                        <div className="mt-1 w-full absolute z-20 bg-white rounded-lg border border-[#093923]/20 shadow-lg max-h-60 overflow-y-auto">
                          {isSearchingCities ? (
                            <div className="px-3 py-2 text-center text-xs text-[#093923]/60">Searching...</div>
                          ) : citySearchError ? (
                            <div className="px-3 py-2 text-center text-xs text-[#dc2626]">{citySearchError}</div>
                          ) : citySearchResults.length > 0 ? (
                            citySearchResults.map((option) => (
                              <div
                                key={option.destination_id || option.name} 
                                onClick={() => {
                                  setInitialDestination(option); 
                                  setCitySearchInput('');
                                  setCitySearchResults([]);
                                }}
                                className="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-[#093923]/5 text-sm transition-colors ease duration-200"
                              >
                                <span>{option.name}</span>
                                <span className="text-xs text-[#093923]/40 capitalize ml-2">{option.type}</span>
                              </div>
                            ))
                          ) : (
                             <div className="px-3 py-2 text-center text-xs text-[#093923]/60">No results found.</div>
                           )}
                        </div>
                      )}
                    </div>

                    {/* City Selection Grid */}
                    {initialDestination && (
                      <div className="mt-4 pt-4 border-t border-[#093923]/10">
                        <h4 className="text-sm font-medium text-[#093923] mb-3">Select cities within: <span className="font-semibold">{initialDestination.name}</span></h4>
                        {isFetchingGridCities ? (
                          <div className="text-center py-4"><LoadingSpinner small /></div>
                        ) : gridFetchError ? (
                           <p className="text-xs text-[#dc2626]">Error: {gridFetchError}</p>
                        ) : citiesForGrid.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {citiesForGrid.map((city) => {
                                    const isSelected = (editData.selectedCities || []).some(sc => sc.destination_id === city.destination_id);
                                    return (
                                      <div
                                        key={city.destination_id}
                                        onClick={() => handleToggleCitySelection(city)}
                                        className={`relative h-40 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 group border-2
                                          ${isSelected ? 'border-[#13804e] ring-2 ring-[#13804e]/30 ring-offset-1' : 'border-[#093923]/20 hover:border-[#13804e]/40'}`}
                                      >
                                        <img
                                          src={city.imageUrl || './placeholder-image.jpg'}
                                          alt={city.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent"></div>
                                        <div className="absolute bottom-0 left-0 right-0 p-3">
                                          <h3 className="text-white text-sm font-semibold truncate">{city.name}</h3>
                                        </div>
                                         {isSelected && (
                                            <div className="absolute top-2 right-2 bg-[#13804e] rounded-full p-1">
                                                <CheckIcon className="h-4 w-4 text-white" />
                                            </div>
                                        )}
                                      </div>
                                    );
                                })}
                            </div>
                        ) : (
                           <p className="text-xs text-[#093923]/50 italic">No specific cities found for this destination.</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#093923]/80 pt-1">{destinations}</p>
                )}
              </div>
            </div>

            {/* Left Column */}
            <div>
              <div className="space-y-6">
                {/* Departure City */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <GlobeAltIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                    <span className="block text-sm font-medium text-[#093923]">Departure City{editData.includeInternational ? '*' : ''}</span>
                  </div>
                  {isEditing ? (
                    <div>
                      <AirportSelector
                        value={editData.departureCity}
                        onChange={(airport) => {
                          setEditData(prev => ({ ...prev, departureCity: airport }));
                        }}
                        placeholder="Search departure city/airport..."
                        disabled={!editData.includeInternational}
                      />
                      {!editData.includeInternational && <p className="mt-1 text-xs text-[#093923]/50">Optional for domestic travel.</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-[#093923]/80 pt-1">{inquiry.departureCity?.name || (inquiry.includeInternational ? 'N/A' : 'Domestic')}</p>
                  )}
                </div>

                {/* Travelers Section */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <UsersIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                    <span className="block text-sm font-medium text-[#093923]">Travelers</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-4">
                    <div>
                         <span className="block text-xs text-[#093923]/60 mb-2">Type</span>
                       <div className="flex flex-wrap gap-2">
                        {travelerTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => handleTravelerTypeChange(type)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium border capitalize transition-all ease duration-200
                              ${editData.travelersDetails?.type === type 
                                  ? 'bg-[#13804e] text-white border-[#13804e]' 
                                  : 'bg-white text-[#093923] border-[#093923]/20 hover:bg-[#093923]/5'}
                            `}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                         <span className="block text-xs text-[#093923]/60 mb-2">Rooms</span>
                        <div className="flex items-center justify-between p-3 bg-[#093923]/5 border border-[#093923]/20 rounded-lg">
                           <p className="text-sm text-[#093923] truncate pr-2">{getRoomSummary(editData.travelersDetails?.rooms)}</p>
                        <button
                          type="button"
                          onClick={() => setIsRoomModalOpen(true)}
                            className="inline-flex items-center px-3 py-1.5 border border-[#13804e]/30 rounded-lg shadow-sm text-xs font-medium text-[#13804e] bg-white hover:bg-[#13804e]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
                        >
                          <PencilIcon className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                    <div className="pt-1">
                      <p className="text-sm text-[#093923]/80">Type: <span className="capitalize">{travelerTypeDisplay}</span></p>
                      <p className="text-sm text-[#093923]/80 mt-1">Rooms: {getRoomSummary(inquiry.travelersDetails?.rooms)}</p>
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="space-y-6">
                {/* Travel Dates*/}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                    <span className="block text-sm font-medium text-[#093923]">Travel Dates</span>
                  </div>
                  {isEditing ? (
                    <DatePicker.RangePicker
                      value={[
                        editData.departureDates?.startDate ? dayjs(editData.departureDates.startDate) : null,
                        editData.departureDates?.endDate ? dayjs(editData.departureDates.endDate) : null
                      ]}
                      onChange={handleDateChange}
                      format="YYYY-MM-DD"
                      className="w-full"
                      disabledDate={(current) => current && current < dayjs().startOf('day')}
                      placeholder={['Start Date', 'End Date']}
                    />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs text-[#093923]/60 mb-1">Departure Date</label>
                        <p className="text-sm text-[#093923]/80">{departureDate}</p>
                      </div>
                      <div>
                        <label className="block text-xs text-[#093923]/60 mb-1">Return Date</label>
                        <p className="text-sm text-[#093923]/80">{returnDate}</p>
                      </div>
                    </div>
                  )}
                </div>
                
              
                {/* Budget */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <TagIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                    <span className="block text-sm font-medium text-[#093923]">Budget</span>
                  </div>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {budgetOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleBudgetChange(option)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ease duration-200
                            ${editData.preferences?.budget === option 
                              ? 'bg-[#13804e] text-white border-[#13804e]' 
                              : 'bg-white text-[#093923] border-[#093923]/20 hover:border-[#13804e]/40 hover:text-[#13804e]'}
                          `}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#093923]/80 pt-1">{budget}</p>
                  )}
                </div>

                {/* Interests */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-3">
                    <CogIcon className="h-5 w-5 text-[#13804e]/60 flex-shrink-0" />
                    <span className="block text-sm font-medium text-[#093923]">Interests</span>
                  </div>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => handleInterestChange(interest)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ease duration-200
                            ${(editData.preferences?.selectedInterests || []).includes(interest)
                              ? 'bg-[#13804e] text-white border-[#13804e]' 
                              : 'bg-white text-[#093923] border-[#093923]/20 hover:border-[#13804e]/40 hover:text-[#13804e]'}
                          `}
                        >
                          {interest}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#093923]/80 pt-1">{interests}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Boolean fields - Full Width */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    name="includeInternational" 
                    checked={editData.includeInternational || false} 
                    onChange={handleInputChange} 
                        className="h-4 w-4 text-[#13804e] border-[#093923]/20 rounded focus:ring-[#13804e]/50 transition-all ease duration-200"
                  />
                    <label className="text-sm text-[#093923]/80">Include International Flights</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    name="includeGroundTransfer" 
                    checked={editData.includeGroundTransfer || false} 
                    onChange={handleInputChange} 
                        className="h-4 w-4 text-[#13804e] border-[#093923]/20 rounded focus:ring-[#13804e]/50 transition-all ease duration-200"
                  />
                    <label className="text-sm text-[#093923]/80">Include Ground Transfer</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    name="includeFerryTransport" 
                    checked={editData.includeFerryTransport || false} 
                    onChange={handleInputChange} 
                        className="h-4 w-4 text-[#13804e] border-[#093923]/20 rounded focus:ring-[#13804e]/50 transition-all ease duration-200"
                  />
                    <label className="text-sm text-[#093923]/80">Include Ferry Transport</label>
                </div>
              </div>
            </div>
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
    </div>
  );
};

export default InquiryDetailPage; 