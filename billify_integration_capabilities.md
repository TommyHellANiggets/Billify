# Интеграционные возможности Billify

## 1. Общий обзор

Проект Billify имеет несколько интеграционных возможностей, однако многие из них еще не полностью реализованы. Согласно документации и техническому заданию (tz.md, tz.txt, diplom/diplom.txt), в планах разработки системы были предусмотрены следующие интеграционные возможности:

- RESTful API для интеграции с внешними системами
- Экспорт данных в различных форматах (Excel, PDF, CSV)
- Интеграция с банками и платежными системами
- Интеграция с налоговыми системами

## 2. RESTful API для внешних систем

### 2.1. Текущая реализация API

В текущей версии проекта реализованы базовые API-эндпоинты для некоторых сущностей:

#### Клиенты и поставщики:

- `GET /clients-suppliers/api/get/<str:client_id>/` - получение данных клиента
- `GET /suppliers/api/get/<int:supplier_id>/` - получение данных поставщика

Пример ответа API для клиента:
```json
{
  "success": true,
  "data": {
    "id": "c_123",
    "name": "Имя клиента",
    "type": "individual",
    "email": "client@example.com",
    "phone": "+7 123 456 7890",
    "address": "Адрес клиента",
    "tax_id": "1234567890",
    "kpp": "123456789",
    "ogrn": "1234567890123",
    "bank_name": "Название банка",
    "bank_account": "40702810123456789012",
    "bank_bik": "044525225",
    "bank_corr_account": "30101810400000000225",
    "contact_person": "Контактное лицо",
    "contact_email": "contact@example.com",
    "is_supplier": false
  }
}
```

### 2.2. Отсутствующие компоненты API

В разделе "missing_features_analysis.md" указано, что для полноценного API не хватает:
- API для подключения внешних сервисов
- Интеграция с CRM и ERP системами
- Документированного API с аутентификацией через API-ключи или OAuth

Согласно tz.md, в планах было создание:
- Документированного API для интеграции с внешними системами
- Аутентификации через API-ключи или OAuth

## 3. Поддержка форматов экспорта (Excel, PDF)

### 3.1. Экспорт в PDF

В проекте реализована генерация PDF-документов для счетов:

- Маршрут: `/invoices/<int:pk>/pdf/` - генерация PDF для конкретного счета
- Реализация: Функция `invoice_pdf` в `invoices/views.py`
- Технологии: Используется библиотека WeasyPrint для преобразования HTML в PDF
- Шаблоны: Используется шаблон `invoices/pdf_template.html`

Пример кода для генерации PDF:
```python
def invoice_pdf(request, pk):
    """Генерация PDF для счета"""
    try:
        invoice = Invoice.objects.prefetch_related('items').get(pk=pk)
        
        # Получаем компанию пользователя
        company_profile = None
        logo_url = None
        try:
            company_profile = request.user.company_profile
            
            if company_profile.logo:
                # Конвертируем относительный URL в абсолютный
                current_site = get_current_site(request)
                logo_url = f"{request.scheme}://{current_site.domain}{company_profile.logo.url}"
        except Exception as e:
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
        
        # Рендерим HTML шаблон
        template = get_template('invoices/pdf_template.html')
        html_string = template.render(context)
        
        # Создаем файл PDF
        response = HttpResponse(content_type='application/pdf')
        filename = f"invoice_{invoice.number.replace(' ', '_').replace('/', '_')}.pdf"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        # Генерируем PDF из HTML с указанием base_url для ресурсов
        base_url = request.build_absolute_uri('/').rstrip('/')
        HTML(string=html_string, base_url=base_url).write_pdf(response)
        
        return response
        
    except Exception as e:
        messages.error(request, f'Ошибка при генерации PDF: {str(e)}')
        return redirect('invoices:detail', pk=pk)
```

### 3.2. Экспорт в Excel

Несмотря на упоминания в документации (tz.md, diplom/diplom.txt) о поддержке экспорта в Excel, в текущей реализации проекта не найдено конкретных функций для экспорта данных в Excel.

В requirements.txt присутствует библиотека `openpyxl==3.1.2`, которая предназначена для работы с Excel-файлами в Python, но не найдено кода, использующего ее для экспорта.

## 4. Сканирование PDF

В дополнение к экспорту, в системе реализован функционал сканирования PDF-документов:

- Маршрут: `/invoices/scan/pdf/` - сканирование загруженного PDF-файла
- Реализация: Функция `scan_invoice_pdf` в `invoices/scan_views.py`
- JavaScript: `static/js/invoices/scanner.js`
- CSS: `static/css/invoices/scanner.css`

Функционал позволяет загружать PDF-файлы счетов и автоматически извлекать из них данные.

## 5. Текущие ограничения и планы на будущее

### 5.1. Отсутствующие компоненты

Согласно анализу в "missing_features_analysis.md", в системе отсутствуют:

1. Интеграция с другими бизнес-системами:
   - Отсутствует полноценный API для подключения внешних сервисов
   - Нет интеграции с CRM и ERP системами

2. Электронный документооборот (ЭДО):
   - Нет интеграции с операторами ЭДО (Диадок, СБИС)
   - Отсутствует возможность цифровой подписи документов

3. Интеграция с банками:
   - Отсутствует автоматическая загрузка и сверка банковских выписок
   - Нет интеграции с системами клиент-банк

### 5.2. Планы на будущее

Согласно техническому заданию (tz.md) и дипломной работе (diplom/diplom.txt), в будущем планируется:

1. Развитие API:
   - Документирование API для внешних систем
   - Внедрение аутентификации через API-ключи или OAuth

2. Расширение форматов экспорта:
   - Добавление экспорта в Excel и CSV
   - Экспорт отчетов в различных форматах

3. Интеграция с:
   - Налоговыми системами
   - Банковскими системами
   - Операторами ЭДО
   - Системами автоматического обновления курсов валют

## 6. Выводы

Текущая реализация интеграционных возможностей Billify ограничена базовым API для получения данных о клиентах и поставщиках, а также генерацией PDF-документов для счетов. Поддержка экспорта в Excel запланирована, но пока не реализована.

Для превращения Billify в полноценную интеграционную платформу необходимо развитие API, добавление механизмов аутентификации, расширение поддерживаемых форматов экспорта и интеграция с внешними системами. 