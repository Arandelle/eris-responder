import { View, Text, ScrollView } from 'react-native';
import useFetchRecord from '../hooks/useFetchRecord';
import useFetchUser from '../hooks/useFetchUser';

const Records = ({ status }) => {
  const {emergencyRecords} = useFetchRecord(status);
  // Sorting history by date
  emergencyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <View className="bg-gray-100 h-full p-2 w-full rounded-lg shadow-lg">
      <ScrollView>
        {emergencyRecords.length > 0 ? (
          emergencyRecords.map((history) => (
            <RecordItem key={history.id} history={history}/>
          ))
        ) : (
          <Text className="text-center text-gray-500">{`No records found for ${status}`}</Text>
        )}
      </ScrollView>
    </View>
  );
};

const RecordItem = ({history}) => {
  const {userDetails} = useFetchUser(history.userId);

  
  const emergencyStatus = {
    "awaiting response": 'bg-yellow-300',
    "on-ging": 'bg-orange-300',
    resolved: 'bg-green-300',
    expired: 'bg-red-300',
  };

  return (
    <View>
    <View
      className={`flex flex-row justify-between p-2 border border-gray-500 ${emergencyStatus[history.status]}`}
    >
      <Text className="text-lg font-bold">History ID:</Text>
      <Text className="text-lg">{history.id}</Text>
    </View>
    <View className="space-y-2 p-3">
      <Text className="text-lg font-bold">
        Type: {history.type.toUpperCase()}
      </Text>
      <Text className="text-lg">Name: {`${userDetails?.firstname} ${userDetails?.lastname}` || "Loading..."}</Text>
      <Text className="text-lg">Description: {history.description}</Text>
      <Text className="text-lg">Location: {history.location}</Text>
      <Text className="text-lg">Status: {history.status.toUpperCase()}</Text>
      <Text className="text-lg">
        Submitted: {new Date(history.date).toLocaleString()}
      </Text>
      <Text className="text-lg">
        Date Accepted: {new Date(history.dateAccepted).toLocaleString()}
      </Text>
    </View>
  </View>
  )
}

export default Records;
