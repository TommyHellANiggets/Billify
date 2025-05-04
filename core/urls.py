from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.home, name='home'),
    path('dashboard/', views.home_inside, name='home_inside'),
    path('about/', views.about, name='about'),
    path('changelog/', views.changelog, name='changelog'),
    path('profile/', views.profile, name='profile'),
    path('verify-email/<int:user_id>/<str:token>/', views.verify_email, name='verify_email'),
    path('api/change-language/', views.change_language_ajax, name='change_language_ajax'),
    path('api/change-currency/', views.change_currency_ajax, name='change_currency_ajax'),
    path('api/send-verification-email/', views.send_verification_email_ajax, name='send_verification_email_ajax'),
    path('logout/', views.custom_logout, name='logout'),
] 