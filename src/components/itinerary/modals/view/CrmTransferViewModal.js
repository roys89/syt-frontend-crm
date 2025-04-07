import { Dialog, Transition } from '@headlessui/react';
import { BriefcaseIcon, CheckCircleIcon, ClockIcon, InformationCircleIcon, MapPinIcon, TruckIcon, UserGroupIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { Fragment } from 'react';

// --- Helper Functions ---
const formatTransferType = (type) => {
    if (!type) return 'Transfer';
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        return 'Invalid Date';
    }
};
// --- End Helper Functions ---


// --- Reusable Sub-Components (Tailwind Styled) ---

const ModalSection = ({ icon: Icon, title, children }) => (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50/80 px-4 py-3 rounded-t-lg">
            {Icon && <Icon className="h-6 w-6 text-indigo-600" />}
            <h4 className="text-md font-semibold text-gray-800">{title}</h4>
        </div>
        <div className="p-4">
            {children}
        </div>
    </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-3 rounded-md border border-gray-100 bg-gray-50 p-3 transition hover:bg-gray-100">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
            <Icon className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-gray-800">{value || 'N/A'}</p>
        </div>
    </div>
);

const FeatureItem = ({ text }) => (
    <span className="mr-2 mb-2 inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800">
        <InformationCircleIcon className="h-4 w-4" />
        {text}
    </span>
);

const LocationInfoCard = ({ title, address, date }) => (
    <div className={`rounded-lg border p-4 shadow-sm transition hover:shadow-md ${title.toLowerCase().includes('pickup') ? 'border-indigo-200 bg-indigo-50/50' : 'border-purple-200 bg-purple-50/50'}`}>
        <div className="flex items-start gap-3">
            <div className={`mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${title.toLowerCase().includes('pickup') ? 'bg-indigo-100 text-indigo-600' : 'bg-purple-100 text-purple-600'}`}>
                <MapPinIcon className="h-5 w-5" />
            </div>
            <div>
                <h5 className={`mb-1 text-sm font-semibold ${title.toLowerCase().includes('pickup') ? 'text-indigo-700' : 'text-purple-700'}`}>{title}</h5>
                <p className="text-sm text-gray-700 mb-2">{address || 'Address not available'}</p>
                {date && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 border border-gray-200">
                        <ClockIcon className="h-3.5 w-3.5" />
                        <span>{date}</span>
                    </div>
                )}
            </div>
        </div>
    </div>
);

const ServiceStatusBadge = ({ included }) => (
    <div className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 ${included ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
        {included ? <CheckCircleIcon className="h-5 w-5" /> : <XCircleIcon className="h-5 w-5" />}
        <span className="text-sm font-medium">
            Meet & Greet: {included ? 'Included' : 'Not Included'}
        </span>
    </div>
);

// --- Main Modal Component ---

const CrmTransferViewModal = ({ isOpen, onClose, transferData }) => {

    if (!isOpen || !transferData) return null;

    // --- Safely Extract Data ---
    const details = transferData.details || {};
    const selectedQuote = details.selectedQuote || {};
    const quote = selectedQuote.quote || {};
    const vehicle = quote.vehicle || {};
    const vehicleImages = vehicle.vehicleImages || {};
    const routeDetails = selectedQuote.routeDetails || {};
    const origin = details.origin || {};
    const destination = details.destination || {};
    const transferType = transferData.type;
    const meetGreet = quote.meet_greet; // Can be 0 or 1, handle boolean conversion

    // --- End Data Extraction ---

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                {/* Backdrop */}
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
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
                            <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-gray-50 text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                                {/* Header */}
                                <div className="flex justify-between items-center p-4 sm:p-5 border-b border-gray-200 bg-white flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                                            <TruckIcon className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                                                {formatTransferType(transferType)} Details
                                            </Dialog.Title>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {vehicle.ve_class} - {vehicle.ve_similar_types || 'Similar'}
                                            </p>
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

                                    {/* Image Banner */}
                                    <div className="mb-6 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                                        {vehicleImages.ve_im_url ? (
                                            <img
                                                src={vehicleImages.ve_im_url}
                                                alt={vehicle.ve_similar_types || 'Vehicle'}
                                                className="w-full h-auto max-h-60 object-contain object-center"
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                                <TruckIcon className="h-20 w-20 opacity-50" />
                                                <p className="mt-2 text-sm">Image not available</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Vehicle Details Section */}
                                    <ModalSection icon={TruckIcon} title="Vehicle Details">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <InfoItem
                                                icon={UserGroupIcon}
                                                label="Capacity"
                                                value={`${vehicle.ve_max_capacity || 'N/A'} passengers`}
                                            />
                                            <InfoItem
                                                icon={BriefcaseIcon}
                                                label="Max Luggage"
                                                value={`${vehicle.ve_luggage_capacity || 'N/A'} pieces`}
                                            />
                                        </div>
                                        {vehicle.ve_tags && vehicle.ve_tags.length > 0 && (
                                            <div className="mt-4 pt-3 border-t border-gray-100">
                                                <h6 className="text-xs font-medium text-gray-500 mb-2">Features:</h6>
                                                <div className="flex flex-wrap">
                                                    {vehicle.ve_tags.map((tag, index) => tag && tag.trim() && (
                                                        <FeatureItem key={index} text={tag.trim()} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </ModalSection>

                                    {/* Journey Details Section */}
                                    <ModalSection icon={MapPinIcon} title="Journey Details">
                                        <div className="space-y-4">
                                            <LocationInfoCard
                                                title="Pickup Location"
                                                address={origin.display_address}
                                                date={routeDetails.pickup_date ? formatDateTime(routeDetails.pickup_date) : null}
                                            />
                                            <LocationInfoCard
                                                title="Drop-off Location"
                                                address={destination.display_address}
                                                date={null} // Drop off usually doesn't have a specific time here
                                            />
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                                <InfoItem
                                                    icon={UserGroupIcon}
                                                    label="Travelers"
                                                    value={details.totalTravelers}
                                                />
                                                <InfoItem
                                                    icon={MapPinIcon} // Could use a different icon for distance/duration
                                                    label="Est. Distance / Duration"
                                                    value={`${details.distance || 'N/A'} / ${details.duration ? details.duration + ' min' : 'N/A'}`}
                                                />
                                                {/* Optionally add Flight Number if available and relevant */}
                                                {details.flightNumber && (
                                                   <InfoItem
                                                        icon={InformationCircleIcon} // Placeholder icon
                                                        label="Flight Number"
                                                        value={details.flightNumber}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </ModalSection>

                                    {/* Additional Services Section */}
                                    {meetGreet !== undefined && meetGreet !== null && (
                                         <ModalSection icon={InformationCircleIcon} title="Additional Services">
                                             <ServiceStatusBadge included={!!meetGreet} />
                                         </ModalSection>
                                    )}

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

export default CrmTransferViewModal;