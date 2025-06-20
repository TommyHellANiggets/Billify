from django.shortcuts import render, redirect
from suppliers.models import Supplier
from clients.models import Client
from .models import Invoice, InvoiceItem
from django.db.models import Max
import re
from django.contrib import messages
from decimal import Decimal, InvalidOperation
from datetime import datetime, date, timedelta
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
import json
from django.template.loader import render_to_string
from weasyprint import HTML
from django.contrib.auth.decorators import login_required
from django.contrib.sites.shortcuts import get_current_site

# Create your views here.

@login_required
def invoice_list(request):
    """Список счетов"""
    # Получаем тип счетов из параметров запроса
    invoice_type = request.GET.get('type', '')
    
    # Обновляем статусы просроченных счетов
    update_overdue_invoices(request.user)
    
    # Получаем счета только текущего пользователя
    invoices = Invoice.objects.filter(user=request.user)
    
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
    
    # Количество счетов по категориям (только для текущего пользователя)
    total_count = Invoice.objects.filter(user=request.user).count()
    
    # Считаем исходящие и входящие счета
    try:
        company_profile = request.user.company_profile
        company_name = company_profile.company_name
        
        outgoing_count = Invoice.objects.filter(user=request.user, supplier_name=company_name).count()
        incoming_count = Invoice.objects.filter(user=request.user).exclude(supplier_name=company_name).count()
    except:
        outgoing_count = 0
        incoming_count = 0
    
    # Статистика по статусам (только для текущего пользователя)
    pending_count = Invoice.objects.filter(user=request.user, status='pending').count()
    overdue_count = Invoice.objects.filter(user=request.user, status='overdue').count()
    paid_count = Invoice.objects.filter(user=request.user, status='paid').count()
    
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

def update_overdue_invoices(user):
    """Обновляет статусы счетов - помечает просроченные"""
    today = date.today()
    
    # Находим все неоплаченные счета с истекшим сроком оплаты
    # Исключаем счета со статусом 'copy', так как они не переходят в просроченные
    overdue_invoices = Invoice.objects.filter(
        user=user,
        due_date__lt=today,  # срок оплаты меньше текущей даты
        status__in=['draft', 'sent', 'new']  # только неоплаченные счета
    )
    
    # Обновляем их статус на 'overdue' (просрочен)
    for invoice in overdue_invoices:
        invoice.status = 'overdue'
        invoice.save()
    
    return overdue_invoices.count()  # Возвращаем количество обновленных счетов

@login_required
def invoice_detail(request, pk):
    """Детальная информация о счете"""
    try:
        # Обновляем статусы просроченных счетов
        update_overdue_invoices(request.user)
        
        invoice = Invoice.objects.prefetch_related('items').get(pk=pk)
        
        # Проверяем, принадлежит ли счет текущему пользователю
        if invoice.user != request.user:
            messages.error(request, 'У вас нет доступа к этому счету')
            return redirect('invoices:list')
        
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

