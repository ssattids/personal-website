from django.urls import path, include
from .views import ExperienceView
from rest_framework import routers

router = routers.DefaultRouter()
router.register("api/experience", ExperienceView, basename="experience")

urlpatterns = [
  path('', include(router.urls))
]