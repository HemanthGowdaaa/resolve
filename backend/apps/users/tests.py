from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user_with_email_successful(self):
        """
        Verify that a user is successfully created with a normalized email.
        """
        email = "Test.User@example.com"
        user = User.objects.create_user(email=email, password="securepassword123")
        self.assertEqual(user.email, "test.user@example.com")
        self.assertTrue(user.check_password("securepassword123"))
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_without_email_raises_error(self):
        """
        Verify that creating a user without email raises ValueError.
        """
        with self.assertRaises(ValueError):
            User.objects.create_user(email="", password="securepassword123")

    def test_create_superuser(self):
        """
        Verify that a superuser is created with proper flags.
        """
        user = User.objects.create_superuser(email="admin@example.com", password="adminpassword")
        self.assertEqual(user.email, "admin@example.com")
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
