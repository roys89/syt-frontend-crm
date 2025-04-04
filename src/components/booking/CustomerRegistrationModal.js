import { Dialog, Transition } from '@headlessui/react';
import { UserPlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios'; // Import axios
import { parsePhoneNumberFromString } from 'libphonenumber-js/min'; // CORRECT IMPORT for parser
import React, { forwardRef, Fragment, useEffect, useMemo, useState } from 'react';
import PhoneInput, { isPossiblePhoneNumber } from 'react-phone-number-input'; // Use the default component with flags
import 'react-phone-number-input/style.css'; // Base styles should include flags
import { toast } from 'react-toastify';
import config from '../../config'; // Import config
import { useAuth } from '../../context/AuthContext'; // Import useAuth to get authAxios

// --- Reusable Input Styling --- 
const inputBaseStyle = "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50";
const inputErrorStyle = "border-red-500 focus:ring-red-500 focus:border-red-500";
const labelStyle = "block text-sm font-medium text-gray-700 mb-1";
const errorTextStyle = "mt-1 text-sm text-red-600";

// Custom Input component for PhoneInput to apply Tailwind styles
const CustomPhoneInput = forwardRef((props, ref) => {
  const { hasError, ...rest } = props;
  return (
    <input 
      {...rest} 
      ref={ref} 
      className={`${inputBaseStyle} ${hasError ? inputErrorStyle : ''}`} 
    />
  );
});

const CustomerRegistrationModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  // Simplified initial form data (removed country)
  const initialFormData = useMemo(() => ({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '', // Will store E.164 format from input
    dob: '',
    referralCode: '',
  }), []);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [countries, setCountries] = useState([]); // RESTORE: Store fetched country list {name, code, dial_code}
  const [selectedCountryCode, setSelectedCountryCode] = useState(undefined); // RENAMED: 2-letter code (e.g., US, IN)
  const [selectedCountryName, setSelectedCountryName] = useState(''); // ADDED: Full country name
  const { authAxios } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData); // Reset form
      setErrors({});
      setIsLoading(false);
      setSelectedCountryCode(undefined); // Reset 2-letter code
      setSelectedCountryName(''); // Reset full name
    }
  }, [isOpen, initialFormData]);

  // RESTORE: useEffect to fetch countries
  useEffect(() => {
    let isMounted = true;
    const fetchCountries = async () => {
      try {
        // Use B2C URL from config
        const response = await axios.get(`${config.API_B2C_URL}/countries`); 
        console.log("(Restored Fetch) Fetched Countries Raw Response:", response.data);
        if (isMounted && response.data && Array.isArray(response.data)) {
          const validCountries = response.data
             .filter(c => c.code && c.countryCode && c.name) // Filter based on actual API fields
             .map(c => ({                            // Map to consistent internal structure
               name: c.name,
               dial_code: c.code,         // API 'code' is dial code
               code: c.countryCode      // API 'countryCode' is 2-letter code
             }))
             .sort((a, b) => a.name.localeCompare(b.name));

          console.log("(Restored Fetch) Processed Valid Countries:", validCountries);
          setCountries(validCountries);
        } else if (isMounted) {
          console.error("Failed to fetch countries or invalid data format:", response.data);
          toast.error("Could not load country list.");
          setCountries([]);
        }
      } catch (error) {
        if (isMounted) { 
          console.error("Error fetching countries:", error);
          toast.error("An error occurred while fetching the country list.");
          setCountries([]);
        }
      }
    };
    fetchCountries();
    return () => { isMounted = false; };
  }, []); // Fetch once on mount

  const validateEmail = (email) => {
    return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
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
    // Phone validation - check number format and if a country was successfully derived
    if (!formData.phoneNumber || !isPossiblePhoneNumber(formData.phoneNumber)) { 
      newErrors.phoneNumber = 'Valid phone number required (select flag & enter number)'; 
    } else if (!selectedCountryCode || !selectedCountryName) {
      // Check if both code and name were set (implies successful flag selection and lookup)
      newErrors.phoneNumber = 'Please select a country flag for the phone number.';
    }
    
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Simplified handler - only handles non-phone inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`handleChange triggered for: ${name} = ${value}`);

    setFormData(prev => ({ 
      ...prev,
      [name]: value 
    }));

    // Clear validation error for the changed field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Specific handler for the PhoneInput component
  const handlePhoneInputChange = (value) => {
    // value will be E.164 format string, or undefined
    console.log("PhoneInput onChange value:", value); 
    setFormData(prev => ({ ...prev, phoneNumber: value || '' }));
    // Clear phone error when input changes
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: undefined }));
    }
  };

  // Updated handler for country change from PhoneInput flag selector
  const handleCountryChange = (countryCode) => { // Receives 2-letter code (e.g., 'US', 'IN')
      console.log("PhoneInput onCountryChange - Received Code:", countryCode);
      setSelectedCountryCode(countryCode); // Store the 2-letter code

      // Find the full country name from the fetched list
      const countryData = countries.find(c => c.code === countryCode);
      if (countryData) {
        console.log("Found Country Name:", countryData.name);
        setSelectedCountryName(countryData.name); // Store the full name
      } else {
        console.warn("Could not find country name for code:", countryCode); 
        setSelectedCountryName(''); // Reset if lookup fails
        // Optionally, show an error or handle this case
      }

      // Clear phone error when country changes
      if (errors.phoneNumber) {
         setErrors(prev => ({ ...prev, phoneNumber: undefined }));
      }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    let payload = {}; // Initialize payload

    try {
      const apiUrl = '/users/register-customer';

      // Initialize phone parts
      let apiPhoneNumber = undefined;
      let apiCountryCode = undefined;

      // Parse the full phone number to extract parts if it exists
      if (formData.phoneNumber) {
        const parsedNumber = parsePhoneNumberFromString(formData.phoneNumber);
        if (parsedNumber) {
          console.log("Parsed Phone Number:", parsedNumber);
          apiPhoneNumber = parsedNumber.nationalNumber; // Number without prefix
          apiCountryCode = `+${parsedNumber.countryCallingCode}`; // Prefix with +
          // We already have the 2-letter code in selectedCountryCode from onCountryChange
          
          // Double-check: Ensure the parsed country matches the selected one if needed
          // For now, we trust the selectedCountryName derived from onCountryChange
          if(parsedNumber.country !== selectedCountryCode) {
            console.warn(`Mismatch: Parsed country (${parsedNumber.country}) vs Selected country (${selectedCountryCode})`);
            // Decide how to handle mismatch - trust selection or parsed? Trusting selection for now.
          }
        } else {
          // This case should ideally be prevented by validation
          console.error("Phone number exists but failed to parse:", formData.phoneNumber);
          setErrors(prev => ({ ...prev, phoneNumber: 'Phone number format error after validation.' }));
          setIsLoading(false);
          return; 
        }
      }

      // Construct the final payload with all required fields
      payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: apiPhoneNumber, // National number
        countryCode: apiCountryCode, // Dial code prefix (e.g., +91)
        country: selectedCountryName,    // Full country name (e.g., India)
        dob: formData.dob || undefined,
        referralCode: formData.referralCode?.trim() || undefined,
      };

      console.log('Attempting registration with FINAL payload:', payload, 'to URL:', apiUrl);

      const response = await authAxios.post(apiUrl, payload);
      
      console.log('CRM Registration API Response:', response.data);

      if (response.data && response.data.success === true && response.data.user) {
        toast.success(response.data.message || 'Customer registered successfully!');
        const newUser = response.data.user;
        if (newUser && newUser._id) {
          onRegisterSuccess(newUser);
          onClose();
        } else {
          console.error("Registration successful according to API, but user data missing in response:", response.data);
          toast.warn("Registration successful, but couldn't retrieve complete user data. Please search for the customer.");
          onClose();
        }
      } else {
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

  console.log("--- Render Check ---");
  console.log("isLoading:", isLoading);
  console.log("selectedCountryCode:", selectedCountryCode);
  console.log("selectedCountryName:", selectedCountryName);

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
                  
                  {/* Email Field and Phone Number Field in the same row */} 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
                    {/* Email Field */} 
                    <div className="sm:col-span-1"> 
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
  
                    {/* Phone Number Input */} 
                    <div className="sm:col-span-1">  
                       <label htmlFor="phoneNumber" className={labelStyle}>Phone Number</label>
                       <PhoneInput
                         id="phoneNumber"
                         name="phoneNumber"
                         placeholder="Enter phone number"
                         value={formData.phoneNumber} // Controlled by formData
                         onChange={handlePhoneInputChange} // Update formData.phoneNumber
                         onCountryChange={handleCountryChange} // Captures 2-letter code AND triggers name lookup
                         international={true} // Expect international format
                         withCountryCallingCode={true} // Show the country code prefix
                         inputComponent={CustomPhoneInput} // Use custom input for styling
                         inputProps={{ hasError: !!errors.phoneNumber }} // Pass error for styling
                         disabled={isLoading || countries.length === 0} // Disable if countries not loaded
                       />
                       {errors.phoneNumber && <p className={errorTextStyle}>{errors.phoneNumber}</p>}
                    </div>
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
