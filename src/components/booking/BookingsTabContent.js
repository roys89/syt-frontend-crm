import { ArrowPathIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import ShareItineraryButton from '../itinerary/ShareItineraryButton';

// This component now holds the content previously directly in BookingsPage for the 'Bookings' main tab.
// It uses placeholder data for now.

const BookingsTabContent = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // Sub-tab ID
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch itineraries when the component mounts or the relevant tab is selected
  useEffect(() => {
    const fetchItineraries = async () => {
      if (activeSubTab === 'all' || activeSubTab === 'itinerary') {
        // Only fetch if itineraries haven't been loaded yet or forcing refresh
        // This simple check avoids refetching constantly when switching between 'all' and 'itinerary'
        // A more robust solution might involve caching or state management libraries
        if (itineraries.length === 0) { 
          setLoading(true);
          setError(null);
          try {
            const response = await bookingService.getCrmItineraries();
            if (response.success && Array.isArray(response.data)) {
              // Add a type property for easier filtering/rendering later
              const typedItineraries = response.data.map(it => ({ ...it, type: 'itinerary' }));
              setItineraries(typedItineraries);
            } else {
              throw new Error(response.message || 'Failed to fetch itineraries');
            }
          } catch (err) {
            console.error("Error fetching itineraries:", err);
            setError(err.message || 'Could not load itineraries.');
            setItineraries([]); // Clear itineraries on error
          } finally {
            setLoading(false);
          }
        }
      }
    };

    fetchItineraries();
  }, [activeSubTab, itineraries.length]); // Re-run if tab changes or itineraries are cleared

  // For demo purposes, let's create sample data (copied from original BookingsPage)
  const sampleOtherBookingsData = [
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

  // Filter data based on active sub tab
  const filteredData = (() => {
    if (activeSubTab === 'all') {
        // Combine fetched itineraries with other sample bookings
        return [...itineraries, ...sampleOtherBookingsData];
    } else if (activeSubTab === 'itinerary') {
        return itineraries;
    } else {
        // Filter only sample data for other specific types
        return sampleOtherBookingsData.filter(item => item.type === activeSubTab);
    }
  })();

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if the date is valid before formatting
      if (isNaN(date.getTime())) return 'Invalid Date'; 
      return date.toLocaleDateString('en-GB', { // Use en-GB for DD/MM/YYYY or desired format
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  // Get appropriate badge color based on status
  const getStatusBadgeColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed': // Add completed for itinerary payment status
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'processing': // Add processing for itinerary payment status
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
      case 'failed': // Add failed for itinerary payment status
        return 'bg-red-100 text-red-800';
      case 'inquiry': // Keep for potential future use
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
        return 'bg-blue-500'; // Use background color for the bar
      case 'hotel':
        return 'bg-red-500';
      case 'activity':
        return 'bg-green-500';
      case 'transfer':
        return 'bg-purple-500';
      case 'itinerary':
        return 'bg-orange-500'; // Orange for itineraries
      default:
        return 'bg-gray-500';
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
            <div className="font-medium text-gray-900">{item.details.origin.city} to {item.details.destination.city}</div>
            <div className="text-xs text-gray-500">{item.details.origin.code} → {item.details.destination.code}</div>
          </div>
        );
      case 'hotel':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.hotelName}</div>
            <div className="text-xs text-gray-500">{formatDate(item.details.checkIn)} to {formatDate(item.details.checkOut)}</div>
          </div>
        );
      case 'activity':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.activityName}</div>
            <div className="text-xs text-gray-500">{item.details.location}</div>
          </div>
        );
      case 'transfer':
        return (
          <div>
            <div className="font-medium text-gray-900">{item.details.origin}</div>
            <div className="text-xs text-gray-500">to {item.details.destination}</div>
          </div>
        );
      case 'itinerary':
        return (
          <div>
            <div className="font-medium text-gray-900 truncate w-40" title={item.itineraryToken}>{item.itineraryToken}</div>
            <div className="text-xs text-gray-500">
                {item.totalDays ? `${item.totalDays} Days` : '-'} | Starts: {formatDate(item.startDate)}
            </div>
          </div>
        );
      default:
        return <span className="text-gray-400">N/A</span>;
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
              disabled={loading} // Disable tabs while loading
              className={`${
                activeSubTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

       {/* Loading State */}
       {loading && (
        <div className="text-center py-12">
            <ArrowPathIcon className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4" />
            <p className="text-sm text-gray-500">Loading bookings...</p>
        </div>
       )}

       {/* Error State */}
       {!loading && error && (
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Error Loading Bookings</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          {/* Optional: Add a retry button here */}
        </div>
       )}

       {/* Data Table - Render only if not loading and no error */} 
       {!loading && !error && (
         <> 
           {filteredData.length === 0 ? (
             <div className="text-center py-12 bg-white shadow rounded-lg">
               <h3 className="text-lg font-medium text-gray-900">
                 No {activeSubTab !== 'all' ? `${activeSubTab} ` : ''} bookings found
                 {activeSubTab !== 'all' ? ` for this type` : ''}.
               </h3>
               <p className="mt-2 text-sm text-gray-500">
                  Get started by creating a new booking or check back later.
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
             <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
               <table className="min-w-full divide-y divide-gray-300">
                 <thead className="bg-gray-50">
                   <tr>
                     {/* Adjusting Headers for Itinerary View */}
                     <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                       Type
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Client
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Details / Token
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Date Added
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                       Status
                     </th>
                     <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                         Assigned To
                     </th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                         Amount / Duration
                     </th>
                     <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                       <span className="sr-only">Actions</span>
                     </th>
                   </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-gray-200">
                   {filteredData.map((item) => (
                     <tr key={item.itineraryToken || item._id} className="hover:bg-gray-50">
                       <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                         <div className={`flex items-center`}>
                           <div className={`h-6 w-1 ${getTypeIndicator(item.type)} mr-3`}></div>
                           <span className="font-medium text-gray-900 capitalize">{item.type}</span>
                         </div>
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500">
                         {item.clientName || `${item.customer?.firstName || ''} ${item.customer?.lastName || ''}`.trim() || 'N/A'}
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500">
                         {renderBookingDetails(item)}
                       </td>
                       <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                         {formatDate(item.createdAt)}
                       </td>
                       <td className="px-3 py-4 text-sm whitespace-nowrap">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status)} capitalize`}>
                           {item.status || 'Unknown'}
                         </span>
                       </td>
                        <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                           {item.assignedTo ? item.assignedTo.name : 'Unassigned'}
                         </td>
                       <td className="px-3 py-4 text-sm text-gray-500 whitespace-nowrap">
                           {item.type === 'itinerary' 
                             ? (item.totalDays ? `${item.totalDays} Days` : 'N/A')
                             : (item.totalAmount != null ? `₹${item.totalAmount.toLocaleString()}` : 'N/A')
                           }
                         </td>
                       <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex items-center justify-end space-x-2">
                            <Link 
                              to={item.type === 'itinerary' ? `/itinerary/${item.itineraryToken}` : `/bookings/${item._id}`} 
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View<span className="sr-only">, {item.itineraryToken || item._id}</span>
                            </Link>
                            {item.type === 'itinerary' && (
                              <ShareItineraryButton 
                                itineraryToken={item.itineraryToken}
                                inquiryToken={item.inquiryToken}
                              />
                            )}
                          </div>
                        </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           )}
         </>
       )}
     </div>
  );
};

export default BookingsTabContent; 