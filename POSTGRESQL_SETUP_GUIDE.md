# PostgreSQL Integration Guide for Guard Tracking App

This guide will help you connect your Guard Tracking App to PostgreSQL using pgAdmin.

## Prerequisites

1. **PostgreSQL** installed on your system
2. **pgAdmin** installed and running
3. Node.js and npm installed

## Step 1: Configure PostgreSQL Connection

The default connection details are:

```
Host: localhost
Port: 5432
Database: guard_tracking
Username: postgres
Password: postgres
```

If you need to use different credentials, edit the `backend/.env.pg` file before running the setup script.

## Step 2: Run the PostgreSQL Setup Script

1. Double-click the `setup-postgres.bat` file
2. Wait for the script to complete all steps
3. If there are any errors, follow the troubleshooting instructions provided

## Step 3: Connect with pgAdmin

1. Open pgAdmin
2. Right-click on "Servers" in the left sidebar
3. Select "Register" > "Server..."
4. In the "General" tab:
   - Name: Guard Tracking App
5. In the "Connection" tab:
   - Host: localhost
   - Port: 5432
   - Maintenance database: postgres
   - Username: postgres
   - Password: postgres
6. Click "Save"

## Step 4: Explore Your Database

1. Expand "Servers" > "Guard Tracking App" > "Databases" > "guard_tracking"
2. Expand "Schemas" > "public" > "Tables"
3. You should see all your tables like "User", "Guard", "Location", etc.
4. Right-click on any table and select "View/Edit Data" > "All Rows" to see the data

## Step 5: Start the Backend with PostgreSQL

Run the backend server with:

```bash
cd backend
npm run dev:db
```

## Common Issues and Solutions

### Connection Refused

If you see "connection refused" errors:

1. Make sure PostgreSQL service is running
2. Check that the port (default: 5432) is not blocked by firewall
3. Verify the username and password are correct

### Permission Denied

If you see permission errors:

1. Make sure the postgres user has permission to create databases
2. Try running pgAdmin as administrator

### Database Already Exists

If the database already exists:

1. You can drop it in pgAdmin (right-click > Drop)
2. Or modify the setup script to skip database creation

## Using pgAdmin for Development

### Running SQL Queries

1. Right-click on the "guard_tracking" database
2. Select "Query Tool"
3. Write your SQL query and press F5 to execute

### Viewing Table Structure

1. Right-click on any table
2. Select "Properties"
3. Navigate to the "Columns" tab to see the structure

### Creating Backups

1. Right-click on the "guard_tracking" database
2. Select "Backup..."
3. Configure your backup settings and click "Backup"

## Advanced: Connecting to a Remote PostgreSQL Server

If you want to connect to a remote PostgreSQL server:

1. Edit `backend/.env.pg` and update the DATABASE_URL:
   ```
   DATABASE_URL="postgresql://username:password@remote-host:5432/guard_tracking?schema=public"
   ```
2. Make sure the remote server allows connections from your IP address
3. Run the setup script again

## Need Help?

If you encounter any issues, check the PostgreSQL logs or contact your database administrator.
