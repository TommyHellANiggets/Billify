from django.db import models
from django.urls import reverse
from django.contrib.auth.models import User

class Client(models.Model):
    TYPE_CHOICES = (
        ('individual', 'Физическое лицо'),
        ('business', 'Юридическое лицо'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='clients', verbose_name='Пользователь', null=True)
    type = models.CharField('Тип клиента', max_length=20, choices=TYPE_CHOICES, default='individual')
    name = models.CharField('Имя / Название организации', max_length=200)
    email = models.EmailField('Email', blank=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)
    address = models.TextField('Адрес', blank=True)
    tax_id = models.CharField('ИНН', max_length=15, blank=True)
    kpp = models.CharField('КПП', max_length=9, blank=True, help_text='Только для юр. лиц')
    ogrn = models.CharField('ОГРН / ОГРНИП', max_length=15, blank=True)
    bank_name = models.CharField('Название банка', max_length=200, blank=True)
    bank_account = models.CharField('Банковский счет', max_length=20, blank=True)
    bank_bik = models.CharField('БИК', max_length=9, blank=True)
    comment = models.TextField('Комментарий', blank=True)
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    is_active = models.BooleanField('Активный', default=True)
    
    class Meta:
        verbose_name = 'Клиент'
        verbose_name_plural = 'Клиенты'
        ordering = ['-created_at']
        # Добавляем составной индекс для оптимизации выборки
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return reverse('clients:detail', args=[str(self.id)])
    
    def get_edit_url(self):
        return reverse('clients:edit', args=[str(self.id)])
    
    def get_delete_url(self):
        return reverse('clients:delete', args=[str(self.id)])
        
    def get_full_address(self):
        return self.address
        
    def get_type_display_name(self):
        return dict(self.TYPE_CHOICES).get(self.type, '')
