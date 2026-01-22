"""
Coffee Shop Management System - Role-Based Access Control Tests
Tests for 5 user roles: customer, cashier, waiter, kitchen, storage
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://barista-app-1.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Generate unique timestamp for test users
TIMESTAMP = datetime.now().strftime('%Y%m%d%H%M%S')
TEST_PASSWORD = "TestPass123!"

# Test credentials for each role - using unique emails per test run
TEST_CREDENTIALS = {
    "customer": {"email": f"customer_{TIMESTAMP}@test.com", "password": TEST_PASSWORD},
    "cashier": {"email": f"cashier_{TIMESTAMP}@test.com", "password": TEST_PASSWORD},
    "waiter": {"email": f"waiter_{TIMESTAMP}@test.com", "password": TEST_PASSWORD},
    "kitchen": {"email": f"kitchen_{TIMESTAMP}@test.com", "password": TEST_PASSWORD},
    "storage": {"email": f"storage_{TIMESTAMP}@test.com", "password": TEST_PASSWORD},
}


@pytest.fixture(scope="module")
def registered_users():
    """Register all test users at module start"""
    tokens = {}
    users = {}
    session = requests.Session()
    
    for role, creds in TEST_CREDENTIALS.items():
        register_data = {
            "email": creds["email"],
            "password": creds["password"],
            "name": f"Test {role.title()}",
            "role": role
        }
        response = session.post(f"{API_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            data = response.json()
            tokens[role] = data["access_token"]
            users[role] = data["user"]
            print(f"✅ Registered {role}: {creds['email']}")
        else:
            print(f"❌ Failed to register {role}: {response.text}")
    
    return {"tokens": tokens, "users": users}


class TestUserRegistrationAndLogin:
    """Test user registration with 5 roles and login functionality"""
    
    def test_api_health(self):
        """Test API is accessible"""
        response = requests.get(f"{API_URL}/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ API Health: {data['message']}")
    
    @pytest.mark.parametrize("role", ["customer", "cashier", "waiter", "kitchen", "storage"])
    def test_register_user_with_role(self, role):
        """Test registration for all 5 roles"""
        timestamp = datetime.now().strftime('%H%M%S%f')
        user_data = {
            "email": f"test_{role}_{timestamp}@test.com",
            "password": TEST_PASSWORD,
            "name": f"Test {role.title()}",
            "role": role
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=user_data)
        assert response.status_code == 200, f"Registration failed for {role}: {response.text}"
        
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == role
        assert data["user"]["email"] == user_data["email"]
        print(f"✅ Registered {role} user successfully")
    
    def test_login_after_registration(self, registered_users):
        """Test login with registered users"""
        for role, creds in TEST_CREDENTIALS.items():
            response = requests.post(f"{API_URL}/auth/login", json=creds)
            assert response.status_code == 200, f"Login failed for {role}: {response.text}"
            
            data = response.json()
            assert "access_token" in data
            assert data["user"]["role"] == role
            print(f"✅ Login successful for {role}")
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{API_URL}/auth/login", json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✅ Invalid login correctly rejected")


class TestRoleBasedAccessControl:
    """Test role-based access control for different dashboards"""
    
    def test_storage_can_access_ingredients(self, registered_users):
        """Storage role should access ingredients"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        response = requests.get(f"{API_URL}/ingredients", headers=headers)
        assert response.status_code == 200
        print("✅ Storage can access ingredients")
    
    def test_storage_can_access_cogs(self, registered_users):
        """Storage role should access COGS"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        response = requests.get(f"{API_URL}/cogs", headers=headers)
        assert response.status_code == 200
        print("✅ Storage can access COGS")
    
    def test_kitchen_can_access_ingredients(self, registered_users):
        """Kitchen role should access ingredients"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['kitchen']}"}
        response = requests.get(f"{API_URL}/ingredients", headers=headers)
        assert response.status_code == 200
        print("✅ Kitchen can access ingredients")
    
    def test_kitchen_cannot_access_cogs(self, registered_users):
        """Kitchen role should NOT access COGS"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['kitchen']}"}
        response = requests.get(f"{API_URL}/cogs", headers=headers)
        assert response.status_code == 403
        print("✅ Kitchen correctly denied COGS access")
    
    def test_waiter_can_access_orders(self, registered_users):
        """Waiter role should access orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        response = requests.get(f"{API_URL}/orders", headers=headers)
        assert response.status_code == 200
        print("✅ Waiter can access orders")
    
    def test_waiter_can_access_tables(self, registered_users):
        """Waiter role should access tables"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        response = requests.get(f"{API_URL}/tables", headers=headers)
        assert response.status_code == 200
        print("✅ Waiter can access tables")
    
    def test_cashier_can_access_orders(self, registered_users):
        """Cashier role should access orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['cashier']}"}
        response = requests.get(f"{API_URL}/orders", headers=headers)
        assert response.status_code == 200
        print("✅ Cashier can access orders")
    
    def test_cashier_cannot_access_cogs(self, registered_users):
        """Cashier role should NOT access COGS"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['cashier']}"}
        response = requests.get(f"{API_URL}/cogs", headers=headers)
        assert response.status_code == 403
        print("✅ Cashier correctly denied COGS access")
    
    def test_customer_cannot_access_ingredients(self, registered_users):
        """Customer role should NOT access ingredients"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['customer']}"}
        response = requests.get(f"{API_URL}/ingredients", headers=headers)
        assert response.status_code == 403
        print("✅ Customer correctly denied ingredients access")


