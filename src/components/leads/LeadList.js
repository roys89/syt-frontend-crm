// src/components/leads/LeadList.js
import { ArrowPathIcon, DocumentPlusIcon, EyeIcon, MagnifyingGlassIcon, PencilSquareIcon, TrashIcon, UsersIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';
import userService from '../../services/userService';
import StatusUpdateModal from './StatusUpdateModal';

// Helper function for status badges (you might want to move this to a utils file)
const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'new': return 'bg-blue-100 text-blue-800';
    case 'assigned': return 'bg-cyan-100 text-cyan-800';
    case 'contacted': return 'bg-purple-100 text-purple-800'; // Keep old or replace?
    case 'follow up': return 'bg-yellow-100 text-yellow-800';
    case 'proposal': return 'bg-orange-100 text-orange-800'; // Keep old or replace?
    case 'won':
    case 'closed_won': return 'bg-green-100 text-green-800';
    case 'lost':
    case 'closed_lost': return 'bg-red-100 text-red-800';
    case 'qualified': return 'bg-teal-100 text-teal-800'; // Keep old or replace?
    case 'negotiation': return 'bg-amber-100 text-amber-800'; // Keep old or replace?
    default: return 'bg-gray-100 text-gray-800';
  }
};

// ** NEW: Define constants for filters **
const LEAD_STATUSES = ['new', 'assigned', 'follow up', 'proposal', 'won', 'lost', 'closed_won', 'closed_lost', 'contacted', 'qualified', 'negotiation'];
const LEAD_TYPES = ['website', 'updated', 'ad']; // Adjust if other types exist

