from django.db import models

# Create your models here.
class Experience(models.Model):
  company = models.CharField(max_length=200)
  position = models.CharField(max_length=200)
  start_date = models.DateField()
  end_date = models.DateField()
  order = models.IntegerField()
  bullet_text = models.CharField(max_length=2000)