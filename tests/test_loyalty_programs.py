"""
Coffee Shop Management System - Loyalty Program Tests
Tests for loyalty programs CRUD, membership assignment, and customer membership view
"""
import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://barista-app-1.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Admin credentials
ADMIN_CREDS = {"email": "admin@kopikrasand.com", "password": "Admin123!"}

# Generate unique timestamp for test data
TIMESTAMP = datetime.now().strftime('%Y%m%d%H%M%S')


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{API_URL}/auth/login", json=ADMIN_CREDS)
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    """Admin authorization headers"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def test_customer():
    """Create a test customer for membership tests"""
    customer_data = {
        "email": f"TEST_loyalty_customer_{TIMESTAMP}@test.com",
        "password": "TestPass123!",
        "name": f"TEST Loyalty Customer {TIMESTAMP}",
        "is_member": False
    }
    response = requests.post(f"{API_URL}/auth/register", json=customer_data)
    assert response.status_code == 200, f"Customer registration failed: {response.text}"
    data = response.json()
    return {
        "id": data["user"]["id"],
        "email": data["user"]["email"],
        "name": data["user"]["name"],
        "token": data["access_token"]
    }


class TestAdminAuthentication:
    """Test admin authentication for loyalty program access"""
    
    def test_admin_login(self):
        """Admin can login successfully"""
        response = requests.post(f"{API_URL}/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        print(f"✅ Admin login successful: {data['user']['email']}")
    
    def test_non_admin_cannot_access_programs(self, test_customer):
        """Non-admin users cannot access loyalty programs"""
        headers = {"Authorization": f"Bearer {test_customer['token']}"}
        response = requests.get(f"{API_URL}/admin/programs", headers=headers)
        assert response.status_code == 403
        print("✅ Non-admin correctly denied access to programs")


class TestLoyaltyProgramCRUD:
    """Test CRUD operations for loyalty programs"""
    
    def test_get_existing_programs(self, admin_headers):
        """Get list of existing loyalty programs"""
        response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        assert response.status_code == 200
        programs = response.json()
        assert isinstance(programs, list)
        print(f"✅ Found {len(programs)} existing programs")
        for p in programs:
            print(f"   - {p['name']} ({p['duration_type']})")
    
    def test_create_program_with_days_duration(self, admin_headers):
        """Create a loyalty program with days duration"""
        program_data = {
            "name": f"TEST_Bronze_Plan_{TIMESTAMP}",
            "description": "Bronze tier membership with basic benefits",
            "duration_type": "days",
            "duration_value": 30,
            "is_group": False,
            "color": "#CD7F32",
            "benefits": [
                {"benefit_type": "food_discount", "value": 5, "description": "5% off food items"},
                {"benefit_type": "beverage_discount", "value": 5, "description": "5% off beverages"}
            ]
        }
        
        response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        assert response.status_code == 200, f"Create program failed: {response.text}"
        
        data = response.json()
        assert data["name"] == program_data["name"]
        assert data["duration_type"] == "days"
        assert data["duration_value"] == 30
        assert len(data["benefits"]) == 2
        assert "id" in data
        print(f"✅ Created program: {data['name']} (ID: {data['id']})")
        return data["id"]
    
    def test_create_program_with_months_duration(self, admin_headers):
        """Create a loyalty program with months duration"""
        program_data = {
            "name": f"TEST_Silver_Plan_{TIMESTAMP}",
            "description": "Silver tier membership with enhanced benefits",
            "duration_type": "months",
            "duration_value": 6,
            "is_group": False,
            "color": "#C0C0C0",
            "benefits": [
                {"benefit_type": "food_discount", "value": 10, "description": "10% off food items"},
                {"benefit_type": "wifi_discount", "value": 100, "description": "Free WiFi access"}
            ]
        }
        
        response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["duration_type"] == "months"
        assert data["duration_value"] == 6
        print(f"✅ Created program: {data['name']}")
    
    def test_create_program_with_years_duration(self, admin_headers):
        """Create a loyalty program with years duration"""
        program_data = {
            "name": f"TEST_Gold_Plan_{TIMESTAMP}",
            "description": "Gold tier membership with premium benefits",
            "duration_type": "years",
            "duration_value": 1,
            "is_group": False,
            "color": "#FFD700",
            "benefits": [
                {"benefit_type": "food_discount", "value": 15, "description": "15% off food items"},
                {"benefit_type": "beverage_discount", "value": 15, "description": "15% off beverages"},
                {"benefit_type": "custom", "value": 0, "description": "Priority seating"}
            ]
        }
        
        response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["duration_type"] == "years"
        print(f"✅ Created program: {data['name']}")
    
    def test_create_program_with_lifetime_duration(self, admin_headers):
        """Create a loyalty program with lifetime duration"""
        program_data = {
            "name": f"TEST_Platinum_Plan_{TIMESTAMP}",
            "description": "Lifetime platinum membership",
            "duration_type": "lifetime",
            "duration_value": None,
            "is_group": False,
            "color": "#E5E4E2",
            "benefits": [
                {"benefit_type": "food_discount", "value": 20, "description": "20% off all food"},
                {"benefit_type": "beverage_discount", "value": 20, "description": "20% off all beverages"},
                {"benefit_type": "wifi_discount", "value": 100, "description": "Free WiFi forever"},
                {"benefit_type": "custom", "value": 0, "description": "VIP lounge access"}
            ]
        }
        
        response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["duration_type"] == "lifetime"
        assert data["duration_value"] is None
        print(f"✅ Created lifetime program: {data['name']}")
    
    def test_create_group_program(self, admin_headers):
        """Create a group loyalty program"""
        program_data = {
            "name": f"TEST_Corporate_Plan_{TIMESTAMP}",
            "description": "Corporate group membership",
            "duration_type": "years",
            "duration_value": 1,
            "is_group": True,
            "color": "#3498DB",
            "benefits": [
                {"benefit_type": "food_discount", "value": 12, "description": "12% corporate discount"}
            ]
        }
        
        response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert data["is_group"] == True
        print(f"✅ Created group program: {data['name']}")
    
    def test_get_program_by_id(self, admin_headers):
        """Get a specific program by ID"""
        # First get all programs
        response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        programs = response.json()
        
        if programs:
            program_id = programs[0]["id"]
            response = requests.get(f"{API_URL}/admin/programs/{program_id}", headers=admin_headers)
            assert response.status_code == 200
            
            data = response.json()
            assert data["id"] == program_id
            assert "members" in data  # Should include members list
            print(f"✅ Retrieved program: {data['name']} with {len(data.get('members', []))} members")
        else:
            pytest.skip("No programs available")
    
    def test_update_program(self, admin_headers):
        """Update an existing loyalty program"""
        # First create a program to update
        create_data = {
            "name": f"TEST_Update_Plan_{TIMESTAMP}",
            "description": "Original description",
            "duration_type": "months",
            "duration_value": 3,
            "is_group": False,
            "color": "#FF5733",
            "benefits": [{"benefit_type": "food_discount", "value": 5, "description": "5% off"}]
        }
        
        create_response = requests.post(f"{API_URL}/admin/programs", json=create_data, headers=admin_headers)
        assert create_response.status_code == 200
        program_id = create_response.json()["id"]
        
        # Update the program
        update_data = {
            "name": f"TEST_Updated_Plan_{TIMESTAMP}",
            "description": "Updated description with more benefits",
            "duration_type": "months",
            "duration_value": 6,
            "is_group": False,
            "color": "#33FF57",
            "benefits": [
                {"benefit_type": "food_discount", "value": 10, "description": "10% off food"},
                {"benefit_type": "beverage_discount", "value": 10, "description": "10% off beverages"}
            ]
        }
        
        response = requests.put(f"{API_URL}/admin/programs/{program_id}", json=update_data, headers=admin_headers)
        assert response.status_code == 200
        
        # Verify update by fetching
        get_response = requests.get(f"{API_URL}/admin/programs/{program_id}", headers=admin_headers)
        assert get_response.status_code == 200
        
        updated = get_response.json()
        assert updated["name"] == update_data["name"]
        assert updated["duration_value"] == 6
        assert len(updated["benefits"]) == 2
        print(f"✅ Updated program: {updated['name']}")
    
    def test_delete_program(self, admin_headers):
        """Delete a loyalty program"""
        # First create a program to delete
        create_data = {
            "name": f"TEST_Delete_Plan_{TIMESTAMP}",
            "description": "To be deleted",
            "duration_type": "days",
            "duration_value": 7,
            "is_group": False,
            "color": "#FF0000",
            "benefits": [{"benefit_type": "food_discount", "value": 1, "description": "1% off"}]
        }
        
        create_response = requests.post(f"{API_URL}/admin/programs", json=create_data, headers=admin_headers)
        assert create_response.status_code == 200
        program_id = create_response.json()["id"]
        
        # Delete the program
        response = requests.delete(f"{API_URL}/admin/programs/{program_id}", headers=admin_headers)
        assert response.status_code == 200
        
        # Verify deletion
        get_response = requests.get(f"{API_URL}/admin/programs/{program_id}", headers=admin_headers)
        assert get_response.status_code == 404
        print(f"✅ Deleted program successfully")


class TestMembershipAssignment:
    """Test membership assignment to customers"""
    
    def test_assign_membership_to_single_customer(self, admin_headers, test_customer):
        """Assign membership to a single customer"""
        # First get or create a program
        programs_response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        programs = programs_response.json()
        
        # Find a test program or use existing
        test_programs = [p for p in programs if "TEST_" in p["name"]]
        if not test_programs:
            # Create one
            create_data = {
                "name": f"TEST_Membership_Plan_{TIMESTAMP}",
                "description": "For membership testing",
                "duration_type": "months",
                "duration_value": 1,
                "is_group": False,
                "color": "#9B59B6",
                "benefits": [{"benefit_type": "food_discount", "value": 10, "description": "10% off"}]
            }
            create_response = requests.post(f"{API_URL}/admin/programs", json=create_data, headers=admin_headers)
            program_id = create_response.json()["id"]
        else:
            program_id = test_programs[0]["id"]
        
        # Assign membership
        membership_data = {
            "program_id": program_id,
            "customer_ids": [test_customer["id"]]
        }
        
        response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "memberships" in data
        print(f"✅ Assigned membership to customer: {test_customer['email']}")
    
    def test_assign_membership_to_multiple_customers(self, admin_headers):
        """Assign membership to multiple customers at once"""
        # Create multiple test customers
        customers = []
        for i in range(2):
            customer_data = {
                "email": f"TEST_multi_customer_{TIMESTAMP}_{i}@test.com",
                "password": "TestPass123!",
                "name": f"TEST Multi Customer {i}",
                "is_member": False
            }
            response = requests.post(f"{API_URL}/auth/register", json=customer_data)
            if response.status_code == 200:
                customers.append(response.json()["user"]["id"])
        
        if len(customers) < 2:
            pytest.skip("Could not create enough test customers")
        
        # Create a group program
        program_data = {
            "name": f"TEST_Group_Assign_{TIMESTAMP}",
            "description": "For group assignment test",
            "duration_type": "months",
            "duration_value": 3,
            "is_group": True,
            "color": "#2ECC71",
            "benefits": [{"benefit_type": "food_discount", "value": 8, "description": "8% group discount"}]
        }
        
        create_response = requests.post(f"{API_URL}/admin/programs", json=program_data, headers=admin_headers)
        program_id = create_response.json()["id"]
        
        # Assign to multiple customers
        membership_data = {
            "program_id": program_id,
            "customer_ids": customers
        }
        
        response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["memberships"]) == 2
        print(f"✅ Assigned membership to {len(customers)} customers")
    
    def test_cannot_assign_duplicate_membership(self, admin_headers, test_customer):
        """Cannot assign same program to customer twice"""
        # Get existing memberships for customer
        programs_response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        programs = programs_response.json()
        
        if not programs:
            pytest.skip("No programs available")
        
        program_id = programs[0]["id"]
        
        # First assignment
        membership_data = {
            "program_id": program_id,
            "customer_ids": [test_customer["id"]]
        }
        
        requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        
        # Second assignment should skip (not error)
        response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        # Should have 0 new memberships created
        assert len(data["memberships"]) == 0
        print("✅ Duplicate membership correctly skipped")
    
    def test_get_all_memberships(self, admin_headers):
        """Get all active memberships"""
        response = requests.get(f"{API_URL}/admin/memberships", headers=admin_headers)
        assert response.status_code == 200
        
        memberships = response.json()
        assert isinstance(memberships, list)
        print(f"✅ Found {len(memberships)} memberships")
        
        # Verify membership structure
        if memberships:
            m = memberships[0]
            assert "customer_id" in m
            assert "program_id" in m
            assert "program_name" in m
            assert "status" in m
            assert "customer_name" in m or "customer_email" in m
    
    def test_get_memberships_with_status_filter(self, admin_headers):
        """Get memberships filtered by status"""
        response = requests.get(f"{API_URL}/admin/memberships?status=active", headers=admin_headers)
        assert response.status_code == 200
        
        memberships = response.json()
        for m in memberships:
            assert m["status"] == "active"
        print(f"✅ Filtered active memberships: {len(memberships)}")
    
    def test_cancel_membership(self, admin_headers):
        """Cancel a membership"""
        # First get memberships
        response = requests.get(f"{API_URL}/admin/memberships", headers=admin_headers)
        memberships = response.json()
        
        # Find a test membership to cancel
        test_memberships = [m for m in memberships if "TEST_" in m.get("customer_name", "") or "TEST_" in m.get("customer_email", "")]
        
        if test_memberships:
            membership_id = test_memberships[0]["id"]
            
            response = requests.delete(f"{API_URL}/admin/memberships/{membership_id}", headers=admin_headers)
            assert response.status_code == 200
            print(f"✅ Cancelled membership: {membership_id}")
        else:
            # Create and cancel a new one
            # Create customer
            customer_data = {
                "email": f"TEST_cancel_customer_{TIMESTAMP}@test.com",
                "password": "TestPass123!",
                "name": f"TEST Cancel Customer",
                "is_member": False
            }
            reg_response = requests.post(f"{API_URL}/auth/register", json=customer_data)
            customer_id = reg_response.json()["user"]["id"]
            
            # Get a program
            programs_response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
            programs = programs_response.json()
            
            if programs:
                # Assign membership
                membership_data = {
                    "program_id": programs[0]["id"],
                    "customer_ids": [customer_id]
                }
                assign_response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
                
                if assign_response.json()["memberships"]:
                    membership_id = assign_response.json()["memberships"][0]["id"]
                    
                    # Cancel it
                    response = requests.delete(f"{API_URL}/admin/memberships/{membership_id}", headers=admin_headers)
                    assert response.status_code == 200
                    print(f"✅ Cancelled membership: {membership_id}")


class TestCustomerMembershipView:
    """Test customer viewing their own membership"""
    
    def test_customer_can_view_own_membership(self, test_customer, admin_headers):
        """Customer can view their own active memberships"""
        # First ensure customer has a membership
        programs_response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        programs = programs_response.json()
        
        if programs:
            # Assign membership
            membership_data = {
                "program_id": programs[0]["id"],
                "customer_ids": [test_customer["id"]]
            }
            requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        
        # Customer views their membership
        customer_headers = {"Authorization": f"Bearer {test_customer['token']}"}
        response = requests.get(f"{API_URL}/my/membership", headers=customer_headers)
        assert response.status_code == 200
        
        memberships = response.json()
        assert isinstance(memberships, list)
        print(f"✅ Customer can view {len(memberships)} membership(s)")
        
        if memberships:
            m = memberships[0]
            assert "program_name" in m
            assert "benefits" in m
            assert "status" in m
    
    def test_customer_without_membership_gets_empty_list(self):
        """Customer without membership gets empty list"""
        # Create a new customer without membership
        customer_data = {
            "email": f"TEST_no_membership_{TIMESTAMP}@test.com",
            "password": "TestPass123!",
            "name": "TEST No Membership Customer",
            "is_member": False
        }
        
        response = requests.post(f"{API_URL}/auth/register", json=customer_data)
        token = response.json()["access_token"]
        
        # Check membership
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_URL}/my/membership", headers=headers)
        assert response.status_code == 200
        
        memberships = response.json()
        assert memberships == []
        print("✅ Customer without membership gets empty list")


class TestAdminStats:
    """Test admin stats include loyalty program data"""
    
    def test_admin_stats_include_membership_data(self, admin_headers):
        """Admin stats include membership and program counts"""
        response = requests.get(f"{API_URL}/admin/stats", headers=admin_headers)
        assert response.status_code == 200
        
        stats = response.json()
        assert "active_memberships" in stats
        assert "programs_count" in stats
        print(f"✅ Admin stats: {stats['programs_count']} programs, {stats['active_memberships']} active memberships")


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_assign_membership_invalid_program(self, admin_headers, test_customer):
        """Cannot assign membership to non-existent program"""
        membership_data = {
            "program_id": "non-existent-program-id",
            "customer_ids": [test_customer["id"]]
        }
        
        response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        assert response.status_code == 404
        print("✅ Invalid program correctly rejected")
    
    def test_assign_membership_invalid_customer(self, admin_headers):
        """Membership assignment skips non-existent customers"""
        # Get a valid program
        programs_response = requests.get(f"{API_URL}/admin/programs", headers=admin_headers)
        programs = programs_response.json()
        
        if not programs:
            pytest.skip("No programs available")
        
        membership_data = {
            "program_id": programs[0]["id"],
            "customer_ids": ["non-existent-customer-id"]
        }
        
        response = requests.post(f"{API_URL}/admin/memberships", json=membership_data, headers=admin_headers)
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["memberships"]) == 0  # Should skip invalid customer
        print("✅ Invalid customer correctly skipped")
    
    def test_delete_nonexistent_program(self, admin_headers):
        """Cannot delete non-existent program"""
        response = requests.delete(f"{API_URL}/admin/programs/non-existent-id", headers=admin_headers)
        assert response.status_code == 404
        print("✅ Non-existent program deletion correctly rejected")
    
    def test_cancel_nonexistent_membership(self, admin_headers):
        """Cannot cancel non-existent membership"""
        response = requests.delete(f"{API_URL}/admin/memberships/non-existent-id", headers=admin_headers)
        assert response.status_code == 404
        print("✅ Non-existent membership cancellation correctly rejected")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
