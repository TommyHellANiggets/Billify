from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.http import JsonResponse
from django.views.decorators.http import require_GET
from django.db.models import Q
import re
from django.urls import reverse

from .models import Client
from suppliers.models import Supplier

# Функции для валидации финансовых реквизитов
def validate_inn(inn, is_business):
    """Валидация ИНН"""
    if not inn:
        return True, ""
    
    # Проверка длины ИНН (10 цифр для юр. лиц, 12 для физ. лиц)
    if is_business and len(inn) != 10:
        return False, "ИНН юридического лица должен содержать 10 цифр"
    elif not is_business and len(inn) != 12:
        return False, "ИНН физического лица должен содержать 12 цифр"
    
    # Проверка, что ИНН содержит только цифры
    if not inn.isdigit():
        return False, "ИНН должен содержать только цифры"
    
    return True, ""

def validate_kpp(kpp):
    """Валидация КПП"""
    if not kpp:
        return True, ""
    
    # Проверка длины КПП (9 цифр)
    if len(kpp) != 9:
        return False, "КПП должен содержать 9 цифр"
    
    # Проверка, что КПП содержит только цифры
    if not kpp.isdigit():
        return False, "КПП должен содержать только цифры"
    
    return True, ""

def validate_ogrn(ogrn, is_business):
    """Валидация ОГРН/ОГРНИП"""
    if not ogrn:
        return True, ""
    
    # Проверка длины ОГРН (13 цифр для юр. лиц, 15 для ИП)
    if is_business and len(ogrn) != 13:
        return False, "ОГРН юридического лица должен содержать 13 цифр"
    elif not is_business and len(ogrn) != 15:
        return False, "ОГРНИП физического лица должен содержать 15 цифр"
    
    # Проверка, что ОГРН содержит только цифры
    if not ogrn.isdigit():
        return False, "ОГРН должен содержать только цифры"
    
    return True, ""

def validate_bik(bik):
    """Валидация БИК"""
    if not bik:
        return True, ""
    
    # Проверка длины БИК (9 цифр)
    if len(bik) != 9:
        return False, "БИК должен содержать 9 цифр"
    
    # Проверка, что БИК содержит только цифры
    if not bik.isdigit():
        return False, "БИК должен содержать только цифры"
    
    return True, ""

def validate_bank_account(account):
    """Валидация расчетного счета"""
    if not account:
        return True, ""
    
    # Проверка длины расчетного счета (20 цифр)
    if len(account) != 20:
        return False, "Расчетный счет должен содержать 20 цифр"
    
    # Проверка, что расчетный счет содержит только цифры
    if not account.isdigit():
        return False, "Расчетный счет должен содержать только цифры"
    
    return True, ""

def validate_bank_corr_account(account):
    """Валидация корреспондентского счета"""
    if not account:
        return True, ""
    
    # Проверка длины корр. счета (20 цифр)
    if len(account) != 20:
        return False, "Корреспондентский счет должен содержать 20 цифр"
    
    # Проверка, что корр. счет содержит только цифры
    if not account.isdigit():
        return False, "Корреспондентский счет должен содержать только цифры"
    
    return True, ""

@login_required
def client_list(request):
    """Список клиентов и поставщиков"""
    search_query = request.GET.get('search', '')
    client_type = request.GET.get('type', '')
    entity_type = request.GET.get('entity_type', 'all')  # all, client, supplier
    
    # Получаем клиентов текущего пользователя
    clients = Client.objects.filter(user=request.user, is_active=True)
    
    # Получаем поставщиков текущего пользователя
    suppliers = Supplier.objects.filter(user=request.user, is_active=True)
    
    # Фильтрация по поисковому запросу
    if search_query:
        clients = clients.filter(Q(name__icontains=search_query) | Q(tax_id__icontains=search_query))
        suppliers = suppliers.filter(Q(name__icontains=search_query) | Q(inn__icontains=search_query))
    
    # Фильтрация по типу клиента (только для клиентов)
    if client_type and client_type in dict(Client.TYPE_CHOICES):
        clients = clients.filter(type=client_type)
    
    # Фильтрация по типу сущности
    if entity_type == 'client':
        suppliers = Supplier.objects.none()  # Пустой QuerySet для поставщиков
    elif entity_type == 'supplier':
        clients = Client.objects.none()  # Пустой QuerySet для клиентов
    
    # Преобразуем поставщиков в формат, совместимый с шаблоном
    supplier_list = []
    for supplier in suppliers:
        supplier_list.append({
            'id': f"s_{supplier.id}",  # Префикс для отличия от клиентов
            'name': supplier.name,
            'email': supplier.email,
            'phone': supplier.phone,
            'tax_id': supplier.inn,
            'address': supplier.address,
            'is_supplier': True,  # Флаг для определения типа в шаблоне
            'type': supplier.type,
            'type_display': dict(Supplier.TYPE_CHOICES).get(supplier.type, '-')  # Отображаемое значение типа
        })
    
    # Преобразуем клиентов в формат, совместимый с шаблоном
    client_list = []
    for client in clients:
        client_list.append({
            'id': f"c_{client.id}",  # Префикс для отличия от поставщиков
            'name': client.name,
            'email': client.email,
            'phone': client.phone,
            'tax_id': client.tax_id,
            'address': client.address,
            'is_supplier': False,  # Флаг для определения типа в шаблоне
            'type': client.type,
            'type_display': dict(Client.TYPE_CHOICES).get(client.type, '-')  # Отображаемое значение типа
        })
    
    # Объединяем списки
    entities = client_list + supplier_list
    
    # Пагинация объединенного списка
    paginator = Paginator(entities, 10)  # 10 элементов на странице
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'title': 'Клиенты и поставщики',
        'entities': page_obj,
        'search_query': search_query,
        'client_type': client_type,
        'entity_type': entity_type,
        'client_types': Client.TYPE_CHOICES,
    }
    
    return render(request, 'clients/list.html', context)

