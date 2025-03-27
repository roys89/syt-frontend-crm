import { format } from 'date-fns';
import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import bookingService from '../../services/bookingService';
import PassengerInfoModal from './PassengerInfoModal';

const FlightItineraryModal = ({ itineraryDetails, onClose, onBookNow }) => {
  const [activeTab, setActiveTab] = useState('flightDetails');
  const [selectedClass, setSelectedClass] = useState('economy');
  const [travelers, setTravelers] = useState(1);
  const [showPassengerInfo, setShowPassengerInfo] = useState(false);
  const [isAllocated, setIsAllocated] = useState(false);
  const [priceDetails, setPriceDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleBookNow = async () => {
    if (!isAllocated) {
      setShowPassengerInfo(true);
      return;
    }

    try {
      setIsLoading(true);
      const response = await bookingService.bookFlight({
        provider: 'TC',
        traceId: priceDetails?.traceIdDetails?.traceId || itineraryDetails?.results?.traceId,
        itineraryCode: priceDetails?.itineraryCode || itineraryDetails?.results?.itineraryCode
      });

      if (response.success) {
        toast.success('Flight booked successfully!');
        onClose();
        if (onBookNow) {
          onBookNow(response.data);
        }
      } else {
        throw new Error(response.message || 'Failed to book flight');
      }
    } catch (error) {
      console.error('Error booking flight:', error);
      toast.error(error.message || 'Failed to book flight');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePassengerSuccess = (response) => {
    setIsAllocated(true);
    if (response.recheck) {
      setPriceDetails(response.recheck);
      // Update itineraryDetails with new price if changed
      if (response.recheck.isPriceChanged) {
        itineraryDetails.results.totalAmount = response.recheck.totalAmount;
        itineraryDetails.results.baseFare = response.recheck.baseFare;
        itineraryDetails.results.taxAndSurcharge = response.recheck.taxAndSurcharge;
      }
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      return format(new Date(timeStr), 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error, timeStr);
      return 'Invalid time';
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Flight Itinerary</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Back</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {['flightDetails', 'fareDetails', 'fareRules'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm capitalize`}
            >
              {tab.replace(/([A-Z])/g, ' $1').trim()}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Price change alert */}
        {priceDetails && (priceDetails.isPriceChanged || priceDetails.isBaggageChanged) && (
          <div className={`mb-4 p-4 rounded-md ${
            priceDetails.totalAmount > priceDetails.previousTotalAmount 
              ? 'bg-red-50 text-red-700' 
              : 'bg-green-50 text-green-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Price Update</p>
                <p className="text-sm mt-1">
                  Previous Total: ₹{priceDetails.previousTotalAmount.toLocaleString()}
                </p>
                <p className="text-sm">
                  New Total: ₹{priceDetails.totalAmount.toLocaleString()}
                </p>
              </div>
              {priceDetails.isBaggageChanged && (
                <div className="text-sm">
                  <p className="font-medium">Baggage Policy Changed</p>
                  <p>Please review the updated baggage details</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'flightDetails' && (
          <div className="space-y-6">
            {itineraryDetails?.results?.itineraryItems?.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {index === 0 ? 'Outbound Flight' : 'Return Flight'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {item.itemFlight.airlineName} {item.itemFlight.flightNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-blue-600">
                      {item.itemFlight.fareQuote.currency} {item.itemFlight.fareQuote.finalFare.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.itemFlight.fareIdentifier.name}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {item.itemFlight.segments[0].map((segment, segIndex) => (
                    <div key={segIndex} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold">{formatTime(segment.or.dT)}</span>
                          <span className="text-gray-500">{segment.or.aC}</span>
                        </div>
                        <p className="text-sm text-gray-500">{segment.or.aN}</p>
                      </div>

                      <div className="flex-1 text-center">
                        <p className="text-sm text-gray-500">{formatDuration(segment.dr)}</p>
                        <div className="h-0.5 bg-gray-200 my-2"></div>
                        <p className="text-sm text-gray-500">
                          {item.itemFlight.stopCount.stops > 0 ? `${item.itemFlight.stopCount.stops} stop(s)` : 'Non-stop'}
                        </p>
                      </div>

                      <div className="flex-1 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="text-gray-500">{segment.ds.aC}</span>
                          <span className="text-lg font-semibold">{formatTime(segment.ds.aT)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{segment.ds.aN}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'fareDetails' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fare Breakdown</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Fare</span>
                  <span className="font-medium">{itineraryDetails?.results?.baseFare?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & Fees</span>
                  <span className="font-medium">{itineraryDetails?.results?.taxAndSurcharge?.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-semibold">Total Amount</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {itineraryDetails?.results?.totalAmount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'fareRules' && (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Fare Rules</h3>
              <div className="prose max-w-none">
                {itineraryDetails?.results?.itineraryItems?.[0]?.itemFlight?.fareRule?.[0]?.fareRuleDetail ? (
                  <div dangerouslySetInnerHTML={{ __html: itineraryDetails.results.itineraryItems[0].itemFlight.fareRule[0].fareRuleDetail }} />
                ) : (
                  <p className="text-gray-500">No fare rules available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 px-6 py-4">
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleBookNow}
            disabled={isLoading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Booking...
              </span>
            ) : isAllocated ? 'Book Now' : 'Allocate Passenger'}
          </button>
        </div>
      </div>

      <PassengerInfoModal
        isOpen={showPassengerInfo}
        onClose={() => setShowPassengerInfo(false)}
        itineraryDetails={{
          ...itineraryDetails?.results,
          paxCount: {
            adults: itineraryDetails?.results?.adultCount || 1,
            children: itineraryDetails?.results?.childCount || 0,
            infants: itineraryDetails?.results?.infantCount || 0
          }
        }}
        onSuccess={handlePassengerSuccess}
      />
    </div>
  );
};

export default FlightItineraryModal; 