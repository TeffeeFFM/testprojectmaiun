# settings.py
# Содержит все настройки проекта: база данных, приложения,
# безопасность, JWT-токены и т.д.
#
# Основной принцип: секреты (пароли, API-ключи) не хранятся в коде.
# Они читаются из файла .env через библиотеку python-dotenv.

# ============================================================
# СИСТЕМНЫЕ ИМПОРТЫ
# ============================================================

import sys
import io
import os
import logging
from pathlib import Path
from datetime import timedelta

from dotenv import load_dotenv

from .logging_config import get_logging_config

# ============================================================
# ИСПРАВЛЕНИЕ КОДИРОВКИ НА WINDOWS
# Без этого русские буквы в консоли отображаются некорректно
# ============================================================

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# ============================================================
# ПУТИ
# BASE_DIR — абсолютный путь до папки backend/
# Используется Path (из pathlib) вместо os.path — современный способ
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# ============================================================
# ЗАГРУЗКА ПЕРЕМЕННЫХ ОКРУЖЕНИЯ ИЗ .env
#
# Файл .env находится в папке backend/ рядом с manage.py.
# python-dotenv читает его и добавляет переменные в os.environ.
# Это позволяет не хранить секреты в коде.
# ============================================================

# Настройка логгера до загрузки .env для видимости ошибок
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('exm')

env_path = BASE_DIR / '.env'

if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logger.info(".env файл найден и загружен")
else:
    logger.error(f".env файл не найден по пути: {env_path}")
    logger.warning("Создайте файл .env с необходимыми настройками (см. .env.example)")

# ============================================================
# ОСНОВНЫЕ НАСТРОЙКИ БЕЗОПАСНОСТИ
#
# Значения читаются из .env.
# os.getenv('КЛЮЧ', 'значение_по_умолчанию') — при отсутствии ключа
# возвращается значение по умолчанию.
# ============================================================

# Секретный ключ Django — используется для подписи сессий, токенов и т.д.
# В продакшене НЕ должен использоваться дефолтный ключ!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-замени-меня-перед-деплоем')

# Режим отладки: True — для разработки, False — для продакшена.
# При DEBUG=True Django показывает подробные ошибки в браузере.
# Значение читается как строка из .env и сравнивается с 'True'
DEBUG = os.getenv('DEBUG', 'True') == 'True'

# Предупреждение разработчика о небезопасных настройках
if not DEBUG and SECRET_KEY.startswith('django-insecure-'):
    logger.warning(
        "⚠️  ВНИМАНИЕ: Используется небезопасный SECRET_KEY в режиме продакшена! "
        "Задайте безопасный ключ в .env"
    )

# ============================================================
# РАЗРЕШЁННЫЕ ХОСТЫ
#
# Django проверяет заголовок Host у входящих запросов.
# Это защита от атак типа «Host Header Injection».
# В режиме отладки разрешаются все хосты для удобства разработки.
# ============================================================

if DEBUG:
    ALLOWED_HOSTS = ['*']   # Любой хост (только для разработки!)
else:
    # В продакшене список хостов берётся из .env, например:
    # ALLOWED_HOSTS=mysite.ru,www.mysite.ru
    ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# ============================================================
# КЛЮЧИ API ДЛЯ ВНЕШНИХ СЕРВИСОВ
# Читаются из .env — в коде не хранятся
# ============================================================

# GigaChat (устаревший провайдер)
GIGACHAT_CLIENT_ID     = os.getenv('GIGACHAT_CLIENT_ID', '')
GIGACHAT_CLIENT_SECRET = os.getenv('GIGACHAT_CLIENT_SECRET', '')

# Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL   = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')

# Yandex Cloud DeepSeek
YANDEX_API_KEY   = os.getenv('YANDEX_API_KEY', '')
YANDEX_FOLDER_ID = os.getenv('YANDEX_FOLDER_ID', '')
YANDEX_MODEL_URI = os.getenv('YANDEX_MODEL_URI', '')

