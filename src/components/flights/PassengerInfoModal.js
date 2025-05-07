import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const PassengerInfoModal = ({ isOpen, onClose, itineraryDetails, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('adult');
  const [passengers, setPassengers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({});

  // Add paxType mapping
  const PAX_TYPE_MAP = {
    adult: 1,
    child: 2,
    infant: 3
  };

  useEffect(() => {
    if (itineraryDetails) {
      const totalPassengers = 
        itineraryDetails.adultCount + 
        itineraryDetails.childCount + 
        itineraryDetails.infantCount;
      
      const newPassengers = Array(totalPassengers).fill(null).map((_, index) => ({
        id: index + 1,
        type: index < itineraryDetails.adultCount ? 'adult' :
              index < itineraryDetails.adultCount + itineraryDetails.childCount ? 'child' : 'infant',
        isLeadPax: index === 0
      }));

      setPassengers(newPassengers);
      
      // Initialize formData with numeric paxType
      setFormData(newPassengers.reduce((acc, pax) => {
        acc[pax.id] = {
          paxType: PAX_TYPE_MAP[pax.type]
        };
        return acc;
      }, {}));
    }
  }, [itineraryDetails]);

  const handleInputChange = (passengerId, field, value) => {
    setFormData(prev => ({
      ...prev,
      [passengerId]: {
        ...prev[passengerId],
        [field]: value
      }
    }));
  };

  const getPaxRules = (passenger) => {
    // Get the correct rules based on whether THIS passenger is the lead adult
    const rulesSource = passenger.type === 'adult' && passenger.isLeadPax
      ? itineraryDetails?.paxRules?.leadPax
      : itineraryDetails?.paxRules?.[passenger.type]; // Use the specific passenger's type for rules

    if (!rulesSource) return {};

    // Map the API rules to our format
    return Object.keys(rulesSource).reduce((acc, field) => {
      acc[field] = {
        required: rulesSource[field].isMandatoryIfVisible,
        visible: rulesSource[field].isVisible
      };
      return acc;
    }, {});
  };

  const renderPassengerForm = (passenger) => {
    const rules = getPaxRules(passenger);
    const passengerData = formData[passenger.id] || {};

    // Group fields by category
    const fieldGroups = {
      personalInfo: ['title', 'firstName', 'lastName', 'dateOfBirth', 'nationality'],
      passportInfo: ['passportNumber', 'passportExpiry', 'passportIssueDate'],
      contactInfo: ['email', 'contactNumber', 'cellCountryCode'],
      gstInfo: ['gstNumber', 'gstCompanyName', 'gstCompanyAddress', 'gstCompanyEmail', 'gstCompanyContactNumber']
    };

    const renderField = (field, rule) => {
      // Special handling for passportIssueDate - use the isPassportIssueDateRequired rule
      if (field === 'passportIssueDate') {
        const issueRule = rules['isPassportIssueDateRequired'];
        if (!issueRule?.visible) return null;
        rule = issueRule;
      }

      if (!rule?.visible) return null;

      const fieldName = field === 'passportIssueDate' ? 'passportIssueDate' : field;

      return (
        <div key={field} className="w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field === 'passportIssueDate' ? 'Passport Issue Date' : 
              field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            {rule.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field === 'title' ? (
            <select
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
            >
              <option value="">Select Title</option>
              <option value="Mr">Mr</option>
              <option value="Mrs">Mrs</option>
              <option value="Ms">Ms</option>
              <option value="Dr">Dr</option>
            </select>
          ) : field === 'dateOfBirth' || field === 'passportExpiry' || field === 'passportIssueDate' ? (
            <input
              type="date"
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
              max={field === 'dateOfBirth' || field === 'passportIssueDate' 
                ? new Date().toISOString().split('T')[0] 
                : undefined}
              min={field === 'passportExpiry' 
                ? new Date().toISOString().split('T')[0] 
                : undefined}
            />
          ) : field === 'contactNumber' || field === 'cellCountryCode' || field === 'gstCompanyContactNumber' ? (
            <input
              type="tel"
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
              placeholder={field === 'cellCountryCode' ? '+91' : 'Enter number'}
            />
          ) : field === 'email' || field === 'gstCompanyEmail' ? (
            <input
              type="email"
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
              placeholder="Enter email"
            />
          ) : field === 'gstCompanyAddress' ? (
            <textarea
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
              rows={3}
              placeholder="Enter company address"
            />
          ) : (
            <input
              type="text"
              value={passengerData[fieldName] || ''}
              onChange={(e) => handleInputChange(passenger.id, fieldName, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              required={rule.required}
              placeholder={`Enter ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
            />
          )}
        </div>
      );
    };

    return (
      <div key={passenger.id} className="border rounded-lg p-6 mb-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {passenger.type.charAt(0).toUpperCase() + passenger.type.slice(1)} Passenger {passenger.id}
            {passenger.isLeadPax && <span className="ml-2 text-blue-600 text-sm font-medium">(Lead Passenger)</span>}
          </h3>
        </div>

        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Personal Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fieldGroups.personalInfo.map(field => renderField(field, rules[field]))}
            </div>
          </div>

          {/* Passport Information - Only show if there are visible passport fields */}
          {fieldGroups.passportInfo.some(field => rules[field]?.visible) && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Passport Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldGroups.passportInfo.map(field => renderField(field, rules[field]))}
              </div>
            </div>
          )}

          {/* Contact Information - Only for lead passenger */}
          {passenger.isLeadPax && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldGroups.contactInfo.map(field => renderField(field, rules[field]))}
              </div>
            </div>
          )}

          {/* GST Information - Only for lead passenger */}
          {passenger.isLeadPax && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-4">GST Information (Optional)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fieldGroups.gstInfo.map(field => renderField(field, rules[field]))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const onSubmit = async () => {
    let isValid = true;
    const validationErrors = [];

    // Clear previous errors visually if needed (or rely on toast)

    // --- Validation Logic --- 
    passengers.forEach(passenger => {
      const rules = getPaxRules(passenger);
      const passengerData = formData[passenger.id] || {};

      Object.entries(rules).forEach(([field, rule]) => {
        // Special handling for passport issue date
        if (field === 'isPassportIssueDateRequired' && rule.visible && rule.required) {
          if (!passengerData.passportIssueDate) {
            validationErrors.push(`Passport Issue Date is required for ${passenger.type} passenger ${passenger.id}`);
            isValid = false;
          }
          return; // Skip regular check for this pseudo-field
        }

        // Skip the validation check for the pseudo-field itself
        if (field === 'isPassportIssueDateRequired') return;

        if (rule.required && rule.visible && !passengerData[field]) {
          const fieldLabel = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
          validationErrors.push(`${fieldLabel} is required for ${passenger.type} passenger ${passenger.id}`);
          isValid = false;
        }
      });
    });

    if (!isValid) {
      validationErrors.forEach(error => toast.error(error));
      return; // Stop submission if validation fails
    }

    // --- If valid, call onSuccess with the collected formData --- 
    try {
      setIsLoading(true);
      // Pass the validated formData back to the parent (FlightItineraryModal)
      onSuccess(formData);
      // No need to call API here anymore
      onClose(); // Close the modal after successful callback
    } catch (error) {
       // This catch block might be less relevant now, 
       // but keep for potential errors during the onSuccess callback itself.
      console.error("Error during passenger form submission callback:", error);
      toast.error("An error occurred while processing passenger details.");
    } finally {
      setIsLoading(false);
    }

    /* 
    // --- REMOVED API CALLS FROM HERE --- 
    try {
      setIsLoading(true);
// ... existing code ...
      } else {
        throw new Error(allocateResponse.message || 'Failed to allocate passengers');
      }
    } catch (error) {
      console.error('Error in passenger allocation process:', error);
      toast.error(error.message || 'Failed to process passenger information');
    } finally {
      setIsLoading(false);
    } 
    */
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 my-6">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Passenger Information</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="space-y-6">
            {passengers.map(passenger => renderPassengerForm(passenger))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PassengerInfoModal; 