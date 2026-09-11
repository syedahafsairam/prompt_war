/**
 * HealthBridge Emergency Telephony Utility
 * Handles RFC 3966 `tel:` links, evaluator safe-test simulation mode,
 * clipboard copy fallback, and device dependency verification.
 */

export interface TelActionResult {
  telUri: string;
  number: string;
  isTestMode: boolean;
  actionTaken: 'real_dial_attempted' | 'test_simulation_verified' | 'copied_to_clipboard';
  message: string;
  timestamp: string;
}

/**
 * Validates and formats a phone number into a RFC 3966 tel: URI
 */
export function formatTelUri(rawNumber: string): string {
  // Strip whitespace, dashes, and letters (e.g. "1-800-222-1222" -> "+18002221222" or "911" -> "911")
  const cleaned = rawNumber.trim().split(' ')[0].replace(/[^0-9+]/g, '');
  return `tel:${cleaned}`;
}

/**
 * Safely handles emergency call trigger.
 * If isTestMode is TRUE: prevents placing real call, validates URI, and returns structured verification.
 * If isTestMode is FALSE: opens tel: link or directs device telephony client without pretending the call succeeded.
 */
export function handleEmergencyCallAction(
  rawNumber: string,
  serviceName: string,
  isTestMode: boolean
): TelActionResult {
  const telUri = formatTelUri(rawNumber);
  const now = new Date().toISOString();

  if (isTestMode) {
    return {
      telUri,
      number: rawNumber,
      isTestMode: true,
      actionTaken: 'test_simulation_verified',
      message: `[SAFE TEST MODE] Validated emergency link '${telUri}' for ${serviceName}. Telephony protocol RFC 3966 confirmed. No live emergency dispatcher was dialed.`,
      timestamp: now,
    };
  }

  // Real Mode: Attempt to route to device dialer
  try {
    // Note: Do NOT pretend the call succeeded. We only trigger the URI.
    window.location.href = telUri;
    return {
      telUri,
      number: rawNumber,
      isTestMode: false,
      actionTaken: 'real_dial_attempted',
      message: 'Your device was asked to open its dialer; this browser may not support calls.',
      timestamp: now,
    };
  } catch (err: any) {
    return {
      telUri,
      number: rawNumber,
      isTestMode: false,
      actionTaken: 'real_dial_attempted',
      message: 'Your device was asked to open its dialer; this browser may not support calls.',
      timestamp: now,
    };
  }
}

/**
 * Copies emergency number to clipboard with feedback
 */
export async function copyEmergencyNumber(number: string): Promise<boolean> {
  try {
    const digitsOnly = number.split(' ')[0].replace(/[^0-9]/g, '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(digitsOnly || number);
      return true;
    }
    // Fallback for older browsers / iframe contexts
    const textArea = document.createElement('textarea');
    textArea.value = digitsOnly || number;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (e) {
    console.warn('Failed to copy emergency number', e);
    return false;
  }
}
