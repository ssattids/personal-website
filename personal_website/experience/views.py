from django.shortcuts import render

# Create your views here.
from .models import Experience
from rest_framework import viewsets, permissions
from .serializers import ExperienceSerializer


class ExperienceView(viewsets.ModelViewSet):
  serializer_class = ExperienceSerializer

  def get_queryset(self):
    queryset = Experience.objects.all()
    return queryset