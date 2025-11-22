import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { UserActivity, CreateActivityRequest } from '../types/index.js';
export declare class ActivityService {
    private activityRepository;
    constructor(activityRepository: ActivityRepository);
    logActivity(activityData: CreateActivityRequest): Promise<UserActivity>;
    getActivityById(id: number): Promise<UserActivity | null>;
    getActivities(options?: {
        userId?: string;
        companyId?: number;
        action?: string;
        resourceType?: string;
        limit?: number;
        offset?: number;
    }): Promise<UserActivity[]>;
    getUserActivities(userId: string, limit?: number, offset?: number): Promise<UserActivity[]>;
    getCompanyActivities(companyId: number, limit?: number, offset?: number): Promise<UserActivity[]>;
    getRecentActivities(limit?: number): Promise<UserActivity[]>;
    getActivityStats(companyId?: number): Promise<{
        totalActivities: number;
        uniqueUsers: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        recentActivity: UserActivity[];
        activitiesByDay: Array<{
            date: string;
            count: number;
        }>;
    }>;
    cleanupOldActivities(daysToKeep?: number): Promise<number>;
    getActivityByResourceType(resourceType: string, companyId?: number): Promise<UserActivity[]>;
    getActivityByAction(action: string, companyId?: number): Promise<UserActivity[]>;
    getActivityByResourceId(resourceType: string, resourceId: number, companyId?: number): Promise<UserActivity[]>;
    getActivityByDateRange(dateFrom: string, dateTo: string, options?: {
        userId?: string;
        companyId?: number;
        action?: string;
        resourceType?: string;
        limit?: number;
        offset?: number;
    }): Promise<UserActivity[]>;
    countActivitiesByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<number>;
    countActivitiesByCompany(companyId: number, dateFrom?: string, dateTo?: string): Promise<number>;
    getMostActiveUsers(limit?: number, companyId?: number): Promise<Array<{
        userId: string;
        userName: string;
        userEmail: string;
        activityCount: number;
    }>>;
}
//# sourceMappingURL=ActivityService.d.ts.map