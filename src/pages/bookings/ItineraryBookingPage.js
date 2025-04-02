    // src/pages/bookings/ItineraryBookingPage.js
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
import RoomArrangementModal from '../../components/booking/RoomArrangementModal';
import CustomerRegistrationModal from '../../components/itinerary/CustomerRegistrationModal'; // Import the modal
import { AuthContext } from '../../context/AuthContext'; // Import AuthContext
import bookingService from '../../services/bookingService'; // Import the service

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
  const { user: agent } = useContext(AuthContext); // Get agent details from AuthContext
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false); // New loading state
  const [generatedItinerary, setGeneratedItinerary] = useState(null); // State for result
  const [currentStep, setCurrentStep] = useState(0);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  
  // Customer Search/Selection State
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Holds the selected customer object
  const [showRegisterModal, setShowRegisterModal] = useState(false); // State to control modal visibility
  
  // Itinerary form state
  const [formData, setFormData] = useState({
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
    userInfo: null, 
    citySearch: '',
    initialDestination: null,
    searchResults: [], // For city search
    cities: [] // For city selection
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  const [isSearching, setIsSearching] = useState(false); // For city search
  const [isFetchingCities, setIsFetchingCities] = useState(false); // For city fetch
  
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
        if (!Array.isArray(formData.selectedCities) || formData.selectedCities.length === 0) {
          newErrors.selectedCities = 'At least one city must be selected';
        }
        break;
        
      case 1: // Departure
        if (!formData.departureCity && formData.includeInternational) { // Only require if international
          newErrors.departureCity = 'Departure city is required for international travel';
        }
        if (!formData.departureDates.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.departureDates.endDate) {
          newErrors.endDate = 'End date is required';
        }
        // Add date validation (end date must be after start date)
        if (formData.departureDates.startDate && formData.departureDates.endDate && 
            new Date(formData.departureDates.endDate) <= new Date(formData.departureDates.startDate)) {
        newErrors.endDate = 'End date must be after start date';
      }
        break;
        
      case 2: // Travelers
        if (!formData.travelersDetails.type) {
          newErrors.travelerType = 'Traveler type is required';
        }
        if (!Array.isArray(formData.travelersDetails.rooms) || formData.travelersDetails.rooms.length === 0) {
             newErrors.rooms = 'Please configure room arrangements.';
        }
        // Add validation for room contents (e.g., at least one adult per room) if needed
        break;
        
      case 3: // Preferences
        if (!Array.isArray(formData.preferences.selectedInterests) || formData.preferences.selectedInterests.length === 0) {
          newErrors.interests = 'At least one interest must be selected';
        }
        if (!formData.preferences.budget) {
          newErrors.budget = 'Budget information is required';
        }
        break;
        
      case 4: // Customer
        // Validate if a customer is selected
        if (!selectedCustomer || !selectedCustomer._id) {
          newErrors.customer = 'Please select or register a customer.';
        }
        if (!formData.agentCode || !formData.agentCode.trim()) {
          newErrors.agentCode = 'Agent code is required';
        }
        break;
        
      case 5: // Review - validate all (or specific final checks)
        // Re-run validation for all previous steps if needed, or check final composite state
        if (!selectedCustomer || !selectedCustomer._id) {
          newErrors.customer = 'Customer information is missing.';
        }
         if (!formData.agentCode || !formData.agentCode.trim()) {
          newErrors.agentCode = 'Agent code is required';
        }
        // Add checks for other critical fields like cities, dates etc. if desired
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle input changes (generic)
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
      // If moving from customer step, ensure selected customer is in formData.userInfo
      if (currentStep === 4 && selectedCustomer) {
        setFormData(prev => ({ ...prev, userInfo: selectedCustomer }));
      }
      setCurrentStep(prev => prev + 1);
      setErrors({}); // Clear errors on successful step change
    } else {
      toast.error('Please fix the errors before continuing');
    }
  }, [currentStep, validateStep, selectedCustomer]);
  
  const handleBack = useCallback(() => {
    setCurrentStep(prev => prev - 1);
    setErrors({}); // Clear errors when going back
  }, []);
  
  // Handle Customer Search (Updated)
  const handleCustomerSearch = async () => {
    if (!customerSearchQuery.trim()) {
      toast.warn('Please enter an email or phone number to search.');
      return;
    }
    setIsSearchingCustomer(true);
    setCustomerSearchResults([]);
    setSelectedCustomer(null);
    setFormData(prev => ({ ...prev, userInfo: null }));
    setErrors(prev => ({...prev, customer: undefined}));

    try {
      // Use the bookingService function
      const responseData = await bookingService.searchCustomers(customerSearchQuery);
      
      setCustomerSearchResults(responseData.users || []); // Access the users array
      if (!responseData.users || responseData.users.length === 0) {
        toast.info('No customers found matching your query.');
      }
    } catch (error) { // Error is already thrown by the service
      console.error('Error searching customers (component level):', error);
      toast.error(error.message || 'Failed to search customers. Please check the connection or contact support.');
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomer(false);
    }
  };

  // Handle Customer Selection
  const handleSelectCustomer = (customer) => {
    if (customer && customer._id) {
      console.log("Customer selected:", customer);
      setSelectedCustomer(customer);
      // Pre-fill userInfo in formData immediately
      setFormData(prev => ({ ...prev, userInfo: customer }));
      setCustomerSearchQuery(''); // Clear search
      setCustomerSearchResults([]); // Clear results
      setErrors(prev => ({...prev, customer: undefined})); // Clear any previous customer error
      setShowRegisterModal(false); // Ensure register modal is closed
    } else {
      console.error("handleSelectCustomer called with invalid customer data:", customer);
      toast.error("Failed to select customer. Invalid data received.");
    }
  };

  // Trigger opening the registration modal
  const handleTriggerRegister = () => {
    setShowRegisterModal(true);
  };

  // Handle form submission (Updated - Create Itinerary After Inquiry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`handleSubmit called. Current Step: ${currentStep}`); // Debug log

    // Explicitly check if we are on the final step before submitting
    if (currentStep !== steps.length - 1) {
      console.log('handleSubmit called prematurely, ignoring.'); // Debug log
      return; // Do nothing if not on the final step
    }
    
    if (selectedCustomer && !formData.userInfo) {
       setFormData(prev => ({ ...prev, userInfo: selectedCustomer }));
    }

    if (!validateStep(5)) { 
      toast.error('Please review the form for errors');
      // Don't change step here, validation should handle showing errors on the review step
      return;
    }

    if (!agent || !agent._id) {
      toast.error("Agent details not found. Please log in again.");
      return;
    }
    
    setIsLoading(true); // Start initial loading (for inquiry submission)
    try {
      // --- Part 1: Submit Inquiry --- 
      const payload = {
         // ... (construct payload as before)
         selectedCities: formData.selectedCities,
         departureCity: formData.departureCity,
         departureDates: formData.departureDates,
         travelersDetails: formData.travelersDetails,
         preferences: formData.preferences,
         includeInternational: formData.includeInternational,
         includeGroundTransfer: formData.includeGroundTransfer,
         includeFerryTransport: formData.includeFerryTransport,
         userInfo: {
           userId: formData.userInfo?._id, 
           firstName: formData.userInfo?.firstName,
           lastName: formData.userInfo?.lastName,
           email: formData.userInfo?.email,
           phoneNumber: formData.userInfo?.phoneNumber,
           country: formData.userInfo?.country,
           countryCode: formData.userInfo?.countryCode,
           dob: formData.userInfo?.dob, 
         },
         agents: [{
           agentId: agent._id, 
           agentCode: formData.agentCode.trim(),
           agentName: agent.name, 
           agentEmail: agent.email 
         }]
      };
      
      console.log("Submitting Itinerary Inquiry Payload:", payload);
      const inquiryResponse = await bookingService.submitItineraryInquiry(payload);
      toast.success('Itinerary inquiry created successfully!');
      console.log("Inquiry Response:", inquiryResponse);
      
      // --- Part 2: Create Itinerary --- 
      const inquiryToken = inquiryResponse?.itineraryInquiryToken;
      if (!inquiryToken) {
        throw new Error("Inquiry token not found in response.");
      }
      
      setIsLoading(false); // Stop initial loading
      setIsCreatingItinerary(true); // Start itinerary creation loading
      toast.info('Generating the detailed itinerary...');
      
      console.log("Calling createCrmItinerary with token:", inquiryToken);
      const itineraryData = await bookingService.createCrmItinerary(inquiryToken);
      
      console.log("Generated Itinerary Data:", itineraryData);
      setGeneratedItinerary(itineraryData); // Store the generated itinerary
      toast.success('Itinerary generated successfully!');
      
      // TODO: Decide what to do now? Reset form? Keep showing itinerary?
      // For now, we just store the data. Conditional rendering will show it.

    } catch (error) { 
      console.error('Error during submission process:', error);
      setIsLoading(false);
      setIsCreatingItinerary(false); 
      toast.error(error.message || 'An error occurred during the process.'); 
    } finally {
      setIsLoading(false);
      setIsCreatingItinerary(false);
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
        const travelerTypes = ['couple', 'family', 'friends', 'solo'];
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
          <div className="customer-step space-y-6">
            <div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">Customer Information</h2>
              <p className="text-gray-600">Search for an existing customer or register a new one.</p>
            </div>

            {/* Display Selected Customer */}
            {selectedCustomer && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-lg font-medium text-green-800 mb-2">Selected Customer</h3>
                <p className="text-sm text-green-700">
                  <strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName} <br />
                  <strong>Email:</strong> {selectedCustomer.email} <br />
                  <strong>Phone:</strong> {selectedCustomer.phoneNumber} <br />
                  <strong>ID:</strong> {selectedCustomer._id}
                </p>
                <button
                  type="button"
                   onClick={() => {
                     setSelectedCustomer(null);
                     setFormData(prev => ({ ...prev, userInfo: null }));
                   }}
                   className="mt-2 text-sm text-red-600 hover:text-red-800"
                 >
                   Change Customer
                </button>
              </div>
            )}

            {/* Customer Search Section */}
            {!selectedCustomer && (
              <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700">Search Existing Customer</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter customer email or phone..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="flex-grow block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isSearchingCustomer}
                  />
                <button
                  type="button"
                    onClick={handleCustomerSearch}
                    disabled={isSearchingCustomer || !customerSearchQuery.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isSearchingCustomer ? 'Searching...' : 'Search'}
                </button>
                </div>

                {/* Search Results */}
                {customerSearchResults.length > 0 && (
                  <div className="mt-4 max-h-48 overflow-y-auto border border-gray-200 rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {customerSearchResults.map(customer => (
                        <li 
                          key={customer._id} 
                          onClick={() => handleSelectCustomer(customer)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
                         >
                          {customer.firstName} {customer.lastName} ({customer.email})
                        </li>
                      ))}
                    </ul>
              </div>
            )}
          </div>
            )}
            
             {/* Register New Customer Button */}
             {!selectedCustomer && (
                <div className="flex items-center justify-center pt-4 border-t border-gray-200">
                   <span className="text-sm text-gray-500 mr-2">Can't find the customer?</span>
                  <button
                    type="button"
                    onClick={handleTriggerRegister}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Register New Customer
                  </button>
                </div>
             )}

            {/* Agent Code Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agent Code <span className="text-red-500">*</span>
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

            {/* General Customer Selection Error */}
            {errors.customer && !selectedCustomer && (
              <p className="mt-1 text-sm text-red-600 text-center">{errors.customer}</p>
            )}
          </div>
        );
        
      case 5: // Review
        const reviewCustomer = formData.userInfo || selectedCustomer; // Use data from form state if available
        const reviewAgent = agent; // Get agent details for display

        return (
          <div className="review-step">
            <div className="mb-6">
              <h2 className="text-xl font-medium text-gray-800 mb-2">Review Itinerary Inquiry</h2>
              <p className="text-gray-600">Review all information before submitting the inquiry.</p>
            </div>
            
            <div className="space-y-4">
              {/* ... existing review sections for Cities, Departure, Travelers, Preferences ... */}
               <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Selected Cities</h3>
                <p className="text-sm text-gray-600">
                  {formData.selectedCities.length > 0 
                    ? formData.selectedCities.map(city => city.name || city.city).join(', ') 
                    : 'No cities selected'}
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Departure Details</h3>
                 <p className="text-sm text-gray-600">
                  From: {formData.departureCity?.name || (formData.includeInternational ? 'Not specified' : 'N/A - Domestic')}<br />
                  Dates: {formData.departureDates.startDate || 'N/A'} to {formData.departureDates.endDate || 'N/A'}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                   <p>{formData.includeInternational ? '✓' : '✗'} International Travel</p>
                  <p>{formData.includeGroundTransfer ? '✓' : '✗'} Ground Transfers</p>
                  <p>{formData.includeFerryTransport ? '✓' : '✗'} Ferry Transport</p>
                 </div>
               </div>
              
               <div className="bg-gray-50 p-4 rounded-md">
                 <h3 className="font-medium text-gray-800 mb-2">Travelers</h3>
                 <p className="text-sm text-gray-600">
                   Type: {formData.travelersDetails.type || 'Not specified'}<br />
                  Rooms: {getRoomSummary()}
                 </p>
               </div>
              
               <div className="bg-gray-50 p-4 rounded-md">
                 <h3 className="font-medium text-gray-800 mb-2">Preferences</h3>
                 <p className="text-sm text-gray-600">
                   Interests: {formData.preferences.selectedInterests.length > 0 
                    ? formData.preferences.selectedInterests.join(', ') 
                     : 'None selected'}<br />
                   Budget: {formData.preferences.budget || 'Not specified'}
                 </p>
               </div>

              {/* Updated Customer Info Review */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Customer Information</h3>
                {reviewCustomer ? (
                  <p className="text-sm text-gray-600">
                    Name: {reviewCustomer.firstName} {reviewCustomer.lastName}<br />
                    Email: {reviewCustomer.email}<br />
                    Phone: {reviewCustomer.phoneNumber} <br/>
                    ID: {reviewCustomer._id}
                  </p>
                ) : (
                  <p className="text-sm text-red-600">No customer selected.</p>
                )}
              </div>
              
              {/* Updated Agent Info Review */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Agent Information</h3>
                <p className="text-sm text-gray-600">
                  Agent Code: {formData.agentCode || 'Not specified'}<br/>
                  Agent Name: {reviewAgent.name} <br/>
                  Agent Email: {reviewAgent.email} <br/>
                  Agent ID: {reviewAgent._id} 
                </p>
              </div>
              {/* Display final validation errors if any */}
               {Object.keys(errors).length > 0 && (
                 <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Please resolve the following issues:</h3>
                   <ul className="list-disc list-inside text-sm text-red-700">
                     {Object.entries(errors).map(([key, value]) => (
                       <li key={key}>{value}</li>
                      ))}
                   </ul>
                 </div>
               )}
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
  
  // Conditional Rendering
  if (generatedItinerary) {
    // TODO: Replace with actual CrmItineraryDisplay component
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Generated Itinerary</h1>
        <button 
          onClick={() => setGeneratedItinerary(null)} 
          className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Inquiry
        </button>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
          {JSON.stringify(generatedItinerary, null, 2)}
        </pre>
      </div>
    );
  }
  
  // Render the multi-step form if no itinerary is generated yet
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
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {/* Step content */}
          <div className="mb-8 min-h-[300px]"> {/* Added min-height */}
            {renderStepContent()}
          </div>
          
          {/* Navigation buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || isLoading || isCreatingItinerary}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ChevronLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Back
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading || isCreatingItinerary}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Next
                <ChevronRightIcon className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
            <button
              type="submit"
              disabled={isLoading || isCreatingItinerary}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isCreatingItinerary ? 'Generating Itinerary...' : isLoading ? 'Submitting Inquiry...' : 'Create Itinerary Inquiry'}
              {(isLoading || isCreatingItinerary) && <ArrowPathIcon className="animate-spin ml-2 h-5 w-5" />}
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

      {/* Customer Registration Modal */} 
      <CustomerRegistrationModal 
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegisterSuccess={handleSelectCustomer}
      />
    </div>
  );
};

export default ItineraryBookingPage;