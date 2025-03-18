import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native';
import openLinks from '../../helper/openLinks';
import useFetchData from '../../hooks/useFetchData';

const Hotlines = ({
    distance,
    selectedEmergency,
    emergencyDetails
}) => {
  const { data: hotlines } = useFetchData("hotlines");
  const [recommendedHotlines, setRecommendedHotlines] = useState([]);
  const [showRecommended, setShowRecommended] = useState(false);
    // to check the recommended hotlines
    useEffect(() => {
      if (selectedEmergency && emergencyDetails) {
        const recommended =
          Array.isArray(hotlines) &&
          hotlines.filter(
            (hotlines) => hotlines.category === emergencyDetails.emergencyType
          );

        const generalHotlines = Array.isArray(hotlines) && hotlines.filter((hotline) => hotline.category === "other");

        const combineHotline = [...new Set([...recommended, ...generalHotlines])];

        setRecommendedHotlines(combineHotline || []);
      }
    }, [selectedEmergency, emergencyDetails, hotlines]);

  return (
    <View className="absolute top-10 left-4 right-4 bg-white p-4 rounded-lg space-y-2">
    <Text className="text-lg font-semibold">
      Distance: {distance.toFixed(2)} km
    </Text>

    {/* Show/Hide Recommended Hotlines */}
    <TouchableOpacity
      onPress={() => setShowRecommended(!showRecommended)}
      className="pb-2"
    >
      <Text className="text-blue-500 text-start font-bold">
        {showRecommended ? "Hide Hotlines" : "See recommended hotlines"}
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
          <Text className="text-gray-500">No available hotlines. Try clicking the on-going emergency</Text>
        )}
      </View>
    )}
  </View>
  )
}

export default Hotlines