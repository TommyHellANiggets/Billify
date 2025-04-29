from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import CompanyProfile

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, help_text="Введите действующий email-адрес")
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Удаляем стандартные подсказки Django
        for field in self.fields:
            self.fields[field].help_text = None
        
        # Настраиваем стилизацию плейсхолдеров
        self.fields['username'].widget.attrs.update({'placeholder': 'Придумайте имя пользователя'})
        self.fields['email'].widget.attrs.update({'placeholder': 'Введите ваш email'})
        self.fields['password1'].widget.attrs.update({'placeholder': 'Придумайте надежный пароль'})
        self.fields['password2'].widget.attrs.update({'placeholder': 'Повторите пароль'})
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user

class CompanyProfileForm(forms.ModelForm):
    class Meta:
        model = CompanyProfile
        exclude = ['user', 'created_at', 'updated_at']
        widgets = {
            'company_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите название компании или ФИО ИП'}),
            'legal_address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Введите юридический адрес'}),
            'postal_address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Введите почтовый адрес'}),
            'inn': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите ИНН'}),
            'kpp': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите КПП (только для юр. лиц)'}),
            'ogrn': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите ОГРН/ОГРНИП'}),
            'okpo': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите ОКПО'}),
            'bank_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите название банка'}),
            'bank_account': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите расчетный счет'}),
            'bank_corr_account': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите корр. счет'}),
            'bank_bik': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите БИК'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Введите телефон компании'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Введите email компании'}),
            'website': forms.URLInput(attrs={'class': 'form-control', 'placeholder': 'Введите сайт компании'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Делаем поля необязательными
        for field in self.fields:
            self.fields[field].required = False 