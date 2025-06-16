#!/usr/bin/env python
import os
import sys
import django
import random
from datetime import datetime, timedelta
from decimal import Decimal

# Настраиваем Django для использования вне проекта
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'billify.settings')
django.setup()

# Импортируем модели после настройки Django
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from core.models import CompanyProfile
from clients.models import Client
from suppliers.models import Supplier
from invoices.models import Invoice, InvoiceItem

def print_welcome():
    """Вывод приветствия и информации о скрипте"""
    print("=" * 60)
    print("Скрипт заполнения тестовыми данными для Billify".center(60))
    print("=" * 60)
    print("Скрипт создаёт нового пользователя (если не существует)")
    print("и заполняет для него:")
    print(" - Профиль компании")
    print(" - 3 клиента")
    print(" - 3 поставщика")
    print(" - 3 входящих документа с поставщиками")
    print(" - 3 исходящих документа с клиентами")
    print("=" * 60)
    print("Использование: python create_acc.py <логин> <пароль>")
    print("=" * 60)

def get_random_company_name():
    """Генерирует случайное название компании"""
    prefixes = ["ООО", "ИП", "АО", "ПАО", "НКО"]
    names = ["ТехноСтрой", "АгроПром", "МедСервис", "ИнфоТех", "ТрансЛогистик", 
             "ФинКонсалт", "ЭнергоСбыт", "СтройМонтаж", "РемСервис", "ПищеПром"]
    suffixes = ["Плюс", "Групп", "Холдинг", "Инвест", "Центр", "Сервис", ""]
    
    return f"{random.choice(prefixes)} \"{random.choice(names)}{random.choice(suffixes)}\""

def get_random_person_name():
    """Генерирует случайное ФИО"""
    first_names = ["Александр", "Сергей", "Дмитрий", "Андрей", "Иван", 
                  "Елена", "Ольга", "Наталья", "Мария", "Анна"]
    last_names = ["Иванов", "Смирнов", "Кузнецов", "Попов", "Васильев", 
                 "Петров", "Соколов", "Михайлов", "Новиков", "Федоров"]
    patronymics = ["Александрович", "Сергеевич", "Дмитриевич", "Андреевич", "Иванович",
                  "Александровна", "Сергеевна", "Дмитриевна", "Андреевна", "Ивановна"]
    
    return f"{random.choice(first_names)} {random.choice(last_names)} {random.choice(patronymics)}"

def get_random_inn(is_org=True):
    """Генерирует случайный ИНН"""
    if is_org:  # ИНН для юр. лица (10 цифр)
        return ''.join(str(random.randint(0, 9)) for _ in range(10))
    else:  # ИНН для ИП (12 цифр)
        return ''.join(str(random.randint(0, 9)) for _ in range(12))

def get_random_kpp():
    """Генерирует случайный КПП (9 цифр)"""
    return ''.join(str(random.randint(0, 9)) for _ in range(9))

def get_random_ogrn(is_org=True):
    """Генерирует случайный ОГРН/ОГРНИП"""
    if is_org:  # ОГРН для юр. лица (13 цифр)
        return ''.join(str(random.randint(0, 9)) for _ in range(13))
    else:  # ОГРНИП для ИП (15 цифр)
        return ''.join(str(random.randint(0, 9)) for _ in range(15))

def get_random_bank_details():
    """Генерирует случайные банковские реквизиты"""
    banks = ["Сбербанк", "ВТБ", "Газпромбанк", "Альфа-Банк", "Тинькофф Банк", "Россельхозбанк"]
    account = ''.join(str(random.randint(0, 9)) for _ in range(20))
    corr_account = ''.join(str(random.randint(0, 9)) for _ in range(20))
    bik = ''.join(str(random.randint(0, 9)) for _ in range(9))
    
    return {
        "bank_name": f"{random.choice(banks)}",
        "bank_account": account,
        "bank_corr_account": corr_account,
        "bank_bik": bik
    }

def get_random_address():
    """Генерирует случайный адрес"""
    cities = ["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань", "Нижний Новгород"]
    streets = ["Ленина", "Пушкина", "Гагарина", "Советская", "Мира", "Центральная", "Молодежная", "Садовая"]
    
    return f"{random.choice(cities)}, ул. {random.choice(streets)}, д. {random.randint(1, 100)}, офис {random.randint(1, 50)}"

def get_random_phone():
    """Генерирует случайный номер телефона"""
    return f"+7 ({random.randint(900, 999)}) {random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10, 99)}"

def get_random_email(name=""):
    """Генерирует случайный email"""
    domains = ["mail.ru", "gmail.com", "yandex.ru", "outlook.com", "company.ru"]
    if not name:
        name = f"user{random.randint(1000, 9999)}"
    return f"{name.lower().replace(' ', '.')}{random.randint(1, 999)}@{random.choice(domains)}"

