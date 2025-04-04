import { ArrowPathIcon, DocumentPlusIcon, EyeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    fetchInquiries();
  }, []);

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
        {/* Removed Commented Sub Tabs */}

        {inquiries.length === 0 && !isLoading ? (
          <div className="text-center py-12 bg-white shadow rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No itinerary inquiries found</h3>
            <p className="mt-2 text-sm text-gray-500">
              Use the button above to create a new one, or check your filters.
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
                      {item.hasItinerary ? (
                         <div className="flex items-center justify-end space-x-3"> 
                           {/* MODIFICATION: Changed Link to Button, added onClick, disabled logic */}
                           <button 
                             onClick={() => handleViewItineraryClick(item)}
                             disabled={item.paymentStatus !== 'pending'} // Disable if not pending
                             className="inline-flex items-center text-indigo-600 hover:text-indigo-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                             title={item.paymentStatus !== 'pending' ? `Cannot modify, status: ${item.paymentStatus || 'N/A'}` : `View/Modify Itinerary ${item.itineraryToken}`}
                            >
                             <EyeIcon className="h-5 w-5" aria-hidden="true" /> 
                             <span className="hidden sm:inline ml-1.5">
                               {item.paymentStatus === 'pending' ? 'View / Modify' : 'View Itinerary'} 
                             </span> 
                             <span className="sm:hidden ml-1.5 font-mono text-xs text-gray-500">({item.itineraryToken})</span> {/* Token visible on small screens */}
                           </button>
                           {/* Keep token visible */}
                           <span className="hidden sm:inline ml-1.5 font-mono text-xs text-gray-400">({item.itineraryToken})</span> {/* Token visible on sm+ screens */}
                         </div>
                      ) : (
                        <button 
                          onClick={() => handleCreateItinerary(item.inquiryToken)}
                          className={`inline-flex items-center text-green-600 hover:text-green-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${isCreating === item.inquiryToken ? 'animate-pulse' : ''}`}
                          title="Create Itinerary from Inquiry"
                          disabled={!!isCreating || isAssigningUser} // Disable if creating OR assigning
                        >
                          {isCreating === item.inquiryToken ? (
                             <>
                               <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                               </svg>
                                Creating...
                             </>
                          ) : (
                             <><DocumentPlusIcon className="h-5 w-5 mr-1" /> Create Itinerary</>
                          )}
                        </button>
                      )}
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