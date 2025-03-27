import { XMarkIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

const TravelerDetailsModal = ({ 
  isOpen, 
  onClose,
  onSubmit, 
  numberOfTravelers,
  bookingQuestions,
  languageGuides = [],
  referenceData,
  activity,
  bookingData
}) => {
  const [travelers, setTravelers] = useState([]);
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize travelers array based on the number of travelers
    const initialTravelers = Array(numberOfTravelers).fill().map(() => ({
      title: '',
      firstName: '',
      lastName: '',
      nationality: '',
      age: '',
      dateOfBirth: '',
      passportNumber: '',
      passportExpiry: '',
      passportCountry: '',
      weight: '',
      height: '',
      languageGuide: languageGuides.length > 0 ? 
        (typeof languageGuides[0] === 'object' ? languageGuides[0].language : languageGuides[0]) : '',
      specialRequirements: ''
    }));
    setTravelers(initialTravelers);
  }, [numberOfTravelers, languageGuides]);

  const handleChange = (index, field, value) => {
    const updatedTravelers = [...travelers];
    updatedTravelers[index] = { ...updatedTravelers[index], [field]: value };
    setTravelers(updatedTravelers);
  };

  const handleSpecialRequirementsChange = (value) => {
    setSpecialRequirements(value);
  };

  // Helper function to determine age band based on age and product ageBands
  const determineAgeBand = (age) => {
    const ageBands = activity?.details?.ageBands || [];
    const ageNum = parseInt(age);
    
    // Find matching age band
    for (const band of ageBands) {
      if (ageNum >= band.startAge && ageNum <= band.endAge) {
        return band.ageBand;
      }
    }
    
    // Default fallback if no matching band found
    return ageNum < 12 ? "CHILD" : "ADULT";
  };

  // Helper function to generate the group count string
  const generateGroupCountString = () => {
    // Count travelers by type
    const counts = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
      SENIOR: 0,
      YOUTH: 0
    };
    
    // Count each traveler type
    travelers.forEach(traveler => {
      const band = determineAgeBand(traveler.age);
      counts[band]++;
    });
    
    // Format as pipe separated string: adult|child|infant|senior|youth
    return `${counts.ADULT}|${counts.CHILD}|${counts.INFANT}|${counts.SENIOR}|${counts.YOUTH}`;
  };

  // Generate question answers in the format expected by the API
  const generateQuestionAnswers = () => {
    // Use flatMap to create all traveler questions at once, exactly like in bookingDataTransformer.js
    const answers = travelers.flatMap((traveler, index) => [
      {
        question: "AGEBAND",
        answer: determineAgeBand(traveler.age),
        travelerNum: (index + 1).toString()
      },
      {
        question: "DATE_OF_BIRTH",
        answer: traveler.dateOfBirth || new Date().toISOString().split('T')[0],
        travelerNum: (index + 1).toString()
      },
      {
        question: "FULL_NAMES_FIRST",
        answer: traveler.firstName,
        travelerNum: (index + 1).toString()
      },
      {
        question: "FULL_NAMES_LAST",
        answer: traveler.lastName,
        travelerNum: (index + 1).toString()
      },
      // Add weight answer if traveler has weight data
      ...(traveler.weight ? [{
        question: "WEIGHT",
        answer: traveler.weight,
        unit: "kg",
        travelerNum: (index + 1).toString()
      }] : []),
      // Add height answer if traveler has height data
      ...(traveler.height ? [{
        question: "HEIGHT",
        answer: traveler.height,
        unit: "cm",
        travelerNum: (index + 1).toString()
      }] : [])
    ]);

    // Add special requirements if provided, exactly like in bookingDataTransformer.js
    if (specialRequirements) {
      answers.push({
        question: "SPECIAL_REQUIREMENTS",
        answer: specialRequirements
      });
    }

    // Always add standard booking answers, exactly like in bookingDataTransformer.js
    answers.push(
      {
        question: "PICKUP_POINT",
        answer: "CONTACT_SUPPLIER_LATER"
      },
      {
        question: "TRANSFER_ARRIVAL_MODE",
        answer: "OTHER"
      }
    );

    return answers;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    // Validate all required fields are filled
    const hasRequiredWeightQuestion = travelerLevelQuestions.some(
      q => q.stringQuestionId === "WEIGHT" && q.required
    );

    if (hasRequiredWeightQuestion) {
      const missingWeight = travelers.some(traveler => !traveler.weight);
      if (missingWeight) {
        setError('Weight is required for all travelers. Please fill in this information.');
        return;
      }
    }

    // Format travelers for the API
    const formattedTravelers = travelers.map(traveler => ({
      title: traveler.title,
      name: traveler.firstName,
      surname: traveler.lastName,
      type: determineAgeBand(traveler.age).toLowerCase(),
      age: traveler.age
    }));

    // Generate unique agent reference
    const agentRef = Math.floor(100000000 + Math.random() * 900000000).toString();
    
    // Get base group code and add counts
    const baseGroupCode = activity.groupCode?.split('-')[0] || '';
    const groupCountString = generateGroupCountString();
    const fullGroupCode = `${baseGroupCode}-${groupCountString}`;

    // Create booking payload
    const bookingPayload = {
      // Search ID from activity
      searchId: activity?.searchId,
      
      // Activity code
      activityCode: activity?.code,
      
      // Reference data from booking reference API
      bookingRef: referenceData.bookingRef,
      
      // Lead traveler info (first traveler)
      lead: {
        title: travelers[0].title,
        name: travelers[0].firstName,
        surname: travelers[0].lastName,
        clientNationality: travelers[0].nationality,
        age: parseInt(travelers[0].age)
      },
      
      // Selected language guide
      languageGuide: {
        type: "GUIDE",
        language: travelers[0].languageGuide || "en",
        legacyGuide: `${travelers[0].languageGuide || "en"}/SERVICE_GUIDE`
      },
      
      // Question answers in required format
      QuestionAnswers: generateQuestionAnswers(),
      
      // All travelers
      travellers: formattedTravelers,
      
      // Use the exact ratekey from the selected package and append bookingRef with pipe separator
      ratekey: `${bookingData.ratekey}|${referenceData.bookingRef || ''}`,
      
      // Use properly formatted group code
      groupCode: fullGroupCode,
      
      // Additional booking details
      agentRef: agentRef
    };

    // Set loading state and submit
    setIsSubmitting(true);
    onSubmit(bookingPayload)
      .catch(err => {
        console.error('Booking error:', err);
        setError(err.message || 'Failed to complete booking. Please try again.');
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // Map bookingQuestions to their field names
  const getFieldNameForQuestion = (questionId) => {
    const questionMap = {
      'AGEBAND': 'ageband',
      'DATE_OF_BIRTH': 'dateOfBirth',
      'FULL_NAMES_FIRST': 'firstName',
      'FULL_NAMES_LAST': 'lastName',
      'PASSPORT_EXPIRY': 'passportExpiry',
      'PASSPORT_NATIONALITY': 'passportCountry',
      'PASSPORT_PASSPORT_NO': 'passportNumber',
      'SPECIAL_REQUIREMENTS': 'specialRequirements',
      'WEIGHT': 'weight',
      'HEIGHT': 'height'
    };
    return questionMap[questionId] || questionId.toLowerCase();
  };

  // Helper to determine if a question is per traveler or per booking
  const isPerTravelerQuestion = (question) => {
    return question.message === 'PER_TRAVELER';
  };

  // Filter questions to only include those that need user input and match bookingDataTransformer.js
  const filterRelevantQuestions = (questions) => {
    // Questions that are hardcoded or auto-generated in bookingDataTransformer
    const autoGeneratedQuestions = [
      'PICKUP_POINT', 
      'TRANSFER_ARRIVAL_MODE',
      'AGEBAND' // Filter out AGEBAND since we're determining it from age
    ];
    
    return questions.filter(q => 
      // Skip questions that are auto-generated or auto-determined
      !autoGeneratedQuestions.includes(q.stringQuestionId)
    );
  };

  // Get filtered booking-level questions
  const bookingLevelQuestions = filterRelevantQuestions(
    bookingQuestions?.filter(q => !isPerTravelerQuestion(q)) || []
  );

  // Get filtered traveler-level questions
  const travelerLevelQuestions = filterRelevantQuestions(
    bookingQuestions?.filter(q => isPerTravelerQuestion(q)) || []
  );

  // Always include these required fields regardless of bookingQuestions
  const shouldShowFirstName = !travelerLevelQuestions.some(q => q.stringQuestionId === "FULL_NAMES_FIRST");
  const shouldShowLastName = !travelerLevelQuestions.some(q => q.stringQuestionId === "FULL_NAMES_LAST");
  
  // Always include these fields that are needed for the booking
  const requiredFields = ['firstName', 'lastName', 'nationality', 'age'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-2xl z-30">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Traveler Details</h2>
              <p className="text-gray-500">Please provide information for all travelers</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Traveler Information */}
          {travelers.map((traveler, index) => (
            <div key={index} className="mb-8 p-6 bg-gray-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Traveler {index + 1}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <select
                    value={traveler.title}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>

                {/* Dynamically render traveler-level questions */}
                {travelerLevelQuestions.map((question) => {
                  const fieldName = getFieldNameForQuestion(question.stringQuestionId);
                  
                  if (question.subTitle === 'DATE') {
                    return (
                      <div key={question.questionId}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {question.title} {question.required && <span className="text-red-500">*</span>}
                        </label>
                        <input
                          type="date"
                          value={traveler[fieldName] || ''}
                          onChange={(e) => handleChange(index, fieldName, e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required={question.required}
                        />
                      </div>
                    );
                  }
                  
                  if (question.allowedAnswers) {
                    return (
                      <div key={question.questionId}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {question.title} {question.required && <span className="text-red-500">*</span>}
                        </label>
                        <select
                          value={traveler[fieldName] || ''}
                          onChange={(e) => handleChange(index, fieldName, e.target.value)}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required={question.required}
                        >
                          <option value="">Select {question.title}</option>
                          {question.allowedAnswers.map((answer) => (
                            <option key={answer} value={answer}>
                              {answer}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  
                  if (question.subTitle === 'NUMBER_AND_UNIT') {
                    return (
                      <div key={question.questionId}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {question.title} {question.required && <span className="text-red-500">*</span>}
                        </label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={traveler[fieldName] || ''}
                            onChange={(e) => handleChange(index, fieldName, e.target.value)}
                            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter value"
                            required={question.required}
                          />
                          <div className="ml-2 flex items-center text-gray-600 font-medium min-w-[40px]">
                            {fieldName === 'weight' ? 'kg' : fieldName === 'height' ? 'cm' : ''}
                          </div>
                        </div>
                        {question.stringQuestionId === 'WEIGHT' && (
                          <p className="mt-1 text-xs text-gray-500">Required for safety reasons</p>
                        )}
                      </div>
                    );
                  }
                  
                  return (
                    <div key={question.questionId}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {question.title} {question.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={traveler[fieldName] || ''}
                        onChange={(e) => handleChange(index, fieldName, e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={question.subTitle}
                        required={question.required}
                      />
                    </div>
                  );
                })}

                {/* Add standard fields if not included in booking questions */}
                {shouldShowFirstName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={traveler.firstName}
                      onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}

                {shouldShowLastName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={traveler.lastName}
                      onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={traveler.nationality}
                    onChange={(e) => handleChange(index, 'nationality', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={traveler.age}
                    onChange={(e) => handleChange(index, 'age', e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                {/* Language Guide if available */}
                {languageGuides.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language Guide
                    </label>
                    <select
                      value={traveler.languageGuide}
                      onChange={(e) => handleChange(index, 'languageGuide', e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      {languageGuides.map((lang, idx) => (
                        <option 
                          key={idx} 
                          value={typeof lang === 'object' ? lang.language : lang}
                        >
                          {typeof lang === 'object' ? lang.language : lang}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Booking-level questions */}
          {(bookingLevelQuestions.length > 0 || !bookingLevelQuestions.some(q => q.stringQuestionId === "SPECIAL_REQUIREMENTS")) && (
            <div className="mb-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Booking Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Only render booking questions that need manual input */}
                {bookingLevelQuestions.map((question) => {
                  const fieldName = getFieldNameForQuestion(question.stringQuestionId);
                  
                  if (fieldName === 'specialRequirements') {
                    return (
                      <div key={question.questionId} className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {question.title} {question.required && <span className="text-red-500">*</span>}
                        </label>
                        <textarea
                          value={specialRequirements}
                          onChange={(e) => handleSpecialRequirementsChange(e.target.value)}
                          rows={3}
                          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          placeholder={question.subTitle}
                          required={question.required}
                        />
                      </div>
                    );
                  }
                  
                  // Only show other booking questions if not auto-generated
                  return (
                    <div key={question.questionId} className={fieldName === 'specialRequirements' ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {question.title} {question.required && <span className="text-red-500">*</span>}
                      </label>
                      <input
                        type="text"
                        value={travelers[0]?.[fieldName] || ''}
                        onChange={(e) => {
                          const updatedTravelers = travelers.map(traveler => ({
                            ...traveler,
                            [fieldName]: e.target.value
                          }));
                          setTravelers(updatedTravelers);
                        }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder={question.subTitle}
                        required={question.required}
                      />
                    </div>
                  );
                })}

                {/* Always show Special Requirements if not included in booking questions */}
                {!bookingLevelQuestions.some(q => q.stringQuestionId === "SPECIAL_REQUIREMENTS") && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requirements
                    </label>
                    <textarea
                      value={specialRequirements}
                      onChange={(e) => handleSpecialRequirementsChange(e.target.value)}
                      rows={3}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Any special requirements or requests"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Submit Booking'
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default TravelerDetailsModal; 