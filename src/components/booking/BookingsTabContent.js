import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// This component now holds the content previously directly in BookingsPage for the 'Bookings' main tab.
// It uses placeholder data for now.

const BookingsTabContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // Sub-tab ID

  // For demo purposes, let's create sample data (copied from original BookingsPage)
  const sampleBookingsData = [
    // Existing sample data...
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
    },
    // New Itinerary Booking Sample
    {
        _id: '5',
        type: 'itinerary',
        status: 'confirmed',
        customer: { firstName: 'Michael', lastName: 'Brown' },
        createdAt: '2025-05-10T11:00:00.000Z',
        details: {
            packageName: 'Dubai Extravaganza',
            duration: '7 Days / 6 Nights',
            startDate: '2025-07-01'
        },
        totalAmount: 25000
    }
  ];

  // Filter data based on active sub tab
  const filteredData = activeSubTab === 'all'
    ? sampleBookingsData
    : sampleBookingsData.filter(item => item.type === activeSubTab);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get appropriate badge color based on status
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'inquiry':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get appropriate icon or indicator for booking/inquiry type
  const getTypeIndicator = (type) => {
    if (!type) return 'text-gray-500 border-gray-500';
    switch (type.toLowerCase()) {
      case 'flight':
        return 'text-blue-500 border-blue-500';
      case 'hotel':
        return 'text-red-500 border-red-500';
      case 'activity':
        return 'text-green-500 border-green-500';
      case 'transfer':
        return 'text-purple-500 border-purple-500';
      case 'itinerary':
        return 'text-orange-500 border-orange-500';
      default:
        return 'text-gray-500 border-gray-500';
    }
  };

  const bookingSubTabs = [
    { id: 'all', label: 'All Bookings' },
    { id: 'itinerary', label: 'Itineraries' },
    { id: 'flight', label: 'Flights' },
    { id: 'hotel', label: 'Hotels' },
    { id: 'activity', label: 'Activities' },
    { id: 'transfer', label: 'Transfers' }
  ];

  // Handler for changing sub tab
  const handleSubTabChange = (tabId) => {
    setActiveSubTab(tabId);
  };

  // Function to render details based on type (specific to Bookings)
  const renderBookingDetails = (item) => {
     switch (item.type) {
      case 'flight':
        return (
          <div>
            <div className="font-medium">{item.details.origin.city} to {item.details.destination.city}</div>
            <div className="text-xs">{item.details.origin.code} → {item.details.destination.code}</div>
          </div>
        );
      case 'hotel':
        return (
          <div>
            <div className="font-medium">{item.details.hotelName}</div>
            <div className="text-xs">{item.details.checkIn} to {item.details.checkOut}</div>
          </div>
        );
      case 'activity':
        return (
          <div>
            <div className="font-medium">{item.details.activityName}</div>
            <div className="text-xs">{item.details.location}</div>
          </div>
        );
      case 'transfer':
        return (
          <div>
            <div className="font-medium">{item.details.origin}</div>
            <div className="text-xs">to {item.details.destination}</div>
          </div>
        );
      case 'itinerary': // Itinerary Booking details
        return (
          <div>
            <div className="font-medium">{item.details.packageName}</div>
            <div className="text-xs">{item.details.duration}, Starts: {formatDate(item.details.startDate)}</div>
          </div>
        );
      default:
        return 'N/A';
    }
  };

  return (
    <div>
       {/* Sub Tabs for Bookings */}
       <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Sub Tabs">
          {bookingSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSubTabChange(tab.id)}
              className={`${
                activeSubTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

       {/* Data table for Bookings */}
      {filteredData.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">
            No {activeSubTab !== 'all' ? `${activeSubTab} ` : ''} bookings found
            {activeSubTab !== 'all' ? ` for this type` : ''}.
          </h3>
          <p className="mt-2 text-sm text-gray-500">
             Get started by creating a new booking.
          </p>
          <div className="mt-6">
              <Link
                to="/bookings/create" // Link to general booking creation
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
                  Date Added
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
              {filteredData.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className={`flex items-center`}>
                      <div className={`h-8 w-1 rounded-l-lg mr-2 ${getTypeIndicator(item.type)}`}></div>
                      <span className="font-medium capitalize">{item.type}</span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {item.customer.firstName} {item.customer.lastName}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">
                    {renderBookingDetails(item)}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-3 py-4 text-sm whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                   <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {item.totalAmount != null ? `₹${item.totalAmount.toLocaleString()}` : 'N/A'}
                    </td>
                  <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                     {/* TODO: Update link based on booking type if needed */}
                    <Link to={`/bookings/${item._id}`} className="text-indigo-600 hover:text-indigo-900">
                      View<span className="sr-only">, {item._id}</span>
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

export default BookingsTabContent; 