@login_required
def invoice_create(request):
    """Перенаправление на соответствующую форму создания счета"""
    # Получаем тип счета из параметров запроса
    invoice_type = request.GET.get('type', 'outgoing')
    
    # Получаем ID клиента или поставщика (если указаны в URL)
    client_id = request.GET.get('client_id')
    supplier_id = request.GET.get('supplier_id')
    
    print(f"DEBUG - invoice_create: type={invoice_type}, client_id={client_id}, supplier_id={supplier_id}")
    
    # Формируем контекст с необходимыми данными
    context = {
        'title': f'Новый {"входящий" if invoice_type == "incoming" else "исходящий"} счет'
    }
    
    # Загружаем списки клиентов и поставщиков, в зависимости от типа счета
    if invoice_type == 'outgoing':
        # Для исходящего счета нужны клиенты
        clients = Client.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('name')
        
        # Получаем выбранного клиента, если указан ID
        selected_client = None
        if client_id:
            try:
                selected_client = Client.objects.get(
                    id=client_id,
                    user=request.user, 
                    is_active=True
                )
                print(f"DEBUG - invoice_create: найден выбранный клиент: {selected_client.id} - {selected_client.name}")
            except Client.DoesNotExist:
                print(f"DEBUG - invoice_create: клиент с ID {client_id} не найден")
        
        # Добавляем данные в контекст
        context['clients'] = clients
        context['client_id'] = client_id
        context['selected_client'] = selected_client
        
        # Выводим список ID всех найденных клиентов для отладки
        client_ids = list(clients.values_list('id', flat=True))
        print(f"DEBUG - invoice_create: ID найденных клиентов: {client_ids}")
        print(f"DEBUG - invoice_create: количество клиентов: {clients.count()}")
    elif invoice_type == 'incoming':
        # Для входящего счета нужны поставщики из модели Supplier
        suppliers = Supplier.objects.filter(
            user=request.user,
            is_active=True
        ).order_by('name')
        
        # Получаем выбранного поставщика, если указан ID
        selected_supplier = None
        if supplier_id:
            try:
                selected_supplier = Supplier.objects.get(
                    id=supplier_id,
                    user=request.user,
                    is_active=True
                )
                print(f"DEBUG - invoice_create: найден выбранный поставщик: {selected_supplier.id} - {selected_supplier.name}")
            except Supplier.DoesNotExist:
                print(f"DEBUG - invoice_create: поставщик с ID {supplier_id} не найден")
        
        # Добавляем данные в контекст
        context['suppliers'] = suppliers
        context['supplier_id'] = supplier_id
        context['selected_supplier'] = selected_supplier
        print(f"DEBUG - invoice_create: количество поставщиков: {suppliers.count()}")
    
    # Добавляем соответствующие ID в контекст, если они переданы
    if invoice_type == 'incoming' and supplier_id:
        context['supplier_id'] = supplier_id
    elif invoice_type == 'outgoing' and client_id:
        context['client_id'] = client_id
    
    print(f"DEBUG - invoice_create: передаю в контекст: {context.keys()}")
    
    if invoice_type == 'incoming':
        return render(request, 'invoices/create_incoming.html', context)
    else:
        # Генерируем следующий номер счета
        next_invoice_number = get_next_invoice_number(request.user, 'outgoing')
        context['next_invoice_number'] = next_invoice_number
        return render(request, 'invoices/create_outgoing.html', context)

def get_next_invoice_number(user=None, invoice_type=None):
    """Генерирует следующий номер счета, уникальный для каждого пользователя.
    У каждого пользователя независимая нумерация счетов, начинающаяся с 00001.
    Префикс зависит от типа счета: "Исх-" для исходящих, "Вход-" для входящих.
    Если есть пропущенные номера в последовательности, функция вернет первый свободный номер."""
    # Получаем все существующие номера счетов
    existing_invoices = Invoice.objects.all()
    
    # Обязательно фильтруем счета по пользователю
    if user:
        existing_invoices = existing_invoices.filter(user=user)
    else:
        # Если пользователь не указан, не можем гарантировать уникальность
        prefix = "Исх-" if invoice_type == "outgoing" else "Вход-"
        timestamp = timezone.now().strftime("%y%m%d%H%M%S")
        return f'{prefix}Счёт№{timestamp}'
    
    # Если нужно, дополнительно фильтруем счета по типу
    if invoice_type:
        existing_invoices = existing_invoices.filter(invoice_type=invoice_type)
    
    # Устанавливаем префикс в зависимости от типа счета
    prefix = "Исх-" if invoice_type == "outgoing" else "Вход-"
    
    # Если у пользователя еще нет счетов этого типа, начинаем с номера, включающего дату
    if not existing_invoices.exists():
        year_month = timezone.now().strftime("%y%m")
        return f'{prefix}{year_month}-00001'
    
    # Извлекаем числовые части из всех номеров счетов этого пользователя
    existing_numbers = []
    year_month = timezone.now().strftime("%y%m")
    
    for invoice in existing_invoices:
        # Используем регулярное выражение для новых форматов номеров (с датой)
        number_match = re.search(fr'{prefix}(\d+)-(\d+)', invoice.number)
        if number_match:
            invoice_month = number_match.group(1)
            if invoice_month == year_month:
                existing_numbers.append(int(number_match.group(2)))
        else:
            # Старый формат - используем для совместимости
            number_match = re.search(r'№(\d+)', invoice.number)
            if number_match:
                existing_numbers.append(int(number_match.group(1)))
    
    if not existing_numbers:
        return f'{prefix}{year_month}-00001'
    
    # Сортируем номера
    existing_numbers.sort()
    
    # Находим максимальный номер и увеличиваем на 1
    max_number = max(existing_numbers) if existing_numbers else 0
    next_number = max_number + 1
    
    # Форматируем номер с ведущими нулями, включая год и месяц
    return f'{prefix}{year_month}-{next_number:05d}'