# Выбор AI-провайдера: 'gemini' | 'yandex'
AI_PROVIDER = os.getenv('AI_PROVIDER', 'gemini').lower()

# Предупреждения об отсутствии необходимых ключей
if AI_PROVIDER == 'giga' and (not GIGACHAT_CLIENT_ID or not GIGACHAT_CLIENT_SECRET):
    logger.error(
        "❌ AI_PROVIDER=giga, но GIGACHAT_CLIENT_ID или GIGACHAT_CLIENT_SECRET не заданы в .env"
    )

if AI_PROVIDER == 'gemini' and not GEMINI_API_KEY:
    logger.error(
        "❌ AI_PROVIDER=gemini, но GEMINI_API_KEY не задан в .env. "
        "Получите ключ на https://aistudio.google.com/app/apikey"
    )

if AI_PROVIDER == 'yandex' and not YANDEX_API_KEY:
    logger.error(
        "❌ AI_PROVIDER=yandex, но YANDEX_API_KEY не задан в .env."
    )

if AI_PROVIDER == 'yandex' and not YANDEX_MODEL_URI:
    logger.error(
        "❌ AI_PROVIDER=yandex, но YANDEX_MODEL_URI не задан в .env. "
        "Пример: gpt://b1ggc0h3flmtg0tcflu9/deepseek-v32/latest"
    )

# ============================================================
# УСТАНОВЛЕННЫЕ ПРИЛОЖЕНИЯ
#
# Django — это набор «приложений» (apps). Перечислены:
# - встроенные приложения Django (django.contrib.*)
# - сторонние библиотеки (rest_framework, corsheaders, ...)
# - собственные приложения (accounts, problems, exm)
# ============================================================

INSTALLED_APPS = [
    # Встроенные приложения Django
    'django.contrib.admin',         # Панель администратора
    'django.contrib.auth',          # Система аутентификации
    'django.contrib.contenttypes',  # Система типов контента
    'django.contrib.sessions',      # Сессии пользователей
    'django.contrib.messages',      # Система сообщений
    'django.contrib.staticfiles',   # Статические файлы (CSS, JS, картинки)

    # Сторонние библиотеки
    'rest_framework',                            # Django REST Framework — для создания API
    'rest_framework_simplejwt.token_blacklist',  # Чёрный список токенов (для выхода)
    'corsheaders',                               # CORS — разрешает запросы с другого домена
    'django_filters',                            # Фильтрация в API

    # Собственные приложения
    'accounts',     # Пользователи, профили, решения
    'problems',     # Банк задач
    'exm',          # AI-ревью кода
]

# ============================================================
# ПРОМЕЖУТОЧНОЕ ПО (MIDDLEWARE)
#
# Каждый HTTP-запрос проходит через этот список «фильтров»
# сверху вниз, а ответ — снизу вверх.
# Порядок следования важен.
# ============================================================

MIDDLEWARE = [
    # CORS должен быть ПЕРВЫМ, иначе не сработает
    'corsheaders.middleware.CorsMiddleware',

    'django.middleware.security.SecurityMiddleware',            # Заголовки безопасности
    'django.contrib.sessions.middleware.SessionMiddleware',     # Работа с сессиями
    'django.middleware.common.CommonMiddleware',                # Общие проверки
    'django.middleware.csrf.CsrfViewMiddleware',               # Защита от CSRF-атак
    'django.contrib.auth.middleware.AuthenticationMiddleware', # Определение текущего пользователя
    'django.contrib.messages.middleware.MessageMiddleware',    # Сообщения между запросами
    'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Защита от Clickjacking
]

# ============================================================
# CORS (Cross-Origin Resource Sharing)
#
# Браузер по умолчанию блокирует запросы с одного домена к другому.
# Например, фронтенд на localhost:5173 не может обратиться к API на
# localhost:8000 без явного разрешения.
# Здесь это разрешение задаётся.
# ============================================================

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",     # Vite dev server
    "http://127.0.0.1:5173",
]

CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

SESSION_COOKIE_SECURE = False  # для dev
CSRF_COOKIE_SECURE = False


# ============================================================
# МАРШРУТИЗАЦИЯ URL
# ============================================================

ROOT_URLCONF = 'exm_backend.urls'

# ============================================================
# ШАБЛОНЫ HTML
# Используются для панели администратора Django
# ============================================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,   # Автоматический поиск templates/ внутри каждого приложения
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'exm_backend.wsgi.application'

# ============================================================
# БАЗА ДАННЫХ
#
# Используется SQLite — простая файловая БД, подходит для разработки.
# Для продакшена заменяется на PostgreSQL (раскомментировать блок ниже
# и установить psycopg2-binary).
# ============================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Настройки PostgreSQL для продакшена (раскомментировать при необходимости):
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': os.getenv('DB_NAME', 'exm_db'),
#         'USER': os.getenv('DB_USER', 'postgres'),
#         'PASSWORD': os.getenv('DB_PASSWORD', ''),
#         'HOST': os.getenv('DB_HOST', 'localhost'),
#         'PORT': os.getenv('DB_PORT', '5432'),
#     }
# }

# ============================================================
# ВАЛИДАЦИЯ ПАРОЛЕЙ
# Django проверяет надёжность паролей при регистрации
# ============================================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ============================================================
# ЛОКАЛИЗАЦИЯ
# ============================================================

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Europe/Moscow'
USE_I18N = True   # Интернационализация (переводы)
USE_TZ = True     # Использование timezone-aware datetime

# ============================================================
# СТАТИЧЕСКИЕ ФАЙЛЫ (CSS, JavaScript, изображения)
# ============================================================

STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ============================================================
# КАСТОМНАЯ МОДЕЛЬ ПОЛЬЗОВАТЕЛЯ
#
# Переопределение стандартной модели User для использования
# email вместо username для входа.
# Объявляется ДО первой миграции — позднее изменение сложнее.
# ============================================================

AUTH_USER_MODEL = 'accounts.CustomUser'

# ============================================================
# НАСТРОЙКИ REST FRAMEWORK
#
# По умолчанию все эндпоинты требуют аутентификации через JWT.
# Для публичного доступа (регистрация, логин) —
# явно указывается permission_classes = [AllowAny] во View.
#
# Это безопаснее, чем AllowAny по умолчанию:
# при пропуске ограничения API остаётся закрытым,
# а не открывается всем.
# ============================================================

REST_FRAMEWORK = {
    # Метод аутентификации: проверка JWT-токена в заголовке Authorization
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # По умолчанию — только авторизованные пользователи
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}

# ============================================================
# НАСТРОЙКИ JWT-ТОКЕНОВ
#
# JWT (JSON Web Token) — способ аутентификации без сессий.
# Access token — короткоживущий, используется для запросов.
# Refresh token — долгоживущий, используется для получения нового access token.
# ============================================================

SIMPLE_JWT = {
    # Access token живёт 15 минут — при краже быстро устаревает
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    # Refresh token живёт 7 дней
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    # При обновлении токена старый refresh становится недействительным
    'ROTATE_REFRESH_TOKENS': True,
    # Старые refresh-токены попадают в чёрный список (требуется приложение token_blacklist)
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,  # Обновление поля last_login при входе
    'ALGORITHM': 'HS256',       # Алгоритм подписи токена
    'SIGNING_KEY': SECRET_KEY,  # Ключ подписи — берётся из настроек Django
    'AUTH_HEADER_TYPES': ('Bearer',),  # Токен передаётся: Authorization: Bearer <token>
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ============================================================
# ЛОГИРОВАНИЕ
#
# Настройки вынесены в отдельный файл logging_config.py.
# Также создаётся папка logs/, если она не существует.
# ============================================================

LOGGING = get_logging_config()
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

logger.info("✅ Настройки Django успешно загружены")