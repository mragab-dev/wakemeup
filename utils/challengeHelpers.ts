
export interface MathProblem {
    question: string;
    answer: number;
}

export const generateMathProblems = (difficulty: number, count: number): MathProblem[] => {
    const problems: MathProblem[] = [];

    for (let i = 0; i < count; i++) {
        let question: string;
        let answer: number;

        let num1, num2, num3;

        switch (difficulty) {
            case 1: // Easy: Simple addition/subtraction
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                if (Math.random() > 0.5) {
                    question = `${num1} + ${num2} = ?`;
                    answer = num1 + num2;
                } else {
                    question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ?`;
                    answer = Math.max(num1, num2) - Math.min(num1, num2);
                }
                break;
            case 2: // Medium: Addition/subtraction with larger numbers
                num1 = Math.floor(Math.random() * 80) + 20;
                num2 = Math.floor(Math.random() * 80) + 20;
                if (Math.random() > 0.5) {
                    question = `${num1} + ${num2} = ?`;
                    answer = num1 + num2;
                } else {
                    question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)} = ?`;
                    answer = Math.max(num1, num2) - Math.min(num1, num2);
                }
                break;
            case 3: // Hard: Simple multiplication
                num1 = Math.floor(Math.random() * 12) + 2;
                num2 = Math.floor(Math.random() * 12) + 2;
                question = `${num1} × ${num2} = ?`;
                answer = num1 * num2;
                break;
            case 4: // Very Hard: Two-step problems with parentheses
                num1 = Math.floor(Math.random() * 10) + 1;
                num2 = Math.floor(Math.random() * 10) + 1;
                num3 = Math.floor(Math.random() * 5) + 2;
                if (Math.random() > 0.5) {
                    question = `(${num1} + ${num2}) × ${num3} = ?`;
                    answer = (num1 + num2) * num3;
                } else {
                    question = `${num1} + (${num2} × ${num3}) = ?`;
                    answer = num1 + (num2 * num3);
                }
                break;
            case 5: // Extreme: Multi-step with larger numbers and division
                num1 = Math.floor(Math.random() * 10) + 2;
                num2 = Math.floor(Math.random() * 10) + 2;
                num3 = num1 * num2; // ensure whole number division
                const num4 = Math.floor(Math.random() * 20) + 5;
                if (Math.random() > 0.5) {
                    question = `(${num3} ÷ ${num1}) + ${num4} = ?`;
                    answer = (num3 / num1) + num4;
                } else {
                    question = `(${num4} × ${num1}) - ${num2} = ?`;
                    answer = (num4 * num1) - num2;
                }
                break;
            default:
                // Fallback to level 1
                num1 = Math.floor(Math.random() * 20) + 1;
                num2 = Math.floor(Math.random() * 20) + 1;
                question = `${num1} + ${num2} = ?`;
                answer = num1 + num2;
        }
        problems.push({ question, answer });
    }

    return problems;
};

export interface WordPuzzle {
    question: string;
    answer: string;
    scrambled: string;
    hint?: string;
}

const WORD_LIST_EN = [
    'ALARM', 'CLOCK', 'WAKEUP', 'MORNING', 'COFFEE', 'SUNRISE', 'EARLY',
    'DREAM', 'SLEEP', 'BEDTIME', 'SNOOZE', 'CHALLENGE', 'PUZZLE', 'MATH',
    'HEALTH', 'PILLS', 'MEDS', 'REMINDER', 'HABIT', 'ROUTINE',
    'ENERGY', 'FRESH', 'ACTIVE', 'POWER', 'FOCUS', 'ALERT', 'AWAKEN',
    'RISE', 'SHINE', 'BRIGHT', 'DAWN', 'MORNING', 'BREAKFAST', 'SHOWER',
    'WORKOUT', 'EXERCISE', 'MEDITATION', 'POSITIVE', 'MOTIVATION', 'SUCCESS',
    'PRODUCTIVE', 'MINDFUL', 'GRATEFUL', 'HAPPY', 'FRESH', 'CLEAR'
];

const WORD_LIST_AR = [
    'منبه', 'ساعة', 'استيقاظ', 'صباح', 'قهوة', 'شروق', 'مبكر',
    'حلم', 'نوم', 'غفوة', 'تحدي', 'لغز', 'رياضيات',
    'صحة', 'دواء', 'علاج', 'تذكير', 'عادة', 'روتين',
    'نشاط', 'طاقة', 'انتعاش', 'تركيز', 'يقظة', 'نهوض', 'إشراق',
    'فجر', 'صباحي', 'فطور', 'استحمام', 'رياضة', 'تمارين',
    'تأمل', 'إيجابية', 'تحفيز', 'نجاح', 'إنتاجية', 'وعي',
    'امتنان', 'سعادة', 'انتعاش', 'وضوح', 'حماس', 'انطلاق',
    'أمل', 'حيوية', 'تفاؤل', 'ابدأ', 'يوم', 'عمل', 'نشاط'
];

