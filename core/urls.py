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
    path('terms/', views.terms, name='terms'),
    path('privacy/', views.privacy, name='privacy'),
    path('legal/', views.legal, name='legal'),
    path('pricing/', views.pricing, name='pricing'),
    path('help/', views.help_view, name='help'),
    path('guide/', views.user_guide, name='guide'),
    path('contact/', views.contact_us, name='contact'),
    
    # URL-маршруты для хранилища файлов
    path('storage/', views.storage_home, name='storage_home'),
    path('storage/folders/', views.storage_home, name='storage_folders'),
    path('storage/folder/<int:folder_id>/', views.storage_folder_detail, name='storage_folder_detail'),
    path('storage/favorites/', views.storage_favorites, name='storage_favorites'),
    
    # API для работы с хранилищем
    path('storage/api/create-folder/', views.create_folder, name='storage_create_folder'),
    path('storage/api/upload-file/', views.upload_file, name='storage_upload_file'),
    path('storage/api/delete-file/<int:file_id>/', views.delete_file, name='storage_delete_file'),
    path('storage/api/delete-folder/<int:folder_id>/', views.delete_folder, name='storage_delete_folder'),
    path('storage/api/rename-file/<int:file_id>/', views.rename_file, name='storage_rename_file'),
    path('storage/api/rename-folder/<int:folder_id>/', views.rename_folder, name='storage_rename_folder'),
    path('storage/api/favorite/<int:file_id>/', views.toggle_favorite, name='storage_toggle_favorite'),
    path('storage/api/move-file/<int:file_id>/', views.move_file, name='storage_move_file'),
    path('storage/api/move-folder/<int:folder_id>/', views.move_folder, name='storage_move_folder'),
] 