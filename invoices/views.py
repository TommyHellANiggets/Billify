from django.shortcuts import render, redirect
from suppliers.models import Supplier
from clients.models import Client
from .models import Invoice, InvoiceItem
from django.db.models import Max
import re
from django.contrib import messages
from decimal import Decimal
from datetime import datetime, date, timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from django.template.loader import render_to_string
from weasyprint import HTML
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site

# Create your views here.

def invoice_list(request):
    """Список счетов"""
    # Получаем тип счетов из параметров запроса
    invoice_type = request.GET.get('type', '')
    
    # Получаем все счета
    invoices = Invoice.objects.all()
    
    # Фильтрация по типу (входящие/исходящие)
    # В данной реализации считаем, что если supplier_name совпадает с company_name пользователя,
    # то счет исходящий, иначе - входящий
    if invoice_type:
        try:
            company_profile = request.user.company_profile
            company_name = company_profile.company_name
            
            if invoice_type == 'outgoing':
                # Исходящие счета (где поставщик - это компания пользователя)
                invoices = invoices.filter(supplier_name=company_name)
            elif invoice_type == 'incoming':
                # Входящие счета (где поставщик - НЕ компания пользователя)
                invoices = invoices.exclude(supplier_name=company_name)
        except:
            # Если профиль не найден, возвращаем пустой список
            invoices = Invoice.objects.none()
    
    # Количество счетов по категориям
    total_count = Invoice.objects.count()
    
    # Считаем исходящие и входящие счета
    try:
        company_profile = request.user.company_profile
        company_name = company_profile.company_name
        
        outgoing_count = Invoice.objects.filter(supplier_name=company_name).count()
        incoming_count = Invoice.objects.exclude(supplier_name=company_name).count()
    except:
        outgoing_count = 0
        incoming_count = 0
    
    # Статистика по статусам
    pending_count = Invoice.objects.filter(status='pending').count()
    overdue_count = Invoice.objects.filter(status='overdue').count()
    paid_count = Invoice.objects.filter(status='paid').count()
    
    # Создаем контекст с информацией о выбранном типе
    context = {
        'title': 'Счета',
        'current_type': invoice_type,
        'invoices': invoices,
        'incoming_count': incoming_count,
        'outgoing_count': outgoing_count,
        'total_count': total_count,
        'pending_count': pending_count,
        'overdue_count': overdue_count,
        'paid_count': paid_count
    }
    
    return render(request, 'invoices/list.html', context)

def invoice_detail(request, pk):
    """Детальная информация о счете"""
    try:
        invoice = Invoice.objects.prefetch_related('items').get(pk=pk)
        
        # Проверяем, связан ли счет с текущим пользователем
        company_profile = request.user.company_profile
        
        # Определяем тип счета (входящий или исходящий)
        is_outgoing = invoice.supplier_name == company_profile.company_name
        invoice_type = 'outgoing' if is_outgoing else 'incoming'
        
        # Получаем полную информацию о позициях счета
        invoice_items = invoice.items.all()
        
        # Подготовка контекста для шаблона
        context = {
            'title': f'Счет #{invoice.number}',
            'invoice': invoice,
            'invoice_items': invoice_items,
            'invoice_type': invoice_type,
            'is_outgoing': is_outgoing,
            'company_profile': company_profile
        }
        
        return render(request, 'invoices/detail.html', context)
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    except Exception as e:
        messages.error(request, f'Ошибка при загрузке счета: {str(e)}')
        return redirect('invoices:list')

def invoice_create(request):
    """Перенаправление на соответствующую форму создания счета"""
    # Получаем тип счета из параметров запроса
    invoice_type = request.GET.get('type', 'outgoing')
    
    if invoice_type == 'incoming':
        return render(request, 'invoices/create_incoming.html', {
            'title': 'Новый входящий счет'
        })
    else:
        return render(request, 'invoices/create_outgoing.html', {
            'title': 'Новый исходящий счет'
        })

