// /src/components/ui/modal.js
// This file contains the Modal component and its subcomponents for displaying modal dialogs.
//

import React from 'react';

const Modal = ({ isOpen, onClose, children, className = "" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`relative bg-white rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 max-w-md w-full mx-auto ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const ModalHeader = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const ModalTitle = ({ children, className = "" }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const ModalContent = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

const ModalFooter = ({ children, className = "" }) => (
  <div className={`px-6 py-4 border-t border-gray-200 flex justify-end gap-3 ${className}`}>
    {children}
  </div>
);

export { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter };