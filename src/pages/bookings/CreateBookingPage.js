// src/pages/bookings/CreateBookingPage.js
import { HeartIcon, MapIcon, PaperAirplaneIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

const BookingOption = ({ title, description, icon: Icon, color, path }) => {
  return (
    <Link 
      to={path}
      className="relative block p-8 overflow-hidden border border-gray-100 rounded-lg transition-all hover:shadow-lg hover:border-gray-200"
    >
      <span className={`absolute inset-x-0 bottom-0 h-2 ${color}`}></span>
      <div className="flex items-center gap-4">
        <div className={`p-3 text-white ${color} rounded-lg`}>
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h5 className="text-xl font-bold text-gray-900">{title}</h5>
          <p className="mt-1 text-xs font-medium text-gray-600">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const CreateBookingPage = () => {
  const navigate = useNavigate();
  
  // Booking options configuration
  const bookingOptions = [
    {
      title: 'Flight Booking',
      description: 'Search and book flights for your customers',
      icon: PaperAirplaneIcon,
      color: 'bg-blue-600',
      path: '/bookings/flight'
    },
    {
      title: 'Hotel Booking',
      description: 'Find and book accommodations worldwide',
      icon: HeartIcon,
      color: 'bg-red-600',
      path: '/bookings/hotel'
    },
    {
      title: 'Activity Booking',
      description: 'Book tours, attractions, and experiences',
      icon: MapIcon,
      color: 'bg-green-600',
      path: '/bookings/activity'
    },
    {
      title: 'Transfer Booking',
      description: 'Arrange airport transfers and transportation',
      icon: TruckIcon,
      color: 'bg-purple-600',
      path: '/bookings/transfer'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900">Create Booking</h1>
          <p className="mt-2 text-lg text-gray-600">
            Choose the type of booking you want to create for your customer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookingOptions.map((option, index) => (
            <BookingOption key={index} {...option} />
          ))}
        </div>

        <div className="mt-12 bg-indigo-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-indigo-900">Create a Complete Itinerary</h2>
          <p className="mt-2 text-indigo-700">
            Need to create a multi-day itinerary with various bookings? Create a comprehensive travel plan with our
            itinerary booking tool.
          </p>
          <div className="mt-4">
            <Link
              to="/bookings/itinerary"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Create Itinerary
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBookingPage;