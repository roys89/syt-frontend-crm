// src/pages/bookings/HotelBookingPage.js
import { ArrowPathIcon, ChevronDownIcon, InformationCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ConfigProvider, DatePicker } from 'antd';
import 'antd/dist/reset.css'; // Import Ant Design styles
import dayjs from 'dayjs';
import { Waveform } from 'ldrs/react';
import 'ldrs/react/Waveform.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import RoomArrangementModal from '../../components/booking/RoomArrangementModal';
import BookingVoucherModal from '../../components/hotels/BookingVoucherModal';
import HotelItineraryModal from '../../components/hotels/HotelItineraryModal';
import HotelLocationSearch from '../../components/hotels/HotelLocationSearch';
import CrmHotelFilterModal from '../../components/itinerary/modals/change/CrmHotelFilterModal';
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
        className="relative cursor-pointer rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-[#093923] focus:outline-none focus:ring-1 focus:ring-[#093923] sm:text-sm"
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
                className="h-4 w-4 text-[#093923] focus:ring-[#093923] border-gray-300 rounded"
              />
              <span className="ml-3 text-gray-700">{facility}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Simple currency formatter helper (copied)
const currencyFormatter = (amount, currencyCode = 'INR') => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return 'N/A';
    }
    const code = typeof currencyCode === 'string' && currencyCode.trim().length === 3 
                 ? currencyCode.trim().toUpperCase() 
                 : 'INR';
    try {
        return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: code,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    } catch (e) {
        console.error(`Currency formatting error: ${e.message}. Code used: ${code}, Original input: ${currencyCode}`);
        return `${code} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`; 
    }
};

