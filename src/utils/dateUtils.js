/**
 * Formats a date string to a display-friendly format
 * @param {string} dateString - The date string to format (e.g., "2025-03-28 04:30:00.000")
 * @returns {string} - Formatted date string (e.g., "28 Mar 2025, 04:30 AM")
 */
export const formatTimeForDisplay = (dateString) => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    
    // Format date
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    
    // Format time
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12; // Convert 24h to 12h format
    
    return `${day} ${month} ${year}, ${displayHours}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
}; 