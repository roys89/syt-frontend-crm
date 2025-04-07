import { Dialog, Transition } from '@headlessui/react';
import {
    BuildingOfficeIcon,
    CalendarDaysIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    InformationCircleIcon,
    MapPinIcon,
    NoSymbolIcon,
    PhotoIcon,
    ShieldCheckIcon,
    SparklesIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid'; // Solid star for rating
import React, { Fragment, useEffect, useMemo, useState } from 'react';

// --- Helper Functions ---

const formatDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        console.error("Invalid date format:", dateString);
        return 'Invalid Date';
    }
};

const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return null;
    try {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        // Handle cases where check-in/out might be the same day (e.g., day use) or invalid range
        return diffDays > 0 ? diffDays : null;
    } catch (e) {
        console.error("Error calculating nights:", e);
        return null;
    }
};

// Simple HTML sanitizer (replace with a library like DOMPurify in production)
const SimpleSanitizer = ({ htmlContent }) => {
  const createMarkup = () => {
    // Basic sanitation: Remove script tags
    const sanitizedHtml = htmlContent.replace(/<script.*?>.*?<\/script>/gi, '');
    return { __html: sanitizedHtml };
  };
  return <div dangerouslySetInnerHTML={createMarkup()} />;
};

// --- Reusable Sub-Components ---

const ModalSection = ({ icon: Icon, title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-4 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
            <button
                className="flex w-full items-center justify-between gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-3 text-left focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-indigo-600 flex-shrink-0" />}
                    <h4 className="text-md font-semibold text-gray-700">{title}</h4>
                </div>
                <ChevronDownIcon
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>
            <Transition
                show={isOpen}
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
            >
                <div className="p-4">
                    {children}
                </div>
            </Transition>
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value, isHtml = false, className = "" }) => (
    <div className={`flex items-start gap-3 mb-2 ${className}`}>
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            {isHtml ? (
                <div className="text-sm text-gray-800 prose prose-sm max-w-none prose-ul:list-disc prose-ul:list-inside prose-li:my-0 prose-p:my-1">
                   <SimpleSanitizer htmlContent={value || 'N/A'} />
                </div>
            ) : (
                <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
            )}
        </div>
    </div>
);

const FacilityItem = ({ text }) => (
    <span className="mr-2 mb-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800 border border-green-200">
        <CheckIcon className="h-3.5 w-3.5" />
        {text}
    </span>
);

