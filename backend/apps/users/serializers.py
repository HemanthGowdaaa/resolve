from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "profile_picture",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]
