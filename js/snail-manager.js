/**
 * Модуль управления группой улиток в гонке
 */
const NUM_COMPUTER_SNAILS = 4; // Количество компьютерных улиток в гонке

class SnailManager {
    /**
     * Конструктор менеджера улиток
     * @param {string} playerSnailType - Тип улитки игрока
     * @param {Maze} maze - Лабиринт для гонки
     */
    constructor(playerSnailType, maze) {
        this.maze = maze;
        this.snails = [];
        this.finishedCount = 0;
        this.finishedSnails = [];
        this.isRaceStarted = false;
        
        // Создаем улиток
        this.createSnails(playerSnailType);
    }
    
    /**
     * Создание улиток для гонки
     * @param {string} playerSnailType - Тип улитки игрока
     */
    createSnails(playerSnailType) {
        // Очищаем предыдущих улиток
        this.snails = [];
        this.finishedSnails = [];
        this.finishedCount = 0;
        
        // Стартовая позиция для всех улиток
        const startRow = this.maze.start.row;
        const startCol = this.maze.start.col;
        
        // Создаем улитку игрока
        this.playerSnail = new Snail(playerSnailType, startRow, startCol, this.maze);
        this.playerSnail.isPlayer = true;
        this.snails.push(this.playerSnail);
        
        // Создаем компьютерных улиток
        const snailTypes = Object.keys(ASSETS.SNAIL_TYPES)
            .map(type => type.toLowerCase())
            .filter(type => type !== playerSnailType.toLowerCase());
        
        // Выбираем случайных соперников
        const computerSnailCount = NUM_COMPUTER_SNAILS;
        const shuffledTypes = this.shuffleArray([...snailTypes]);
        
        for (let i = 0; i < computerSnailCount && i < shuffledTypes.length; i++) {
            const snail = new Snail(shuffledTypes[i], startRow, startCol, this.maze);
            this.snails.push(snail);
        }
        
        console.log(`Создано ${this.snails.length} улиток для гонки`);
    }
    
    /**
     * Перемешивание массива (алгоритм Фишера-Йетса)
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    /**
     * Запуск гонки
     */
    startRace() {
        this.isRaceStarted = true;
        for (const snail of this.snails) {
            snail.startMoving();
        }
        
        // Предварительно загружаем аудиофайл
        this.preloadBackgroundMusic();
        
        // Запускаем фоновую музыку через 1 секунду после старта гонки
        setTimeout(() => {
            this.playBackgroundMusic();
        }, 1000);
    }
    
    /**
     * Предварительная загрузка фоновой музыки
     */
    preloadBackgroundMusic() {
        console.log("Предварительная загрузка фоновой музыки...");
        
        if (!ASSETS.SOUNDS.RACE_MUSIC) {
            console.error("Отсутствует путь к файлу фоновой музыки!");
            return;
        }
        
        // Создаем элемент аудио
        this.backgroundMusic = new Audio();
        
        // Добавляем обработчики событий для диагностики
        this.backgroundMusic.addEventListener('canplaythrough', () => {
            console.log("Музыка загружена и готова к воспроизведению");
            this.musicPreloaded = true;
        });
        
        this.backgroundMusic.addEventListener('error', (e) => {
            console.error("Ошибка загрузки музыки:", e);
            console.error("Код ошибки:", this.backgroundMusic.error ? this.backgroundMusic.error.code : "неизвестно");
            this.musicPreloaded = false;
        });
        
        // Настраиваем громкость и зацикливание
        this.backgroundMusic.volume = 0.3; // Уровень громкости 30%
        this.backgroundMusic.loop = true; // Зацикливаем музыку
        
        // Загружаем аудиофайл без воспроизведения
        this.backgroundMusic.preload = 'auto';
        this.backgroundMusic.src = ASSETS.SOUNDS.RACE_MUSIC;
        this.musicPreloaded = false;
    }
    
