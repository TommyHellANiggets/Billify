"""
URL configuration for billify project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.contrib.auth import views as auth_views
from core import views as core_views
from django.contrib.sitemaps.views import sitemap
from core.sitemaps import (
    StaticViewSitemap, 
    HomeSitemap, 
    InvoiceSitemap, 
    ClientSitemap, 
    AnalyticsSitemap
)
from django.views.generic import RedirectView
from django.views.generic.base import TemplateView
from core.views import yandex_turbo_feed
from django.conf.urls.i18n import i18n_patterns  # Импорт i18n_patterns
from django.http import HttpResponseRedirect
from django.utils.translation import get_language, activate
from django.middleware.locale import LocaleMiddleware

# Определение карт сайта
sitemaps = {
    'static': StaticViewSitemap,
    'home': HomeSitemap,
    'invoices': InvoiceSitemap,
    'clients': ClientSitemap,
    'analytics': AnalyticsSitemap,
}

# URL маршруты, которые не требуют префикса языка
urlpatterns = [
    path('i18n/', include('django.conf.urls.i18n')),  # URL для переключения языков
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', include('robots.urls')),
    path('yandex_verification.html', TemplateView.as_view(template_name='yandex_verification.html'), name='yandex_verification'),
    path('yandex_turbo_rss.xml', yandex_turbo_feed, name='yandex_turbo_feed'),
    path('api/', include('api.urls', namespace='api_root')),  # API-маршруты без префикса языка
    # Прямые маршруты для русского языка (язык по умолчанию)
    path('dashboard/', core_views.home_inside, name='dashboard'),  # Добавляем прямой доступ к странице dashboard
]

# URL маршруты с префиксом языка
urlpatterns += i18n_patterns(
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
    path('invoices/', include('invoices.urls')),
    path('clients/', include('clients.urls')),
    path('analytics/', include('analytics.urls')),
    path('suppliers/', include('suppliers.urls')),
    path('api/', include('api.urls', namespace='api_lang')),  # API-маршруты с префиксом языка
    
    # URL для аутентификации
    path('login/', auth_views.LoginView.as_view(template_name='accounts/auth.html'), name='login'),
    path('register/', core_views.register, name='register'),
    
    # URL для сброса пароля
    path('password-reset/', 
         auth_views.PasswordResetView.as_view(
             template_name='accounts/password_reset.html',
             email_template_name='email/password_reset_email.html',
             subject_template_name='email/password_reset_subject.txt'
         ),
         name='password_reset'),
    path('password-reset/done/', 
         auth_views.PasswordResetDoneView.as_view(template_name='accounts/password_reset_done.html'),
         name='password_reset_done'),
    path('password-reset-confirm/<uidb64>/<token>/', 
         auth_views.PasswordResetConfirmView.as_view(template_name='accounts/password_reset_confirm.html'),
         name='password_reset_confirm'),
    path('password-reset-complete/', 
         auth_views.PasswordResetCompleteView.as_view(template_name='accounts/password_reset_complete.html'),
         name='password_reset_complete'),
    
    # URL для страницы условий использования
    path('terms/', core_views.terms, name='terms'),
    
    prefix_default_language=True,  # Добавлять префикс для всех языков, включая язык по умолчанию (ru)
)

# Добавление маршрутов для статических и медиа файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
