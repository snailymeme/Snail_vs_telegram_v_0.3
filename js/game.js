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
        
        // Запуск загрузки ресурсов
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
        
        // Добавляем элемент для отображения стиля лабиринта
        this.mazeStyleDisplay = document.createElement('div');
        this.mazeStyleDisplay.className = 'maze-style-display';
        this.mazeStyleDisplay.style.position = 'absolute';
        this.mazeStyleDisplay.style.top = '10px';
        this.mazeStyleDisplay.style.left = '10px';
        this.mazeStyleDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
        this.mazeStyleDisplay.style.color = '#fff';
        this.mazeStyleDisplay.style.padding = '5px 10px';
        this.mazeStyleDisplay.style.borderRadius = '4px';
        this.mazeStyleDisplay.style.fontSize = '14px';
        this.mazeStyleDisplay.style.zIndex = '10';
        this.mazeContainer.appendChild(this.mazeStyleDisplay);
        
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
        const rows = mazeConfig.ROWS;
        const cols = mazeConfig.COLS;
        const cellSize = ASSETS.CELL_SIZE;
        
        // Устанавливаем размеры canvas
        this.canvas.width = cols * cellSize;
        this.canvas.height = rows * cellSize;
        
        // Добавляем canvas в контейнер
        this.mazeContainer.appendChild(this.canvas);
        
        // Получаем контекст для рисования
        this.ctx = this.canvas.getContext('2d');
    }
    
    /**
     * Инициализация обработчиков событий
     */
    initEventListeners() {
        // Выбор улитки
        this.snailOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectSnail(option.dataset.snailType);
            });
        });
        
        // Изменение ставки
        this.betAmount.addEventListener('change', () => {
            this.setBet(parseInt(this.betAmount.value, 10));
        });
        
        // Кнопки управления
        this.startRaceButton.addEventListener('click', () => {
            this.startRace();
        });
        
        this.backToSelectionButton.addEventListener('click', () => {
            this.showSelectionScreen();
        });
        
        this.playAgainButton.addEventListener('click', () => {
            this.showSelectionScreen();
        });
        
        // События гонки
        document.addEventListener('raceFinished', (event) => {
            this.handleRaceFinished(event.detail);
        });
        
        // Обработчик для анимационного цикла
        window.requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Загрузка ресурсов игры
     */
    loadResources() {
        this.isLoading = true;
        
        // Показываем экран загрузки
        this.showLoader();
        
        // Запускаем загрузку ресурсов
        ASSETS.loadResources(
            // Обработчик прогресса
            (loaded, total) => {
                const percent = Math.floor((loaded / total) * 100);
                this.loadingProgress.style.width = `${percent}%`;
                this.loadingText.textContent = `Загрузка ресурсов: ${percent}% (${loaded}/${total})`;
            },
            // Обработчик завершения
            () => {
                console.log('Ресурсы загружены!');
                this.isLoading = false;
                this.loadingText.textContent = 'Загрузка ресурсов: 100% (16/16)';
                
                // Небольшая задержка перед показом экрана выбора
                setTimeout(() => {
                    this.showSelectionScreen();
                }, 500);
            }
        );
    }
    
    /**
     * Выбор улитки
     */
    selectSnail(type) {
        // Снимаем выделение со всех улиток
        this.snailOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Выделяем выбранную улитку
        const selectedOption = document.querySelector(`.snail-option[data-snail-type="${type}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
            this.selectedSnailType = type;
        }
    }
    
    /**
     * Установка ставки
     */
    setBet(amount) {
        // Проверяем, что ставка в пределах допустимого
        const minBet = ASSETS.GAME.MIN_BET;
        const maxBet = Math.min(ASSETS.GAME.MAX_BET, this.balance);
        
        this.bet = Math.max(minBet, Math.min(maxBet, amount));
        this.betAmount.value = this.bet;
    }
    
    /**
     * Обновление отображения баланса
     */
    updateBalanceDisplay() {
        this.balanceAmount.textContent = this.balance;
        this.newBalance.textContent = this.balance;
    }
    
    /**
     * Показать экран загрузки
     */
    showLoader() {
        this.loader.classList.remove('hidden');
        this.mainGame.classList.add('hidden');
    }
    
    /**
     * Показать экран выбора улитки
     */
    showSelectionScreen() {
        this.loader.classList.add('hidden');
        this.mainGame.classList.remove('hidden');
        this.selectionScreen.classList.remove('hidden');
        this.gameScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
        
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
        
        // Отображаем текущий стиль лабиринта
        this.mazeStyleDisplay.textContent = this.maze.getStyleName();
        
        // Отрисовываем лабиринт
        this.renderMaze();
        
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
     * Запуск гонки
     */
    startRace() {
        // Проверка, выбрана ли улитка
        if (!this.selectedSnailType) {
            alert('Пожалуйста, выберите улитку!');
            return;
        }
        
        // Проверка баланса
        if (this.balance < this.bet) {
            alert('Недостаточно средств для ставки!');
            return;
        }
        
        // Списываем средства
        this.balance -= this.bet;
        this.updateBalanceDisplay();
        
        // Создаем новый лабиринт с случайным стилем
        this.maze = new Maze(this.difficulty);
        
        // Создаем менеджер улиток
        this.snailManager = new SnailManager(this.selectedSnailType, this.maze);
        
        // Показываем игровой экран
        this.showGameScreen();
        
        // Обновляем статус гонки
        this.raceStatusDisplay.textContent = 'Гонка началась!';
        this.isRaceActive = true;
        this.raceStartTime = Date.now();
        
        // Запускаем улиток
        this.snailManager.startRace();
        
        // Устанавливаем таймаут на максимальную длительность гонки
        this.raceTimeout = setTimeout(() => {
            if (this.isRaceActive) {
                this.endRace();
            }
        }, ASSETS.GAME.RACE_DURATION_MS);
    }
    
    /**
     * Отрисовка лабиринта
     */
    renderMaze() {
        if (!this.maze || !this.ctx) return;
        
        // Очищаем canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Отрисовываем лабиринт
        this.maze.draw(this.ctx);
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
    handleRaceFinished(data) {
        const { finishedSnails } = data;
        
        // Получаем улитку игрока
        const playerSnail = this.snailManager.playerSnail;
        
        // Определяем место улитки игрока
        const playerPosition = playerSnail.finishPosition;
        
        // Рассчитываем выигрыш в зависимости от места
        let winAmount = 0;
        let message = '';
        
        if (playerPosition === 1) {
            // Первое место
            winAmount = Math.floor(this.bet * ASSETS.GAME.WINNING_MULTIPLIER);
            message = `Поздравляем! Ваша улитка заняла 1 место! Вы выиграли ${winAmount} монет!`;
        } else if (playerPosition === 2) {
            // Второе место
            winAmount = Math.floor(this.bet * ASSETS.GAME.SECOND_PLACE_MULTIPLIER);
            message = `Неплохо! Ваша улитка заняла 2 место. Вы выиграли ${winAmount} монет.`;
        } else if (playerPosition > 0) {
            // Другие места
            message = `Ваша улитка заняла ${playerPosition} место. Попробуйте еще раз!`;
        } else {
            // Не финишировала
            message = 'Ваша улитка не смогла финишировать. Попробуйте еще раз!';
        }
        
        // Отображаем сообщение
        this.resultsMessage.textContent = message;
        
        // Обновляем баланс
        this.balance += winAmount;
        this.updateBalanceDisplay();
        
        // Отображаем все позиции
        this.displayRacePositions(finishedSnails);
        
        // Показываем экран результатов
        setTimeout(() => {
            this.showResultsScreen();
        }, 2000);
    }
    
    /**
     * Отображение позиций улиток в гонке
     */
    displayRacePositions(finishedSnails) {
        this.racePositions.innerHTML = '';
        
        // Сортируем улиток по позициям
        const sortedSnails = [...finishedSnails].sort((a, b) => a.position - b.position);
        
        // Создаем список с позициями
        const list = document.createElement('ol');
        
        for (const snail of sortedSnails) {
            const item = document.createElement('li');
            
            // Выделяем улитку игрока
            if (snail === this.snailManager.playerSnail) {
                item.style.fontWeight = 'bold';
                item.style.color = snail.color;
            }
            
            item.textContent = `${snail.name} (${snail.type}) - ${(snail.finishTime / 1000).toFixed(2)}s`;
            list.appendChild(item);
        }
        
        this.racePositions.appendChild(list);
    }
    
    /**
     * Игровой цикл
     */
    gameLoop(timestamp) {
        // Вычисляем время, прошедшее с последнего кадра
        if (!this.lastTimestamp) {
            this.lastTimestamp = timestamp;
        }
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;
        
        // Обновляем состояние игры
        this.update(deltaTime);
        
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
        
        // Обновляем отображение
        this.raceStatusDisplay.textContent = `Время: ${timeStr}с`;
        
        // Принудительно завершаем гонку, если превышено максимальное время
        if (elapsed >= ASSETS.GAME.RACE_DURATION_MS) {
            this.endRace();
        }
    }
} 