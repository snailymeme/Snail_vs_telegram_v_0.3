/**
 * Модуль управления улитками в игре
 */

/**
 * Класс улитки
 */
class Snail {
    constructor(type, row, col, maze) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.maze = maze;
        
        // Загружаем настройки из ASSETS
        const snailConfig = ASSETS.SNAIL_TYPES[type.toUpperCase()];
        this.name = snailConfig.NAME;
        this.baseSpeed = snailConfig.BASE_SPEED;
        this.speedVariation = snailConfig.SPEED_VARIATION;
        this.color = snailConfig.COLOR;
        
        // Общие настройки для всех улиток
        this.cellSize = ASSETS.CELL_SIZE;
        this.isMoving = false;
        this.hasFinished = false;
        this.position = 0; // Позиция в гонке (0 - не финишировала)
        
        // Вариация скорости для данной улитки
        this.speed = this.baseSpeed + (Math.random() * this.speedVariation * 2 - this.speedVariation);
        this.currentDirection = 'right'; // направление по умолчанию
        
        // Текущий путь улитки
        this.path = [];
        this.currentPathIndex = 0;
        
        // Параметры для отслеживания времени
        this.lastMoveTime = 0;
        this.finishTime = 0;
        
        // Применяем специальные параметры для типа улитки
        this.initTypeSpecificParameters();
        
