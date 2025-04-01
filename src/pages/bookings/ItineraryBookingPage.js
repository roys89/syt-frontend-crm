    // src/pages/bookings/ItineraryBookingPage.js
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
import RoomArrangementModal from '../../components/booking/RoomArrangementModal';

// Component for a booking item in the itinerary
const BookingItem = ({ booking, onRemove, onEdit }) => {
  const getBookingTypeDetails = () => {
    switch (booking.type) {
      case 'flight':
        return {
          icon: (
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          linkTo: '/bookings/flight'
        };
      case 'hotel':
        return {
          icon: (
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          linkTo: '/bookings/hotel'
        };
      case 'activity':
        return {
          icon: (
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          linkTo: '/bookings/activity'
        };
      case 'transfer':
        return {
          icon: (
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          linkTo: '/bookings/transfer'
        };
      default:
        return {
          icon: (
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          linkTo: '/bookings/create'
        };
    }
  };
  
  const { icon, bgColor, borderColor, linkTo } = getBookingTypeDetails();
  
  return (
    <div className={`rounded-md border ${borderColor} ${bgColor} p-4`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="mr-4 mt-1">
            {icon}
          </div>
          <div>
            <h4 className="text-lg font-medium capitalize">{booking.type}</h4>
            <p className="text-sm text-gray-600">
              {booking.destination?.name || booking.destination?.city} {booking.destination?.code ? `(${booking.destination.code})` : ''}
            </p>
            <p className="text-sm text-gray-600">{booking.date}</p>
            <p className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'}`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={linkTo}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <button
            onClick={() => onRemove(booking.id)}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for adding a booking to an itinerary
const AddBookingItem = ({ type, onAdd, onCancel }) => {
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState('');
  const [bookingType, setBookingType] = useState(type || 'flight');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!destination) {
      toast.error('Please select a destination');
      return;
    }
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    // Create a booking item based on type
    const bookingItem = {
      id: Date.now().toString(),
      type: bookingType,
      destination: destination,
      date: date,
      status: 'pending',
      // Add other default values based on booking type
    };
    
    onAdd(bookingItem);
  };
  
  return (
    <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Add {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Type
          </label>
          <select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="activity">Activity</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          {bookingType === 'flight' ? (
            <AirportSelector
              value={destination}
              onChange={setDestination}
              placeholder="Search destination city/airport..."
            />
          ) : (
            <AirportSelector
              value={destination}
              onChange={setDestination}
              placeholder="Search destination city/airport..."
            />
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add to Itinerary
          </button>
        </div>
      </form>
    </div>
  );
};

const ItineraryBookingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  
  // Itinerary form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    customer: '',
    notes: '',
    agentCode: '',
    selectedCities: [],
    departureCity: null,
    departureDates: { 
      startDate: '', 
      endDate: '' 
    },
    travelersDetails: {
      type: '',
      rooms: [{ adults: 1, children: [] }]
    },
    preferences: {
      selectedInterests: [],
      budget: ''
    },
    includeInternational: false,
    includeGroundTransfer: true,
    includeFerryTransport: false,
    userInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: ''
    },
    citySearch: '',
    initialDestination: null
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingCities, setIsFetchingCities] = useState(false);
  
  // Step configuration
  const steps = [
    { id: 'cities', title: 'Select Cities' },
    { id: 'departure', title: 'Departure Details' },
    { id: 'travelers', title: 'Travelers Details' },
    { id: 'preferences', title: 'Preferences' },
    { id: 'customer', title: 'Customer Information' },
    { id: 'review', title: 'Review' }
  ];
  
  // Validation function
  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 0: // Cities
        if (formData.selectedCities.length === 0) {
          newErrors.selectedCities = 'At least one city must be selected';
        }
        break;
        
      case 1: // Departure
        if (!formData.departureCity) {
          newErrors.departureCity = 'Departure city is required';
        }
        if (!formData.departureDates.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.departureDates.endDate) {
          newErrors.endDate = 'End date is required';
        }
        break;
        
      case 2: // Travelers
        if (!formData.travelersDetails.type) {
          newErrors.travelerType = 'Traveler type is required';
        }
        if (!Array.isArray(formData.travelersDetails.rooms) || formData.travelersDetails.rooms.length === 0) {
             newErrors.rooms = 'Please configure room arrangements.';
        }
        break;
        
      case 3: // Preferences
        if (formData.preferences.selectedInterests.length === 0) {
          newErrors.interests = 'At least one interest must be selected';
        }
        if (!formData.preferences.budget) {
          newErrors.budget = 'Budget information is required';
        }
        break;
        
      case 4: // Customer
        if (!formData.userInfo.firstName.trim()) {
          newErrors.firstName = 'First name is required';
        }
        if (!formData.userInfo.lastName.trim()) {
          newErrors.lastName = 'Last name is required';
        }
        if (!formData.userInfo.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.userInfo.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.userInfo.phoneNumber.trim()) {
          newErrors.phoneNumber = 'Phone number is required';
        }
        if (!formData.agentCode.trim()) {
          newErrors.agentCode = 'Agent code is required';
        }
        break;
        
      case 5: // Review - validate all
        // Combine all validations from previous steps
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes
  const handleChange = useCallback((section, field, value) => {
    setFormData(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: value
          }
        };
      }
      return {
      ...prev,
        [field]: value
      };
    });
  }, []);
  
  // Navigation handlers
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fix the errors before continuing');
    }
  }, [currentStep, validateStep]);
  
  const handleBack = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(5)) {
      toast.error('Please review the form for errors');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Remove bookings field before submitting if it exists
      const { bookings, ...submitData } = formData; 
      console.log("Submitting Itinerary Data:", submitData);
      // Call API to submit itinerary booking
      // const response = await bookingService.createItineraryBooking(submitData);
      
      toast.success('Itinerary booking created successfully!');
      
      // Reset form or redirect
      // history.push('/bookings');
    } catch (error) {
      console.error('Error submitting itinerary:', error);
      toast.error('Failed to submit itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to save rooms from modal
  const handleSaveRooms = (updatedRooms) => {
    handleChange('travelersDetails', 'rooms', updatedRooms);
  };

  // Function to generate room summary string
  const getRoomSummary = () => {
    const rooms = formData.travelersDetails.rooms || [];
    if (rooms.length === 0) return 'No rooms configured';
    return rooms.map((room, index) => {
      const adults = room.adults || 0;
      const children = room.children ? room.children.length : 0;
      return `Room ${index + 1}: ${adults} Adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} Child${children !== 1 ? 'ren' : ''}` : ''}`;
    }).join('; ');
  };

  // Render step content
  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Cities
        return (
          <div className="w-full px-4 sm:px-8 py-4">
            <h2 className="text-xl font-medium text-gray-800 mb-2 text-center">
              Select Cities
            </h2>
            
            <p className="text-gray-600 text-center mb-6 italic">
              Please select cities in the order you wish to travel
            </p>

            <div className="mb-8 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search for a Destination
              </label>
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search cities, countries, or continents..."
                  value={formData.citySearch}
                  onChange={(e) => handleChange(null, 'citySearch', e.target.value)}
                  className="w-full h-12 pl-10 pr-4 text-base rounded-xl 
                           border border-gray-200 dark:border-gray-700
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent
                           placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              {/* Search Results Dropdown */}
              {isSearching ? (
                <div className="mt-2 text-center text-gray-500">Searching...</div>
              ) : formData.citySearch.length > 2 && (
                <div className="mt-2 w-full absolute z-10 bg-white rounded-xl border border-gray-200 shadow-lg max-h-96 overflow-y-auto">
                  {Array.isArray(formData.searchResults) && formData.searchResults.length > 0 ? (
                    formData.searchResults.map((option) => (
                      <div
                        key={option.name + option.type} // Use a more unique key if possible
                        onClick={() => {
                          handleChange(null, 'initialDestination', option);
                          handleChange(null, 'citySearch', '');
                          // Clear previous cities when a new destination is selected
                          setFormData(prev => ({ ...prev, cities: [] })); 
                        }}
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      >
                        <span>{option.name}</span>
                        <span className="text-sm text-gray-500 capitalize ml-4">
                          {option.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-gray-500">No results found</div>
                  )}
                </div>
              )}
            </div>

            {/* City Selection Grid */}
            {isFetchingCities ? (
               <div className="mt-4 text-center text-gray-500">Loading cities...</div>
            ) : formData.initialDestination && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.isArray(formData.cities) && formData.cities.length > 0 ? (
                  formData.cities.map((city) => {
                    const isSelected = Array.isArray(formData.selectedCities) && formData.selectedCities.some(
                      (selectedCity) => selectedCity.destination_id === city.destination_id
                    );

                    return (
                      <div
                        key={city.destination_id}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            selectedCities: isSelected
                              ? prev.selectedCities.filter(c => c.destination_id !== city.destination_id)
                              : [...prev.selectedCities, city]
                          }));
                        }}
                        className={`relative h-48 rounded-xl overflow-hidden cursor-pointer transition-all duration-300
                          ${isSelected ? 'ring-4 ring-emerald-500' : 'hover:ring-2 hover:ring-emerald-300'}`}
                      >
                        <img
                          src={city.imageUrl || "default-city-image.jpg"}
                          alt={city.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                          <h3 className="text-white font-medium">{city.name}</h3>
                          <div className="flex items-center text-white/80 text-sm">
                            <span className="mr-1">★</span>
                            <span>{city.rating || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center text-gray-500">No cities found for this destination.</div>
                )}
              </div>
            )}
            
            {errors.selectedCities && (
              <p className="mt-1 text-sm text-red-600">{errors.selectedCities}</p>
            )}
          </div>
        );
        
      case 1: // Departure
        return (
          <div className="departure-step">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Departure Details</h2>
              <p className="text-gray-600">Enter departure city and travel dates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure City
                </label>
                <AirportSelector
                  value={formData.departureCity}
                  onChange={(airport) => handleChange(null, 'departureCity', airport)}
                  placeholder="Search departure city/airport..."
                  disabled={!formData.includeInternational}
                />
                {errors.departureCity && (
                  <p className="mt-1 text-sm text-red-600">{errors.departureCity}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Dates
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.departureDates.startDate}
                      onChange={(e) => handleChange('departureDates', 'startDate', e.target.value)}
                    />
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.departureDates.endDate}
                      onChange={(e) => handleChange('departureDates', 'endDate', e.target.value)}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeInternational"
                  checked={formData.includeInternational}
                  onChange={(e) => handleChange(null, 'includeInternational', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeInternational" className="ml-2 text-sm text-gray-700">
                  Include International Travel
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeGroundTransfer"
                  checked={formData.includeGroundTransfer}
                  onChange={(e) => handleChange(null, 'includeGroundTransfer', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeGroundTransfer" className="ml-2 text-sm text-gray-700">
                  Include Ground Transfers
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeFerryTransport"
                  checked={formData.includeFerryTransport}
                  onChange={(e) => handleChange(null, 'includeFerryTransport', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="includeFerryTransport" className="ml-2 text-sm text-gray-700">
                  Include Ferry Transport
                </label>
              </div>
            </div>
          </div>
        );
        
      case 2: // Travelers
        const travelerTypes = ['Couple', 'Family', 'Group', 'Solo'];
        return (
          <div className="travelers-step">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Travelers Details</h2>
              <p className="text-gray-600">Select traveler type and configure rooms</p>
            </div>
            
            <div className="space-y-6">
              {/* Traveler Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Traveler Type
                </label>
                <div className="flex flex-wrap gap-3">
                  {travelerTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('travelersDetails', 'type', type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border
                        ${formData.travelersDetails.type === type 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}
                      `}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                {errors.travelerType && (
                  <p className="mt-1 text-sm text-red-600">{errors.travelerType}</p>
                )}
              </div>

              {/* Room Arrangement Summary & Button */}
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Arrangement
                </label>
                <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800 truncate pr-4">{getRoomSummary()}</p>
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(true)}
                    className="inline-flex items-center px-3 py-1.5 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                </div>
                 {errors.rooms && (
                  <p className="mt-1 text-sm text-red-600">{errors.rooms}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 3: // Preferences
        const interestOptions = [
          "Adventure", "Art & Culture", "History", "Leisure", "Shopping", "Beaches",
          "Visit Like Locals", "Hill stations", "Must see", "Nature", "Hidden gems",
          "Wildlife", "Food & Nightlife", "Festival",
        ];
        const budgetOptions = ["Pocket Friendly", "Somewhere In-Between", "Luxury"];

        const handleInterestChange = (interest) => {
          const currentInterests = formData.preferences.selectedInterests || [];
          const updatedInterests = currentInterests.includes(interest)
            ? currentInterests.filter((item) => item !== interest)
            : [...currentInterests, interest];
          handleChange('preferences', 'selectedInterests', updatedInterests);
        };

        const handleBudgetChange = (option) => {
          handleChange('preferences', 'budget', option);
        };
        
        return (
          <div className="preferences-step px-4">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Preferences</h2>
              <p className="text-gray-600">Select interests and budget for the trip</p>
            </div>
            
            {/* Interests Section */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-3">Interest Preferences</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleInterestChange(interest)}
                    className={`px-5 py-3 rounded-full text-sm font-medium border-2 transition-colors duration-150
                      ${(formData.preferences.selectedInterests || []).includes(interest)
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600'}
                    `}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              {errors.interests && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.interests}</p>
              )}
            </div>

            {/* Budget Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-3">Budget Preference</h3>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleBudgetChange(option)}
                    className={`flex-1 px-5 py-4 rounded-lg text-center font-medium border-2 transition-colors duration-150 flex items-center justify-center
                      ${formData.preferences.budget === option 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500 hover:text-indigo-600'}
                    `}
                  >
                    {/* Optional: Add a radio-like icon if desired */}
                    {/* <span className={`w-4 h-4 rounded-full border-2 mr-2 ${formData.preferences.budget === option ? 'bg-white border-white' : 'border-gray-400'}`}></span> */}
                    {option}
                  </button>
                ))}
              </div>
              {errors.budget && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.budget}</p>
              )}
            </div>
          </div>
        );
        
      case 4: // Customer
        return (
          <div className="customer-step">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Customer Information</h2>
              <p className="text-gray-600">Enter customer and agent details</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.userInfo.firstName}
                  onChange={(e) => handleChange('userInfo', 'firstName', e.target.value)}
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.userInfo.lastName}
                  onChange={(e) => handleChange('userInfo', 'lastName', e.target.value)}
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.userInfo.email}
                  onChange={(e) => handleChange('userInfo', 'email', e.target.value)}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.userInfo.phoneNumber}
                  onChange={(e) => handleChange('userInfo', 'phoneNumber', e.target.value)}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Code
                </label>
                <input
                  type="text"
                  className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.agentCode}
                  onChange={(e) => handleChange(null, 'agentCode', e.target.value)}
                />
                {errors.agentCode && (
                  <p className="mt-1 text-sm text-red-600">{errors.agentCode}</p>
                )}
              </div>
            </div>
          </div>
        );
        
      case 5: // Review
        return (
          <div className="review-step">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Review Itinerary</h2>
              <p className="text-gray-600">Review all information before creating</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Selected Cities</h3>
                <p className="text-gray-600">
                  {formData.selectedCities.length > 0 
                    ? formData.selectedCities.map(city => city.name).join(', ') 
                    : 'No cities selected'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Departure Details</h3>
                <p className="text-gray-600">
                  From: {formData.departureCity?.name || 'Not specified'}<br />
                  Dates: {formData.departureDates.startDate} to {formData.departureDates.endDate}
                </p>
                <div className="mt-2 text-sm">
                  <p>{formData.includeInternational ? '✓' : '✗'} International Travel</p>
                  <p>{formData.includeGroundTransfer ? '✓' : '✗'} Ground Transfers</p>
                  <p>{formData.includeFerryTransport ? '✓' : '✗'} Ferry Transport</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Travelers</h3>
                <p className="text-gray-600">
                  Type: {formData.travelersDetails.type || 'Not specified'}<br />
                  Rooms: {formData.travelersDetails.rooms.length || 0}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Preferences</h3>
                <p className="text-gray-600">
                  Interests: {formData.preferences.selectedInterests.length > 0 
                    ? formData.preferences.selectedInterests.join(', ') 
                    : 'None selected'}<br />
                  Budget: {formData.preferences.budget || 'Not specified'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Customer Information</h3>
                <p className="text-gray-600">
                  Name: {formData.userInfo.firstName} {formData.userInfo.lastName}<br />
                  Email: {formData.userInfo.email}<br />
                  Phone: {formData.userInfo.phoneNumber}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Agent Information</h3>
                <p className="text-gray-600">
                  Agent Code: {formData.agentCode}
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Add useEffect for API calls
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (formData.citySearch.length > 2) {
        setIsSearching(true);
        try {
          const response = await axios.get(
            `http://localhost:5000/api/destinations/search?query=${encodeURIComponent(formData.citySearch)}`
          );
          setFormData(prev => ({
            ...prev,
            searchResults: Array.isArray(response.data) ? response.data : [] // Ensure it's an array
          }));
        } catch (error) {
          console.error('Error searching destinations:', error);
          setFormData(prev => ({ ...prev, searchResults: [] })); // Set empty array on error
        } finally {
          setIsSearching(false);
        }
      } else {
        setFormData(prev => ({ ...prev, searchResults: [] }));
      }
    };
    
    // Debounce search
    const timerId = setTimeout(() => {
        fetchSearchResults();
    }, 300); // Add a small delay

    return () => clearTimeout(timerId);

  }, [formData.citySearch]);

  useEffect(() => {
    const fetchCities = async () => {
      if (formData.initialDestination) {
        setIsFetchingCities(true);
        try {
          // Extract only the base destination name (e.g., "United Arab Emirates")
          let destinationName = formData.initialDestination.name;
          if (destinationName.includes(' - ')) {
            destinationName = destinationName.split(' - ')[0];
          }
          
          const response = await axios.get(
            `http://localhost:5000/api/destinations/cities?destination=${encodeURIComponent(destinationName)}&destinationType=${formData.initialDestination.type}`
          );
          setFormData(prev => ({
            ...prev,
            cities: Array.isArray(response.data) ? response.data : [] // Ensure it's an array
          }));
        } catch (error) {
          console.error('Error fetching cities:', error);
          setFormData(prev => ({ ...prev, cities: [] })); // Set empty array on error
        } finally {
          setIsFetchingCities(false);
        }
      } else {
         setFormData(prev => ({ ...prev, cities: [] })); // Clear cities if no destination
      }
    };

    fetchCities();
  }, [formData.initialDestination]);
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Itinerary Booking</h1>
        <p className="mt-2 text-gray-600">Create a new itinerary booking for a customer</p>
      </div>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, idx) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${idx < steps.length - 1 ? 'w-full' : ''}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${idx < currentStep ? 'bg-indigo-600 text-white' : 
                    idx === currentStep ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-600' : 
                    'bg-gray-100 text-gray-500'}`}
              >
                {idx + 1}
              </div>
              <span 
                className={`text-xs mt-1 text-center
                  ${idx <= currentStep ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}
              >
                {step.title}
              </span>
            </div>
          ))}
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-600 transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form onSubmit={handleSubmit}>
          {/* Step content */}
          <div className="mb-8">
            {renderStepContent()}
          </div>
          
          {/* Navigation buttons */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium 
                ${currentStep === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <ChevronLeftIcon className="w-5 h-5 inline-block mr-1" />
              Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next
                <ChevronRightIcon className="w-5 h-5 inline-block ml-1" />
              </button>
            ) : (
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 inline-block" />
                    Submitting...
                </>
              ) : (
                  'Create Itinerary'
              )}
            </button>
            )}
          </div>
        </form>
      </div>

      {/* Room Arrangement Modal */} 
      <RoomArrangementModal 
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        initialRooms={formData.travelersDetails.rooms}
        onSave={handleSaveRooms}
      />
    </div>
  );
};

export default ItineraryBookingPage;