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
        // Обработчик для опций выбора улитки
        this.snailOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Воспроизводим звук щелчка
                this.playSound(ASSETS.SOUNDS.CLICK);
                
                // Удаляем класс selected со всех опций
                this.snailOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Добавляем класс selected выбранной опции
                option.classList.add('selected');
                
                // Запоминаем выбранный тип улитки
                const snailType = option.getAttribute('data-snail-type');
                
                if (snailType) {
                    this.selectedSnailType = snailType;
                    console.log(`Выбрана улитка типа: ${snailType}`);
                } else {
                    console.error('Не удалось определить тип улитки из атрибута data-snail-type');
                }
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
        
        this.backToSelectionButton.addEventListener('click', () => {
            // Воспроизводим звук щелчка
            this.playSound(ASSETS.SOUNDS.CLICK);
            
            this.showSelectionScreen();
        });
        
        this.playAgainButton.addEventListener('click', () => {
            // Воспроизводим звук щелчка
            this.playSound(ASSETS.SOUNDS.CLICK);
            
            this.showSelectionScreen();
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
            
            const audioUrl = new URL(file, window.location.href).href;
            console.log(`Предзагрузка аудио: ${audioUrl}`);
            
            // Проверяем существование файла
            const exists = await checkFileExists(audioUrl);
            if (!exists) {
                console.error(`Аудиофайл не найден: ${audioUrl}`);
                return;
            }
            
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
        });
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
        
        // Проверяем, выбрана ли улитка
        if (!this.selectedSnailType) {
            alert('Пожалуйста, выберите улитку перед началом гонки');
            return;
        }
        
        // Проверяем валидность ставки
        if (this.bet <= 0 || this.bet > this.balance) {
            alert('Пожалуйста, введите корректную ставку');
            return;
        }
        
        // Обновляем состояние игры
        this.isRaceActive = true;
        this.raceStartTime = Date.now();
        this.elapsedTime = 0;
        
        // Вычитаем ставку из баланса
        this.balance -= this.bet;
        this.updateBalanceDisplay();
        
        // Обновляем отображение ставки
        this.currentBetDisplay.textContent = this.bet;
        
        // Воспроизводим звук начала гонки
        this.playSound(ASSETS.SOUNDS.RACE_START);
        
        // Отображаем экран игры
        this.showGameScreen();
        
        // Сбрасываем масштаб к исходному состоянию
        this.resetZoom();
        
        // Создаем новый лабиринт
        const difficulty = this.difficulty || 'medium';
        console.log(`Создание лабиринта (сложность: ${difficulty})...`);
        
        // Получаем настройки лабиринта из ASSETS
        const mazeConfig = ASSETS.MAZE[difficulty.toUpperCase()] || ASSETS.MAZE.MEDIUM;
        console.log('Конфигурация лабиринта:', mazeConfig);
        
        // Создаем новый лабиринт
        this.maze = new Maze(difficulty);
        console.log('Лабиринт создан:', this.maze);
        
        // Создаем менеджер улиток
        this.snailManager = new SnailManager(this.selectedSnailType, this.maze);
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
        
        // Находим улитку игрока и определяем её позицию
        const playerSnail = finishedSnails.find(snail => snail.type === this.selectedSnailType);
        const playerPosition = playerSnail ? playerSnail.position : 0;
        
        // Воспроизводим звук завершения гонки
        this.playSound(ASSETS.SOUNDS.FINISH);
        
        // Обновляем баланс в зависимости от результата
        if (playerPosition === 1) {
            // Первое место - x5 от ставки
            const winnings = Math.floor(this.bet * ASSETS.GAME.FIRST_PLACE_MULTIPLIER);
            this.balance += winnings;
            
            // Выводим сообщение о выигрыше
            this.resultsMessage.innerHTML = `
                <div class="win-message">Вы выиграли!</div>
                <div class="win-amount">+${winnings} монет (x5)</div>
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
                <div class="partial-win-message">Ваша улитка на 2 месте</div>
                <div class="partial-win-amount">+${refund} монет (50% кешбэк)</div>
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
                <div class="partial-win-message">Ваша улитка на 3 месте</div>
                <div class="partial-win-amount">+${refund} монет (25% кешбэк)</div>
            `;
            this.resultsMessage.classList.add('partial-win');
            this.resultsMessage.classList.remove('win');
            this.resultsMessage.classList.remove('lose');
        } else {
            // 4-5 места - проигрыш
            this.resultsMessage.innerHTML = `
                <div class="lose-message">Вы проиграли!</div>
                <div class="lose-amount">-${this.bet} монет</div>
            `;
            this.resultsMessage.classList.add('lose');
            this.resultsMessage.classList.remove('win');
            this.resultsMessage.classList.remove('partial-win');
        }
        
        // Обновляем отображение баланса
        this.updateBalanceDisplay();
        
        // Отображаем все позиции улиток в таблице
        this.displayRacePositions(finishedSnails);
        
        // Показываем экран результатов
        setTimeout(() => {
            this.showResultsScreen();
        }, 2000);
    }
    
    /**
     * Отображение позиций улиток в таблице результатов
     */
    displayRacePositions(finishedSnails) {
        this.racePositions.innerHTML = '';
        
        // Сортируем улиток по позициям
        const sortedSnails = [...finishedSnails].sort((a, b) => a.position - b.position);
        
        // Создаем таблицу с результатами
        const table = document.createElement('table');
        table.className = 'race-results-table';
        
        // Создаем заголовок таблицы
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        // Заголовки столбцов
        ['Место', 'Улитка', 'Время', 'Приз'].forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Создаем тело таблицы
        const tbody = document.createElement('tbody');
        
        // Добавляем строки для каждой улитки
        sortedSnails.forEach(snail => {
            const row = document.createElement('tr');
            
            // Если это улитка игрока, выделяем её
            if (snail.type === this.selectedSnailType) {
                row.className = 'player-snail';
                row.style.fontWeight = 'bold';
                row.style.backgroundColor = `${snail.color}33`; // Полупрозрачный цвет улитки
            }
            
            // Колонка 1: Место
            const positionCell = document.createElement('td');
            positionCell.textContent = snail.position;
            row.appendChild(positionCell);
            
            // Колонка 2: Улитка (имя и тип)
            const nameCell = document.createElement('td');
            nameCell.textContent = `${snail.name} (${snail.type})`;
            row.appendChild(nameCell);
            
            // Колонка 3: Время
            const timeCell = document.createElement('td');
            timeCell.textContent = `${(snail.finishTime / 1000).toFixed(2)}s`;
            row.appendChild(timeCell);
            
            // Колонка 4: Приз (только для улитки игрока)
            const prizeCell = document.createElement('td');
            if (snail.type === this.selectedSnailType) {
                // Расчет приза в зависимости от места
                let prizeText = '';
                if (snail.position === 1) {
                    const winnings = Math.floor(this.bet * ASSETS.GAME.FIRST_PLACE_MULTIPLIER);
                    prizeText = `+${winnings} (x5)`;
                    prizeCell.style.color = '#00c853'; // Зеленый цвет для выигрыша
                } else if (snail.position === 2) {
                    const refund = Math.floor(this.bet * ASSETS.GAME.SECOND_PLACE_MULTIPLIER);
                    prizeText = `+${refund} (50%)`;
                    prizeCell.style.color = '#2196f3'; // Синий цвет для частичного возврата
                } else if (snail.position === 3) {
                    const refund = Math.floor(this.bet * ASSETS.GAME.THIRD_PLACE_MULTIPLIER);
                    prizeText = `+${refund} (25%)`;
                    prizeCell.style.color = '#2196f3'; // Синий цвет для частичного возврата
                } else {
                    prizeText = `-${this.bet}`;
                    prizeCell.style.color = '#f44336'; // Красный цвет для проигрыша
                }
                prizeCell.textContent = prizeText;
            } else {
                prizeCell.textContent = '-';
            }
            row.appendChild(prizeCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        this.racePositions.appendChild(table);
        
        // Добавляем стили для таблицы
        const style = document.createElement('style');
        style.textContent = `
            .race-results-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
                background-color: rgba(255, 235, 59, 0.1);
            }
        `;
        this.racePositions.appendChild(style);
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
     */
    randomizeSnailAbilities() {
        console.log("Рандомизируем характеристики улиток...");
        
        // Получаем все типы улиток
        const snailTypes = Object.keys(ASSETS.SNAIL_TYPES).map(key => ASSETS.SNAIL_TYPES[key].TYPE);
        
        // Создаем копию оригинальных характеристик, если мы еще ее не создали
        if (!this.originalSnailCharacteristics) {
            this.originalSnailCharacteristics = {};
            
            for (const key in ASSETS.SNAIL_TYPES) {
                this.originalSnailCharacteristics[key] = { ...ASSETS.SNAIL_TYPES[key] };
            }
        }
        
        // Создаем массив характеристик
        const characteristics = [];
        for (const key in this.originalSnailCharacteristics) {
            // Копируем только характеристики, но не тип и имя
            const snailCharacteristics = {
                BASE_SPEED: this.originalSnailCharacteristics[key].BASE_SPEED,
                SPEED_VARIATION: this.originalSnailCharacteristics[key].SPEED_VARIATION,
                COLOR: this.originalSnailCharacteristics[key].COLOR
            };
            
            // Добавляем специфичные для типа улитки характеристики
            switch (this.originalSnailCharacteristics[key].TYPE) {
                case 'racer':
                    snailCharacteristics.BOOST_PROBABILITY = this.originalSnailCharacteristics[key].BOOST_PROBABILITY;
                    snailCharacteristics.BOOST_MULTIPLIER = this.originalSnailCharacteristics[key].BOOST_MULTIPLIER;
                    break;
                case 'explorer':
                    snailCharacteristics.EXPLORATION_RATE = this.originalSnailCharacteristics[key].EXPLORATION_RATE;
                    break;
                case 'snake':
                    snailCharacteristics.ZIGZAG_PROBABILITY = this.originalSnailCharacteristics[key].ZIGZAG_PROBABILITY;
                    break;
                case 'stubborn':
                    snailCharacteristics.FORWARD_PROBABILITY = this.originalSnailCharacteristics[key].FORWARD_PROBABILITY;
                    break;
                case 'deadender':
                    snailCharacteristics.RANDOM_TURN_PROBABILITY = this.originalSnailCharacteristics[key].RANDOM_TURN_PROBABILITY;
                    break;
            }
            
            characteristics.push(snailCharacteristics);
        }
        
        // Перемешиваем характеристики
        this.shuffleArray(characteristics);
        
        // Применяем перемешанные характеристики к улиткам, сохраняя их тип и имя
        let i = 0;
        for (const key in ASSETS.SNAIL_TYPES) {
            ASSETS.SNAIL_TYPES[key] = {
                ...ASSETS.SNAIL_TYPES[key],
                ...characteristics[i]
            };
            
            // Сохраняем тип и имя оригинальной улитки
            ASSETS.SNAIL_TYPES[key].TYPE = this.originalSnailCharacteristics[key].TYPE;
            ASSETS.SNAIL_TYPES[key].NAME = this.originalSnailCharacteristics[key].NAME;
            ASSETS.SNAIL_TYPES[key].DESCRIPTION = this.originalSnailCharacteristics[key].DESCRIPTION;
            
            i++;
        }
        
        // Выводим в консоль новые характеристики для отладки
        console.log("Новые характеристики улиток:", ASSETS.SNAIL_TYPES);
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
} 