        // Создаем элемент улитки
        this.element = null;
    }
    
    /**
     * Инициализация параметров в зависимости от типа улитки
     */
    initTypeSpecificParameters() {
        // Базовые параметры для всех типов (начальные значения)
        this.wrongPathProbability = 0.7; 
        this.disoriented = false;
        this.disorientedTime = 0;
        this.stuck = false;
        this.turboBoost = false;
        this.turboBoostTimer = 0;
        
        // Получаем конфигурацию конкретного типа улитки
        const snailConfig = ASSETS.SNAIL_TYPES[this.type.toUpperCase()];
        
        // Специфичные параметры в зависимости от типа
        switch (this.type) {
            case 'racer':
                this.boostProbability = snailConfig.BOOST_PROBABILITY || 0.2;
                this.boostMultiplier = snailConfig.BOOST_MULTIPLIER || 1.3;
                this.wrongPathProbability = 0.5; // Базовое значение для типа
                break;
                
            case 'explorer':
                this.explorationRate = snailConfig.EXPLORATION_RATE || 0.85;
                this.wrongPathProbability = 0.75; // Базовое значение для типа
                break;
                
            case 'snake':
                this.zigzagProbability = snailConfig.ZIGZAG_PROBABILITY || 0.9;
                this.escapeDeadEndSpeed = 1.3; // Базовое значение для типа
                break;
                
            case 'stubborn':
                this.forwardProbability = snailConfig.FORWARD_PROBABILITY || 0.9;
                this.accelerationBoost = 1.1; // Базовое значение для типа
                break;
                
            case 'deadender':
                this.randomTurnProbability = snailConfig.RANDOM_TURN_PROBABILITY || 0.8;
                this.pauseInDeadEndTime = 1500; // Базовое значение для типа
                break;
        }
    }
    
    /**
     * Создание визуального представления улитки
     */
    render(container) {
        if (this.element) {
            this.element.remove();
        }
        
        // Создаем элемент улитки
        this.element = document.createElement('div');
        this.element.className = `snail snail-${this.type}`;
        
        // Устанавливаем размер элемента
        const elementSize = this.cellSize * 0.8;
        this.element.style.width = `${elementSize}px`;
        this.element.style.height = `${elementSize}px`;
        
        // Улучшенная плавная анимация с использованием cubic-bezier для более естественного движения
        this.element.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        this.element.style.position = 'absolute';
        this.element.style.borderRadius = '50%';
        this.element.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
        this.element.style.willChange = 'transform'; // Оптимизация производительности
        this.element.style.zIndex = '10';
        
        // Добавляем след улитки для визуального эффекта
        this.trailElement = document.createElement('div');
        this.trailElement.className = `snail-trail snail-trail-${this.type}`;
        this.trailElement.style.position = 'absolute';
        this.trailElement.style.width = `${elementSize/5}px`;
        this.trailElement.style.height = `${elementSize/5}px`;
        this.trailElement.style.borderRadius = '50%';
        this.trailElement.style.opacity = '0.4';
        this.trailElement.style.backgroundColor = this.color;
        this.trailElement.style.zIndex = '5';
        this.trailElement.style.pointerEvents = 'none';
        container.appendChild(this.trailElement);
        
        // Создаем изображение улитки
        const snailImage = document.createElement('img');
        snailImage.src = ASSETS.IMAGES.SNAILS[this.type.toUpperCase()];
        snailImage.alt = this.name;
        snailImage.style.width = '100%';
        snailImage.style.height = '100%';
        snailImage.style.borderRadius = '50%'; // Скругляем изображение
        snailImage.style.pointerEvents = 'none'; // Отключаем события мыши на изображении
        
        // Добавляем изображение в элемент
        this.element.appendChild(snailImage);
        
        // Устанавливаем начальную позицию
        this.displayX = this.col * this.cellSize;
        this.displayY = this.row * this.cellSize;
        this.updateElementPosition();
        
        // Добавляем элемент в контейнер
        container.appendChild(this.element);
        
        // Эффект появления
        this.element.style.opacity = '0';
        this.element.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            this.element.style.opacity = '1';
            this.element.style.transform = 'scale(1)';
        }, 10);
        
        // Запускаем анимационный цикл для улитки
        this.animationFrameId = requestAnimationFrame(this.animationFrame.bind(this));
    }
    
    /**
     * Функция анимационного цикла для плавного движения
     */
    animationFrame() {
        if (this.isMoving && !this.hasFinished) {
            // Вычисляем целевую позицию
            const targetX = this.col * this.cellSize;
            const targetY = this.row * this.cellSize;
            
            // Плавно приближаем текущее отображаемое положение к целевому
            const smoothFactor = 0.15; // Фактор плавности (0-1)
            this.displayX += (targetX - this.displayX) * smoothFactor;
            this.displayY += (targetY - this.displayY) * smoothFactor;
            
            // Обновляем визуальную позицию элемента
            this.updateVisualPosition();
            
            // Добавляем эффект следа
            this.updateTrail();
        }
        
        // Запрашиваем следующий кадр анимации
        this.animationFrameId = requestAnimationFrame(this.animationFrame.bind(this));
    }
    
    /**
     * Обновление визуальной позиции элемента
     */
    updateVisualPosition() {
        if (!this.element) return;
        
        // Центрирование улитки в ячейке
        const elementSize = parseFloat(this.element.style.width);
        const offset = (this.cellSize - elementSize) / 2;
        
        // Применяем дополнительные эффекты к движению
        let bounceEffect = 0;
        if (this.isMoving) {
            // Эффект "покачивания" при движении
            bounceEffect = Math.sin(Date.now() / 100) * 2;
        }
        
        // Применяем позицию через трансформацию для плавности
        const x = this.displayX + offset;
        const y = this.displayY + offset + bounceEffect;
        
        this.element.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        
        // Эффект отражения в зависимости от направления
        const snailImage = this.element.querySelector('img');
        if (snailImage) {
            const isFlipped = this.currentDirection === 'left';
            const rotation = isFlipped ? 'scaleX(-1)' : '';
            
            // Добавляем небольшой наклон при движении в разных направлениях
            let tilt = 0;
            if (this.currentDirection === 'up') tilt = -10;
            else if (this.currentDirection === 'down') tilt = 10;
            
            snailImage.style.transform = `${rotation} rotate(${tilt}deg)`;
        }
    }
    
    /**
     * Обновление следа улитки
     */
    updateTrail() {
        if (!this.trailElement || !this.isMoving) return;
        
        // Случайное добавление "капель" следа
        if (Math.random() < 0.2) {
            const trailDrop = document.createElement('div');
            trailDrop.className = 'trail-drop';
            trailDrop.style.position = 'absolute';
            trailDrop.style.width = '4px';
            trailDrop.style.height = '4px';
            trailDrop.style.borderRadius = '50%';
            trailDrop.style.backgroundColor = this.color;
            trailDrop.style.opacity = '0.3';
            trailDrop.style.zIndex = '4';
            
            // Размещаем каплю в текущей позиции улитки
            const x = this.displayX + this.cellSize / 2;
            const y = this.displayY + this.cellSize / 2;
            trailDrop.style.left = `${x}px`;
            trailDrop.style.top = `${y}px`;
            
            // Добавляем к DOM
            this.element.parentNode.appendChild(trailDrop);
            
            // Анимация исчезновения и удаление через 2 секунды
            setTimeout(() => {
                trailDrop.style.transition = 'opacity 1s';
                trailDrop.style.opacity = '0';
                setTimeout(() => {
                    trailDrop.remove();
                }, 1000);
            }, 1000);
        }
        
        // Обновляем позицию основного следа
        this.trailElement.style.left = `${this.displayX + this.cellSize / 2}px`;
        this.trailElement.style.top = `${this.displayY + this.cellSize / 2}px`;
    }
    
    /**
     * Обновление позиции элемента улитки
     */
    updateElementPosition() {
        if (!this.element) return;
        
        // Обновляем целевую позицию
        this.displayX = this.col * this.cellSize;
        this.displayY = this.row * this.cellSize;
        
        // Обновляем визуальное положение
        this.updateVisualPosition();
    }
    
    /**
     * Генерация пути для улитки
     */
    generatePath() {
        // Если улитка финишировала, не меняем путь
        if (this.hasFinished) return;
        
        // Генерируем путь с учетом типа улитки
        switch (this.type) {
            case 'racer':
                this.generateRacerPath();
                break;
            case 'explorer':
                this.generateExplorerPath();
                break;
            case 'snake':
                this.generateSnakePath();
                break;
            case 'stubborn':
                this.generateStubbornPath();
                break;
            case 'deadender':
                this.generateDeadenderPath();
                break;
            default:
                // Базовый алгоритм для всех улиток - поиск пути к финишу
                this.generateBasePath();
        }
        
        // Сбрасываем индекс пути
        this.currentPathIndex = 0;
    }
    
    /**
     * Базовый алгоритм генерации пути (к финишу)
     */
    generateBasePath() {
        // С большой вероятностью генерируем случайный путь вместо поиска оптимального
        if (Math.random() < this.wrongPathProbability) {
            this.generateRandomPath(8); // Увеличиваем длину случайного пути
            return;
        }
        
        // Пытаемся найти путь к финишу
        const path = this.maze.findPath(
            this.row, 
            this.col, 
            this.maze.finish.row, 
            this.maze.finish.col
        );
        
        // Если путь найден, модифицируем его для неоптимальности
        if (path && path.length > 0) {
            // Добавляем случайные отклонения в путь
            const modifiedPath = [path[0]];
            
            for (let i = 1; i < path.length - 1; i++) {
                // С определенной вероятностью добавляем случайное отклонение
                if (Math.random() < 0.4) {
                    const neighbors = this.getValidNeighbors(path[i].row, path[i].col);
                    if (neighbors.length > 0) {
                        // Добавляем случайных соседей для создания петель
                        const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                        modifiedPath.push(randomNeighbor);
                        // Иногда добавляем больше отклонений для создания петли
                        if (Math.random() < 0.3) {
                            const moreNeighbors = this.getValidNeighbors(randomNeighbor.row, randomNeighbor.col);
                            if (moreNeighbors.length > 0) {
                                modifiedPath.push(moreNeighbors[Math.floor(Math.random() * moreNeighbors.length)]);
                            }
                        }
                    }
                }
                
                modifiedPath.push(path[i]);
            }
            
            modifiedPath.push(path[path.length - 1]);
            this.path = modifiedPath;
            return;
        }
        
        // Если путь не найден, используем случайные шаги
        this.generateRandomPath(8);
    }
    
    /**
     * Генерация случайного пути
     */
    generateRandomPath(steps) {
        const path = [{ row: this.row, col: this.col }];
        let currentRow = this.row;
        let currentCol = this.col;
        
        for (let i = 0; i < steps; i++) {
            const neighbors = this.getValidNeighbors(currentRow, currentCol);
            if (neighbors.length === 0) break;
            
            // Выбираем случайного соседа
            const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
            path.push(randomNeighbor);
            
            currentRow = randomNeighbor.row;
            currentCol = randomNeighbor.col;
            
            // С небольшой вероятностью добавляем больше случайных шагов для создания петель
            if (Math.random() < 0.3 && i < steps - 2) {
                const moreNeighbors = this.getValidNeighbors(currentRow, currentCol);
                if (moreNeighbors.length > 0) {
                    const extraNeighbor = moreNeighbors[Math.floor(Math.random() * moreNeighbors.length)];
                    path.push(extraNeighbor);
                    currentRow = extraNeighbor.row;
                    currentCol = extraNeighbor.col;
                    i++; // Увеличиваем счетчик, так как добавили еще один шаг
                }
            }
            
            // Если достигли финиша, с большой вероятностью продолжаем случайное движение
            if (currentRow === this.maze.finish.row && currentCol === this.maze.finish.col) {
                if (Math.random() < 0.8 && i < steps - 2) {
                    // Продолжаем случайное движение, не останавливаясь на финише
                    continue;
                }
                break;
            }
        }
        
        this.path = path;
    }
    
    /**
     * Получение списка проходимых соседних ячеек
     */
    getValidNeighbors(row, col) {
        const neighbors = [];
        const directions = [
            [-1, 0], // Вверх
            [1, 0],  // Вниз
            [0, -1], // Влево
            [0, 1]   // Вправо
        ];
        
        for (let [dRow, dCol] of directions) {
            const newRow = row + dRow;
            const newCol = col + dCol;
            
            if (this.maze.isWalkable(newRow, newCol)) {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        
        return neighbors;
    }
    
    /**
     * Специфическая генерация пути для улитки типа 'racer'
     */
    generateRacerPath() {
        // Racer старается идти к финишу, но может получить ускорение
        if (Math.random() < this.boostProbability && !this.turboBoost) {
            this.activateTurboBoost();
        }
        
        // Даже быстрая улитка должна иногда отклоняться от пути
        if (Math.random() < 0.6) {
            this.generateRandomPath(6);
        } else {
            this.generateBasePath();
        }
    }
    
    /**
     * Специфическая генерация пути для улитки типа 'explorer'
     */
    generateExplorerPath() {
        // Explorer с определенной вероятностью исследует лабиринт
        if (Math.random() < this.explorationRate) {
            // Исследователь любит посещать разные части лабиринта
            const randomRow = Math.floor(Math.random() * this.maze.rows);
            const randomCol = Math.floor(Math.random() * this.maze.cols);
            
            // Пытаемся найти случайную доступную ячейку для исследования
            if (this.maze.isWalkable(randomRow, randomCol)) {
                const randomPath = this.maze.findPath(
                    this.row,
                    this.col,
                    randomRow,
                    randomCol
                );
                
                if (randomPath && randomPath.length > 0) {
                    this.path = randomPath;
                    return;
                }
            }
            
            this.generateRandomPath(10);
        } else {
            this.generateBasePath();
        }
    }
    
    /**
     * Специфическая генерация пути для улитки типа 'snake'
     */
    generateSnakePath() {
        // Snake движется зигзагами
        if (Math.random() < this.zigzagProbability) {
            const basePath = this.maze.findPath(
                this.row, 
                this.col, 
                this.maze.finish.row, 
                this.maze.finish.col
            );
            
            if (basePath && basePath.length > 2) {
                // Сильно модифицируем путь для создания зигзагов
                const zigzagPath = [basePath[0]];
                
                for (let i = 1; i < basePath.length - 1; i++) {
                    // Для каждой точки пути добавляем зигзаги
                    const neighbors = this.getValidNeighbors(basePath[i].row, basePath[i].col);
                    
                    // Добавляем больше случайных соседей для создания зигзагов
                    if (neighbors.length > 1) {
                        // Добавляем до 3 случайных соседей
                        for (let j = 0; j < Math.min(3, neighbors.length); j++) {
                            if (Math.random() < 0.7) {
                                const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                                zigzagPath.push(randomNeighbor);
                                
                                // Можем добавить еще больше зигзагов
                                const subNeighbors = this.getValidNeighbors(randomNeighbor.row, randomNeighbor.col);
                                if (subNeighbors.length > 0 && Math.random() < 0.4) {
                                    zigzagPath.push(subNeighbors[Math.floor(Math.random() * subNeighbors.length)]);
                                }
                            }
                        }
                    }
                    
                    zigzagPath.push(basePath[i]);
                }
                
                zigzagPath.push(basePath[basePath.length - 1]);
                this.path = zigzagPath;
                return;
            }
        }
        
        // Если не удалось создать зигзаг, используем случайный путь
        this.generateRandomPath(10);
    }
    
    /**
     * Специфическая генерация пути для улитки типа 'stubborn'
     */
    generateStubbornPath() {
        // Stubborn предпочитает двигаться в текущем направлении
        if (this.path.length > 1 && Math.random() < this.forwardProbability) {
            const lastDirection = this.getDirection(
                this.path[this.path.length - 2],
                this.path[this.path.length - 1]
            );
            
            // Пытаемся продолжить движение в том же направлении
            const neighbors = this.getValidNeighbors(this.row, this.col);
            const forwardNeighbors = neighbors.filter(n => this.getDirection({ row: this.row, col: this.col }, n) === lastDirection);
            
            if (forwardNeighbors.length > 0) {
                const path = [{ row: this.row, col: this.col }, forwardNeighbors[0]];
                
                // Продолжаем движение в том же направлении, даже если это неоптимально
                let currentCell = forwardNeighbors[0];
                for (let i = 0; i < 8; i++) {
                    const nextNeighbors = this.getValidNeighbors(currentCell.row, currentCell.col);
                    const sameDirectionNeighbors = nextNeighbors.filter(
                        n => this.getDirection(currentCell, n) === lastDirection
                    );
                    
                    if (sameDirectionNeighbors.length > 0) {
                        const nextCell = sameDirectionNeighbors[0];
                        path.push(nextCell);
                        currentCell = nextCell;
                    } else {
                        // Если не можем идти в том же направлении, выбираем случайное
                        if (nextNeighbors.length > 0) {
                            const randomNeighbor = nextNeighbors[Math.floor(Math.random() * nextNeighbors.length)];
                            path.push(randomNeighbor);
                            currentCell = randomNeighbor;
                        } else {
                            break;
                        }
                    }
                }
                
                this.path = path;
                return;
            }
        }
        
        // Если не удалось продолжить в том же направлении, используем базовый путь
        this.generateBasePath();
    }
    
    /**
     * Специфическая генерация пути для улитки типа 'deadender'
     */
    generateDeadenderPath() {
        // Deadender любит заходить в тупики
        if (Math.random() < this.randomTurnProbability) {
            // Ищем ближайший тупик или просто делаем случайные повороты
            const path = [{ row: this.row, col: this.col }];
            let currentCell = { row: this.row, col: this.col };
            
            for (let i = 0; i < 8; i++) {
                const neighbors = this.getValidNeighbors(currentCell.row, currentCell.col);
                
                if (neighbors.length === 0) break;
                
                // С большой вероятностью выбираем соседа, ведущего в тупик
                const deadEndNeighbors = neighbors.filter(n => {
                    const nextNeighbors = this.getValidNeighbors(n.row, n.col);
                    return nextNeighbors.length <= 1; // Тупик или почти тупик
                });
                
                if (deadEndNeighbors.length > 0 && Math.random() < 0.8) {
                    const deadEndNeighbor = deadEndNeighbors[Math.floor(Math.random() * deadEndNeighbors.length)];
                    path.push(deadEndNeighbor);
                    currentCell = deadEndNeighbor;
                    
                    // С высокой вероятностью застреваем в тупике
                    if (Math.random() < 0.7) {
                        this.stuck = true;
                        setTimeout(() => {
                            this.stuck = false;
                        }, this.pauseInDeadEndTime);
                    }
                } else {
                    // Иначе выбираем случайного соседа
                    const randomNeighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
                    path.push(randomNeighbor);
                    currentCell = randomNeighbor;
                }
            }
            
            this.path = path;
            return;
        }
        
        // Если не выбрали искать тупик, используем базовый путь
        this.generateBasePath();
    }
    
    /**
     * Получение направления от одной точки к другой
     */
    getDirection(from, to) {
        if (from.row > to.row) return 'up';
        if (from.row < to.row) return 'down';
        if (from.col > to.col) return 'left';
        if (from.col < to.col) return 'right';
        return 'unknown';
    }
    
    /**
     * Активация режима ускорения
     */
    activateTurboBoost() {
        this.turboBoost = true;
        this.turboBoostTimer = 3000; // Длительность ускорения в мс
        console.log(`${this.name} активировал ускорение!`);
    }
    
    /**
     * Запуск движения улитки
     */
    start() {
        this.isMoving = true;
        this.hasFinished = false;
        this.generatePath();
        this.lastMoveTime = Date.now();
    }
    
    /**
     * Остановка движения улитки
     */
    stop() {
        this.isMoving = false;
    }
    
    /**
     * Завершение гонки для улитки
     */
    finish(position) {
        this.hasFinished = true;
        this.isMoving = false;
        this.position = position;
        this.finishTime = Date.now() - this.lastMoveTime;
        
        // Добавляем эффект для финиша
        if (this.element) {
            // Добавляем класс для winner анимации
            if (position === 1) {
                this.element.classList.add('winner');
            }
            
            this.element.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.5s ease';
            this.element.style.filter = 'drop-shadow(0 0 10px gold) brightness(1.3)';
            this.element.style.transform = `translate3d(${this.displayX + (this.cellSize - parseFloat(this.element.style.width)) / 2}px, ${this.displayY + (this.cellSize - parseFloat(this.element.style.height)) / 2}px, 0) scale(1.2)`;
        }
        
        console.log(`${this.name} финишировал на позиции ${position}! Время: ${this.finishTime}мс`);
    }
    
    /**
     * Сброс улитки в начальное положение
     */
    reset() {
        this.row = this.maze.start.row;
        this.col = this.maze.start.col;
        this.path = [];
        this.currentPathIndex = 0;
        this.isMoving = false;
        this.hasFinished = false;
        this.position = 0;
        this.lastMoveTime = 0;
        this.finishTime = 0;
        this.turboBoost = false;
        this.turboBoostTimer = 0;
        this.disoriented = false;
        this.disorientedTime = 0;
        this.stuck = false;
        
        // Сбрасываем отображаемые координаты
        this.displayX = this.col * this.cellSize;
        this.displayY = this.row * this.cellSize;
        
        // Обновляем позицию элемента
        this.updateElementPosition();
        
        // Удаляем все следы
        if (this.element && this.element.parentNode) {
            const trailDrops = this.element.parentNode.querySelectorAll('.trail-drop');
            trailDrops.forEach(drop => drop.remove());
        }
        
        // Сбрасываем стили и классы анимаций
        if (this.element) {
            this.element.classList.remove('turbo-boost', 'stuck', 'disoriented', 'winner');
            this.element.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
            this.element.style.transform = `translate3d(${this.displayX + (this.cellSize - parseFloat(this.element.style.width)) / 2}px, ${this.displayY + (this.cellSize - parseFloat(this.element.style.height)) / 2}px, 0) scale(1)`;
        }
    }
    
    /**
     * Обновление состояния улитки
     */
    update(deltaTime) {
        if (!this.isMoving || this.hasFinished) return;
        
        // Проверяем эффекты и состояния
        this.updateEffects(deltaTime);
        
        // Получаем текущее время
        const currentTime = Date.now();
        const timeElapsed = currentTime - this.lastMoveTime;
        
        // Если прошло достаточно времени для хода
        if (timeElapsed >= this.getMoveInterval()) {
            // Выполняем движение улитки
            this.performMove();
            
            // Обновляем время последнего движения
            this.lastMoveTime = currentTime;
        }
    }
    
    /**
     * Обновление эффектов улитки
     */
    updateEffects(deltaTime) {
        // Обновляем состояние ускорения
        if (this.turboBoost) {
            this.turboBoostTimer -= deltaTime;
            if (this.turboBoostTimer <= 0) {
                this.turboBoost = false;
                // Удаляем класс для CSS анимации
                if (this.element) {
                    this.element.classList.remove('turbo-boost');
                }
            } else {
                // Добавляем класс для CSS анимации
                if (this.element) {
                    this.element.classList.add('turbo-boost');
                }
            }
        }
        
        // Обновляем состояние дезориентации
        if (this.disoriented) {
            this.disorientedTime -= deltaTime;
            if (this.disorientedTime <= 0) {
                this.disoriented = false;
                // Удаляем класс для CSS анимации
                if (this.element) {
                    this.element.classList.remove('disoriented');
                }
            } else {
                // Добавляем класс для CSS анимации
                if (this.element) {
                    this.element.classList.add('disoriented');
                }
            }
        }
        
        // Обновляем состояние застревания
        if (this.stuck) {
            // Добавляем класс для CSS анимации
            if (this.element) {
                this.element.classList.add('stuck');
            }
        } else {
            // Удаляем класс для CSS анимации
            if (this.element) {
                this.element.classList.remove('stuck');
            }
        }
    }
    
    /**
     * Выполнение движения улитки
     */
    performMove() {
        // Если улитка финишировала или застряла, не двигаем её
        if (this.hasFinished || this.stuck) return;
        
        try {
            // Если путь закончился или не установлен, генерируем новый
            if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length - 1) {
                this.generatePath();
                this.currentPathIndex = 0;
                
                if (!this.path || this.path.length < 2) {
                    console.warn(`Не удалось сгенерировать путь для улитки ${this.type}`);
                    return;
                }
            }
            
            // Получаем текущую и следующую точки пути
            const currentPoint = this.path[this.currentPathIndex];
            const nextPoint = this.path[this.currentPathIndex + 1];
            
            // Проверка валидности координат
            if (!this.validateNextPoint(nextPoint)) {
                // Генерируем новый путь при ошибке
                this.generatePath();
                return;
            }
            
            // Определяем направление движения
            this.updateDirection(nextPoint);
            
            // Обновляем позицию
            this.row = nextPoint.row;
            this.col = nextPoint.col;
            
            // Увеличиваем индекс пути
            this.currentPathIndex++;
            
            // Проверяем достижение финиша
            this.checkFinish();
            
            // Проверяем специальные ячейки
            this.checkSpecialCells();
            
        } catch (error) {
            console.error(`Ошибка при движении улитки ${this.type}:`, error);
            // Восстанавливаемся после ошибки
            this.resetPosition();
        }
    }
    
    /**
     * Проверка валидности следующей точки
     */
    validateNextPoint(nextPoint) {
        if (!nextPoint || 
            nextPoint.row < 0 || nextPoint.row >= this.maze.rows ||
            nextPoint.col < 0 || nextPoint.col >= this.maze.cols) {
            console.error(`Невалидные координаты для улитки ${this.type}: [${nextPoint?.row}, ${nextPoint?.col}]`);
            return false;
        }
        return true;
    }
    
    /**
     * Обновление направления улитки
     */
    updateDirection(nextPoint) {
        const prevDirection = this.currentDirection;
        this.currentDirection = this.getDirection(
            { row: this.row, col: this.col },
            nextPoint
        );
        
        // Логируем изменение направления для отладки
        if (prevDirection !== this.currentDirection) {
            console.log(`Улитка ${this.type} изменила направление с ${prevDirection} на ${this.currentDirection}`);
        }
    }
    
    /**
     * Проверка достижения финиша
     */
    checkFinish() {
        if (this.maze.finish && 
            this.row === this.maze.finish.row && 
            this.col === this.maze.finish.col) {
            console.log(`Улитка ${this.type} достигла финиша!`);
            // Отправляем событие о финише улитки
            this.hasFinished = true;
            const event = new CustomEvent('snailFinished', { detail: this });
            document.dispatchEvent(event);
        }
    }
    
    /**
     * Сброс позиции улитки
     */
    resetPosition() {
        if (this.maze && this.maze.start) {
            this.row = this.maze.start.row;
            this.col = this.maze.start.col;
            this.generatePath();
        }
    }
    
    /**
     * Проверка специальных ячеек (ловушки, ускорители)
     */
    checkSpecialCells() {
        try {
            if (!this.maze || !this.maze.getCellType) {
                console.warn(`Не удалось проверить специальные ячейки - метод getCellType не найден в maze`);
                return;
            }
            
            const cellType = this.maze.getCellType(this.row, this.col);
            if (!cellType) return;
            
            // Используем константы из ASSETS
            switch (cellType) {
                case ASSETS.CELL_TYPES.TRAP:
                    // Улитка попала в ловушку
                    this.disoriented = true;
                    this.disorientedTime = 3000; // 3 секунды дезориентации
                    console.log(`${this.name} попал в ловушку!`);
                    break;
                    
                case ASSETS.CELL_TYPES.BOOST:
                    // Улитка получила ускорение
                    this.activateTurboBoost();
                    break;
            }
        } catch (error) {
            console.error(`Ошибка при проверке специальных ячеек для улитки ${this.type}:`, error);
        }
    }
    
    /**
     * Отрисовка улитки на canvas
     * @param {CanvasRenderingContext2D} ctx - контекст для рисования
     */
    draw(ctx) {
        // Если у улитки нет координат, пропускаем отрисовку
        if (this.row === undefined || this.col === undefined) {
            console.error(`Ошибка: улитка типа ${this.type} не имеет корректных координат`);
            return;
        }
        
        // Рассчитываем текущую позицию для плавного движения
        let currentX, currentY;
        
        // Если улитка движется, выполняем интерполяцию
        if (this.isMoving && this.path && this.path.length > 0 && this.currentPathIndex < this.path.length) {
            // Определяем точку назначения
            const targetCell = this.path[this.currentPathIndex];
            
            // Вычисляем целевые координаты в пикселях
            const targetX = targetCell.col * this.cellSize;
            const targetY = targetCell.row * this.cellSize;
            
            // Текущие координаты в пикселях
            const startX = this.col * this.cellSize;
            const startY = this.row * this.cellSize;
            
            // Прогресс движения (от 0 до 1)
            const timeElapsed = Date.now() - this.lastMoveTime;
            const moveInterval = this.getMoveInterval();
            let progress = Math.min(timeElapsed / moveInterval, 1);
            
            // Применяем более плавную функцию для естественного движения
            progress = this.easeInOutQuad(progress);
            
            // Интерполируем между текущим и следующим положением
            currentX = startX + (targetX - startX) * progress;
            currentY = startY + (targetY - startY) * progress;
        } else {
            // Если улитка не в движении, используем её текущие координаты
            currentX = this.col * this.cellSize;
            currentY = this.row * this.cellSize;
        }
        
        // Сохраняем состояние контекста
        ctx.save();
        
        // Определяем размер изображения улитки (немного меньше ячейки)
        const snailSize = this.cellSize * 0.9;
        
        // Перемещаемся к позиции улитки
        ctx.translate(currentX + this.cellSize / 2, currentY + this.cellSize / 2);
        
        // Применяем только отражение для движения влево, без поворотов
        let scaleX = 1;
        if (this.currentDirection === 'left') {
            scaleX = -1;
            ctx.scale(scaleX, 1);
        }
        
        // Определяем, какое изображение улитки использовать на основе типа
        let imagePath;
        switch (this.type) {
            case 'racer':
                imagePath = 'images/red_snail.png';
                break;
            case 'explorer':
                imagePath = 'images/blue_snail.png';
                break;
            case 'snake':
                imagePath = 'images/green_snail.png';
                break;
            case 'stubborn':
                imagePath = 'images/purple_snail.png';
                break;
            case 'deadender':
                imagePath = 'images/yellow_snail.png';
                break;
            default:
                imagePath = 'images/blue_snail.png';
        }
        
        // Получаем изображение из кэша ASSETS или создаем новое
        let snailImage;
        if (ASSETS.snailImages[this.type]) {
            snailImage = ASSETS.snailImages[this.type];
        } else {
            snailImage = new Image();
            snailImage.src = imagePath;
            ASSETS.snailImages[this.type] = snailImage;
        }
        
        // Добавляем тень для эффекта глубины
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Проверяем, загружено ли изображение
        if (snailImage && snailImage.complete) {
            // Отрисовываем изображение улитки
            ctx.drawImage(
                snailImage,
                -snailSize / 2,
                -snailSize / 2,
                snailSize,
                snailSize
            );
        } else {
            // Запасной вариант, если изображение не загружено
            this.drawFallbackSnail(ctx, snailSize);
        }
        
        // Добавляем эффекты в зависимости от состояния
        if (this.turboBoost) {
            this.drawTurboEffect(ctx, snailSize);
        }
        
        if (this.stuck) {
            this.drawStuckEffect(ctx, snailSize);
        }
        
        // Для улитки игрока добавляем индикатор выделения
        if (this.isPlayer) {
            ctx.beginPath();
            ctx.arc(0, 0, snailSize / 2 + 5, 0, Math.PI * 2);
            ctx.strokeStyle = '#FFFF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Восстанавливаем состояние контекста
        ctx.restore();
    }
    
    /**
     * Запасной вариант отрисовки улитки, если изображение не загружено
     */
    drawFallbackSnail(ctx, size) {
        // Рисуем базовую форму улитки
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Добавляем обводку
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Добавляем глаза
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(size / 3, -size / 6, size / 10, 0, Math.PI * 2);
        ctx.arc(size / 3, size / 6, size / 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Зрачки
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(size / 3, -size / 6, size / 20, 0, Math.PI * 2);
        ctx.arc(size / 3, size / 6, size / 20, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * Эффект ускорения для улитки
     */
    drawTurboEffect(ctx, size) {
        ctx.save();
        
        // Настраиваем стиль для эффекта
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        
        // Создаем волны ускорения позади улитки
        for (let i = 1; i <= 3; i++) {
            ctx.globalAlpha = 1 - (i * 0.2); // Постепенное затухание
            ctx.beginPath();
            ctx.moveTo(-size / 2 - i * 8, -size / 3);
            ctx.lineTo(-size / 2 - i * 8, size / 3);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * Эффект застревания для улитки
     */
    drawStuckEffect(ctx, size) {
        ctx.save();
        
        // Рисуем знаки вопроса или восклицательные знаки
        ctx.fillStyle = '#FF0000';
        ctx.font = `bold ${size/2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('!', 0, -size/2 - 10);
        
        ctx.restore();
    }
    
    /**
     * Функция плавного ускорения-замедления (easing)
     * @param {number} t - значение от 0 до 1
     * @returns {number} обработанное значение от 0 до 1
     */
    easeInOutQuad(t) {
        // Более плавная функция с кубическим сглаживанием
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Получение интервала движения для улитки в зависимости от текущих состояний
     * @returns {number} интервал движения в миллисекундах
     */
    getMoveInterval() {
        // Базовая скорость движения
        let interval = 1000 / this.speed;
        
        // Модификаторы скорости в зависимости от состояния
        if (this.turboBoost) {
            interval /= this.boostMultiplier || 1.3; // Ускорение
        }
        
        if (this.disoriented) {
            interval *= 2; // Замедление при дезориентации
        }
        
        // Для разных типов улиток могут быть специальные модификаторы
        switch(this.type) {
            case 'racer':
                interval *= 0.85; // Гонщик всегда немного быстрее
                break;
            case 'stubborn':
                if (this.path.length > 0 && this.currentPathIndex > 0) {
                    // Упрямая улитка ускоряется при движении вперед
                    interval *= 0.9;
                }
                break;
            case 'snake':
                // Змеиная улитка быстрее выходит из тупиков
                if (this.stuck) {
                    interval *= 0.8;
                }
                break;
        }
        
        // Минимальный и максимальный пределы интервала
        interval = Math.max(interval, 100);  // Не быстрее 100мс
        interval = Math.min(interval, 2000); // Не медленнее 2000мс
        
        return interval;
    }
}

/**
 * Класс для управления всеми улитками
 */
class SnailManager {
    constructor(playerSnailType, maze) {
        this.maze = maze;
        this.snails = [];
        this.finishedSnails = [];
        this.playerSnail = null;
        this.isRaceActive = false;
        
        // Создаем улиток сразу при инициализации
        this.createSnails(playerSnailType);
    }
    
    /**
     * Создание улиток для гонки
     */
    createSnails(playerSnailType) {
        this.snails = [];
        this.finishedSnails = [];
        
        // Получаем все типы улиток
        const snailTypes = Object.keys(ASSETS.SNAIL_TYPES).map(key => 
            ASSETS.SNAIL_TYPES[key].TYPE.toLowerCase()
        );
        
        // Создаем улитку игрока
        this.playerSnail = new Snail(
            playerSnailType,
            this.maze.start.row,
            this.maze.start.col,
            this.maze
        );
        this.playerSnail.isPlayer = true; // Отмечаем, что это улитка игрока
        this.snails.push(this.playerSnail);
        
        // Создаем компьютерных соперников
        const remainingTypes = snailTypes.filter(type => type !== playerSnailType);
        const computerSnailsCount = Math.min(remainingTypes.length, ASSETS.GAME.SNAIL_COUNT - 1);
        
        for (let i = 0; i < computerSnailsCount; i++) {
            const snail = new Snail(
                remainingTypes[i],
                this.maze.start.row,
                this.maze.start.col,
                this.maze
            );
            this.snails.push(snail);
        }
        
        console.log(`Создано ${this.snails.length} улиток. Тип улитки игрока: ${playerSnailType}`);
        return this;
    }
    
    /**
     * Старт гонки
     */
    startRace() {
        this.isRaceActive = true;
        this.finishedSnails = [];
        
        // Запускаем все улитки
        for (const snail of this.snails) {
            snail.reset(); // Сбрасываем улитку в начальное положение
            snail.start(); // Запускаем движение
        }
        
        // Устанавливаем обработчик для финиша улиток
        document.addEventListener('snailFinished', this.handleSnailFinish.bind(this));
        
        console.log('Гонка началась!');
    }
    
    /**
     * Обработчик события финиша улитки
     */
    handleSnailFinish(event) {
        const snail = event.detail;
        
        // Если улитка уже финишировала, игнорируем
        if (this.finishedSnails.includes(snail)) return;
        
        // Определяем позицию финиша
        const position = this.finishedSnails.length + 1;
        
        // Финишируем улитку
        snail.finish(position);
        
        // Добавляем в список финишировавших
        this.finishedSnails.push(snail);
        
        // Проверяем, закончена ли гонка
        this.checkRaceFinished();
    }
    
    /**
     * Проверка завершения гонки
     */
    checkRaceFinished() {
        // Гонка считается завершенной, когда все улитки финишировали
        // или когда финишировала хотя бы одна улитка и прошло определенное время
        if (this.finishedSnails.length === this.snails.length) {
            this.endRace();
        }
    }
    
    /**
     * Завершение гонки
     */
    endRace() {
        this.isRaceActive = false;
        
        // Останавливаем все улитки
        for (const snail of this.snails) {
            snail.stop();
        }
        
        // Удаляем обработчик финиша
        document.removeEventListener('snailFinished', this.handleSnailFinish);
        
        // Объявляем о завершении гонки
        const event = new CustomEvent('raceFinished', { 
            detail: { 
                finishedSnails: this.finishedSnails,
                allSnails: this.snails,
                playerSnail: this.playerSnail
            } 
        });
        document.dispatchEvent(event);
        
        console.log('Гонка завершена!');
    }
    
    /**
     * Принудительное завершение гонки (по таймауту)
     */
    forceEndRace() {
        // Определяем улиток, которые еще не финишировали
        const unfinishedSnails = this.snails.filter(snail => !this.finishedSnails.includes(snail));
        
        // Принудительно финишируем их
        for (const snail of unfinishedSnails) {
            const position = this.finishedSnails.length + 1;
            snail.finish(position);
            this.finishedSnails.push(snail);
        }
        
        this.endRace();
    }
    
    /**
     * Обновление всех улиток
     */
    update(deltaTime) {
        if (!this.isRaceActive) return;
        
        for (const snail of this.snails) {
            snail.update(deltaTime);
        }
    }
    
    /**
     * Отрисовка всех улиток на холсте
     */
    draw(ctx) {
        if (!this.snails || this.snails.length === 0) {
            console.warn("Нет улиток для отрисовки");
            return;
        }
        
        for (const snail of this.snails) {
            if (snail.row !== undefined && snail.col !== undefined) {
                snail.draw(ctx);
            }
        }
    }
    
    /**
     * Возвращает список финишировавших улиток
     */
    getFinishedSnails() {
        return this.finishedSnails;
    }
} 