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
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: Literal["customer", "kitchen", "cashier", "inventory_manager"] = "customer"

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
    total_amount: float
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
async def register(user_data: UserRegister):
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
    if current_user.role not in ["inventory_manager", "cashier"]:
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
    if current_user.role not in ["inventory_manager", "cashier"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    product_dict = product.model_dump()
    product_dict["created_at"] = product_dict["created_at"].isoformat()
    await db.products.update_one({"id": product_id}, {"$set": product_dict})
    return product

# Tables Routes
@api_router.post("/tables", response_model=Table)
async def create_table(table: TableCreate, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["inventory_manager", "cashier"]:
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
    await db.tables.update_one({"id": table_id}, {"$set": {"status": status["status"]}})
    return {"message": "Table status updated"}

# Orders Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order: OrderCreate):
    order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
    order_obj = Order(
        order_number=order_number,
        customer_id=order.customer_id,
        customer_name=order.customer_name,
        customer_email=order.customer_email,
        order_type=order.order_type,
        table_id=order.table_id,
        table_number=order.table_number,
        items=order.items,
        total_amount=order.total_amount,
        customer_location=order.customer_location,
        notes=order.notes
    )
    order_dict = order_obj.model_dump()
    order_dict["created_at"] = order_dict["created_at"].isoformat()
    order_dict["updated_at"] = order_dict["updated_at"].isoformat()
    
    await db.orders.insert_one(order_dict)
    
    # Update ingredient stock
    for item in order_obj.items:
        product = await db.products.find_one({"id": item.product_id})
        if product and "recipes" in product:
            for recipe in product["recipes"]:
                await db.ingredients.update_one(
                    {"id": recipe["ingredient_id"]},
                    {"$inc": {"current_stock": -recipe["quantity"] * item.quantity}}
                )
    
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
    if current_user.role not in ["inventory_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ingredient_dict = ingredient.model_dump()
    ingredient_dict["created_at"] = ingredient_dict["created_at"].isoformat()
    await db.ingredients.insert_one(ingredient_dict)
    return ingredient

@api_router.get("/ingredients", response_model=List[Ingredient])
async def get_ingredients(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["inventory_manager", "kitchen"]:
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
    if current_user.role not in ["inventory_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    ingredient_dict = ingredient.model_dump()
    ingredient_dict["created_at"] = ingredient_dict["created_at"].isoformat()
    await db.ingredients.update_one({"id": ingredient_id}, {"$set": ingredient_dict})
    return ingredient

# COGS Routes
@api_router.post("/cogs", response_model=COGS)
async def create_cogs(cogs: COGS, current_user: User = Depends(get_current_user)):
    if current_user.role not in ["inventory_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cogs_dict = cogs.model_dump()
    await db.cogs.insert_one(cogs_dict)
    return cogs

@api_router.get("/cogs", response_model=List[COGS])
async def get_cogs(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["inventory_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    cogs_list = await db.cogs.find({}, {"_id": 0}).to_list(1000)
    return cogs_list

# Transactions Routes
@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(current_user: User = Depends(get_current_user)):
    if current_user.role not in ["cashier", "inventory_manager"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    transactions = await db.transactions.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for t in transactions:
        if isinstance(t["created_at"], str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
    return transactions

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