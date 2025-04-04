import { Dialog, Transition } from '@headlessui/react';
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ListBulletIcon,
  LockClosedIcon,
  MapPinIcon,
  PhotoIcon,
  TagIcon,
  TicketIcon,
  UserGroupIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import React, { Fragment, useState } from 'react';

// --- Helper Functions ---
const formatTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  if (timeString.includes('T') && timeString.includes(':')) {
    try {
      return new Date(timeString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) { return 'Invalid Time'; }
  }
  return timeString;
};

const formatDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
   try {
     return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
   } catch (e) { return 'Invalid Date'; }
};

const formatDuration = (minutes) => {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  let durationStr = '';
  if (h > 0) durationStr += `${h} hour${h > 1 ? 's' : ''}`;
  if (m > 0) durationStr += `${h > 0 ? ' ' : ''}${m} minute${m > 1 ? 's' : ''}`;
  return durationStr || null;
};

const formatAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) return null;
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
// --- End Helper Functions ---

// --- Sub-components for Readability ---
const DetailItem = ({ icon: Icon, label, value, className = '' }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-start gap-2 text-sm ${className}`}>
      <Icon className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
      <span className="font-medium text-gray-600 w-24 flex-shrink-0">{label}:</span>
      <span className="text-gray-800">{value}</span>
    </div>
  );
};

// Simple version for the horizontal row
const InlineDetailItem = ({ icon: Icon, value, className = '' }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className={`flex items-center gap-1.5 text-sm text-gray-700 ${className}`}>
       <Icon className="h-4 w-4 text-gray-500 flex-shrink-0" />
       <span className="font-medium">{value}</span>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => (
  <h4 className="text-base font-semibold text-gray-800 mb-2 flex items-center gap-2">
    <Icon className="h-5 w-5 text-indigo-600" />
    {title}
  </h4>
);
// --- End Sub-components ---

const CrmActivityViewModal = ({ isOpen, onClose, activityData }) => {
  // --- Hooks Must Be Called At The Top ---
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Reset image index when modal opens or data changes
  // Also depends on totalImages, which depends on activityData, so check activityData exists first
  React.useEffect(() => {
    if (isOpen && activityData) { // Add check for activityData
       setCurrentImageIndex(0);
    }
  }, [isOpen, activityData]); // Reset on open or data change
  // --- End Hooks ---

  // --- Early return if no data ---
  if (!activityData) return null;

  // --- Deeper Data Extraction (Now safe after the early return check) ---
  const {
    activityName,
    duration, selectedTime, date, // Added date
    fullAddress, street, city, country,
    description, additionalInfo, // Added additionalInfo
    imageUrl, images,
    isOnline,
    // Pricing
    costPrice, sellingPrice,
    // Supplier & Booking
    supplierName, supplierReference,
    bookingReference, confirmationStatus,
    // Policy & Details
    cancellationPolicy, inclusions, exclusions,
    // Participants/Options (Example fields)
    participants, // Could be number or object
    ticketType, // e.g., 'Adult', 'Skip-the-line'
    optionName, // e.g., 'Morning Slot', 'With Guide'
    itinerary // Add itinerary object
  } = activityData;

  // --- Format & Prepare Data (Now safe) ---
  const formattedTime = formatTime(selectedTime);
  const formattedDuration = formatDuration(duration);
  const formattedDate = formatDate(date);
  const displayAddress = fullAddress || [street, city, country].filter(Boolean).join(', ') || null;
  const displayImages = images?.length > 0 ? images.map(img => img.variants?.[0]?.url).filter(Boolean) : (imageUrl ? [imageUrl] : []);
  const totalImages = displayImages.length;
  const costPriceFormatted = formatAmount(costPrice);
  const sellingPriceFormatted = formatAmount(sellingPrice);

  const getParticipantCount = (p) => {
      if (typeof p === 'number') return p;
      if (typeof p === 'object' && p !== null) { // Example: { adults: 2, children: 1 }
         return (p.adults || 0) + (p.children || 0);
      }
      return null;
  };
  const participantCount = getParticipantCount(participants);

  // --- Carousel Navigation Handlers (Depend on totalImages, safe now) ---
  const handlePrevImage = (e) => {
     e.stopPropagation();
     // Ensure totalImages is available before using it
     if (totalImages > 0) {
       setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? totalImages - 1 : prevIndex - 1));
     }
  };

  const handleNextImage = (e) => {
     e.stopPropagation();
     if (totalImages > 0) {
       setCurrentImageIndex((prevIndex) => (prevIndex === totalImages - 1 ? 0 : prevIndex + 1));
     }
  };
  // --- End Carousel Handlers ---

  // --- Render Function for Itinerary Details (Depends on itinerary, safe now) ---
  const renderItineraryDetails = () => {
    if (!itinerary) return null;

    const {
      itineraryType,
      skipTheLine,
      privateTour,
      itineraryItems,
      unstructuredDescription,
      unstructuredItinerary,
      activityInfo
    } = itinerary;

    const hasStructuredItems = itineraryItems && itineraryItems.length > 0;
    const hasActivityInfo = activityInfo && activityInfo.description;
    const hasUnstructured = unstructuredDescription || unstructuredItinerary;

    // Don't render the section if there's nothing to show
    if (!hasStructuredItems && !hasActivityInfo && !hasUnstructured && !skipTheLine && !privateTour) {
      return null;
    }

    return (
      <div className="pt-4 border-t border-gray-100">
        <SectionTitle icon={ClipboardDocumentListIcon} title="Itinerary / Activity Details" />

        {/* Flags */}
        {(skipTheLine || privateTour) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm">
            {skipTheLine && (
              <span className="inline-flex items-center gap-1 font-medium text-green-700">
                <CheckCircleIcon className="h-4 w-4" aria-hidden="true" /> Skip the Line
              </span>
            )}
            {privateTour && (
              <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                <LockClosedIcon className="h-4 w-4" aria-hidden="true" /> Private Tour
              </span>
            )}
          </div>
        )}

        {/* Structured Itinerary Items */}
        {hasStructuredItems && (
          <div className="space-y-3">
            {itineraryItems.map((item, index) => (
              <div key={`it-item-${index}`} className="p-3 bg-gray-50/80 rounded border border-gray-200/80 shadow-sm">
                {item.name && <p className="font-semibold text-gray-800 mb-1 text-base">{index + 1}. {item.name}</p>}
                {item.description && <p className="text-sm text-gray-600 whitespace-pre-wrap prose prose-sm max-w-none">{item.description}</p>}
                {/* TODO: Add duration, POI location, etc. if needed in the future */}
              </div>
            ))}
          </div>
        )}

        {/* Activity Info Description (for type: ACTIVITY) */}
        {hasActivityInfo && !hasStructuredItems && ( // Prefer structured items if both exist
           <div className="mt-2 p-3 bg-blue-50 rounded border border-blue-200 shadow-sm">
             <p className="text-sm text-blue-800 whitespace-pre-wrap prose prose-sm max-w-none">{activityInfo.description}</p>
           </div>
        )}

        {/* Unstructured Descriptions (Fallback) */}
        {hasUnstructured && !hasStructuredItems && !hasActivityInfo && (
          <div className="mt-2 p-3 bg-gray-50/80 rounded border border-gray-200/80 shadow-sm">
             <p className="text-sm text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none">
                {unstructuredDescription || unstructuredItinerary}
             </p>
          </div>
        )}
      </div>
    );
  };
  // --- End Itinerary Render Function ---

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        {/* Backdrop */} 
        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gray-50 p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    {activityName || 'Activity Details'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Body - Scrollable */} 
                <div className="p-4 sm:p-6 max-h-[70vh] overflow-y-auto space-y-5">

                  {/* Section 1: Image Carousel (Full Width) */} 
                  <div> 
                    {/* Main Image Display */}
                    {totalImages > 0 ? (
                      <div className="aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg bg-gray-200 shadow relative mb-2"> {/* Wider aspect ratio, added margin-bottom */} 
                          <img 
                              src={displayImages[currentImageIndex]} 
                              alt={`${activityName || 'Activity'} - Image ${currentImageIndex + 1}`}
                              className="h-full w-full object-cover object-center" 
                          />
                          {/* Counter */} 
                          {totalImages > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 z-10">
                              <PhotoIcon className="h-3 w-3" /> 
                              {currentImageIndex + 1} / {totalImages}
                            </div>
                          )}
                          {/* Navigation Buttons */} 
                          {totalImages > 1 && (
                            <>
                              <button 
                                  onClick={handlePrevImage}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
                                  aria-label="Previous image"
                              >
                                  <ChevronLeftIcon className="h-5 w-5" />
                              </button>
                              <button 
                                  onClick={handleNextImage}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-black/40 text-white rounded-full hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
                                  aria-label="Next image"
                              >
                                  <ChevronRightIcon className="h-5 w-5" />
                              </button>
                            </> 
                          )}
                      </div>
                    ) : (
                      <div className="aspect-w-16 aspect-h-9 w-full rounded-lg bg-gray-100 flex items-center justify-center border mb-2"> {/* Placeholder */} 
                        <PhotoIcon className="h-16 w-16 text-gray-300" />
                      </div>
                    )}

                    {/* Thumbnail Strip (only if multiple images) */} 
                    {totalImages > 1 && (
                      <div className="flex overflow-x-auto space-x-2 pb-2"> 
                        {displayImages.map((imgUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-14 rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${currentImageIndex === index ? 'ring-2 ring-indigo-500 ring-offset-1' : 'ring-1 ring-gray-300'}`}
                          >
                            <img 
                              src={imgUrl} 
                              alt={`Thumbnail ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section 1.5: Core Details Row (Time, Duration, Status) */} 
                  <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-2 pt-3 border-t border-gray-100 mt-1">
                    <InlineDetailItem icon={ClockIcon} value={formattedTime} />
                    <InlineDetailItem icon={TicketIcon} value={formattedDuration} />
                    <div className="flex items-center gap-1.5 text-sm">
                      <TagIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className={`font-medium text-xs px-2 py-0.5 rounded ${confirmationStatus === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}> 
                        {confirmationStatus || 'PENDING'}
                      </span>
                    </div>
                  </div>

                  {/* Section 1.75: Remaining Core Details (Stacked) */} 
                  <div className="pt-3 border-t border-gray-100 space-y-2.5">
                     {/* Use the original DetailItem component here */} 
                     <DetailItem icon={CalendarDaysIcon} label="Date" value={formattedDate} />
                     <DetailItem icon={MapPinIcon} label="Location" value={displayAddress} />
                     {isOnline && <DetailItem icon={MapPinIcon} label="Format" value="Online" />} 
                     <DetailItem icon={UserGroupIcon} label="Participants" value={participantCount} />
                     <DetailItem icon={TicketIcon} label="Ticket Type" value={ticketType} />
                     <DetailItem icon={InformationCircleIcon} label="Option" value={optionName} />
                  </div>

                  {/* Section 2: Pricing & Supplier */} 
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                     <div className="space-y-2.5">
                         <SectionTitle icon={CurrencyRupeeIcon} title="Pricing" />
                         <DetailItem icon={CurrencyRupeeIcon} label="Cost Price" value={costPriceFormatted} />
                         <DetailItem icon={CurrencyRupeeIcon} label="Selling Price" value={sellingPriceFormatted} />
                      </div>
                      <div className="space-y-2.5">
                          <SectionTitle icon={BuildingOfficeIcon} title="Supplier & Booking" />
                          <DetailItem icon={BuildingOfficeIcon} label="Supplier" value={supplierName} />
                          <DetailItem icon={TagIcon} label="Supp. Ref" value={supplierReference} />
                          <DetailItem icon={TagIcon} label="Booking Ref" value={bookingReference} />
                      </div>
                  </div>

                  {/* Section 3: Description & Additional Info */}
                  {(description || additionalInfo?.length > 0) && (
                     <div className="pt-4 border-t border-gray-100 space-y-3">
                       {description && (
                         <div>
                           <SectionTitle icon={InformationCircleIcon} title="Description" />
                           <p className="text-sm text-gray-700 whitespace-pre-wrap prose prose-sm max-w-none mt-1">{description}</p>
                         </div>
                       )}
                       {additionalInfo?.length > 0 && (
                          <div>
                             <SectionTitle icon={InformationCircleIcon} title="Additional Info" />
                             <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 pl-1 mt-1">
                               {additionalInfo.map((item, index) => (
                                  <li key={`add-${index}`}>
                                     {item?.description || String(item)}
                                  </li>
                               ))}
                             </ul>
                          </div>
                       )}
                     </div>
                  )}

                  {/* Section 4: Inclusions / Exclusions */}
                  {(inclusions?.length > 0 || exclusions?.length > 0) && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                       <SectionTitle icon={ListBulletIcon} title="Details" />
                       {inclusions?.length > 0 && (
                         <div className="text-sm">
                           <p className="font-medium text-gray-600 mb-1">Included:</p>
                           <ul className="list-disc list-inside text-gray-700 space-y-1 pl-1">
                             {inclusions.map((item, index) => {
                               let content = null;
                               if (typeof item === 'string') {
                                 content = item; // Handle plain strings
                               } else if (typeof item === 'object' && item !== null && item.otherDescription) {
                                 content = item.otherDescription; // Handle objects with otherDescription
                               }
                               // Render li only if content is valid
                               return content ? <li key={`inc-${index}`}>{content}</li> : null;
                             })}
                           </ul>
                         </div>
                       )}
                       {exclusions?.length > 0 && (
                         <div className="text-sm mt-2">
                           <p className="font-medium text-gray-600 mb-1">Not Included:</p>
                           <ul className="list-disc list-inside text-gray-700 space-y-1 pl-1">
                             {exclusions.map((item, index) => {
                               let content = null;
                               if (typeof item === 'string') {
                                 content = item; // Handle plain strings
                               } else if (typeof item === 'object' && item !== null && item.otherDescription) {
                                 content = item.otherDescription; // Handle objects with otherDescription
                               }
                               // Render li only if content is valid
                               return content ? <li key={`exc-${index}`}>{content}</li> : null;
                             })}
                           </ul>
                         </div>
                       )}
                    </div>
                  )}

                  {/* NEW Section 5: Itinerary Details */}
                  {renderItineraryDetails()}

                  {/* Section 6: Cancellation Policy */} 
                  {cancellationPolicy && (
                     <div className="pt-4 border-t border-gray-100">
                       <SectionTitle icon={ExclamationTriangleIcon} title="Cancellation Policy" />
                       <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded border border-yellow-200 mt-1">
                         {typeof cancellationPolicy === 'object' && cancellationPolicy !== null && cancellationPolicy.description
                           ? cancellationPolicy.description
                           : String(cancellationPolicy)
                         }
                       </p>
                       {typeof cancellationPolicy === 'object' && cancellationPolicy !== null && cancellationPolicy.type && (
                         <p className="text-xs text-gray-500 mt-1">Type: <span className="font-medium">{cancellationPolicy.type}</span></p>
                       )}
                     </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
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

export default CrmActivityViewModal; 