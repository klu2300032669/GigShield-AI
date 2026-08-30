-- ============================================
-- GigShield AI - Seed Data
-- ============================================

-- Insurance Plans
INSERT INTO insurance_plans (plan_name, description, coverage_type, premium_amount, max_payout, billing_cycle, is_active)
VALUES
('Rain Shield Basic', 'Basic coverage for heavy rainfall events. Protects against income loss during monsoon and unexpected downpours.', 'RAIN', 49.00, 500.00, 'WEEKLY', true),
('Rain Shield Pro', 'Premium rain coverage with higher payout limits and faster claim processing.', 'RAIN', 149.00, 1500.00, 'MONTHLY', true),
('Heat Guard', 'Protection against extreme heat events when temperatures exceed safe working limits.', 'HEAT', 39.00, 400.00, 'WEEKLY', true),
('AQI Protect', 'Coverage for high pollution days when air quality index makes outdoor delivery unsafe.', 'POLLUTION', 59.00, 600.00, 'MONTHLY', true),
('GigShield Total', 'Comprehensive all-weather coverage for rain, heat, and pollution events combined.', 'ALL', 199.00, 2000.00, 'MONTHLY', true),
('GigShield Total Weekly', 'Weekly comprehensive coverage for all environmental disruption types.', 'ALL', 79.00, 800.00, 'WEEKLY', true)
ON CONFLICT DO NOTHING;




-- Fix NULL version values that cause Hibernate @Version NullPointerException
UPDATE workers SET version = 0 WHERE version IS NULL;
ALTER TABLE workers ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE workers ALTER COLUMN version SET NOT NULL;

-- ============================================
-- Seed Environmental Events for Demo
-- ============================================
INSERT INTO environmental_events (event_type, city, severity, rainfall_mm, temperature_c, aqi, event_timestamp, source_api)
VALUES
('HEAVY_RAIN', 'Mumbai', 'HIGH', 85.5, 28.0, 62, CURRENT_TIMESTAMP - INTERVAL '2 hours', 'Open-Meteo'),
('HEAVY_RAIN', 'Mumbai', 'CRITICAL', 120.0, 26.0, 58, CURRENT_TIMESTAMP - INTERVAL '6 hours', 'Open-Meteo'),
('EXTREME_HEAT', 'Delhi', 'HIGH', 0.0, 46.5, 180, CURRENT_TIMESTAMP - INTERVAL '3 hours', 'Open-Meteo'),
('HIGH_POLLUTION', 'Delhi', 'CRITICAL', 0.0, 38.0, 420, CURRENT_TIMESTAMP - INTERVAL '1 hour', 'Open-Meteo'),
('EXTREME_HEAT', 'Hyderabad', 'HIGH', 0.0, 43.8, 95, CURRENT_TIMESTAMP - INTERVAL '4 hours', 'Open-Meteo'),
('HEAVY_RAIN', 'Bangalore', 'HIGH', 65.0, 24.0, 45, CURRENT_TIMESTAMP - INTERVAL '5 hours', 'Open-Meteo'),
('HIGH_POLLUTION', 'Kolkata', 'HIGH', 2.0, 34.0, 310, CURRENT_TIMESTAMP - INTERVAL '8 hours', 'Open-Meteo'),
('HEAVY_RAIN', 'Chennai', 'HIGH', 95.0, 27.0, 55, CURRENT_TIMESTAMP - INTERVAL '12 hours', 'Open-Meteo')
ON CONFLICT DO NOTHING;
