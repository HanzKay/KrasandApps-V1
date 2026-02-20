# Kopi Krasand - Coffee Shop Management System

## System Blueprint

### Applications/Dashboards (7 Total)

| App | Route | User Role | Purpose |
|-----|-------|-----------|---------|
| **Customer App** | `/` | Public | Menu browsing, ordering, membership discounts |
| **Admin Dashboard** | `/admin` | Admin | User management, loyalty programs, statistics |
| **CMS Dashboard** | `/cms` | Admin | Product & category management, content editing |
| **Kitchen Dashboard** | `/kitchen` | Kitchen | Order display, status updates |
| **POS Dashboard** | `/pos` | Cashier | Payment processing, receipts |
| **Waiter Dashboard** | `/waiter` | Waiter | Order status, table management |
| **Storage Dashboard** | `/storage` | Storage | Inventory, ingredients, COGS |

### Technology Stack

**Frontend:**
- React 18.x
- TailwindCSS 3.4.x
- Shadcn/UI Components
- React Router 6.x
- Axios (HTTP client)
- Lucide React (icons)

**Backend:**
- Python 3.11+
- FastAPI 0.110.x
- Uvicorn (ASGI server)
- Motor/PyMongo (MongoDB driver)
- Pydantic 2.9.x (validation)
- Python-Jose (JWT)
- Passlib/bcrypt (passwords)

**Database:**
- MongoDB Atlas (cloud)

**Deployment:**
- Docker & Docker Compose
- Nginx (reverse proxy)

### Key Features

✅ **Customer Ordering**
- Menu browsing by category
- Cart with quantity controls
- Multiple order types (dine-in, delivery, to-go)
- Automatic membership discount at checkout

✅ **Content Management (CMS)**
- Product CRUD with image upload
- Category management
- Menu sorting/ordering
- Enable/disable products

✅ **Admin Panel**
- User management (all roles)
- Loyalty program creation
- Membership assignment
- Revenue & statistics dashboard

✅ **Loyalty Program**
- Duration options (days, months, years, lifetime)
- Multiple benefit types (food %, beverage %, WiFi %, custom)
- Automatic discount calculation
- Group and individual programs

✅ **Kitchen/POS/Waiter**
- Real-time order display
- Status workflow (pending → preparing → ready → completed)
- Payment processing
- Table management with QR codes

### Credentials

**Admin:** admin@kopikrasand.com / Admin123!

### Docker Deployment

```bash
# Configure
cp .env.example .env
# Edit with MongoDB Atlas credentials

# Run
docker-compose up -d --build

# Access
http://localhost        # Frontend
http://localhost:8001/docs  # API Docs
```

### Project Files

```
/app/
├── backend/
│   ├── server.py          # FastAPI (all routes)
│   ├── requirements.txt   # Python deps
│   ├── Dockerfile
│   └── .env.production    # Atlas template
├── frontend/
│   ├── src/pages/         # 8 page components
│   ├── public/images/     # Logo (local)
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── README.md
└── ARCHITECTURE.md        # Full blueprint
```

### Next Steps

To save to GitHub:
1. Use **"Save to Github"** button in chat
2. Creates new repository with all code
3. Configure MongoDB Atlas credentials
4. Deploy with Docker

### Environment Variables Required

```env
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/
DB_NAME=kopi_krasand
SECRET_KEY=your-32-char-secret
CORS_ORIGINS=*
REACT_APP_BACKEND_URL=http://localhost
```
