import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, WhatsappIcon, ArrowLeft01Icon, Ticket01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { payWithFlutterwave, generateTxRef } from '../lib/flutterwave';

function fmt(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }

const STEPS = ['Details', 'Pay', 'Done'];

export default function Checkout() {
  const { state: cart } = useLocation();
  const navigate        = useNavigate();
  const { user, profile } = useAuth();

  const [step,       setStep]       = useState(0); // 0=details, 1=paying, 2=done
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [txRef,      setTxRef]      = useState('');
  const [paidOrder,  setPaidOrder]  = useState(null);
  const [emailSent,  setEmailSent]  = useState(false);

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (user?.email)        setEmail(user.email);
    if (profile?.phone)     setPhone(profile.phone ?? '');
  }, [profile, user]);

  if (!cart) return (
    <div style={{ padding: '80px 16px', textAlign: 'center' }}>
      <p style={{ color: 'var(--slate)', marginBottom: 16 }}>No tickets selected.</p>
      <Link to="/events" className="btn btn-primary">Browse Events</Link>
    </div>
  );

  // ── Step 1: Create pending order then open Flutterwave modal ──
  const handlePay = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError(''); setLoading(true);

    try {
      // 1. Create pending order in DB (server-side via edge function)
      const ref = generateTxRef(cart.eventId);
      setTxRef(ref);

      const { data, error: fnErr } = await supabase.functions.invoke('create-payment', {
        body: {
          provider:    'flutterwave',
          eventId:     cart.eventId,
          buyerName:   name.trim(),
          buyerEmail:  email.trim(),
          buyerPhone:  phone.trim() || null,
          buyerId:     user?.id ?? null,
          currency:    'NGN',
          items:       cart.items,
          amountTotal: cart.total,
          txRef:       ref,
          useInline:   true, // tells edge fn not to call FLW API — we'll do it client-side
        },
      });

      if (fnErr) throw fnErr;
      setLoading(false);
      setStep(1); // move to "paying" step

      // Use the server-verified total returned by create-payment.
      const verifiedAmount = Number(data?.amount);
      if (!Number.isFinite(verifiedAmount) || verifiedAmount <= 0) {
        throw new Error('Invalid payment amount returned by server.');
      }

      // 2. Open Flutterwave V3 inline modal
      await payWithFlutterwave({
        txRef:       ref,
        amount:      verifiedAmount,
        email:       email.trim(),
        name:        name.trim(),
        phone:       phone.trim(),
        eventTitle:  cart.eventTitle,
        onSuccess:   async (response) => {
          setStep(1);
          await confirmPayment(ref, response.transaction_id);
        },
        onClose: (response) => {
          if (!response || response.status !== 'successful') {
            setStep(0);
            setError('Payment was not completed. Your cart is still saved — try again when ready.');
          }
        },
      });

    } catch (err) {
      console.error(err);
      setStep(0);
      setError(err.message || 'Could not start payment. Please try again.');
      setLoading(false);
    }
  };

  // ── Step 2: Verify with backend after modal closes ──
  const confirmPayment = async (ref, transactionId) => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('verify-payment', {
        body: { txRef: ref, transactionId, provider: 'flutterwave' },
      });
      if (fnErr) throw fnErr;
      if (data?.order) {
        setPaidOrder(data.order);
        setEmailSent(Boolean(data.emailSent || data.order.ticket_email_sent_at));
        setStep(2);
      } else {
        // Webhook may still be processing — poll the order
        await pollOrder(ref);
      }
    } catch (err) {
      console.error('Verify error:', err);
      await pollOrder(ref);
    }
  };

  const pollOrder = async (ref, tries = 0) => {
    try {
      const { data: order } = await supabase
        .from('orders')
        .select('*, order_items(*, ticket_types(name), tickets(ticket_code))')
        .eq('provider_reference', ref)
        .single();

      if (order?.status === 'paid') {
        setPaidOrder(order);
        setStep(2);
      } else if (tries < 8) {
        setTimeout(() => pollOrder(ref, tries + 1), 2500);
      } else {
        // Still pending — send to payment-result page
        navigate(`/payment-result?tx_ref=${ref}`);
      }
    } catch {
      if (tries < 8) setTimeout(() => pollOrder(ref, tries + 1), 2500);
      else navigate(`/payment-result?tx_ref=${ref}`);
    }
  };

  // ── RENDER: Step indicator ──
  const StepBar = () => (
    <div style={S.stepBar}>
      {STEPS.map((s, i) => (
        <div key={s} style={S.stepItem}>
          <div style={{
            ...S.stepDot,
            background: i <= step ? 'var(--amber)' : 'var(--ink-3)',
            border: `2px solid ${i <= step ? 'var(--amber)' : 'var(--line)'}`,
            color: i <= step ? 'var(--ink)' : 'var(--slate)',
          }}>
            {i < step ? '✓' : i + 1}
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: i <= step ? 'var(--paper)' : 'var(--slate)', marginTop: 4 }}>
            {s}
          </span>
          {i < STEPS.length - 1 && (
            <div style={{ ...S.stepLine, background: i < step ? 'var(--amber)' : 'var(--line)' }} />
          )}
        </div>
      ))}
    </div>
  );

  // ── STEP 2: Paying (modal is open) ──
  if (step === 1) return (
    <div className="checkout-wrap" style={{ textAlign: 'center' }}>
      <StepBar />
      <div style={S.payingBox}>
        <div style={S.payingSpinner} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', margin: '20px 0 8px' }}>
          Complete your payment
        </h2>
        <p style={{ color: 'var(--slate)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 20 }}>
          The Flutterwave payment window has opened.<br />
          Complete your payment there — this page will update automatically.
        </p>
        <div style={S.payingAmount}>{fmt(cart.total)}</div>
        <p style={{ color: 'var(--slate-2)', fontSize: '0.75rem', marginTop: 12 }}>
          <HugeiconsIcon icon={Shield01Icon} size={12} color="var(--slate-2)" style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Secured by Flutterwave · SSL Encrypted
        </p>
      </div>
    </div>
  );

  // ── STEP 3: Done ──
  if (step === 2) return (
    <div className="checkout-wrap" style={{ textAlign: 'center' }}>
      <StepBar />
      <div style={S.doneBox}>
        <div style={S.doneIcon}>
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={56} color="var(--green)" />
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: '#fff', margin: '16px 0 8px' }}>
          Payment confirmed!
        </h2>
        <p style={{ color: 'var(--slate)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
          Your tickets have been issued. {emailSent ? <>A copy has also been sent to <strong style={{ color: 'var(--paper)' }}>{email}</strong>.</> : <>Your email copy is still being processed — you can access the tickets below.</>}
        </p>

        {/* Ticket codes */}
        {paidOrder?.order_items?.length > 0 && (
          <div style={S.ticketCodes}>
            {paidOrder.order_items.map(item =>
              item.tickets?.map(t => (
                <div key={t.ticket_code} style={S.ticketCodeRow}>
                  <HugeiconsIcon icon={Ticket01Icon} size={14} color="var(--amber)" />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em' }}>
                    {t.ticket_code}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--slate)' }}>{item.ticket_types?.name}</span>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
          <Link to="/my-tickets" className="btn btn-primary" style={{ justifyContent: 'center', padding: '14px' }}>
            View My Tickets & QR Codes →
          </Link>
          <Link to="/events" className="btn btn-ghost" style={{ justifyContent: 'center', padding: '14px' }}>
            Browse More Events
          </Link>
        </div>
        <p style={{ fontSize: '0.72rem', color: 'var(--slate-2)', marginTop: 16 }}>
          EventMasters by HSPR Technologies · eventmasters.live
        </p>
      </div>
    </div>
  );

  // ── STEP 0: Details form ──
  return (
    <div className="checkout-wrap">
      <Link to={`/events/${cart.eventSlug}`}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--slate)', marginBottom: 16 }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={13} color="var(--slate)" /> Back to event
      </Link>

      <StepBar />

      <h1 className="checkout-title">Checkout</h1>
      <p style={{ color: 'var(--slate)', marginBottom: 20, fontSize: '0.9rem' }}>{cart.eventTitle}</p>

      {/* Guest notice */}
      {!user && (
        <div style={S.guestBanner}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3 }}>✨ No account needed</p>
          <p style={{ color: 'var(--slate)', fontSize: '0.8rem', lineHeight: 1.5 }}>
            Buy as a guest — just enter your name and email. Tickets go to your inbox.{' '}
            <Link to="/sign-in" style={{ color: 'var(--amber)', fontWeight: 700 }}>Have an account? Sign in</Link>
          </p>
        </div>
      )}

      {/* Order summary */}
      <div className="checkout-section">
        <h3 className="checkout-section-title">Order summary</h3>
        {cart.items.map(item => (
          <div key={item.ticketTypeId} className="checkout-summary-row">
            <div>
              <p className="checkout-summary-name">{item.name}</p>
              <p className="checkout-summary-sub">{item.quantity} × {fmt(item.price)}</p>
            </div>
            <span className="checkout-summary-amt">{fmt(item.price * item.quantity)}</span>
          </div>
        ))}
        <div className="checkout-total-row">
          <span className="checkout-total-label">Total</span>
          <span className="checkout-total-amt">{fmt(cart.total)}</span>
        </div>
      </div>

      {/* Buyer details + payment */}
      <div className="checkout-section">
        <h3 className="checkout-section-title">Your details</h3>
        <form onSubmit={handlePay}>
          <div className="field">
            <label>Full name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Chukwuemeka Okafor" required autoComplete="name" />
          </div>
          <div className="field">
            <label>Email address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" required autoComplete="email" />
            <span style={{ fontSize: '0.7rem', color: 'var(--slate-2)', marginTop: 4, display: 'block' }}>
              Your tickets will be sent here
            </span>
          </div>
          <div className="field">
            <label>Phone <span style={{ color: 'var(--slate-2)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+234 800 000 0000" autoComplete="tel" />
          </div>

          {/* Payment method */}
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Payment method
            </p>

            <div style={S.flwCard}>
              <div style={S.flwLogo}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--ink)', letterSpacing: '-0.02em' }}>Flutterwave</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', marginBottom: 3 }}>Pay with Flutterwave</p>
                <div style={S.flwMethods}>
                  {['💳 Card', '🏦 Bank Transfer', '📱 USSD', '📲 Mobile Money'].map(m => (
                    <span key={m} style={S.flwMethodTag}>{m}</span>
                  ))}
                </div>
              </div>
              <div style={S.flwCheck}>✓</div>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--slate-2)', marginTop: 8, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 5 }}>
              <HugeiconsIcon icon={Shield01Icon} size={11} color="var(--slate-2)" />
              Secured by Flutterwave · 256-bit SSL · Card details never stored on EventMasters
            </p>
          </div>

          {error && (
            <div style={S.errorBox}>⚠ {error}</div>
          )}

          <button className="btn btn-primary" disabled={loading}
            style={{ width: '100%', padding: '16px', fontSize: '1rem', borderRadius: 14, marginTop: 8, gap: 10 }}>
            {loading
              ? <><Spinner sm /> Creating order…</>
              : <>
                  <HugeiconsIcon icon={Ticket01Icon} size={18} />
                  Pay {fmt(cart.total)} with Flutterwave
                </>
            }
          </button>

          <p style={{ fontSize: '0.68rem', color: 'var(--slate-2)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
            By continuing you agree to EventMasters'{' '}
            <Link to="/terms" style={{ color: 'var(--slate)' }}>Terms</Link>.
            Tickets are non-refundable unless an event is cancelled.
          </p>
        </form>
      </div>

      {/* Support */}
      <div style={{ textAlign: 'center', padding: '4px 0 20px' }}>
        <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--slate)' }}>
          <HugeiconsIcon icon={WhatsappIcon} size={14} color="var(--green)" />
          Need help? WhatsApp us
        </a>
      </div>
    </div>
  );
}

function Spinner({ sm }) {
  const size = sm ? 14 : 20;
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', border: `2px solid rgba(0,0,0,0.2)`, borderTopColor: 'var(--ink)', animation: 'spin 0.7s linear infinite', display: 'inline-block', flexShrink: 0 }} />
  );
}

const S = {
  stepBar: { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, marginBottom: 28, position: 'relative' },
  stepItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1 },
  stepDot: { width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, transition: 'all 0.3s ease', zIndex: 1 },
  stepLine: { position: 'absolute', top: 14, left: '50%', width: '100%', height: 2, transition: 'background 0.3s ease', zIndex: 0 },

  guestBanner: { background: 'rgba(16,217,122,0.06)', border: '1px solid rgba(16,217,122,0.18)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 },

  flwCard: { background: 'linear-gradient(135deg, rgba(245,166,35,0.08), rgba(245,166,35,0.04))', border: '1.5px solid rgba(245,166,35,0.3)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 12 },
  flwLogo: { background: 'var(--amber)', borderRadius: 8, padding: '6px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  flwMethods: { display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  flwMethodTag: { fontSize: '0.65rem', fontWeight: 600, color: 'var(--slate)', background: 'var(--ink-3)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--line)' },
  flwCheck: { color: 'var(--amber)', fontWeight: 800, fontSize: '1.1rem', marginLeft: 'auto', flexShrink: 0 },

  errorBox: { background: 'rgba(255,77,109,0.08)', border: '1px solid rgba(255,77,109,0.3)', borderRadius: 10, padding: '12px 14px', color: 'var(--coral)', fontSize: '0.85rem', marginBottom: 12 },

  payingBox: { background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 20, padding: '40px 24px', textAlign: 'center', marginTop: 8 },
  payingSpinner: { width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--line)', borderTopColor: 'var(--amber)', animation: 'spin 0.8s linear infinite', margin: '0 auto' },
  payingAmount: { fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 700, color: 'var(--amber)', margin: '4px 0' },

  doneBox: { background: 'var(--ink-2)', border: '1.5px solid rgba(16,217,122,0.3)', borderRadius: 20, padding: '36px 24px', marginTop: 8 },
  doneIcon: { display: 'flex', justifyContent: 'center', marginBottom: 4 },
  ticketCodes: { background: 'var(--ink-3)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' },
  ticketCodeRow: { display: 'flex', alignItems: 'center', gap: 10 },
};
