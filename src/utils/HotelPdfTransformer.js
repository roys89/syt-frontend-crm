// syt-frontend-crm/src/utils/HotelPdfTransformer.js
// import { logger } from '../logger'; // Assuming you have a logger utility - REMOVED FOR NOW TO FIX LINTER

/**
 * Formats a date string into a more readable format (e.g., "Jun 11, 2025").
 * @param {string} dateString - The date string to format.
 * @returns {string} Formatted date string or "N/A".
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    // logger.error("Error formatting date:", dateString, e); // Use logger
    return String(dateString); // Return original string if formatting fails
  }
};

/**
 * Formats a number as currency (Indian Rupees).
 * @param {number} amount - The amount to format.
 * @returns {string} Formatted currency string (e.g., "₹29,327") or "N/A".
 */
const formatCurrency = (amount) => {
  const num = Number(amount);
  if (amount === null || amount === undefined || isNaN(num)) return 'N/A';
  // Using simple string concatenation for now to avoid potential '¹' issues with toLocaleString in PDF
  // return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`; 
  return '₹' + num.toFixed(2); 
};

/**
 * Strips basic HTML tags from a string.
 * Handles null or undefined input.
 * @param {string | null | undefined} htmlString - String containing HTML.
 * @returns {string} String with HTML tags removed, or empty string.
 */
const stripHtml = (htmlString) => {
  if (!htmlString) return '';
  // Replace list tags with bullets/newlines for better readability
  let text = String(htmlString)
              .replace(/<p>/gi, '') // Remove opening paragraph tags first
              .replace(/<\/p>/gi, '\n')       // Newline after paragraph
              .replace(/<li>/gi, '\n - ')        // Newline and bullet point for list item
              .replace(/<ul[^>]*>/gi, '')      // Remove opening ul/ol tags
              .replace(/<\/ul>/gi, '\n')     // Add newline after list ends
              .replace(/<ol[^>]*>/gi, '')
              .replace(/<\/ol>/gi, '\n')
              .replace(/<\/li>/gi, '')        // Remove closing li tags
              .replace(/<br\s*\/?>/gi, '\n'); // Newline for breaks
  // Remove remaining tags
  text = text.replace(/<[^>]*>/g, '');
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  // Trim whitespace and excessive newlines
  return text.replace(/\n{2,}/g, '\n').trim();
};

/**
 * Extracts and transforms hotel voucher data for PDF generation.
 * @param {object} inputData - The whole response object from the voucher API.
 * @returns {object} Structured data object for the PDF.
 */
