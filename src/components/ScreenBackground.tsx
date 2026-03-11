import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import type { StyleProp, ViewStyle } from "react-native";

import { colors } from "../theme/colors";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function ScreenBackground({ children, style }: Props) {
  return (
    <LinearGradient
      colors={[colors.bg1, colors.bg0]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[{ flex: 1 }, style]}
    >
      {children}
    </LinearGradient>
  );
}

