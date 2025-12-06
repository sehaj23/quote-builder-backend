const CRON_USERNAME = process.env.REMINDER_CRON_USERNAME || '';
const CRON_PASSWORD = process.env.REMINDER_CRON_PASSWORD || '';
export function cronBasicAuth(req, res, next) {
    if (!CRON_USERNAME || !CRON_PASSWORD) {
        return res.status(500).json({
            success: false,
            error: 'Cron auth credentials are not configured'
        });
    }
    const header = req.headers['authorization'];
    if (!header || !header.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="cron"');
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    const base64Credentials = header.split(' ')[1] || '';
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');
    if (username === CRON_USERNAME && password === CRON_PASSWORD) {
        return next();
    }
    return res.status(401).json({ success: false, error: 'Unauthorized' });
}
//# sourceMappingURL=basicAuth.js.map