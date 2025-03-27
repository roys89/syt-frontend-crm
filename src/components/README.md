# Multi-Provider Booking System

This implementation allows the CRM frontend to work with multiple providers for flight, hotel, transfer, and activity bookings. The system has been designed to be flexible, scalable, and to handle different response formats from each provider.

## Architecture

### Backend

1. **Provider-specific Services**
   - Located in `syt-backend/shared/services`
   - Organized by service type (flight, hotel, etc.) and provider (TC, LA, GRNC)
   - Example: `syt-backend/shared/services/flight/tc/FlightSearchService.js`

2. **Provider Mapping**
   - Controllers map requests to the appropriate provider service
   - `getProviderService` function retrieves the correct service based on provider and service type
   - Default provider is 'TC' (Travel Clan)

3. **Routes**
   - Routes include optional provider parameter: `/:provider?/search`
   - Backwards compatibility maintained with legacy routes

4. **Database**
   - Booking model includes `provider` field to track which provider was used
   - Field is required and restricted to valid providers: 'TC', 'LA', 'GRNC'

### Frontend

1. **Provider Selection UI**
   - Users can select from available providers for each booking type
   - Different providers are available for different booking types:
     - Flights: TC (Travel Clan)
     - Hotels: TC (Travel Clan), GRNC
     - Transfers: LA (Le Amigo)
     - Activities: GRNC

2. **Response Transformers**
   - Located in `syt-frontend-crm/src/services/transformers`
   - Organized by service type and provider
   - Transform provider-specific responses to a standardized format
   - Example: `syt-frontend-crm/src/services/transformers/flight/tcTransformer.js`

3. **Booking Service**
   - Services include provider parameter in all API calls
   - Apply the appropriate transformer based on provider
   - Default providers set for each service type

4. **UI Components**
   - Components display data in a standardized format
   - Agnostic to the provider, handling any provider's transformed data

## Provider Configuration

The system is currently configured with the following providers:

```javascript
// Flight providers
export const FLIGHT_PROVIDERS = [
  { value: 'TC', label: 'Travel Clan' }
];

// Hotel providers
export const HOTEL_PROVIDERS = [
  { value: 'TC', label: 'Travel Clan' },
  { value: 'GRNC', label: 'GRNC' }
];

// Transfer providers
export const TRANSFER_PROVIDERS = [
  { value: 'LA', label: 'Le Amigo' }
];

// Activity providers
export const ACTIVITY_PROVIDERS = [
  { value: 'GRNC', label: 'GRNC' }
];
```

## Adding a New Provider

To add a new provider:

1. Create provider-specific services in `syt-backend/shared/services`
2. Update the `Providers` object in the controllers
3. Create a response transformer in `syt-frontend-crm/src/services/transformers`
4. Add the provider to the appropriate provider list in `bookingService.js`

## Pagination and Filtering

The system includes support for pagination and filtering of search results, particularly important for flight searches which can return hundreds of results. The implementation:

1. Uses chunk-based pagination similar to B2C implementation
2. Provides filtering capabilities for airlines, stops, and price range
3. Supports infinite scrolling in the frontend
4. Optimized to prevent frontend performance issues with large result sets 