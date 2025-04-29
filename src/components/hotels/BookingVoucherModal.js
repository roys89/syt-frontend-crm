import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from 'antd';
import jsPDF from 'jspdf';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { transformVoucherDataForPdf } from '../../utils/HotelPdfTransformer'; // Import the transformer

const BookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [activeImageCategory, setActiveImageCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Extract data early to avoid using variables before definition
  const responseData = voucherDetails?.data || voucherDetails;
  const results = responseData?.results;
  const hotelItinerary = results?.hotel_itinerary?.[0];
  const staticContent = hotelItinerary?.staticContent?.[0]; // <-- CORRECT PATH

  // Handle image categories
  useEffect(() => {
    if (isOpen) {
      // Debug all paths to understand what's available
      console.log('Data path check:', {
        voucherDetails: voucherDetails,
        responseData: responseData,
        results: results,
        hotelItinerary: hotelItinerary,
        staticContent: staticContent,
        heroImage: staticContent?.heroImage,
        imagesAndCaptions: staticContent?.imagesAndCaptions
      });
    }
  }, [isOpen, voucherDetails, responseData, results, staticContent]);

  // Handle image categories
  useEffect(() => {
    if (staticContent?.imagesAndCaptions) {
      const categories = Object.keys(staticContent.imagesAndCaptions);
      if (categories.length > 0) {
        setActiveImageCategory(categories[0]);
      }
    }
  }, [staticContent]);

  // Early return if modal should not be open
  if (!isOpen) return null;
  
  // Early return if no data
  if (!responseData) return null;
  if (!results) return null;
  
  // Extract remaining data from the results
  const guestData = hotelItinerary?.guestCollectionData?.[0]; // <-- CORRECT PATH
  const status = results.status;
  const confirmationNumber = results.providerConfirmationNumber;
  const specialRequests = results.specialRequests;

  // Extract more data for detailed views
  const selectedRoomsAndRates = hotelItinerary?.items?.[0]?.selectedRoomsAndRates || [];
  const checkIn = hotelItinerary?.searchRequestLog?.checkIn;
  const checkOut = hotelItinerary?.searchRequestLog?.checkOut;
  const totalAmount = hotelItinerary?.totalAmount;
  
  // Format date string - Can be removed if using transformer's formatDate everywhere
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Function to generate and download a comprehensive PDF voucher
  const handleDownloadPDF = async () => {
    const results = voucherDetails?.data?.results || voucherDetails?.results;
    if (!results) {
        toast.error('Voucher data is not available.');
        return;
    }

    // Pass the whole responseData object to the transformer
    const pdfData = transformVoucherDataForPdf(responseData); 
    if (!pdfData || Object.keys(pdfData).length === 0) {
        toast.error('Failed to process voucher data.');
        return;
    }
    
    const formatCurrency = (amount) => {
        const num = Number(amount);
        if (amount === null || amount === undefined || isNaN(num)) return 'N/A';
        // Use Rupee symbol directly and toFixed to avoid locale issues in PDF
        return 'INR ' + num.toFixed(2); 
    };

    try {
      setIsLoading(true);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      pdf.setProperties({
        title: `Booking Voucher - ${pdfData.bookingId}`,
        subject: 'Hotel Booking Voucher',
        author: 'Sort Your Trip',
        creator: 'Sort Your Trip'
      });
      
      // --- Constants & Styles ---
      const PAGE_WIDTH = pdf.internal.pageSize.getWidth();
      const PAGE_HEIGHT = pdf.internal.pageSize.getHeight();
      const MARGIN = 12;
      const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);
      const PRIMARY_COLOR = [9, 57, 35]; // Dark Green
      const SECONDARY_COLOR = [230, 245, 237]; // Very Light Green/Gray
      const ACCENT_COLOR = [218, 165, 32]; // Gold
      const TEXT_COLOR = [51, 51, 51]; // Dark Gray
      const LIGHT_TEXT_COLOR = [110, 110, 110]; // Medium Gray
      const GREEN_COLOR = [34, 197, 94];
      const RED_COLOR = [239, 68, 68];
      const LINE_COLOR = [220, 220, 220];
      const FONT_SIZE_SMALL = 7.5;
      const FONT_SIZE_NORMAL = 9;
      const FONT_SIZE_MEDIUM = 10;
      const FONT_SIZE_LARGE = 12;
      const FONT_SIZE_XLARGE = 14;
      const LINE_HEIGHT_SMALL = 3.5;
      const LINE_HEIGHT_NORMAL = 4.5;
      const LINE_HEIGHT_MEDIUM = 5.5;
      const textPadding = 3; // Define standard text padding once

      let currentY = MARGIN;
      let logoData = null;
      // Use absolute path from public folder root
      const logoPath = '/assets/logo/SYT-Logo.png'; 

      // --- Logo Loading --- 
      try {
          logoData = await loadImageAsDataURL(logoPath);
      } catch (error) {
          toast.error('Could not load company logo for PDF.', { duration: 2000 });
          // Continue without logo
      }

      // --- Helper Functions ---
      const checkNewPage = (y, neededHeight = 20) => {
        if (y > PAGE_HEIGHT - MARGIN - neededHeight) {
          pdf.addPage();
          return MARGIN; // Reset Y to top margin for the new page
        }
        return y;
      }

      const addWrappedText = (text, x, y, options = {}) => {
          const { 
              maxWidth = CONTENT_WIDTH, 
              lineHeight = LINE_HEIGHT_NORMAL, 
              fontSize = FONT_SIZE_NORMAL, 
              fontStyle = 'normal', 
              color = TEXT_COLOR, 
              align = 'left' 
          } = options;
          
          text = String(text || 'N/A'); // Ensure text is a string
          
          pdf.setFontSize(fontSize);
          pdf.setFont('helvetica', fontStyle);
          pdf.setTextColor(color[0], color[1], color[2]);
          
          const lines = pdf.splitTextToSize(text, maxWidth);
          
          // Adjust x based on alignment
          let currentX = x;
          if (align === 'right') {
              currentX = x + maxWidth - (pdf.getStringUnitWidth(lines[0]) * fontSize / pdf.internal.scaleFactor); // Basic right align for first line
              // For multi-line right align, each line needs calculation (more complex)
          } else if (align === 'center') {
              currentX = x + (maxWidth / 2) - (pdf.getStringUnitWidth(lines[0]) * fontSize / pdf.internal.scaleFactor / 2); // Basic center align
          }
          
          pdf.text(lines, currentX, y);
          
          pdf.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]); // Reset color
          pdf.setFont('helvetica', 'normal'); // Reset style
          return y + (lines.length * lineHeight) + 1; // Return Y position below text + small padding
      };

      const addSectionTitle = (title, y) => {
          y = checkNewPage(y, 10);
          pdf.setFontSize(FONT_SIZE_LARGE);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          pdf.text(title, MARGIN, y);
          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
          y += 2;
          pdf.setLineWidth(0.4);
          pdf.setDrawColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
          pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
          pdf.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]); // Reset draw color
          pdf.setLineWidth(0.2); // Reset line width
          return y + 6; // Space after title and line
      };

      const addLine = (y) => {
          y = checkNewPage(y, 5);
          pdf.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]);
          pdf.setLineWidth(0.2);
          pdf.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
          return y + 3;
      };

      const drawBox = (x, y, width, height, options = {}) => {
          const { fillColor, borderColor = PRIMARY_COLOR, borderWidth = 0.2 } = options;
          if (fillColor) {
              pdf.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
          }
          if (borderColor) {
              pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
              pdf.setLineWidth(borderWidth);
          }
          pdf.rect(x, y, width, height, fillColor ? 'FD' : 'D'); // Fill and/or Stroke
          pdf.setDrawColor(LINE_COLOR[0], LINE_COLOR[1], LINE_COLOR[2]); // Reset draw color
          pdf.setLineWidth(0.2); // Reset line width
      };

      const addField = (label, value, x, y, options = {}) => {
          const { 
              labelStyle = 'bold', 
              valueStyle = 'normal', 
              fontSize = FONT_SIZE_NORMAL, 
              labelFontSize = FONT_SIZE_NORMAL,
              maxWidth = CONTENT_WIDTH, 
              lineHeight = LINE_HEIGHT_NORMAL, 
              labelColor = TEXT_COLOR, 
              valueColor = TEXT_COLOR,
              valueAlign = 'left'
          } = options;
          
          y = checkNewPage(y, lineHeight * 2); // Check space for label + value line
          
          pdf.setFontSize(labelFontSize);
          pdf.setFont('helvetica', labelStyle);
          pdf.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
          pdf.text(label, x, y);
          
          const valueY = y + lineHeight * 0.8; // Position value slightly below label
          return addWrappedText(value, x, valueY, { 
              maxWidth: maxWidth, 
              lineHeight: lineHeight, 
              fontSize: fontSize, 
              fontStyle: valueStyle, 
              color: valueColor,
              align: valueAlign
          });
      };
       
      const addKeyValue = (key, value, x, y, options = {}) => {
          const { 
              keyStyle = 'bold', 
              valueStyle = 'normal', 
              fontSize = FONT_SIZE_SMALL,
              lineHeight = LINE_HEIGHT_SMALL,
              keyColor = LIGHT_TEXT_COLOR,
              valueColor = TEXT_COLOR,
              keyWidth = 40, // Fixed width for key
              valueMaxWidth = CONTENT_WIDTH - x - keyWidth - 2 // Calculate max width for value
          } = options;

          y = checkNewPage(y, lineHeight);
          
          // Add Key
          addWrappedText(key + ':', x, y, { 
              maxWidth: keyWidth, 
              lineHeight: lineHeight, 
              fontSize: fontSize, 
              fontStyle: keyStyle, 
              color: keyColor 
          });

          // Add Value (aligned next to key)
          const valueY = addWrappedText(value, x + keyWidth + 2, y, { 
              maxWidth: valueMaxWidth, 
              lineHeight: lineHeight, 
              fontSize: fontSize, 
              fontStyle: valueStyle, 
              color: valueColor 
          });
          return valueY; // Return Y position after adding value
      };

      // --- PDF Header --- 
      if (logoData) {
          const logoProps = pdf.getImageProperties(logoData);
          const logoHeight = 12; // Fixed height for logo
          const logoWidth = (logoProps.width * logoHeight) / logoProps.height;
          pdf.addImage(logoData, 'PNG', MARGIN, MARGIN - 2, logoWidth, logoHeight);
      }
      currentY = MARGIN + 10; // Set currentY below potential logo space

      // --- Booking Details (Top Right) ---
      let headerCol2X = PAGE_WIDTH / 2;
      let headerY = MARGIN;
      headerY = addKeyValue('Booking ID', pdfData.bookingId, headerCol2X, headerY, {fontSize: FONT_SIZE_NORMAL, keyWidth: 35});
      headerY = addKeyValue('Confirmation', pdfData.confirmationNumber, headerCol2X, headerY, {fontSize: FONT_SIZE_NORMAL, keyWidth: 35});
      const statusColor = pdfData.status?.toLowerCase() === 'confirmed' ? GREEN_COLOR : RED_COLOR;
      headerY = addKeyValue('Status', pdfData.status, headerCol2X, headerY, {fontSize: FONT_SIZE_NORMAL, valueColor: statusColor, keyWidth: 35});
      currentY = Math.max(currentY, headerY + 5); // Ensure currentY is below header details

      currentY = addLine(currentY);
      currentY += 4; // Increased spacing

      // --- Hotel Information --- 
      currentY = addSectionTitle('Hotel Information', currentY);
      let hotelCol1EndY = currentY;
      let hotelCol2EndY = currentY;
      const colWidth = CONTENT_WIDTH / 2 - 5;

      // Column 1: Name, Address, Contact
      hotelCol1EndY = addWrappedText(pdfData.hotel.name, MARGIN + textPadding, hotelCol1EndY, { maxWidth: colWidth - textPadding, fontSize: FONT_SIZE_MEDIUM, fontStyle: 'bold', lineHeight: LINE_HEIGHT_MEDIUM });
      if (pdfData.hotel.starRating > 0) {
          // Fix: Use text instead of star symbol due to font/encoding issues
          const starsText = `(${pdfData.hotel.starRating} star${pdfData.hotel.starRating !== 1 ? 's' : ''})`;
          hotelCol1EndY = addWrappedText(starsText, MARGIN + textPadding, hotelCol1EndY, { maxWidth: colWidth - textPadding, fontSize: FONT_SIZE_NORMAL, color: ACCENT_COLOR, lineHeight: LINE_HEIGHT_MEDIUM });
      }
      hotelCol1EndY = addWrappedText(pdfData.hotel.address, MARGIN + textPadding, hotelCol1EndY, { maxWidth: colWidth - textPadding, fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL });
      hotelCol1EndY = addKeyValue('Phone', pdfData.hotel.phone, MARGIN + textPadding, hotelCol1EndY, { keyWidth: 15, valueMaxWidth: colWidth - 17 - textPadding });
      hotelCol1EndY = addKeyValue('Email', pdfData.hotel.email, MARGIN + textPadding, hotelCol1EndY, { keyWidth: 15, valueMaxWidth: colWidth - 17 - textPadding });

      // Column 2: Image (if available)
      // [User Request] Remove Image from PDF 
      // if (pdfData.hotel.heroImageUrl) {
      //     try {
      //         const imgData = await loadImageAsDataURL(pdfData.hotel.heroImageUrl);
      //         const imgProps = pdf.getImageProperties(imgData);
      //         let imgW = colWidth;
      //         let imgH = (imgProps.height * imgW) / imgProps.width;
      //         const maxImgHeight = 80; // Max image height
      //         if (imgH > maxImgHeight) {
      //             imgH = maxImgHeight;
      //             imgW = (imgProps.width * imgH) / imgProps.height;
      //         }
      //         hotelCol2EndY = checkNewPage(hotelCol2EndY, imgH + 5); // Check space for image
      //         pdf.addImage(imgData, 'JPEG', MARGIN + colWidth + 10 + textPadding, hotelCol2EndY, imgW, imgH); // Added padding
      //         hotelCol2EndY += imgH + 3; 
      //     } catch (error) {
      //         hotelCol2EndY = addWrappedText('[Image load error]', MARGIN + colWidth + 10 + textPadding, hotelCol2EndY, { maxWidth: colWidth - textPadding, fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });
      //     }
      // } else {
          hotelCol2EndY = addWrappedText('[Hotel image not included in PDF]', MARGIN + colWidth + 10 + textPadding, hotelCol2EndY, { maxWidth: colWidth - textPadding, fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });
      // }
      currentY = Math.max(hotelCol1EndY, hotelCol2EndY) + 5;
      currentY = addLine(currentY);
      currentY += 2; // More spacing after line
      
      // --- Stay Details --- 
      currentY = addSectionTitle('Stay Details', currentY);
      const boxStayWidth = CONTENT_WIDTH / 3 - 4;
      const boxStayHeight = 18;
      const boxStartY = currentY;
      
      // Check-in Box
      drawBox(MARGIN, boxStartY, boxStayWidth, boxStayHeight, { fillColor: SECONDARY_COLOR });
      addWrappedText('CHECK-IN', MARGIN + 3, boxStartY + 3, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_SMALL, fontStyle: 'bold', color: PRIMARY_COLOR });
      addWrappedText(pdfData.checkInDate, MARGIN + 3, boxStartY + 8, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_MEDIUM, fontStyle: 'bold' });
      addWrappedText(`From ${pdfData.checkInTime}`, MARGIN + 3, boxStartY + 13, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });
      
      // Duration Box
      const durationX = MARGIN + boxStayWidth + 6;
      drawBox(durationX, boxStartY, boxStayWidth, boxStayHeight, { fillColor: SECONDARY_COLOR });
      addWrappedText('DURATION', durationX + 3, boxStartY + 3, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_SMALL, fontStyle: 'bold', color: PRIMARY_COLOR });
      addWrappedText(`${pdfData.nightsCount} Night${pdfData.nightsCount !== 1 ? 's' : ''}`, durationX + 3, boxStartY + 9, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_MEDIUM, fontStyle: 'bold' });
      
      // Check-out Box
      const checkoutX = durationX + boxStayWidth + 6;
      drawBox(checkoutX, boxStartY, boxStayWidth, boxStayHeight, { fillColor: SECONDARY_COLOR });
      addWrappedText('CHECK-OUT', checkoutX + 3, boxStartY + 3, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_SMALL, fontStyle: 'bold', color: PRIMARY_COLOR });
      addWrappedText(pdfData.checkOutDate, checkoutX + 3, boxStartY + 8, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_MEDIUM, fontStyle: 'bold' });
      addWrappedText(`Before ${pdfData.checkOutTime}`, checkoutX + 3, boxStartY + 13, { maxWidth: boxStayWidth - 6, fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR });

      currentY = boxStartY + boxStayHeight + 8;

      // --- Guest Information --- 
      currentY = addSectionTitle('Guest Information', currentY);
      // Check if guests array exists and has items
      if (pdfData.guests && pdfData.guests.length > 0) {
        const guestTableStartY = currentY;
        const colWidths = { num: 8, name: 60, type: 20, contact: CONTENT_WIDTH - 8 - 60 - 20 - 12 }; // num, name, type, contact, padding
        // Header
        drawBox(MARGIN, guestTableStartY, CONTENT_WIDTH, 7, { fillColor: PRIMARY_COLOR });
        pdf.setFontSize(FONT_SIZE_SMALL);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(255, 255, 255);
        let headerX = MARGIN + 2;
        pdf.text('#', headerX, guestTableStartY + 5);
        headerX += colWidths.num;
        pdf.text('Name', headerX, guestTableStartY + 5);
        headerX += colWidths.name;
        pdf.text('Type', headerX, guestTableStartY + 5);
        headerX += colWidths.type;
        pdf.text('Contact / ID', headerX, guestTableStartY + 5);
        pdf.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
        pdf.setFont('helvetica', 'normal');
        currentY += 7;

        currentY += 2; // Add extra space below header before first guest row

        pdfData.guests.forEach((guest, index) => {
          // Increased neededHeight to prevent cropping with wrapped contact info
          const rowStartY = currentY = checkNewPage(currentY, 30); 
          let cellX = MARGIN + 2;
          let rowMaxY = rowStartY;

          // Ensure guest object is valid
          if (!guest) return; 

          // #
          rowMaxY = Math.max(rowMaxY, addWrappedText(`${index + 1}.`, cellX, rowStartY + 1, { maxWidth: colWidths.num - 2, fontSize: FONT_SIZE_SMALL }));
          cellX += colWidths.num;

          // Name & Lead Guest Tag
          let nameEndY = addWrappedText(guest.name, cellX, rowStartY + 1, { maxWidth: colWidths.name - 2, fontSize: FONT_SIZE_SMALL });
          if (guest.isLead) {
             nameEndY = addWrappedText('[Lead Guest]', cellX, nameEndY - 1, { maxWidth: colWidths.name - 2, fontSize: FONT_SIZE_SMALL - 1, color: PRIMARY_COLOR, fontStyle:'bold'});
          }
          rowMaxY = Math.max(rowMaxY, nameEndY);
          cellX += colWidths.name;
          
          // Type
          rowMaxY = Math.max(rowMaxY, addWrappedText(guest.type, cellX, rowStartY + 1, { maxWidth: colWidths.type - 2, fontSize: FONT_SIZE_SMALL }));
          cellX += colWidths.type;

          // Contact / ID
          let contactLines = [
              guest.email ? `Email: ${guest.email}` : '',
              guest.phone ? `Phone: ${guest.phone}` : '', 
              guest.pan ? `PAN: ${guest.pan}` : '', 
              guest.passport ? `Passport: ${guest.passport}` : ''
          ].filter(Boolean).join('\n');
          rowMaxY = Math.max(rowMaxY, addWrappedText(contactLines || '-', cellX, rowStartY + 1, { maxWidth: colWidths.contact - 2, fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL }));
          
          currentY = addLine(rowMaxY + 1); // Line below row content
        });
        currentY += 2;
      } else {
        currentY = addWrappedText('Guest information not available.', MARGIN, currentY);
      }

      // --- Accommodation Details --- 
      currentY = addSectionTitle('Accommodation Details', currentY);
      if (pdfData.rooms && pdfData.rooms.length > 0) { 
        pdfData.rooms.forEach((room, index) => {
          // Increased neededHeight estimate to prevent cropping
          currentY = checkNewPage(currentY, 80); 
          const roomStartX = MARGIN;
          const roomStartY = currentY;
          
          // Room Title
          addWrappedText(`Room ${index + 1}: ${room.name}`, roomStartX + textPadding, currentY, { maxWidth: CONTENT_WIDTH * 0.7 - (textPadding * 2), fontSize: FONT_SIZE_MEDIUM, fontStyle: 'bold' }); // Adjusted maxWidth for padding
          // Occupancy (right aligned)
          const occupancyText = room.occupancy;
          const occupancyWidth = pdf.getStringUnitWidth(occupancyText) * FONT_SIZE_SMALL / pdf.internal.scaleFactor;
          addWrappedText(occupancyText, PAGE_WIDTH - MARGIN - occupancyWidth - textPadding, currentY, { maxWidth: CONTENT_WIDTH * 0.3 - textPadding, fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR, align:'right' }); // Added align right
          currentY += LINE_HEIGHT_MEDIUM;
          currentY = addLine(currentY); // This line adds its own spacing
          currentY += 2; // Increased space below the line
  
          // Room Info Columns
          let roomCol1Y = currentY;
          let roomCol2Y = currentY;
          const roomColWidth = CONTENT_WIDTH / 2 - 5;
          const col1StartX = roomStartX + textPadding;
          const col2StartX = roomStartX + roomColWidth + 10 + textPadding;

          roomCol1Y = addKeyValue('Board Basis', room.boardBasis, col1StartX, roomCol1Y, { keyWidth: 25, valueMaxWidth: roomColWidth - 27 - textPadding });
          roomCol1Y = addKeyValue('Beds', room.bedInfo, col1StartX, roomCol1Y, { keyWidth: 25, valueMaxWidth: roomColWidth - 27 - textPadding });
          roomCol1Y = addKeyValue('Smoking', room.smokingAllowed, col1StartX, roomCol1Y, { keyWidth: 25, valueMaxWidth: roomColWidth - 27 - textPadding });
          if (room.facilities?.length > 0) {
            roomCol1Y = addKeyValue('Facilities', room.facilities.join(', '), col1StartX, roomCol1Y, { keyWidth: 25, valueMaxWidth: roomColWidth - 27 - textPadding });
          }
             if (room.includes?.length > 0) {
             roomCol1Y = addKeyValue('Included', room.includes.join(', '), col1StartX, roomCol1Y, { keyWidth: 25, valueMaxWidth: roomColWidth - 27 - textPadding });
          }

          // Cancellation Policy in Col 2
          const cancelPolicyColor = room.isRefundable ? GREEN_COLOR : RED_COLOR;
          roomCol2Y = addWrappedText('Cancellation Policy', col2StartX, roomCol2Y, { maxWidth: roomColWidth - (textPadding*2), fontSize: FONT_SIZE_SMALL, fontStyle: 'bold' }); // Added padding to width
          roomCol2Y = addWrappedText(room.isRefundable ? 'Refundable' : 'Non-refundable', col2StartX, roomCol2Y, { maxWidth: roomColWidth - (textPadding*2), fontSize: FONT_SIZE_SMALL, color: cancelPolicyColor, fontStyle: 'bold' }); // Added padding to width
          if (room.cancellationPolicyDetails) {
              roomCol2Y = addWrappedText(room.cancellationPolicyDetails, col2StartX, roomCol2Y, { maxWidth: roomColWidth - (textPadding*2), fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL }); // Added padding to width
          }

           currentY = Math.max(roomCol1Y, roomCol2Y) + 3;
          
          // Other Rate Policies (if any)
          const otherPolicyTypes = Object.keys(room.ratePolicies || {}).filter(k => k !== 'Checkin' && k !== 'Checkout' && k !== 'MandatoryFee' && k !== 'OptionalFee'); // Filter out common ones shown elsewhere
          if(otherPolicyTypes.length > 0) {
              currentY = checkNewPage(currentY, 10);
              // Apply padding to x (col1StartX) and maxWidth
              currentY = addWrappedText('Other Rate Policies:', col1StartX, currentY, { maxWidth: CONTENT_WIDTH - (textPadding*2), fontSize: FONT_SIZE_SMALL, fontStyle: 'bold'}); // Added padding to width
              otherPolicyTypes.forEach(key => {
                  const policyName = key.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capitals
                  // Exclude policies already handled explicitly (like Check-in/out if desired)
                  if (key !== 'Checkin' && key !== 'Checkout') { 
                      currentY = addKeyValue(policyName, room.ratePolicies[key], col1StartX + 5, currentY, { keyWidth: 35, valueMaxWidth: CONTENT_WIDTH - (col1StartX + 5) - 42 - textPadding}); // Added padding to width calc
                  }
              });
              currentY += 2;
          }
          
          // Draw Border Around Room Section
          drawBox(roomStartX, roomStartY - 3, CONTENT_WIDTH, currentY - roomStartY + 1, { borderColor: LINE_COLOR });
          currentY += 5; // Space after room box
        });
      } else {
        currentY = addWrappedText('Accommodation details not available.', MARGIN, currentY);
      }

      // --- Pricing Breakdown --- 
      currentY += 2; // Add spacing before section
      currentY = addSectionTitle('Pricing Breakdown', currentY);
      // Check if rooms array exists and has items
      if (pdfData.rooms && pdfData.rooms.length > 0) {
          let priceCol1Y = currentY;
          let priceCol2Y = currentY;
          const priceColWidth = CONTENT_WIDTH / 2 - 5;
          
          // Rates per room
          pdfData.rooms.forEach((room, index) => {
              priceCol1Y = checkNewPage(priceCol1Y, 20);
              // Add padding to x and adjust maxWidth
              priceCol1Y = addWrappedText(`Room ${index + 1}: ${room.name}`, MARGIN + textPadding, priceCol1Y, { maxWidth: priceColWidth - (textPadding*2), fontSize: FONT_SIZE_SMALL, fontStyle: 'bold' });
              priceCol1Y = addKeyValue('Base Rate', formatCurrency(room.baseRate), MARGIN + 5 + textPadding, priceCol1Y, { keyWidth: 25, valueMaxWidth: priceColWidth - 32 - textPadding });
              room.taxes.forEach(tax => {
                  priceCol1Y = addKeyValue(tax.description, formatCurrency(tax.amount), MARGIN + 5 + textPadding, priceCol1Y, { keyWidth: 25, valueMaxWidth: priceColWidth - 32 - textPadding });
              });
               room.additionalCharges.forEach(charge => {
                  priceCol1Y = addKeyValue(charge.description, formatCurrency(charge.amount), MARGIN + 5 + textPadding, priceCol1Y, { keyWidth: 25, valueMaxWidth: priceColWidth - 32 - textPadding });
              });
              priceCol1Y = addKeyValue('Room Total', formatCurrency(room.finalRate), MARGIN + 5 + textPadding, priceCol1Y, { keyWidth: 25, valueMaxWidth: priceColWidth - 32 - textPadding, valueStyle:'bold' });
              priceCol1Y += 3; // Spacing between rooms
          });

          // Totals in second column
          priceCol2Y = checkNewPage(priceCol2Y, 30);
          // Add padding to x and adjust maxWidth
          const priceCol2X = MARGIN + priceColWidth + 10 + textPadding;
          const priceCol2ValueX = priceCol2X + 5; // Indent values slightly
          const priceCol2MaxWidth = priceColWidth - (textPadding*2);
          priceCol2Y = addWrappedText('Booking Totals', priceCol2X, priceCol2Y, { maxWidth: priceCol2MaxWidth, fontSize: FONT_SIZE_SMALL, fontStyle: 'bold' });
          priceCol2Y = addKeyValue('Total Base', formatCurrency(pdfData.pricing.totalBase), priceCol2ValueX, priceCol2Y, { keyWidth: 30, valueMaxWidth: priceCol2MaxWidth - 35 });
          priceCol2Y = addKeyValue('Total Taxes', formatCurrency(pdfData.pricing.totalTaxes), priceCol2ValueX, priceCol2Y, { keyWidth: 30, valueMaxWidth: priceCol2MaxWidth - 35 });
          if (pdfData.pricing.totalAdditionalCharges > 0) {
             priceCol2Y = addKeyValue('Total Add. Charges', formatCurrency(pdfData.pricing.totalAdditionalCharges), priceCol2ValueX, priceCol2Y, { keyWidth: 30, valueMaxWidth: priceCol2MaxWidth - 35 });
          }
          priceCol2Y += 2;
          priceCol2Y = addKeyValue('Grand Total', formatCurrency(pdfData.pricing.totalAmount), priceCol2ValueX, priceCol2Y, { keyWidth: 30, valueMaxWidth: priceCol2MaxWidth - 35, valueStyle:'bold', fontSize: FONT_SIZE_MEDIUM });

          currentY = Math.max(priceCol1Y, priceCol2Y) + 5;
      } else {
          currentY = addWrappedText('Pricing details not available.', MARGIN + textPadding, currentY, { maxWidth: CONTENT_WIDTH - (textPadding*2) }); // Add padding
      }
       currentY = addLine(currentY);

      // --- Important Information / Policies --- 
      currentY += 2; // More spacing before section
      currentY = addSectionTitle('Important Information & Policies', currentY);
      console.log('Rendering Hotel Policies:', pdfData.hotel?.policies);
      // Use Object.entries to get key and value
      const hotelPoliciesEntries = Object.entries(pdfData.hotel.policies || {});
      if(hotelPoliciesEntries.length > 0) {
          hotelPoliciesEntries.forEach(([key, value]) => {
             currentY = checkNewPage(currentY, 15);
             const policyName = key.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capitals
              // Don't re-display rate policies already shown under rooms
              if (key !== 'Checkin' && key !== 'Checkout' && key !== 'MandatoryFee' && key !== 'OptionalFee') {
                  // Add padding to x and adjust maxWidth
                  currentY = addWrappedText(policyName, MARGIN + textPadding, currentY, { maxWidth: CONTENT_WIDTH - (textPadding*2), fontSize: FONT_SIZE_SMALL, fontStyle: 'bold'});
                  currentY = addWrappedText(pdfData.hotel.policies[key], MARGIN + textPadding, currentY, { maxWidth: CONTENT_WIDTH - (textPadding*2), fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL });
                  currentY += 3; // Space between policies
              }
          });
      } else {
          currentY = addWrappedText('No specific hotel policies provided.', MARGIN + textPadding, currentY, {fontSize: FONT_SIZE_SMALL, color: LIGHT_TEXT_COLOR, maxWidth: CONTENT_WIDTH - (textPadding*2) }); // Add padding
      }
      currentY += 5;

      // --- Special Requests ---
      if (pdfData.specialRequests) {
        currentY = addSectionTitle('Special Requests', currentY);
        currentY = addWrappedText(pdfData.specialRequests, MARGIN + textPadding, currentY, { maxWidth: CONTENT_WIDTH - (textPadding*2), fontSize: FONT_SIZE_NORMAL }); // Added padding
        currentY += 5;
      }

      // --- Footer --- 
      const footerY = PAGE_HEIGHT - MARGIN - 15; // Position footer near bottom
      currentY = addLine(footerY); 
      
      // Draw a white rectangle over potential overrunning content before adding footer
      // This attempts to fix the footer overlap issue
      pdf.setFillColor(255, 255, 255);
      pdf.rect(MARGIN, footerY + 1 , CONTENT_WIDTH, PAGE_HEIGHT - footerY - 1, 'F');

      // Company Contact Info
      const companyDetails = [
          'SortYourTrip',
          'A/202, Kalpatru Habitat,',
          'Dr S.S. Road, Parel, Mumbai 400012',
          'Phone: +91 93720-69323 | Email: info@sortyourtrip.com'
      ];
      addWrappedText(companyDetails.join('\n'), MARGIN, currentY, { maxWidth: CONTENT_WIDTH / 2, fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL, color: LIGHT_TEXT_COLOR });

      // Timestamp
      const timestamp = `Voucher generated on ${new Date().toLocaleString()}`;
      const timestampWidth = pdf.getStringUnitWidth(timestamp) * FONT_SIZE_SMALL / pdf.internal.scaleFactor;
      addWrappedText(timestamp, PAGE_WIDTH - MARGIN - timestampWidth, currentY, { maxWidth: CONTENT_WIDTH / 2, fontSize: FONT_SIZE_SMALL, lineHeight: LINE_HEIGHT_SMALL, color: LIGHT_TEXT_COLOR });
      
      // --- Save PDF --- 
      pdf.save(`Booking_Voucher_${pdfData.confirmationNumber || pdfData.bookingId}.pdf`);
      
      toast.success('PDF voucher downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
      if (error.message.includes('loadImageAsDataURL')) {
          toast.error('Error loading an image for the PDF. Check console.', { duration: 5000 });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to load an image as data URL for PDF
  const loadImageAsDataURL = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/jpeg', 0.9); // Use JPEG with quality
          resolve(dataURL);
        } catch (err) {
          console.error('Canvas toDataURL error:', err);
          reject(err);
        }
      };
      
      img.onerror = (error) => {
        console.error('Image load error for URL:', url, error);
        reject(error);
      };
      
      // Add a cache buster to potentially help with CORS or caching issues
      const cacheBusterUrl = url.includes('?') ? `${url}&cacheBuster=${Date.now()}` : `${url}?cacheBuster=${Date.now()}`;
      console.log("Loading image from URL:", cacheBusterUrl);
      img.src = cacheBusterUrl;
    });
  };

  return (
    <div className="fixed inset-0 overflow-y-auto z-[9999]" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white w-full max-w-5xl rounded-lg shadow-xl p-6 relative overflow-y-auto max-h-[90vh]">
          {/* Header with Title and Close Button */}
          <div className="flex items-center justify-between mb-6 border-b pb-4 bg-white z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Booking Voucher</h2>
              <div className="flex flex-wrap gap-2">
                <p className="text-sm text-gray-500 mt-1">
                  Booking ID: <span className="font-medium">{hotelItinerary?.bookingRefId || confirmationNumber}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Status: <span className="font-medium text-[#22c35e]">{status || 'Confirmed'}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Confirmation: <span className="font-medium">{confirmationNumber}</span>
                </p>
              </div>
            </div>
            <div>
              <Button 
                type="primary" 
                className="me-2" 
                onClick={handleDownloadPDF} 
                disabled={isLoading}
              >
                {isLoading ? 'Generating...' : 'Download PDF'}
              </Button>
              <button
                onClick={onClose}
                className="relative group overflow-hidden p-2 hover:bg-[#093923]/5 rounded-full transition-colors"
              >
                <XMarkIcon className="h-6 w-6 text-gray-500 group-hover:text-[#093923]" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b mb-6 overflow-x-auto">
            <nav className="flex space-x-4 min-w-max">
              {['summary', 'hotel', 'room', 'guests', 'policies', staticContent?.images?.length > 0 || staticContent?.imagesAndCaptions ? 'gallery' : null, 'pricing']
              .filter(Boolean)
              .map((tab) => (
                <button
                  key={tab}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === tab 
                      ? 'text-[#093923] border-b-2 border-[#093923]' 
                      : 'text-gray-500 hover:text-[#093923]/70'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Hotel Summary */}
              <div className="bg-white rounded-lg border p-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {staticContent && staticContent.heroImage ? (
                      <img
                        src={staticContent.heroImage}
                        alt={staticContent.name || "Hotel"}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          e.target.src = "https://via.placeholder.com/300x200?text=Hotel+Image";
                        }}
                      />
                    ) : staticContent && staticContent.images && staticContent.images.length > 0 && staticContent.images[0].links && staticContent.images[0].links.length > 0 ? (
                      <img
                        src={staticContent.images[0].links.find(link => link.size === "Standard" || link.size === "Xxl")?.url || staticContent.images[0].links[0].url}
                        alt={staticContent.name || "Hotel"}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          console.error("Image load error:", e);
                          e.target.src = "https://via.placeholder.com/300x200?text=Hotel+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {staticContent?.name || "Hotel Booking Confirmed"}
                    </h3>
                    {staticContent?.contact?.address && (
                      <address className="text-gray-600 mb-4 not-italic">
                        {staticContent.contact.address.line1},<br />
                        {staticContent.contact.address.line2 && <>{staticContent.contact.address.line2},<br /></>}
                        {staticContent.contact.address.city?.name}, {staticContent.contact.address.state?.name} {staticContent.contact.address.postalCode}<br />
                        {staticContent.contact.address.country?.name}
                      </address>
                    )}

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-xs text-blue-700 uppercase font-semibold">Check-in</p>
                        <p className="font-medium text-blue-900">{formatDate(checkIn)}</p>
                        <p className="text-xs text-blue-600">After {staticContent?.checkinInfo?.beginTime || '2:00 PM'}</p>
                      </div>
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <p className="text-xs text-blue-700 uppercase font-semibold">Check-out</p>
                        <p className="font-medium text-blue-900">{formatDate(checkOut)}</p>
                        <p className="text-xs text-blue-600">Before {staticContent?.checkoutInfo?.time || '12:00 PM'}</p>
                      </div>
                    </div>

                    {totalAmount && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-green-800 font-medium">Total Amount:</p>
                          <p className="text-xl font-bold text-green-900">
                            ₹{totalAmount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Room Summary */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Room Summary</h3>
                {selectedRoomsAndRates.length > 0 ? (
                  <div className="space-y-3">
                    {selectedRoomsAndRates.map((roomRate, index) => (
                      <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-medium">{roomRate.room.name}</h4>
                          <p className="text-sm text-gray-600">
                            {roomRate.occupancy.adults} Adult{roomRate.occupancy.adults !== 1 ? 's' : ''}
                            {roomRate.occupancy.childAges?.length > 0 && 
                              `, ${roomRate.occupancy.childAges.length} Child${roomRate.occupancy.childAges.length !== 1 ? 'ren' : ''}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {roomRate.rate.boardBasis?.description || 'Room Only'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-indigo-600">₹{roomRate.rate.finalRate.toLocaleString()}</p>
                          <span className={roomRate.rate.isRefundable ? 'text-green-600 text-xs' : 'text-red-600 text-xs'}>
                            {roomRate.rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Room details not available</p>
                )}
              </div>

              {/* Lead Guest */}
              {guestData?.guests && guestData.guests.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Lead Guest</h3>
                  {guestData.guests.filter(g => g.isLeadGuest).map((guest, index) => (
                    <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-grow">
                        <p className="font-medium">{guest.title} {guest.firstName} {guest.lastName}</p>
                        {guest.additionaldetail && (
                          <div className="mt-1 text-sm text-gray-600">
                            <p>Email: {guest.additionaldetail.email}</p>
                            <p>Phone: +{guest.additionaldetail.isdCode} {guest.additionaldetail.contactNumber}</p>
                          </div>
                        )}
                      </div>
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Lead Guest
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Confirmation Info */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Booking Details</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Booking ID</p>
                    <p className="font-medium">{hotelItinerary?.bookingRefId || 'Not available'}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Confirmation Number</p>
                    <p className="font-medium">{confirmationNumber || 'Not available'}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Itinerary Code</p>
                    <p className="font-medium">{hotelItinerary?.code || 'Not available'}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Status</p>
                    <p className="font-medium text-green-600">{status || 'Confirmed'}</p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-gray-500">Trace ID</p>
                    <p className="font-medium">{hotelItinerary?.traceId || 'Not available'}</p>
                  </div>
                  {specialRequests && specialRequests !== "null" && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-500">Special Requests</p>
                      <p className="font-medium">{specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hotel Details Tab */}
          {activeTab === 'hotel' && staticContent && (
            <div className="space-y-6">
              {/* Hotel Profile */} 
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Hotel Profile</h3>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-1/3">
                    {staticContent?.heroImage ? (
                      <img
                        src={staticContent.heroImage}
                        alt={staticContent.name}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=Hotel+Image";
                        }}
                      />
                    ) : staticContent?.images?.[0]?.links?.[0]?.url ? (
                      <img
                        src={staticContent.images[0].links.find(link => link.size === "Standard" || link.size === "Xxl")?.url || staticContent.images[0].links[0].url}
                        alt={staticContent.name}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=Hotel+Image";
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-500">No image available</span>
                      </div>
                    )}
                  </div>
                  <div className="md:w-2/3">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {staticContent.name}
                    </h3>
                    <div className="flex items-center mb-2">
                      {staticContent.starRating && (
                        <div className="flex items-center text-yellow-400 mr-2">
                          {[...Array(parseInt(staticContent.starRating))].map((_, i) => (
                            <span key={i}>★</span>
                          ))}
                        </div>
                      )}
                      <span className="text-gray-600 text-sm">{staticContent.type || 'Hotel'}</span>
                      {staticContent.category && (
                        <span className="ml-2 text-gray-600 text-sm">({staticContent.category})</span>
                      )}
                    </div>
                    
                    {staticContent.contact && (
                      <div className="space-y-2 mb-4">
                        <address className="text-gray-600 not-italic">
                          {staticContent.contact.address?.line1},<br />
                          {staticContent.contact.address?.line2 && <>{staticContent.contact.address.line2},<br /></>}
                          {staticContent.contact.address?.city?.name}, {staticContent.contact.address?.state?.name} {staticContent.contact.address?.postalCode}<br />
                          {staticContent.contact.address?.country?.name}
                        </address>
                        
                        {staticContent.contact.phones && staticContent.contact.phones.length > 0 && (
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Phone:</span> {staticContent.contact.phones[0]}
                          </p>
                        )}
                        
                        {staticContent.contact.email && (
                          <p className="text-gray-600 text-sm">
                            <span className="font-medium">Email:</span> {staticContent.contact.email}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {staticContent.descriptions?.length > 0 && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {staticContent.descriptions.find(desc => desc.type === "headline") && (
                          <p className="font-medium mb-1">{staticContent.descriptions.find(desc => desc.type === "headline").text}</p>
                        )}
                        {staticContent.descriptions.find(desc => desc.type === "location" || desc.type === "amenities") && (
                          <p>{staticContent.descriptions.find(desc => desc.type === "location" || desc.type === "amenities").text}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Hotel Reviews */}
              {staticContent.reviews && staticContent.reviews.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Guest Reviews</h3>
                  {staticContent.reviews.map((review, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-3">
                        <div className="bg-green-100 p-2 rounded-lg mr-3">
                          <span className="text-green-800 font-bold text-xl">{review.rating}</span>
                        </div>
                        <div>
                          <p className="font-medium">Overall Rating</p>
                          <p className="text-sm text-gray-500">Based on {review.count} reviews</p>
                        </div>
                      </div>
                      
                      {review.categoryratings && review.categoryratings.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {review.categoryratings.map((category, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 capitalize">
                                {category.category.replace('_', ' ')}:
                              </span>
                              <div className="flex items-center">
                                <div className="w-16 h-2 rounded-full bg-gray-200 mr-2">
                                  <div 
                                    className="h-2 rounded-full bg-green-600" 
                                    style={{ width: `${Math.min(100, (parseFloat(category.rating) / 5) * 100)}%` }}
                                  ></div>
                                </div>
                                <span className="font-medium">{category.rating}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Amenities */}
              {staticContent.facilityGroups && staticContent.facilityGroups.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {staticContent.facilityGroups.map((group, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-gray-800 mb-2">{group.name}</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                          {/* Safety check: Ensure facilities is an array before slicing */} 
                          {Array.isArray(group.facilities) && group.facilities.slice(0, 3).map((facility, i) => (
                            <li key={i} className="flex items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
                              {facility.name}
                            </li>
                          ))}
                          {Array.isArray(group.facilities) && group.facilities.length > 3 && (
                            <li className="text-blue-600 text-xs">+{group.facilities.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Nearby Attractions */}
              {staticContent.nearByAttractions && staticContent.nearByAttractions.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Nearby Attractions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {staticContent.nearByAttractions.slice(0, 10).map((attraction, index) => (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="bg-blue-100 p-1 rounded-full mr-3">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{attraction.name}</p>
                          <p className="text-xs text-gray-500">{attraction.distance} {attraction.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Hotel Descriptions */}
              {staticContent.descriptions && staticContent.descriptions.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Hotel Descriptions</h3>
                  <div className="space-y-4">
                    {staticContent.descriptions.map((desc, index) => (
                      desc.text && (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium capitalize">{desc.type.replace(/_/g, ' ')}</h4>
                          <div className="mt-2 text-sm text-gray-600 prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: desc.text }} />
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Room Details Tab */}
          {activeTab === 'room' && (
            <div className="space-y-6">
              {/* Booking Summary */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Booking Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-700 font-medium">Check-in</p>
                    <p className="font-bold">{formatDate(checkIn)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-700 font-medium">Check-out</p>
                    <p className="font-bold">{formatDate(checkOut)}</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-700 font-medium">Duration</p>
                    <p className="font-bold">
                      {checkIn && checkOut ? 
                        Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) + ' nights' : 
                        'N/A'}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-blue-700 font-medium">Total Amount</p>
                    <p className="font-bold">₹{totalAmount?.toLocaleString() || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              {/* Room Details Expanded */}
              {selectedRoomsAndRates.length > 0 ? (
                selectedRoomsAndRates.map((roomRate, index) => (
                  <div key={index} className="bg-white rounded-lg border p-4">
                    <h3 className="text-lg font-semibold mb-3">Room {index + 1}: {roomRate.room.name}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Room Details</h4>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Room Type:</span> {roomRate.room.name}</p>
                          <p><span className="font-medium">Room ID:</span> {roomRate.room.id}</p>
                          <p><span className="font-medium">Occupancy:</span> {roomRate.occupancy.adults} Adult{roomRate.occupancy.adults !== 1 ? 's' : ''}</p>
                          {roomRate.occupancy.childAges?.length > 0 && (
                            <p><span className="font-medium">Children:</span> {roomRate.occupancy.childAges.length} (Ages: {roomRate.occupancy.childAges.join(', ')})</p>
                          )}
                          {roomRate.room.beds && roomRate.room.beds.length > 0 && (
                            <p>
                              <span className="font-medium">Bed Type:</span> {roomRate.room.beds.map(bed => `${bed.count} ${bed.type}`).join(', ')}
                            </p>
                          )}
                          {roomRate.room.smokingAllowed !== undefined && (
                            <p><span className="font-medium">Smoking:</span> {roomRate.room.smokingAllowed ? 'Allowed' : 'Not Allowed'}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Rate Information</h4>
                        <div className="space-y-2 text-sm">
                          <p>
                            <span className="font-medium">Rate Type:</span> {roomRate.rate.boardBasis?.description || 'Room Only'}
                          </p>
                          <p>
                            <span className="font-medium">Rate ID:</span> {roomRate.rate.id}
                          </p>
                          <p>
                            <span className="font-medium">Cancellation Policy:</span> 
                            <span className={roomRate.rate.isRefundable ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                              {roomRate.rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                            </span>
                          </p>
                          {roomRate.rate.cancellationPolicies && roomRate.rate.cancellationPolicies.length > 0 && (
                            <div className="pt-1">
                              <p className="font-medium">Cancellation Rules:</p>
                              <ul className="list-disc pl-5 space-y-1 text-xs">
                                {roomRate.rate.cancellationPolicies[0].rules.map((rule, idx) => (
                                  <li key={idx}>
                                    {rule.value} {rule.valueType} charge from {formatDate(rule.start)} to {formatDate(rule.end)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p><span className="font-medium">Base Rate:</span> ₹{roomRate.rate.baseRate?.toLocaleString()}</p>
                          <p><span className="font-medium">Taxes:</span> ₹{roomRate.rate.taxAmount?.toLocaleString()}</p>
                          <p className="font-medium text-indigo-600">Total: ₹{roomRate.rate.finalRate?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Room Amenities */}
                    {roomRate.room.facilities && roomRate.room.facilities.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Room Amenities</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {roomRate.room.facilities.slice(0, 12).map((facility, idx) => (
                            <div key={idx} className="text-xs bg-gray-50 p-1.5 rounded">
                              {facility.name}
                            </div>
                          ))}
                          {roomRate.room.facilities.length > 12 && (
                            <div className="text-xs bg-gray-50 p-1.5 rounded text-blue-600">
                              +{roomRate.room.facilities.length - 12} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Room Description */}
                    {roomRate.room.description && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Room Description</h4>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: roomRate.room.description }} />
                        </div>
                      </div>
                    )}
                    
                    {/* Assigned Guests */}
                    {roomRate.room.guests && roomRate.room.guests.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Room Guests</h4>
                        <div className="space-y-2">
                          {roomRate.room.guests.map((guest, idx) => (
                            <div key={idx} className="p-2 bg-gray-50 rounded-lg flex justify-between items-center">
                              <div>
                                <p className="font-medium">
                                  {guest.title} {guest.firstName} {guest.lastName} 
                                  {guest.isLeadGuest && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">Lead</span>}
                                </p>
                                <p className="text-xs text-gray-500">{guest.type}</p>
                              </div>
                              {guest.hms_guestadditionaldetail && (
                                <div className="text-xs text-gray-600">
                                  {guest.hms_guestadditionaldetail.email &&
                                    <p>Email: {guest.hms_guestadditionaldetail.email}</p>
                                  }
                                  {guest.hms_guestadditionaldetail.contactNumber &&
                                    <p>Phone: +{guest.hms_guestadditionaldetail.isdCode} {guest.hms_guestadditionaldetail.contactNumber}</p>
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
                  <p>No detailed room information available</p>
                </div>
              )}
            </div>
          )}

          {/* Guest Information Tab */}
          {activeTab === 'guests' && (
            <div className="space-y-6">
              {/* Guest Count Summary */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Guest Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Total Guests</p>
                    <p className="text-xl font-bold text-blue-900">{guestData?.guestCount || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Adults</p>
                    <p className="text-xl font-bold text-blue-900">
                      {guestData?.guests?.filter(g => g.type === 'adult').length || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Children</p>
                    <p className="text-xl font-bold text-blue-900">
                      {guestData?.guests?.filter(g => g.type === 'child').length || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Detailed Guest Information */}
              {guestData?.guests && guestData.guests.length > 0 ? (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Guest Details</h3>
                  <div className="space-y-4">
                    {guestData.guests.map((guest, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center">
                            <div className="bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center mr-3">
                              <span className="text-gray-700 font-medium">{guest.firstName.charAt(0)}{guest.lastName.charAt(0)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium">
                                {guest.title} {guest.firstName} {guest.lastName}
                              </h4>
                              <p className="text-xs text-gray-500">{guest.type}</p>
                            </div>
                          </div>
                          {guest.isLeadGuest && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Lead Guest
                            </span>
                          )}
                        </div>
                        
                        {/* Room Assignment */}
                        <div className="mb-3 text-sm">
                          <span className="text-gray-500">Room ID:</span> {guest.roomId} | 
                          <span className="ml-2 text-gray-500">Rate ID:</span> {guest.rateId}
                        </div>
                        
                        {guest.additionaldetail && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {guest.additionaldetail.email && (
                              <div className="p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-500">Email</p>
                                <p>{guest.additionaldetail.email}</p>
                              </div>
                            )}
                            {guest.additionaldetail.contactNumber && (
                              <div className="p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-500">Phone</p>
                                <p>+{guest.additionaldetail.isdCode} {guest.additionaldetail.contactNumber}</p>
                              </div>
                            )}
                            {guest.additionaldetail.panCardNumber && (
                              <div className="p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-500">PAN Card</p>
                                <p>{guest.additionaldetail.panCardNumber}</p>
                              </div>
                            )}
                            {guest.additionaldetail.passportNumber && (
                              <div className="p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-500">Passport</p>
                                <p>{guest.additionaldetail.passportNumber}</p>
                                {guest.additionaldetail.passportExpiry && (
                                  <p className="text-xs text-gray-500">Valid until {formatDate(guest.additionaldetail.passportExpiry)}</p>
                                )}
                              </div>
                            )}
                            {guest.additionaldetail.age && (
                              <div className="p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-500">Age</p>
                                <p>{guest.additionaldetail.age} years</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-4 text-center text-gray-500">
                  <p>No detailed guest information available</p>
                </div>
              )}
            </div>
          )}

          {/* Policies Tab */}
          {activeTab === 'policies' && (staticContent || selectedRoomsAndRates?.some(r => r.rate.cancellationPolicies || r.rate.policies)) && (
            <div className="space-y-6">
              {/* Hotel Policies */}
              {(staticContent?.descriptions?.length > 0 || staticContent?.policies) && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Hotel Policies</h3>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {staticContent.descriptions?.length > 0 ? (
                      staticContent.descriptions.map((desc, index) => (
                        desc.text && (
                          <div key={index}>
                            <h4 className="font-medium capitalize">{desc.type.replace(/_/g, ' ')}</h4>
                            <div dangerouslySetInnerHTML={{ __html: desc.text }} />
                          </div>
                        )
                      ))
                    ) : staticContent.policies ? (
                      <div dangerouslySetInnerHTML={{ __html: staticContent.policies }} />
                    ) : (
                      <p>No specific hotel policies provided.</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Cancellation Policy */}
              {selectedRoomsAndRates.length > 0 && selectedRoomsAndRates.some(r => r.rate.cancellationPolicies) && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Cancellation Policy</h3>
                  <div className="space-y-4">
                    {selectedRoomsAndRates.map((roomRate, index) => (
                      roomRate.rate.cancellationPolicies && roomRate.rate.cancellationPolicies.length > 0 && (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">{roomRate.room.name}</h4>
                          <div className="text-sm">
                            <p className={roomRate.rate.isRefundable ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {roomRate.rate.isRefundable ? 'Refundable' : 'Non-refundable'}
                            </p>
                            {roomRate.rate.cancellationPolicies[0].rules.map((rule, idx) => (
                              <div key={idx} className="mt-2 p-2 bg-white rounded border border-gray-100">
                                <p className="text-gray-700">
                                  <span className="font-medium">{rule.valueType === 'Nights' ? rule.value + ' night' + (rule.value !== 1 ? 's' : '') : '₹' + rule.estimatedValue.toLocaleString()}</span> cancellation charge
                                </p>
                                <p className="text-xs text-gray-500">
                                  If cancelled between {formatDate(rule.start)} and {formatDate(rule.end)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Rate Policies */}
              {selectedRoomsAndRates.length > 0 && selectedRoomsAndRates.some(r => r.rate.policies && r.rate.policies.length > 0) && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Rate Policies</h3>
                  <div className="space-y-4">
                    {selectedRoomsAndRates.map((roomRate, index) => (
                      roomRate.rate.policies && roomRate.rate.policies.length > 0 && (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">{roomRate.room.name} Policies</h4>
                          <div className="space-y-3">
                            {roomRate.rate.policies.map((policy, idx) => (
                              <div key={idx} className="p-2 bg-white rounded border border-gray-100">
                                <h5 className="font-medium text-sm capitalize">{policy.type.replace(/_/g, ' ')}</h5>
                                <div className="mt-1 text-sm text-gray-600 prose prose-sm max-w-none">
                                  <div dangerouslySetInnerHTML={{ __html: policy.text }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
              
              {/* Check-in/out Policies */}
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Check-in/Check-out Policy</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Check-in</h4>
                    {staticContent?.checkinInfo ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {staticContent.checkinInfo.beginTime || '2:00 PM'} - {staticContent.checkinInfo.endTime || '11:59 PM'}
                        </p>
                        {staticContent.checkinInfo.minAge && (
                          <p className="text-sm text-gray-600 mt-1">
                            Minimum check-in age: {staticContent.checkinInfo.minAge}
                          </p>
                        )}
                        {staticContent.checkinInfo.instructions && staticContent.checkinInfo.instructions.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">Special Instructions:</p>
                            <div className="mt-1 prose prose-sm max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: staticContent.checkinInfo.instructions[0] }} />
                            </div>
                          </div>
                        )}
                        {staticContent.checkinInfo.specialInstructions && staticContent.checkinInfo.specialInstructions.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            <p className="font-medium">Additional Instructions:</p>
                            <p>{staticContent.checkinInfo.specialInstructions[0]}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">Information not available</p>
                    )}
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Check-out</h4>
                    {staticContent?.checkoutInfo ? (
                      <p className="text-sm text-gray-600">
                        Before {staticContent.checkoutInfo.time || '12:00 PM'}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600">Information not available</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Other Policies */}
              {staticContent?.descriptions?.some(d => d.type === "know_before_you_go") && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Important Information</h3>
                  <div className="p-3 bg-gray-50 rounded-lg prose prose-sm max-w-none text-gray-600">
                    <div dangerouslySetInnerHTML={{ 
                      __html: staticContent.descriptions.find(d => d.type === "know_before_you_go").text 
                    }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (staticContent?.images?.length > 0 || staticContent?.imagesAndCaptions) && (
            <div className="space-y-6">
              {staticContent?.imagesAndCaptions && Object.keys(staticContent.imagesAndCaptions).length > 0 ? (
                <>
                  {/* Image Category Navigation */}
                  <div className="overflow-x-auto pb-2">
                    <div className="flex space-x-2 min-w-max">
                      {Object.keys(staticContent.imagesAndCaptions).map((category) => (
                        <button
                          key={category}
                          onClick={() => setActiveImageCategory(category)}
                          className={`px-4 py-2 rounded-full text-sm font-medium ${
                            activeImageCategory === category
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {staticContent.imagesAndCaptions[category].captionLabel || category}
                          <span className="ml-1 text-xs">
                            ({staticContent.imagesAndCaptions[category].images.length})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Image Grid */}
                  {activeImageCategory && (
                    <div className="bg-white rounded-lg border p-4">
                      <h3 className="text-lg font-semibold mb-3">
                        {staticContent.imagesAndCaptions[activeImageCategory].captionLabel || activeImageCategory} Photos
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {staticContent.imagesAndCaptions[activeImageCategory].images.map((image, index) => (
                          <div key={index} className="relative rounded-lg overflow-hidden h-48 group">
                            {image.links && image.links.length > 0 && (
                              <img
                                src={image.links.find(link => link.size === "Standard" || link.size === "Xxl")?.url || image.links[0].url}
                                alt={image.caption || `Image ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                                }}
                              />
                            )}
                            {image.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                                {image.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : staticContent?.images && staticContent.images.length > 0 ? (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Hotel Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {staticContent.images.map((image, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden h-48 group">
                        {image.links && image.links.length > 0 && (
                          <img
                            src={image.links.find(link => link.size === "Standard" || link.size === "Xxl")?.url || image.links[0].url}
                            alt={image.caption || `Image ${index + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Available";
                            }}
                          />
                        )}
                        {image.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-2 text-sm">
                            {image.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-4 text-center py-12">
                  <p className="text-gray-500">No images available for this hotel</p>
                </div>
              )}
            </div>
          )}

          {/* Pricing Details Tab */}
          {activeTab === 'pricing' && (totalAmount || selectedRoomsAndRates?.length > 0) && (
            <div className="space-y-6">
              {/* Total Amount Summary */} 
              <div className="bg-white rounded-lg border p-4">
                <h3 className="text-lg font-semibold mb-3">Price Summary</h3>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-medium">Total Amount</p>
                    <p className="text-xl font-bold text-green-700">₹{totalAmount?.toLocaleString() || 'N/A'}</p>
                  </div>
                  {selectedRoomsAndRates.length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      <p>Includes taxes and fees</p>
                      <p>For {selectedRoomsAndRates.length} room{selectedRoomsAndRates.length !== 1 ? 's' : ''}, {checkIn && checkOut ? Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) : 'N/A'} night{checkIn && checkOut && Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) !== 1 ? 's' : ''}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Detailed Rate Breakdown */}
              {selectedRoomsAndRates.length > 0 && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Rate Breakdown</h3>
                  <div className="space-y-4">
                    {selectedRoomsAndRates.map((roomRate, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-3">{roomRate.room.name}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span>Base Rate:</span>
                            <span>₹{roomRate.rate.baseRate?.toLocaleString() || 'N/A'}</span>
                          </div>
                          
                          {roomRate.rate.taxes && roomRate.rate.taxes.length > 0 && (
                            <div className="border-t pt-2">
                              <p className="text-sm font-medium mb-1">Taxes:</p>
                              {roomRate.rate.taxes.map((tax, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{tax.description || 'Tax'}</span>
                                  <span>₹{tax.amount?.toLocaleString() || 'N/A'}</span>
                                </div>
                              ))}
                              <div className="flex justify-between text-sm font-medium mt-1">
                                <span>Total Taxes:</span>
                                <span>₹{roomRate.rate.taxAmount?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          )}
                          
                          {roomRate.rate.additionalCharges && roomRate.rate.additionalCharges.length > 0 && (
                            <div className="border-t pt-2">
                              <p className="text-sm font-medium mb-1">Additional Charges:</p>
                              {roomRate.rate.additionalCharges.map((charge, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{charge.charge?.description || 'Charge'}</span>
                                  <span>₹{charge.charge?.amount?.toLocaleString() || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {roomRate.rate.commission && (
                            <div className="border-t pt-2">
                              <div className="flex justify-between text-sm">
                                <span>{roomRate.rate.commission.description || 'Commission'}</span>
                                <span>₹{roomRate.rate.commission.amount?.toLocaleString() || 'N/A'}</span>
                              </div>
                            </div>
                          )}
                          
                          {roomRate.rate.dailyRates && roomRate.rate.dailyRates.length > 0 && (
                            <div className="border-t pt-2">
                              <p className="text-sm font-medium mb-1">Daily Rates:</p>
                              {roomRate.rate.dailyRates.map((dayRate, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{formatDate(dayRate.date)}</span>
                                  <span>₹{dayRate.amount?.toLocaleString() || 'N/A'}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="border-t pt-2 flex justify-between font-medium">
                            <span>Total:</span>
                            <span className="text-indigo-600">₹{roomRate.rate.finalRate?.toLocaleString() || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Payment Information */}
              {selectedRoomsAndRates.length > 0 && selectedRoomsAndRates.some(r => r.rate.allowedCreditCards && r.rate.allowedCreditCards.length > 0) && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
                  <div className="space-y-3">
                    {selectedRoomsAndRates.map((roomRate, index) => (
                      roomRate.rate.allowedCreditCards && roomRate.rate.allowedCreditCards.length > 0 && (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">{roomRate.room.name}</h4>
                          <div>
                            <p className="text-sm font-medium mb-1">Accepted Payment Methods:</p>
                            <div className="flex flex-wrap gap-2">
                              {roomRate.rate.allowedCreditCards.map((card, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white rounded text-xs border">
                                  {card.code}
                                  {card.processingCountry && <span className="ml-1 text-gray-500">({card.processingCountry})</span>}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 flex justify-between border-t pt-4">
            <div className="text-xs text-gray-500">
              Booking Reference: {hotelItinerary?.bookingRefId || confirmationNumber || 'N/A'} • Generated on {new Date().toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="relative group overflow-hidden px-4 py-2 border border-[#093923] rounded-lg text-[#093923] font-medium hover:text-white focus:outline-none focus:ring-2 focus:ring-[#093923] focus:ring-opacity-50"
            >
              <span className="relative z-10">Close</span>
              <div className="absolute inset-0 bg-[#093923] w-0 group-hover:w-full transition-all duration-300 ease-in-out"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingVoucherModal;