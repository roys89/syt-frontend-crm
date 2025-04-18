// src/pages/bookings/TransferBookingPage.js
import { ArrowPathIcon, ArrowsRightLeftIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ConfigProvider, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AnalogClock from '../../components/common/AnalogClock';
import LocationMapPicker from '../../components/common/LocationMapPicker';
import GuestDetailsModal from '../../components/transfers/GuestDetailsModal';
import TransferQuoteDetails from '../../components/transfers/TransferQuoteDetails';
import TransferSearchResult from '../../components/transfers/TransferSearchResult';
import bookingService, { TRANSFER_PROVIDERS } from '../../services/bookingService';

// Custom wrapper to display BookingDetailsModal inline
const InlineBookingDetailsWrapper = ({ bookingDetails, isLoading }) => {
  if (!bookingDetails) return null;

  // Modify the BookingDetailsModal to render inline
  return (
    <div className="mt-8">
      <div className="bg-white rounded-lg text-left overflow-hidden shadow-lg">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Skip the Booking Status Card since it's already shown above */}

                  {/* Use the details from BookingDetailsModal but skip the status section */}
                  {bookingDetails.data && bookingDetails.data.data && (
                    <>
                      {/* Guest Information */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900">Guest Information</h4>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.guest_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.guest_phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Passengers</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.passengers}</p>
                          </div>
                          {bookingDetails.data.data.notes && (
                            <div className="col-span-2">
                              <p className="text-sm text-gray-500">Notes</p>
                              <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Journey Details */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900">Journey Details</h4>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">From</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.from}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">To</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.to}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Date</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.booking_date}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Time</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.booking_time}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Journey Type</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.journey_type}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Created Date</p>
                            <p className="mt-1 font-medium text-gray-900">
                              {new Date(bookingDetails.data.data.created_date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle Information */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900">Vehicle Information</h4>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Class</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.vehicle.class}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Capacity</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.vehicle.capacity} passengers</p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-900">Payment Information</h4>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.currency_fare}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Payment Method</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.payment_method}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${bookingDetails.data.data.payment_status === 1
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {bookingDetails.data.data.payment_status === 1 ? 'Paid' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Booking Actions */}
                      <div className="flex justify-end space-x-4">
                        {bookingDetails.data.data.is_amend_allow && (
                          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            Amend Booking
                          </button>
                        )}
                        {bookingDetails.data.data.is_cancel_allow && (
                          <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [isLoadingBookingDetails, setIsLoadingBookingDetails] = useState(false);
  const [detailedBookingInfo, setDetailedBookingInfo] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleBookTransfer = async (guestDetails) => {
    try {
      setBookingLoading(true);

      // Prepare the booking payload
      const bookingPayload = {
        booking_date: formData.pickupDate,
        booking_time: formData.pickupTime,
        guest_details: {
          first_name: guestDetails.first_name,
          last_name: guestDetails.last_name,
          email: guestDetails.email,
          phone: guestDetails.phone
        },
        quotation_id: searchResults.quotation_id,
        quotation_child_id: selectedTransfer.quote_id,
        comments: guestDetails.comments,
        total_passenger: guestDetails.total_passenger,
        flight_number: guestDetails.flight_number || undefined
      };

      // Call the booking API
      const response = await bookingService.bookTransfer({
        provider: selectedProvider,
        ...bookingPayload
      });

      if (response) {
        toast.success('Transfer booked successfully!');
        setShowGuestDetailsModal(false);
        setBookingDetails({
          success: true,
          data: {
            status: response.data.status,
            message: response.data.message,
            booking_id: response.data.data.booking_id
          }
        });
        setStep(4); // Move to booking confirmation step
      } else {
        throw new Error('Failed to book transfer');
      }
    } catch (error) {
      console.error('Error booking transfer:', error);
      toast.error('Failed to book transfer. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Update the handleGetBookingDetails function
  const handleGetBookingDetails = async () => {
    try {
      setIsLoadingBookingDetails(true);
      console.log('Current bookingDetails:', bookingDetails);
      const response = await bookingService.getTransferBookingDetails(bookingDetails.data.booking_id);
      console.log('Booking Details Response:', response);
      if (response.success && response.data) {
        console.log('Setting detailed booking details:', response);
        setDetailedBookingInfo(response);
        setShowDetails(true);
      } else {
        console.error('Invalid response:', response);
        toast.error('Failed to get booking details');
      }
    } catch (error) {
      console.error('Error getting booking details:', error);
      toast.error('Failed to get booking details');
    } finally {
      setIsLoadingBookingDetails(false);
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
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold text-gray-900">Booking Confirmation</h2>
            <button
              onClick={() => setStep(3)}
              className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-300"
            >
              Back to Details
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
            <div className="grid grid-cols-1 gap-8">
              {/* Always show Booking Information */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Booking Information</h3>
                <div className="space-y-4 p-6 bg-indigo-50 rounded-lg border border-indigo-100">
                  <p className="flex items-center">
                    <span className="font-medium text-indigo-700 mr-2">Booking ID:</span>
                    <span className="text-indigo-900">{bookingDetails.data.booking_id}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-indigo-700 mr-2">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      bookingDetails.data.status === true
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {bookingDetails.data.status === true ? 'Success' : 'Failed'}
                    </span>
                  </p>
                  <p className="text-indigo-900">{bookingDetails.data.message}</p>
                </div>
              </div>

              {/* Always show Actions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900">Actions</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleGetBookingDetails}
                    disabled={isLoadingBookingDetails}
                    className="w-full px-6 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                  >
                    {isLoadingBookingDetails ? (
                      <span className="flex items-center justify-center">
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Loading...
                      </span>
                    ) : (
                      'View Booking Details'
                    )}
                  </button>
                </div>
              </div>

              {/* Show the InlineBookingDetails component when details are loaded */}
              {showDetails && detailedBookingInfo && (
                <InlineBookingDetailsWrapper
                  bookingDetails={detailedBookingInfo}
                  isLoading={isLoadingBookingDetails}
                />
              )}
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

    </div>
  );
};

export default TransferBookingPage;