@login_required
def create_incoming(request):
    """Создание нового входящего счета"""
    
    # Получаем список всех активных поставщиков из модели Supplier
    suppliers = Supplier.objects.filter(
        user=request.user,
        is_active=True
    ).order_by('name')
    print(f"DEBUG - найдено поставщиков: {suppliers.count()}")
    
    # Генерируем следующий номер счета
    next_invoice_number = get_next_invoice_number(request.user, 'incoming')
    
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
            # Получаем объект поставщика из модели Supplier
            supplier = Supplier.objects.get(id=supplier_id)
            
            # Получаем данные о клиенте (текущая компания пользователя)
            user_company_profile = request.user.company_profile
            
            if not user_company_profile:
                # Если у пользователя нет своей компании, создаем ошибку
                messages.error(request, 'Необходимо заполнить данные вашей компании перед созданием счетов')
                return redirect('core:profile')
            
            # Создаем или получаем клиента, который представляет компанию пользователя
            client, created = Client.objects.get_or_create(
                user=request.user,
                name=user_company_profile.company_name,
                defaults={
                    'is_active': True,
                    'address': user_company_profile.legal_address,
                    'tax_id': user_company_profile.inn,
                    'phone': user_company_profile.phone,
                    'email': user_company_profile.email,
                    'contact_person': ""  # У CompanyProfile нет contact_person
                }
            )
            
            # Получаем данные о товарах
            item_names = request.POST.getlist('item_name[]')
            item_descriptions = request.POST.getlist('item_description[]')
            item_quantities = request.POST.getlist('item_quantity[]')
            item_prices = request.POST.getlist('item_price[]')
            item_discounts = request.POST.getlist('item_discount[]')
            
            # Получаем общую скидку и обрабатываем ее
            discount = request.POST.get('discount', '0')
            try:
                discount_value = Decimal(discount.replace(',', '.'))
            except (ValueError, InvalidOperation):
                discount_value = Decimal('0')
                
            # Проверяем, существует ли счет с таким номером
            if Invoice.objects.filter(number=invoice_number).exists():
                # Если номер уже занят, генерируем новый номер
                invoice_number = get_next_invoice_number(request.user, 'incoming')
                # На всякий случай проверяем еще раз с добавлением timestamp
                if Invoice.objects.filter(number=invoice_number).exists():
                    current_time = timezone.now().strftime('%H%M%S')
                    invoice_number = f"{invoice_number}-{current_time}"
            
            # Создаем новый счет
            invoice = Invoice.objects.create(
                number=invoice_number,
                issue_date=invoice_date,
                due_date=due_date,
                status=status,
                notes=notes,
                payment_details=payment_details,
                invoice_type='incoming',
                discount=discount_value,
                user=request.user,
                client=client,
                supplier_name=supplier.name,
                supplier_address=supplier.address or '',
                supplier_tax_id=supplier.inn or '',
                supplier_phone=supplier.phone or '',
                supplier_email=supplier.email or '',
                supplier_contact_person=supplier.contact_person or '',
                supplier_bank=supplier.bank_name or '',
                supplier_bank_bik=supplier.bank_bik or '',
                supplier_bank_account=supplier.bank_account or '',
                supplier_bank_corr_account=supplier.bank_corr_account or '',
                client_name=client.name,
                client_address=client.address,
                client_tax_id=client.tax_id,
                client_phone=client.phone,
                client_email=client.email,
                client_contact_person=client.contact_person
            )
            
            # Создаем позиции счета
            for i in range(len(item_names)):
                if item_names[i].strip():  # Проверяем, что название не пустое
                    try:
                        quantity = Decimal(item_quantities[i].replace(',', '.')) if item_quantities[i] else Decimal('1')
                        price = Decimal(item_prices[i].replace(',', '.')) if item_prices[i] else Decimal('0')
                        discount = Decimal(item_discounts[i].replace(',', '.')) if i < len(item_discounts) and item_discounts[i] else Decimal('0')
                    except (ValueError, InvalidOperation):
                        quantity = Decimal('1')
                        price = Decimal('0')
                        discount = Decimal('0')
                    
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description=item_names[i],
                        quantity=quantity,
                        price=price,
                        discount=discount,
                        amount=(quantity * price) - discount
                    )
            
            # Перенаправляем на страницу счета
            messages.success(request, f'Счет {invoice.number} успешно создан')
            return redirect('invoices:detail', pk=invoice.id)
            
        except Supplier.DoesNotExist:
            messages.error(request, 'Выбранный поставщик не найден')
        except Exception as e:
            messages.error(request, f'Ошибка при создании счета: {str(e)}')
    
    # Получаем ID поставщика из URL-параметра
    supplier_id = request.GET.get('supplier_id')
    selected_supplier = None
    
    if supplier_id:
        try:
            selected_supplier = Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            pass
    
    # Передаем данные в шаблон
    context = {
        'title': 'Новый входящий счет',
        'suppliers': suppliers,
        'next_invoice_number': next_invoice_number,
        'is_edit': False,
        'selected_supplier': selected_supplier,
        'supplier_id': supplier_id
    }
    
    return render(request, 'invoices/create_incoming.html', context)

