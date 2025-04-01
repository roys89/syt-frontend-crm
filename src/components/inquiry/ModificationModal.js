import { Dialog, Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

// Tab panel component to display each modification section
function TabPanel({ children, selectedTab, tabIndex }) {
  return (
    <div
      role="tabpanel"
      hidden={selectedTab !== tabIndex}
      id={`modification-tabpanel-${tabIndex}`}
      aria-labelledby={`modification-tab-${tabIndex}`}
      className={`transition-opacity duration-300 ${selectedTab === tabIndex ? 'opacity-100' : 'opacity-0'}`}
    >
      {selectedTab === tabIndex && (
        <div className="p-6">{children}</div>
      )}
    </div>
  );
}

// Dropdown menu component for tab selection on mobile
const TabsDropdown = ({ tabs, selectedTab, onChange }) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="flex items-center w-full px-4 py-2 text-left text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
        {tabs[selectedTab].name}
        <ChevronDownIcon className="ml-auto h-5 w-5 text-gray-400" aria-hidden="true" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {tabs.map((tab, idx) => (
            <Menu.Item key={tab.id}>
              {({ active }) => (
                <button
                  type="button"
                  className={`${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-900'
                  } w-full px-4 py-2 text-left`}
                  onClick={() => onChange(idx)}
                >
                  {tab.name}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

// Main modification modal component
const ModificationModal = ({ 
  open, 
  onClose, 
  inquiryId,
  onModify,
  isModifying = false
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [modifiedData, setModifiedData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Tab configuration
  const tabs = [
    { id: 'cities', name: 'Destinations' },
    { id: 'dates', name: 'Dates' },
    { id: 'travelers', name: 'Travelers' },
    { id: 'preferences', name: 'Preferences' }
  ];
  
  // Fetch inquiry data when modal opens
  useEffect(() => {
    const fetchInquiryData = async () => {
      if (inquiryId && open) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Here you would fetch the inquiry data from your API
          // const response = await fetch(`/api/itineraryInquiries/${inquiryId}`);
          // const data = await response.json();
          
          // For now, let's set some placeholder data
          const data = {
            selectedCities: [],
            departureCity: null,
            departureDates: { 
              startDate: "", 
              endDate: "" 
            },
            travelersDetails: {
              type: "",
              rooms: [],
            },
            preferences: {
              selectedInterests: [],
              budget: "",
            },
            includeInternational: false,
            includeGroundTransfer: true,
            includeFerryTransport: false,
            userInfo: {},
            agentCode: ""
          };
          
          setModifiedData(data);
        } catch (err) {
          console.error('Error fetching inquiry data:', err);
          setError('Failed to load inquiry data. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchInquiryData();
  }, [inquiryId, open]);
  
  // Update modified data
  const updateModifiedData = (field, value) => {
    if (!modifiedData) return;
    
    setModifiedData(prev => {
      const newData = { ...prev };
      
      switch(field) {
        case 'selectedCities':
          newData.selectedCities = value;
          break;
          
        case 'departureDates':
          newData.departureDates = {
            ...prev.departureDates,
            ...value
          };
          break;
          
        case 'travelersDetails':
          newData.travelersDetails = {
            ...prev.travelersDetails,
            ...value
          };
          break;
          
        case 'preferences':
          newData.preferences = {
            ...prev.preferences,
            ...value
          };
          break;
          
        case 'agentCode':
          newData.agentCode = value;
          break;
          
        default:
          newData[field] = value;
      }
      
      return newData;
    });
  };
  
  // Handle submission of modifications
  const handleSubmitModifications = async () => {
    if (!modifiedData) return;
    
    try {
      // Here you would submit the modifications to your API
      // const response = await fetch(`/api/itineraryInquiries/${inquiryId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(modifiedData)
      // });
      
      toast.success('Inquiry successfully updated!');
      onModify && onModify(modifiedData);
      onClose();
    } catch (err) {
      console.error('Error updating inquiry:', err);
      toast.error('Failed to update inquiry. Please try again.');
    }
  };
  
  // If modal is not open, don't render anything
  if (!open) return null;
  
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={isModifying ? () => {} : onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl">
                {/* Modal header */}
                <div className="bg-gray-50 px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Modify Itinerary Inquiry
                  </Dialog.Title>
                  
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                    disabled={isModifying}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                
                {/* Modal content */}
                <div className="bg-white">
                  {isLoading ? (
                    <div className="p-6 text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] text-indigo-600 motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                      <p className="mt-2 text-sm text-gray-500">Loading inquiry data...</p>
                    </div>
                  ) : error ? (
                    <div className="p-6 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                        <XMarkIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                      </div>
                      <p className="mt-2 text-sm text-red-600">{error}</p>
                      <button
                        type="button"
                        className="mt-3 inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        Close
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Tabs for desktop */}
                      <div className="hidden sm:block">
                        <div className="border-b border-gray-200">
                          <nav className="flex -mb-px" aria-label="Tabs">
                            {tabs.map((tab, idx) => (
                              <button
                                key={tab.id}
                                className={`w-1/4 py-4 px-1 text-center border-b-2 font-medium text-sm ${
                                  selectedTab === idx
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                                onClick={() => setSelectedTab(idx)}
                              >
                                {tab.name}
                              </button>
                            ))}
                          </nav>
                        </div>
                      </div>
                      
                      {/* Dropdown for mobile */}
                      <div className="sm:hidden py-4 px-4">
                        <TabsDropdown
                          tabs={tabs}
                          selectedTab={selectedTab}
                          onChange={setSelectedTab}
                        />
                      </div>
                      
                      {/* Tab panels */}
                      <div className="h-96 overflow-y-auto">
                        <TabPanel selectedTab={selectedTab} tabIndex={0}>
                          <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm mb-4">
                            Cities selection component would be implemented here
                          </div>
                        </TabPanel>
                        
                        <TabPanel selectedTab={selectedTab} tabIndex={1}>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={modifiedData.departureDates.startDate}
                                onChange={(e) => updateModifiedData('departureDates', { startDate: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={modifiedData.departureDates.endDate}
                                onChange={(e) => updateModifiedData('departureDates', { endDate: e.target.value })}
                              />
                            </div>
                          </div>
                        </TabPanel>
                        
                        <TabPanel selectedTab={selectedTab} tabIndex={2}>
                          <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm mb-4">
                            Travelers details component would be implemented here
                          </div>
                        </TabPanel>
                        
                        <TabPanel selectedTab={selectedTab} tabIndex={3}>
                          <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 text-sm mb-4">
                            Preferences component would be implemented here
                          </div>
                        </TabPanel>
                      </div>
                      
                      {/* Agent code field */}
                      <div className="px-6 py-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Agent Code
                        </label>
                        <input
                          type="text"
                          className="block w-full py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          value={modifiedData.agentCode}
                          onChange={(e) => updateModifiedData('agentCode', e.target.value)}
                          placeholder="Enter agent code"
                        />
                      </div>
                      
                      {/* Modal footer */}
                      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-gray-200">
                        <button
                          type="button"
                          className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                          onClick={handleSubmitModifications}
                          disabled={isModifying}
                        >
                          {isModifying ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] mr-2"></span>
                              Updating...
                            </>
                          ) : (
                            'Save Changes'
                          )}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                          onClick={onClose}
                          disabled={isModifying}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default ModificationModal; 