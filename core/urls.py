from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.home_inside, name='home_inside'),
    path('about/', views.about, name='about'),
    path('changelog/', views.changelog, name='changelog'),
    path('profile/', views.profile, name='profile'),
] 