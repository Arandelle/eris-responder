import React from 'react'
import { View, Text, TouchableOpacity } from 'react-native';
import openLinks from '../../helper/openLinks';

const Hotlines = ({
    distance,
    showRecommended,
    recommendedHotlines,
    setShowRecommended
}) => {
  return (
    <View className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg space-y-4">
    <Text className="text-lg font-semibold">
      Distance to the emergency: {distance.toFixed(2)} km
    </Text>

    {/* Show/Hide Recommended Hotlines */}
    <TouchableOpacity
      onPress={() => setShowRecommended(!showRecommended)}
      className="bg-blue-500 p-2 rounded-lg"
    >
      <Text className="text-white text-center font-bold">
        {showRecommended ? "Hide Hotlines" : "Show Hotlines"}
      </Text>
    </TouchableOpacity>

    {showRecommended && (
      <View className="space-y-2">
        {recommendedHotlines.length > 0 ? (
          recommendedHotlines.map((hotline, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openLinks(hotline.contact, "phone")}
              className="flex flex-row p-1"
            >
              <Text className="text-gray-800 font-bold flex-1 basis-1/2">
                {hotline.organization}
              </Text>
              <Text className="flex-1 basis-1/2">{hotline.contact}</Text>
              <Text className="font-bold text-red-500">Call</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text className="text-gray-500">No available hotlines.</Text>
        )}
      </View>
    )}
  </View>
  )
}

export default Hotlines
