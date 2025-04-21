import { ArrowUturnLeftIcon, ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon, EyeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';
import userService from '../../services/userService';

const WebsiteLeadList = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState({});
  const [agents, setAgents] = useState([]);
  const [assigningLead, setAssigningLead] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const canAssign = user && (user.role === 'admin' || user.role === 'manager');
  
  useEffect(() => {
    fetchLeads();
    if (canAssign) {
      fetchAgents();
    }
  }, [canAssign]);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await leadService.getWebsiteLeads();
      setLeads(response.data.data || []);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch website leads');
      console.error('Failed to fetch website leads:', error);
      setLeads([]);
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    if (!canAssign) return;
    try {
      const response = await userService.getAgents();
      setAgents(response.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      // Don't toast here as it's secondary functionality
    }
  };

  const toggleExpandLead = (id) => {
    setExpandedLeads(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAssignAgent = async (leadId, agentId) => {
    if (!agentId) {
      toast.error('Please select an agent');
      return;
    }

    try {
      setAssigningLead(leadId);
      await leadService.assignLeadToAgent(leadId, agentId);
      toast.success('Lead assigned successfully');
      fetchLeads(); // Refresh leads after assignment
    } catch (error) {
      console.error('Failed to assign lead:', error);
      toast.error('Failed to assign lead to agent');
    } finally {
      setAssigningLead(null);
    }
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
          <h1 className="text-xl font-semibold text-gray-900">Website Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Website leads from customers who have created accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
            Back
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No website leads found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Website leads will appear here when customers create accounts on your website.
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
                  Country
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Signed Up
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Assigned To
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
                        <button 
                          onClick={() => toggleExpandLead(lead._id)}
                          className="mr-2 text-gray-400 hover:text-gray-500"
                        >
                          {expandedLeads[lead._id] ? 
                            <ChevronDownIcon className="h-5 w-5" /> : 
                            <ChevronRightIcon className="h-5 w-5" />
                          }
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">{lead.fullName}</div>
                          <div className="text-gray-500">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {lead.email}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {lead.country || 'N/A'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-500">
                      {lead.assignedTo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="relative py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      {!lead.assignedTo && canAssign && (
                        <div className="flex items-center justify-end space-x-2">
                          {assigningLead === lead._id ? (
                            <div className="flex items-center">
                              <select 
                                className="block w-40 pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                defaultValue=""
                                onChange={(e) => handleAssignAgent(lead._id, e.target.value)}
                              >
                                <option value="" disabled>Select agent</option>
                                {agents.map(agent => (
                                  <option key={agent._id} value={agent._id}>
                                    {agent.name}
                                  </option>
                                ))}
                              </select>
                              <button 
                                className="ml-2 text-gray-400 hover:text-gray-500"
                                onClick={() => setAssigningLead(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningLead(lead._id)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              disabled={!canAssign}
                            >
                              <UserPlusIcon className="h-5 w-5 mr-1" />
                              Assign
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {expandedLeads[lead._id] && (
                    <tr>
                      <td colSpan="6" className="px-6 py-4">
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-900">Customer Activity</h3>
                            <p className="text-xs text-gray-500">
                              Inquiries: {lead.inquiries.length} | Itineraries: {lead.itineraries.length}
                            </p>
                          </div>
                          
                          {lead.inquiries.length > 0 && (
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
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Assigned Agent
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
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                          {inquiry.agentName || 'Unassigned'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                          
                          {lead.itineraries.length > 0 && (
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
                                        Assigned Agent
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
                                          {itinerary.agentName || 'Unassigned'}
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
                          
                          {lead.inquiries.length === 0 && lead.itineraries.length === 0 && (
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

export default WebsiteLeadList; 