    /**
     * Воспроизведение фоновой музыки для гонки
     */
    playBackgroundMusic() {
        console.log("Попытка запуска фоновой музыки...");
        
        if (!ASSETS.SOUNDS.RACE_MUSIC) {
            console.error("Отсутствует путь к файлу фоновой музыки!");
            return;
        }
        
        if (!this.backgroundMusic) {
            console.warn("Аудиоэлемент не был предварительно создан, создаем его сейчас");
            this.preloadBackgroundMusic();
            
            // Даем немного времени на загрузку и пробуем воспроизвести
            setTimeout(() => this.playBackgroundMusic(), 500);
            return;
        }
        
        try {
            // Проверяем, загружен ли файл
            if (this.backgroundMusic.readyState < 2) {  // HAVE_CURRENT_DATA = 2
                console.log("Музыка еще не готова к воспроизведению, ожидаем...");
                
                // Если событие canplaythrough еще не сработало, ждем его
                if (!this.musicPreloaded) {
                    this.backgroundMusic.addEventListener('canplaythrough', () => {
                        console.log("Музыка загрузилась, воспроизводим...");
                        this.backgroundMusic.play().catch(e => 
                            console.error('Ошибка воспроизведения после загрузки:', e)
                        );
                    }, { once: true });
                }
                return;
            }
            
            // Воспроизводим музыку с обработкой обещания
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Фоновая музыка успешно запущена");
                    })
                    .catch(e => {
                        console.error('Ошибка воспроизведения фоновой музыки:', e);
                        
                        // Возможно, проблема с автовоспроизведением. Пробуем с задержкой и по взаимодействию пользователя
                        console.log("Пробуем запустить музыку повторно через 1 секунду...");
                        setTimeout(() => {
                            this.backgroundMusic.play().catch(err => {
                                console.error('Повторная попытка не удалась:', err);
                                console.log("Добавляем обработчик для запуска музыки при клике пользователя");
                                
                                // Добавляем слушатель для запуска при взаимодействии пользователя
                                const clickHandler = () => {
                                    this.backgroundMusic.play().catch(e => console.error('Ошибка при запуске по клику:', e));
                                    document.removeEventListener('click', clickHandler);
                                    document.removeEventListener('touchstart', clickHandler);
                                };
                                
                                document.addEventListener('click', clickHandler);
                                document.addEventListener('touchstart', clickHandler);
                            });
                        }, 1000);
                    });
            }
        } catch (e) {
            console.error('Исключение при запуске фоновой музыки:', e);
        }
    }
    
    /**
     * Остановка фоновой музыки
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            console.log("Фоновая музыка остановлена");
        }
    }
    
    /**
     * Обновление состояния всех улиток
     */
    update(deltaTime) {
        if (!this.isRaceStarted) return;
        
        // Фиксируем текущее время для дебага
        const currentTime = Date.now();
        
        // Добавляем логирование для диагностики
        if (currentTime % 1000 < 50) { // логируем примерно раз в секунду
            console.log(`Обновление улиток. Всего: ${this.snails.length}, закончили: ${this.finishedSnails.length}`);
        }
        
        // Обновляем каждую улитку
        for (const snail of this.snails) {
            // Пропускаем улиток, которые уже финишировали
            if (snail.hasFinished) continue;
            
            // Форсируем движение - устанавливаем, что улитка всегда должна двигаться
            snail.isMoving = true;
            
            // Ускоренное обновление для более заметного движения
            // Вызываем обновление несколько раз за кадр для более быстрого движения
            for (let i = 0; i < 3; i++) {
                snail.update(deltaTime / 3);
            }
            
            // Проверяем, достигла ли улитка финиша
            if (snail.hasFinished && !this.finishedSnails.includes(snail)) {
                this.handleSnailFinish(snail);
                console.log(`Улитка ${snail.type} финишировала!`);
            }
        }
    }
    
    /**
     * Отрисовка всех улиток на canvas
     */
    draw(ctx) {
        for (const snail of this.snails) {
            // Получаем стиль из лабиринта для улиток
            const entityStyle = this.maze.style.entity;
            snail.draw(ctx, entityStyle);
        }
    }
    
    /**
     * Обработка финиша улитки
     */
    handleSnailFinish(snail) {
        // Увеличиваем счетчик финишировавших
        this.finishedCount++;
        
        // Устанавливаем позицию улитки на финише
        snail.finishPosition = this.finishedCount;
        
        // Добавляем в список финишировавших
        this.finishedSnails.push(snail);
        
        console.log(`Улитка ${snail.type} финишировала на позиции ${snail.finishPosition}`);
        
        // Если все улитки финишировали или улитка игрока финишировала, отправляем событие о завершении гонки
        if (this.finishedCount === this.snails.length || snail.isPlayer) {
            this.sendRaceFinishedEvent();
        }
    }
    
    /**
     * Отправка события о завершении гонки
     */
    sendRaceFinishedEvent() {
        // Останавливаем фоновую музыку при завершении гонки
        this.stopBackgroundMusic();
        
        // Создаем и отправляем пользовательское событие
        const event = new CustomEvent('raceFinished', {
            detail: {
                finishedSnails: this.finishedSnails,
                playerSnail: this.playerSnail
            }
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Принудительное завершение гонки
     */
    forceEndRace() {
        // Останавливаем фоновую музыку
        this.stopBackgroundMusic();
        
        // Останавливаем всех улиток
        for (const snail of this.snails) {
            snail.stopMoving();
            
            // Если улитка еще не финишировала, добавляем ее в конец списка
            if (!snail.hasFinished) {
                this.finishedCount++;
                snail.finishPosition = this.finishedCount;
                this.finishedSnails.push(snail);
            }
        }
        
        // Отправляем событие о завершении гонки
        this.sendRaceFinishedEvent();
    }
    
    /**
     * Получение списка финишировавших улиток
     */
    getFinishedSnails() {
        return this.finishedSnails;
    }
} 