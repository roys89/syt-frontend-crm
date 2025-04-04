import { ArrowPathIcon, MagnifyingGlassIcon, UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService'; // Adjust path as needed
import CustomerRegistrationModal from './CustomerRegistrationModal'; // Adjust path as needed

const CustomerAssignmentModal = ({
  isOpen,
  onClose,
  onCustomerSelect,
  onCustomerRegister // Callbacks for parent to handle selection/registration
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      toast.warn('Please enter an email or phone number to search.');
      return;
    }
    setIsSearching(true);
    setSearchResults([]);

    try {
      const responseData = await bookingService.searchCustomers(searchQuery);
      setSearchResults(responseData.users || []);
      if (!responseData.users || responseData.users.length === 0) {
        toast.info('No customers found matching your query.');
      }
    } catch (error) {
      console.error('Error searching customers (modal):', error);
      toast.error(error.message || 'Failed to search customers.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelect = (customer) => {
    if (customer && onCustomerSelect) {
      onCustomerSelect(customer); // Pass selected customer to parent
      handleClose(); // Close this modal after selection
    }
  };

  const handleRegisterSuccess = (newCustomer) => {
     if (newCustomer && onCustomerRegister) {
        onCustomerRegister(newCustomer); // Pass newly registered customer to parent
        setShowRegisterModal(false); // Close registration modal
        handleClose(); // Close this modal after registration
     } else {
        // Handle case where registration might succeed but no customer data is returned
        console.warn('Registration successful but no customer data received.');
        setShowRegisterModal(false);
     }
  };

  const handleClose = () => {
    // Reset state when closing
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setShowRegisterModal(false);
    onClose(); // Call parent's onClose
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" onClick={handleClose}></div>

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Assign Customer</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Modal Body - Scrollable */}
          <div className="p-6 space-y-4 overflow-y-auto">
             {/* Search Section */}
             <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-700">Search Existing Customer</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="Enter customer email or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-grow block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={isSearching}
                  />
                <button
                  type="button"
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {isSearching ? <ArrowPathIcon className="animate-spin h-5 w-5 mr-2" /> : <MagnifyingGlassIcon className="h-5 w-5 mr-2" />}
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
                </div>
             </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                <ul className="divide-y divide-gray-200">
                  {searchResults.map(customer => (
                    <li
                      key={customer._id}
                      onClick={() => handleSelect(customer)}
                      className="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                     >
                      <div>
                        <span className="font-medium">{customer.firstName} {customer.lastName}</span>
                        <span className="block text-xs text-gray-500">{customer.email}</span>
                      </div>
                       <span className="text-xs text-gray-400">ID: {customer._id}</span>
                    </li>
                  ))}
                </ul>
              </div>
             )}
            {searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                 <p className="text-sm text-gray-500 mt-2">No customers found.</p>
             )}

             {/* Separator and Register Button */}
             <div className="flex items-center justify-center pt-4 border-t border-gray-200 mt-4">
                <span className="text-sm text-gray-500 mr-2">Can't find the customer?</span>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <UserPlusIcon className="h-5 w-5 mr-2" />
                  Register New Customer
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* Nested Registration Modal */}
      <CustomerRegistrationModal
         isOpen={showRegisterModal}
         onClose={() => setShowRegisterModal(false)}
         onRegisterSuccess={handleRegisterSuccess} // Pass handler to receive new customer
      />
    </>
  );
};

export default CustomerAssignmentModal;
