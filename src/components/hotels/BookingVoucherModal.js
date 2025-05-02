import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from 'antd';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { toast } from 'react-hot-toast';

// --- Helper Functions (Moved to Top Level) ---

/** Minimal date formatter */
const formatDateSimple = (dateString, options = { year: 'numeric', month: 'short', day: 'numeric' }) => {
    if (!dateString) return 'N/A';
    try {
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) {
            console.warn('[Modal Date Format] Invalid date:', dateString);
            return String(dateString);
        }
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('[Modal Date Format] Error:', e);
        return String(dateString);
    }
};

/** Minimal currency formatter */
const formatCurrencySimple = (amount) => {
    const num = Number(amount);
    if (amount === null || amount === undefined || isNaN(num)) return 'N/A';
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

/** Minimal HTML stripper */
const stripHtmlSimple = (htmlString) => {
    if (!htmlString) return '';
    try {
        let text = String(htmlString)
            .replace(/<p>/gi, '\n').replace(/<\/p>/gi, '\n')
            .replace(/<li>/gi, '\n • ').replace(/<\/li>/gi, '')
            .replace(/<br\s*\/?>/gi, '\n');
        if (typeof document !== 'undefined') {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = text;
            text = tempDiv.textContent || tempDiv.innerText || '';
        } else {
            text = text.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        }
        text = text.replace(/<[^>]*>/g, '');
        return text.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim();
    } catch (error) {
        console.error('[Modal Strip HTML] Error:', error);
        return String(htmlString);
    }
};

/** Component to render the PDF content structure (Moved to Top Level) */
const PdfVoucherContent = ({ voucherData }) => {
    if (!voucherData?.hotel) {
        return <div className="p-4 text-red-500 text-xs">Error: Missing data for PDF rendering.</div>;
    }

    const { 
        hotel = {},
        guests = [],
        rooms = [],
        pricing = {},
        bookingId = 'N/A',
        confirmationNumber = 'N/A',
        status = 'N/A',
        checkInDate = 'N/A',
        checkOutDate = 'N/A',
        nightsCount = 'N/A',
        checkInTime = 'N/A',
        checkOutTime = 'N/A',
        specialRequests = '',
        cancellationPolicies = [],
        includes = [],
    } = voucherData;

    return (
        <div className="p-6 font-sans text-gray-800 bg-white w-[210mm] min-h-[297mm] text-[10px]">
            {/* --- Header with Logo --- */}
            <div className="flex justify-between items-center border-b-2 border-[#093923] pb-4 mb-4">
                <div className="flex items-center">
                    <img 
                        src="/assets/logo/SYT-Logo.png" 
                        alt="Sort Your Trip Logo" 
                        className="h-12 w-auto mr-3" 
                        crossOrigin="anonymous" 
                    />
                    <div>
                        <h1 className="text-lg font-serif font-bold text-[#093923]">Hotel Booking Voucher</h1>
                        <p className="text-[9px] text-gray-500 mt-1">
                            Generated: {formatDateSimple(new Date(), { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
                <div className="text-[9px] text-right">
                    <p>Booking Ref: <span className="font-semibold">{bookingId}</span></p>
                    {confirmationNumber && confirmationNumber !== 'N/A' && <p>Provider Conf: <span className="font-semibold">{confirmationNumber}</span></p>}
                    <p>Status: <span className="font-semibold text-[#13804e]">{status}</span></p>
                </div>
            </div>

            {/* --- Hotel & Stay Details --- */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="col-span-2 pr-4 border-r border-[#e6f0ea]">
                    <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Hotel Information</h2>
                    <div className="flex gap-3 shadow-sm p-3 rounded-lg bg-[#e6f0ea]">
                        {hotel.heroImageUrl && (
                            <div className="w-16 h-16 flex-shrink-0 border rounded overflow-hidden bg-gray-100">
                                <img src={hotel.heroImageUrl} alt={hotel.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                            </div>
                        )}
                        <div>
                            <h3 className="font-bold text-sm mb-1">{hotel.name}</h3>
                            {hotel.starRating > 0 && (
                                <p className="text-[9px] text-yellow-500 mb-1">
                                    {'★'.repeat(hotel.starRating)}
                                    <span className="text-gray-500 ml-1">({hotel.starRating}-Star)</span>
                                </p>
                            )}
                            <p className="text-[9px] text-gray-600 mb-1">{hotel.address}</p>
                            <p className="text-[9px] text-gray-600">Phone: {hotel.phone || 'N/A'}</p>
                            <p className="text-[9px] text-gray-600">Email: {hotel.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>
                <div className="col-span-1">
                    <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Stay Details</h2>
                    <div className="shadow-sm p-3 rounded-lg bg-[#e6f0ea]">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-white p-2 rounded border border-[#e6f0ea]">
                                <p className="text-[8px] font-medium text-gray-700">Check-in</p>
                                <p className="font-semibold text-[9px]">{checkInDate}</p>
                                <p className="text-[8px] text-gray-500">{checkInTime !== 'N/A' ? `After ${checkInTime}` : ''}</p>
                            </div>
                            <div className="bg-white p-2 rounded border border-[#e6f0ea]">
                                <p className="text-[8px] font-medium text-gray-700">Check-out</p>
                                <p className="font-semibold text-[9px]">{checkOutDate}</p>
                                <p className="text-[8px] text-gray-500">{checkOutTime !== 'N/A' ? `Before ${checkOutTime}` : ''}</p>
                            </div>
                        </div>
                        <p className="text-[9px] text-center text-gray-600">{nightsCount} Night{nightsCount !== 1 ? 's' : ''}</p>
                        {specialRequests && (
                            <div className="mt-2">
                                <p className="text-[9px] font-medium text-gray-700">Special Requests:</p>
                                <p className="text-[9px] text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-200 whitespace-pre-wrap break-words">{specialRequests}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Guest Information --- */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Guest Information</h2>
                <div className="shadow-sm rounded-lg bg-[#e6f0ea] p-3">
                    <table className="w-full border-collapse text-[9px] border border-[#e6f0ea]">
                        <thead>
                            <tr className="bg-[#2a9d6b] text-white">
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Name</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Type</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Email</th>
                                <th className="border border-[#e6f0ea] p-2 text-left font-medium">Phone</th>
                            </tr>
                        </thead>
                        <tbody>
                            {guests && guests.length > 0 ? guests.map((guest, index) => (
                                <tr key={index} className={`${guest.isLead ? 'bg-[#e6f0ea]' : 'bg-white'} border-b border-[#e6f0ea] last:border-b-0 hover:bg-[#2a9d6b]/10`}>
                                    <td className="border-r border-[#e6f0ea] p-2">{guest.name} {guest.isLead ? <span className="text-[#13804e] font-medium">(Lead)</span> : ''}</td>
                                    <td className="border-r border-[#e6f0ea] p-2">{guest.type}</td>
                                    <td className="border-r border-[#e6f0ea] p-2">{guest.email || '-'}</td>
                                    <td className="p-2">{guest.phone || '-'}</td>
                                </tr>
                            )) : (
                                <tr className="bg-white"><td colSpan="4" className="p-2 text-center text-gray-500 italic">No guest details provided.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Room & Rate Details --- */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Room & Rate Details</h2>
                <div className="shadow-sm rounded-lg bg-[#e6f0ea] p-3">
                    {rooms && rooms.length > 0 ? rooms.map((room, index) => (
                        <div key={index} className="mb-3 p-3 border rounded-lg bg-white text-[9px] shadow-sm">
                            <h3 className="font-semibold text-[10px] mb-2">Room {rooms.length > 1 ? index + 1 : ''}: {room.name}</h3>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <p><strong>Occupancy:</strong> {room.occupancy}</p>
                                    <p><strong>Board Basis:</strong> {room.boardBasis}</p>
                                    <p><strong>Bed Info:</strong> {room.bedInfo}</p>
                                </div>
                                <div>
                                    <p><strong>Base Rate:</strong> {room.baseRate}</p>
                                    <p><strong>Total Tax:</strong> {room.taxAmount}</p>
                                    <p className="font-semibold"><strong>Room Total:</strong> {room.finalRate}</p>
                                </div>
                                <div>
                                    <p><strong>Policy:</strong> <span className={`${room.cancellationPolicy?.isRefundable ? 'text-[#13804e]' : 'text-red-600'}`}>{room.cancellationPolicy?.isRefundable ? 'Refundable' : 'Non-refundable'}</span></p>
                                    {room.cancellationPolicy?.rules && room.cancellationPolicy.rules.length > 0 && (
                                        <ul className="list-disc list-inside text-[8px] pl-2">
                                            {room.cancellationPolicy.rules.map((rule, rIndex) => (
                                                <li key={rIndex}>{rule.chargeDescription} ({rule.applicableFrom} - {rule.applicableTo})</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 italic text-[9px]">No room details available.</p>
                    )}
                </div>
            </div>

            {/* --- Pricing Summary --- */}
            <div className="mb-4 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Pricing Summary</h2>
                <div className="flex justify-between items-center text-[10px]">
                    <span className="font-medium text-gray-700">Total Booking Amount:</span>
                    <span className="font-bold text-base text-[#13804e]">{pricing.totalAmount}</span>
                </div>
                <p className="text-[8px] text-gray-600 mt-1">(Base: {pricing.totalBase}, Taxes: {pricing.totalTaxes})</p>
            </div>

            {/* --- Cancellation Policies --- */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Cancellation Policies</h2>
                <div className="text-[9px] text-gray-600 space-y-1 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                    {cancellationPolicies.length > 0 ? (
                        cancellationPolicies.map((policy, index) => (
                            <div key={index}>
                                {policy.rules.map((rule, rIndex) => (
                                    <p key={rIndex}>
                                        • {rule.valueType === 'Nights' ? `${rule.value} night(s)` : formatCurrencySimple(rule.estimatedValue ?? rule.value)} charge ({formatDateSimple(rule.start)} - {formatDateSimple(rule.end)})
                                    </p>
                                ))}
                            </div>
                        ))
                    ) : (
                        <p className="italic text-gray-500">No cancellation policy details available.</p>
                    )}
                </div>
            </div>

            {/* --- Hotel Policies --- */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Hotel Policies</h2>
                <div className="text-[9px] text-gray-600 space-y-1 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                    {hotel.policies && Object.keys(hotel.policies).length > 0 ? (
                        Object.entries(hotel.policies).map(([key, value], index) => (
                            <p key={index}><strong>{key}:</strong> {value}</p>
                        ))
                    ) : (
                        <p className="italic text-gray-500">Standard hotel policies apply. Please confirm with hotel.</p>
                    )}
                </div>
            </div>

            {/* --- Inclusions --- */}
            <div className="mb-4">
                <h2 className="text-xs font-serif font-semibold mb-2 text-[#093923]">Inclusions</h2>
                <div className="text-[9px] text-gray-600 space-y-1 p-3 border rounded-lg bg-[#e6f0ea] shadow-sm">
                    {includes.length > 0 ? (
                        <ul className="list-disc list-inside">
                            {includes.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="italic text-gray-500">No additional inclusions specified.</p>
                    )}
                </div>
            </div>

            {/* --- Footer --- */}
            <div className="mt-4 pt-3 border-t border-[#093923] text-[8px] text-[#07261a] text-center">
                <p className="font-semibold">Sort Your Trip Pvt. Ltd.</p>
                <p>Contact: support@sortyourtrip.com | Phone: +91-123-456-7890</p>
                <p>This voucher is computer generated. Please contact Sort Your Trip for any assistance.</p>
            </div>
        </div>
    );
};

const BookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [activeImageCategory, setActiveImageCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const pdfContentRef = useRef(null);

    const responseData = voucherDetails?.data || voucherDetails;
    const crmBookingRefId = voucherDetails?.crmBookingRefId;
    const results = responseData?.results;
    const hotelItinerary = results?.hotel_itinerary?.[0];
    const staticContent = hotelItinerary?.staticContent?.[0];
    const guestCollectionData = results?.guestCollectionData?.[0] || hotelItinerary?.guestCollectionData?.[0];
    const status = results?.status;
    const confirmationNumber = results?.providerConfirmationNumber;
    const specialRequests = results?.specialRequests;
    const selectedRoomsAndRates = hotelItinerary?.items?.[0]?.selectedRoomsAndRates || [];
    const checkIn = hotelItinerary?.searchRequestLog?.checkIn;
    const checkOut = hotelItinerary?.searchRequestLog?.checkOut;
    const totalAmount = hotelItinerary?.totalAmount;
    const fallbackBookingRefId = hotelItinerary?.bookingRefId;
    const bookingRefId = crmBookingRefId || fallbackBookingRefId;
    const firstRatePolicies = selectedRoomsAndRates[0]?.rate?.policies || [];

    useEffect(() => {
        if (isOpen) {
            console.log('BookingVoucherModal Data:', { responseData, hotelItinerary, staticContent });
            setActiveTab('summary');
        }
    }, [isOpen, responseData, hotelItinerary, staticContent]);

    useEffect(() => {
        if (staticContent?.imagesAndCaptions) {
            const categories = Object.keys(staticContent.imagesAndCaptions);
            if (categories.length > 0) {
                setActiveImageCategory(categories[0]);
            }
        }
    }, [staticContent]);

    const fetchImageAsDataURL = async (url) => {
        if (!url || !url.startsWith('http')) {
            console.log('[PDF Image Fetch] Skipping fetch for non-HTTP URL:', url);
            return url;
        }
        console.log(`[PDF Image Fetch] Attempting to fetch image: ${url}`);
        try {
            const response = await fetch(url, { mode: 'cors' });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.warn(`[PDF Image Fetch] Failed to fetch image as Data URL (${url}):`, error.message);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        if (!responseData || !hotelItinerary || !staticContent) {
            toast.error('Voucher data is not complete for PDF generation.');
            console.error('[PDF Gen Abort] Missing critical data:', { responseData, hotelItinerary, staticContent });
            return;
        }
        setIsLoading(true);
        console.log('[PDF Gen] Starting PDF Generation...');

        let transformedData = {};
        let finalHeroImageUrl = null;
        let finalLogoUrl = null;
        try {
            console.log('[PDF Gen] Transforming data...');

            const simplePolicies = {};
            firstRatePolicies.forEach(p => {
                if (p.type === 'Check-in' || p.type === 'Check-out') {
                    simplePolicies[p.type.replace('-', ' ')] = stripHtmlSimple(p.text);
                } else {
                    simplePolicies[p.type.replace(/([A-Z])/g, ' $1').trim()] = stripHtmlSimple(p.text);
                }
            });
            if (!simplePolicies['Check In'] && staticContent?.checkinInfo?.beginTime) {
                simplePolicies['Check In'] = `From ${staticContent.checkinInfo.beginTime}`;
            }
            if (!simplePolicies['Check Out'] && staticContent?.checkoutInfo?.time) {
                simplePolicies['Check Out'] = `Before ${staticContent.checkoutInfo.time}`;
            }

            let originalHeroImageUrl = staticContent?.heroImage;
            if (!originalHeroImageUrl && staticContent?.images?.length > 0 && staticContent.images[0].links) {
                originalHeroImageUrl = staticContent.images[0].links.find(link => link.size === "Standard")?.url
                    || staticContent.images[0].links[0].url;
            }
            finalHeroImageUrl = await fetchImageAsDataURL(originalHeroImageUrl);

            // Fetch logo as Data URL
            const logoUrl = '/assets/logo/SYT-Logo.png';
            finalLogoUrl = await fetchImageAsDataURL(logoUrl);

            transformedData = {
                bookingId: bookingRefId || confirmationNumber || 'N/A',
                confirmationNumber: confirmationNumber || 'N/A',
                status: status || 'Confirmed',
                checkInDate: formatDateSimple(checkIn),
                checkOutDate: formatDateSimple(checkOut),
                nightsCount: checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))) : 'N/A',
                checkInTime: simplePolicies['Check In']?.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)?.[0] || staticContent?.checkinInfo?.beginTime || 'N/A',
                checkOutTime: simplePolicies['Check Out']?.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i)?.[0] || staticContent?.checkoutInfo?.time || 'N/A',
                specialRequests: (specialRequests && String(specialRequests).toLowerCase() !== 'null') ? String(specialRequests).trim() : '',
                cancellationPolicies: selectedRoomsAndRates[0]?.rate?.cancellationPolicies || [],
                includes: selectedRoomsAndRates[0]?.rate?.includes || [],
                hotel: {
                    name: staticContent?.name || 'N/A',
                    starRating: parseInt(staticContent?.starRating || '0', 10),
                    address: staticContent?.contact?.address ? `${staticContent.contact.address.line1 || ''}, ${staticContent.contact.address.city?.name || ''}, ${staticContent.contact.address.country?.name || ''}`.replace(/^,|, $|, ,/g, '').trim() : 'N/A',
                    phone: staticContent?.contact?.phones?.join(' / ') || 'N/A',
                    email: staticContent?.contact?.email || 'N/A',
                    heroImageUrl: finalHeroImageUrl,
                    policies: simplePolicies,
                },
                guests: (guestCollectionData?.guests || []).map((g, index) => ({
                    name: `${g.title || ''} ${g.firstName || ''} ${g.lastName || ''}`.trim(),
                    isLead: g.isLeadGuest || (index === 0 && guestCollectionData?.guests?.length === 1),
                    type: g.type ? g.type.charAt(0).toUpperCase() + g.type.slice(1) : 'Adult',
                    email: g.additionaldetail?.email || g.hms_guestadditionaldetail?.email || '',
                    phone: g.additionaldetail?.contactNumber ? `+${g.additionaldetail.isdCode || ''} ${g.additionaldetail.contactNumber}`.trim() : (g.hms_guestadditionaldetail?.contactNumber ? `+${g.hms_guestadditionaldetail.isdCode || ''} ${g.hms_guestadditionaldetail.contactNumber}`.trim() : ''),
                })).filter(g => g.name && g.name.trim() !== ''),
                rooms: selectedRoomsAndRates.map(rr => {
                    const rate = rr.rate || {};
                    const room = rr.room || {};
                    const cancellationRules = rate.cancellationPolicies?.[0]?.rules || [];
                    return {
                        name: room.name || 'N/A',
                        occupancy: `${rr.occupancy?.adults || 0} Adt` + (rr.occupancy?.childAges?.length > 0 ? ` ${rr.occupancy.childAges.length} Chd` : ''),
                        boardBasis: rate.boardBasis?.description || 'N/A',
                        bedInfo: (room.beds || []).map(b => `${b.count} ${b.type}`).join(', ') || 'N/A',
                        baseRate: formatCurrencySimple(rate.baseRate),
                        taxAmount: formatCurrencySimple(rate.taxAmount),
                        finalRate: formatCurrencySimple(rate.finalRate),
                        cancellationPolicy: {
                            isRefundable: rate.isRefundable ?? false,
                            rules: cancellationRules.map(rule => ({
                                chargeDescription: rule.valueType === 'Nights' ? `${rule.value} night(s)` : formatCurrencySimple(rule.estimatedValue ?? rule.value),
                                applicableFrom: formatDateSimple(rule.start),
                                applicableTo: formatDateSimple(rule.end),
                            }))
                        }
                    };
                }),
                pricing: {
                    totalAmount: formatCurrencySimple(totalAmount),
                    totalBase: formatCurrencySimple(selectedRoomsAndRates.reduce((sum, rr) => sum + (Number(rr.rate?.baseRate) || 0), 0)),
                    totalTaxes: formatCurrencySimple(selectedRoomsAndRates.reduce((sum, rr) => sum + (Number(rr.rate?.taxAmount) || 0), 0)),
                    currency: selectedRoomsAndRates[0]?.rate?.currency || 'INR',
                },
            };
            console.log('[PDF Gen] Transformation Complete:', transformedData);
        } catch (transformError) {
            console.error('[PDF Gen] Error during data transformation:', transformError);
            toast.error('Failed to prepare data for PDF.');
            setIsLoading(false);
            return;
        }

        const containerId = `pdf-render-container-${Date.now()}`;
        let container = document.createElement('div');
        container.id = containerId;
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0px';
        container.style.width = '210mm';
        container.style.zIndex = '-10';
        document.body.appendChild(container);
        console.log('[PDF Gen] Hidden container created and appended.');

        let root;
        try {
            console.log('[PDF Gen] Rendering React component for PDF...');
            root = createRoot(container);
            await root.render(<PdfVoucherContent voucherData={transformedData} />);
            console.log('[PDF Gen] React render completed (async). Waiting for styles/images...');
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('[PDF Gen] Delay finished. Proceeding to canvas capture.');

            console.log('[PDF Gen] Capturing with html2canvas...');
            container.classList.add('pdf-render-source');

            const canvas = await html2canvas(container, {
                scale: 2.5,
                useCORS: true,
                logging: true,
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
                        containerClone.style.left = '0px';
                        containerClone.style.top = '0px';
                        containerClone.style.width = '210mm';
                    }
                }
            });
            console.log('[PDF Gen] html2canvas capture complete.');

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'p', unit: 'mm', format: 'a4'
            });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = imgProps.width;
            const imgHeight = imgProps.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const imgFinalWidth = imgWidth * ratio;
            const imgFinalHeight = imgHeight * ratio;
            const imgX = (pdfWidth - imgFinalWidth) / 2;
            const imgY = 0;
            pdf.addImage(imgData, 'PNG', imgX, imgY, imgFinalWidth, imgFinalHeight);
            console.log('[PDF Gen] jsPDF document created.');

            const fileName = `Hotel_Voucher_${transformedData.bookingId || 'Booking'}.pdf`;
            pdf.save(fileName);
            toast.success(`Voucher PDF "${fileName}" downloaded!`);
        } catch (error) {
            console.error('[PDF Gen] Error during PDF generation process:', error);
            toast.error(`PDF Generation Failed: ${error.message || 'Check console for details.'}`);
        } finally {
            console.log('[PDF Gen] Cleaning up...');
            if (root) {
                try {
                    root.unmount();
                    console.log('[PDF Gen] React component unmounted.');
                } catch (unmountError) {
                    console.error('[PDF Gen] Error unmounting React root:', unmountError);
                }
            }
            if (container && document.body.contains(container)) {
                document.body.removeChild(container);
                console.log('[PDF Gen] Hidden container removed.');
            }
            setIsLoading(false);
            console.log('[PDF Gen] PDF Generation Finished.');
        }
    };

    if (!isOpen) return null;
    if (!responseData || !results || !hotelItinerary || !staticContent) {
        return (
            <div className="fixed inset-0 overflow-y-auto z-[9999]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="bg-white w-full max-w-3xl rounded-lg shadow-xl p-5 relative flex flex-col">
                        <div className="flex-shrink-0 flex items-center justify-between mb-4 border-b pb-3">
                            <h2 className="text-xl font-bold text-gray-900">Booking Voucher</h2>
                            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full" title="Close">
                                <XMarkIcon className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>
                        <div className="flex-grow p-4 text-center">
                            <p className="text-red-500 font-medium">Voucher details could not be loaded or are incomplete.</p>
                            <p className="text-sm text-gray-500 mt-2">Please close and try again, or contact support.</p>
                        </div>
                        <div className="flex-shrink-0 mt-6 text-right border-t pt-3">
                            <Button onClick={onClose}>Close</Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const uiCheckInDate = formatDateSimple(checkIn);
    const uiCheckOutDate = formatDateSimple(checkOut);
    const uiTotalAmount = formatCurrencySimple(totalAmount);
    const uiNights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))) : 'N/A';

    return (
        <div className="fixed inset-0 overflow-y-auto z-[9999]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="bg-white w-full max-w-6xl rounded-lg shadow-xl p-4 relative overflow-hidden max-h-[95vh] flex flex-col">
                    <div className="flex-shrink-0 flex items-start justify-between mb-4 border-b pb-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-1">Hotel Voucher</h2>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                                <span>Booking Ref: <span className="font-medium text-gray-800">{bookingRefId || 'N/A'}</span></span>
                                <span>Provider Conf: <span className="font-medium text-gray-800">{confirmationNumber || 'N/A'}</span></span>
                                <span>Status: <span className="font-medium text-[#13804e]">{status || 'Confirmed'}</span></span>
                            </div>
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
                                className="p-1.5 hover:bg-gray-100 rounded-full"
                                disabled={isLoading}
                                title="Close"
                            >
                                <XMarkIcon className="h-5 w-5 text-gray-600" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                        <div className="p-4 mb-4 bg-[#e6f0ea] rounded-lg border border-[#e6f0ea] shadow-sm">
                            <div className="flex items-center mb-3">
                                <h3 className="text-xl font-serif font-semibold text-[#093923]">{staticContent?.name || 'Hotel Name'}</h3>
                                {staticContent?.starRating && (
                                    <span className="ml-2 text-yellow-500">{'★'.repeat(parseInt(staticContent.starRating))}</span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                <div>
                                    <div className="flex items-start mb-3">
                                        <div className="ml-2">
                                            <p className="font-medium">{staticContent?.contact?.address?.line1}</p>
                                            <p className="text-xs text-gray-600">
                                                {staticContent?.contact?.address?.city?.name}, {staticContent?.contact?.address?.country?.name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <div className="ml-2">
                                            <p className="text-xs text-gray-600">Stay Duration</p>
                                            <p className="font-medium">{uiCheckInDate} - {uiCheckOutDate} ({uiNights} nights)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="ml-2">
                                            <p className="text-xs text-gray-600">Check-in / Check-out Time</p>
                                            <p className="font-medium">
                                                {staticContent?.checkinInfo?.beginTime || 'Standard'} / {staticContent?.checkoutInfo?.time || 'Standard'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center mb-3">
                                        <div className="ml-2">
                                            <p className="text-xs text-gray-600">Board Basis</p>
                                            <p className="font-medium">{selectedRoomsAndRates[0]?.rate?.boardBasis?.description || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center mb-3">
                                        <div className="ml-2">
                                            <p className="text-xs text-gray-600">Hotel Contact</p>
                                            <p className="font-medium">{staticContent?.contact?.phones?.join(', ') || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="ml-2">
                                            <p className="text-xs text-gray-600">Total Amount</p>
                                            <p className="font-bold text-lg text-[#13804e]">{uiTotalAmount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                            <div className="p-2 bg-[#093923] text-white">
                                <h4 className="text-base font-serif font-semibold">Room Details</h4>
                            </div>
                            <div className="p-4 space-y-3">
                                {selectedRoomsAndRates.map((roomRate, index) => (
                                    <div key={index} className="pb-3 border-b last:border-b-0">
                                        <p className="font-semibold text-[#093923] mb-1">{roomRate.room?.name || 'Room'}</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                            <div>
                                                <span className="text-gray-500">Occupancy: </span>
                                                <span>{roomRate.occupancy?.adults || 0} Adult{roomRate.occupancy?.adults !== 1 ? 's' : ''}{roomRate.occupancy?.childAges?.length > 0 ? `, ${roomRate.occupancy.childAges.length} Child` : ''}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Bed Type: </span>
                                                <span>{(roomRate.room?.beds || []).map(b => `${b.count} ${b.type}`).join(', ') || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Rate: </span>
                                                <span className="font-medium">{formatCurrencySimple(roomRate.rate?.finalRate)} ({roomRate.rate?.isRefundable ? <span className="text-[#13804e]">Refundable</span> : <span className="text-red-600">Non-Ref</span>})</span>
                                            </div>
                                            <div className="col-span-full md:col-span-2">
                                                <span className="text-gray-500">Amenities: </span>
                                                <span>{(roomRate.room?.facilities || []).slice(0,5).map(f => f.name).join(', ')}{roomRate.room?.facilities?.length > 5 ? '...' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                            <div className="p-2 bg-[#093923] text-white">
                                <h4 className="text-base font-serif font-semibold">Guest Details</h4>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-xs">
                                    <thead className="bg-[#2a9d6b] text-white">
                                        <tr>
                                            <th className="p-2 text-left font-medium">Guest Name</th>
                                            <th className="p-2 text-left font-medium">Type</th>
                                            <th className="p-2 text-left font-medium">Contact</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(guestCollectionData?.guests || []).map((guest, index) => (
                                            <tr key={index} className="border-b last:border-b-0 hover:bg-[#e6f0ea]">
                                                <td className="p-2">
                                                    {guest.title} {guest.firstName} {guest.lastName} 
                                                    {guest.isLeadGuest && <span className="ml-2 text-[10px] bg-[#e6f0ea] text-[#13804e] px-1.5 py-0.5 rounded">Lead</span>}
                                                </td>
                                                <td className="p-2">{guest.type}</td>
                                                <td className="p-2">
                                                    {guest.additionaldetail?.email || guest.hms_guestadditionaldetail?.email || '-'} / 
                                                    {guest.additionaldetail?.contactNumber || guest.hms_guestadditionaldetail?.contactNumber || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="mb-4 border rounded-lg overflow-hidden shadow-sm">
                            <div className="p-2 bg-[#093923] text-white">
                                <h4 className="text-base font-serif font-semibold">Policies</h4>
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                    <h5 className="font-medium mb-1 text-[#093923]">Cancellation Policy</h5>
                                    {selectedRoomsAndRates.map((roomRate, index) => (
                                        <div key={index} className="mb-1">
                                            <p className="text-[10px] text-gray-500">{roomRate.room?.name}: <span className={roomRate.rate?.isRefundable ? 'text-[#13804e] font-medium' : 'text-red-600 font-medium'}>{roomRate.rate?.isRefundable ? 'Refundable' : 'Non-refundable'}</span></p>
                                            {(roomRate.rate?.cancellationPolicies?.[0]?.rules || []).map((rule, rIndex) => (
                                                <p key={rIndex} className="text-[10px] pl-2 text-gray-600">
                                                    • {rule.valueType === 'Nights' ? `${rule.value} night(s)` : formatCurrencySimple(rule.estimatedValue ?? rule.value)} charge ({formatDateSimple(rule.start)} - {formatDateSimple(rule.end)})
                                                </p>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h5 className="font-medium mb-1 text-[#093923]">Hotel Policies</h5>
                                    {(firstRatePolicies.length > 0 || staticContent?.checkinInfo || staticContent?.checkoutInfo) ? (
                                        <div className="space-y-1 text-gray-600">
                                            {firstRatePolicies.find(p => p.type === 'Check-in') && <p><strong>Check-in:</strong> {stripHtmlSimple(firstRatePolicies.find(p => p.type === 'Check-in').text)}</p>}
                                            {firstRatePolicies.find(p => p.type === 'Check-out') && <p><strong>Check-out:</strong> {stripHtmlSimple(firstRatePolicies.find(p => p.type === 'Check-out').text)}</p>}
                                            {!firstRatePolicies.find(p => p.type === 'Check-in') && staticContent?.checkinInfo?.beginTime && <p><strong>Check-in Time:</strong> After {staticContent.checkinInfo.beginTime}</p>}
                                            {!firstRatePolicies.find(p => p.type === 'Check-out') && staticContent?.checkoutInfo?.time && <p><strong>Check-out Time:</strong> Before {staticContent.checkoutInfo.time}</p>}
                                            {staticContent?.checkinInfo?.minAge && <p><strong>Min Check-in Age:</strong> {staticContent.checkinInfo.minAge}</p>}
                                            {firstRatePolicies.find(p => p.type === 'Mandatory Fee') && <p className="text-red-600"><strong>Mandatory Fees:</strong> {stripHtmlSimple(firstRatePolicies.find(p => p.type === 'Mandatory Fee').text)}</p>}
                                        </div>
                                    ) : (
                                        <p className="italic text-gray-500">Policy details not available.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingVoucherModal;