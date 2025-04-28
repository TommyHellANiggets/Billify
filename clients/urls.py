from django.urls import path
from . import views

app_name = 'clients'

urlpatterns = [
    path('', views.client_list, name='list'),
    path('<int:client_id>/', views.client_detail, name='detail'),
    path('create/', views.client_create, name='create'),
    path('<int:client_id>/edit/', views.client_edit, name='edit'),
    path('<int:client_id>/delete/', views.client_delete, name='delete'),
] 