-- This migration script sets up the initial database schema for the sports event management application. 
-- Would create a lookup table for sports types, but for simplicity, we will use an ENUM type directly in the events table.
CREATE TYPE sport AS ENUM ('basketball', 'football', 'baseball', 'soccer', 'tennis', 'hockey', 'racing');


CREATE OR REPLACE FUNCTION uuid_generate_v7()
RETURNS UUID
LANGUAGE sql
AS $$
  SELECT encode(
    set_bit(
      set_bit(
        overlay(
          uuid_send(gen_random_uuid())
          placing substring(int8send(floor(extract(epoch FROM clock_timestamp()) * 1000)::BIGINT) FROM 3)
          FROM 1 FOR 6
        ),
        52, 1
      ),
      53, 1
    ),
    'hex'
  )::UUID;
$$;

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    name VARCHAR(255) UNIQUE NOT NULL,
    sport_type VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE event_venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
    event_id UUID REFERENCES events (id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues (id) ON DELETE CASCADE,
    scheduled_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (event_id, scheduled_at) 
);




CREATE INDEX idx_event_venues_event_id ON event_venues (event_id);
CREATE INDEX idx_event_venues_venue_id ON event_venues (venue_id);
CREATE INDEX idx_event_venues_scheduled_at ON event_venues (scheduled_at);


CREATE VIEW formatted_event_details AS
SELECT
    events.id AS event_id,
    events.name AS event_name,
    events.sport_type AS sport_type,
    events.description AS description,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'scheduled_at', event_venues.scheduled_at,
            'venue', JSON_BUILD_OBJECT(
                'id', venues.id,
                'name', venues.name,
                'address', venues.address,
                'capacity', venues.capacity
            )
        )
    ) AS venues_details
FROM event_venues
JOIN venues ON event_venues.venue_id = venues.id
JOIN events ON event_venues.event_id = events.id
GROUP BY events.id;