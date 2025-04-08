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