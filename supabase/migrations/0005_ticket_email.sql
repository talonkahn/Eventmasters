-- Track whether the paid ticket email has been delivered through Resend.
-- A failed email must never turn a successful payment into a failed order;
-- the verification/webhook path can retry sending later.
alter table orders
  add column if not exists ticket_email_sent_at timestamptz;

create index if not exists idx_orders_ticket_email_pending
  on orders(status, ticket_email_sent_at)
  where status = 'paid' and ticket_email_sent_at is null;
