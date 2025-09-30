import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
    <div className="error-message">
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-outline btn-small mt-2">
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;