const WORD_LIST_DE = [
    'ALARM', 'UHR', 'AUFWACHEN', 'MORGEN', 'KAFFEE', 'SONNE', 'FRUEH',
    'TRAUM', 'SCHLAF', 'BETTZEIT', 'SCHLUMMERN', 'RÄTSEL', 'MATHE',
    'GESUND', 'PILLEN', 'MEDIZIN', 'ERINNERUNG', 'GEWOHNHEIT', 'ROUTINE',
    'ENERGIE', 'FRISCH', 'AKTIV', 'KRAFT', 'FOKUS', 'WACH', 'ERWACHEN',
    'AUFSTEHEN', 'SCHEINEN', 'HELL', 'MORGENGRAUEN', 'FRÜHSTÜCK', 'DUSCHE',
    'SPORT', 'ÜBUNG', 'MEDITATION', 'POSITIV', 'MOTIVATION', 'ERFOLG',
    'PRODUKTIV', 'BEWUSST', 'DANKBAR', 'GLÜCKLICH', 'KLARHEIT', 'SCHWUNG'
];

const WORD_LIST_ES = [
    'ALARMA', 'RELOJ', 'DESPERTAR', 'MANANA', 'CAFE', 'AMANECER', 'TEMPRANO',
    'SUENO', 'DORMIR', 'SIESTA', 'RETO', 'PUZZLE', 'MATE',
    'SALUD', 'PASTILLAS', 'MEDICINAS', 'RECORDATORIO', 'HABITO', 'RUTINA',
    'ENERGÍA', 'FRESCO', 'ACTIVO', 'PODER', 'ENFOQUE', 'ALERTA', 'DESPERTAR',
    'LEVANTAR', 'BRILLAR', 'CLARO', 'ALBA', 'DESAYUNO', 'DUCHA',
    'EJERCICIO', 'ENTRENO', 'MEDITACIÓN', 'POSITIVO', 'MOTIVACIÓN', 'ÉXITO',
    'PRODUCTIVO', 'CONSCIENTE', 'AGRADECIDO', 'FELIZ', 'CLARIDAD', 'IMPULSO'
];

const WORD_LIST_RU = [
    'БУДИЛЬНИК', 'ЧАСЫ', 'РАССВЕТ', 'УТРО', 'КОФЕ', 'ПРОСЫПАЙСЯ', 'РАНО',
    'СОН', 'СПАТЬ', 'ПОРА', 'ДРЕМОТА', 'ВЫЗОВ', 'ЗАГАДКА', 'МАТЕМАТИКА',
    'ЗДОРОВЬЕ', 'ТАБЛЕТКИ', 'ЛЕКАРСТВО', 'НАПОМИНАНИЕ', 'ПРИВЫЧКА', 'РУТИНА',
    'ЭНЕРГИЯ', 'СВЕЖЕСТЬ', 'АКТИВНЫЙ', 'СИЛА', 'ФОКУС', 'БОДРЫЙ', 'ПРОБУЖДЕНИЕ',
    'ВСТАВАТЬ', 'СИЯТЬ', 'ЯРКИЙ', 'ЗАРЯ', 'ЗАВТРАК', 'ДУШ',
    'ЗАРЯДКА', 'ТРЕНИРОВКА', 'МЕДИТАЦИЯ', 'ПОЗИТИВ', 'МОТИВАЦИЯ', 'УСПЕХ',
    'ПРОДУКТИВНОСТЬ', 'ОСОЗНАННОСТЬ', 'БЛАГОДАРНОСТЬ', 'СЧАСТЬЕ', 'ЯСНОСТЬ', 'ПОДЪЁМ'
];


export const generateWordPuzzles = (difficulty: number, count: number, language: string = 'en'): WordPuzzle[] => {
    const puzzles: WordPuzzle[] = [];

    // Choose list based on language
    let currentList = WORD_LIST_EN;
    if (language === 'ar') currentList = WORD_LIST_AR;
    else if (language === 'de') currentList = WORD_LIST_DE;
    else if (language === 'es') currentList = WORD_LIST_ES;
    else if (language === 'ru') currentList = WORD_LIST_RU;

    // Filter words by length based on difficulty
    let filteredWords = currentList;
    if (difficulty === 1) filteredWords = currentList.filter(w => w.length <= 5);
    else if (difficulty === 2) filteredWords = currentList.filter(w => w.length > 5 && w.length <= 8);
    else if (difficulty >= 3) filteredWords = currentList.filter(w => w.length > 8);

    if (filteredWords.length === 0) filteredWords = currentList;

    for (let i = 0; i < count; i++) {
        const word = filteredWords[Math.floor(Math.random() * filteredWords.length)];
        // Shuffle the word correctly handling unicode
        let scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
        // Ensure scrambled is not the same as the word
        while (scrambled === word && word.length > 1) {
            scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
        }
        puzzles.push({
            question: scrambled,
            answer: word,
            scrambled: scrambled
        });
    }
    return puzzles;
};
