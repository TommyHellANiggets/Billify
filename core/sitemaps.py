from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from invoices.models import Invoice
from clients.models import Client
from datetime import timedelta


class StaticViewSitemap(Sitemap):
    """Карта сайта для статических страниц"""
    priority = 0.5
    changefreq = 'weekly'

    def items(self):
        return ['core:home', 'core:about', 'core:changelog', 'login', 'register']

    def location(self, item):
        return reverse(item)


class HomeSitemap(Sitemap):
    """Карта сайта для главной страницы с повышенным приоритетом"""
    priority = 1.0
    changefreq = 'daily'

    def items(self):
        return ['core:home']

    def location(self, item):
        return reverse(item)


class InvoiceSitemap(Sitemap):
    """Карта сайта для страниц счетов"""
    changefreq = 'daily'
    priority = 0.7

    def items(self):
        return ['invoices:list', 'invoices:create']

    def location(self, item):
        return reverse(item)

    def lastmod(self, obj):
        try:
            # Возвращаем дату последнего обновления счета
            latest_invoice = Invoice.objects.latest('updated_at')
            return latest_invoice.updated_at
        except:
            # Если счетов нет, возвращаем текущую дату
            return timezone.now()


class ClientSitemap(Sitemap):
    """Карта сайта для страниц клиентов"""
    changefreq = 'weekly'
    priority = 0.6

    def items(self):
        return ['clients:list']

    def location(self, item):
        return reverse(item)

    def lastmod(self, obj):
        try:
            latest_client = Client.objects.latest('updated_at')
            return latest_client.updated_at
        except:
            return timezone.now()


class AnalyticsSitemap(Sitemap):
    """Карта сайта для страниц аналитики"""
    changefreq = 'daily'
    priority = 0.7

    def items(self):
        return ['analytics:dashboard']

    def location(self, item):
        return reverse(item)

    def lastmod(self, obj):
        # Аналитика обновляется каждый день
        return timezone.now() 