# Kopi Krasand - System Architecture Blueprint

## Application Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    KOPI KRASAND COFFEE SHOP SYSTEM                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Customer    │  │   Admin      │  │    CMS       │              │
│  │    App       │  │  Dashboard   │  │  Dashboard   │              │
│  │     (/)      │  │   (/admin)   │  │    (/cms)    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   Kitchen    │  │    POS       │  │   Waiter     │              │
│  │  Dashboard   │  │  Dashboard   │  │  Dashboard   │              │
│  │  (/kitchen)  │  │    (/pos)    │  │  (/waiter)   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                     │
│  ┌──────────────┐                                                   │
│  │   Storage    │                                                   │
│  │  Dashboard   │                                                   │
│  │  (/storage)  │                                                   │
│  └──────────────┘                                                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                             │
│                         (Port 8001)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  /api/auth/*        - Authentication (JWT)                         │
│  /api/products/*    - Product CRUD                                 │
│  /api/categories/*  - Category CRUD                                │
│  /api/orders/*      - Order management                             │
│  /api/tables/*      - Table management                             │
│  /api/ingredients/* - Inventory                                    │
│  /api/admin/*       - User & Program management                    │
│  /api/my/*          - Customer self-service                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        MONGODB ATLAS                                │
│                    (Cloud Database)                                 │
├─────────────────────────────────────────────────────────────────────┤
│  Collections:                                                       │
│  • users              • products           • categories            │
│  • orders             • tables             • ingredients           │
│  • loyalty_programs   • customer_memberships                       │
│  • transactions       • cogs                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI Framework |
| TailwindCSS | 3.4.x | Styling |
| Shadcn/UI | Latest | UI Components |
| React Router | 6.x | Routing |
| Axios | 1.x | HTTP Client |
| Lucide React | Latest | Icons |
| Sonner | Latest | Toast Notifications |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.110.x | Web Framework |
| Uvicorn | 0.29.x | ASGI Server |
| Motor | 3.3.x | Async MongoDB Driver |
| PyMongo | 4.6.x | MongoDB Driver |
| Pydantic | 2.9.x | Data Validation |
| Python-Jose | 3.3.x | JWT Tokens |
| Passlib | 1.7.x | Password Hashing |
| QRCode | 7.4.x | QR Code Generation |

### Infrastructure
| Technology | Version | Purpose |
|------------|---------|---------|
| Docker | 24.x+ | Containerization |
| Docker Compose | 2.x | Container Orchestration |
| Nginx | Alpine | Reverse Proxy |
| MongoDB Atlas | 7.x | Cloud Database |

## Directory Structure

```
kopi-krasand/
├── backend/
│   ├── server.py              # Main FastAPI application (900+ lines)
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile            # Backend container config
│   ├── .env                  # Environment variables
│   └── .env.production       # Production env template
│
├── frontend/
│   ├── public/
│   │   ├── images/
│   │   │   └── logo.png      # Kopi Krasand logo
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Shadcn/UI components
│   │   │   │   ├── button.jsx
│   │   │   │   ├── card.jsx
│   │   │   │   ├── dialog.jsx
│   │   │   │   ├── input.jsx
│   │   │   │   ├── tabs.jsx
│   │   │   │   └── ...
│   │   │   └── QRScanner.js   # QR code scanner
│   │   │
│   │   ├── pages/
│   │   │   ├── CustomerApp.js      # Customer ordering (/)
│   │   │   ├── AdminDashboard.js   # Admin panel (/admin)
│   │   │   ├── CMSDashboard.js     # Content management (/cms)
│   │   │   ├── KitchenDashboard.js # Kitchen display (/kitchen)
│   │   │   ├── POSDashboard.js     # Point of sale (/pos)
│   │   │   ├── WaiterDashboard.js  # Waiter station (/waiter)
│   │   │   ├── InventoryDashboard.js # Storage (/storage)
│   │   │   └── Login.js            # Authentication (/login)
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication state
│   │   │
│   │   ├── utils/
│   │   │   └── api.js         # Axios instance
│   │   │
│   │   ├── App.js             # Main router
│   │   └── index.css          # Global styles
│   │
│   ├── package.json           # Node dependencies
│   ├── Dockerfile            # Frontend container config
│   └── nginx.conf            # Nginx configuration
│
├── docker-compose.yml         # Multi-container setup
├── .env.example              # Environment template
├── README.md                 # Documentation
└── ARCHITECTURE.md           # This file
```

## User Roles & Permissions

```
┌─────────────┬─────────────────────────────────────────────────────────┐
│    Role     │                      Permissions                        │
├─────────────┼─────────────────────────────────────────────────────────┤
│  Customer   │ • Browse menu                                          │
│             │ • Place orders                                         │
│             │ • View own orders & membership                         │
├─────────────┼─────────────────────────────────────────────────────────┤
│   Admin     │ • ALL permissions                                      │
│             │ • User management (CRUD)                               │
│             │ • Loyalty program management                           │
│             │ • Content management (CMS)                             │
│             │ • System statistics                                    │
├─────────────┼─────────────────────────────────────────────────────────┤
│  Cashier    │ • View orders                                          │
│             │ • Process payments                                     │
│             │ • Generate receipts                                    │
│             │ • View transactions                                    │
├─────────────┼─────────────────────────────────────────────────────────┤
│   Waiter    │ • View order status                                    │
│             │ • Manage table status                                  │
│             │ • Mark orders as served                                │
├─────────────┼─────────────────────────────────────────────────────────┤
│  Kitchen    │ • View incoming orders                                 │
│             │ • Update order status                                  │
│             │ • View ingredient inventory                            │
├─────────────┼─────────────────────────────────────────────────────────┤
│  Storage    │ • Manage ingredients                                   │
│             │ • Manage products                                      │
│             │ • Track COGS                                           │
│             │ • Generate table QR codes                              │
└─────────────┴─────────────────────────────────────────────────────────┘
```

## API Endpoints Summary

### Authentication
```
POST /api/auth/register     - Customer registration
POST /api/auth/login        - User login
GET  /api/auth/me           - Get current user
```

### Products & Categories
```
GET    /api/products        - List products
POST   /api/products        - Create product (Admin/Storage)
PUT    /api/products/:id    - Update product
DELETE /api/products/:id    - Delete product (Admin)
GET    /api/categories      - List categories
POST   /api/categories      - Create category (Admin)
PUT    /api/categories/:id  - Update category
DELETE /api/categories/:id  - Delete category
```

### Orders
```
GET    /api/orders          - List orders
POST   /api/orders          - Create order
PUT    /api/orders/:id/status  - Update status
PUT    /api/orders/:id/payment - Process payment
POST   /api/orders/preview-discount - Preview member discount
```

### Admin
```
GET    /api/admin/users     - List all users
POST   /api/admin/users     - Create user (any role)
PUT    /api/admin/users/:id/role - Update role
DELETE /api/admin/users/:id - Delete user
GET    /api/admin/stats     - Dashboard statistics
GET    /api/admin/programs  - List loyalty programs
POST   /api/admin/programs  - Create program
PUT    /api/admin/programs/:id - Update program
DELETE /api/admin/programs/:id - Delete program
POST   /api/admin/memberships - Assign membership
DELETE /api/admin/memberships/:id - Cancel membership
```

### Customer Self-Service
```
GET /api/my/membership      - View own memberships
```

## Database Collections

### users
```javascript
{
  id: string,
  email: string,
  name: string,
  password: string (hashed),
  role: "customer" | "admin" | "cashier" | "waiter" | "kitchen" | "storage",
  is_member: boolean,
  created_at: datetime
}
```

### products
```javascript
{
  id: string,
  name: string,
  description: string,
  category: string,
  price: float,
  image_url: string,
  recipes: [{ ingredient_id, quantity }],
  available: boolean,
  featured: boolean,
  sort_order: integer,
  created_at: datetime
}
```

### orders
```javascript
{
  id: string,
  order_number: string,
  customer_id: string,
  customer_name: string,
  customer_email: string,
  order_type: "dine-in" | "delivery" | "to-go",
  table_id: string,
  table_number: integer,
  items: [{ product_id, product_name, quantity, price, category }],
  subtotal: float,
  discount_info: {
    membership_id, program_name,
    food_discount_percent, beverage_discount_percent,
    food_discount_amount, beverage_discount_amount,
    total_discount
  },
  total_amount: float,
  status: "pending" | "preparing" | "ready" | "completed" | "cancelled",
  payment_status: "unpaid" | "paid",
  payment_method: "cash" | "online" | "qr",
  created_at: datetime
}
```

### loyalty_programs
```javascript
{
  id: string,
  name: string,
  description: string,
  duration_type: "days" | "months" | "years" | "lifetime",
  duration_value: integer,
  benefits: [{ benefit_type, value, description }],
  is_group: boolean,
  color: string,
  created_at: datetime
}
```

### customer_memberships
```javascript
{
  id: string,
  customer_id: string,
  program_id: string,
  program_name: string,
  start_date: datetime,
  end_date: datetime | null,
  status: "active" | "expired" | "cancelled",
  benefits: [{ benefit_type, value, description }]
}
```

## Docker Deployment

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-username/kopi-krasand.git
cd kopi-krasand

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas credentials

# Build and run
docker-compose up -d --build

# Access
# Frontend: http://localhost
# API Docs: http://localhost:8001/docs
```

### Docker Services
```yaml
services:
  backend:
    - FastAPI application
    - Port: 8001
    - Connects to MongoDB Atlas

  frontend:
    - React build served by Nginx
    - Port: 80
    - Proxies /api/* to backend
```

## Security Features

1. **JWT Authentication** - Stateless token-based auth
2. **Password Hashing** - bcrypt with salt
3. **Role-Based Access Control** - Route protection
4. **CORS Configuration** - Configurable origins
5. **Input Validation** - Pydantic models
6. **Customer-Only Registration** - Staff created by admin only

## Branding

- **Logo**: `/frontend/public/images/logo.png`
- **Primary Color**: `#5A3A2A` (Rich Brown)
- **Secondary Color**: `#F5EEDC` (Cream)
- **Accent Color**: `#D9A54C` (Gold)
- **Success Color**: `#4A7A5E` (Green)
- **Fonts**: Playfair Display (headings), DM Sans (body)

---

Version: 2.0.0
Last Updated: 2024
