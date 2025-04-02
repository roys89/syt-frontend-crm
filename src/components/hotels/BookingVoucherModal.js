import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

const BookingVoucherModal = ({ isOpen, onClose, voucherDetails }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [activeImageCategory, setActiveImageCategory] = useState(null);

  // Extract data early to avoid using variables before definition
  const responseData = voucherDetails?.data || voucherDetails;
  const results = responseData?.results;
  const staticContent = results?.staticContent?.[0];

  // Handle image categories
  useEffect(() => {
    if (isOpen) {
      console.log('BookingVoucherModal opened, details:', voucherDetails);
      // Debug all paths to understand what's available
      console.log('Data path check:', {
        voucherDetails: voucherDetails,
        responseData: responseData,
        results: results,
        hotelItinerary: results?.hotel_itinerary?.[0],
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
  const hotelItinerary = results.hotel_itinerary?.[0];
  const guestData = results.guestCollectionData?.[0];
  const status = results.status;
  const confirmationNumber = results.providerConfirmationNumber;
  const specialRequests = results.specialRequests;

  // Extract more data for detailed views
  const selectedRoomsAndRates = hotelItinerary?.items?.[0]?.selectedRoomsAndRates || [];
  const checkIn = hotelItinerary?.searchRequestLog?.checkIn;
  const checkOut = hotelItinerary?.searchRequestLog?.checkOut;
  const totalAmount = hotelItinerary?.totalAmount;
  
  // Format date string
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
                  Status: <span className="font-medium text-green-600">{status || 'Confirmed'}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Confirmation: <span className="font-medium">{confirmationNumber}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="border-b mb-6 overflow-x-auto">
            <nav className="flex space-x-4 min-w-max">
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('summary')}
              >
                Summary
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'hotel' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('hotel')}
              >
                Hotel Details
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'room' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('room')}
              >
                Room Details
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'guests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('guests')}
              >
                Guest Information
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'policies' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('policies')}
              >
                Policies
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'gallery' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('gallery')}
              >
                Gallery
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${activeTab === 'pricing' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('pricing')}
              >
                Pricing Details
              </button>
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
                    {staticContent.heroImage ? (
                      <img
                        src={staticContent.heroImage}
                        alt={staticContent.name}
                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/300x200?text=Hotel+Image";
                        }}
                      />
                    ) : staticContent.images && staticContent.images.length > 0 && staticContent.images[0].links && staticContent.images[0].links.length > 0 ? (
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
                          {group.facilities.slice(0, 3).map((facility, i) => (
                            <li key={i} className="flex items-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mr-2"></span>
                              {facility.name}
                            </li>
                          ))}
                          {group.facilities.length > 3 && (
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
                              <p className="text-xs text-gray-500">{guest.type.charAt(0).toUpperCase() + guest.type.slice(1)}</p>
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
          {activeTab === 'policies' && (
            <div className="space-y-6">
              {/* Hotel Policies */}
              {staticContent?.policies && (
                <div className="bg-white rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-3">Hotel Policies</h3>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    <div dangerouslySetInnerHTML={{ __html: staticContent.policies }} />
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
          {activeTab === 'gallery' && (
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
          {activeTab === 'pricing' && (
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingVoucherModal;