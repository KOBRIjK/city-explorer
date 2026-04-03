import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme/colors";
import type { RootStackParamList } from "./types";
import { MainTabs } from "./MainTabs";
import { TasksScreen } from "../screens/TasksScreen";
import { AuthScreen } from "../screens/auth/AuthScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isSubmitting, user } = useAuth();

  if (isSubmitting && !user) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg0 }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="TasksModal"
            component={TasksScreen}
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} />
      )}
    </Stack.Navigator>
  );
}