export const transformVoucherDataForPdf = (inputData) => {
  // Determine the actual results object
  const results = inputData?.results || inputData;
  if (!results) {
      // No console.error here as per request
      return {};
  }
  
  const hotelItinerary = results.hotel_itinerary?.[0];
  const guestData = hotelItinerary?.guestCollectionData?.[0];
  const staticContent = hotelItinerary?.staticContent?.[0];
  const searchLog = hotelItinerary?.searchRequestLog || {};

  // logger.debug('Transformer Input:', { hotelItinerary, guestData, staticContent, searchLog, resultsStatus: results.status, providerConfirmation: results.providerConfirmationNumber });

  // --- Basic Info ---
  // Prioritize confirmation number, then bookingRefId, then itinerary code
  const bookingId = results.providerConfirmationNumber || hotelItinerary.bookingRefId || 'N/A'; 
  const confirmationNumber = results.providerConfirmationNumber || 'N/A';
  const status = results.status || 'N/A'; // Default to N/A if missing
  const traceId = hotelItinerary.traceId || 'N/A';
  const itineraryCode = hotelItinerary.code || 'N/A';
  const specialRequests = (results.specialRequests && results.specialRequests.toLowerCase() !== 'null') 
                          ? results.specialRequests.trim() : '';

  // --- Dates & Duration ---
  const checkIn = searchLog.checkIn;
  const checkOut = searchLog.checkOut;
  const nightsCount = checkIn && checkOut 
    ? Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))) // Ensure at least 1 night
    : 'N/A';

  // --- Hotel Info ---
  const hotelName = staticContent?.name || 'Hotel Name N/A';
  const starRating = parseInt(staticContent?.starRating || '0', 10);
  const address = staticContent?.contact?.address ? [
    staticContent.contact.address.line1,
    staticContent.contact.address.line2,
    `${staticContent.contact.address.city?.name || ''}${staticContent.contact.address.state?.name ? ', ' + staticContent.contact.address.state.name : ''} ${staticContent.contact.address.postalCode || ''}`.trim(),
    staticContent.contact.address.country?.name
  ].filter(Boolean).join(', ').replace(/ ,|, $/g, '') : 'Address N/A'; // Clean up potential extra commas
  const phones = staticContent?.contact?.phones || [];
  const email = staticContent?.contact?.email || ''; 

  // --- Hotel Image ---
  let heroImageUrl = staticContent?.heroImage;
  if (!heroImageUrl && staticContent?.images && staticContent.images.length > 0 && staticContent.images[0].links) {
      heroImageUrl = staticContent.images[0].links.find(link => link.size === "Xxl")?.url 
                  || staticContent.images[0].links.find(link => link.size === "Standard")?.url 
                  || staticContent.images[0].links[0].url;
  }

  // --- Check-in/out Times & Instructions ---
  const checkInTime = staticContent?.checkinInfo?.beginTime || 'N/A';
  const checkOutTime = staticContent?.checkoutInfo?.time || 'N/A';
  // Keep raw check-in instructions for potential display if needed elsewhere
  const rawCheckInInstructions = staticContent?.checkinInfo?.instructions?.join('\n') || '';
  const rawSpecialCheckInInstructions = staticContent?.checkinInfo?.specialInstructions?.join('\n') || '';
  // These will be added to hotelPolicies later if not duplicated

  // --- Guests ---
  // Use guestCollectionData as the primary source
  const guests = (guestData?.guests || []).map((g, index) => {
    // Determine lead guest status robustly
    const isLead = g.isLeadGuest || (index === 0 && guestData?.guests?.length === 1) || false; // Assume first is lead if only one, or use flag

    // Access additional details safely
    const details = g.additionaldetail || {};
    
    console.log(`[Transformer] Processing Guest ${index}:`, { rawGuest: g, extractedDetails: details }); // <-- LOG RAW GUEST AND DETAILS

    const guestObj = {
        name: `${g.title || ''} ${g.firstName || ''} ${g.lastName || ''}`.trim(),
        isLead: isLead,
        type: g.type ? g.type.charAt(0).toUpperCase() + g.type.slice(1) : 'Adult', // Default to Adult if missing
        email: details.email || '',
        phone: (details.contactNumber && details.isdCode) 
                ? `+${details.isdCode} ${details.contactNumber}` 
                : (details.contactNumber || ''), // Avoid showing just '-' if no number
        pan: details.panCardNumber || '', // Added PAN
        passport: details.passportNumber || '', // Added Passport
    };

    console.log(`[Transformer] Mapped Guest Obj ${index}:`, guestObj); // <-- LOG MAPPED OBJECT
    return guestObj;
  });

  console.log('[Transformer] Mapped Guests (Array Before Filter):', guests); // <-- LOG ARRAY BEFORE FILTER

  const filteredGuests = guests.filter(g => g && g.name && g.name.trim() !== ''); // Ensure guest and name exist and are not empty
  console.log('[Transformer] Filtered Guests (Array After Filter):', filteredGuests); // <-- LOG ARRAY AFTER FILTER

  // --- Room & Rate Details ---
  const rooms = (hotelItinerary?.items?.[0]?.selectedRoomsAndRates || []).map(rr => {
    const rate = rr.rate || {};
    const room = rr.room || {};
    const boardBasis = rate.boardBasis?.description || 'Room Only';
    const isRefundable = rate.isRefundable || false;
    
    // Cancellation Policy Text
    const cancellationRules = rate.cancellationPolicies?.[0]?.rules || [];
    const cancellationDetails = cancellationRules.map(rule => {
      const chargeValue = rule.valueType === 'Nights' 
                          ? `${rule.value} night(s)` 
                          : formatCurrency(rule.estimatedValue ?? rule.value);
      return ` - ${chargeValue} charge if cancelled between ${formatDate(rule.start)} and ${formatDate(rule.end)}.`;
    }).join('\n'); // Separate lines for rules
    
    // Other Rate Policies (extracting various types)
    const ratePolicies = {};
    (rate.policies || []).forEach(p => {
      const key = p.type?.replace(/ /g, '') || 'policy' + Math.random(); // Create camelCase-like key, fallback
      ratePolicies[key] = stripHtml(p.text);
    });

    // Room beds
    const bedInfo = (room.beds || []).map(b => `${b.count} ${b.type}`).join(', ');

    return {
      name: room.name || 'Room Name N/A',
      occupancy: `${rr.occupancy?.adults || 0} Adult${rr.occupancy?.adults !== 1 ? 's' : ''}` + 
                  (rr.occupancy?.childAges?.length > 0 ? `, ${rr.occupancy.childAges.length} Child${rr.occupancy.childAges.length !== 1 ? 'ren' : ''}` : ''),
      boardBasis: boardBasis,
      isRefundable: isRefundable,
      cancellationPolicyDetails: cancellationDetails || 'N/A', // Add N/A fallback
      baseRate: rate.baseRate || 0,
      taxAmount: rate.taxAmount || 0,
      finalRate: rate.finalRate || 0,
      taxes: (rate.taxes || []).map(t => ({ 
        description: t.description?.replace(/_/g, ' ') || 'Tax/Fee', // Format description
        amount: t.amount || 0,
        currency: rate.currency || 'INR' // Capture currency here too if needed
      })),
      dailyRates: (rate.dailyRates || []).map(dr => ({ 
        date: formatDate(dr.date),
        amount: dr.amount || 0
      })),
      additionalCharges: (rate.additionalCharges || []).map(ac => ({ // Added Additional Charges
        description: ac.charge?.description?.replace(/_/g, ' ') || 'Charge',
        amount: ac.charge?.amount || 0,
        currency: ac.charge?.currency || rate.currency || 'INR' // Capture currency
      })),
      includes: rate.includes || [], 
      ratePolicies: ratePolicies, // Renamed from 'policies' to avoid conflict with hotelPolicies
      description: stripHtml(room.description || ''),
      facilities: (room.facilities || []).map(f => f.name).slice(0, 10), // Adjusted limit slightly
      smokingAllowed: room.smokingAllowed === undefined ? 'N/A' : (room.smokingAllowed ? 'Yes' : 'No'), // Added Smoking
      bedInfo: bedInfo || 'N/A', // Added Beds
    };
  });

  // --- Pricing Totals ---
  const totalAmount = hotelItinerary.totalAmount || 0;
  const totalBase = rooms.reduce((sum, room) => sum + (room.baseRate || 0), 0);
  const totalTaxes = rooms.reduce((sum, room) => sum + (room.taxAmount || 0), 0);
  // Calculate total additional charges if present
  const totalAdditionalCharges = rooms.reduce((roomSum, room) => 
    roomSum + (room.additionalCharges?.reduce((chargeSum, charge) => chargeSum + (charge.amount || 0), 0) || 0), 0);

  // --- Hotel Level Policies & Info ---
  const hotelPolicies = extractAndFormatHotelPolicies(staticContent) || {};
  // Add check-in instructions separately if not already covered by a 'checkin' type description
  if(rawCheckInInstructions && !hotelPolicies.checkin && !hotelPolicies.checkinInstruction) {
      hotelPolicies.checkinInstructions = stripHtml(rawCheckInInstructions);
  }
  if(rawSpecialCheckInInstructions && !hotelPolicies.specialCheckinInstruction) {
      hotelPolicies.specialCheckinInstructions = stripHtml(rawSpecialCheckInInstructions);
  }
  
  const hotelFacilities = (staticContent?.facilityGroups || [])
                          .flatMap(group => (group?.facilities || []).map(f => f?.name))
                          .slice(0, 20); // Show slightly more hotel facilities

  // --- Prepare Final Object ---
  const finalPdfData = {
    bookingId,
    confirmationNumber,
    status,
    traceId,
    itineraryCode,
    specialRequests,
    checkInDate: formatDate(checkIn),
    checkOutDate: formatDate(checkOut),
    nightsCount,
    checkInTime,
    checkOutTime,
    hotel: {
      name: hotelName,
      starRating: starRating,
      address: address,
      phone: phones.length > 0 ? phones.map(p => p).join(' / ') : 'N/A', // Join multiple phones if they exist
      email: email || 'N/A',
      heroImageUrl: heroImageUrl,
      facilities: hotelFacilities,
      policies: hotelPolicies, // Contains various descriptions/policies by type
    },
    guests: filteredGuests, // Use the filtered list
    rooms, // Includes ratePolicies inside each room object
    pricing: {
      totalAmount: totalAmount || 0, // Ensure default value
      totalBase: totalBase,
      totalTaxes: totalTaxes,
      totalAdditionalCharges: totalAdditionalCharges,
      currency: rooms[0]?.rate?.currency || '₹', // Get currency from first rate or default to INR
    },
  };

  // --- Return Structured Data ---
  return finalPdfData;
};

