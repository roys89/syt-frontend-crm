// src/components/booking/RoomArrangementModal.js
import { Dialog, Transition } from '@headlessui/react';
import { MinusIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';

const RoomArrangementModal = ({ isOpen, onClose, initialRooms = [], onSave, maxRooms = 5, maxAdultsPerRoom = 6, maxChildrenPerRoom = 4 }) => {
  const [rooms, setRooms] = useState([]);

  // Initialize rooms when the modal opens or initialRooms change
  useEffect(() => {
    if (isOpen) {
      // Create a deep copy and ensure correct structure
      const sanitizedInitialRooms = initialRooms.length > 0
        ? initialRooms.map(room => ({
            adults: Array.isArray(room.adults) ? room.adults : Array(room.adults || 1).fill(30), // Default age 30 if only count was provided
            children: Array.isArray(room.children) ? room.children : []
          }))
        : [{ adults: [30], children: [] }]; // Default: 1 adult, age 30

      setRooms(JSON.parse(JSON.stringify(sanitizedInitialRooms)));
    }
  }, [isOpen, initialRooms]);

  const addRoom = () => {
    if (rooms.length < maxRooms) {
      setRooms(prev => [...prev, { adults: [30], children: [] }]); // Add room with 1 default adult
    }
  };

  const removeRoom = (index) => {
    setRooms(prev => prev.filter((_, i) => i !== index));
  };

  // --- Adult Management ---
  const addAdult = (roomIndex) => {
    setRooms(prev =>
      prev.map((room, i) => {
        if (i === roomIndex && room.adults.length < maxAdultsPerRoom) {
          return { ...room, adults: [...room.adults, null] }; // Add adult with null age initially
        }
        return room;
      })
    );
  };

  const removeAdult = (roomIndex, adultIndex) => {
    setRooms(prev =>
      prev.map((room, i) => {
        if (i === roomIndex) {
          // Prevent removing the last adult
          if (room.adults.length <= 1) return room;
          const newAdults = room.adults.filter((_, aIndex) => aIndex !== adultIndex);
          return { ...room, adults: newAdults };
        }
        return room;
      })
    );
  };

  const handleAdultAgeChange = (roomIndex, adultIndex, age) => {
    const value = age === '' ? null : parseInt(age, 10);
    // Basic validation for age (e.g., 18 to 120)
    // REMOVED: if (value === null || (value >= 18 && value <= 120)) {

    // Prevent NaN issues if parseInt fails, although type="number" helps
    if (isNaN(value) && age !== '') {
        return; // Don't update state if input is non-numeric but not empty
    }

       const newRooms = rooms.map((room, rIndex) => {
         if (rIndex === roomIndex) {
           const newAdults = [...room.adults];
           newAdults[adultIndex] = value;
           return { ...room, adults: newAdults };
         }
         return room;
       });
       setRooms(newRooms);
     // REMOVED: }
  };
  // --- End Adult Management ---

  // --- Child Management ---
  const addChild = (roomIndex) => {
    setRooms(prev =>
      prev.map((room, i) => {
        if (i === roomIndex && room.children.length < maxChildrenPerRoom) {
          return { ...room, children: [...room.children, null] }; // Add child with null age initially
        }
        return room;
      })
    );
  };

  const removeChild = (roomIndex, childIndex) => {
     setRooms(prev =>
       prev.map((room, i) => {
         if (i === roomIndex) {
           const newChildren = room.children.filter((_, cIndex) => cIndex !== childIndex);
           return { ...room, children: newChildren };
         }
         return room;
       })
     );
  };

  const handleChildAgeChange = (roomIndex, childIndex, age) => {
     const value = age === '' ? null : parseInt(age, 10);
    // Basic validation for age
    if (value === null || (value >= 0 && value <= 17)) {
       const newRooms = rooms.map((room, rIndex) => {
         if (rIndex === roomIndex) {
           const newChildren = [...room.children];
           newChildren[childIndex] = value;
           return { ...room, children: newChildren };
         }
         return room;
       });
       setRooms(newRooms);
     }
  };
  // --- End Child Management ---

  const handleSave = () => {
    // Validation: Ensure all ages (adult and child) are filled AND within range
    const hasInvalidAges = rooms.some(room =>
      room.adults.some(age => age === null || age === undefined || age < 18 || age > 120) || // Added range check
      room.children.some(age => age === null || age === undefined /* Add child range check here if needed */)
    );

    if (hasInvalidAges) {
      // Optionally show a more specific error message
      alert("Please ensure all adult ages are filled and between 18 and 120."); // Updated message
      return;
    }
    onSave(rooms);
    onClose();
  };

  // Calculate total guests
  const totalGuests = rooms.reduce((acc, room) => acc + (room.adults ? room.adults.length : 0) + (room.children ? room.children.length : 0), 0);


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        </Transition.Child>

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-semibold leading-6 text-gray-900 flex justify-between items-center border-b border-gray-200 pb-4"
                >
                  <span>Room Arrangement ({totalGuests} Guest{totalGuests !== 1 ? 's' : ''})</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded-full focus:outline-none focus:ring-2 focus:ring-[#093923]"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 max-h-[65vh] overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-[#093923]/20 scrollbar-track-gray-100 scrollbar-thumb-rounded">
                  <div className="space-y-5">
                    {rooms.map((room, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-[#093923]/30 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">Room {index + 1}</h4>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              aria-label="Remove Room"
                              disabled={rooms.length <= 1}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        {/* Adult Section */}
                        <div className="mb-6 pb-6 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-medium text-gray-600">
                              Adults (18+)
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addAdult(index)}
                                disabled={room.adults.length >= maxAdultsPerRoom}
                                className="p-1 rounded-full bg-[#093923]/10 text-[#093923] hover:bg-[#093923]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Add Adult"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">{room.adults.length}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {room.adults.map((age, adultIndex) => (
                              <div key={`adult-${adultIndex}`} className="relative flex items-center group">
                                <div className="w-full relative">
                                  <input
                                    type="number"
                                    min="18"
                                    max="120"
                                    value={age ?? ''}
                                    onChange={(e) => handleAdultAgeChange(index, adultIndex, e.target.value)}
                                    className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-[#093923] focus:border-[#093923] focus:ring-offset-1 sm:text-sm appearance-none transition-colors"
                                    placeholder="Age"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <span className="text-gray-400 text-xs">yrs</span>
                                  </div>
                                </div>
                                {room.adults.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeAdult(index, adultIndex)}
                                    className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 transition-all"
                                    aria-label="Remove Adult"
                                    disabled={room.adults.length <= 1}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Children Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <label className="block text-xs font-medium text-gray-600">
                              Children (0-17)
                            </label>
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => addChild(index)}
                                disabled={room.children.length >= maxChildrenPerRoom}
                                className="p-1 rounded-full bg-[#093923]/10 text-[#093923] hover:bg-[#093923]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                aria-label="Add Child"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-medium w-6 text-center">{room.children.length}</span>
                            </div>
                          </div>
                          {room.children && room.children.length > 0 && (
                            <>
                              <p className="text-xs text-gray-500 mb-2">
                                Age of child{room.children.length !== 1 ? 'ren' : ''} at time of check-out
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {room.children.map((age, childIndex) => (
                                  <div key={`child-${childIndex}`} className="relative flex items-center group">
                                    <div className="w-full relative">
                                      <input
                                        type="number"
                                        min="0"
                                        max="17"
                                        value={age ?? ''}
                                        onChange={(e) => handleChildAgeChange(index, childIndex, e.target.value)}
                                        className="block w-full border border-gray-300 rounded-lg shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-[#093923] focus:border-[#093923] focus:ring-offset-1 sm:text-sm appearance-none transition-colors"
                                        placeholder="Age"
                                      />
                                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <span className="text-gray-400 text-xs">yrs</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeChild(index, childIndex)}
                                      className="opacity-0 group-hover:opacity-100 ml-2 text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 transition-all"
                                      aria-label="Remove Child"
                                    >
                                      <MinusIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {rooms.length < maxRooms && (
                    <button
                      type="button"
                      onClick={addRoom}
                      className="mt-4 w-full inline-flex justify-center items-center px-3 py-2 border border-dashed border-[#093923]/30 text-sm font-medium rounded-lg text-[#093923] bg-[#093923]/5 hover:bg-[#093923]/10 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#093923] transition-colors"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Another Room
                    </button>
                  )}
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#093923] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-[#093923] text-white hover:bg-[#093923]/90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#093923] transition-colors"
                    onClick={handleSave}
                  >
                    Done
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

RoomArrangementModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialRooms: PropTypes.arrayOf(PropTypes.shape({
    // Allow either number (count) or array (ages) initially for adults
    adults: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number)
    ]).isRequired,
    children: PropTypes.arrayOf(PropTypes.number) // Allow null for ages initially
  })),
  onSave: PropTypes.func.isRequired,
  maxRooms: PropTypes.number,
  maxAdultsPerRoom: PropTypes.number, // Added prop
  maxChildrenPerRoom: PropTypes.number // Added prop
};

export default RoomArrangementModal;