-- How the customer agreed to be reached about this appointment: "text", "call",
-- or "text,call". The owner confirms every booking by phone, so this decides
-- whether that first contact is a call or a message.
--
-- Rows written before this column existed predate the choice; 'call' is what
-- the shop did for all of them.
ALTER TABLE appointments ADD COLUMN contact_pref TEXT NOT NULL DEFAULT 'call';