const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const { user } = useContext(AuthContext);
  
  // ** NEW: State for filters and search **
  const [filters, setFilters] = useState({
    status: '',
    leadType: '',
    assignedTo: '',
    startDate: '',
    endDate: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [agents, setAgents] = useState([]); // For assignedTo filter

  // ** NEW: State for Status Update Modal **
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedLeadForStatusUpdate, setSelectedLeadForStatusUpdate] = useState(null);

  // ** NEW: Fetch agents for filter dropdown **
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await userService.getAgents();
        setAgents(response.agents || []);
      } catch (error) {
        console.error("Failed to fetch agents for filter:", error);
        // Optionally notify user, but maybe not critical for filter
      }
    };
    fetchAgents();
  }, []);

  // ** MODIFIED: fetchLeads to include filters and search **
  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true);
      // Construct params object from state
      const params = { ...filters };
      if (searchTerm) params.search = searchTerm;
      // Remove empty filter values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await leadService.getLeads(params);
      
      // MODIFIED: Access the nested 'data' property for the leads array
      setLeads(response?.data?.data || []); 
      // Consider setting total count for pagination if API provides it
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error(`Failed to fetch leads`);
      setLeads([]);
      setIsLoading(false);
    }
  // Include filters and searchTerm in dependency array
  }, [filters, searchTerm]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        setLeads(prevLeads => prevLeads.filter(lead => lead._id !== id));
        setSelectedLeads(prevSelected => prevSelected.filter(leadId => leadId !== id));
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleSelectLead = (id) => {
    setSelectedLeads(prevSelected => 
      prevSelected.includes(id) 
        ? prevSelected.filter(leadId => leadId !== id) 
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(leads.map(lead => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleDeleteSelectedLeads = async () => {
    if (selectedLeads.length === 0) {
      toast.error('No leads selected');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} selected leads?`)) {
      try {
        await leadService.deleteMultipleLeads(selectedLeads);
        fetchLeads();
        setSelectedLeads([]);
        toast.success(`${selectedLeads.length} leads deleted successfully`);
      } catch (error) {
        toast.error('Failed to delete selected leads');
      }
    }
  };

  // ** NEW: Handlers for filter/search changes **
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeads(); // Trigger fetch on explicit search or rely on useEffect debounce?
  };

  const clearFilters = () => {
    setFilters({ status: '', leadType: '', assignedTo: '', startDate: '', endDate: '' });
    setSearchTerm('');
    // fetchLeads(); // fetchLeads will be called by useEffect due to state change
  };

  // ** NEW: Handlers for Status Update Modal **
  const openStatusModal = (lead) => {
    setSelectedLeadForStatusUpdate(lead);
    setIsStatusModalOpen(true);
  };

  const closeStatusModal = () => {
    setSelectedLeadForStatusUpdate(null);
    setIsStatusModalOpen(false);
  };

  const handleStatusUpdateSubmit = async (leadId, newStatus, note) => {
    try {
      await leadService.updateLeadStatus(leadId, { status: newStatus, note });
      toast.success(`Lead status updated to ${newStatus}`);
      closeStatusModal();
      fetchLeads(); // Refresh the list to show the updated status and potentially notes
    } catch (error) {
      toast.error(`Failed to update lead status: ${error.message || 'Server error'}`);
      // Keep the modal open if submission fails? Or close it? Depends on UX preference.
      // For now, we keep it open for the user to retry or cancel.
    }
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
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all leads in your itinerary planning system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          {user?.permissions?.canViewLeads && (
            <>
              <Link
                to="/leads/website"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <UsersIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Website Leads
              </Link>
            </>
          )}
          {user?.permissions?.canAddLead && (
            <>
              <Link
                to="/leads/upload"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <DocumentPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                Bulk Upload
              </Link>
              <Link
                to="/leads/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Lead
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ** NEW: Filter and Search Section ** */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 items-end">
          {/* Search Input */}
          <div className="md:col-span-2 xl:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search (Name/Email)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                name="search"
                id="search"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
            <select 
              id="status" 
              name="status"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              {LEAD_STATUSES.map(status => (
                <option key={status} value={status} className="capitalize">{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Lead Type Filter */}
          <div>
            <label htmlFor="leadType" className="block text-sm font-medium text-gray-700">Lead Type</label>
            <select 
              id="leadType" 
              name="leadType"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.leadType}
              onChange={handleFilterChange}
            >
              <option value="">All Types</option>
              {LEAD_TYPES.map(type => (
                <option key={type} value={type} className="capitalize">{type}</option>
              ))}
            </select>
          </div>
          
          {/* Assigned To Filter */}
          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select 
              id="assignedTo" 
              name="assignedTo"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.assignedTo}
              onChange={handleFilterChange}
            >
              <option value="">All Agents</option>
              {agents.map(agent => (
                <option key={agent._id} value={agent._id}>{agent.name} {agent.employeeId ? `(${agent.employeeId})` : ''}</option>
              ))}
            </select>
          </div>
          
          {/* Date Filters (Simplified - Consider using a date range picker component) */}
          {/* Start Date */}
          {/* <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Created After</label>
            <input 
              type="date" 
              id="startDate" 
              name="startDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div> */}
          {/* End Date */}
          {/* <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Created Before</label>
            <input 
              type="date" 
              id="endDate" 
              name="endDate"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div> */}

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <XMarkIcon className="-ml-1 mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>
      </div>
      {/* ** END Filter and Search Section ** */}

      {selectedLeads.length > 0 && (
        <div className="mb-4 p-4 bg-gray-50 rounded-md shadow-sm flex items-center justify-between">
          <span>
            {selectedLeads.length} {selectedLeads.length === 1 ? 'lead' : 'leads'} selected
          </span>
          {user?.permissions?.canRemoveLead && (
            <button
              onClick={handleDeleteSelectedLeads}
              className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Delete Selected
            </button>
          )}
        </div>
      )}

      {leads.length === 0 ? (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-900">No leads found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating a new lead or importing leads from a CSV file.
          </p>
          {user?.permissions?.canAddLead && (
            <div className="mt-6">
              <Link
                to="/leads/add"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Lead
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          onChange={handleSelectAll}
                          checked={leads.length > 0 && selectedLeads.length === leads.length}
                          indeterminate={selectedLeads.length > 0 && selectedLeads.length < leads.length}
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Travel Plans
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead._id} className={`${selectedLeads.includes(lead._id) ? 'bg-blue-50' : ''} hover:bg-gray-50`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                            onChange={() => handleSelectLead(lead._id)}
                            checked={selectedLeads.includes(lead._id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.firstName} {lead.lastName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(lead.status)}`}>
                            {lead.status?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize
                            ${lead.leadType === 'website' ? 'bg-blue-100 text-blue-800' : 
                              lead.leadType === 'updated' ? 'bg-yellow-100 text-yellow-800' : 
                              lead.leadType === 'ad' ? 'bg-purple-100 text-purple-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {lead.leadType || 'N/A'} 
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.itineraryPreferences?.destination || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {/* Display Name and Employee ID */}
                          {lead.assignedTo ? `${lead.assignedTo.name} ${lead.assignedTo.employeeId ? `(${lead.assignedTo.employeeId})` : ''}` : 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-3">
                            <Link
                              to={`/leads/view/${lead._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="View Lead"
                            >
                              <span className="sr-only">View</span>
                              <EyeIcon className="h-5 w-5" />
                            </Link>
                            {user?.permissions?.canAddLead && (
                              <Link
                                to={`/leads/edit/${lead._id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit Lead"
                              >
                                <span className="sr-only">Edit</span>
                                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                              </Link>
                            )}
                            {user?.permissions?.canRemoveLead && (
                              <button
                                onClick={() => handleDeleteLead(lead._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete Lead"
                              >
                                <span className="sr-only">Delete</span>
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
                              </button>
                            )}
                            {user?.permissions?.canAddLead && (
                              <button
                                onClick={() => openStatusModal(lead)}
                                className="text-gray-500 hover:text-indigo-600"
                                title="Update Status"
                              >
                                <span className="sr-only">Update Status</span>
                                <ArrowPathIcon className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ** NEW: Status Update Modal ** */}
      <StatusUpdateModal
        isOpen={isStatusModalOpen}
        onClose={closeStatusModal}
        leadId={selectedLeadForStatusUpdate?._id}
        currentStatus={selectedLeadForStatusUpdate?.status}
        onSubmit={handleStatusUpdateSubmit}
      />
    </div>
  );
};

export default LeadList;
