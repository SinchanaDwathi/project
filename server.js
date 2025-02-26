// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecowaste', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Schemas
const CollectionSchema = new mongoose.Schema({
  location: {
    type: String, 
    required: true
  },
  type: {
    type: String,
    enum: ['Plastic', 'Paper', 'Metal', 'Organic', 'Glass'],
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed'],
    default: 'Scheduled'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  currentFillLevel: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Maintenance'],
    default: 'Active'
  },
  lastEmptied: {
    type: Date,
    default: null
  }
});

// Create models
const Collection = mongoose.model('Collection', CollectionSchema);
const Bin = mongoose.model('Bin', BinSchema);

// API Routes

// Get all collections
app.get('/api/collections', async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new collection
app.post('/api/collections', async (req, res) => {
  const { location, type, weight } = req.body;
  
  if (!location || !type || !weight) {
    return res.status(400).json({ message: 'Please provide location, type and weight' });
  }

  try {
    const newCollection = new Collection({
      location,
      type,
      weight,
      status: 'Scheduled'
    });

    const savedCollection = await newCollection.save();
    res.status(201).json(savedCollection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update collection status
app.patch('/api/collections/:id', async (req, res) => {
  try {
    const updatedCollection = await Collection.findByIdAndUpdate(
      req.params.id, 
      { status: req.body.status },
      { new: true }
    );
    if (!updatedCollection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(updatedCollection);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all bins
app.get('/api/bins', async (req, res) => {
  try {
    const bins = await Bin.find();
    res.json(bins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new bin
app.post('/api/bins', async (req, res) => {
  const { binId, location, capacity } = req.body;
  
  if (!binId || !location || !capacity) {
    return res.status(400).json({ message: 'Please provide binId, location and capacity' });
  }

  try {
    const newBin = new Bin({
      binId,
      location,
      capacity
    });

    const savedBin = await newBin.save();
    res.status(201).json(savedBin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update bin fill level
app.patch('/api/bins/:id/fill', async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    
    bin.currentFillLevel = req.body.fillLevel;
    const updatedBin = await bin.save();
    res.json(updatedBin);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Empty a bin and record collection
app.post('/api/bins/:id/empty', async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    
    // Create new collection record
    const newCollection = new Collection({
      location: bin.location,
      type: req.body.type,
      weight: req.body.weight,
      status: 'Completed'
    });
    
    // Update bin status
    bin.currentFillLevel = 0;
    bin.lastEmptied = Date.now();
    
    // Save both changes
    const [savedCollection, updatedBin] = await Promise.all([
      newCollection.save(),
      bin.save()
    ]);
    
    res.status(201).json({ collection: savedCollection, bin: updatedBin });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get dashboard statistics
app.get('/api/stats', async (req, res) => {
  try {
    // Calculate total waste collected
    const totalWasteResult = await Collection.aggregate([
      { $group: { _id: null, total: { $sum: "$weight" } } }
    ]);
    const totalWaste = totalWasteResult.length > 0 ? totalWasteResult[0].total : 0;
    
    // Get active bins count
    const activeBinsCount = await Bin.countDocuments({ status: 'Active' });
    
    // Get today's collections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCollections = await Collection.countDocuments({
      createdAt: { $gte: today }
    });
    
    // Get last week's stats for comparison
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastWeekWasteResult = await Collection.aggregate([
      { $match: { createdAt: { $gte: lastWeek, $lt: today } } },
      { $group: { _id: null, total: { $sum: "$weight" } } }
    ]);
    const lastWeekWaste = lastWeekWasteResult.length > 0 ? lastWeekWasteResult[0].total : 0;
    
    // Get last week's active bins
    const lastWeekActiveBins = await Bin.countDocuments({
      status: 'Active',
      createdAt: { $lt: today }
    });
    
    // Get last week's collections
    const lastWeekToday = new Date(lastWeek);
    lastWeekToday.setDate(lastWeekToday.getDate() + 1);
    const lastWeekTodayCollections = await Collection.countDocuments({
      createdAt: { $gte: lastWeekToday, $lt: new Date(lastWeekToday.getTime() + 24 * 60 * 60 * 1000) }
    });
    
    res.json({
      totalWaste: {
        current: totalWaste,
        change: lastWeekWaste > 0 ? ((totalWaste - lastWeekWaste) / lastWeekWaste * 100).toFixed(1) : 100
      },
      activeBins: {
        current: activeBinsCount,
        change: activeBinsCount - lastWeekActiveBins
      },
      todayCollections: {
        current: todayCollections,
        change: todayCollections - lastWeekTodayCollections
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get waste type distribution
app.get('/api/waste-distribution', async (req, res) => {
  try {
    const distribution = await Collection.aggregate([
      { $group: { _id: "$type", total: { $sum: "$weight" } } },
      { $sort: { total: -1 } }
    ]);
    res.json(distribution);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Scan item API (for the scan new item button)
app.post('/api/scan', async (req, res) => {
  // This would integrate with a barcode/QR scanning service
  // For now, just return mock data
  const mockItem = {
    id: `ITEM-${Math.floor(Math.random() * 10000)}`,
    material: ['Plastic', 'Paper', 'Metal', 'Glass', 'Organic'][Math.floor(Math.random() * 5)],
    recyclable: Math.random() > 0.3, // 70% chance of being recyclable
    instructions: "Separate components before recycling"
  };
  
  res.json(mockItem);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});