def get_next_invoice_number():
    """Генерирует следующий номер счета"""
    # Находим максимальный номер среди существующих счетов
    max_number = Invoice.objects.aggregate(Max('number'))['number__max']
    
    # Если счетов еще нет, начинаем с номера 00001
    if not max_number:
        return 'Счёт №00001'
    
    # Извлекаем числовую часть из номера
    number_match = re.search(r'№(\d+)', max_number)
    if not number_match:
        return 'Счёт №00001'
    
    # Увеличиваем числовую часть на 1
    current_number = int(number_match.group(1))
    next_number = current_number + 1
    
    # Форматируем номер с ведущими нулями
    return f'Счёт №{next_number:05d}'

def create_incoming(request):
    """Создание нового входящего счета"""
    # Получаем список всех активных поставщиков
    suppliers = Supplier.objects.filter(is_active=True).order_by('name')
    
    # Генерируем следующий номер счета
    next_invoice_number = get_next_invoice_number()
    
    if request.method == 'POST':
        # Получаем данные из формы
        invoice_number = request.POST.get('invoice_number')
        invoice_date = request.POST.get('invoice_date')
        due_date = request.POST.get('due_date')
        status = request.POST.get('status')
        notes = request.POST.get('notes')
        payment_details = request.POST.get('payment_details')
        
        # Получаем данные поставщика
        supplier_id = request.POST.get('supplier')
        
        try:
            # Получаем объект поставщика
            supplier = Supplier.objects.get(id=supplier_id)
            
            # Получаем данные о клиенте (текущая компания пользователя)
            try:
                company_profile = request.user.company_profile
                
                # Создаем новый счет
                invoice = Invoice(
                    number=invoice_number,
                    client_id=request.user.clients.first().id,  # Первый клиент пользователя
                    issue_date=datetime.strptime(invoice_date, '%Y-%m-%d').date(),
                    due_date=datetime.strptime(due_date, '%Y-%m-%d').date(),
                    status=status,
                    supplier_name=supplier.name,
                    supplier_address=supplier.address or '',
                    supplier_inn=supplier.inn or '',
                    supplier_kpp=supplier.kpp or '',
                    supplier_bank=supplier.bank_name or '',
                    supplier_bank_account=supplier.bank_account or '',
                    supplier_bank_bik=supplier.bank_bik or '',
                    notes=notes,
                    payment_info=payment_details,
                    subtotal=Decimal('0.00'),  # Временные значения
                    tax_amount=Decimal('0.00'),
                    total=Decimal('0.00')
                )
                invoice.save()
                
                # Обрабатываем позиции счета
                item_names = request.POST.getlist('item_name[]')
                item_quantities = request.POST.getlist('item_quantity[]')
                item_prices = request.POST.getlist('item_price[]')
                
                subtotal = Decimal('0.00')
                
                for i in range(len(item_names)):
                    if item_names[i] and item_prices[i]:  # Проверяем, что поля не пустые
                        quantity = Decimal(item_quantities[i])
                        price = Decimal(item_prices[i])
                        amount = quantity * price
                        subtotal += amount
                        
                        # Создаем позицию счета
                        item = InvoiceItem(
                            invoice=invoice,
                            description=item_names[i],
                            quantity=quantity,
                            price=price,
                            amount=amount
                        )
                        item.save()
                
                # Обновляем итоговые суммы
                invoice.subtotal = subtotal
                invoice.tax_amount = subtotal * Decimal('0.20')  # НДС 20%
                invoice.total = subtotal + invoice.tax_amount
                invoice.save()
                
                messages.success(request, 'Входящий счет успешно создан!')
                return redirect('invoices:list')
            except Exception as e:
                messages.error(request, f'Ошибка при создании счета: {str(e)}')
        except Supplier.DoesNotExist:
            messages.error(request, 'Выбранный поставщик не найден')
    
    return render(request, 'invoices/create_incoming.html', {
        'title': 'Новый входящий счет',
        'suppliers': suppliers,
        'next_invoice_number': next_invoice_number
    })

def create_outgoing(request):
    """Создание нового исходящего счета"""
    # Получаем список всех активных клиентов
    clients = Client.objects.filter(is_active=True).order_by('name')
    
    # Генерируем следующий номер счета
    next_invoice_number = get_next_invoice_number()
    
    # Получаем профиль компании пользователя
    company_profile_data = None
    if request.user.company_profile:
        company_profile = request.user.company_profile
        company_profile_data = {
            'company_name': company_profile.company_name,
            'legal_address': company_profile.legal_address,
            'inn': company_profile.inn,
            'kpp': company_profile.kpp,
            'bank_name': company_profile.bank_name,
            'bank_account': company_profile.bank_account,
            'bank_bik': company_profile.bank_bik,
            'bank_corr_account': company_profile.bank_corr_account,
            'director_name': company_profile.director_name if hasattr(company_profile, 'director_name') else '',
            'accountant_name': company_profile.accountant_name if hasattr(company_profile, 'accountant_name') else ''
        }
    else:
        messages.warning(request, 'Профиль компании не заполнен или содержит неполные данные. Рекомендуется заполнить профиль для корректного формирования счетов.')
    
    if request.method == 'POST':
        # Получаем данные из формы
        invoice_number = request.POST.get('invoice_number')
        invoice_date = request.POST.get('invoice_date')
        due_date = request.POST.get('due_date')
        status = request.POST.get('status')
        notes = request.POST.get('notes')
        payment_details = request.POST.get('payment_details')
        
        # Получаем данные клиента
        client_id = request.POST.get('client')
        
        try:
            # Получаем объект клиента
            client = Client.objects.get(id=client_id)
            
            try:
                # Создаем новый счет
                invoice = Invoice(
                    number=invoice_number,
                    client=client,
                    issue_date=datetime.strptime(invoice_date, '%Y-%m-%d').date(),
                    due_date=datetime.strptime(due_date, '%Y-%m-%d').date(),
                    status=status,
                    supplier_name=company_profile_data['company_name'],
                    supplier_address=company_profile_data['legal_address'],
                    supplier_inn=company_profile_data['inn'],
                    supplier_kpp=company_profile_data['kpp'],
                    supplier_bank=company_profile_data['bank_name'],
                    supplier_bank_account=company_profile_data['bank_account'],
                    supplier_bank_bik=company_profile_data['bank_bik'],
                    supplier_bank_corr_account=company_profile_data['bank_corr_account'],
                    notes=notes,
                    payment_info=payment_details,
                    director_name=company_profile_data['director_name'],
                    accountant_name=company_profile_data['accountant_name'],
                    subtotal=Decimal('0.00'),  # Временные значения
                    tax_amount=Decimal('0.00'),
                    total=Decimal('0.00')
                )
                invoice.save()
                
                # Обрабатываем позиции счета
                item_names = request.POST.getlist('item_name[]')
                item_quantities = request.POST.getlist('item_quantity[]')
                item_prices = request.POST.getlist('item_price[]')
                
                subtotal = Decimal('0.00')
                
                for i in range(len(item_names)):
                    if item_names[i] and item_prices[i]:  # Проверяем, что поля не пустые
                        quantity = Decimal(item_quantities[i])
                        price = Decimal(item_prices[i])
                        amount = quantity * price
                        subtotal += amount
                        
                        # Создаем позицию счета
                        item = InvoiceItem(
                            invoice=invoice,
                            description=item_names[i],
                            quantity=quantity,
                            unit="шт.",  # Можно добавить поле для выбора единиц измерения
                            price=price,
                            amount=amount
                        )
                        item.save()
                
                # Обновляем итоговые суммы
                invoice.subtotal = subtotal
                invoice.tax_amount = subtotal * Decimal('0.20')  # НДС 20%
                invoice.total = subtotal + invoice.tax_amount
                invoice.save()
                
                messages.success(request, 'Счет успешно создан!')
                return redirect('invoices:list')
            except Exception as e:
                messages.error(request, f'Ошибка при создании счета: {str(e)}')
        except Client.DoesNotExist:
            messages.error(request, 'Выбранный клиент не найден')
    
    return render(request, 'invoices/create_outgoing.html', {
        'title': 'Новый исходящий счет',
        'clients': clients,
        'next_invoice_number': next_invoice_number,
        'company_profile': company_profile_data
    })

