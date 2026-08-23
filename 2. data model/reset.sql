-- Run from any directory:
-- psql -U postgres -d [your_database] -f "2. data model/reset.sql"


-- ============================================
-- DATABASE RESET
-- ============================================

-- Drop tables in reverse dependency order.
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS users;


-- ============================================
-- DATABASE SETUP
-- ============================================

\ir "setup.sql"