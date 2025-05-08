import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'react-hot-toast';

// --- Helper Functions (Copied from Hotel Voucher, adjust if needed) ---
const formatDateSimple = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateString) return 'N/A';
    try {
        // Handles both Date objects and YYYY-MM-DD strings
        const date = dateString instanceof Date ? dateString : new Date(`${dateString}T00:00:00`); // Assume UTC or local based on input
        if (isNaN(date.getTime())) return String(dateString); // Return original if invalid
        return date.toLocaleDateString('en-US', options);
    } catch (e) { return String(dateString); } // Fallback
};

const formatCurrencySimple = (amount, currency = 'INR') => {
    const num = Number(amount);
    if (amount === null || amount === undefined || isNaN(num)) return 'N/A';
    // Simple INR formatting, adjust if other currencies needed
    try {
         return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: currency, 
            minimumFractionDigits: 0, 
            maximumFractionDigits: 2 // Allow decimals for currency
        }).format(num);
    } catch (e) {
        // Fallback for unknown currency codes
        return `${currency} ${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
};

const formatTimeSimple = (timeString) => { // Expects HH:MM (24hr)
    if (!timeString || !/^([0-1]\d|2[0-3]):([0-5]\d)$/.test(timeString)) return 'N/A';
    try {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);
        // Format to 12-hour clock with AM/PM
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        return timeString; // Fallback
    }
};
// --- END Helper Functions ---


// --- Map payment status (from live data) ---
const mapPaymentStatus = (status) => {
  switch (status) {
    case 1: return 'Paid'; // Assuming 1 means paid
    case 0: return 'Pending'; // Assuming 0 means pending
    // Add other statuses if known
    default: return 'Unknown';
  }
}

// --- PDF Content Component ---
// Updated to handle LIVE data structure from getTransferBookingDetails
// voucherData is expected to be the INNERMOST `data` object 
// (i.e., response.data.data)
const PdfTransferVoucherContent = ({ voucherData, providerBookingRef, bookingStatus = 'Unknown' }) => {
    if (!voucherData || typeof voucherData !== 'object') {
        console.error("[PDF Content] Invalid or missing voucherData (expected innermost data object):", voucherData);
        return <div className="p-4 text-red-500 text-xs">Error: Invalid data for PDF rendering.</div>;
    }
    const {
        guest_name = 'N/A',
        guest_email = 'N/A',
        guest_phone = 'N/A',
        notes = null,
        total = 0,
        currency = 'INR',
        payment_status = null, // Numeric status
        booking_date = null,
        booking_time = null,
        passengers = 0,
        from = 'N/A', // Pickup address
        to = 'N/A', // Dropoff address
        created_date = null, // Use this instead of createdAt
        vehicle = {}, // Nested vehicle object
        operator_details = null // Add operator details
    } = voucherData;

    const { 
        class: vehicle_class = 'N/A', 
        capacity: vehicle_capacity = 'N/A' 
    } = vehicle;
    
    // Only map payment status, use passed bookingStatus for booking status
    const displayPaymentStatus = mapPaymentStatus(payment_status);
    
    // Get operator phone if available
    const operatorPhone = operator_details?.phone || 'Not assigned';

    return (
        <div className="p-6 font-sans text-gray-800 bg-white w-[210mm] min-h-[297mm] text-[10px]">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#093923] pb-4 mb-4">
                <div className="flex items-center">
                    <img 
                        src="/assets/logo/SYT-Logo.png" 
                        alt="Sort Your Trip Logo" 
                        className="h-12 w-auto mr-3" 
                        crossOrigin="anonymous" 
                    />
                    <div>
                        <h1 className="text-lg font-serif font-bold text-[#093923]">Transfer Booking Voucher</h1>
                        <p className="text-[9px] text-gray-500 mt-1">
                            Generated: {formatDateSimple(new Date(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="text-[9px] text-right">
                    {/* Use providerBookingRef passed from modal */}
                    <p>Booking Ref: <span className="font-semibold">{providerBookingRef || 'N/A'}</span></p> 
                    <p>Status: <span className={`font-semibold ${bookingStatus === 'Confirmed' ? 'text-[#13804e]' : 'text-orange-600'}`}>{bookingStatus}</span></p>
                    <p>Booked On: <span className="font-semibold">{formatDateSimple(created_date)}</span></p>
                </div>
            </div>

            {/* Transfer Details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-1 pr-4 border-r border-[#e6f0ea]">
                    <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Pickup Details</h2>
                    <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                        <p className="font-medium mb-1">{from}</p>
                        <p><strong>Date:</strong> {formatDateSimple(booking_date)}</p>
                        {/* booking_time includes seconds, formatTimeSimple expects HH:MM */}
                        <p><strong>Time:</strong> {formatTimeSimple(booking_time?.substring(0, 5))}</p> 
                        <p><strong>Driver Contact:</strong> {operatorPhone}</p>
                    </div>
                </div>
                <div className="col-span-1">
                     <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Dropoff Details</h2>
                     <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                         <p className="font-medium mb-1">{to}</p>
                         <p className="text-gray-500 mt-1">Please verify dropoff details with the driver.</p>
                    </div>
                </div>
            </div>

            {/* Vehicle Details */}
            <div className="mb-4">
                 <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Vehicle Details</h2>
                 <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea] text-[9px]">
                    <p><strong>Type:</strong> {vehicle_class}</p>
                    <p><strong>Capacity:</strong> {vehicle_capacity ? `${vehicle_capacity} passengers` : 'N/A'}</p>
                </div>
            </div>

            {/* Guest Information */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Guest Information</h2>
                <div className="shadow-sm rounded-lg bg-[#e6f0ea] p-3">
                    <table className="w-full border-collapse text-[9px]">
                        <thead>
                            <tr className="bg-[#2a9d6b] text-white">
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Name</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Email</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Phone</th>
                                <th className="border border-[#e6f0ea] p-2 text-center font-medium">Passengers</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className='bg-white border-b border-[#e6f0ea] last:border-b-0 hover:bg-[#2a9d6b]/10'>
                                {/* guest_name is full name */}
                                <td className="border-r border-[#e6f0ea] p-2">{guest_name} <span className="text-[#13804e] font-medium">(Lead)</span></td> 
                                <td className="border-r border-[#e6f0ea] p-2">{guest_email || '-'}</td>
                                <td className="border-r border-[#e6f0ea] p-2">{guest_phone || '-'}</td>
                                <td className="p-2 text-center">{passengers || 'N/A'}</td>
                            </tr>
                        </tbody>
                    </table>
                     {/* Use notes from live data */}
                     {notes && (
                         <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-[9px]">
                             <strong>Guest Notes:</strong> {notes}
                         </div>
                     )}
                </div>
            </div>

            {/* Pricing Summary */}
            <div className="mb-4 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Pricing Summary</h2>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-gray-700">Total Booking Amount:</span>
                    <span className="font-bold text-base text-[#13804e]">
                        {/* Use total and currency from live data */}
                        {formatCurrencySimple(total, currency)} 
                    </span>
                </div>
                 <p className="text-[9px] text-gray-600 mt-1">Payment Status: <span className="font-medium">{displayPaymentStatus}</span></p>
            </div>

            {/* Cancellation Policy / Terms */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Important Information</h2>
                <div className="text-[9px] text-gray-600 space-y-1 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                    {/* Extract policy from providerBookingResponse if needed, or add static text */}
                    <p>• Please verify your pickup time and location. Contact support for any changes.</p>
                    <p>• Cancellation policy may apply. Refer to terms provided during booking or contact Sort Your Trip.</p>
                    <p>• Waiting time charges may apply for delays.</p>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-3 border-t border-[#093923] text-[8px] text-[#07261a] text-center">
                <p className="font-semibold">Sort Your Trip Pvt. Ltd.</p>
                <p>Contact: support@sortyourtrip.com | Phone: +91-123-456-7890</p>
                <p>Emergency Contact: [Add Emergency Number Here]</p>
                <p>This voucher is computer generated. Please present this voucher (digital or print) if requested.</p>
            </div>
        </div>
    );
};
// --- END PDF Content Component ---


// --- Main Modal Component ---
// Receives `transferVoucherDetails` which is the OUTER `response.data` object
const TransferBookingVoucherModal = ({ isOpen, onClose, transferVoucherDetails, providerBookingRef }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleDownloadPDF = async () => {
        // `transferVoucherDetails` is the OUTER `response.data` object
        // Extract the INNERMOST data object for the PDF content
        const detailsForPdf = transferVoucherDetails?.data; 
        const providerIdForFilename = providerBookingRef || 'Booking'; // Use prop or fallback

        if (!detailsForPdf) {
            toast.error('Live voucher details (inner data) not found for PDF generation.');
            console.error('[PDF Gen] Missing inner data within transferVoucherDetails:', transferVoucherDetails);
            return;
        }
        setIsLoading(true);
        console.log('[PDF Gen] Starting Transfer Voucher PDF Generation (Live Data)...');
        console.log('[PDF Gen] Details for PDF Component:', detailsForPdf);

        // Create hidden container for rendering
        const containerId = `pdf-render-container-${Date.now()}`;
        let container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0px';
        container.style.width = '210mm'; // A4 width
        container.style.zIndex = '-10';
        document.body.appendChild(container);

        let root;
        try {
            // Render the PDF content component in the hidden container
            root = createRoot(container);
            // Pass the INNERMOST data and providerRefId to the PDF content
            await root.render(<PdfTransferVoucherContent 
                voucherData={detailsForPdf} 
                providerBookingRef={providerIdForFilename}
                bookingStatus={transferVoucherDetails?.status ? 'Confirmed' : 'Unknown'} 
            />); 
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for render

            // Capture with html2canvas
            const canvas = await html2canvas(container, {
                scale: 2.5, 
                useCORS: true, 
                logging: false, // Reduce console noise
                width: container.offsetWidth, 
                height: container.offsetHeight, 
                windowWidth: container.scrollWidth, 
                windowHeight: container.scrollHeight, 
                backgroundColor: '#ffffff', 
                imageTimeout: 15000,
                 onclone: (clonedDoc) => {
                    const containerClone = clonedDoc.querySelector('#' + containerId);
                    if (containerClone) {
                        containerClone.style.position = 'static';
                        containerClone.style.width = '210mm';
                    }
                }
            });

            // Generate PDF with jsPDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
            // Add image slightly inset for better margins
            const imgX = (pdfWidth - (imgProps.width * ratio)) / 2;
            const imgY = imgX > 5 ? 5 : imgX; // Add small top margin if possible
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgProps.width * ratio, imgProps.height * ratio);

            // Save PDF
            const fileName = `Transfer_Voucher_${providerIdForFilename}.pdf`;
            pdf.save(fileName);
            toast.success(`Voucher PDF "${fileName}" downloaded!`);

        } catch (error) {
            console.error('[PDF Gen] Error during PDF generation process:', error);
            toast.error(`PDF Generation Failed: ${error.message || 'Check console for details.'}`);
        } finally {
            // Cleanup
            if (root) {
                try { root.unmount(); } catch (e) { /* ignore */ }
            }
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
            }
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    // Extract INNERMOST live data for preview
    // Corrected path: Access .data from the transferVoucherDetails (which is response.data)
    const liveDataForPreview = transferVoucherDetails?.data; 

    // Loading/Error state check based on INNERMOST data
    if (!liveDataForPreview) {
         return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-[9999]">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                    {/* Updated error message */}
                    <p className="text-center text-red-600">Error: Live voucher details not loaded or invalid structure (details missing within response data).</p>
                    <Button onClick={onClose} block className="mt-4">Close</Button>
                </div>
            </div>
        );
    }
    
    // Get booking status directly from transferVoucherDetails.status
    const bookingStatus = transferVoucherDetails?.status ? 'Confirmed' : 'Unknown';
    const previewPaymentStatus = mapPaymentStatus(liveDataForPreview.payment_status);
    // Get operator phone if available
    const operatorPhone = liveDataForPreview.operator_details?.phone || 'Not assigned';

    // --- Main Modal Structure --- 
    return (
        <div className="fixed inset-0 overflow-y-auto z-[9999]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white w-full max-w-4xl rounded-lg shadow-xl p-5 relative overflow-hidden max-h-[95vh] flex flex-col">
                    {/* Header */}
                    <div className="flex-shrink-0 flex items-start justify-between mb-4 border-b pb-3">
                         <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Transfer Voucher (Live Details)</h2>
                            <p className="text-xs text-gray-600">
                                {/* Use the providerBookingRef prop */}
                                Booking Ref: <span className="font-medium text-gray-800">{providerBookingRef || 'N/A'}</span> 
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <Button 
                                type="primary" 
                                style={{ backgroundColor: '#13804e', borderColor: '#13804e' }}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>}
                                onClick={handleDownloadPDF} 
                                disabled={isLoading}
                                loading={isLoading}
                                size="middle"
                            >
                                {isLoading ? 'Generating...' : 'Download PDF'}
                            </Button>
                            <button
                                onClick={onClose}
                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700" 
                                disabled={isLoading}
                                title="Close"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content Area - Displays a preview/summary based on INNERMOST LIVE data */}
                    <div className="flex-grow overflow-y-auto pr-2 -mr-2 text-sm">
                         {/* Use liveDataForPreview for preview */}
                         <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Journey Summary</h3>
                            <p><strong>From:</strong> {liveDataForPreview.from}</p>
                            <p><strong>To:</strong> {liveDataForPreview.to}</p>
                            <p><strong>Date:</strong> {formatDateSimple(liveDataForPreview.booking_date)}</p>
                            <p><strong>Time:</strong> {formatTimeSimple(liveDataForPreview.booking_time?.substring(0, 5))}</p>
                            <p><strong>Vehicle:</strong> {liveDataForPreview.vehicle?.class} ({liveDataForPreview.vehicle?.capacity} passengers)</p>
                            <p><strong>Driver Contact:</strong> {operatorPhone}</p>
                         </div>
                         
                          <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Lead Guest</h3>
                            <p><strong>Name:</strong> {liveDataForPreview.guest_name}</p>
                            <p><strong>Contact:</strong> {liveDataForPreview.guest_email} / {liveDataForPreview.guest_phone}</p>
                            <p><strong>Passengers:</strong> {liveDataForPreview.passengers}</p>
                            {/* Flight number not in example live data */} 
                         </div>
                         
                         <div className="p-4 mb-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-base mb-2 text-gray-800">Payment & Status</h3>
                            <p><strong>Total Fare:</strong> {formatCurrencySimple(liveDataForPreview.total, liveDataForPreview.currency)}</p>
                            <p><strong>Payment Status:</strong> <span className={`font-medium ${previewPaymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>{previewPaymentStatus}</span></p>
                            <p><strong>Booking Status:</strong> <span className={`font-medium ${bookingStatus === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>{bookingStatus}</span></p>
                         </div>

                          <div className="p-4 mb-4 bg-yellow-50 rounded-lg border border-yellow-200 text-xs">
                             <h3 className="font-semibold text-sm mb-1 text-yellow-800">Note</h3>
                             <p className="text-yellow-700">This is a preview based on live booking data. The downloaded PDF will contain the official voucher format.</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferBookingVoucherModal; 