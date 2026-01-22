# Kopi Krasand - Coffee Shop Management System

## Original Problem Statement
Build an interconnected system of applications for a coffee shop with:
1. **Menu Order App** (Customer) - Reserve tables, order for dine-in/delivery/to-go, payment options
2. **Order Request App** (Kitchen) - Receive orders, update progress, show customer position for pickup
3. **POS Dashboard** (Cashier) - Process payments, generate receipts, transaction log
4. **Inventory Management App** (Storage) - Track ingredients, COGS data, pricing support

## Tech Stack
- **Backend**: FastAPI (Python 3)
- **Frontend**: React with TailwindCSS
- **Database**: MongoDB
- **Authentication**: JWT

## User Roles & Access (6 Roles)

| Role | Route | Access Level |
|------|-------|--------------|
| Customer | `/` | Public - ordering, membership |
| Cashier | `/pos` | Staff - payments, transactions |
| Waiter | `/waiter` | Staff - order status, table management |
| Kitchen | `/kitchen` | Staff - order preparation |
| Storage | `/storage` | Staff - inventory, products, COGS |
| Admin | `/admin` | Full - user management, all stats |

## Security Model
- **Customers**: Self-register at `/login` with optional membership
- **Staff (all roles)**: Created ONLY by Admin via Admin Dashboard
- **Role-based access control** enforced on all protected routes

## Implemented Features

### Customer App (`/`)
- [x] Browse menu (beverages & food)
- [x] Add to cart
- [x] Place orders (dine-in, delivery, to-go)
- [x] Customer registration with membership option

### Kitchen Dashboard (`/kitchen`)
- [x] View active orders
- [x] Update order status (pending → preparing → ready)
- [x] Real-time refresh (5s interval)

### POS Dashboard (`/pos`)
- [x] View all orders
- [x] Process payments (cash, online, QR)
- [x] Generate receipts
- [x] Transaction history

### Waiter Dashboard (`/waiter`)
- [x] View order status
- [x] Table management (seat guests, reserve, clear)
- [x] Ready orders highlighted

### Storage Dashboard (`/storage`)
- [x] Ingredients management
- [x] Products management with recipes
- [x] COGS tracking
- [x] Table/QR code management

### Admin Dashboard (`/admin`)
- [x] User management (add, edit role, delete)
- [x] System statistics
- [x] Revenue tracking
- [x] Role distribution overview

## API Endpoints

### Auth
- `POST /api/auth/register` - Customer registration only
- `POST /api/auth/login` - All users
- `GET /api/auth/me` - Get current user

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user with any role
- `PUT /api/admin/users/{id}/role` - Update user role
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/stats` - Dashboard statistics

### Products (Public read, Staff write)
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product

### Orders
- `POST /api/orders` - Create order (public)
- `GET /api/orders` - List orders (authenticated)
- `PUT /api/orders/{id}/status` - Update status
- `PUT /api/orders/{id}/payment` - Process payment

### Tables
- `GET /api/tables` - List tables
- `POST /api/tables` - Create table with QR
- `PUT /api/tables/{id}/status` - Update status

### Inventory (Storage/Kitchen)
- `GET /api/ingredients` - List ingredients
- `POST /api/ingredients` - Add ingredient
- `GET /api/cogs` - List COGS entries

## Database Collections
- `users` - User accounts with roles
- `products` - Menu items with recipes
- `orders` - Customer orders
- `tables` - Table configurations with QR codes
- `ingredients` - Inventory items
- `cogs` - Cost of goods sold entries
- `transactions` - Payment records

## Credentials
- **Admin**: admin@kopikrasand.com / Admin123!

## Upcoming Features (Backlog)
1. GPS tracking for to-go orders
2. Recipe-based inventory auto-deduction (partially implemented)
3. Table reservation system
4. Payment provider integration (Stripe)
5. Transaction log/reporting
6. Member rewards/points system

## Branding
- Logo: Kopi Krasand
- Colors: Rich brown (#5A3A2A), Cream (#F5EEDC), Gold (#D9A54C), Green (#4A7A5E)
- Fonts: Playfair Display (headings), DM Sans (body)
