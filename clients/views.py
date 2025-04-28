from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator

from .models import Client

@login_required
def client_list(request):
    """Список клиентов"""
    search_query = request.GET.get('search', '')
    client_type = request.GET.get('type', '')
    
    # Фильтрация по текущему пользователю
    clients = Client.objects.filter(user=request.user, is_active=True)
    
    if search_query:
        clients = clients.filter(name__icontains=search_query)
    
    if client_type and client_type in dict(Client.TYPE_CHOICES):
        clients = clients.filter(type=client_type)
    
    paginator = Paginator(clients, 10)  # 10 клиентов на странице
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'title': 'Клиенты',
        'clients': page_obj,
        'search_query': search_query,
        'client_type': client_type,
        'client_types': Client.TYPE_CHOICES
    }
    
    return render(request, 'clients/list.html', context)

@login_required
def client_detail(request, client_id):
    """Детальная информация о клиенте"""
    # Проверка что клиент принадлежит текущему пользователю
    client = get_object_or_404(Client, id=client_id, user=request.user, is_active=True)
    
    context = {
        'title': f'Клиент: {client.name}',
        'client': client
    }
    
    return render(request, 'clients/detail.html', context)

@login_required
def client_create(request):
    """Создание нового клиента"""
    if request.method == 'POST':
        # Здесь будет обработка формы
        client_type = request.POST.get('type')
        name = request.POST.get('name')
        email = request.POST.get('email', '')
        phone = request.POST.get('phone', '')
        address = request.POST.get('address', '')
        tax_id = request.POST.get('tax_id', '')
        kpp = request.POST.get('kpp', '')
        ogrn = request.POST.get('ogrn', '')
        bank_name = request.POST.get('bank_name', '')
        bank_account = request.POST.get('bank_account', '')
        bank_bik = request.POST.get('bank_bik', '')
        comment = request.POST.get('comment', '')
        
        if not name:
            messages.error(request, 'Введите имя клиента')
            return render(request, 'clients/create.html', {'title': 'Новый клиент'})
        
        client = Client(
            user=request.user,  # Привязка к текущему пользователю
            type=client_type,
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
            comment=comment
        )
        
        client.save()
        messages.success(request, f'Клиент {client.name} успешно создан')
        return redirect('clients:detail', client_id=client.id)
    
    return render(request, 'clients/create.html', {'title': 'Новый клиент'})

@login_required
def client_edit(request, client_id):
    """Редактирование клиента"""
    # Проверка что клиент принадлежит текущему пользователю
    client = get_object_or_404(Client, id=client_id, user=request.user, is_active=True)
    
    if request.method == 'POST':
        # Здесь будет обработка формы
        client.type = request.POST.get('type')
        client.name = request.POST.get('name')
        client.email = request.POST.get('email', '')
        client.phone = request.POST.get('phone', '')
        client.address = request.POST.get('address', '')
        client.tax_id = request.POST.get('tax_id', '')
        client.kpp = request.POST.get('kpp', '')
        client.ogrn = request.POST.get('ogrn', '')
        client.bank_name = request.POST.get('bank_name', '')
        client.bank_account = request.POST.get('bank_account', '')
        client.bank_bik = request.POST.get('bank_bik', '')
        client.comment = request.POST.get('comment', '')
        
        if not client.name:
            messages.error(request, 'Введите имя клиента')
            return render(request, 'clients/edit.html', {'title': 'Редактирование клиента', 'client': client})
        
        client.save()
        messages.success(request, f'Данные клиента {client.name} обновлены')
        return redirect('clients:detail', client_id=client.id)
    
    context = {
        'title': 'Редактирование клиента',
        'client': client
    }
    
    return render(request, 'clients/edit.html', context)

@login_required
def client_delete(request, client_id):
    """Удаление клиента"""
    # Проверка что клиент принадлежит текущему пользователю
    client = get_object_or_404(Client, id=client_id, user=request.user, is_active=True)
    
    if request.method == 'POST':
        client.is_active = False
        client.save()
        messages.success(request, f'Клиент {client.name} удален')
        return redirect('clients:list')
    
    context = {
        'title': 'Удаление клиента',
        'client': client
    }
    
    return render(request, 'clients/delete.html', context)
