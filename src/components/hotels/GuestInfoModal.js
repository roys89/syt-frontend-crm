import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';

// Helper functions to replace toast
const showError = (message) => {
  alert(`Error: ${message}`);
};

const GuestInfoModal = ({ isOpen, onClose, selectedRoomsAndRates = [], onSubmit, itineraryCode, traceId, isPanMandatory, isPassportMandatory }) => {
  const [guestInfo, setGuestInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('idle'); // 'idle', 'submitting', 'rechecking', 'price-changed', 'ready-to-book', 'booking', 'completed'
  const [priceChangeData, setPriceChangeData] = useState(null);
  const [allocationResponse, setAllocationResponse] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  
  // New state for common contact information
  const [commonContactInfo, setCommonContactInfo] = useState({
    email: '',
    isdCode: '91',
    contactNumber: '',
    specialRequests: '' // Added common special requests field
  });
  
  // --- NEW STATE for confirmed final rate ---
  const [confirmedFinalRate, setConfirmedFinalRate] = useState(null);
  // --- END NEW STATE ---

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
            // Passport fields only added if needed
            ...(isPassportMandatory ? {
              passportNumber: "",
              passportExpiry: "",
            } : {}),
            // PAN Card only for first adult of first room if needed
            ...(index === 0 && i === 0 && isPanMandatory ? {
              panCardNumber: "",
            } : {})
          });
        }
        
        // Initialize children with their ages
        const childrenArray = childAges.map(age => ({
          age,
          title: "Mr",
          firstName: "",
          lastName: "",
          // Passport fields only added if needed
          ...(isPassportMandatory ? {
            passportNumber: "",
            passportExpiry: "",
          } : {})
        }));
        
        initialState[roomKey] = {
          adults: adultsArray,
          children: childrenArray
        };
      });
      
      // Set the initial state
      setGuestInfo(initialState);
      
      // Reset common contact info
      setCommonContactInfo({
        email: '',
        isdCode: '91',
        contactNumber: '',
        specialRequests: '' // Reset common special requests
      });
    }
  }, [isOpen, selectedRoomsAndRates, isPanMandatory, isPassportMandatory]);

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

  // Function to update common contact information
  const updateCommonContactInfo = (field, value) => {
    setCommonContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper to check if a guest is the lead (first adult of room)
  const isLeadGuest = (roomIndex, adultIndex) => {
    return adultIndex === 0; // First adult of any room is lead
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    console.log("Validating form with data:", guestInfo);
    console.log("Common contact info:", commonContactInfo);
    
    if (!selectedRoomsAndRates || selectedRoomsAndRates.length === 0) {
      console.error("No rooms to validate");
      return false;
    }

    // Validate common contact fields
    if (!commonContactInfo.email) {
      newErrors['common-email'] = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commonContactInfo.email)) {
      newErrors['common-email'] = 'Invalid email format';
      isValid = false;
    }
    
    if (!commonContactInfo.isdCode) {
      newErrors['common-isdCode'] = 'ISD Code is required';
      isValid = false;
    }
    
    if (!commonContactInfo.contactNumber) {
      newErrors['common-contactNumber'] = 'Contact Number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(commonContactInfo.contactNumber)) {
      newErrors['common-contactNumber'] = 'Phone number must be 10 digits';
      isValid = false;
    }

    // Iterate through each room and validate all guests
    Object.entries(guestInfo).forEach(([roomKey, roomGuests], roomIndex) => {
      console.log(`Validating room ${roomKey}:`, roomGuests);
      
      // Validate adults
      if (!roomGuests.adults) return;
      
      roomGuests.adults.forEach((guest, adultIndex) => {
        // Required fields for all adults
        const requiredFields = ['title', 'firstName', 'lastName'];
        requiredFields.forEach(field => {
          if (!guest[field]) {
            newErrors[`${roomKey}-adults-${adultIndex}-${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
            isValid = false;
          }
        });

        // PAN Card validation - only for first adult of first room if mandatory
        if (roomIndex === 0 && adultIndex === 0 && isPanMandatory) {
          if (!guest.panCardNumber) {
            newErrors[`${roomKey}-adults-${adultIndex}-panCardNumber`] = 'PAN Card Number is required';
            isValid = false;
          } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(guest.panCardNumber)) {
            newErrors[`${roomKey}-adults-${adultIndex}-panCardNumber`] = 'Invalid PAN card number format';
            isValid = false;
          }
        }

        // Passport validation - only if mandatory
        if (isPassportMandatory) {
          if (!guest.passportNumber) {
            newErrors[`${roomKey}-adults-${adultIndex}-passportNumber`] = 'Passport Number is required';
            isValid = false;
          }
          if (!guest.passportExpiry) {
            newErrors[`${roomKey}-adults-${adultIndex}-passportExpiry`] = 'Passport Expiry Date is required';
            isValid = false;
          }
        }
      });

      // Validate children (if any)
      if (roomGuests.children && roomGuests.children.length > 0) {
        roomGuests.children.forEach((child, childIndex) => {
          if (!child) return;
          
          // Required fields for children
          const requiredFields = ['title', 'firstName', 'lastName', 'age'];
          requiredFields.forEach(field => {
            if (!child[field]) {
              newErrors[`${roomKey}-children-${childIndex}-${field}`] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
              isValid = false;
            }
          });

          // Passport validation for children - only if mandatory
          if (isPassportMandatory) {
            if (!child.passportNumber) {
              newErrors[`${roomKey}-children-${childIndex}-passportNumber`] = 'Passport Number is required';
              isValid = false;
            }
            if (!child.passportExpiry) {
              newErrors[`${roomKey}-children-${childIndex}-passportExpiry`] = 'Passport Expiry Date is required';
              isValid = false;
            }
          }

          // Age validation for children (1-17)
          if (child.age && (parseInt(child.age) < 1 || parseInt(child.age) > 17)) {
            newErrors[`${roomKey}-children-${childIndex}-age`] = 'Child age must be between 1 and 17';
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
      console.log("Common contact info:", commonContactInfo);
      
      // Transform guest information into the required API format
      const roomsAllocations = selectedRoomsAndRates.map((roomRate, roomIndex) => {
        const roomId = roomRate.room.id;
        const rateId = roomRate.rate.id;
        const roomKey = `${roomId}-${rateId}-${roomIndex}`;
        
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
            
            // Check if this adult is the lead guest (first adult of the room)
            const isLead = adultIndex === 0;
            
            console.log(`Adding adult guest:`, adult, `isLead: ${isLead}`);
            validGuests.push({
              title: adult.title || 'Mr',
              firstName: adult.firstName,
              lastName: adult.lastName,
              isLeadGuest: isLead,
              email: commonContactInfo.email,
              isdCode: commonContactInfo.isdCode || '91',
              contactNumber: commonContactInfo.contactNumber,
              // Only include PAN for lead guest of first room if it's mandatory and provided
              panCardNumber: (roomIndex === 0 && adultIndex === 0 && isPanMandatory) ? adult.panCardNumber : undefined,
              // Only include passport info if it's mandatory
              passportNumber: isPassportMandatory ? adult.passportNumber : undefined,
              passportExpiry: isPassportMandatory ? adult.passportExpiry : undefined,
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
              email: commonContactInfo.email,
              isdCode: commonContactInfo.isdCode || '91',
              contactNumber: commonContactInfo.contactNumber,
              // Only include passport info if it's mandatory
              passportNumber: isPassportMandatory ? child.passportNumber : undefined,
              passportExpiry: isPassportMandatory ? child.passportExpiry : undefined,
              age: child.age,
              type: 'child'
            });
          });
        }

        if (validGuests.length === 0) {
          console.log(`No valid guests found for room ${roomKey}`);
          return null;
        }

        // Return the room allocation structure with specialRequests: "NA" for each room
        return {
          roomId,
          rateId,
          guests: validGuests,
          specialRequests: "NA" // Add default "NA" special requests for each room
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
            roomsAllocations,
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

          if (recheckResponse.success && recheckResponse.data?.details?.[0]) {
            const priceDetails = recheckResponse.data.details[0];
            const currentPriceData = priceDetails.priceChangeData;
            const rateDetails = priceDetails.rateDetails;
            
            // --- Store confirmed rate regardless of change ---
            if (rateDetails?.finalRate) {
              setConfirmedFinalRate(rateDetails.finalRate);
              console.log("Stored confirmedFinalRate:", rateDetails.finalRate);
            } else {
                // Fallback if finalRate is not in rateDetails (use currentTotalAmount)
                setConfirmedFinalRate(currentPriceData?.currentTotalAmount);
                console.warn("finalRate missing in recheck response rateDetails, using currentTotalAmount from priceChangeData:", currentPriceData?.currentTotalAmount);
            }
            // --- End store confirmed rate ---

            if (currentPriceData?.isPriceChanged) {
              console.log("Price recheck: Price HAS changed.");
              setSubmitStatus('price-changed');
              setPriceChangeData(currentPriceData); // Store the whole priceChangeData
              toast.warning('The price changed during allocation. Please review and confirm.');
            } else {
              console.log("Price recheck: Price confirmed (no change).");
              setSubmitStatus('ready-to-book');
              setPriceChangeData(null); // Clear previous price change data if any
            }
          } else {
            throw new Error(recheckResponse.message || 'Price verification failed');
          }
        } catch (recheckError) {
          console.error('Error rechecking price:', recheckError);
          showError('Price verification failed. Please try again.');
          setSubmitStatus('idle'); // Reset status on recheck error
          setConfirmedFinalRate(null); // Reset confirmed rate
        }
      } else {
        throw new Error(response.message || 'Failed to submit guest information');
      }
      
    } catch (error) {
      console.error('Error submitting guest information:', error);
      showError(error.message || error.response?.data?.message || 'Failed to submit guest information');
      setSubmitStatus('idle'); // Reset status on main submission error
      setConfirmedFinalRate(null); // Reset confirmed rate
    } finally {
      // Only stop main loading indicator after recheck is complete or failed
      if (submitStatus !== 'submitting' && submitStatus !== 'rechecking') {
         setIsSubmitting(false);
      }
    }
  };

  // Function to handle booking
  const handleBook = async () => {
    // --- Ensure we have a confirmed rate before booking --- 
    if (!confirmedFinalRate && !priceChangeData?.currentTotalAmount) {
        showError('Cannot proceed with booking. Confirmed price is missing.');
        setSubmitStatus('idle'); // Reset state
        return;
    }
    // If price had changed, the confirmed rate is the currentTotalAmount from priceChangeData
    // Otherwise, it's the value stored in confirmedFinalRate state
    const finalRateToUse = priceChangeData?.isPriceChanged ? priceChangeData.currentTotalAmount : confirmedFinalRate;
    console.log("Proceeding to book with finalRate:", finalRateToUse);
    // --- End check --- 

    try {
      setSubmitStatus('booking');
      const bookingResponse = await bookingService.bookHotel({
        traceId, // Use original traceId passed as prop
        itineraryCode, // Use original itineraryCode passed as prop
        specialRequests: commonContactInfo.specialRequests || '' // Include special requests here as well
      });

      if (bookingResponse.success) {
        setSubmitStatus('completed');
        setBookingDetails(bookingResponse.data); // Store raw booking details 
        
        // --- Pass booking response, guest details, AND confirmed rate ---
        onSubmit({
          ...bookingResponse.data,
          guestDetails: Object.values(guestInfo).reduce((allGuests, room) => {
            // Collect all adults
            const adultGuests = (room.adults || []).map((adult, index) => ({
              ...adult,
              type: 'adult',
              // Common contact info added for all
              email: commonContactInfo.email,
              isdCode: commonContactInfo.isdCode,
              contactNumber: commonContactInfo.contactNumber
            }));
            
            // Collect all children
            const childGuests = (room.children || []).map((child) => ({
              ...child,
              type: 'child',
              isLeadGuest: false,
              // Common contact info added for all
              email: commonContactInfo.email,
              isdCode: commonContactInfo.isdCode,
              contactNumber: commonContactInfo.contactNumber
            }));
            
            // Combine and return
            return [...allGuests, ...adultGuests, ...childGuests];
          }, []),
          confirmedFinalRate: finalRateToUse, // Pass the confirmed rate
          specialRequests: commonContactInfo.specialRequests || '' // Pass special requests in final data
        });
        // --- End pass confirmed rate ---
        
        onClose();
      } else {
        throw new Error(bookingResponse.message || 'Failed to book hotel');
      }
    } catch (error) {
      console.error('Error booking hotel:', error);
      showError(error.message || 'Failed to book hotel');
      // If booking fails, revert status based on whether price had changed
      setSubmitStatus(priceChangeData?.isPriceChanged ? 'price-changed' : 'ready-to-book');
    }
  };

  // Get button text based on status
  const getSubmitButtonText = () => {
    switch (submitStatus) {
      case 'submitting': return 'Submitting Guests...';
      case 'rechecking': return 'Verifying Price...';
      case 'price-changed': return 'Accept New Price & Book';
      case 'ready-to-book': return 'Book Now';
      case 'booking': return 'Booking...';
      case 'completed': return 'Booking Completed';
      default: return 'Submit Information';
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
              className="relative group overflow-hidden p-2 hover:bg-[#093923]/5 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500 group-hover:text-[#093923]" />
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
                {Array.from({ length: adults }).map((_, adultIndex) => {
                  // Determine if this adult is the lead guest (first adult of any room)
                  const isLead = adultIndex === 0;
                  
                  return (
                    <div key={`${roomKey}-adult-${adultIndex}`} className="bg-white rounded-lg border border-gray-200 p-6 mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-gray-900">
                          {isLead ? (
                            <span className="flex items-center">
                              <span className="mr-2 bg-[#093923] text-white text-xs py-1 px-2 rounded-full">Lead</span>
                              Adult Guest {adultIndex + 1}
                            </span>
                          ) : (
                            `Adult Guest ${adultIndex + 1}`
                          )}
                        </h4>
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

                        {/* PAN Card (Only for Lead Guest of first room if isPanMandatory) */}
                        {isLead && roomIndex === 0 && isPanMandatory && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              PAN Card Number <span className="text-red-500">*</span>
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
                        )}

                        {/* Passport Fields (Only if isPassportMandatory) */}
                        {isPassportMandatory && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Passport Number <span className="text-red-500">*</span>
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

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Passport Expiry Date <span className="text-red-500">*</span>
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

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

                          {/* Child Passport (Only if isPassportMandatory) */}
                          {isPassportMandatory && (
                            <>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Passport Number <span className="text-red-500">*</span>
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

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Passport Expiry Date <span className="text-red-500">*</span>
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
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Common Contact Information Section - at the end of the form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <p className="text-sm text-gray-600 mb-4">
              This information will be used for all guests in the booking.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={commonContactInfo.email}
                  onChange={(e) => updateCommonContactInfo('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['common-email'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors['common-email'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['common-email']}</p>
                )}
              </div>
              
              {/* ISD Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISD Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={commonContactInfo.isdCode}
                  onChange={(e) => updateCommonContactInfo('isdCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['common-isdCode'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter ISD code (e.g. 91 for India)"
                />
                {errors['common-isdCode'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['common-isdCode']}</p>
                )}
              </div>
              
              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={commonContactInfo.contactNumber}
                  onChange={(e) => updateCommonContactInfo('contactNumber', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors['common-contactNumber'] ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit number"
                />
                {errors['common-contactNumber'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['common-contactNumber']}</p>
                )}
              </div>
              
              {/* Special Requests - Now at the common level */}
              <div className="md:col-span-2 mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  value={commonContactInfo.specialRequests}
                  onChange={(e) => updateCommonContactInfo('specialRequests', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter any special requests for the booking"
                  rows={3}
                ></textarea>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {/* Price Change Display (after recheck) */}
            {priceChangeData && submitStatus === 'price-changed' && (
              <div className={`mb-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200 animate-fadeIn`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-yellow-800">
                    Price Has Changed
                  </span>
                  <span className={`font-bold ${
                      priceChangeData.priceChangeAmount > 0 ? 'text-red-600' : 'text-[#22c35e]'
                    }`}>
                      {/* Display sign only if amount is non-zero */}
                      {priceChangeData.priceChangeAmount > 0 ? '+' : priceChangeData.priceChangeAmount < 0 ? '-' : ''}
                      {priceChangeData.currency || 'INR'} {Math.abs(priceChangeData.priceChangeAmount ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Previous price:</span>
                    {/* Use optional chaining and nullish coalescing for safety */}
                    <span>{priceChangeData.currency || 'INR'} {priceChangeData.previousTotalAmount?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>New price:</span>
                     {/* Use optional chaining and nullish coalescing for safety */}
                    <span>{priceChangeData.currency || 'INR'} {priceChangeData.currentTotalAmount?.toLocaleString() ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit/Book Button */}
            <button
              type="button" 
              // Disable button during submitting/rechecking/booking states
              disabled={isSubmitting || submitStatus === 'submitting' || submitStatus === 'rechecking' || submitStatus === 'booking'}
              onClick={(e) => {
                // --- Updated onClick Logic ---
                if (submitStatus === 'ready-to-book' || submitStatus === 'price-changed') {
                  // If ready or price changed, clicking means booking (or accepting and booking)
                  handleBook(); 
                } else if (submitStatus === 'idle') {
                  // If idle, clicking submits guest info
                  handleSubmit(e);
                }
                // Do nothing if submitting, rechecking, booking, or completed
                // --- End Updated onClick Logic ---
              }}
              // --- Adjusted background colors based on status ---
              className={`relative group overflow-hidden w-full ${
                submitStatus === 'ready-to-book' 
                  ? 'bg-[#22c35e]' // Green for Book Now
                  : submitStatus === 'price-changed'
                    ? 'bg-yellow-500' // Yellow for Accept New Price
                    : isSubmitting || submitStatus === 'submitting' || submitStatus === 'rechecking' || submitStatus === 'booking'
                      ? 'bg-[#093923]/40 cursor-not-allowed' // Disabled look
                      : 'bg-[#093923]' // Default green for Submit Info
              } text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center`}
            >
              {/* --- Spinner Logic --- */}
              {(isSubmitting || submitStatus === 'submitting' || submitStatus === 'rechecking' || submitStatus === 'booking') && (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {/* --- Checkmark for Ready to Book --- */}
              {submitStatus === 'ready-to-book' && (
                 <svg className="h-5 w-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                 </svg>
              )}
              {/* --- Get Button Text --- */}
              <span className="relative z-10 flex items-center">
                {getSubmitButtonText()}
              </span>
               {/* --- Hover effect only for active states --- */}
               {!(isSubmitting || submitStatus === 'submitting' || submitStatus === 'rechecking' || submitStatus === 'booking') && (
                  <div className="absolute inset-0 bg-[#13804e] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GuestInfoModal;