// Helper function to extract and format hotel policies from staticContent.descriptions and staticContent.policies (if it's HTML)
const extractAndFormatHotelPolicies = (staticContent) => {
    const policies = {};

    // 1. Extract from staticContent.descriptions array
    if (staticContent?.descriptions?.length > 0) {
        staticContent.descriptions.forEach(desc => {
            if (desc.type && desc.text) {
                const key = desc.type.replace(/_/g, ' ') // Replace underscores with spaces for key
                                    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
                policies[key] = desc.text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(); // Basic HTML strip
            }
        });
    }

    // 2. Extract from staticContent.policies (assuming it might be HTML)
    const policiesHtmlString = staticContent?.policies;
    if (!policiesHtmlString || typeof policiesHtmlString !== 'string') {
        // If no HTML policies, return what we got from descriptions
        return policies;
    }
    try {
        // Attempt to parse the HTML string - this is basic and might need refinement
        const parser = new DOMParser();
        const policiesDoc = parser.parseFromString(policiesHtmlString, 'text/html');
        const policyElements = policiesDoc.querySelectorAll('p');
        policyElements.forEach(element => {
            const policyText = element.textContent.trim();
            if (policyText) {
                const key = policyText.replace(/\s+/g, ' ').trim();
                policies[key] = policyText;
            }
        });
    } catch (e) {
        // logger.error("Error parsing policies:", policiesHtmlString, e); // Use logger
        return policies; // Return what we got from descriptions if parsing fails
    }
    return policies;
};

// Simple logger implementation if none exists
// if (typeof logger === 'undefined') {
//     var logger = { // Use var for potential hoisting issues if called early
//         debug: (...args) => console.debug('[DEBUG]', ...args),
//         error: (...args) => console.error('[ERROR]', ...args),
//         warn: (...args) => console.warn('[WARN]', ...args),
//         info: (...args) => console.info('[INFO]', ...args),
//     };
// } 