// src/components/leads/LeadForm.js
import { ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';

// Define lead statuses for the dropdown
const LEAD_STATUSES = ['new', 'assigned', 'follow up', 'proposal', 'won', 'lost', 'closed_won', 'closed_lost', 'contacted', 'qualified', 'negotiation'];
const LEAD_SOURCES = ['website', 'referral', 'advertisement', 'cold call', 'other']; // Add more sources as needed

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
      // Adjust to access nested data structure if necessary (e.g., response.data.data)
      const lead = response.data?.data || response.data;

      if (!lead) {
        throw new Error("Lead data not found in response");
      }
      
      // Ensure itineraryPreferences exists and provide defaults
      const prefs = lead.itineraryPreferences || {};

      // Convert potentially numeric fields to strings for form inputs
      const budgetString = prefs.budget !== null && prefs.budget !== undefined ? String(prefs.budget) : '';
      const travelersString = prefs.numberOfTravelers !== null && prefs.numberOfTravelers !== undefined ? String(prefs.numberOfTravelers) : '';
      
      setFormData({
        firstName: lead.firstName || '',
        lastName: lead.lastName || '',
        email: lead.email || '',
        phone: lead.phone || '',
        status: lead.status || 'new',
        source: lead.source || 'website',
        notes: lead.notes || '', // Make sure notes are fetched if they exist on the lead object
        itineraryPreferences: {
          destination: prefs.destination || '',
          budget: budgetString,
          numberOfTravelers: travelersString,
          accommodationPreference: prefs.accommodationPreference || '',
          activities: prefs.activities || []
        }
      });
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error in fetchLead:", error); // Log the error for debugging
      toast.error(`Failed to fetch lead details: ${error.response?.data?.message || error.message}`);
      setIsLoading(false); // Stop loading even on error
      navigate('/leads');
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prevData => ({
        ...prevData,
        [parent]: {
          ...prevData[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        [name]: value
      }));
    }
  };

  const addActivity = () => {
    if (activity.trim()) {
      setFormData(prevData => ({
        ...prevData,
        itineraryPreferences: {
          ...prevData.itineraryPreferences,
          activities: [...prevData.itineraryPreferences.activities, activity.trim()]
        }
      }));
      setActivity('');
    }
  };

  const handleActivityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission on Enter
      addActivity();
    }
  };

  const removeActivity = (indexToRemove) => {
    setFormData(prevData => ({
      ...prevData,
      itineraryPreferences: {
        ...prevData.itineraryPreferences,
        activities: prevData.itineraryPreferences.activities.filter((_, index) => index !== indexToRemove)
      }
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Basic frontend validation (can be expanded)
      if (!formData.firstName || !formData.lastName || !formData.email) {
        toast.error('Please fill in First Name, Last Name, and Email.');
        setIsLoading(false);
        return;
      }

      // Convert budget and numberOfTravelers to numbers, handle empty strings
      const formatNumber = (value) => {
        const num = Number(value);
        return !isNaN(num) && value !== '' ? num : undefined;
      };
      
      const submitData = {
        ...formData,
        itineraryPreferences: {
          ...formData.itineraryPreferences,
          budget: formatNumber(formData.itineraryPreferences.budget),
          numberOfTravelers: formatNumber(formData.itineraryPreferences.numberOfTravelers)
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
      toast.error(error.response?.data?.message || 'An error occurred while saving the lead.');
      setIsLoading(false);
    }
  };

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#13804e]"></div>
      </div>
    );
  }

  // Helper function to render input fields
  const renderInput = (id, name, label, type = 'text', required = false, span = 3) => (
    <div className={`col-span-6 sm:col-span-${span}`}>
      <label htmlFor={id} className="block text-sm font-medium text-[#093923] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <input
        type={type}
        name={name}
        id={id}
        required={required}
        className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm rounded-lg transition-all ease duration-200 shadow-sm"
        value={name.includes('.') ? formData[name.split('.')[0]][name.split('.')[1]] : formData[name]}
                      onChange={onChange}
        step={type === 'number' ? 'any' : undefined} // Allow decimals for budget
                    />
                  </div>
  );

  // Helper function to render select fields
  const renderSelect = (id, name, label, options, required = false, span = 3) => (
    <div className={`col-span-6 sm:col-span-${span}`}>
      <label htmlFor={id} className="block text-sm font-medium text-[#093923] mb-1">
        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    <select
        id={id}
        name={name}
        required={required}
        className="block w-full pl-3 pr-10 py-2 border border-[#093923]/20 focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm rounded-lg transition-all ease duration-200 shadow-sm bg-white capitalize"
        value={name.includes('.') ? formData[name.split('.')[0]][name.split('.')[1]] : formData[name]}
                      onChange={onChange}
                    >
        {options.map(option => (
          <option key={option.value || option} value={option.value || option} className="capitalize">
            {option.label || option.replace('_', ' ')}
          </option>
        ))}
                    </select>
                  </div>
  );
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#093923]">{isEditMode ? 'Edit Lead' : 'Add New Lead'}</h1>
          <p className="mt-1 text-sm text-[#13804e]">
            {isEditMode
              ? 'Update lead information and preferences.'
              : 'Create a new lead with contact information and travel preferences.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/leads')}
          className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
        >
          <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-[#093923]/80" aria-hidden="true" />
          Back to Leads
        </button>
                  </div>

      <form onSubmit={onSubmit} className="space-y-8">
        {/* Contact Information Section */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3">Contact Information</h3>
          <div className="grid grid-cols-6 gap-x-6 gap-y-4">
            {renderInput('firstName', 'firstName', 'First Name', 'text', true, 3)}
            {renderInput('lastName', 'lastName', 'Last Name', 'text', true, 3)}
            {renderInput('email', 'email', 'Email Address', 'email', true, 3)}
            {renderInput('phone', 'phone', 'Phone Number', 'tel', false, 3)}
            {renderSelect('status', 'status', 'Status', LEAD_STATUSES, true, 3)}
            {renderSelect('source', 'source', 'Source', LEAD_SOURCES, false, 3)}
                  </div>
                  </div>

        {/* Itinerary Preferences Section */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
          <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3">Itinerary Preferences</h3>
          <div className="grid grid-cols-6 gap-x-6 gap-y-4">
            {renderInput('itineraryPreferences.destination', 'itineraryPreferences.destination', 'Destination', 'text', false, 6)}
            {renderInput('itineraryPreferences.budget', 'itineraryPreferences.budget', 'Budget (Approx)', 'number', false, 3)}
            {renderInput('itineraryPreferences.numberOfTravelers', 'itineraryPreferences.numberOfTravelers', 'Number of Travelers', 'number', false, 3)}
            {renderSelect('itineraryPreferences.accommodationPreference', 'itineraryPreferences.accommodationPreference', 'Accommodation', ['Hotel', 'Resort', 'Villa', 'Apartment', 'Guesthouse', 'Any'], false, 6)}

            {/* Activities Input */}
                  <div className="col-span-6">
              <label htmlFor="activity" className="block text-sm font-medium text-[#093923] mb-1">
                Desired Activities
                    </label>
              <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        id="activity"
                  className="flex-grow px-3 py-2 border border-[#093923]/20 focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm rounded-lg transition-all ease duration-200 shadow-sm"
                  placeholder="e.g., Snorkeling, City Tour"
                        value={activity}
                        onChange={(e) => setActivity(e.target.value)}
                  onKeyDown={handleActivityKeyDown}
                      />
                      <button
                        type="button"
                        onClick={addActivity}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
                      >
                        Add
                      </button>
                    </div>
              {/* Display Added Activities */}
              <div className="mt-3 space-x-2 space-y-2">
                          {formData.itineraryPreferences.activities.map((act, index) => (
                  <span key={index} className="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-sm font-medium bg-[#093923]/10 text-[#093923]">
                    {act}
                              <button
                                type="button"
                                onClick={() => removeActivity(index)}
                      className="flex-shrink-0 ml-1.5 p-0.5 text-[#093923]/60 hover:bg-[#093923]/20 hover:text-[#093923] rounded-full focus:outline-none focus:ring-1 focus:ring-[#093923]"
                              >
                      <span className="sr-only">Remove activity</span>
                      <TrashIcon className="h-4 w-4" />
                              </button>
                  </span>
                          ))}
                      </div>
                  </div>
                </div>
              </div>
        
        {/* Notes Section */}
        <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
            <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-4">Notes</h3>
             <textarea
                id="notes"
                name="notes"
                rows={4}
                className="block w-full px-3 py-2 border border-[#093923]/20 focus:ring-[#13804e]/50 focus:border-[#13804e]/50 sm:text-sm rounded-lg transition-all ease duration-200 shadow-sm"
                placeholder="Add any relevant notes about this lead..."
                value={formData.notes}
                onChange={onChange}
             />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-5">
                <button
                  type="button"
                  onClick={() => navigate('/leads')}
            className="px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
            className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading ? 'bg-[#093923]/50 cursor-not-allowed' : 'bg-[#093923] hover:bg-[#022316]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200`}
                >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (isEditMode ? 'Update Lead' : 'Create Lead')}
                </button>
        </div>
      </form>
    </div>
  );
};

export default LeadForm;