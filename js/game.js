/**
 * Основной модуль игры
 */
class Game {
    constructor() {
        // Инициализация параметров игры
        this.balance = ASSETS.GAME.STARTING_BALANCE;
        this.bet = ASSETS.GAME.DEFAULT_BET;
        this.selectedSnailType = '';
        this.difficulty = ASSETS.GAME.DIFFICULTY;
        
        // Объекты игры
        this.maze = null;
        this.snailManager = null;
        
        // Состояние игры
        this.isLoading = true;
        this.isRaceActive = false;
        this.raceStartTime = 0;
        this.raceTimeout = null;
        
        // Инициализация элементов DOM
        this.initDomElements();
        
        // Инициализация обработчиков событий
        this.initEventListeners();
        
        // Загрузка ресурсов перед началом игры
        this.loadResources();
        
        // Рандомизируем типы улиток при первой загрузке
        this.randomizeSnailTypes();
    }
    
    /**
     * Инициализация элементов DOM
     */
    initDomElements() {
        // Контейнеры экранов
        this.loader = document.getElementById('loader');
        this.mainGame = document.getElementById('main-game');
        this.selectionScreen = document.getElementById('selection-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.resultsScreen = document.getElementById('results-screen');
        
        // Элементы экрана загрузки
        this.loadingProgress = document.getElementById('loading-progress');
        this.loadingText = document.getElementById('loading-text');
        
        // Элементы экрана выбора
        this.snailOptions = document.querySelectorAll('.snail-option');
        this.betAmount = document.getElementById('bet-amount');
        this.balanceAmount = document.getElementById('balance-amount');
        this.startRaceButton = document.getElementById('start-race');
        
        // Элементы игрового экрана
        this.mazeContainer = document.getElementById('maze-container');
        this.currentBetDisplay = document.getElementById('current-bet-display');
        this.raceStatusDisplay = document.getElementById('race-status-display');
        this.backToSelectionButton = document.getElementById('back-to-selection');
        
        // Элементы экрана результатов
        this.resultsMessage = document.getElementById('results-message');
        this.racePositions = document.getElementById('race-positions');
        this.newBalance = document.getElementById('new-balance');
        this.playAgainButton = document.getElementById('play-again');
        
        // Создаем Canvas для лабиринта
        this.createCanvas();
        
        // Обновляем отображение баланса
        this.updateBalanceDisplay();
    }
    
    /**
     * Создание Canvas для отрисовки лабиринта
     */
    createCanvas() {
        if (!this.mazeContainer) {
            console.error('Контейнер для лабиринта не найден!');
            return;
        }
        
        // Удаляем старый canvas, если он существует
        const oldCanvas = this.mazeContainer.querySelector('canvas');
        if (oldCanvas) {
            oldCanvas.remove();
        }
        
        // Создаем новый canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'maze-canvas';
        
        // Получаем настройки лабиринта из ASSETS
        const mazeConfig = ASSETS.MAZE[this.difficulty.toUpperCase()] || ASSETS.MAZE.MEDIUM;
        const rows = mazeConfig.ROWS + 5; // Добавляем +5 рядов 
        const cols = mazeConfig.COLS + 5; // Добавляем +5 колонок 
        const cellSize = ASSETS.CELL_SIZE;
        
        // Устанавливаем размеры canvas
        this.canvas.width = cols * cellSize;
        this.canvas.height = rows * cellSize;
        
        // Добавляем canvas в контейнер
        this.mazeContainer.appendChild(this.canvas);
        
        // Получаем контекст для рисования
        this.ctx = this.canvas.getContext('2d');
        
        // Инициализируем параметры масштабирования и перемещения
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        // Добавляем обработчики для зума и перемещения
        this.initZoomAndPanEvents();
    }
    
    /**
     * Инициализация обработчиков событий для зума и перемещения
     */
    initZoomAndPanEvents() {
        // Обработчик колеса мыши для зума
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            // Определяем положение курсора относительно канваса
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Определяем направление прокрутки и изменение масштаба
            const delta = -Math.sign(e.deltaY) * 0.1;
            const newScale = Math.max(0.5, Math.min(3, this.scale + delta));
            
            // Расчет нового смещения для зума к точке курсора
            if (this.scale !== newScale) {
                const scaleRatio = newScale / this.scale;
                this.offsetX = mouseX - (mouseX - this.offsetX) * scaleRatio;
                this.offsetY = mouseY - (mouseY - this.offsetY) * scaleRatio;
                this.scale = newScale;
                
                // Перерисовываем лабиринт
                this.drawMaze();
            }
        });
        
