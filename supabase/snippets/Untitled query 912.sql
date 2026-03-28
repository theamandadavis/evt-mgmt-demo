SELECT JSON_AGG(event_venues.scheduled_at) AS scheduled_at, JSON_AGG(events.name) AS event_name, 
JSON_AGG(events.sport_type) AS sport_type, JSON_AGG(events.description) AS description, JSON_AGG(venues.*) AS venues_details
FROM event_venues
JOIN venues ON event_venues.venue_id = venues.id
JOIN events ON event_venues.event_id = events.id
GROUP BY event_venues.event_id;