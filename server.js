const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'verbai-db.json');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images

// --- JSON DB HELPER ---

function readDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialData = seedData();
    writeDb(initialData);
    return initialData;
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(data);
    // Ensure all keys exist even if file is old
    if (!parsed.leads) parsed.leads = [];
    if (!parsed.contents) parsed.contents = [];
    if (!parsed.terms) parsed.terms = [];
    return parsed;
  } catch (err) {
    console.error("Error reading DB:", err);
    return { contents: [], terms: [], leads: [], siteConfig: {} };
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing DB:", err);
  }
}

// CLEAN SEED DATA (Empty arrays as requested)
function seedData() {
  return {
    siteConfig: {
        header: {
            logoText: 'My Agency',
            links: [
                { label: 'About', url: '/about' },
                { label: 'Contact', url: '/contact' }
            ]
        },
        footer: {
            copyright: '© 2024 All Rights Reserved.',
            links: [
                { label: 'Privacy', url: '/legal/privacy' }
            ]
        },
        robotsTxt: "User-agent: *\nAllow: /"
    },
    contents: [], // No posts initially
    terms: [],    // No categories initially
    leads: []     // No leads initially
  };
}

// --- API ROUTES ---

// Config (Global)
app.get('/api/config', (req, res) => {
    const db = readDb();
    if (!db.siteConfig) db.siteConfig = seedData().siteConfig;
    res.json(db.siteConfig);
});

app.post('/api/config', (req, res) => {
    const db = readDb();
    db.siteConfig = { ...db.siteConfig, ...req.body };
    writeDb(db);
    res.json(db.siteConfig);
});

// --- CONTENTS ---
app.get('/api/contents', (req, res) => {
  const type = req.query.type; 
  const db = readDb();
  let contents = db.contents || [];
  
  if (type) {
    contents = contents.filter(c => c.type === type);
  }
  
  // Sort by createdAt desc
  contents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(contents);
});

app.post('/api/contents', (req, res) => {
  const c = req.body;
  const now = new Date().toISOString();
  const db = readDb();
  
  const index = db.contents.findIndex(item => item.id === c.id);
  
  if (index >= 0) {
    db.contents[index] = { ...db.contents[index], ...c, updatedAt: now };
    writeDb(db);
    res.json({ message: "Updated", id: c.id });
  } else {
    const newContent = {
      ...c,
      id: c.id || Date.now().toString(),
      createdAt: now,
      updatedAt: now
    };
    db.contents.push(newContent);
    writeDb(db);
    res.json({ message: "Created", id: newContent.id });
  }
});

app.delete('/api/contents/:id', (req, res) => {
  const db = readDb();
  const initialLength = db.contents.length;
  db.contents = db.contents.filter(item => item.id !== req.params.id);
  
  if (db.contents.length < initialLength) {
    writeDb(db);
    res.json({ message: "Deleted" });
  } else {
    res.status(404).json({ message: "Not found" });
  }
});

// --- TERMS ---
app.get('/api/terms', (req, res) => {
  const db = readDb();
  res.json(db.terms || []);
});

app.post('/api/terms', (req, res) => {
  const t = req.body;
  const db = readDb();
  const index = db.terms.findIndex(item => item.id === t.id);
  
  if (index >= 0) {
      db.terms[index] = t;
  } else {
      db.terms.push(t);
  }
  writeDb(db);
  res.json({ message: "Term Saved", id: t.id });
});

app.delete('/api/terms/:id', (req, res) => {
    const db = readDb();
    db.terms = db.terms.filter(item => item.id !== req.params.id);
    writeDb(db);
    res.json({ message: "Term Deleted" });
});

// --- LEADS (NEW ROUTE FOR PERSISTENCE) ---
app.get('/api/leads', (req, res) => {
    const db = readDb();
    res.json(db.leads || []);
});

app.post('/api/leads', (req, res) => {
    const lead = req.body;
    const db = readDb();
    
    const index = db.leads.findIndex(l => l.id === lead.id);
    if (index >= 0) {
        db.leads[index] = lead;
    } else {
        db.leads.unshift(lead); // Add to top
    }
    
    writeDb(db);
    res.json({ message: "Lead Saved", id: lead.id });
});

app.delete('/api/leads/:id', (req, res) => {
    const db = readDb();
    db.leads = db.leads.filter(l => l.id !== req.params.id);
    writeDb(db);
    res.json({ message: "Lead Deleted" });
});


app.listen(PORT, () => {
  console.log(`VerbAI JSON-Server running on http://localhost:${PORT}`);
});