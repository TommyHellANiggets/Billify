from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CompanyProfileForm
from .models import CompanyProfile

# Create your views here.

def home(request):
    """Главная страница для неавторизованных пользователей"""
    if request.user.is_authenticated:
        return redirect('core:home_inside')
    return render(request, 'core/home.html', {'title': 'Главная - Billify'})

@login_required
def home_inside(request):
    """Внутренняя главная страница для авторизованных пользователей"""
    context = {
        'title': 'Личный кабинет - Billify',
        'invoices_count': 0,  # Заглушка, здесь должны быть реальные данные
        'clients_count': 0,
        'total_earnings': 0,
        'completed_jobs': 0,
    }
    return render(request, 'core/home_inside.html', context)

def about(request):
    """Перенаправление на главную страницу, т.к. информация объединена"""
    return render(request, 'core/about.html', {'title': 'О системе - Billify'})

def changelog(request):
    return render(request, 'core/changelog.html', {'title': 'Журнал изменений - Billify'})

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, 'Регистрация успешно завершена!')
            return redirect('core:home_inside')
        else:
            for error in form.errors.values():
                messages.error(request, error[0])
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/auth.html', {'form': form})

@login_required
def profile(request):
    """Страница профиля компании пользователя"""
    try:
        # Пытаемся получить существующий профиль
        profile = request.user.company_profile
    except CompanyProfile.DoesNotExist:
        # Если профиля нет, создаем новый
        profile = CompanyProfile(user=request.user)
        profile.save()
    
    if request.method == 'POST':
        form = CompanyProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            profile_obj = form.save(commit=False)
            
            # Проверяем, есть ли новые файлы для загрузки
            if 'logo' in request.FILES:
                profile_obj.logo = request.FILES['logo']
            if 'stamp' in request.FILES:
                profile_obj.stamp = request.FILES['stamp']
            if 'signature' in request.FILES:
                profile_obj.signature = request.FILES['signature']
            
            profile_obj.save()
            messages.success(request, 'Профиль успешно обновлен!')
            return redirect('core:profile')
    else:
        form = CompanyProfileForm(instance=profile)
    
    return render(request, 'core/profile.html', {
        'form': form,
        'title': 'Профиль компании - Billify'
    })
