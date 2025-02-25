import { Image, ScrollView, View, TouchableOpacity } from "react-native";
import {useNavigation, useRoute} from "@react-navigation/native";

const AvatarList = () => {

    const navigation = useNavigation();
    const route = useRoute();
    const onSelectAvatar = route?.params?.onSelectAvatar;

  const imageUrls = [
    ...Array.from(
      {
        length: 5,
      },
      (_, i) =>
        `https://flowbite.com/docs/images/people/profile-picture-${i + 1}.jpg`
    ),
    ...Array.from(
      { length: 99 },
      (_, i) => `https://api.dicebear.com/7.x/avataaars/png?seed=${i + 1}`
    ),
  ];

  return (
    <ScrollView>
      <View className="flex flex-row flex-wrap itemes-center justify-center gap-4 py-8">
        {imageUrls.map((url, index) => (
          <TouchableOpacity key={index}
          onPress={() => {
              if (onSelectAvatar) {
                  onSelectAvatar(url);
                  navigation.goBack();
              }
            }}
          >
            <Image
              key={index}
              source={{ uri: url }}
              className="rounded-full h-20 w-20"
            />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default AvatarList;
