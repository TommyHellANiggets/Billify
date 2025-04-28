from django.shortcuts import render

# Create your views here.

def invoice_list(request):
    """Список счетов"""
    return render(request, 'invoices/list.html', {
        'title': 'Счета'
    })

def invoice_detail(request, pk):
    """Детальная информация о счете"""
    return render(request, 'invoices/detail.html', {
        'title': 'Детали счета'
    })

def invoice_create(request):
    """Создание нового счета"""
    return render(request, 'invoices/create.html', {
        'title': 'Новый счет'
    })
