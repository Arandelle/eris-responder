import { View, Text, ScrollView, Image } from "react-native";
import useFetchRecord from "../hooks/useFetchRecord";
import useFetchUser from "../hooks/useFetchUser";
import { formatDateWithTime } from "../helper/FormatDate";

const Records = ({ status }) => {
  const { emergencyRecords } = useFetchRecord(status);
  // Sorting records by date
  emergencyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <View className="p-2 bg-white">
      <ScrollView>
        <View className="space-y-2">
          {emergencyRecords.length > 0 ? (
            emergencyRecords.map((records, key) => (
              <View className="space-y-2">
                <RecordItem key={key} records={records} />
              </View>
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
  const { userDetails } = useFetchUser(records.userId);

  const emergencyStatus = {
    "awaiting response": "bg-orange-100 text-orange-600",
    "on-going": "bg-blue-100 text-blue-600",
    resolved: "bg-green-100 text-green-600",
    expired: "bg-red-300",
  };

  return (
    <View className="border border-gray-300 rounded-lg">
      <View className="flex flex-row space-x-2 p-4">
        <Image
          source={{ uri: userDetails?.img }}
          className="h-12 w-12 rounded-full"
        />
        <View>
          <Text className="text-lg font-bold">
            {`${userDetails?.firstname} ${userDetails?.lastname}` ||
              "Loading..."}
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
          <View className="flex flex-row">
            <Text className="w-1/3 font-bold text-gray-500">Emergency Id:</Text>
            <Text className="flex-1 font-bold">{records?.emergencyId}</Text>
          </View>

          <View className="flex flex-row">
            <Text className="w-1/3 font-bold text-gray-500">Description:</Text>
            <Text className="flex-1 font-bold">{records.description}</Text>
          </View>

          <View className="flex flex-row">
            <Text className="w-1/3 font-bold text-gray-500">Location:</Text>
            <Text className="flex-1 font-bold">{records.location}</Text>
          </View>

          <View className="flex flex-row">
            <Text className="w-1/3 font-bold text-gray-500">Reported At:</Text>
            <Text className="flex-1 font-bold">
              {formatDateWithTime(records.date)}
            </Text>
          </View>

          <View className="flex flex-row">
            <Text className="w-1/3 font-bold text-gray-500">
              Response Time:
            </Text>
            <Text className="flex-1 font-bold">
              {formatDateWithTime(records.responseTime)}
            </Text>
          </View>

          {records.dateResolved && (
            <View className="flex flex-row">
              <Text className="w-1/3 font-bold text-gray-500">
                Date Resolved:
              </Text>
              <Text className="flex-1 font-bold">
                {formatDateWithTime(records.dateResolved)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Records;
