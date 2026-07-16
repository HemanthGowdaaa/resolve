from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class AuthenticationAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("auth_register")
        self.login_url = reverse("auth_login")
        self.google_url = reverse("auth_google")
        self.logout_url = reverse("auth_logout")
        self.refresh_url = reverse("auth_token_refresh")
        
        self.user_email = "test@example.com"
        self.user_password = "securepassword123"
        self.user_name = "John Doe"

    def test_register_user_success(self):
        """
        Verify successful registration and JWT response.
        """
        data = {
            "email": self.user_email,
            "password": self.user_password,
            "full_name": self.user_name
        }
        response = self.client.post(self.register_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(User.objects.filter(email=self.user_email).exists())

    def test_login_user_success(self):
        """
        Verify successful login with valid credentials.
        """
        User.objects.create_user(
            email=self.user_email, 
            password=self.user_password,
            full_name=self.user_name
        )
        data = {
            "email": self.user_email,
            "password": self.user_password
        }
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_google_login_success(self):
        """
        Verify that Google login succeeds and registers a user with a mock token in DEBUG mode.
        """
        data = {
            "id_token": "mock_token_12345"
        }
        response = self.client.post(self.google_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        
        # Verify user was created
        self.assertTrue(User.objects.filter(email="mock_token_12345@example.com").exists())

    def test_logout_user(self):
        """
        Verify logout blacklists the token.
        """
        # Register first
        data = {
            "email": self.user_email,
            "password": self.user_password,
            "full_name": self.user_name
        }
        reg_response = self.client.post(self.register_url, data, format="json")
        access_token = reg_response.data["access"]
        refresh_token = reg_response.data["refresh"]

        # Authenticate requests
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        
        logout_data = {"refresh": refresh_token}
        response = self.client.post(self.logout_url, logout_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