@login_required
def client_detail(request, client_id):
    """Детальная информация о клиенте или поставщике"""
    # Проверяем, является ли id клиентом или поставщиком
    if client_id.startswith('s_'):
        # Это поставщик
        supplier_id = client_id[2:]  # Убираем префикс s_
        entity = get_object_or_404(Supplier, id=supplier_id, user=request.user, is_active=True)
        entity.entity_type = 'supplier'  # Добавляем свойство для шаблона
        is_supplier = True
        # Добавляем методы для совместимости с шаблоном
        entity.get_edit_url = lambda: reverse('clients:edit', args=[client_id])
        entity.get_delete_url = lambda: reverse('clients:delete', args=[client_id])
        entity.get_entity_type_display = lambda: 'Поставщик'
    else:
        # Это клиент
        if client_id.startswith('c_'):
            client_id_clean = client_id[2:]  # Убираем префикс c_, если есть
        else:
            client_id_clean = client_id
            client_id = f'c_{client_id}'  # Добавляем префикс для URL
        
        entity = get_object_or_404(Client, id=client_id_clean, user=request.user, is_active=True)
        entity.entity_type = 'client'  # Добавляем свойство для шаблона
        entity.get_entity_type_display = lambda: 'Клиент'
        is_supplier = False
    
    context = {
        'title': f'{"Поставщик" if is_supplier else "Клиент"}: {entity.name}',
        'entity': entity,
        'client': entity,  # Добавляем entity как client для совместимости с шаблоном
        'is_supplier': is_supplier
    }
    
    return render(request, 'clients/detail.html', context)

