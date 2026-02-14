export async function encryptE2EData(data: string, apiKey: string): Promise<string> {
  // Hash the key to get 256 bits
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const keyHash = await crypto.subtle.digest("SHA-256", keyData);

  // Import key for AES-GCM
  const key = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );

  // Generate random IV (12 bytes)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data),
  );

  // Combine IV and ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Encode as base64
  return btoa(String.fromCharCode(...combined));
}

export async function decryptE2EData(encryptedData: string, apiKey: string): Promise<string> {
  // Decode base64
  const binaryString = atob(encryptedData);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Extract IV and ciphertext
  const iv = bytes.slice(0, 12);
  const ciphertext = bytes.slice(12);

  // Hash the key
  const encoder = new TextEncoder();
  const keyData = encoder.encode(apiKey);
  const keyHash = await crypto.subtle.digest("SHA-256", keyData);

  // Import key
  const key = await crypto.subtle.importKey(
    "raw",
    keyHash,
    { name: "AES-GCM" },
    false,
    ["decrypt"],
  );

  // Decrypt
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return new TextDecoder().decode(decrypted);
}
