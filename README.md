# 📋 Task & Content Organizer Pro

A beautiful, full-featured task and content management application with smart reminders, deadline tracking, file uploads, and WhatsApp notifications.

## ✨ Features

- ✅ **5 Content Types**: Tasks, Materials, Ideas, Links, Data
- 📅 **Smart Deadlines**: Set due dates with automatic reminders
- 🔔 **Auto Reminders**: Get alerts 1 day, 1 hour, and 15 minutes before deadline
- 💬 **WhatsApp Alerts**: Optional WhatsApp notifications via Twilio
- 📎 **File Uploads**: Support for PDF, Word, PowerPoint, Excel, Images (up to 50MB)
- 🎯 **Prioritization**: High, Medium, Low priority levels
- 🔍 **Search & Filter**: Instant search and filtering by type/priority
- 💾 **Persistent Storage**: All data saved automatically
- 📱 **Fully Responsive**: Works on mobile, tablet, and desktop
- 🎨 **Beautiful UI**: Modern gradient design with smooth animations

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start server
npm start

# Open browser
http://localhost:3000
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for auto-deployment.

## 📦 Project Structure

```
organizer/
├── organizer-enhanced.html    # Frontend UI
├── server-enhanced.js         # Backend server
├── package.json              # Dependencies
├── vercel.json              # Vercel config
├── .gitignore               # Git ignore rules
├── data.json                # Auto-created data file
├── uploads/                 # Auto-created uploads folder
└── README.md               # This file
```

## 🔧 Configuration

### Environment Variables

No environment variables required for basic setup.

For WhatsApp:
- Set your Twilio Auth Token in app Settings
- Requires Twilio free account (https://twilio.com)

### Vercel Deployment

The `vercel.json` file handles routing:
- API routes to backend server
- Static files serving
- File uploads handling

## 📅 Deadline Management

### Setting Deadlines
1. Click "Add Item"
2. Fill in details
3. Set Priority (High/Medium/Low)
4. Set Deadline (date + time)
5. Check "Enable Reminders"
6. Click "Add Item"

### Automatic Reminders
Server checks every minute and sends alerts:
- 📅 1 Day Before: 24 hours earlier
- ⏰ 1 Hour Before: 60 minutes earlier
- 🚨 15 Minutes: Final urgent alert

### Deadline Display
On item card:
- "5 days left" - Plenty of time
- "2 hours left" - Getting urgent (orange)
- "OVERDUE" - Past deadline (red)

## 💬 WhatsApp Notifications

### Setup (5 minutes)
1. Go to https://twilio.com
2. Create free account ($8 credit)
3. Get Auth Token from Account Settings
4. In app Settings → Enter WhatsApp number: `+1-234-567-8900`
5. Paste Auth Token
6. Click "Send Test Message"
7. Receive WhatsApp alert!

## 📁 File Upload

### Supported Types
- Documents: PDF, Word, Excel, PowerPoint
- Images: JPG, PNG, GIF, WebP
- Text: TXT, JSON

### Max Size: 50MB per file

Files are:
- Stored in `uploads/` folder
- Linked to items
- Deletable with item removal
- Downloadable anytime

## 🌐 Deployment Options

### Vercel (Recommended)
- Free tier with auto-scaling
- GitHub integration
- Auto-deploy on push
- Zero configuration needed

### Other Options
- Heroku
- Railway.app
- DigitalOcean
- AWS

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **Database**: JSON file storage
- **Task Scheduling**: node-cron
- **File Upload**: Multer
- **API**: RESTful JSON API

## 📝 API Endpoints

```
GET    /api/items              # Get all items
GET    /api/items/:type        # Get items by type
POST   /api/items              # Create item
POST   /api/items/upload       # Create item with file
PUT    /api/items/:type/:id    # Update item
DELETE /api/items/:type/:id    # Delete item

GET    /api/folders            # Get all folders
POST   /api/folders            # Create folder
DELETE /api/folders/:id        # Delete folder

GET    /api/settings           # Get settings
POST   /api/settings           # Update settings
POST   /api/test-notification  # Send test notification
```

## 🔒 Security Notes

Current implementation:
- Plain text JSON storage
- No user authentication
- No encryption

For production:
- Add user authentication
- Use database (MongoDB/PostgreSQL)
- Enable HTTPS
- Add data encryption
- Implement access control

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### "Failed to fetch" Error
- Server is NOT running
- Solution: Run `npm start`
- Keep terminal window open

### Items Not Saving
- Check server is running
- Verify deadline has date AND time
- Check browser console (F12) for errors

### Reminders Not Working
- Enable reminders checkbox
- Set deadline with date & time
- Server must be running
- Wait for reminder time

### WhatsApp Not Sending
- Verify phone format: `+country-code-xxx`
- Check Auth Token is correct
- Test with "Send Test Message" first
- Check Twilio account is active

## 📞 Support

For issues:
1. Check browser console (F12)
2. Check server logs
3. Read TROUBLESHOOTING.md
4. Check data.json exists
5. Try restarting server

## 📜 License

MIT License - Free to use, modify, and distribute

## 🤝 Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Improve documentation

## 🎉 Features Coming Soon

- Dark mode
- User authentication
- Sharing & collaboration
- Recurring tasks
- Categories/Folders
- Export data
- Mobile app
- Database integration

## 📧 Contact

For questions or feedback, open an issue on GitHub.

---

**Happy organizing! Never miss a deadline again! 🎊✨**
