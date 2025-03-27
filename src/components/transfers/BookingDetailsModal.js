import { XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const BookingDetailsModal = ({ isOpen, onClose, bookingDetails, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Booking Details</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Booking Status Card */}
                    <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-indigo-900">Booking Status</h4>
                          <p className="text-sm text-indigo-700 mt-1">Booking ID: {bookingDetails.data.booking_id}</p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                          bookingDetails.data.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {bookingDetails.data.status}
                        </span>
                      </div>
                    </div>

                    {/* Guest Information */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Guest Information</h4>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.guest_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.guest_phone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Passengers</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.passengers}</p>
                        </div>
                        {bookingDetails.data.data.notes && (
                          <div className="col-span-2">
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Journey Details */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Journey Details</h4>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">From</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.from}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">To</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.to}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.booking_date}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.booking_time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Journey Type</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.journey_type}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Created Date</p>
                          <p className="mt-1 font-medium text-gray-900">
                            {new Date(bookingDetails.data.data.created_date).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Vehicle Information</h4>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Class</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.vehicle.class}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Capacity</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.vehicle.capacity} passengers</p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h4 className="text-lg font-semibold text-gray-900">Payment Information</h4>
                      </div>
                      <div className="p-6 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.currency_fare}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Payment Method</p>
                          <p className="mt-1 font-medium text-gray-900">{bookingDetails.data.data.payment_method}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`mt-1 inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                            bookingDetails.data.data.payment_status === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {bookingDetails.data.data.payment_status === 1 ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Booking Actions */}
                    <div className="flex justify-end space-x-4">
                      {bookingDetails.data.data.is_amend_allow && (
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                          Amend Booking
                        </button>
                      )}
                      {bookingDetails.data.data.is_cancel_allow && (
                        <button className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg">
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;