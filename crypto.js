async function encryptAes(data, aesKey) {
  //data arg -> Uint8Array
  const encodedData = new TextEncoder().encode(data);

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    encodedData,
  );

  //ArrayBuffer -> Uint8Array
  return [iv, new Uint8Array(encryptedData)];
}

async function decryptAes(buf, aesKey) {
  const iv = new Uint8Array(buf, 0, 12);
  const data = new Uint8Array(buf, 12);

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    data,
  );

  return decryptedData;
}

async function encryptAESKey(publicKey, aesKey) {
  // Export the AES key as a raw format (for RSA encryption)
  const exportedKey = await crypto.subtle.exportKey("raw", aesKey);
  const encryptedAESKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" }, // RSA encryption algorithm
    publicKey, // Server's public key
    exportedKey, // AES key to encrypt
  );
  return encryptedAESKey;
}

async function generateAESKey() {
  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  return key;
}

async function fetchPublicKey() {
  const response = await fetch("./public_key.pem");
  if (!response.ok) {
    throw new Error("Failed to fetch the public key");
  }
  const publicKeyPem = await response.text();

  const base64Key = publicKeyPem
    .replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");

  const binaryDerString = window.atob(base64Key);
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  const key = binaryDer.buffer;

  const publicKey = await crypto.subtle.importKey(
    "spki",
    key,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  console.log(publicKey);

  return publicKey;
}

const async_publicKey = fetchPublicKey();

async function encryptMsg(msg) {
  const sym_key = await generateAESKey();

  const bkey = await encryptAESKey(await async_publicKey, sym_key);
  const bkey_array = new Uint8Array(bkey);
  const [biv, text] = await encryptAes(JSON.stringify(msg), sym_key);

  let bdata = new Uint8Array(bkey_array.length + biv.length + text.length);

  bdata.set(bkey_array, 0);
  bdata.set(biv, bkey_array.length);
  bdata.set(text, bkey_array.length + biv.length);

  return [bdata, sym_key];
}

const code = document.cookie
  .split("; ")
  .find((row) => row.startsWith("code="))
  ?.split("=")[1];
