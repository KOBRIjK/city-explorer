import type { PropsWithChildren } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { radii } from "../theme/radii";

type Props = PropsWithChildren<{
  size?: number;
  backgroundColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}>;

export function IconCircle({
  children,
  size = 40,
  backgroundColor = "rgba(255,255,255,0.08)",
  borderColor = "rgba(255,255,255,0.10)",
  style
}: Props) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radii.pill,
          backgroundColor,
          borderColor,
          borderWidth: 1,
          alignItems: "center",
          justifyContent: "center"
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