def fill_company_profile(user):
    """Заполняет профиль компании пользователя"""
    print("Создание профиля компании...")
    
    # Проверяем, есть ли уже профиль
    try:
        company_profile = CompanyProfile.objects.get(user=user)
        print("Профиль компании уже существует, обновляем данные...")
    except CompanyProfile.DoesNotExist:
        company_profile = CompanyProfile(user=user)
    
    # Заполняем случайными данными
    is_org = random.choice([True, False])  # True = юр.лицо, False = ИП
    company_type = 'business' if is_org else 'individual'
    
    if is_org:
        company_name = get_random_company_name()
    else:
        company_name = get_random_person_name() + " (ИП)"
    
    bank_details = get_random_bank_details()
    
    # Обновляем данные профиля
    company_profile.company_type = company_type
    company_profile.company_name = company_name
    company_profile.legal_address = get_random_address()
    company_profile.postal_address = get_random_address()
    company_profile.inn = get_random_inn(is_org)
    if is_org:
        company_profile.kpp = get_random_kpp()
    company_profile.ogrn = get_random_ogrn(is_org)
    company_profile.okpo = ''.join(str(random.randint(0, 9)) for _ in range(10))
    company_profile.bank_name = bank_details["bank_name"]
    company_profile.bank_account = bank_details["bank_account"]
    company_profile.bank_corr_account = bank_details["bank_corr_account"]
    company_profile.bank_bik = bank_details["bank_bik"]
    company_profile.phone = get_random_phone()
    company_profile.email = get_random_email(company_name[:10])
    company_profile.website = f"https://www.{company_name.lower().replace(' ', '-').replace('\"', '').replace('(', '').replace(')', '')}.ru"
    
    company_profile.save()
    print(f"Профиль компании '{company_profile.company_name}' успешно создан/обновлен")
    return company_profile

def create_clients(user, num_clients=3):
    """Создает указанное количество клиентов"""
    print(f"Создание {num_clients} клиентов...")
    clients = []
    
    for i in range(num_clients):
        is_org = random.choice([True, False])
        client_type = 'business' if is_org else 'individual'
        
        if is_org:
            client_name = get_random_company_name()
        else:
            client_name = get_random_person_name()
        
        bank_details = get_random_bank_details()
        
        client = Client(
            user=user,
            type=client_type,
            name=client_name,
            email=get_random_email(client_name[:10]),
            phone=get_random_phone(),
            address=get_random_address(),
            tax_id=get_random_inn(is_org),
            contact_person=get_random_person_name() if is_org else "",
            bank_name=bank_details["bank_name"],
            bank_account=bank_details["bank_account"],
            bank_bik=bank_details["bank_bik"],
            comment=f"Тестовый клиент #{i+1}"
        )
        
        if is_org:
            client.kpp = get_random_kpp()
            client.ogrn = get_random_ogrn(is_org)
            client.contact_email = get_random_email()
        
        client.save()
        clients.append(client)
        print(f"Клиент '{client.name}' создан")
    
    return clients

def create_suppliers(user, num_suppliers=3):
    """Создает указанное количество поставщиков"""
    print(f"Создание {num_suppliers} поставщиков...")
    suppliers = []
    
    for i in range(num_suppliers):
        is_org = random.choice([True, False])
        supplier_type = 'business' if is_org else 'individual'
        
        if is_org:
            supplier_name = get_random_company_name()
        else:
            supplier_name = get_random_person_name()
        
        bank_details = get_random_bank_details()
        
        supplier = Supplier(
            user=user,
            type=supplier_type,
            name=supplier_name,
            email=get_random_email(supplier_name[:10]),
            phone=get_random_phone(),
            address=get_random_address(),
            postal_address=get_random_address(),
            inn=get_random_inn(is_org),
            bank_name=bank_details["bank_name"],
            bank_account=bank_details["bank_account"],
            bank_corr_account=bank_details["bank_corr_account"],
            bank_bik=bank_details["bank_bik"],
            contact_person=get_random_person_name() if is_org else "",
            contact_position="Менеджер" if is_org else "",
            payment_terms="Оплата в течение 14 календарных дней",
            delivery_terms="Доставка за счет поставщика"
        )
        
        if is_org:
            supplier.kpp = get_random_kpp()
            supplier.ogrn = get_random_ogrn(is_org)
            supplier.contact_phone = get_random_phone()
            supplier.contact_email = get_random_email()
        
        supplier.save()
        suppliers.append(supplier)
        print(f"Поставщик '{supplier.name}' создан")
    
    return suppliers

