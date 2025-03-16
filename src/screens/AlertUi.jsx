import React, { useRef, useEffect } from "react";
import { Animated, Image, View } from "react-native";

export const useScaleAnim = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim,{
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true
        }),

        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    );
    pulse.start()
  }, [scaleAnim]);

  return scaleAnim;
}

const AlertUi = () => {
  const scaleAnim = useScaleAnim();
  return (
    <View
      style={{
        position: "absolute",
        top: 40,
        left: 0,
        right: 0,
        alignItems: "center",
        zIndex: 40
      }}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }]
        }}
      >
        <Image
          source={require("../../assets/14.gif")}
          style={{
            height: 70,
            width: 96,
            resizeMode: "contain"
          }}
          // This ensures the GIF animates
          defaultSource={require("../../assets/14.gif")}
        />
      </Animated.View>
    </View>
  );
};

export default AlertUi;
