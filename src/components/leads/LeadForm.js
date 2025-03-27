// src/components/leads/LeadForm.js
import { TrashIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';

const LeadForm = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'new',
    source: 'website',
    notes: '',
    itineraryPreferences: {
      destination: '',
      budget: '',
      numberOfTravelers: '',
      accommodationPreference: '',
      activities: []
    }
  });
  const [activity, setActivity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (id) {
      setIsEditMode(true);
      fetchLead(id);
    }
  }, [id]);

  const fetchLead = async (leadId) => {
    try {
      setIsLoading(true);
      const response = await leadService.getLeadById(leadId);
      const lead = response.data;
      
      setFormData({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || '',
        status: lead.status,
        source: lead.source,
        notes: lead.notes || '',
        itineraryPreferences: {
          destination: lead.itineraryPreferences?.destination || '',
          budget: lead.itineraryPreferences?.budget || '',
          numberOfTravelers: lead.itineraryPreferences?.numberOfTravelers || '',
          accommodationPreference: lead.itineraryPreferences?.accommodationPreference || '',
          activities: lead.itineraryPreferences?.activities || []
        }
      });
      
      setIsLoading(false);
    } catch (error) {
      toast.error('Failed to fetch lead details');
      navigate('/leads');
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const addActivity = () => {
    if (activity.trim()) {
      setFormData({
        ...formData,
        itineraryPreferences: {
          ...formData.itineraryPreferences,
          activities: [...formData.itineraryPreferences.activities, activity.trim()]
        }
      });
      setActivity('');
    }
  };

  const removeActivity = (index) => {
    const updatedActivities = [...formData.itineraryPreferences.activities];
    updatedActivities.splice(index, 1);
    
    setFormData({
      ...formData,
      itineraryPreferences: {
        ...formData.itineraryPreferences,
        activities: updatedActivities
      }
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Convert budget and numberOfTravelers to numbers
      const submitData = {
        ...formData,
        itineraryPreferences: {
          ...formData.itineraryPreferences,
          budget: formData.itineraryPreferences.budget 
            ? Number(formData.itineraryPreferences.budget) 
            : undefined,
          numberOfTravelers: formData.itineraryPreferences.numberOfTravelers 
            ? Number(formData.itineraryPreferences.numberOfTravelers) 
            : undefined
        }
      };
      
      if (isEditMode) {
        await leadService.updateLead(id, submitData);
        toast.success('Lead updated successfully');
      } else {
        await leadService.createLead(submitData);
        toast.success('Lead created successfully');
      }
      
      navigate('/leads');
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{isEditMode ? 'Edit Lead' : 'Add New Lead'}</h3>
            <p className="mt-1 text-sm text-gray-600">
              {isEditMode
                ? 'Update lead information and preferences'
                : 'Create a new lead with contact information and travel preferences'}
            </p>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={onSubmit}>
            <div className="shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 bg-white sm:p-6">
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      id="firstName"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.firstName}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      id="lastName"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.lastName}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      required
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.email}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      id="phone"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.phone}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.status}
                      onChange={onChange}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="proposal">Proposal</option>
                      <option value="negotiation">Negotiation</option>
                      <option value="closed_won">Closed (Won)</option>
                      <option value="closed_lost">Closed (Lost)</option>
                    </select>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="source" className="block text-sm font-medium text-gray-700">
                      Lead Source
                    </label>
                    <select
                      id="source"
                      name="source"
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      value={formData.source}
                      onChange={onChange}
                    >
                      <option value="website">Website</option>
                      <option value="referral">Referral</option>
                      <option value="social_media">Social Media</option>
                      <option value="email_campaign">Email Campaign</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      rows={3}
                      className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      value={formData.notes}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Itinerary Preferences</h3>
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="itineraryPreferences.destination" className="block text-sm font-medium text-gray-700">
                      Destination
                    </label>
                    <input
                      type="text"
                      name="itineraryPreferences.destination"
                      id="itineraryPreferences.destination"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.itineraryPreferences.destination}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="itineraryPreferences.budget" className="block text-sm font-medium text-gray-700">
                      Budget ($)
                    </label>
                    <input
                      type="number"
                      name="itineraryPreferences.budget"
                      id="itineraryPreferences.budget"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.itineraryPreferences.budget}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="itineraryPreferences.numberOfTravelers" className="block text-sm font-medium text-gray-700">
                      Number of Travelers
                    </label>
                    <input
                      type="number"
                      name="itineraryPreferences.numberOfTravelers"
                      id="itineraryPreferences.numberOfTravelers"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.itineraryPreferences.numberOfTravelers}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6 sm:col-span-3">
                    <label htmlFor="itineraryPreferences.accommodationPreference" className="block text-sm font-medium text-gray-700">
                      Accommodation Preference
                    </label>
                    <input
                      type="text"
                      name="itineraryPreferences.accommodationPreference"
                      id="itineraryPreferences.accommodationPreference"
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                      value={formData.itineraryPreferences.accommodationPreference}
                      onChange={onChange}
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="activity" className="block text-sm font-medium text-gray-700">
                      Activities
                    </label>
                    <div className="mt-1 flex">
                      <input
                        type="text"
                        id="activity"
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addActivity();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addActivity}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Add
                      </button>
                    </div>
                    {formData.itineraryPreferences.activities.length > 0 && (
                      <div className="mt-2">
                        <ul className="divide-y divide-gray-200 border rounded-md border-gray-200">
                          {formData.itineraryPreferences.activities.map((act, index) => (
                            <li key={index} className="px-4 py-3 flex items-center justify-between">
                              <span className="text-sm">{act}</span>
                              <button
                                type="button"
                                onClick={() => removeActivity(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  onClick={() => navigate('/leads')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadForm;