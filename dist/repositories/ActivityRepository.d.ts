import { UserActivity, CreateActivityRequest } from '@/types/index.js';
interface FindActivitiesOptions {
    userId?: string;
    companyId?: number;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
}
export declare class ActivityRepository {
    create(activityData: CreateActivityRequest): Promise<UserActivity>;
    findById(id: number): Promise<UserActivity | null>;
    findAll(options?: FindActivitiesOptions): Promise<UserActivity[]>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<UserActivity[]>;
    findByCompany(companyId: number, limit?: number, offset?: number): Promise<UserActivity[]>;
    findByAction(action: string, companyId?: number): Promise<UserActivity[]>;
    findByResourceType(resourceType: string, companyId?: number): Promise<UserActivity[]>;
    findRecent(limit?: number): Promise<UserActivity[]>;
    findByDateRange(dateFrom: string, dateTo: string, options?: Omit<FindActivitiesOptions, 'dateFrom' | 'dateTo'>): Promise<UserActivity[]>;
    getStats(companyId?: number): Promise<{
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
    delete(id: number): Promise<boolean>;
    cleanup(daysToKeep?: number): Promise<number>;
    findByResourceId(resourceType: string, resourceId: number, companyId?: number): Promise<UserActivity[]>;
    countByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<number>;
    findMostActiveUsers(limit?: number, companyId?: number): Promise<Array<{
        userId: string;
        userName: string;
        userEmail: string;
        activityCount: number;
    }>>;
}
export {};
//# sourceMappingURL=ActivityRepository.d.ts.map