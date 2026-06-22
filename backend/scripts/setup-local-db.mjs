import pg from 'pg';

const { Client } = pg;

const admin = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/postgres',
});

await admin.connect();

try {
  await admin.query('CREATE DATABASE tracsopro');
  console.log('Created database tracsopro');
} catch (error) {
  if (error.code === '42P04') {
    console.log('Database tracsopro already exists');
  } else {
    throw error;
  }
}

try {
  await admin.query("CREATE USER tracsopro WITH PASSWORD 'tracsopro'");
  console.log('Created user tracsopro');
} catch (error) {
  if (error.code === '42710') {
    console.log('User tracsopro already exists');
  } else {
    throw error;
  }
}

await admin.query('GRANT ALL PRIVILEGES ON DATABASE tracsopro TO tracsopro');
console.log('Granted privileges on tracsopro to tracsopro');
await admin.end();

const appDb = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/tracsopro',
});

await appDb.connect();
await appDb.query('GRANT ALL ON SCHEMA public TO tracsopro');
await appDb.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO tracsopro');
await appDb.query('ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO tracsopro');
console.log('Granted schema privileges to tracsopro');
await appDb.end();