@login_required
def client_create(request):
    """Создание нового клиента или поставщика"""
    # Получаем тип сущности из параметров запроса
    entity_type = request.GET.get('entity_type', 'client')
    is_supplier = (entity_type == 'supplier')
    
    if request.method == 'POST':
        # Получаем тип сущности из POST данных
        entity_type = request.POST.get('entity_type', 'client')
        is_supplier = (entity_type == 'supplier')
        
        # Общие данные для обоих типов
        type_ = request.POST.get('type', 'individual')
        is_business = (type_ == 'business')
        name = request.POST.get('name', '')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '')
        address = request.POST.get('address', '')
        tax_id = request.POST.get('tax_id', '')  # ИНН
        kpp = request.POST.get('kpp', '')
        ogrn = request.POST.get('ogrn', '')
        bank_name = request.POST.get('bank_name', '')
        bank_account = request.POST.get('bank_account', '')
        bank_bik = request.POST.get('bank_bik', '')
        bank_corr_account = request.POST.get('bank_corr_account', '')
        contact_person = request.POST.get('contact_person', '')
        contact_email = request.POST.get('contact_email', '')
        comment = request.POST.get('comment', '')
        
        # Валидация данных
        errors = []
        
        if not name:
            errors.append(f'Введите название {"поставщика" if is_supplier else "клиента"}')
        
        # Валидация финансовых реквизитов
        valid, error = validate_inn(tax_id, is_business)
        if not valid:
            errors.append(error)
        
        valid, error = validate_kpp(kpp)
        if not valid:
            errors.append(error)
        
        valid, error = validate_ogrn(ogrn, is_business)
        if not valid:
            errors.append(error)
        
        valid, error = validate_bik(bank_bik)
        if not valid:
            errors.append(error)
        
        valid, error = validate_bank_account(bank_account)
        if not valid:
            errors.append(error)
        
        valid, error = validate_bank_corr_account(bank_corr_account)
        if not valid:
            errors.append(error)
        
        # Если нет ошибок, создаем новую запись
        if not errors:
            if is_supplier:
                # Создаем поставщика в модели Supplier
                supplier = Supplier.objects.create(
                    user=request.user,
                    type=type_,
                    name=name,
                    email=email,
                    phone=phone,
                    address=address,
                    inn=tax_id,  # ИНН для поставщика называется inn
                    kpp=kpp,
                    ogrn=ogrn,
                    bank_name=bank_name,
                    bank_account=bank_account,
                    bank_bik=bank_bik,
                    bank_corr_account=bank_corr_account,
                    contact_person=contact_person,
                    contact_email=contact_email,
                    comment=comment
                )
                messages.success(request, f'Поставщик {supplier.name} успешно создан')
                return redirect('clients:detail', client_id=f's_{supplier.id}')
            else:
                # Создаем клиента в модели Client
                client = Client.objects.create(
                    user=request.user,
                    type=type_,
                    name=name,
                    email=email,
                    phone=phone,
                    address=address,
                    tax_id=tax_id,
                    kpp=kpp,
                    ogrn=ogrn,
                    bank_name=bank_name,
                    bank_account=bank_account,
                    bank_bik=bank_bik,
                    bank_corr_account=bank_corr_account,
                    contact_person=contact_person,
                    contact_email=contact_email,
                    comment=comment
                )
                messages.success(request, f'Клиент {client.name} успешно создан')
                return redirect('clients:detail', client_id=f'c_{client.id}')
        else:
            # Если есть ошибки, выводим их пользователю
            for error in errors:
                messages.error(request, error)
            
            # Возвращаем форму с введенными данными
            context = {
                'title': f'Новый {"поставщик" if is_supplier else "клиент"}',
                'is_supplier': is_supplier,
                'form_data': request.POST  # Для восстановления введенных данных
            }
            return render(request, 'clients/create.html', context)
    
    context = {
        'title': f'Новый {"поставщик" if is_supplier else "клиент"}',
        'is_supplier': is_supplier
    }
    
    return render(request, 'clients/create.html', context)

@login_required
def client_edit(request, client_id):
    """Редактирование клиента или поставщика"""
    # Определяем тип сущности по префиксу
    is_supplier = client_id.startswith('s_')
    
    if is_supplier:
        # Редактирование поставщика
        supplier_id = client_id[2:]  # Убираем префикс s_
        entity = get_object_or_404(Supplier, id=supplier_id, user=request.user, is_active=True)
        
        if request.method == 'POST':
            # Обновление данных поставщика
            entity.type = request.POST.get('type')
            entity.name = request.POST.get('name')
            entity.email = request.POST.get('email', '')
            entity.phone = request.POST.get('phone', '')
            entity.address = request.POST.get('address', '')
            entity.inn = request.POST.get('tax_id', '')
            entity.kpp = request.POST.get('kpp', '')
            entity.ogrn = request.POST.get('ogrn', '')
            entity.bank_name = request.POST.get('bank_name', '')
            entity.bank_account = request.POST.get('bank_account', '')
            entity.bank_bik = request.POST.get('bank_bik', '')
            entity.bank_corr_account = request.POST.get('bank_corr_account', '')
            entity.contact_person = request.POST.get('contact_person', '')
            entity.contact_email = request.POST.get('contact_email', '')
            entity.comment = request.POST.get('comment', '')
            
            if not entity.name:
                messages.error(request, 'Введите название поставщика')
                return render(request, 'clients/edit.html', {'title': 'Редактирование поставщика', 'entity': entity, 'is_supplier': True})
            
            entity.save()
            messages.success(request, f'Данные поставщика {entity.name} обновлены')
            return redirect('clients:detail', client_id=f's_{entity.id}')
    else:
        # Редактирование клиента
        if client_id.startswith('c_'):
            client_id_clean = client_id[2:]  # Убираем префикс c_, если есть
        else:
            client_id_clean = client_id
        
        entity = get_object_or_404(Client, id=client_id_clean, user=request.user, is_active=True)
        
        if request.method == 'POST':
            # Обновление данных клиента
            entity.type = request.POST.get('type')
            entity.name = request.POST.get('name')
            entity.email = request.POST.get('email', '')
            entity.phone = request.POST.get('phone', '')
            entity.address = request.POST.get('address', '')
            entity.tax_id = request.POST.get('tax_id', '')
            entity.kpp = request.POST.get('kpp', '')
            entity.ogrn = request.POST.get('ogrn', '')
            entity.bank_name = request.POST.get('bank_name', '')
            entity.bank_account = request.POST.get('bank_account', '')
            entity.bank_bik = request.POST.get('bank_bik', '')
            entity.bank_corr_account = request.POST.get('bank_corr_account', '')
            entity.contact_person = request.POST.get('contact_person', '')
            entity.contact_email = request.POST.get('contact_email', '')
            entity.comment = request.POST.get('comment', '')
            
            if not entity.name:
                messages.error(request, 'Введите название клиента')
                return render(request, 'clients/edit.html', {'title': 'Редактирование клиента', 'entity': entity, 'is_supplier': False})
            
            entity.save()
            messages.success(request, f'Данные клиента {entity.name} обновлены')
            return redirect('clients:detail', client_id=f'c_{entity.id}')
    
    context = {
        'title': f'Редактирование {"поставщика" if is_supplier else "клиента"}',
        'entity': entity,
        'is_supplier': is_supplier
    }
    
    return render(request, 'clients/edit.html', context)

