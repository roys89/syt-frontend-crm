import { ArrowPathIcon, DocumentMagnifyingGlassIcon, DocumentPlusIcon, EyeIcon, TrashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import bookingService from '../../services/bookingService';
import CustomerAssignmentModal from './CustomerAssignmentModal';

const InquiriesTabContent = () => {
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(null);

  // State for the assignment modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetInquiryToken, setAssignTargetInquiryToken] = useState(null);
  const [isAssigningUser, setIsAssigningUser] = useState(false);

  const [deletingInquiryToken, setDeletingInquiryToken] = useState(null);

  // MODIFICATION: Get navigate function
  const navigate = useNavigate();

  const fetchInquiries = async () => {
    setIsLoading(true);
    try {
      const response = await bookingService.getCrmInquiries();
      console.log("Fetched Inquiries:", response); // Log fetched data
      setInquiries(response || []);
    } catch (error) {
      console.error('Error fetching itinerary inquiries:', error);
      toast.error(error.message || 'Failed to load itinerary inquiries');
      setInquiries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!deletingInquiryToken) {
        fetchInquiries();
    }
  }, [deletingInquiryToken]);

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper for status badge color
  const getStatusBadgeColor = (status, hasItinerary) => {
    if (hasItinerary) {
      return 'bg-green-100 text-green-800'; // Green for Itinerary Created
    }
    // Default for Inquiry status (can be expanded later if more statuses are added)
    return 'bg-blue-100 text-blue-800'; 
  };

  // MODIFIED: Open the assignment modal
  const handleAssignUserClick = (inquiryToken) => {
    console.log(`Assign User button clicked for inquiry: ${inquiryToken}`); // Log token on click
    setAssignTargetInquiryToken(inquiryToken);
    setIsAssignModalOpen(true);
  };

  // Callback for when a customer is selected/registered in the modal
  const handleCustomerSelectedForAssignment = async (customer) => {
     if (!assignTargetInquiryToken) {
       console.error('Target inquiry token not set for assignment.');
       toast.error('An error occurred. Please try again.');
       setIsAssignModalOpen(false);
       return;
     }
     if (!customer || !customer._id) {
        console.error('Invalid customer data received from modal for assignment.');
        toast.error('Failed to get customer details.');
        setIsAssignModalOpen(false);
        return;
     }

     setIsAssigningUser(true);
     setIsAssignModalOpen(false); // Close modal immediately

     try {
        // Log the token BEING USED for the API call
        console.log(`Attempting API call assignUserToInquiry with token: ${assignTargetInquiryToken} and user: ${customer._id}`);
        console.log(`Attempting to assign user ${customer._id} (${customer.email}) to inquiry ${assignTargetInquiryToken}`);
        // Pass the full customer object to the service
        await bookingService.assignUserToInquiry(assignTargetInquiryToken, customer); 
        toast.success(`User ${customer.firstName || ''} ${customer.lastName || ''} assigned successfully!`);
        await fetchInquiries(); // Refresh the list to show the updated customer name
     } catch (error) {
        // Error toast is likely shown by the service itself, but log here too
        console.error(`Failed to assign user to inquiry ${assignTargetInquiryToken}:`, error);
        // Optionally show another toast here if needed
     } finally {
        setIsAssigningUser(false);
        setAssignTargetInquiryToken(null); // Clear the target token
     }
  };

  const handleCreateItinerary = async (inquiryToken) => {
    if (isCreating || isAssigningUser) return; // Prevent clicks during assignment too
    setIsCreating(inquiryToken);
    try {
      toast.info('Creating itinerary... This might take a moment.');
      const createdItinerary = await bookingService.createItineraryFromInquiry(inquiryToken);
      toast.success('Itinerary created successfully!');
      console.log('Created Itinerary:', createdItinerary);
      await fetchInquiries();
    } catch (error) {
      console.error('Error creating itinerary:', error);
      toast.error(error.message || 'Failed to create itinerary.');
    } finally {
      setIsCreating(null);
    }
  };

  // MODIFICATION: Handler for View Itinerary button click
  const handleViewItineraryClick = (item) => {
    if (item.paymentStatus === 'pending' && item.itineraryToken && item.inquiryToken) { // Ensure inquiryToken also exists
       console.log(`Navigating to Itinerary Booking page for itineraryToken: ${item.itineraryToken} (inquiry: ${item.inquiryToken})`);
      // Pass BOTH tokens in state
      navigate('/bookings/itinerary', { state: { itineraryToken: item.itineraryToken, inquiryToken: item.inquiryToken } });
    } else {
       console.warn(`View Itinerary clicked but paymentStatus ('${item.paymentStatus}'), itineraryToken, or inquiryToken missing.`);
       toast.info(`Cannot view/modify itinerary. Status: ${item.paymentStatus || 'Unknown'}`);
    }
  };

  // *** NEW: Handler for Delete Inquiry Button ***
  const handleDeleteInquiry = async (inquiryToken) => {
    if (deletingInquiryToken || isCreating || isAssigningUser) return; // Prevent multiple actions

    if (!inquiryToken) {
        toast.error('Cannot delete: Inquiry token is missing.');
        return;
    }
    
    if (window.confirm(`Are you sure you want to delete this inquiry (${inquiryToken})? This action might be irreversible.`)) {
      setDeletingInquiryToken(inquiryToken);
      try {
        await bookingService.deleteInquiry(inquiryToken);
        toast.success(`Inquiry ${inquiryToken} deleted successfully.`);
        // fetchInquiries() will be triggered by useEffect when deletingInquiryToken becomes null
      } catch (error) {
        console.error(`Error deleting inquiry ${inquiryToken}:`, error);
        toast.error(`Failed to delete inquiry. ${error.message || ''}`);
      } finally {
        setDeletingInquiryToken(null); // Reset deleting state
      }
    }
  };

  if (isLoading && !isCreating && !isAssigningUser) { // Updated loading check
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <>
      <div>
        {inquiries.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No itinerary inquiries found</h3>
            <p className="mt-2 text-sm text-gray-500">
              You currently don't have any inquiries assigned to you.
            </p>
             {/* Button moved to the main BookingsPage header */}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {/* Adjusted Columns - Added py-3.5 consistently */}
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                     Inquiry Token
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Customer
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Details
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Date Added
                  </th>
                   <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Agent Name
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inquiries.map((item) => (
                  <tr key={item.inquiryToken} className="hover:bg-gray-50 align-top">
                    {/* Inquiry Token - Adjusted padding */}
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-xs text-gray-600 sm:pl-6">
                       {item.inquiryToken}
                     </td>
                    {/* Customer - Adjusted padding */}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {item.customerName ? (
                        item.customerName
                      ) : (
                        <button 
                          onClick={() => handleAssignUserClick(item.inquiryToken)} 
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 focus:outline-none disabled:opacity-50"
                          title="Assign User"
                          disabled={!!isCreating || isAssigningUser} // Disable if creating itinerary OR assigning user
                        >
                           {isAssigningUser && assignTargetInquiryToken === item.inquiryToken ? (
                                <><ArrowPathIcon className="animate-spin h-5 w-5 mr-1" /> Assigning...</>
                           ) : (
                                <><UserPlusIcon className="h-5 w-5 mr-1" aria-hidden="true" /> Assign User</>
                           )}
                        </button>
                      )}
                    </td>
                     {/* Details - Adjusted padding and layout */}
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {item.citiesList && item.citiesList.length > 0 ? (
                        <div>
                          <div className="font-medium text-gray-900 truncate" title={item.citiesList.join(', ')}>{item.citiesList.join(', ')}</div>
                          <div className="text-xs text-gray-500 mt-1">
                             <span>{item.totalDays || 0} Days</span>
                             <span className="mx-1">/</span>
                             <span>{item.travelerCount || 0} Travelers</span>
                          </div>
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </td>
                     {/* Date Added - Adjusted padding */}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                    {/* Agent Name - Adjusted padding */}
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      {item.agentName || <span className="text-gray-400 italic">Customer Made</span>}
                    </td>
                    {/* Status - Adjusted padding and logic */}
                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                      <span 
                        className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(item.status, item.hasItinerary)}`}
                      >
                        {item.hasItinerary ? 'Itinerary Created' : item.status}
                      </span>
                    </td>
                    {/* Actions - Adjusted padding */}
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                       {/* MODIFIED: Actions container */}
                      <div className="flex items-center justify-end space-x-3">
                        {item.hasItinerary ? (
                           <> 
                             {/* View/Modify Itinerary Button (Existing) */}
                             <button 
                               onClick={() => handleViewItineraryClick(item)}
                               disabled={item.paymentStatus !== 'pending'} 
                               className="inline-flex items-center text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed p-1 rounded hover:bg-indigo-100"
                               title={item.paymentStatus !== 'pending' ? `Cannot modify, status: ${item.paymentStatus || 'N/A'}` : `View/Modify Itinerary ${item.itineraryToken}`}
                              >
                               <EyeIcon className="h-5 w-5" aria-hidden="true" /> 
                             </button>
                             {/* View Inquiry Button (when Itinerary exists) */}
                             <Link
                                to={`/inquiry/${item.inquiryToken}`} 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                                title={`View Inquiry ${item.inquiryToken}`}
                              >
                                <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                              </Link>
                             {/* Delete Inquiry Button (when Itinerary exists) */}
                             <button
                                onClick={() => handleDeleteInquiry(item.inquiryToken)}
                                className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={`Delete Inquiry ${item.inquiryToken}`}
                                disabled={deletingInquiryToken === item.inquiryToken || isCreating || isAssigningUser}
                              >
                                {deletingInquiryToken === item.inquiryToken ? (
                                  <ArrowPathIcon className="h-5 w-5 animate-spin" />
                                ) : (
                                  <TrashIcon className="h-5 w-5" />
                                )}
                              </button>
                           </>
                        ) : (
                          <> 
                            {/* Create Itinerary Button (Existing) */}
                            <button 
                              onClick={() => handleCreateItinerary(item.inquiryToken)}
                              className={`inline-flex items-center text-green-600 hover:text-green-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isCreating === item.inquiryToken ? 'animate-pulse' : ''} p-1 rounded hover:bg-green-100`}
                              title="Create Itinerary from Inquiry"
                              disabled={!!isCreating || isAssigningUser || !!deletingInquiryToken}
                            >
                              {isCreating === item.inquiryToken ? (
                                 <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              ) : ( 
                                 <DocumentPlusIcon className="h-5 w-5" />
                              )}
                            </button>
                            {/* View Inquiry Button (when NO Itinerary exists) */}
                             <Link
                                to={`/inquiry/${item.inquiryToken}`} 
                                className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                                title={`View Inquiry ${item.inquiryToken}`}
                              >
                                <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                              </Link>
                            {/* Delete Inquiry Button (when NO Itinerary exists) */}
                            <button
                              onClick={() => handleDeleteInquiry(item.inquiryToken)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={`Delete Inquiry ${item.inquiryToken}`}
                              disabled={deletingInquiryToken === item.inquiryToken || isCreating || isAssigningUser}
                            >
                              {deletingInquiryToken === item.inquiryToken ? (
                                <ArrowPathIcon className="h-5 w-5 animate-spin" />
                              ) : (
                                <TrashIcon className="h-5 w-5" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render CustomerAssignmentModal */} 
      <CustomerAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onCustomerSelect={handleCustomerSelectedForAssignment} // Use the new assignment handler
        onCustomerRegister={handleCustomerSelectedForAssignment} // Use same handler for register
      />
    </>
  );
};

export default InquiriesTabContent; 