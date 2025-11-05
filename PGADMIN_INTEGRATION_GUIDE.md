# pgAdmin Integration Guide for Guard Tracking App

## Step-by-Step Instructions

### 1. Connect to Your PostgreSQL Database in pgAdmin

1. **Open pgAdmin** (should be installed on your system)
2. **Register a new server**:
   - Right-click on "Servers" in the browser tree
   - Select "Register" > "Server..."
   - In the "General" tab, name your server "Guard Tracking App"
   - In the "Connection" tab, enter:
     - Host: `localhost`
     - Port: `5432`
     - Maintenance database: `postgres`
     - Username: `postgres`
     - Password: `postgres` (or your custom password)
   - Click "Save"

### 2. Create the Guard Tracking Database

1. **Create a new database**:
   - Right-click on "Databases"
   - Select "Create" > "Database..."
   - Name: `guard_tracking`
   - Click "Save"

### 3. Update Your Application to Use PostgreSQL

The setup script has already:
- Updated your Prisma schema to use PostgreSQL
- Created a PostgreSQL-compatible .env file
- Generated the necessary Prisma client

### 4. Verify Database Tables

After running the setup script and starting your backend:

1. In pgAdmin, expand:
   - Servers > Guard Tracking App > Databases > guard_tracking > Schemas > public > Tables
2. You should see all your tables:
   - User
   - Guard
   - Location
   - Incident
   - etc.

### 5. Explore Your Data

1. **View table data**:
   - Right-click on any table (e.g., "User")
   - Select "View/Edit Data" > "All Rows"
   - You'll see all records in that table

2. **Run SQL queries**:
   - Right-click on the "guard_tracking" database
   - Select "Query Tool"
   - Write SQL queries like:
     ```sql
     SELECT * FROM "User";
     SELECT * FROM "Guard";
     SELECT u.email, u.firstName, u.lastName, g.employeeId 
     FROM "User" u
     JOIN "Guard" g ON u.id = g.userId;
     ```

### 6. Database Management with pgAdmin

pgAdmin provides many useful tools:

- **Backup & Restore**:
  - Right-click on database > "Backup..." or "Restore..."

- **Database Designer**:
  - Right-click on database > "ERD for Database"

- **Performance Dashboard**:
  - Tools > Dashboard

- **Maintenance**:
  - Right-click on database > "Maintenance..."

### 7. Update Your Backend to Use PostgreSQL

Your backend is already configured to use PostgreSQL with the updated .env file.

To start the backend with PostgreSQL:

```bash
cd backend
npm run dev:db
```

## Troubleshooting

### Connection Issues

If you can't connect to PostgreSQL:

1. **Check PostgreSQL service is running**:
   - Open Services (services.msc)
   - Find "PostgreSQL" service
   - Ensure it's running

2. **Verify credentials**:
   - Default username is "postgres"
   - Check the password you set during installation

3. **Check port availability**:
   - Default PostgreSQL port is 5432
   - Make sure no other service is using this port

### Database Migration Issues

If Prisma migrations fail:

1. **Check database permissions**:
   - Ensure your PostgreSQL user has permission to create tables

2. **Manual schema reset**:
   - In pgAdmin, you can drop and recreate the database
   - Then run migrations again

### Data Import/Export

To move data between SQLite and PostgreSQL:

1. **Export from SQLite**:
   - Use Prisma's export functionality or SQLite tools

2. **Import to PostgreSQL**:
   - Use pgAdmin's import functionality
   - Or use Prisma's seed functionality

## Advanced pgAdmin Features

### 1. Creating Views

1. Right-click on "Views" under your database
2. Select "Create" > "View..."
3. Define your view with SQL

Example view for active guards:
```sql
CREATE VIEW active_guards AS
SELECT u.firstName, u.lastName, u.email, g.employeeId
FROM "User" u
JOIN "Guard" g ON u.id = g.userId
WHERE u.isActive = true;
```

### 2. Setting Up Scheduled Backups

1. Create a backup script using pg_dump
2. Schedule it using Windows Task Scheduler

### 3. Monitoring Database Performance

1. Use pgAdmin's "Dashboard" feature
2. Monitor connections, transactions, and locks

## Next Steps

1. **Complete the PostgreSQL setup** using the setup script
2. **Verify all tables** are created correctly in pgAdmin
3. **Test your application** with the PostgreSQL database
4. **Create regular backups** of your production database
