import { Dialog, Transition } from '@headlessui/react';
import { CalendarIcon, UserGroupIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import RoomArrangementModal from '../../booking/RoomArrangementModal'; // Import the existing modal

// Helper to format date for input type="date"
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    // Adjust for timezone offset to prevent date shifts
    const offset = date.getTimezoneOffset();
    const adjustedDate = new Date(date.getTime() - (offset*60*1000));
    return adjustedDate.toISOString().split('T')[0];
  } catch (e) {
    console.error("Error formatting date for input:", dateString, e);
    return '';
  }
};

// Helper to get total guests from room config
const getTotalGuests = (rooms) => {
  if (!rooms) return 0;
  return rooms.reduce((total, room) => {
    const adults = room.adults ? room.adults.length : 0;
    const children = room.children ? room.children.length : 0;
    return total + adults + children;
  }, 0);
};

const CrmHotelModifyModal = ({ isOpen, onClose, hotelData, travelersDetails }) => {
  const [hotelName, setHotelName] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [roomConfig, setRoomConfig] = useState([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  // Initialize state when modal opens or data changes
  useEffect(() => {
    if (isOpen && hotelData && travelersDetails) {
      // Extract non-changeable hotel name
      setHotelName(hotelData.data?.hotelDetails?.name || 'Hotel Name N/A');

      // Initialize dates (use helper for correct format)
      setCheckInDate(formatDateForInput(hotelData.checkIn));
      setCheckOutDate(formatDateForInput(hotelData.checkOut));

      // Initialize room configuration from travelersDetails
      // RoomArrangementModal expects { adults: [age], children: [age] }
      // Ensure travelersDetails.rooms exists and has the correct format
      const initialRooms = travelersDetails?.rooms?.map(room => ({
        adults: Array.isArray(room.adults) ? room.adults : Array(room.adults || 1).fill(30), // Default age 30
        children: Array.isArray(room.children) ? room.children : []
      })) || [{ adults: [30], children: [] }]; // Default if no traveler data
      setRoomConfig(JSON.parse(JSON.stringify(initialRooms))); // Deep copy
    }
  }, [isOpen, hotelData, travelersDetails]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    if (name === 'checkIn') {
      setCheckInDate(value);
      // Optional: Add validation (e.g., check-out >= check-in)
      if (value >= checkOutDate) {
        // Adjust check-out if check-in moves past it or equals it
        const nextDay = new Date(value);
        nextDay.setDate(nextDay.getDate() + 1);
        setCheckOutDate(formatDateForInput(nextDay));
      }
    } else if (name === 'checkOut') {
       if (value > checkInDate) { // Ensure check-out is strictly after check-in
            setCheckOutDate(value);
       } else {
           toast.warn("Check-out date must be after check-in date.");
           // Optionally reset to one day after check-in
           const nextDay = new Date(checkInDate);
           nextDay.setDate(nextDay.getDate() + 1);
           setCheckOutDate(formatDateForInput(nextDay));
       }
    }
  };

  const openRoomModal = () => setIsRoomModalOpen(true);
  const closeRoomModal = () => setIsRoomModalOpen(false);

  // This function receives the updated rooms array from RoomArrangementModal
  const handleRoomSave = (updatedRooms) => {
    setRoomConfig(updatedRooms);
    // No need to close RoomArrangementModal here, it closes itself
  };

  // Placeholder for the main modification action
  const handleModifySearch = () => {
    // Basic validation
    if (!checkInDate || !checkOutDate) {
        toast.error("Please select valid check-in and check-out dates.");
        return;
    }
    if (checkOutDate <= checkInDate) {
        toast.error("Check-out date must be after check-in date.");
        return;
    }
    if (roomConfig.length === 0 || getTotalGuests(roomConfig) === 0) {
        toast.error("Please configure at least one guest.");
        return;
    }

    console.log("Modify Search Triggered with:", {
      hotelName, // Maybe pass original hotel ID/code instead?
      checkInDate,
      checkOutDate,
      roomConfig, // Needs to be in the format expected by search API
    });
    toast.info(`Placeholder: Search for hotels from ${checkInDate} to ${checkOutDate}`);
    // In a real app, call an API search function here
    // onClose(); // Optionally close this modal after triggering search
  };

  const currentGuests = getTotalGuests(roomConfig);

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40" onClose={onClose}> {/* Use z-40 if RoomArrangementModal is z-50 */}
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
            <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
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
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all">
                  {/* Header */}
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center border-b pb-3 mb-4"
                  >
                    <span>Modify Hotel Stay</span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </Dialog.Title>

                  {/* Form Content */}
                  <div className="mt-2 space-y-4">
                    {/* Hotel Name (Display Only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hotel</label>
                      <p className="mt-1 text-md font-semibold text-gray-800 bg-gray-100 p-2 rounded border border-gray-200 truncate" title={hotelName}>
                        {hotelName}
                      </p>
                    </div>

                    {/* Check-in / Check-out Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="checkInModify" className="block text-sm font-medium text-gray-700 mb-1">
                          Check-in Date
                        </label>
                        <div className="relative">
                           <input
                            type="date"
                            id="checkInModify"
                            name="checkIn"
                            value={checkInDate}
                            onChange={handleDateChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="checkOutModify" className="block text-sm font-medium text-gray-700 mb-1">
                          Check-out Date
                        </label>
                        <div className="relative">
                           <input
                            type="date"
                            id="checkOutModify"
                            name="checkOut"
                            min={checkInDate ? new Date(new Date(checkInDate).setDate(new Date(checkInDate).getDate() + 1)).toISOString().split('T')[0] : ''} // Ensure min checkout is day after check-in
                            value={checkOutDate}
                            onChange={handleDateChange}
                            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                           />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Room Arrangement Trigger */}
                    <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Guests & Rooms</label>
                      <button
                        type="button"
                        onClick={openRoomModal}
                        className="w-full flex justify-between items-center text-left px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <span className="flex items-center text-sm text-gray-700">
                          <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                          {currentGuests} Guest{currentGuests !== 1 ? 's' : ''}, {roomConfig.length} Room{roomConfig.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-sm font-medium text-indigo-600">Change</span>
                      </button>
                    </div>
                  </div>

                  {/* Footer Buttons */}
                  <div className="mt-6 flex justify-end space-x-3 border-t pt-4">
                     <button
                        type="button"
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                     >
                        Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      onClick={handleModifySearch}
                    >
                      Search
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Nested Room Arrangement Modal */}
      <RoomArrangementModal
        isOpen={isRoomModalOpen}
        onClose={closeRoomModal}
        initialRooms={roomConfig} // Pass current config
        onSave={handleRoomSave} // Callback to update state
        // Pass max limits if needed, otherwise defaults will be used
        // maxRooms={...}
        // maxAdultsPerRoom={...}
        // maxChildrenPerRoom={...}
      />
    </>
  );
};

export default CrmHotelModifyModal; 