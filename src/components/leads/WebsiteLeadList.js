import { ArrowUturnLeftIcon, ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon, DocumentMagnifyingGlassIcon, EyeIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';
import userService from '../../services/userService';

// Helper function for status badges (Copied from LeadList for now)
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'new': return 'bg-[#093923]/10 text-[#093923]';
    case 'assigned': return 'bg-[#13804e]/10 text-[#13804e]';
    case 'contacted': return 'bg-[#1a9d6c]/10 text-[#1a9d6c]';
    case 'follow up': return 'bg-[#22c35e]/10 text-[#22c35e]';
    case 'proposal': return 'bg-[#2a9d8f]/10 text-[#2a9d8f]';
    case 'won':
    case 'closed_won': return 'bg-[#13804e]/10 text-[#13804e]';
    case 'lost':
    case 'closed_lost': return 'bg-[#dc2626]/10 text-[#dc2626]';
    case 'qualified': return 'bg-[#16a34a]/10 text-[#16a34a]';
    case 'negotiation': return 'bg-[#d97706]/10 text-[#d97706]';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ** NEW: Helper for Payment Status badges **
const getPaymentStatusBadgeClass = (status) => {
  switch (status) {
    case 'completed': return 'bg-[#13804e]/10 text-[#13804e]';
    case 'pending': return 'bg-[#d97706]/10 text-[#d97706]';
    case 'processing': return 'bg-[#2563eb]/10 text-[#2563eb]';
    case 'failed': return 'bg-[#dc2626]/10 text-[#dc2626]';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ** NEW: Helper for Booking Status badges **
const getBookingStatusBadgeClass = (status) => {
  switch (status) {
    case 'confirmed': return 'bg-[#13804e]/10 text-[#13804e]';
    case 'pending': return 'bg-[#d97706]/10 text-[#d97706]';
    case 'processing': return 'bg-[#2563eb]/10 text-[#2563eb]';
    case 'cancelled': return 'bg-[#dc2626]/10 text-[#dc2626]';
    case 'failed': return 'bg-[#ec4899]/10 text-[#ec4899]';
    case 'draft': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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
          <h1 className="text-2xl font-bold text-[#093923]">Website Leads</h1>
          <p className="mt-2 text-sm text-[#13804e]">
            Website leads from customers who have created accounts
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
          >
            <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-[#093923]" aria-hidden="true" />
            Back
          </button>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-medium text-[#093923]">No website leads found</h3>
          <p className="mt-2 text-sm text-[#13804e]">
            Website leads will appear here when customers create accounts on your website.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow-lg ring-1 ring-[#093923]/10 rounded-xl">
          <table className="min-w-full divide-y divide-[#093923]/10">
            <thead className="bg-[#093923]/5">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-[#093923] sm:pl-6">
                  Name
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                  Email
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                  Country
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                  Signed Up
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                  Status
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-[#093923]">
                  Assigned To
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#093923]/10 bg-white">
              {leads.map((lead) => (
                <React.Fragment key={lead._id}>
                  <tr className={expandedLeads[lead._id] ? 'bg-[#093923]/5 transition-all ease duration-200' : 'hover:bg-[#093923]/5 transition-all ease duration-200'}>
                    <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                      <div className="flex items-center">
                        <button 
                          onClick={() => toggleExpandLead(lead._id)}
                          className="mr-2 text-[#093923]/40 hover:text-[#093923] transition-colors ease duration-200"
                        >
                          {expandedLeads[lead._id] ? 
                            <ChevronDownIcon className="h-5 w-5" /> : 
                            <ChevronRightIcon className="h-5 w-5" />
                          }
                        </button>
                        <div>
                          <div className="font-medium text-[#093923]">{lead.fullName}</div>
                          <div className="text-[#13804e]">{lead.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-sm text-[#13804e]">
                      {lead.email}
                    </td>
                    <td className="px-3 py-4 text-sm text-[#093923]">
                      {lead.country || 'N/A'}
                    </td>
                    <td className="px-3 py-4 text-sm text-[#093923]">
                      {formatDate(lead.createdAt)}
                    </td>
                    <td className="px-3 py-4 text-sm">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(lead.status)}`}>
                        {lead.status?.replace('_', ' ') || 'N/A'}
                      </span>
                    </td>
                    <td className="px-3 py-4 text-sm">
                      {lead.assignedTo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#13804e]/10 text-[#13804e]">
                          {lead.assignedTo.name} {lead.assignedTo.employeeId ? `(${lead.assignedTo.employeeId})` : ''}
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
                                className="block w-48 pl-3 pr-10 py-2 text-base border-[#093923]/20 focus:outline-none focus:ring-2 focus:ring-[#093923]/20 focus:border-[#093923]/20 sm:text-sm rounded-lg transition-all ease duration-200"
                                defaultValue=""
                                onChange={(e) => handleAssignAgent(lead._id, e.target.value)}
                              >
                                <option value="" disabled>Select agent</option>
                                {agents.map(agent => (
                                  <option key={agent._id} value={agent._id}>
                                    {agent.name} {agent.employeeId ? `(${agent.employeeId})` : ''}
                                  </option>
                                ))}
                              </select>
                              <button 
                                className="ml-2 px-3 py-2 text-[#093923]/40 hover:text-[#093923] transition-colors ease duration-200"
                                onClick={() => setAssigningLead(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAssigningLead(lead._id)}
                              className="text-[#13804e] hover:text-[#093923] flex items-center px-3 py-2 transition-colors ease duration-200"
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
                    <tr className="transition-all ease duration-200">
                      <td colSpan="7" className="px-6 py-4 transition-all ease duration-200">
                        <div className="bg-[#093923]/5 p-4 rounded-lg transition-all ease duration-200">
                          <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-sm font-medium text-[#093923]">Customer Activity</h3>
                            <p className="text-xs text-[#13804e]">
                              Inquiries: {lead.inquiries.length} | Itineraries: {lead.itineraries.length}
                            </p>
                          </div>
                          
                          {lead.inquiries.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-xs font-medium text-[#093923] uppercase mb-2">Inquiries</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#093923]/10">
                                  <thead className="bg-[#093923]/5">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Inquiry Token
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Created
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Destinations
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Travel Dates
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Assigned Agent
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-[#093923]/10">
                                    {lead.inquiries.map((inquiry) => (
                                      <tr key={inquiry.inquiryToken} className="hover:bg-[#093923]/5 transition-colors duration-200">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#093923] font-mono">
                                          {inquiry.inquiryToken}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          {formatDate(inquiry.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#093923]">
                                          {inquiry.destinations}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#093923]">
                                          {formatDate(inquiry.startDate)} - {formatDate(inquiry.endDate)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          {inquiry.agentName || 'Unassigned'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          <Link
                                            to={`/inquiry/${inquiry.inquiryToken}`}
                                            className="text-[#13804e] hover:text-[#093923] flex items-center transition-colors duration-200"
                                            title={`View Inquiry ${inquiry.inquiryToken}`}
                                          >
                                            <DocumentMagnifyingGlassIcon className="h-4 w-4 mr-1" />
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
                          
                          {lead.itineraries.length > 0 && (
                            <div>
                              <h4 className="text-xs font-medium text-[#093923] uppercase mb-2">Itineraries</h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[#093923]/10">
                                  <thead className="bg-[#093923]/5">
                                    <tr>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Itinerary Token
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Booking ID
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Created
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Booking Status 
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Payment Status
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Payment ID
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Assigned Agent
                                      </th>
                                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-[#093923] uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-[#093923]/10">
                                    {lead.itineraries.map((itinerary) => (
                                      <tr key={itinerary.itineraryToken} className="hover:bg-[#093923]/5 transition-colors duration-200">
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#093923] font-mono">
                                          {itinerary.itineraryToken}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e] font-mono">
                                          {['processing', 'confirmed', 'cancelled', 'failed'].includes(itinerary.bookingStatus) 
                                            ? itinerary.bookingId || 'N/A' 
                                            : '-'
                                          }
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          {formatDate(itinerary.createdAt)}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                          {itinerary.bookingStatus ? (
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getBookingStatusBadgeClass(itinerary.bookingStatus)}`}>
                                              {itinerary.bookingStatus.replace('_', ' ')}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                              N/A
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs">
                                          {itinerary.paymentStatus ? (
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getPaymentStatusBadgeClass(itinerary.paymentStatus)}`}>
                                              {itinerary.paymentStatus}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                              N/A
                                          </span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e] font-mono">
                                          {itinerary.paymentStatus === 'completed' && itinerary.paymentId 
                                            ? itinerary.paymentId 
                                            : '-'
                                          }
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          {itinerary.agentName || 'Unassigned'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-xs text-[#13804e]">
                                          <Link
                                            to={`/bookings/itinerary`}
                                            state={{ itineraryToken: itinerary.itineraryToken, inquiryToken: itinerary.inquiryToken }}
                                            className="text-[#13804e] hover:text-[#093923] flex items-center transition-colors duration-200"
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
                              <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-[#093923]/20" />
                              <h3 className="mt-2 text-sm font-medium text-[#093923]">No activity yet</h3>
                              <p className="mt-1 text-sm text-[#13804e]">
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