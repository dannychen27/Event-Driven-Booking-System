#!/bin/bash

# if database does not exist
dropdb --if-exists booking_system
createdb booking_system

psql booking_system -f "schema.sql"
psql booking_system -f "seed data/seed.sql"
