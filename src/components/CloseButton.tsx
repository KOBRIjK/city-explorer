import { Ionicons } from "@expo/vector-icons";
import { Pressable } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

import { colors } from "../theme/colors";
import { IconCircle } from "./IconCircle";

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function CloseButton({ onPress, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Закрыть"
      style={style}
      hitSlop={10}
    >
      <IconCircle size={36} backgroundColor="rgba(255,255,255,0.06)" borderColor={colors.border}>
        <Ionicons name="close" size={18} color={colors.muted} />
      </IconCircle>
    </Pressable>
  );
}

