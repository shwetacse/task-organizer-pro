const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const cron = require('node-cron');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const name = path.basename(file.originalname, extension);
        cb(null, `${name}-${timestamp}${extension}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'application/json',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type not allowed`));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize data
function initializeData() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            tasks: [],
            materials: [],
            ideas: [],
            links: [],
            data: [],
            settings: {
                whatsappNumber: '',
                whatsappApiKey: '',
                notificationEnabled: true,
                remindersEnabled: true
            },
            folders: [
                { id: '1', name: 'Work', icon: 'briefcase', color: '#3b82f6' },
                { id: '2', name: 'Personal', icon: 'heart', color: '#ec4899' }
            ]
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

// Read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading data:', err);
        return {
            tasks: [], materials: [], ideas: [], links: [], data: [],
            settings: {},
            folders: []
        };
    }
}

// Write data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (err) {
        console.error('Error writing data:', err);
        return false;
    }
}

// Send WhatsApp message
async function sendWhatsAppMessage(phoneNumber, message) {
    const data = readData();
    const apiKey = data.settings.whatsappApiKey;
    
    if (!apiKey || !phoneNumber) {
        console.log('[WhatsApp] Not configured:', { phoneNumber, apiKey: !!apiKey });
        return false;
    }

    try {
        console.log('[WhatsApp] Sending to:', phoneNumber, 'Message:', message);
        // Twilio integration point - customize as needed
        return true;
    } catch (err) {
        console.error('WhatsApp error:', err.message);
        return true;
    }
}

// Check reminders
async function checkReminders() {
    const data = readData();
    if (!data.settings || !data.settings.remindersEnabled) return;

    const now = new Date();

    ['tasks', 'materials', 'ideas', 'links', 'data'].forEach(type => {
        if (!Array.isArray(data[type])) return;

        data[type].forEach(item => {
            if (!item.deadline || !item.reminderEnabled || item.status !== 'active') return;

            const deadline = new Date(item.deadline);
            const diffMs = deadline - now;
            const diffMins = Math.floor(diffMs / 60000);

            // 1 day before
            if (diffMins >= 1439 && diffMins <= 1440 && !item.reminderSent1day) {
                const msg = `📌 Reminder: "${item.title}" is due in 1 day!`;
                console.log('[REMINDER 1DAY]', msg);
                if (data.settings.whatsappNumber) {
                    sendWhatsAppMessage(data.settings.whatsappNumber, msg);
                }
                item.reminderSent1day = true;
                writeData(data);
            }

            // 1 hour before
            if (diffMins >= 59 && diffMins <= 60 && !item.reminderSent1hour) {
                const msg = `⏰ Alert: "${item.title}" is due in 1 hour!`;
                console.log('[REMINDER 1HOUR]', msg);
                if (data.settings.whatsappNumber) {
                    sendWhatsAppMessage(data.settings.whatsappNumber, msg);
                }
                item.reminderSent1hour = true;
                writeData(data);
            }

            // 15 mins before
            if (diffMins >= 14 && diffMins <= 15 && !item.reminderSent15min) {
                const msg = `🚨 URGENT: "${item.title}" is due in 15 minutes!`;
                console.log('[REMINDER 15MIN]', msg);
                if (data.settings.whatsappNumber) {
                    sendWhatsAppMessage(data.settings.whatsappNumber, msg);
                }
                item.reminderSent15min = true;
                writeData(data);
            }
        });
    });
}

// Run reminder check every minute
cron.schedule('* * * * *', checkReminders);

// ==================== API ROUTES ====================

