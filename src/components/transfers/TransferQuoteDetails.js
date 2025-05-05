import {
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import React from 'react';
import { formatTimeForDisplay } from '../../utils/dateUtils';

// Helper to format date from datetime string
const formatDatePart = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    try {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric'});
    } catch (e) {
        return 'Invalid Date';
    }
};

const TransferQuoteDetails = ({ quoteDetails }) => {
  if (!quoteDetails?.data) return null;

  const { routeDetails, currency, currency_symbol, quote } = quoteDetails.data;

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-[#093923] to-[#13804e] px-6 py-4">
        <h2 className="text-xl font-bold text-white">Your Selected Transfer</h2>
        <p className="text-green-100 text-sm opacity-90">Quotation Details</p>
      </div>

      <div className="p-6">
        {/* Route Details with enhanced styling */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <MapPinIcon className="w-4 h-4 text-[#093923]" />
            </span>
            Route Details
          </h3>
          
          <div className="relative pl-8 before:absolute before:left-3 before:top-0 before:bottom-0 before:w-0.5 before:bg-green-100">
            <div className="mb-6 relative">
              <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-[#093923] border-2 border-white shadow"></div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-[#093923]">Pickup Location</p>
                <p className="text-gray-800 font-medium">{routeDetails.from}</p>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute left-[-8px] top-0 w-4 h-4 rounded-full bg-[#13804e] border-2 border-white shadow"></div>
              <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-[#13804e]">Drop-off Location</p>
                <p className="text-gray-800 font-medium">{routeDetails.to}</p>
              </div>
            </div>
          </div>
          
          <div className="flex mt-4 text-sm bg-gray-50 rounded-lg p-3 border border-gray-100 divide-x divide-gray-200">
            <div className="flex items-center pr-4">
              <ClockIcon className="w-4 h-4 text-[#093923] mr-2" />
              <span className="text-gray-700">Duration: {routeDetails.duration} minutes</span>
            </div>
            <div className="flex items-center pl-4">
              <MapPinIcon className="w-4 h-4 text-[#093923] mr-2" />
              <span className="text-gray-700">Distance: {routeDetails.distance}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Details with premium styling */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-[#093923] mr-2">•</span> Vehicle Details
          </h3>
          
          <div className="flex flex-col md:flex-row items-start">
            {quote.vehicle.vehicleImages && (
              <div className="w-full md:w-1/3 mb-4 md:mb-0 md:mr-5">
                <div className="bg-gray-100 rounded-lg overflow-hidden shadow-inner relative aspect-video">
                  <img 
                    src={quote.vehicle.vehicleImages.ve_im_url} 
                    alt={quote.vehicle.ve_class}
                    className="w-full h-full object-cover rounded-lg hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </div>
            )}
            
            <div className="w-full md:w-2/3">
              <div className="flex justify-between items-start flex-wrap">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{quote.vehicle.ve_class}</h4>
                  <p className="text-sm text-gray-600 italic">{quote.vehicle.ve_similar_types}</p>
                </div>
                
                {quote.vehicle.ve_tags && quote.vehicle.ve_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1 md:mt-0">
                    {quote.vehicle.ve_tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 text-xs font-medium bg-gradient-to-r from-green-50 to-emerald-50 text-[#093923] rounded-full border border-green-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 text-[#093923] mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Passenger Capacity</p>
                    <p className="text-gray-900 font-semibold">{quote.vehicle.ve_max_capacity} passengers</p>
                  </div>
                </div>
                
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <BriefcaseIcon className="w-5 h-5 text-[#093923] mr-3" />
                  <div>
                    <p className="text-xs text-gray-500">Luggage Capacity</p>
                    <p className="text-gray-900 font-semibold">{quote.vehicle.ve_luggage_capacity} pieces</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Details */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-[#093923] mr-2">•</span> Journey Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center bg-gray-50 p-3 rounded-lg">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <CalendarIcon className="w-5 h-5 text-[#093923]" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pickup Date</p>
                <p className="text-gray-900 font-semibold">{formatDatePart(routeDetails.pickup_date)}</p>
              </div>
               <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-4 ml-auto">
                <ClockIcon className="w-5 h-5 text-[#093923]" />
              </div>
               <div>
                <p className="text-sm font-medium text-gray-500">Pickup Time</p>
                <p className="text-gray-900 font-semibold">{formatTimeForDisplay(routeDetails.pickup_date)}</p>
              </div>
            </div>
            
            {routeDetails.return_date && (
              <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                  <CalendarIcon className="w-5 h-5 text-[#13804e]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Return Date</p>
                  <p className="text-gray-900 font-semibold">{formatDatePart(routeDetails.return_date)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mr-4 ml-auto">
                   <ClockIcon className="w-5 h-5 text-[#13804e]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Return Time</p>
                  <p className="text-gray-900 font-semibold">{formatTimeForDisplay(routeDetails.return_date)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fare Details with premium pricing display */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-5 border border-green-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#093923]">Total Fare</h3>
              <p className="text-xs text-green-700">Inclusive of all taxes</p>
            </div>
            
            <div className="text-right">
              <p className="text-3xl font-bold text-[#093923]">
                {currency_symbol}{parseFloat(quote.fare).toFixed(2)}
              </p>
              <p className="text-xs text-green-800 font-medium">{currency}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 rounded-b-xl p-5 text-xs text-gray-600 border-t border-gray-200">
        <p>
          <strong>Note:</strong> Transfer prices include all taxes and fees.
          The driver will monitor your flight arrival time and wait for you in case of delays.
        </p>
        <p className="mt-2">
          <strong>Cancellation Policy:</strong>
          <ul className="list-disc list-inside ml-4">
            <li>Free cancellation up to 48 hours before ride.</li>
            <li>50% charge for cancellations within 24 hours.</li>
            <li>No refund for cancellations within 4 hours.</li>
          </ul>
        </p>
      </div>
    </div>
  );
};

export default TransferQuoteDetails;