from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Object-level permission to only allow owners of an object to access or edit it.
    Assumes the model instance has a `user` field.
    """
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
