// src/components/leads/LeadList.js
import { DocumentPlusIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';

const LeadList = () => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const { user } = useContext(AuthContext);
  
  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setIsLoading(true);
      const response = await leadService.getLeads();
      setLeads(response.data);
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch leads');
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async (id) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      try {
        await leadService.deleteLead(id);
        setLeads(leads.filter(lead => lead._id !== id));
        toast.success('Lead deleted successfully');
      } catch (error) {
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleSelectLead = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
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

    if (window.confirm(`Are you sure you want to delete ${selectedLeads.length} leads?`)) {
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
                          checked={selectedLeads.length > 0 && selectedLeads.length === leads.length}
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
                        Travel Plans
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.map((lead) => (
                      <tr key={lead._id} className={selectedLeads.includes(lead._id) ? 'bg-blue-50' : undefined}>
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
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'contacted' ? 'bg-purple-100 text-purple-800' :
                            lead.status === 'qualified' ? 'bg-green-100 text-green-800' :
                            lead.status === 'proposal' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'negotiation' ? 'bg-orange-100 text-orange-800' :
                            lead.status === 'closed_won' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-red-100 text-red-800'}`}
                          >
                            {lead.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {lead.itineraryPreferences?.destination || 'Not specified'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link
                              to={`/leads/view/${lead._id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                            {user?.permissions?.canAddLead && (
                              <Link
                                to={`/leads/edit/${lead._id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <PencilSquareIcon className="h-5 w-5" aria-hidden="true" />
                              </Link>
                            )}
                            {user?.permissions?.canRemoveLead && (
                              <button
                                onClick={() => handleDeleteLead(lead._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" aria-hidden="true" />
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
    </div>
  );
};

export default LeadList;
