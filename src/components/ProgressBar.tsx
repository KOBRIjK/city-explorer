import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/radii";

type Props = {
  value: number;
  height?: number;
  fillColors?: readonly [string, string];
  style?: StyleProp<ViewStyle>;
};

export function ProgressBar({ value, height = 8, fillColors, style }: Props) {
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: "rgba(255,255,255,0.10)",
          borderRadius: radii.pill,
          overflow: "hidden"
        },
        style
      ]}
    >
      <LinearGradient
        colors={fillColors ?? [colors.accent, colors.accent2]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{
          width: `${Math.round(clamped * 100)}%`,
          height: "100%"
        }}
      />
    </View>
  );
}
