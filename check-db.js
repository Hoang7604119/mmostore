const { MongoClient } = require('mongodb');

const uri = 'mongodb+srv://dhhoangdn2:hoang7604119@sellmmo.z4owj0w.mongodb.net/?retryWrites=true&w=majority&appName=sellmmo';

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(uri);
    console.log('Connected successfully!');
    
    // List all databases
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(db => console.log('- ' + db.name));
    
    // Try different database names
    const possibleDbNames = ['sellmmo', 'test', 'admin'];
    
    for (const dbName of possibleDbNames) {
      try {
        console.log(`\nChecking database: ${dbName}`);
        const db = client.db(dbName);
        const collections = await db.listCollections().toArray();
        
        if (collections.length > 0) {
          console.log(`Collections in ${dbName}:`);
          collections.forEach(col => console.log('- ' + col.name));
          
          // Look for product type related collections
          for (const collection of collections) {
            if (collection.name.toLowerCase().includes('product') || collection.name.toLowerCase().includes('type')) {
              console.log(`\nChecking collection: ${collection.name}`);
              const count = await db.collection(collection.name).countDocuments();
              console.log(`Document count: ${count}`);
              
              if (count > 0) {
                const samples = await db.collection(collection.name).find({}).limit(2).toArray();
                console.log('Sample documents:');
                console.log(JSON.stringify(samples, null, 2));
              }
            }
          }
        }
      } catch (e) {
        console.log(`Error accessing database ${dbName}:`, e.message);
      }
    }
    
    await client.close();
  } catch (error) {
    console.error('Connection error:', error.message);
  }
}

checkDatabase();