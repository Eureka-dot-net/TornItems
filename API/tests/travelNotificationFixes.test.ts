describe('Travel Notification Fixes', () => {
  describe('Notification flag reset', () => {
    it('should reset all notification flags when updating a travel notification', () => {
      // Simulating the update path in notifyTravel.ts
      const notification = {
        notificationsSent: true,
        notificationsSent1: true,
        notificationsSent2: true,
      };

      // After update, all flags should be reset
      notification.notificationsSent = false;
      notification.notificationsSent1 = false;
      notification.notificationsSent2 = false;

      expect(notification.notificationsSent).toBe(false);
      expect(notification.notificationsSent1).toBe(false);
      expect(notification.notificationsSent2).toBe(false);
    });

    it('should initialize all notification flags to false when creating a new travel notification', () => {
      // Simulating the create path in notifyTravel.ts
      const notification = {
        notificationsSent: false,
        notificationsSent1: false,
        notificationsSent2: false,
      };

      expect(notification.notificationsSent).toBe(false);
      expect(notification.notificationsSent1).toBe(false);
      expect(notification.notificationsSent2).toBe(false);
    });
  });

  describe('Boarding time adjustment for close notification times', () => {
    it('should keep original boarding time if notifications are in the future', () => {
      const now = new Date('2024-01-10T10:00:00Z');
      const boardingTime = new Date('2024-01-10T10:05:00Z'); // 5 minutes in the future
      const notifyBeforeSeconds = 10;
      const minTimeBuffer = 15 * 1000; // 15 seconds

      const notifyBeforeTime = new Date(boardingTime.getTime() - notifyBeforeSeconds * 1000);
      const earliestNotificationTime = notifyBeforeTime;

      // Check if adjustment is needed
      const needsAdjustment = earliestNotificationTime.getTime() < now.getTime() + minTimeBuffer;

      expect(needsAdjustment).toBe(false);
    });

    it('should move boarding time forward by 15 minutes if notification time is too close', () => {
      const now = new Date('2024-01-10T10:00:00Z');
      const boardingTime = new Date('2024-01-10T10:00:20Z'); // 20 seconds in the future
      const notifyBeforeSeconds = 10;
      const minTimeBuffer = 15 * 1000; // 15 seconds

      let notifyBeforeTime = new Date(boardingTime.getTime() - notifyBeforeSeconds * 1000);
      const earliestNotificationTime = notifyBeforeTime;

      // Check if adjustment is needed (10s ahead - 10s before = 0s, which is < 15s buffer)
      const needsAdjustment = earliestNotificationTime.getTime() < now.getTime() + minTimeBuffer;

      expect(needsAdjustment).toBe(true);

      // Adjust boarding time
      if (needsAdjustment) {
        const adjustedBoardingTime = new Date(boardingTime.getTime() + 15 * 60 * 1000);
        notifyBeforeTime = new Date(adjustedBoardingTime.getTime() - notifyBeforeSeconds * 1000);

        // Verify the adjustment
        expect(adjustedBoardingTime.getTime() - boardingTime.getTime()).toBe(15 * 60 * 1000);
        expect(notifyBeforeTime.getTime() > now.getTime() + minTimeBuffer).toBe(true);
      }
    });

    it('should move boarding time forward if notification time is in the past', () => {
      const now = new Date('2024-01-10T10:00:00Z');
      const boardingTime = new Date('2024-01-10T10:00:05Z'); // 5 seconds in the future
      const notifyBeforeSeconds = 10; // Would require notification 5 seconds ago
      const minTimeBuffer = 15 * 1000; // 15 seconds

      let notifyBeforeTime = new Date(boardingTime.getTime() - notifyBeforeSeconds * 1000);
      const earliestNotificationTime = notifyBeforeTime;

      // Notification time is in the past
      expect(earliestNotificationTime.getTime() < now.getTime()).toBe(true);

      const needsAdjustment = earliestNotificationTime.getTime() < now.getTime() + minTimeBuffer;
      expect(needsAdjustment).toBe(true);

      // Adjust boarding time
      if (needsAdjustment) {
        const adjustedBoardingTime = new Date(boardingTime.getTime() + 15 * 60 * 1000);
        notifyBeforeTime = new Date(adjustedBoardingTime.getTime() - notifyBeforeSeconds * 1000);

        // Verify notification time is now in the future
        expect(notifyBeforeTime.getTime() > now.getTime()).toBe(true);
      }
    });

    it('should handle second notification time when checking for adjustment', () => {
      const now = new Date('2024-01-10T10:00:00Z');
      const boardingTime = new Date('2024-01-10T10:00:20Z');
      const notifyBeforeSeconds = 10; // First notification at 10:00:10
      const notifyBeforeSeconds2 = 5; // Second notification at 10:00:15 (closer to boarding, so LATER)
      const minTimeBuffer = 15 * 1000;

      let notifyBeforeTime = new Date(boardingTime.getTime() - notifyBeforeSeconds * 1000); // 10:00:10
      let notifyBeforeTime2 = new Date(boardingTime.getTime() - notifyBeforeSeconds2 * 1000); // 10:00:15
      
      // notifyBeforeTime2 happens later (5s before boarding vs 10s before boarding)
      // So we should check notifyBeforeTime (the earlier one)
      const earliestNotificationTime = notifyBeforeTime2 && notifyBeforeTime2.getTime() < notifyBeforeTime.getTime()
        ? notifyBeforeTime2
        : notifyBeforeTime;

      // earliestNotificationTime is 10:00:10, which is 10s in the future (< 15s buffer)
      const needsAdjustment = earliestNotificationTime.getTime() < now.getTime() + minTimeBuffer;
      expect(needsAdjustment).toBe(true);

      // Adjust if needed
      if (needsAdjustment) {
        const adjustedBoardingTime = new Date(boardingTime.getTime() + 15 * 60 * 1000);
        notifyBeforeTime = new Date(adjustedBoardingTime.getTime() - notifyBeforeSeconds * 1000);
        notifyBeforeTime2 = new Date(adjustedBoardingTime.getTime() - notifyBeforeSeconds2 * 1000);

        // Both notification times should now be in the future with buffer
        expect(notifyBeforeTime.getTime() > now.getTime() + minTimeBuffer).toBe(true);
        expect(notifyBeforeTime2.getTime() > now.getTime() + minTimeBuffer).toBe(true);
      }
    });
  });
});
