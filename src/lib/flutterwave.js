/**
 * Flutterwave V3 Inline JS wrapper
 * Uses Client ID (public) for the inline checkout modal
 * Business: HSPR Technologies
 * Site: https://eventmasters.live
 */

const FLW_PUBLIC_KEY = import.meta.env.VITE_FLW_PUBLIC_KEY ?? '';
const SITE_URL = 'https://eventmasters.live';

let scriptLoaded = false;
let scriptLoading = false;
const callbacks = [];

export function loadFlutterwaveScript() {
  return new Promise((resolve, reject) => {
    if (scriptLoaded) { resolve(); return; }
    callbacks.push({ resolve, reject });
    if (scriptLoading) return;
    scriptLoading = true;
    const script = document.createElement('script');
    script.src = 'https://checkout.flutterwave.com/v3.js';
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      scriptLoading = false;
      callbacks.forEach(cb => cb.resolve());
      callbacks.length = 0;
    };
    script.onerror = () => {
      scriptLoading = false;
      const err = new Error('Failed to load Flutterwave checkout script.');
      callbacks.forEach(cb => cb.reject(err));
      callbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export async function payWithFlutterwave({
  txRef, amount, email, name, phone, eventTitle, onSuccess, onClose,
}) {
  if (!FLW_PUBLIC_KEY) {
    throw new Error('Flutterwave public key not set. Add VITE_FLW_PUBLIC_KEY=FLWPUBK-xxx to Vercel environment variables.');
  }

  await loadFlutterwaveScript();

  if (!window.FlutterwaveCheckout) {
    throw new Error('FlutterwaveCheckout not available.');
  }

  window.FlutterwaveCheckout({
    public_key:      FLW_PUBLIC_KEY,
    tx_ref:          txRef,
    amount:          amount,
    currency:        'NGN',
    payment_options: 'card,banktransfer,ussd',
    customer: {
      email:        email,
      name:         name,
      phone_number: phone || '',
    },
    customizations: {
      title:       'HSPR Technologies',
      description: eventTitle,
      logo:        `${SITE_URL}/favicon.svg`,
    },
    callback: (response) => {
      if (response.status === 'successful' || response.status === 'completed') {
        onSuccess(response);
      } else {
        onClose && onClose(response);
      }
    },
    onclose: () => {
      onClose && onClose(null);
    },
  });
}

export function generateTxRef(eventId = '') {
  const shortId = (eventId || '').slice(0, 8).toUpperCase().replace(/-/g, '');
  const ts   = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EM-${shortId}-${ts}-${rand}`;
}
