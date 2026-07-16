from datetime import date
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from apps.reflections.models import Reflection
from apps.reflections.services import ReflectionsService

User = get_user_model()


class ReflectionsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@example.com", password="password123")
        self.client.force_authenticate(user=self.user)
        
        self.service = ReflectionsService()
        
        self.today_url = reverse("reflection_today")
        self.create_url = reverse("reflection_create")

    def test_create_and_retrieve_today_reflection(self):
        """
        Verify creating and getting today's reflection.
        """
        # Create reflection
        ref = self.service.create_reflection(
            user=self.user, 
            reflection_text="Today was a great day of programming.",
            reflection_date=date.today()
        )
        self.assertEqual(ref.reflection_text, "Today was a great day of programming.")
        self.assertEqual(ref.version, 1)

        # Retrieve reflection
        response = self.client.get(self.today_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["reflection_text"], "Today was a great day of programming.")

    def test_prevent_duplicate_reflection_on_same_day(self):
        """
        Verify service raises validation error if reflection is created for same date twice.
        """
        self.service.create_reflection(user=self.user, reflection_text="First reflection", reflection_date=date.today())
        
        with self.assertRaises(ValidationError):
            self.service.create_reflection(user=self.user, reflection_text="Second reflection", reflection_date=date.today())

    def test_update_and_delete_reflection(self):
        """
        Verify updating and soft-deleting reflections.
        """
        ref = self.service.create_reflection(user=self.user, reflection_text="Initial text")
        
        # Update
        updated_ref = self.service.update_reflection(user=self.user, reflection_id=ref.id, reflection_text="Updated text")
        self.assertEqual(updated_ref.reflection_text, "Updated text")
        self.assertEqual(updated_ref.version, 2)
        
        # Delete (soft)
        deleted_ref = self.service.delete_reflection(user=self.user, reflection_id=ref.id)
        self.assertTrue(deleted_ref.is_deleted)
        self.assertEqual(deleted_ref.version, 3)

        # Verify today returns 404 since it's deleted
        response = self.client.get(self.today_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
