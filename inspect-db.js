const mongoose = require('mongoose');
const path = require('path');

// Import models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'team_leader', 'member'], default: 'member' },
  firstName: String,
  lastName: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  startDate: Date,
  endDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  isPublic: { type: Boolean, default: false },
  location: String,
  budget: Number,
  tags: [String],
  files: [String],
  photos: [{
    url: String,
    caption: String,
    location: {
      lat: Number,
      lng: Number
    },
    uploadedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Project = mongoose.model('Project', projectSchema);

async function inspectDatabase() {
  try {
    // Get MongoDB URI from environment
    require('dotenv').config({ path: path.join(__dirname, '.env.local') });
    
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.log('❌ MONGODB_URI not found in environment variables');
      console.log('Please check your .env.local file');
      return;
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected successfully!');

    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    
    console.log(`\n📊 Database: ${dbName}\n`);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections (${collections.length}):`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    // Get database stats
    const stats = await db.stats();
    console.log(`\n📈 Database Statistics:`);
    console.log(`   - Storage Size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Collections: ${stats.collections}`);
    console.log(`   - Objects: ${stats.objects}`);

    // Count documents in main collections
    console.log(`\n📋 Document Counts:`);
    
    try {
      const userCount = await User.countDocuments();
      console.log(`   - Users: ${userCount}`);
      
      if (userCount > 0) {
        const sampleUsers = await User.find({}).limit(3).select('-password');
        console.log(`   Sample users:`, sampleUsers.map(u => ({ username: u.username, email: u.email, role: u.role })));
      }
    } catch (e) {
      console.log(`   - Users: Collection may not exist yet`);
    }

    try {
      const projectCount = await Project.countDocuments();
      console.log(`   - Projects: ${projectCount}`);
      
      if (projectCount > 0) {
        const sampleProjects = await Project.find({}).limit(3).select('title status priority isPublic');
        console.log(`   Sample projects:`, sampleProjects.map(p => ({ title: p.title, status: p.status, isPublic: p.isPublic })));
      }
    } catch (e) {
      console.log(`   - Projects: Collection may not exist yet`);
    }

    // Check for other collections
    const otherCollections = collections.filter(col => !['users', 'projects'].includes(col.name));
    if (otherCollections.length > 0) {
      console.log(`\n🗂️  Other Collections:`);
      for (const col of otherCollections) {
        try {
          const count = await db.collection(col.name).countDocuments();
          console.log(`   - ${col.name}: ${count} documents`);
          
          if (count > 0 && count <= 5) {
            const samples = await db.collection(col.name).find({}).limit(2).toArray();
            console.log(`     Sample:`, samples);
          }
        } catch (e) {
          console.log(`   - ${col.name}: Error reading collection`);
        }
      }
    }

    console.log(`\n✨ Database inspection complete!`);
    
  } catch (error) {
    console.error('❌ Error inspecting database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

inspectDatabase();