const { getAllSettings, setSetting } = require('../database/queries');
const schedulerService = require('../services/scheduler');
const { describeCron, CRON_PRESETS } = require('../utils/cronHelper');

const settingsController = {
    showSettings: async (req, res) => {
        try {
            const settings = await getAllSettings();
            const presets = CRON_PRESETS;
            const description = describeCron(settings.cron_schedule || '0 9 * * *');
            
            res.render('settings', { settings, presets, description, error: null, success: null });
        } catch (error) {
            res.render('settings', { 
                settings: {}, 
                presets: CRON_PRESETS,
                description: '',
                error: error.message,
                success: null
            });
        }
    },

    updateSettings: async (req, res) => {
        try {
            const { group_id, cron_schedule } = req.body;

            if (group_id) {
                await setSetting('group_id', group_id);
            }

            if (cron_schedule) {
                await setSetting('cron_schedule', cron_schedule);
                
                if (schedulerService.isRunning) {
                    await schedulerService.updateSchedule(cron_schedule);
                }
            }

            res.redirect('/settings?success=Configurações salvas com sucesso!');
        } catch (error) {
            res.redirect('/settings?error=' + error.message);
        }
    },

    toggleScheduler: async (req, res) => {
        try {
            if (schedulerService.isRunning) {
                await schedulerService.stop();
                res.json({ success: true, message: 'Agendador parado', isRunning: false });
            } else {
                await schedulerService.start();
                res.json({ success: true, message: 'Agendador iniciado', isRunning: true });
            }
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    },

    sendNow: async (req, res) => {
        try {
            await schedulerService.executeNow();
            res.json({ success: true, message: 'Envio executado com sucesso!' });
        } catch (error) {
            res.json({ success: false, message: error.message });
        }
    }
};

module.exports = settingsController;