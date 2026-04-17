#!/usr/bin/env python
"""Django's command-line utility for administrative tasks.

Этот скрипт служит основной точкой входа для всех административных команд Django.
Он содержит критические исправления для корректной работы в Windows-среде,
особенно при работе с Unicode-символами и перенаправлением потоков ввода-вывода.
"""

import os
import sys
import io
import logging
from typing import Callable, Optional, TextIO

# Константы для улучшения читаемости и поддержки
UTF8_ENCODING = 'utf-8'
WINDOWS_PLATFORM = 'win32'
DEFAULT_LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

def fix_windows_stdout_stderr() -> None:
    """Комплексное исправление проблем с потоками ввода-вывода в Windows.
    
    Решает три ключевые проблемы:
    1. Некорректная обработка Unicode-символов (кириллица, эмодзи и др.)
    2. Ошибки при работе с закрытыми потоками (ValueError: underlying buffer has been detached)
    3. Несоответствие кодировок при перенаправлении вывода
    
    Особенности реализации:
    - Применяется ТОЛЬКО в Windows-среде (sys.platform == 'win32')
    - Сохраняет оригинальное поведение isatty() с безопасной обработкой исключений
    - Использует 'replace' вместо 'strict' для обработки некорректных символов
    - Настраивает базовый логгер с поддержкой UTF-8
    
    Важно: Изменяет глобальные объекты sys.stdout и sys.stderr,
    что критично для корректного отображения русскоязычных сообщений и логов.
    """
    if sys.platform != WINDOWS_PLATFORM:
        return  # Исправления нужны только для Windows

    def create_safe_wrapper(stream: TextIO, original_isatty: Callable[[], bool]) -> io.TextIOWrapper:
        """Создает безопасную обертку для потока с защитой от ValueError.
        
        Args:
            stream: Исходный поток (stdout/stderr)
            original_isatty: Оригинальный метод isatty() для проверки TTY
            
        Returns:
            Новый TextIOWrapper с переопределенным isatty()
        """
        # Создаем новую обертку с нужной кодировкой
        wrapper = io.TextIOWrapper(
            stream.buffer,
            encoding=UTF8_ENCODING,
            errors='replace',  # Гарантирует обработку любых данных
            line_buffering=True
        )
        
        # Безопасная проверка isatty() для обработки закрытых потоков
        def safe_isatty() -> bool:
            try:
                return original_isatty()
            except (ValueError, AttributeError):
                return False
                
        wrapper.isatty = safe_isatty
        return wrapper

    try:
        # Обрабатываем stdout и stderr одинаковым образом через цикл
        for stream_name in ['stdout', 'stderr']:
            current_stream = getattr(sys, stream_name)
            
            # Проверяем, есть ли у потока buffer (некоторые потоки могут не иметь)
            if not hasattr(current_stream, 'buffer'):
                continue
                
            # Сохраняем оригинальный метод isatty
            original_isatty = current_stream.isatty
            
            # Пропускаем, если поток уже правильно обернут
            if isinstance(current_stream, io.TextIOWrapper):
                continue
                
            # Создаем и устанавливаем новую обертку
            new_wrapper = create_safe_wrapper(current_stream, original_isatty)
            setattr(sys, stream_name, new_wrapper)

        # Единая настройка логгера с защитой от повторной инициализации
        if not logging.getLogger().hasHandlers():
            logging.basicConfig(
                level=logging.INFO,
                format=DEFAULT_LOG_FORMAT,
                encoding=UTF8_ENCODING
            )
            
    except Exception as e:
        # Предупреждение вместо прерывания выполнения
        print(f"WARNING: Stream initialization failed ({type(e).__name__}): {str(e)}", 
              file=sys.stderr)

def main() -> None:
    """Основная точка входа для административных команд Django.
    
    Выполняет критические инициализационные шаги:
    1. Применяет исправления для Windows-специфичных проблем
    2. Настраивает переменные окружения для Django
    3. Запускает обработку командной строки
    
    Обработка ошибок:
    - Четко диагностирует отсутствие Django в окружении
    - Сохраняет оригинальное исключение через 'from exc'
    - Предоставляет пользователю конкретные шаги решения
    """
    fix_windows_stdout_stderr()
    
    # Настройка базовой переменной окружения Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'exm_backend.settings')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Не удалось импортировать Django. Возможные причины:\n"
            "1. Django не установлен в текущем окружении\n"
            "2. Не активировано виртуальное окружение\n"
            "3. PYTHONPATH настроен некорректно"
        ) from exc
        
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    """Точка входа при прямом запуске скрипта.
    
    Проверка __main__ необходима для:
    - Предотвращения двойного выполнения при импорте
    - Корректной работы с модульной структурой Django
    - Соответствия стандартным практикам запуска утилит
    """
    main()