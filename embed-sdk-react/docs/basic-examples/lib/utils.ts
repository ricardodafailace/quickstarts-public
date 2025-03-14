// utils.js
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuid } from "uuid";

// Embed Configuration and User-Specific Values
export const EMBED_PATH = "your_sigma_url_to_embed"; // Ensure this is exported

const CLIENT_ID = "your_client_id";
const SECRET = "your_secret";
const EMAIL = "your_test_embed_user_email";
const EXTERNAL_USER_ID = "123";
const ACCOUNT_TYPE = "Pro";
const EXTERNAL_USER_TEAM = "your_team";
const SESSION_LENGTH = "3600"; // Default session length

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function simpleHmac({ key, data }: { key: string; data: string }) {
  const encoder = new TextEncoder();
  const encodedKey = encoder.encode(key);
  const encodedData = encoder.encode(data);
  const hmacKey = await crypto.subtle.importKey("raw", encodedKey, { name: "HMAC", hash: "SHA-256" }, true, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", hmacKey, encodedData);
  return bufferToHex(signature);
}

export async function signEmbedUrl(dashboard: string): Promise<string> {
  if (!SECRET || !CLIENT_ID) {
    throw new Error("The Embed SECRET or CLIENT_ID is missing in the code");
  }

  const searchParamsObject = {
    ":client_id": CLIENT_ID,
    ":email": EMAIL,
    ":external_user_id": EXTERNAL_USER_ID,
    ":account_type": ACCOUNT_TYPE,
    ":external_user_team": EXTERNAL_USER_TEAM,
    ":session_length": SESSION_LENGTH,
    ":mode": "userbacked",
    ":nonce": uuid(),
    ":time": `${Math.floor(new Date().getTime() / 1000)}`,
  };

  const searchParams = new URLSearchParams(searchParamsObject);

  // Use dashboard parameter correctly to create the base URL
  const urlWithSearchParams = `${dashboard}?${searchParams.toString()}`;

  const signature = await simpleHmac({
    key: SECRET,
    data: urlWithSearchParams,
  });

  searchParams.append(":signature", signature);

  // Return the fully signed URL
  return `${dashboard}?${searchParams.toString()}`;
}