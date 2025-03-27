import React from 'react';

const FlightBookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 my-6">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Booking Voucher</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {voucherDetails ? (
            <div className="space-y-6">
              {/* Booking Status */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Booking Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Booking Code</p>
                    <p className="font-medium">{voucherDetails.bmsBookingCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">PNR</p>
                    <p className="font-medium">{voucherDetails.pnr}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className={`font-medium ${
                      voucherDetails.bookingStatus === 'CONFIRMED' 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {voucherDetails.bookingStatus}
                    </p>
                  </div>
                </div>
              </div>

              {/* Flight Details */}
              {voucherDetails.pnrDetails?.map((detail, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Flight {index + 1}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">From</p>
                      <p className="font-medium">{detail.origin}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">To</p>
                      <p className="font-medium">{detail.destination}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PNR</p>
                      <p className="font-medium">{detail.pnr}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No voucher details available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightBookingVoucherModal; 