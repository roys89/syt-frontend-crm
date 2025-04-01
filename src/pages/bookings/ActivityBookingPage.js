// src/pages/bookings/ActivityBookingPage.js
import { ArrowPathIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { toast } from 'react-toastify';
import ActivityDestination from '../../components/activities/ActivityDestination';
import ActivityDetailsModal from '../../components/activities/ActivityDetailsModal';
import ActivityFilterPanel from '../../components/activities/ActivityFilterPanel';
import ActivitySearchResult from '../../components/activities/ActivitySearchResult';
import TravelerDetailsModal from '../../components/activities/TravelerDetailsModal';
import ProviderSelector from '../../components/common/ProviderSelector';
import bookingService, { ACTIVITY_PROVIDERS } from '../../services/bookingService';

const ActivityBookingPage = () => {
  const [step, setStep] = useState(1); // 1 = Search, 2 = Results, 3 = Details, 4 = Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activityDetails, setActivityDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('GRNC'); // Default to GRNC
  const [bookingData, setBookingData] = useState(null);
  const [showTravelerModal, setShowTravelerModal] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  
  // Filter state
  const [activeFilters, setActiveFilters] = useState({
    nameSearch: '',
    priceRange: {
      min: '',
      max: '',
    },
    sortBy: 'relevance'
  });

  // Form state
  const [formData, setFormData] = useState({
    provider: 'GRNC',
    currency: 'INR',
    fromDate: '',
    toDate: '',
    travelers: {
      adults: 1,
      children: []
    },
    selectedCities: []
  });

  // Form validation
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.selectedCities.length) newErrors.cities = 'At least one city is required';
    if (!formData.fromDate) newErrors.fromDate = 'Date is required';
    
    // Validate date
    if (formData.fromDate) {
      const activityDate = new Date(formData.fromDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (activityDate < today) {
        newErrors.fromDate = 'Date cannot be in the past';
      }
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

  // Handle destination selection
  const handleDestinationSelect = (selectedCities) => {
    setFormData(prev => ({
      ...prev,
      selectedCities
    }));
  };

  // Handle travelers change
  const handleTravelersChange = (travelers) => {
    setFormData(prev => ({
      ...prev,
      travelers
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

  // Handle filter change
  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  // Handle search submission
  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    if (!formData.selectedCities || formData.selectedCities.length === 0) {
      toast.error('Please select a city');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Prepare search data for the API
      const searchData = {
        provider: formData.provider,
        currency: formData.currency,
        fromDate: formData.fromDate,
        toDate: formData.fromDate, // Using same date for simplicity
        adults: formData.travelers.adults,
        childAges: formData.travelers.children,
        cities: formData.selectedCities // Send the complete city object
      };
      
      // Call the activity search API
      const response = await bookingService.searchActivities(searchData);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to search activities');
      }

      // Flatten the results from all cities into a single array
      const allActivities = response.data.reduce((acc, cityResult) => {
        if (cityResult.success && cityResult.activities) {
          return [...acc, ...cityResult.activities.map(activity => ({
            ...activity,
            city: cityResult.cityId // Add city ID to each activity
          }))];
        }
        return acc;
      }, []);

      if (allActivities.length === 0) {
        toast.info('No activities found for the selected criteria');
        return;
      }

      // Reset filters when performing a new search
      setActiveFilters({
        nameSearch: '',
        priceRange: {
          min: '',
          max: '',
        },
        sortBy: 'relevance'
      });

      setSearchResults(allActivities);
      setStep(2);
    } catch (error) {
      console.error('Error searching activities:', error);
      toast.error(error.message || 'Failed to search activities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle activity selection
  const handleSelectActivity = async (activity) => {
    setSelectedActivity(activity);
    setIsLoadingDetails(true);
    try {
      console.log('Fetching activity details for:', activity);
      const response = await bookingService.getActivityDetails({
        code: activity.code,
        groupCode: activity.groupCode,
        searchId: activity.searchId
      });
      console.log('Activity details response:', response);
      setActivityDetails(response.data);
      setStep(3); // Move to the details step
    } catch (error) {
      console.error('Error fetching activity details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch activity details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedActivity(null);
    setActivityDetails(null);
    setStep(2); // Go back to results
  };

  const handlePackageSelection = (packageData) => {
    console.log('Selected package data:', packageData);
    
    // Verify we have reference data before showing traveler modal
    if (!packageData.referenceData) {
      toast.error('Failed to get booking reference. Please try again.');
      return;
    }
    
    setBookingData(packageData);
    setShowTravelerModal(true);
  };

  const handleCloseTravelerModal = () => {
    setShowTravelerModal(false);
  };

  const handleSubmitTravelerDetails = async (bookingPayload) => {
    try {
      setIsLoading(true);
      
      // Add any missing fields but don't override existing ones
      const completeBookingData = {
        ...bookingPayload,
        // Only add these if they're not already in the payload
        activityCode: bookingPayload.activityCode || selectedActivity.code,
        fromDate: bookingPayload.fromDate || formData.fromDate,
        toDate: bookingPayload.toDate || formData.fromDate,
        provider: bookingPayload.provider || formData.provider || 'GRNC',
        // Make sure ratekey is present and correct
        ratekey: bookingPayload.ratekey || selectedActivity.ratekey
      };
      
      console.log('Booking activity with data:', completeBookingData);
      
      // Call the booking API
      const response = await bookingService.bookActivity(completeBookingData);
      
      // Check for top-level success flag
      if (!response.success) {
        throw new Error(response.message || 'Failed to book activity');
      }

      // Check for nested error response case
      // When the API returns a nested structure with its own success/error flags
      if (response.data && typeof response.data === 'object') {
        // Check if the inner data has a 'success' flag that is false
        if (response.data.success === false) {
          const errorMessage = response.data.errorMessages
            ? response.data.errorMessages.join(', ')
            : response.data.errorType || 'Booking failed on provider side';
          
          throw new Error(errorMessage);
        }
        
        // Check for empty or null data which might indicate a problem
        if (response.data.data === null && response.data.errorMessages?.length > 0) {
          throw new Error(response.data.errorMessages.join(', '));
        }
      }
      
      // If we reach here, booking was successful
      toast.success('Activity booked successfully!');
      setShowTravelerModal(false);
      setStep(4); // Move to confirmation
      
      // Store booking response for confirmation screen
      setBookingData({
        ...bookingData,
        bookingResponse: response.data,
        bookingStatus: 'confirmed'
      });

      return response; // Return the successful response
    } catch (error) {
      console.error('Error booking activity:', error);
      toast.error(error.message || 'Failed to book activity. Please try again.');
      throw error; // Re-throw the error to be caught by the modal
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Activity Booking</h1>
        <p className="mt-2 text-gray-600">Search and book tours, attractions, and experiences</p>
      </div>

      {/* Progress Steps */}
      <nav className="flex items-center justify-center space-x-4 mb-8">
        {['Search', 'Select Activity', 'Activity Details', 'Confirmation'].map((stepName, index) => (
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
          </div>
        ))}
      </nav>

      {/* Step 1: Search Form */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Activities</h2>
          <form onSubmit={handleSearch}>
            <div className="space-y-6">
              <div>
                <ProviderSelector
                  providers={ACTIVITY_PROVIDERS}
                  selectedProvider={selectedProvider}
                  onChange={handleProviderChange}
                />
              </div>

              <ActivityDestination
                selectedCities={formData.selectedCities}
                onSelect={handleDestinationSelect}
              />

              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Activity Date
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="date"
                    name="fromDate"
                    id="fromDate"
                    min={new Date().toISOString().split('T')[0]}
                    className={`block w-full pl-10 pr-3 py-2 border ${errors.fromDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    value={formData.fromDate}
                    onChange={handleChange}
                  />
                </div>
                {errors.fromDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.fromDate}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Travelers
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleTravelersChange({
                        ...formData.travelers,
                        adults: Math.max(1, formData.travelers.adults - 1)
                      })}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{formData.travelers.adults}</span>
                    <button
                      type="button"
                      onClick={() => handleTravelersChange({
                        ...formData.travelers,
                        adults: formData.travelers.adults + 1
                      })}
                      className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">Adults</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="AED">UAE Dirham (AED)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                    Searching...
                  </>
                ) : (
                  'Search Activities'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Search Results */}
      {step === 2 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              <p className="text-gray-600 mt-1">
                {searchResults.length} activities found
                {formData.selectedCities.length > 0 && ` in ${formData.selectedCities.map(city => city.name).join(', ')}`}
              </p>
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

          <div className="flex">
            {/* Filter Section */}
            <div className="w-80 mr-6 flex-shrink-0">
              <ActivityFilterPanel 
                onApplyFilters={handleFilterChange}
                initialFilters={activeFilters}
              />
            </div>

            {/* Results Section */}
            <div className="flex-1">
              <ActivitySearchResult
                searchResults={searchResults}
                formData={formData}
                onSelectActivity={handleSelectActivity}
                onBackToSearch={() => setStep(1)}
                isLoading={isLoading}
                activeFilters={activeFilters}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Activity Details */}
      {step === 3 && selectedActivity && activityDetails && (
        <div className="mb-8">
          <ActivityDetailsModal
            activity={selectedActivity}
            details={activityDetails}
            onClose={handleCloseDetails}
            onConfirm={handlePackageSelection}
            isInline={true}
          />
        </div>
      )}

      {/* Step 4: Confirmation */}
      {step === 4 && bookingData && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Booking Confirmation</h2>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Activity Details</h3>
            
            <div className="flex flex-col md:flex-row md:gap-6">
              <div className="md:w-1/3 h-48 bg-gray-200 mb-4 md:mb-0">
                <img 
                  src={bookingData.imgURL || activityDetails?.images?.[0]?.variants?.[0]?.url || selectedActivity?.imgURL} 
                  alt={bookingData.title || activityDetails?.title} 
                  className="w-full h-full object-cover rounded"
                />
              </div>
              
              <div className="md:w-2/3">
                <h4 className="text-xl font-bold">{bookingData.title || activityDetails?.title}</h4>
                <div className="mt-1">
                  <p className="text-sm text-gray-500">Tour Grade: {bookingData.tourGrade?.description}</p>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{formData.fromDate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="font-medium">{activityDetails?.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Start Time</p>
                    <p className="font-medium">{bookingData.departureTime || 'Flexible'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Participants</p>
                    <p className="font-medium">
                      {bookingData.adults} Adult{bookingData.adults > 1 ? 's' : ''}
                      {bookingData.children > 0 ? `, ${bookingData.children} Children` : ''}
                      {bookingData.infants > 0 ? `, ${bookingData.infants} Infants` : ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Price Details</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Package Price</p>
                <p>{bookingData.currency} {bookingData.amount?.toLocaleString()}</p>
              </div>
              <div className="flex justify-between">
                <p>Taxes & Fees</p>
                <p>Included</p>
              </div>
              <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold">
                <p>Total Price</p>
                <p>{bookingData.currency} {bookingData.amount?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-green-800 mb-2">Booking Successful!</h3>
            <p className="text-green-700">
              Your booking has been confirmed. A confirmation email has been sent to your registered email address.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <button
              type="button"
              className="flex-1 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setStep(1)}
            >
              Book Another Activity
            </button>
          </div>
        </div>
      )}

      {/* Traveler Details Modal */}
      {showTravelerModal && bookingData && (
        <TravelerDetailsModal
          isOpen={showTravelerModal}
          onClose={handleCloseTravelerModal}
          onSubmit={handleSubmitTravelerDetails}
          numberOfTravelers={bookingData.numberOfTravelers}
          bookingQuestions={bookingData.bookingQuestions}
          languageGuides={bookingData.languageGuides}
          referenceData={bookingData.referenceData}
          activity={{
            ...selectedActivity,
            details: activityDetails
          }}
          bookingData={bookingData}
        />
      )}

      {/* Additional Information */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Activity prices are per person and include applicable taxes and fees. 
          Cancellation policy varies by activity provider. Please be at the meeting point 15 minutes before the scheduled time.
        </p>
      </div>
    </div>
  );
};

export default ActivityBookingPage;