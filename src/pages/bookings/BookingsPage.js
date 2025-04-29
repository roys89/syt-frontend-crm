// src/pages/bookings/BookingsPage.js
import { PlusIcon } from '@heroicons/react/24/outline';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

// Import the tab content components
import BookingsTabContent from '../../components/booking/BookingsTabContent';
import InquiriesTabContent from '../../components/booking/InquiriesTabContent';

const BookingsPage = () => {
  const { user } = useContext(AuthContext);

  // Define all possible main tabs
  const allMainTabs = [
    { id: 'bookings', label: 'Bookings' },
    // Only include Inquiries if user is admin or has itinerary permission
    (user?.role === 'admin' || user?.permissions?.canBookItineraries) && 
      { id: 'inquiries', label: 'Inquiries' }
  ].filter(Boolean); // Filter out false values if permission denied

  // Default to the first available tab's ID
  const [activeMainTab, setActiveMainTab] = useState(() => 
    allMainTabs.length > 0 ? allMainTabs[0].id : null
  );

  // Handler for changing main tab
  const handleMainTabChange = (tabId) => {
    setActiveMainTab(tabId);
  };

  // Determine the current active tab object for easier access
  const currentActiveTab = allMainTabs.find(tab => tab.id === activeMainTab);

  return (
    <div className="container mx-auto px-4 py-8">
      {currentActiveTab && ( // Only render header/content if a tab is active
        <>
          <div className="flex justify-between items-center mb-6">
            {/* Display the label of the current active tab */}
            <h1 className="text-3xl font-bold text-[#093923]">
              {currentActiveTab.label}
            </h1>
            {/* Conditionally show buttons based on the active MAIN tab */}
            {activeMainTab === 'bookings' && (
              <Link
                to="/bookings/create"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                New Booking
              </Link>
            )}
            {activeMainTab === 'inquiries' && (
              <Link
                to="/bookings/itinerary" // Link to the itinerary creation page for inquiries
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Add Itinerary Inquiry
              </Link>
            )}
          </div>

          {/* Main Tabs - Only show if more than one tab is available */}
          {allMainTabs.length > 1 && (
            <div className="border-b border-[#093923]/10 mb-6">
              <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
                {allMainTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleMainTabChange(tab.id)}
                    className={`${
                      activeMainTab === tab.id
                        ? 'border-[#13804e] text-[#13804e]'
                        : 'border-transparent text-[#093923]/60 hover:text-[#093923] hover:border-[#093923]/30'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-lg transition-all ease duration-200`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Conditionally Render Tab Content based on the active tab ID */}
          <div>
            {activeMainTab === 'bookings' && <BookingsTabContent />}
            {activeMainTab === 'inquiries' && <InquiriesTabContent />}
          </div>
        </>
      )}
      {!currentActiveTab && (
        // Optional: Show a message if no tabs are available at all 
        // (though BookingRoute should prevent this specific case unless permissions change dynamically)
         <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
            <h3 className="text-lg font-medium text-[#093923]">Access Denied</h3>
            <p className="mt-2 text-sm text-[#13804e]">
              You do not have the necessary permissions to view this section.
            </p>
          </div>
      )}
    </div>
  );
};

export default BookingsPage;