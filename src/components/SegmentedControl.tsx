import type { PropsWithChildren } from "react";
import { Pressable, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { radii } from "../theme/radii";

type Option<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = PropsWithChildren<{
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}>;

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        borderRadius: radii.pill,
        backgroundColor: colors.card2,
        borderWidth: 1,
        borderColor: colors.border
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: radii.pill,
              backgroundColor: active ? "rgba(0,214,125,0.18)" : "transparent",
              borderWidth: active ? 1 : 0,
              borderColor: active ? "rgba(0,214,125,0.40)" : "transparent"
            }}
          >
            <Text
              style={{
                color: active ? colors.text : colors.muted,
                fontSize: 12,
                fontWeight: "600",
                textAlign: "center"
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

