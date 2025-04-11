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
        
        // НОВОЕ: ищем цвет и поведение улитки игрока из нескольких источников
        let playerSnailColor = null;
        let playerSnailBehavior = null;
        
        // 1. Проверяем глобальные переменные
        if (window.PLAYER_SNAIL_COLOR) {
            playerSnailColor = window.PLAYER_SNAIL_COLOR;
            console.log(`Использую цвет улитки из глобальной переменной: ${playerSnailColor}`);
        } 
        
        if (window.PLAYER_SNAIL_BEHAVIOR) {
            playerSnailBehavior = window.PLAYER_SNAIL_BEHAVIOR;
            console.log(`Использую поведение улитки из глобальной переменной: ${playerSnailBehavior}`);
        }
        
        // 2. Проверяем данные рандомизации
        if (window.RANDOMIZED_SNAILS && (!playerSnailColor || !playerSnailBehavior)) {
            const playerSnailData = window.RANDOMIZED_SNAILS.find(s => s.type === playerSnailType);
            if (playerSnailData) {
                if (!playerSnailColor) {
                    playerSnailColor = playerSnailData.originalColor || playerSnailData.color;
                    console.log(`Найден цвет улитки в RANDOMIZED_SNAILS: ${playerSnailColor}`);
                }
                
                if (!playerSnailBehavior) {
                    playerSnailBehavior = playerSnailData.behavior;
                    console.log(`Найдено поведение улитки в RANDOMIZED_SNAILS: ${playerSnailBehavior}`);
                }
            }
        }
        
        // Если нашли цвет, устанавливаем его для улитки игрока
        if (playerSnailColor) {
            console.log(`Устанавливаю цвет ${playerSnailColor} для улитки игрока типа ${playerSnailType}`);
            this.playerSnail.originalColor = playerSnailColor;
        } else {
            console.warn(`Не удалось найти цвет для улитки игрока типа ${playerSnailType}`);
        }
        
        // Если нашли поведение, устанавливаем его для улитки игрока
        if (playerSnailBehavior) {
            console.log(`Устанавливаю поведение ${playerSnailBehavior} для улитки игрока типа ${playerSnailType}`);
            this.playerSnail.behavior = playerSnailBehavior.toLowerCase();
        } else {
            console.warn(`Не удалось найти поведение для улитки игрока типа ${playerSnailType}`);
        }
        
        this.snails.push(this.playerSnail);
        
        // НОВОЕ: Отслеживаем использованные цвета, чтобы не было дубликатов
        const usedColors = new Set();
        // Добавляем цвет игрока в использованные
        if (playerSnailColor) {
            usedColors.add(playerSnailColor.toLowerCase());
        }
        
        // Создаем компьютерных улиток
        const snailTypes = Object.keys(ASSETS.SNAIL_TYPES)
            .map(type => type.toLowerCase())
            .filter(type => type !== playerSnailType.toLowerCase());
        
        // Выбираем случайных соперников
        const computerSnailCount = NUM_COMPUTER_SNAILS;
        const shuffledTypes = this.shuffleArray([...snailTypes]);
        
        // НОВОЕ: Определяем все доступные цвета
        const availableColors = ['Red', 'Blue', 'Green', 'Purple', 'Yellow'].filter(
            color => !usedColors.has(color.toLowerCase())
        );
        console.log(`Доступные цвета для компьютерных улиток: ${availableColors.join(', ')}`);
        
        // Перемешиваем доступные цвета для случайного назначения
        const shuffledColors = this.shuffleArray([...availableColors]);
        
        for (let i = 0; i < computerSnailCount && i < shuffledTypes.length; i++) {
            const snailType = shuffledTypes[i];
            const snail = new Snail(snailType, startRow, startCol, this.maze);
            
            // НОВОЕ: Присваиваем уникальный цвет каждой компьютерной улитке
            if (i < shuffledColors.length) {
                const uniqueColor = shuffledColors[i];
                snail.originalColor = uniqueColor;
                usedColors.add(uniqueColor.toLowerCase());
                console.log(`Установлен уникальный цвет ${uniqueColor} для компьютерной улитки типа ${snailType}`);
            } else {
                // Если не хватает уникальных цветов, генерируем случайный цвет
                const randomColor = this.generateRandomColor(usedColors);
                snail.originalColor = randomColor;
                usedColors.add(randomColor.toLowerCase());
                console.log(`Установлен случайный цвет ${randomColor} для компьютерной улитки типа ${snailType}`);
            }
            
            this.snails.push(snail);
        }
        
        console.log(`Создано ${this.snails.length} улиток для гонки с уникальными цветами`);
    }
    
    /**
     * Генерация случайного цвета, которого нет в множестве использованных
     * @param {Set} usedColors - Множество уже использованных цветов (в нижнем регистре)
     * @returns {string} Уникальный цвет
     */
    generateRandomColor(usedColors) {
        // Базовый набор цветов
        const baseColors = ['Red', 'Blue', 'Green', 'Purple', 'Yellow', 'Orange', 'Pink', 'Cyan', 'Magenta'];
        
        // Пытаемся найти неиспользованный цвет
        for (const color of baseColors) {
            if (!usedColors.has(color.toLowerCase())) {
                return color;
            }
        }
        
        // Если все цвета использованы, генерируем случайный со счетчиком
        const baseColor = baseColors[Math.floor(Math.random() * baseColors.length)];
        let index = 1;
        while (usedColors.has(`${baseColor.toLowerCase()}${index}`)) {
            index++;
        }
        return `${baseColor}${index}`;
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
     * Начало гонки
     * @param {number} raceId - идентификатор гонки
     */
    startRace(raceId) {
        if (this.raceInProgress) {
            console.warn("Гонка уже в процессе");
            return;
        }
        
        console.log(`Начинаем гонку #${raceId}`);
        
        // Инициализируем и запускаем музыку перед началом гонки
        this.preloadBackgroundMusic();
        
        // Сразу пытаемся запустить музыку
        setTimeout(() => {
            // Принудительно разблокируем аудиоконтекст, если он есть
            if (this.audioContext && this.audioContext.state === 'suspended') {
                console.log("Разблокировка AudioContext перед началом гонки");
                this.audioContext.resume()
                    .then(() => console.log("AudioContext успешно разблокирован"))
                    .catch(e => console.error("Ошибка разблокировки AudioContext:", e));
            }
            
            this.playBackgroundMusic();
        }, 500);
        
        this.raceId = raceId;
        this.raceInProgress = true;
        this.raceStartTime = Date.now();
        this.finishedCount = 0;
        
        // Перемешиваем массив улиток для случайного порядка старта
        this.shuffleArray(this.snails);
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
        
        // Сначала проверяем наличие предзагруженного аудио элемента в HTML
        const preloadedAudio = document.getElementById('background-music');
        if (preloadedAudio) {
            console.log("Найден предзагруженный аудио элемент в HTML");
            this.backgroundMusic = preloadedAudio;
            this.backgroundMusic.volume = 0.3;
            this.musicPreloaded = true;
            return;
        }
        
        // Создаем аудио контекст Web Audio API
        try {
            // Используем AudioContext для более надежного воспроизведения
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!this.audioContext) {
                this.audioContext = new AudioContext();
                console.log("Создан новый AudioContext:", this.audioContext.state);
            }
            
            // Полный URL аудиофайла
            const audioUrl = new URL(ASSETS.SOUNDS.RACE_MUSIC, window.location.href).href;
            console.log(`Загрузка аудио из: ${audioUrl}`);
            
            // Загружаем аудиофайл через fetch
            fetch(audioUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Ошибка HTTP: ${response.status}`);
                    }
                    console.log("Файл получен, декодируем аудио...");
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => this.audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    this.musicBuffer = audioBuffer;
                    this.musicPreloaded = true;
                    console.log("Аудиофайл успешно декодирован и готов к воспроизведению");
                })
                .catch(error => {
                    console.error("Ошибка при загрузке или декодировании аудио:", error);
                    this.musicPreloaded = false;
                });
        } catch (error) {
            console.error("Ошибка при создании AudioContext:", error);
            
            // Если Web Audio API не поддерживается, возвращаемся к обычному Audio
            this.fallbackToBasicAudio();
        }
    }
    
    /**
     * Резервный метод загрузки через Audio элемент
     */
    fallbackToBasicAudio() {
        console.log("Использование резервного метода загрузки аудио");
        
        const audioUrl = new URL(ASSETS.SOUNDS.RACE_MUSIC, window.location.href).href;
        this.backgroundMusic = new Audio(audioUrl);
        
        this.backgroundMusic.addEventListener('canplaythrough', () => {
            console.log("Музыка загружена через Audio элемент");
            this.musicPreloaded = true;
        });
        
        this.backgroundMusic.addEventListener('error', (e) => {
            console.error("Ошибка загрузки музыки через Audio элемент:", e);
            this.musicPreloaded = false;
        });
        
        this.backgroundMusic.preload = 'auto';
        this.backgroundMusic.volume = 0.3;
        this.backgroundMusic.loop = true;
    }
    
    /**
     * Воспроизведение фоновой музыки для гонки
     */
    playBackgroundMusic() {
        console.log("Попытка запуска фоновой музыки...", new Date().toISOString());
        console.log("Путь к музыке:", ASSETS.SOUNDS.RACE_MUSIC);
        
        // Попытка сразу воспроизвести предзагруженную музыку из HTML
        const audioElement = document.getElementById('background-music');
        if (audioElement) {
            console.log("Найден предзагруженный аудио элемент в HTML");
            
            // Принудительно задаем правильный источник
            const source = audioElement.querySelector('source');
            if (source) {
                const audioUrl = new URL(ASSETS.SOUNDS.RACE_MUSIC, window.location.href).href;
                if (source.src !== audioUrl) {
                    console.log(`Обновление пути аудио с ${source.src} на ${audioUrl}`);
                    source.src = audioUrl;
                    audioElement.load(); // Перезагружаем аудио с новым путем
                }
            }
            
            // Устанавливаем громкость и зацикливание
            audioElement.volume = 0.3;
            audioElement.loop = true;
            
            // Воспроизводим с обработкой ошибок
            try {
                console.log("Запуск элемента audio с инициированием пользователем");
                
                // Сначала возобновляем контекст, если он был приостановлен
                if (window.AudioContext || window.webkitAudioContext) {
                    const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                    if (tempContext.state === 'suspended') {
                        tempContext.resume();
                    }
                }
                
                // Пытаемся запустить аудио напрямую
                const playPromise = audioElement.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log("Фоновая музыка успешно запущена!", new Date().toISOString());
                            this.backgroundMusic = audioElement;
                        })
                        .catch(e => {
                            console.error('Ошибка воспроизведения через Audio:', e);
                            // Добавляем обработчик клика для альтернативного запуска
                            this.setupUserInteractionHandler(audioElement);
                        });
                } else {
                    // Для старых браузеров, которые не поддерживают Promise для play()
                    console.log("Браузер не поддерживает Promise для метода play()");
                    this.backgroundMusic = audioElement;
                }
                return;
            } catch (e) {
                console.error("Ошибка при запуске аудио напрямую:", e);
            }
        }
        
        // Если прямой способ не сработал, создаем новый аудио элемент
        console.log("Создание нового аудио элемента для воспроизведения");
        try {
            const audioUrl = new URL(ASSETS.SOUNDS.RACE_MUSIC, window.location.href).href;
            const newAudio = new Audio(audioUrl);
            newAudio.volume = 0.3;
            newAudio.loop = true;
            
            const playPromise = newAudio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Музыка запущена через новый аудио элемент");
                        this.backgroundMusic = newAudio;
                    })
                    .catch(e => {
                        console.error("Ошибка запуска через новый аудио элемент:", e);
                        this.setupUserInteractionHandler(newAudio);
                    });
            }
        } catch (e) {
            console.error("Ошибка при создании нового аудио элемента:", e);
        }
    }
    
    /**
     * Настройка обработчика пользовательского взаимодействия для запуска музыки
     */
    setupUserInteractionHandler(audioElement) {
        console.log("Настройка обработчика пользовательского взаимодействия для музыки");
        
        // Создаем временную кнопку для запуска музыки
        const musicButton = document.createElement('button');
        musicButton.textContent = '🔊';
        musicButton.style.position = 'absolute';
        musicButton.style.top = '10px';
        musicButton.style.right = '10px';
        musicButton.style.zIndex = '9999';
        musicButton.style.borderRadius = '50%';
        musicButton.style.width = '40px';
        musicButton.style.height = '40px';
        musicButton.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        musicButton.style.border = 'none';
        musicButton.style.cursor = 'pointer';
        
        musicButton.onclick = () => {
            console.log("Кнопка нажата, запуск музыки по пользовательскому взаимодействию");
            audioElement.play()
                .then(() => {
                    console.log("Музыка запущена по клику на кнопку");
                    this.backgroundMusic = audioElement;
                    musicButton.remove(); // Удаляем кнопку после успешного запуска
                })
                .catch(err => {
                    console.error("Не удалось запустить музыку по клику на кнопку:", err);
                });
        };
        
        document.body.appendChild(musicButton);
    }
    
    /**
     * Остановка фоновой музыки
     */
    stopBackgroundMusic() {
        try {
            // Остановка Web Audio API
            if (this.musicSource) {
                console.log("Остановка Web Audio API источника");
                this.musicSource.stop();
                this.musicSource.disconnect();
                this.musicSource = null;
            }
            
            // Остановка Audio элемента
            if (this.backgroundMusic) {
                console.log("Остановка Audio элемента");
                this.backgroundMusic.pause();
                this.backgroundMusic.currentTime = 0;
            }
        } catch (e) {
            console.error("Ошибка при остановке музыки:", e);
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
        
        // Сохраняем время прохождения улиткой дистанции (от старта гонки)
        if (!snail.finishTime) {
            // Используем абсолютное время для корректного сравнения
            snail.finishTime = Date.now();
            console.log(`Улитка ${snail.type} финишировала за ${snail.finishTime - this.raceStartTime}мс`);
        }
        
        // Устанавливаем позицию улитки на финише
        snail.finishPosition = this.finishedCount;
        snail.position = this.finishedCount;
        
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
        if (!this.raceInProgress) return;
        
        console.log("Принудительное завершение гонки");
        this.raceInProgress = false;
        
        // Останавливаем фоновую музыку
        this.stopBackgroundMusic();
        
        // Определяем координаты финиша
        const finishRow = this.maze.finish.row;
        const finishCol = this.maze.finish.col;
        
        // Получим все улитки, которые еще не финишировали
        const unfinishedSnails = this.snails.filter(snail => !snail.hasFinished);
        console.log(`Невинишировавших улиток: ${unfinishedSnails.length}`);
        
        // Рассчитываем реальное расстояние до финиша для каждой улитки
        for (const snail of unfinishedSnails) {
            console.log(`Расчет пути для улитки ${snail.type} на позиции (${snail.row}, ${snail.col})`);
            
            // Инициализируем большим значением по умолчанию
            snail.distanceToFinish = 999999;
            
            try {
                // Пытаемся найти реальный путь через лабиринт с учетом стен
                const path = this.maze.findPath(
                    snail.row,
                    snail.col,
                    finishRow,
                    finishCol
                );
                
                if (path && path.length > 0) {
                    // Если путь найден, используем его длину как расстояние
                    snail.pathToFinish = path;
                    snail.distanceToFinish = path.length;
                    console.log(`Улитка ${snail.type}: найден реальный путь длиной ${path.length} ячеек`);
                } else {
                    // Если путь не найден, используем обход в ширину (BFS) для нахождения кратчайшего пути 
                    const distances = this.calculateMazeDistances(snail.row, snail.col);
                    
                    if (distances && distances[finishRow] && distances[finishRow][finishCol] !== undefined) {
                        // Нашли расстояние через BFS
                        snail.distanceToFinish = distances[finishRow][finishCol];
                        console.log(`Улитка ${snail.type}: расстояние через BFS: ${snail.distanceToFinish}`);
                    } else {
                        // Если даже BFS не помог, используем манхэттенское расстояние как последний вариант
                        const manhattanDistance = Math.abs(snail.row - finishRow) + Math.abs(snail.col - finishCol);
                        snail.distanceToFinish = manhattanDistance * 2; // Умножаем на 2, чтобы учесть извилистость пути
                        console.log(`Улитка ${snail.type}: использовано манхэттенское расстояние *2: ${snail.distanceToFinish}`);
                    }
                }
            } catch (error) {
                console.error(`Ошибка при вычислении пути для улитки ${snail.type}:`, error);
                // В случае ошибки используем манхэттенское расстояние * 2 как приближение
                const manhattanDistance = Math.abs(snail.row - finishRow) + Math.abs(snail.col - finishCol);
                snail.distanceToFinish = manhattanDistance * 2;
                console.log(`Улитка ${snail.type}: использовано манхэттенское расстояние *2 из-за ошибки: ${snail.distanceToFinish}`);
            }
        }
        
        // Сортируем незавершивших улиток по расстоянию до финиша (ближе = выше место)
        unfinishedSnails.sort((a, b) => a.distanceToFinish - b.distanceToFinish);
        
        console.log("Улитки, не успевшие финишировать (отсортированы по расстоянию):");
        unfinishedSnails.forEach(snail => {
            console.log(`${snail.type}: ${snail.distanceToFinish} шагов до финиша`);
        });
        
        // Устанавливаем позиции для невинишировавших улиток
        let nextPosition = this.finishedCount + 1;
        unfinishedSnails.forEach(snail => {
            // Для отображения времени используем формат 60с + пенальти в зависимости от расстояния
            const baseTime = 60; // 60 секунд для всех невинишировавших
            // Расчет штрафного времени: делаем более заметным различие между улитками
            // Используем фактическое расстояние до финиша для создания разницы между улитками
            const distancePenalty = (snail.distanceToFinish * 0.1).toFixed(2);
            
            // Устанавливаем специальное время финиша для отображения
            // Формат: 60.xx, где xx - штрафное время на основе расстояния
            const paddedPenalty = distancePenalty.replace("0.", "").padStart(2, "0");
            snail.displayFinishTime = `${baseTime}.${paddedPenalty}s`;
            
            // Устанавливаем абсолютное время финиша для сортировки в общем списке
            // Текущее время + штраф на основе расстояния
            const penaltyPerStep = 100; // 100 мс за шаг
            snail.finishTime = Date.now() + (snail.distanceToFinish * penaltyPerStep);
            
            console.log(`Улитка ${snail.type} получает время: ${snail.displayFinishTime} (расстояние: ${snail.distanceToFinish})`);
            
            // Финишируем улитку с отметкой автоматического финиша
            snail.finish(nextPosition, true);
            this.finishedSnails.push(snail);
            nextPosition++;
        });
        
        // Проверяем финальную сортировку улиток
        console.log("Финальная сортировка всех улиток:");
        
        // Сортируем всех улиток в финальном списке по времени финиша
        this.finishedSnails.sort((a, b) => {
            // Для улиток с реальным финишем используем их реальное время
            // Для невинишировавших используем расчетное время на основе расстояния до финиша
            return (a.finishTime - b.finishTime);
        });
        
        // Обновляем позиции в соответствии с финальной сортировкой
        this.finishedSnails.forEach((snail, index) => {
            snail.position = index + 1;
            console.log(`${snail.position}. ${snail.type}: ${snail.hasFinished ? 'финишировал' : 'не финишировал'}, время: ${snail.displayFinishTime || ((snail.finishTime - this.raceStartTime) / 1000).toFixed(2) + "s"}`);
        });
        
        // Отправляем событие о завершении гонки
        this.sendRaceFinishedEvent();
    }
    
    /**
     * Вычисляет расстояния от указанной точки до всех доступных ячеек лабиринта
     * используя алгоритм поиска в ширину (BFS)
     * @param {number} startRow - Начальная строка
     * @param {number} startCol - Начальный столбец
     * @returns {Object} Массив расстояний до всех ячеек
     */
    calculateMazeDistances(startRow, startCol) {
        if (!this.maze || !this.maze.grid) {
            console.error("Лабиринт не инициализирован");
            return null;
        }
        
        // Создаем двумерный массив для хранения расстояний
        const distances = Array(this.maze.grid.length)
            .fill()
            .map(() => Array(this.maze.grid[0].length).fill(Infinity));
        
        // Инициализируем расстояние до начальной точки как 0
        distances[startRow][startCol] = 0;
        
        // Очередь для BFS: [строка, столбец, расстояние]
        const queue = [[startRow, startCol, 0]];
        
        // Обработанные ячейки
        const visited = new Set(`${startRow},${startCol}`);
        
        // Направления для перемещения (вверх, вправо, вниз, влево)
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];
        
        // Проходим, пока есть ячейки в очереди
        while (queue.length > 0) {
            // Берем первую ячейку из очереди
            const [row, col, distance] = queue.shift();
            
            // Проверяем все соседние ячейки
            for (const [dRow, dCol] of directions) {
                const newRow = row + dRow;
                const newCol = col + dCol;
                
                // Проверяем, что ячейка в пределах лабиринта
                if (
                    newRow >= 0 && 
                    newRow < this.maze.grid.length && 
                    newCol >= 0 && 
                    newCol < this.maze.grid[0].length
                ) {
                    // Проверяем, что ячейка не стена и мы еще не посещали ее
                    const cellValue = this.maze.grid[newRow][newCol];
                    const key = `${newRow},${newCol}`;
                    
                    if (cellValue !== 1 && !visited.has(key)) { // 1 - это стена в лабиринте
                        // Обновляем расстояние
                        distances[newRow][newCol] = distance + 1;
                        // Отмечаем ячейку как посещенную
                        visited.add(key);
                        // Добавляем в очередь для проверки ее соседей
                        queue.push([newRow, newCol, distance + 1]);
                    }
                }
            }
        }
        
        return distances;
    }
    
    /**
     * Получение списка финишировавших улиток
     */
    getFinishedSnails() {
        return this.finishedSnails;
    }
    
    /**
     * Устанавливает свойства для улитки игрока
     * @param {string} color - Цвет улитки игрока
     * @param {string} behavior - Поведение улитки игрока
     */
    setPlayerSnailProperties(color, behavior) {
        console.log(`Устанавливаю свойства улитки игрока: цвет=${color}, поведение=${behavior}`);
        
        if (this.playerSnail) {
            if (color) {
                this.playerSnail.originalColor = color;
                
                // При необходимости обновляем внешний вид улитки
                if (this.playerSnail.element) {
                    const snailImage = this.playerSnail.element.querySelector('img');
                    if (snailImage) {
                        const colorLower = color.toLowerCase();
                        snailImage.src = `images/${colorLower}_snail.png`;
                        console.log(`Изображение улитки игрока обновлено на: ${colorLower}`);
                    }
                }
            }
            
            if (behavior) {
                this.playerSnail.behavior = behavior.toLowerCase();
                console.log(`Установлено поведение улитки игрока: ${behavior}`);
            }
        } else {
            console.warn('Улитка игрока не создана, свойства будут установлены при её создании');
            // Сохраняем для последующего использования
            this.pendingPlayerColor = color;
            this.pendingPlayerBehavior = behavior;
        }
    }
    
    /**
     * Устанавливает цвет для улитки игрока (устаревший метод, для обратной совместимости)
     * @param {string} color - Цвет улитки игрока
     */
    setPlayerSnailColor(color) {
        this.setPlayerSnailProperties(color, null);
    }
} 