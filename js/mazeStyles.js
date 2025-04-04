/**
 * Модуль стилей лабиринта
 * Содержит визуальные стили для разных тематик лабиринта
 */
const MAZE_STYLES = {
    // Коллекция стилей
    styles: [
        {
            name: "Неоновый Киберлабиринт",
            path: {
                name: "NeonBluePath",
                color: "#00FFFF",
                effect: "glow"
            },
            wall: {
                name: "NeonPinkWall",
                color: "#FF69B4",
                effect: "glow"
            },
            entity: {
                name: "PlayerDot",
                color: "#FFFFFF",
                effect: "pulse"
            }
        },
        {
            name: "Голографическая Сетка",
            path: {
                name: "HoloFloor",
                color: "#C0C0C0",
                effect: "flicker"
            },
            wall: {
                name: "HoloWall",
                color: "#00B7EB",
                effect: "transparency"
            },
            entity: {
                name: "HoloEntity",
                color: "#FF00FF",
                effect: "float"
            }
        },
        {
            name: "Инопланетные Джунгли",
            path: {
                name: "BiolumPath",
                color: "#00FF00",
                effect: "glow"
            },
            wall: {
                name: "VineWall",
                color: "#800080",
                effect: "texture"
            },
            entity: {
                name: "AlienDot",
                color: "#FF4500",
                effect: "blink"
            }
        },
        {
            name: "Квантовая Схема",
            path: {
                name: "CircuitPath",
                color: "#FFFF00",
                effect: "electric"
            },
            wall: {
                name: "CircuitWall",
                color: "#000000",
                effect: "pattern"
            },
            entity: {
                name: "QuantumDot",
                color: "#00FF00",
                effect: "pulse"
            }
        },
        {
            name: "Кристальная Пещера",
            path: {
                name: "CrystalPath",
                color: "#00CED1",
                effect: "sparkle"
            },
            wall: {
                name: "RockWall",
                color: "#2F4F4F",
                effect: "texture"
            },
            entity: {
                name: "GemEntity",
                color: "#FF1493",
                effect: "glow"
            }
        },
        {
            name: "Космическая Станция",
            path: {
                name: "MetalPath",
                color: "#C0C0C0",
                effect: "metallic"
            },
            wall: {
                name: "RedBarrier",
                color: "#FF0000",
                effect: "glow"
            },
            entity: {
                name: "AstroDot",
                color: "#00FFFF",
                effect: "orbit"
            }
        },
        {
            name: "Подводный Риф",
            path: {
                name: "CoralPath",
                color: "#40E0D0",
                effect: "waves"
            },
            wall: {
                name: "WaterWall",
                color: "#000080",
                effect: "bubbles"
            },
            entity: {
                name: "FishDot",
                color: "#FF4500",
                effect: "swim"
            }
        },
        {
            name: "Туманная Галактика",
            path: {
                name: "NebulaPath",
                color: "#800080",
                effect: "vortex"
            },
            wall: {
                name: "StarryWall",
                color: "#000000",
                effect: "stars"
            },
            entity: {
                name: "StarshipDot",
                color: "#FFFF00",
                effect: "flicker"
            }
        }
    ],

    // Получить случайный стиль
    getRandomStyle: function() {
        const styleIndex = Math.floor(Math.random() * this.styles.length);
        return this.styles[styleIndex];
    },
    
    // Применить эффект к контексту Canvas
    applyEffect: function(ctx, effectType, x, y, width, height, effectTime) {
        effectTime = effectTime || (Date.now() / 1000);
        
        switch(effectType) {
            case 'glow':
                ctx.shadowColor = '#FFFFFF';
                ctx.shadowBlur = 10;
                break;
                
            case 'pulse':
                const pulseScale = 1 + Math.sin(effectTime * 4) * 0.2;
                const newWidth = width * pulseScale;
                const newHeight = height * pulseScale;
                const offsetX = (width - newWidth) / 2;
                const offsetY = (height - newHeight) / 2;
                ctx.translate(x + offsetX, y + offsetY);
                ctx.scale(pulseScale, pulseScale);
                ctx.translate(-x, -y);
                break;
                
            case 'flicker':
                ctx.globalAlpha = 0.7 + Math.sin(effectTime * 10) * 0.3;
                break;
                
            case 'transparency':
                ctx.globalAlpha = 0.7;
                break;
                
            case 'float':
                ctx.translate(0, Math.sin(effectTime * 3) * 3);
                break;
                
            case 'blink':
                ctx.globalAlpha = (Math.sin(effectTime * 5) > 0) ? 1 : 0.3;
                break;
                
            case 'orbit':
                // Эффект орбиты будет обрабатываться отдельно
                break;
                
            case 'vortex':
                ctx.translate(x + width/2, y + height/2);
                ctx.rotate(effectTime);
                ctx.translate(-(x + width/2), -(y + height/2));
                break;
                
            case 'sparkle':
                // Эффект искр будет обрабатываться отдельно
                break;
                
            case 'pattern':
                // Эффект узора будет обрабатываться отдельно
                break;
                
            case 'stars':
                // Эффект звезд будет обрабатываться отдельно
                break;
                
            case 'texture':
                // Эффект текстуры будет обрабатываться отдельно
                break;
                
            case 'electric':
                // Эффект электричества будет обрабатываться отдельно
                break;
                
            case 'waves':
                // Эффект волн будет обрабатываться отдельно
                break;
                
            case 'bubbles':
                // Эффект пузырьков будет обрабатываться отдельно
                break;
                
            case 'swim':
                ctx.translate(Math.sin(effectTime * 3) * 2, Math.cos(effectTime * 2) * 2);
                break;
                
            // Для других эффектов доп. обработка не требуется
            default:
                break;
        }
    },
    
    // Отрисовка дополнительных эффектов
    drawExtraEffects: function(ctx, effectType, x, y, width, height, effectTime) {
        effectTime = effectTime || (Date.now() / 1000);
        
        switch(effectType) {
            case 'orbit':
                // Добавляем маленький сателлит
                const orbitX = x + width/2 + Math.cos(effectTime * 3) * (width/2);
                const orbitY = y + height/2 + Math.sin(effectTime * 3) * (height/2);
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(orbitX, orbitY, 2, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'sparkle':
                // Добавляем искры
                if (Math.random() > 0.95) {
                    const sparkleX = x + Math.random() * width;
                    const sparkleY = y + Math.random() * height;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'pattern':
                // Добавляем узор схемы
                ctx.strokeStyle = '#00FF00';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + 5);
                ctx.lineTo(x + 15, y + 5);
                ctx.lineTo(x + 15, y + 15);
                ctx.lineTo(x + 25, y + 15);
                ctx.lineTo(x + 25, y + 25);
                ctx.stroke();
                break;
                
            case 'stars':
                // Добавляем звезды
                ctx.fillStyle = '#FFFFFF';
                for (let i = 0; i < 5; i++) {
                    const starX = x + Math.random() * width;
                    const starY = y + Math.random() * height;
                    const starSize = Math.random() * 2 + 1;
                    ctx.beginPath();
                    ctx.arc(starX, starY, starSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'texture':
                // Добавляем текстуру
                ctx.strokeStyle = '#FFFFFF22';
                ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    const lineX = x + Math.random() * width;
                    const lineY = y + Math.random() * height;
                    ctx.beginPath();
                    ctx.moveTo(lineX, y);
                    ctx.lineTo(lineX, y + height);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(x, lineY);
                    ctx.lineTo(x + width, lineY);
                    ctx.stroke();
                }
                break;
                
            case 'electric':
                // Добавляем эффект схемы
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 5, y + height/2);
                ctx.lineTo(x + width - 5, y + height/2);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + width/2, y + 5);
                ctx.lineTo(x + width/2, y + height - 5);
                ctx.stroke();
                break;
                
            case 'waves':
                // Добавляем волны
                ctx.strokeStyle = '#FFFFFF33';
                ctx.lineWidth = 1;
                for (let i = 0; i < height; i += 4) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + i);
                    ctx.lineTo(x + width, y + i);
                    ctx.stroke();
                }
                break;
                
            case 'bubbles':
                // Добавляем пузырьки
                if (Math.random() > 0.9) {
                    const bubbleX = x + Math.random() * width;
                    const bubbleY = y + Math.random() * height;
                    const bubbleSize = Math.random() * 3 + 1;
                    ctx.fillStyle = '#FFFFFF33';
                    ctx.beginPath();
                    ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
}; 