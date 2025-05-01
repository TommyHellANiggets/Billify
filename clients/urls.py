from django.urls import path
from . import views

app_name = 'clients'

urlpatterns = [
    path('', views.client_list, name='list'),
    path('create/', views.client_create, name='create'),
    path('api/get/<str:client_id>/', views.client_api_get, name='api_get'),
    path('<str:client_id>/edit/', views.client_edit, name='edit'),
    path('<str:client_id>/delete/', views.client_delete, name='delete'),
    path('<str:client_id>/', views.client_detail, name='detail'),
] 