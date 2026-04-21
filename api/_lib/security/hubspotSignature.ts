import crypto from 'crypto';
import type { VercelRequest } from '@vercel/node';

/**
 * Validates the HubSpot V3 Signature.
 */
export function verifyHubSpotSignature(
  rawBody: string,
  signatureHeader: string | string[] | undefined,
  timestampHeader: string | string[] | undefined,
  secret: string | undefined,
  method: string,
  fullUri: string
): boolean {
  if (!signatureHeader || !timestampHeader || !secret) {
    return false;
  }

  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const timestamp = Array.isArray(timestampHeader) ? timestampHeader[0] : timestampHeader;

  // Reject payloads older than 5 minutes (300,000 ms) to prevent replay attacks
  const now = Date.now();
  const timestampMs = parseInt(timestamp, 10);
  if (now - timestampMs > 300000) {
    console.error('[HubSpot Security] Signature rejected: Timestamp is older than 5 minutes.');
    return false;
  }

  // Construct the source string: HTTP_METHOD + URI + RAW_BODY + TIMESTAMP
  const sourceString = method + fullUri + rawBody + timestamp;
  
  // Hash the source string using SHA-256 and the App Secret
  const hash = crypto.createHmac('sha256', secret).update(sourceString, 'utf8').digest('base64');

  // Perform secure, constant-time comparison
  try {
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch (err) {
    return false; // Returns false if length mismatch
  }
}

/**
 * A helper to read the raw body from a Vercel function stream
 * Requires exporting config = { api: { bodyParser: false } } in the route.
 */
export async function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    req.on('data', (chunk) => {
      rawBody += chunk.toString();
    });
    req.on('end', () => resolve(rawBody));
    req.on('error', (err) => reject(err));
  });
}
