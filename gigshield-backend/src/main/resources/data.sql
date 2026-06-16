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

-- Admin User (password: admin123)
INSERT INTO workers (full_name, email, password_hash, phone, city, platform_name, role, email_verified, registration_date, is_active)
VALUES
('Saketh Surubhotla', 'saketh.surubhotla@gmail.com', '-969161597', '9000000000', 'Mumbai', 'GigShield', 'ADMIN', true, CURRENT_TIMESTAMP, true)
ON CONFLICT (email) DO NOTHING;

-- Sample Workers
INSERT INTO workers (full_name, email, password_hash, phone, city, platform_name, role, email_verified, registration_date, is_active)
VALUES
('Rahul Kumar', 'rahul@example.com', '1234567', '9876543210', 'Mumbai', 'Swiggy', 'WORKER', true, CURRENT_TIMESTAMP, true),
('Priya Singh', 'priya@example.com', '1234567', '9876543211', 'Delhi', 'Zomato', 'WORKER', true, CURRENT_TIMESTAMP, true),
('Amit Patel', 'amit@example.com', '1234567', '9876543212', 'Bangalore', 'Blinkit', 'WORKER', true, CURRENT_TIMESTAMP, true)
ON CONFLICT (email) DO NOTHING;

-- Fix NULL version values that cause Hibernate @Version NullPointerException
UPDATE workers SET version = 0 WHERE version IS NULL;
ALTER TABLE workers ALTER COLUMN version SET DEFAULT 0;
ALTER TABLE workers ALTER COLUMN version SET NOT NULL;
