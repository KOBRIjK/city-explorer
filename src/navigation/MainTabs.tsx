import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import type { MainTabParamList } from "./types";
import { MapScreen } from "../screens/MapScreen";
import { PartnersScreen } from "../screens/PartnersScreen";
import { RatingScreen } from "../screens/RatingScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { colors } from "../theme/colors";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const iconName = (() => {
            switch (route.name) {
              case "Map":
                return focused ? "map" : "map-outline";
              case "Partners":
                return focused ? "gift" : "gift-outline";
              case "Rating":
                return focused ? "stats-chart" : "stats-chart-outline";
              case "Profile":
                return focused ? "person" : "person-outline";
              default:
                return "ellipse";
            }
          })();

          return <Ionicons name={iconName} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: "Карта" }} />
      <Tab.Screen
        name="Partners"
        component={PartnersScreen}
        options={{ tabBarLabel: "Партнёры" }}
      />
      <Tab.Screen name="Rating" component={RatingScreen} options={{ tabBarLabel: "Рейтинг" }} />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Профиль" }}
      />
    </Tab.Navigator>
  );
}

