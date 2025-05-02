// src/pages/bookings/TransferBookingPage.js
import { ArrowPathIcon, ArrowsRightLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ConfigProvider, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AnalogClock from '../../components/common/AnalogClock';
import LocationMapPicker from '../../components/common/LocationMapPicker';
import GuestDetailsModal from '../../components/transfers/GuestDetailsModal';
import TransferBookingVoucherModal from '../../components/transfers/TransferBookingVoucherModal';
import TransferQuoteDetails from '../../components/transfers/TransferQuoteDetails';
import TransferSearchResult from '../../components/transfers/TransferSearchResult';
import bookingService, { TRANSFER_PROVIDERS } from '../../services/bookingService';

// Update the theme configuration
const theme = {
  token: {
    colorPrimary: '#093923',
    borderRadius: 8,
    colorBgContainer: '#ffffff',
    colorBorder: '#e5e7eb',
    fontSize: 14,
    controlHeight: 42,
  },
  components: {
    DatePicker: {
      cellActiveWithRangeBg: '#13804e26',
      cellHoverWithRangeBg: '#0939231A',
      cellHoverBg: '#0939231A',
    },
    Select: {
      controlHeight: 42,
      borderRadius: 8,
    }
  },
};

const TransferBookingPage = () => {
  const [step, setStep] = useState(1); // 1 = Search, 2 = Results, 3 = Confirmation, 4 = Booking Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('LA'); // Default to LA

  // Form state
  const [formData, setFormData] = useState({
    provider: 'LA', // Default to LA
    origin: {
      type: 'location',
      display_address: '',
      lat: '',
      long: ''
    },
    destination: {
      display_address: '',
      lat: '',
      long: ''
    },
    pickupDate: '',
    pickupTime: '10:00'
  });

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      pickupDate: today
    }));
  }, []);

  // Form validation
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    // Validate origin
    if (!formData.origin.display_address || !formData.origin.lat || !formData.origin.long) {
      newErrors.origin = 'Please select a pickup location';
    }

    // Validate destination
    if (!formData.destination.display_address || !formData.destination.lat || !formData.destination.long) {
      newErrors.destination = 'Please select a drop-off location';
    }

    // Validate pickup date
    if (!formData.pickupDate) {
      newErrors.pickupDate = 'Please select a pickup date';
    }

    // Validate pickup time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.pickupTime)) {
      newErrors.pickupTime = 'Please enter a valid time in HH:MM format (24hr)';
    }

    // Validate dates
    if (formData.pickupDate) {
      const pickupDateTime = new Date(`${formData.pickupDate}T${formData.pickupTime}`);
      const now = new Date();

      if (pickupDateTime < now) {
        newErrors.pickupDate = 'Pickup date and time cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('origin.') || name.startsWith('destination.')) {
      const [parent, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // NEW: Handle date change for the DatePicker
  const handleDateChange = (date, dateString) => {
    setFormData(prev => ({
      ...prev,
      pickupDate: dateString || '' // Update pickupDate with the formatted string
    }));
    // Clear the date error if a date is selected
    if (errors.pickupDate && dateString) {
       setErrors(prev => ({ ...prev, pickupDate: undefined }));
    }
  };

  // Handle location selection from map
  const handleOriginLocationSelect = (location) => {
    console.log("Origin location selected:", location);

    setFormData(prev => ({
      ...prev,
      origin: {
        ...prev.origin,
        display_address: location.display_address || '',
        lat: location.lat || '',
        long: location.long || ''
      }
    }));
  };

  const handleDestinationLocationSelect = (location) => {
    console.log("Destination location selected:", location);

    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        display_address: location.display_address || '',
        lat: location.lat || '',
        long: location.long || ''
      }
    }));
  };

  // Format datetime for API
  const formatDateTime = (date, time) => {
    if (!date || !time) return '';
    return `${date} ${time}:00.000`;
  };

  // Handle provider change
  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      provider
    }));
    // Don't trigger search when changing providers
  };

  // Modify handleSearch to use the correct payload format
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsLoading(true);

      // Log search data for debugging
      console.log("Search data:", {
        origin: formData.origin,
        destination: formData.destination,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime
      });

      // Call the transfer search API with the correct payload format
      const response = await bookingService.searchTransfers({
        origin: formData.origin,
        destination: formData.destination,
        pickupDate: formData.pickupDate,
        pickupTime: formData.pickupTime
      });

      // Set the full response data structure
      if (response.data?.quotes?.quotes?.data) {
        setSearchResults(response.data.quotes.quotes.data);
        setStep(2);
      } else {
        toast.error('No vehicle options found for your search');
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error searching transfers:', error);
      toast.error('Failed to search transfers. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle transfer selection
  const handleSelectTransfer = async (quote) => {
    try {
      setIsLoading(true);

      // Get the quotation_id from the search results
      const quotationId = searchResults.quotation_id;

      if (!quotationId) {
        throw new Error('No quotation ID found');
      }

      // Call the transfer quote details service
      const response = await bookingService.getTransferQuoteDetails(quotationId, quote.quote_id);

      // Set the selected transfer with the quote details
      setSelectedTransfer({
        ...quote,
        quoteDetails: response
      });

      // Move to the next step
      setStep(3);
    } catch (error) {
      console.error('Error getting transfer quote details:', error);
      toast.error('Failed to get transfer details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking
  const [showGuestDetailsModal, setShowGuestDetailsModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [savedCrmBookingId, setSavedCrmBookingId] = useState(null);
  const [showTransferVoucherModal, setShowTransferVoucherModal] = useState(false);
  const [transferVoucherDetails, setTransferVoucherDetails] = useState(null);
  const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);

  // --- NEW Payment Update State ---
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: '',
    transactionId: '',
    paymentStatus: 'Paid', // Default to Paid, can be changed
    paymentType: 'full', // 'full' or 'partial'
    amountPaid: ''
  });
  const [transferTotalAmount, setTransferTotalAmount] = useState(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [paymentUpdateError, setPaymentUpdateError] = useState(null); // Optional: for specific errors
  const [paymentUpdatedSuccessfully, setPaymentUpdatedSuccessfully] = useState(false);
  // --- END NEW Payment Update State ---

  const handleBookTransfer = async (guestDetailsFromModal) => {
    // Validate inputs (selectedTransfer must exist)
    if (!selectedTransfer || !selectedTransfer.quote_id || !selectedTransfer.quoteDetails) {
        toast.error('Selected transfer details are missing. Please go back and select again.');
        return;
    }
    if (!searchResults || !searchResults.quotation_id) {
        toast.error('Quotation ID is missing. Please perform the search again.');
        return;
    }

    try {
      setBookingLoading(true);

      // --- Step 1: Book with the Provider --- 
      const providerBookingPayload = {
        booking_date: formData.pickupDate,
        booking_time: formData.pickupTime,
        guest_details: {
          first_name: guestDetailsFromModal.first_name,
          last_name: guestDetailsFromModal.last_name,
          email: guestDetailsFromModal.email,
          phone: guestDetailsFromModal.phone
        },
        quotation_id: searchResults.quotation_id,
        quotation_child_id: selectedTransfer.quote_id,
        comments: guestDetailsFromModal.comments,
        total_passenger: guestDetailsFromModal.total_passenger,
        flight_number: guestDetailsFromModal.flight_number || undefined
      };

      console.log("📡 Calling bookTransfer with payload:", providerBookingPayload);
      const providerResponse = await bookingService.bookTransfer({ // Capture the response
        provider: selectedProvider,
        ...providerBookingPayload
      });
      console.log("📡 Provider bookTransfer response:", providerResponse);

      // Check for successful booking ID from provider
      if (!providerResponse || !providerResponse.data?.data?.booking_id) {
         let errorMessage = 'Failed to book transfer with provider.';
        if (providerResponse && providerResponse.data && providerResponse.data.message) {
            errorMessage = providerResponse.data.message;
        } else if (providerResponse && providerResponse.message) {
             errorMessage = providerResponse.message;
        }
        throw new Error(errorMessage);
      }

      // --- Step 2: Save to CRM --- 
      const bookingRefId = providerResponse.data.data.booking_id;
      
      // --- Debugging: Log the quote details --- 
      console.log("Selected Transfer Quote Details for Fare Extraction:", JSON.stringify(selectedTransfer?.quoteDetails, null, 2));
      // ----------------------------------------
      
      // --- Corrected Path based on Logs --- 
      const quoteData = selectedTransfer.quoteDetails?.data?.quote;
      const fareString = quoteData?.fare; // Fare is a string: "1450.00"
      const currencyCode = quoteData?.currency; // Currency: "INR"
      
      // --- Parse and Validate Fare --- 
      let parsedFare = 0;
      let fareIsValid = false;
      if (typeof fareString === 'string') {
          parsedFare = parseFloat(fareString);
          if (!isNaN(parsedFare) && parsedFare > 0) {
              fareIsValid = true;
          } 
      }

      if (!fareIsValid) {
          console.error(`Error: Invalid or zero fare retrieved. String: '${fareString}', Parsed: ${parsedFare}. Quote Data:`, quoteData, "Full Quote Details:", selectedTransfer?.quoteDetails);
          toast.error('Could not retrieve valid fare details from quote. Please check booking details.'); 
          // Decide if we should stop the process
          // throw new Error('Invalid fare details retrieved from quote.'); 
      }
      // --- End Validation ---

      const crmBookingData = {
        bookingRefId: bookingRefId,
        provider: selectedProvider,
        providerBookingResponse: providerResponse, 
        status: 'Confirmed', 
        transferDetails: {
            origin: formData.origin,
            destination: formData.destination,
            pickupDate: formData.pickupDate,
            pickupTime: formData.pickupTime,
            journeyType: providerResponse.data?.data?.journey_type || 'one_way',
            vehicle: {
                class: quoteData?.vehicle?.ve_class || selectedTransfer.vehicle.class, 
                capacity: parseInt(quoteData?.vehicle?.ve_max_capacity || selectedTransfer.vehicle.capacity, 10) || 0, // Ensure capacity is number
            }
        },
        guestDetails: {
            firstName: guestDetailsFromModal.first_name,
            lastName: guestDetailsFromModal.last_name,
            email: guestDetailsFromModal.email,
            phone: guestDetailsFromModal.phone,
            totalPassengers: parseInt(guestDetailsFromModal.total_passenger, 10) || 0, 
            flightNumber: guestDetailsFromModal.flight_number || null,
            notes: guestDetailsFromModal.comments || null
        },
        paymentDetails: {
            currency: currencyCode || 'INR', // Use extracted currency
            fare: fareIsValid ? parsedFare : 0, // Use the parsed and validated number
            paymentMethod: 'Pending', 
            paymentStatus: 'Pending',
            transactionId: 'N/A',
            amountPaid: 0, 
            remarks: ''
        },
        notes: '' 
      };

      // Store the *validated* total amount (fare) for the payment form state
      // Ensure transferTotalAmount state is set with the *number*, not the string
      setTransferTotalAmount(crmBookingData.paymentDetails.fare);

      console.log("💾 Preparing to save to CRM:", crmBookingData); // Check this log for correct fare
      const crmResponse = await bookingService.saveTransferBookingToCRM(crmBookingData);
      console.log("💾 CRM save response:", crmResponse);

      if (!crmResponse || !crmResponse.success || !crmResponse.data?._id) {
        // Booking succeeded with provider, but failed to save to CRM. Log and notify.
        console.error("Booking successful with provider but failed to save to CRM:", crmResponse?.message || 'Unknown CRM save error');
        toast.warn('Transfer booked, but failed to save details to CRM. Please note down Booking ID: ' + bookingRefId);
        setSavedCrmBookingId(null); // Indicate CRM save failed
      } else {
        // CRM save successful
        setSavedCrmBookingId(crmResponse.data._id); 
        setPaymentUpdatedSuccessfully(false); // Reset payment status on new booking
        setPaymentForm({ // Reset form for new booking
           paymentMethod: '',
           transactionId: '',
           paymentStatus: 'Paid',
           paymentType: 'full',
           amountPaid: ''
        });
        toast.success('Transfer booked and saved to CRM successfully!');
      }

      // --- Step 3: Update UI --- 
      setShowGuestDetailsModal(false);
      setBookingDetails({ // Store the initial booking summary
        success: providerResponse.success, // Store the success status from providerResponse
        data: {
          status: providerResponse.data?.status, // Store provider's internal status if available
          message: providerResponse.message || providerResponse.data?.message, // Store message
          booking_id: bookingRefId
        }
      });
      setStep(4); // Move to booking confirmation step

    } catch (error) {
      console.error('Error during transfer booking process:', error);
      // Display the specific error message thrown earlier or a generic one
      toast.error(error.message || 'Failed to book transfer. Please try again.');
      setSavedCrmBookingId(null); // Ensure ID is null on error
    } finally {
      setBookingLoading(false);
    }
  };

  // Swap origin and destination
  const handleSwapLocations = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin
    }));
  };

  // Add this new function to handle time selection
  const handleTimeSelect = (time, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: time  // This will be in 24-hour format (HH:MM)
    }));

    if (field === 'pickupTime') {
      setShowPickupClock(false);
    }
  };

  const formatTimeForDisplay = (time) => {
    if (!time) return '';

    const [hours, minutes] = time.split(':').map(Number);

    // Convert to 12-hour format for display
    let displayHours = hours % 12;
    if (displayHours === 0) displayHours = 12;

    const ampm = hours >= 12 ? 'PM' : 'AM';

    return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const [showPickupClock, setShowPickupClock] = useState(false);

  // --- CORRECTED: Function to get LIVE data for voucher --- 
  const handleGetTransferVoucher = async () => {
      const providerBookingRef = bookingDetails?.data?.booking_id; 

      if (!providerBookingRef) {
          toast.error('Provider Booking ID not found. Cannot fetch live voucher details.');
          console.error('[BookingPage] Provider booking_id is missing in bookingDetails state:', bookingDetails);
          return;
      }

      setIsLoadingVoucher(true);
      setTransferVoucherDetails(null); // Clear previous details

      try {
          console.log(`[BookingPage] Attempting API call getTransferBookingDetails with Provider Ref ID: ${providerBookingRef}`);
          
          // *** Call the service to get LIVE details from the PROVIDER ***
          const response = await bookingService.getTransferBookingDetails(providerBookingRef);
          console.log('[BookingPage] LIVE Provider API Response (getTransferBookingDetails):', response);

          // *** Check the structure of the LIVE provider response ***
          // Adapt this check based on the actual successful response structure
          if (response && response.success && response.data) { // Assuming { success: true, data: {...} } structure
              console.log('[BookingPage] LIVE Transfer details retrieved successfully:', response.data);
              
              // *** IMPORTANT: Store the PROVIDER'S data structure ***
              setTransferVoucherDetails(response.data); 
              
              setShowTransferVoucherModal(true); // Open the modal
              toast.success('Live voucher details loaded.');
          } else {
              const errorMessage = response?.message || response?.error?.message || 'Failed to get live voucher details (Invalid data or booking not found).';
               throw new Error(errorMessage);
          }
      } catch (error) {
          console.error('[BookingPage] Error fetching live voucher details:', error);
          const message = error.message || 'An error occurred while fetching live voucher details.';
          toast.error(`Failed to get live voucher details: ${message}`);
          setTransferVoucherDetails(null);
          setShowTransferVoucherModal(false); // Ensure modal doesn't open on error
      } finally {
          setIsLoadingVoucher(false);
      }
  };
  // --- END CORRECTED FUNCTION ---

  // --- NEW: Handle Payment Form Change ---
  const handlePaymentFormChange = (e) => {
      const { name, value } = e.target;
      setPaymentForm(prev => ({
          ...prev,
          [name]: value
      }));
  };
  // --- END NEW FUNCTION ---

  // --- NEW: Handle Payment Update Submit ---
   const handleUpdateTransferPayment = async (e) => {
      e.preventDefault();
      setPaymentUpdateError(null);

      // Basic Validation
      if (!paymentForm.paymentMethod) {
          toast.error('Payment method is required');
          return;
      }
      if (!paymentForm.transactionId) {
          toast.error('Transaction ID is required');
          return;
      }
      if (paymentForm.paymentType === 'partial' && (!paymentForm.amountPaid || parseFloat(paymentForm.amountPaid) <= 0)) {
          toast.error('Please enter a valid amount for partial payment');
          return;
      }
      if (!savedCrmBookingId) {
          toast.error('Cannot update payment: CRM Booking ID is missing.');
          return;
      }

      setIsUpdatingPayment(true);
      try {
          const totalAmount = transferTotalAmount || 0;
          const amountPaid = paymentForm.paymentType === 'full' 
              ? totalAmount 
              : parseFloat(paymentForm.amountPaid);
          
          // Construct payload matching the backend controller/schema ($set notation needed)
          const updatePayload = {
              paymentDetails: { // Send the nested object
                  paymentMethod: paymentForm.paymentMethod,
                  transactionId: paymentForm.transactionId,
                  paymentStatus: paymentForm.paymentStatus,
                  amountPaid: amountPaid
                  // Optionally add remarks if needed
              }
          };

          console.log(`Updating payment for CRM ID ${savedCrmBookingId} with payload:`, updatePayload);

          const response = await bookingService.updateTransferBookingToCRM(savedCrmBookingId, updatePayload);

          if (response.success) {
              toast.success('Payment details updated successfully!');
              setPaymentUpdatedSuccessfully(true); // Hide form on success
              // Optional: Refetch details or update local state if needed
          } else {
              throw new Error(response.message || 'Failed to update payment details');
          }

      } catch (error) {
          console.error('Error updating transfer payment:', error);
          setPaymentUpdateError(error.message || 'Failed to update payment.');
          toast.error(error.message || 'Failed to update payment details. Please try again.');
      } finally {
          setIsUpdatingPayment(false);
      }
  };
  // --- END NEW FUNCTION ---

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">Transfer Booking</h1>
        <p className="text-lg text-gray-600">Book airport transfers and transportation services with ease</p>
      </div>

      {/* Progress Steps - Fixed Version */}
      <div className="mb-16 px-4 sm:px-10">
        <div className="relative">
          {/* Connecting Lines - As Background */}
          <div className="absolute top-6 left-0 right-0 z-0">
            <div className="mx-auto w-full max-w-3xl flex items-center justify-between">
              <div className={`h-1 flex-1 mx-6 transition-all duration-300 ${step > 1 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`h-1 flex-1 mx-6 transition-all duration-300 ${step > 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
              <div className={`h-1 flex-1 mx-6 transition-all duration-300 ${step > 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
            </div>
          </div>

          {/* Step Circles */}
          <div className="relative z-10 mx-auto max-w-3xl flex justify-between">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex flex-col items-center">
                {/* Circle */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${step >= stepNumber
                    ? 'bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-200'
                    : 'bg-gray-100 text-gray-400'
                  }`}>
                  {stepNumber}
                </div>

                {/* Label - Fixed Width */}
                <span className={`mt-4 block w-24 text-center text-sm font-medium transition-colors duration-300 ${step >= stepNumber ? 'text-indigo-600' : 'text-gray-400'
                  }`}>
                  {stepNumber === 1 && "Search"}
                  {stepNumber === 2 && "Select Vehicle"}
                  {stepNumber === 3 && "Confirmation"}
                  {stepNumber === 4 && "Booking"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 1: Search Form */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 transform transition-all duration-300 hover:shadow-xl">
          <form onSubmit={handleSearch}>
            <div className="space-y-8">
              {/* Modified Header with Provider Selection */}
              <div className="flex justify-between items-center">
                {/* Left Side: Title and Subtitle */}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Search Transfers</h2>
                  <p className="text-gray-600">Find the best transportation options</p>
                </div>
                {/* Right Side: Provider Selection */}
                <div className="flex items-center space-x-4">
                  <h3 className="text-base font-medium text-gray-700">Select Provider:</h3>
                  <div className="flex space-x-2">
                    {TRANSFER_PROVIDERS.map((provider) => (
                      <button
                        key={provider.value}
                        type="button"
                        onClick={() => handleProviderChange(provider.value)}
                        className={`px-3 py-1.5 rounded-md border text-sm font-medium transition-colors duration-200 ${ 
                          selectedProvider === provider.value
                            ? 'border-[#093923] bg-[#093923]/10 text-[#093923]' 
                            : 'border-gray-300 text-gray-700 hover:border-[#093923]/50 hover:bg-[#093923]/5'
                        }`}
                      >
                        {provider.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                 <div className="space-y-6">
                  {/* Locations */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="col-span-1">
                      <label htmlFor="origin.display_address" className="block text-sm font-medium text-gray-700 mb-2">
                        Pickup Location
                      </label>
                      <LocationMapPicker
                        placeholder="Search pickup location..."
                        onLocationSelect={handleOriginLocationSelect}
                        initialCenter={{ lat: 19.0760, lng: 72.8777 }}
                        value={formData.origin.lat && formData.origin.long ?
                          { lat: parseFloat(formData.origin.lat), lng: parseFloat(formData.origin.long) } : null}
                      />
                      {formData.origin.display_address && (
                        <div className="mt-2 p-3 bg-[#093923]/5 rounded-lg border border-[#093923]/10">
                          <p className="text-sm text-[#093923]">
                            <span className="font-medium">Selected:</span> {formData.origin.display_address}
                          </p>
                        </div>
                      )}
                      {errors.origin && (
                        <p className="mt-2 text-sm text-red-600">{errors.origin}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        className="mt-7 p-2 rounded-full border border-[#093923]/30 hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] transition-colors"
                        onClick={handleSwapLocations}
                      >
                        <ArrowsRightLeftIcon className="h-5 w-5 text-[#093923]" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="col-span-1">
                      <label htmlFor="destination.display_address" className="block text-sm font-medium text-gray-700 mb-2">
                        Drop-off Location
                      </label>
                      <LocationMapPicker
                        placeholder="Search drop-off location..."
                        onLocationSelect={handleDestinationLocationSelect}
                        initialCenter={{ lat: 19.0899, lng: 72.8684 }}
                        value={formData.destination.lat && formData.destination.long ?
                          { lat: parseFloat(formData.destination.lat), lng: parseFloat(formData.destination.long) } : null}
                      />
                      {formData.destination.display_address && (
                        <div className="mt-2 p-3 bg-[#093923]/5 rounded-lg border border-[#093923]/10">
                          <p className="text-sm text-[#093923]">
                            <span className="font-medium">Selected:</span> {formData.destination.display_address}
                          </p>
                        </div>
                      )}
                      {errors.destination && (
                        <p className="mt-2 text-sm text-red-600">{errors.destination}</p>
                      )}
                    </div>
                  </div>

                  {/* Date and Time in one line */}
                  <div className="grid grid-cols-4 gap-6">
                    <div>
                      <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Date
                      </label>
                      <ConfigProvider theme={theme}>
                        <DatePicker
                          id="pickupDate"
                          className="w-full"
                          format="YYYY-MM-DD"
                          value={formData.pickupDate ? dayjs(formData.pickupDate) : null}
                          onChange={handleDateChange}
                          disabledDate={current => current && current < dayjs().startOf('day')}
                          placeholder="Select Date"
                          suffixIcon={<CalendarIcon className="h-5 w-5 text-gray-400" />}
                        />
                      </ConfigProvider>
                      {errors.pickupDate && (
                        <p className="mt-1 text-sm text-red-600">{errors.pickupDate}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Time
                      </label>
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowPickupClock(true)}
                          className="flex items-center justify-between w-full h-[42px] px-4 border border-gray-300 rounded-lg bg-white hover:border-[#093923]/30 transition-colors focus:outline-none focus:ring-2 focus:ring-[#093923] focus:ring-opacity-50"
                        >
                          <span className="flex items-center">
                            <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                            <span className="text-gray-900">{formatTimeForDisplay(formData.pickupTime)}</span>
                          </span>
                          <span className="text-gray-400">↓</span>
                        </button>
                      </div>
                      {errors.pickupTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.pickupTime}</p>
                      )}
                    </div>

                    <div className="opacity-0">
                      {/* Empty div to maintain grid layout */}
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center h-[42px] px-6 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50 transition-colors duration-200"
                      >
                        {isLoading ? (
                          <>
                            <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            Search Transfers
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Search Results */}
      {step === 2 && (
        <TransferSearchResult
          searchResults={searchResults}
          formData={formData}
          onSelectTransfer={handleSelectTransfer}
          onBackToSearch={() => setStep(1)}
          isLoading={isLoading}
        />
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && selectedTransfer && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Transfer Details</h2>
            <button
              onClick={() => setStep(2)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Change Vehicle
            </button>
          </div>
          <TransferQuoteDetails quoteDetails={selectedTransfer.quoteDetails} />
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setShowGuestDetailsModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Continue to Booking
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Booking Confirmation */}
      {step === 4 && bookingDetails && (
        <div className="space-y-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900">Booking Confirmation</h2>
            <button
              onClick={() => setStep(1)} // Go back to search for new booking
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-300"
            >
              New Search
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="grid grid-cols-1 gap-8">
               {/* Booking Information display (Provider Status) */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Booking Information</h3>
                <div className="space-y-4 p-6 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="flex items-center">
                    <span className="font-medium text-indigo-700 mr-2">Booking ID:</span>
                    <span className="text-indigo-900 font-mono text-sm bg-indigo-100 px-2 py-0.5 rounded">{bookingDetails.data.booking_id}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-indigo-700 mr-2">Provider Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${ 
                      bookingDetails.success === true
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800' 
                    }`}>
                      {bookingDetails.success ? 'Success' : 'Failed'}
                    </span>
                  </p>
                  <p className="text-indigo-900 italic">{bookingDetails.data.message}</p>
                </div>
              </div>

               {/* Actions: Download Voucher */} 
              <div className="space-y-2"> 
                <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Actions</h3>
                   {/* Download Voucher Button - Uses CORRECTED handler */}
                  <button
                      onClick={handleGetTransferVoucher} // Uses the corrected function
                      disabled={isLoadingVoucher || !bookingDetails?.data?.booking_id} // Disable if loading or no provider ID
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                      {isLoadingVoucher ? (
                          <ArrowPathIcon className="animate-spin mr-1 h-4 w-4" />
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                      )}
                      Voucher
                  </button>
                </div>
              </div> 

               {/* --- Payment Update Section --- */} 
               {savedCrmBookingId && ( 
                  <div className="space-y-6 border-t pt-6 mt-6">
                     <h3 className="text-xl font-semibold text-gray-900 mb-4">Update Payment Details</h3>
                      {paymentUpdatedSuccessfully ? ( 
                         <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                             <p className="font-medium text-green-700">Payment details updated successfully!</p>
                         </div>
                     ) : ( 
                         <form 
                           onSubmit={handleUpdateTransferPayment} 
                           className="space-y-6 p-6 border border-gray-200 rounded-lg bg-gray-50"
                         >
                            {/* Row 1: Method & Transaction ID */} 
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                               <div> 
                                   <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                                   <select
                                       id="paymentMethod"
                                       name="paymentMethod"
                                       value={paymentForm.paymentMethod}
                                       onChange={handlePaymentFormChange}
                                       required
                                       className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[42px] pl-3"
                                   >
                                       <option value="">Select Method...</option>
                                       <option value="Credit Card">Credit Card</option>
                                       <option value="Bank Transfer">Bank Transfer</option>
                                       <option value="Cash">Cash</option>
                                       <option value="UPI">UPI</option>
                                       <option value="Other">Other</option>
                                   </select>
                               </div> 
                               <div> 
                                   <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID / Reference</label>
                                   <input
                                       type="text"
                                       id="transactionId"
                                       name="transactionId"
                                       value={paymentForm.transactionId}
                                       onChange={handlePaymentFormChange}
                                       required
                                       className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[42px] px-3"
                                       placeholder="Enter Transaction ID or N/A"
                                   />
                               </div> 
                            </div> 
                           
                             {/* Row 2: Type & Status */} 
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  <div> 
                                     <label htmlFor="paymentType" className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                                     <select
                                         id="paymentType"
                                         name="paymentType"
                                         value={paymentForm.paymentType}
                                         onChange={handlePaymentFormChange}
                                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[42px] pl-3"
                                     >
                                         <option value="full">Full Payment</option>
                                         <option value="partial">Partial Payment</option>
                                     </select>
                                  </div> 
                                  <div> 
                                     <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                                     <select
                                         id="paymentStatus"
                                         name="paymentStatus"
                                         value={paymentForm.paymentStatus}
                                         onChange={handlePaymentFormChange}
                                         required
                                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[42px] pl-3"
                                     >
                                         <option value="Paid">Paid</option>
                                         <option value="Pending">Pending</option>
                                         <option value="Failed">Failed</option>
                                         <option value="Refunded">Refunded</option>
                                     </select>
                                  </div> 
                              </div> 

                             {/* Conditional Amount Paid for Partial */} 
                             {paymentForm.paymentType === 'partial' && ( 
                                 <div> 
                                     <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                                     <input
                                         type="number"
                                         id="amountPaid"
                                         name="amountPaid"
                                         value={paymentForm.amountPaid}
                                         onChange={handlePaymentFormChange}
                                         required
                                         min="0"
                                         step="0.01"
                                         className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-[42px] px-3"
                                         placeholder="Enter amount"
                                     />
                                 </div> 
                             )} 

                             {paymentUpdateError && ( 
                                 <p className="text-sm text-red-600 mt-2">Error: {paymentUpdateError}</p>
                             )} 

                             <div className="flex justify-end pt-4 border-t border-gray-200"> 
                                 <button
                                     type="submit"
                                     disabled={isUpdatingPayment}
                                     className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] shadow-md flex items-center justify-center text-sm font-medium"
                                 >
                                     {isUpdatingPayment ? (
                                         <><ArrowPathIcon className="animate-spin mr-2 h-4 w-4" /> Updating...</>
                                     ) : (
                                         'Update Payment'
                                     )}
                                 </button>
                            </div> 
                         </form> 
                     )} 
                  </div> 
               )} 
               {/* --- END Payment Update Section --- */} 

            </div> 
          </div> 
        </div> 
      )} 

      {/* Guest Details Modal */}
      <GuestDetailsModal
        isOpen={showGuestDetailsModal}
        onClose={() => setShowGuestDetailsModal(false)}
        onSubmit={handleBookTransfer}
        isLoading={bookingLoading}
      />

      {/* Analog Clock */}
      {showPickupClock && (
        <AnalogClock
          value={formData.pickupTime}
          onChange={(time) => handleTimeSelect(time, 'pickupTime')}
          onClose={() => setShowPickupClock(false)}
        />
      )}

      {/* Render TransferBookingVoucherModal */} 
      {/* Pass the providerBookingRef prop */} 
      {transferVoucherDetails && ( 
          <TransferBookingVoucherModal
              isOpen={showTransferVoucherModal}
              onClose={() => {
                  setShowTransferVoucherModal(false);
                  setTransferVoucherDetails(null); 
              }}
              transferVoucherDetails={transferVoucherDetails} 
              providerBookingRef={bookingDetails?.data?.booking_id} // Pass the ref ID directly
          />
      )} 

    </div> 
  );
};

export default TransferBookingPage;