// Hotel Card component (replaced with CrmAddHotelOptionCard definition)
const CrmAddHotelOptionCard = ({ hotel, onSelectHotel, isLoadingItinerary }) => {
    // Removed carousel state: const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const currentPrice = hotel?.availability?.rate?.finalRate ?? 0;
    const currency = hotel?.availability?.rate?.currency ?? 'INR';

    // --- Reverted: Get single image URL (prefer Xxl) ---
    const imageUrl = hotel?.images?.[0]?.links?.find(link => link.size === 'Xxl')?.url
                   ?? hotel?.heroImage // Fallback to heroImage
                   ?? '/img/placeholder.png'; // Fallback to placeholder
    // Removed logic to extract all imageUrls
    // --- END: Reverted Image URL logic ---

    const hotelName = hotel?.name ?? 'Hotel Name N/A';
    const starRating = hotel?.starRating;
    // Get complete address
    const address = hotel?.contact?.address || {};
    const addressLine1 = address.line1 || '';
    const addressLine2 = address.line2 || '';
    const city = address.city?.name || '';
    const state = address.state?.name || '';
    const country = address.country?.name || '';
    const postalCode = address.postalCode || '';
    
    // Combine address components into a formatted address
    const formattedAddress = [addressLine1, addressLine2]
        .filter(Boolean)
        .join(', ');
    
    const formattedLocation = [city, state, postalCode, country]
        .filter(Boolean)
        .join(', ');
    
    const review = hotel?.reviews?.[0]; // Get first review object
    const facilities = hotel?.facilities || [];
    
    // Additional details from the API response
    const chainName = hotel?.chainName;
    const hotelType = hotel?.type || hotel?.category;
    
    // Payment/Cancellation options
    const options = hotel?.availability?.options || {}; // Added optional chaining just in case
    const isFreeBreakfast = options.freeBreakfast;
    const isFreeCancellation = options.freeCancellation;
    const isPayAtHotel = options.payAtHotel;
    const isRefundable = options.refundable;

    // Simple check for key facilities
    const hasWifi = facilities.some(f => f.name?.toLowerCase().includes('wifi'));
    const hasPool = facilities.some(f => f.name?.toLowerCase().includes('pool'));
    const hasSpa = facilities.some(f => f.name?.toLowerCase().includes('spa'));
    const hasParking = facilities.some(f => f.name?.toLowerCase().includes('parking'));
    const hasRestaurant = facilities.some(f => f.name?.toLowerCase().includes('restaurant'));
    const hasGym = facilities.some(f => f.name?.toLowerCase().includes('fitness') || f.name?.toLowerCase().includes('gym'));
    const hasBeach = facilities.some(f => f.name?.toLowerCase().includes('beach'));
    
    // Create an array of available highlights
    const availableHighlights = [
        { key: 'wifi', condition: hasWifi, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>, text: 'WiFi' },
        { key: 'pool', condition: hasPool, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>, text: 'Pool' },
        { key: 'spa', condition: hasSpa, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>, text: 'Spa' },
        { key: 'gym', condition: hasGym, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>, text: 'Gym' },
        { key: 'restaurant', condition: hasRestaurant, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3zM19 9H5M19 15H5M12 3v18" /></svg>, text: 'Restaurant' },
        { key: 'parking', condition: hasParking, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a5.5 5.5 0 00-5.5 5.5c0 3.584 2.6 6.68 5.5 11 2.9-4.32 5.5-7.416 5.5-11A5.5 5.5 0 0012 2zm0 8.5a3 3 0 110-6 3 3 0 010 6z" /></svg>, text: 'Parking' }, // Example icon
        { key: 'breakfast', condition: isFreeBreakfast, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, text: 'Breakfast'}, // Example icon
        { key: 'beach', condition: hasBeach, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-[#093923] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-7 7 2 2-7 7 12-4 3-3-4-4 3-3-4zM3 12v8h18v-8" /></svg>, text: 'Beach'}, // Example icon
    ].filter(h => h.condition);

    const maxHighlightsToShow = 4;
    const highlightsToShow = availableHighlights.slice(0, maxHighlightsToShow);
    const remainingHighlightCount = availableHighlights.length - highlightsToShow.length;

    return (
        <div className="relative border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 bg-white cursor-pointer z-0"
             onClick={() => !isLoadingItinerary && onSelectHotel(hotel)}>
            
            {/* Loading Overlay */}
            {isLoadingItinerary && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-20">
                    <Waveform
                      size="45" // Slightly larger for visibility
                      stroke="3.5"
                      speed="1"
                      color="#093923"
                    />
                </div>
            )}
            
            {/* Main Grid: Image(4) + Content(6) + Price(2) = 12 */}
            <div className={`grid grid-cols-12 ${isLoadingItinerary ? 'opacity-50' : ''}`} style={{ minHeight: '180px' }}> {/* Optional: reduce opacity when loading */}
                {/* Image container - Reverted to single static image */}
                <div className="col-span-12 sm:col-span-4 h-48 sm:h-auto relative"> 
                 {/* Render single image */}
                 <img
                    src={imageUrl}
                    alt={hotelName}
                    className={`w-full h-full object-cover absolute inset-0`} // Removed transition/opacity classes
                    onError={(e) => { e.target.src = '/img/placeholder.png'; }}
                 />
                 {/* Removed image mapping logic */}
                    {chainName && (
                        <div className="absolute bottom-0 left-0 bg-black/70 text-white text-xs py-1 px-2 m-2 rounded z-10"> {/* Adjusted z-index */}
                            {chainName}
                        </div>
                    )}
                    {starRating && (
                        <div className="absolute top-0 right-0 bg-yellow-400/90 text-black font-semibold text-xs py-1 px-2 m-2 rounded z-10"> {/* Adjusted z-index */}
                            {starRating} ★
                        </div>
                    )}
                </div>
                
                {/* Content area - ADJUSTED to 6 columns (for Hotel Info + Highlights) */}
                <div className="col-span-12 sm:col-span-6 p-4">
                    {/* Inner Grid: Hotel Info(3) + Highlights(3) = 6 */}
                    <div className="grid grid-cols-6 gap-2 h-full">
                        {/* Hotel info - INCREASED to 4 columns */}
                        <div className="col-span-12 sm:col-span-4 overflow-hidden">
                            <div className="flex flex-col h-full">
                                {/* Hotel name and type - Removed truncate from h3 */}
                                <div>
                                    <h3 className="font-bold text-gray-800 text-base" title={hotelName}>
                                        {hotelName}
                                    </h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-600 flex-wrap">
                                        {hotelType && <span className="mr-2 bg-[#093923]/10 text-[#093923] px-2 py-0.5 rounded text-xs font-medium">{hotelType}</span>}
                                        {city && <span className="truncate">{city}</span>}
                                    </div>
                                </div>
                                
                                {/* Address */}
                                <div className="mt-1.5">
                                    {formattedAddress && (
                                        <p className="text-xs text-gray-600 truncate" title={formattedAddress}>
                                            {formattedAddress}
                                        </p>
                                    )}
                                    {formattedLocation && (
                                        <p className="text-xs text-gray-600 truncate" title={formattedLocation}>
                                            {formattedLocation}
                                        </p>
                                    )}
                                </div>
                                
                                {/* Reviews */}
                                {review && review.rating && (
                                    <div className="flex items-center mt-1.5 flex-wrap">
                                        <span className="bg-[#093923] text-white font-bold px-1.5 py-0.5 rounded text-xs mr-1">
                                            {parseFloat(review.rating).toFixed(1)}
                                        </span>
                                        <span className="text-xs font-medium text-gray-800 mr-1">
                                            {review.rating >= 4.5 ? 'Exceptional' : 
                                            review.rating >= 4.0 ? 'Excellent' : 
                                            review.rating >= 3.5 ? 'Very Good' : 
                                            review.rating >= 3.0 ? 'Good' : 'Average'}
                                        </span>
                                        {review.count && <span className="text-gray-500 text-xs">({review.count} reviews)</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Highlighted Amenities Column - takes 3 columns */}
                        <div className="hidden sm:block sm:col-span-2 border-l border-gray-200 pl-3">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Highlights</h4>
                            <ul className="space-y-1.5">
                                {highlightsToShow.map(highlight => (
                                    <li key={highlight.key} className="flex items-center text-xs text-gray-600">
                                        {highlight.icon}
                                        <span>{highlight.text}</span>
                                    </li>
                                ))}
                                {remainingHighlightCount > 0 && (
                                     <li className="flex items-center text-xs text-[#093923] font-medium mt-1.5">
                                         +{remainingHighlightCount} more
                                     </li>
                                )}
                            </ul>
            </div>
                    </div> {/* End Inner Grid */}
                </div> {/* End Content Area */}
                
                {/* Price & Book section - DECREASED to 2 columns, direct child of main grid */}
                <div className="col-span-12 sm:col-span-2 grid grid-cols-1 pt-3 sm:pt-0 mt-3 sm:mt-0 border-t sm:border-t-0 sm:border-l border-gray-200">
                    <div className="w-full flex flex-col justify-between h-full p-2 sm:p-3">
                        <div className="text-right mb-3">
                            <div className="font-bold text-[#093923] text-lg sm:text-xl">
                        {currencyFormatter(currentPrice, currency)}
                            </div>
                        </div>
                        
                        <div className="w-full">
                            <button 
                                className="bg-[#093923] hover:bg-[#093923]/90 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition-colors w-full"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isLoadingItinerary) {
                                      onSelectHotel(hotel);
                                    }
                                }}
                                disabled={isLoadingItinerary}
                            >
                                View Details
                            </button>
                            {isRefundable && (
                                <p className="text-xs text-green-600 mt-1 text-center">Refundable</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
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

  // Form state - Add initial filters
  const [formData, setFormData] = useState({
    provider: 'TC',
    checkIn: '',
    checkOut: '',
    city: null,
    nationality: 'IN',
    rooms: [{ adults: [30], children: [] }],
    filterBy: { // Keep this structure for consistency, but use it for initial filters
      ratings: [], // For star ratings
      facilities: [],
      freeBreakfast: false,
      isRefundable: false,
      // Add state for new initial filters
      reviewRatings: [], // e.g., [4, 5] for 4+
      type: '', // e.g., 'Hotel'
      tags: [] // e.g., ['Luxury', 'Beach']
    }
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Add loading state per hotel
  const [loadingHotels, setLoadingHotels] = useState({});

  // --- NEW: State from CrmChangeHotelPage ---
  const [serverFilters, setServerFilters] = useState({
      freeBreakfast: false, isRefundable: false, hotelName: '', ratings: [],
      facilities: [], reviewRatings: null, type: null, tags: null
  });
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [currentSort, setCurrentSort] = useState('relevance');
  const [maxPriceFilter, setMaxPriceFilter] = useState(null);
  const [isMaxPriceFilterActive, setIsMaxPriceFilterActive] = useState(false);
  const [selectedPricePointValue, setSelectedPricePointValue] = useState('max');
  const [filteredCount, setFilteredCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingRef = useRef(null);
  const fetchInitiatedRef = useRef(false);
  // --- END: New State ---

  // --- NEW: Add error state ---
  const [error, setError] = useState(null);

  // --- NEW: Helper to get the sort object --- 
  const getCurrentSortObject = (sortValue) => {
      const sortMapping = {
          'priceAsc': { finalRate: 'asc', label: 'Price: Low to High' },
          'priceDesc': { finalRate: 'desc', label: 'Price: High to Low' },
          'ratingDesc': { rating: 'desc', label: 'Rating: High to Low' },
          'nameAsc': { name: 'asc', label: 'Name: A to Z' },
          'relevance': { label: 'Relevance' }
      };
      return sortMapping[sortValue] || sortMapping['relevance'];
  };
  // --- END: Helper ---

  // --- Define Form/Helper Functions FIRST --- 
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

  const handleChange = (e) => {
    const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
  };

  const handleCityChange = (city) => {
    setFormData(prev => ({
      ...prev,
      city: city
    }));
  };

  const handleProviderChange = (provider) => {
    // setSelectedProvider(provider); // Removed as provider is in formData
    setFormData(prev => ({
      ...prev,
      provider
    }));
  };

  const handleSaveRooms = (updatedRooms) => {
    setFormData(prev => ({
      ...prev,
      rooms: updatedRooms
    }));
  };

  // --- NEW: Handlers for initial filters ---
  const handleInitialFilterChange = (filterName, value) => {
    setFormData(prev => ({
      ...prev,
      filterBy: {
        ...prev.filterBy,
        [filterName]: value
      }
    }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => {
      const currentRatings = prev.filterBy.ratings || [];
      const newRatings = currentRatings.includes(rating)
        ? currentRatings.filter(r => r !== rating)
        : [...currentRatings, rating];
      return {
        ...prev,
        filterBy: { ...prev.filterBy, ratings: newRatings.sort() }
      };
    });
  };

  // Handle review rating selection (toggle individual ratings)
  const handleReviewRatingChange = (rating) => {
    setFormData(prev => {
      const currentRatings = prev.filterBy.reviewRatings || [];
      const ratingNum = parseInt(rating, 10); // Ensure it's an integer
      const newRatings = currentRatings.includes(ratingNum)
        ? currentRatings.filter(r => r !== ratingNum) // Remove if exists
        : [...currentRatings, ratingNum]; // Add if doesn't exist
      
      return {
      ...prev,
        filterBy: { ...prev.filterBy, reviewRatings: newRatings.sort() }
      };
    });
  };

  // Handle tags input (comma-separated)
  const handleTagsChange = (event) => {
    const tagsArray = event.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    handleInitialFilterChange('tags', tagsArray);
  };
  // --- END: New Handlers ---

  const getRoomSummary = () => {
    const rooms = formData.rooms || [];
    if (rooms.length === 0) return 'No rooms configured';
    const totalGuests = rooms.reduce((acc, room) => acc + (room.adults ? room.adults.length : 0) + (room.children ? room.children.length : 0), 0);
    return `${rooms.length} Room${rooms.length !== 1 ? 's' : ''}, ${totalGuests} Guest${totalGuests !== 1 ? 's' : ''}`;
  };
  // --- END Form/Helper Functions ---

  // --- Define fetchHotels and loadMoreHotels --- 
  const fetchHotels = useCallback(async (pageNumber = 1, filters = null, sortBy = null, directMaxPrice = null) => {
       // Guard clause: Basic form validation
       if (!formData.city || !formData.checkIn || !formData.checkOut) {
            console.warn("HotelBookingPage: Skipping fetch - missing required form data (city, checkIn, checkOut).");
            // Potentially set an error state if needed
            return;
       }
       // Guard clause: Occupancy validation
       if (!formData.rooms || formData.rooms.some(room => !room.adults || room.adults.length < 1)) {
            console.warn("HotelBookingPage: Skipping fetch - invalid occupancy data.");
            setError("Invalid occupancy: Each room needs at least one adult.");
            setIsLoading(pageNumber === 1 ? false : true);
            setLoadingMore(false);
      return;
    }

        // Set loading states
        if (pageNumber === 1) {
            setIsLoading(true); // Use main loading state for initial search
            setSearchResults([]); // Clear results for new search/filter
            setCurrentPage(1);
            setHasMore(true);
            setTraceId(null); // Reset traceId
        } else {
            setLoadingMore(true);
        }
        setError(null);

        console.log(`HotelBookingPage: Fetching page ${pageNumber}... Filters:`, filters, `Sort:`, sortBy, `MaxPrice:`, directMaxPrice);

        try {
            // Prepare base search data from formData
      const searchData = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nationality: formData.nationality,
        occupancies: formData.rooms.map(room => ({
                    numOfAdults: room.adults.length,
                    childAges: room.children
        })),
        locationId: formData.city?.locationId,
                page: pageNumber,
                limit: 20, // Or your desired limit
                provider: formData.provider // Include provider
      };

      // Add hotelId if present (for Hotel type locations)
      if (formData.city?.hotelId) {
        searchData.hotelId = formData.city.hotelId;
      }

            // Add traceId for pagination
            if (pageNumber > 1 && traceId) {
                searchData.traceId = traceId;
            }

            // Add filterBy if filters are present
            if (filters && Object.keys(filters).length > 0) {
                 searchData.filterBy = filters; // Use the processed filters passed in
            }

            // Construct and add sortBy (including finalRate)
            let finalSortBy = {};
            const baseSortObject = sortBy || getCurrentSortObject(currentSort); // Use passed or current sort
            if (baseSortObject) {
                finalSortBy = { label: baseSortObject.label };
                const sortKeyMapping = {
                    'priceAsc': { finalRate: 'asc' }, 'priceDesc': { finalRate: 'desc' },
                    'ratingDesc': { rating: 'desc' }, 'nameAsc': { name: 'asc' }, 'relevance': {}
                };
                const apiSortKeys = sortKeyMapping[currentSort] || sortKeyMapping['relevance'];
                finalSortBy = { ...finalSortBy, ...apiSortKeys };

                const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : (isMaxPriceFilterActive ? maxPriceFilter : null);
                if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                }
            } else {
                finalSortBy = { label: 'Relevance' };
                const activeMaxPrice = directMaxPrice !== null ? directMaxPrice : (isMaxPriceFilterActive ? maxPriceFilter : null);
                 if (activeMaxPrice !== null && typeof activeMaxPrice === 'number' && !isNaN(activeMaxPrice)) {
                    finalSortBy.finalRate = activeMaxPrice;
                }
            }
            searchData.sortBy = finalSortBy;

            console.log("HotelBookingPage: Sending Search Request:", JSON.stringify(searchData, null, 2));

            // Call the service
      const response = await bookingService.searchHotels(searchData);

            console.log("HotelBookingPage: API Response:", response);

      if (!response.success) {
        throw new Error(response.message || 'Failed to search hotels');
      }

            // Process response data
            const resultData = response.data?.results?.[0];
            const newHotels = resultData?.data || [];
            const total = resultData?.totalCount || 0;
            const currentPg = resultData?.currentPage || pageNumber;
            const nextPg = resultData?.nextPage;
      const trace = response.data?.traceId;

            setSearchResults(prev => pageNumber === 1 ? newHotels : [...prev, ...newHotels]);
      setTotalCount(total);
            setCurrentPage(currentPg);
            setHasMore(!!nextPg);
            if (trace) setTraceId(trace);
            if (resultData?.filteredCount !== undefined) {
                setFilteredCount(resultData.filteredCount);
            } else if (total !== undefined) {
                setFilteredCount(total);
            }
            // Optionally update price range
            // if (pageNumber === 1) updatePriceRange(newHotels);

    } catch (error) {
            console.error('HotelBookingPage: Error fetching hotels:', error);
            toast.error(error.message || 'Failed to fetch hotels. Please try again.');
            setError(error.message);
            if (pageNumber === 1) setSearchResults([]);
            setHasMore(false);
    } finally {
            if (pageNumber === 1) {
      setIsLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
   // Update dependencies
   }, [formData, traceId, currentSort, isMaxPriceFilterActive, maxPriceFilter, getCurrentSortObject]);

   const loadMoreHotels = useCallback(() => {
       if (isLoading || loadingMore || !hasMore) return;
       console.log("HotelBookingPage: Loading more hotels...");
       const currentSortObject = getCurrentSortObject(currentSort);
       // Call fetchHotels with next page, current filters/sort state
       fetchHotels(currentPage + 1, serverFilters, currentSortObject, maxPriceFilter);
   }, [isLoading, loadingMore, hasMore, currentPage, fetchHotels, serverFilters, currentSort, maxPriceFilter, getCurrentSortObject]);
   // --- END fetchHotels/loadMoreHotels definition ---

   // --- NOW define Filter/Sort Handlers that DEPEND on fetchHotels ---
  const handleFilterChange = useCallback((type, value) => {
      console.log(`Filter change (type: ${type}) - skipping immediate update`);
  }, []);

  const handleServerFilterApply = useCallback((newFilters) => {
      console.log("Applying server filters to API request:", newFilters);
      const processedFilters = { ...newFilters };
      // Processing logic (ensure consistency with CrmChangeHotelPage)
       if ('freeBreakfast' in processedFilters) processedFilters.freeBreakfast = Boolean(processedFilters.freeBreakfast);
        if ('isRefundable' in processedFilters) processedFilters.isRefundable = Boolean(processedFilters.isRefundable);
        if (processedFilters.reviewRatings && Array.isArray(processedFilters.reviewRatings)) {
            processedFilters.reviewRatings = processedFilters.reviewRatings
                .map(r => Number(r))
                .filter(r => !isNaN(r) && r >= 1 && r <= 5);
            if (processedFilters.reviewRatings.length === 0) delete processedFilters.reviewRatings;
        }
        if ('type' in processedFilters && typeof processedFilters.type === 'string' && processedFilters.type.trim() !== '') {
            processedFilters.type = processedFilters.type.trim();
        } else { delete processedFilters.type; }
        if ('tags' in processedFilters && Array.isArray(processedFilters.tags) && processedFilters.tags.length > 0) {
            processedFilters.tags = processedFilters.tags.map(tag => String(tag).trim()).filter(tag => tag);
            if (processedFilters.tags.length === 0) delete processedFilters.tags;
        } else { delete processedFilters.tags; }
         if (!processedFilters.hotelName || processedFilters.hotelName.trim() === '') {
             delete processedFilters.hotelName;
        }
        if (processedFilters.ratings && Array.isArray(processedFilters.ratings)) {
            processedFilters.ratings = processedFilters.ratings.map(r => Number(r)).filter(r => !isNaN(r));
            if (processedFilters.ratings.length === 0) delete processedFilters.ratings;
        } else { delete processedFilters.ratings; }
        if (processedFilters.facilities && Array.isArray(processedFilters.facilities)) {
            processedFilters.facilities = processedFilters.facilities.map(f => String(f).trim()).filter(f => f);
            if (processedFilters.facilities.length === 0) delete processedFilters.facilities;
        } else { delete processedFilters.facilities; }

        let newMaxPrice = null;
        const originalPricePoint = processedFilters.finalRate;
        setSelectedPricePointValue(originalPricePoint === null ? 'max' : originalPricePoint);

        if (originalPricePoint !== null && typeof originalPricePoint === 'number' && !isNaN(originalPricePoint)) {
            const perNightPerAdultRate = originalPricePoint;
            const startDate = new Date(formData.checkIn); // Use formData dates
            const endDate = new Date(formData.checkOut);
            const numberOfNights = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
            let totalAdults = formData.rooms?.reduce((sum, room) => sum + (Array.isArray(room.adults) ? room.adults.length : 0), 0) || 1;
            totalAdults = Math.max(1, totalAdults);
            newMaxPrice = perNightPerAdultRate * numberOfNights * totalAdults;
        }
        delete processedFilters.finalRate;
        setMaxPriceFilter(newMaxPrice);
        setIsMaxPriceFilterActive(newMaxPrice !== null);
        
        setServerFilters(processedFilters);
        setCurrentPage(1);
        setHasMore(true);
        const currentSortObject = getCurrentSortObject(currentSort);
        
        // Call fetchHotels (to be defined) with page 1 and new filters
        fetchHotels(1, processedFilters, currentSortObject, newMaxPrice);

  }, [formData.checkIn, formData.checkOut, formData.rooms, fetchHotels, currentSort]);

  const handleSortChange = useCallback((sortValue) => {
      setCurrentSort(sortValue);
      const newSortObject = getCurrentSortObject(sortValue);
      setCurrentPage(1);
      setHasMore(true);
      // Call fetchHotels (to be defined) with page 1, current filters, new sort
      fetchHotels(1, serverFilters, newSortObject, maxPriceFilter);
  }, [serverFilters, maxPriceFilter, fetchHotels]);

  const handleFilterReset = useCallback(() => {
      const resetFilters = {
          freeBreakfast: false, isRefundable: false, hotelName: '', ratings: [],
          facilities: [], reviewRatings: null, type: null, tags: null
      };
      setServerFilters(resetFilters);
      setCurrentSort('relevance');
      setMaxPriceFilter(null);
      setIsMaxPriceFilterActive(false);
      setSelectedPricePointValue('max');
      setCurrentPage(1);
      setHasMore(true);
      const defaultSortObject = getCurrentSortObject('relevance');
      // Call fetchHotels (to be defined) with page 1, null filters, default sort
      fetchHotels(1, null, defaultSortObject, null);
  }, [fetchHotels]);
  // --- END: Filter/Sort Handlers ---

  // Handle booking - Restore original definition
  const handleBookHotel = async () => {
    try {
      setIsLoading(true);

      // Prepare booking data - Sending numOfAdults (consistent with search)
      const bookingData = {
        hotelId: selectedHotel.id,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        occupancies: formData.rooms.map(room => ({
           numOfAdults: room.adults.length,
           childAges: room.children
        })),
        // These might not be needed depending on the actual booking flow/API
        // roomType: selectedHotel.roomType, 
        // price: selectedHotel.price, 
        // Add other necessary booking details from itineraryData or elsewhere
      };

      // Call the hotel booking API (Original was commented out)
      // const response = await bookingService.bookHotel(bookingData); 

      // Placeholder success handling - replace with actual logic based on API response
      console.log("Simulating successful booking..."); 
      // TODO: Use the actual response to set booking details if needed
      // setBookingDetails(response.data); 
      toast.success('Hotel booked successfully! (Simulation)'); // Indicate simulation
      setStep(4); // Move to confirmation/complete step

    } catch (error) { 
      console.error('Error booking hotel:', error);
      toast.error('Failed to book hotel. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search submission - Now just validates and triggers initial fetch
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setIsLoading(true);
      setPage(1); // Reset page to 1 for new search

      // Clean up filterBy object to remove empty/null values AND empty strings
      const cleanFilterBy = Object.entries(formData.filterBy).reduce((acc, [key, value]) => {
        if (Array.isArray(value) && value.length === 0) return acc;
        if (Array.isArray(value) && value.every(item => item === null || item === '')) return acc;
        if (value === null || value === undefined) return acc;
        if (typeof value === 'string' && value.trim() === '') return acc; // <-- ADDED THIS CHECK
        acc[key] = value;
        return acc;
      }, {});

      // Prepare search data for the API - Sending numOfAdults (count)
      const searchData = {
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nationality: formData.nationality,
        // Calculate numOfAdults from array length, keep childAges
        occupancies: formData.rooms.map(room => ({
          numOfAdults: room.adults.length, // Send the count
          childAges: room.children // Keep child ages as is
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

      console.log("Initial Search Request:", JSON.stringify(searchData, null, 2)); // Added log for verification

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
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50"
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

  // --- NEW: Infinite Scroll useEffects --- 
    useEffect(() => {
        if (isLoading || searchResults.length === 0 || loadingMore || !hasMore) return;
        const options = { root: null, rootMargin: '300px', threshold: 0.1 };
        const observer = new IntersectionObserver((entries) => {
            if (entries[0]?.isIntersecting) {
                loadMoreHotels();
            }
        }, options);
        const currentLoadingRef = loadingRef.current;
        if (currentLoadingRef) observer.observe(currentLoadingRef);
        return () => {
            if (currentLoadingRef) observer.unobserve(currentLoadingRef);
            observer.disconnect();
        };
    }, [isLoading, loadingMore, hasMore, loadMoreHotels, searchResults.length]);

    useEffect(() => {
        if (isLoading || searchResults.length === 0 || loadingMore || !hasMore) return;
        const handleScroll = () => {
            if (isLoading || loadingMore || !hasMore) return;
            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            if (scrollTop + clientHeight >= scrollHeight - 300) {
                loadMoreHotels();
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [isLoading, loadingMore, hasMore, loadMoreHotels, searchResults.length]);
    // --- END: Infinite Scroll --- 

  // Add a handler for the date range picker
  const handleDateRangeChange = (dates, dateStrings) => {
    if (dates) {
      setFormData(prev => ({
        ...prev,
        checkIn: dateStrings[0],
        checkOut: dateStrings[1]
      }));
      // Clear date-related errors
      const newErrors = {...errors};
      delete newErrors.checkIn;
      delete newErrors.checkOut;
      setErrors(newErrors);
    } else {
      // When dates are cleared
      setFormData(prev => ({
        ...prev,
        checkIn: '',
        checkOut: ''
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Apply flex layout to the header div */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        {/* Wrap title and subtitle */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Hotel Booking</h1>
          <p className="mt-1 sm:mt-2 text-sm text-gray-600">
          Search and book hotels for your trip
        </p>
        </div>

        {/* --- Conditionally render Provider Selection Buttons (Right side) --- */}
        {step === 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h3 className="text-base font-medium text-gray-700">Select Provider:</h3>
            <div className="flex flex-wrap gap-2">
              {HOTEL_PROVIDERS.map((provider) => (
                <button
                  key={provider.value}
                  type="button"
                  onClick={() => handleProviderChange(provider.value)} 
                  className={`px-3 py-2 rounded-md border text-sm font-medium transition-colors duration-200 ${ 
                    formData.provider === provider.value
                      ? 'border-[#093923] bg-[#093923]/10 text-[#093923]' 
                      : 'border-gray-300 text-gray-700 hover:border-[#093923]/50 hover:bg-[#093923]/5'
                  }`}
                >
                  {provider.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* --- END: Provider Selection Buttons --- */}
        
        {/* Modify Search button (already conditional) */}
        {step === 2 && (
             <button
               onClick={() => setStep(1)}
               className="mt-2 sm:mt-0 w-full sm:w-auto px-4 py-2 text-sm text-[#093923] hover:text-[#093923] font-medium border border-[#093923] rounded-md hover:bg-[#093923]/10 transition-colors"
             >
               Modify Search
             </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8 overflow-x-auto">
        <div className="min-w-max flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${step >= 1 ? 'bg-[#093923] text-white' : 'bg-gray-200 text-gray-600'}`}>
            1
          </div>
          <div className={`flex-1 h-1 mx-1 sm:mx-2 ${step >= 2 ? 'bg-[#093923]' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${step >= 2 ? 'bg-[#093923] text-white' : 'bg-gray-200 text-gray-600'}`}>
            2
          </div>
          <div className={`flex-1 h-1 mx-1 sm:mx-2 ${step >= 3 ? 'bg-[#093923]' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full ${step >= 3 ? 'bg-[#093923] text-white' : 'bg-gray-200 text-gray-600'}`}>
            3
          </div>
          {step >= 4 && (
            <>
              <div className={`flex-1 h-1 mx-1 sm:mx-2 bg-[#093923]`}></div>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#093923] text-white`}>
                4
              </div>
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm">
          <div className="font-medium text-gray-700">Search</div>
          <div className="font-medium text-gray-700">Select</div>
          <div className="font-medium text-gray-700">Confirm</div>
          {step >= 4 && (
            <div className="font-medium text-gray-700">Complete</div>
          )}
        </div>
      </div>

      {/* Step 1: Search Form */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Search for Hotels</h2>
          <form onSubmit={handleSearch} className="space-y-6 sm:space-y-8">
            {/* Corrected grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

              {/* --- Left Column --- */}
              <div className="space-y-4 sm:space-y-6">
                {/* Destination */}
                <div>
                <HotelLocationSearch
                  label="Destination"
                  placeholder="Where are you going?"
                  selectedLocation={formData.city}
                  onChange={handleCityChange}
                  error={errors.city}
                />
              </div>
                {/* Dates Side-by-Side (Moved to Left) */}
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                      Check-in / Check-out
                </label>
                <ConfigProvider
                  theme={{
                    token: {
                      colorPrimary: '#093923', // Main theme green
                    },
                    components: {
                      DatePicker: {
                        cellActiveWithRangeBg: '#13804e26', // Selected range background (#13804e with 15% opacity)
                        cellHoverWithRangeBg: '#0939231A', // Hover background within range (theme green with 10% opacity)
                        // Optional: Adjust other colors if needed
                        // colorPrimary: '#093923', // Explicitly set primary color for the component
                      },
                    },
                  }}
                >
                  <DatePicker.RangePicker 
                    className="w-full rounded-md border-gray-300"
                    format="YYYY-MM-DD"
                    onChange={handleDateRangeChange}
                    value={[
                      formData.checkIn ? dayjs(formData.checkIn) : null,
                      formData.checkOut ? dayjs(formData.checkOut) : null
                    ]}
                    disabledDate={current => current && current < dayjs().startOf('day')}
                    placeholder={['Check-in', 'Check-out']}
                    allowClear={true}
                    size="large"
                    style={{height: '42px'}}
                    popupClassName="custom-hotel-datepicker-dropdown"
                    getPopupContainer={triggerNode => triggerNode.parentNode} // Render popup near the input
                  />
                </ConfigProvider>
                {errors.checkIn && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkIn}</p>
                )}
                {errors.checkOut && !errors.checkIn && (
                  <p className="mt-1 text-sm text-red-600">{errors.checkOut}</p>
                )}
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Guests & Rooms
                </label>
                  <div 
                    className="flex items-center justify-between p-3 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-[#093923]" 
                     onClick={() => setIsRoomModalOpen(true)}
                >
                  <span className="text-sm text-gray-800 truncate pr-4">{getRoomSummary()}</span>
                  <PencilIcon className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

              {/* --- Right Column (Now only Filters) --- */}
                  <div className="space-y-4 sm:space-y-6">
                {/* Initial Filters Section */}
                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Filters (Optional)
                      </label>
                  <div className="space-y-4">
                    {/* --- NEW: Row 1: Star Rating & User Rating --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Star Rating */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Star Rating</label>
                        <div className="flex space-x-1.5">
                          {[5, 4, 3, 2, 1].map(star => (
                          <button
                              key={star}
                            type="button"
                              onClick={() => handleRatingChange(star)}
                              className={`flex-1 px-2 py-1.5 border rounded-md text-xs font-medium transition-colors touch-manipulation ${ 
                                formData.filterBy.ratings.includes(star)
                                  ? 'bg-yellow-50 border-yellow-400 text-yellow-700 shadow-sm' 
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {star} <span className="text-yellow-500">★</span>
                          </button>
                        ))}
                      </div>
                    </div>
                      {/* User Rating */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">User Rating</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[5, 4, 3, 2, 1].map(rating => {
                            const isSelected = formData.filterBy.reviewRatings.includes(rating);
                            return (
                          <button
                            key={rating}
                            type="button"
                                onClick={() => handleReviewRatingChange(rating)}
                                className={`flex-1 min-w-[40px] px-2 py-1.5 border rounded-md text-xs font-medium transition-colors touch-manipulation ${ 
                                  isSelected
                                    ? 'bg-green-50 border-[#093923] text-[#093923] shadow-sm' 
                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                                title={
                                  rating === 5 ? "Exceptional" :
                                  rating === 4 ? "Excellent" :
                                  rating === 3 ? "Good" :
                                  rating === 2 ? "Fair" : "Poor"
                                }
                              >
                                {rating} <span className="text-[#093923]">★</span>
                          </button>
                            );
                          })}
                      </div>
                    </div>
                    </div>
                    
                    {/* --- Row 2: Facilities --- */}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Facilities</label>
                      <FacilitiesSelector 
                        selectedFacilities={formData.filterBy.facilities}
                        onChange={(value) => handleInitialFilterChange('facilities', value)}
                      />
                    </div>
                    
                    {/* --- Row 3: Checkboxes --- */}
                    <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <input
                          id="initialFreeBreakfast"
                          name="freeBreakfast"
                          type="checkbox"
                    checked={formData.filterBy.freeBreakfast}
                          onChange={(e) => handleInitialFilterChange('freeBreakfast', e.target.checked)}
                          className="h-5 w-5 text-[#093923] focus:ring-[#093923] border-gray-300 rounded"
                  />
                        <label htmlFor="initialFreeBreakfast" className="ml-2 block text-sm text-gray-700">
                    Free Breakfast
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                          id="initialIsRefundable"
                          name="isRefundable"
                          type="checkbox"
                    checked={formData.filterBy.isRefundable}
                          onChange={(e) => handleInitialFilterChange('isRefundable', e.target.checked)}
                          className="h-5 w-5 text-[#093923] focus:ring-[#093923] border-gray-300 rounded"
                  />
                        <label htmlFor="initialIsRefundable" className="ml-2 block text-sm text-gray-700">
                          Refundable Only
                  </label>
                      </div>
                    </div>
                    
                    {/* --- NEW: Row 4: Property Type & Tags --- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Property Type */}
                      <div>
                        <label htmlFor="initialPropertyType" className="block text-xs font-medium text-gray-500 mb-1">Property Type</label>
                        <input
                          type="text"
                          id="initialPropertyType"
                          name="type"
                          value={formData.filterBy.type}
                          onChange={(e) => handleInitialFilterChange('type', e.target.value)}
                          placeholder="e.g., Hotel, Resort" 
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-xs"
                        />
                      </div>
                      {/* Tags */}
                      <div>
                        <label htmlFor="initialTags" className="block text-xs font-medium text-gray-500 mb-1">Tags</label>
                        <input
                          type="text"
                          id="initialTags"
                          name="tags"
                          value={formData.filterBy.tags.join(', ')}
                          onChange={handleTagsChange}
                          placeholder="e.g., Luxury, Beach" 
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2.5 px-3 focus:outline-none focus:ring-[#093923] focus:border-[#093923] sm:text-xs"
                        />
                      </div>
                    </div>
                  </div>
              </div>
            </div>

              {/* --- Search Button (Spanning Both Columns) --- */}
              <div className="md:col-span-2 flex justify-end mt-6">
              <button
                type="submit"
                disabled={isLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 border border-transparent text-base sm:text-sm font-medium rounded-md shadow-sm text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50"
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

      {/* Step 2: Results (New Layout with Filter) */}
      {step === 2 && !showItineraryModal && (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Sidebar with Filter */}
          <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 sticky top-0">
            <CrmHotelFilterModal
              initialFilters={{
                search: serverFilters.hotelName || '',
                price: [priceRange.min, serverFilters.finalRate ?? priceRange.max], 
                starRating: serverFilters.ratings || [],
                amenities: [], // Map if needed
                reviewRatingsSelected: serverFilters.reviewRatings || [],
                serverFilters: serverFilters
              }}
              priceRange={priceRange}
              currentSort={currentSort}
              currentPricePoint={selectedPricePointValue}
              onFilterChange={handleFilterChange}
              onSortChange={handleSortChange}
              onServerFilterApply={handleServerFilterApply}
              onFilterReset={handleFilterReset}
              totalCount={totalCount}
              filteredCount={filteredCount}
              isServerFiltering={true}
            />
          </aside>
          
          {/* Right Content Area (Results) */}
          <main className="flex-1 flex flex-col">
            {/* Loading state for initial results (page 1) */}
            {isLoading && currentPage === 1 && (
              <div className="text-center py-10">
                <p className="text-gray-600">Loading hotels...</p>
            </div>
            )}
            {error && !loadingMore && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
          </div>
            )}
          
            {/* Results Grid - Use searchResults state */}
            {!isLoading && searchResults.length > 0 && (
              <div className="grid grid-cols-1 gap-4 mb-6">
            {searchResults.map((hotel) => (
                  <CrmAddHotelOptionCard
                key={hotel.id} 
                hotel={hotel}
                    onSelectHotel={() => handleHotelSelect(hotel)}
                    isLoadingItinerary={!!loadingHotels[hotel.id]}
              />
            ))}
          </div>
            )}

            {/* No Results */}
            {!isLoading && !error && searchResults.length === 0 && (
              <p className="text-center text-gray-500 mt-10">No hotels found matching your criteria.</p>
            )}

            {/* Infinite Scroll Loader */}
            {!isLoading && (
              <div ref={loadingRef} className="py-8 text-center" style={{ minHeight: '100px' }} id="scroll-loader">
                {loadingMore ? (
                  <div className="flex flex-col items-center">
                    <Waveform
                      size="45" 
                      stroke="3.5"
                      speed="1"
                      color="#093923"
                    />
                    <p className="text-sm text-gray-500 mt-2">Loading more...</p>
                  </div>
                ) : !hasMore && searchResults.length > 0 ? (
                  <p className="text-center text-gray-500 py-2 text-sm">You've reached the end.</p>
                ) : hasMore && searchResults.length > 0 ? (
                  <p className="text-gray-400 text-xs">Scroll for more</p>
                ) : null}
          </div>
          )}
          </main>
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
              <span className="font-medium">{formData.rooms[0].adults.length}</span> Adult{formData.rooms[0].adults.length > 1 ? 's' : ''}
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
              className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
              onClick={() => setStep(2)}
            >
              Back to Results
            </button>
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
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