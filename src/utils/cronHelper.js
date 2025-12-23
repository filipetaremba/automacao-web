/**
 * Exemplos de expressões cron comuns
 */
const CRON_PRESETS = {
    'every-minute': '* * * * *',           // A cada minuto (teste)
    'every-5-minutes': '*/5 * * * *',      // A cada 5 minutos (teste)
    'every-hour': '0 * * * *',             // A cada hora
    'daily-9am': '0 9 * * *',              // Todo dia às 9h
    'daily-12pm': '0 12 * * *',            // Todo dia ao meio-dia
    'daily-6pm': '0 18 * * *',             // Todo dia às 18h
    'daily-9pm': '0 21 * * *',             // Todo dia às 21h
    'weekdays-9am': '0 9 * * 1-5',         // Dias úteis às 9h
    'monday-9am': '0 9 * * 1',             // Segundas às 9h
    'monday-wednesday-friday': '0 9 * * 1,3,5', // Seg, Qua, Sex às 9h
    'first-day-month': '0 9 1 * *',        // Primeiro dia do mês
    'every-sunday': '0 9 * * 0',           // Todo domingo às 9h
};

/**
 * Retorna preset de cron
 */
function getPreset(presetName) {
    return CRON_PRESETS[presetName] || null;
}

/**
 * Lista todos os presets disponíveis
 */
function getAllPresets() {
    return CRON_PRESETS;
}

/**
 * Converte expressão cron em descrição legível
 */
function describeCron(cronExpression) {
    const descriptions = {
        '* * * * *': 'A cada minuto',
        '*/5 * * * *': 'A cada 5 minutos',
        '0 * * * *': 'A cada hora',
        '0 9 * * *': 'Todo dia às 9h',
        '0 12 * * *': 'Todo dia ao meio-dia',
        '0 18 * * *': 'Todo dia às 18h',
        '0 21 * * *': 'Todo dia às 21h',
        '0 9 * * 1-5': 'Dias úteis (Seg-Sex) às 9h',
        '0 9 * * 1': 'Toda segunda-feira às 9h',
        '0 9 * * 1,3,5': 'Segunda, Quarta e Sexta às 9h',
        '0 9 1 * *': 'Primeiro dia de cada mês às 9h',
        '0 9 * * 0': 'Todo domingo às 9h',
    };

    return descriptions[cronExpression] || 'Agendamento personalizado';
}

/**
 * Valida formato de hora (HH:MM)
 */
function validateTimeFormat(time) {
    const regex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(time);
}

/**
 * Cria expressão cron para envio diário em horário específico
 */
function createDailyCron(hour, minute = 0) {
    if (hour < 0 || hour > 23) {
        throw new Error('Hora deve estar entre 0 e 23');
    }
    if (minute < 0 || minute > 59) {
        throw new Error('Minuto deve estar entre 0 e 59');
    }
    return `${minute} ${hour} * * *`;
}

/**
 * Cria expressão cron a partir de string de hora "HH:MM"
 */
function createDailyCronFromTime(timeString) {
    if (!validateTimeFormat(timeString)) {
        throw new Error('Formato de hora inválido. Use HH:MM (ex: 09:00)');
    }

    const [hour, minute] = timeString.split(':').map(Number);
    return createDailyCron(hour, minute);
}

/**
 * Extrai hora e minuto de uma expressão cron diária
 */
function extractTimeFromCron(cronExpression) {
    const parts = cronExpression.split(' ');
    if (parts.length === 5 && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        const minute = parts[0];
        const hour = parts[1];
        return {
            hour: parseInt(hour),
            minute: parseInt(minute),
            formatted: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
        };
    }
    return null;
}

module.exports = {
    CRON_PRESETS,
    getPreset,
    getAllPresets,
    describeCron,
    validateTimeFormat,
    createDailyCron,
    createDailyCronFromTime,
    extractTimeFromCron
};