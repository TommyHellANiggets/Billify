from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from .models import Supplier

def supplier_list(request):
    suppliers = Supplier.objects.filter(is_active=True)
    return render(request, 'suppliers/list.html', {
        'suppliers': suppliers,
        'active_tab': 'suppliers'
    })

def supplier_detail(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id)
    return render(request, 'suppliers/detail.html', {
        'supplier': supplier,
        'active_tab': 'suppliers'
    })

def supplier_create(request):
    # Здесь будет реализация создания поставщика
    # с использованием форм Django
    return render(request, 'suppliers/form.html', {
        'active_tab': 'suppliers'
    })

def supplier_edit(request, supplier_id):
    supplier = get_object_or_404(Supplier, id=supplier_id)
    # Здесь будет реализация редактирования поставщика
    # с использованием форм Django
    return render(request, 'suppliers/form.html', {
        'supplier': supplier,
        'active_tab': 'suppliers'
    })

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