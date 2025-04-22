    // src/pages/bookings/ItineraryBookingPage.js
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Button, Checkbox, ConfigProvider, DatePicker, Input } from 'antd';
import axios from 'axios';
import dayjs from 'dayjs';
import React, { useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
import CustomerAssignmentModal from '../../components/booking/CustomerAssignmentModal';
import RoomArrangementModal from '../../components/booking/RoomArrangementModal';
import CrmItineraryDisplay from '../../components/itinerary/display/CrmItineraryDisplay';
import { AuthContext } from '../../context/AuthContext';
import bookingService from '../../services/bookingService';

// Theme colors
const primaryColor = '#093923'; // Dark Green
const secondaryColor = '#13804e'; // Lighter Green
const accentColor = '#eef7f2'; // Light Green Background
const textColor = '#093923'; // Dark Green text
const textColorLight = '#093923/70'; // Lighter dark green text
const borderColor = '#093923/10'; // Subtle border

// Ant Design theme configuration
const antTheme = {
  token: {
    colorPrimary: secondaryColor,
    colorBorder: `rgba(9, 57, 35, 0.1)`, // borderColor equivalent
    borderRadius: 8,
    colorText: textColor,
    colorTextSecondary: `rgba(9, 57, 35, 0.7)`, // textColorLight equivalent
    controlHeight: 40,
  },
  components: {
    Button: {
      borderRadius: 8,
      controlHeight: 40,
      paddingContentHorizontal: 16,
    },
    Input: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 40,
    },
    DatePicker: {
      borderRadius: 8,
      controlHeight: 40,
    },
    Checkbox: {
      borderRadius: 4,
    }
  }
};

// Update the input styles to be more specific
const inputStyles = {
  '.ant-select': {
    width: '100%',
  },
  '.ant-select-selector': {
    height: '40px !important',
    padding: '0 11px !important',
  },
  '.ant-select-selection-search': {
    height: '38px !important',
    display: 'flex !important',
    alignItems: 'center !important',
  },
  '.ant-select-selection-search-input': {
    height: '38px !important',
  },
  '.ant-select-selection-placeholder': {
    lineHeight: '38px !important',
    display: 'flex !important',
    alignItems: 'center !important',
  },
  '.ant-select-selection-item': {
    lineHeight: '38px !important',
    display: 'flex !important',
    alignItems: 'center !important',
  }
};

// Add specific styles for the wrapper div
const selectorWrapperStyles = {
  '.airport-selector-wrapper': {
    '.ant-select': {
      width: '100%',
    },
    '.ant-select-selector': {
      minHeight: '40px !important',
      height: '40px !important',
      display: 'flex',
      alignItems: 'center',
    }
  }
};

