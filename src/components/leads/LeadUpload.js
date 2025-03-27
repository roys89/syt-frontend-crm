// src/components/leads/LeadUpload.js
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import leadService from '../../services/leadService';

const LeadUpload = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast.error('Please upload a CSV file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await leadService.uploadLeadsCsv(file);
      
      toast.success(`Successfully uploaded ${response.count} leads`);
      if (response.errors && response.errors.length > 0) {
        toast.warn(`${response.errors.length} leads had errors and were not imported`);
      }
      
      navigate('/leads');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload leads');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Bulk Lead Upload</h3>
            <p className="mt-1 text-sm text-gray-600">
              Upload a CSV file containing multiple leads.
            </p>
            <div className="mt-6 border rounded-md p-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">CSV Format</h4>
              <p className="text-sm text-gray-600 mb-2">
                Your CSV file should include the following columns:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600">
                <li>firstName (required)</li>
                <li>lastName (required)</li>
                <li>email (required)</li>
                <li>phone</li>
                <li>status</li>
                <li>source</li>
                <li>notes</li>
                <li>destination</li>
                <li>budget</li>
                <li>numberOfTravelers</li>
                <li>accommodationPreference</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-5 md:mt-0 md:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:rounded-md sm:overflow-hidden">
              <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CSV File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        CSV up to 5MB
                      </p>
                      {file && <p className="text-sm text-gray-900 mt-2">{file.name}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                <button
                  type="button"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                  onClick={() => navigate('/leads')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={isLoading || !file}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                      Upload
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadUpload;