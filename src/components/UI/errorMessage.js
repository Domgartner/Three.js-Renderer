import React from 'react';

export default function ErrorMessage({ message }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
      <div className="max-w-md p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Model</h3>
        <p className="text-red-600">{message}</p>
        <button 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          onClick={() => window.location.reload()}
        >
          Reload Page
        </button>
      </div>
    </div>
  );
}