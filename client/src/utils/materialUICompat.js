// Compatibility layer for Material-UI components
// This file provides fallback components when Material-UI is not available

import React from 'react';

// Fallback Button component
export const Button = ({ children, onClick, className, variant, color, ...props }) => (
  <button 
    className={`btn ${variant === 'contained' ? 'btn-primary' : 'btn-outline-primary'} ${className || ''}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </button>
);

// Fallback TextField component
export const TextField = ({ label, value, onChange, className, ...props }) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <input
      type="text"
      className={`form-control ${className || ''}`}
      value={value}
      onChange={onChange}
      {...props}
    />
  </div>
);

// Fallback Dialog components
export const Dialog = ({ open, onClose, children, ...props }) => (
  open ? (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  ) : null
);

export const DialogTitle = ({ children, ...props }) => (
  <div className="modal-header">
    <h5 className="modal-title">{children}</h5>
  </div>
);

export const DialogContent = ({ children, ...props }) => (
  <div className="modal-body">
    {children}
  </div>
);

export const DialogActions = ({ children, ...props }) => (
  <div className="modal-footer">
    {children}
  </div>
);

// Fallback Typography component
export const Typography = ({ variant, children, className, ...props }) => {
  const Tag = variant === 'h1' ? 'h1' : 
             variant === 'h2' ? 'h2' : 
             variant === 'h3' ? 'h3' : 
             variant === 'h4' ? 'h4' : 
             variant === 'h5' ? 'h5' : 
             variant === 'h6' ? 'h6' : 'p';
  
  return (
    <Tag className={className} {...props}>
      {children}
    </Tag>
  );
};

// Fallback Snackbar component
export const Snackbar = ({ open, message, onClose, ...props }) => (
  open ? (
    <div className="alert alert-info alert-dismissible fade show" style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
      {message}
      <button type="button" className="close" onClick={onClose}>
        <span>&times;</span>
      </button>
    </div>
  ) : null
);

// Export all as default for easy importing
export default {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Snackbar
};
