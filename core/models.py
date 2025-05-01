from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class CompanyProfile(models.Model):
    COMPANY_TYPE_CHOICES = (
        ('individual', 'Индивидуальный предприниматель'),
        ('business', 'Юридическое лицо'),
    )
    
    LANGUAGE_CHOICES = (
        ('ru', 'Русский'),
        ('en', 'English'),
        ('de', 'Deutsch'),
    )
    
    CURRENCY_CHOICES = (
        ('RUB', 'Российский рубль (₽)'),
        ('USD', 'Доллар США ($)'),
        ('EUR', 'Евро (€)'),
        ('GBP', 'Фунт стерлингов (£)'),
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='company_profile', verbose_name='Пользователь')
    company_type = models.CharField('Тип компании', max_length=20, choices=COMPANY_TYPE_CHOICES, default='individual')
    company_name = models.CharField('Название компании / ФИО ИП', max_length=200, blank=True)
    legal_address = models.TextField('Юридический адрес', blank=True)
    postal_address = models.TextField('Почтовый адрес', blank=True)
    inn = models.CharField('ИНН', max_length=12, blank=True, help_text='10 цифр для юр. лиц, 12 цифр для ИП')
    kpp = models.CharField('КПП', max_length=9, blank=True, help_text='Только для юр. лиц')
    ogrn = models.CharField('ОГРН / ОГРНИП', max_length=15, blank=True)
    okpo = models.CharField('ОКПО', max_length=10, blank=True)
    bank_name = models.CharField('Название банка', max_length=200, blank=True)
    bank_account = models.CharField('Расчетный счет', max_length=20, blank=True)
    bank_corr_account = models.CharField('Корреспондентский счет', max_length=20, blank=True)
    bank_bik = models.CharField('БИК', max_length=9, blank=True)
    phone = models.CharField('Телефон компании', max_length=20, blank=True)
    email = models.EmailField('Email компании', blank=True)
    website = models.URLField('Сайт компании', blank=True)
    logo = models.ImageField('Логотип компании', upload_to='company_logos/', blank=True, null=True)
    stamp = models.ImageField('Печать', upload_to='company_stamps/', blank=True, null=True)
    signature = models.ImageField('Подпись', upload_to='company_signatures/', blank=True, null=True)
    preferred_language = models.CharField('Предпочтительный язык', max_length=5, choices=LANGUAGE_CHOICES, default='ru')
    preferred_currency = models.CharField('Предпочтительная валюта', max_length=5, choices=CURRENCY_CHOICES, default='RUB')
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Профиль компании'
        verbose_name_plural = 'Профили компаний'
    
    def __str__(self):
        return f"{self.company_name} ({self.user.username})"


class PricingPlan(models.Model):
    PLAN_TYPE_CHOICES = (
        ('basic', 'Базовый'),
        ('premium', 'Продвинутый'),
    )
    
    SUBSCRIPTION_PERIOD_CHOICES = (
        ('week', 'Неделя'),
        ('month', 'Месяц'),
        ('quarter', '3 месяца'),
        ('half_year', '6 месяцев'),
        ('year', 'Год'),
    )
    
    name = models.CharField('Название тарифа', max_length=100)
    plan_type = models.CharField('Тип тарифа', max_length=20, choices=PLAN_TYPE_CHOICES, default='basic')
    price = models.DecimalField('Цена', decimal_places=2, max_digits=10, default=0)
    subscription_period = models.CharField('Период подписки', max_length=20, choices=SUBSCRIPTION_PERIOD_CHOICES, default='month')
    is_popular = models.BooleanField('Популярный тариф', default=False)
    is_active = models.BooleanField('Активен', default=True)
    order = models.PositiveSmallIntegerField('Порядок', default=0)
    
    # Ограничения для базового плана
    max_clients = models.PositiveIntegerField('Максимальное количество клиентов', default=5,
                                               help_text='0 означает неограниченное количество')
    max_disk_space = models.PositiveIntegerField('Максимальное место на диске (МБ)', default=50)
    
    # Функции и возможности
    feature_unlimited_documents = models.BooleanField('Неограниченное количество документов', default=True)
    feature_watermark_pdf = models.BooleanField('Водяной знак на PDF/XML', default=True, 
                                               help_text='True - с водяным знаком, False - без водяного знака')
    feature_notifications = models.BooleanField('Система уведомлений', default=False)
    feature_ocr = models.BooleanField('Сканирование документов (OCR)', default=False)
    feature_advanced_analytics = models.BooleanField('Продвинутая аналитика', default=False)
    feature_support = models.BooleanField('Поддержка', default=False)
    
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Тарифный план'
        verbose_name_plural = 'Тарифные планы'
        ordering = ['order', 'price']
    
    def __str__(self):
        return f"{self.name} ({self.get_plan_type_display()}) - {self.price} руб. за {self.get_subscription_period_display()}"
    
    @property
    def is_basic(self):
        return self.plan_type == 'basic'
    
    @property
    def is_premium(self):
        return self.plan_type == 'premium'
        
    def get_features_list(self):
        """Возвращает список функций в виде словаря для отображения на фронтенде"""
        features = {
            'max_clients': self.max_clients if self.max_clients > 0 else 'Без ограничений',
            'max_disk_space': f"{self.max_disk_space} МБ" if self.max_disk_space < 1000 else f"{self.max_disk_space/1000} ГБ",
            'unlimited_documents': self.feature_unlimited_documents,
            'watermark_pdf': not self.feature_watermark_pdf,  # Инвертируем для правильного отображения (True = без водяного знака)
            'notifications': self.feature_notifications,
            'ocr': self.feature_ocr,
            'advanced_analytics': self.feature_advanced_analytics,
            'support': self.feature_support
        }
        return features
