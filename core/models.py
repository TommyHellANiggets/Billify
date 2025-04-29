from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class CompanyProfile(models.Model):
    COMPANY_TYPE_CHOICES = (
        ('individual', 'Индивидуальный предприниматель'),
        ('business', 'Юридическое лицо'),
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
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Профиль компании'
        verbose_name_plural = 'Профили компаний'
    
    def __str__(self):
        return f"{self.company_name} ({self.user.username})"
