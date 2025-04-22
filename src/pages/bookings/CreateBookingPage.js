// src/pages/bookings/CreateBookingPage.js
import { HeartIcon, MapIcon, PaperAirplaneIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';

const BookingOption = ({ title, description, icon: Icon, color, path }) => {
  return (
    <Link 
      to={path}
      className="relative block p-6 overflow-hidden border border-[#093923]/10 rounded-xl shadow-lg transition-all hover:shadow-xl hover:border-[#093923]/20 bg-white"
    >
      <span className={`absolute inset-x-0 bottom-0 h-1.5 ${color}`}></span>
      <div className="flex items-start gap-4 sm:gap-6">
        <div className={`p-3 text-white ${color} rounded-lg shadow-sm`}>
          <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
        </div>
        <div className="flex-1">
          <h5 className="text-lg sm:text-xl font-semibold text-[#093923]">{title}</h5>
          <p className="mt-1 text-sm text-[#093923]/80">{description}</p>
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
      color: 'bg-[#13804e]',
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
        <div className="mb-10 border-b border-[#093923]/10 pb-5">
          <h1 className="text-2xl font-bold text-[#093923]">Create Booking</h1>
          <p className="mt-1 text-sm text-[#093923]/70">
            Choose the type of booking you want to create for your customer
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bookingOptions.map((option, index) => (
            <BookingOption key={index} {...option} />
          ))}
        </div>

        <div className="mt-12 bg-[#eef7f2] p-6 rounded-xl border border-[#13804e]/20 shadow-sm">
          <h2 className="text-lg font-semibold text-[#093923]">Create a Complete Itinerary</h2>
          <p className="mt-2 text-sm text-[#093923]/80">
            Need to create a multi-day itinerary with various bookings? Create a comprehensive travel plan with our
            itinerary booking tool.
          </p>
          <div className="mt-4">
            <Link
              to="/bookings/itinerary"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#093923] hover:bg-[#022316] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200"
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