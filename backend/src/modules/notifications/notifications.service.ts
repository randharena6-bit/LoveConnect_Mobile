import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from '../../database/entities/notification.entity';
import { User } from '../../database/entities/user.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: process.env.FCM_PROJECT_ID,
        });
      } catch {
        this.logger.warn('Firebase Admin not configured - push notifications disabled');
      }
    }
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: notifications,
      meta: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true, readAt: new Date() },
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body?: string,
    data?: Record<string, any>,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      body,
      data,
    });
    return this.notificationRepository.save(notification);
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'fcmToken'],
    });
    if (!user?.fcmToken) return;

    try {
      await admin.messaging().send({
        token: user.fcmToken,
        notification: { title, body },
        data: data as Record<string, string>,
      });
    } catch (error) {
      this.logger.error('Failed to send push notification', error instanceof Error ? error.message : String(error));
    }
  }

  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    await this.userRepository.update(userId, { fcmToken });
  }
}
