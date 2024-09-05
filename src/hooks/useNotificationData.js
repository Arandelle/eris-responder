import { useState, useEffect } from "react";
import { auth, database } from "../services/firebaseConfig";
import { onValue, ref, update } from "firebase/database";

export const useNotificationData = () => {
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;

    if (user) {
      const userNotificationRef = ref(
        database,
        `responders/${user.uid}/notifications`
      );

      // Listen for changes in the notifications data
      onValue(userNotificationRef, (snapshot) => {
        const data = snapshot.val();
        const notificationList = [];
        let unseenCount = 0;

        // Convert the data object to an array
        for (let id in data) {
          const notification = {
            id, // unique id of notification
            ...data[id], // the notification data
          };

          notificationList.push(notification);

          if (!notification.isSeen) {
            unseenCount++;
          }
        }

        // Sort notifications by date
        notificationList.sort((a, b) => new Date(b.date) - new Date(a.date));
        setNotifications(notificationList);
        setNotificationsCount(unseenCount);
      });
    }
  }, []);

  const handleSpecificNotification = (notificationId) => {
    const user = auth.currentUser;
    const notificationUpdateRef = ref(
      database,
      `responders/${user.uid}/notifications/${notificationId}`
    );

    update(notificationUpdateRef, { isSeen: true });
  };

 const markAllNotificationsAsRead = () => {
    const user = auth.currentUser;

    if(user){
      notifications.forEach((notification)=> {
        const notificationRef = ref(database, `responders/${user.uid}/notifications/${notification.id}`);

        update(notificationRef, {isSeen: true});
      });
    }
  }

  return { notificationsCount, notifications, handleSpecificNotification, markAllNotificationsAsRead };
};
