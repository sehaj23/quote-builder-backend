export class ActivityService {
    activityRepository;
    constructor(activityRepository) {
        this.activityRepository = activityRepository;
    }
    async logActivity(activityData) {
        return this.activityRepository.create(activityData);
    }
    async getActivityById(id) {
        return this.activityRepository.findById(id);
    }
    async getActivities(options = {}) {
        return this.activityRepository.findAll(options);
    }
    async getUserActivities(userId, limit = 50, offset = 0) {
        return this.activityRepository.findByUser(userId, limit, offset);
    }
    async getCompanyActivities(companyId, limit = 50, offset = 0) {
        return this.activityRepository.findByCompany(companyId, limit, offset);
    }
    async getRecentActivities(limit = 20) {
        return this.activityRepository.findRecent(limit);
    }
    async getActivityStats(companyId) {
        return this.activityRepository.getStats(companyId);
    }
    async cleanupOldActivities(daysToKeep = 90) {
        return this.activityRepository.cleanup(daysToKeep);
    }
    async getActivityByResourceType(resourceType, companyId) {
        return this.activityRepository.findByResourceType(resourceType, companyId);
    }
    async getActivityByAction(action, companyId) {
        return this.activityRepository.findByAction(action, companyId);
    }
    async getActivityByResourceId(resourceType, resourceId, companyId) {
        return this.activityRepository.findByResourceId(resourceType, resourceId, companyId);
    }
    async getActivityByDateRange(dateFrom, dateTo, options = {}) {
        return this.activityRepository.findByDateRange(dateFrom, dateTo, options);
    }
    async countActivitiesByUser(userId, dateFrom, dateTo) {
        return this.activityRepository.countByUser(userId, dateFrom, dateTo);
    }
    async countActivitiesByCompany(companyId, dateFrom, dateTo) {
        return this.activityRepository.countByCompany(companyId, dateFrom, dateTo);
    }
    async getMostActiveUsers(limit = 10, companyId) {
        return this.activityRepository.findMostActiveUsers(limit, companyId);
    }
}
//# sourceMappingURL=ActivityService.js.map