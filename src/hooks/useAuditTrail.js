import { ref, push } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";

// Utility function for logging audit trails
const logAuditTrail = async (action = "User performed an action", userId = null) => {
  try {
    // Get the authenticated user's ID if not provided
    const currentUserId = userId || auth.currentUser?.uid || "anonymous";

    const logsDataRef = ref(database, `usersLog`);

    const usersLogData = {
      userId: currentUserId, // Use dynamic userId or fallback to "anonymous"
      date: new Date().toISOString(),
      action,
    };

    await push(logsDataRef, usersLogData);
    console.log("Audit trail logged successfully.");
  } catch (error) {
    console.error("Error logging audit trail:", error);
  }
};

export default logAuditTrail;
