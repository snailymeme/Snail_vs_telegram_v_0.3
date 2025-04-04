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
        // Базовые параметры для всех типов
        this.wrongPathProbability = 0.7; // Увеличиваем шанс пойти по неправильному пути
        this.disoriented = false;
        this.disorientedTime = 0;
        this.stuck = false;
        this.turboBoost = false;
        this.turboBoostTimer = 0;
        
        // Специфичные параметры по типу
        switch (this.type) {
            case 'racer':
                this.boostProbability = ASSETS.SNAIL_TYPES.RACER.BOOST_PROBABILITY || 0.2;
                this.boostMultiplier = ASSETS.SNAIL_TYPES.RACER.BOOST_MULTIPLIER || 1.3;
                this.wrongPathProbability = 0.5; // Даже быстрая улитка будет ошибаться
                break;
                
            case 'explorer':
                this.explorationRate = ASSETS.SNAIL_TYPES.EXPLORER.EXPLORATION_RATE || 0.85; // Больше исследует
                this.wrongPathProbability = 0.75; // Сильнее исследует окружение
                break;
                
            case 'snake':
                this.zigzagProbability = ASSETS.SNAIL_TYPES.SNAKE.ZIGZAG_PROBABILITY || 0.9; // Больше зигзагов
                this.escapeDeadEndSpeed = 1.3; // Быстрее выходит из тупиков
                break;
                
            case 'stubborn':
                this.forwardProbability = ASSETS.SNAIL_TYPES.STUBBORN.FORWARD_PROBABILITY || 0.9; // Ещё упрямее
                this.accelerationBoost = 1.1; // Небольшое ускорение при движении вперед
                break;
                
            case 'deadender':
                this.randomTurnProbability = ASSETS.SNAIL_TYPES.DEADENDER.RANDOM_TURN_PROBABILITY || 0.8; // Больше случайных поворотов
                this.pauseInDeadEndTime = 1500; // Дольше думает в тупике (мс)
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
        
        // Добавляем плавное перемещение и стили для улучшения внешнего вида
        this.element.style.transition = 'left 0.3s linear, top 0.3s linear, transform 0.2s ease';
        this.element.style.position = 'absolute';
        this.element.style.borderRadius = '50%';
        this.element.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))';
        this.element.style.willChange = 'transform, left, top';
        
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
        
        // Устанавливаем позицию
        this.updateElementPosition();
        
        // Добавляем элемент в контейнер
        container.appendChild(this.element);
    }
    
    /**
     * Обновление позиции элемента улитки
     */
    updateElementPosition() {
        if (!this.element) return;
        
        const x = this.col * this.cellSize;
        const y = this.row * this.cellSize;
        
        // Центрирование улитки в ячейке
        const offset = (this.cellSize - parseFloat(this.element.style.width)) / 2;
        
        // Применяем позицию через трансформацию для большей плавности
        this.element.style.left = `${x + offset}px`;
        this.element.style.top = `${y + offset}px`;
        
        // Обновляем поворот и отражение в зависимости от направления
        let rotation = 0;
        let scaleX = 1; // По умолчанию без отражения
        let scaleY = 1; // По умолчанию без отражения по вертикали
        
        switch (this.currentDirection) {
            case 'up': 
                rotation = -90; 
                break;
            case 'right': 
                rotation = 0; 
                scaleX = 1; // Нормальное отображение
                break;
            case 'down': 
                rotation = 90; 
                break;
            case 'left': 
                rotation = 0; // Не поворачиваем
                scaleX = -1; // Отражаем по горизонтали
                break;
        }
        
        // Получаем потомка-изображение
        const snailImage = this.element.querySelector('img');
        if (snailImage) {
            // Для более естественного вида улитки, сначала сбрасываем все трансформации
            snailImage.style.transform = '';
            
            // Меняем положение изображения внутри контейнера для более плавного эффекта
            if (this.currentDirection === 'left') {
                // При движении влево отражаем только изображение
                snailImage.style.transform = 'scaleX(-1)';
                // К самому контейнеру применяем только поворот
                this.element.style.transform = `rotate(${rotation}deg)`;
            } else {
                // Для остальных направлений применяем трансформацию к контейнеру
                this.element.style.transform = `rotate(${rotation}deg)`;
            }
        } else {
            // Запасной вариант, если img не найден (старый метод)
            this.element.style.transform = `rotate(${rotation}deg) scaleX(${scaleX})`;
        }
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
        
        // Обновляем позицию элемента
        this.updateElementPosition();
    }
    
    /**
     * Обновление состояния улитки
     */
    update(deltaTime) {
        if (!this.isMoving || this.hasFinished) return;
        
        // Проверяем, прошло ли достаточно времени для хода
        const currentTime = Date.now();
        const timeElapsed = currentTime - this.lastMoveTime;
        
        if (timeElapsed >= this.getMoveInterval()) {
            // Двигаем улитку
            this.move();
            
            // Обновляем время последнего хода
            this.lastMoveTime = currentTime;
        }
    }
    
    /**
     * Выполнение одного шага движения
     */
    move() {
        // Если улитка финишировала, не двигаем её
        if (this.hasFinished) return;
        
        // Если улитка застряла, ничего не делаем
        if (this.stuck) return;
        
        try {
            // Если путь закончился или не установлен, генерируем новый
            if (!this.path || this.path.length === 0 || this.currentPathIndex >= this.path.length - 1) {
                this.generatePath();
                if (!this.path || this.path.length < 2) {
                    console.warn(`Не удалось сгенерировать путь для улитки ${this.type}`);
                    return;
                }
                this.currentPathIndex = 0;
            }
            
            // Получаем текущую и следующую точки пути
            const currentPoint = this.path[this.currentPathIndex];
            const nextPoint = this.path[this.currentPathIndex + 1];
            
            // Проверка валидности координат следующей точки
            if (!nextPoint || 
                nextPoint.row < 0 || nextPoint.row >= this.maze.rows ||
                nextPoint.col < 0 || nextPoint.col >= this.maze.cols) {
                console.error(`Невалидные координаты для улитки ${this.type}: [${nextPoint?.row}, ${nextPoint?.col}]`);
                // Генерируем новый путь при обнаружении ошибки
                this.generatePath();
                return;
            }
            
            // Определяем направление движения
            const prevDirection = this.currentDirection;
            this.currentDirection = this.getDirection(
                { row: this.row, col: this.col },
                nextPoint
            );
            
            // Логируем изменение направления для отладки
            if (prevDirection !== this.currentDirection) {
                console.log(`Улитка ${this.type} изменила направление с ${prevDirection} на ${this.currentDirection}`);
            }
            
            // Обновляем позицию
            this.row = nextPoint.row;
            this.col = nextPoint.col;
            
            // Отладочная информация о движении
            console.log(`Улитка ${this.type} переместилась на [${this.row}, ${this.col}], направление: ${this.currentDirection}`);
            
            // Увеличиваем индекс пути
            this.currentPathIndex++;
            
            // Проверяем, достигли ли финиша
            if (this.maze.finish && 
                this.row === this.maze.finish.row && 
                this.col === this.maze.finish.col) {
                console.log(`Улитка ${this.type} достигла финиша!`);
                // Отправляем событие о финише улитки
                const event = new CustomEvent('snailFinished', { detail: this });
                document.dispatchEvent(event);
            }
            
            // Проверяем специальные ячейки (ловушки, ускорители)
            this.checkSpecialCells();
        } catch (error) {
            console.error(`Ошибка при движении улитки ${this.type}:`, error);
            // Восстанавливаем улитку после ошибки
            if (this.maze && this.maze.start) {
                this.row = this.maze.start.row;
                this.col = this.maze.start.col;
                this.generatePath();
            }
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
        // Проверяем, есть ли у улитки координаты
        if (this.row === undefined || this.col === undefined) {
            console.error(`Ошибка: улитка типа ${this.type} не имеет корректных координат`);
            return;
        }
        
        // Получаем координаты центра ячейки
        const x = this.col * this.cellSize;
        const y = this.row * this.cellSize;
        
        // Размер улитки - увеличим для лучшей видимости
        const snailSize = this.cellSize * 0.9;
        
        // Сохраняем состояние контекста
        ctx.save();
        
        // Перемещаем в центр ячейки
        ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2);
        
        // Применяем поворот в зависимости от направления
        let rotation = 0;
        switch (this.currentDirection) {
            case 'up': rotation = -Math.PI / 2; break;
            case 'right': rotation = 0; break;
            case 'down': rotation = Math.PI / 2; break;
            case 'left': rotation = Math.PI; break;
        }
        ctx.rotate(rotation);
        
        // Добавляем тень для улучшения видимости на любом фоне
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Отрисовываем улитку с яркими цветами для лучшей видимости
        // Для игрока используем яркий цвет, для остальных - их собственные цвета
        const color = this.isPlayer ? '#FF00FF' : this.color;
        
        // 1. Рисуем корпус улитки (увеличенный)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, snailSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 2. Добавляем обводку для лучшей видимости
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 3. Рисуем панцирь (узор спирали)
        const spiralColor = this.isPlayer ? '#FFFFFF' : '#EEEEEE';
        ctx.strokeStyle = spiralColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const radius = (snailSize / 2) * (0.8 - i * 0.2);
            ctx.arc(0, 0, radius, 0, Math.PI * 1.5);
        }
        ctx.stroke();
        
        // 4. Рисуем глаза (более заметные)
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 0; // Убираем тень для глаз
        ctx.beginPath();
        ctx.arc(snailSize / 3, -snailSize / 6, snailSize / 8, 0, Math.PI * 2);
        ctx.arc(snailSize / 3, snailSize / 6, snailSize / 8, 0, Math.PI * 2);
        ctx.fill();
        
        // 5. Зрачки (более контрастные)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(snailSize / 3, -snailSize / 6, snailSize / 16, 0, Math.PI * 2);
        ctx.arc(snailSize / 3, snailSize / 6, snailSize / 16, 0, Math.PI * 2);
        ctx.fill();
        
        // 6. Добавляем антенны
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Левая антенна
        ctx.moveTo(snailSize / 3, -snailSize / 6);
        ctx.lineTo(snailSize / 2, -snailSize / 3);
        // Правая антенна
        ctx.moveTo(snailSize / 3, snailSize / 6);
        ctx.lineTo(snailSize / 2, snailSize / 3);
        ctx.stroke();
        
        // Маленькие шарики на концах антенн
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(snailSize / 2, -snailSize / 3, snailSize / 16, 0, Math.PI * 2);
        ctx.arc(snailSize / 2, snailSize / 3, snailSize / 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Добавляем эффекты в зависимости от состояния улитки
        if (this.stuck) {
            // Эффект застревания - добавляем восклицательные знаки
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.font = `bold ${snailSize/3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('!', -snailSize/3, -snailSize/3);
        } else if (this.turboBoost) {
            // Эффект ускорения - добавляем полоски сзади
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            
            // Волны ускорения позади улитки
            for (let i = 1; i <= 3; i++) {
                ctx.beginPath();
                ctx.moveTo(-snailSize / 2 - i * 6, -snailSize / 4);
                ctx.lineTo(-snailSize / 2 - i * 6, snailSize / 4);
                ctx.stroke();
            }
        }
        
        // Для улитки игрока добавляем индикатор
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
        
        console.log(`Отрисована улитка ${this.type} на позиции [${this.row}, ${this.col}], направление: ${this.currentDirection}`);
    }
    
    /**
     * Запуск движения улитки
     */
    startMoving() {
        this.isMoving = true;
        this.lastMoveTime = Date.now();
    }
    
    /**
     * Остановка движения улитки
     */
    stopMoving() {
        this.isMoving = false;
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