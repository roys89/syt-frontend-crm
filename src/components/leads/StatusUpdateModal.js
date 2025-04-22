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
          <div className="fixed inset-0 bg-[#093923]/75 transition-opacity" />
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                        <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-[#093923] border-b border-[#093923]/10 pb-3">
                          Update Lead Status
                        </Dialog.Title>
                        <div className="mt-4 space-y-4">
                          <div>
                            <label htmlFor="status" className="block text-sm font-medium text-[#093923] mb-1">
                              New Status <span className="text-red-500">*</span>
                            </label>
                            <select
                              id="status"
                              name="status"
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-[#093923]/20 focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm rounded-lg transition-all ease duration-200 shadow-sm bg-white capitalize"
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
                            <label htmlFor="note" className="block text-sm font-medium text-[#093923] mb-1">
                              Note <span className="text-red-500">*</span>
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="note"
                                name="note"
                                rows={4}
                                className="block w-full rounded-lg border border-[#093923]/20 shadow-sm focus:border-[#13804e]/50 focus:ring-[#13804e]/50 sm:text-sm transition-all ease duration-200"
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
                  <div className="bg-[#093923]/5 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-[#093923]/10">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`inline-flex w-full justify-center rounded-lg border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 sm:ml-3 sm:w-auto sm:text-sm transition-all ease duration-200 ${
                        isSubmitting ? 'bg-[#093923]/50 cursor-not-allowed' : 'bg-[#13804e] hover:bg-[#0d5c3a]'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : 'Save Status'}
                    </button>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-lg border border-[#093923]/20 bg-white px-4 py-2 text-base font-medium text-[#093923] shadow-sm hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 sm:mt-0 sm:w-auto sm:text-sm transition-all ease duration-200"
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