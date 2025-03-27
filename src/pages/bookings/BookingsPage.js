// src/pages/bookings/BookingsPage.js
import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        // We'll add filtering based on type later
        const response = await bookingService.getBookings();
        setBookings(response.data || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // For demo purposes, let's create sample data
  const sampleBookings = [
    {
      _id: '1',
      type: 'flight',
      status: 'confirmed',
      customer: { firstName: 'John', lastName: 'Doe' },
      createdAt: '2025-05-01T10:00:00.000Z',
      details: {
        origin: { city: 'Mumbai', code: 'BOM' },
        destination: { city: 'Dubai', code: 'DXB' },
        departureDate: '2025-06-16'
      },
      totalAmount: 6407
    },
    {
      _id: '2',
      type: 'hotel',
      status: 'pending',
      customer: { firstName: 'Jane', lastName: 'Smith' },
      createdAt: '2025-05-02T14:30:00.000Z',
      details: {
        hotelName: 'Burj Al Arab',
        location: 'Dubai',
        checkIn: '2025-06-19',
        checkOut: '2025-06-22'
      },
      totalAmount: 12500
    },
    {
      _id: '3',
      type: 'activity',
      status: 'confirmed',
      customer: { firstName: 'Robert', lastName: 'Johnson' },
      createdAt: '2025-05-03T09:15:00.000Z',
      details: {
        activityName: 'Desert Safari',
        location: 'Dubai',
        date: '2025-06-20'
      },
      totalAmount: 1500
    },
    {
      _id: '4',
      type: 'transfer',
      status: 'cancelled',
      customer: { firstName: 'Emily', lastName: 'Williams' },
      createdAt: '2025-05-04T16:45:00.000Z',
      details: {
        origin: 'Dubai Airport',
        destination: 'Burj Al Arab',
        date: '2025-06-20'
      },
      totalAmount: 800
    }
  ];

  // Filter bookings based on active tab
  const filteredBookings = activeTab === 'all' 
    ? sampleBookings 
    : sampleBookings.filter(booking => booking.type === activeTab);

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get appropriate badge color based on status
  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appropriate icon or indicator for booking type
  const getBookingTypeIndicator = (type) => {
    switch (type.toLowerCase()) {
      case 'flight':
        return 'text-blue-500 border-blue-500';
      case 'hotel':
        return 'text-red-500 border-red-500';
      case 'activity':
        return 'text-green-500 border-green-500';
      case 'transfer':
        return 'text-purple-500 border-purple-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  const tabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'flight', label: 'Flights' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'activity', label: 'Activities' },
    { id: 'transfer', label: 'Transfers' }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
        <Link
          to="/bookings/create"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          New Booking
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Bookings table */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first booking.
          </p>
          <div className="mt-6">
            <Link
              to="/bookings/create"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              New Booking
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Type
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Customer
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Details
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Amount
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className={`flex items-center`}>
                      <div className={`h-8 w-1 rounded-l-lg mr-2 ${getBookingTypeIndicator(booking.type)}`}></div>
                      <span className="font-medium capitalize">{booking.type}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {booking.customer.firstName} {booking.customer.lastName}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {booking.type === 'flight' && (
                      <div>
                        <div className="font-medium">{booking.details.origin.city} to {booking.details.destination.city}</div>
                        <div className="text-xs">{booking.details.origin.code} → {booking.details.destination.code}</div>
                      </div>
                    )}
                    {booking.type === 'hotel' && (
                      <div>
                        <div className="font-medium">{booking.details.hotelName}</div>
                        <div className="text-xs">{booking.details.checkIn} to {booking.details.checkOut}</div>
                      </div>
                    )}
                    {booking.type === 'activity' && (
                      <div>
                        <div className="font-medium">{booking.details.activityName}</div>
                        <div className="text-xs">{booking.details.location}</div>
                      </div>
                    )}
                    {booking.type === 'transfer' && (
                      <div>
                        <div className="font-medium">{booking.details.origin}</div>
                        <div className="text-xs">to {booking.details.destination}</div>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(booking.createdAt)}
                  </td>
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                    ₹{booking.totalAmount.toLocaleString()}
                  </td>
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link to={`/bookings/${booking._id}`} className="text-indigo-600 hover:text-indigo-900">
                      View<span className="sr-only">, {booking._id}</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;