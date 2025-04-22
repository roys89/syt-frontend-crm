// src/pages/bookings/BookingsPage.js
import { PlusIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { Link } from 'react-router-dom';

// Import the new tab content components
import BookingsTabContent from '../../components/booking/BookingsTabContent';
import InquiriesTabContent from '../../components/booking/InquiriesTabContent';

const BookingsPage = () => {
  const [activeMainTab, setActiveMainTab] = useState('bookings'); // 'bookings' or 'inquiries'

  const mainTabs = [
    { id: 'bookings', label: 'Bookings' },
    { id: 'inquiries', label: 'Inquiries' }
  ];

  // Handler for changing main tab
  const handleMainTabChange = (tabId) => {
    setActiveMainTab(tabId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#093923]">
          {activeMainTab === 'bookings' ? 'Bookings' : 'Inquiries'}
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

      {/* Main Tabs */}
      <div className="border-b border-[#093923]/10 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
          {mainTabs.map((tab) => (
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

      {/* Conditionally Render Tab Content */}
      <div>
        {activeMainTab === 'bookings' && <BookingsTabContent />}
        {activeMainTab === 'inquiries' && <InquiriesTabContent />}
      </div>

    </div>
  );
};

export default BookingsPage;