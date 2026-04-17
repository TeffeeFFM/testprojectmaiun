from django.urls import path
from .views import MeView, LoginView, RegisterView, LogoutView, ProfileView, UserSolutionsView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("login/", LoginView.as_view(), name="login"),
    path("register/", RegisterView.as_view(), name="register"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("solutions/", UserSolutionsView.as_view(), name="solutions"),
]
