import requests
import sys
import json
from datetime import datetime

class CoffeeShopAPITester:
    def __init__(self, base_url="https://barista-app-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different roles
        self.users = {}   # Store user data for different roles
        self.test_data = {}  # Store created test data
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, role=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if role and role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[role]}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration_and_login(self):
        """Test user registration and login for all roles"""
        print("\n" + "="*50)
        print("TESTING USER AUTHENTICATION")
        print("="*50)
        
        roles = ['customer', 'kitchen', 'cashier', 'inventory_manager']
        timestamp = datetime.now().strftime('%H%M%S')
        
        for role in roles:
            # Register user
            user_data = {
                "email": f"test_{role}_{timestamp}@test.com",
                "password": "TestPass123!",
                "name": f"Test {role.title()}",
                "role": role
            }
            
            success, response = self.run_test(
                f"Register {role}",
                "POST",
                "auth/register",
                200,
                data=user_data
            )
            
            if success and 'access_token' in response:
                self.tokens[role] = response['access_token']
                self.users[role] = response['user']
                print(f"   ✅ {role} registered and logged in")
            else:
                print(f"   ❌ {role} registration failed")
                return False
                
            # Test login
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            
            success, response = self.run_test(
                f"Login {role}",
                "POST",
                "auth/login",
                200,
                data=login_data
            )
            
            if success and 'access_token' in response:
                print(f"   ✅ {role} login successful")
            else:
                print(f"   ❌ {role} login failed")
        
        return True

    def test_ingredients_management(self):
        """Test ingredients CRUD operations"""
        print("\n" + "="*50)
        print("TESTING INGREDIENTS MANAGEMENT")
        print("="*50)
        
        # Test unauthorized access (customer trying to add ingredient)
        ingredient_data = {
            "name": "Coffee Beans",
            "unit": "grams",
            "current_stock": 1000,
            "min_stock": 100,
            "cost_per_unit": 0.05
        }
        
        success, response = self.run_test(
            "Add ingredient (unauthorized - customer)",
            "POST",
            "ingredients",
            403,
            data=ingredient_data,
            role="customer"
        )
        
        # Test authorized access (inventory_manager)
        success, response = self.run_test(
            "Add ingredient (authorized - inventory_manager)",
            "POST",
            "ingredients",
            200,
            data=ingredient_data,
            role="inventory_manager"
        )
        
        if success:
            self.test_data['ingredient_id'] = response.get('id')
        
        # Test get ingredients
        success, response = self.run_test(
            "Get ingredients (inventory_manager)",
            "GET",
            "ingredients",
            200,
            role="inventory_manager"
        )
        
        # Test kitchen staff access
        success, response = self.run_test(
            "Get ingredients (kitchen staff)",
            "GET",
            "ingredients",
            200,
            role="kitchen"
        )
        
        return True

    def test_products_management(self):
        """Test products CRUD operations"""
        print("\n" + "="*50)
        print("TESTING PRODUCTS MANAGEMENT")
        print("="*50)
        
        # Add product
        product_data = {
            "name": "Espresso",
            "description": "Rich and bold espresso shot",
            "category": "beverage",
            "price": 3.50,
            "image_url": "https://images.pexels.com/photos/302893/pexels-photo-302893.jpeg",
            "recipes": [],
            "available": True
        }
        
        success, response = self.run_test(
            "Add product (inventory_manager)",
            "POST",
            "products",
            200,
            data=product_data,
            role="inventory_manager"
        )
        
        if success:
            self.test_data['product_id'] = response.get('id')
        
        # Get all products (public endpoint)
        success, response = self.run_test(
            "Get all products",
            "GET",
            "products",
            200
        )
        
        # Get products by category
        success, response = self.run_test(
            "Get beverage products",
            "GET",
            "products?category=beverage",
            200
        )
        
        # Get specific product
        if 'product_id' in self.test_data:
            success, response = self.run_test(
                "Get specific product",
                "GET",
                f"products/{self.test_data['product_id']}",
                200
            )
        
        return True

    def test_tables_management(self):
        """Test tables and QR code management"""
        print("\n" + "="*50)
        print("TESTING TABLES MANAGEMENT")
        print("="*50)
        
        # Add table
        table_data = {
            "table_number": 1,
            "capacity": 4
        }
        
        success, response = self.run_test(
            "Add table with QR code",
            "POST",
            "tables",
            200,
            data=table_data,
            role="inventory_manager"
        )
        
        if success:
            self.test_data['table_id'] = response.get('id')
            self.test_data['qr_code'] = response.get('qr_code')
            print(f"   ✅ QR Code generated: {response.get('qr_code')}")
        
        # Get all tables
        success, response = self.run_test(
            "Get all tables",
            "GET",
            "tables",
            200,
            role="inventory_manager"
        )
        
        # Verify QR code
        if 'qr_code' in self.test_data:
            success, response = self.run_test(
                "Verify table QR code",
                "GET",
                f"tables/verify/{self.test_data['qr_code']}",
                200
            )
        
        return True

    def test_orders_lifecycle(self):
        """Test complete order lifecycle"""
        print("\n" + "="*50)
        print("TESTING ORDER LIFECYCLE")
        print("="*50)
        
        if 'product_id' not in self.test_data:
            print("❌ Cannot test orders - no product available")
            return False
        
        # Create order
        order_data = {
            "customer_id": self.users.get('customer', {}).get('id'),
            "customer_name": "Test Customer",
            "customer_email": "test_customer@test.com",
            "order_type": "dine-in",
            "table_id": self.test_data.get('table_id'),
            "table_number": 1,
            "items": [
                {
                    "product_id": self.test_data['product_id'],
                    "product_name": "Espresso",
                    "quantity": 2,
                    "price": 3.50
                }
            ],
            "total_amount": 7.00,
            "notes": "Extra hot please"
        }
        
        success, response = self.run_test(
            "Create order",
            "POST",
            "orders",
            200,
            data=order_data
        )
        
        if success:
            self.test_data['order_id'] = response.get('id')
            print(f"   ✅ Order created: {response.get('order_number')}")
        
        # Get orders (kitchen view)
        success, response = self.run_test(
            "Get orders (kitchen)",
            "GET",
            "orders",
            200,
            role="kitchen"
        )
        
        # Update order status (kitchen)
        if 'order_id' in self.test_data:
            success, response = self.run_test(
                "Update order to preparing",
                "PUT",
                f"orders/{self.test_data['order_id']}/status",
                200,
                data={"status": "preparing"},
                role="kitchen"
            )
            
            success, response = self.run_test(
                "Update order to ready",
                "PUT",
                f"orders/{self.test_data['order_id']}/status",
                200,
                data={"status": "ready"},
                role="kitchen"
            )
        
        # Get orders (POS view)
        success, response = self.run_test(
            "Get orders (POS)",
            "GET",
            "orders",
            200,
            role="cashier"
        )
        
        # Process payment
        if 'order_id' in self.test_data:
            success, response = self.run_test(
                "Process payment",
                "PUT",
                f"orders/{self.test_data['order_id']}/payment",
                200,
                data={"payment_method": "cash"},
                role="cashier"
            )
        
        # Get customer orders
        success, response = self.run_test(
            "Get customer orders",
            "GET",
            "orders",
            200,
            role="customer"
        )
        
        return True

    def test_cogs_management(self):
        """Test COGS management"""
        print("\n" + "="*50)
        print("TESTING COGS MANAGEMENT")
        print("="*50)
        
        # Add COGS entry
        cogs_data = {
            "name": "Delivery Cost",
            "description": "Cost for delivery service",
            "cost": 2.50,
            "category": "Delivery"
        }
        
        success, response = self.run_test(
            "Add COGS entry",
            "POST",
            "cogs",
            200,
            data=cogs_data,
            role="inventory_manager"
        )
        
        # Get COGS entries
        success, response = self.run_test(
            "Get COGS entries",
            "GET",
            "cogs",
            200,
            role="inventory_manager"
        )
        
        return True

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n" + "="*50)
        print("TESTING ROLE-BASED ACCESS CONTROL")
        print("="*50)
        
        # Test customer accessing kitchen endpoints
        success, response = self.run_test(
            "Customer accessing ingredients (should fail)",
            "GET",
            "ingredients",
            403,
            role="customer"
        )
        
        # Test kitchen staff accessing COGS (should fail)
        success, response = self.run_test(
            "Kitchen staff accessing COGS (should fail)",
            "GET",
            "cogs",
            403,
            role="kitchen"
        )
        
        # Test cashier processing payment (should work)
        if 'order_id' in self.test_data:
            success, response = self.run_test(
                "Cashier accessing orders (should work)",
                "GET",
                "orders",
                200,
                role="cashier"
            )
        
        return True

def main():
    print("🚀 Starting Coffee Shop Management System API Tests")
    print("="*60)
    
    tester = CoffeeShopAPITester()
    
    # Run all tests
    try:
        tester.test_user_registration_and_login()
        tester.test_ingredients_management()
        tester.test_products_management()
        tester.test_tables_management()
        tester.test_orders_lifecycle()
        tester.test_cogs_management()
        tester.test_role_based_access()
        
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {str(e)}")
        return 1
    
    # Print final results
    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())