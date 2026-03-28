-- Seed data for testing
-- Run with: supabase db reset (applies migrations then seed.sql)

-- Venues
INSERT INTO venues (name, address, capacity) VALUES
('Madison Square Garden', '4 Pennsylvania Plaza, New York, NY 10001', 20789),
('Staples Center', '1111 S Figueroa St, Los Angeles, CA 90015', 19068),
('Wrigley Field', '1060 W Addison St, Chicago, IL 60613', 41649),
('Lambeau Field', '1265 Lombardi Ave, Green Bay, WI 54304', 81441),
('Arthur Ashe Stadium', 'Flushing Meadows, Queens, NY 11368', 23771),
('TD Garden', '100 Legends Way, Boston, MA 02114', 19580),
('Daytona International Speedway', '1801 W International Speedway Blvd, Daytona Beach, FL 32114', 101500),
('SoFi Stadium', '1001 Stadium Dr, Inglewood, CA 90301', 70240);

-- Events
INSERT INTO events (name, sport_type, description) VALUES
('NBA Finals 2026', 'basketball', 'The 2026 NBA Championship Finals series'),
('Super Bowl LXI', 'football', 'The 61st annual Super Bowl championship game'),
('World Series 2026', 'baseball', '2026 Major League Baseball World Series'),
('MLS Cup 2026', 'soccer', 'The 2026 Major League Soccer championship'),
('US Open Tennis 2026', 'tennis', '2026 US Open Grand Slam tennis tournament'),
('Stanley Cup Finals 2026', 'hockey', 'The 2026 NHL Stanley Cup Finals'),
('Daytona 500', 'racing', 'The 2026 Daytona 500 NASCAR race'),
('March Madness Final Four', 'basketball', '2026 NCAA Division I basketball tournament Final Four');

-- Event-Venue assignments (using subqueries to reference by name)
INSERT INTO event_venues (event_id, venue_id, scheduled_at) VALUES
-- NBA Finals games at Madison Square Garden and Staples Center
((SELECT id FROM events WHERE name = 'NBA Finals 2026'),
 (SELECT id FROM venues WHERE name = 'Madison Square Garden'),
 '2026-06-05 20:00:00'),
((SELECT id FROM events WHERE name = 'NBA Finals 2026'),
 (SELECT id FROM venues WHERE name = 'Staples Center'),
 '2026-06-08 20:00:00'),

-- Super Bowl at SoFi Stadium
((SELECT id FROM events WHERE name = 'Super Bowl LXI'),
 (SELECT id FROM venues WHERE name = 'SoFi Stadium'),
 '2026-02-08 18:30:00'),

-- World Series games at Wrigley Field
((SELECT id FROM events WHERE name = 'World Series 2026'),
 (SELECT id FROM venues WHERE name = 'Wrigley Field'),
 '2026-10-23 19:00:00'),
((SELECT id FROM events WHERE name = 'World Series 2026'),
 (SELECT id FROM venues WHERE name = 'Wrigley Field'),
 '2026-10-25 19:00:00'),

-- MLS Cup at SoFi Stadium
((SELECT id FROM events WHERE name = 'MLS Cup 2026'),
 (SELECT id FROM venues WHERE name = 'SoFi Stadium'),
 '2026-12-12 16:00:00'),

-- US Open at Arthur Ashe Stadium
((SELECT id FROM events WHERE name = 'US Open Tennis 2026'),
 (SELECT id FROM venues WHERE name = 'Arthur Ashe Stadium'),
 '2026-08-31 11:00:00'),
((SELECT id FROM events WHERE name = 'US Open Tennis 2026'),
 (SELECT id FROM venues WHERE name = 'Arthur Ashe Stadium'),
 '2026-09-13 16:00:00'),

-- Stanley Cup at TD Garden and Madison Square Garden
((SELECT id FROM events WHERE name = 'Stanley Cup Finals 2026'),
 (SELECT id FROM venues WHERE name = 'TD Garden'),
 '2026-06-01 19:00:00'),
((SELECT id FROM events WHERE name = 'Stanley Cup Finals 2026'),
 (SELECT id FROM venues WHERE name = 'Madison Square Garden'),
 '2026-06-04 19:00:00'),

-- Daytona 500
((SELECT id FROM events WHERE name = 'Daytona 500'),
 (SELECT id FROM venues WHERE name = 'Daytona International Speedway'),
 '2026-02-15 14:30:00'),

-- March Madness Final Four at SoFi Stadium
((SELECT id FROM events WHERE name = 'March Madness Final Four'),
 (SELECT id FROM venues WHERE name = 'SoFi Stadium'),
 '2026-04-04 18:00:00'),
((SELECT id FROM events WHERE name = 'March Madness Final Four'),
 (SELECT id FROM venues WHERE name = 'SoFi Stadium'),
 '2026-04-06 21:00:00');
