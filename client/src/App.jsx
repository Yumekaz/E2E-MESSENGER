import React, { useState, useEffect, useRef } from 'react';
import socket from './socket';
import { RoomEncryption } from './crypto/encryption';
import UsernamePage from './pages/UsernamePage';
import HomePage from './pages/HomePage';
import RoomPage from './pages/RoomPage';
import JoinRequestModal from './components/JoinRequestModal';
import Toast from './components/Toast';
import './styles/app.css';

function App() {
  const [currentPage, setCurrentPage] = useState('username');
  const [username, setUsername] = useState('');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [joinRequests, setJoinRequests] = useState([]);
  const [toast, setToast] = useState(null);
  const [encryptionStatus, setEncryptionStatus] = useState('initializing');

  // Encryption context ref
  const encryptionRef = useRef(null);
  const pendingRoomCodeRef = useRef(null);

  useEffect(() => {
    // Check for room code in URL
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      pendingRoomCodeRef.current = roomParam;
      // Clean URL without reloading
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Initialize encryption on mount
  useEffect(() => {
    const initEncryption = async () => {
      try {
        if (!window.crypto || !window.crypto.subtle) {
          throw new Error('Web Crypto API not available. Secure Context required.');
        }
        encryptionRef.current = new RoomEncryption();
        await encryptionRef.current.initialize();
        setEncryptionStatus('ready');
      } catch (err) {
        console.error('Encryption init failed:', err);
        setEncryptionStatus('error');
      }
    };
    initEncryption();
  }, []);

  // Socket event listeners
  useEffect(() => {
    socket.on('registered', ({ username: acceptedUsername }) => {
      setUsername(acceptedUsername);
      setCurrentPage('home');
      showToast('🔐 Secure session started', 'success');

      // Auto-join if room code exists
      if (pendingRoomCodeRef.current) {
        handleJoinRoom(pendingRoomCodeRef.current);
        pendingRoomCodeRef.current = null;
      }
    });

    socket.on('username-taken', () => {
      showToast('Username taken. Try another!', 'error');
    });

    socket.on('room-created', async ({ roomId, roomCode }) => {
      // Set room key with just our public key initially
      await encryptionRef.current.setRoomKey(roomCode, [encryptionRef.current.publicKeyExported]);

      setCurrentRoom({
        roomId,
        roomCode,
        isOwner: true,
        memberKeys: { [username]: encryptionRef.current.publicKeyExported }
      });
      setCurrentPage('room');
      showToast(`Room ${roomCode} created`, 'success');
    });

    socket.on('join-request', ({ requestId, username: requesterName, publicKey, roomId }) => {
      setJoinRequests(prev => [...prev, { requestId, username: requesterName, publicKey, roomId }]);
      showToast(`${requesterName} wants to join`, 'info');
    });

    socket.on('join-approved', async ({ roomId, roomCode, memberKeys }) => {
      // Set room key with all member keys
      await encryptionRef.current.setRoomKey(roomCode, Object.values(memberKeys));

      setCurrentRoom({ roomId, roomCode, isOwner: false, memberKeys });
      setCurrentPage('room');
      showToast('🔐 Joined secure room', 'success');
    });

    socket.on('join-denied', () => {
      showToast('Join request denied', 'error');
    });

    socket.on('error', ({ message }) => {
      showToast(message, 'error');
    });

    socket.on('room-closed', () => {
      setCurrentRoom(null);
      setCurrentPage('home');
      showToast('Room was closed by owner', 'error');
    });

    return () => {
      socket.off('registered');
      socket.off('username-taken');
      socket.off('room-created');
      socket.off('join-request');
      socket.off('join-approved');
      socket.off('join-denied');
      socket.off('error');
      socket.off('room-closed');
    };
  }, [username]);

  const handleRegister = async (name) => {
    if (encryptionStatus !== 'ready') {
      showToast('Encryption initializing...', 'info');
      return;
    }

    socket.emit('register', {
      username: name,
      publicKey: encryptionRef.current.publicKeyExported
    });
  };

  const handleCreateRoom = () => {
    socket.emit('create-room');
  };

  const handleJoinRoom = (roomCode) => {
    socket.emit('request-join', { roomCode: roomCode.toUpperCase() });
    showToast('Join request sent...', 'info');
  };

  const handleApproveJoin = async ({ requestId }) => {
    socket.emit('approve-join', { requestId });
    setJoinRequests(prev => prev.filter(req => req.requestId !== requestId));
  };

  const handleDenyJoin = (requestId) => {
    socket.emit('deny-join', { requestId });
    setJoinRequests(prev => prev.filter(req => req.requestId !== requestId));
  };

  const handleUpdateRoomKey = async (memberKeys) => {
    if (currentRoom) {
      await encryptionRef.current.setRoomKey(currentRoom.roomCode, Object.values(memberKeys));
      setCurrentRoom(prev => ({ ...prev, memberKeys }));
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom) {
      socket.emit('leave-room', { roomId: currentRoom.roomId });
    }
    setCurrentRoom(null);
    setCurrentPage('home');
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="app">
      <div className="encryption-indicator">
        <div className={`indicator-dot ${encryptionStatus}`}></div>
        <span>{encryptionStatus === 'ready' ? 'E2E Encrypted' : 'Initializing...'}</span>
      </div>

      {encryptionStatus === 'error' && (
        <div style={{
          position: 'fixed', inset: 0, background: '#0a0b1e', color: 'white',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', zIndex: 9999, textAlign: 'center'
        }}>
          <h2 style={{ color: '#ff4b4b', marginBottom: '1rem' }}>⚠️ Security Feature Restricted</h2>
          <p style={{ maxWidth: '600px', lineHeight: '1.6', marginBottom: '2rem', color: '#a0a0b0' }}>
            This app uses <strong>Web Crypto API</strong> for end-to-end encryption.
            Modern browsers block this API on "insecure" connections (like IP addresses)
            unless you explicitly allow them.
          </p>

          <div style={{ background: '#1a1b2e', padding: '1.5rem', borderRadius: '12px', textAlign: 'left', maxWidth: '600px', width: '100%' }}>
            <h3 style={{ color: '#00d4aa', marginBottom: '1rem' }}>How to fix (Chrome/Edge/Brave):</h3>
            <ol style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <li>Open a new tab and go to: <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code></li>
              <li>Enabled the "Insecure origins treated as secure" flag.</li>
              <li>In the text box, enter your current URL origin: <br />
                <code style={{ color: '#00d4aa' }}>{window.location.origin}</code>
              </li>
              <li>Click <strong>Relaunch</strong> at the bottom of the browser.</li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: '2rem', padding: '12px 24px', background: '#00d4aa', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}
          >
            I've Fixed It, Reload App
          </button>
        </div>
      )}

      {currentPage === 'username' && (
        <UsernamePage
          onRegister={handleRegister}
          encryptionReady={encryptionStatus === 'ready'}
        />
      )}

      {currentPage === 'home' && (
        <HomePage
          username={username}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {currentPage === 'room' && currentRoom && (
        <RoomPage
          roomId={currentRoom.roomId}
          roomCode={currentRoom.roomCode}
          username={username}
          isOwner={currentRoom.isOwner}
          encryption={encryptionRef.current}
          onUpdateRoomKey={handleUpdateRoomKey}
          onLeave={handleLeaveRoom}
        />
      )}

      {joinRequests.length > 0 && (
        <JoinRequestModal
          requests={joinRequests}
          onApprove={handleApproveJoin}
          onDeny={handleDenyJoin}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}

export default App;
