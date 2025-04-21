import { Dialog, Transition } from '@headlessui/react';
import React, { Fragment, useEffect, useState } from 'react';

// Use the same statuses defined in LeadList (consider centralizing these)
const LEAD_STATUSES = ['new', 'assigned', 'follow up', 'proposal', 'won', 'lost', 'closed_won', 'closed_lost', 'contacted', 'qualified', 'negotiation']; 

const StatusUpdateModal = ({ isOpen, onClose, leadId, currentStatus, onSubmit }) => {
  const [newStatus, setNewStatus] = useState(currentStatus || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when modal opens with a new leadId or currentStatus
  useEffect(() => {
    if (isOpen) {
      setNewStatus(currentStatus || '');
      setNote('');
      setIsSubmitting(false);
    }
  }, [isOpen, leadId, currentStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newStatus || !note.trim()) {
      alert('Please select a status and enter a note.'); // Simple validation
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(leadId, newStatus, note.trim());
      onClose(); // Close modal on successful submit
    } catch (error) {
      // Error handled by the calling component's onSubmit
      console.error("Error submitting status update:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={isSubmitting ? () => {} : onClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Update Lead Status
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                              New Status <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="status"
                              name="status"
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                              value={newStatus}
                              onChange={(e) => setNewStatus(e.target.value)}
                              required
                            >
                              <option value="" disabled>Select new status</option>
                              {LEAD_STATUSES.map(status => (
                                <option key={status} value={status} className="capitalize">{status.replace('_', ' ')}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                              Note <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="note"
                                name="note"
                                rows={4}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                placeholder="Enter reason for status change..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="submit"
                      className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Status'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default StatusUpdateModal; 