class TestStorageDashboardFeatures:
    """Test Storage Dashboard features: Ingredients, Products, COGS, Tables"""
    
    def test_add_ingredient(self, registered_users):
        """Storage can add ingredients"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        ingredient_data = {
            "name": f"TEST_Coffee_Beans_{datetime.now().strftime('%H%M%S')}",
            "unit": "grams",
            "current_stock": 1000,
            "min_stock": 100,
            "cost_per_unit": 0.05
        }
        
        response = requests.post(f"{API_URL}/ingredients", json=ingredient_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == ingredient_data["name"]
        assert "id" in data
        print(f"✅ Added ingredient: {data['name']}")
    
    def test_add_product(self, registered_users):
        """Storage can add products"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        product_data = {
            "name": f"TEST_Espresso_{datetime.now().strftime('%H%M%S')}",
            "description": "Rich espresso shot",
            "category": "beverage",
            "price": 3.50,
            "image_url": "",
            "recipes": [],
            "available": True
        }
        
        response = requests.post(f"{API_URL}/products", json=product_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == product_data["name"]
        print(f"✅ Added product: {data['name']}")
    
    def test_add_cogs(self, registered_users):
        """Storage can add COGS entries"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        cogs_data = {
            "name": f"TEST_Delivery_{datetime.now().strftime('%H%M%S')}",
            "description": "Delivery cost",
            "cost": 2.50,
            "category": "Delivery"
        }
        
        response = requests.post(f"{API_URL}/cogs", json=cogs_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == cogs_data["name"]
        print(f"✅ Added COGS: {data['name']}")
    
    def test_add_table(self, registered_users):
        """Storage can add tables with QR codes"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['storage']}"}
        table_data = {
            "table_number": int(datetime.now().strftime('%H%M%S')),
            "capacity": 4
        }
        
        response = requests.post(f"{API_URL}/tables", json=table_data, headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "qr_code" in data
        assert "qr_image" in data
        assert data["qr_image"].startswith("data:image/png;base64,")
        print(f"✅ Added table {data['table_number']} with QR code")


class TestWaiterDashboardFeatures:
    """Test Waiter Dashboard features: Orders and Tables tabs"""
    
    def test_waiter_view_orders(self, registered_users):
        """Waiter can view orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        response = requests.get(f"{API_URL}/orders", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✅ Waiter can view orders")
    
    def test_waiter_view_tables(self, registered_users):
        """Waiter can view tables"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        response = requests.get(f"{API_URL}/tables", headers=headers)
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✅ Waiter can view tables")
    
    def test_waiter_update_table_status(self, registered_users):
        """Waiter can update table status"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        
        # First get tables
        response = requests.get(f"{API_URL}/tables", headers=headers)
        tables = response.json()
        
        if tables:
            table_id = tables[0]["id"]
            # Update status
            response = requests.put(
                f"{API_URL}/tables/{table_id}/status",
                json={"status": "occupied"},
                headers=headers
            )
            assert response.status_code == 200
            print(f"✅ Waiter updated table status")
            
            # Reset status
            requests.put(
                f"{API_URL}/tables/{table_id}/status",
                json={"status": "available"},
                headers=headers
            )
        else:
            pytest.skip("No tables available to test")
    
    def test_waiter_can_create_table(self, registered_users):
        """Waiter can create tables"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['waiter']}"}
        table_data = {
            "table_number": int(datetime.now().strftime('%S%f')[:6]),
            "capacity": 2
        }
        
        response = requests.post(f"{API_URL}/tables", json=table_data, headers=headers)
        assert response.status_code == 200
        print("✅ Waiter can create tables")


