import { colors } from "../theme/colors";

export const mainTabBarStyle = {
  backgroundColor: colors.tabBar,
  borderTopColor: colors.border,
  borderTopWidth: 1,
  height: 72,
  paddingTop: 8,
  paddingBottom: 12
} as const;

export const hiddenMainTabBarStyle = {
  ...mainTabBarStyle,
  display: "none"
} as const;
