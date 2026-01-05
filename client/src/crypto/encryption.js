// E2E Encryption Module using Web Crypto API
// Uses ECDH for key exchange and AES-GCM for message encryption

// Generate ECDH key pair for a user
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  
  return keyPair;
}

// Export public key to share with others
export async function exportPublicKey(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

// Import a public key received from another user
export async function importPublicKey(base64Key) {
  const keyData = base64ToArrayBuffer(base64Key);
  return await window.crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'ECDH',
      namedCurve: 'P-256'
    },
    true,
    []
  );
}

// Derive shared secret key from our private key and their public key
export async function deriveSharedKey(privateKey, publicKey) {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: publicKey
    },
    privateKey,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt a message using AES-GCM
export async function encryptMessage(sharedKey, plaintext) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random IV for each message
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    sharedKey,
    data
  );
  
  return {
    encryptedData: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv)
  };
}

// Decrypt a message using AES-GCM
export async function decryptMessage(sharedKey, encryptedData, iv) {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: base64ToArrayBuffer(iv)
      },
      sharedKey,
      base64ToArrayBuffer(encryptedData)
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Generate a room encryption key (for group chats)
// All members derive the same key from room code + shared secret
export async function generateRoomKey(roomCode, memberPublicKeys) {
  // Sort keys to ensure consistent ordering
  const sortedKeys = [...memberPublicKeys].sort();
  const combined = roomCode + sortedKeys.join('');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(combined);
  
  // Hash the combined data
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  
  // Import as AES key
  return await window.crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Helper: ArrayBuffer to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate fingerprint for key verification
export async function getKeyFingerprint(publicKey) {
  const exported = await window.crypto.subtle.exportKey('spki', publicKey);
  const hash = await window.crypto.subtle.digest('SHA-256', exported);
  const bytes = new Uint8Array(hash);
  
  // Format as readable hex groups
  let fingerprint = '';
  for (let i = 0; i < 8; i++) {
    if (i > 0) fingerprint += ' ';
    fingerprint += bytes[i].toString(16).padStart(2, '0').toUpperCase();
  }
  
  return fingerprint;
}

// Create an encryption context for a room
export class RoomEncryption {
  constructor() {
    this.keyPair = null;
    this.roomKey = null;
    this.publicKeyExported = null;
  }

  async initialize() {
    this.keyPair = await generateKeyPair();
    this.publicKeyExported = await exportPublicKey(this.keyPair.publicKey);
    return this.publicKeyExported;
  }

  async setRoomKey(roomCode, memberPublicKeys) {
    this.roomKey = await generateRoomKey(roomCode, memberPublicKeys);
  }

  async encrypt(plaintext) {
    if (!this.roomKey) throw new Error('Room key not set');
    return await encryptMessage(this.roomKey, plaintext);
  }

  async decrypt(encryptedData, iv) {
    if (!this.roomKey) throw new Error('Room key not set');
    return await decryptMessage(this.roomKey, encryptedData, iv);
  }

  async getFingerprint() {
    if (!this.keyPair) throw new Error('Key pair not generated');
    return await getKeyFingerprint(this.keyPair.publicKey);
  }
}
