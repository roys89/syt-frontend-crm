// src/pages/bookings/HotelBookingPage.js
import { ArrowPathIcon, ChevronDownIcon, InformationCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { toast } from 'react-toastify';
import RoomArrangementModal from '../../components/booking/RoomArrangementModal';
import ProviderSelector from '../../components/common/ProviderSelector';
import BookingVoucherModal from '../../components/hotels/BookingVoucherModal';
import HotelItineraryModal from '../../components/hotels/HotelItineraryModal';
import HotelLocationSearch from '../../components/hotels/HotelLocationSearch';
import HotelSearchResult from '../../components/hotels/HotelSearchResult';
import bookingService, { HOTEL_PROVIDERS } from '../../services/bookingService';

// Update the FACILITY_CATEGORIES constant to only include names
const FACILITY_CATEGORIES = [
  "Parking",
  "Lounge",
  "Childcare Service",
  "Breakfast",
  "Business Center",
  "Spa",
  "Non Smoking",
  "Laundry Services",
  "Swimming Pool",
  "Restaurant",
  "Internet",
  "Fitness Facility",
  "Airport Shuttle"
];

// Update the FacilitiesSelector component
const FacilitiesSelector = ({ selectedFacilities, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleFacility = (facilityName) => {
    const newSelected = selectedFacilities.includes(facilityName)
      ? selectedFacilities.filter(name => name !== facilityName)
      : [...selectedFacilities, facilityName];
    onChange(newSelected);
  };

  return (
    <div className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="relative cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
      >
        <span className="block truncate">
          {selectedFacilities.length > 0
            ? `${selectedFacilities.length} facilities selected`
            : 'Select facilities'}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
          {FACILITY_CATEGORIES.map((facility) => (
            <div
              key={facility}
              className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleFacility(facility)}
            >
              <input
                type="checkbox"
                checked={selectedFacilities.includes(facility)}
                onChange={() => {}}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{facility}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const HotelBookingPage = () => {
  const [step, setStep] = useState(1); // 1 = Search, 2 = Results, 3 = Confirmation, 4 = Booking Complete
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('TC'); // Default to Travel Clan
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [traceId, setTraceId] = useState(null);
  const [showItineraryModal, setShowItineraryModal] = useState(false);
  const [itineraryData, setItineraryData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hotelsToShow, setHotelsToShow] = useState(10);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    provider: 'TC',
    checkIn: '',
    checkOut: '',
    city: null,
    nationality: 'IN',
    rooms: [{ adults: 1, children: [] }],
    filterBy: {
      freeBreakfast: false,
      isRefundable: false,
      facilities: [],
      tags: [],
      propertyTypes: []
    }
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Add loading state per hotel
  const [loadingHotels, setLoadingHotels] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.checkIn) newErrors.checkIn = 'Check-in date is required';
    if (!formData.checkOut) newErrors.checkOut = 'Check-out date is required';
    
    // Validate dates
    if (formData.checkIn && formData.checkOut) {
      const checkInDate = new Date(formData.checkIn);
      const checkOutDate = new Date(formData.checkOut);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (checkInDate < today) {
        newErrors.checkIn = 'Check-in date cannot be in the past';
      }
      
      if (checkOutDate <= checkInDate) {
        newErrors.checkOut = 'Check-out date must be after check-in date';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('filterBy.')) {
      const filterName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        filterBy: {
          ...prev.filterBy,
          [filterName]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle city selection
  const handleCityChange = (city) => {
    setFormData(prev => ({
      ...prev,
      city: city
    }));
  };

  // Handle provider change
  const handleProviderChange = (provider) => {
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      provider
    }));
  };

  // Handle array input changes
  const handleArrayChange = (e, arrayName) => {
    const { value } = e.target;
    const newValue = value.split(',').map(item => item.trim());
    setFormData(prev => ({
      ...prev,
      filterBy: {
        ...prev.filterBy,
        [arrayName]: newValue
      }
    }));
  };

  // Handle rating selection
  const handleRatingSelect = (rating, arrayName) => {
    setFormData(prev => {
      const currentRatings = prev.filterBy[arrayName] || [];
      const newRatings = currentRatings.includes(rating)
        ? currentRatings.filter(r => r !== rating)
        : [...currentRatings, rating];
      
      return {
        ...prev,
        filterBy: {
          ...prev.filterBy,
          [arrayName]: newRatings.length > 0 ? newRatings : undefined
        }
      };
    });
  };

  // Function to save rooms from modal
  const handleSaveRooms = (updatedRooms) => {
    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  // Function to generate room summary string
  const getRoomSummary = () => {
    const rooms = formData.rooms || [];
    if (rooms.length === 0) return 'No rooms configured';
    const totalGuests = rooms.reduce((acc, room) => acc + room.adults + (room.children ? room.children.length : 0), 0);
    return `${rooms.length} Room${rooms.length !== 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}`;
    // Alternatively, show more details:
    // return rooms.map((room, index) => {
    //   const adults = room.adults || 0;
    //   const children = room.children ? room.children.length : 0;
    //   return `Room ${index + 1}: ${adults}A${children > 0 ? `, ${children}C` : ''}`;
    // }).join('; ');
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setIsLoading(true);
      setPage(1); // Reset page to 1 for new search
      
      // Clean up filterBy object to remove empty/null values
      const cleanFilterBy = Object.entries(formData.filterBy).reduce((acc, [key, value]) => {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (Array.isArray(value) && value.every(item => item === null || item === '')) return acc;
        if (value === null || value === undefined) return acc;
        acc[key] = value;
        return acc;
      }, {});
      
      // Prepare search data for the API
      const searchData = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nationality: formData.nationality,
        occupancies: formData.rooms.map(room => ({
          numOfAdults: room.adults,
          childAges: room.children
        })),
        locationId: formData.city?.locationId,
        page: 1,
        limit: 20
      };
      
      // Add hotelId if present (for Hotel type locations)
      if (formData.city?.hotelId) {
        searchData.hotelId = formData.city.hotelId;
      }
      
      if (Object.keys(cleanFilterBy).length > 0) {
        searchData.filterBy = cleanFilterBy;
      }
      
      const response = await bookingService.searchHotels(searchData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search hotels');
      }

      const hotels = response.data?.results?.[0]?.data || [];
      const total = response.data?.results?.[0]?.totalCount || 0;
      const totalPgs = response.data?.results?.[0]?.totalPages || 1;
      const trace = response.data?.traceId;
      
      setSearchResults(hotels);
      setTotalCount(total);
      setTotalPages(totalPgs);
      setTraceId(trace);
      setHasMore(totalPgs > 1);
      setStep(2);
    } catch (error) {
      console.error('Error searching hotels:', error);
      toast.error(error.message || 'Failed to search hotels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle load more results
  const handleLoadMore = async () => {
    if (!hasMore || isLoading) return;
    
    try {
      setIsLoading(true);
      const nextPage = page + 1;
      
      // Prepare search data with traceId for pagination
      const searchData = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nationality: formData.nationality,
        occupancies: formData.rooms.map(room => ({
          numOfAdults: room.adults,
          childAges: room.children
        })),
        locationId: formData.city?.locationId,
        page: nextPage,
        limit: 20,
        traceId: traceId // Include traceId for maintaining search context
      };
      
      // Add hotelId if present (for Hotel type locations)
      if (formData.city?.hotelId) {
        searchData.hotelId = formData.city.hotelId;
      }
      
      // Add existing filters if any
      if (Object.keys(formData.filterBy).length > 0) {
        searchData.filterBy = formData.filterBy;
      }
      
      const response = await bookingService.searchHotels(searchData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load more hotels');
      }

      const newHotels = response.data?.results?.[0]?.data || [];
      const total = response.data?.results?.[0]?.totalCount || 0;
      const totalPgs = response.data?.results?.[0]?.totalPages || 1;
      
      // Update search results by appending new hotels
      setSearchResults(prev => [...prev, ...newHotels]);
      setTotalCount(total);
      setTotalPages(totalPgs);
      setPage(nextPage);
      
      // Only show Load More if we haven't reached totalPages
      setHasMore(nextPage < totalPgs);
    } catch (error) {
      console.error('Error loading more hotels:', error);
      toast.error(error.message || 'Failed to load more hotels. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking
  const handleBookHotel = async () => {
    try {
      setIsLoading(true);
      
      // Prepare booking data
      const bookingData = {
        hotelId: selectedHotel.id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        occupancies: formData.rooms.map(room => ({
          numOfAdults: room.adults,
          childAges: room.children
        })),
        roomType: selectedHotel.roomType,
        price: selectedHotel.price,
        // Add other necessary booking details
      };
      
      // Call the hotel booking API
      // const response = await bookingService.bookHotel(bookingData);
      
      // Show success message
      toast.success('Hotel booked successfully!');
      
      // Redirect to bookings page or show confirmation
      // history.push('/bookings');
    } catch (error) {
      console.error('Error booking hotel:', error);
      toast.error('Failed to book hotel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hotel selection
  const handleHotelSelect = async (hotel) => {
    try {
      // Set loading state for this specific hotel
      setLoadingHotels(prev => ({ ...prev, [hotel.id]: true }));
      
      // Create itinerary with hotel data
      const response = await bookingService.createHotelItinerary({
        hotelId: hotel.id,
        traceId: traceId,
        cityName: hotel.cityName,
        startDate: hotel.startDate,
        provider: selectedProvider
      });

      // Store itinerary data and selected hotel
      setItineraryData(response);
      setSelectedHotel(hotel);
      setShowItineraryModal(true);
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast.error(error.message || 'Failed to create itinerary. Please try again.');
    } finally {
      // Clear loading state for this specific hotel
      setLoadingHotels(prev => ({ ...prev, [hotel.id]: false }));
    }
  };

  // Handle booking data submission from itinerary modal
  const handleBookingSubmit = (bookingData) => {
    // Set booking details from the confirmation response
    setBookingDetails(bookingData);
    // Update step to booking complete
    setStep(4);
    // Close itinerary modal
    setShowItineraryModal(false);
  };

  // Get voucher details
  const handleGetVoucher = async () => {
    if (!bookingDetails?.results?.[0]?.data?.[0]?.bookingRefId) {
      toast.error('Booking reference ID not found');
      return;
    }
  
    try {
      setIsLoadingVoucher(true);
      const bookingCode = bookingDetails.results[0].data[0].bookingRefId;
      
      // Log the booking code to verify it's not undefined
      console.log('Retrieved booking code:', bookingCode);
      
      // Get hotel information for date and city (for logging)
      const hotelInfo = {
        date: formData.checkIn,
        city: formData.city?.fullName
      };
      
      // Log the request parameters for debugging
      console.log('Getting voucher details for:', {
        bookingCode,
        date: hotelInfo.date,
        city: hotelInfo.city
      });
      
      // Use the dedicated hotel booking details function
      const voucherResponse = await bookingService.getHotelBookingDetails(
        bookingCode, 
        hotelInfo.date, 
        hotelInfo.city
      );
      
      if (voucherResponse.success) {
        console.log('Voucher details retrieved successfully');
        setVoucherDetails(voucherResponse.data);
        setShowVoucherModal(true);
        toast.success('Voucher details retrieved successfully');
      } else {
        throw new Error(voucherResponse.message || 'Failed to get voucher details');
      }
    } catch (error) {
      console.error('Error getting voucher details:', error);
      toast.error(error.message || 'Failed to get voucher details');
    } finally {
      setIsLoadingVoucher(false);
    }
  };

  // Handle itinerary modal close
  const handleItineraryModalClose = () => {
    setShowItineraryModal(false);
    setItineraryData(null);
  };

  // Render booking details section
  const renderBookingDetails = () => {
    if (!bookingDetails) return null;
    
    const booking = bookingDetails.results?.[0];
    if (!booking) return null;
    
    const bookingRefId = booking.data?.[0]?.bookingRefId;
    const status = booking.data?.[0]?.status;
    const providerConfirmationNumber = booking.data?.[0]?.providerConfirmationNumber;
    const roomConfirmation = booking.data?.[0]?.roomConfirmation || [];
    
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Booking Confirmation</h2>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
            {status || 'Confirmed'}
          </div>
        </div>
        
        <div className="border-b border-gray-200 pb-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Booking Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-medium">{bookingRefId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Provider Confirmation:</span>
                  <span className="font-medium">{providerConfirmationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Itinerary Code:</span>
                  <span className="font-medium">{booking.itineraryCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Trace ID:</span>
                  <span className="font-medium">{booking.traceId}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Room Confirmation</h3>
              {roomConfirmation.length > 0 ? (
                <div className="space-y-4">
                  {roomConfirmation.map((room, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Room {index + 1}:</span>
                        <span className="font-medium text-green-600">{room.bookingStatus}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>Provider Confirmation: {room.providerConfirmationNumber}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No room confirmation details available</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button 
            onClick={handleGetVoucher}
            disabled={isLoadingVoucher}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isLoadingVoucher ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : 'View Voucher'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hotel Booking</h1>
        <p className="mt-2 text-sm text-gray-600">
          Search and book hotels for your trip
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
          {step >= 4 && (
            <>
              <div className={`flex-1 h-1 mx-2 bg-indigo-600`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white`}>
                4
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-sm font-medium text-gray-700">Search Hotels</div>
          <div className="text-sm font-medium text-gray-700">Select Hotel</div>
          <div className="text-sm font-medium text-gray-700">Confirmation</div>
          {step >= 4 && (
            <div className="text-sm font-medium text-gray-700">Booking Complete</div>
          )}
        </div>
      </div>

      {/* Step 1: Search Form */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search for Hotels</h2>
          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <ProviderSelector
                  providers={HOTEL_PROVIDERS}
                  selectedProvider={selectedProvider}
                  onChange={handleProviderChange}
                />
              </div>

              <div className="md:col-span-2">
                <HotelLocationSearch
                  label="Destination"
                  placeholder="Where are you going?"
                  selectedLocation={formData.city}
                  onChange={handleCityChange}
                  error={errors.city}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                  <input
                    type="date"
                    name="checkIn"
                    value={formData.checkIn}
                    onChange={handleChange}
                  className={`block w-full border ${errors.checkIn ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                {errors.checkIn && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date
                </label>
                  <input
                    type="date"
                    name="checkOut"
                    value={formData.checkOut}
                    onChange={handleChange}
                  className={`block w-full border ${errors.checkOut ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  />
                {errors.checkOut && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
                )}
              </div>

              {/* Replace TravelersForm with Room Arrangement Summary & Button */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guests & Rooms
                </label>
                <div className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-indigo-500"
                     onClick={() => setIsRoomModalOpen(true)}
                >
                  <span className="text-sm text-gray-800 truncate pr-4">{getRoomSummary()}</span>
                  <PencilIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              {/* Filters Section */}
              <div className="md:col-span-2 border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Facilities
                      </label>
                      <FacilitiesSelector
                        selectedFacilities={formData.filterBy.facilities}
                        onChange={(newFacilities) => {
                          setFormData(prev => ({
                            ...prev,
                            filterBy: {
                              ...prev.filterBy,
                              facilities: newFacilities
                            }
                          }));
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Property Types
                      </label>
                      <input
                        type="text"
                        value={formData.filterBy.propertyTypes.join(', ')}
                        onChange={(e) => handleArrayChange(e, 'propertyTypes')}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Hotel, Hostel, Apartment"
                      />
                    </div>
              <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tags
                </label>
                      <input
                        type="text"
                        value={formData.filterBy.tags.join(', ')}
                        onChange={(e) => handleArrayChange(e, 'tags')}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Luxury, Beachfront, Business"
                      />
              </div>
            </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ratings
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingSelect(rating, 'ratings')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              formData.filterBy.ratings?.includes(rating)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Ratings
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRatingSelect(rating, 'reviewRatings')}
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              formData.filterBy.reviewRatings?.includes(rating)
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {rating}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                <div className="flex items-center">
                  <input
                          type="checkbox"
                    name="filterBy.freeBreakfast"
                    checked={formData.filterBy.freeBreakfast}
                    onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                        <label className="ml-2 block text-sm text-gray-900">
                    Free Breakfast
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                          type="checkbox"
                    name="filterBy.isRefundable"
                    checked={formData.filterBy.isRefundable}
                    onChange={handleChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                        <label className="ml-2 block text-sm text-gray-900">
                          Refundable
                  </label>
                      </div>
                    </div>
                  </div>
              </div>
            </div>

              <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                      <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                    Searching...
                  </>
                ) : (
                  'Search Hotels'
                )}
              </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Search Results */}
      {step === 2 && !showItineraryModal && (
        <div className="space-y-4">
          {/* Search Bar and Modify Search Button */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search hotels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Modify Search
            </button>
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            {searchResults.map((hotel) => (
              <HotelSearchResult
                key={hotel.id} 
                hotel={hotel}
                onSelect={() => handleHotelSelect(hotel)}
                isLoading={loadingHotels[hotel.id]}
              />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && !isLoading && (
            <button
              onClick={handleLoadMore}
              className="w-full py-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              Load More Hotels
            </button>
          )}
          {isLoading && (
            <div className="flex justify-center py-4">
              <ArrowPathIcon className="animate-spin h-6 w-6 text-blue-600" />
          </div>
          )}
        </div>
      )}

      {/* Hotel Details */}
      {showItineraryModal && itineraryData && (
        <HotelItineraryModal
          hotel={selectedHotel}
          itineraryData={itineraryData}
          onClose={handleItineraryModalClose}
          onSubmit={handleBookingSubmit}
        />
      )}

      {/* Confirmation Step */}
      {step === 3 && selectedHotel && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Booking Confirmation</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Hotel Details</h3>
            
            <div className="flex flex-col md:flex-row md:gap-6">
              <div className="md:w-1/3 h-48 bg-gray-200 mb-4 md:mb-0">
                <img 
                  src={selectedHotel.images[0]} 
                  alt={selectedHotel.name} 
                  className="w-full h-full object-cover rounded"
                />
              </div>
              
              <div className="md:w-2/3">
                <h4 className="text-xl font-bold">{selectedHotel.name}</h4>
                <p className="text-gray-600">{selectedHotel.address}</p>
                
                <div className="flex items-center mt-2">
                  {[...Array(selectedHotel.rating)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {selectedHotel.reviews.score} ({selectedHotel.reviews.count} reviews)
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{formData.checkIn}</p>
                    <p className="text-sm text-gray-500">After 2:00 PM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{formData.checkOut}</p>
                    <p className="text-sm text-gray-500">Before 12:00 PM</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Room Type</p>
                  <p className="font-medium">{selectedHotel.roomType}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Guest Details</h3>
            
            <p className="mb-2">
              <span className="font-medium">{formData.rooms[0].adults}</span> Adult{formData.rooms[0].adults > 1 ? 's' : ''}
            </p>
            
            <div className="flex items-center text-sm text-gray-500">
              <InformationCircleIcon className="h-5 w-5 mr-1 text-indigo-500" />
              Guest information will be collected at checkout
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Price Details</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Room Rate ({calculateNights(formData.checkIn, formData.checkOut)} nights)</p>
                <p>₹{selectedHotel.originalPrice.toLocaleString()}</p>
              </div>
              <div className="flex justify-between text-green-600">
                <p>Discount</p>
                <p>-₹{(selectedHotel.originalPrice - selectedHotel.price).toLocaleString()}</p>
              </div>
              <div className="flex justify-between">
                <p>Taxes & Fees</p>
                <p>Included</p>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                <p>Total Price</p>
                <p>₹{selectedHotel.price.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setStep(2)}
            >
              Back to Results
            </button>
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleBookHotel}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                'Confirm Booking'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Booking Complete Step */}
      {step === 4 && (
        <div>
          {renderBookingDetails()}
          
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              New Search
            </button>
          </div>
        </div>
      )}

      {/* Room Arrangement Modal */}
      <RoomArrangementModal 
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        initialRooms={formData.rooms}
        onSave={handleSaveRooms}
      />

      {/* Voucher Modal */}
      <BookingVoucherModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        voucherDetails={voucherDetails}
      />

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Hotel rates are per room and include applicable taxes and fees. 
          Cancellation policy varies by property. Please review all terms and conditions before confirming the booking.
        </p>
      </div>
    </div>
  );
};

// Helper function to calculate number of nights
function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export default HotelBookingPage;