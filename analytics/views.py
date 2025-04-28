from django.shortcuts import render

# Create your views here.

def dashboard(request):
    """Панель аналитики"""
    return render(request, 'analytics/dashboard.html', {
        'title': 'Аналитика'
    })

def reports(request):
    """Страница отчетов"""
    return render(request, 'analytics/reports.html', {
        'title': 'Отчеты'
    })
