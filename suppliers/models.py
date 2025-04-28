from django.db import models
from django.urls import reverse

class Supplier(models.Model):
    TYPE_CHOICES = (
        ('individual', 'Физическое лицо (ИП)'),
        ('business', 'Юридическое лицо'),
    )
    
    type = models.CharField('Тип поставщика', max_length=20, choices=TYPE_CHOICES, default='business')
    name = models.CharField('Название организации / ФИО ИП', max_length=200)
    email = models.EmailField('Email', blank=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)
    address = models.TextField('Юридический адрес', blank=True)
    postal_address = models.TextField('Почтовый адрес', blank=True)
    
    # Обязательные реквизиты для РФ
    inn = models.CharField('ИНН', max_length=12, blank=True, help_text='10 цифр для юр. лиц, 12 цифр для ИП и физ. лиц')
    kpp = models.CharField('КПП', max_length=9, blank=True, help_text='Только для юр. лиц')
    ogrn = models.CharField('ОГРН / ОГРНИП', max_length=15, blank=True)
    okpo = models.CharField('ОКПО', max_length=10, blank=True)
    
    # Банковские реквизиты
    bank_name = models.CharField('Название банка', max_length=200, blank=True)
    bank_account = models.CharField('Расчетный счет', max_length=20, blank=True)
    bank_corr_account = models.CharField('Корреспондентский счет', max_length=20, blank=True)
    bank_bik = models.CharField('БИК', max_length=9, blank=True)
    
    # Контактная информация
    contact_person = models.CharField('Контактное лицо', max_length=200, blank=True)
    contact_position = models.CharField('Должность контактного лица', max_length=200, blank=True)
    contact_phone = models.CharField('Телефон контактного лица', max_length=20, blank=True)
    contact_email = models.EmailField('Email контактного лица', blank=True)
    
    # Условия сотрудничества
    payment_terms = models.TextField('Условия оплаты', blank=True)
    delivery_terms = models.TextField('Условия доставки', blank=True)
    
    comment = models.TextField('Комментарий', blank=True)
    is_active = models.BooleanField('Активный', default=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Поставщик'
        verbose_name_plural = 'Поставщики'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('suppliers:detail', args=[str(self.id)])
    
    def get_edit_url(self):
        return reverse('suppliers:edit', args=[str(self.id)])
    
    def get_delete_url(self):
        return reverse('suppliers:delete', args=[str(self.id)])
    
    def get_full_name(self):
        """Полное наименование с указанием типа поставщика"""
        type_display = dict(self.TYPE_CHOICES).get(self.type, '')
        return f"{self.name} ({type_display})"
    
    def get_full_address(self):
        """Полный адрес поставщика"""
        if self.postal_address and self.postal_address != self.address:
            return f"Юр. адрес: {self.address}\nПочт. адрес: {self.postal_address}"
        return self.address
    
    def get_bank_details(self):
        """Полные банковские реквизиты в текстовом формате"""
        if not self.bank_name or not self.bank_account:
            return ""
        
        details = f"{self.bank_name}, Р/с {self.bank_account}"
        if self.bank_corr_account:
            details += f", К/с {self.bank_corr_account}"
        if self.bank_bik:
            details += f", БИК {self.bank_bik}"
        
        return details 