def invoice_pdf(request, pk):
    """Генерация PDF для счета"""
    try:
        invoice = Invoice.objects.prefetch_related('items').get(pk=pk)
        
        # Получаем компанию пользователя
        company_profile = None
        logo_url = None
        try:
            company_profile = request.user.company_profile
            print(f"Company profile found: {company_profile}")
            
            if company_profile.logo:
                # Конвертируем относительный URL в абсолютный
                current_site = get_current_site(request)
                logo_url = f"{request.scheme}://{current_site.domain}{company_profile.logo.url}"
                print(f"Absolute logo URL: {logo_url}")
        except Exception as e:
            print(f"Error getting company profile: {str(e)}")
            pass
        
        # Подготовка контекста для шаблона
        context = {
            'invoice': invoice,
            'invoice_items': invoice.items.all(),
            'company_profile': company_profile,
            'logo_url': logo_url
        }
        
        # Использовать HTML для создания PDF
        from django.template.loader import get_template
        from weasyprint import HTML
        import tempfile
        from django.conf import settings
        import os
        
        # Рендерим HTML шаблон
        template = get_template('invoices/pdf_template.html')
        html_string = template.render(context)
        
        # Создаем временный файл для лучшей обработки ресурсов
        base_url = request.build_absolute_uri('/').rstrip('/')
        
        # Создаем файл PDF
        response = HttpResponse(content_type='application/pdf')
        filename = f"invoice_{invoice.number.replace(' ', '_').replace('/', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Генерируем PDF из HTML с указанием base_url для ресурсов
        HTML(string=html_string, base_url=base_url).write_pdf(response)
        
        return response
        
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    except Exception as e:
        messages.error(request, f'Ошибка при генерации PDF: {str(e)}')
        return redirect('invoices:detail', pk=pk)

@require_POST
def mark_invoice_paid(request, pk):
    """Отмечает счет как оплаченный"""
    try:
        invoice = Invoice.objects.get(pk=pk)
        
        # Обновляем статус счета
        invoice.status = 'paid'
        invoice.payment_date = datetime.now().date()
        invoice.save()
        
        return JsonResponse({'success': True})
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Счет не найден'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_POST
def delete_invoice(request, pk):
    """Удаляет счет"""
    try:
        invoice = Invoice.objects.get(pk=pk)
        
        # Удаляем счет
        invoice.delete()
        
        return JsonResponse({'success': True})
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Счет не найден'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

def duplicate_invoice(request, pk):
    """Создает копию существующего счета"""
    try:
        # Получаем исходный счет
        original_invoice = Invoice.objects.get(pk=pk)
        
        # Генерируем новый номер счета
        next_invoice_number = get_next_invoice_number()
        
        # Создаем новый счет на основе существующего
        new_invoice = Invoice(
            number=next_invoice_number,
            client=original_invoice.client,
            issue_date=datetime.now().date(),
            due_date=datetime.now().date(),  # Нужно установить новый срок оплаты
            status='draft',  # Новый счет всегда в статусе черновика
            supplier_name=original_invoice.supplier_name,
            supplier_address=original_invoice.supplier_address,
            supplier_inn=original_invoice.supplier_inn,
            supplier_kpp=original_invoice.supplier_kpp,
            supplier_bank=original_invoice.supplier_bank,
            supplier_bank_account=original_invoice.supplier_bank_account,
            supplier_bank_bik=original_invoice.supplier_bank_bik,
            notes=original_invoice.notes,
            payment_info=original_invoice.payment_info,
            subtotal=original_invoice.subtotal,
            tax_rate=original_invoice.tax_rate,
            tax_amount=original_invoice.tax_amount,
            discount=original_invoice.discount,
            total=original_invoice.total
        )
        new_invoice.save()
        
        # Копируем позиции счета
        for item in original_invoice.items.all():
            new_item = InvoiceItem(
                invoice=new_invoice,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                price=item.price,
                amount=item.amount,
                vat_rate=item.vat_rate,
                vat_amount=item.vat_amount,
                country_of_origin=item.country_of_origin,
                customs_declaration=item.customs_declaration
            )
            new_item.save()
        
        messages.success(request, 'Счет успешно скопирован!')
        return redirect('invoices:detail', pk=new_invoice.id)
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    except Exception as e:
        messages.error(request, f'Ошибка при копировании счета: {str(e)}')
        return redirect('invoices:detail', pk=pk)