def create_outgoing_invoices(user, clients, company_profile, num_invoices=3):
    """Создает исходящие счета для клиентов"""
    print(f"Создание {num_invoices} исходящих документов...")
    invoices = []
    
    for i, client in enumerate(clients[:num_invoices]):
        # Генерируем номер счета
        invoice_number = f"INV-{datetime.now().strftime('%Y%m')}-{random.randint(1000, 9999)}"
        
        # Генерируем даты
        issue_date = datetime.now() - timedelta(days=random.randint(1, 30))
        due_date = issue_date + timedelta(days=random.randint(5, 14))
        
        # Создаем счет
        invoice = Invoice(
            number=invoice_number,
            client=client,
            user=user,
            invoice_type='outgoing',
            issue_date=issue_date,
            due_date=due_date,
            status=random.choice(['draft', 'sent', 'paid', 'new']),
            
            # Информация о поставщике (наша компания)
            supplier_name=company_profile.company_name,
            supplier_address=company_profile.legal_address,
            supplier_inn=company_profile.inn,
            supplier_kpp=company_profile.kpp,
            supplier_phone=company_profile.phone,
            supplier_email=company_profile.email,
            
            # Банковские реквизиты
            supplier_bank=company_profile.bank_name,
            supplier_bank_account=company_profile.bank_account,
            supplier_bank_bik=company_profile.bank_bik,
            supplier_bank_corr_account=company_profile.bank_corr_account,
            
            # Информация о клиенте
            client_name=client.name,
            client_address=client.address,
            client_tax_id=client.tax_id,
            client_phone=client.phone,
            client_email=client.email,
            client_contact_person=client.contact_person,
            
            # Дополнительная информация
            notes="Оплата в течение срока, указанного в договоре",
            tax_rate=Decimal('20.00')
        )
        
        # Сохраняем счет
        invoice.save()
        
        # Создаем позиции счета (2-5 позиций)
        num_items = random.randint(2, 5)
        
        products = [
            "Консультационные услуги", "Разработка ПО", "Техническая поддержка",
            "Дизайн веб-сайта", "SEO-оптимизация", "Аренда сервера", 
            "Обучение персонала", "Установка оборудования", "Маркетинговые услуги"
        ]
        
        units = ["шт.", "час", "услуга", "мес."]
        
        for j in range(num_items):
            price = Decimal(str(random.randint(1000, 10000)))
            quantity = Decimal(str(random.randint(1, 10)))
            
            # Создаем позицию счета
            item = InvoiceItem(
                invoice=invoice,
                description=random.choice(products),
                quantity=quantity,
                unit=random.choice(units),
                price=price,
                amount=price * quantity,
                vat_rate=Decimal('20.00')
            )
            
            # Сохраняем позицию
            item.save()
        
        # Пересчитываем итоги
        invoice.calculate_totals()
        invoice.save()
        
        invoices.append(invoice)
        print(f"Исходящий счет № {invoice.number} для клиента '{client.name}' создан")
    
    return invoices

