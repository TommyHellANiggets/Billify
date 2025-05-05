"""
Представления для сканирования PDF документов и извлечения данных счетов
"""

import os
import json
import logging
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from django.conf import settings

from .scan_utils import InvoiceScanner

logger = logging.getLogger(__name__)

@login_required
@require_POST
def scan_invoice_pdf(request):
    """
    Сканирует загруженный PDF-файл и извлекает данные счета
    
    POST-параметры:
        invoice_file: Загруженный PDF-файл
        scan_type: Тип сканирования (full - полный счет, items - только позиции)
        
    Returns:
        JsonResponse с результатами сканирования
    """
    try:
        if 'invoice_file' not in request.FILES:
            return JsonResponse({'success': False, 'error': 'Файл не загружен'})
        
        invoice_file = request.FILES['invoice_file']
        scan_type = request.POST.get('scan_type', 'items')
        
        # Проверяем расширение файла
        _, ext = os.path.splitext(invoice_file.name)
        if ext.lower() != '.pdf':
            return JsonResponse({
                'success': False, 
                'error': 'Загруженный файл должен быть в формате PDF'
            })
        
        # Создаем временный файл для сканирования
        temp_file_path = os.path.join(settings.MEDIA_ROOT, 'temp', f"scan_{request.user.id}_{invoice_file.name}")
        os.makedirs(os.path.dirname(temp_file_path), exist_ok=True)
        
        with open(temp_file_path, 'wb+') as destination:
            for chunk in invoice_file.chunks():
                destination.write(chunk)
        
        # Сканируем файл в зависимости от типа сканирования
        if scan_type == 'full':
            scan_data = InvoiceScanner.extract_data_from_pdf(temp_file_path)
            result = {
                'success': True,
                'data': scan_data
            }
        else:  # scan_type == 'items'
            items_data = InvoiceScanner.scan_invoice_items(temp_file_path)
            result = {
                'success': True,
                'items': items_data
            }
        
        # Удаляем временный файл
        try:
            os.remove(temp_file_path)
        except Exception as e:
            logger.warning(f"Не удалось удалить временный файл: {e}")
        
        return JsonResponse(result)
    
    except Exception as e:
        logger.error(f"Ошибка при сканировании PDF: {str(e)}", exc_info=True)
        return JsonResponse({
            'success': False,
            'error': f"Произошла ошибка при сканировании: {str(e)}"
        })

@login_required
@require_POST
def scan_invoice_items(request):
    """
    Сканирует PDF-файл и извлекает только позиции счета
    
    POST-параметры:
        invoice_file: Загруженный PDF-файл
        
    Returns:
        JsonResponse со списком позиций счета
    """
    request.POST._mutable = True
    request.POST['scan_type'] = 'items'
    request.POST._mutable = False
    return scan_invoice_pdf(request) 