const PolicyItem = ({ type, text }) => {
    let Icon = InformationCircleIcon; // Default
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-800';
    let borderColor = 'border-gray-200';

    if (type?.toLowerCase().includes('check-in')) { Icon = ClockIcon; bgColor = 'bg-blue-50'; textColor = 'text-blue-800'; borderColor = 'border-blue-200'; }
    if (type?.toLowerCase().includes('check-out')) { Icon = ClockIcon; bgColor = 'bg-blue-50'; textColor = 'text-blue-800'; borderColor = 'border-blue-200'; }
    if (type?.toLowerCase().includes('fee')) { Icon = CurrencyDollarIcon; bgColor = 'bg-yellow-50'; textColor = 'text-yellow-800'; borderColor = 'border-yellow-200'; }
    if (type?.toLowerCase().includes('know before') || type?.toLowerCase().includes('instruction')) { Icon = ExclamationTriangleIcon; bgColor = 'bg-orange-50'; textColor = 'text-orange-800'; borderColor = 'border-orange-200'; }


    return (
        <div className={`mb-3 rounded-md border ${borderColor} ${bgColor} p-3 shadow-sm`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-5 w-5 ${textColor}`} />
                <p className={`text-sm font-semibold ${textColor}`}>{type || 'Policy'}</p>
            </div>
             <div className={`text-xs ${textColor} prose prose-xs max-w-none prose-ul:list-disc prose-ul:pl-4 prose-li:my-0.5 prose-p:my-1`}>
                 <SimpleSanitizer htmlContent={text || 'Details not available.'} />
             </div>
        </div>
    );
};

const CancellationRuleItem = ({ rule }) => {
    const startDate = rule.start ? formatDate(rule.start) : 'N/A';
    const endDate = rule.end ? formatDate(rule.end) : 'N/A';
    const value = rule.value;
    const valueType = rule.valueType; // e.g., "Percentage"

    return (
        <div className="text-xs border border-red-200 bg-red-50 p-2 rounded mb-2">
            <p className="font-medium text-red-700 mb-1">
                Penalty: {value} {valueType === 'Percentage' ? '%' : valueType}
            </p>
            <p className="text-red-600">Applicable from: {startDate}</p>
            {endDate !== 'N/A' && <p className="text-red-600">Until: {endDate}</p>}
        </div>
    );
};

// New Sub-Component for Review Summaries
const ReviewSummaryItem = ({ summary }) => {
    // Basic check for valid rating (assuming 0-5 scale)
    const overallRating = parseFloat(summary.rating);
    const isValidRating = !isNaN(overallRating) && overallRating >= 0 && overallRating <= 5;

    return (
        <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm last:mb-0">
            <div className="flex justify-between items-center mb-2">
                <h6 className="text-md font-semibold text-indigo-700">{summary.provider || 'Review Summary'}</h6>
                {summary.count && <p className="text-sm text-gray-500">({summary.count} reviews)</p>}
            </div>

            {isValidRating && (
                <div className="mb-3 flex items-center">
                    <span className="text-sm font-medium text-gray-600 mr-2">Overall:</span>
                    {[...Array(Math.floor(overallRating))].map((_, i) => (
                        <StarIcon key={`full-${i}`} className="h-5 w-5 text-yellow-400" />
                    ))}
                    {overallRating % 1 >= 0.5 && (
                         // Simplified half-star rendering for summary
                         <StarIcon key="half" className="h-5 w-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
                    )}
                    {[...Array(5 - Math.ceil(overallRating))].map((_, i) => (
                        <StarIcon key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
                    ))}
                    <span className="ml-2 text-lg font-semibold text-gray-800">{overallRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500"> / 5</span>
                </div>
            )}

            {summary.categoryratings && summary.categoryratings.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Category Ratings:</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        {summary.categoryratings.map((catRating, index) => {
                            const catRatingValue = parseFloat(catRating.rating);
                            const isValidCatRating = !isNaN(catRatingValue) && catRatingValue >= 0 && catRatingValue <= 5; // Assuming 0-5 scale
                            return (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-gray-700 capitalize">{catRating.category}:</span>
                                    <span className={`font-semibold ${isValidCatRating ? 'text-gray-800' : 'text-gray-400'}`}>
                                        {isValidCatRating ? catRatingValue.toFixed(1) : 'N/A'}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Modal Component ---

const CrmHotelViewModal = ({ isOpen, onClose, hotelData: rawHotelData }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

     // Memoize processed data to avoid recalculations on every render
     const processedHotelData = useMemo(() => {
        if (!rawHotelData || !rawHotelData.data) return null;

        const data = rawHotelData.data;
        const hotelDetails = data.hotelDetails || {};
        const staticContent = data.staticContent?.[0] || {};
        const itemDetails = data.items?.[0] || {}; // Itinerary item specific details
        const selectedRoomsAndRates = itemDetails.selectedRoomsAndRates || [];

        // Extract images, prioritizing larger ones
        const images = (staticContent.images || [])
            .map(img => img.links?.find(l => l.size === 'Xxl')?.url || img.links?.[0]?.url)
            .filter(Boolean);

        // Extract descriptions by type
        const descriptions = (staticContent.descriptions || []).reduce((acc, desc) => {
            if (desc.type && desc.text) {
                acc[desc.type.toLowerCase().replace(/_/g, ' ')] = desc.text;
            }
            return acc;
        }, {});

         // Extract hotel facilities
         const hotelFacilities = (staticContent.facilities || []).map(f => f.name).filter(Boolean);

         // Extract policies from the first rate (assuming they might be similar across rates for simplicity)
         // In a real app, might need to show policies per rate if they differ significantly
         const generalPolicies = selectedRoomsAndRates[0]?.rate?.policies || [];
         const cancellationPolicies = selectedRoomsAndRates[0]?.rate?.cancellationPolicies || [];

         // Extract room details
         const roomDetailsList = selectedRoomsAndRates.map(sr => ({
             name: sr.room?.name || 'N/A',
             description: sr.room?.description || null,
             beds: (sr.room?.beds || []).map(b => `${b.count} ${b.type}`).join(', ') || 'N/A',
             occupancy: sr.occupancy || { adults: 'N/A', childAges: [] }, // Use occupancy from SR level
             boardBasis: sr.rate?.boardBasis?.description || 'N/A',
             includes: sr.rate?.includes || [],
             smokingAllowed: sr.room?.smokingAllowed,
             views: sr.room?.views || [],
             roomFacilities: (sr.room?.facilities || []).map(f => f.name).filter(Boolean) // Specific room facilities
         }));

         // Extract Review Summaries using the correct path
         const reviewSummaries = hotelDetails.reviews || [];
         // console.log("Extracted review summaries:", reviewSummaries); // For debugging

        return {
            name: hotelDetails.name || 'Hotel Name N/A',
            starRating: parseInt(hotelDetails.starRating) || 0,
            address: [
                hotelDetails.address?.line1,
                hotelDetails.address?.city?.name,
                hotelDetails.address?.country?.name
            ].filter(Boolean).join(', ') || 'Address N/A',
            checkIn: formatDate(rawHotelData.checkIn), // Use dates from top level
            checkOut: formatDate(rawHotelData.checkOut),
            nights: calculateNights(rawHotelData.checkIn, rawHotelData.checkOut),
            images,
            descriptions,
            hotelFacilities,
            generalPolicies,
            cancellationPolicies,
            roomDetailsList,
            reviewSummaries, // Add review summaries
            isPanMandatory: data.isPanMandatoryForBooking,
            isPassportMandatory: data.isPassportMandatoryForBooking,
            paymentMethods: (selectedRoomsAndRates[0]?.rate?.allowedCreditCards || []).map(cc => cc.code).join(', '),
            spokenLanguages: descriptions['spoken languages'] || 'N/A'
        };
    }, [rawHotelData]);


    useEffect(() => {
        // Reset image index when modal opens or data changes
        if (isOpen) {
            setCurrentImageIndex(0);
        }
    }, [isOpen, processedHotelData]);


    if (!isOpen || !processedHotelData) return null;

    const totalImages = processedHotelData.images.length;
    const totalReviewSummaries = processedHotelData.reviewSummaries.length;

    const handlePrevImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? totalImages - 1 : prevIndex - 1));
    };

    const handleNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prevIndex) => (prevIndex === totalImages - 1 ? 0 : prevIndex + 1));
    };


    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
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
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
                </Transition.Child>

                {/* Modal Content */}
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
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-gray-100 text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 bg-white flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                            <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                                {processedHotelData.name}
                                            </Dialog.Title>
                                            {processedHotelData.starRating > 0 && (
                                                <div className="flex items-center mt-0.5">
                                                    {[...Array(processedHotelData.starRating)].map((_, i) => (
                                                        <StarIcon key={i} className="h-4 w-4 text-yellow-400" />
                                                    ))}
                                                    <span className="ml-1 text-xs text-gray-500">({processedHotelData.starRating}-Star)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        aria-label="Close modal"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Scrollable Main Content */}
                                <div className="flex-grow overflow-y-auto p-4 sm:p-6">

                                    {/* Image Gallery */}
                                    {totalImages > 0 ? (
                                        <div className="mb-6 relative group">
                                            <div className="w-full h-80 overflow-hidden rounded-lg bg-gray-200 shadow">
                                                <img
                                                    src={processedHotelData.images[currentImageIndex]}
                                                    alt={`Hotel ${currentImageIndex + 1}`}
                                                    className="h-full w-full object-cover object-center"
                                                    onError={(e) => e.target.src = '/api/placeholder/800/450'} // Basic fallback
                                                />
                                            </div>
                                            {/* Navigation Buttons */}
                                            {totalImages > 1 && (
                                                <>
                                                    <button
                                                        onClick={handlePrevImage}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-opacity opacity-0 group-hover:opacity-100"
                                                        aria-label="Previous image"
                                                    >
                                                        <ChevronLeftIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={handleNextImage}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-opacity opacity-0 group-hover:opacity-100"
                                                        aria-label="Next image"
                                                    >
                                                        <ChevronRightIcon className="h-5 w-5" />
                                                    </button>
                                                    {/* Counter */}
                                                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 z-10">
                                                         <PhotoIcon className="h-3.5 w-3.5" />
                                                         {currentImageIndex + 1} / {totalImages}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                         <div className="mb-6 h-80 w-full rounded-lg bg-gray-200 flex items-center justify-center border">
                                              <PhotoIcon className="h-16 w-16 text-gray-400" />
                                         </div>
                                    )}


                                    {/* Basic Info Section */}
                                    <ModalSection icon={InformationCircleIcon} title="Basic Information" defaultOpen={true}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InfoItem icon={MapPinIcon} label="Address" value={processedHotelData.address} />
                                            <InfoItem icon={CalendarDaysIcon} label="Check-in Date" value={processedHotelData.checkIn} />
                                            <InfoItem icon={CalendarDaysIcon} label="Check-out Date" value={processedHotelData.checkOut} />
                                            {processedHotelData.nights && (
                                                <InfoItem icon={ClockIcon} label="Duration" value={`${processedHotelData.nights} Night${processedHotelData.nights > 1 ? 's' : ''}`} />
                                            )}
                                        </div>
                                    </ModalSection>

                                     {/* Room Details Section */}
                                     {processedHotelData.roomDetailsList.length > 0 && (
                                         <ModalSection icon={HomeIcon} title="Room Details" defaultOpen={true}>
                                             {processedHotelData.roomDetailsList.map((room, index) => (
                                                 <div key={index} className={`p-3 rounded-md border border-gray-200 shadow-sm bg-white ${index < processedHotelData.roomDetailsList.length - 1 ? 'mb-4' : ''}`}>
                                                     <h5 className="text-md font-semibold text-gray-800 mb-2">{room.name}</h5>
                                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-2">
                                                        <p><span className="font-medium text-gray-600">Occupancy:</span> {room.occupancy.adults} Adult{room.occupancy.adults !== 1 ? 's' : ''}{room.occupancy.childAges?.length > 0 ? `, ${room.occupancy.childAges.length} Child(ren)` : ''}</p>
                                                        <p><span className="font-medium text-gray-600">Beds:</span> {room.beds}</p>
                                                        <p><span className="font-medium text-gray-600">Board:</span> {room.boardBasis}</p>
                                                        {room.views.length > 0 && <p><span className="font-medium text-gray-600">View:</span> {room.views.join(', ')}</p>}
                                                        {room.smokingAllowed !== undefined && <p><span className="font-medium text-gray-600">Smoking:</span> {room.smokingAllowed ? 'Allowed' : 'Not Allowed'}</p>}
                                                     </div>

                                                     {room.description && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                             <p className="text-xs font-medium text-gray-500 mb-1">Description:</p>
                                                             <div className="text-xs text-gray-700 prose prose-xs max-w-none">
                                                                 <SimpleSanitizer htmlContent={room.description} />
                                                             </div>
                                                        </div>
                                                     )}

                                                     {room.includes.length > 0 && (
                                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                                             <p className="text-xs font-medium text-gray-500 mb-1">Includes:</p>
                                                             <div className="flex flex-wrap gap-1">
                                                                 {room.includes.map((item, idx) => (
                                                                     <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">{item}</span>
                                                                 ))}
                                                             </div>
                                                        </div>
                                                     )}
                                                      {/* Optionally show room-specific facilities if needed */}
                                                      {/* {room.roomFacilities.length > 0 && (...)} */}
                                                 </div>
                                             ))}
                                         </ModalSection>
                                     )}

                                    {/* About Section */}
                                    {Object.keys(processedHotelData.descriptions).filter(key => !['attractions', 'spoken languages', 'onsite payments', 'location'].includes(key)).length > 0 && (
                                        <ModalSection icon={InformationCircleIcon} title="About The Hotel">
                                             {Object.entries(processedHotelData.descriptions)
                                                 .filter(([key]) => !['attractions', 'spoken languages', 'onsite payments', 'location'].includes(key))
                                                 .map(([type, text]) => (
                                                     <div key={type} className="mb-4 last:mb-0">
                                                         <h5 className="text-sm font-semibold text-gray-700 capitalize mb-1">{type}</h5>
                                                          <div className="text-sm text-gray-600 prose prose-sm max-w-none prose-ul:list-disc prose-ul:list-inside prose-li:my-0 prose-p:my-1">
                                                               <SimpleSanitizer htmlContent={text} />
                                                          </div>
                                                     </div>
                                                 ))}
                                        </ModalSection>
                                    )}

                                    {/* Location & Attractions Section */}
                                    {(processedHotelData.descriptions.location || processedHotelData.descriptions.attractions) && (
                                        <ModalSection icon={MapPinIcon} title="Location & Attractions">
                                            {processedHotelData.descriptions.location && (
                                                 <div className="mb-4">
                                                      <h5 className="text-sm font-semibold text-gray-700 mb-1">Location Overview</h5>
                                                      <div className="text-sm text-gray-600 prose prose-sm max-w-none">
                                                          <SimpleSanitizer htmlContent={processedHotelData.descriptions.location} />
                                                      </div>
                                                 </div>
                                            )}
                                             {processedHotelData.descriptions.attractions && (
                                                 <div>
                                                      <h5 className="text-sm font-semibold text-gray-700 mb-1">Nearby Attractions</h5>
                                                       <div className="text-sm text-gray-600 prose prose-sm max-w-none prose-ul:list-disc prose-ul:list-inside prose-li:my-0 prose-p:my-1">
                                                          <SimpleSanitizer htmlContent={processedHotelData.descriptions.attractions} />
                                                      </div>
                                                 </div>
                                             )}
                                        </ModalSection>
                                    )}


                                    {/* Facilities Section */}
                                    {processedHotelData.hotelFacilities.length > 0 && (
                                        <ModalSection icon={SparklesIcon} title="Hotel Facilities">
                                            <div className="flex flex-wrap">
                                                {processedHotelData.hotelFacilities.map((facility, index) => (
                                                    <FacilityItem key={index} text={facility} />
                                                ))}
                                            </div>
                                        </ModalSection>
                                    )}

                                     {/* General Policies Section */}
                                     {processedHotelData.generalPolicies.length > 0 && (
                                         <ModalSection icon={ExclamationTriangleIcon} title="Important Policies & Fees">
                                             {processedHotelData.generalPolicies.map((policy, index) => (
                                                 <PolicyItem key={index} type={policy.type} text={policy.text} />
                                             ))}
                                         </ModalSection>
                                     )}

                                     {/* Cancellation Policy Section */}
                                     {processedHotelData.cancellationPolicies.length > 0 && (
                                          <ModalSection icon={NoSymbolIcon} title="Cancellation Policy">
                                              {processedHotelData.cancellationPolicies.map((policy, index) => (
                                                  <div key={index} className="mb-2">
                                                       {policy.text && <p className="text-sm font-medium text-gray-700 mb-1">{policy.text}</p>}
                                                       {policy.rules?.map((rule, ruleIndex) => (
                                                           <CancellationRuleItem key={ruleIndex} rule={rule} />
                                                       ))}
                                                  </div>
                                              ))}
                                          </ModalSection>
                                     )}

                                     {/* Review Summary Section */}
                                     {totalReviewSummaries > 0 && (
                                         <ModalSection icon={ClipboardDocumentListIcon} title={`Review Summary (${totalReviewSummaries})`} defaultOpen={false}>
                                             {processedHotelData.reviewSummaries.map((summary, index) => (
                                                 <ReviewSummaryItem key={index} summary={summary} />
                                             ))}
                                         </ModalSection>
                                     )}

                                     {/* Other Info Section */}
                                     <ModalSection icon={ShieldCheckIcon} title="Other Information" defaultOpen={false}>
                                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                             <InfoItem icon={ShieldCheckIcon} label="PAN Card Mandatory" value={processedHotelData.isPanMandatory ? 'Yes' : 'No'} />
                                             <InfoItem icon={ShieldCheckIcon} label="Passport Mandatory" value={processedHotelData.isPassportMandatory ? 'Yes' : 'No'} />
                                             <InfoItem icon={InformationCircleIcon} label="Spoken Languages" value={processedHotelData.spokenLanguages} />
                                             <InfoItem icon={InformationCircleIcon} label="Accepted Payments (Example)" value={processedHotelData.paymentMethods || 'Not Specified'} />
                                         </div>
                                     </ModalSection>


                                </div>

                                {/* Footer */}
                                <div className="p-4 sm:p-5 border-t border-gray-200 bg-white flex-shrink-0 flex justify-end">
                                    <button
                                        type="button"
                                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

export default CrmHotelViewModal; 