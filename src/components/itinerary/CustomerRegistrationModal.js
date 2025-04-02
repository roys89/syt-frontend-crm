import { Dialog, Transition } from '@headlessui/react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Import axios
import React, { Fragment, useEffect, useState } from 'react';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'; // Using a specific input for better phone handling
import 'react-phone-number-input/style.css'; // Base styles
import { toast } from 'react-toastify';
import config from '../../config'; // Import config
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get authAxios

// --- Reusable Input Styling --- 
const inputBaseStyle = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50";
const inputErrorStyle = "border-red-500 focus:ring-red-500 focus:border-red-500";
const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const errorTextStyle = "mt-1 text-sm text-red-600";

const CustomerRegistrationModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  const initialFormData = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '', // Phone number will include country code (e.g., +1...)
    country: '', // Re-added country name
    dob: '', // Date of Birth
    referralCode: '', // Optional referral code
  };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState([]); // Re-added for dropdown
  const [selectedCountryCode, setSelectedCountryCode] = useState(undefined); // Store the 2-letter code (e.g., US, GB) for PhoneInput
  const { authAxios } = useAuth(); // Get authAxios instance from context

  useEffect(() => {
    // Reset form when modal opens
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setIsLoading(false);
      setSelectedCountryCode(undefined); // Reset selected country code
    }
  }, [isOpen]);

  // Re-added: Fetch countries for the dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoading(true); // Indicate loading while fetching countries
      try {
        const response = await axios.get(`${config.API_B2C_URL}/countries`); 
        if (response.data && Array.isArray(response.data)) {
          // Expecting data like [{ name: 'United States', code: 'US', dial_code: '+1' }, ...]
          setCountries(response.data); 
        } else {
          console.error('Unexpected country data format:', response.data);
          toast.error('Failed to load country list. Check B2C backend format.');
          setCountries([]);
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
        toast.error('Failed to load country data. Please check B2C backend connection.');
        setCountries([]);
      } finally {
        // If modal is still loading from main submit, don't reset loading state here
         if (!isLoading) setIsLoading(false); 
      }
    };
    fetchCountries();
  }, []); // Fetch once on mount

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!isPossiblePhoneNumber(formData.phoneNumber)) {
      // isPossiblePhoneNumber checks if the number structure is valid for its detected country
      newErrors.phoneNumber = 'Invalid or incomplete phone number';
    }
    if (!formData.country) newErrors.country = 'Country is required'; // Re-add country validation
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }

    // --- Linking Logic --- 
    // If the country dropdown changed, find its 2-letter code and update state
    // This state will be used as the `key` for PhoneInput to force re-render
    if (name === 'country') {
      const selectedCountryData = countries.find(c => c.name === value);
      if (selectedCountryData && selectedCountryData.code) { 
        setSelectedCountryCode(selectedCountryData.code); // e.g., 'US', 'GB'
        // Optionally clear the phone number if the country changes significantly? 
        // setFormData(prev => ({ ...prev, phoneNumber: '' })); 
      } else {
        setSelectedCountryCode(undefined); // Reset if country not found or has no code
      }
    }
  };

  const handlePhoneChange = (value) => {
    // value will be the full E.164 number like +1XXXXXXXXXX or undefined
    setFormData(prev => ({ ...prev, phoneNumber: value || '' }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
    // When phone number changes, we might lose the link to the dropdown.
    // We could try to find the country code from the number here and update
    // selectedCountryCode if needed, but it adds complexity. Let's keep it simple first.
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // --- Correct Relative API Path --- 
      // Base URL is provided by authAxios (http://localhost:5000/api/crm)
      // This is the specific endpoint defined in crm/routes/userRoutes.js
      const apiUrl = '/users/register-customer'; 
      
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber || undefined, 
        country: formData.country || undefined, 
        dob: formData.dob || undefined,
        referralCode: formData.referralCode?.trim() || undefined,
      };

      console.log('Attempting CRM-based customer registration with payload:', payload, 'to relative URL:', apiUrl);
      
      // Use authAxios (base URL + relative apiUrl)
      const response = await authAxios.post(apiUrl, payload); 
      
      console.log('CRM Registration API Response:', response.data);

      // Assuming CRM endpoint returns { success: true, user: {...} } on success
      if (response.data && response.data.success === true && response.data.user) { 
        toast.success(response.data.message || 'Customer registered successfully!');
        const newUser = response.data.user; // Get user from CRM response
        
        if (newUser && newUser._id) {
          onRegisterSuccess(newUser);
          onClose();
        } else {
          // Should ideally not happen if success is true, but handle defensively
          console.error("Registration successful according to API, but user data missing in response:", response.data);
          toast.warn("Registration successful, but couldn't retrieve complete user data. Please search for the customer.");
          onClose();
        }
      } else {
        // Handle cases where API indicates success: false or lacks user data
        throw new Error(response.data?.message || 'Registration failed via CRM endpoint.');
      }
    } catch (error) {
      console.error('CRM Registration failed:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'An unknown error occurred during registration.';
      setErrors(prev => ({ ...prev, form: errorMessage }));
      toast.error(`Registration failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={isLoading ? () => {} : onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        </Transition.Child>

        {/* Modal Content Container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 sm:p-8 text-left align-middle shadow-xl transition-all">
                {/* Modal Header */}
                <Dialog.Title
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center mb-6"
                >
                  Register New Customer
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none disabled:opacity-50 rounded-full p-1 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    aria-label="Close"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* General Form Error Display */}
                  {errors.form && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          {/* Optional: Add an error icon here */}
                          <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Registration Error</h3>
                          <div className="mt-1 text-sm text-red-700">
                            <p>{errors.form}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Grid for Name Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label htmlFor="firstName" className={labelStyle}>First Name</label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className={`${inputBaseStyle} ${errors.firstName ? inputErrorStyle : ''}`}
                      />
                      {errors.firstName && <p className={errorTextStyle}>{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelStyle}>Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className={`${inputBaseStyle} ${errors.lastName ? inputErrorStyle : ''}`}
                      />
                      {errors.lastName && <p className={errorTextStyle}>{errors.lastName}</p>}
                    </div>
                  </div>
                  
                  {/* Email Field */}
                  <div>
                    <label htmlFor="email" className={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={`${inputBaseStyle} ${errors.email ? inputErrorStyle : ''}`}
                    />
                    {errors.email && <p className={errorTextStyle}>{errors.email}</p>}
                  </div>

                  {/* RE-ADDED Country Dropdown */} 
                  <div>
                    <label htmlFor="country" className={labelStyle}>Country</label>
                    <select
                      id="country" name="country"
                      value={formData.country} 
                      onChange={handleChange} 
                      required
                      className={`${inputBaseStyle} ${errors.country ? inputErrorStyle : ''}`}
                    >
                      <option value="" disabled>Select Country</option>
                      {countries.length === 0 && !isLoading && (
                           <option value="" disabled>Could not load countries</option>
                      )}
                      {countries.length > 0 && countries.map((country) => (
                        // Use name for value, but ensure key is unique (code or name)
                        <option key={country.code || country.name} value={country.name}>
                          {country.name} {country.dial_code ? `(${country.dial_code})` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.country && <p className={errorTextStyle}>{errors.country}</p>}
                  </div> 
                                   
                  {/* Phone Number Field (Handles Country Selection) */}
                  <div>
                    <label htmlFor="phoneNumber" className={labelStyle}>Phone Number</label>
                    <PhoneInput
                      id="phoneNumber" placeholder="Enter phone number"
                      value={formData.phoneNumber} onChange={handlePhoneChange} 
                      international
                      countryCallingCodeEditable={false} 
                      // Use the 2-letter country code from state to control the default country
                      // The key prop forces re-mount when the code changes
                      key={selectedCountryCode || 'default'} 
                      defaultCountry={selectedCountryCode} 
                      className={`phone-input-wrapper ${errors.phoneNumber ? 'phone-input-error' : ''}`}
                    />
                    {errors.phoneNumber && <p className={errorTextStyle}>{errors.phoneNumber}</p>}
                    {/* Custom styles */}
                    <style jsx global>{`
                        .phone-input-wrapper .PhoneInputInput {
                             display: block;
                             width: 100%;
                             padding: 0.5rem 0.75rem; /* py-2 px-3 */
                             font-size: 0.875rem; /* sm:text-sm */
                             border: 1px solid #d1d5db; /* border-gray-300 */
                             border-radius: 0.375rem; /* rounded-md */
                             box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
                             background-color: #f9fafb; /* bg-gray-50 */
                         }
                         .phone-input-wrapper .PhoneInputInput:focus {
                             outline: none;
                             border-color: #4f46e5; /* focus:border-indigo-500 */
                             box-shadow: 0 0 0 2px #a5b4fc; /* focus:ring-2 focus:ring-indigo-500 (approximated) */
                         }
                         .phone-input-wrapper.phone-input-error .PhoneInputCountry, 
                         .phone-input-wrapper.phone-input-error .PhoneInputInput {
                             border-color: #ef4444; /* border-red-500 */
                         }
                          .phone-input-wrapper.phone-input-error .PhoneInputInput:focus {
                             border-color: #dc2626; /* focus:border-red-500 */
                             box-shadow: 0 0 0 2px #fca5a5; /* focus:ring-2 focus:ring-red-500 (approximated) */
                         } 
                         .phone-input-wrapper .PhoneInputCountrySelect {
                              margin-right: 0.5rem; 
                              border-radius: 0.375rem; 
                         }
                         .phone-input-wrapper .PhoneInputCountryIcon {
                              box-shadow: none; 
                         }
                     `}</style>
                  </div>

                  {/* Grid for DOB and Referral Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    <div>
                      <label htmlFor="dob" className={labelStyle}>Date of Birth</label>
                      <input
                        type="date"
                        name="dob"
                        id="dob"
                        value={formData.dob}
                        onChange={handleChange}
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className={`${inputBaseStyle} ${errors.dob ? inputErrorStyle : ''}`}
                      />
                      {errors.dob && <p className={errorTextStyle}>{errors.dob}</p>}
                    </div>
                    <div>
                      <label htmlFor="referralCode" className={labelStyle}>Referral Code (Optional)</label>
                      <input
                        type="text"
                        name="referralCode"
                        id="referralCode"
                        value={formData.referralCode}
                        onChange={handleChange}
                        className={`${inputBaseStyle}`}
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {isLoading ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Registering...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
                          Register Customer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CustomerRegistrationModal;
