import type { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { ScreenBackground } from "./ScreenBackground";

type Props = PropsWithChildren<{
  scroll?: boolean;
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  scroll,
  edges = ["top"],
  style,
  contentContainerStyle
}: Props) {
  return (
    <ScreenBackground>
      <SafeAreaView style={[{ flex: 1 }, style]} edges={edges}>
        {scroll ? (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, contentContainerStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

