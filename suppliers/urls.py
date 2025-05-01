from django.urls import path
from . import views

app_name = 'suppliers'

urlpatterns = [
    path('', views.supplier_list, name='list'),
    path('create/', views.supplier_create, name='create'),
    path('api/get/<int:supplier_id>/', views.supplier_api_get, name='api_get'),
    path('<int:supplier_id>/edit/', views.supplier_edit, name='edit'),
    path('<int:supplier_id>/delete/', views.supplier_delete, name='delete'),
    path('<int:supplier_id>/', views.supplier_detail, name='detail'),
] 