def edit_invoice(request, pk):
    """Редактирование счета"""
    try:
        invoice = Invoice.objects.get(pk=pk)
        invoice_items = invoice.items.all()
        
        # Определяем тип счета (входящий или исходящий)
        company_profile = request.user.company_profile
        is_outgoing = invoice.supplier_name == company_profile.company_name
        
        # Обработка POST-запроса для сохранения изменений
        if request.method == 'POST':
            try:
                # Получаем данные из формы
                invoice_number = request.POST.get('invoice_number')
                invoice_date = request.POST.get('invoice_date')
                due_date = request.POST.get('due_date')
                status = request.POST.get('status')
                notes = request.POST.get('notes', '')
                payment_details = request.POST.get('payment_details', '')
                
                # Обновляем основные данные счета
                invoice.number = invoice_number
                invoice.issue_date = invoice_date
                invoice.due_date = due_date
                invoice.status = status
                invoice.notes = notes
                invoice.payment_info = payment_details
                
                # Обновляем данные о поставщике/клиенте в зависимости от типа счета
                if is_outgoing:
                    client_id = request.POST.get('client')
                    contact_name = request.POST.get('contact_name', '')
                    contact_email = request.POST.get('contact_email', '')
                    
                    if client_id:
                        client = Client.objects.get(pk=client_id)
                        invoice.client = client
                    
                    invoice.client_contact_person = contact_name
                    invoice.client_email = contact_email
                else:
                    supplier_id = request.POST.get('supplier')
                    contact_name = request.POST.get('contact_name', '')
                    contact_email = request.POST.get('contact_email', '')
                    
                    if supplier_id:
                        supplier = Supplier.objects.get(pk=supplier_id)
                        invoice.supplier_name = supplier.name
                        invoice.supplier_inn = supplier.inn
                        invoice.supplier_kpp = supplier.kpp
                        invoice.supplier_address = supplier.address
                        invoice.supplier_bank = supplier.bank_name
                        invoice.supplier_bank_account = supplier.bank_account
                        invoice.supplier_bank_bik = supplier.bank_bik
                        invoice.supplier_bank_corr_account = supplier.bank_corr_account
                    
                    invoice.contact_person = contact_name
                    invoice.contact_email = contact_email
                
                # Удаляем все существующие позиции и создаем новые
                invoice.items.all().delete()
                
                # Получаем данные о позициях счета
                item_names = request.POST.getlist('item_name[]')
                item_quantities = request.POST.getlist('item_quantity[]')
                item_prices = request.POST.getlist('item_price[]')
                
                # Создаем новые позиции
                subtotal = 0
                
                for i in range(len(item_names)):
                    if item_names[i] and item_quantities[i] and item_prices[i]:
                        quantity = float(item_quantities[i])
                        price = float(item_prices[i])
                        amount = quantity * price
                        
                        invoice_item = InvoiceItem(
                            invoice=invoice,
                            description=item_names[i],
                            quantity=quantity,
                            unit="шт.",  # Можно добавить поле для выбора единиц измерения
                            price=price,
                            amount=amount
                        )
                        invoice_item.save()
                        
                        subtotal += amount
                
                # Обновляем итоговые суммы
                invoice.subtotal = subtotal
                invoice.tax_rate = 20  # Можно сделать настраиваемым
                invoice.tax_amount = subtotal * 0.20
                invoice.total = invoice.subtotal + invoice.tax_amount
                
                # Сохраняем обновленный счет
                invoice.save()
                
                messages.success(request, f'Счет №{invoice.number} успешно обновлен!')
                return redirect('invoices:detail', pk=invoice.id)
            
            except Exception as e:
                messages.error(request, f'Ошибка при обновлении счета: {str(e)}')
                # Продолжаем выполнение и отображаем форму с ошибкой
        
        # Отображение формы редактирования
        if is_outgoing:
            clients = Client.objects.filter(is_active=True).order_by('name')
            template_name = 'invoices/create_outgoing.html'
            context = {
                'title': f'Редактирование счета {invoice.number}',
                'invoice': invoice, 
                'invoice_items': invoice_items,
                'clients': clients,
                'is_edit': True
            }
        else:
            suppliers = Supplier.objects.filter(is_active=True).order_by('name')
            template_name = 'invoices/create_incoming.html'
            context = {
                'title': f'Редактирование счета {invoice.number}',
                'invoice': invoice,
                'invoice_items': invoice_items,
                'suppliers': suppliers,
                'is_edit': True
            }
        
        return render(request, template_name, context)
        
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    except Exception as e:
        messages.error(request, f'Ошибка при загрузке формы редактирования: {str(e)}')
        return redirect('invoices:list')

