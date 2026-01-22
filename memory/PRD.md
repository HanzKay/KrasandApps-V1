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
| Admin | `/admin` | Full - user management, loyalty programs, all stats |

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
- [x] View own membership benefits (`/api/my/membership`)

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
- [x] **Loyalty Programs** (NEW)
- [x] **Membership Management** (NEW)

## Loyalty Program Feature (NEW)

### Program Configuration
- **Duration Types**: Days, Months, Years, Lifetime
- **Program Types**: Individual or Group
- **Badge Colors**: 6 customizable colors
- **Benefits**:
  - Food Discount (%)
  - Beverage Discount (%)
  - WiFi Discount (%)
  - Custom benefits

### Admin Capabilities
- Create/Edit/Delete loyalty programs
- Assign memberships to individual customers
- Assign memberships to multiple customers (group)
- Cancel memberships
- View active member counts per program

### Customer Membership
- Customers can view their active memberships
- Membership includes:
  - Program name
  - Start/End dates (or "Lifetime")
  - List of benefits
  - Status (active/expired/cancelled)

### Sample Programs Created
1. **Gold Member** (Lifetime) - 15% food, 10% beverages, Free WiFi
2. **Silver Club** (1 month) - 5% food, 5% beverages

## API Endpoints

### Auth
- `POST /api/auth/register` - Customer registration only
- `POST /api/auth/login` - All users
- `GET /api/auth/me` - Get current user

### Admin - Users
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user with any role
- `PUT /api/admin/users/{id}/role` - Update user role
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/stats` - Dashboard statistics

### Admin - Loyalty Programs (NEW)
- `GET /api/admin/programs` - List all programs
- `POST /api/admin/programs` - Create program
- `GET /api/admin/programs/{id}` - Get program with members
- `PUT /api/admin/programs/{id}` - Update program
- `DELETE /api/admin/programs/{id}` - Delete program

### Admin - Memberships (NEW)
- `GET /api/admin/memberships` - List all memberships
- `POST /api/admin/memberships` - Assign membership(s)
- `DELETE /api/admin/memberships/{id}` - Cancel membership
- `GET /api/admin/customers/{id}/membership` - Get customer memberships

### Customer - Membership (NEW)
- `GET /api/my/membership` - View own memberships

### Products, Orders, Tables, Inventory
- (See previous documentation)

## Database Collections
- `users` - User accounts with roles
- `products` - Menu items with recipes
- `orders` - Customer orders
- `tables` - Table configurations with QR codes
- `ingredients` - Inventory items
- `cogs` - Cost of goods sold entries
- `transactions` - Payment records
- `loyalty_programs` - Loyalty program definitions (NEW)
- `customer_memberships` - Customer-program assignments (NEW)

## Credentials
- **Admin**: admin@kopikrasand.com / Admin123!

## Test Results
- **Backend**: 100% (24/24 loyalty program tests passed)
- **Frontend**: 95% functional (all core features working)

## Upcoming Features (Backlog)
1. GPS tracking for to-go orders
2. Recipe-based inventory auto-deduction
3. Table reservation system
4. Payment provider integration (Stripe)
5. Member rewards/points system
6. Discount application at checkout based on membership

## Branding
- Logo: Kopi Krasand
- Colors: Rich brown (#5A3A2A), Cream (#F5EEDC), Gold (#D9A54C), Green (#4A7A5E)
- Fonts: Playfair Display (headings), DM Sans (body)
