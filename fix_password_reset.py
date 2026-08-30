import os

# 1. Update data.sql
sql_filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-backend\src\main\resources\data.sql'
with open(sql_filepath, 'r', encoding='utf-8') as f:
    sql_content = f.read()

sql_content = sql_content.replace('''-- Admin User (password: admin123)
INSERT INTO workers (full_name, email, password_hash, phone, city, platform_name, role, email_verified, registration_date, is_active)
VALUES
('Saketh Surubhotla', 'saketh.surubhotla@gmail.com', '-969161597', '9000000000', 'Mumbai', 'GigShield', 'ADMIN', true, CURRENT_TIMESTAMP, true)
ON CONFLICT (email) DO NOTHING;''', '')

with open(sql_filepath, 'w', encoding='utf-8') as f:
    f.write(sql_content)


# 2. Update AdminDataLoader.java
java_filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-backend\src\main\java\com\gigshield\config\AdminDataLoader.java'
with open(java_filepath, 'r', encoding='utf-8') as f:
    java_content = f.read()

java_content = java_content.replace('''// Force reset password hash to fix invalid seeds from data.sql
                worker.setPasswordHash(passwordEncoder.encode(finalAdminPassword));''', '')
                
java_content = java_content.replace('log.info("✅ User {} promoted to ADMIN and password reset.", emailForLog);', 'log.info("✅ User {} promoted to ADMIN.", emailForLog);')

with open(java_filepath, 'w', encoding='utf-8') as f:
    f.write(java_content)
