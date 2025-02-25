import { useState, useRef } from "react";
import { Video } from "expo-av";
import { ActivityIndicator, View } from "react-native";
import colors from "../constants/colors";

const VideoStyle = ({ videoUri }) => {
  const videoRef = useRef(null);
  const [videoLoading, setVideoLoading] = useState(true);

  return (
    <View className="flex items-center justify-center p-2">
      {videoLoading && (
        <ActivityIndicator
          size="large"
          color={colors.blue[500]}
          className="absolute"
        />
      )}
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={{ width: 300, height: 300, aspectRatio: 1.5 }}
        onLoadStart={() => setVideoLoading(true)}
        onLoad={() => setVideoLoading(false)}
        onError={() => setVideoLoading(false)}
        useNativeControls
        resizeMode="contain"
      />
    </View>
  );
};

export default VideoStyle;
