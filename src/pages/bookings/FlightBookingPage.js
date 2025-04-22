// src/pages/bookings/FlightBookingPage.js
import { ArrowLongRightIcon, ArrowPathIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ConfigProvider, DatePicker } from 'antd';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
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
  const [traceId, setTraceId] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('TC');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
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
  const [flightStructureType, setFlightStructureType] = useState('ONE_WAY');

  // New state for international round trip inbound option
  const [selectedInboundOptionIndex, setSelectedInboundOptionIndex] = useState(null);

  // New state variables for automatic loading
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [allChunksLoaded, setAllChunksLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isCancellingLoad, setIsCancellingLoad] = useState(false);

  // Inbound options expansion state for INTERNATIONAL_ROUND_TRIP
  const [expandedStates, setExpandedStates] = useState([]);

  // Define the shared theme configuration
  const datePickerTheme = {
    token: {
      colorPrimary: '#093923', // Main theme green
    },
    components: {
      DatePicker: {
        cellActiveWithRangeBg: '#13804e26', // Selected range background (#13804e with 15% opacity)
        cellHoverWithRangeBg: '#0939231A', // Hover background within range (theme green with 10% opacity)
        // You might need cellHoverBg for single date hover
        cellHoverBg: '#0939231A', 
      },
    },
  };

  // Function to load more flights
  const loadMoreItems = () => {
    setVisibleCount(prev => Math.min(prev + 100, filteredFlights.length));
  };

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
      
      // Call the search API
      const response = await bookingService.searchFlights(formData);
      
      if (!response.success) {
        throw new Error(response.message || 'Search failed');
      }

      // Handle different flight structures
      if (response.data.outboundFlights && response.data.inboundFlights) {
        // Domestic round trip
        setIsDomesticRoundTrip(true);
        setFlightStructureType('DOMESTIC_ROUND_TRIP');
        setOutboundFlights(response.data.outboundFlights);
        setInboundFlights(response.data.inboundFlights);
        setFilteredFlights(response.data.outboundFlights);
      } else {
        // One-way or international round trip
        setAllFlights(response.data.flights);
        setFilteredFlights(response.data.flights);
        setFlightStructureType(formData.isRoundTrip ? 'INTERNATIONAL_ROUND_TRIP' : 'ONE_WAY');
      }

      // Set metadata
      setTraceId(response.data.traceId);
      setPriceRange(response.data.priceRange);
      setAvailableAirlines(response.data.availableFilters.airlines);
      setStopCounts(response.data.availableFilters.stopCounts);
      
      // Move to results view
      setStep(2);
    } catch (error) {
      console.error('Error searching flights:', error);
      toast.error(error.message || 'Failed to search flights');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle flight selection based on structure type
  const handleSelectFlight = (flight) => {
    // Debug log for flight selection
    console.log('Flight selected:', {
      flightId: flight.resultIndex || flight.rI,
      activeTab,
      flightStructureType,
      flightDetails: flight,
      currentOutbound: selectedOutboundFlight?.resultIndex || selectedOutboundFlight?.rI,
      currentInbound: selectedInboundFlight?.resultIndex || selectedInboundFlight?.rI
    });

    // Handle special "clear" actions from group flight selection
    if (flight.type === 'clear_outbound') {
      console.log('Clearing outbound flight selection');
      setSelectedOutboundFlight(null);
      return;
    } else if (flight.type === 'clear_inbound') {
      console.log('Clearing inbound flight selection');
      setSelectedInboundFlight(null);
      return;
    } else if (flight.type === 'clear_selection') {
      console.log('Clearing flight selection');
      if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
        if (activeTab === 'outbound') {
          setSelectedOutboundFlight(null);
          setSelectedInboundOptionIndex(null);
        } else {
          setSelectedInboundOptionIndex(null);
        }
      } else {
        // ONE_WAY
        setSelectedFlight(null);
        setSelectedOutboundFlight(null);
      }
      return;
    }

    // Store selection based on active tab and flight structure
    if (flightStructureType === 'DOMESTIC_ROUND_TRIP') {
      if (activeTab === 'outbound') {
        console.log('Setting selected outbound flight for DOMESTIC_ROUND_TRIP');
        // Ensure flight has resultIndex for consistency
        const processedFlight = {
          ...flight,
          resultIndex: flight.resultIndex || flight.rI
        };
        setSelectedOutboundFlight(processedFlight);
        
        // Log price data for debugging
        console.log('Domestic outbound price data:', {
          directPrice: flight.price,
          nestedPrice: flight.outbound?.price,
          legacyPrice: flight.pF
        });
        
        // If this is a combined structure (outbound+inbound), handle differently
        if (flight.outbound && flight.inbound) {
          console.log('Combined flight structure detected');
        }
        
        // Always move to inbound tab for selection if needed
        if (!selectedInboundFlight) {
          console.log('Switching to inbound tab');
          setActiveTab('inbound');
        }
      } else {
        console.log('Setting selected inbound flight for DOMESTIC_ROUND_TRIP');
        // Ensure flight has resultIndex for consistency
        const processedFlight = {
          ...flight,
          resultIndex: flight.resultIndex || flight.rI
        };
        setSelectedInboundFlight(processedFlight);
        
        // Log price data for debugging
        console.log('Domestic inbound price data:', {
          directPrice: flight.price,
          nestedPrice: flight.inbound?.price,
          legacyPrice: flight.pF
        });
      }
      
      // Debug summary of flights after selection
      setTimeout(() => {
        console.log('DOMESTIC_ROUND_TRIP flight selection summary:', {
          outbound: selectedOutboundFlight ? {
            id: selectedOutboundFlight.resultIndex || selectedOutboundFlight.rI,
            hasOutbound: !!selectedOutboundFlight.outbound,
            hasInbound: !!selectedOutboundFlight.inbound,
            directPrice: selectedOutboundFlight.price,
            outboundPrice: selectedOutboundFlight.outbound?.price,
            pF: selectedOutboundFlight.pF
          } : 'No outbound flight selected',
          inbound: selectedInboundFlight ? {
            id: selectedInboundFlight.resultIndex || selectedInboundFlight.rI,
            hasOutbound: !!selectedInboundFlight.outbound,
            hasInbound: !!selectedInboundFlight.inbound,
            directPrice: selectedInboundFlight.price,
            inboundPrice: selectedInboundFlight.inbound?.price,
            pF: selectedInboundFlight.pF
          } : 'No inbound flight selected yet'
        });
      }, 100);
    } else if (flightStructureType === 'INTERNATIONAL_ROUND_TRIP') {
      if (activeTab === 'outbound') {
        // For outbound flight in international round trip
        console.log('Setting outbound flight for international RT:', flight);
        setSelectedOutboundFlight(flight);
        setSelectedInboundOptionIndex(null);
        setActiveTab('inbound');
      } else {
        // For inbound option in international round trip
        console.log('Setting inbound option for international RT:', flight);
        setSelectedInboundOptionIndex(flight.index);
      }
    } else {
      // ONE_WAY
      console.log('Setting selected flight for ONE_WAY');
      setSelectedFlight(flight);
      setSelectedOutboundFlight(flight);
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
          // Ensure we use either resultIndex or rI property, whichever is available
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedOutboundFlight.resultIndex || selectedOutboundFlight.rI,
              flightType: 'OUTBOUND'
            },
            {
              type: 'FLIGHT',
              resultIndex: selectedInboundFlight.resultIndex || selectedInboundFlight.rI,
              flightType: 'INBOUND'
            }
          ];
          
          // Debug logging for the resultIndex values being used
          console.log('DOMESTIC_ROUND_TRIP itinerary data:', {
            outboundResultIndex: selectedOutboundFlight.resultIndex || selectedOutboundFlight.rI,
            inboundResultIndex: selectedInboundFlight.resultIndex || selectedInboundFlight.rI
          });
          break;

        case 'INTERNATIONAL_ROUND_TRIP':
          // For international round trips, send the resultIndex of the selected inbound option
          const selectedInboundOption = selectedOutboundFlight.inboundOptions[selectedInboundOptionIndex];
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedInboundOption.resultIndex || selectedInboundOption.rI
            }
          ];
          
          // Debug logging for the resultIndex values being used
          console.log('INTERNATIONAL_ROUND_TRIP itinerary data:', {
            selectedInboundResultIndex: selectedInboundOption.resultIndex || selectedInboundOption.rI
          });
          break;

        case 'ONE_WAY':
        default:
          // For one-way flights
          itineraryData.items = [
            {
              type: 'FLIGHT',
              resultIndex: selectedOutboundFlight.resultIndex || selectedOutboundFlight.rI
            }
          ];
          
          // Debug logging for the resultIndex values being used
          console.log('ONE_WAY itinerary data:', {
            resultIndex: selectedOutboundFlight.resultIndex || selectedOutboundFlight.rI
          });
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
      setItineraryDetails(response);
      
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
      
      // Apply price filter - handle all possible price formats
      if (filters.price) {
        filtered = filtered.filter(flight => {
          // Get price based on all possible formats
          let price = 0;
          
          // Direct price.amount format
          if (flight.price?.amount !== undefined) {
            price = flight.price.amount;
          } 
          // Nested outbound price format
          else if (flight.outbound?.price?.amount !== undefined) {
            price = flight.outbound.price.amount;
          }
          // Nested inbound price format
          else if (flight.inbound?.price?.amount !== undefined) {
            price = flight.inbound.price.amount;
          }
          // Legacy pF format
          else if (typeof flight.pF === 'number') {
            price = flight.pF;
          }
          
          return price >= filters.price.min && price <= filters.price.max;
        });
      }
      
      // Apply airline filter
      if (filters.airlines && filters.airlines.length > 0) {
        filtered = filtered.filter(flight => {
          // Check airline based on flight structure
          let airlineName = null;
          
          // For domestic flights and one-way
          if (structureType === 'DOMESTIC_ROUND_TRIP' || structureType === 'ONE_WAY') {
            // Check for segments array
            if (flight.segments && flight.segments.length > 0) {
              airlineName = flight.segments[0].airline?.name;
            }
            // Check for outbound segments in case of mixed structures
            else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
              airlineName = flight.outboundSegments[0].airline?.name;
            }
          }
          
          // For international round trips
          else if (structureType === 'INTERNATIONAL_ROUND_TRIP') {
            // Check for outbound segments
            if (flight.outboundSegments && flight.outboundSegments.length > 0) {
              airlineName = flight.outboundSegments[0].airline?.name;
            }
            // Fallback to regular segments if available
            else if (flight.segments && flight.segments.length > 0) {
              airlineName = flight.segments[0].airline?.name;
            }
          }
          
          return airlineName && filters.airlines.includes(airlineName);
        });
      }
      
      // Apply stops filter
      if (filters.stops && filters.stops.length > 0) {
        filtered = filtered.filter(flight => {
          let stopCount = null;
          
          // Different handling based on flight structure
          if (structureType === 'DOMESTIC_ROUND_TRIP') {
            // For domestic round trips, use segments or the active tab segments
            if (activeTab === 'outbound' && flight.outboundSegments) {
              stopCount = flight.outboundSegments.length - 1;
            } else if (activeTab === 'inbound' && flight.inboundSegments) {
              stopCount = flight.inboundSegments.length - 1;
            } else if (flight.segments) {
              stopCount = flight.segments.length - 1;
            } else {
              stopCount = 0;
            }
          }
          // For one-way flights
          else if (structureType === 'ONE_WAY') {
            if (flight.segments) {
              stopCount = flight.segments.length - 1;
            } else if (flight.outboundSegments) {
              stopCount = flight.outboundSegments.length - 1;
            } else {
              stopCount = flight.stopCount || 0;
            }
          }
          // For international round trips
          else if (structureType === 'INTERNATIONAL_ROUND_TRIP') {
            if (flight.outboundSegments) {
              stopCount = flight.outboundSegments.length - 1;
            } else if (flight.segments) {
              stopCount = flight.segments.length - 1;
            } else {
              stopCount = flight.stopCount || 0;
            }
          }
          
          // Fallback to flight.stopCount if segments aren't available
          if (stopCount === null && flight.stopCount !== undefined) {
            stopCount = flight.stopCount;
          } else if (stopCount === null) {
            stopCount = 0;
          }
          
          // Handle "2+" stops case
          const stopValue = stopCount >= 2 ? '2+' : String(stopCount);
          return filters.stops.includes(stopValue);
        });
      }
      
      // Apply departure time filter
      if (filters.departureTime && filters.departureTime.length > 0) {
        // Define time ranges for each slab
        const timeRanges = {
          'early-morning': [0, 6],   // 12:00 AM - 6:00 AM
          'morning': [6, 12],        // 6:00 AM - 12:00 PM
          'afternoon': [12, 18],     // 12:00 PM - 6:00 PM
          'evening': [18, 24]        // 6:00 PM - 12:00 AM
        };
        
        filtered = filtered.filter(flight => {
          // Extract departure time based on flight structure
          let departureTimeStr = null;
          
          if (structureType === 'DOMESTIC_ROUND_TRIP') {
            if (activeTab === 'outbound') {
              if (flight.outboundSegments && flight.outboundSegments.length > 0) {
                departureTimeStr = flight.outboundSegments[0].departure?.time;
              } else if (flight.segments && flight.segments.length > 0) {
                departureTimeStr = flight.segments[0].departure?.time;
              }
            } else { // inbound
              if (flight.inboundSegments && flight.inboundSegments.length > 0) {
                departureTimeStr = flight.inboundSegments[0].departure?.time;
              } else if (flight.segments && flight.segments.length > 0) {
                departureTimeStr = flight.segments[0].departure?.time;
              }
            }
          } else {
            // ONE_WAY or INTERNATIONAL_ROUND_TRIP
            if (flight.segments && flight.segments.length > 0) {
              departureTimeStr = flight.segments[0].departure?.time;
            } else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
              departureTimeStr = flight.outboundSegments[0].departure?.time;
            } else if (flight.sg && flight.sg.length > 0) {
              departureTimeStr = flight.sg[0].or?.dT;
            }
          }
          
          if (!departureTimeStr) return false;
          
          try {
            const date = new Date(departureTimeStr);
            const hours = date.getHours();
            
            // Check if the flight's departure time is in any of the selected time slabs
            return filters.departureTime.some(slabId => {
              const range = timeRanges[slabId];
              return range && hours >= range[0] && hours < range[1];
            });
          } catch (error) {
            console.error('Error parsing departure time:', error);
            return false;
          }
        });
      }
      
      // Apply arrival time filter
      if (filters.arrivalTime && filters.arrivalTime.length > 0) {
        // Define time ranges for each slab
        const timeRanges = {
          'early-morning': [0, 6],   // 12:00 AM - 6:00 AM
          'morning': [6, 12],        // 6:00 AM - 12:00 PM
          'afternoon': [12, 18],     // 12:00 PM - 6:00 PM
          'evening': [18, 24]        // 6:00 PM - 12:00 AM
        };
        
        filtered = filtered.filter(flight => {
          // Extract arrival time based on flight structure
          let arrivalTimeStr = null;
          
          if (structureType === 'DOMESTIC_ROUND_TRIP') {
            if (activeTab === 'outbound') {
              if (flight.outboundSegments && flight.outboundSegments.length > 0) {
                const lastSegment = flight.outboundSegments[flight.outboundSegments.length - 1];
                arrivalTimeStr = lastSegment.arrival?.time;
              } else if (flight.segments && flight.segments.length > 0) {
                const lastSegment = flight.segments[flight.segments.length - 1];
                arrivalTimeStr = lastSegment.arrival?.time;
              }
            } else { // inbound
              if (flight.inboundSegments && flight.inboundSegments.length > 0) {
                const lastSegment = flight.inboundSegments[flight.inboundSegments.length - 1];
                arrivalTimeStr = lastSegment.arrival?.time;
              } else if (flight.segments && flight.segments.length > 0) {
                const lastSegment = flight.segments[flight.segments.length - 1];
                arrivalTimeStr = lastSegment.arrival?.time;
              }
            }
          } else {
            // ONE_WAY or INTERNATIONAL_ROUND_TRIP
            if (flight.segments && flight.segments.length > 0) {
              const lastSegment = flight.segments[flight.segments.length - 1];
              arrivalTimeStr = lastSegment.arrival?.time;
            } else if (flight.outboundSegments && flight.outboundSegments.length > 0) {
              const lastSegment = flight.outboundSegments[flight.outboundSegments.length - 1];
              arrivalTimeStr = lastSegment.arrival?.time;
            } else if (flight.sg && flight.sg.length > 0) {
              const lastSegment = flight.sg[flight.sg.length - 1];
              arrivalTimeStr = lastSegment.ds?.aT;
            }
          }
          
          if (!arrivalTimeStr) return false;
          
          try {
            const date = new Date(arrivalTimeStr);
            const hours = date.getHours();
            
            // Check if the flight's arrival time is in any of the selected time slabs
            return filters.arrivalTime.some(slabId => {
              const range = timeRanges[slabId];
              return range && hours >= range[0] && hours < range[1];
            });
          } catch (error) {
            console.error('Error parsing arrival time:', error);
            return false;
          }
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
    console.log("!!! FlightBookingPage: handleBookingSuccess called !!!", response);
    if (response && response.results) { 
        setBookingDetails(response.results);
    } else {
        console.error("!!! handleBookingSuccess called with invalid/missing response.results:", response);
        toast.error("Booking completed but response data is unexpected. Cannot display details.");
    }
    setStep(3);
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
        setVoucherDetails(response.data.booking_details);
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

  // Initialize expanded states when inbound options change
  useEffect(() => {
    if (selectedOutboundFlight?.inboundOptions) {
      setExpandedStates(new Array(selectedOutboundFlight.inboundOptions.length).fill(false));
    }
  }, [selectedOutboundFlight?.inboundOptions]);
  
  // Toggle expanded state for specific index
  const toggleExpanded = (index) => {
    setExpandedStates(prev => {
      const newStates = [...prev];
      newStates[index] = !newStates[index];
      return newStates;
    });
  };

  // Update handleDepartureDateChange function
  const handleDepartureDateChange = (date, dateString) => {
    setFormData(prev => {
      const newState = {
        ...prev,
        departureDate: dateString || ''
      };
      // If round trip is selected, pre-populate return date with the same date
      // This gives the user a starting point for the return date picker
      if (prev.isRoundTrip) {
        newState.returnDate = dateString || ''; 
      }
      return newState;
    });
    // Optionally clear return date error if departure date changes
    if (errors.returnDate) {
      setErrors(prev => ({ ...prev, returnDate: undefined }));
    }
  };

  const handleReturnDateChange = (date, dateString) => {
    setFormData(prev => ({
      ...prev,
      returnDate: dateString || ''
    }));
  };

  // Render content based on current step
  const renderContent = () => {
    switch (step) {
      case 1:
        // Form content
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-8">
              {/* Modified Header with Provider Selection */}
              <div className="flex justify-between items-center">
                {/* Left Side: Title and Subtitle */}
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-1">Search Flights</h2>
                  <p className="text-gray-600">Find the best flights for your journey</p>
                </div>
                {/* Right Side: Provider Selection */}
                <div className="flex items-center space-x-4">
                  <h3 className="text-base font-medium text-gray-700">Select Provider:</h3>
                  <div className="flex space-x-2">
                    {FLIGHT_PROVIDERS.map((provider) => (
                      <button
                        key={provider.value}
                        type="button"
                        onClick={() => handleProviderChange(provider.value)}
                        // Apply theme colors and adjust styling for inline header display
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
                            className="h-4 w-4 text-[#093923] focus:ring-[#093923] border-gray-300 rounded"
                          />
                          <label htmlFor="isRoundTrip" className="text-sm font-medium text-gray-700">
                            Round Trip
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Departure Date</label>
                            <ConfigProvider theme={datePickerTheme}>
                              <DatePicker
                                className="w-full rounded-md border-gray-300"
                                format="YYYY-MM-DD"
                                value={formData.departureDate ? dayjs(formData.departureDate) : null}
                                onChange={handleDepartureDateChange}
                                disabledDate={current => current && current < dayjs().startOf('day')}
                                placeholder="Select Date"
                                size="large"
                                style={{ height: '42px' }}
                                allowClear={true}
                              />
                            </ConfigProvider>
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
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#093923] focus:ring-[#093923] py-2 px-3"
                              style={{ height: '42px' }}
                            />
                          </div>
                        </div>

                        {formData.isRoundTrip && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">Return Date</label>
                              <ConfigProvider theme={datePickerTheme}>
                                <DatePicker
                                  className="w-full rounded-md border-gray-300"
                                  format="YYYY-MM-DD"
                                  value={formData.returnDate ? dayjs(formData.returnDate) : null}
                                  onChange={handleReturnDateChange}
                                  disabledDate={current => 
                                    current && (
                                      current < dayjs().startOf('day') || 
                                      (formData.departureDate && current < dayjs(formData.departureDate))
                                    )
                                  }
                                  placeholder="Select Date"
                                  size="large"
                                  style={{ height: '42px' }}
                                  allowClear={true}
                                />
                              </ConfigProvider>
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
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#093923] focus:ring-[#093923] py-2 px-3"
                                style={{ height: '42px' }}
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
                              { value: 1, label: 'ALL' },
                              { value: 2, label: 'ECONOMY' },
                              { value: 3, label: 'PREMIUM ECONOMY' },
                              { value: 4, label: 'BUSINESS' },
                              { value: 5, label: 'PREMIUM BUSINESS' },
                              { value: 6, label: 'FIRST' }
                            ].map(option => {
                              const isSelected = formData.cabinClass === option.value;
                              const bgColor = isSelected ? 'bg-[#093923]/60' : 'bg-[#093923]/10';
                              const textColor = isSelected ? 'text-white' : 'text-gray-900';
                              const hoverBgColor = isSelected ? 'hover:bg-[#093923]/70' : 'hover:bg-[#093923]/20';
                              
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleCabinClassChange(option.value)}
                                  className={`w-full py-2 rounded-md shadow-sm text-sm font-medium transition-colors duration-200 ${bgColor} ${textColor} ${hoverBgColor}`}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
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
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50 transition-colors duration-200"
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
                    <span className="text-sm text-gray-500 ml-2">
                      ({formData.departureDate ? format(new Date(formData.departureDate), 'MMM dd, yyyy') : ''}
                      {formData.returnDate ? ` - ${format(new Date(formData.returnDate), 'MMM dd, yyyy')}` : ''})
                    </span>
                  </p>
                ) : (
                  <p className="text-gray-600 mt-1">
                    {filteredFlights.length} flights found
                    for {formData.origin.city || formData.origin.name} to {formData.destination.city || formData.destination.name}
                    <span className="text-sm text-gray-500 ml-2">
                      ({formData.departureDate ? format(new Date(formData.departureDate), 'MMM dd, yyyy') : ''}
                      {formData.returnDate ? ` - ${format(new Date(formData.returnDate), 'MMM dd, yyyy')}` : ''})
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Modify Search
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Sidebar with filters */}
              <div className="md:col-span-3"> {/* Filters Column */} 
                <div className="bg-white rounded-lg shadow-sm p-6 h-full">
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
              <div className="md:col-span-6"> {/* Results Column - Default Width */} 
                {renderFlightResults()}
              </div>

              {/* Flight summary panel */}
              <div className="md:col-span-3"> {/* Summary Column - Default Width */} 
                <div>
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
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#093923] hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923] disabled:opacity-50"
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
                <div className="bg-[#22c35e]/10 border border-[#22c35e]/30 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-[#22c35e]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-[#22c35e]/90">Booking Successful</h3>
                      <div className="mt-2 text-sm text-[#22c35e]/80">
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#093923] mx-auto mb-4"></div>
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
                    ? 'border-[#093923] text-[#093923]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                {formData.origin?.city || formData.origin?.name || 'Origin'} to {formData.destination?.city || formData.destination?.name || 'Destination'}
                {selectedOutboundFlight && activeTab !== 'outbound' && (
                  <span className="ml-2 text-[#22c35e]">✓</span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('inbound')}
                className={`${
                  activeTab === 'inbound'
                    ? 'border-[#093923] text-[#093923]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                {formData.destination?.city || formData.destination?.name || 'Destination'} to {formData.origin?.city || formData.origin?.name || 'Origin'}
                {selectedInboundFlight && activeTab !== 'inbound' && (
                  <span className="ml-2 text-[#22c35e]">✓</span>
                )}
              </button>
            </nav>
          </div>
          
          {/* Flight list */}
          <FlightSearchResults
            flights={activeTab === 'outbound' ? outboundFlights : inboundFlights}
            isRoundTrip={false}
            isDomestic={true}
            isOutbound={activeTab === 'outbound'}
            onSelectFlight={handleSelectFlight}
            selectedFlight={activeTab === 'outbound' ? selectedOutboundFlight : selectedInboundFlight}
            loading={isLoading}
            // Props for summary panel
            selectedOutboundFlight={selectedOutboundFlight}
            selectedInboundFlight={selectedInboundFlight}
            flightStructureType={flightStructureType}
            onCreateItinerary={handleCreateItinerary}
          />
          
          {/* Load more button */}
          {(activeTab === 'outbound' ? outboundFlights.length : inboundFlights.length) > visibleCount && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMoreItems}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Load More Flights ({visibleCount} of {activeTab === 'outbound' ? outboundFlights.length : inboundFlights.length})
              </button>
            </div>
          )}
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
                    ? 'border-[#093923] text-[#093923]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
              >
                {formData.origin?.city || formData.origin?.name || 'Origin'} to {formData.destination?.city || formData.destination?.name || 'Destination'}
                {selectedOutboundFlight && activeTab !== 'outbound' && (
                  <span className="ml-2 text-[#22c35e]">✓</span>
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
                    ? 'border-[#093923] text-[#093923]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                  !selectedOutboundFlight && 'opacity-50 cursor-not-allowed'
                }`}
              >
                {formData.destination?.city || formData.destination?.name || 'Destination'} to {formData.origin?.city || formData.origin?.name || 'Origin'}
                {selectedInboundOptionIndex !== null && activeTab !== 'inbound' && (
                  <span className="ml-2 text-[#22c35e]">✓</span>
                )}
              </button>
            </nav>
          </div>
          
          {activeTab === 'outbound' ? (
            // Show outbound flights list
            <FlightSearchResults
              flights={filteredFlights}
              isRoundTrip={true}
              isDomestic={false}
              isOutbound={true}
              onSelectFlight={(flight) => {
                handleSelectFlight(flight);
                setActiveTab('inbound'); // Auto-switch to inbound tab on selection
              }}
              selectedFlight={selectedOutboundFlight}
              loading={isLoading}
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
                <div>
                  <div className="text-gray-600 font-medium mb-4">
                    Select your return flight from {selectedOutboundFlight.inboundOptions.length} available options
                  </div>
                  
                  {selectedOutboundFlight.inboundOptions.map((option, index) => {
                    // Handle array of arrays structure
                    const inboundOption = Array.isArray(option) && option.length > 0 ? option[0] : option;
                    if (!inboundOption) return null;
                    
                    // Check if this option has group flights
                    const groupFlights = inboundOption.groupFlights || [];
                    const hasGroupFlights = Array.isArray(groupFlights) && groupFlights.length > 0;
                    
                    // Get expansion state from the array
                    const isExpanded = expandedStates[index] || false;
                    
                    // Get segments for this option
                    const segments = inboundOption.segments || [];
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
                    
                    // Render the main inbound option card
                    return (
                      <div key={index} className="space-y-4">
                        <div 
                          className={`bg-white rounded-lg shadow-sm border p-4 ${
                            selectedInboundOptionIndex === index 
                              ? 'border-[#093923] ring-2 ring-[#093923]/30' 
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
                                <div className="flex items-center">
                                  <div className="text-sm text-gray-500">
                                    {baggage && <span>Baggage: {baggage}</span>}
                                  </div>
                                  
                                  {/* Group flights indicator and toggle */}
                                  {hasGroupFlights && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent card selection
                                        toggleExpanded(index);
                                      }}
                                      className="text-[#093923] text-sm font-medium flex items-center ml-6"
                                    >
                                      {isExpanded ? 'Hide' : 'View'} {groupFlights.length} more option{groupFlights.length !== 1 ? 's' : ''}
                                      <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className={`h-4 w-4 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                                        viewBox="0 0 20 20" 
                                        fill="currentColor"
                                      >
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                                
                                <div className="text-lg font-semibold text-blue-600">
                                  {inboundOption.price?.currency || 'INR'} {(inboundOption.price?.amount || inboundOption.pF || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Render group flights if expanded */}
                          {isExpanded && hasGroupFlights && (
                            <div className="space-y-4 pl-4 border-l-2 border-[#093923]/20">
                              <div className="text-sm font-medium text-gray-700 pb-2">More options with this airline</div>
                              {groupFlights.map((groupFlight, groupIndex) => {
                                // Get segments for this group flight
                                const groupSegments = groupFlight.segments || [];
                                if (!groupSegments.length) return null;
                                
                                // Extract key information for group flight
                                const gDepartureTime = groupSegments[0].departure?.time;
                                const gArrivalTime = groupSegments[groupSegments.length - 1].arrival?.time;
                                const gDepartureCode = groupSegments[0].departure?.airport?.code;
                                const gArrivalCode = groupSegments[groupSegments.length - 1].arrival?.airport?.code;
                                const gAirline = groupSegments[0].airline?.name;
                                const gFlightNumber = groupSegments[0].airline?.flightNumber;
                                const gDuration = groupSegments.reduce((total, seg) => total + (seg.duration || 0), 0);
                                const gStops = groupSegments.length > 1 ? groupSegments.length - 1 : 0;
                                const gBaggage = groupSegments[0].baggage;
                                
                                return (
                                  <div 
                                    key={`group-${index}-${groupIndex}`}
                                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="font-semibold">{gAirline} {gFlightNumber}</span>
                                          <span className="text-sm text-gray-500">
                                            {gStops === 0 ? 'Non-stop' : `${gStops} stop${gStops !== 1 ? 's' : ''}`}
                                          </span>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg font-semibold">{formatTime(gDepartureTime)}</span>
                                            <span className="text-gray-500">{gDepartureCode}</span>
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <span className="text-gray-500 text-sm">{formatDuration(gDuration)}</span>
                                            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                                          </div>
                                          
                                          <div className="flex items-center space-x-2">
                                            <span className="text-lg font-semibold">{formatTime(gArrivalTime)}</span>
                                            <span className="text-gray-500">{gArrivalCode}</span>
                                          </div>
                                        </div>
                                        
                                        <div className="mt-3 flex justify-between items-center">
                                          <div className="text-sm text-gray-500">
                                            {gBaggage && <span>Baggage: {gBaggage}</span>}
                                          </div>
                                          
                                          <div className="flex items-center space-x-3">
                                            <div className="text-lg font-semibold text-blue-600">
                                              {groupFlight.price?.currency || 'INR'} {(groupFlight.price?.amount || groupFlight.pF || 0).toLocaleString()}
                                            </div>
                                            
                                            <button
                                              className="px-3 py-1 bg-[#093923] text-white rounded hover:bg-[#093923]/90 text-sm font-medium"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                // Create a copy of the selected outbound flight
                                                const updatedOutboundFlight = {...selectedOutboundFlight};
                                                
                                                // Replace the selected inbound option with this group flight
                                                if (Array.isArray(updatedOutboundFlight.inboundOptions[index])) {
                                                  updatedOutboundFlight.inboundOptions[index] = [groupFlight];
                                                } else {
                                                  updatedOutboundFlight.inboundOptions[index] = groupFlight;
                                                }
                                                
                                                // Update the selected outbound flight and select this inbound index
                                                setSelectedOutboundFlight(updatedOutboundFlight);
                                                handleSelectInboundOption(index);
                                              }}
                                            >
                                              Select
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
          
          {/* Load more button for outbound tab */}
          {activeTab === 'outbound' && filteredFlights.length > visibleCount && (
            <div className="flex justify-center mt-4">
              <button
                onClick={loadMoreItems}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Load More Flights ({visibleCount} of {filteredFlights.length})
              </button>
            </div>
          )}
        </div>
      );
    }
    
    // For one-way flights
    return (
      <div className="space-y-6">
        <FlightSearchResults
          flights={filteredFlights}
          onSelectFlight={handleSelectFlight}
          selectedFlight={selectedOutboundFlight}
          loading={isLoading}
          // Props for summary panel
          selectedOutboundFlight={selectedOutboundFlight}
          flightStructureType={flightStructureType}
          onCreateItinerary={handleCreateItinerary}
        />
        
        {/* Load more button */}
        {filteredFlights.length > visibleCount && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreItems}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Load More Flights ({visibleCount} of {filteredFlights.length})
            </button>
          </div>
        )}
      </div>
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
                  ? 'text-[#093923]'
                  : index + 1 < step
                  ? 'text-[#22c35e]'
                  : 'text-gray-400'
              }`}
            >
              <span
                className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                  index + 1 === step
                    ? 'border-[#093923] bg-[#093923]/10'
                    : index + 1 < step
                    ? 'border-[#22c35e] bg-[#22c35e]/10'
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