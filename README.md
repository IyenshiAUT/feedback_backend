# Team MIMH Feedback Backend

RESTful API backend for the Team MIMH Project Feedback System built with Node.js, Express, and MongoDB.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file (already created with defaults):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team_mimh_feedback
```

### Run the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

## 📁 Project Structure

```
backend/
├── server.js              # Entry point
├── models/
│   └── Feedback.js        # Feedback schema
├── routes/
│   └── feedback.js        # API routes
├── controllers/
│   └── feedbackController.js  # Business logic
├── .env                   # Environment variables
└── package.json
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/feedback` | Get all feedback (paginated) |
| GET | `/api/feedback/:id` | Get feedback by ID |
| GET | `/api/feedback/project/:projectType` | Get feedback by project |
| GET | `/api/feedback/stats/summary` | Get statistics |
| POST | `/api/feedback` | Create new feedback |
| PUT | `/api/feedback/:id` | Update feedback |
| DELETE | `/api/feedback/:id` | Delete feedback |

## 📝 Request Examples

### Create Feedback
```json
POST /api/feedback
{
  "projectType": "tourist-utility-service-system",
  "rating": 5,
  "innovation": "high",
  "comments": "Great project!",
  "reviewerName": "John Doe",
  "reviewerEmail": "john@example.com"
}
```

### Response
```json
{
  "success": true,
  "message": "Feedback submitted successfully",
  "data": {
    "_id": "...",
    "projectType": "tourist-utility-service-system",
    "rating": 5,
    "innovation": "high",
    "comments": "Great project!",
    "createdAt": "2025-12-01T..."
  }
}
```

## 🛡️ Project Types
- `tourist-utility-service-system`
- `stroke-hand-recovery-system`

## 📊 Innovation Levels
- `low` - Common approach
- `medium` - Some unique elements
- `high` - Very innovative
- `breakthrough` - Game-changing

---
© 2025 Team MIMH
