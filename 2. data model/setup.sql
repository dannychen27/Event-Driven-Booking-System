-- Run from this directory:
-- psql -d [your_database] -f setup.sql
--
-- Run from any directory:
-- psql -d [your_database] -f "2. data model/setup.sql"


-- ============================================
-- DATABASE SETUP
-- ============================================

-- 1. Create schema / tables
\ir "schema.sql"

-- 2. Create indices
\ir "indices/indices.sql"

-- 3. Insert seed data
\ir "seed data/seed.sql"


-- ============================================
-- CONSTRAINT TESTS
-- ============================================

-- 4. INSERT constraint tests
\ir "tests/constraint tests/1. insert_constraint_tests.sql"

-- 5. UPDATE constraint tests
\ir "tests/constraint tests/2. update_constraint_tests.sql"

-- 6. DELETE constraint tests
\ir "tests/constraint tests/3. delete_constraint_tests.sql"
