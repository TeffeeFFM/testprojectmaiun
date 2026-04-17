"""
Конфигурация логирования для Django проекта.
Упрощенная версия без проблем с Windows.
"""
import logging
import json
from datetime import datetime

class SafeJSONFormatter(logging.Formatter):
    """
    Безопасный форматтер для вывода логов в JSON.
    Обрабатывает ошибки кодировки и закрытые потоки.
    """
    def format(self, record):
        try:
            log_record = {
                "timestamp": datetime.utcnow().isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": str(record.getMessage()),
                "module": record.module,
                "function": record.funcName,
                "line": record.lineno,
            }
            return json.dumps(log_record, ensure_ascii=True)
        except Exception as e:
            # Возвращаем простой текстовый формат при ошибках
            return f"[{datetime.utcnow().isoformat()}] {record.levelname} {record.name}: {record.getMessage()}"

def get_logging_config():
    """
    Возвращает упрощенную конфигурацию логирования.
    """
    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'json': {
                '()': 'exm_backend.logging_config.SafeJSONFormatter'
            },
            'verbose': {
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
                'level': 'INFO',
            },
            'file': {
                'class': 'logging.FileHandler',
                'filename': 'logs/app.log',
                'formatter': 'json',
                'level': 'INFO',
                'encoding': 'utf-8'
            },
        },
        'root': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'file'],
                'level': 'INFO',
                'propagate': False,
            },
            'exm': {
                'handlers': ['console', 'file'],
                'level': 'DEBUG',
                'propagate': False,
            },
        },
    }