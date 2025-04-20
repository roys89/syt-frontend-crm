import { ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon, EyeIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import leadService from '../../services/leadService';

const AgentLeadList = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState({});
  
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await leadService.getAgentLeads();
      setLeads(response.data || []);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch leads');
      console.error('Failed to fetch leads:', error);
      setIsLoading(false);
    }
  };

  const toggleExpandLead = (id) => {
    setExpandedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Identify if a lead is a website lead based on the presence of inquiries/itineraries
  const isWebsiteLead = (lead) => {
    return lead.leadType === 'website' && Array.isArray(lead.inquiries || lead.itineraries);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Leads assigned to you
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No leads assigned to you yet</h3>
          <p className="mt-2 text-sm text-gray-500">
            When an admin assigns leads to you, they will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Type
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Assigned Date
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {leads.map((lead) => (
                <React.Fragment key={lead._id}>
                  <tr className={expandedLeads[lead._id] ? 'bg-gray-50' : 'hover:bg-gray-50'}>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        {isWebsiteLead(lead) && (
                          <button 
                            onClick={() => toggleExpandLead(lead._id)}
                            className="mr-2 text-gray-400 hover:text-gray-500"
                          >
                            {expandedLeads[lead._id] ? 
                              <ChevronDownIcon className="h-5 w-5" /> : 
                              <ChevronRightIcon className="h-5 w-5" />
                            }
                          </button>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {lead.fullName || `${lead.firstName} ${lead.lastName}`}
                          </div>
                          <div className="text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {lead.email}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${lead.leadType === 'website' ? 'bg-blue-100 text-blue-800' : 
                          lead.leadType === 'updated' ? 'bg-yellow-100 text-yellow-800' : 
                          lead.leadType === 'ad' ? 'bg-purple-100 text-purple-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {lead.leadType ? lead.leadType.charAt(0).toUpperCase() + lead.leadType.slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${lead.status === 'closed_won' ? 'bg-green-100 text-green-800' : 
                          lead.status === 'closed_lost' ? 'bg-red-100 text-red-800' : 
                          lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {lead.status ? lead.status.replace('_', ' ').charAt(0).toUpperCase() + lead.status.replace('_', ' ').slice(1) : 'Unknown'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {formatDate(lead.assignedAt)}
                    </td>
                    <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <Link
                        to={`/leads/view/${lead._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                  
                  {/* Expanded content for website leads */}
                  {expandedLeads[lead._id] && isWebsiteLead(lead) && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-900">Customer Activity</h3>
                            <p className="text-xs text-gray-500">
                              Inquiries: {(lead.inquiries || []).length} | Itineraries: {(lead.itineraries || []).length}
                            </p>
                          </div>
                          
                          {/* Inquiries section */}
                          {lead.inquiries && lead.inquiries.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-medium text-gray-700 uppercase mb-2">Inquiries</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Inquiry Token
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Destinations
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Travel Dates
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {lead.inquiries.map((inquiry) => (
                                      <tr key={inquiry.inquiryToken} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-mono">
                                          {inquiry.inquiryToken}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          {formatDate(inquiry.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          {inquiry.destinations}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          {formatDate(inquiry.startDate)} - {formatDate(inquiry.endDate)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {/* Itineraries section */}
                          {lead.itineraries && lead.itineraries.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-700 uppercase mb-2">Itineraries</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-100">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Itinerary Token
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {lead.itineraries.map((itinerary) => (
                                      <tr key={itinerary.itineraryToken} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900 font-mono">
                                          {itinerary.itineraryToken}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          {formatDate(itinerary.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                                            ${itinerary.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                                              itinerary.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                              'bg-gray-100 text-gray-800'}`}>
                                            {itinerary.status.charAt(0).toUpperCase() + itinerary.status.slice(1)}
                                          </span>
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          <Link
                                            to={`/bookings/itinerary`}
                                            state={{ itineraryToken: itinerary.itineraryToken, inquiryToken: itinerary.inquiryToken }}
                                            className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                          >
                                            <EyeIcon className="h-4 w-4 mr-1" />
                                            View
                                          </Link>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {(!lead.inquiries || lead.inquiries.length === 0) && (!lead.itineraries || lead.itineraries.length === 0) && (
                            <div className="text-center py-4">
                              <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                              <p className="mt-1 text-sm text-gray-500">
                                This customer has not created any inquiries or itineraries yet.
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AgentLeadList; 