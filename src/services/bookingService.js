// src/services/bookingService.js
import axios from 'axios';
import config from '../config';
import {
  transformTCBookingResponse,
  transformTCFareRulesResponse,
  transformTCFlightSearchResponse
} from './transformers/flight/tcTransformer';

// API endpoints
const API_BASE_URL = config.API_URL;
const FLIGHT_API_URL = `${API_BASE_URL}/bookings/flight`;
const HOTEL_API_URL = `${API_BASE_URL}/bookings/hotel`;
const ACTIVITY_API_URL = `${API_BASE_URL}/bookings/activity`;
const TRANSFER_API_URL = `${API_BASE_URL}/bookings/transfer`;
const BOOKING_API_URL = `${API_BASE_URL}/bookings`;

// Define provider options
export const FLIGHT_PROVIDERS = [
  { value: 'TC', label: 'Travel Clan' }
  // Add more providers as they become available
];

export const HOTEL_PROVIDERS = [
  { value: 'TC', label: 'Travel Clan' }
  // Removed GRNC provider
];

export const TRANSFER_PROVIDERS = [
  { value: 'LA', label: 'LeAmigo' }
];

export const ACTIVITY_PROVIDERS = [
  { value: 'GRNC', label: 'GRNC' }
  // Add more providers as they become available
];

// Create axios instance with auth token
const authAxios = axios.create();

// Add a request interceptor
authAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.baseURL = API_BASE_URL;
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Provider response transformers
const transformers = {
  flight: {
    TC: {
      search: transformTCFlightSearchResponse,
      fareRules: transformTCFareRulesResponse,
      book: transformTCBookingResponse
    }
    // Add other provider transformers as needed
  },
  hotel: {
    TC: (response) => {
      // Transform TC hotel response to standard format
      return response;
    },
    GRNC: (response) => {
      // Transform GRNC hotel response to standard format
      return response;
    },
  },
  transfer: {
    TC: (response) => {
      // Transform TC transfer response to standard format
      return response;
    },
    GRNC: (response) => {
      // Transform GRNC transfer response to standard format
      return response;
    }
  },
  // Add other booking type transformers
};

