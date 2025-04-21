// src/components/leads/LeadDetail.js
import { ChevronDownIcon, ChevronUpIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';

const LeadDetail = () => {
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      const response = await leadService.getLeadById(id);
      setLead(response.data.data || null);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch lead details');
      setLead(null);
      setIsLoading(false);
      navigate('/leads');
    }
  };

  const handleDeleteLead = async () => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        toast.success('Lead deleted successfully');
        navigate('/leads');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleItinerary = (inquiryToken) => {
    setExpandedInquiry(expandedInquiry === inquiryToken ? null : inquiryToken);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Lead not found</h2>
        <p className="mt-2 text-gray-600">The lead you're looking for doesn't exist or you don't have permission to view it.</p>
        <Link to="/leads" className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
          Back to Leads
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {lead.firstName} {lead.lastName}
        </h2>
        <div className="flex space-x-3">
          {user?.permissions?.canAddLead && (
            <Link
              to={`/leads/edit/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilSquareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Edit
            </Link>
          )}
          {user?.permissions?.canRemoveLead && (
            <button
              onClick={handleDeleteLead}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Lead Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and travel preferences.</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {lead.firstName} {lead.lastName}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lead.email}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Phone number</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lead.phone || 'Not provided'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                  lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                  lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                  lead.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                  lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                  lead.status === 'closed_won' ? 'bg-emerald-100 text-emerald-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {lead.status?.replace('_', ' ') ?? 'N/A'}
                </span>
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lead.source?.replace('_', ' ') ?? 'N/A'}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created on</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(lead.createdAt)}</dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{formatDate(lead.updatedAt)}</dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Notes</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{lead.notes || 'No notes'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Inquiries Section */}
      {lead.inquiries && lead.inquiries.length > 0 && (
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Inquiries</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Details of inquiries submitted by the lead.</p>
          </div>
          {lead.inquiries.map((inquiry, index) => {
            const associatedItinerary = lead.itineraries?.find(
              (itin) => itin.inquiryToken === inquiry.inquiryToken
            );

            return (
              <div key={inquiry.inquiryToken || index} className={`border-t border-gray-200`}>
                <div className="px-4 py-3 sm:px-6">
                   <div className="flex justify-between items-center">
                      <div>
                         <h4 className="text-md font-semibold text-gray-700">Inquiry #{index + 1} ({inquiry.inquiryToken})</h4>
                         <p className="text-sm text-gray-500">Submitted on: {formatDate(inquiry.createdAt)}</p>
                      </div>
                      {associatedItinerary && (
                        <button 
                          onClick={() => toggleItinerary(inquiry.inquiryToken)}
                          className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          {expandedInquiry === inquiry.inquiryToken ? (
                            <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      )}
                   </div>
                </div>
                <dl className="divide-y divide-gray-200">
                  <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Destinations</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.destinations || 'N/A'}</dd>
        </div>
                  <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Dates</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatDate(inquiry.startDate)} - {formatDate(inquiry.endDate)}
              </dd>
            </div>
                  <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Travelers</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {inquiry.travelers} ({inquiry.adults} Adults, {inquiry.children} Children)
              </dd>
            </div>
                  <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Rooms</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {Array.isArray(inquiry.rooms) ? inquiry.rooms.length : (inquiry.rooms || 'N/A')}
              </dd>
            </div>
                  <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Budget</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.budget || 'N/A'}</dd>
                  </div>
                  <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Interests</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.interests || 'N/A'}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Assigned Agent</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{inquiry.agentName || 'Unassigned'}</dd>
                  </div>
                </dl>

                {/* Collapsible Itinerary Details */}
                <div 
                  className={`
                    transition-[max-height] duration-300 ease-in-out overflow-hidden 
                    ${expandedInquiry === inquiry.inquiryToken ? 'max-h-[500px]' : 'max-h-0'}
                  `}
                >
                {associatedItinerary && (
                  <div className="border-t border-dashed border-gray-300 mt-3 pt-3">
                    <div className="px-4 pb-3 sm:px-6">
                        <h5 className="text-sm font-semibold text-indigo-700">Generated Itinerary ({associatedItinerary.itineraryToken})</h5>
                        <p className="text-xs text-gray-500">Created: {formatDate(associatedItinerary.createdAt)}</p>
                    </div>
                    <dl className="divide-y divide-gray-200">
                       <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              associatedItinerary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              associatedItinerary.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              associatedItinerary.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                          }`}>
                              {associatedItinerary.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                          </span>
              </dd>
            </div>
                      <div className="bg-white px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Price</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{associatedItinerary.price || 'N/A'}</dd>
                      </div>
                      <div className="bg-gray-50 px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Assigned Agent</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{associatedItinerary.agentName || 'Unassigned'}</dd>
                      </div>
                   </dl>
                        </div>
                )}
                </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Back to Leads button */}
      <div className="mt-8 flex justify-center">
        <Link
          to="/leads"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Back to Leads
        </Link>
      </div>
    </div>
  );
};

export default LeadDetail;
