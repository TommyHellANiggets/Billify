from django.db import models
from django.urls import reverse
from clients.models import Client
from decimal import Decimal
from django.core.validators import MinValueValidator
from django.db.models import Sum
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', _('Черновик')),
        ('sent', _('Отправлен')),
        ('paid', _('Оплачен')),
        ('overdue', _('Просрочен')),
        ('cancelled', _('Отменен')),
    )
    
    INVOICE_TYPE_CHOICES = (
        ('incoming', _('Входящий')),
        ('outgoing', _('Исходящий')),
    )
    
    TAX_CHOICES = (
        (Decimal('0.00'), 'Без НДС'),
        (Decimal('10.00'), '10%'),
        (Decimal('20.00'), '20%'),
    )
    
    number = models.CharField(_('Номер счета'), max_length=50, unique=True)
    client = models.ForeignKey(Client, verbose_name=_('Клиент'), related_name='invoices', on_delete=models.CASCADE)
    supplier = models.ForeignKey(Client, verbose_name=_('Поставщик'), related_name='supplier_invoices', on_delete=models.CASCADE, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices', verbose_name='Пользователь', null=True)
    invoice_type = models.CharField(_('Тип счета'), max_length=10, choices=INVOICE_TYPE_CHOICES, default='outgoing')
    issue_date = models.DateField(_('Дата выставления'), default=timezone.now)
    due_date = models.DateField(_('Срок оплаты'), default=timezone.now)
    payment_date = models.DateField('Дата оплаты', null=True, blank=True)
    status = models.CharField(_('Статус'), max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Поля для поставщика
    supplier_name = models.CharField(_('Название поставщика'), max_length=255)
    supplier_address = models.TextField(_('Адрес поставщика'))
    supplier_inn = models.CharField(_('ИНН поставщика'), max_length=20)
    supplier_kpp = models.CharField(_('КПП поставщика'), max_length=20, blank=True, null=True)
    supplier_phone = models.CharField(_('Телефон поставщика'), max_length=20, blank=True, null=True)
    supplier_email = models.EmailField(_('Email поставщика'), blank=True, null=True)
    supplier_contact_person = models.CharField(_('Контактное лицо поставщика'), max_length=100, blank=True, null=True)
    supplier_tax_id = models.CharField(_('ИНН поставщика (альт.)'), max_length=20, blank=True, null=True)
    
    # Поля для клиента
    client_name = models.CharField(_('Название клиента'), max_length=255, blank=True, null=True)
    client_address = models.TextField(_('Адрес клиента'), blank=True, null=True)
    client_tax_id = models.CharField(_('ИНН клиента'), max_length=20, blank=True, null=True)
    client_phone = models.CharField(_('Телефон клиента'), max_length=20, blank=True, null=True)
    client_email = models.EmailField(_('Email клиента'), blank=True, null=True)
    client_contact_person = models.CharField(_('Контактное лицо клиента'), max_length=100, blank=True, null=True)
    
    # Банковские реквизиты
    supplier_bank = models.CharField(_('Название банка'), max_length=255)
    supplier_bank_account = models.CharField(_('Расчетный счет'), max_length=20)
    supplier_bank_bik = models.CharField(_('БИК'), max_length=9)
    supplier_bank_corr_account = models.CharField(_('Корр. счет'), max_length=20, null=True, blank=True)
    
    # Дополнительная информация
    notes = models.TextField(_('Примечания'), blank=True)
    payment_info = models.TextField(_('Информация об оплате'), blank=True)
    payment_details = models.TextField(_('Детали оплаты'), blank=True)
    
    # Суммы
    subtotal = models.DecimalField(_('Сумма без НДС'), max_digits=15, decimal_places=2, default=Decimal('0.00'))
    discount = models.DecimalField('Скидка', max_digits=15, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    tax_rate = models.DecimalField(_('Ставка НДС'), max_digits=5, decimal_places=2, choices=TAX_CHOICES, default=Decimal('20.00'))
    tax_amount = models.DecimalField(_('Сумма НДС'), max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField(_('Итого к оплате'), max_digits=15, decimal_places=2, default=Decimal('0.00'))
    
    # Поля для подписей
    director_name = models.CharField(_('ФИО руководителя'), max_length=255, blank=True)
    accountant_name = models.CharField(_('ФИО главного бухгалтера'), max_length=255, blank=True)
    
    created_at = models.DateTimeField(_('Создан'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Обновлен'), auto_now=True)
    
    class Meta:
        verbose_name = _('Счет')
        verbose_name_plural = _('Счета')
        ordering = ['-issue_date', '-id']
    
    def __str__(self):
        return f"{self.number} - {self.client.name} ({self.get_status_display()})"
    
    def get_absolute_url(self):
        return reverse('invoices:detail', args=[str(self.id)])
    
    def get_edit_url(self):
        return reverse('invoices:edit', args=[str(self.id)])
    
    def get_delete_url(self):
        return reverse('invoices:delete', args=[str(self.id)])
    
    def calculate_tax(self):
        """Расчет НДС на основе подытога и ставки"""
        return self.subtotal * (self.tax_rate / Decimal('100.00'))
    
    def calculate_total(self):
        """Расчет общей суммы с учетом налогов и скидок"""
        return self.subtotal + self.tax_amount - self.discount
    
    def calculate_totals(self):
        """Расчет всех сумм на основе позиций счета"""
        items = self.items.all()
        if items:
            self.subtotal = items.aggregate(Sum('amount'))['amount__sum'] or Decimal('0.00')
            self.tax_amount = (self.subtotal * self.tax_rate / Decimal('100.00')).quantize(Decimal('0.01'))
            self.total = self.subtotal + self.tax_amount
        return self.total
    
    def save(self, *args, **kwargs):
        # Если это новый счет, рассчитываем суммы
        if not self.pk:
            super().save(*args, **kwargs)  # Сначала сохраняем для получения ID
        else:
            self.calculate_totals()
            super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    """Позиция счета"""
    invoice = models.ForeignKey(Invoice, verbose_name=_('Счет'), related_name='items', on_delete=models.CASCADE)
    description = models.TextField(_('Описание'))
    quantity = models.DecimalField(_('Количество'), max_digits=10, decimal_places=2)
    unit = models.CharField(_('Единица измерения'), max_length=10, default='шт.')
    price = models.DecimalField(_('Цена'), max_digits=15, decimal_places=2)
    amount = models.DecimalField(_('Сумма'), max_digits=15, decimal_places=2)
    
    # Дополнительные поля для РФ
    vat_rate = models.DecimalField('Ставка НДС', max_digits=5, decimal_places=2, choices=Invoice.TAX_CHOICES, default=Decimal('20.00'))
    vat_amount = models.DecimalField('Сумма НДС', max_digits=15, decimal_places=2, default=Decimal('0.00'))
    country_of_origin = models.CharField('Страна происхождения', max_length=100, blank=True)
    customs_declaration = models.CharField('Номер таможенной декларации', max_length=100, blank=True)
    
    class Meta:
        verbose_name = _('Позиция счета')
        verbose_name_plural = _('Позиции счета')
        ordering = ['id']
    
    def __str__(self):
        return f"{self.description[:50]}... ({self.quantity} {self.unit})"
    
    def calculate_amount(self):
        """Расчет суммы позиции"""
        return self.quantity * self.price
    
    def calculate_vat(self):
        """Расчет НДС для позиции"""
        return self.amount * (self.vat_rate / Decimal('100.00'))
    
    def save(self, *args, **kwargs):
        # Автоматический расчет суммы
        self.amount = self.quantity * self.price
        super().save(*args, **kwargs)
        
        # Пересчитываем итоги счета
        self.invoice.calculate_totals()
        self.invoice.save()
