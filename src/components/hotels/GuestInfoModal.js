import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import bookingService from '../../services/bookingService';

// Helper functions to replace toast
const showError = (message) => {
  alert(`Error: ${message}`);
};

const GuestInfoModal = ({ isOpen, onClose, selectedRoomsAndRates = [], onSubmit, itineraryCode, traceId }) => {
  const [guestInfo, setGuestInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [leadGuest, setLeadGuest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecheckingPrice, setIsRecheckingPrice] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'submitting', 'rechecking', 'completed'
  const [priceChangeData, setPriceChangeData] = useState(null);
  const [allocationResponse, setAllocationResponse] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  // Debug log for initial props
  useEffect(() => {
    console.log('GuestInfoModal props:', {
      isOpen,
      selectedRoomsAndRates,
      itineraryCode,
      traceId,
      guestInfo
    });
  }, [isOpen, selectedRoomsAndRates, itineraryCode, traceId, guestInfo]);

  // Initialize state when modal opens
  useEffect(() => {
    if (isOpen && selectedRoomsAndRates?.length > 0) {
      console.log('Initializing guest info with selected rooms and rates:', selectedRoomsAndRates);
      
      // Build a totally new object for initial state
      const initialState = {};
      
      selectedRoomsAndRates.forEach((roomRate, index) => {
        const roomId = roomRate.room.id;
        const rateId = roomRate.rate.id;
        // Add index to ensure uniqueness even when room and rate IDs are identical
        const roomKey = `${roomId}-${rateId}-${index}`;
        
        console.log(`Processing room ${roomKey}:`, roomRate);
        
        const adults = roomRate.occupancy.adults;
        const childAges = roomRate.occupancy.childAges || [];
        
        // Initialize adults with empty properties
        const adultsArray = [];
        for (let i = 0; i < adults; i++) {
          adultsArray.push({
            title: "",
            firstName: "",
            lastName: "",
            email: "",
            isdCode: "91",
            contactNumber: "",
            panCardNumber: "",
            passportNumber: "",
            passportExpiry: "",
            specialRequests: ""
          });
        }
        
        // Initialize children with their ages
        const childrenArray = childAges.map(age => ({
          age,
          title: "Mr",
          firstName: "",
          lastName: "",
          email: "",
          isdCode: "91",
          contactNumber: "",
          panCardNumber: "",
          passportNumber: "",
          passportExpiry: "",
          specialRequests: ""
        }));
        
        initialState[roomKey] = {
          adults: adultsArray,
          children: childrenArray
        };
      });
      
      // Set the initial state
      setGuestInfo(initialState);
      setLeadGuest(null);
    }
  }, [isOpen, selectedRoomsAndRates]);

  // Function to update a specific field for a specific guest
  const updateGuestField = (roomKey, guestType, guestIndex, field, value) => {
    setGuestInfo(prev => {
      // Create a deep copy of the previous state
      const newState = { ...prev };
      
      // Ensure the room exists
      if (!newState[roomKey]) {
        newState[roomKey] = { adults: [], children: [] };
      }
      
      // Create a new copy of the room data
      newState[roomKey] = { ...newState[roomKey] };
      
      // Ensure the guest type array exists
      if (!newState[roomKey][guestType]) {
        newState[roomKey][guestType] = [];
      }
      
      // Create a new array for the guest type
      newState[roomKey][guestType] = [...newState[roomKey][guestType]];
      
      // Ensure the guest object exists
      if (!newState[roomKey][guestType][guestIndex]) {
        newState[roomKey][guestType][guestIndex] = {};
      }
      
      // Create a new object for this guest, preserving existing fields
      newState[roomKey][guestType][guestIndex] = {
        ...newState[roomKey][guestType][guestIndex],
        [field]: value
      };
      
      return newState;
    });
  };

  // Handle lead guest selection
  const handleLeadGuestChange = (roomKey, adultIndex, isChecked) => {
    if (isChecked) {
      console.log(`Setting lead guest: roomKey=${roomKey}, adultIndex=${adultIndex}`);
      setLeadGuest({ roomKey, adultIndex });
    } else {
      setLeadGuest(null);
    }
  };

  const isLeadGuest = (roomKey, adultIndex) => {
    if (!leadGuest) return false;
    
    // Check if the room keys match exactly (including index)
    const exactMatch = leadGuest.roomKey === roomKey && leadGuest.adultIndex === adultIndex;
    
    // If there's an exact match, return true
    if (exactMatch) return true;
    
    return false;
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    console.log("Validating form with data:", guestInfo);
    console.log("Lead guest:", leadGuest);
    
    if (!selectedRoomsAndRates || selectedRoomsAndRates.length === 0) {
      console.error("No rooms to validate");
      return false;
    }

    // Check if a lead guest is selected
    if (!leadGuest) {
      newErrors['lead-guest'] = 'Please select a lead guest';
      isValid = false;
    }

    // Iterate through each room and validate all guests
    Object.entries(guestInfo).forEach(([roomKey, roomGuests]) => {
      console.log(`Validating room ${roomKey}:`, roomGuests);
      
      // Validate adults
      if (!roomGuests.adults) return;
      
      roomGuests.adults.forEach((guest, index) => {
        // Required fields for all adults
        const requiredFields = ['title', 'firstName', 'lastName', 'email', 'isdCode', 'contactNumber'];
        requiredFields.forEach(field => {
          if (!guest[field]) {
            newErrors[`${roomKey}-adults-${index}-${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            isValid = false;
          }
        });

        // Email format validation
        if (guest.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email)) {
          newErrors[`${roomKey}-adults-${index}-email`] = 'Invalid email format';
          isValid = false;
        }

        // Phone number validation
        if (guest.contactNumber && !/^\d{10}$/.test(guest.contactNumber)) {
          newErrors[`${roomKey}-adults-${index}-contactNumber`] = 'Phone number must be 10 digits';
          isValid = false;
        }

        // PAN Card validation (only if provided)
        if (guest.panCardNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(guest.panCardNumber)) {
          newErrors[`${roomKey}-adults-${index}-panCardNumber`] = 'Invalid PAN card number format';
          isValid = false;
        }
      });

      // Validate children (if any)
      if (roomGuests.children && roomGuests.children.length > 0) {
        roomGuests.children.forEach((child, index) => {
          if (!child) return;
          
          // Required fields for children
          const requiredFields = ['title', 'firstName', 'lastName', 'email', 'isdCode', 'contactNumber', 'age'];
          requiredFields.forEach(field => {
            if (!child[field]) {
              newErrors[`${roomKey}-children-${index}-${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
              isValid = false;
            }
          });

          // Email format validation for children
          if (child.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(child.email)) {
            newErrors[`${roomKey}-children-${index}-email`] = 'Invalid email format';
            isValid = false;
          }

          // Phone number validation for children
          if (child.contactNumber && !/^\d{10}$/.test(child.contactNumber)) {
            newErrors[`${roomKey}-children-${index}-contactNumber`] = 'Phone number must be 10 digits';
            isValid = false;
          }

          // PAN Card validation for children (only if provided)
          if (child.panCardNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(child.panCardNumber)) {
            newErrors[`${roomKey}-children-${index}-panCardNumber`] = 'Invalid PAN card number format';
            isValid = false;
          }

          // Age validation for children (1-17)
          if (child.age && (parseInt(child.age) < 1 || parseInt(child.age) > 17)) {
            newErrors[`${roomKey}-children-${index}-age`] = 'Child age must be between 1 and 17';
            isValid = false;
          }
        });
      }
    });

    console.log("Validation errors:", newErrors);
    console.log("Form is valid:", isValid);
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Form submitted - starting validation");
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitStatus('submitting');
      console.log("Starting guest submission with guest info:", guestInfo);
      
      // Transform guest information into the required API format
      const roomsAllocations = selectedRoomsAndRates.map((roomRate, index) => {
        const roomId = roomRate.room.id;
        const rateId = roomRate.rate.id;
        const roomKey = `${roomId}-${rateId}-${index}`;
        
        console.log(`Processing room ${roomKey}:`, roomRate);
        console.log(`Room guest info:`, guestInfo[roomKey]);
        
        const roomInfo = guestInfo[roomKey];
        if (!roomInfo) {
          console.log(`No guest info found for room ${roomKey}`);
          return null;
        }

        const validGuests = [];

        // Add adults
        if (roomInfo.adults) {
          roomInfo.adults.forEach((adult, adultIndex) => {
            if (!adult || !adult.firstName || !adult.lastName) {
              console.log(`Invalid adult data at index ${adultIndex}:`, adult);
              return;
            }
            
            console.log(`Adding adult guest:`, adult);
            validGuests.push({
              title: adult.title || 'Mr',
              firstName: adult.firstName,
              lastName: adult.lastName,
              isLeadGuest: isLeadGuest(roomKey, adultIndex),
              email: adult.email,
              isdCode: adult.isdCode || '91',
              contactNumber: adult.contactNumber,
              panCardNumber: adult.panCardNumber || undefined,
              passportNumber: adult.passportNumber || undefined,
              passportExpiry: adult.passportExpiry || undefined,
              specialRequests: adult.specialRequests || '',
              type: 'adult'
            });
          });
        }

        // Add children
        if (roomInfo.children && roomInfo.children.length > 0) {
          roomInfo.children.forEach((child, childIndex) => {
            if (!child || !child.firstName || !child.lastName) {
              console.log(`Invalid child data at index ${childIndex}:`, child);
              return;
            }
            
            console.log(`Adding child guest:`, child);
            validGuests.push({
              title: child.title || 'Mr',
              firstName: child.firstName,
              lastName: child.lastName,
              isLeadGuest: false,
              email: child.email,
              isdCode: child.isdCode || '91',
              contactNumber: child.contactNumber,
              panCardNumber: child.panCardNumber || undefined,
              passportNumber: child.passportNumber || undefined,
              passportExpiry: child.passportExpiry || undefined,
              age: child.age,
              specialRequests: child.specialRequests || '',
              type: 'child'
            });
          });
        }

        if (validGuests.length === 0) {
          console.log(`No valid guests found for room ${roomKey}`);
          return null;
        }

        // Return the room allocation structure
        return {
          roomId,
          rateId,
          guests: validGuests
        };
      }).filter(Boolean);
      
      if (roomsAllocations.length === 0) {
        throw new Error('No valid booking information found. Please check your room and guest selections.');
      }

      const payload = {
        itineraryCode,
        bookingArray: [
          {
            traceId,
            roomsAllocations
          }
        ]
      };

      console.log('Sending API payload:', payload);

      const response = await bookingService.allocateGuests(payload);
      console.log("API response:", response);

      if (response.success) {
        // Store the response for later use
        setAllocationResponse(response);
        
        // Extract traceId and itineraryCode from response
        const allocatedTraceId = response.data.results[0].traceId;
        const allocatedItineraryCode = response.data.results[0].itineraryCode;

        // Start price recheck
        setSubmitStatus('rechecking');
        try {
          const recheckResponse = await bookingService.recheckPrice({
            itineraryCode: allocatedItineraryCode,
            traceId: allocatedTraceId
          });
          
          console.log("Price recheck response:", recheckResponse);

          if (recheckResponse.success) {
            const priceDetails = recheckResponse.data.details[0];
            if (priceDetails.priceChangeData.isPriceChanged) {
              // Show price change modal
              setSubmitStatus('price-changed');
              setPriceChangeData(priceDetails.priceChangeData);
            } else {
              // Show book button
              setSubmitStatus('ready-to-book');
              setPriceChangeData(null);
            }
          } else {
            throw new Error('Price verification failed');
          }
        } catch (recheckError) {
          console.error('Error rechecking price:', recheckError);
          showError('Price verification failed. Please try again.');
          setSubmitStatus('idle');
        }
      } else {
        throw new Error(response.message || 'Failed to submit guest information');
      }
      
    } catch (error) {
      console.error('Error submitting guest information:', error);
      showError(error.message || error.response?.data?.message || 'Failed to submit guest information');
      setSubmitStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle booking
  const handleBook = async () => {
    try {
      setSubmitStatus('booking');
      const bookingResponse = await bookingService.bookHotel({
        traceId,
        itineraryCode
      });

      if (bookingResponse.success) {
        setSubmitStatus('completed');
        // Store booking details for voucher
        setBookingDetails(bookingResponse.data);
        // Pass booking response to parent component
        onSubmit(bookingResponse.data);
        // Close the modal
        onClose();
      } else {
        throw new Error(bookingResponse.message || 'Failed to book hotel');
      }
    } catch (error) {
      console.error('Error booking hotel:', error);
      showError(error.message || 'Failed to book hotel');
      setSubmitStatus('ready-to-book');
    }
  };

  // Get button text based on status
  const getSubmitButtonText = () => {
    switch (submitStatus) {
      case 'submitting':
        return 'Submitting Guest Information...';
      case 'rechecking':
        return 'Verifying Price...';
      case 'price-changed':
        return 'Price Has Changed';
      case 'ready-to-book':
        return 'Book Now';
      case 'booking':
        return 'Booking...';
      case 'completed':
        return 'Booking Completed';
      default:
        return 'Submit Information';
    }
  };

  // For debugging purposes
  const logGuestState = (roomKey, guestType, guestIndex) => {
    console.log(`Current state for ${roomKey} ${guestType} ${guestIndex}:`, 
      guestInfo?.[roomKey]?.[guestType]?.[guestIndex]);
  };

  // Check if we should render the modal
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Guest Information</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {errors['lead-guest'] && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 mt-2 mx-6">
            <p className="text-sm text-red-700">{errors['lead-guest']}</p>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            console.log("Form submit event triggered");
            handleSubmit(e);
          }} 
          className="p-6"
        >
          {selectedRoomsAndRates.map((roomRate, roomIndex) => {
            const roomId = roomRate.room.id;
            const rateId = roomRate.rate.id;
            // Include the index to ensure uniqueness
            const roomKey = `${roomId}-${rateId}-${roomIndex}`;
            const adults = roomRate.occupancy.adults;
            const childAges = roomRate.occupancy.childAges || [];
            
            return (
              <div key={roomKey} className="mb-8 last:mb-0">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Room {roomIndex + 1} - {roomRate.room.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {adults} Adult{adults > 1 ? 's' : ''}
                    {childAges.length > 0 && `, ${childAges.length} Child${childAges.length > 1 ? 'ren' : ''}`}
                  </p>
                </div>

                {/* Adult Guests */}
                {Array.from({ length: adults }).map((_, adultIndex) => (
                  <div key={`${roomKey}-adult-${adultIndex}`} className="bg-white rounded-lg border border-gray-200 p-6 mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900">
                        Adult Guest {adultIndex + 1}
                      </h4>
                      
                      {/* Lead Guest Checkbox */}
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`lead-guest-${roomKey}-${adultIndex}`}
                          checked={isLeadGuest(roomKey, adultIndex)}
                          onChange={(e) => handleLeadGuestChange(roomKey, adultIndex, e.target.checked)}
                          disabled={leadGuest !== null && !isLeadGuest(roomKey, adultIndex)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`lead-guest-${roomKey}-${adultIndex}`} className="ml-2 text-sm text-gray-700">
                          Lead Guest
                        </label>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Title */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <select
                          value={guestInfo[roomKey]?.adults[adultIndex]?.title || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'title', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-title`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Title</option>
                          <option value="Mr">Mr</option>
                          <option value="Mrs">Mrs</option>
                          <option value="Ms">Ms</option>
                          <option value="Dr">Dr</option>
                        </select>
                        {errors[`${roomKey}-adults-${adultIndex}-title`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-title`]}</p>
                        )}
                      </div>

                      {/* First Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.firstName || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'firstName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-firstName`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter first name"
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-firstName`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-firstName`]}</p>
                        )}
                      </div>

                      {/* Last Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.lastName || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'lastName', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-lastName`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter last name"
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-lastName`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-lastName`]}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.email || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'email', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-email`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter email address"
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-email`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-email`]}</p>
                        )}
                      </div>

                      {/* Contact Information */}
                      <div className="md:col-span-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              ISD Code
                            </label>
                            <input
                              type="text"
                              value={guestInfo[roomKey]?.adults[adultIndex]?.isdCode || '91'}
                              onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'isdCode', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-adults-${adultIndex}-isdCode`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`${roomKey}-adults-${adultIndex}-isdCode`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-isdCode`]}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Contact Number
                            </label>
                            <input
                              type="tel"
                              value={guestInfo[roomKey]?.adults[adultIndex]?.contactNumber || ''}
                              onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'contactNumber', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-adults-${adultIndex}-contactNumber`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter 10-digit number"
                            />
                            {errors[`${roomKey}-adults-${adultIndex}-contactNumber`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-contactNumber`]}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* PAN Card Number - Always visible for all adults */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          PAN Card Number
                        </label>
                        <input
                          type="text"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.panCardNumber || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'panCardNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-panCardNumber`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter PAN card number"
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-panCardNumber`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-panCardNumber`]}</p>
                        )}
                      </div>

                      {/* Passport Number - Always visible for all adults */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.passportNumber || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'passportNumber', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-passportNumber`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter passport number"
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-passportNumber`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-passportNumber`]}</p>
                        )}
                      </div>

                      {/* Passport Expiry Date - Always visible for all adults */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport Expiry Date
                        </label>
                        <input
                          type="date"
                          value={guestInfo[roomKey]?.adults[adultIndex]?.passportExpiry || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'passportExpiry', e.target.value)}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            errors[`${roomKey}-adults-${adultIndex}-passportExpiry`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`${roomKey}-adults-${adultIndex}-passportExpiry`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-adults-${adultIndex}-passportExpiry`]}</p>
                        )}
                      </div>

                      {/* Special Requests for each adult */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Requests
                        </label>
                        <textarea
                          value={guestInfo[roomKey]?.adults[adultIndex]?.specialRequests || ''}
                          onChange={(e) => updateGuestField(roomKey, 'adults', adultIndex, 'specialRequests', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter any special requests for this guest"
                          rows={2}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Child Guests */}
                {childAges.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Children Information
                    </h4>
                    
                    {childAges.map((age, childIndex) => (
                      <div key={`${roomKey}-child-${childIndex}`} className="bg-white rounded-lg border border-gray-200 p-6 mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-md font-medium text-gray-900">
                            Child {childIndex + 1} (Age: {age})
                          </h5>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Title */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Title
                            </label>
                            <select
                              value={guestInfo[roomKey]?.children[childIndex]?.title || 'Master'}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'title', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-title`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            >
                              <option value="Master">Master</option>
                              <option value="Miss">Miss</option>
                            </select>
                            {errors[`${roomKey}-children-${childIndex}-title`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-title`]}</p>
                            )}
                          </div>

                          {/* First Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              value={guestInfo[roomKey]?.children[childIndex]?.firstName || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'firstName', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-firstName`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter first name"
                            />
                            {errors[`${roomKey}-children-${childIndex}-firstName`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-firstName`]}</p>
                            )}
                          </div>

                          {/* Last Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              value={guestInfo[roomKey]?.children[childIndex]?.lastName || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'lastName', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-lastName`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter last name"
                            />
                            {errors[`${roomKey}-children-${childIndex}-lastName`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-lastName`]}</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={guestInfo[roomKey]?.children[childIndex]?.email || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'email', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-email`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter email address"
                            />
                            {errors[`${roomKey}-children-${childIndex}-email`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-email`]}</p>
                            )}
                          </div>

                          {/* Contact Information */}
                          <div className="md:col-span-2">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  ISD Code
                                </label>
                                <input
                                  type="text"
                                  value={guestInfo[roomKey]?.children[childIndex]?.isdCode || '91'}
                                  onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'isdCode', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors[`${roomKey}-children-${childIndex}-isdCode`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                />
                                {errors[`${roomKey}-children-${childIndex}-isdCode`] && (
                                  <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-isdCode`]}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Contact Number
                                </label>
                                <input
                                  type="tel"
                                  value={guestInfo[roomKey]?.children[childIndex]?.contactNumber || ''}
                                  onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'contactNumber', e.target.value)}
                                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                    errors[`${roomKey}-children-${childIndex}-contactNumber`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                  placeholder="Enter 10-digit number"
                                />
                                {errors[`${roomKey}-children-${childIndex}-contactNumber`] && (
                                  <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-contactNumber`]}</p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* PAN Card Number - Always visible for all children */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              PAN Card Number
                            </label>
                            <input
                              type="text"
                              value={guestInfo[roomKey]?.children[childIndex]?.panCardNumber || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'panCardNumber', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-panCardNumber`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter PAN card number"
                            />
                            {errors[`${roomKey}-children-${childIndex}-panCardNumber`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-panCardNumber`]}</p>
                            )}
                          </div>

                          {/* Passport Number - Always visible for all children */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Passport Number
                            </label>
                            <input
                              type="text"
                              value={guestInfo[roomKey]?.children[childIndex]?.passportNumber || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'passportNumber', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-passportNumber`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              placeholder="Enter passport number"
                            />
                            {errors[`${roomKey}-children-${childIndex}-passportNumber`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-passportNumber`]}</p>
                            )}
                          </div>

                          {/* Passport Expiry Date - Always visible for all children */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Passport Expiry Date
                            </label>
                            <input
                              type="date"
                              value={guestInfo[roomKey]?.children[childIndex]?.passportExpiry || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'passportExpiry', e.target.value)}
                              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`${roomKey}-children-${childIndex}-passportExpiry`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                            />
                            {errors[`${roomKey}-children-${childIndex}-passportExpiry`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`${roomKey}-children-${childIndex}-passportExpiry`]}</p>
                            )}
                          </div>

                          {/* Special Requests for each child */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Special Requests
                            </label>
                            <textarea
                              value={guestInfo[roomKey]?.children[childIndex]?.specialRequests || ''}
                              onChange={(e) => updateGuestField(roomKey, 'children', childIndex, 'specialRequests', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter any special requests for this guest"
                              rows={2}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-6">
            {/* Price Change Display */}
            {priceChangeData && (
              <div className={`mb-4 p-4 rounded-lg ${
                priceChangeData.isPriceChanged ? 'bg-yellow-50 border border-yellow-200' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {priceChangeData.isPriceChanged ? 'Price has changed' : 'Price verified'}
                  </span>
                  {priceChangeData.isPriceChanged && (
                    <span className={`font-bold ${
                      priceChangeData.priceChangeAmount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {priceChangeData.priceChangeAmount > 0 ? '+' : ''}
                      ₹{priceChangeData.priceChangeAmount.toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Previous price:</span>
                    <span>₹{priceChangeData.previousTotalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current price:</span>
                    <span>₹{priceChangeData.currentTotalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit/Book Button */}
            <button
              type="button" 
              disabled={isSubmitting || submitStatus === 'rechecking'}
              onClick={(e) => {
                if (submitStatus === 'ready-to-book') {
                  handleBook();
                } else {
                  handleSubmit(e);
                }
              }}
              className={`w-full ${
                submitStatus === 'ready-to-book' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : submitStatus === 'price-changed'
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : isSubmitting || submitStatus === 'rechecking'
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center`}
            >
              {(isSubmitting || submitStatus === 'rechecking') && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {submitStatus === 'ready-to-book' && (
                <svg className="h-5 w-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestInfoModal;