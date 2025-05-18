from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('change-language/', views.change_language, name='change_language'),
    path('change-currency/', views.change_currency, name='change_currency'),
] 