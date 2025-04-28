from django.urls import path
from . import views

app_name = 'suppliers'

urlpatterns = [
    path('', views.supplier_list, name='list'),
    path('<int:supplier_id>/', views.supplier_detail, name='detail'),
    path('create/', views.supplier_create, name='create'),
    path('<int:supplier_id>/edit/', views.supplier_edit, name='edit'),
    path('<int:supplier_id>/delete/', views.supplier_delete, name='delete'),
] 