@login_required
def create_outgoing(request):
    """Создание нового исходящего счета"""
    # Получаем ID клиента из URL-параметра
    client_id = request.GET.get('client_id')
    print(f"DEBUG - client_id из URL: {client_id}")
    
    # Получаем список только активных клиентов текущего пользователя
    clients = Client.objects.filter(
        user=request.user,
        is_active=True
    ).order_by('name')
    print(f"DEBUG - найдено клиентов пользователя: {clients.count()}")
    
    # Выводим список ID всех найденных клиентов для отладки
    client_ids = list(clients.values_list('id', flat=True))
    print(f"DEBUG - ID найденных клиентов: {client_ids}")
    
    # Генерируем следующий номер счета
    next_invoice_number = get_next_invoice_number(request.user, 'outgoing')
    
    selected_client = None
    
    if client_id:
        try:
            # Ищем клиента по ID, принадлежащего текущему пользователю
            selected_client = Client.objects.get(
                id=client_id,
                user=request.user,
                is_active=True
            )
            print(f"DEBUG - найден выбранный клиент: {selected_client.id} - {selected_client.name}")
        except Client.DoesNotExist:
            print(f"DEBUG - клиент с ID {client_id} не найден")
            selected_client = None
    
    if request.method == 'POST':
        # Получаем данные из формы
        invoice_number = request.POST.get('invoice_number')
        invoice_date = request.POST.get('invoice_date')
        due_date = request.POST.get('due_date')
        status = request.POST.get('status')
        notes = request.POST.get('notes')
        payment_details = request.POST.get('payment_details')
        discount = request.POST.get('discount', '0')
        
        # Получаем данные клиента
        client_id = request.POST.get('client')
        print(f"DEBUG - client_id из POST запроса: {client_id}")
        
        try:
            # Получаем объект клиента
            client = Client.objects.get(id=client_id, user=request.user)
            print(f"DEBUG - клиент для счета: {client.id} - {client.name}")
            
            # Получаем данные о поставщике (текущая компания пользователя)
            user_company_profile = request.user.company_profile
            supplier = None
            
            # Если у пользователя нет профиля компании, перенаправляем на создание
            if not user_company_profile:
                messages.error(request, 'Необходимо заполнить данные вашей компании перед созданием счетов')
                return redirect('core:profile')
            
            # Получаем данные о товарах
            item_names = request.POST.getlist('item_name[]')
            item_descriptions = request.POST.getlist('item_description[]')
            item_quantities = request.POST.getlist('item_quantity[]')
            item_prices = request.POST.getlist('item_price[]')
            item_discounts = request.POST.getlist('item_discount[]')
            
            # Получаем общую скидку и обрабатываем ее
            discount = request.POST.get('discount', '0')
            try:
                discount_value = Decimal(discount.replace(',', '.'))
            except (ValueError, InvalidOperation):
                discount_value = Decimal('0')
            
            # Проверяем, существует ли счет с таким номером
            if Invoice.objects.filter(number=invoice_number).exists():
                # Если номер уже занят, генерируем новый номер
                invoice_number = get_next_invoice_number(request.user, 'outgoing')
                # На всякий случай проверяем еще раз с добавлением timestamp
                if Invoice.objects.filter(number=invoice_number).exists():
                    current_time = timezone.now().strftime('%H%M%S')
                    invoice_number = f"{invoice_number}-{current_time}"
            
            # Создаем новый счет
            invoice = Invoice.objects.create(
                number=invoice_number,
                issue_date=invoice_date,
                due_date=due_date,
                status=status,
                notes=notes,
                payment_details=payment_details,
                invoice_type='outgoing',
                discount=discount_value,
                user=request.user,
                client=client,
                supplier_name=user_company_profile.company_name,
                supplier_address=user_company_profile.legal_address,
                supplier_tax_id=user_company_profile.inn,
                supplier_phone=user_company_profile.phone,
                supplier_email=user_company_profile.email,
                supplier_contact_person="",  # У CompanyProfile нет contact_person
                supplier_bank=user_company_profile.bank_name,
                supplier_bank_bik=user_company_profile.bank_bik,
                supplier_bank_account=user_company_profile.bank_account,
                supplier_bank_corr_account=user_company_profile.bank_corr_account,
                client_name=client.name,
                client_address=client.address,
                client_tax_id=client.tax_id,
                client_phone=client.phone,
                client_email=client.email,
                client_contact_person=client.contact_person
            )
            
            # Создаем позиции счета
            for i in range(len(item_names)):
                if item_names[i].strip():  # Проверяем, что название не пустое
                    try:
                        quantity = Decimal(item_quantities[i].replace(',', '.')) if item_quantities[i] else Decimal('1')
                        price = Decimal(item_prices[i].replace(',', '.')) if item_prices[i] else Decimal('0')
                        discount = Decimal(item_discounts[i].replace(',', '.')) if i < len(item_discounts) and item_discounts[i] else Decimal('0')
                    except (ValueError, InvalidOperation):
                        quantity = Decimal('1')
                        price = Decimal('0')
                        discount = Decimal('0')
                    
                    InvoiceItem.objects.create(
                        invoice=invoice,
                        description=item_names[i],
                        quantity=quantity,
                        price=price,
                        discount=discount,
                        amount=(quantity * price) - discount
                    )
            
            # Перенаправляем на страницу счета
            messages.success(request, f'Счет {invoice.number} успешно создан')
            return redirect('invoices:detail', pk=invoice.id)
            
        except Client.DoesNotExist:
            messages.error(request, 'Выбранный клиент не найден')
            print(f"DEBUG - клиент с ID {client_id} не найден при создании счета")
        except Exception as e:
            messages.error(request, f'Ошибка при создании счета: {str(e)}')
            print(f"DEBUG - ошибка при создании счета: {str(e)}")
    
    # Передаем данные в шаблон
    context = {
        'title': 'Новый исходящий счет',
        'clients': clients,
        'next_invoice_number': next_invoice_number,
        'is_edit': False,
        'selected_client': selected_client,
        'client_id': client_id
    }
    
    print(f"DEBUG - передаем в контекст: client_id={client_id}, selected_client={selected_client.id if selected_client else None}")
    
    return render(request, 'invoices/create_outgoing.html', context)

