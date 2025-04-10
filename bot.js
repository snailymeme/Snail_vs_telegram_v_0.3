/**
 * Snail to Riches - Telegram Bot с поддержкой Web App
 * Обеспечивает интеграцию с Telegram для игры
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ========== КОНФИГУРАЦИЯ ==========
const CONFIG = {
    // Получаем токен из переменных окружения
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    
    // Порт для веб-хука и сервера
    port: process.env.PORT || 443,
    botPort: process.env.BOT_PORT || 3000, // Внутренний порт для бота
    
    // URL вашей игры
    gameUrl: process.env.SERVER_URL || 'https://snail-vs-telegram-v-0-3-production.up.railway.app',
    
    // URL для веб-хука
    webhookUrl: process.env.WEBHOOK_URL || 'https://snail-vs-telegram-v-0-3-production.up.railway.app/bot',
    
    // Использовать ли веб-хук (вместо polling)
    useWebhook: true // Включаем webhook для работы на Railway
};

// ========== ЛОГГИРОВАНИЕ ==========
function log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefixes = {
        info: '🔷',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    const prefix = prefixes[level] || '•';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// ========== ПРОВЕРКА КОНФИГУРАЦИИ ==========
if (!CONFIG.botToken) {
    log('TELEGRAM_BOT_TOKEN не установлен! Убедитесь, что токен указан в .env файле.', 'error');
    process.exit(1);
}

// ========== ИНФОРМАЦИЯ О КОНФИГУРАЦИИ ==========
console.log('==========================================================');
console.log('КОНФИГУРАЦИЯ TELEGRAM БОТА:');
console.log(`Токен: ${CONFIG.botToken ? CONFIG.botToken.substring(0, 10) + '...' : 'Не задан'}`);
console.log(`Режим: ${CONFIG.useWebhook ? 'Webhook' : 'Long Polling'}`);
console.log(`URL игры: ${CONFIG.gameUrl}`);
console.log(`Webhook URL: ${CONFIG.webhookUrl}`);
console.log(`Внешний порт: ${CONFIG.port}, Внутренний порт: ${CONFIG.botPort}`);
console.log(`Режим окружения: ${process.env.NODE_ENV || 'development'}`);
console.log('==========================================================');

// ========== ИНИЦИАЛИЗАЦИЯ БОТА ==========
let bot;
try {
    if (CONFIG.useWebhook) {
        // Создаем Express приложение для обработки веб-хука
        const app = express();
        
        // Разрешаем CORS для всех источников
        app.use(cors());
        
        // Middleware для парсинга JSON
        app.use(express.json());
        
        // Инициализируем бота без polling
        bot = new TelegramBot(CONFIG.botToken, { polling: false });
        
        // Устанавливаем веб-хук
        bot.setWebHook(CONFIG.webhookUrl).then(() => {
            log(`Веб-хук установлен на ${CONFIG.webhookUrl}`, 'success');
        }).catch(error => {
            log(`Ошибка установки веб-хука: ${error.message}`, 'error');
        });
        
        // Обработчик для веб-хука
        app.post('/bot', (req, res) => {
            bot.processUpdate(req.body);
            res.sendStatus(200);
        });
        
        // Простой ответ для проверки работоспособности
        app.get('/', (req, res) => {
            res.send('Telegram Bot Server is running!');
        });
        
        // Запускаем сервер
        const serverPort = CONFIG.botPort || CONFIG.port;
        app.listen(serverPort, () => {
            log(`Express сервер запущен на порту ${serverPort}`, 'success');
            log(`Внешний порт: ${CONFIG.port}, внутренний порт: ${serverPort}`, 'info');
            log(`Используется URL игры: ${CONFIG.gameUrl}`, 'info');
        });
    } else {
        // Используем режим polling (для тестирования)
        console.log('Запускаем бота в режиме Long Polling...');
        bot = new TelegramBot(CONFIG.botToken, { polling: true });
        log('Telegram Bot успешно инициализирован в режиме polling', 'success');
        log(`Используется URL игры: ${CONFIG.gameUrl}`, 'info');
    }
} catch (error) {
    log(`Ошибка инициализации Telegram Bot: ${error.message}`, 'error');
    process.exit(1);
}

// ========== ОБРАБОТЧИКИ СООБЩЕНИЙ ==========
/**
 * Отправляет приветственное сообщение с кнопкой для запуска Web App
 */
async function sendWelcomeMessage(chatId) {
    try {
        // Создаем клавиатуру с обычной кнопкой, которая будет внизу экрана
        const keyboard = {
            keyboard: [
                [
                    {
                        text: '🎮 Играть в Snail to Riches',
                        web_app: { url: CONFIG.gameUrl }
                    }
                ]
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        };

        // Отправляем сообщение с кнопкой
        await bot.sendMessage(
            chatId, 
            'Привет! 🐌 Нажмите на кнопку ниже, чтобы запустить игру прямо в Telegram:', 
            { reply_markup: keyboard }
        );
        
        log(`Отправлено приветственное сообщение с Web App пользователю ${chatId}`, 'success');
    } catch (error) {
        log(`Ошибка при отправке сообщения: ${error.message}`, 'error');
    }
}

// Обработка команды /start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    log(`Получена команда /start от пользователя ${chatId}`, 'info');
    await sendWelcomeMessage(chatId);
});

// Обработка команды /help
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    log(`Получена команда /help от пользователя ${chatId}`, 'info');
    
    // Используем такую же клавиатуру как в приветственном сообщении
    const keyboard = {
        keyboard: [
            [
                {
                    text: '🎮 Играть в Snail to Riches',
                    web_app: { url: CONFIG.gameUrl }
                }
            ]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
    };
    
    const helpMessage = `🐌 *Snail to Riches - Помощь* 🐌

/start - Показать кнопку для запуска игры
/help - Показать это сообщение`;

    await bot.sendMessage(chatId, helpMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard 
    });
});

// Обработка неизвестных команд
bot.on('message', async (msg) => {
    // Проверяем, что это не команда, которую мы уже обработали
    if (!msg.text || msg.text.startsWith('/start') || msg.text.startsWith('/help')) {
        return;
    }
    
    const chatId = msg.chat.id;
    log(`Получено сообщение от пользователя ${chatId}: ${msg.text}`, 'info');
    
    await bot.sendMessage(chatId, 'Используйте /start для начала игры или /help для помощи.');
});

// ========== ОБРАБОТКА ЗАВЕРШЕНИЯ РАБОТЫ ==========
process.on('SIGINT', async () => {
    log('Завершение работы бота...', 'warning');
    if (CONFIG.useWebhook) {
        await bot.deleteWebHook();
    } else {
        await bot.close();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    log('Завершение работы бота...', 'warning');
    if (CONFIG.useWebhook) {
        await bot.deleteWebHook();
    } else {
        await bot.close();
    }
    process.exit(0);
});

log('Бот запущен и ожидает сообщений', 'success'); 