        // Обработчик нажатия мыши для начала перемещения
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });
        
        // Обработчик перемещения мыши
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                
                this.offsetX += deltaX;
                this.offsetY += deltaY;
                
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                
                // Перерисовываем лабиринт
                this.drawMaze();
            }
        });
        
        // Обработчик отпускания кнопки мыши
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });
        
        // Обработчик выхода курсора за пределы канваса
        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });
        
        // Инициализация стиля курсора
        this.canvas.style.cursor = 'grab';
        
        // Добавляем сенсорную поддержку для мобильных устройств
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                e.preventDefault();
                this.isDragging = true;
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                // Сохраняем начальное расстояние между пальцами для масштабирования
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                this.initialPinchDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                this.initialScale = this.scale;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && this.isDragging) {
                e.preventDefault();
                const deltaX = e.touches[0].clientX - this.lastMouseX;
                const deltaY = e.touches[0].clientY - this.lastMouseY;
                
                this.offsetX += deltaX;
                this.offsetY += deltaY;
                
                this.lastMouseX = e.touches[0].clientX;
                this.lastMouseY = e.touches[0].clientY;
                
                // Перерисовываем лабиринт
                this.drawMaze();
            } else if (e.touches.length === 2) {
                e.preventDefault();
                // Вычисляем новое расстояние для масштабирования
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const currentPinchDistance = Math.hypot(
                    touch1.clientX - touch2.clientX,
                    touch1.clientY - touch2.clientY
                );
                
                // Вычисляем центр между двумя точками касания
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                
                // Вычисляем новый масштаб
                const pinchRatio = currentPinchDistance / this.initialPinchDistance;
                const newScale = Math.max(0.5, Math.min(3, this.initialScale * pinchRatio));
                
                // Применяем масштаб и обновляем смещение
                const rect = this.canvas.getBoundingClientRect();
                const canvasX = centerX - rect.left;
                const canvasY = centerY - rect.top;
                
                this.offsetX = canvasX - (canvasX - this.offsetX) * (newScale / this.scale);
                this.offsetY = canvasY - (canvasY - this.offsetY) * (newScale / this.scale);
                this.scale = newScale;
                
                // Перерисовываем лабиринт
                this.drawMaze();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Обработчики для экрана выбора
        this.snailOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Убираем выделение с предыдущей выбранной улитки
                this.snailOptions.forEach(o => o.classList.remove('selected'));
                // Выделяем выбранную улитку
                option.classList.add('selected');
                
                // Сохраняем тип выбранной улитки
                this.selectedSnailType = option.dataset.snailType;
                
                // Сохраняем цвет выбранной улитки (используем originalColor или текущий цвет)
                this.selectedSnailColor = option.dataset.originalColor || 
                    option.dataset.snailColor || 
                    option.querySelector('span').textContent;
                
                // Сохраняем путь к изображению, если доступен
                const imgElement = option.querySelector('img');
                if (imgElement) {
                    this.selectedSnailImage = option.dataset.originalImage || imgElement.src;
                }
                
                // Сохраняем данные о выбранной улитке для использования при создании гонки
                this.selectedSnailData = {
                    type: this.selectedSnailType,
                    color: this.selectedSnailColor,
                    image: this.selectedSnailImage,
                    element: option
                };
                
                console.log(`Выбрана улитка: тип=${this.selectedSnailType}, цвет=${this.selectedSnailColor}, изображение=${this.selectedSnailImage || 'не задано'}`);
            });
        });
        
        // Обработчик для поля ввода ставки
        if (this.betAmount) {
            this.betAmount.addEventListener('change', () => {
                this.setBet(parseInt(this.betAmount.value, 10));
            });
        }
        
        // Обработчик для кнопки начала гонки
        if (this.startRaceButton) {
            this.startRaceButton.addEventListener('click', () => {
                // Воспроизводим звук щелчка
                this.playSound(ASSETS.SOUNDS.CLICK);
                
                // Проверяем, выбрана ли улитка
                if (!this.selectedSnailType) {
                    alert('Пожалуйста, выберите улитку для гонки!');
                    return;
                }
                
                // Проверяем, достаточно ли баланса
                if (this.balance < this.bet) {
                    alert('Недостаточно средств для ставки!');
                    return;
                }
                
                // Запускаем гонку
                this.startRace();
            });
        }
        
        // При загрузке игры рандомизируем улиток
        // Закомментировано, так как рандомизация происходит в конструкторе
        // document.addEventListener('DOMContentLoaded', () => {
        //     this.randomizeSnailTypes();
        // });
        
        // Рандомизация при возврате к экрану выбора
        this.backToSelectionButton.addEventListener('click', () => {
            this.hideAllScreens();
            this.showSelectionScreen();
            this.randomizeSnailTypes();
        });
        
        // Рандомизация при повторной игре
        this.playAgainButton.addEventListener('click', () => {
            this.hideAllScreens();
            this.showSelectionScreen();
            this.randomizeSnailTypes();
        });
        
        // Добавляем скрытые функции масштабирования
        document.addEventListener('keydown', (e) => {
            // Ctrl + плюс для увеличения масштаба
            if (e.ctrlKey && e.key === '=') {
                e.preventDefault();
                this.zoomIn();
            }
            // Ctrl + минус для уменьшения масштаба
            else if (e.ctrlKey && e.key === '-') {
                e.preventDefault();
                this.zoomOut();
            }
            // Ctrl + 0 для сброса масштаба
            else if (e.ctrlKey && e.key === '0') {
                e.preventDefault();
                this.resetZoom();
            }
        });
        
        // События гонки
        document.addEventListener('raceFinished', (event) => {
            this.handleRaceFinished(event.detail);
        });
        
        // Обработчик для анимационного цикла
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Загрузка ресурсов перед началом игры
     */
    loadResources() {
        // Показываем экран загрузки
        this.showLoadingScreen();
        
        // Предварительно загружаем аудиофайлы
        this.preloadAudioFiles();
        
        // Загружаем ресурсы с использованием ASSETS
        ASSETS.loadResources(
            // Коллбэк прогресса загрузки
            (loaded, total) => {
                const progress = Math.floor((loaded / total) * 100);
                this.loadingProgress.style.width = `${progress}%`;
                this.loadingText.textContent = `Загрузка ресурсов: ${progress}% (${loaded}/${total})`;
            },
            // Коллбэк завершения загрузки
            () => {
                console.log('Все ресурсы загружены');
                this.isLoading = false;
                
                // Скрываем экран загрузки и показываем игру через 500мс
                setTimeout(() => {
                    this.hideLoadingScreen();
                    this.showSelectionScreen();
                }, 500);
            }
        );
    }
    
    /**
     * Предварительная загрузка аудиофайлов
     */
    preloadAudioFiles() {
        console.log("Предварительная загрузка аудиофайлов");
        
        // Создаем функцию для инициализации аудио после взаимодействия с пользователем
        const initializeAudio = () => {
            // Проверяем доступность файла
            const checkFileExists = async (url) => {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    return response.ok;
                } catch (e) {
                    console.error(`Ошибка проверки файла ${url}:`, e);
                    return false;
                }
            };
            
            // Список всех звуковых файлов для предзагрузки
            const audioFiles = [
                ASSETS.SOUNDS.CLICK,
                ASSETS.SOUNDS.BOMB,
                ASSETS.SOUNDS.ROCKET,
                ASSETS.SOUNDS.FINISH,
                ASSETS.SOUNDS.RACE_START,
                ASSETS.SOUNDS.RACE_MUSIC
            ];
            
            // Для каждого файла создаем Audio элемент и загружаем его
            audioFiles.forEach(async (file) => {
                if (!file) return;
                
                try {
                    const audioUrl = file; // Используем простой путь без URL конструктора
                    console.log(`Предзагрузка аудио: ${audioUrl}`);
                    
                    const audio = new Audio();
                    audio.addEventListener('canplaythrough', () => {
                        console.log(`Аудиофайл загружен: ${file}`);
                    });
                    
                    audio.addEventListener('error', (e) => {
                        console.error(`Ошибка загрузки аудио ${file}:`, e);
                    });
                    
                    audio.preload = 'auto';
                    audio.src = audioUrl;
                    
                    // Сохраняем ссылку на аудио объект для предотвращения сборки мусора
                    if (!this.preloadedAudio) this.preloadedAudio = [];
                    this.preloadedAudio.push(audio);
                } catch (e) {
                    console.error(`Ошибка при подготовке аудио ${file}:`, e);
                }
            });
            
            // Удаляем обработчик после инициализации
            document.removeEventListener('click', initializeAudioContext);
        };
        
        // Инициализируем AudioContext после взаимодействия с пользователем
        const initializeAudioContext = () => {
            console.log("Разблокировка аудио контекста по взаимодействию с пользователем");
            // Создаем и разблокируем AudioContext
            if (!window.audioContext) {
                try {
                    window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (window.audioContext.state === 'suspended') {
                        window.audioContext.resume();
                    }
                } catch (e) {
                    console.error("Не удалось создать AudioContext:", e);
                    return;
                }
            }
            
            // Теперь, когда контекст разблокирован, инициализируем аудио
            initializeAudio();
        };
        
        // Добавляем обработчик для инициализации аудио после клика пользователя
        document.addEventListener('click', initializeAudioContext, { once: true });
    }
    
    /**
     * Показ экрана загрузки
     */
    showLoadingScreen() {
        this.loader.classList.remove('hidden');
        this.mainGame.classList.add('hidden');
        this.selectionScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
    }
    
    /**
     * Скрытие экрана загрузки
     */
    hideLoadingScreen() {
        this.loader.classList.add('hidden');
        this.mainGame.classList.remove('hidden');
        this.selectionScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
    }
    
    /**
     * Установка ставки
     * @param {number} amount - сумма ставки
     */
    setBet(amount) {
        // Проверяем, что ставка не больше баланса
        const maxBet = Math.min(ASSETS.GAME.MAX_BET, this.balance);
        this.bet = Math.min(maxBet, Math.max(amount, ASSETS.GAME.MIN_BET));
        
        // Обновляем поле ввода ставки, если оно существует
        if (this.betAmount) {
            this.betAmount.value = this.bet;
        }
    }
    
    /**
     * Обновление отображения баланса
     */
    updateBalanceDisplay() {
        if (this.balanceAmount) {
            this.balanceAmount.textContent = this.balance;
        }
        
        if (this.newBalance) {
            this.newBalance.textContent = this.balance;
        }
    }
    
    /**
     * Показать экран выбора улитки
     */
    showSelectionScreen() {
        // Скрываем все экраны
        this.hideAllScreens();
        
        // Показываем экран выбора
        this.selectionScreen.classList.remove('hidden');
        
        // Сбрасываем гонку, если она была активна
        if (this.isRaceActive) {
            this.endRace();
        }
        
        // Обновляем максимально возможную ставку
        this.betAmount.max = Math.min(ASSETS.GAME.MAX_BET, this.balance);
        
        // Если ставка больше баланса, уменьшаем её
        if (this.bet > this.balance) {
            this.setBet(this.balance);
        }
        
        // Обновляем отображение баланса
        this.updateBalanceDisplay();
    }
    
    /**
     * Скрытие всех экранов игры
     */
    hideAllScreens() {
        this.selectionScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
    }
    
    /**
     * Показать игровой экран
     */
    showGameScreen() {
        this.loader.classList.add('hidden');
        this.mainGame.classList.remove('hidden');
        this.selectionScreen.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.resultsScreen.classList.add('hidden');
        
        // Создаем лабиринт, если его еще нет
        if (!this.maze) {
            this.maze = new Maze(this.difficulty);
        }
        
        // Отрисовываем лабиринт
        this.drawMaze();
        
        // Обновляем отображение текущей ставки
        this.currentBetDisplay.textContent = this.bet;
    }
    
    /**
     * Показать экран результатов
     */
    showResultsScreen() {
        this.loader.classList.add('hidden');
        this.mainGame.classList.remove('hidden');
        this.selectionScreen.classList.add('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
    }
    
    /**
     * Старт гонки
     */
    startRace() {
        if (this.isRaceActive) return;
        
        console.log('Начинаем гонку...');
        this.isRaceActive = true;
        
        // Скрываем экран выбора улитки
        const selectionScreen = document.getElementById('snail-selection');
        if (selectionScreen) selectionScreen.style.display = 'none';
        
        // Находим и обновляем выбранную улитку
        if (!this.selectedSnailType) {
            const selectedOption = document.querySelector('.snail-option.selected');
            if (selectedOption) {
                this.selectedSnailType = selectedOption.dataset.snailType;
                this.selectedSnailColor = selectedOption.dataset.snailColor;
                this.selectedSnailBehavior = selectedOption.dataset.snailBehavior;
                console.log(`Выбрана улитка типа ${this.selectedSnailType} с цветом ${this.selectedSnailColor} и поведением ${this.selectedSnailBehavior}`);
            } else {
                // Если ничего не выбрано, берем случайную улитку
                console.log('Не выбрана улитка, выбираем случайную');
                const randomIndex = Math.floor(Math.random() * this.snailOptions.length);
                const randomOption = this.snailOptions[randomIndex];
                this.selectedSnailType = randomOption.dataset.snailType;
                this.selectedSnailColor = randomOption.dataset.snailColor;
                this.selectedSnailBehavior = randomOption.dataset.snailBehavior;
                console.log(`Выбрана случайная улитка типа ${this.selectedSnailType} с цветом ${this.selectedSnailColor} и поведением ${this.selectedSnailBehavior}`);
            }
        }
        
        // НОВОЕ: Сохраняем данные о выбранной улитке перед запуском гонки
        if (this.selectedSnailType && this.selectedSnailColor) {
            console.log(`Запоминаем данные о выбранной улитке: тип=${this.selectedSnailType}, цвет=${this.selectedSnailColor}, поведение=${this.selectedSnailBehavior}`);
            
            // Сохраняем в глобальной области для доступа в других местах
            window.PLAYER_SNAIL_COLOR = this.selectedSnailColor;
            window.PLAYER_SNAIL_BEHAVIOR = this.selectedSnailBehavior;
            
            // Обновляем карту цветов улиток
            if (window.SNAIL_COLORS_MAP) {
                window.SNAIL_COLORS_MAP.set(this.selectedSnailType, this.selectedSnailColor);
            } else {
                window.SNAIL_COLORS_MAP = new Map();
                window.SNAIL_COLORS_MAP.set(this.selectedSnailType, this.selectedSnailColor);
            }
            
            // Обновляем словарь соответствия типов улиток цветам
            if (!window.SNAIL_TYPE_TO_COLOR) {
                window.SNAIL_TYPE_TO_COLOR = {};
            }
            window.SNAIL_TYPE_TO_COLOR[this.selectedSnailType] = this.selectedSnailColor;
            
            // Добавляем в RANDOMIZED_SNAILS запись игрока, если ещё не добавлена
            if (!window.RANDOMIZED_SNAILS) {
                window.RANDOMIZED_SNAILS = [];
            }
            
            const existingSnailIndex = window.RANDOMIZED_SNAILS.findIndex(s => s.type === this.selectedSnailType);
            if (existingSnailIndex >= 0) {
                // Обновляем существующую запись
                window.RANDOMIZED_SNAILS[existingSnailIndex].color = this.selectedSnailColor;
                window.RANDOMIZED_SNAILS[existingSnailIndex].originalColor = this.selectedSnailColor;
                window.RANDOMIZED_SNAILS[existingSnailIndex].behavior = this.selectedSnailBehavior;
                window.RANDOMIZED_SNAILS[existingSnailIndex].isPlayer = true;
            } else {
                // Добавляем новую запись
                window.RANDOMIZED_SNAILS.push({
                    type: this.selectedSnailType,
                    color: this.selectedSnailColor,
                    originalColor: this.selectedSnailColor,
                    behavior: this.selectedSnailBehavior,
                    isPlayer: true
                });
            }
        }
        
        // Обновляем состояние игры
        this.raceStartTime = Date.now();
        this.elapsedTime = 0;
        
        // Скрываем экран выбора
        this.hideAllScreens();
        
        // Показываем игровой экран
        this.showGameScreen();
        
        // Устанавливаем статус гонки
        this.raceStatusDisplay.textContent = "Подготовка к гонке...";
        
        // Воспроизводим звук начала гонки
        this.playSound(ASSETS.SOUNDS.RACE_START);
        
        // Вычитаем ставку из баланса
        this.balance -= this.bet;
        this.updateBalanceDisplay();
        
        // Создаем лабиринт и улиток
        const difficulty = this.difficulty || 'medium';
        console.log(`Создание лабиринта (сложность: ${difficulty})...`);
        
        // Получаем настройки лабиринта из ASSETS
        const mazeConfig = ASSETS.MAZE[difficulty.toUpperCase()] || ASSETS.MAZE.MEDIUM;
        console.log('Конфигурация лабиринта:', mazeConfig);
        
        // Создаем новый лабиринт
        this.maze = new Maze(difficulty);
        console.log('Лабиринт создан:', this.maze);
        
        // ОТЛАДКА: Выводим информацию о выбранной улитке
        console.log("ОТЛАДКА ПЕРЕД СОЗДАНИЕМ УЛИТОК:");
        console.log(`- Выбранный тип: ${this.selectedSnailType}`);
        console.log(`- Выбранный цвет: ${this.selectedSnailColor}`);
        console.log(`- Глобальный цвет: ${window.PLAYER_SNAIL_COLOR}`);
        console.log(`- Данные рандомизации:`, window.RANDOMIZED_SNAILS);
        
        // Создаем менеджер улиток
        this.snailManager = new SnailManager(this.selectedSnailType, this.maze);
        
        // НОВОЕ: Если у нас есть информация о цвете или поведении, передаем их в менеджер улиток
        if (this.selectedSnailColor || this.selectedSnailBehavior) {
            console.log(`Передаем свойства улитки в менеджер: цвет=${this.selectedSnailColor}, поведение=${this.selectedSnailBehavior}`);
            
            // Проверяем наличие нового метода перед вызовом
            if (typeof this.snailManager.setPlayerSnailProperties === 'function') {
                this.snailManager.setPlayerSnailProperties(this.selectedSnailColor, this.selectedSnailBehavior);
            } 
            // Для обратной совместимости
            else if (typeof this.snailManager.setPlayerSnailColor === 'function') {
                this.snailManager.setPlayerSnailColor(this.selectedSnailColor);
                console.warn('Метод setPlayerSnailProperties не найден, используется устаревший метод setPlayerSnailColor');
            } 
            else {
                console.warn('Методы установки свойств улитки не найдены в snailManager. Возможно, кэш браузера не обновлен.');
                
                // Альтернативное решение: устанавливаем свойства напрямую в улитку игрока
                if (this.snailManager.playerSnail) {
                    console.log('Устанавливаем свойства напрямую для улитки игрока');
                    if (this.selectedSnailColor) {
                        this.snailManager.playerSnail.originalColor = this.selectedSnailColor;
                    }
                    if (this.selectedSnailBehavior) {
                        this.snailManager.playerSnail.behavior = this.selectedSnailBehavior.toLowerCase();
                    }
                }
            }
        }
        
        console.log('Менеджер улиток создан:', this.snailManager);
        
        // Отрисовываем лабиринт
        this.drawMaze();
        
        // Добавляем анимацию обратного отсчета перед началом гонки
        let countdownValue = 3;
        
        const animateNumber = (number, isStart = false) => {
            // Создаем элемент счетчика, если это начало
            if (isStart) {
                const countdownOverlay = document.createElement('div');
                countdownOverlay.id = 'countdown-overlay';
                countdownOverlay.style.position = 'absolute';
                countdownOverlay.style.top = '0';
                countdownOverlay.style.left = '0';
                countdownOverlay.style.width = '100%';
                countdownOverlay.style.height = '100%';
                countdownOverlay.style.display = 'flex';
                countdownOverlay.style.justifyContent = 'center';
                countdownOverlay.style.alignItems = 'center';
                countdownOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                countdownOverlay.style.color = 'white';
                countdownOverlay.style.fontSize = '72px';
                countdownOverlay.style.fontWeight = 'bold';
                countdownOverlay.style.zIndex = '1000';
                countdownOverlay.textContent = number;
                
                // Добавляем счетчик в контейнер лабиринта
                this.mazeContainer.appendChild(countdownOverlay);
                
                // Добавляем анимацию
                countdownOverlay.animate([
                    { opacity: 0, transform: 'scale(0.5)' },
                    { opacity: 1, transform: 'scale(1.2)' },
                    { opacity: 1, transform: 'scale(1)' },
                    { opacity: 0, transform: 'scale(3)' }
                ], {
                    duration: 1000,
                    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                });
                
                // Следующее число или запуск гонки
                setTimeout(() => {
                    // Удаляем элемент счетчика
                    countdownOverlay.remove();
                    
                    if (number > 1) {
                        // Анимируем следующее число
                        animateNumber(number - 1);
                    } else {
                        // Запускаем гонку
                        this.launchRace();
                    }
                }, 1000);
            } else {
                // Создаем новый элемент счетчика
                const countdownOverlay = document.createElement('div');
                countdownOverlay.id = 'countdown-overlay';
                countdownOverlay.style.position = 'absolute';
                countdownOverlay.style.top = '0';
                countdownOverlay.style.left = '0';
                countdownOverlay.style.width = '100%';
                countdownOverlay.style.height = '100%';
                countdownOverlay.style.display = 'flex';
                countdownOverlay.style.justifyContent = 'center';
                countdownOverlay.style.alignItems = 'center';
                countdownOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                countdownOverlay.style.color = 'white';
                countdownOverlay.style.fontSize = '72px';
                countdownOverlay.style.fontWeight = 'bold';
                countdownOverlay.style.zIndex = '1000';
                countdownOverlay.textContent = number;
                
                // Добавляем счетчик в контейнер лабиринта
                this.mazeContainer.appendChild(countdownOverlay);
                
                // Добавляем анимацию
                countdownOverlay.animate([
                    { opacity: 0, transform: 'scale(0.5)' },
                    { opacity: 1, transform: 'scale(1.2)' },
                    { opacity: 1, transform: 'scale(1)' },
                    { opacity: 0, transform: 'scale(3)' }
                ], {
                    duration: 1000,
                    easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                });
                
                // Следующее число или запуск гонки
                setTimeout(() => {
                    // Удаляем элемент счетчика
                    countdownOverlay.remove();
                    
                    if (number > 1) {
                        // Анимируем следующее число
                        animateNumber(number - 1);
                    } else {
                        // Запускаем гонку
                        this.launchRace();
                    }
                }, 1000);
            }
        };
        
        // Начинаем анимацию обратного отсчета
        animateNumber(countdownValue, true);
    }
    
    /**
     * Запуск гонки после обратного отсчета
     */
    launchRace() {
        if (!this.isRaceActive) return;
        
        // Обновляем время старта
        this.raceStartTime = Date.now();
        
        // Запускаем гонку в менеджере улиток
        if (this.snailManager) {
            this.snailManager.startRace(Date.now());
        }
        
        // Запускаем игровой цикл, если он еще не запущен
        if (!this.gameLoopRunning) {
            this.gameLoopRunning = true;
            this.lastFrameTime = null;
            window.requestAnimationFrame(this.gameLoop.bind(this));
        }
        
        // Устанавливаем таймер на завершение гонки через 1 минуту
        this.raceTimeout = setTimeout(() => {
            console.log("Гонка завершается по таймауту (1 минута)");
            this.endRace();
        }, ASSETS.GAME.RACE_DURATION_MS);
        
        console.log("Гонка запущена!");
        this.raceStatusDisplay.textContent = "Гонка началась!";
    }
    
    /**
     * Отрисовка лабиринта
     */
    drawMaze() {
        if (!this.ctx || !this.canvas || !this.maze) {
            console.error('Нет контекста, холста или лабиринта!');
            return;
        }
        
        // Очищаем холст
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Применяем трансформации
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        
        // Отрисовываем лабиринт
        this.maze.draw(this.ctx);
        
        // Отрисовываем улиток
        if (this.snailManager) {
            this.snailManager.draw(this.ctx);
        }
        
        // Восстанавливаем контекст
        this.ctx.restore();
    }
    
    /**
     * Завершение гонки
     */
    endRace() {
        if (!this.isRaceActive) return;
        
        // Останавливаем таймаут
        if (this.raceTimeout) {
            clearTimeout(this.raceTimeout);
            this.raceTimeout = null;
        }
        
        // Принудительно завершаем гонку
        if (this.snailManager) {
            this.snailManager.forceEndRace();
        }
        
        // Обновляем состояние
        this.isRaceActive = false;
        this.raceStatusDisplay.textContent = 'Гонка завершена!';
        
        // Обрабатываем результаты гонки
        const finishedSnails = this.snailManager.getFinishedSnails();
        this.handleRaceFinished({ finishedSnails });
    }
    
    /**
     * Отображает позиции улиток в гонке
     * @param {Array} finishedSnails - Массив улиток, финишировавших в гонке
     */
    displayRacePositions(finishedSnails) {
        if (!this.racePositions) {
            console.error('Элемент для отображения позиций не найден');
            return;
        }
        
        // Проверяем данные улиток для отладки
        console.log("Исходные данные улиток перед сортировкой:", finishedSnails.map(snail => ({
            type: snail.type,
            isPlayer: snail.isPlayer || snail.type === this.selectedSnailType,
            color: snail.originalColor || '[не задан]',
            finishTime: snail.finishTime,
            relativeTime: snail.finishTime - this.raceStartTime,
            distanceToFinish: snail.distanceToFinish || 0
        })));
        
        // Сортируем улиток по относительному времени финиша (от наименьшего к наибольшему)
        const sortedSnails = [...finishedSnails].sort((a, b) => {
            const timeA = a.finishTime - this.raceStartTime;
            const timeB = b.finishTime - this.raceStartTime;
            return timeA - timeB;
        });
        
        // Проверяем данные после сортировки
        console.log("Отсортированные данные улиток:", sortedSnails.map(snail => ({
            type: snail.type,
            isPlayer: snail.isPlayer || snail.type === this.selectedSnailType,
            color: snail.originalColor || '[не задан]',
            finishTime: snail.finishTime,
            relativeTime: snail.finishTime - this.raceStartTime,
            distanceToFinish: snail.distanceToFinish || 0
        })));
        
        // Обновляем позиции улиток после сортировки
        sortedSnails.forEach((snail, index) => {
            snail.position = index + 1;
        });
        
        // Очищаем содержимое
        this.racePositions.innerHTML = '';
        
        // Создаем таблицу с результатами
        const table = document.createElement('table');
        table.className = 'race-results-table';
        
        // Создаем заголовок таблицы
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // ПРОВЕРЯЕМ: явно задаем заголовки столбцов
        const headers = ['Place', 'Color', 'Type', 'Behavior', 'Time', 'Prize'];
        console.log("Создаем заголовки столбцов:", headers);
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Создаем тело таблицы
        const tbody = document.createElement('tbody');
        
        // Стандартное соответствие типов улиток с их названиями
        const typeNames = {
            'racer': 'Racer',
            'explorer': 'Explorer',
            'snake': 'Snake',
            'stubborn': 'Stubborn',
            'deadender': 'Deadender'
        };
        
        // Функция для получения корректных данных улитки
        const getSnailData = (snail) => {
            // Если у улитки есть оригинальный цвет, используем его
            if (snail.originalColor) {
                return {
                    color: snail.originalColor,
                    type: typeNames[snail.type] || snail.type,
                    behavior: getSnailBehavior(snail.type)
                };
            }
            
            // Ищем в рандомизированных данных
            if (window.RANDOMIZED_SNAILS) {
                const snailData = window.RANDOMIZED_SNAILS.find(s => s.type === snail.type);
                if (snailData) {
                    return {
                        color: snailData.originalColor || snailData.color,
                        type: typeNames[snail.type] || snail.type,
                        behavior: snailData.behavior || getSnailBehavior(snail.type)
                    };
                }
            }
            
            // Если не нашли, возвращаем стандартные данные
            return {
                color: snail.color || getDefaultColor(snail.type),
                type: typeNames[snail.type] || snail.type,
                behavior: getSnailBehavior(snail.type)
            };
        };
        
        // Вспомогательная функция для получения поведения по типу
        const getSnailBehavior = (snailType) => {
            // Если у нас есть рандомизированные данные
            if (window.RANDOMIZED_SNAILS) {
                const snailData = window.RANDOMIZED_SNAILS.find(s => s.type === snailType);
                if (snailData && snailData.behavior) {
                    return snailData.behavior;
                }
            }
            
            // Стандартное поведение
            return typeNames[snailType] || snailType;
        };
        
        // Функция для получения стандартного цвета по типу улитки
        const getDefaultColor = (snailType) => {
            const defaultColors = {
                'racer': 'Red',
                'explorer': 'Blue',
                'snake': 'Green',
                'stubborn': 'Purple',
                'deadender': 'Yellow'
            };
            return defaultColors[snailType] || 'Gray';
        };
        
        // Добавляем строки для каждой улитки
        sortedSnails.forEach(snail => {
            const row = document.createElement('tr');
            
            // Определяем, является ли улитка игроком
            const isPlayer = snail.isPlayer || snail.type === this.selectedSnailType;
            
            if (isPlayer) {
                row.className = 'player-snail';
            }
            
            // Колонка 1: Место
            const positionCell = document.createElement('td');
            positionCell.textContent = snail.position;
            
            // Добавляем классы для медалей
            if (snail.position === 1) positionCell.className = 'gold';
            else if (snail.position === 2) positionCell.className = 'silver';
            else if (snail.position === 3) positionCell.className = 'bronze';
            
            row.appendChild(positionCell);
            
            // Получаем данные улитки
            const snailData = getSnailData(snail);
            console.log(`Данные улитки ${snail.type}:`, snailData);
            
            // Колонка 2: Цвет улитки
            const colorCell = document.createElement('td');
            colorCell.textContent = `${snailData.color}${isPlayer ? ' (You)' : ''}`;
            row.appendChild(colorCell);
            
            // Колонка 3: Тип улитки
            const typeCell = document.createElement('td');
            typeCell.textContent = snailData.type;
            row.appendChild(typeCell);
            
            // Колонка 4: Класс поведения улитки
            const behaviorCell = document.createElement('td');
            behaviorCell.textContent = snailData.behavior;
            behaviorCell.style.fontStyle = 'italic';
            row.appendChild(behaviorCell);
            
            // Колонка 5: Время финиша
            const timeCell = document.createElement('td');
            if (snail.displayFinishTime) {
                timeCell.textContent = snail.displayFinishTime;
            } else {
                const timeMs = snail.finishTime - this.raceStartTime;
                const timeStr = this.formatRaceTime(timeMs);
                timeCell.textContent = timeStr;
            }
            row.appendChild(timeCell);
            
            // Колонка 6: Выигрыш/проигрыш
            const prizeCell = document.createElement('td');
            if (isPlayer) {
                let prizeText = '';
                let prizeClass = '';
                
                // Расчет приза в зависимости от места
                if (snail.position === 1) {
                    const winnings = Math.floor(this.bet * ASSETS.GAME.FIRST_PLACE_MULTIPLIER);
                    prizeText = `+${winnings} (x5)`;
                    prizeClass = 'win';
                } else if (snail.position === 2) {
                    const refund = Math.floor(this.bet * ASSETS.GAME.SECOND_PLACE_MULTIPLIER);
                    prizeText = `+${refund} (50%)`;
                    prizeClass = 'partial-win';
                } else if (snail.position === 3) {
                    const refund = Math.floor(this.bet * ASSETS.GAME.THIRD_PLACE_MULTIPLIER);
                    prizeText = `+${refund} (25%)`;
                    prizeClass = 'partial-win';
                } else {
                    prizeText = `-${this.bet}`;
                    prizeClass = 'lose';
                }
                
                prizeCell.textContent = prizeText;
                prizeCell.className = prizeClass;
            } else {
                prizeCell.textContent = '-';
            }
            row.appendChild(prizeCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.racePositions.appendChild(table);
        
        // Добавляем CSS стили для таблицы, если их еще нет
        if (!document.getElementById('race-results-table-style')) {
            const style = document.createElement('style');
            style.id = 'race-results-table-style';
            style.textContent = `
                .race-results-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    font-size: 16px;
                }
                .race-results-table th, .race-results-table td {
                    padding: 8px 12px;
                    text-align: center;
                    border: 1px solid #e0e0e0;
                }
                .race-results-table th {
                    background-color: #f5f5f5;
                    font-weight: bold;
                }
                .race-results-table tr:nth-child(even) {
                    background-color: #f9f9f9;
                }
                .race-results-table .player-snail {
                    font-weight: bold;
                    background-color: rgba(255, 235, 59, 0.1);
                }
                .gold {
                    color: gold;
                    font-weight: bold;
                }
                .silver {
                    color: silver;
                    font-weight: bold;
                }
                .bronze {
                    color: #cd7f32;
                    font-weight: bold;
                }
                .win {
                    color: #00c853;
                    font-weight: bold;
                }
                .partial-win {
                    color: #2196f3;
                    font-weight: bold;
                }
                .lose {
                    color: #f44336;
                    font-weight: bold;
                }
                .snail-class {
                    font-style: italic;
                    color: #555;
                }
            `;
            
            document.head.appendChild(style);
        }
    }
    
    /**
     * Форматирует время гонки в читаемый формат
     * @param {number} timeMs - Время в миллисекундах
     * @returns {string} Отформатированное время
     */
    formatRaceTime(timeMs) {
        const seconds = Math.floor(timeMs / 1000);
        const milliseconds = Math.floor((timeMs % 1000) / 10).toString().padStart(2, '0');
        return `${seconds}.${milliseconds}s`;
    }
    
    /**
     * Обновление индикатора масштаба и стиля лабиринта
     */
    updateScaleIndicator() {
        // Пустая функция, так как элементы отображения удалены
        // Но сохраняем метод для обратной совместимости с остальным кодом
    }
    
    /**
     * Игровой цикл
     */
    gameLoop(timestamp) {
        // Вычисляем время между кадрами
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;
        
        // Если гонка активна, обновляем улиток
        if (this.isRaceActive && this.snailManager) {
            this.snailManager.update(deltaTime);
            
            // Перерисовываем лабиринт и улиток
            this.drawMaze();
        }
        
        // Запрашиваем следующий кадр
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Обновление состояния игры
     */
    update(deltaTime) {
        if (!this.isRaceActive) return;
        
        // Обновление состояния гонки
        this.elapsedTime += deltaTime;
        this.updateRaceStatus();
        
        // Обновление состояния улиток
        if (this.snailManager) {
            this.snailManager.update(deltaTime);
            
            // Отладочная информация
            if (Date.now() % 1000 < 50) {
                console.log("Обновление улиток происходит!");
            }
        }
        
        // Очистка холста перед отрисовкой
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовка лабиринта
        if (this.maze) {
            this.maze.draw(this.ctx);
        }
        
        // Отрисовка улиток на холсте
        if (this.snailManager) {
            // Принудительно добавляем код для отладки позиций улиток
            console.log("Отрисовка улиток...");
            
            // Отрисовываем всех улиток
            this.snailManager.draw(this.ctx);
            
            // Дополнительно выделим улиток яркими маркерами для отладки
            const snails = this.snailManager.snails;
            if (snails && snails.length > 0) {
                for (const snail of snails) {
                    if (!snail.row || !snail.col) {
                        console.warn(`Улитка ${snail.type} не имеет корректных координат:`, snail);
                        continue;
                    }
                    
                    // Отображаем яркие маркеры позиций улиток
                    const x = snail.col * ASSETS.CELL_SIZE + ASSETS.CELL_SIZE / 2;
                    const y = snail.row * ASSETS.CELL_SIZE + ASSETS.CELL_SIZE / 2;
                    
                    this.ctx.save();
                    this.ctx.fillStyle = snail.isPlayer ? '#FF0000' : '#00FF00';
                    this.ctx.globalAlpha = 0.7;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, ASSETS.CELL_SIZE / 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                    
                    console.log(`Улитка ${snail.type} отрисована на позиции (${snail.row}, ${snail.col})`);
                }
            } else {
                console.warn("Улитки отсутствуют или не инициализированы!");
            }
        }
    }
    
    /**
     * Обновление статуса гонки
     */
    updateRaceStatus() {
        if (!this.raceStartTime || !this.isRaceActive) return;
        
        // Рассчитываем прошедшее время
        const elapsed = Date.now() - this.raceStartTime;
        const seconds = Math.floor(elapsed / 1000);
        const milliseconds = Math.floor((elapsed % 1000) / 10);
        
        // Форматируем время
        const timeStr = `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
        
        // Рассчитываем оставшееся время
        const remainingMs = Math.max(0, ASSETS.GAME.RACE_DURATION_MS - elapsed);
        const remainingSeconds = Math.floor(remainingMs / 1000);
        const remainingMilliseconds = Math.floor((remainingMs % 1000) / 10);
        
        // Форматируем оставшееся время
        const minutesPart = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secondsPart = (remainingSeconds % 60).toString().padStart(2, '0');
        const remainingTimeStr = `${minutesPart}:${secondsPart}`;
        
        // Обновляем отображение
        this.raceStatusDisplay.innerHTML = `
            <div>Время: ${timeStr}с</div>
            <div style="color: ${remainingSeconds <= 10 ? '#ff3333' : '#ffffff'}; 
                       font-weight: ${remainingSeconds <= 10 ? 'bold' : 'normal'}">
                Осталось: ${remainingTimeStr}
            </div>
        `;
        
        // Если осталось мало времени (10 секунд или меньше), добавляем анимацию мигания
        if (remainingSeconds <= 10) {
            if (!this.raceStatusDisplay.classList.contains('blinking')) {
                this.raceStatusDisplay.classList.add('blinking');
                
                // Добавляем стиль анимации, если его еще нет
                if (!document.getElementById('blink-animation-style')) {
                    const style = document.createElement('style');
                    style.id = 'blink-animation-style';
                    style.textContent = `
                        @keyframes blink {
                            0% { opacity: 1; }
                            50% { opacity: 0.5; }
                            100% { opacity: 1; }
                        }
                        .blinking {
                            animation: blink 1s infinite;
                        }
                    `;
                    document.head.appendChild(style);
                }
            }
        } else {
            this.raceStatusDisplay.classList.remove('blinking');
        }
        
        // Принудительно завершаем гонку, если превышено максимальное время
        if (elapsed >= ASSETS.GAME.RACE_DURATION_MS) {
            this.endRace();
        }
    }
    
    /**
     * Увеличение масштаба
     */
    zoomIn() {
        const newScale = Math.min(3, this.scale + 0.2);
        if (this.scale !== newScale) {
            // Вычисляем центр видимой области
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Пересчитываем смещение для сохранения центрирования
            this.offsetX = centerX - (centerX - this.offsetX) * (newScale / this.scale);
            this.offsetY = centerY - (centerY - this.offsetY) * (newScale / this.scale);
            
            this.scale = newScale;
            
            // Перерисовываем лабиринт
            this.drawMaze();
        }
    }
    
    /**
     * Уменьшение масштаба
     */
    zoomOut() {
        const newScale = Math.max(0.5, this.scale - 0.2);
        if (this.scale !== newScale) {
            // Вычисляем центр видимой области
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // Пересчитываем смещение для сохранения центрирования
            this.offsetX = centerX - (centerX - this.offsetX) * (newScale / this.scale);
            this.offsetY = centerY - (centerY - this.offsetY) * (newScale / this.scale);
            
            this.scale = newScale;
            
            // Перерисовываем лабиринт
            this.drawMaze();
        }
    }
    
    /**
     * Сброс масштаба
     */
    resetZoom() {
        // Восстанавливаем начальный масштаб и центрируем лабиринт
        const mazeConfig = ASSETS.MAZE[this.difficulty.toUpperCase()] || ASSETS.MAZE.MEDIUM;
        const rows = mazeConfig.ROWS + 5; // Добавляем +5 рядов
        const cols = mazeConfig.COLS + 5; // Добавляем +5 колонок
        const cellSize = ASSETS.CELL_SIZE;
        
        this.scale = 1.0; // Увеличиваем масштаб до 100% для лучшей видимости
        this.offsetX = (this.canvas.width / 2) - (cols * cellSize * this.scale / 2);
        this.offsetY = (this.canvas.height / 2) - (rows * cellSize * this.scale / 2);
        
        // Перерисовываем лабиринт
        this.drawMaze();
    }
    
    /**
     * Обновление игрового времени
     */
    updateGameTime() {
        // Если гонка не запущена, выходим
        if (!this.raceStarted) return;
        
        // Вычисляем прошедшее время
        const now = Date.now();
        const elapsed = now - this.raceStartTime;
        
        // Разбиваем на секунды и миллисекунды
        const seconds = Math.floor(elapsed / 1000);
        const milliseconds = Math.floor((elapsed % 1000) / 10);
        
        // Форматируем время
        const timeStr = `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
        
        // Обновляем отображение
        this.raceStatusDisplay.textContent = `Время: ${timeStr}с`;
        
        // Принудительно завершаем гонку, если превышено максимальное время
        if (elapsed >= ASSETS.GAME.RACE_DURATION_MS) {
            this.endRace();
        }
    }
    
    /**
     * Рандомно распределяет характеристики улиток перед началом гонки
     * с усиленной рандомизацией для получения более разнообразных результатов
     */
    randomizeSnailAbilities() {
        console.log("НАЧИНАЮ УСИЛЕННУЮ РАНДОМИЗАЦИЮ ХАРАКТЕРИСТИК УЛИТОК...");
        
        // Получаем все типы улиток
        const snailTypes = Object.keys(ASSETS.SNAIL_TYPES).map(key => ASSETS.SNAIL_TYPES[key].TYPE);
        
        // Создаем копию оригинальных характеристик, если мы еще ее не создали
        if (!this.originalSnailCharacteristics) {
            this.originalSnailCharacteristics = {};
            
            for (const key in ASSETS.SNAIL_TYPES) {
                this.originalSnailCharacteristics[key] = { ...ASSETS.SNAIL_TYPES[key] };
            }
        }
        
        // Функция для случайной модификации числового значения
        const randomizeValue = (baseValue, minMultiplier = 0.6, maxMultiplier = 1.8) => {
            const randomMultiplier = minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
            return baseValue * randomMultiplier;
        };
        
        // Создаем пул всех возможных характеристик из всех типов улиток
        const allCharacteristics = {};
        
        for (const key in this.originalSnailCharacteristics) {
            const type = this.originalSnailCharacteristics[key].TYPE;
            const originalChar = this.originalSnailCharacteristics[key];
            
            // Добавляем базовые характеристики с случайной модификацией
            if (!allCharacteristics.BASE_SPEED) allCharacteristics.BASE_SPEED = [];
            if (!allCharacteristics.SPEED_VARIATION) allCharacteristics.SPEED_VARIATION = [];
            
            allCharacteristics.BASE_SPEED.push(
                randomizeValue(originalChar.BASE_SPEED, 0.5, 2.0)
            );
            
            allCharacteristics.SPEED_VARIATION.push(
                randomizeValue(originalChar.SPEED_VARIATION, 0.5, 2.0)
            );
            
            // Добавляем специфичные характеристики
            switch (type) {
                case 'racer':
                    if (!allCharacteristics.BOOST_PROBABILITY) allCharacteristics.BOOST_PROBABILITY = [];
                    if (!allCharacteristics.BOOST_MULTIPLIER) allCharacteristics.BOOST_MULTIPLIER = [];
                    
                    allCharacteristics.BOOST_PROBABILITY.push(
                        randomizeValue(originalChar.BOOST_PROBABILITY, 0.3, 2.5)
                    );
                    allCharacteristics.BOOST_MULTIPLIER.push(
                        randomizeValue(originalChar.BOOST_MULTIPLIER, 0.5, 2.2)
                    );
                    break;
                    
                case 'explorer':
                    if (!allCharacteristics.EXPLORATION_RATE) allCharacteristics.EXPLORATION_RATE = [];
                    
                    allCharacteristics.EXPLORATION_RATE.push(
                        randomizeValue(originalChar.EXPLORATION_RATE, 0.3, 2.5)
                    );
                    break;
                    
                case 'snake':
                    if (!allCharacteristics.ZIGZAG_PROBABILITY) allCharacteristics.ZIGZAG_PROBABILITY = [];
                    
                    allCharacteristics.ZIGZAG_PROBABILITY.push(
                        randomizeValue(originalChar.ZIGZAG_PROBABILITY, 0.3, 2.5)
                    );
                    break;
                    
                case 'stubborn':
                    if (!allCharacteristics.FORWARD_PROBABILITY) allCharacteristics.FORWARD_PROBABILITY = [];
                    
                    allCharacteristics.FORWARD_PROBABILITY.push(
                        randomizeValue(originalChar.FORWARD_PROBABILITY, 0.3, 1.5)
                    );
                    break;
                    
                case 'deadender':
                    if (!allCharacteristics.RANDOM_TURN_PROBABILITY) allCharacteristics.RANDOM_TURN_PROBABILITY = [];
                    
                    allCharacteristics.RANDOM_TURN_PROBABILITY.push(
                        randomizeValue(originalChar.RANDOM_TURN_PROBABILITY, 0.3, 2.5)
                    );
                    break;
            }
        }
        
        // Перемешиваем характеристики в каждом пуле
        for (const key in allCharacteristics) {
            this.shuffleArray(allCharacteristics[key]);
        }
        
        // Применяем случайно выбранные характеристики ко всем улиткам
        // с шансом смешивания характеристик разных типов
        for (const key in ASSETS.SNAIL_TYPES) {
            const originalType = this.originalSnailCharacteristics[key].TYPE;
            
            // Базовые характеристики (общие для всех улиток)
            const baseSpeedIndex = Math.floor(Math.random() * allCharacteristics.BASE_SPEED.length);
            const speedVarIndex = Math.floor(Math.random() * allCharacteristics.SPEED_VARIATION.length);
            
            ASSETS.SNAIL_TYPES[key].BASE_SPEED = allCharacteristics.BASE_SPEED[baseSpeedIndex];
            ASSETS.SNAIL_TYPES[key].SPEED_VARIATION = allCharacteristics.SPEED_VARIATION[speedVarIndex];
            
            // Смешиваем специальные характеристики
            // Шанс 60%, что улитка получит характеристику не своего типа
            if (Math.random() < 0.6) {
                // Применяем характеристики случайного типа
                const randomType = snailTypes[Math.floor(Math.random() * snailTypes.length)];
                
                switch (randomType) {
                    case 'racer':
                        if (allCharacteristics.BOOST_PROBABILITY && allCharacteristics.BOOST_PROBABILITY.length > 0) {
                            const boostProbIndex = Math.floor(Math.random() * allCharacteristics.BOOST_PROBABILITY.length);
                            const boostMultIndex = Math.floor(Math.random() * allCharacteristics.BOOST_MULTIPLIER.length);
                            
                            ASSETS.SNAIL_TYPES[key].BOOST_PROBABILITY = allCharacteristics.BOOST_PROBABILITY[boostProbIndex];
                            ASSETS.SNAIL_TYPES[key].BOOST_MULTIPLIER = allCharacteristics.BOOST_MULTIPLIER[boostMultIndex];
                        }
                        break;
                        
                    case 'explorer':
                        if (allCharacteristics.EXPLORATION_RATE && allCharacteristics.EXPLORATION_RATE.length > 0) {
                            const explorationIndex = Math.floor(Math.random() * allCharacteristics.EXPLORATION_RATE.length);
                            ASSETS.SNAIL_TYPES[key].EXPLORATION_RATE = allCharacteristics.EXPLORATION_RATE[explorationIndex];
                        }
                        break;
                        
                    case 'snake':
                        if (allCharacteristics.ZIGZAG_PROBABILITY && allCharacteristics.ZIGZAG_PROBABILITY.length > 0) {
                            const zigzagIndex = Math.floor(Math.random() * allCharacteristics.ZIGZAG_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].ZIGZAG_PROBABILITY = allCharacteristics.ZIGZAG_PROBABILITY[zigzagIndex];
                        }
                        break;
                        
                    case 'stubborn':
                        if (allCharacteristics.FORWARD_PROBABILITY && allCharacteristics.FORWARD_PROBABILITY.length > 0) {
                            const forwardIndex = Math.floor(Math.random() * allCharacteristics.FORWARD_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].FORWARD_PROBABILITY = allCharacteristics.FORWARD_PROBABILITY[forwardIndex];
                        }
                        break;
                        
                    case 'deadender':
                        if (allCharacteristics.RANDOM_TURN_PROBABILITY && allCharacteristics.RANDOM_TURN_PROBABILITY.length > 0) {
                            const randomTurnIndex = Math.floor(Math.random() * allCharacteristics.RANDOM_TURN_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].RANDOM_TURN_PROBABILITY = allCharacteristics.RANDOM_TURN_PROBABILITY[randomTurnIndex];
                        }
                        break;
                }
            } else {
                // Применяем характеристики своего типа, но случайные
                switch (originalType) {
                    case 'racer':
                        if (allCharacteristics.BOOST_PROBABILITY && allCharacteristics.BOOST_PROBABILITY.length > 0) {
                            const boostProbIndex = Math.floor(Math.random() * allCharacteristics.BOOST_PROBABILITY.length);
                            const boostMultIndex = Math.floor(Math.random() * allCharacteristics.BOOST_MULTIPLIER.length);
                            
                            ASSETS.SNAIL_TYPES[key].BOOST_PROBABILITY = allCharacteristics.BOOST_PROBABILITY[boostProbIndex];
                            ASSETS.SNAIL_TYPES[key].BOOST_MULTIPLIER = allCharacteristics.BOOST_MULTIPLIER[boostMultIndex];
                        }
                        break;
                        
                    case 'explorer':
                        if (allCharacteristics.EXPLORATION_RATE && allCharacteristics.EXPLORATION_RATE.length > 0) {
                            const explorationIndex = Math.floor(Math.random() * allCharacteristics.EXPLORATION_RATE.length);
                            ASSETS.SNAIL_TYPES[key].EXPLORATION_RATE = allCharacteristics.EXPLORATION_RATE[explorationIndex];
                        }
                        break;
                        
                    case 'snake':
                        if (allCharacteristics.ZIGZAG_PROBABILITY && allCharacteristics.ZIGZAG_PROBABILITY.length > 0) {
                            const zigzagIndex = Math.floor(Math.random() * allCharacteristics.ZIGZAG_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].ZIGZAG_PROBABILITY = allCharacteristics.ZIGZAG_PROBABILITY[zigzagIndex];
                        }
                        break;
                        
                    case 'stubborn':
                        if (allCharacteristics.FORWARD_PROBABILITY && allCharacteristics.FORWARD_PROBABILITY.length > 0) {
                            const forwardIndex = Math.floor(Math.random() * allCharacteristics.FORWARD_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].FORWARD_PROBABILITY = allCharacteristics.FORWARD_PROBABILITY[forwardIndex];
                        }
                        break;
                        
                    case 'deadender':
                        if (allCharacteristics.RANDOM_TURN_PROBABILITY && allCharacteristics.RANDOM_TURN_PROBABILITY.length > 0) {
                            const randomTurnIndex = Math.floor(Math.random() * allCharacteristics.RANDOM_TURN_PROBABILITY.length);
                            ASSETS.SNAIL_TYPES[key].RANDOM_TURN_PROBABILITY = allCharacteristics.RANDOM_TURN_PROBABILITY[randomTurnIndex];
                        }
                        break;
                }
            }
            
            // Сохраняем тип и имя оригинальной улитки
            ASSETS.SNAIL_TYPES[key].TYPE = this.originalSnailCharacteristics[key].TYPE;
            ASSETS.SNAIL_TYPES[key].NAME = this.originalSnailCharacteristics[key].NAME;
            ASSETS.SNAIL_TYPES[key].DESCRIPTION = this.originalSnailCharacteristics[key].DESCRIPTION;
        }
        
        // Выводим в консоль новые характеристики для отладки
        console.log("НОВЫЕ УСИЛЕННО РАНДОМИЗИРОВАННЫЕ ХАРАКТЕРИСТИКИ УЛИТОК:", 
            Object.entries(ASSETS.SNAIL_TYPES).map(([key, value]) => ({
                type: value.TYPE,
                baseSpeed: value.BASE_SPEED.toFixed(2),
                speedVar: value.SPEED_VARIATION.toFixed(2),
                special: (() => {
                    switch(value.TYPE) {
                        case 'racer': return `Boost: ${value.BOOST_PROBABILITY.toFixed(2)}, Mult: ${value.BOOST_MULTIPLIER.toFixed(2)}`;
                        case 'explorer': return `Expl: ${value.EXPLORATION_RATE.toFixed(2)}`;
                        case 'snake': return `Zigzag: ${value.ZIGZAG_PROBABILITY.toFixed(2)}`;
                        case 'stubborn': return `Forward: ${value.FORWARD_PROBABILITY.toFixed(2)}`;
                        case 'deadender': return `Random: ${value.RANDOM_TURN_PROBABILITY.toFixed(2)}`;
                        default: return 'N/A';
                    }
                })()
            }))
        );
    }
    
    /**
     * Перемешивает массив случайным образом (алгоритм Фишера-Йейтса)
     * @param {Array} array - массив для перемешивания
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Воспроизведение звука
     * @param {string} soundPath - путь к звуковому файлу
     */
    playSound(soundPath) {
        if (!soundPath) {
            console.error("Не указан путь к звуковому файлу");
            return;
        }
        
        console.log(`Попытка воспроизведения звука: ${soundPath}`);
        
        // Проверяем, существует ли файл
        const audioUrl = new URL(soundPath, window.location.href).href;
        console.log(`Полный URL звука: ${audioUrl}`);
        
        // Сначала проверяем наличие предзагруженных аудио элементов
        let soundId = null;
        
        if (soundPath === ASSETS.SOUNDS.RACE_START) {
            soundId = 'race-start-sound';
        } else if (soundPath === ASSETS.SOUNDS.FINISH) {
            soundId = 'finish-sound';
        } else if (soundPath === ASSETS.SOUNDS.RACE_MUSIC) {
            soundId = 'background-music';
        }
        
        // Если есть предзагруженный элемент, используем его
        if (soundId) {
            const audioElement = document.getElementById(soundId);
            if (audioElement) {
                console.log(`Воспроизведение предзагруженного звука: ${soundId}`);
                
                // Проверяем наличие source с правильным путем
                const source = audioElement.querySelector('source');
                if (source && source.src !== audioUrl) {
                    console.log(`Обновление пути аудио с ${source.src} на ${audioUrl}`);
                    source.src = audioUrl;
                    audioElement.load(); // Перезагружаем аудио с новым путем
                }
                
                audioElement.currentTime = 0; // Сбрасываем на начало для повторного воспроизведения
                const playPromise = audioElement.play();
                
                if (playPromise) {
                    playPromise.catch(e => {
                        console.error(`Ошибка воспроизведения звука ${soundId}:`, e);
                        // Создаем новый аудио элемент как запасной вариант
                        this.fallbackPlaySound(soundPath);
                    });
                }
                return;
            } else {
                console.warn(`Предзагруженный элемент ${soundId} не найден`);
            }
        }
        
        // Запасной вариант: создаем новый Audio элемент
        this.fallbackPlaySound(soundPath);
    }
    
    /**
     * Запасной метод воспроизведения звука через новый Audio элемент
     * @param {string} soundPath - путь к звуковому файлу
     */
    fallbackPlaySound(soundPath) {
        console.log(`Воспроизведение звука через новый Audio: ${soundPath}`);
        const audio = new Audio(soundPath);
        audio.volume = 0.4; // Громкость на 40%
        
        // Обрабатываем ошибки
        audio.addEventListener('error', (e) => {
            console.error(`Ошибка воспроизведения звука: ${soundPath}`, e);
        });
        
        // Воспроизводим
        audio.play().catch(e => {
            console.error(`Не удалось воспроизвести звук ${soundPath}:`, e);
        });
    }
    
    /**
     * Рандомизирует типы улиток, меняя их местами
     */
    randomizeSnailTypes() {
        console.log("НАЧИНАЮ ПОЛНУЮ РАНДОМИЗАЦИЮ УЛИТОК");
        
        // Определяем доступные цвета улиток
        const snailColors = [
            { color: 'Red', img: 'images/red_snail.png' },
            { color: 'Blue', img: 'images/blue_snail.png' },
            { color: 'Green', img: 'images/green_snail.png' },
            { color: 'Purple', img: 'images/purple_snail.png' },
            { color: 'Yellow', img: 'images/yellow_snail.png' }
        ];
        
        // Определяем все типы улиток 
        const snailTypes = [
            { type: 'racer' },
            { type: 'explorer' },
            { type: 'snake' },
            { type: 'stubborn' },
            { type: 'deadender' }
        ];
        
        // Определяем все классы поведения
        const snailBehaviors = [
            { behavior: 'Racer' },
            { behavior: 'Explorer' },
            { behavior: 'Snake' },
            { behavior: 'Stubborn' },
            { behavior: 'Deadender' }
        ];
        
        // ШАГ 1: Создаем перемешанные копии массивов для случайного назначения
        const shuffledColors = this.shuffleArray([...snailColors]);
        const shuffledTypes = this.shuffleArray([...snailTypes]);
        const shuffledBehaviors = this.shuffleArray([...snailBehaviors]);
        
        console.log("Перемешанные цвета:", shuffledColors.map(c => c.color));
        console.log("Перемешанные типы:", shuffledTypes.map(t => t.type));
        console.log("Перемешанные поведения:", shuffledBehaviors.map(b => b.behavior));
        
        // ШАГ 2: Создаем массив для хранения рандомизированных улиток
        const randomizedSnails = [];
        
        // Создаем Map для быстрого доступа к цветам по типу улитки
        window.SNAIL_COLORS_MAP = new Map();
        
        // ШАГ 3: Назначаем цвета и поведение DOM-элементам и создаем объекты с данными улиток
        this.snailOptions.forEach((option, index) => {
            // Получаем рандомизированные данные из перемешанных массивов
            const colorData = shuffledColors[index];
            const typeData = shuffledTypes[index];
            const behaviorData = shuffledBehaviors[index];
            
            // ВАЖНО: Привязываем фиксированный цвет к DOM-элементу
            const colorName = colorData.color;
            
            // Сохраняем исходные данные для восстановления при необходимости
            option.dataset.originalType = typeData.type;
            option.dataset.originalColor = colorName;
            option.dataset.originalImage = colorData.img;
            option.dataset.originalBehavior = behaviorData.behavior;
            
            // ВАЖНО: Устанавливаем текущие атрибуты элемента
            option.dataset.snailType = typeData.type;
            option.dataset.snailColor = colorName;
            option.dataset.snailBehavior = behaviorData.behavior;
            
            // Обновляем визуальное представление улиток на экране выбора
            const nameElement = option.querySelector('span');
            if (nameElement) nameElement.textContent = colorName;
            
            const imgElement = option.querySelector('img');
            if (imgElement) imgElement.src = colorData.img;
            
            // Добавляем информацию о поведении и типе для отображения
            const infoElement = option.querySelector('.snail-info');
            if (infoElement) {
                const titleElement = infoElement.querySelector('.snail-title');
                const behaviorElement = infoElement.querySelector('.snail-behavior');
                
                if (titleElement) titleElement.textContent = colorName;
                if (behaviorElement) behaviorElement.textContent = `${behaviorData.behavior} Style`;
            }
            
            // Сбрасываем выделение
            option.classList.remove('selected');
            
            // Создаем объект с данными об улитке
            const snailData = {
                type: typeData.type,
                color: colorName,
                originalColor: colorName, // ВАЖНО: Сохраняем оригинальный цвет
                behavior: behaviorData.behavior,
                image: colorData.img,
                index: index
            };
            
            // Добавляем в массив рандомизированных улиток
            randomizedSnails.push(snailData);
            
            // Добавляем в Map для быстрого доступа
            window.SNAIL_COLORS_MAP.set(typeData.type, colorName);
            
            console.log(`Улитка #${index}: тип=${typeData.type}, цвет=${colorName}, поведение=${behaviorData.behavior}`);
        });
        
        console.log("Итоговый список рандомизированных улиток:", randomizedSnails);
        console.log("Карта соответствия типов и цветов:", [...window.SNAIL_COLORS_MAP.entries()]);
        
        // ШАГ 4: Сохраняем данные для использования в других частях приложения
        
        // Важно! Делаем глубокую копию для избежания проблем с изменением исходных данных
        this.randomizedSnails = JSON.parse(JSON.stringify(randomizedSnails));
        
        // Делаем данные доступными глобально
        window.RANDOMIZED_SNAILS = JSON.parse(JSON.stringify(randomizedSnails));
        
        // Создаем дополнительную структуру для быстрого поиска по типу
        window.SNAIL_TYPE_TO_COLOR = {};
        randomizedSnails.forEach(snail => {
            window.SNAIL_TYPE_TO_COLOR[snail.type] = snail.originalColor;
        });
        
        console.log("Инициализирована глобальная карта цветов:", window.SNAIL_TYPE_TO_COLOR);
        
        // Сбрасываем любой предыдущий выбор улитки
        this.selectedSnailType = null;
        this.selectedSnailColor = null;
        this.selectedSnailBehavior = null;
    }
    
    /**
     * Обработка завершения гонки
     */
    handleRaceFinished(results) {
        // Останавливаем активную гонку
        this.isRaceActive = false;
        
        // Очищаем таймаут завершения гонки
        if (this.raceTimeout) {
            clearTimeout(this.raceTimeout);
            this.raceTimeout = null;
        }
        
        // Получаем финишировавших улиток
        let finishedSnails = [];
        if (Array.isArray(results)) {
            finishedSnails = results;
        } else if (results.finishedSnails) {
            finishedSnails = results.finishedSnails;
        }
        
        // Сначала сортируем улиток по времени прохождения
        const sortedSnails = [...finishedSnails].sort((a, b) => {
            const timeA = a.finishTime - this.raceStartTime;
            const timeB = b.finishTime - this.raceStartTime;
            return timeA - timeB;
        });
        
        // Присваиваем улиткам позиции в соответствии с отсортированным порядком
        sortedSnails.forEach((snail, index) => {
            snail.position = index + 1;
        });
        
        // Находим улитку игрока
        const playerSnail = sortedSnails.find(snail => snail.type === this.selectedSnailType || snail.isPlayer);
        const playerPosition = playerSnail ? playerSnail.position : 0;
        
        console.log("Позиция игрока:", playerPosition, "Тип улитки игрока:", this.selectedSnailType);
        console.log("Отсортированные улитки:", sortedSnails.map(s => ({
            type: s.type, 
            isPlayer: s.isPlayer || s.type === this.selectedSnailType, 
            position: s.position, 
            time: s.finishTime - this.raceStartTime
        })));
        
        // Звук финиша теперь воспроизводится для каждой улитки отдельно в методе checkFinish
        // Звук для окончания всей гонки может быть другим, но пока закомментируем
        // this.playSound(ASSETS.SOUNDS.FINISH);
        
        // Обновляем баланс в зависимости от результата
        if (playerPosition === 1) {
            // Первое место - x5 от ставки
            const winnings = Math.floor(this.bet * ASSETS.GAME.FIRST_PLACE_MULTIPLIER);
            this.balance += winnings;
            
            // Выводим сообщение о выигрыше
            this.resultsMessage.innerHTML = `
                <div class="win-message">You win!</div>
                <div class="win-amount">+${winnings} coins (x5)</div>
            `;
            this.resultsMessage.classList.add('win');
            this.resultsMessage.classList.remove('lose');
            this.resultsMessage.classList.remove('partial-win');
        } else if (playerPosition === 2) {
            // Второе место - 50% кешбэк
            const refund = Math.floor(this.bet * ASSETS.GAME.SECOND_PLACE_MULTIPLIER);
            this.balance += refund;
            
            // Выводим сообщение о возврате части ставки
            this.resultsMessage.innerHTML = `
                <div class="partial-win-message">Your snail is in 2nd place</div>
                <div class="partial-win-amount">+${refund} coins (50% cashback)</div>
            `;
            this.resultsMessage.classList.add('partial-win');
            this.resultsMessage.classList.remove('win');
            this.resultsMessage.classList.remove('lose');
        } else if (playerPosition === 3) {
            // Третье место - 25% кешбэк
            const refund = Math.floor(this.bet * ASSETS.GAME.THIRD_PLACE_MULTIPLIER);
            this.balance += refund;
            
            // Выводим сообщение о возврате части ставки
            this.resultsMessage.innerHTML = `
                <div class="partial-win-message">Your snail is in 3rd place</div>
                <div class="partial-win-amount">+${refund} coins (25% cashback)</div>
            `;
            this.resultsMessage.classList.add('partial-win');
            this.resultsMessage.classList.remove('win');
            this.resultsMessage.classList.remove('lose');
        } else {
            // 4-5 места - проигрыш
            this.resultsMessage.innerHTML = `
                <div class="lose-message">You lose!</div>
                <div class="lose-amount">-${this.bet} coins</div>
            `;
            this.resultsMessage.classList.add('lose');
            this.resultsMessage.classList.remove('win');
            this.resultsMessage.classList.remove('partial-win');
        }
        
        // Обновляем отображение баланса
        this.updateBalanceDisplay();
        
        // Отображаем все позиции улиток в таблице
        this.displayRacePositions(sortedSnails);
        
        // Показываем экран результатов
        setTimeout(() => {
            this.showResultsScreen();
        }, 2000);
    }
} 