@login_required
def invoice_pdf(request, pk):
    """Генерация PDF для счета"""
    try:
        invoice = Invoice.objects.prefetch_related('items').get(pk=pk)
        
        # Получаем компанию пользователя
        company_profile = None
        logo_url = None
        logo_path = None
        logo_data_uri = None
        
        try:
            company_profile = request.user.company_profile
            print(f"Company profile found: {company_profile}")
            
            if company_profile.logo:
                # Конвертируем относительный URL в абсолютный
                current_site = get_current_site(request)
                logo_url = f"{request.scheme}://{current_site.domain}{company_profile.logo.url}"
                # Получаем абсолютный путь к файлу логотипа
                from django.conf import settings
                import os
                import base64
                import mimetypes
                
                logo_path = os.path.join(settings.MEDIA_ROOT, company_profile.logo.name)
                
                # Создаем data URI для изображения
                try:
                    with open(logo_path, 'rb') as img_file:
                        logo_binary = img_file.read()
                        logo_base64 = base64.b64encode(logo_binary).decode('utf-8')
                        mime_type, _ = mimetypes.guess_type(logo_path)
                        if not mime_type:
                            mime_type = 'image/png'  # По умолчанию
                        logo_data_uri = f"data:{mime_type};base64,{logo_base64}"
                        print("Logo embedded as data URI")
                except Exception as e:
                    print(f"Error creating data URI for logo: {str(e)}")
                
                print(f"Logo path: {logo_path}")
                print(f"Absolute logo URL: {logo_url}")
        except Exception as e:
            print(f"Error getting company profile: {str(e)}")
            pass
        
        # Подготовка контекста для шаблона
        context = {
            'invoice': invoice,
            'invoice_items': invoice.items.all(),
            'company_profile': company_profile,
            'logo_url': logo_url,
            'logo_path': logo_path,
            'logo_data_uri': logo_data_uri
        }
        
        # Использовать HTML для создания PDF
        from django.template.loader import get_template
        from weasyprint import HTML, CSS
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
        
        # Генерируем PDF из HTML с улучшенной обработкой ресурсов
        # Создаем временный HTML файл для лучшей обработки ресурсов
        with tempfile.NamedTemporaryFile(suffix='.html', delete=False, mode='w+', encoding='utf-8') as tmp:
            tmp.write(html_string)
            tmp_path = tmp.name
        
        # Используем временный файл для генерации PDF
        pdf = HTML(filename=tmp_path, base_url=base_url).write_pdf()
        response.write(pdf)
        
        # Удаляем временный файл
        os.unlink(tmp_path)
        
        return response
        
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    except Exception as e:
        messages.error(request, f'Ошибка при генерации PDF: {str(e)}')
        return redirect('invoices:detail', pk=pk)

