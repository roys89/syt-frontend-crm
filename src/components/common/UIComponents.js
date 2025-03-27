import { forwardRef } from 'react';

// Common Input Component
export const Input = forwardRef(({ label, error, icon: Icon, ...props }, ref) => (
  <div className="relative">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <div className="relative rounded-md shadow-sm">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <input
        ref={ref}
        className={`block w-full h-10 ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 text-base border ${
          error ? 'border-red-500' : 'border-gray-300'
        } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
        {...props}
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
));

// Common Select Component
export const Select = forwardRef(({ label, error, children, ...props }, ref) => (
  <div className="relative">
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    <select
      ref={ref}
      className={`block w-full h-10 pl-3 pr-10 py-2 text-base border ${
        error ? 'border-red-500' : 'border-gray-300'
      } rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
      {...props}
    >
      {children}
    </select>
    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
));

// Common Button Component
export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  isLoading = false,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${
        isLoading ? 'opacity-75 cursor-not-allowed' : ''
      }`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

// Common Card Component
export const Card = ({ children, className = '', ...props }) => (
  <div
    className={`bg-white rounded-lg shadow-lg p-6 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Common Section Component
export const Section = ({ title, subtitle, children, className = '', ...props }) => (
  <div className={`mb-8 ${className}`} {...props}>
    {title && (
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {subtitle && (
          <p className="mt-2 text-gray-600">{subtitle}</p>
        )}
      </div>
    )}
    {children}
  </div>
);

// Common Grid Component
export const Grid = ({ children, cols = 1, gap = 6, className = '', ...props }) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-${cols} gap-${gap} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Common Form Group Component
export const FormGroup = ({ label, error, children, className = '', ...props }) => (
  <div className={`relative ${className}`} {...props}>
    {label && (
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
    )}
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);

// Common Badge Component
export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

// Common Table Component
export const Table = ({ children, className = '', ...props }) => (
  <div className="overflow-x-auto">
    <table
      className={`min-w-full divide-y divide-gray-200 ${className}`}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '', ...props }) => (
  <thead className="bg-gray-50" {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }) => (
  <tbody className="bg-white divide-y divide-gray-200" {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', ...props }) => (
  <tr className={`hover:bg-gray-50 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-500 ${className}`} {...props}>
    {children}
  </td>
);

export const TableHeaderCell = ({ children, className = '', ...props }) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </th>
); 