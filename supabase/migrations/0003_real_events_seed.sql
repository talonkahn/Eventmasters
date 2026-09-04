-- ============================================================
-- EVENT MASTER — Real Nigerian Events Seed (Fixed)
-- 
-- HOW TO RUN:
-- 1. Run 0001_init.sql and 0002_functions.sql first
-- 2. Sign up in the app using samuelivere92@gmail.com
-- 3. Run the admin promotion query below
-- 4. THEN run this file
--
-- Admin promotion query (run BEFORE this seed):
--   update profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'samuelivere92@gmail.com');
-- ============================================================

DO $$
DECLARE
  v_country_id  uuid;
  v_admin_id    uuid;
  v_lagos       uuid; v_abuja    uuid; v_rivers  uuid; v_oyo    uuid;
  v_delta       uuid; v_anambra  uuid; v_kano    uuid; v_ogun   uuid;
  v_edo         uuid; v_enugu    uuid; v_cross   uuid; v_imo    uuid;
  v_kwara       uuid; v_plateau  uuid; v_kaduna  uuid;

  v_comedy      uuid; v_concert  uuid; v_festival uuid; v_theatre uuid;
  v_conference  uuid; v_party    uuid; v_religious uuid; v_sport  uuid;

BEGIN
  -- ── Resolve admin from real auth user ──────────────────────
  SELECT au.id INTO v_admin_id
  FROM auth.users au
  WHERE au.email = 'samuelivere92@gmail.com'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Admin user not found. Sign up with samuelivere92@gmail.com first, then run this seed.';
  END IF;

  -- Ensure profile row exists and is admin
  INSERT INTO profiles (id, full_name, role)
  VALUES (v_admin_id, 'Samuel Ivere', 'admin')
  ON CONFLICT (id) DO UPDATE SET role = 'admin', full_name = 'Samuel Ivere';

  -- ── Geography ────────────────────────────────────────────────
  SELECT id INTO v_country_id FROM countries WHERE code = 'NG';

  SELECT id INTO v_lagos    FROM states WHERE slug = 'lagos'        AND country_id = v_country_id;
  SELECT id INTO v_abuja    FROM states WHERE slug = 'fct-abuja'    AND country_id = v_country_id;
  SELECT id INTO v_rivers   FROM states WHERE slug = 'rivers'       AND country_id = v_country_id;
  SELECT id INTO v_oyo      FROM states WHERE slug = 'oyo'          AND country_id = v_country_id;
  SELECT id INTO v_delta    FROM states WHERE slug = 'delta'        AND country_id = v_country_id;
  SELECT id INTO v_anambra  FROM states WHERE slug = 'anambra'      AND country_id = v_country_id;
  SELECT id INTO v_kano     FROM states WHERE slug = 'kano'         AND country_id = v_country_id;
  SELECT id INTO v_ogun     FROM states WHERE slug = 'ogun'         AND country_id = v_country_id;
  SELECT id INTO v_edo      FROM states WHERE slug = 'edo'          AND country_id = v_country_id;
  SELECT id INTO v_enugu    FROM states WHERE slug = 'enugu'        AND country_id = v_country_id;
  SELECT id INTO v_cross    FROM states WHERE slug = 'cross-river'  AND country_id = v_country_id;
  SELECT id INTO v_imo      FROM states WHERE slug = 'imo'          AND country_id = v_country_id;
  SELECT id INTO v_kwara    FROM states WHERE slug = 'kwara'        AND country_id = v_country_id;
  SELECT id INTO v_plateau  FROM states WHERE slug = 'plateau'      AND country_id = v_country_id;
  SELECT id INTO v_kaduna   FROM states WHERE slug = 'kaduna'       AND country_id = v_country_id;

  -- ── Categories ────────────────────────────────────────────────
  SELECT id INTO v_comedy     FROM event_categories WHERE slug = 'comedy-show';
  SELECT id INTO v_concert    FROM event_categories WHERE slug = 'concert';
  SELECT id INTO v_festival   FROM event_categories WHERE slug = 'festival';
  SELECT id INTO v_theatre    FROM event_categories WHERE slug = 'theatre';
  SELECT id INTO v_conference FROM event_categories WHERE slug = 'conference-workshop';
  SELECT id INTO v_party      FROM event_categories WHERE slug = 'party';
  SELECT id INTO v_religious  FROM event_categories WHERE slug = 'religious';
  SELECT id INTO v_sport      FROM event_categories WHERE slug = 'sport';

  -- ============================================================
  -- EVENTS (22 seeded, with ticket types)
  -- ============================================================

  -- 1. KennyBlaq — The Oxymoron 6.0
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_comedy,'The Oxymoron of KennyBlaq 6.0 — The Bridge','oxymoron-kennyblaq-6-the-bridge',
      'Nigeria''s most intelligent comedian KennyBlaq returns with the 6th edition of his acclaimed Oxymoron show. An evening of sharp wit, cultural commentary, and side-splitting comedy at the iconic Eko Hotel.',
      'Eko Hotel & Suites','Victoria Island, Lagos','2026-07-26 18:00:00+01','2026-07-26 23:30:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',20000,300),('VIP',75000,100),('VVIP',150000,50),('Table of 10',500000,20))t(n,p,q);

  -- 2. Akpororo 10th Anniversary
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_comedy,'Akpororo Vs Akpororo — 10th Year Anniversary: 40 & Crazy','akpororo-vs-akpororo-10th-anniversary',
      'Celebrate a decade of laughter as Nigeria''s energetic comedian Akpororo marks his 10th anniversary. An unforgettable night of comedy, music, and surprises at Eko Hotel.',
      'Eko Hotel & Suites','Victoria Island, Lagos','2026-08-16 19:00:00+01','2026-08-16 23:30:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',10000,400),('VIP',50000,150),('VVIP',120000,60),('Diamond Table',500000,15))t(n,p,q);

  -- 3. BEEF Comedy 5th Edition
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_comedy,'BEEF — 5th Edition with MC Shaggy','beef-5th-edition-mc-shaggy',
      'The wildest comedy battle in Nigeria returns for its 5th edition. MC Shaggy hosts an epic night of roasts, ribs, and non-stop laughter at MUSON Centre.',
      'MUSON Centre','Onikan, Lagos Island','2026-08-16 17:00:00+01','2026-08-16 23:59:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',10000,500),('VIP',50000,100),('VVIP',100000,40),('Exclusive Table',250000,20))t(n,p,q);

  -- 4. YBits Show — Abuja
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_abuja,v_comedy,'YBits Show — One of a Kind (Abuja)','ybits-show-one-of-a-kind-abuja',
      'The YBits Show brings its signature "One of a Kind" experience to Abuja. A spectacular evening of comedy, music performances, and live entertainment at the legendary Transcorp Hilton.',
      'Transcorp Hilton Abuja','Maitama, Abuja','2026-08-30 17:00:00+01','2026-08-30 23:30:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',10000,400),('VIP',50000,120),('VVIP',150000,50),('Diamond Table',1000000,10))t(n,p,q);

  -- 5. Funny Bruno — Live Comedy Special
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_comedy,'Funny Bruno — Live Comedy Special','funny-bruno-live-comedy-special',
      'Rising comedy star Funny Bruno brings his unique brand of humour to Lagos. An intimate yet explosive evening at Terra Kulture on Victoria Island.',
      'Terra Kulture','Victoria Island, Lagos','2026-09-05 18:00:00+01','2026-09-05 23:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',10000,300),('VIP',30000,80),('VVIP',100000,30))t(n,p,q);

  -- 6. M.O.P — Son of Patience Live
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_concert,'M.O.P — Son of Patience (Live Concert)','mop-son-of-patience-live',
      'A deeply personal musical journey. M.O.P performs his acclaimed "Son of Patience" project live for the first time — an evening of soul, afrobeats, and storytelling.',
      'Shell Hall, MUSON Centre','Onikan, Lagos Island','2026-09-27 19:00:00+01','2026-09-27 23:00:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',10000,350),('VIP',30000,100),('VVIP',75000,40))t(n,p,q);

  -- 7. House of Glass — Theatre, Ibadan
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_oyo,v_theatre,'House of Glass — 2-Cast All Female Stage Play','house-of-glass-ibadan-theatre',
      'A powerful, intimate one-act stage play featuring two women, one story, and no intermission. Performed at the prestigious Wole Soyinka Theatre, University of Ibadan.',
      'Wole Soyinka Theatre, UI','Ibadan, Oyo State','2026-07-16 18:00:00+01','2026-07-17 19:30:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General Admission',5000,200),('Premium Front Row',15000,40))t(n,p,q);

  -- 8. BAHGIA Awards
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_conference,'BAHGIA — Black African History Global Iconic Awards 2026','bahgia-awards-2026',
      'A prestigious ceremony celebrating icons who have shaped Black African history globally. The 2026 edition brings together leaders, creatives, and changemakers for an unforgettable evening.',
      'Marriott Hotel Ikeja','GRA Ikeja, Lagos','2026-07-05 18:00:00+01','2026-07-05 23:30:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Standard',50000,200),('Premium',150000,80),('VIP Table of 10',1500000,15))t(n,p,q);

  -- 9. Porkupyne Comedy Special
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_comedy,'Porkupyne — All of Me (Comedy Special & Talent Hunt)','porkupyne-all-of-me-comedy-special',
      'A comedy special AND talent hunt in one extraordinary night. Raw, unfiltered, and deeply funny — paired with a showcase of Nigeria''s freshest comedy talent.',
      'Terra Kulture','Victoria Island, Lagos','2026-07-12 17:30:00+01','2026-07-12 23:30:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',20000,250),('VIP',75000,80),('VVIP',200000,30))t(n,p,q);

  -- 10. Omileeyan — African Cultural Experience
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_festival,'Omileeyan — The African Cultural Experience World Tour','omileeyan-african-cultural-experience',
      'A world tour celebration of African culture stopping in Lagos. Traditional performances, food, fashion, music and dance from across the continent — all in one magical evening.',
      'Praia Beach Club','Victoria Island, Lagos','2026-08-16 17:00:00+01','2026-08-16 23:30:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General',5000,500),('Premium',15000,150),('VIP',25000,60))t(n,p,q);

  -- 11. Lagos Tech Fest 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_conference,'Lagos Tech Fest 2026 — Building Africa''s Digital Future','lagos-tech-fest-2026',
      'West Africa''s biggest technology festival. 3 stages, 60+ speakers, startup pitches, hiring fair, and product demos. Where Nigeria''s tech ecosystem comes together.',
      'Eko Convention Centre','Victoria Island, Lagos','2026-10-10 09:00:00+01','2026-10-11 18:00:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Day Pass',15000,1000),('2-Day Pass',25000,600),('VIP 2-Day',75000,100),('Startup Table',200000,20))t(n,p,q);

  -- 12. Afrobeats Rave — Port Harcourt
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_rivers,v_party,'Afrobeats Rave — Port Harcourt Edition','afrobeats-rave-port-harcourt',
      'The south-south''s biggest afrobeats night. DJ sets, live performers, an open bar, and energy only Port Harcourt can deliver. Come experience the Garden City after dark.',
      'Prodest Event Centre','GRA Phase 2, Port Harcourt','2026-08-01 20:00:00+01','2026-08-02 04:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General',5000,600),('VIP',15000,100),('VVIP + Open Bar',30000,40))t(n,p,q);

  -- 13. Detty December Mega Festival 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_festival,'Detty December Mega Festival 2026','detty-december-mega-festival-2026',
      'The biggest Detty December event in Lagos. 10 hours of afrobeats, amapiano, live acts, food village, art installations, and fireworks. The ultimate way to end 2026.',
      'Landmark Beach','Oniru, Victoria Island, Lagos','2026-12-28 14:00:00+01','2026-12-29 02:00:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Early Bird',15000,500),('Regular',25000,1500),('VIP',75000,200),('VVIP Lounge',200000,50))t(n,p,q);

  -- 14. New Year's Eve Countdown — Abuja
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_abuja,v_party,'New Year''s Eve Countdown 2027 — Abuja','new-years-eve-countdown-2027-abuja',
      'Count down to 2027 in style. Live performances, champagne toast at midnight, stunning fireworks, and an all-night celebration you will never forget.',
      'International Conference Centre','Area 11, Garki, Abuja','2026-12-31 20:00:00+01','2027-01-01 04:00:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Regular',20000,800),('VIP',60000,200),('VVIP + Open Bar',150000,80),('Executive Table',1000000,10))t(n,p,q);

  -- 15. Victor Thompson — Gospel Concert Lagos
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_religious,'Victor Thompson — Live Gospel Concert','victor-thompson-live-gospel-concert-lagos',
      'Gospel music powerhouse Victor Thompson performs live in Lagos. An evening of worship, praise, and heavenly music that will move your soul. Come expecting a miracle.',
      'La Madisson Place','Lekki, Lagos','2026-09-13 17:00:00+01','2026-09-13 22:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General',5000,500),('Premium',15000,150),('VIP Seated',30000,60))t(n,p,q);

  -- 16. Warri Carnival 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_delta,v_festival,'Warri Carnival 2026 — Oil City Fiesta','warri-carnival-2026-oil-city-fiesta',
      'Warri''s beloved annual carnival is back bigger than ever. Street processions, masquerades, live music, Delta delicacies, and the unique energy of Nigeria''s most spirited city.',
      'Warri Township Stadium','Warri, Delta State','2026-11-07 12:00:00+01','2026-11-08 22:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General Day 1',3000,2000),('General Day 2',3000,2000),('2-Day VIP',20000,200))t(n,p,q);

  -- 17. Calabar Carnival 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_cross,v_festival,'Calabar Carnival 2026 — Africa''s Biggest Street Party','calabar-carnival-2026',
      'The Calabar Carnival — billed as Africa''s Biggest Street Party — returns for 2026. Millions descend on Calabar for a month of festivities, costume bands, concerts, and cultural immersion.',
      'Calabar Carnival Route','Mary Slessor Avenue, Calabar','2026-12-01 10:00:00+01','2026-12-31 23:59:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Carnival Pass (All Month)',10000,5000),('VIP Viewing Stand',35000,300),('VVIP Package',100000,80))t(n,p,q);

  -- 18. Kano Fashion Week 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_kano,v_festival,'Kano Fashion Week 2026','kano-fashion-week-2026',
      'Northern Nigeria''s premier fashion event. Runway shows from top designers, fabric exhibitions, beauty workshops, and celebrations of Hausa fashion heritage alongside contemporary Afro-luxury.',
      'Coronation Hall, Kano Government House','Kano, Kano State','2026-10-23 15:00:00+01','2026-10-25 21:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General (per day)',5000,400),('3-Day Pass',12000,200),('Front Row',30000,50))t(n,p,q);

  -- 19. Port Harcourt Book Festival 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_rivers,v_conference,'Port Harcourt Book Festival 2026','ph-book-festival-2026',
      'UNESCO City of Literature, Port Harcourt, hosts its acclaimed annual book festival. Panel discussions, author readings, poetry slams, publishing workshops, and a children''s book fair.',
      'Hotel Presidential','GRA, Port Harcourt','2026-11-14 09:00:00+01','2026-11-16 18:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Day Pass',3000,600),('3-Day Festival Pass',7500,300),('VIP Author Meet & Greet',20000,50))t(n,p,q);

  -- 20. Enugu Cultural Night 2026
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_enugu,v_festival,'Enugu Cultural Night 2026 — Coal City Gala','enugu-cultural-night-2026',
      'A celebration of Igbo heritage, arts, and excellence. Traditional masquerades, live highlife music, Isi ewu feast, and awards for icons of the Coal City state.',
      'Nike Lake Resort','Enugu, Enugu State','2026-09-19 17:00:00+01','2026-09-19 23:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General',8000,300),('Premium',20000,80),('VIP Table',100000,20))t(n,p,q);

  -- 21. Abeokuta Art & Music Festival
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_ogun,v_festival,'Abeokuta Art & Music Festival 2026','abeokuta-art-music-festival-2026',
      'A weekend celebration of creativity in the Egba Kingdom. Olumo Rock backdrop, visual art exhibitions, indigo-dye workshops, Juju music performances, and Yoruba cultural experiences.',
      'Olumo Rock Cultural Centre','Abeokuta, Ogun State','2026-10-17 10:00:00+01','2026-10-18 20:00:00+01','approved',false) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('Day Pass',5000,400),('2-Day Festival Pass',8500,200),('VIP Bundle + Workshop',20000,40))t(n,p,q);

  -- 22. New Year's Eve Lagos — Eko Atlantic
  WITH e AS (INSERT INTO events (organizer_id,country_id,state_id,category_id,title,slug,description,venue_name,address,start_at,end_at,status,is_featured)
    VALUES (v_admin_id,v_country_id,v_lagos,v_party,'New Year''s Eve Lagos 2027 — Eko Atlantic Countdown','nye-lagos-2027-eko-atlantic',
      'Ring in 2027 on the shores of Eko Atlantic City. Fireworks over the ocean, multiple DJ stages, champagne countdown, live afrobeats acts, and Lagos''s most spectacular NYE experience.',
      'Eko Atlantic City','Victoria Island Extension, Lagos','2026-12-31 19:00:00+01','2027-01-01 05:00:00+01','approved',true) RETURNING id)
  INSERT INTO ticket_types(event_id,name,price,quantity_total) SELECT id,t.n,t.p,t.q FROM e,(VALUES('General',25000,2000),('VIP',75000,300),('VVIP Lounge',200000,80),('Premium Table of 10',1500000,20))t(n,p,q);

END;
$$;