def create_incoming_invoices(user, suppliers, company_profile, num_invoices=3):
    """Создает входящие счета от поставщиков"""
    print(f"Создание {num_invoices} входящих документов...")
    
    # Преобразуем поставщиков в клиентов для модели счетов
    supplier_clients = []
    for supplier in suppliers[:num_invoices]:
        # Сначала проверим, нет ли уже клиента с такими данными
        existing_client = Client.objects.filter(
            user=user,
            name=supplier.name,
            tax_id=supplier.inn
        ).first()
        
        if existing_client:
            supplier_clients.append(existing_client)
            continue
        
        # Создаем клиента на основе данных поставщика
        supplier_client = Client(
            user=user,
            type=supplier.type,
            name=supplier.name,
            email=supplier.email,
            phone=supplier.phone,
            address=supplier.address,
            tax_id=supplier.inn,
            kpp=supplier.kpp,
            ogrn=supplier.ogrn,
            bank_name=supplier.bank_name,
            bank_account=supplier.bank_account,
            bank_bik=supplier.bank_bik,
            contact_person=supplier.contact_person
        )
        supplier_client.save()
        supplier_clients.append(supplier_client)
    
    # Создаем входящие счета от поставщиков
    invoices = []
    client = Client.objects.filter(user=user).first()  # Берем первого клиента для указания получателя
    
    if not client:
        # Если нет клиентов, создаем технический клиент на основе данных компании
        client = Client(
            user=user,
            type='business',
            name=company_profile.company_name,
            email=company_profile.email,
            phone=company_profile.phone,
            address=company_profile.legal_address,
            tax_id=company_profile.inn,
            kpp=company_profile.kpp
        )
        client.save()
    
    for i, supplier_client in enumerate(supplier_clients):
        # Генерируем номер счета
        invoice_number = f"SUP-{datetime.now().strftime('%Y%m')}-{random.randint(1000, 9999)}"
        
        # Генерируем даты
        issue_date = datetime.now() - timedelta(days=random.randint(1, 30))
        due_date = issue_date + timedelta(days=random.randint(5, 14))
        
        # Создаем счет
        invoice = Invoice(
            number=invoice_number,
            client=client,  # Клиент-получатель (наша компания)
            supplier=supplier_client,  # Поставщик
            user=user,
            invoice_type='incoming',
            issue_date=issue_date,
            due_date=due_date,
            status=random.choice(['new', 'paid']),
            
            # Информация о поставщике
            supplier_name=supplier_client.name,
            supplier_address=supplier_client.address,
            supplier_inn=supplier_client.tax_id,
            supplier_kpp=supplier_client.kpp,
            supplier_phone=supplier_client.phone,
            supplier_email=supplier_client.email,
            
            # Банковские реквизиты поставщика
            supplier_bank=supplier_client.bank_name,
            supplier_bank_account=supplier_client.bank_account,
            supplier_bank_bik=supplier_client.bank_bik,
            
            # Информация о получателе (наша компания)
            client_name=company_profile.company_name,
            client_address=company_profile.legal_address,
            client_tax_id=company_profile.inn,
            client_phone=company_profile.phone,
            client_email=company_profile.email,
            
            # Дополнительная информация
            notes="Входящий счет от поставщика",
            tax_rate=Decimal('20.00')
        )
        
        # Сохраняем счет
        invoice.save()
        
        # Создаем позиции счета (2-5 позиций)
        num_items = random.randint(2, 5)
        
        products = [
            "Канцелярские товары", "Компьютерное оборудование", "Мебель", 
            "Программное обеспечение", "Расходные материалы", "Услуги связи",
            "Аренда офиса", "Коммунальные услуги", "Юридические услуги"
        ]
        
        units = ["шт.", "комп.", "услуга", "мес."]
        
        for j in range(num_items):
            price = Decimal(str(random.randint(1000, 10000)))
            quantity = Decimal(str(random.randint(1, 10)))
            
            # Создаем позицию счета
            item = InvoiceItem(
                invoice=invoice,
                description=random.choice(products),
                quantity=quantity,
                unit=random.choice(units),
                price=price,
                amount=price * quantity,
                vat_rate=Decimal('20.00')
            )
            
            # Сохраняем позицию
            item.save()
        
        # Пересчитываем итоги
        invoice.calculate_totals()
        invoice.save()
        
        invoices.append(invoice)
        print(f"Входящий счет № {invoice.number} от '{supplier_client.name}' создан")
    
    return invoices

def main():
    """Основная функция скрипта"""
    print_welcome()
    
    # Проверяем аргументы командной строки
    if len(sys.argv) != 3:
        print("Использование: python create_acc.py <логин> <пароль>")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    # Проверяем, существует ли пользователь
    user = User.objects.filter(username=username).first()
    
    if user:
        # Если пользователь существует, проверяем пароль
        auth_user = authenticate(username=username, password=password)
        if not auth_user:
            print(f"Пользователь '{username}' уже существует, но пароль неверный")
            sys.exit(1)
        user = auth_user
        print(f"Авторизация пользователя '{username}' успешна")
    else:
        # Если пользователь не существует, создаем нового
        try:
            user = User.objects.create_user(
                username=username,
                password=password,
                email=f"{username}@example.com"  # Временный email
            )
            print(f"Создан новый пользователь '{username}'")
        except Exception as e:
            print(f"Ошибка при создании пользователя: {str(e)}")
            sys.exit(1)
    
    print(f"Успешная авторизация пользователя '{username}'")
    
    # Заполняем профиль компании
    company_profile = fill_company_profile(user)
    
    # Создаем клиентов
    clients = create_clients(user, 3)
    
    # Создаем поставщиков
    suppliers = create_suppliers(user, 3)
    
    # Создаем исходящие счета
    outgoing_invoices = create_outgoing_invoices(user, clients, company_profile, 3)
    
    # Создаем входящие счета
    incoming_invoices = create_incoming_invoices(user, suppliers, company_profile, 3)
    
    print("\n" + "=" * 60)
    print("Заполнение данными успешно завершено!".center(60))
    print("=" * 60)
    print(f"Для пользователя '{user.username}' создано:")
    print(f" - Профиль компании: {company_profile.company_name}")
    print(f" - Клиентов: {len(clients)}")
    print(f" - Поставщиков: {len(suppliers)}")
    print(f" - Исходящих счетов: {len(outgoing_invoices)}")
    print(f" - Входящих счетов: {len(incoming_invoices)}")
    print("=" * 60)
    print(f"Теперь вы можете войти на сайт с логином '{user.username}' и паролем,")
    print(f"указанным при запуске скрипта.")
    print("=" * 60)

if __name__ == "__main__":
    main()