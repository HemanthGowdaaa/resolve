from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from apps.authentication.views import RegisterView, LoginView, GoogleAuthView, LogoutView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth_register"),
    path("login/", LoginView.as_view(), name="auth_login"),
    path("google/", GoogleAuthView.as_view(), name="auth_google"),
    path("logout/", LogoutView.as_view(), name="auth_logout"),
    path("refresh/", TokenRefreshView.as_view(), name="auth_token_refresh"),
]
