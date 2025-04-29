from django.urls import path
from . import views

app_name = 'invoices'

urlpatterns = [
    path('', views.invoice_list, name='list'),
    path('create/', views.invoice_create, name='create'),
    path('create/incoming/', views.create_incoming, name='create_incoming'),
    path('create/outgoing/', views.create_outgoing, name='create_outgoing'),
    path('<int:pk>/', views.invoice_detail, name='detail'),
    path('<int:pk>/pdf/', views.invoice_pdf, name='pdf'),
    path('<int:pk>/mark-paid/', views.mark_invoice_paid, name='mark_paid'),
    path('<int:pk>/delete/', views.delete_invoice, name='delete'),
    path('<int:pk>/duplicate/', views.duplicate_invoice, name='duplicate'),
]