const { countBooksByStatus, getRecentLogs } = require('../database/queries');
const schedulerService = require('../services/scheduler');
const whatsappService = require('../services/whatsapp');

const dashboardController = {
    showDashboard: async (req, res) => {
        try {
            const bookStats = await countBooksByStatus();
            const recentLogs = await getRecentLogs(10);
            const schedulerStatus = schedulerService.getStatus();
            const schedulerStats = await schedulerService.getStats();
            const whatsappInfo = await whatsappService.getInfo();

            res.render('dashboard', {
                bookStats,
                recentLogs,
                schedulerStatus,
                schedulerStats,
                whatsappInfo
            });
        } catch (error) {
            res.render('dashboard', {
                bookStats: { pending: 0, sent: 0, error: 0 },
                recentLogs: [],
                schedulerStatus: {},
                schedulerStats: {},
                whatsappInfo: {},
                error: error.message
            });
        }
    }
};

module.exports = dashboardController;