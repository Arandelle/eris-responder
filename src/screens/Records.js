import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Alert,
  Modal,
  TouchableWithoutFeedback
} from "react-native";
import { useMemo, useState } from "react";
import useFetchRecord from "../hooks/useFetchRecord";
import useFetchData from "../hooks/useFetchData";
import { formatDateWithTime } from "../helper/FormatDate";
import useViewImage from "../hooks/useViewImage";
import { get, ref, remove } from "firebase/database";
import { auth, database } from "../services/firebaseConfig";

const Records = ({ status }) => {
  const { emergencyRecords } = useFetchRecord(status);

  // Sorting records efficiently with useMemo
  const sortedRecords = useMemo(() => {
    return [...emergencyRecords].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [emergencyRecords]);

  return (
    <View className="p-2 bg-white">
      <ScrollView>
        <View className="space-y-2">
          {sortedRecords.length > 0 ? (
            sortedRecords.map((records) => (
              <RecordItem key={records.id} records={records} />
            ))
          ) : (
            <Text className="text-center text-gray-500">{`No records found for ${status}`}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const RecordItem = ({ records }) => {
  const { data: userData } = useFetchData("users");
  const userDetails = userData?.find((user) => user.id === records.userId);
  const {
    handleImageClick,
    selectedImageUri,
    isImageModalVisible,
    closeImageModal,
  } = useViewImage();
  const [loading, setLoading] = useState(false);

  const emergencyStatus = {
    "awaiting response": "bg-orange-100 text-orange-600",
    "on-going": "bg-blue-100 text-blue-600",
    resolved: "bg-green-100 text-green-600",
    expired: "bg-red-300",
  };

  const deleteRecord = async (emergencyId) => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !emergencyId) return;

      const historyRef = ref(database, `responders/${user.uid}/history`);

      // Fetch all history records of the responder
      const snapshot = await get(historyRef);

      if (snapshot.exists()) {
        const historyData = snapshot.val();

        // Find all history records that match the emergencyId
        const historyIds = Object.keys(historyData).filter(
          (key) => historyData[key].emergencyId === emergencyId
        );

        if (historyIds.length > 0) {
          // Delete all matched history records
          const deletePromises = historyIds.map((historyId) =>
            remove(ref(database, `responders/${user.uid}/history/${historyId}`))
          );

          await Promise.all(deletePromises);
          ToastAndroid.show("Successfully Deleted", ToastAndroid.SHORT);
        } else {
          Alert.alert("Error", "No matching history found for this emergency.");
        }
      } else {
        Alert.alert("Error", "No history records found.");
      }
    } catch (error) {
      Alert.alert("Error Deleting Record", `${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1">
        <Text>Deleting...</Text>
      </View>
    );
  }

  return (
    <>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={closeImageModal}
      >
        <TouchableWithoutFeedback onPress={closeImageModal}>
          <View className="flex-1 justify-center items-center bg-black/70">
            <Image
              source={{ uri: selectedImageUri }}
              className="w-[90%] h-[70%] rounded-lg"
              resizeMode="contain"
            />
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View className="border border-gray-300 rounded-lg m-2">
        <View className="flex flex-row justify-between p-2">
          <View className="flex flex-row space-x-2">
            <TouchableOpacity
              onPress={() => handleImageClick(userDetails?.img)}
            >
              <Image
                source={{ uri: userDetails?.img }}
                className="h-12 w-12 rounded-full"
              />
            </TouchableOpacity>
            <View>
              <Text className="text-lg font-bold">
                {userDetails?.fullname ?? "User Name"}
              </Text>
              <Text className="text-sm text-gray-400">
                {userDetails?.customId}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="p-2"
            onPress={() => deleteRecord(records.emergencyId)}
          >
            <Text className="text-red-500">🗑 Delete</Text>
          </TouchableOpacity>
        </View>

        <View className="mx-2 mb-2 rounded-md p-4 space-y-2 bg-gray-100">
          <Text
            className={`font-bold ${
              emergencyStatus[records.status]
            } py-1 px-3 rounded-lg self-start`}
          >
            {records.status.toUpperCase()}
          </Text>

          <View className="space-y-2 p-1">
            <RowStyle label="Emergency Id" value={records.emergencyId} />
            <RowStyle label="Description" value={records.description} />
            <RowStyle label="Location" value={records.location} />
            <RowStyle
              label="Date Reported"
              value={formatDateWithTime(records.date)}
            />
            <RowStyle
              label="Response Time"
              value={formatDateWithTime(records.responseTime)}
            />
            {records.dateResolved && (
              <RowStyle
                label="Date Resolved"
                value={formatDateWithTime(records.dateResolved)}
              />
            )}
          </View>
        </View>
      </View>
    </>
  );
};

const RowStyle = ({ label, value }) => (
  <View className="flex flex-row m-1">
    <Text className="w-1/3 font-bold text-gray-500">{label}</Text>
    <Text className="flex-1 font-bold">{value}</Text>
  </View>
);

export default Records;
