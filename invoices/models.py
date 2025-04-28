from django.db import models
from django.urls import reverse
from clients.models import Client
from decimal import Decimal
from django.core.validators import MinValueValidator

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('sent', 'Отправлен'),
        ('paid', 'Оплачен'),
        ('overdue', 'Просрочен'),
        ('cancelled', 'Отменен'),
    )
    
    TAX_CHOICES = (
        (Decimal('0.00'), 'Без НДС'),
        (Decimal('10.00'), '10%'),
        (Decimal('20.00'), '20%'),
    )
    
    number = models.CharField('Номер счета', max_length=50, unique=True)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, verbose_name='Клиент', related_name='invoices')
    issue_date = models.DateField('Дата выставления')
    due_date = models.DateField('Срок оплаты')
    payment_date = models.DateField('Дата оплаты', null=True, blank=True)
    status = models.CharField('Статус', max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Обязательные поля для РФ
    supplier_name = models.CharField('Наименование поставщика', max_length=200)
    supplier_address = models.TextField('Адрес поставщика')
    supplier_inn = models.CharField('ИНН поставщика', max_length=15)
    supplier_kpp = models.CharField('КПП поставщика', max_length=9, blank=True)
    supplier_bank = models.CharField('Банк поставщика', max_length=200, blank=True)
    supplier_bank_account = models.CharField('Р/с поставщика', max_length=20, blank=True)
    supplier_bank_bik = models.CharField('БИК банка поставщика', max_length=9, blank=True)
    
    # Информация о плательщике берется из модели Client
    
    # Финансовая информация
    subtotal = models.DecimalField('Сумма без налогов', max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    discount = models.DecimalField('Скидка', max_digits=15, decimal_places=2, default=Decimal('0.00'), validators=[MinValueValidator(Decimal('0.00'))])
    tax_rate = models.DecimalField('Ставка НДС', max_digits=5, decimal_places=2, choices=TAX_CHOICES, default=Decimal('20.00'))
    tax_amount = models.DecimalField('Сумма НДС', max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total = models.DecimalField('Итого с налогами', max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    
    payment_info = models.TextField('Информация об оплате', blank=True)
    notes = models.TextField('Примечания', blank=True)
    
    created_at = models.DateTimeField('Дата создания', auto_now_add=True)
    updated_at = models.DateTimeField('Дата обновления', auto_now=True)
    
    class Meta:
        verbose_name = 'Счет'
        verbose_name_plural = 'Счета'
        ordering = ['-issue_date', '-number']
    
    def __str__(self):
        return f"Счет #{self.number} для {self.client.name}"
    
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
    
    def save(self, *args, **kwargs):
        # Автоматический расчет налога и общей суммы при сохранении
        self.tax_amount = self.calculate_tax()
        self.total = self.calculate_total()
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items', verbose_name='Счет')
    description = models.CharField('Наименование товара/услуги', max_length=255)
    quantity = models.DecimalField('Количество', max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    unit = models.CharField('Единица измерения', max_length=50, default='шт.')
    price = models.DecimalField('Цена за единицу', max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    amount = models.DecimalField('Сумма', max_digits=15, decimal_places=2, validators=[MinValueValidator(Decimal('0.00'))])
    
    # Дополнительные поля для РФ
    vat_rate = models.DecimalField('Ставка НДС', max_digits=5, decimal_places=2, choices=Invoice.TAX_CHOICES, default=Decimal('20.00'))
    vat_amount = models.DecimalField('Сумма НДС', max_digits=15, decimal_places=2, default=Decimal('0.00'))
    country_of_origin = models.CharField('Страна происхождения', max_length=100, blank=True)
    customs_declaration = models.CharField('Номер таможенной декларации', max_length=100, blank=True)
    
    class Meta:
        verbose_name = 'Позиция счета'
        verbose_name_plural = 'Позиции счета'
    
    def __str__(self):
        return f"{self.description} ({self.quantity} {self.unit})"
    
    def calculate_amount(self):
        """Расчет суммы позиции"""
        return self.quantity * self.price
    
    def calculate_vat(self):
        """Расчет НДС для позиции"""
        return self.amount * (self.vat_rate / Decimal('100.00'))
    
    def save(self, *args, **kwargs):
        # Автоматический расчет суммы и НДС при сохранении
        self.amount = self.calculate_amount()
        self.vat_amount = self.calculate_vat()
        super().save(*args, **kwargs)
        
        # Пересчет итогов в родительском счете
        invoice = self.invoice
        items = invoice.items.all()
        invoice.subtotal = sum(item.amount for item in items)
        invoice.save()
