import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

export default function PaymentResult() {
  const [params]  = useSearchParams();
  const [status,  setStatus]  = useState('checking');
  const [order,   setOrder]   = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const ref = params.get('tx_ref') || params.get('transaction_id') || params.get('payment_intent') || params.get('session_id');
    if (!ref) { setStatus('error'); return; }

    const poll = async (tries = 0) => {
      setAttempt(tries + 1);
      try {
        const { data: o } = await supabase
          .from('orders')
          .select('*, events(title,slug,start_at,venue_name), order_items(quantity,unit_price,ticket_types(name),tickets(ticket_code))')
          .or(`provider_reference.eq.${ref}`)
          .single();
        if (o?.status === 'paid')   { setOrder(o); setStatus('success'); }
        else if (o?.status === 'failed') { setStatus('failed'); }
        else if (tries < 7) setTimeout(() => poll(tries + 1), 2500);
        else { setOrder(o); setStatus('pending'); }
      } catch { if (tries < 3) setTimeout(() => poll(tries + 1), 2500); else setStatus('error'); }
    };
    poll();
  }, []);

  return (
    <div className="payment-result-wrap">
      {status === 'checking' && (
        <>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--line)', borderTopColor: 'var(--amber)', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>Confirming payment…</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem' }}>This usually takes a few seconds{attempt > 1 ? ` (attempt ${attempt})` : ''}.</p>
        </>
      )}
      {status === 'success' && order && (
        <>
          <p style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--green)', marginBottom: 8 }}>Payment confirmed!</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem', marginBottom: 20 }}>Your tickets have been issued. {order.ticket_email_sent_at ? 'A copy has also been sent to your email.' : 'Your email copy is still being processed; your tickets are available below.'}</p>
          <div style={{ background: 'var(--ink-2)', border: '1.5px solid var(--line)', borderRadius: 14, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: '#fff', marginBottom: 10 }}>{order.events?.title}</p>
            {order.order_items?.map(item => (
              <div key={item.id} style={{ borderTop: '1px solid var(--line)', paddingTop: 8, marginTop: 8 }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--slate)', marginBottom: 4 }}>{item.quantity}× {item.ticket_types?.name}</p>
                {item.tickets?.map(t => (
                  <p key={t.ticket_code} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--amber)', letterSpacing: '0.08em' }}>{t.ticket_code}</p>
                ))}
              </div>
            ))}
          </div>
          <Link to="/my-tickets" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 10, padding: '14px' }}>View My Tickets & QR Codes</Link>
          <Link to="/events" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>Browse More Events</Link>
        </>
      )}
      {status === 'pending' && (
        <>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>⏳</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: '#fff', marginBottom: 8 }}>Payment processing</h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem', marginBottom: 20 }}>Still confirming. Check My Tickets in a moment — your tickets will appear once confirmed.</p>
          <Link to="/my-tickets" className="btn btn-primary" style={{ marginRight: 10 }}>My Tickets</Link>
          <Link to="/events" className="btn btn-ghost">Browse Events</Link>
        </>
      )}
      {(status === 'failed' || status === 'error') && (
        <>
          <p style={{ fontSize: '2.5rem', marginBottom: 12 }}>❌</p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--coral)', marginBottom: 8 }}>
            {status === 'failed' ? 'Payment not completed' : 'Could not find your order'}
          </h2>
          <p style={{ color: 'var(--slate)', fontSize: '0.88rem', marginBottom: 20 }}>
            {status === 'failed' ? 'No charge was made. Please try again.' : 'If you were charged, check My Tickets or contact support.'}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/events" className="btn btn-primary">Try Again</Link>
            <a href="https://wa.me/2346730044" target="_blank" rel="noopener noreferrer" className="btn btn-ghost">WhatsApp Support</a>
          </div>
        </>
      )}
    </div>
  );
}
