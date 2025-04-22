// src/components/leads/LeadDetail.js
import {
  ArrowUturnLeftIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MapPinIcon,
  PencilSquareIcon,
  SparklesIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import leadService from '../../services/leadService';

// Helper functions for badges (copied from LeadList/WebsiteLeadList for consistency)
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

const getPaymentStatusBadgeClass = (status) => {
  switch (status) {
    case 'completed': return 'bg-[#13804e]/10 text-[#13804e]';
    case 'pending': return 'bg-[#d97706]/10 text-[#d97706]';
    case 'processing': return 'bg-[#2563eb]/10 text-[#2563eb]';
    case 'failed': return 'bg-[#dc2626]/10 text-[#dc2626]';
    default: return 'bg-gray-100 text-gray-800';
  }
};

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

// Helper component for Definition List items
const DetailItem = ({ term, description, icon: Icon, termCols = 1, descCols = 2, children }) => (
  <div className={`px-4 py-4 sm:px-6 grid grid-cols-1 sm:grid-cols-${termCols + descCols} gap-1 sm:gap-4 items-start border-t border-[#093923]/5 first:border-t-0`}>
    <dt className={`text-sm font-medium text-[#093923] flex items-center sm:col-span-${termCols}`}>
      {Icon && <Icon className="h-5 w-5 mr-2 text-[#13804e]/60" aria-hidden="true" />}
      {term}
    </dt>
    <dd className={`mt-1 text-sm text-[#13804e] sm:mt-0 sm:col-span-${descCols}`}>
      {children || description || <span className="text-[#093923]/50">N/A</span>}
    </dd>
  </div>
);

const LeadDetail = () => {
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedInquiry, setExpandedInquiry] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext); // Keep user for permissions

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setIsLoading(true);
      // Assuming the API returns nested data under a key like 'data' or similar
      const response = await leadService.getLeadById(id);
      // Adjust based on actual API response structure
      const leadData = response.data?.data || response.data || null; 
      if (!leadData) {
        throw new Error('Lead data not found in response');
      }
      setLead(leadData);
    } catch (error) {
      console.error('Failed to fetch lead details:', error);
      toast.error(`Failed to fetch lead details: ${error.response?.data?.message || error.message}`);
      setLead(null);
      // Optionally navigate back or show a clearer error message
      // navigate('/leads'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLead = async () => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        await leadService.deleteLead(id);
        toast.success('Lead deleted successfully');
        navigate('/leads');
      } catch (error) {
        toast.error(`Failed to delete lead: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
    const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return null;
      }
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
        month: 'short',
        day: 'numeric',
        // Optional: include time if needed
        // hour: '2-digit',
        // minute: '2-digit'
      });
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return null; // Return null or a placeholder if formatting fails
    }
  };

  const formatCurrency = (value) => {
      if (value === null || value === undefined || value === '') return null;
      
      // If value is a string that's not a number, return it as is
      if (typeof value === 'string' && isNaN(Number(value))) {
        return value;
      }
      
      // If value is a number or numeric string, format it as currency
      const number = Number(value);
      if (!isNaN(number)) {
        return number.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
      }
      
      return null;
  }

  const toggleItinerary = (inquiryToken) => {
    setExpandedInquiry(expandedInquiry === inquiryToken ? null : inquiryToken);
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#13804e]"></div>
      </div>
    );
  }

  // Not Found State
  if (!lead) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-[#dc2626]/80" />
        <h2 className="mt-4 text-2xl font-bold text-[#093923]">Lead Not Found</h2>
        <p className="mt-2 text-sm text-[#13804e]">
          The lead you are looking for might have been deleted, or you may not have permission to view it.
        </p>
        <button
          type="button"
          onClick={() => navigate('/leads')}
          className="mt-6 inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
        >
          <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-[#093923]/80" aria-hidden="true" />
          Back to Leads
        </button>
      </div>
    );
  }

  const canEdit = user?.permissions?.canAddLead; // Assuming edit uses add permission
  const canDelete = user?.permissions?.canRemoveLead;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
          <h1 className="text-3xl font-bold text-[#093923] break-words">
          {lead.firstName} {lead.lastName}
          </h1>
          <p className="mt-1 text-sm text-[#13804e]">Lead Details</p>
        </div>
        <div className="flex space-x-3 flex-shrink-0">
          {canEdit && (
            <Link
              to={`/leads/edit/${id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#13804e]/50 transition-all ease duration-200"
            >
              <PencilSquareIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              Edit
            </Link>
          )}
          {canDelete && (
            <button
              onClick={handleDeleteLead}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#dc2626] hover:bg-[#b91c1c] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#dc2626]/50 transition-all ease duration-200"
            >
              <TrashIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
              Delete
            </button>
          )}
           <button
              type="button"
              onClick={() => navigate('/leads')}
              className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
            >
             <ArrowUturnLeftIcon className="-ml-0.5 mr-2 h-5 w-5" aria-hidden="true" />
             Back
           </button>
        </div>
      </div>

      {/* Lead Information Card */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#093923]/10">
        <div className="px-4 py-5 sm:px-6 bg-[#093923]/5 border-b border-[#093923]/10">
          <h3 className="text-lg leading-6 font-semibold text-[#093923] flex items-center">
              <UserCircleIcon className="h-6 w-6 mr-2 text-[#13804e]" />
              Contact & Status
          </h3>
        </div>
        <dl className="divide-y divide-[#093923]/5">
          <DetailItem term="Full Name" description={`${lead.firstName} ${lead.lastName}`} />
          <DetailItem term="Email" description={lead.email} />
          <DetailItem term="Phone" description={lead.phone} />
          <DetailItem term="Status">
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusBadgeClass(lead.status)}`}>
              {lead.status?.replace('_', ' ') || 'N/A'}
            </span>
          </DetailItem>
          <DetailItem term="Source" description={lead.source?.replace('_', ' ')} />
          <DetailItem term="Created" description={formatDate(lead.createdAt)} icon={ClockIcon} />
          <DetailItem term="Last Updated" description={formatDate(lead.updatedAt)} icon={ClockIcon} />
          <DetailItem term="Notes" description={lead.notes} termCols={1} descCols={5} /> 
        </dl>
            </div>

      {/* Itinerary Preferences Card */}
      {lead.itineraryPreferences && Object.values(lead.itineraryPreferences).some(val => val !== '' && (!Array.isArray(val) || val.length > 0)) && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#093923]/10">
          <div className="px-4 py-5 sm:px-6 bg-[#093923]/5 border-b border-[#093923]/10">
            <h3 className="text-lg leading-6 font-semibold text-[#093923] flex items-center">
                <BriefcaseIcon className="h-6 w-6 mr-2 text-[#13804e]" />
                Itinerary Preferences
            </h3>
            </div>
          <dl className="divide-y divide-[#093923]/5">
            <DetailItem term="Destination" description={lead.itineraryPreferences.destination} icon={MapPinIcon}/>
            <DetailItem term="Budget" description={formatCurrency(lead.itineraryPreferences.budget)} icon={CurrencyDollarIcon} />
            <DetailItem term="Travelers" description={lead.itineraryPreferences.numberOfTravelers} icon={UsersIcon} />
            <DetailItem term="Accommodation" description={lead.itineraryPreferences.accommodationPreference} />
            <DetailItem term="Activities" icon={SparklesIcon}>
              {lead.itineraryPreferences.activities?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {lead.itineraryPreferences.activities.map((activity, index) => (
                    <span key={index} className="px-2.5 py-0.5 text-xs rounded-full bg-[#093923]/10 text-[#093923]">
                      {activity}
                </span>
                  ))}
            </div>
              ) : <span className="text-[#093923]/50">N/A</span>}
            </DetailItem>
          </dl>
        </div>
      )}

      {/* Inquiries Section */}
      {lead.inquiries && lead.inquiries.length > 0 && (
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-[#093923]/10">
          <div className="px-4 py-5 sm:px-6 bg-[#093923]/5 border-b border-[#093923]/10">
            <h3 className="text-lg leading-6 font-semibold text-[#093923] flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2 text-[#13804e]" />
              Submitted Inquiries ({lead.inquiries.length})
            </h3>
          </div>
          <div className="divide-y divide-[#093923]/10">
            {lead.inquiries.map((inquiry, index) => {
              const associatedItinerary = lead.itineraries?.find(
                (itin) => itin.inquiryToken === inquiry.inquiryToken
              );
              const isExpanded = expandedInquiry === inquiry.inquiryToken;

              return (
                <div key={inquiry.inquiryToken || index}>
                  <div className="px-4 py-4 sm:px-6 hover:bg-[#093923]/5 cursor-pointer transition-colors ease duration-200" onClick={() => toggleItinerary(inquiry.inquiryToken)}>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-semibold text-[#093923]">
                          Inquiry #{index + 1}: <span className="font-mono text-xs text-[#13804e]">{inquiry.inquiryToken}</span>
                        </p>
                        <p className="text-xs text-[#13804e]/80 mt-1">
                          Submitted: {formatDate(inquiry.createdAt) || 'Unknown Date'}
                          {inquiry.agentName && ` | Assigned: ${inquiry.agentName}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                         {associatedItinerary && (
                            <Link 
                              to={`/bookings/itinerary`} 
                              state={{ itineraryToken: associatedItinerary.itineraryToken, inquiryToken: inquiry.inquiryToken }}
                              onClick={(e) => e.stopPropagation()} // Prevent inquiry toggle when clicking link
                              className="text-xs inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-white bg-[#13804e] hover:bg-[#0d5c3a] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#13804e]/50 transition-all ease duration-200"
                            >
                               View Itinerary
                            </Link>
                         )} 
                        <button 
                          className="p-1 text-[#093923]/60 hover:text-[#093923]"
                        >
                          {isExpanded ? (
                            <ChevronUpIcon className="h-5 w-5" aria-hidden="true" />
                          ) : (
                            <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
        </div>
      </div>

                  {/* Collapsible Details */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="px-4 py-4 sm:px-6 bg-white border-t border-[#093923]/5">
                      <h4 className="text-sm font-semibold text-[#093923] mb-3">Inquiry Details</h4>
                      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Destinations:</dt> <dd className="text-[#13804e]">{inquiry.destinations || 'N/A'}</dd></div>
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Dates:</dt> <dd className="text-[#13804e]">{formatDate(inquiry.startDate)} - {formatDate(inquiry.endDate)}</dd></div>
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Travelers:</dt> <dd className="text-[#13804e]">{inquiry.travelers} ({inquiry.adults} Adults, {inquiry.children} Children)</dd></div>
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Rooms:</dt> <dd className="text-[#13804e]">{Array.isArray(inquiry.rooms) ? inquiry.rooms.length : (inquiry.rooms || 'N/A')}</dd></div>
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Budget:</dt> <dd className="text-[#13804e]">{formatCurrency(inquiry.budget) || 'N/A'}</dd></div>
                        <div className="flex"><dt className="font-medium text-[#093923] w-24 flex-shrink-0">Interests:</dt> <dd className="text-[#13804e]">{inquiry.interests || 'N/A'}</dd></div>
                      </dl>
        </div>
                    {associatedItinerary && (
                      <div className="px-4 pt-2 pb-4 sm:px-6 bg-white border-t border-dashed border-[#093923]/10">
                        <h4 className="text-sm font-semibold text-[#093923] mt-3 mb-3">Associated Itinerary <span className="font-mono text-xs text-[#13804e]">({associatedItinerary.itineraryToken})</span></h4>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                            {associatedItinerary.bookingStatus && (
                              <div className="flex items-center">
                                <dt className="font-medium text-[#093923] w-32 flex-shrink-0">Booking Status:</dt> 
                                <dd>
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getBookingStatusBadgeClass(associatedItinerary.bookingStatus)}`}>
                                    {associatedItinerary.bookingStatus?.replace('_', ' ') || 'N/A'}
                                    </span>
              </dd>
            </div>
                            )}
                            {associatedItinerary.paymentStatus && (
                              <div className="flex items-center">
                                <dt className="font-medium text-[#093923] w-32 flex-shrink-0">Payment Status:</dt> 
                                <dd>
                                    <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getPaymentStatusBadgeClass(associatedItinerary.paymentStatus)}`}>
                                    {associatedItinerary.paymentStatus || 'N/A'}
                                    </span>
              </dd>
            </div>
                            )}
                            {associatedItinerary.bookingId && (
                              <div className="flex">
                                <dt className="font-medium text-[#093923] w-32 flex-shrink-0">Booking ID:</dt> 
                                <dd className="text-[#13804e] font-mono text-xs">{associatedItinerary.bookingId}</dd>
                              </div>
                            )}
                            {associatedItinerary.paymentId && (
                              <div className="flex">
                                <dt className="font-medium text-[#093923] w-32 flex-shrink-0">Payment ID:</dt> 
                                <dd className="text-[#13804e] font-mono text-xs">{associatedItinerary.paymentId}</dd>
                              </div>
                            )}
                            <div className="flex">
                              <dt className="font-medium text-[#093923] w-32 flex-shrink-0">Itinerary Created:</dt> 
                              <dd className="text-[#13804e]">{formatDate(associatedItinerary.createdAt)}</dd>
                            </div>
                        </dl>
            </div>
                    )}
            </div>
                        </div>
              );
            })}
            </div>
        </div>
      )}

       {/* Fallback if no inquiries */}
       {(!lead.inquiries || lead.inquiries.length === 0) && (
         <div className="bg-white shadow-lg rounded-xl border border-[#093923]/10 p-6 text-center">
            <InformationCircleIcon className="mx-auto h-10 w-10 text-[#093923]/30" />
            <h3 className="mt-2 text-sm font-medium text-[#093923]">No Inquiries Found</h3>
            <p className="mt-1 text-sm text-[#13804e]">
              This lead hasn't submitted any inquiries yet.
            </p>
      </div>
       )}

    </div>
  );
};

export default LeadDetail;
