// src/components/booking/RoomArrangementModal.js
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { Fragment, useEffect, useState } from 'react';

const RoomArrangementModal = ({ isOpen, onClose, initialRooms = [], onSave, maxRooms = 5 }) => {
  const [rooms, setRooms] = useState([]);

  // Initialize rooms when the modal opens or initialRooms change
  useEffect(() => {
    if (isOpen) {
      // Create a deep copy to avoid modifying the original array directly
      setRooms(JSON.parse(JSON.stringify(initialRooms.length > 0 ? initialRooms : [{ adults: 1, children: [] }])));
    }
  }, [isOpen, initialRooms]);

  const addRoom = () => {
    if (rooms.length < maxRooms) {
      setRooms(prev => [...prev, { adults: 1, children: [] }]);
    }
  };

  const removeRoom = (index) => {
    setRooms(prev => prev.filter((_, i) => i !== index));
  };

  const updateRoom = (index, field, value) => {
    setRooms(prev =>
      prev.map((room, i) => (i === index ? { ...room, [field]: value } : room))
    );
  };

  const handleChildCountChange = (roomIndex, count) => {
    const currentChildren = rooms[roomIndex].children || [];
    let newChildren;
    if (count > currentChildren.length) {
      // Add null placeholders for new children
      newChildren = [...currentChildren, ...Array(count - currentChildren.length).fill(null)];
    } else {
      // Remove children from the end
      newChildren = currentChildren.slice(0, count);
    }
     // Ensure children array always has the correct length even if ages are null
    newChildren = newChildren.concat(Array(Math.max(0, count - newChildren.length)).fill(null));
    updateRoom(roomIndex, 'children', newChildren);
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


  const handleSave = () => {
    // Add validation if needed before saving (e.g., ensure all child ages are filled if count > 0)
    onSave(rooms);
    onClose();
  };

  // Calculate total guests
  const totalGuests = rooms.reduce((acc, room) => acc + room.adults + (room.children ? room.children.length : 0), 0);


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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
                  className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center"
                >
                  <span>Room Arrangement ({totalGuests} Guest{totalGuests !== 1 ? 's' : ''})</span>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 p-1 -m-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="space-y-4">
                    {rooms.map((room, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-900">Room {index + 1}</h4>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(index)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100"
                              aria-label="Remove Room"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Adults (18+)
                            </label>
                            <select
                              value={room.adults}
                              onChange={(e) => updateRoom(index, 'adults', parseInt(e.target.value))}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              {[1, 2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Children (0-17)
                            </label>
                            <select
                              value={room.children ? room.children.length : 0} // Ensure value is number
                              onChange={(e) => handleChildCountChange(index, parseInt(e.target.value))}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              {[0, 1, 2, 3, 4].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {room.children && room.children.length > 0 && (
                          <div className="mt-4">
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                              Age of child {room.children.length > 1 ? 'ren' : ''} at time of check-out
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {room.children.map((age, childIndex) => (
                                <div key={childIndex} className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="17"
                                    value={age ?? ''} // Use ?? '' to handle null/undefined for empty input
                                    onChange={(e) => handleChildAgeChange(index, childIndex, e.target.value)}
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none" // appearance-none hides spinner
                                    placeholder="Age"
                                  />
                                   <span className="absolute right-2 top-2.5 text-gray-400 text-xs pointer-events-none">yrs</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {rooms.length < maxRooms && (
                     <button
                      type="button"
                      onClick={addRoom}
                      className="mt-4 w-full inline-flex justify-center items-center px-3 py-2 border border-dashed border-indigo-300 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Another Room
                     </button>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
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
    adults: PropTypes.number.isRequired,
    children: PropTypes.arrayOf(PropTypes.number) // Allow null for ages initially
  })),
  onSave: PropTypes.func.isRequired,
  maxRooms: PropTypes.number
};

export default RoomArrangementModal;