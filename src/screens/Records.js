import { View, Text, ScrollView, Image, TouchableOpacity } from "react-native";
import { useMemo } from "react";
import useFetchRecord from "../hooks/useFetchRecord";
import useFetchData from "../hooks/useFetchData";
import { formatDateWithTime } from "../helper/FormatDate";
import useViewImage from "../hooks/useViewImage";
import ImageViewer from "react-native-image-viewing";

const Records = ({ status }) => {
  const { emergencyRecords } = useFetchRecord(status);

  // Sorting records efficiently with useMemo
  const sortedRecords = useMemo(() => {
    return [...emergencyRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
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
  const { handleImageClick, selectedImageUri, isImageModalVisible, closeImageModal } = useViewImage();

  const emergencyStatus = {
    "awaiting response": "bg-orange-100 text-orange-600",
    "on-going": "bg-blue-100 text-blue-600",
    resolved: "bg-green-100 text-green-600",
    expired: "bg-red-300",
  };

  return (
    <>
      <ImageViewer
        images={[{ uri: selectedImageUri }]}
        imageIndex={0}
        visible={isImageModalVisible}
        onRequestClose={closeImageModal}
      />
      <View className="border border-gray-300 rounded-lg m-2">
        <View className="flex flex-row space-x-2 p-4">
          <TouchableOpacity onPress={() => handleImageClick(userDetails?.img)}>
            <Image
              source={{ uri: userDetails?.img }}
              className="h-12 w-12 rounded-full"
            />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-bold">
              {userDetails?.fullname ?? "User Name"}
            </Text>
            <Text className="text-sm text-gray-400">{userDetails?.customId}</Text>
          </View>
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
            <RowStyle label="Date Reported" value={formatDateWithTime(records.date)} />
            <RowStyle label="Response Time" value={formatDateWithTime(records.responseTime)} />
            {records.dateResolved && (
              <RowStyle label="Date Resolved" value={formatDateWithTime(records.dateResolved)} />
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