// FLIGHT BOOKING SERVICES
const searchFlights = async ({ provider = 'TC', ...flightSearchData }) => {
  try {
    console.log('📡 API REQUEST: searchFlights', {
      provider,
      isRoundTrip: flightSearchData.isRoundTrip,
      from: flightSearchData.origin?.code,
      to: flightSearchData.destination?.code,
      date: flightSearchData.departureDate
    });
    
    // Construct request body based on backend expectations
    const requestBody = {
      provider,
      departureCity: {
        city: flightSearchData.origin.city,
        iata: flightSearchData.origin.code,
        country: flightSearchData.origin.country
      },
      arrivalCity: {
        city: flightSearchData.destination.city,
        iata: flightSearchData.destination.code,
        country: flightSearchData.destination.country
      },
      date: flightSearchData.departureDate,
      returnDate: flightSearchData.returnDate,
      isRoundTrip: flightSearchData.isRoundTrip,
      travelers: flightSearchData.travelersDetails,
      departureTime: flightSearchData.departureTime,
      returnTime: flightSearchData.returnTime,
      cabinClass: flightSearchData.cabinClass || 1
    };
    
    const url = `${FLIGHT_API_URL}/${provider}/search`;
    console.log(`📡 Sending POST to: ${url}`);
    
    // Make the API call
    const response = await authAxios.post(url, requestBody);
    
    // CRITICAL: Log full API response for debugging
    console.log('📡 FULL API RESPONSE:', JSON.stringify(response.data));
    
    console.log('📡 API RESPONSE:', {
      status: response.status,
      success: response.data?.success,
      flightsCount: response.data?.data?.flights?.length,
      isDomestic: response.data?.data?.isDomestic,
      isRoundTrip: response.data?.data?.isRoundTrip,
      hasOutboundFlights: Boolean(response.data?.data?.outboundFlights),
      hasInboundFlights: Boolean(response.data?.data?.inboundFlights),
      outboundFlightsCount: response.data?.data?.outboundFlights?.length,
      inboundFlightsCount: response.data?.data?.inboundFlights?.length,
      rawResponse: response.data
    });
    
    // Check if response is valid before transformation
    if (!response.data || typeof response.data !== 'object') {
      console.error('📡 Invalid response format:', response.data);
      return {
        success: false,
        message: 'Invalid response format from server'
      };
    }
    
    // CRITICAL: Check for domestic round trip structure first (separate outboundFlights/inboundFlights arrays)
    if (response.data.success && 
        response.data.data && 
        response.data.data.outboundFlights && 
        response.data.data.inboundFlights) {
      
      console.log('📡 Detected domestic round trip structure with separate outbound/inbound arrays');
      
      // For domestic round trips, return the response directly - don't transform it
      return response.data;
    }
    
    // For other response types (international round trip, one-way), transform as needed
    const transformer = transformers.flight[provider]?.search;
    const transformedResponse = transformer ? transformer(response.data) : response.data;
    
    console.log('📡 Transformed response:', {
      success: transformedResponse.success,
      flightsCount: transformedResponse.data?.flights?.length
    });
    
    return transformedResponse;
  } catch (error) {
    console.error('📡 API ERROR:', error);
    
    if (error.response) {
      console.error('📡 Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

const createFlightItinerary = async ({ provider = 'TC', items, traceId, flightType }) => {
  try {
    // Validate flight type
    if (!['ONE_WAY', 'DOMESTIC_ROUND_TRIP', 'INTERNATIONAL_ROUND_TRIP'].includes(flightType)) {
      throw new Error('Invalid flight type');
    }

    console.log('Creating flight itinerary:', { 
      provider, 
      items, 
      traceId,
      flightType 
    });
    
    const response = await authAxios.post(
      `${FLIGHT_API_URL}/${provider}/itinerary`,
      {
        items,
        traceId,
        flightType
      }
    );

    console.log('Flight itinerary response:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to create flight itinerary');
    }

    return response.data;
  } catch (error) {
    console.error('Error creating flight itinerary:', error);
    throw error;
  }
};

const getFlightFareRules = async (provider = 'TC', traceId, params) => {
  const response = await authAxios.get(
    `${FLIGHT_API_URL}/${provider}/fare-rules/${traceId}`, 
    { params }
  );
  
  // Transform response based on provider
  const transformer = transformers.flight[provider]?.fareRules;
  return transformer ? transformer(response.data) : response.data;
};

const bookFlight = async ({ provider = 'TC', traceId, itineraryCode }) => {
  try {
    console.log('Calling bookFlight API with data:', { provider, traceId, itineraryCode });
    
    const response = await authAxios.post(
      `${FLIGHT_API_URL}/${provider}/book`,
      {
        provider,
        traceId,
        itineraryCode
      }
    );
    
    console.log('bookFlight API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error booking flight:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to book flight');
  }
};

// HOTEL BOOKING SERVICES
const searchHotelLocations = async (searchString) => {
  const response = await authAxios.get(
    `${HOTEL_API_URL}/locations/search`, 
    { params: { searchString } }
  );
  return response.data;
};

const searchHotels = async ({ provider = 'TC', ...hotelSearchData }) => {
  try {
    // Clean up the request data
    const cleanData = Object.entries(hotelSearchData).reduce((acc, [key, value]) => {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        return acc;
      }
      
      // Skip empty arrays
      if (Array.isArray(value) && value.length === 0) {
        return acc;
      }
      
      // Skip arrays with only null/empty values
      if (Array.isArray(value) && value.every(item => item === null || item === '')) {
        return acc;
      }
      
      // Skip empty objects
      if (typeof value === 'object' && Object.keys(value).length === 0) {
        return acc;
      }
      
      acc[key] = value;
      return acc;
    }, {});

    console.log('📡 API REQUEST: searchHotels', {
      provider,
      ...cleanData
    });

    const response = await authAxios.post(
      `${HOTEL_API_URL}/${provider}/search`, 
      cleanData
    );
    
    console.log('📡 API RESPONSE:', {
      status: response.status,
      success: response.data?.success,
      hotelsCount: response.data?.data?.hotels?.length,
      rawResponse: response.data
    });

    // Transform response based on provider
    const transformer = transformers.hotel[provider];
    const transformedResponse = transformer ? transformer(response.data) : response.data;
    
    return transformedResponse;
  } catch (error) {
    console.error('📡 API ERROR:', error);
    
    if (error.response) {
      console.error('📡 Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    
    throw error;
  }
};

const getHotelDetails = async (provider = 'TC', hotelId, params) => {
  const response = await authAxios.get(
    `${HOTEL_API_URL}/${provider}/${hotelId}`, 
    { params }
  );
  return response.data;
};

const bookHotel = async (data) => {
  try {
    const response = await authAxios.post(`${HOTEL_API_URL}/book`, data);
    console.log('Booking API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in bookHotel:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to book hotel',
      error: error.response?.data || error
    };
  }
};

// ACTIVITY BOOKING SERVICES
const searchActivities = async (searchData) => {
  try {
    const response = await authAxios.post(`${API_BASE_URL}/bookings/activity/${searchData.provider || 'GRNC'}/search`, searchData);
    return response.data;
  } catch (error) {
    console.error('Error searching activities:', error);
    throw error;
  }
};

const getActivityDetails = async (data) => {
  try {
    const response = await authAxios.post(`${API_BASE_URL}/bookings/activity/GRNC/product-details`, data);
    return response.data;
  } catch (error) {
    console.error('Error fetching activity details:', error);
    throw error;
  }
};

const bookActivity = async (bookingData) => {
  try {
    // Make sure we have the essential fields
    if (!bookingData.bookingRef || !bookingData.lead || !bookingData.QuestionAnswers) {
      throw new Error('Missing required booking data');
    }
    
    const provider = bookingData.provider || 'GRNC';
    
    const response = await authAxios.post(
      `${ACTIVITY_API_URL}/${provider}/book`, 
      bookingData
    );
    
    return response.data;
  } catch (error) {
    console.error('Error booking activity:', error);
    throw error;
  }
};

const checkAvailability = async (data) => {
  try {
    const response = await authAxios.post(`${API_BASE_URL}/bookings/activity/GRNC/availability-details`, data);
    return response.data;
  } catch (error) {
    console.error('Error checking activity availability:', error);
    throw error;
  }
};

const createActivityReference = async (data) => {
  try {
    // Create the payload for the API
    const payload = {
      productcode: data.code,
      searchId: data.searchId,
      productoptioncode: data.tourGrade
    };
    
    // Only add starttime if it exists and is not null
    if (data.departureTime) {
      payload.starttime = data.departureTime;
    }
    
    console.log('Creating activity reference with:', payload);
    
    const response = await authAxios.post(`${API_BASE_URL}/bookings/activity/GRNC/reference`, payload);
    return response.data;
  } catch (error) {
    console.error('Error creating activity reference:', error);
    throw error;
  }
};

// TRANSFER BOOKING SERVICES
const searchTransfers = async (searchData) => {
  try {
    const response = await authAxios.post(`${TRANSFER_API_URL}/LA/search`, {
      destination: searchData.destination,
      origin: searchData.origin,
      journey_type: searchData.journey_type,
      pickupDate: searchData.pickupDate,
      pickupTime: searchData.pickupTime,
      returnDate: searchData.journey_type === 'return' ? searchData.returnDate : null,
      returnTime: searchData.journey_type === 'return' ? searchData.returnTime : null
    });
    return response;
  } catch (error) {
    console.error('Error searching transfers:', error);
    throw error;
  }
};

const getTransferDetails = async (provider = 'TC', transferId, params) => {
  const response = await authAxios.get(
    `${TRANSFER_API_URL}/${provider}/${transferId}`, 
    { params }
  );
  return response.data;
};

const bookTransfer = async ({ provider = 'TC', ...transferBookingData }) => {
  const response = await authAxios.post(
    `${TRANSFER_API_URL}/${provider}/book`, 
    transferBookingData
  );
  return response.data;
};

// LOCATION & CITY SERVICES
const getCitiesWithAirports = async () => {
  const response = await authAxios.get(`${config.API_B2C_URL}/cities-with-airports`);
  return response.data;
};

// ITINERARY SERVICES
const createItinerary = async (itineraryData) => {
  const response = await authAxios.post(`${BOOKING_API_URL}/itinerary`, itineraryData);
  return response.data;
};

const getItineraries = async () => {
  const response = await authAxios.get(`${BOOKING_API_URL}/itinerary`);
  return response.data;
};

const getBookings = async (filterOptions = {}) => {
  const response = await authAxios.get(`${BOOKING_API_URL}`, { params: filterOptions });
  return response.data;
};

const getBookingById = async (id) => {
  const response = await authAxios.get(`${BOOKING_API_URL}/${id}`);
  return response.data;
};

// Get transfer quote details
const getTransferQuoteDetails = async (quotationId, quoteId) => {
  try {
    const response = await authAxios.get(`${TRANSFER_API_URL}/quote-details`, {
      params: {
        quotationId,
        quoteId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting transfer quote details:', error);
    throw error;
  }
};

// Get transfer booking details
const getTransferBookingDetails = async (bookingId) => {
  try {
    const response = await authAxios.post(`${TRANSFER_API_URL}/booking/${bookingId}/status`, {
      booking_id: bookingId
    });
    return response.data;
  } catch (error) {
    console.error('Error getting transfer booking details:', error);
    throw error;
  }
};

// Create hotel itinerary
const createHotelItinerary = async (data) => {
  try {
    const response = await authAxios.post(
      `${HOTEL_API_URL}/${data.provider || 'TC'}/itinerary`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error creating itinerary:', error);
    throw new Error(error.response?.data?.message || 'Failed to create itinerary');
  }
};

// Recheck hotel price
const recheckPrice = async (data) => {
  try {
    console.log('Calling recheck price API with:', data);
    const response = await authAxios.get(
      `${HOTEL_API_URL}/TC/recheck-price`,
      {
        params: {
          itineraryCode: data.itineraryCode,
          traceId: data.traceId
        }
      }
    );
    console.log('Recheck price response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error rechecking price:', error);
    throw new Error(error.response?.data?.message || 'Failed to recheck price');
  }
};

const selectRoomRates = async (data) => {
  try {
    const response = await authAxios.post(
      `${HOTEL_API_URL}/TC/room-rates`, 
      data
    );
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Failed to select room rates',
      error: error.response?.data
    };
  }
};

const allocateGuests = async (data) => {
  try {
    console.log('Calling allocateGuests API with data:', data);
    
    const response = await authAxios.post(
      `${HOTEL_API_URL}/TC/allocate-guests`,
      data
    );
    
    console.log('allocateGuests API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error allocating guests:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to allocate guests');
  }
};

const allocatePassengers = async (data) => {
  try {
    console.log('Calling allocatePassengers API with data:', data);
    
    const response = await authAxios.post(
      `${FLIGHT_API_URL}/TC/allocate-passengers`,
      data
    );
    
    console.log('allocatePassengers API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error allocating passengers:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to allocate passengers');
  }
};

// Flight booking details
const getBookingDetails = async ({ provider = 'TC', bmsBookingCode }) => {
  try {
    console.log('Calling getBookingDetails API with data:', { provider, bmsBookingCode });
    
    const response = await authAxios.get(
      `${FLIGHT_API_URL}/${provider}/booking-details/${bmsBookingCode}`
    );
    
    console.log('getBookingDetails API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting booking details:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to get booking details');
  }
};

// Hotel booking details
const getHotelBookingDetails = async (bookingCode, date, city) => {
  try {
    console.log('Calling getHotelBookingDetails API with data:', { bookingCode, date, city });
    
    // Create query parameters for date and city
    const params = {};
    if (date) params.date = date;
    if (city) params.city = city;
    
    const response = await authAxios.get(
      `${HOTEL_API_URL}/TC/booking-details/${bookingCode}`,
      { params }
    );
    
    console.log('getHotelBookingDetails API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting hotel booking details:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
    } else if (error.request) {
      console.error('Error request (no response received):', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw new Error(error.response?.data?.message || 'Failed to get hotel booking details');
  }
};

const recheckRate = async (data) => {
  try {
    console.log('Calling recheckRate API with data:', data);
    
    const response = await authAxios.post(
      `${FLIGHT_API_URL}/TC/recheck-rate`,
      data
    );
    
    console.log('recheckRate API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error rechecking rate:', error);
    throw error;
  }
};

// --- New Customer Search Service --- 
const searchCustomers = async (query) => {
  try {
    console.log('📡 API REQUEST: searchCustomers', { query });
    const response = await authAxios.get('/users/search-b2c', { 
      params: { query }
    });
    console.log('📡 API RESPONSE: searchCustomers', response.data);
    return response.data;
  } catch (error) {
    console.error('📡 API ERROR: searchCustomers', error);
    if (error.response) {
      console.error('📡 Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
    throw new Error(error.response?.data?.message || 'Failed to search customers');
  }
};
// ------------------------------------

// --- New Itinerary Inquiry Submission Service --- 
const submitItineraryInquiry = async (payload) => {
  try {
    console.log('📡 API REQUEST: submitItineraryInquiry to B2C', payload);
    
    // Target the B2C endpoint
    const url = `${config.API_B2C_URL}/itineraryInquiry`; // Use API_B2C_URL
    console.log(`📡 Using B2C URL: ${url}`);

    // Manually get the CRM token (as the B2C endpoint seems to require it)
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      // If no token, we know the B2C endpoint will reject, throw error early?
      // Or let the API call fail as it did before.
      console.warn('No CRM token found for B2C itineraryInquiry call');
      // Depending on backend logic, this might still work if B2C auth is optional/different
      // For now, we proceed and let the backend decide based on its config.
    }

    // Use standard axios, providing the full URL and manual headers
    const response = await axios.post(url, payload, { headers });

    console.log('📡 API RESPONSE: submitItineraryInquiry', response.data);
    return response.data; // Return the full response data
  } catch (error) {
    console.error('📡 API ERROR: submitItineraryInquiry', error);
    if (error.response) {
      console.error('📡 Error response:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to submit itinerary inquiry');
    } else {
      throw new Error('Network error or failed to submit itinerary inquiry');
    }
  }
};
// ---------------------------------------------

// --- Get CRM Inquiries --- (Renamed from getCrmItineraries)
const getCrmInquiries = async () => {
  try {
    console.log('📡 API REQUEST: getCrmInquiries');
    
    // Construct the full URL for inquiries
    const url = `${config.API_URL}/inquiries/`; // Updated path
    console.log(`📡 Calling URL: ${url}`);

    const response = await authAxios.get(url);

    console.log('📡 API RESPONSE: getCrmInquiries', response.data);
    return response.data;
  } catch (error) {
    console.error('📡 API ERROR: getCrmInquiries', error);
    if (error.response) {
      console.error('📡 Error response:', { status: error.response.status, data: error.response.data });
      throw new Error(error.response?.data?.message || 'Failed to fetch CRM inquiries');
    } else {
      throw new Error('Network error or failed to fetch CRM inquiries');
    }
  }
};
// --------------------------

// --- Create Itinerary from Inquiry (using B2C endpoint) ---
const createItineraryFromInquiry = async (inquiryToken) => {
  try {
    console.log('📡 API REQUEST: createItineraryFromInquiry', { inquiryToken });
    
    // Target the B2C endpoint using API_B2C_URL
    const url = `${config.API_B2C_URL}/itinerary/${inquiryToken}`; 
    console.log(`📡 Calling B2C URL for Itinerary Creation: ${url}`);

    // Manually get the CRM token (assuming B2C endpoint requires it based on previous context)
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn('No CRM token found for createItineraryFromInquiry call to B2C endpoint');
      // Let the backend handle the missing token error if needed
    }

    // Use standard axios, providing the full URL and manual headers
    // B2C endpoint is POST as per b2c/routes/itineraryRoutes/itineraryRoutes.js
    const response = await axios.post(url, {}, { headers }); 

    console.log('📡 API RESPONSE: createItineraryFromInquiry', response.data);
    return response.data; // Return the newly created itinerary object
  } catch (error) {
    console.error('📡 API ERROR: createItineraryFromInquiry', error);
    if (error.response) {
      console.error('📡 Error response:', { status: error.response.status, data: error.response.data });
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to create itinerary from inquiry');
    } else {
      throw new Error('Network error or failed to create itinerary');
    }
  }
};
// ---------------------------------------------------------

// New function to assign user to an inquiry
const assignUserToInquiry = async (inquiryToken, userDetails) => {
  if (!inquiryToken || !userDetails || !userDetails._id) {
    console.error('assignUserToInquiry: Missing inquiryToken or userDetails/_id');
    throw new Error('Inquiry token and User details are required for assignment.');
  }
  const url = `${config.API_URL}/inquiries/${inquiryToken}/assign-user`;

  // Construct payload with all necessary fields for backend to update Inquiry/Itinerary userInfo
  const payload = {
    userId: userDetails._id,
    firstName: userDetails.firstName,
    lastName: userDetails.lastName,
    email: userDetails.email,
    phoneNumber: userDetails.phoneNumber, // Assuming backend returns national number
    country: userDetails.country,         // Full name
    countryCode: userDetails.countryCode, // Prefix (e.g., +91) - Now provided by backend
    dob: userDetails.dob
  };

  console.log(`📡 API REQUEST: assignUserToInquiry (PUT ${url})`, payload);

  try {
    const response = await authAxios.put(url, payload); // Send the full payload
    console.log('📡 API RESPONSE: assignUserToInquiry', response.data);

    if (!response.data || !response.data.message) { // Check for at least a message
      // Consider success even without specific data if API returns 200/204
      if (response.status >= 200 && response.status < 300) {
          console.warn('assignUserToInquiry: API returned success status but no message/data.');
          return { success: true, message: 'User assigned (no content)' }; // Assume success on 2xx
      }
      throw new Error('Invalid response format after assigning user.');
    }

    // Assuming the backend sends a simple success message or updated inquiry
    return { 
      success: true, // Assuming success if no error is thrown
      message: response.data.message, 
      updatedInquiry: response.data.updatedInquiry // Pass along updated data if backend sends it
    };

  } catch (error) {
    console.error('📡 API ERROR: assignUserToInquiry', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to assign user to inquiry.';
    throw new Error(errorMessage); // Re-throw the error for the component to handle
  }
};

// --- New Markup Settings Service --- 
const getMarkupSettings = async () => {
  try {
    console.log('📡 API REQUEST: getMarkupSettings');
    // Use the B2C base URL as the markup settings are likely global
    const url = `${config.API_B2C_URL}/markup`;
    console.log(`📡 Calling URL: ${url}`);

    // Use standard axios as auth might not be needed for settings
    const response = await axios.get(url);

    console.log('📡 API RESPONSE: getMarkupSettings', response.data);
    if (!response.data || !response.data.markups || !response.data.tcsRates) {
      throw new Error('Invalid markup settings format received from server.');
    }
    return response.data; // Should contain { markups: {...}, tcsRates: {...} }
  } catch (error) {
    console.error('📡 API ERROR: getMarkupSettings', error);
    if (error.response) {
      console.error('📡 Error response:', { status: error.response.status, data: error.response.data });
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch markup settings');
  }
};
// ---------------------------------

// Fetch a specific itinerary by its token
const getItineraryByToken = async (itineraryToken, inquiryToken) => {
  if (!itineraryToken) {
    console.error('getItineraryByToken called without an itineraryToken.');
    throw new Error('Itinerary token is required.');
  }
  if (!inquiryToken) {
    console.error('getItineraryByToken called without an inquiryToken.');
    throw new Error('Inquiry token is required for fetching itinerary details.');
  }

  console.log(`Fetching itinerary with itineraryToken: ${itineraryToken}, inquiryToken: ${inquiryToken}`);
  const url = `${config.API_B2C_URL}/itinerary/${itineraryToken}`; 
  try {
    const response = await authAxios.get(url, {
      headers: {
        'x-inquiry-token': inquiryToken
      }
    });
    const itineraryData = response.data;
    if (itineraryData && itineraryData.itineraryToken === itineraryToken) {
      console.log('Successfully fetched itinerary:', itineraryData);
      return itineraryData;
    } else {
      console.error('Failed to fetch itinerary or token mismatch. Response:', response.data);
      throw new Error('Could not retrieve the specified itinerary.');
    }
  } catch (error) {
    console.error(`Error fetching itinerary ${itineraryToken}:`, error.response?.data || error.message);
    const errorMessage = error.response?.data?.message || 'Failed to load itinerary details.';
    throw new Error(errorMessage); 
  }
};

// --- Update Flight Selections (Seats, Baggage, Meals) ---
const updateFlightSelections = async ({ itineraryToken, inquiryToken, selections }) => {
  if (!itineraryToken || !inquiryToken || !selections) {
    console.error('updateFlightSelections: Missing required parameters');
    throw new Error('Itinerary token, inquiry token, and selections are required.');
  }
  // Use the B2C API base URL as this likely modifies the shared itinerary
  const url = `${config.API_B2C_URL}/itinerary/${itineraryToken}/flight/seats`;
  console.log(`📡 API REQUEST: updateFlightSelections (PUT ${url})`, selections);

  try {
    const response = await authAxios.put(url, selections, {
      headers: {
        'X-Inquiry-Token': inquiryToken,
        // Authorization header is automatically added by authAxios interceptor
      },
    });
    console.log('📡 API RESPONSE: updateFlightSelections', response.data);
    // Assuming success returns the updated itinerary or at least a success message
    return response.data;
  } catch (error) {
    console.error('📡 API ERROR: updateFlightSelections', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update flight selections.';
    throw new Error(errorMessage);
  }
};
// -----------------------------------------------------

const bookingService = {
  // Flight services
  searchFlights,
  createFlightItinerary,
  getFlightFareRules,
  bookFlight,
  allocatePassengers,
  recheckRate,
  
  // Hotel services
  searchHotelLocations,
  searchHotels,
  getHotelDetails,
  bookHotel,
  createHotelItinerary,
  recheckPrice,
  getHotelBookingDetails,
  
  // Activity services
  searchActivities,
  getActivityDetails,
  bookActivity,
  checkAvailability,
  createActivityReference,
  
  // Transfer services
  searchTransfers,
  getTransferDetails,
  bookTransfer,
  
  // Location services
  getCitiesWithAirports,
  
  // Itinerary services
  createItinerary,
  getItineraries,
  
  // General booking services
  getBookings,
  getBookingById,
  
  // New transfer quote details service
  getTransferQuoteDetails,
  
  // New transfer booking details service
  getTransferBookingDetails,
  
  // New room rates service
  selectRoomRates,

  // New guest allocation service
  allocateGuests,

  // New booking details service
  getBookingDetails,

  // Add the new search function
  searchCustomers,

  // Add the new inquiry submission function
  submitItineraryInquiry,

  // Add the new itinerary creation function
  createItineraryFromInquiry,

  // Add the new CRM inquiries fetch function
  getCrmInquiries,

  // New function to assign user to inquiry
  assignUserToInquiry,

  // New function to get markup settings
  getMarkupSettings,

  // Fetch a specific itinerary by its token
  getItineraryByToken,

  // Add the new function
  updateFlightSelections
};

export default bookingService;