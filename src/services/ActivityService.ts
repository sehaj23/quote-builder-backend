import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { UserActivity, CreateActivityRequest } from '../types/index.js';

export class ActivityService {
  constructor(private activityRepository: ActivityRepository) {}

  async logActivity(activityData: CreateActivityRequest): Promise<UserActivity> {
    return this.activityRepository.create(activityData);
  }

  async getActivityById(id: number): Promise<UserActivity | null> {
    return this.activityRepository.findById(id);
  }

  async getActivities(options: {
    userId?: string;
    companyId?: number;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<UserActivity[]> {
    return this.activityRepository.findAll(options);
  }

  async getUserActivities(userId: string, limit: number = 50, offset: number = 0): Promise<UserActivity[]> {
    return this.activityRepository.findByUser(userId, limit, offset);
  }

  async getCompanyActivities(companyId: number, limit: number = 50, offset: number = 0): Promise<UserActivity[]> {
    return this.activityRepository.findByCompany(companyId, limit, offset);
  }

  async getRecentActivities(limit: number = 20): Promise<UserActivity[]> {
    return this.activityRepository.findRecent(limit);
  }

  async getActivityStats(companyId?: number): Promise<{
    totalActivities: number;
    uniqueUsers: number;
    topActions: Array<{ action: string; count: number }>;
    recentActivity: UserActivity[];
    activitiesByDay: Array<{ date: string; count: number }>;
  }> {
    return this.activityRepository.getStats(companyId);
  }

  async cleanupOldActivities(daysToKeep: number = 90): Promise<number> {
    return this.activityRepository.cleanup(daysToKeep);
  }

  async getActivityByResourceType(resourceType: string, companyId?: number): Promise<UserActivity[]> {
    return this.activityRepository.findByResourceType(resourceType, companyId);
  }

  async getActivityByAction(action: string, companyId?: number): Promise<UserActivity[]> {
    return this.activityRepository.findByAction(action, companyId);
  }

  async getActivityByResourceId(resourceType: string, resourceId: number, companyId?: number): Promise<UserActivity[]> {
    return this.activityRepository.findByResourceId(resourceType, resourceId, companyId);
  }

  async getActivityByDateRange(dateFrom: string, dateTo: string, options: {
    userId?: string;
    companyId?: number;
    action?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<UserActivity[]> {
    return this.activityRepository.findByDateRange(dateFrom, dateTo, options);
  }

  async countActivitiesByUser(userId: string, dateFrom?: string, dateTo?: string): Promise<number> {
    return this.activityRepository.countByUser(userId, dateFrom, dateTo);
  }

  async getMostActiveUsers(limit: number = 10, companyId?: number): Promise<Array<{
    userId: string;
    userName: string;
    userEmail: string;
    activityCount: number;
  }>> {
    return this.activityRepository.findMostActiveUsers(limit, companyId);
  }
}