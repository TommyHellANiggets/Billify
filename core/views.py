from django.shortcuts import render, redirect

# Create your views here.

def home(request):
    """Главная страница"""
    return render(request, 'core/home.html', {'title': 'Главная - Billify'})

def about(request):
    """Перенаправление на главную страницу, т.к. информация объединена"""
    return render(request, 'core/about.html', {'title': 'О системе - Billify'})

def changelog(request):
    return render(request, 'core/changelog.html', {'title': 'Журнал изменений - Billify'})