// *** UPLOAD ROUTE MUST COME FIRST ***
app.post('/api/items/upload', upload.single('file'), (req, res) => {
    try {
        const { type, title, description, tags, priority, deadline, folderId, reminderEnabled } = req.body;
        const data = readData();

        if (!data[type]) {
            data[type] = [];
        }

        if (!title) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Title is required' });
        }

        const item = {
            id: Date.now().toString(),
            title: title.trim(),
            description: (description || '').trim(),
            tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
            url: null,
            filePath: req.file ? `/uploads/${req.file.filename}` : null,
            fileName: req.file ? req.file.originalname : null,
            fileSize: req.file ? req.file.size : 0,
            fileMimeType: req.file ? req.file.mimetype : null,
            priority: priority || 'medium',
            deadline: deadline || null,
            folderId: folderId || null,
            reminderEnabled: reminderEnabled !== false,
            reminderSent1day: false,
            reminderSent1hour: false,
            reminderSent15min: false,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        data[type].push(item);
        
        if (writeData(data)) {
            res.status(201).json(item);
        } else {
            if (req.file) fs.unlinkSync(req.file.path);
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (err) {
        console.error('Upload error:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: err.message });
    }
});

// GET all items
app.get('/api/items', (req, res) => {
    try {
        const data = readData();
        const organized = {};
        
        ['tasks', 'materials', 'ideas', 'links', 'data'].forEach(type => {
            if (!data[type]) data[type] = [];
            
            organized[type] = data[type].sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const aPriority = priorityOrder[a.priority] || 2;
                const bPriority = priorityOrder[b.priority] || 2;
                
                if (aPriority !== bPriority) return aPriority - bPriority;
                
                if (a.deadline && b.deadline) {
                    return new Date(a.deadline) - new Date(b.deadline);
                }
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        });
        
        res.json(organized);
    } catch (err) {
        console.error('GET items error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET items by type
app.get('/api/items/:type', (req, res) => {
    try {
        const data = readData();
        const type = req.params.type;
        
        if (!['tasks', 'materials', 'ideas', 'links', 'data'].includes(type)) {
            return res.status(400).json({ error: 'Invalid type' });
        }
        
        const items = data[type] || [];
        const sorted = items.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const aPriority = priorityOrder[a.priority] || 2;
            const bPriority = priorityOrder[b.priority] || 2;
            
            if (aPriority !== bPriority) return aPriority - bPriority;
            
            if (a.deadline && b.deadline) {
                return new Date(a.deadline) - new Date(b.deadline);
            }
            
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        res.json(sorted);
    } catch (err) {
        console.error('GET type error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST new item (without file)
app.post('/api/items', (req, res) => {
    try {
        const { type, title, description, tags, url, priority, deadline, folderId, reminderEnabled } = req.body;
        const data = readData();

        if (!data[type]) {
            data[type] = [];
        }

        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required' });
        }

        const item = {
            id: Date.now().toString(),
            title: title.trim(),
            description: (description || '').trim(),
            tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
            url: url || null,
            priority: priority || 'medium',
            deadline: deadline || null,
            folderId: folderId || null,
            reminderEnabled: reminderEnabled !== false,
            reminderSent1day: false,
            reminderSent1hour: false,
            reminderSent15min: false,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        data[type].push(item);
        
        if (writeData(data)) {
            res.status(201).json(item);
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (err) {
        console.error('POST items error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT update item
app.put('/api/items/:type/:id', (req, res) => {
    try {
        const { type, id } = req.params;
        const { title, description, tags, url, priority, deadline, folderId, reminderEnabled, status } = req.body;
        const data = readData();

        if (!data[type]) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        const item = data[type].find(i => i.id === id);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        if (title) item.title = title.trim();
        if (description !== undefined) item.description = description.trim();
        if (tags !== undefined) item.tags = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [];
        if (url !== undefined) item.url = url;
        if (priority !== undefined) item.priority = priority;
        if (deadline !== undefined) item.deadline = deadline;
        if (folderId !== undefined) item.folderId = folderId;
        if (reminderEnabled !== undefined) item.reminderEnabled = reminderEnabled;
        if (status !== undefined) item.status = status;

        if (writeData(data)) {
            res.json(item);
        } else {
            res.status(500).json({ error: 'Failed to update' });
        }
    } catch (err) {
        console.error('PUT update error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE item
app.delete('/api/items/:type/:id', (req, res) => {
    try {
        const { type, id } = req.params;
        const data = readData();

        if (!data[type]) {
            return res.status(400).json({ error: 'Invalid type' });
        }

        const itemIndex = data[type].findIndex(i => i.id === id);
        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const item = data[type][itemIndex];
        if (item.filePath) {
            const filePath = path.join(__dirname, item.filePath);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (e) {
                console.error('File delete error:', e);
            }
        }

        data[type].splice(itemIndex, 1);

        if (writeData(data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete' });
        }
    } catch (err) {
        console.error('DELETE error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Folders
app.get('/api/folders', (req, res) => {
    try {
        const data = readData();
        res.json(data.folders || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/folders', (req, res) => {
    try {
        const { name, icon, color } = req.body;
        const data = readData();

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!data.folders) data.folders = [];

        const folder = {
            id: Date.now().toString(),
            name: name.trim(),
            icon: icon || 'folder',
            color: color || '#6366f1',
            createdAt: new Date().toISOString()
        };

        data.folders.push(folder);

        if (writeData(data)) {
            res.status(201).json(folder);
        } else {
            res.status(500).json({ error: 'Failed to create' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/folders/:folderId', (req, res) => {
    try {
        const { folderId } = req.params;
        const data = readData();

        if (!data.folders) {
            return res.status(400).json({ error: 'No folders' });
        }

        const idx = data.folders.findIndex(f => f.id === folderId);
        if (idx === -1) {
            return res.status(404).json({ error: 'Folder not found' });
        }

        data.folders.splice(idx, 1);

        if (writeData(data)) {
            res.json({ success: true });
        } else {
            res.status(500).json({ error: 'Failed to delete' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Settings
app.get('/api/settings', (req, res) => {
    try {
        const data = readData();
        res.json(data.settings || {});
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        const settings = req.body;
        const data = readData();

        if (!data.settings) data.settings = {};

        data.settings = {
            ...data.settings,
            ...settings
        };

        if (writeData(data)) {
            res.json(data.settings);
        } else {
            res.status(500).json({ error: 'Failed to save' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Test notification
app.post('/api/test-notification', (req, res) => {
    try {
        const { message, phoneNumber } = req.body;
        
        console.log('[TEST NOTIFICATION]', message);
        if (phoneNumber) {
            sendWhatsAppMessage(phoneNumber, message);
        }
        
        res.json({ success: true, message: 'Test sent' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK' });
});

// Serve HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'organizer-enhanced.html'));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
});

// Initialize and start
initializeData();
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Data: ${DATA_FILE}`);
    console.log(`⏰ Reminder checks: Every minute`);
    console.log(`✨ Ready to receive requests`);
});
