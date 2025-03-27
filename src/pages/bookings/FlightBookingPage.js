// src/pages/bookings/FlightBookingPage.js
import { ArrowLongRightIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
import ProviderSelector from '../../components/common/ProviderSelector';
import TravelersForm from '../../components/common/TravelersForm';
import FlightBookingVoucherModal from '../../components/flights/FlightBookingVoucherModal';
import FlightFilters from '../../components/flights/FlightFilters';
import FlightItineraryModal from '../../components/flights/FlightItineraryModal';
import FlightSearchResults, { FlightSummaryPanel } from '../../components/flights/FlightSearchResults';
import bookingService, { FLIGHT_PROVIDERS } from '../../services/bookingService';

// Helper functions (same as in FlightSearchResults.js)
const formatDuration = (duration) => {
  if (!duration) return 'N/A';
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
};

// Format time helper (same as in FlightSearchResults.js)
const formatTime = (timeStr) => {
  if (!timeStr) return 'N/A';
  try {
    return format(new Date(timeStr), 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', error, timeStr);
    return 'Invalid time';
  }
};

const FlightBookingPage = () => {
  const navigate = useNavigate();
  const autoLoadRef = useRef(true);
  
  // State variables
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [itineraryDetails, setItineraryDetails] = useState(null);
  const [fareRules, setFareRules] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [traceId, setTraceId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('TC'); // Default provider
  const [isRoundTrip, setIsRoundTrip] = useState(false); // Add isRoundTrip state
  const [bookingDetails, setBookingDetails] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [voucherDetails, setVoucherDetails] = useState(null);
  const [isLoadingVoucher, setIsLoadingVoucher] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    provider: 'TC',
    origin: { name: '', code: '', city: '', country: '' },
    destination: { name: '', code: '', city: '', country: '' },
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    isRoundTrip: false,
    travelersDetails: {
      rooms: [{
        adults: 1,
        children: [],
        infants: 0
      }]
    },
    cabinClass: 1
  });

  // Form validation
  const [errors, setErrors] = useState({});

  // Add error state for general errors
  const [error, setError] = useState(null);

  // State for all loaded flights
  const [allFlights, setAllFlights] = useState([]);
  
  // State for filtered flights
  const [filteredFlights, setFilteredFlights] = useState([]);
  
  // State for visible flights (pagination)
  const [visibleCount, setVisibleCount] = useState(100);
  
  // State for filtering
  const [activeFilters, setActiveFilters] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: [0, 100000],
    airlines: [],
    stops: null
  });
  
  // State for filter metadata
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [availableAirlines, setAvailableAirlines] = useState([]);
  const [stopCounts, setStopCounts] = useState({});

  // Add additional state variables
  const [outboundFlights, setOutboundFlights] = useState([]);
  const [inboundFlights, setInboundFlights] = useState([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [selectedInboundFlight, setSelectedInboundFlight] = useState(null);
  const [isDomesticRoundTrip, setIsDomesticRoundTrip] = useState(false);
  const [showInboundSelection, setShowInboundSelection] = useState(false);

  // Add state for tab
  const [activeTab, setActiveTab] = useState('outbound');

  // Add state to determine flight structure type
  const [flightStructureType, setFlightStructureType] = useState('ONE_WAY');  // 'ONE_WAY', 'INTERNATIONAL_ROUND_TRIP', or 'DOMESTIC_ROUND_TRIP'

  // New state for international round trip inbound option
  const [selectedInboundOptionIndex, setSelectedInboundOptionIndex] = useState(null);

  // New state variables for automatic loading
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [allChunksLoaded, setAllChunksLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCancellingLoad, setIsCancellingLoad] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.origin) newErrors.origin = 'Origin is required';
    if (!formData.destination) newErrors.destination = 'Destination is required';
    if (!formData.departureDate) newErrors.departureDate = 'Departure date is required';
    
    // Validate children's ages
    if (formData.travelersDetails.rooms[0].children.length > 0) {
      const hasEmptyAges = formData.travelersDetails.rooms[0].children.some(age => !age);
      if (hasEmptyAges) {
        newErrors.children = 'Please specify age for all children';
      }
    }
    
    // Ensure origin and destination are different
    if (formData.origin && formData.destination && 
        formData.origin.code === formData.destination.code) {
      newErrors.destination = 'Origin and destination cannot be the same';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle travelers details change
  const handleTravelersChange = (newTravelers) => {
    setFormData(prev => ({
      ...prev,
      travelersDetails: newTravelers
    }));
  };

  // Handle origin selection
  const handleOriginChange = (airport) => {
    setFormData(prev => ({
      ...prev,
      origin: airport
    }));
  };

  // Handle destination selection
  const handleDestinationChange = (airport) => {
    setFormData(prev => ({
      ...prev,
      destination: airport
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

  // Handle cabin class change
  const handleCabinClassChange = (value) => {
    setFormData(prev => ({
      ...prev,
      cabinClass: value
    }));
  };

  // Handle round trip toggle
  const handleRoundTripToggle = (e) => {
    const isRoundTrip = e.target.checked;
    setFormData(prev => ({
      ...prev,
      isRoundTrip,
      returnDate: isRoundTrip ? prev.returnDate : '',
      returnTime: isRoundTrip ? prev.returnTime : ''
    }));
  };

  // Function to cancel auto-loading
  const cancelAutoLoading = () => {
    autoLoadRef.current = false;
    setIsCancellingLoad(true);
    setTimeout(() => {
      setIsCancellingLoad(false);
    }, 300);
  };

  // Function to reset auto-loading
  const resetAutoLoad = () => {
    autoLoadRef.current = true;
    setAllChunksLoaded(false);
    setCurrentChunkIndex(0);
  };

  // Reset search states
  const resetSearchState = () => {
    setAllFlights([]);
    setFilteredFlights([]);
    setOutboundFlights([]);
    setInboundFlights([]);
    setSearchResults(null);
    setActiveFilters(null);
    setVisibleCount(100);
    setSelectedOutboundFlight(null);
    setSelectedInboundFlight(null);
    setSelectedInboundOptionIndex(null);
    setShowInboundSelection(false);
    setActiveTab('outbound');
    setCurrentChunkIndex(0);
    setAllChunksLoaded(false);
    setLoadingProgress(0);
    resetAutoLoad();
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
      resetSearchState();
      
      // Initial search for first batch of flights
      await loadFlightChunk(0, []);
      
      // Set step to results view
      setStep(2);
    } catch (error) {
      console.error('Error searching flights:', error);
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          headers: error.response.headers,
          data: error.response.data
        });
        toast.error(`Error ${error.response.status}: ${error.response.data?.message || 'Unknown server error'}`);
      } else if (error.request) {
        console.error('Error request (no response received):', error.request);
        toast.error('No response from server. Please check your connection and try again.');
      } else {
        console.error('Error details:', error.message);
        toast.error(error.message || 'Failed to search flights. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced loadFlightChunk function with auto-loading capability
  const loadFlightChunk = async (chunkIndex, previousFlights = []) => {
    try {
      // Skip if we're cancelling or filtering
      if (!autoLoadRef.current || isFiltering) {
        return;
      }

      setIsLoadingMore(chunkIndex > 0); // Only show loading indicator for subsequent chunks
      
      // Prepare search data for the API
      const searchData = {
        provider: formData.provider,
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        returnDate: formData.returnDate,
        returnTime: formData.returnTime,
        isRoundTrip: formData.isRoundTrip,
        travelersDetails: formData.travelersDetails,
        cabinClass: formData.cabinClass,
        chunkIndex: chunkIndex,
        chunkSize: 100  // Changed from 20 to 100
      };
      
      console.log('Form Data:', formData);
      console.log('Search Data being sent:', searchData);
      
      // Call the flight search API
      const response = await bookingService.searchFlights(searchData);
      
      console.log(`Chunk ${chunkIndex} response:`, response);
      
      if (!response || !response.success) {
        throw new Error(response?.message || 'Invalid response from flight search API');
      }
      
      // Update current chunk index
      setCurrentChunkIndex(chunkIndex);
      
      // Check for domestic round trip structure (direct structure from server)
      if (response.data && response.data.outboundFlights && response.data.inboundFlights) {
        // Domestic round trip structure
        console.log('Detected DOMESTIC_ROUND_TRIP structure with separate outboundFlights and inboundFlights arrays');
        setFlightStructureType('DOMESTIC_ROUND_TRIP');
        setIsDomesticRoundTrip(true);
        
        // Get the original flight arrays
        const outboundFlights = response.data.outboundFlights || [];
        const inboundFlights = response.data.inboundFlights || [];
        
        console.log('Original outbound flights:', outboundFlights.length);
        console.log('Original inbound flights:', inboundFlights.length);
        
        // Combine with any previous flights if we're paginating
        if (chunkIndex > 0) {
          setOutboundFlights(prev => [...prev, ...outboundFlights]);
          setInboundFlights(prev => [...prev, ...inboundFlights]);
        } else {
          setOutboundFlights(outboundFlights);
          setInboundFlights(inboundFlights);
        }
        
        // Show outbound flights first
        setActiveTab('outbound');
        setFilteredFlights(activeTab === 'outbound' ? 
          (chunkIndex > 0 ? [...outboundFlights, ...outboundFlights] : outboundFlights) : 
          (chunkIndex > 0 ? [...inboundFlights, ...inboundFlights] : inboundFlights));
        
        setPagination(response.data.pagination);
        setTraceId(response.data.traceId);
        setIsRoundTrip(true);
        
        // Update loading progress
        const totalFlights = response.data.pagination.total.outbound + response.data.pagination.total.inbound;
        const loadedFlights = outboundFlights.length + inboundFlights.length;
        setLoadingProgress(Math.min(100, Math.floor((loadedFlights / totalFlights) * 100)));
        
        // Check if we should load more 
        const hasMoreOutbound = outboundFlights.length < response.data.pagination.total.outbound;
        const hasMoreInbound = inboundFlights.length < response.data.pagination.total.inbound;
        
        if ((hasMoreOutbound || hasMoreInbound) && autoLoadRef.current && !isFiltering) {
          // Delay to prevent UI freeze
          setTimeout(() => {
            loadFlightChunk(chunkIndex + 1, []);
          }, 300);
        } else {
          setAllChunksLoaded(true);
        }
      } 
      else if (formData.isRoundTrip && response.data.flights && response.data.flights.length > 0 && 
               (response.data.flights[0].outboundSegments || response.data.flights[0].outboundFlight)) {
        // International round trip structure
        console.log('Detected INTERNATIONAL_ROUND_TRIP structure with outboundSegments and inboundOptions');
        setFlightStructureType('INTERNATIONAL_ROUND_TRIP');
        
        const newFlights = response.data.flights;
        const combinedFlights = [...previousFlights, ...newFlights];
        setAllFlights(combinedFlights);
        setFilteredFlights(combinedFlights);
        setPagination(response.data.pagination);
        setTraceId(response.data.traceId);
        setIsRoundTrip(true);
        
        // Apply filters
        if (activeFilters) {
          applyFlightFilters(activeFilters, combinedFlights, 'INTERNATIONAL_ROUND_TRIP');
        }
        
        // Update loading progress
        if (response.data.pagination.total) {
          setLoadingProgress(Math.min(100, Math.floor((combinedFlights.length / response.data.pagination.total) * 100)));
        }
        
        // Check if we should load more
        if (response.data.pagination.hasMore && autoLoadRef.current && !isFiltering) {
          // Delay to prevent UI freeze and allow rendering
          setTimeout(() => {
            loadFlightChunk(chunkIndex + 1, combinedFlights);
          }, 300);
        } else {
          setAllChunksLoaded(true);
        }
      } 
      else if (response.data.flights) {
        // One-way structure
        console.log('Detected ONE_WAY structure with segments array');
        setFlightStructureType('ONE_WAY');
        
        const newFlights = response.data.flights;
        const combinedFlights = [...previousFlights, ...newFlights];
        setAllFlights(combinedFlights);
        setFilteredFlights(combinedFlights);
        setPagination(response.data.pagination);
        setTraceId(response.data.traceId);
        setIsRoundTrip(false);
        
        // Apply filters
        if (activeFilters) {
          applyFlightFilters(activeFilters, combinedFlights, 'ONE_WAY');
        }
        
        // Update loading progress
        if (response.data.pagination.total) {
          setLoadingProgress(Math.min(100, Math.floor((combinedFlights.length / response.data.pagination.total) * 100)));
        }
        
        // Check if we should load more
        if (response.data.pagination.hasMore && autoLoadRef.current && !isFiltering) {
          // Delay to prevent UI freeze
          setTimeout(() => {
            loadFlightChunk(chunkIndex + 1, combinedFlights);
          }, 300);
        } else {
          setAllChunksLoaded(true);
        }
      }
      else {
        console.error('Unknown flight data structure:', response.data);
        setError('Invalid flight data structure returned from server');
        setAllChunksLoaded(true);
      }
      
      // Update trace ID for later use
      const chunkTraceId = response.data.traceId;
      if (chunkTraceId) {
        setTraceId(chunkTraceId);
      }
      
      // Update filter metadata
      if (response.data.priceRange) {
        setPriceRange(response.data.priceRange);
      }
      if (response.data.availableFilters?.airlines) {
        setAvailableAirlines(response.data.availableFilters.airlines);
      }
      if (response.data.availableFilters?.stopCounts) {
        setStopCounts(response.data.availableFilters.stopCounts);
      }
      
    } catch (error) {
      console.error('Error loading flight chunk:', error);
      setAllChunksLoaded(true);
      throw error;
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle manual loading of more flights
  const handleLoadMore = () => {
    if (allChunksLoaded || isLoadingMore) return;
    
    // Reset auto-load capability
    autoLoadRef.current = true;
    
    // Load the next chunk
    loadFlightChunk(currentChunkIndex + 1, allFlights);
  };

  // Handle flight selection based on structure type
  const handleSelectFlight = (flight) => {
    switch (flightStructureType) {
      case 'DOMESTIC_ROUND_TRIP':
        if (activeTab === 'outbound') {
          // First step: selecting outbound flight
          setSelectedOutboundFlight(flight);
          // Switch to inbound tab automatically
          setActiveTab('inbound');
        } else {
          // Second step: selecting inbound flight
          setSelectedInboundFlight(flight);
        }
        break;
        
      case 'INTERNATIONAL_ROUND_TRIP':
        // For international round trips, selectedFlight refers to the outbound
        // The inbound is tracked with selectedInboundOptionIndex
        setSelectedOutboundFlight(flight);
        setSelectedInboundOptionIndex(0); // Default to first inbound option
        break;
        
      case 'ONE_WAY':
      default:
        // Handle one-way selection
        setSelectedOutboundFlight(flight);
        break;
    }
  };

  // Handle inbound option selection for international round trips
  const handleSelectInboundOption = (index) => {
    setSelectedInboundOptionIndex(index);
  };

  // Handle create itinerary button
  const handleCreateItinerary = async () => {
    setIsLoading(true);
    
    try {
      // Prepare itinerary data based on flight structure type
      let itineraryData = {
        items: [],
        traceId,
        flightType: flightStructureType
      };

      switch (flightStructureType) {
        case 'DOMESTIC_ROUND_TRIP':
          // For domestic round trips, add both outbound and inbound flights
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedOutboundFlight.resultIndex,
              flightType: 'OUTBOUND'
            },
            {
              type: 'FLIGHT',
              resultIndex: selectedInboundFlight.resultIndex,
              flightType: 'INBOUND'
            }
          ];
          break;

        case 'INTERNATIONAL_ROUND_TRIP':
          // For international round trips, send the resultIndex of the selected inbound option
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex].resultIndex
            }
          ];
          break;

        case 'ONE_WAY':
        default:
          // For one-way flights
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedOutboundFlight.resultIndex
            }
          ];
          break;
      }

      console.log('Creating itinerary with data:', itineraryData);

      // Call the createFlightItinerary service
      const response = await bookingService.createFlightItinerary({
        provider: selectedProvider,
        ...itineraryData
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to create itinerary');
      }

      // Set the itinerary details for the modal
      setItineraryDetails(response.data);
      
      // Move to the next step
      setStep(3);
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast.error(error.message || 'Failed to create itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle booking
  const handleBookFlight = async () => {
    setIsLoading(true);
    
    try {
      // Validate traveler details
      const hasEmptyAges = formData.travelersDetails.rooms[0].children.some(age => !age);
      if (hasEmptyAges) {
        toast.error('Please specify age for all children');
        return;
      }
      
      // Prepare booking data
      const bookingData = {
        provider: formData.provider,
        flightId: selectedFlight.id,
        origin: formData.origin,
        destination: formData.destination,
        departureDate: formData.departureDate,
        travelers: formData.travelersDetails,
        price: selectedFlight.price,
        airline: selectedFlight.airline,
        flightNumber: selectedFlight.flightNumber,
        departureTime: formData.departureTime,
        arrivalTime: selectedFlight.arrivalTime,
        duration: selectedFlight.duration,
        aircraft: selectedFlight.aircraft,
        cabinClass: selectedFlight.cabinClass
      };
      
      // Call the flight booking API
      const response = await bookingService.bookFlight(bookingData);
      
      if (!response || !response.success) {
        throw new Error('Booking failed');
      }
      
      // Show success message
      toast.success('Flight booked successfully!');
      
      // Redirect to bookings page
      navigate('/bookings');
    } catch (error) {
      console.error('Error booking flight:', error);
      toast.error(error.response?.data?.message || 'Failed to book flight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters function (update to handle different structures)
  const applyFlightFilters = (filters, flightsToFilter = allFlights, structureType = flightStructureType) => {
    setIsFiltering(true);
    
    try {
      // Cancel any ongoing auto-loading when filtering
      cancelAutoLoading();
      
      // If filters is null, reset to show all flights
      if (!filters) {
        setActiveFilters(null);
        
        if (structureType === 'DOMESTIC_ROUND_TRIP') {
          // Just keep the original outbound/inbound flights
          setFilteredFlights(activeTab === 'outbound' ? outboundFlights : inboundFlights);
        } else {
          // For other types, use allFlights
          setFilteredFlights(flightsToFilter);
        }
        
        setVisibleCount(100);
        setIsFiltering(false);
        return;
      }
      
      // Store active filters
      setActiveFilters(filters);
      
      let filtered = [];
      
      // Apply structure-specific filtering
      switch (structureType) {
        case 'DOMESTIC_ROUND_TRIP':
          // For domestic round trips, filter current tab flights
          filtered = (activeTab === 'outbound' ? outboundFlights : inboundFlights).slice();
          break;
          
        case 'INTERNATIONAL_ROUND_TRIP':
        case 'ONE_WAY':
        default:
          // For other flight types
          filtered = flightsToFilter.slice();
          break;
      }
      
      // Apply price filter
      if (filters.price) {
        filtered = filtered.filter(flight => {
          const price = flight.price?.amount || 0;
          return price >= filters.price.min && price <= filters.price.max;
        });
      }
      
      // Apply airline filter
      if (filters.airlines && filters.airlines.length > 0) {
        filtered = filtered.filter(flight => {
          // For domestic flights
          if (structureType === 'DOMESTIC_ROUND_TRIP' || structureType === 'ONE_WAY') {
            if (flight.segments && flight.segments.length > 0) {
              return filters.airlines.includes(flight.segments[0].airline?.name);
            }
            return false;
          }
          
          // For international round trips
          if (structureType === 'INTERNATIONAL_ROUND_TRIP') {
            if (flight.outboundSegments && flight.outboundSegments.length > 0) {
              return filters.airlines.includes(flight.outboundSegments[0].airline?.name);
            }
            return false;
          }
          
          return false;
        });
      }
      
      // Apply stops filter
      if (filters.stops && filters.stops.length > 0) {
        filtered = filtered.filter(flight => {
          let stopCount;
          
          // For domestic flights
          if (structureType === 'DOMESTIC_ROUND_TRIP' || structureType === 'ONE_WAY') {
            stopCount = (flight.segments?.length || 1) - 1;
          }
          // For international round trips
          else if (structureType === 'INTERNATIONAL_ROUND_TRIP') {
            stopCount = (flight.outboundSegments?.length || 1) - 1;
          }
          else {
            return false;
          }
          
          // Handle "2+" stops case
          const stopValue = stopCount >= 2 ? '2+' : String(stopCount);
          return filters.stops.includes(stopValue);
        });
      }
      
      setFilteredFlights(filtered);
      setVisibleCount(100);
      
    } catch (error) {
      console.error('Error applying filters:', error);
      toast.error('Failed to apply filters');
    } finally {
      setIsFiltering(false);
    }
  };
  
  // Add effect to show more filtered flights when visibleCount changes
  useEffect(() => {
    if (filteredFlights.length > 0) {
      setSearchResults(filteredFlights.slice(0, visibleCount));
    }
  }, [filteredFlights, visibleCount]);

  // Update the useEffect for domestic round trip tab changes
  useEffect(() => {
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      // When tab changes, update filtered flights based on the active tab
      if (activeTab === 'outbound') {
        setFilteredFlights(outboundFlights);
      } else {
        setFilteredFlights(inboundFlights);
      }
      setVisibleCount(100);
    }
  }, [activeTab, outboundFlights, inboundFlights, flightStructureType]);

  // Reset auto-loading when user applies a filter
  useEffect(() => {
    if (activeFilters) {
      cancelAutoLoading();
    }
  }, [activeFilters]);

  // Update title based on search and selection
  useEffect(() => {
    if (step === 2 && formData.origin && formData.destination) {
      document.title = `Flights: ${formData.origin.code} to ${formData.destination.code}`;
    } else {
      document.title = 'Flight Booking';
    }
  }, [step, formData.origin, formData.destination]);

  const handleBookingSuccess = (response) => {
    setBookingDetails(response.results);
  };

  const handleViewVoucher = async () => {
    try {
      setIsLoadingVoucher(true);
      const bmsBookingCode = bookingDetails?.details?.[0]?.bmsBookingCode;
      
      if (!bmsBookingCode) {
        toast.error('Booking code not found');
        return;
      }

      const response = await bookingService.getBookingDetails({
        provider: 'TC',
        bmsBookingCode
      });

      if (response.success) {
        setVoucherDetails(response.data.results);
        setShowVoucherModal(true);
      } else {
        throw new Error(response.message || 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error(error.message || 'Failed to fetch booking details');
    } finally {
      setIsLoadingVoucher(false);
    }
  };

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 1:
        // Form content
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Search Flights</h2>
                <p className="text-gray-600">Find the best flights for your journey</p>
              </div>

              <ProviderSelector
                providers={FLIGHT_PROVIDERS}
                selectedProvider={selectedProvider}
                onChange={handleProviderChange}
              />
              
              <form onSubmit={handleSearch} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="h-full">
                    <div className="bg-gray-50 p-6 rounded-lg h-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Flight Details</h3>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <AirportSelector
                            label="From"
                            placeholder="Select origin"
                            value={formData.origin}
                            onChange={handleOriginChange}
                            error={errors.origin}
                          />
                          <AirportSelector
                            label="To"
                            placeholder="Select destination"
                            value={formData.destination}
                            onChange={handleDestinationChange}
                            error={errors.destination}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="isRoundTrip"
                            checked={formData.isRoundTrip}
                            onChange={handleRoundTripToggle}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isRoundTrip" className="text-sm font-medium text-gray-700">
                            Round Trip
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                            <input
                              type="date"
                              name="departureDate"
                              value={formData.departureDate}
                              onChange={handleChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                              required
                              min={new Date().toISOString().split('T')[0]}
                            />
                            {errors.departureDate && (
                              <p className="text-red-500 text-sm">{errors.departureDate}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                            <input
                              type="time"
                              name="departureTime"
                              value={formData.departureTime}
                              onChange={handleChange}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                            />
                          </div>
                        </div>

                        {formData.isRoundTrip && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Return Date</label>
                              <input
                                type="date"
                                name="returnDate"
                                value={formData.returnDate}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                                required
                                min={formData.departureDate || new Date().toISOString().split('T')[0]}
                              />
                              {errors.returnDate && (
                                <p className="text-red-500 text-sm">{errors.returnDate}</p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Return Time</label>
                              <input
                                type="time"
                                name="returnTime"
                                value={formData.returnTime}
                                onChange={handleChange}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2 px-3"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="h-full">
                    <div className="bg-gray-50 p-6 rounded-lg h-full">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Travelers & Class</h3>
                      <div className="space-y-6">
                        <TravelersForm
                          travelers={formData.travelersDetails}
                          onChange={handleTravelersChange}
                        />
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Cabin Class</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 1, label: 'ALL', color: 'bg-gray-200', selectedColor: 'bg-gray-400' },
                              { value: 2, label: 'ECONOMY', color: 'bg-green-200', selectedColor: 'bg-green-400' },
                              { value: 3, label: 'PREMIUM ECONOMY', color: 'bg-teal-200', selectedColor: 'bg-teal-400' },
                              { value: 4, label: 'BUSINESS', color: 'bg-blue-200', selectedColor: 'bg-blue-400' },
                              { value: 5, label: 'PREMIUM BUSINESS', color: 'bg-indigo-200', selectedColor: 'bg-indigo-400' },
                              { value: 6, label: 'FIRST', color: 'bg-purple-200', selectedColor: 'bg-purple-400' }
                            ].map(option => (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleCabinClassChange(option.value)}
                                className={`w-full py-2 rounded-md shadow-sm text-sm font-medium text-gray-700 transition-colors duration-200 ${formData.cabinClass === option.value ? option.selectedColor : option.color}`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search Flights
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
        
      case 2:
        // Flight results with tabbed interface for domestic round trips
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Available Flights</h2>
                {flightStructureType === 'DOMESTIC_ROUND_TRIP' ? (
                  <p className="text-gray-600 mt-1">
                    {outboundFlights.length} outbound flights and {inboundFlights.length} inbound flights 
                    for {formData.origin.city || formData.origin.name} to {formData.destination.city || formData.destination.name}
                  </p>
                ) : (
                  <p className="text-gray-600 mt-1">
                    {filteredFlights.length} flights found
                    for {formData.origin.city || formData.origin.name} to {formData.destination.city || formData.destination.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Modify Search
              </button>
            </div>

            {/* Loading progress indicator */}
            {pagination && !allChunksLoaded && (
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoadingMore ? 'animate-spin' : ''} text-blue-600`} />
                    <span className="text-sm font-medium text-gray-700">
                      Loading flights...
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {flightStructureType === 'DOMESTIC_ROUND_TRIP' 
                        ? `${outboundFlights.length + inboundFlights.length} of ${pagination.total?.outbound + pagination.total?.inbound || 'many'} flights loaded`
                        : `${allFlights.length} of ${pagination.total || 'many'} flights loaded`
                      }
                    </span>
                    {!allChunksLoaded && !isCancellingLoad && (
                      <button 
                        onClick={cancelAutoLoading}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
                      >
                        Stop loading
                      </button>
                    )}
                    {isCancellingLoad && (
                      <span className="text-xs text-gray-500">Stopping...</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Sidebar with filters */}
              <div className="md:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                  <FlightFilters
                    flights={flightStructureType === 'DOMESTIC_ROUND_TRIP' 
                      ? (activeTab === 'outbound' ? outboundFlights : inboundFlights)
                      : allFlights}
                    priceRange={priceRange}
                    airlines={availableAirlines}
                    stopCounts={stopCounts}
                    onApplyFilters={applyFlightFilters}
                    loading={isFiltering}
                  />
                </div>
              </div>
              
              {/* Flight search results */}
              <div className="md:col-span-6">
                {renderFlightResults()}
              </div>

              {/* Flight summary panel */}
              <div className="md:col-span-3">
                <div className="sticky top-6">
                  <FlightSummaryPanel
                    selectedOutboundFlight={selectedOutboundFlight}
                    selectedInboundFlight={
                      flightStructureType === 'DOMESTIC_ROUND_TRIP' 
                        ? selectedInboundFlight 
                        : null
                    }
                    flightStructureType={flightStructureType}
                    selectedInboundOptionIndex={selectedInboundOptionIndex}
                    onCreateItinerary={handleCreateItinerary}
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="bg-white rounded-lg shadow-sm">
            {bookingDetails ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Booking Confirmed</h3>
                  <button
                    onClick={handleViewVoucher}
                    disabled={isLoadingVoucher}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isLoadingVoucher ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : (
                      'View Voucher'
                    )}
                  </button>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Booking Successful</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Your booking has been confirmed. Booking code: {bookingDetails.details[0].bmsBookingCode}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <FlightItineraryModal 
                itineraryDetails={itineraryDetails}
                onClose={() => setStep(2)}
                onBookNow={handleBookingSuccess}
              />
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Render flight search results based on structure type
  const renderFlightResults = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading flights...</p>
        </div>
      );
    }

    // For domestic round trip, show tabs for outbound and inbound flights
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      return (
        <div className="space-y-6">
          {/* Tabs for outbound/inbound */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('outbound')}
                className={`${
                  activeTab === 'outbound'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Outbound Flights
                {selectedOutboundFlight && activeTab !== 'outbound' && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('inbound')}
                className={`${
                  activeTab === 'inbound'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Inbound Flights
                {selectedInboundFlight && activeTab !== 'inbound' && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </button>
            </nav>
          </div>
          
          {/* Flight list */}
          <FlightSearchResults
            flights={activeTab === 'outbound' ? outboundFlights : inboundFlights}
            pagination={pagination}
            isRoundTrip={false}
            isDomestic={true}
            isOutbound={activeTab === 'outbound'}
            onSelectFlight={handleSelectFlight}
            selectedFlight={activeTab === 'outbound' ? selectedOutboundFlight : selectedInboundFlight}
            onLoadMore={handleLoadMore}
            loading={isLoading}
            isLoadingMore={isLoadingMore}
            allChunksLoaded={allChunksLoaded}
            loadingProgress={loadingProgress}
            loadMoreManually={() => {
              // Reset auto-loading capability 
              autoLoadRef.current = true;
              loadFlightChunk(currentChunkIndex + 1, allFlights);
            }}
            // Props for summary panel
            selectedOutboundFlight={selectedOutboundFlight}
            selectedInboundFlight={selectedInboundFlight}
            flightStructureType={flightStructureType}
            onCreateItinerary={handleCreateItinerary}
          />
        </div>
      );
    }
    
    // For international round trips, we show tabs too but with inbound options specific to the selected outbound
    if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      return (
        <div className="space-y-6">
          {/* Tabs for outbound/inbound */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => {
                  // Reset inbound selection when going back to outbound tab
                  if (activeTab !== 'outbound') {
                    setSelectedInboundOptionIndex(null);
                  }
                  setActiveTab('outbound');
                }}
                className={`${
                  activeTab === 'outbound'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                Outbound Flights
                {selectedOutboundFlight && activeTab !== 'outbound' && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </button>
              <button
                onClick={() => {
                  if (selectedOutboundFlight) {
                    setActiveTab('inbound');
                  }
                }}
                disabled={!selectedOutboundFlight}
                className={`${
                  activeTab === 'inbound'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  !selectedOutboundFlight && 'opacity-50 cursor-not-allowed'
                }`}
              >
                Inbound Options
                {selectedInboundOptionIndex !== null && activeTab !== 'inbound' && (
                  <span className="ml-2 text-green-500">✓</span>
                )}
              </button>
            </nav>
          </div>
          
          {activeTab === 'outbound' ? (
            // Show outbound flights list
            <FlightSearchResults
              flights={filteredFlights}
              pagination={pagination}
              isRoundTrip={true}
              isDomestic={false}
              isOutbound={true}
              onSelectFlight={(flight) => {
                handleSelectFlight(flight);
                setActiveTab('inbound'); // Auto-switch to inbound tab on selection
              }}
              selectedFlight={selectedOutboundFlight}
              onLoadMore={handleLoadMore}
              loading={isLoading}
              isLoadingMore={isLoadingMore}
              allChunksLoaded={allChunksLoaded}
              loadingProgress={loadingProgress}
              loadMoreManually={() => {
                autoLoadRef.current = true;
                loadFlightChunk(currentChunkIndex + 1, allFlights);
              }}
              // Props for summary panel
              selectedOutboundFlight={selectedOutboundFlight}
              flightStructureType={flightStructureType}
              selectedInboundOptionIndex={selectedInboundOptionIndex}
              onCreateItinerary={handleCreateItinerary}
            />
          ) : (
            // Show inbound options
            <div className="space-y-4">
              {selectedOutboundFlight && selectedOutboundFlight.inboundOptions && 
               selectedOutboundFlight.inboundOptions.length > 0 ? (
                <>
                  <div className="text-gray-600 font-medium mb-4">
                    Select your return flight from {selectedOutboundFlight.inboundOptions.length} available options
                  </div>
                  
                  {selectedOutboundFlight.inboundOptions.map((option, index) => {
                    // Get segments for this option
                    const segments = option.segments || [];
                    if (!segments.length) return null;
                    
                    // Extract key information
                    const departureTime = segments[0].departure?.time;
                    const arrivalTime = segments[segments.length - 1].arrival?.time;
                    const departureCode = segments[0].departure?.airport?.code;
                    const arrivalCode = segments[segments.length - 1].arrival?.airport?.code;
                    const airline = segments[0].airline?.name;
                    const flightNumber = segments[0].airline?.flightNumber;
                    const duration = segments.reduce((total, seg) => total + (seg.duration || 0), 0);
                    const stops = segments.length > 1 ? segments.length - 1 : 0;
                    const baggage = segments[0].baggage;
                    
                    return (
                      <div 
                        key={index}
                        className={`bg-white rounded-lg shadow-sm border p-4 ${
                          selectedInboundOptionIndex === index 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : 'border-gray-200'
                        } hover:shadow-md transition-shadow cursor-pointer`}
                        onClick={() => handleSelectInboundOption(index)}
                      >
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-semibold">{airline} {flightNumber}</span>
                              <span className="text-sm text-gray-500">
                                {stops === 0 ? 'Non-stop' : `${stops} stop${stops !== 1 ? 's' : ''}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-semibold">{formatTime(departureTime)}</span>
                                <span className="text-gray-500">{departureCode}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 text-sm">{formatDuration(duration)}</span>
                                <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-semibold">{formatTime(arrivalTime)}</span>
                                <span className="text-gray-500">{arrivalCode}</span>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex justify-between">
                              <div className="text-sm text-gray-500">
                                {baggage && <span>Baggage: {baggage}</span>}
                              </div>
                              
                              <div className="text-lg font-semibold text-blue-600">
                                {option.price?.currency || 'INR'} {(option.price?.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-600">
                    {selectedOutboundFlight 
                      ? 'No return flight options available for the selected outbound flight.' 
                      : 'Please select an outbound flight first to view return options.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    
    // For one-way flights
    return (
      <FlightSearchResults
        flights={filteredFlights}
        pagination={pagination}
        isRoundTrip={false}
        isDomestic={false}
        onSelectFlight={handleSelectFlight}
        selectedFlight={selectedOutboundFlight}
        onLoadMore={handleLoadMore}
        loading={isLoading}
        isLoadingMore={isLoadingMore}
        allChunksLoaded={allChunksLoaded}
        loadingProgress={loadingProgress}
        loadMoreManually={() => {
          autoLoadRef.current = true;
          loadFlightChunk(currentChunkIndex + 1, allFlights);
        }}
        // Props for summary panel
        selectedOutboundFlight={selectedOutboundFlight}
        flightStructureType={flightStructureType}
        onCreateItinerary={handleCreateItinerary}
      />
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Progress Steps */}
        <nav className="flex items-center justify-center space-x-4">
          {['Search', 'Select Flight', 'Book'].map((stepName, index) => (
            <div
              key={stepName}
              className={`flex items-center ${
                index + 1 === step
                  ? 'text-indigo-600'
                  : index + 1 < step
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  index + 1 === step
                    ? 'border-indigo-600 bg-indigo-50'
                    : index + 1 < step
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300'
                }`}
              >
                {index + 1}
              </span>
              <span className="ml-2 font-medium">{stepName}</span>
              {index < 2 && (
                <ArrowLongRightIcon className="w-5 h-5 mx-4 text-gray-400" />
              )}
            </div>
          ))}
        </nav>

        {/* Main Content */}
        {renderContent()}
      </div>
      
      {/* Add the voucher modal */}
      <FlightBookingVoucherModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        voucherDetails={voucherDetails}
      />
    </div>
  );
};

export default FlightBookingPage;