@login_required
def sample_invoice_pdf(request):
    from datetime import date, timedelta
    
    today = date.today()
    due_date = today + timedelta(days=15)  # Срок оплаты через 15 дней
    
    # Создаем образец счета для демонстрации
    invoice = {
        'number': 'SAMPLE-001',
        'issue_date': today,
        'due_date': due_date,
        'supplier_name': 'ООО "КОМПАНИЯ"',
        'supplier_inn': '7712345678',
        'supplier_kpp': '771201001',
        'supplier_address': 'г. Москва, ул. Примерная, д. 1, офис 123',
        'supplier_bank': 'АО "АЛЬФА-БАНК"',  # Название банка вместо числового значения
        'supplier_bank_bik': '044525593',
        'supplier_bank_account': '40702810123450101230',
        'supplier_bank_corr_account': '30101810200000000593',
        'accountant_name': 'Иванова А.А.',
        'subtotal': 10000.00,
        'tax_rate': 20,
        'tax_amount': 2000.00,
        'total': 12000.00,
        'payment_info': 'Оплата данного счета означает согласие с условиями договора-оферты.',
        'client': {
            'name': 'ИП Петров Петр Петрович',
            'tax_id': '123456789012',
            'address': 'г. Санкт-Петербург, ул. Медниковская, д. 25, кв. 1',
            'phone': '+7 (999) 123-45-67',
            'email': 'petrov@example.com',
        },
        'contact_person': 'Петров П.П.',
    }
    
    # Образец позиций счета
    invoice_items = [
        {
            'description': 'Разработка веб-сайта',
            'quantity': 1,
            'unit': 'усл.',
            'price': 8000.00,
            'amount': 8000.00,
        },
        {
            'description': 'Настройка и оптимизация',
            'quantity': 2,
            'unit': 'час',
            'price': 1000.00,
            'amount': 2000.00,
        },
    ]
    
    # Рендерим HTML шаблон
    html_string = render_to_string('invoices/pdf_template.html', {
        'invoice': invoice,
        'invoice_items': invoice_items,
    })
    
    # Генерируем PDF файл
    html = HTML(string=html_string, base_url=request.build_absolute_uri('/'))
    result = html.write_pdf()
    
    # Возвращаем PDF файл в HTTP-ответе
    response = HttpResponse(result, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="Счет №{invoice["number"]} от {today.strftime("%d.%m.%Y")}.pdf"'
    return response