const ItineraryBookingPage = () => {
  const { user: agent } = useContext(AuthContext); // Get agent details from AuthContext
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [isCreatingItinerary, setIsCreatingItinerary] = useState(false);
  const [generatedItinerary, setGeneratedItinerary] = useState(null);
  const [submittedInquiryToken, setSubmittedInquiryToken] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  
  // MODIFICATION: Add state for loading itinerary by token
  const [isLoadingItinerary, setIsLoadingItinerary] = useState(false);
  const [loadItineraryError, setLoadItineraryError] = useState(null);

  // MODIFICATION: Get location object
  const location = useLocation();
  
  // Customer Search/Selection State - REMOVED Unused state
  // const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  // const [customerSearchResults, setCustomerSearchResults] = useState([]);
  // const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // Keep selectedCustomer
  // const [showRegisterModal, setShowRegisterModal] = useState(false);
  
  // Itinerary form state
  const [formData, setFormData] = useState({
    employeeId: '',
    selectedCities: [],
    departureCity: null,
    departureDates: { 
      startDate: '',
      endDate: '' 
    },
    travelersDetails: {
      type: '',
      rooms: [{ adults: [30], children: [] }]
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
    searchResults: [],
    cities: []
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
    { id: 'review', title: 'Review Inquiry' }
  ];
  
  // NEW useEffect to auto-populate employeeId from agent context
  useEffect(() => {
    if (agent?.employeeId) {
      setFormData(prev => ({
        ...prev,
        employeeId: agent.employeeId
      }));
    } else if (agent) {
      // Optional: Handle case where agent exists but has no ID (log warning?)
      console.warn("Logged-in agent does not have an Employee ID.");
    }
  }, [agent]); // Re-run if agent object changes
  
  // Validation function
  const validateStep = useCallback((step) => {
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
        if (formData.departureDates.startDate && formData.departureDates.endDate && 
            dayjs(formData.departureDates.endDate).isBefore(dayjs(formData.departureDates.startDate))) {
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
        // Remove validation for employeeId as it's auto-populated
        /* 
        if (!formData.employeeId || !formData.employeeId.trim()) { 
          newErrors.employeeId = 'Employee ID is required';
        }
        */ 
        break;
        
      case 5: // Review - validate all
        if (!Array.isArray(formData.selectedCities) || formData.selectedCities.length === 0) newErrors.selectedCities = 'At least one city must be selected';
        if (!formData.departureDates.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.departureDates.endDate) newErrors.endDate = 'End date is required';
        if (formData.departureDates.startDate && formData.departureDates.endDate && new Date(formData.departureDates.endDate) <= new Date(formData.departureDates.startDate)) newErrors.endDate = 'End date must be after start date';
        if (!formData.travelersDetails.type) newErrors.travelerType = 'Traveler type is required';
        if (!Array.isArray(formData.travelersDetails.rooms) || formData.travelersDetails.rooms.length === 0) newErrors.rooms = 'Please configure room arrangements.';
        if (!Array.isArray(formData.preferences.selectedInterests) || formData.preferences.selectedInterests.length === 0) newErrors.interests = 'At least one interest must be selected';
        if (!formData.preferences.budget) newErrors.budget = 'Budget information is required';
        if (!formData.userInfo && selectedCustomer) {
            console.warn("Review step validation: Adding selected customer to form state.");
            setFormData(prev => ({ ...prev, userInfo: selectedCustomer }));
        } else if (!formData.userInfo) {
            // Assuming customer is optional for inquiry
        }
        // Remove validation for employeeId as it's auto-populated
        /*
        if (!formData.employeeId || !formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
        */
        break;
      // Added default case for ESLint rule
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, selectedCustomer]);
  
  // Handle input changes
  const handleChange = useCallback((section, field, value) => {
    setFormData(prev => {
      if (section === 'departureDates' && field === 'range') {
        // Handle RangePicker value: [startDate, endDate]
        const [start, end] = value || [null, null]; // Handle null case (clearing selection)
        return {
          ...prev,
          departureDates: {
            startDate: start ? start.format('YYYY-MM-DD') : '',
            endDate: end ? end.format('YYYY-MM-DD') : ''
          }
        };
      } else if (section) {
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
    // Clear errors for the specific field being changed
    if (section === 'departureDates' && field === 'range') {
      setErrors(prevErrors => ({ ...prevErrors, startDate: undefined, endDate: undefined }));
    } else if (section && field) {
       setErrors(prevErrors => ({ ...prevErrors, [field]: undefined }));
    } else if (field) {
         setErrors(prevErrors => ({ ...prevErrors, [field]: undefined }));
    }
  }, []);
  
  // Navigation handlers
  const handleNext = useCallback(() => {
    if (validateStep(currentStep)) {
      if (currentStep === 4 && selectedCustomer) {
        setFormData(prev => ({ ...prev, userInfo: selectedCustomer }));
      }
      setCurrentStep(prev => prev + 1);
      setErrors({});
    } else {
      toast.error('Please fix the errors before continuing');
    }
  }, [currentStep, validateStep, selectedCustomer]);
  
  const handleBack = useCallback(() => {
    setCurrentStep(prev => prev - 1);
    setErrors({});
  }, []);
  
  // Handle Customer Search - Keep this? Modal handles its own search, but page might still need it?
  // For now, let's assume the modal handles search entirely.
  // We might remove handleCustomerSearch, isSearchingCustomer, customerSearchQuery, customerSearchResults later if not needed.

  // Handle Customer Selection - This will be called by the MODAL now
  const handleCustomerSelectionFromModal = useCallback((customer) => {
    if (customer && customer._id) {
      console.log("Customer selected/registered via modal:", customer);
      setSelectedCustomer(customer); // Update page state
      setFormData(prev => ({ ...prev, userInfo: customer })); // Update form data
      // Ensure these lines are completely removed or correctly commented:
      // setCustomerSearchQuery(''); 
      // setCustomerSearchResults([]); 
      setErrors(prev => ({...prev, customer: undefined})); // Clear any errors
      setIsAssignModalOpen(false); // Close the modal
    } else {
      console.error("CustomerAssignmentModal callback received invalid customer data:", customer);
      toast.error("Failed to process customer selection.");
      setIsAssignModalOpen(false); // Close modal even on error
    }
  }, []); // Dependencies are correct (empty)
  
  // Trigger opening the assignment modal
  const openCustomerAssignmentModal = useCallback(() => {
     setIsAssignModalOpen(true);
  }, []);

  // Trigger opening the registration modal - This logic MOVES INSIDE CustomerAssignmentModal
  // const handleTriggerRegister = useCallback(() => {
  //   setShowRegisterModal(true);
  // }, []); 

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(`handleSubmit called. Current Step: ${currentStep}`);

    if (currentStep !== steps.length - 1) {
      console.log('handleSubmit called prematurely, ignoring.');
      return;
    }
    
    if (selectedCustomer && !formData.userInfo) {
       setFormData(prev => ({ ...prev, userInfo: selectedCustomer }));
    }

    if (!validateStep(5)) { 
      toast.error('Please review the form for errors');
      return;
    }
    
    if (!agent || !agent._id) {
      toast.error("Agent details not found. Please log in again.");
      return;
    }
    
    setIsSubmittingInquiry(true);
    setSubmittedInquiryToken(null);
    setGeneratedItinerary(null);

    try {
      let departureCityForPayload = { ...formData.departureCity };
      if (departureCityForPayload && !departureCityForPayload.iata && departureCityForPayload.code) {
        departureCityForPayload.iata = departureCityForPayload.code;
      } else if (formData.includeInternational && (!departureCityForPayload || (!departureCityForPayload.iata && !departureCityForPayload.code))) {
          throw new Error("Departure city IATA/Code is missing for international travel.");
      } else if (!formData.includeInternational) {
          departureCityForPayload = null;
      }

      // Construct base payload first
      const payload = {
         selectedCities: formData.selectedCities,
         departureCity: departureCityForPayload,
         departureDates: formData.departureDates,
         travelersDetails: formData.travelersDetails,
         preferences: formData.preferences,
         includeInternational: formData.includeInternational,
         includeGroundTransfer: formData.includeGroundTransfer,
         includeFerryTransport: formData.includeFerryTransport,
         // userInfo is added conditionally below
         agents: [{
           agentId: agent._id, 
           employeeId: formData.employeeId.trim(),
           agentName: agent.name, 
           agentEmail: agent.email 
         }]
      };

      // Conditionally add userInfo only if it exists
      if (formData.userInfo) {
        payload.userInfo = {
          userId: formData.userInfo._id,
          firstName: formData.userInfo.firstName,
          lastName: formData.userInfo.lastName,
          email: formData.userInfo.email,
          phoneNumber: formData.userInfo.phoneNumber,
          country: formData.userInfo.country,
          countryCode: formData.userInfo.countryCode,
          dob: formData.userInfo.dob,
        };
      }
      
      console.log("Submitting Itinerary Inquiry Payload:", payload);
      const inquiryResponse = await bookingService.submitItineraryInquiry(payload);
      toast.success('Itinerary inquiry created successfully!');
      console.log("Inquiry Response:", inquiryResponse);
      
      const inquiryToken = inquiryResponse?.itineraryInquiryToken;
      if (!inquiryToken) {
        throw new Error("Inquiry token not found in response.");
      }
      
      setSubmittedInquiryToken(inquiryToken);

    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error(error.message || 'An error occurred during inquiry submission.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  // --- New handler for generating itinerary (Ensure this is defined within the component scope) ---
  const handleGenerateItinerary = async () => {
    if (!submittedInquiryToken) {
      toast.error("Cannot generate itinerary: Inquiry token is missing.");
      return;
    }

    setIsCreatingItinerary(true); // Start itinerary generation loading
    setGeneratedItinerary(null);

    try {
      toast.info('Generating the detailed itinerary...');
      console.log("Calling createItineraryFromInquiry with token:", submittedInquiryToken);
      const itineraryData = await bookingService.createItineraryFromInquiry(submittedInquiryToken);

      console.log("Raw Itinerary creation RESPONSE:", JSON.stringify(itineraryData, null, 2)); // LOG RAW RESPONSE

      // Check 1: Is the basic response valid?
      if (!itineraryData) {
        throw new Error("Received empty response from itinerary generation service.");
      }

      // Check 2: Did the API report success explicitly? (Handle explicit false)
      if (itineraryData.success === false) { 
          throw new Error(itineraryData.message || "Itinerary generation failed according to API.");
      }

      // Check 3: Does the response data ITSELF look like the itinerary object?
      if (itineraryData.itineraryToken && itineraryData.cities && itineraryData.travelersDetails) {
          console.log("Setting generatedItinerary state with the main response object:", itineraryData);
          setGeneratedItinerary(itineraryData); // TRY USING THE ROOT OBJECT
          toast.success('Itinerary generated successfully!');
      }
      // Check 4: Maybe the itinerary object IS nested under 'itinerary'?
      else if (itineraryData.itinerary && itineraryData.itinerary.itineraryToken) {
          console.log("Setting generatedItinerary state with nested 'itinerary' object:", itineraryData.itinerary);
          setGeneratedItinerary(itineraryData.itinerary); // TRY NESTED 'itinerary'
          toast.success('Itinerary generated successfully!');
      }
      // Check 5: Maybe the itinerary object IS nested under 'data'?
      else if (itineraryData.data && itineraryData.data.itineraryToken) {
          console.log("Setting generatedItinerary state with nested 'data' object:", itineraryData.data);
          setGeneratedItinerary(itineraryData.data); // TRY NESTED 'data'
          toast.success('Itinerary generated successfully!');
      }
      // Check 6: If none of the above worked...
      else {
          // Check if success was explicitly true but format still wrong
          if (itineraryData.success === true) {
            console.error("API reported success, but response format is unexpected. Neither root nor nested 'itinerary'/'data' object looks correct:", itineraryData);
            throw new Error('API reported success, but response format is unexpected. Check console.');
          } else {
            // Assume failure if success flag wasn't explicitly true and format checks failed
            console.error("Itinerary generation response format is unexpected or indicates failure:", itineraryData);
             throw new Error(itineraryData?.message || 'Failed to generate itinerary or response format is incorrect/unexpected.');
          }
      }

    } catch (error) {
      console.error('Error generating itinerary:', error);
      toast.error(error.message || 'An error occurred during itinerary generation.');
    } finally {
      setIsCreatingItinerary(false); // Stop itinerary generation loading
    }
  };

  // --- New function to reset the form/state (Ensure this is defined within the component scope) ---
  const handleCreateNewInquiry = () => {
      setGeneratedItinerary(null);
      setSubmittedInquiryToken(null);
      setCurrentStep(0); // Go back to the first step
      // Reset formData to its initial state
      setFormData({
         employeeId: '',
         selectedCities: [],
         departureCity: null,
         departureDates: { startDate: '', endDate: '' },
         travelersDetails: { type: '', rooms: [{ adults: [30], children: [] }] },
         preferences: { selectedInterests: [], budget: '' },
         includeInternational: false,
         includeGroundTransfer: true,
         includeFerryTransport: false,
         userInfo: null,
         citySearch: '',
         initialDestination: null,
         searchResults: [],
         cities: []
      });
      setSelectedCustomer(null); // Clear selected customer
      setErrors({});
      toast.info("Form reset. You can create a new inquiry.");
  };

  // Function to save rooms from modal (Re-adding this function)
  const handleSaveRooms = useCallback((updatedRooms) => {
    handleChange('travelersDetails', 'rooms', updatedRooms);
  }, [handleChange]);

  // Function to generate room summary string
  const getRoomSummary = useCallback(() => {
    const rooms = formData.travelersDetails.rooms || [];
    if (rooms.length === 0) return 'No rooms configured';
    return rooms.map((room, index) => {
      const adultsCount = Array.isArray(room.adults) ? room.adults.length : 0;
      const childrenCount = Array.isArray(room.children) ? room.children.length : 0;
      return `Room ${index + 1}: ${adultsCount} Adult${adultsCount !== 1 ? 's' : ''}${childrenCount > 0 ? `, ${childrenCount} Child${childrenCount !== 1 ? 'ren' : ''}` : ''}`;
    }).join('; ');
  }, [formData.travelersDetails.rooms]);

  // Render step content
  const renderStepContent = useCallback(() => {
    switch(currentStep) {
      case 0:
  return (
          <div className="w-full px-4 sm:px-8 py-4">
            <h2 className={`text-xl font-semibold text-[${textColor}] mb-2 text-center`}>
              Select Cities
            </h2>
            
            <p className={`text-[${textColorLight}] text-center mb-6 italic`}>
              Please select cities in the order you wish to travel
            </p>

            <div className="mb-8 relative">
              <label className={`block text-sm font-medium text-[${textColor}] mb-2`}>
                Search for a Destination
              </label>
              <Input.Search
                  placeholder="Search cities, countries, or continents..."
                  value={formData.citySearch}
                  onChange={(e) => handleChange(null, 'citySearch', e.target.value)}
                loading={isSearching}
                className="w-full"
              />

              {formData.citySearch.length > 2 && (
                <div className={`mt-2 w-full absolute z-10 bg-white rounded-xl border border-[${borderColor}] shadow-lg max-h-96 overflow-y-auto`}>
                  {Array.isArray(formData.searchResults) && formData.searchResults.length > 0 ? (
                    formData.searchResults.map((option) => (
                      <div
                        key={option.name + option.type}
                        onClick={() => {
                          handleChange(null, 'initialDestination', option);
                          handleChange(null, 'citySearch', '');
                          setFormData(prev => ({ ...prev, cities: [] })); 
                        }}
                        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[${accentColor}] text-[${textColor}]`}
                      >
                        <span>{option.name}</span>
                        <span className={`text-sm text-[${textColorLight}] capitalize ml-4`}>
                          {option.type}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className={`px-4 py-3 text-center text-[${textColorLight}]`}>No results found</div>
                  )}
                </div>
              )}
            </div>
            
            {/* City Selection Grid */}
            {isFetchingCities ? (
              <div className={`mt-4 text-center text-[${textColorLight}]`}>Loading cities...</div>
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
                          ${isSelected ? `ring-4 ring-[${secondaryColor}]` : `hover:ring-2 hover:ring-[${secondaryColor}]/50`}`}
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
                  <div className={`col-span-full text-center text-[${textColorLight}]`}>No cities found for this destination.</div>
                )}
              </div>
            )}
            
            {errors.selectedCities && (
              <p className="mt-1 text-sm text-red-600">{errors.selectedCities}</p>
            )}
          </div>
        );
        
      case 1:
        return (
          <div className="departure-step p-4">
            <div className="mb-6">
              <h2 className={`text-xl font-semibold text-[${textColor}] mb-2`}>Departure Details</h2>
              <p className={`text-[${textColorLight}]`}>Enter departure city (if international) and travel dates</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="airport-selector-wrapper">
                <label className={`block text-sm font-medium text-[${textColor}] mb-1`}>
                  Departure City
              </label>
                <div style={{ height: '40px' }}>
                <AirportSelector
                  value={formData.departureCity}
                  onChange={(airport) => handleChange(null, 'departureCity', airport)}
                  placeholder="Search departure city/airport..."
                  disabled={!formData.includeInternational}
                    style={inputStyles}
                    className="h-[40px]"
                />
                </div>
                {errors.departureCity && (
                  <p className="mt-1 text-sm text-red-600">{errors.departureCity}</p>
                )}
                
              </div>
              
              <div>
                <label className={`block text-sm font-medium text-[${textColor}] mb-1`}>
                  Travel Dates
                </label>
                <DatePicker.RangePicker
                  value={[
                    formData.departureDates.startDate ? dayjs(formData.departureDates.startDate) : null,
                    formData.departureDates.endDate ? dayjs(formData.departureDates.endDate) : null
                  ]}
                  onChange={(dates) => handleChange('departureDates', 'range', dates)}
                  format="YYYY-MM-DD"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  className="w-full"
                  style={{ height: '40px' }}
                />
                {(errors.startDate || errors.endDate) && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.startDate && errors.endDate 
                      ? 'Start and End dates are required.' 
                      : errors.startDate || errors.endDate}
                  </p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Checkbox
                  checked={formData.includeInternational}
                  onChange={(e) => {
                      handleChange(null, 'includeInternational', e.target.checked);
                      if (!e.target.checked) handleChange(null, 'departureCity', null);
                  }}
              >
                  Include International Travel
              </Checkbox>
              
              <Checkbox
                  checked={formData.includeGroundTransfer}
                  onChange={(e) => handleChange(null, 'includeGroundTransfer', e.target.checked)}
              >
                  Include Ground Transfers
              </Checkbox>
            
              <Checkbox
                  checked={formData.includeFerryTransport}
                  onChange={(e) => handleChange(null, 'includeFerryTransport', e.target.checked)}
              >
                  Include Ferry Transport
              </Checkbox>
          </div>
          </div>
        );
        
      case 2:
        const travelerTypes = ['couple', 'family', 'friends', 'solo'];
        return (
          <div className="travelers-step p-4">
            <div className="mb-6">
              <h2 className={`text-xl font-semibold text-[${textColor}] mb-2`}>Travelers Details</h2>
              <p className={`text-[${textColorLight}]`}>Select traveler type and configure rooms</p>
              </div>
            
            <div className="space-y-6">
              {/* Traveler Type Selection */}
              <div>
                <label className={`block text-sm font-medium text-[${textColor}] mb-2`}>
                  Traveler Type
                </label>
                <div className="flex flex-wrap gap-3">
                  {travelerTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleChange('travelersDetails', 'type', type)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border capitalize transition-colors duration-150
                        ${formData.travelersDetails.type === type 
                          ? `bg-[${primaryColor}] text-white border-[${primaryColor}]` // Selected: Dark green bg
                          : `bg-white text-[${textColor}] border-[${borderColor}] hover:bg-[${accentColor}] hover:border-[${secondaryColor}]`} // Default: Light green hover
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
                 <label className={`block text-sm font-medium text-[${textColor}] mb-2`}>
                  Room Arrangement
                </label>
                <div className={`flex items-center justify-between p-4 bg-[${accentColor}] border border-[${borderColor}] rounded-lg`}>
                  <p className={`text-sm text-[${textColor}] truncate pr-4`}>{getRoomSummary()}</p>
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(true)}
                    className={`inline-flex items-center px-3 py-1.5 border border-[${secondaryColor}]/50 rounded-md shadow-sm text-sm font-medium text-[${secondaryColor}] bg-white hover:bg-[${accentColor}] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${secondaryColor}]`}
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
        
      case 3:
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
              <h2 className={`text-xl font-semibold text-[${textColor}] mb-2`}>Preferences</h2>
              <p className={`text-[${textColorLight}]`}>Select interests and budget for the trip</p>
            </div>
            
            {/* Interests Section */}
            <div className="mb-8">
              <h3 className={`text-lg font-medium text-[${textColor}] mb-3`}>Interest Preferences</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {interestOptions.map((interest) => (
                <button
                    key={interest}
                  type="button"
                    onClick={() => handleInterestChange(interest)}
                    className={`px-5 py-3 rounded-full text-sm font-medium border-2 transition-colors duration-150
                      ${(formData.preferences.selectedInterests || []).includes(interest)
                        ? `bg-[${primaryColor}] text-white border-[${primaryColor}]` // Selected: Dark green bg
                        : `bg-white text-[${textColor}] border-[${borderColor}] hover:border-[${secondaryColor}] hover:text-[${secondaryColor}]`} // Default: Hover effect
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
              <h3 className={`text-lg font-medium text-[${textColor}] mb-3`}>Budget Preference</h3>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                {budgetOptions.map((option) => (
                <button
                    key={option}
                  type="button"
                    onClick={() => handleBudgetChange(option)}
                    className={`flex-1 px-5 py-4 rounded-lg text-center font-medium border-2 transition-colors duration-150 flex items-center justify-center
                      ${formData.preferences.budget === option 
                        ? `bg-[${primaryColor}] text-white border-[${primaryColor}]` // Selected: Dark green bg
                        : `bg-white text-[${textColor}] border-[${borderColor}] hover:border-[${secondaryColor}] hover:text-[${secondaryColor}]`} // Default: Hover effect
                    `}
                  >
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
        
      case 4: // Customer - MODIFIED TO USE MODAL
        return (
          <div className="customer-step space-y-6 p-4">
            <div>
              <h2 className={`text-xl font-semibold text-[${textColor}] mb-2`}>Customer Information</h2>
              <p className={`text-[${textColorLight}]`}>Select an existing customer or register a new one. (Optional)</p>
            </div>

            {/* Display Selected Customer Info */}
            {selectedCustomer ? (
              <div className={`p-4 bg-[${accentColor}] border border-[${secondaryColor}]/30 rounded-lg`}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className={`text-lg font-medium text-[${textColor}] mb-1`}>Selected Customer</h3>
                <p className={`text-sm text-[${textColor}]/80`}>
                  <strong>Name:</strong> {selectedCustomer.firstName} {selectedCustomer.lastName} <br />
                  <strong>Email:</strong> {selectedCustomer.email} <br />
                          {selectedCustomer.countryCode && <><strong>Code:</strong> {selectedCustomer.countryCode} <br /></>}
                          {selectedCustomer.phoneNumber && <><strong>Phone:</strong> {selectedCustomer.phoneNumber} <br /></>}
                          {selectedCustomer.country && <><strong>Country:</strong> {selectedCustomer.country} <br /></>}
                          {selectedCustomer.dob && <><strong>DOB:</strong> {new Date(selectedCustomer.dob).toLocaleDateString()} <br /></>}
                  <strong>ID:</strong> {selectedCustomer._id}
                </p>
              </div>
                <button
                  type="button"
                       onClick={openCustomerAssignmentModal}
                       className={`ml-4 inline-flex items-center px-3 py-1 border border-[${secondaryColor}]/50 rounded-md shadow-sm text-sm font-medium text-[${secondaryColor}] bg-white hover:bg-[${accentColor}] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[${secondaryColor}]`}
                >
                       <PencilIcon className="h-4 w-4 mr-1" />
                       Change
                </button>
                </div>
              </div>
            ) : (
              // Button to open the modal if no customer is selected
              <div className={`text-center py-6 px-4 border-2 border-dashed border-[${borderColor}] rounded-lg`}>
                 <p className={`text-[${textColorLight}] mb-4`}>No customer selected for this inquiry yet.</p>
            <button
                    type="button"
                    onClick={openCustomerAssignmentModal}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[${primaryColor}] hover:bg-[${secondaryColor}] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[${primaryColor}]/50 transition-colors duration-150`}
                  >
                    <UserPlusIcon className="h-5 w-5 mr-2" />
                    Select or Register Customer
                  </button>
                </div>
             )}

            {/* Employee ID Input - Now ReadOnly */}
            <div className="mt-6">
              <label className={`block text-sm font-medium text-[${textColor}] mb-1`}>
                Employee ID
              </label>
              <input
                type="text"
                className={`block w-full py-2 px-3 border border-[${borderColor}] rounded-lg bg-gray-100 focus:outline-none sm:text-sm text-[${textColor}] cursor-not-allowed`}
                value={formData.employeeId}
                readOnly
              />
            </div>
          </div>
        );
        
      case 5:
        const reviewCustomer = formData.userInfo || selectedCustomer;
        const reviewAgent = agent;
        return (
          <div className="review-step p-4">
            <div className="mb-6">
              <h2 className={`text-xl font-semibold text-[${textColor}] mb-2`}>Review Itinerary Inquiry</h2>
              <p className={`text-[${textColorLight}]`}>Review all information before submitting the inquiry.</p>
            </div>
            
            <div className="space-y-4">
               <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                <h3 className={`font-semibold text-[${textColor}] mb-2`}>Selected Cities</h3>
                <p className={`text-sm text-[${textColor}]/80`}>
                  {formData.selectedCities.length > 0 
                    ? formData.selectedCities.map(city => city.name || city.city).join(', ') 
                    : 'No cities selected'}
                </p>
              </div>
              
              <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                <h3 className={`font-semibold text-[${textColor}] mb-2`}>Departure Details</h3>
                 <p className={`text-sm text-[${textColor}]/80`}>
                  From: {formData.departureCity?.name || (formData.includeInternational ? 'Not specified' : 'N/A - Domestic')}<br />
                  Dates: {formData.departureDates.startDate || 'N/A'} to {formData.departureDates.endDate || 'N/A'}
                </p>
                <div className={`mt-2 text-xs text-[${textColor}]/60`}>
                   <p>{formData.includeInternational ? '✓' : '✗'} International Travel</p>
                  <p>{formData.includeGroundTransfer ? '✓' : '✗'} Ground Transfers</p>
                  <p>{formData.includeFerryTransport ? '✓' : '✗'} Ferry Transport</p>
                 </div>
               </div>
              
               <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                 <h3 className={`font-semibold text-[${textColor}] mb-2`}>Travelers</h3>
                 <p className={`text-sm text-[${textColor}]/80`}>
                   Type: {formData.travelersDetails.type || 'Not specified'}<br />
                  Rooms: {getRoomSummary()}
                 </p>
               </div>
              
               <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                 <h3 className={`font-semibold text-[${textColor}] mb-2`}>Preferences</h3>
                 <p className={`text-sm text-[${textColor}]/80`}>
                   Interests: {formData.preferences.selectedInterests.length > 0 
                    ? formData.preferences.selectedInterests.join(', ') 
                     : 'None selected'}<br />
                   Budget: {formData.preferences.budget || 'Not specified'}
                 </p>
               </div>

              {/* Updated Customer Info Review */}
              <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                <h3 className={`font-semibold text-[${textColor}] mb-2`}>Customer Information</h3>
                {reviewCustomer ? (
                  <p className={`text-sm text-[${textColor}]/80`}>
                    Name: {reviewCustomer.firstName} {reviewCustomer.lastName}<br />
                    Email: {reviewCustomer.email}<br />
                    Phone: {reviewCustomer.phoneNumber} <br/>
                    ID: {reviewCustomer._id}
                  </p>
                ) : (
                  <p className={`text-sm text-[${textColorLight}] italic`}>No customer selected.</p>
                )}
              </div>
              
              {/* Updated Agent Info Review */}
              <div className={`bg-[${accentColor}] p-4 rounded-lg border border-[${borderColor}]`}>
                <h3 className={`font-semibold text-[${textColor}] mb-2`}>Agent Information</h3>
                 {!reviewAgent ? <p className="text-sm text-red-600">Agent details missing!</p> :
                <p className={`text-sm text-[${textColor}]/80`}>
                  Employee ID: {formData.employeeId || 'Not available'}<br/> {/* Reads from state */}
                     Agent Name: {reviewAgent.name || 'N/A'} <br/>
                     Agent Email: {reviewAgent.email || 'N/A'} <br/>
                     Agent ID: {reviewAgent._id || 'N/A'}
                   </p>
                 }
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
  }, [currentStep, formData, errors, isSearching, isFetchingCities, handleChange, getRoomSummary, agent, selectedCustomer, openCustomerAssignmentModal, handleCustomerSelectionFromModal, handleSaveRooms, isRoomModalOpen, isAssignModalOpen, setIsRoomModalOpen, setIsAssignModalOpen, setErrors, setFormData, setSelectedCustomer, location.state, validateStep]);
  
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
            searchResults: Array.isArray(response.data) ? response.data : []
          }));
        } catch (error) {
          console.error('Error searching destinations:', error);
          setFormData(prev => ({ ...prev, searchResults: [] }));
        } finally {
          setIsSearching(false);
        }
      } else {
        setFormData(prev => ({ ...prev, searchResults: [] }));
      }
    };
    
    const timerId = setTimeout(() => {
        fetchSearchResults();
    }, 300);

    return () => clearTimeout(timerId);
  }, [formData.citySearch]);

  useEffect(() => {
    const fetchCities = async () => {
      if (formData.initialDestination) {
        setIsFetchingCities(true);
        try {
          let destinationName = formData.initialDestination.name;
          if (destinationName.includes(' - ')) {
            destinationName = destinationName.split(' - ')[0];
          }
          
          const response = await axios.get(
            `http://localhost:5000/api/destinations/cities?destination=${encodeURIComponent(destinationName)}&destinationType=${formData.initialDestination.type}`
          );
          setFormData(prev => ({
            ...prev,
            cities: Array.isArray(response.data) ? response.data : []
          }));
        } catch (error) {
          console.error('Error fetching cities:', error);
          setFormData(prev => ({ ...prev, cities: [] }));
        } finally {
          setIsFetchingCities(false);
        }
      } else {
         setFormData(prev => ({ ...prev, cities: [] }));
      }
    };

    fetchCities();
  }, [formData.initialDestination]);
  
  // MODIFICATION: useEffect to load itinerary if token is provided in state
  useEffect(() => {
    const tokenFromState = location.state?.itineraryToken;
    const inquiryTokenFromState = location.state?.inquiryToken; // Extract inquiry token

    // Only run if BOTH tokens exist and itinerary isn't already loaded
    if (tokenFromState && inquiryTokenFromState && !generatedItinerary) { 
      const loadItinerary = async () => {
        console.log(`ItineraryBookingPage: Attempting to load itinerary with itineraryToken: ${tokenFromState}, inquiryToken: ${inquiryTokenFromState}`);
        setIsLoadingItinerary(true);
        setLoadItineraryError(null);
        setGeneratedItinerary(null); // Clear any previous itinerary
        try {
          // Pass BOTH tokens to the service function
          const itineraryData = await bookingService.getItineraryByToken(tokenFromState, inquiryTokenFromState);
          if (itineraryData) {
            setGeneratedItinerary(itineraryData);
            toast.success("Itinerary loaded successfully.");
          } else {
            throw new Error("Received empty data when loading itinerary.");
          }
        } catch (error) {
          console.error(`Failed to load itinerary ${tokenFromState}:`, error);
          setLoadItineraryError(error.message || "Failed to load itinerary details.");
        } finally {
          setIsLoadingItinerary(false);
        }
      };
      loadItinerary();
    }
    // Depend on both tokens from state
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [location.state?.itineraryToken, location.state?.inquiryToken]); 

  // Render the main component structure
  return (
    <>
    {(() => {
          // Check loading state first
          if (isLoadingItinerary) {
             return (
                 <div className="flex justify-center items-center h-screen">
                     <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
                     <p className="ml-4 text-lg text-gray-600">Loading Itinerary Details...</p>
                 </div>
             );
          }
          
          // Check for loading error
          if (loadItineraryError) {
              return (
                 <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                      <div className="bg-white shadow-lg rounded-lg p-8 border border-red-200">
                         <svg className="mx-auto h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                         </svg>
                         <h2 className="mt-4 text-2xl font-bold text-gray-900">Error Loading Itinerary</h2>
                         <p className="mt-2 text-red-600">
                            {loadItineraryError}
                         </p>
                         <p className="mt-3 text-sm text-gray-500">
                            Please check the itinerary token or try again later.
                         </p>
                      </div>
                 </div>
              );
          }
          
          // Render itinerary display if loaded
          if (generatedItinerary) {
            return (
              <div className="max-w-7xl mx-auto p-6 bg-white shadow-lg rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-gray-800">GENERATED ITINERARY</h2>
                  <button 
                    onClick={handleCreateNewInquiry}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create New Inquiry
                  </button>
                </div>
                <CrmItineraryDisplay itinerary={generatedItinerary} />
              </div>
            );
          } else if (submittedInquiryToken) {
             return (
                 <div className="max-w-3xl mx-auto px-4 py-12 text-center">
                      <div className="bg-white shadow-lg rounded-lg p-8">
                        <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="mt-4 text-2xl font-bold text-gray-900">Inquiry Submitted Successfully!</h2>
                        <p className="mt-2 text-gray-600">
                          Your itinerary inquiry has been created. You can now generate the detailed itinerary.
                        </p>
                        <p className="mt-4 text-sm font-mono bg-gray-100 p-2 rounded inline-block">
                          Inquiry Token: <span className="font-semibold">{submittedInquiryToken}</span>
                        </p>
                        <div className="mt-8 space-y-4">
                          <button
                            type="button"
                            onClick={handleGenerateItinerary}
                            disabled={isCreatingItinerary}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {isCreatingItinerary ? 'Generating...' : 'Generate Detailed Itinerary'}
                            {isCreatingItinerary && <ArrowPathIcon className="animate-spin ml-2 h-5 w-5" />}
                          </button>
                          <button
                            onClick={handleCreateNewInquiry}
                            className="w-full inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Create Another Inquiry
                          </button>
                        </div>
                      </div>
                 </div>
            );
          } else {
            // Original inquiry form UI starts here
            return (
              <ConfigProvider
                theme={{
                  ...antTheme,
                  components: {
                    ...antTheme.components,
                    Select: {
                      ...antTheme.components.Select,
                      controlHeight: 40,
                      controlHeightLG: 40,
                      controlHeightSM: 40,
                    }
                  }
                }}
              >
                <div className="container mx-auto px-4 py-8">
                  <div className="max-w-5xl mx-auto">
                    {/* Header, Progress, Form Structure */}
                    <div className="mb-10 border-b border-[${borderColor}] pb-5">
                      <h1 className={`text-2xl font-bold text-[${textColor}]`}>Create Itinerary Inquiry</h1>
                      <p className={`mt-1 text-sm text-[${textColorLight}]`}>Fill in the details to create a new itinerary inquiry.</p>
                    </div>
                    {/* Progress bar */}
                    <div className="mb-10">
                      <div className="flex items-center justify-between mb-2">
                        {steps.map((step, idx) => (
                          <div 
                            key={step.id}
                            className={`flex flex-col items-center ${idx < steps.length - 1 ? 'w-full' : ''}`}
                          >
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-all duration-300
                                ${idx < currentStep ? `bg-[${primaryColor}] text-white border-[${primaryColor}]` : 
                                  idx === currentStep ? `bg-[${accentColor}] text-[${primaryColor}] border-[${primaryColor}]` : 
                                  `bg-gray-100 text-gray-400 border-gray-200`}`}
                            >
                              {idx + 1}
                            </div>
                            <span 
                              className={`text-xs mt-1 text-center transition-colors duration-300
                                ${idx <= currentStep ? `text-[${primaryColor}] font-medium` : 'text-gray-500'}`}
                            >
                              {step.title}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="relative pt-1">
                        <div className={`overflow-hidden h-2 text-xs flex rounded-full bg-[${borderColor}]`}>
                          <div 
                            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[${primaryColor}] transition-all duration-500 ease-out rounded-full`}
                            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className={`bg-white rounded-xl shadow-lg border border-[${borderColor}] p-6 sm:p-8 mb-8`}>
                      <form onSubmit={handleSubmit}>
                        <div className="mb-8 min-h-[350px]">
                          {renderStepContent()}
                        </div>
                        {/* Navigation buttons */}
                        <div className={`mt-8 pt-6 border-t border-[${borderColor}] flex justify-between`}>
                          <Button
                            onClick={handleBack}
                            disabled={currentStep === 0 || isSubmittingInquiry || isCreatingItinerary}
                            icon={<ChevronLeftIcon className="h-5 w-5 mr-2" />}
                          >
                            Back
                          </Button>
                          
                          {currentStep < steps.length - 1 ? (
                            <Button
                              type="primary"
                              onClick={(e) => {
                                e.preventDefault();
                                handleNext();
                              }}
                              disabled={isSubmittingInquiry || isCreatingItinerary}
                            >
                              Next
                              <ChevronRightIcon className="ml-2 h-5 w-5" />
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              htmlType="submit"
                              disabled={isSubmittingInquiry || isCreatingItinerary}
                              loading={isSubmittingInquiry}
                            >
                              {isSubmittingInquiry ? 'Submitting Inquiry...' : 'Submit Inquiry'}
                            </Button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Modals */}
                    <RoomArrangementModal 
                      isOpen={isRoomModalOpen}
                      onClose={() => setIsRoomModalOpen(false)}
                      initialRooms={formData.travelersDetails.rooms}
                      onSave={handleSaveRooms}
                    />
                  </div>
                </div>
              </ConfigProvider>
            );
          }
      })()}

      <CustomerAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onCustomerSelect={handleCustomerSelectionFromModal}
        onCustomerRegister={handleCustomerSelectionFromModal}
      />
    </>
  );
};

export default ItineraryBookingPage;