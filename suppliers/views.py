from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, Http404
from django.views.decorators.http import require_GET
from .models import Supplier
import logging
from django.urls import reverse

@login_required
def supplier_list(request):
    suppliers = Supplier.objects.filter(is_active=True)
    return render(request, 'suppliers/list.html', {
        'suppliers': suppliers,
        'active_tab': 'suppliers'
    })

@login_required
def supplier_detail(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id)
    return render(request, 'suppliers/detail.html', {
        'supplier': supplier,
        'active_tab': 'suppliers'
    })

@login_required
def supplier_create(request):
    """Создание нового поставщика"""
    if request.method == 'POST':
        type_ = request.POST.get('type', 'business')
        name = request.POST.get('name', '')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '')
        address = request.POST.get('address', '')
        inn = request.POST.get('inn', '')
        kpp = request.POST.get('kpp', '')
        ogrn = request.POST.get('ogrn', '')
        bank_name = request.POST.get('bank_name', '')
        bank_account = request.POST.get('bank_account', '')
        bank_bik = request.POST.get('bank_bik', '')
        bank_corr_account = request.POST.get('bank_corr_account', '')
        contact_person = request.POST.get('contact_person', '')
        contact_email = request.POST.get('contact_email', '')
        
        if not name:
            messages.error(request, 'Введите название поставщика')
            return render(request, 'clients/create.html', {'title': 'Новый поставщик', 'is_supplier': True})
        
        supplier = Supplier.objects.create(
            user=request.user,
            type=type_,
            name=name,
            email=email,
            phone=phone,
            address=address,
            inn=inn,
            kpp=kpp,
            ogrn=ogrn,
            bank_name=bank_name,
            bank_account=bank_account,
            bank_bik=bank_bik,
            bank_corr_account=bank_corr_account,
            contact_person=contact_person,
            contact_email=contact_email
        )
        
        messages.success(request, f'Поставщик {supplier.name} успешно создан')
        return redirect('clients:detail', client_id=f's_{supplier.id}')
    
    context = {
        'title': 'Создание нового поставщика',
        'is_supplier': True,
        'supplier_types': Supplier.TYPE_CHOICES,
        'active_tab': 'suppliers'
    }
    
    return render(request, 'clients/create.html', context)

@login_required
def supplier_edit(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id, user=request.user)
    
    if request.method == 'POST':
        # Обновление данных поставщика
        supplier.type = request.POST.get('type')
        supplier.name = request.POST.get('name')
        supplier.email = request.POST.get('email', '')
        supplier.phone = request.POST.get('phone', '')
        supplier.address = request.POST.get('address', '')
        supplier.inn = request.POST.get('tax_id', '')
        supplier.kpp = request.POST.get('kpp', '')
        supplier.ogrn = request.POST.get('ogrn', '')
        supplier.bank_name = request.POST.get('bank_name', '')
        supplier.bank_account = request.POST.get('bank_account', '')
        supplier.bank_bik = request.POST.get('bank_bik', '')
        supplier.bank_corr_account = request.POST.get('bank_corr_account', '')
        supplier.contact_person = request.POST.get('contact_person', '')
        supplier.contact_email = request.POST.get('contact_email', '')
        
        if not supplier.name:
            messages.error(request, 'Введите название поставщика')
            return render(request, 'clients/create.html', {'title': 'Редактирование поставщика', 'entity': supplier, 'is_supplier': True})
        
        supplier.save()
        messages.success(request, f'Данные поставщика {supplier.name} обновлены')
        return redirect('clients:detail', client_id=f's_{supplier.id}')
    
    # Добавляем свойства для совместимости с шаблоном clients/create.html
    supplier.entity_type = 'supplier'
    supplier.get_edit_url = lambda: reverse('suppliers:edit', args=[supplier.id])
    supplier.get_delete_url = lambda: reverse('suppliers:delete', args=[supplier.id])
    
    # Формируем данные для формы на основе существующего поставщика
    form_data = {
        'type': supplier.type,
        'name': supplier.name,
        'email': supplier.email,
        'phone': supplier.phone,
        'address': supplier.address,
        'tax_id': supplier.inn,
        'kpp': supplier.kpp,
        'ogrn': supplier.ogrn,
        'bank_name': supplier.bank_name,
        'bank_account': supplier.bank_account,
        'bank_bik': supplier.bank_bik,
        'bank_corr_account': supplier.bank_corr_account,
        'contact_person': supplier.contact_person,
        'contact_email': supplier.contact_email,
    }
    
    context = {
        'title': 'Редактирование поставщика',
        'entity': supplier,  # Используем имя entity вместо supplier для совместимости
        'client': supplier,  # Для совместимости с шаблоном
        'is_supplier': True,
        'active_tab': 'suppliers',
        'form_data': form_data,  # Передаем данные формы для заполнения полей
        'edit_mode': True  # Флаг для шаблона, что это режим редактирования
    }
    
    return render(request, 'clients/create.html', context)

@login_required
def supplier_delete(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id)
    if request.method == 'POST':
        supplier.is_active = False
        supplier.save()
        messages.success(request, f'Поставщик "{supplier.name}" успешно удален')
        return redirect('suppliers:list')
    return render(request, 'suppliers/delete.html', {
        'supplier': supplier,
        'active_tab': 'suppliers'
    })

@login_required
@require_GET
def supplier_api_get(request, supplier_id):
    """API метод для получения данных о поставщике в формате JSON"""
    logger = logging.getLogger(__name__)
    logger.info(f"Запрос данных поставщика ID={supplier_id}")
    
    try:
        supplier = get_object_or_404(Supplier, id=supplier_id)
        logger.info(f"Поставщик найден: ID={supplier.id}, Name={supplier.name}")
        
        # Проверяем наличие полей и устанавливаем безопасные значения по умолчанию
        # Если в ответе поле tax_id вместо inn, клиент может его не распознать
        data = {
            'id': supplier.id,
            'name': supplier.name,
            'inn': supplier.inn or '',
            'tax_id': supplier.inn or '',  # Дублируем для совместимости
            'bank_name': supplier.bank_name or '',
            'bank_bik': supplier.bank_bik or '',
            'bank_account': supplier.bank_account or '',
            'bank_corr_account': supplier.bank_corr_account or '',
            'contact_person': supplier.contact_person or '',
            'contact_email': supplier.contact_email or ''
        }
        
        logger.info(f"Отправка данных поставщика: {data}")
        return JsonResponse(data)
    except Supplier.DoesNotExist:
        logger.warning(f"Поставщик с ID {supplier_id} не найден")
        return JsonResponse({
            'error': f'Поставщик с ID {supplier_id} не найден',
            'error_code': 'supplier_not_found'
        }, status=404)
    except Exception as e:
        # Более подробное логирование ошибки на сервере
        logger.error(f"Ошибка при получении данных поставщика ID={supplier_id}: {str(e)}", exc_info=True)
        
        return JsonResponse({
            'error': str(e),
            'error_code': 'server_error',
            'message': 'Произошла ошибка при получении данных поставщика'
        }, status=500) 