class TestKitchenDashboardFeatures:
    """Test Kitchen Dashboard features"""
    
    def test_kitchen_view_orders(self, registered_users):
        """Kitchen can view orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['kitchen']}"}
        response = requests.get(f"{API_URL}/orders", headers=headers)
        assert response.status_code == 200
        print("✅ Kitchen can view orders")
    
    def test_kitchen_update_order_status(self, registered_users):
        """Kitchen can update order status"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['kitchen']}"}
        
        # Get orders
        response = requests.get(f"{API_URL}/orders", headers=headers)
        orders = response.json()
        
        pending_orders = [o for o in orders if o["status"] == "pending"]
        if pending_orders:
            order_id = pending_orders[0]["id"]
            response = requests.put(
                f"{API_URL}/orders/{order_id}/status",
                json={"status": "preparing"},
                headers=headers
            )
            assert response.status_code == 200
            print("✅ Kitchen can update order status")
        else:
            print("⚠️ No pending orders to test status update")


class TestCashierPOSFeatures:
    """Test Cashier/POS Dashboard features"""
    
    def test_cashier_view_orders(self, registered_users):
        """Cashier can view all orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['cashier']}"}
        response = requests.get(f"{API_URL}/orders", headers=headers)
        assert response.status_code == 200
        print("✅ Cashier can view orders")
    
    def test_cashier_view_transactions(self, registered_users):
        """Cashier can view transactions"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['cashier']}"}
        response = requests.get(f"{API_URL}/transactions", headers=headers)
        assert response.status_code == 200
        print("✅ Cashier can view transactions")
    
    def test_cashier_process_payment(self, registered_users):
        """Cashier can process payments for ready orders"""
        headers = {"Authorization": f"Bearer {registered_users['tokens']['cashier']}"}
        
        # Get orders
        response = requests.get(f"{API_URL}/orders", headers=headers)
        orders = response.json()
        
        ready_unpaid = [o for o in orders if o["status"] == "ready" and o["payment_status"] == "unpaid"]
        if ready_unpaid:
            order_id = ready_unpaid[0]["id"]
            response = requests.put(
                f"{API_URL}/orders/{order_id}/payment",
                json={"payment_method": "cash"},
                headers=headers
            )
            assert response.status_code == 200
            print("✅ Cashier processed payment")
        else:
            print("⚠️ No ready unpaid orders to test payment")


class TestCustomerAppFeatures:
    """Test Customer App features (public access)"""
    
    def test_public_products_access(self):
        """Products endpoint is publicly accessible"""
        response = requests.get(f"{API_URL}/products")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        print("✅ Products publicly accessible")
    
    def test_public_order_creation(self):
        """Orders can be created without authentication"""
        # First get a product
        products_response = requests.get(f"{API_URL}/products")
        products = products_response.json()
        
        if products:
            product = products[0]
            order_data = {
                "customer_name": "Test Guest",
                "customer_email": "guest@test.com",
                "order_type": "to-go",
                "items": [{
                    "product_id": product["id"],
                    "product_name": product["name"],
                    "quantity": 1,
                    "price": product["price"]
                }],
                "total_amount": product["price"]
            }
            
            response = requests.post(f"{API_URL}/orders", json=order_data)
            assert response.status_code == 200
            assert "order_number" in response.json()
            print(f"✅ Guest order created: {response.json()['order_number']}")
        else:
            pytest.skip("No products available")
    
    def test_table_qr_verification(self):
        """Table QR verification is publicly accessible"""
        # This should return 404 for invalid QR, not 401/403
        response = requests.get(f"{API_URL}/tables/verify/invalid-qr-code")
        assert response.status_code == 404
        print("✅ QR verification endpoint accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
