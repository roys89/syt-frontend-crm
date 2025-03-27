import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

// A simpler modal implementation without Headless UI
const SimplifiedBookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
  // If modal is not open, don't render anything
  if (!isOpen) return null;
  
  // Log data for debugging
  console.log('Modal should be visible now with data:', voucherDetails);
  
  if (!voucherDetails) {
    console.error('VoucherDetails is null or undefined');
    return null;
  }

  const hotelInfo = voucherDetails.results?.hotel_itinerary?.[0];
  const guestInfo = voucherDetails.results?.guestCollectionData?.[0];
  const staticContent = voucherDetails.results?.staticContent?.[0];

  if (!hotelInfo || !staticContent) {
    console.error('Missing required data in voucherDetails:', { hotelInfo, staticContent });
    return null;
  }

  // The modal styles ensure it's visible on top of everything else
  return (
    <div 
      className="fixed inset-0 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }} // Very high z-index to ensure visibility
    >
      <div className="bg-white rounded-lg w-full max-w-4xl p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6 text-gray-500" />
        </button>
        
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Booking Voucher</h2>
          <p className="text-sm text-gray-500 mt-1">
            Booking ID: {hotelInfo.bookingRefId}
          </p>
        </div>
        
        {/* Content */}
        <div className="space-y-6">
          {/* Hotel Information */}
          <div className="border-b pb-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                {staticContent.heroImage && (
                  <img
                    src={staticContent.heroImage}
                    alt={staticContent.name}
                    className="w-full h-48 object-cover rounded-lg shadow-sm"
                  />
                )}
              </div>
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {staticContent.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {staticContent.contact?.address?.line1}, {staticContent.contact?.address?.city?.name}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Check-in</p>
                    <p className="font-medium">{hotelInfo.searchRequestLog?.checkIn}</p>
                    <p className="text-sm text-gray-500">After 2:00 PM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Check-out</p>
                    <p className="font-medium">{hotelInfo.searchRequestLog?.checkOut}</p>
                    <p className="text-sm text-gray-500">Before 12:00 PM</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-500 text-sm">Total Amount</p>
                  <p className="text-xl font-bold text-indigo-600">
                    ₹{hotelInfo.totalAmount?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          {guestInfo && (
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold mb-4">Guest Information</h3>
              <div className="space-y-4">
                {guestInfo.guests?.map((guest, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium">
                          {guest.title} {guest.firstName} {guest.lastName}
                        </span>
                        {guest.isLeadGuest && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            Lead Guest
                          </span>
                        )}
                        <span className="ml-2 bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">
                          {guest.type}
                        </span>
                      </div>
                    </div>
                    {guest.additionaldetail && (
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>Email: {guest.additionaldetail.email}</div>
                        <div>
                          Phone: +{guest.additionaldetail.isdCode} {guest.additionaldetail.contactNumber}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Room Details */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Room Details</h3>
            <div className="space-y-4">
              {hotelInfo.items?.[0]?.selectedRoomsAndRates?.map((roomRate, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium">{roomRate.room.name}</h4>
                    <span className="text-indigo-600 font-medium">
                      ₹{roomRate.rate.finalRate.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Adults: {roomRate.occupancy.adults}</p>
                    {roomRate.occupancy.childAges?.length > 0 && (
                      <p>
                        Children: {roomRate.occupancy.childAges.length} (Ages:{' '}
                        {roomRate.occupancy.childAges.join(', ')})
                      </p>
                    )}
                  </div>
                  <div className="mt-2 text-sm">
                    <span
                      className={
                        roomRate.rate.isRefundable ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {roomRate.rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                    </span>
                    {roomRate.rate.boardBasis?.description && (
                      <span className="ml-3 text-gray-600">
                        {roomRate.rate.boardBasis.description}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel Policies */}
          {staticContent.policies && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Hotel Policies</h3>
              <div className="prose prose-sm max-w-none text-gray-600">
                <div dangerouslySetInnerHTML={{ __html: staticContent.policies }} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedBookingVoucherModal;