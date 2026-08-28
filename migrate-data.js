require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function migrate() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  const dataPath = path.join(__dirname, 'wedding-data.json');
  if (!fs.existsSync(dataPath)) {
    console.error('ERROR: wedding-data.json not found');
    process.exit(1);
  }

  console.log('Reading wedding-data.json...');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('wedding');
    
    console.log('Uploading data to MongoDB...');
    await db.collection('wedding-data').updateOne(
      {},
      { $set: data },
      { upsert: true }
    );
    
    console.log('Data migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();
