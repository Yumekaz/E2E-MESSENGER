import React from 'react';

function JoinRequestModal({ requests, onApprove, onDeny }) {
  return (
    <div className="modal-overlay">
      <div className="modal glass-modal">
        <div className="modal-header">
          <h3>🔔 Join Requests</h3>
        </div>
        
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.requestId} className="request-item">
              <div className="request-user">
                <div className="request-avatar">
                  {request.username.charAt(0).toUpperCase()}
                </div>
                <div className="request-info">
                  <span className="request-username">{request.username}</span>
                  <span className="request-label">
                    <span className="key-icon">🔑</span>
                    Public key verified
                  </span>
                </div>
              </div>
              <div className="request-actions">
                <button
                  className="btn btn-success btn-small"
                  onClick={() => onApprove({ requestId: request.requestId })}
                >
                  Accept
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => onDeny(request.requestId)}
                >
                  Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default JoinRequestModal;
