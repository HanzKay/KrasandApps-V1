# Kopi Krasand - Coffee Shop Management System

## Original Problem Statement
Build an interconnected system of applications for a coffee shop with:
1. **Menu Order App** (Customer) - Reserve tables, order for dine-in/delivery/to-go, payment options
2. **Order Request App** (Kitchen) - Receive orders, update progress
3. **POS Dashboard** (Cashier) - Process payments, generate receipts
4. **Inventory Management App** (Storage) - Track ingredients, COGS data

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
| Admin | `/admin` | Full - user management, loyalty programs |

## Security Model
- **Customers**: Self-register at `/login` with optional membership
- **Staff (all roles)**: Created ONLY by Admin via Admin Dashboard
- **Role-based access control** enforced on all protected routes

## Implemented Features

### Customer App (`/`)
- [x] Browse menu (beverages & food)
- [x] Add to cart with quantity controls
- [x] Place orders (dine-in, delivery, to-go)
- [x] Customer registration with membership option
- [x] View own membership benefits
- [x] **Automatic discount at checkout** (NEW)
- [x] **Discount preview in cart** (NEW)
- [x] **Gold Member badge in header** (NEW)

### Automatic Discount Feature (NEW)
When a customer with active membership places an order:
1. System checks customer's active membership
2. Gets discount benefits (food %, beverage %)
3. Calculates discounts based on item categories
4. Applies discount to order total automatically
5. Shows breakdown: subtotal, discounts, final amount

**Example:**
- Gold Member with 15% food, 10% beverage discount
- Order: 3x Espresso ($3.50 each = $10.50 beverages)
- Discount: 10% off beverages = -$1.05
- Final: $9.45

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
- [x] **Loyalty Programs** with full CRUD
- [x] **Membership Management** - assign/cancel
- [x] Programs: Days, Months, Years, Lifetime durations

## Loyalty Program Feature

### Program Configuration
- **Duration Types**: Days, Months, Years, Lifetime
- **Program Types**: Individual or Group
- **Benefits**: Food %, Beverage %, WiFi %, Custom

### Sample Programs
1. **Gold Member** (Lifetime) - 15% food, 10% beverages, Free WiFi
2. **Silver Club** (1 month) - 5% food, 5% beverages

## API Endpoints

### Auth
- `POST /api/auth/register` - Customer registration only
- `POST /api/auth/login` - All users

### Orders (with automatic discount)
- `POST /api/orders` - Create order with auto-discount
- `POST /api/orders/preview-discount` - Preview discount before checkout
- `GET /api/orders` - List orders (includes discount_info)

### Admin - Loyalty Programs
- `GET, POST, PUT, DELETE /api/admin/programs`
- `POST /api/admin/memberships` - Assign membership
- `DELETE /api/admin/memberships/{id}` - Cancel membership

### Customer
- `GET /api/my/membership` - View own memberships

## Database Collections
- `users`, `products`, `orders`, `tables`
- `ingredients`, `cogs`, `transactions`
- `loyalty_programs`, `customer_memberships`

## Test Results
- **Backend**: 14/14 discount tests passed (100%)
- **Frontend**: All discount UI features working

## Credentials
- **Admin**: admin@kopikrasand.com / Admin123!
- **Test Member**: newcustomer@test.com / Test123! (Gold Member)

## Upcoming Features (Backlog)
1. GPS tracking for to-go orders
2. Table reservation system
3. Payment provider integration (Stripe)
4. Member points/rewards accumulation
5. Receipt includes discount breakdown

## Branding
- Logo: Kopi Krasand
- Colors: Brown (#5A3A2A), Cream (#F5EEDC), Gold (#D9A54C), Green (#4A7A5E)
