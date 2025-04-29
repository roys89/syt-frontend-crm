// src/pages/bookings/CreateBookingPage.js
import { HeartIcon, MapIcon, PaperAirplaneIcon, TruckIcon } from '@heroicons/react/24/outline';
import { Link, useNavigate } from 'react-router-dom';
// Assumption: You have an auth context/hook providing user data
// Replace with your actual auth hook/context import
import { useAuth } from '../../context/AuthContext'; // Hypothetical auth context hook

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
  // Get user from auth context (replace with your actual implementation)
  const { user } = useAuth(); 

  // Loading state or handle case where user data isn't available yet
  if (!user || !user.permissions) {
    // Optionally return a loading spinner or null
    return <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#13804e]"></div>
           </div>; 
  }
  
  // Original Booking options configuration
  const allBookingOptions = [
    {
      title: 'Flight Booking',
      description: 'Search and book flights for your customers',
      icon: PaperAirplaneIcon,
      color: 'bg-blue-600',
      path: '/bookings/flight',
      permissionKey: 'canBookFlights' // Added key to link to permission
    },
    {
      title: 'Hotel Booking',
      description: 'Find and book accommodations worldwide',
      icon: HeartIcon,
      color: 'bg-red-600',
      path: '/bookings/hotel',
      permissionKey: 'canBookHotels' // Added key to link to permission
    },
    {
      title: 'Activity Booking',
      description: 'Book tours, attractions, and experiences',
      icon: MapIcon,
      color: 'bg-[#13804e]',
      path: '/bookings/activity',
      permissionKey: 'canBookActivities' // Added key to link to permission
    },
    {
      title: 'Transfer Booking',
      description: 'Arrange airport transfers and transportation',
      icon: TruckIcon,
      color: 'bg-purple-600',
      path: '/bookings/transfer',
      permissionKey: 'canBookTransfers' // Added key to link to permission
    }
  ];

  // Filter options based on user permissions OR admin role
  const availableBookingOptions = allBookingOptions.filter(option => 
    user?.role === 'admin' || (user?.permissions && user.permissions[option.permissionKey])
  );

  // Conditionally render Itinerary section based on permission OR admin role
  const canAccessItinerary = user?.role === 'admin' || user?.permissions?.canBookItineraries;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 border-b border-[#093923]/10 pb-5">
          <h1 className="text-2xl font-bold text-[#093923]">Create Booking</h1>
          <p className="mt-1 text-sm text-[#093923]/70">
            Choose the type of booking you want to create for your customer
          </p>
        </div>

        {/* Display available options or a message if none */}
        {availableBookingOptions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableBookingOptions.map((option, index) => (
              <BookingOption key={index} {...option} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
            <svg className="mx-auto h-12 w-12 text-[#13804e]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-[#093923]">No Booking Options Available</h3>
            <p className="mt-1 text-sm text-[#093923]/70">
              You do not have permission to create any specific booking types. Contact an administrator if you believe this is an error.
            </p>
          </div>
        )}

        {/* Conditionally render Itinerary section */}
        {canAccessItinerary && (
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
        )}
      </div>
    </div>
  );
};

export default CreateBookingPage;