@login_required
def client_delete(request, client_id):
    """Удаление клиента или поставщика"""
    # Определяем тип сущности по префиксу
    is_supplier = client_id.startswith('s_')
    
    if is_supplier:
        # Удаление поставщика
        supplier_id = client_id[2:]  # Убираем префикс s_
        entity = get_object_or_404(Supplier, id=supplier_id, user=request.user, is_active=True)
        entity_name = entity.name
        
        # Добавляем id с префиксом для шаблона
        entity.id = client_id
        
        if request.method == 'POST':
            entity.is_active = False
            entity.save()
            messages.success(request, f'Поставщик {entity_name} удален')
            return redirect('clients:list')
    else:
        # Удаление клиента
        if client_id.startswith('c_'):
            client_id_clean = client_id[2:]  # Убираем префикс c_, если есть
        else:
            client_id_clean = client_id
        
        entity = get_object_or_404(Client, id=client_id_clean, user=request.user, is_active=True)
        entity_name = entity.name
        
        # Добавляем id с префиксом для шаблона
        if not client_id.startswith('c_'):
            entity.id = f'c_{entity.id}'
        else:
            entity.id = client_id
        
        if request.method == 'POST':
            entity.is_active = False
            entity.save()
            messages.success(request, f'Клиент {entity_name} удален')
            return redirect('clients:list')
    
    context = {
        'title': f'Удаление {"поставщика" if is_supplier else "клиента"}',
        'client': entity,  # Используем client вместо entity для соответствия шаблону
        'is_supplier': is_supplier
    }
    
    return render(request, 'clients/delete.html', context)

@login_required
@require_GET
def client_api_get(request, client_id):
    """API для получения данных клиента или поставщика"""
    # Определяем тип сущности по префиксу
    is_supplier = client_id.startswith('s_')
    
    try:
        if is_supplier:
            # Получение данных поставщика
            supplier_id = client_id[2:]  # Убираем префикс s_
            entity = get_object_or_404(Supplier, id=supplier_id, user=request.user, is_active=True)
            
            data = {
                'id': f's_{entity.id}',
                'name': entity.name,
                'type': entity.type,
                'email': entity.email,
                'phone': entity.phone,
                'address': entity.address,
                'tax_id': entity.inn,
                'kpp': entity.kpp,
                'ogrn': entity.ogrn,
                'bank_name': entity.bank_name,
                'bank_account': entity.bank_account,
                'bank_bik': entity.bank_bik,
                'bank_corr_account': entity.bank_corr_account,
                'contact_person': entity.contact_person,
                'contact_email': entity.contact_email,
                'is_supplier': True
            }
        else:
            # Получение данных клиента
            if client_id.startswith('c_'):
                client_id_clean = client_id[2:]  # Убираем префикс c_, если есть
            else:
                client_id_clean = client_id
            
            entity = get_object_or_404(Client, id=client_id_clean, user=request.user, is_active=True)
            
            data = {
                'id': f'c_{entity.id}',
                'name': entity.name,
                'type': entity.type,
                'email': entity.email,
                'phone': entity.phone,
                'address': entity.address,
                'tax_id': entity.tax_id,
                'kpp': entity.kpp,
                'ogrn': entity.ogrn,
                'bank_name': entity.bank_name,
                'bank_account': entity.bank_account,
                'bank_bik': entity.bank_bik,
                'bank_corr_account': entity.bank_corr_account,
                'contact_person': entity.contact_person,
                'contact_email': entity.contact_email,
                'is_supplier': False
            }
        
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
