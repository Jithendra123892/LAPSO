# Reset PostgreSQL Password - Manual Guide

## Option 1: Using pgAdmin (Easiest)
1. Open **pgAdmin** from Start Menu (if installed)
2. Connect to your PostgreSQL server
3. Right-click on **postgres** user → Properties
4. Go to **Definition** tab
5. Enter new password
6. Click **Save**

## Option 2: Using SQL Shell (psql)
1. Open **SQL Shell (psql)** from Start Menu
2. Press Enter for default values until password prompt
3. Enter any password you remember (or try common ones)
4. If connected, run: `ALTER USER postgres PASSWORD 'your_new_password';`

## Option 3: Run Admin Script (Recommended)
1. Right-click on **force-reset-postgres-password.bat**
2. Select **"Run as Administrator"**
3. Follow the prompts to set new password

## Option 4: Create New User (Alternative)
1. Right-click on **create-new-postgres-user.bat**
2. Select **"Run as Administrator"**
3. Create a new user like 'lapso' with password 'lapso123'

## Option 5: Reinstall PostgreSQL
If nothing works:
1. Uninstall PostgreSQL
2. Reinstall PostgreSQL
3. Set a password you'll remember during installation

## After Password Reset
Update LAPSO configuration:
1. Edit `src/main/resources/application.properties`
2. Set: `spring.datasource.password=your_new_password`
3. Run: `mvn spring-boot:run`

## Test Connection
```bash
psql -U postgres -h localhost -d postgres
```