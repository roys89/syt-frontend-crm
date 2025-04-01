import { ArrowPathIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ModificationModal from '../../components/inquiry/ModificationModal';

// Inquiry status badge component
const StatusBadge = ({ status }) => {
  let classes = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  switch (status) {
    case 'pending':
      classes += ' bg-yellow-100 text-yellow-800';
      break;
    case 'in_progress':
      classes += ' bg-blue-100 text-blue-800';
      break;
    case 'completed':
      classes += ' bg-green-100 text-green-800';
      break;
    case 'cancelled':
      classes += ' bg-red-100 text-red-800';
      break;
    default:
      classes += ' bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={classes}>
      {status === 'in_progress' ? 'In Progress' : 
       status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const ItineraryInquiriesListPage = () => {
  // State
  const [inquiries, setInquiries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Modal state
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  
  // Fetch inquiries
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        setIsLoading(true);
        
        // Here you would fetch inquiries from your API
        // const response = await fetch(`/api/itineraryInquiries?page=${currentPage}&status=${statusFilter}&search=${searchQuery}`);
        // const data = await response.json();
        
        // Placeholder data
        const mockInquiries = [
          {
            id: '1',
            userId: 'user123',
            userInfo: {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phoneNumber: '+1234567890'
            },
            selectedCities: [
              { id: 'city1', name: 'Paris' },
              { id: 'city2', name: 'London' }
            ],
            departureCity: { id: 'city3', name: 'New York' },
            departureDates: {
              startDate: '2023-12-15',
              endDate: '2023-12-25'
            },
            createdAt: '2023-11-01T10:30:00Z',
            status: 'pending',
            agentCode: 'AGT001'
          },
          {
            id: '2',
            userId: 'user456',
            userInfo: {
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              phoneNumber: '+9876543210'
            },
            selectedCities: [
              { id: 'city4', name: 'Tokyo' },
              { id: 'city5', name: 'Kyoto' }
            ],
            departureCity: { id: 'city6', name: 'Los Angeles' },
            departureDates: {
              startDate: '2024-01-10',
              endDate: '2024-01-20'
            },
            createdAt: '2023-11-05T14:45:00Z',
            status: 'in_progress',
            agentCode: 'AGT002'
          },
          {
            id: '3',
            userId: 'user789',
            userInfo: {
              firstName: 'Robert',
              lastName: 'Johnson',
              email: 'robert.johnson@example.com',
              phoneNumber: '+1122334455'
            },
            selectedCities: [
              { id: 'city7', name: 'Rome' },
              { id: 'city8', name: 'Florence' },
              { id: 'city9', name: 'Venice' }
            ],
            departureCity: { id: 'city10', name: 'Chicago' },
            departureDates: {
              startDate: '2024-02-05',
              endDate: '2024-02-15'
            },
            createdAt: '2023-11-10T09:15:00Z',
            status: 'completed',
            agentCode: 'AGT003'
          }
        ];
        
        setInquiries(mockInquiries);
        setTotalPages(3); // Mock total pages
      } catch (error) {
        console.error('Error fetching inquiries:', error);
        toast.error('Failed to load inquiries. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInquiries();
  }, [currentPage, statusFilter, searchQuery]);
  
  // Filter inquiries based on search query and status
  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = searchQuery === '' || 
      inquiry.userInfo.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.userInfo.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.userInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.agentCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Handle deletion
  const handleDeleteInquiry = async (inquiryId) => {
    // Ask for confirmation
    if (!window.confirm('Are you sure you want to delete this inquiry?')) {
      return;
    }
    
    try {
      // Call API to delete inquiry
      // await fetch(`/api/itineraryInquiries/${inquiryId}`, {
      //   method: 'DELETE'
      // });
      
      // Update the list
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== inquiryId));
      toast.success('Inquiry deleted successfully');
    } catch (error) {
      console.error('Error deleting inquiry:', error);
      toast.error('Failed to delete inquiry. Please try again.');
    }
  };
  
  // Handle modification
  const handleOpenModifyModal = (inquiryId) => {
    setSelectedInquiryId(inquiryId);
    setIsModifyModalOpen(true);
  };
  
  const handleModifyInquiry = (modifiedData) => {
    // Update the inquiry in the list
    setInquiries(prev => 
      prev.map(inquiry => 
        inquiry.id === selectedInquiryId ? { ...inquiry, ...modifiedData } : inquiry
      )
    );
    setIsModifying(false);
    setIsModifyModalOpen(false);
    setSelectedInquiryId(null);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Itinerary Inquiries</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all customer itinerary inquiries in your account
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link
            to="/inquiries/create"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Create Inquiry
          </Link>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow-sm rounded-lg mb-8">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                id="search"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Search by name, email, or agent code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inquiries table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="p-12 text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            <p className="mt-2 text-sm text-gray-500">Loading inquiries...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No inquiries found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Destinations
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Travel Dates
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {inquiry.userInfo.firstName} {inquiry.userInfo.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.userInfo.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {inquiry.userInfo.phoneNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {inquiry.selectedCities.map(city => city.name).join(', ')}
                      </div>
                      <div className="text-xs text-gray-500">
                        From: {inquiry.departureCity.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(inquiry.departureDates.startDate)} - {formatDate(inquiry.departureDates.endDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.round((new Date(inquiry.departureDates.endDate) - new Date(inquiry.departureDates.startDate)) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(inquiry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={inquiry.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {inquiry.agentCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/inquiries/${inquiry.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View details"
                        >
                          <EyeIcon className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenModifyModal(inquiry.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modify inquiry"
                        >
                          <PencilIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteInquiry(inquiry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete inquiry"
                        >
                          <TrashIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {!isLoading && filteredInquiries.length > 0 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{Math.min((currentPage - 1) * 10 + 1, filteredInquiries.length)}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 10, filteredInquiries.length)}</span> of{' '}
                <span className="font-medium">{filteredInquiries.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Modification Modal */}
      <ModificationModal
        open={isModifyModalOpen}
        onClose={() => {
          setIsModifyModalOpen(false);
          setSelectedInquiryId(null);
        }}
        inquiryId={selectedInquiryId}
        onModify={handleModifyInquiry}
        isModifying={isModifying}
      />
    </div>
  );
};

export default ItineraryInquiriesListPage; 