import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Shield01Icon, WhatsappIcon, ArrowLeft01Icon, Ticket01Icon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { PromoCodes } from '../lib/apiClient';
import { payWithFlutterwave, generateTxRef } from '../lib/flutterwave';

function fmt(n) { return n === 0 ? 'FREE' : '₦' + Number(n).toLocaleString('en-NG'); }
const STEPS = ['Details', 'Pay', 'Done'];

export default function Checkout() {
  const { state: cart } = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [step,       setStep]       = useState(0);
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [error,      setError]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [paidOrder,  setPaidOrder]  = useState(null);

  // Promo code
  const [promoInput,    setPromoInput]    = useState('');
  const [promoLoading,  setPromoLoading]  = useState(false);
  const [promoError,    setPromoError]    = useState('');
  const [promoApplied,  setPromoApplied]  = useState(null); // { id, discount_type, discount_value, code }

  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
    if (user?.email)        setEmail(user.email);
    if (profile?.phone)     setPhone(profile.phone ?? '');
  }, [profile, user]);

  if (!cart) return (
    <div style={{ padding:'80px 16px', textAlign:'center' }}>
      <p style={{ color:'var(--slate)', marginBottom:16 }}>No tickets selected.</p>
      <Link to="/events" className="btn btn-primary">Browse Events</Link>
    </div>
  );

  // Compute discount
  const baseTotal = cart.total;
  let discount = 0;
  if (promoApplied) {
    if (promoApplied.discount_type === 'percent') {
      discount = Math.round(baseTotal * promoApplied.discount_value / 100);
    } else {
      discount = Math.min(Number(promoApplied.discount_value), baseTotal);
    }
  }
  const finalTotal = Math.max(0, baseTotal - discount);

  const applyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true); setPromoError(''); setPromoApplied(null);
    try {
      const result = await PromoCodes.validate(promoInput.trim(), cart.eventId);
      if (result?.valid) {
        setPromoApplied({ ...result, code: promoInput.trim().toUpperCase() });
      } else {
        setPromoError(result?.error || 'Invalid or expired promo code.');
      }
    } catch {
      setPromoError('Could not validate code. Try again.');
    } finally { setPromoLoading(false); }
  };

  const removePromo = () => { setPromoApplied(null); setPromoInput(''); setPromoError(''); };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return; }
    setError(''); setLoading(true);
    try {
      const ref = generateTxRef(cart.eventId);
      const { data, error: fnErr } = await supabase.functions.invoke('create-payment', {
        body: {
          provider: 'flutterwave', eventId: cart.eventId,
          buyerName: name.trim(), buyerEmail: email.trim(),
          buyerPhone: phone.trim() || null, buyerId: user?.id ?? null,
          currency: 'NGN', items: cart.items,
          amountTotal: finalTotal, txRef: ref,
          useInline: true,
          promoCodeId: promoApplied?.id || null,
          discountAmount: discount,
        },
      });
      if (fnErr) throw fnErr;
      setLoading(false); setStep(1);
      await payWithFlutterwave({
        txRef: ref, amount: finalTotal,
        email: email.trim(), name: name.trim(), phone: phone.trim(),
        eventTitle: cart.eventTitle,
        onSuccess: async (response) => {
          setStep(1);
          await confirmPayment(ref, response.transaction_id);
        },
        onClose: () => { setStep(0); setError('Payment was not completed. Try again.'); },
      });
    } catch (err) {
      setStep(0); setError(err.message || 'Could not start payment. Please try again.');
      setLoading(false);
    }
  };

  const confirmPayment = async (ref, transactionId) => {
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('verify-payment', {
        body: { txRef: ref, transactionId, provider: 'flutterwave' },
      });
      if (fnErr) throw fnErr;
      if (data?.order) { setPaidOrder(data.order); setStep(2); }
      else await pollOrder(ref);
    } catch { await pollOrder(ref); }
  };

  const pollOrder = async (ref, tries = 0) => {
    try {
      const { data: order } = await supabase.from('orders')
        .select('*, order_items(*, ticket_types(name), tickets(ticket_code))')
        .eq('provider_reference', ref).single();
      if (order?.status === 'paid') { setPaidOrder(order); setStep(2); }
      else if (tries < 8) setTimeout(() => pollOrder(ref, tries + 1), 2500);
      else navigate(`/payment-result?tx_ref=${ref}`);
    } catch {
      if (tries < 8) setTimeout(() => pollOrder(ref, tries + 1), 2500);
      else navigate(`/payment-result?tx_ref=${ref}`);
    }
  };

  // Step bar
  const StepBar = () => (
    <div className="step-bar" style={{ marginBottom:24 }}>
      {STEPS.map((s, i) => (
        <div key={s} className="step-item">
          <div className={`step-dot ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>
            {i < step ? '✓' : i + 1}
          </div>
          <span className={`step-label ${i < step ? 'done' : i === step ? 'active' : 'pending'}`}>{s}</span>
          {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : 'pending'}`} />}
        </div>
      ))}
    </div>
  );

  if (step === 1) return (
    <div className="checkout-wrap" style={{ textAlign:'center' }}>
      <StepBar />
      <div className="paying-box">
        <div className="paying-spinner" />
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.4rem', color:'var(--ink)', margin:'20px 0 8px' }}>Complete your payment</h2>
        <p style={{ color:'var(--slate)', fontSize:'0.88rem', lineHeight:1.6, marginBottom:16 }}>The Flutterwave window has opened. Complete payment there — this page updates automatically.</p>
        <div className="paying-amount">{fmt(finalTotal)}</div>
        <p style={{ color:'var(--slate-2)', fontSize:'0.75rem', marginTop:12, display:'flex', alignItems:'center', gap:5, justifyContent:'center' }}>
          <HugeiconsIcon icon={Shield01Icon} size={12} color="var(--slate-2)" /> Secured by Flutterwave · SSL Encrypted
        </p>
      </div>
    </div>
  );

  if (step === 2) return (
    <div className="checkout-wrap" style={{ textAlign:'center' }}>
      <StepBar />
      <div className="done-box">
        <div className="done-icon"><HugeiconsIcon icon={CheckmarkCircle01Icon} size={56} color="var(--green)" /></div>
        <h2 style={{ fontFamily:'var(--font-display)', fontSize:'1.8rem', color:'var(--ink)', margin:'12px 0 8px' }}>Payment confirmed!</h2>
        <p style={{ color:'var(--slate)', fontSize:'0.9rem', lineHeight:1.6, marginBottom:20 }}>
          Tickets sent to <strong style={{ color:'var(--ink)' }}>{email}</strong>
        </p>
        {paidOrder?.order_items?.length > 0 && (
          <div className="ticket-codes-list">
            {paidOrder.order_items.map(item => item.tickets?.map(t => (
              <div key={t.ticket_code} className="ticket-code-row">
                <HugeiconsIcon icon={Ticket01Icon} size={14} color="var(--purple)" />
                <span style={{ fontFamily:'var(--font-mono)', fontSize:'0.85rem', fontWeight:700, color:'var(--purple)', letterSpacing:'0.08em' }}>{t.ticket_code}</span>
                <span style={{ fontSize:'0.72rem', color:'var(--slate)' }}>{item.ticket_types?.name}</span>
              </div>
            )))}
          </div>
        )}
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:20 }}>
          <Link to="/my-tickets" className="btn btn-primary" style={{ justifyContent:'center', padding:'14px' }}>View My Tickets & QR Codes →</Link>
          <Link to="/events" className="btn btn-ghost" style={{ justifyContent:'center', padding:'14px' }}>Browse More Events</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="checkout-wrap">
      <Link to={`/events/${cart.eventSlug}`} style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.8rem', color:'var(--slate)', marginBottom:16 }}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={13} color="var(--slate)" /> Back to event
      </Link>
      <StepBar />
      <h1 className="checkout-title">Checkout</h1>
      <p style={{ color:'var(--slate)', marginBottom:20, fontSize:'0.9rem' }}>{cart.eventTitle}</p>

      {!user && (
        <div style={{ background:'var(--green-light)', border:'1px solid var(--green)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
          <p style={{ fontWeight:700, fontSize:'0.88rem', marginBottom:3, color:'#065F46' }}>✨ No account needed</p>
          <p style={{ color:'#065F46', fontSize:'0.8rem', lineHeight:1.5 }}>
            Buy as a guest.{' '}
            <Link to="/sign-in" style={{ color:'var(--purple)', fontWeight:700 }}>Have an account? Sign in</Link>
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

        {/* Promo code section */}
        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--line)' }}>
          {promoApplied ? (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--green-light)', borderRadius:10, padding:'10px 14px' }}>
              <div>
                <p style={{ fontWeight:700, fontSize:'0.82rem', color:'#065F46' }}>
                  ✓ Promo code: <strong>{promoApplied.code}</strong>
                </p>
                <p style={{ fontSize:'0.75rem', color:'#065F46', marginTop:2 }}>
                  {promoApplied.discount_type === 'percent' ? `${promoApplied.discount_value}% off` : `₦${Number(promoApplied.discount_value).toLocaleString()} off`}
                </p>
              </div>
              <button onClick={removePromo} style={{ background:'none', border:'none', color:'#065F46', cursor:'pointer', fontWeight:700, fontSize:'0.8rem' }}>Remove</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                placeholder="Promo code"
                style={{ flex:1, background:'var(--bg)', border:'1.5px solid var(--line-2)', borderRadius:10, padding:'10px 12px', color:'var(--ink)', fontFamily:'var(--font-mono)', fontSize:'0.88rem', outline:'none', letterSpacing:'0.05em' }}
              />
              <button onClick={applyPromo} disabled={promoLoading || !promoInput.trim()} className="btn btn-light btn-sm" style={{ flexShrink:0 }}>
                {promoLoading ? '…' : 'Apply'}
              </button>
            </div>
          )}
          {promoError && <p style={{ color:'var(--coral)', fontSize:'0.78rem', marginTop:6 }}>{promoError}</p>}
        </div>

        {/* Totals */}
        {discount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', fontSize:'0.85rem' }}>
            <span style={{ color:'var(--slate)' }}>Subtotal</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--slate)' }}>{fmt(baseTotal)}</span>
          </div>
        )}
        {discount > 0 && (
          <div style={{ display:'flex', justifyContent:'space-between', padding:'6px 0 0', fontSize:'0.85rem' }}>
            <span style={{ color:'var(--green)' }}>Discount</span>
            <span style={{ fontFamily:'var(--font-mono)', color:'var(--green)', fontWeight:700 }}>−{fmt(discount)}</span>
          </div>
        )}
        <div className="checkout-total-row">
          <span className="checkout-total-label">Total</span>
          <span className="checkout-total-amt">{fmt(finalTotal)}</span>
        </div>
      </div>

      {/* Buyer details */}
      <div className="checkout-section">
        <h3 className="checkout-section-title">Your details</h3>
        <form onSubmit={handlePay}>
          <div className="field"><label>Full name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Chukwuemeka Okafor" required autoComplete="name" /></div>
          <div className="field">
            <label>Email address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            <span style={{ fontSize:'0.7rem', color:'var(--slate-2)', marginTop:4, display:'block' }}>Tickets sent here</span>
          </div>
          <div className="field"><label>Phone <span style={{ color:'var(--slate-2)', fontWeight:400, textTransform:'none' }}>(optional)</span></label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" autoComplete="tel" /></div>

          {/* Payment method */}
          <div style={{ marginTop:4, marginBottom:16 }}>
            <p style={{ fontSize:'0.68rem', fontWeight:700, color:'var(--slate)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>Payment method</p>
            <div className="flw-card">
              <div className="flw-logo-badge"><span style={{ fontWeight:900, fontSize:'0.82rem', color:'#fff' }}>FLW</span></div>
              <div style={{ flex:1 }}>
                <p style={{ fontWeight:700, fontSize:'0.88rem', color:'var(--ink)', marginBottom:4 }}>Flutterwave</p>
                <div className="flw-methods">
                  {['💳 Card','🏦 Bank Transfer','📱 USSD','📲 Mobile Money'].map(m => (
                    <span key={m} className="flw-method-tag">{m}</span>
                  ))}
                </div>
              </div>
              <span style={{ color:'var(--green)', fontWeight:800, fontSize:'1.1rem' }}>✓</span>
            </div>
            <p style={{ fontSize:'0.7rem', color:'var(--slate-2)', marginTop:8, display:'flex', alignItems:'center', gap:5 }}>
              <HugeiconsIcon icon={Shield01Icon} size={11} color="var(--slate-2)" />
              Secured by Flutterwave · 256-bit SSL · Card details never stored
            </p>
          </div>

          {error && <div style={{ background:'var(--coral-light)', border:'1px solid var(--coral)', borderRadius:10, padding:'12px 14px', color:'#991B1B', fontSize:'0.85rem', marginBottom:12 }}>⚠ {error}</div>}

          <button className="btn btn-primary" disabled={loading} style={{ width:'100%', padding:'15px', fontSize:'1rem', borderRadius:14, marginTop:8, gap:10 }}>
            {loading
              ? <><span style={{ width:16, height:16, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block', marginRight:8 }} />Processing…</>
              : <><HugeiconsIcon icon={Ticket01Icon} size={18} />Pay {fmt(finalTotal)} with Flutterwave</>
            }
          </button>
          <p style={{ fontSize:'0.68rem', color:'var(--slate-2)', textAlign:'center', marginTop:10, lineHeight:1.5 }}>
            By continuing you agree to EventMasters' <Link to="/terms" style={{ color:'var(--slate)' }}>Terms</Link>.
          </p>
        </form>
      </div>

      <div style={{ textAlign:'center', padding:'4px 0 20px' }}>
        <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:'0.8rem', color:'var(--slate)' }}>
          <HugeiconsIcon icon={WhatsappIcon} size={14} color="var(--green)" /> Need help? WhatsApp us
        </a>
      </div>
    </div>
  );
}
