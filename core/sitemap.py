from django.contrib.sitemaps import Sitemap
from django.urls import reverse


class StaticViewSitemap(Sitemap):
    priority = 0.5
    changefreq = 'weekly'

    def items(self):
        return ['core:home', 'core:about', 'core:changelog', 'core:terms', 
                'login', 'register', 'analytics:dashboard', 'invoices:list', 'clients:list']

    def location(self, item):
        return reverse(item)


class HomeSitemap(Sitemap):
    priority = 1.0
    changefreq = 'daily'

    def items(self):
        return ['core:home']

    def location(self, item):
        return reverse(item) 