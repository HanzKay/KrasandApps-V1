from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import UpdateOne
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import qrcode
from io import BytesIO
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Coffee Shop Management API")
    yield
    # Shutdown
    client.close()
    logger.info("Database connection closed")

app = FastAPI(lifespan=lifespan)
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.getenv("SECRET_KEY", os.urandom(32).hex())
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 10080

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Pydantic Models
# Pydantic Models for Registration
class CustomerRegister(BaseModel):
    """Public registration - customers only"""
    email: EmailStr
    password: str
    name: str
    is_member: bool = False  # Option to join as member

class UserRegister(BaseModel):
    """Admin-only user creation - all roles"""
    email: EmailStr
    password: str
    name: str
    role: Literal["customer", "kitchen", "cashier", "waiter", "storage", "admin"] = "customer"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Loyalty Program Models
class Benefit(BaseModel):
    benefit_type: Literal["food_discount", "beverage_discount", "wifi_discount", "custom"]
    value: float = 0  # Percentage for discounts (e.g., 10 = 10%)
    description: str = ""

class LoyaltyProgramCreate(BaseModel):
    name: str
    description: str
    duration_type: Literal["days", "months", "years", "lifetime"]
    duration_value: Optional[int] = None  # Null for lifetime
    benefits: List[Benefit]
    is_group: bool = False  # True for group programs, False for individual
    color: str = "#D9A54C"  # Badge color for display