@login_required
@require_POST
def mark_invoice_paid(request, pk):
    """Отмечает счет как оплаченный"""
    try:
        invoice = Invoice.objects.get(pk=pk)
        
        # Проверяем, принадлежит ли счет текущему пользователю
        if invoice.user != request.user:
            return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому счету'})
        
        # Обновляем статус счета
        invoice.status = 'paid'
        invoice.payment_date = datetime.now().date()
        invoice.save()
        
        return JsonResponse({'success': True})
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Счет не найден'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
@require_POST
def delete_invoice(request, pk):
    """Удаляет счет"""
    try:
        invoice = Invoice.objects.get(pk=pk)
        
        # Проверяем, принадлежит ли счет текущему пользователю
        if invoice.user != request.user:
            return JsonResponse({'success': False, 'error': 'У вас нет доступа к этому счету'})
        
        # Удаляем счет
        invoice.delete()
        
        return JsonResponse({'success': True})
    except Invoice.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Счет не найден'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@login_required
def duplicate_invoice(request, pk):
    """Создает копию существующего счета"""
    try:
        # Получаем исходный счет
        original_invoice = Invoice.objects.get(pk=pk)
        
        # Генерируем новый номер счета для текущего пользователя
        next_invoice_number = get_next_invoice_number(request.user, original_invoice.invoice_type)
        
        # Создаем новый счет на основе существующего
        new_invoice = Invoice(
            number=next_invoice_number,
            client=original_invoice.client,
            issue_date=datetime.now().date(),
            due_date=datetime.now().date() + timedelta(days=15),  # Устанавливаем новый срок оплаты через 15 дней
            status='copy',  # Статус для копий
            supplier_name=original_invoice.supplier_name,
            supplier_address=original_invoice.supplier_address,
            supplier_inn=original_invoice.supplier_inn,
            supplier_kpp=original_invoice.supplier_kpp,
            supplier_bank=original_invoice.supplier_bank,
            supplier_bank_account=original_invoice.supplier_bank_account,
            supplier_bank_bik=original_invoice.supplier_bank_bik,
            supplier_bank_corr_account=original_invoice.supplier_bank_corr_account,
            notes=original_invoice.notes,
            payment_info=original_invoice.payment_info,
            subtotal=original_invoice.subtotal,
            tax_rate=original_invoice.tax_rate,
            tax_amount=original_invoice.tax_amount,
            discount=original_invoice.discount,
            total=original_invoice.total,
            director_name=original_invoice.director_name,
            accountant_name=original_invoice.accountant_name,
            user=request.user,  # Явно устанавливаем пользователя
            invoice_type=original_invoice.invoice_type  # Сохраняем тип счета
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
        
        # Пересчитываем суммы нового счета
        new_invoice.calculate_totals()
        new_invoice.save()
        
        messages.success(request, f'Создана копия счета: {new_invoice.number}')
        
        # Перенаправляем на страницу нового счета
        return redirect('invoices:detail', pk=new_invoice.id)
    
    except Invoice.DoesNotExist:
        messages.error(request, 'Счет не найден')
        return redirect('invoices:list')
    
    except Exception as e:
        messages.error(request, f'Ошибка при дублировании счета: {str(e)}')
        return redirect('invoices:list')

@login_required
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
                        # Используем модель Supplier вместо Client с entity_type
                        supplier = Supplier.objects.get(pk=supplier_id)
                        invoice.supplier_name = supplier.name
                        invoice.supplier_tax_id = supplier.tax_id
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
                item_discounts = request.POST.getlist('item_discount[]')
                
                # Получаем общую скидку
                try:
                    discount = Decimal(request.POST.get('discount', '0').replace(',', '.'))
                except (ValueError, InvalidOperation):
                    discount = Decimal('0')
                
                # Создаем новые позиции
                subtotal = Decimal('0')
                
                for i in range(len(item_names)):
                    if item_names[i] and item_quantities[i] and item_prices[i]:
                        try:
                            quantity = Decimal(item_quantities[i].replace(',', '.'))
                            price = Decimal(item_prices[i].replace(',', '.'))
                            item_discount = Decimal(item_discounts[i].replace(',', '.')) if i < len(item_discounts) and item_discounts[i] else Decimal('0')
                            amount = (quantity * price) - item_discount
                        except (ValueError, InvalidOperation):
                            quantity = Decimal('1')
                            price = Decimal('0')
                            item_discount = Decimal('0')
                            amount = Decimal('0')
                        
                        invoice_item = InvoiceItem(
                            invoice=invoice,
                            description=item_names[i],
                            quantity=quantity,
                            unit="шт.",  # Можно добавить поле для выбора единиц измерения
                            price=price,
                            discount=item_discount,
                            amount=amount
                        )
                        invoice_item.save()
                        
                        subtotal += amount
                
                # Обновляем итоговые суммы
                invoice.subtotal = subtotal
                invoice.tax_rate = Decimal('20')  # Можно сделать настраиваемым
                invoice.tax_amount = subtotal * Decimal('0.20')
                invoice.discount = discount
                invoice.total = invoice.subtotal + invoice.tax_amount - invoice.discount
                
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
            # Используем модель Supplier вместо Client с entity_type
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
        'subtotal': Decimal('10000.00'),
        'tax_rate': Decimal('20'),
        'tax_amount': Decimal('2000.00'),
        'total': Decimal('12000.00'),
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
            'quantity': Decimal('1'),
            'unit': 'усл.',
            'price': Decimal('8000.00'),
            'amount': Decimal('8000.00'),
        },
        {
            'description': 'Настройка и оптимизация',
            'quantity': Decimal('2'),
            'unit': 'час',
            'price': Decimal('1000.00'),
            'amount': Decimal('2000.00'),
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
