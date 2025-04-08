/**
 * Модуль управления ресурсами и константами игры
 */
const GAME_ASSETS = {
    // Настройки изображений
    IMAGES: {
        SNAILS: {
            RACER: 'images/red_snail.png',
            EXPLORER: 'images/blue_snail.png',
            SNAKE: 'images/green_snail.png',
            STUBBORN: 'images/purple_snail.png',
            DEADENDER: 'images/yellow_snail.png'
        },
        MAZE: {
            WALL: 'images/wall_texture.png',
            PATH: 'images/path_texture.png',
            START: 'images/start.png',
            FINISH: 'images/finish.png',
        }
    },
    
    // Звуковые эффекты
    SOUNDS: {
        CLICK: 'mp3/click.mp3',
        BOMB: 'mp3/bomb.mp3',
        ROCKET: 'mp3/rocket.mp3',
        FINISH: 'mp3/finish.mp3',
        RACE_START: 'mp3/race_start.mp3',
        RACE_MUSIC: 'mp3/music.mp3'
    },
    
    // Типы ячеек лабиринта
    CELL_TYPES: {
        WALL: 1,
        PATH: 0,
        START: 2,
        FINISH: 3,
        TRAP: 4,
        BOOST: 5,
        PORTAL: 6
    },
    
    // Настройки лабиринта
    MAZE: {
        EASY: {
            ROWS: 15,
            COLS: 15,
            RANDOM_PATHS: 2,
            TRAPS: 2,
            BOOSTS: 2
        },
        MEDIUM: {
            ROWS: 20,
            COLS: 20, 
            RANDOM_PATHS: 4,
            TRAPS: 4,
            BOOSTS: 3
        },
        HARD: {
            ROWS: 25,
            COLS: 25,
            RANDOM_PATHS: 6,
            TRAPS: 6,
            BOOSTS: 4
        },
        EXTREME: {
            ROWS: 30,
            COLS: 30,
            RANDOM_PATHS: 8,
            TRAPS: 8,
            BOOSTS: 5
        }
    },
    
    // Характеристики улиток
    SNAIL_TYPES: {
        RACER: {
            TYPE: 'racer',
            NAME: 'Racer',
            DESCRIPTION: 'Быстрая и может получать случайное ускорение',
            BASE_SPEED: 4.5,
            SPEED_VARIATION: 1,
            BOOST_PROBABILITY: 0.2,
            BOOST_MULTIPLIER: 1.3,
            COLOR: '#ff0000'
        },
        EXPLORER: {
            TYPE: 'explorer',
            NAME: 'Explorer',
            DESCRIPTION: 'Исследует лабиринт и может найти короткие пути',
            BASE_SPEED: 3.5,
            SPEED_VARIATION: 0.5,
            EXPLORATION_RATE: 0.65,
            COLOR: '#0000ff'
        },
        SNAKE: {
            TYPE: 'snake',
            NAME: 'Snake',
            DESCRIPTION: 'Передвигается зигзагом и быстрее выходит из тупиков',
            BASE_SPEED: 4.0,
            SPEED_VARIATION: 0.7,
            ZIGZAG_PROBABILITY: 0.7,
            COLOR: '#00ff00'
        },
        STUBBORN: {
            TYPE: 'stubborn',
            NAME: 'Stubborn',
            DESCRIPTION: 'Упрямо движется в выбранном направлении',
            BASE_SPEED: 4.2,
            SPEED_VARIATION: 0.8,
            FORWARD_PROBABILITY: 0.85,
            COLOR: '#800080'
        },
        DEADENDER: {
            TYPE: 'deadender',
            NAME: 'Deadender',
            DESCRIPTION: 'Любит заходить в тупики и неожиданно менять направление',
            BASE_SPEED: 3.8,
            SPEED_VARIATION: 1.2,
            RANDOM_TURN_PROBABILITY: 0.6,
            COLOR: '#ffff00'
        }
    },
    
    // Настройки ячеек
    CELL_SIZE: 20,
    
    // Настройки игрового процесса
    GAME: {
        STARTING_BALANCE: 100,
        MIN_BET: 1,
        MAX_BET: 100,
        DEFAULT_BET: 10,
        WINNING_MULTIPLIER: 2.5,
        SECOND_PLACE_MULTIPLIER: 1.2,
        RACE_DURATION_MS: 60000,  // Максимальная длительность гонки (увеличиваем до 60 секунд)
        SNAIL_COUNT: 5,           // Количество улиток в гонке
        DIFFICULTY: 'medium'      // Сложность по умолчанию
    },
    
    // Константы для улучшения игровых эффектов
    MAZE_STYLES: {
        // Толщина стен
        WALL_THICKNESS: 4,
        
        // Цвета для разных элементов лабиринта
        COLORS: {
            BACKGROUND: '#f0f0f0',
            WALL: '#333333',
            PATH: '#ffffff',
            START: '#00ff00',
            FINISH: '#ff0000',
            VISITED: '#e0e0ff',
            CURRENT: '#ffff00'
        },
        
        // Эффекты для элементов
        EFFECTS: {
            SHADOW: true,
            GLOW: true,
            ROUNDED_CORNERS: true
        }
    },
    
    // Параметры анимации
    ANIMATION: {
        // Скорость анимации (мс)
        SPEED: 300,
        
        // Плавность переходов
        EASING: 'easeInOutCubic'
    },
    
    // Объекты для хранения загруженных ресурсов
    images: {},
    snailImages: {},
    
    // Флаг, указывающий загружены ли все ресурсы
    loaded: false,
    
    // Счетчики для загрузки
    loadedCount: 0,
    totalResources: 0,
    
    // Список всех ресурсов
    RESOURCES: [
        'images/red_snail.png',
        'images/blue_snail.png',
        'images/green_snail.png',
        'images/purple_snail.png',
        'images/yellow_snail.png',
        'images/wall_texture.png',
        'images/path_texture.png',
        'images/start.png',
        'images/finish.png',
        'mp3/click.mp3',
        'mp3/bomb.mp3',
        'mp3/rocket.mp3',
        'mp3/finish.mp3',
        'mp3/race_start.mp3',
        'mp3/music.mp3'
    ],
    
    /**
     * Инициализация и загрузка всех ресурсов
     * @param {Function} callback - функция, которая будет вызвана после загрузки всех ресурсов
     */
    init: function(callback) {
        // Загружаем общие изображения
        this.loadImages({
            'background': 'images/background.png',
            'maze_tile': 'images/path_texture.png',
            'wall': 'images/wall_texture.png',
            'start': 'images/start.png',
            'finish': 'images/finish.png'
        });
        
        // Загружаем изображения улиток для разных типов
        this.loadSnailImages({
            'player': 'images/red_snail.png',
            'regular': 'images/blue_snail.png',
            'fast': 'images/green_snail.png',
            'smart': 'images/red_snail.png',
            'racer': 'images/red_snail.png',
            'explorer': 'images/blue_snail.png',
            'snake': 'images/green_snail.png',
            'stubborn': 'images/purple_snail.png',
            'deadender': 'images/yellow_snail.png'
        });
        
        // Функция проверки загрузки всех ресурсов
        const checkAllLoaded = () => {
            if (this.loadedCount === this.totalResources) {
                this.loaded = true;
                if (callback) callback();
            } else {
                // Проверяем каждые 100 мс
                setTimeout(checkAllLoaded, 100);
            }
        };
        
        // Запускаем проверку загрузки
        checkAllLoaded();
    },
    
    /**
     * Загрузка списка изображений
     * @param {Object} imageList - объект с путями к изображениям
     */
    loadImages: function(imageList) {
        this.totalResources += Object.keys(imageList).length;
        
        for (const key in imageList) {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                console.log(`Загружено изображение: ${key}`);
            };
            img.onerror = () => {
                console.error(`Ошибка загрузки изображения: ${key}`);
                // Увеличиваем счетчик, чтобы не блокировать загрузку
                this.loadedCount++;
            };
            img.src = imageList[key];
            this.images[key] = img;
        }
    },
    
    /**
     * Загрузка изображений улиток
     * @param {Object} snailImages - объект с путями к изображениям улиток
     */
    loadSnailImages: function(snailImages) {
        this.totalResources += Object.keys(snailImages).length;
        
        for (const type in snailImages) {
            const img = new Image();
            img.onload = () => {
                this.loadedCount++;
                console.log(`Загружено изображение улитки: ${type}`);
            };
            img.onerror = () => {
                console.error(`Ошибка загрузки изображения улитки: ${type}`);
                // Создаем заглушку, чтобы не блокировать загрузку
                this.loadedCount++;
            };
            img.src = snailImages[type];
            this.snailImages[type] = img;
        }
    },
    
    /**
     * Функция для загрузки ресурсов (старый метод, сохраняем для совместимости)
     * @param {Function} onProgress - коллбэк прогресса загрузки
     * @param {Function} onComplete - коллбэк завершения загрузки
     */
    loadResources: function(onProgress, onComplete) {
        let loaded = 0;
        const total = this.RESOURCES.length;
        
        const resourceLoader = (src) => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    loaded++;
                    if (onProgress) {
                        onProgress(loaded, total);
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Ошибка загрузки: ${src}`);
                    loaded++;
                    if (onProgress) {
                        onProgress(loaded, total);
                    }
                    // Резолвим с ошибкой, но не прерываем весь процесс
                    resolve();
                };
                img.src = src;
            });
        };
        
        // Запускаем загрузку всех ресурсов параллельно
        const promises = this.RESOURCES.map(src => resourceLoader(src));
        
        // Когда все загружены, вызываем onComplete
        Promise.all(promises).then(() => {
            if (onComplete) {
                onComplete();
            }
        });
    },
    
    /**
     * Получение изображения по ключу
     * @param {string} key - ключ изображения
     * @returns {Image|null} - объект изображения или null, если изображение не найдено
     */
    getImage: function(key) {
        return this.images[key] || null;
    },
    
    /**
     * Получение изображения улитки по типу
     * @param {string} type - тип улитки
     * @returns {Image|null} - объект изображения или null, если изображение не найдено
     */
    getSnailImage: function(type) {
        // Если нет изображения для конкретного типа, возвращаем изображение обычной улитки
        return this.snailImages[type] || this.snailImages['regular'] || null;
    },
    
    /**
     * Проверка загрузки всех ресурсов
     * @returns {boolean} - true, если все ресурсы загружены
     */
    isLoaded: function() {
        return this.loaded;
    },
    
    /**
     * Получение прогресса загрузки ресурсов
     * @returns {number} - процент загрузки от 0 до 100
     */
    getLoadingProgress: function() {
        if (this.totalResources === 0) return 100;
        return Math.floor((this.loadedCount / this.totalResources) * 100);
    }
};

// Для совместимости со старым кодом создаем ссылку на GAME_ASSETS
const ASSETS = GAME_ASSETS;

/**
 * Инициализация ресурсов
 */
function initializeAssets() {
    // Создаем объект для хранения загруженных изображений улиток
    ASSETS.snailImages = {};
}

// Вызываем инициализацию ресурсов
initializeAssets(); 