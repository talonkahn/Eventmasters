import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { Ticket01Icon, QrCode01Icon } from '@hugeicons/core-free-icons';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { day:'numeric', month:'long', year:'numeric' });
}

export default function MyTickets() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [qr,       setQr]       = useState(null);

  useEffect(() => {
    if (!user) { navigate('/sign-in'); return; }
    supabase
      .from('orders')
      .select('*, events(title,slug,start_at,venue_name,states(name)), order_items(*, ticket_types(name), tickets(*))')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    document.body.style.overflow = qr ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [qr]);

  const upcoming = orders.filter(o => o.status === 'paid' && new Date(o.events?.start_at) > new Date());
  const past     = orders.filter(o => o.status === 'paid' && new Date(o.events?.start_at) <= new Date());
  const pending  = orders.filter(o => o.status === 'pending');

  if (loading) return <Spinner />;

  return (
    <div className="tickets-wrap">
      <div className="tickets-header">
        <div>
          <h1 className="tickets-title">My Tickets</h1>
          <p style={{ color: 'var(--slate)', fontSize: '0.85rem' }}>
            {orders.filter(o => o.status === 'paid').length} purchase{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/events" className="btn btn-primary btn-sm">Find Events</Link>
      </div>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <HugeiconsIcon icon={Ticket01Icon} size={48} color="var(--line)" />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', margin: '14px 0 8px', color: '#fff' }}>
            No tickets yet
          </h2>
          <p style={{ color: 'var(--slate)', marginBottom: 20, fontSize: '0.88rem' }}>
            Find something to go to!
          </p>
          <Link to="/events" className="btn btn-primary">Browse Events</Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && <Section title="Upcoming" orders={upcoming} expanded={expanded} setExpanded={setExpanded} onQR={setQr} />}
          {pending.length  > 0 && <Section title="Pending Payment" orders={pending}  expanded={expanded} setExpanded={setExpanded} onQR={setQr} />}
          {past.length     > 0 && <Section title="Past Events"  orders={past}     expanded={expanded} setExpanded={setExpanded} onQR={setQr} />}
        </>
      )}

      {qr && <QRModal data={qr} onClose={() => setQr(null)} />}
    </div>
  );
}

function Section({ title, orders, expanded, setExpanded, onQR }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p className="tickets-section-label">{title}</p>
      {orders.map(o => {
        const ev = o.events;
        const d  = ev?.start_at ? new Date(ev.start_at) : null;
        const allTickets = o.order_items?.flatMap(i => i.tickets ?? []) ?? [];
        const isOpen = expanded === o.id;
        return (
          <div key={o.id} className="order-card">
            <div className="order-card-top">
              {d && (
                <div className="order-date-badge">
                  <span className="order-date-day">{d.getDate()}</span>
                  <span className="order-date-mon">{d.toLocaleDateString('en-US',{month:'short'}).toUpperCase()}</span>
                </div>
              )}
              <div className="order-info">
                <p className="order-title">
                  <Link to={`/events/${ev?.slug}`} style={{ color: '#fff', textDecoration: 'none' }}>{ev?.title}</Link>
                </p>
                {d    && <p className="order-meta">📅 {fmtDate(ev.start_at)}</p>}
                {ev?.venue_name && <p className="order-meta">📍 {ev.venue_name}{ev.states?.name ? `, ${ev.states.name}` : ''}</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                  <span className={`badge badge-${o.status === 'paid' ? 'approved' : 'pending'}`}>{o.status}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--slate)' }}>
                    ₦{Number(o.amount_total).toLocaleString('en-NG')} · {allTickets.length} ticket{allTickets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              {o.status === 'paid' && allTickets.length > 0 && (
                <div className="order-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(isOpen ? null : o.id)}>
                    {isOpen ? 'Close' : 'View'}
                  </button>
                </div>
              )}
            </div>

            {isOpen && (
              <div className="order-expanded">
                {o.order_items?.map(item =>
                  item.tickets?.map(ticket => (
                    <div key={ticket.id} className="order-ticket-row">
                      <div>
                        <p className="ticket-name">{item.ticket_types?.name}</p>
                        <p className="ticket-code-text">{ticket.ticket_code}</p>
                        {ticket.checked_in && (
                          <p style={{ fontSize: '0.7rem', color: 'var(--green)', marginTop: 2 }}>✓ Checked in</p>
                        )}
                      </div>
                      <button className="btn btn-ghost btn-sm"
                        onClick={() => onQR({ ticket, event: ev, itemName: item.ticket_types?.name })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <HugeiconsIcon icon={QrCode01Icon} size={13} color="var(--purple)" />
                        QR Code
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QRModal({ data, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Ticket — ${data.ticket.ticket_code}</title>
      <style>body{font-family:sans-serif;background:#fff;color:#000;padding:32px;text-align:center;}
      h2{font-size:1.2rem;margin-bottom:6px;}p{color:#555;font-size:0.85rem;margin:4px 0;}
      .code{font-family:monospace;font-size:1rem;font-weight:700;color:#D88A1F;margin:14px 0;letter-spacing:0.1em;}
      .line{border-top:2px dashed #ddd;margin:16px 0;}.brand{font-size:0.68rem;color:#999;margin-top:14px;}</style>
      </head><body>
      <h2>${data.event?.title ?? ''}</h2>
      <p>${data.event?.start_at ? new Date(data.event.start_at).toLocaleDateString('en-US',{dateStyle:'long'}) : ''}</p>
      <p>${data.event?.venue_name ?? ''}</p>
      <div class="line"></div>
      <p style="font-size:0.76rem;color:#888">${data.itemName ?? ''}</p>
      <div style="margin:14px auto;display:inline-block">${printRef.current?.innerHTML ?? ''}</div>
      <div class="code">${data.ticket.ticket_code}</div>
      <div class="line"></div>
      <p class="brand">EventMasters · HSPR Technologies</p>
      </body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); w.close(); }, 300);
  };

  return (
    <div className="qr-overlay" onClick={onClose}>
      <div className="qr-sheet" onClick={e => e.stopPropagation()}>
        <div className="qr-handle" />
        <p className="qr-eyebrow">YOUR TICKET</p>
        <h3 className="qr-event-title">{data.event?.title}</h3>
        <p className="qr-meta">
          {data.event?.start_at && fmtDate(data.event.start_at)}
          {data.event?.venue_name && ` · ${data.event.venue_name}`}
        </p>
        <div className="qr-wrap" ref={printRef}>
          <QRCodeSVG value={data.ticket.ticket_code} size={190} bgColor="#151C35" fgColor="#F0ECFF" level="H" includeMargin />
        </div>
        <div className="qr-divider" />
        <p className="qr-code-text">{data.ticket.ticket_code}</p>
        <p className="qr-tier">{data.itemName}</p>
        {data.ticket.checked_in && (
          <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.82rem', marginBottom: 12 }}>✓ Checked in</p>
        )}
        <button className="btn btn-primary" style={{ width: '100%', marginBottom: 8 }} onClick={handlePrint}>
          🖨 Print / Save Ticket
        </button>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={onClose}>Close</button>
        <p className="qr-footer-note">Show QR at the gate · EventMasters by HSPR Technologies</p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--line)', borderTopColor: 'var(--amber)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  );
}
