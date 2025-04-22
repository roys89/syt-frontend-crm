// src/components/leads/LeadUpload.js
import { ArrowUturnLeftIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import leadService from '../../services/leadService';

const LeadUpload = () => {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && selectedFile.type !== 'application/vnd.ms-excel') {
          toast.error('Please select a CSV file.');
          e.target.value = null; // Reset the file input
          setFile(null);
      } else {
          setFile(selectedFile);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }
    
    // Double-check file type (though handled in onChange)
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast.error('Invalid file type. Please upload a CSV file');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await leadService.uploadLeadsCsv(file);
      
      const successCount = response.count || 0;
      const errorCount = response.errors?.length || 0;

      if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} leads`);
      }
      if (errorCount > 0) {
        toast.warn(`${errorCount} ${errorCount === 1 ? 'lead' : 'leads'} had errors and were not imported. Check console for details.`);
        console.warn('Import errors:', response.errors);
      }
      if (successCount === 0 && errorCount === 0) {
          toast.info('No leads were found or imported from the file.');
      }
      
      navigate('/leads');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload leads');
      console.error('Upload error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
    <div>
          <h1 className="text-2xl font-bold text-[#093923]">Bulk Lead Upload</h1>
          <p className="mt-1 text-sm text-[#13804e]">
            Upload a CSV file containing multiple leads.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/leads')}
          className="inline-flex items-center px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
        >
          <ArrowUturnLeftIcon className="-ml-1 mr-2 h-5 w-5 text-[#093923]/80" aria-hidden="true" />
          Back to Leads
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Instructions Section */}
        <div className="md:col-span-1">
          <div className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10 h-full">
            <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-4 border-b border-[#093923]/10 pb-3">CSV Format Guide</h3>
            <p className="text-sm text-[#13804e] mb-4">
              Ensure your CSV file follows this structure. Columns are case-sensitive.
              </p>
            <ul className="space-y-1 list-disc pl-5 text-sm text-[#093923]">
              <li><span className="font-medium">firstName</span> (required)</li>
              <li><span className="font-medium">lastName</span> (required)</li>
              <li><span className="font-medium">email</span> (required)</li>
                <li>phone</li>
              <li>status <span className="text-xs text-[#13804e]">(e.g., new, contacted)</span></li>
              <li>source <span className="text-xs text-[#13804e]">(e.g., website, referral)</span></li>
                <li>notes</li>
              <li>destination <span className="text-xs text-[#13804e]">(preference)</span></li>
              <li>budget <span className="text-xs text-[#13804e]">(preference, number only)</span></li>
              <li>numberOfTravelers <span className="text-xs text-[#13804e]">(preference, number only)</span></li>
              <li>accommodationPreference <span className="text-xs text-[#13804e]">(preference)</span></li>
              </ul>
            <p className="mt-4 text-xs text-[#13804e]">
              *Optional columns can be left empty. Extra columns will be ignored.
            </p>
          </div>
        </div>

        {/* Upload Form Section */}
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="p-6 bg-white shadow-lg rounded-xl border border-[#093923]/10">
            <h3 className="text-lg font-semibold leading-6 text-[#093923] mb-6 border-b border-[#093923]/10 pb-3">Upload File</h3>
            
            <label htmlFor="file-upload" className="block text-sm font-medium text-[#093923] mb-1">Select CSV File</label>
            <div className="mt-2 flex justify-center items-center px-6 py-10 border-2 border-[#093923]/20 border-dashed rounded-lg bg-[#093923]/5">
              <div className="text-center">
                <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-[#093923]/40" />
                <div className="mt-4 flex text-sm justify-center text-[#13804e]">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-[#13804e] hover:text-[#0d5c3a] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#13804e]/50">
                    <span>Click to upload</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, application/vnd.ms-excel" />
                        </label>
                  {/* <p className="pl-1">or drag and drop</p> */} {/* Drag and drop needs extra implementation */}
                </div>
                <p className="mt-1 text-xs text-[#093923]/60">
                  CSV files only
                </p>
                {file && (
                  <p className="mt-4 text-sm font-medium text-[#093923]">
                    Selected file: <span className="text-[#13804e]">{file.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-[#093923]/10">
                <button
                  type="button"
                  onClick={() => navigate('/leads')}
                className="px-4 py-2 border border-[#093923]/20 rounded-lg shadow-sm text-sm font-medium text-[#093923] bg-white hover:bg-[#093923]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/20 transition-all ease duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !file}
                className={`inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${isLoading || !file ? 'bg-[#093923]/40 cursor-not-allowed' : 'bg-[#093923] hover:bg-[#022316]'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#093923]/50 transition-all ease duration-200`}
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
                    Upload File
                    </>
                  )}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeadUpload;