    // src/pages/bookings/ItineraryBookingPage.js
import { ArrowPathIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AirportSelector from '../../components/booking/AirportSelector';
import CitySelector from '../../components/booking/CitySelector';

// Component for adding a booking to an itinerary
const AddBookingItem = ({ type, onAdd, onCancel }) => {
  const [destination, setDestination] = useState(null);
  const [date, setDate] = useState('');
  const [bookingType, setBookingType] = useState(type || 'flight');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!destination) {
      toast.error('Please select a destination');
      return;
    }
    
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    
    // Create a booking item based on type
    const bookingItem = {
      id: Date.now().toString(),
      type: bookingType,
      destination: destination,
      date: date,
      status: 'pending',
      // Add other default values based on booking type
    };
    
    onAdd(bookingItem);
  };
  
  return (
    <div className="border border-dashed border-gray-300 rounded-md p-4 bg-gray-50">
      <h3 className="text-lg font-medium mb-4">Add {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Booking Type
          </label>
          <select
            value={bookingType}
            onChange={(e) => setBookingType(e.target.value)}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="flight">Flight</option>
            <option value="hotel">Hotel</option>
            <option value="activity">Activity</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Destination
          </label>
          {bookingType === 'flight' ? (
            <AirportSelector
              selectedAirport={destination}
              onChange={setDestination}
            />
          ) : (
            <CitySelector
              selectedCity={destination}
              onChange={setDestination}
            />
          )}
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add to Itinerary
          </button>
        </div>
      </form>
    </div>
  );
};

// Component for a booking item in the itinerary
const BookingItem = ({ booking, onRemove, onEdit }) => {
  const getBookingTypeDetails = () => {
    switch (booking.type) {
      case 'flight':
        return {
          icon: (
            <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          linkTo: '/bookings/flight'
        };
      case 'hotel':
        return {
          icon: (
            <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          linkTo: '/bookings/hotel'
        };
      case 'activity':
        return {
          icon: (
            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          linkTo: '/bookings/activity'
        };
      case 'transfer':
        return {
          icon: (
            <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          linkTo: '/bookings/transfer'
        };
      default:
        return {
          icon: (
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          linkTo: '/bookings/create'
        };
    }
  };
  
  const { icon, bgColor, borderColor, linkTo } = getBookingTypeDetails();
  
  return (
    <div className={`rounded-md border ${borderColor} ${bgColor} p-4`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="mr-4 mt-1">
            {icon}
          </div>
          <div>
            <h4 className="text-lg font-medium capitalize">{booking.type}</h4>
            <p className="text-sm text-gray-600">
              {booking.destination?.name || booking.destination?.city} {booking.destination?.code ? `(${booking.destination.code})` : ''}
            </p>
            <p className="text-sm text-gray-600">{booking.date}</p>
            <p className="mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'}`}
              >
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Link
            to={linkTo}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <button
            onClick={() => onRemove(booking.id)}
            className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <TrashIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};

const ItineraryBookingPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [addingBookingType, setAddingBookingType] = useState(null);
  
  // Itinerary form state
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    customer: '',
    notes: '',
    bookings: []
  });
  
  // Form validation
  const [errors, setErrors] = useState({});
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Itinerary name is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.customer.trim()) newErrors.customer = 'Customer name is required';
    
    // Validate dates
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (endDate < startDate) {
        newErrors.endDate = 'End date must be after start date';
      }
    }
    
    // Validate that there's at least one booking
    if (formData.bookings.length === 0) {
      newErrors.bookings = 'Add at least one booking to the itinerary';
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
  
  // Add booking to itinerary
  const handleAddBooking = (bookingItem) => {
    setFormData(prev => ({
      ...prev,
      bookings: [...prev.bookings, bookingItem]
    }));
    
    setIsAddingBooking(false);
    setAddingBookingType(null);
  };
  
  // Remove booking from itinerary
  const handleRemoveBooking = (bookingId) => {
    setFormData(prev => ({
      ...prev,
      bookings: prev.bookings.filter(booking => booking.id !== bookingId)
    }));
  };
  
  // Start adding a booking
  const handleStartAddBooking = (type) => {
    setAddingBookingType(type);
    setIsAddingBooking(true);
  };
  
  // Create the itinerary
  const handleCreateItinerary = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Call API to create itinerary
      // const response = await bookingService.createItinerary(formData);
      
      // Show success message
      toast.success('Itinerary created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        customer: '',
        notes: '',
        bookings: []
      });
      
      // Redirect to bookings page
      // history.push('/bookings');
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast.error('Failed to create itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Itinerary</h1>
        <p className="mt-2 text-gray-600">Create a comprehensive travel plan with multiple bookings</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <form onSubmit={handleCreateItinerary}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Itinerary Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                placeholder="e.g. Dubai Summer Vacation 2025"
                className={`block w-full py-2 px-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                id="startDate"
                min={new Date().toISOString().split('T')[0]}
                className={`block w-full py-2 px-3 border ${errors.startDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={formData.startDate}
                onChange={handleChange}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                id="endDate"
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                className={`block w-full py-2 px-3 border ${errors.endDate ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={formData.endDate}
                onChange={handleChange}
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                name="customer"
                id="customer"
                placeholder="Enter customer name"
                className={`block w-full py-2 px-3 border ${errors.customer ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={formData.customer}
                onChange={handleChange}
              />
              {errors.customer && (
                <p className="mt-1 text-sm text-red-600">{errors.customer}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                id="notes"
                rows="3"
                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Any special requirements or additional information"
                value={formData.notes}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Bookings</h3>
            
            {formData.bookings.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-md">
                <p className="text-gray-500">No bookings added yet</p>
                <p className="text-sm text-gray-400 mt-1">Use the buttons below to add flights, hotels, activities, or transfers</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {formData.bookings.map((booking) => (
                  <BookingItem
                    key={booking.id}
                    booking={booking}
                    onRemove={handleRemoveBooking}
                  />
                ))}
              </div>
            )}
            
            {errors.bookings && (
              <p className="mt-1 text-sm text-red-600">{errors.bookings}</p>
            )}
            
            {isAddingBooking ? (
              <AddBookingItem
                type={addingBookingType}
                onAdd={handleAddBooking}
                onCancel={() => {
                  setIsAddingBooking(false);
                  setAddingBookingType(null);
                }}
              />
            ) : (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => handleStartAddBooking('flight')}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Flight
                </button>
                <button
                  type="button"
                  onClick={() => handleStartAddBooking('hotel')}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Hotel
                </button>
                <button
                  type="button"
                  onClick={() => handleStartAddBooking('activity')}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Activity
                </button>
                <button
                  type="button"
                  onClick={() => handleStartAddBooking('transfer')}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Transfer
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link
              to="/bookings"
              className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 inline-block" />
                  Creating...
                </>
              ) : (
                'Create Itinerary'
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Creating an itinerary allows you to organize multiple bookings for a customer's trip.
          You can add flights, hotels, activities, and transfers to create a comprehensive travel plan.
        </p>
      </div>
    </div>
  );
};

export default ItineraryBookingPage;