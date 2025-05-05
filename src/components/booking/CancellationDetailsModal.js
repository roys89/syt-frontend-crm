import { Dialog, Transition } from '@headlessui/react';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment } from 'react';

const CancellationDetailsModal = ({ isOpen, onClose, onConfirm, details, bookingDetails, isCancelling }) => {
  if (!details) return null;

  const {
    policyText,
    fee,
    currency,
    deadline,
    canCancel,
    pickupTime,
    currentTime
  } = details;

  // Format the guest name
  const guestName = bookingDetails?.guestDetails 
    ? `${bookingDetails.guestDetails.firstName || ''} ${bookingDetails.guestDetails.lastName || ''}`.trim()
    : 'N/A';

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#13804e] focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-[#093923]">
                      Cancel Booking
                    </Dialog.Title>

                    <div className="mt-4 space-y-4">
                      {/* Guest Information */}
                      <div className="bg-[#e6f0ea] p-4 rounded-lg border border-[#093923]/10">
                        <h4 className="text-sm font-medium text-[#093923]">Guest Information</h4>
                        <p className="mt-1 text-sm text-[#093923]/80">{guestName}</p>
                        <p className="text-sm text-[#093923]/80">Booking Reference: {bookingDetails?.bookingRefId || 'N/A'}</p>
                      </div>

                      {/* Cancellation Policy */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h4 className="text-sm font-medium text-red-800">Cancellation Policy</h4>
                        <p className="mt-1 text-sm text-red-700">{policyText}</p>
                      </div>

                      {/* Cancellation Fee */}
                      <div className="bg-[#e6f0ea] p-4 rounded-lg border border-[#093923]/10">
                        <h4 className="text-sm font-medium text-[#093923]">Cancellation Fee</h4>
                        <p className="mt-1 text-sm text-[#093923]/80">
                          {fee > 0 ? `${currency} ${fee.toFixed(2)}` : 'No fee'}
                        </p>
                      </div>

                      {/* Important Times */}
                      <div className="bg-[#e6f0ea] p-4 rounded-lg border border-[#093923]/10">
                        <h4 className="text-sm font-medium text-[#093923]">Important Times</h4>
                        <div className="mt-1 space-y-1">
                          <p className="text-sm text-[#093923]/80">
                            <span className="font-medium">Pickup Time:</span> {pickupTime}
                          </p>
                          <p className="text-sm text-[#093923]/80">
                            <span className="font-medium">Current Time:</span> {currentTime}
                          </p>
                          <p className="text-sm text-[#093923]/80">
                            <span className="font-medium">Cancellation Deadline:</span> {deadline}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    onClick={onConfirm}
                    disabled={isCancelling || !canCancel}
                  >
                    {isCancelling ? (
                      <>
                        <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" />
                        Cancelling...
                      </>
                    ) : (
                      'Confirm Cancellation'
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#093923] shadow-sm ring-1 ring-inset ring-[#093923]/20 hover:bg-[#e6f0ea] sm:mt-0 sm:w-auto transition-colors duration-200"
                    onClick={onClose}
                    disabled={isCancelling}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CancellationDetailsModal; 