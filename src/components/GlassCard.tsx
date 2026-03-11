import type { PropsWithChildren } from "react";
import { View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/radii";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function GlassCard({ children, style }: Props) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.md
        },
        style
      ]}
    >
      {children}
    </View>
  );
}

