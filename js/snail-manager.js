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