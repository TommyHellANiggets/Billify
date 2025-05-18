from django.shortcuts import render
from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, fields, Q
from django.db.models.functions import TruncMonth, TruncDay, ExtractDay
from invoices.models import Invoice, InvoiceItem
from clients.models import Client
from datetime import datetime, timedelta
import json
from decimal import Decimal
from django.utils import timezone
from django.contrib.auth.decorators import login_required

# Create your views here.

@login_required
def dashboard(request):
    """Панель аналитики с реальными данными из БД"""
    # Получаем данные для верхней сводки
    total_amount = Invoice.objects.aggregate(total=Sum('total')).get('total') or 0
    paid_amount = Invoice.objects.filter(status='paid').aggregate(total=Sum('total')).get('total') or 0
    overdue_amount = Invoice.objects.filter(status='overdue').aggregate(total=Sum('total')).get('total') or 0
    
    # Количество счетов по статусам
    status_counts = {
        'draft': Invoice.objects.filter(status='draft').count(),
        'sent': Invoice.objects.filter(status='sent').count(),
        'paid': Invoice.objects.filter(status='paid').count(),
        'overdue': Invoice.objects.filter(status='overdue').count(),
    }
    
    # Расчет процентного изменения по сравнению с предыдущим месяцем
    now = timezone.now()
    month_ago = now - timedelta(days=30)
    
    status_trends = {}
    for status, count in status_counts.items():
        prev_count = Invoice.objects.filter(
            status=status, 
            created_at__lt=month_ago
        ).count()
        
        if prev_count > 0:
            trend = ((count - prev_count) / prev_count) * 100
        else:
            trend = 100 if count > 0 else 0
            
        status_trends[status] = {
            'value': round(trend, 1),
            'is_up': trend >= 0
        }
    
    # Топ-5 клиентов по сумме счетов
    top_clients = Client.objects.annotate(
        total_invoices=Sum('invoices__total')
    ).exclude(
        total_invoices=None
    ).order_by('-total_invoices')[:5]
    
    top_clients_data = {
        'labels': [client.name for client in top_clients],
        'data': [float(client.total_invoices) for client in top_clients]
    }
    
    # Статистика по времени оплаты
    payment_time_stats = []
    
    # Счета, оплаченные в течение 1-3 дней
    payment_time_stats.append(
        Invoice.objects.filter(
            status='paid',
            payment_date__isnull=False,
            issue_date__isnull=False
        ).annotate(
            days=ExpressionWrapper(
                F('payment_date') - F('issue_date'),
                output_field=fields.IntegerField()
            )
        ).filter(days__lte=3).count()
    )
    
    # 4-7 дней
    payment_time_stats.append(
        Invoice.objects.filter(
            status='paid',
            payment_date__isnull=False,
            issue_date__isnull=False
        ).annotate(
            days=ExpressionWrapper(
                F('payment_date') - F('issue_date'),
                output_field=fields.IntegerField()
            )
        ).filter(days__gt=3, days__lte=7).count()
    )
    
    # 8-14 дней
    payment_time_stats.append(
        Invoice.objects.filter(
            status='paid',
            payment_date__isnull=False,
            issue_date__isnull=False
        ).annotate(
            days=ExpressionWrapper(
                F('payment_date') - F('issue_date'),
                output_field=fields.IntegerField()
            )
        ).filter(days__gt=7, days__lte=14).count()
    )
    
    # 15-30 дней
    payment_time_stats.append(
        Invoice.objects.filter(
            status='paid',
            payment_date__isnull=False,
            issue_date__isnull=False
        ).annotate(
            days=ExpressionWrapper(
                F('payment_date') - F('issue_date'),
                output_field=fields.IntegerField()
            )
        ).filter(days__gt=14, days__lte=30).count()
    )
    
    # >30 дней
    payment_time_stats.append(
        Invoice.objects.filter(
            status='paid',
            payment_date__isnull=False,
            issue_date__isnull=False
        ).annotate(
            days=ExpressionWrapper(
                F('payment_date') - F('issue_date'),
                output_field=fields.IntegerField()
            )
        ).filter(days__gt=30).count()
    )
    
    payment_time_data = {
        'labels': ['1-3 дня', '4-7 дней', '8-14 дней', '15-30 дней', '>30 дней'],
        'data': payment_time_stats
    }
    
    # Данные по доходам за последние 30 дней
    last_30_days = now - timedelta(days=30)
    daily_revenue = Invoice.objects.filter(
        issue_date__gte=last_30_days
    ).annotate(
        day=TruncDay('issue_date')
    ).values('day').annotate(
        total=Sum('total')
    ).order_by('day')
    
    revenue_labels_30d = []
    revenue_data_30d = []
    
    # Создаем словарь для быстрого доступа к данным по дате
    revenue_by_day = {item['day'].strftime('%d.%m'): float(item['total']) for item in daily_revenue}
    
    # Заполняем данные за последние 30 дней
    for i in range(30):
        day = (now - timedelta(days=29-i)).strftime('%d.%m')
        revenue_labels_30d.append(day)
        revenue_data_30d.append(revenue_by_day.get(day, 0))
    
    # Данные по месяцам за последние 6 месяцев
    last_6_months = now - timedelta(days=180)
    monthly_revenue = Invoice.objects.filter(
        issue_date__gte=last_6_months
    ).annotate(
        month=TruncMonth('issue_date')
    ).values('month').annotate(
        total=Sum('total')
    ).order_by('month')
    
    revenue_labels_6m = []
    revenue_data_6m = []
    
    # Заполняем данные за последние 6 месяцев
    revenue_by_month = {item['month'].strftime('%m.%Y'): float(item['total']) for item in monthly_revenue}
    
    month_names = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']
    
    for i in range(6):
        month_date = now - timedelta(days=30 * (5-i))
        month_key = month_date.strftime('%m.%Y')
        month_name = month_names[month_date.month - 1]
        revenue_labels_6m.append(month_name)
        revenue_data_6m.append(revenue_by_month.get(month_key, 0))
    
    # Данные по месяцам за последний год
    last_year = now - timedelta(days=365)
    yearly_revenue = Invoice.objects.filter(
        issue_date__gte=last_year
    ).annotate(
        month=TruncMonth('issue_date')
    ).values('month').annotate(
        total=Sum('total')
    ).order_by('month')
    
    revenue_labels_1y = []
    revenue_data_1y = []
    
    # Заполняем данные за последний год
    revenue_by_month_yearly = {item['month'].strftime('%m.%Y'): float(item['total']) for item in yearly_revenue}
    
    for i in range(12):
        month_date = now - timedelta(days=30 * (11-i))
        month_key = month_date.strftime('%m.%Y')
        month_name = month_names[month_date.month - 1]
        revenue_labels_1y.append(month_name)
        revenue_data_1y.append(revenue_by_month_yearly.get(month_key, 0))
    
    # Данные для графика доходов в разных периодах
    period_data = {
        'month': {'labels': revenue_labels_30d, 'data': revenue_data_30d},
        'halfyear': {'labels': revenue_labels_6m, 'data': revenue_data_6m},
        'year': {'labels': revenue_labels_1y, 'data': revenue_data_1y}
    }
    
    # Последние 5 счетов
    recent_invoices = Invoice.objects.all().order_by('-created_at')[:5]
    
    # Данные для круговой диаграммы статусов
    status_labels = [
        'Черновики', 
        'Отправленные', 
        'Оплаченные', 
        'Просроченные'
    ]
    
    status_data = [
        status_counts['draft'],
        status_counts['sent'],
        status_counts['paid'],
        status_counts['overdue']
    ]
    
    # Собираем контекст для шаблона
    context = {
        'title': 'Аналитика',
        'total_amount': total_amount,
        'paid_amount': paid_amount,
        'overdue_amount': overdue_amount,
        'status_counts': status_counts,
        'status_trends': status_trends,
        'recent_invoices': recent_invoices,
        
        # JSON данные для графиков
        'revenue_data_json': json.dumps({
            'labels': revenue_labels_30d,
            'data': revenue_data_30d
        }),
        
        'status_data_json': json.dumps({
            'labels': status_labels,
            'data': status_data
        }),
        
        'clients_data_json': json.dumps(top_clients_data),
        
        'payment_time_data_json': json.dumps(payment_time_data),
        
        'period_data_json': json.dumps(period_data)
    }
    
    return render(request, 'analytics/dashboard.html', context)

@login_required
def reports(request):
    """Страница отчетов"""
    return render(request, 'analytics/reports.html', {
        'title': 'Отчеты'
    })
