import { prisma } from '../lib/prisma.js';

// Get user's notifications with pagination
export const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: req.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: parseInt(limit),
    });

    const total = await prisma.notification.count({
      where: {
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get count of unread notifications
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false,
      },
    });

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Mark a notification as read
export const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: {
        id,
        userId: req.user.id,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: {
        notification,
      },
      message: 'Notification marked as read',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Delete a notification
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id,
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    next(error);
  }
};

// Delete all notifications
export const deleteAllNotifications = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: {
        userId: req.user.id,
      },
    });

    res.json({
      success: true,
      message: 'All notifications deleted',
    });
  } catch (error) {
    next(error);
  }
};

// Test function to create a sample notification for testing
export const createTestNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type = 'INFO', priority = 1 } = req.body;

    // If no userId provided, use the current user's ID
    const targetUserId = userId || req.user.id;

    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        title: title || 'Test Notification',
        message:
          message || 'This is a test notification for debugging purposes.',
        type,
        priority,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      },
    });

    res.status(201).json({
      success: true,
      data: {
        notification,
      },
      message: 'Test notification created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Test function to get notification statistics
export const getNotificationStats = async (req, res, next) => {
  try {
    const totalNotifications = await prisma.notification.count();
    const unreadNotifications = await prisma.notification.count({
      where: { read: false },
    });
    const readNotifications = totalNotifications - unreadNotifications;

    // Get notification counts by type
    const typeStats = await prisma.notification.groupBy({
      by: ['type'],
      _count: {
        _all: true,
      },
    });

    // Get notification counts by priority
    const priorityStats = await prisma.notification.groupBy({
      by: ['priority'],
      _count: {
        _all: true,
      },
    });

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: readNotifications,
        byType: typeStats,
        byPriority: priorityStats,
      },
      message: 'Notification statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Create a new notification (admin only)
export const createNotification = async (req, res, next) => {
  try {
    const { userId, title, message, type = 'INFO' } = req.body;

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        priority: req.body.priority || 1,
        expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
        actionUrl: req.body.actionUrl || null,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        notification,
      },
      message: 'Notification created',
    });
  } catch (error) {
    next(error);
  }
};

// Broadcast notification to multiple users (admin only)
export const broadcastNotification = async (req, res, next) => {
  try {
    const { userIds, title, message, type = 'INFO' } = req.body;

    // Validate that we have user IDs
    if (!userIds || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required for broadcasting',
      });
    }

    // Limit broadcast to 100 users at a time to prevent performance issues
    if (userIds.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Cannot broadcast to more than 100 users at a time',
      });
    }

    // Create notifications for each user
    const notifications = await Promise.all(
      userIds.map((userId) =>
        prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            priority: req.body.priority || 1,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
            actionUrl: req.body.actionUrl || null,
          },
        })
      )
    );

    res.status(201).json({
      success: true,
      data: {
        notifications,
      },
      message: `Notification broadcast to ${notifications.length} users`,
    });
  } catch (error) {
    next(error);
  }
};

// Get all notifications (admin only)
export const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: parseInt(limit),
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const total = await prisma.notification.count();

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete any notification (admin only)
export const adminDeleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.notification.delete({
      where: {
        id,
      },
    });

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    next(error);
  }
};