class LoyaltyProgram(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    duration_type: Literal["days", "months", "years", "lifetime"]
    duration_value: Optional[int] = None
    benefits: List[Benefit]
    is_group: bool = False
    color: str = "#D9A54C"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CustomerMembershipCreate(BaseModel):
    program_id: str
    customer_ids: List[str]  # Support multiple customers for group assignment

class CustomerMembership(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    program_id: str
    program_name: str
    start_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_date: Optional[datetime] = None  # Null for lifetime
    status: Literal["active", "expired", "cancelled"] = "active"
    benefits: List[Benefit] = []

class Ingredient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    unit: str
    current_stock: float
    min_stock: float
    cost_per_unit: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Recipe(BaseModel):
    ingredient_id: str
    quantity: float

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    category: Literal["beverage", "food"]
    price: float
    image_url: Optional[str] = None
    recipes: List[Recipe] = []
    available: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TableCreate(BaseModel):
    table_number: int
    capacity: int

class Table(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    table_number: int
    qr_code: str
    qr_image: Optional[str] = None
    capacity: int
    status: Literal["available", "occupied", "reserved"] = "available"

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float
    category: Optional[Literal["beverage", "food"]] = None  # For discount calculation

class OrderCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_type: Literal["dine-in", "delivery", "to-go"]
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    items: List[OrderItem]
    total_amount: float
    customer_location: Optional[dict] = None
    notes: Optional[str] = None

class DiscountInfo(BaseModel):
    """Discount breakdown for an order"""
    membership_id: Optional[str] = None
    program_name: Optional[str] = None
    food_discount_percent: float = 0
    beverage_discount_percent: float = 0
    food_discount_amount: float = 0
    beverage_discount_amount: float = 0
    total_discount: float = 0

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    order_type: Literal["dine-in", "delivery", "to-go"]
    table_id: Optional[str] = None
    table_number: Optional[int] = None
    items: List[OrderItem]
    subtotal: float = 0  # Original total before discount
    discount_info: Optional[DiscountInfo] = None  # Discount breakdown
    total_amount: float  # Final amount after discount
    status: Literal["pending", "preparing", "ready", "completed", "cancelled"] = "pending"
    payment_status: Literal["unpaid", "paid"] = "unpaid"
    payment_method: Optional[Literal["cash", "online", "qr"]] = None
    customer_location: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str
    amount: float
    payment_method: str
    receipt_data: dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class COGS(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    cost: float
    category: str

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"email": email}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_qr_code(data: str):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

# Auth Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: CustomerRegister):
    """Public registration - Customers only"""
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role="customer"  # Always customer for public registration
    )
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["is_member"] = user_data.is_member  # Store membership status
    
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.email})
    return Token(access_token=access_token, token_type="bearer", user=user)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        created_at=datetime.fromisoformat(user["created_at"]) if isinstance(user["created_at"], str) else user["created_at"]
    )
    
    access_token = create_access_token(data={"sub": user_obj.email})
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Products Routes
@api_router.post("/products", response_model=Product)
async def create_product(product: Product, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    await db.products.insert_one(product_dict)
    return product

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None):
    query = {"available": True}
    if category:
        query["category"] = category
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for p in products:
        if isinstance(p["created_at"], str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if isinstance(product["created_at"], str):
        product["created_at"] = datetime.fromisoformat(product["created_at"])
    return Product(**product)

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: Product, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    await db.products.update_one({"id": product_id}, {"$set": product_dict})
    return product

# Tables Routes
@api_router.post("/tables", response_model=Table)
async def create_table(table: TableCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage", "cashier", "waiter"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    qr_data = f"table-{table.table_number}-{str(uuid.uuid4())[:8]}"
    qr_image = generate_qr_code(qr_data)
    
    table_obj = Table(
        table_number=table.table_number,
        capacity=table.capacity,
        qr_code=qr_data,
        qr_image=qr_image
    )
    
    table_dict = table_obj.model_dump()
    await db.tables.insert_one(table_dict)
    return table_obj

@api_router.get("/tables", response_model=List[Table])
async def get_tables(current_user: User = Depends(get_current_user)):
    tables = await db.tables.find({}, {"_id": 0}).to_list(1000)
    return tables

@api_router.get("/tables/verify/{qr_code}", response_model=Table)
async def verify_table_qr(qr_code: str):
    table = await db.tables.find_one({"qr_code": qr_code}, {"_id": 0})
    if not table:
        raise HTTPException(status_code=404, detail="Invalid QR code")
    return Table(**table)

@api_router.put("/tables/{table_id}/status")
async def update_table_status(table_id: str, status: dict, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["waiter", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.tables.update_one({"id": table_id}, {"$set": {"status": status["status"]}})
    return {"message": "Table status updated"}

# Orders Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    
    # Calculate subtotal and get product categories
    subtotal = 0
    food_total = 0
    beverage_total = 0
    items_with_category = []
    
    # Get all products to determine categories
    product_ids = [item.product_id for item in order.items]
    products = await db.products.find({"id": {"$in": product_ids}}).to_list(None)
    product_map = {p["id"]: p for p in products}
    
    for item in order.items:
        product = product_map.get(item.product_id)
        item_total = item.price * item.quantity
        subtotal += item_total
        
        category = product.get("category", "food") if product else "food"
        if category == "food":
            food_total += item_total
        else:
            beverage_total += item_total
        
        items_with_category.append(OrderItem(
            product_id=item.product_id,
            product_name=item.product_name,
            quantity=item.quantity,
            price=item.price,
            category=category
        ))
    
    # Check for customer membership and calculate discounts
    discount_info = None
    total_discount = 0
    food_discount_amount = 0
    beverage_discount_amount = 0
    
    if order.customer_id:
        # Find active membership for this customer
        membership = await db.customer_memberships.find_one({
            "customer_id": order.customer_id,
            "status": "active"
        })
        
        if membership:
            # Check if membership has expired
            end_date = membership.get("end_date")
            if end_date:
                if isinstance(end_date, str):
                    end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                if end_date < datetime.now(timezone.utc):
                    # Membership expired, update status
                    await db.customer_memberships.update_one(
                        {"id": membership["id"]},
                        {"$set": {"status": "expired"}}
                    )
                    membership = None
        
        if membership:
            benefits = membership.get("benefits", [])
            food_discount_percent = 0
            beverage_discount_percent = 0
            
            for benefit in benefits:
                benefit_type = benefit.get("benefit_type")
                value = benefit.get("value", 0)
                
                if benefit_type == "food_discount":
                    food_discount_percent = max(food_discount_percent, value)
                elif benefit_type == "beverage_discount":
                    beverage_discount_percent = max(beverage_discount_percent, value)
            
            # Calculate discount amounts
            food_discount_amount = round(food_total * (food_discount_percent / 100), 2)
            beverage_discount_amount = round(beverage_total * (beverage_discount_percent / 100), 2)
            total_discount = food_discount_amount + beverage_discount_amount
            
            if total_discount > 0:
                discount_info = DiscountInfo(
                    membership_id=membership["id"],
                    program_name=membership.get("program_name", "Member"),
                    food_discount_percent=food_discount_percent,
                    beverage_discount_percent=beverage_discount_percent,
                    food_discount_amount=food_discount_amount,
                    beverage_discount_amount=beverage_discount_amount,
                    total_discount=total_discount
                )
    
    final_amount = round(subtotal - total_discount, 2)
    
    order_obj = Order(
        order_number=order_number,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        order_type=order.order_type,
        table_id=order.table_id,
        table_number=order.table_number,
        items=items_with_category,
        subtotal=subtotal,
        discount_info=discount_info,
        total_amount=final_amount,
        customer_location=order.customer_location,
        notes=order.notes
    )
    
    order_dict = order_obj.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    if order_dict.get("discount_info"):
        order_dict["discount_info"] = order_dict["discount_info"]
    
    await db.orders.insert_one(order_dict)
    
    # Update ingredient stock - Batch optimized
    bulk_ops = []
    for item in order_obj.items:
        product = product_map.get(item.product_id)
        if product and "recipes" in product:
            for recipe in product["recipes"]:
                bulk_ops.append(
                    UpdateOne(
                        {"id": recipe["ingredient_id"]},
                        {"$inc": {"current_stock": -recipe["quantity"] * item.quantity}}
                    )
                )
    
    if bulk_ops:
        await db.ingredients.bulk_write(bulk_ops)
    
    return order_obj

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    order_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    query = {}
    if status:
        query["status"] = status
    if order_type:
        query["order_type"] = order_type
    
    # Filter by customer for customer role
    if current_user.role == "customer":
        query["customer_id"] = current_user.id
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for o in orders:
        if isinstance(o["created_at"], str):
            o["created_at"] = datetime.fromisoformat(o["created_at"])
        if isinstance(o["updated_at"], str):
            o["updated_at"] = datetime.fromisoformat(o["updated_at"])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if isinstance(order["created_at"], str):
        order["created_at"] = datetime.fromisoformat(order["created_at"])
    if isinstance(order["updated_at"], str):
        order["updated_at"] = datetime.fromisoformat(order["updated_at"])
    return Order(**order)

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_user)
):
    update_data = {
        "status": status_data["status"],
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    return {"message": "Order status updated"}

@api_router.put("/orders/{order_id}/location")
async def update_order_location(order_id: str, location: dict):
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"customer_location": location, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Location updated"}

@api_router.put("/orders/{order_id}/payment")
async def process_payment(
    order_id: str,
    payment_data: dict,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    update_data = {
        "payment_status": "paid",
        "payment_method": payment_data["payment_method"],
        "status": "completed",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.orders.update_one({"id": order_id}, {"$set": update_data})
    
    # Create transaction
    transaction = Transaction(
        order_id=order_id,
        amount=order["total_amount"],
        payment_method=payment_data["payment_method"],
        receipt_data={
            "order_number": order["order_number"],
            "items": order["items"],
            "total": order["total_amount"],
            "payment_method": payment_data["payment_method"],
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )
    transaction_dict = transaction.model_dump()
    transaction_dict["created_at"] = transaction_dict["created_at"].isoformat()
    await db.transactions.insert_one(transaction_dict)
    
    return {"message": "Payment processed", "transaction": transaction}

# Ingredients Routes
@api_router.post("/ingredients", response_model=Ingredient)
async def create_ingredient(ingredient: Ingredient, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ingredient_dict = ingredient.model_dump()
    ingredient_dict["created_at"] = ingredient_dict["created_at"].isoformat()
    await db.ingredients.insert_one(ingredient_dict)
    return ingredient

@api_router.get("/ingredients", response_model=List[Ingredient])
async def get_ingredients(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage", "kitchen"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ingredients = await db.ingredients.find({}, {"_id": 0}).to_list(1000)
    for i in ingredients:
        if isinstance(i["created_at"], str):
            i["created_at"] = datetime.fromisoformat(i["created_at"])
    return ingredients

@api_router.put("/ingredients/{ingredient_id}", response_model=Ingredient)
async def update_ingredient(
    ingredient_id: str,
    ingredient: Ingredient,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["storage"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ingredient_dict = ingredient.model_dump()
    ingredient_dict["created_at"] = ingredient_dict["created_at"].isoformat()
    await db.ingredients.update_one({"id": ingredient_id}, {"$set": ingredient_dict})
    return ingredient

# COGS Routes
@api_router.post("/cogs", response_model=COGS)
async def create_cogs(cogs: COGS, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cogs_dict = cogs.model_dump()
    await db.cogs.insert_one(cogs_dict)
    return cogs

@api_router.get("/cogs", response_model=List[COGS])
async def get_cogs(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["storage"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cogs_list = await db.cogs.find({}, {"_id": 0}).to_list(1000)
    return cogs_list

# Transactions Routes
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["cashier", "storage"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for t in transactions:
        if isinstance(t["created_at"], str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
    return transactions

# Admin Routes - User Management
@api_router.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_user)):
    """Get all users - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({}, {"_id": 0, "password": 0}).to_list(1000)
    for u in users:
        if isinstance(u.get("created_at"), str):
            u["created_at"] = datetime.fromisoformat(u["created_at"])
    return users

@api_router.post("/admin/users")
async def create_user_by_admin(user_data: UserRegister, current_user: User = Depends(get_current_user)):
    """Create a new user - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    return {"message": "User created successfully", "user": user}

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role_data: dict, current_user: User = Depends(get_current_user)):
    """Update user role - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    new_role = role_data.get("role")
    if new_role not in ["customer", "kitchen", "cashier", "waiter", "storage", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({"id": user_id}, {"$set": {"role": new_role}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User role updated successfully"}

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    """Delete a user - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    """Get dashboard statistics - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users_count = await db.users.count_documents({})
    orders_count = await db.orders.count_documents({})
    products_count = await db.products.count_documents({})
    tables_count = await db.tables.count_documents({})
    
    # Get orders by status
    pending_orders = await db.orders.count_documents({"status": "pending"})
    completed_orders = await db.orders.count_documents({"status": "completed"})
    
    # Get revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Get membership stats
    active_memberships = await db.customer_memberships.count_documents({"status": "active"})
    programs_count = await db.loyalty_programs.count_documents({})
    
    return {
        "users_count": users_count,
        "orders_count": orders_count,
        "products_count": products_count,
        "tables_count": tables_count,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_revenue": total_revenue,
        "active_memberships": active_memberships,
        "programs_count": programs_count
    }

# Loyalty Program Routes
@api_router.post("/admin/programs", response_model=LoyaltyProgram)
async def create_loyalty_program(program_data: LoyaltyProgramCreate, current_user: User = Depends(get_current_user)):
    """Create a loyalty program - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    program = LoyaltyProgram(
        name=program_data.name,
        description=program_data.description,
        duration_type=program_data.duration_type,
        duration_value=program_data.duration_value,
        benefits=program_data.benefits,
        is_group=program_data.is_group,
        color=program_data.color
    )
    
    program_dict = program.model_dump()
    program_dict["created_at"] = program_dict["created_at"].isoformat()
    # Convert benefits to dict for MongoDB
    program_dict["benefits"] = [b.model_dump() if hasattr(b, 'model_dump') else b for b in program_dict["benefits"]]
    
    await db.loyalty_programs.insert_one(program_dict)
    return program

@api_router.get("/admin/programs")
async def get_loyalty_programs(current_user: User = Depends(get_current_user)):
    """Get all loyalty programs - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    programs = await db.loyalty_programs.find({}, {"_id": 0}).to_list(1000)
    for p in programs:
        if isinstance(p.get("created_at"), str):
            p["created_at"] = datetime.fromisoformat(p["created_at"])
        # Count active members
        p["active_members"] = await db.customer_memberships.count_documents({
            "program_id": p["id"], 
            "status": "active"
        })
    return programs

@api_router.get("/admin/programs/{program_id}")
async def get_loyalty_program(program_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific loyalty program - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    program = await db.loyalty_programs.find_one({"id": program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Get members of this program
    members = await db.customer_memberships.find(
        {"program_id": program_id, "status": "active"}, 
        {"_id": 0}
    ).to_list(1000)
    
    # Enrich with customer info
    for m in members:
        customer = await db.users.find_one({"id": m["customer_id"]}, {"_id": 0, "password": 0})
        if customer:
            m["customer_name"] = customer.get("name")
            m["customer_email"] = customer.get("email")
    
    program["members"] = members
    return program

@api_router.put("/admin/programs/{program_id}")
async def update_loyalty_program(program_id: str, program_data: LoyaltyProgramCreate, current_user: User = Depends(get_current_user)):
    """Update a loyalty program - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = program_data.model_dump()
    update_data["benefits"] = [b.model_dump() if hasattr(b, 'model_dump') else b for b in update_data["benefits"]]
    
    result = await db.loyalty_programs.update_one(
        {"id": program_id}, 
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Update benefits for active memberships
    await db.customer_memberships.update_many(
        {"program_id": program_id, "status": "active"},
        {"$set": {"benefits": update_data["benefits"], "program_name": update_data["name"]}}
    )
    
    return {"message": "Program updated successfully"}

@api_router.delete("/admin/programs/{program_id}")
async def delete_loyalty_program(program_id: str, current_user: User = Depends(get_current_user)):
    """Delete a loyalty program - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Cancel all memberships first
    await db.customer_memberships.update_many(
        {"program_id": program_id},
        {"$set": {"status": "cancelled"}}
    )
    
    result = await db.loyalty_programs.delete_one({"id": program_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Program not found")
    
    return {"message": "Program deleted and memberships cancelled"}

# Customer Membership Routes
@api_router.post("/admin/memberships")
async def assign_membership(membership_data: CustomerMembershipCreate, current_user: User = Depends(get_current_user)):
    """Assign membership to customer(s) - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get program
    program = await db.loyalty_programs.find_one({"id": membership_data.program_id}, {"_id": 0})
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    
    # Calculate end date
    start_date = datetime.now(timezone.utc)
    end_date = None
    
    if program["duration_type"] != "lifetime" and program.get("duration_value"):
        if program["duration_type"] == "days":
            end_date = start_date + timedelta(days=program["duration_value"])
        elif program["duration_type"] == "months":
            end_date = start_date + timedelta(days=program["duration_value"] * 30)
        elif program["duration_type"] == "years":
            end_date = start_date + timedelta(days=program["duration_value"] * 365)
    
    created_memberships = []
    
    for customer_id in membership_data.customer_ids:
        # Check if customer exists
        customer = await db.users.find_one({"id": customer_id})
        if not customer:
            continue
        
        # Check for existing active membership in same program
        existing = await db.customer_memberships.find_one({
            "customer_id": customer_id,
            "program_id": membership_data.program_id,
            "status": "active"
        })
        
        if existing:
            continue  # Skip if already has this membership
        
        membership = CustomerMembership(
            customer_id=customer_id,
            program_id=membership_data.program_id,
            program_name=program["name"],
            start_date=start_date,
            end_date=end_date,
            benefits=program.get("benefits", [])
        )
        
        membership_dict = membership.model_dump()
        membership_dict["start_date"] = membership_dict["start_date"].isoformat()
        if membership_dict["end_date"]:
            membership_dict["end_date"] = membership_dict["end_date"].isoformat()
        membership_dict["benefits"] = [b if isinstance(b, dict) else b.model_dump() for b in membership_dict["benefits"]]
        
        await db.customer_memberships.insert_one(membership_dict)
        created_memberships.append(membership)
    
    return {"message": f"Membership assigned to {len(created_memberships)} customer(s)", "memberships": created_memberships}

@api_router.get("/admin/memberships")
async def get_all_memberships(status: Optional[str] = None, current_user: User = Depends(get_current_user)):
    """Get all memberships - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    query = {}
    if status:
        query["status"] = status
    
    memberships = await db.customer_memberships.find(query, {"_id": 0}).to_list(1000)
    
    # Enrich with customer info
    for m in memberships:
        customer = await db.users.find_one({"id": m["customer_id"]}, {"_id": 0, "password": 0})
        if customer:
            m["customer_name"] = customer.get("name")
            m["customer_email"] = customer.get("email")
    
    return memberships

@api_router.get("/admin/customers/{customer_id}/membership")
async def get_customer_membership(customer_id: str, current_user: User = Depends(get_current_user)):
    """Get customer's active memberships - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    memberships = await db.customer_memberships.find(
        {"customer_id": customer_id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    return memberships

@api_router.delete("/admin/memberships/{membership_id}")
async def cancel_membership(membership_id: str, current_user: User = Depends(get_current_user)):
    """Cancel a membership - Admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.customer_memberships.update_one(
        {"id": membership_id},
        {"$set": {"status": "cancelled"}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Membership not found")
    
    return {"message": "Membership cancelled"}

# Customer can view their own membership
@api_router.get("/my/membership")
async def get_my_membership(current_user: User = Depends(get_current_user)):
    """Get current user's active memberships"""
    memberships = await db.customer_memberships.find(
        {"customer_id": current_user.id, "status": "active"},
        {"_id": 0}
    ).to_list(100)
    
    return memberships

@api_router.get("/")
async def root():
    return {"message": "Coffee Shop Management API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)