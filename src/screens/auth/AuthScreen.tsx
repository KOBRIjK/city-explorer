import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { GlassCard } from "../../components/GlassCard";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../auth/AuthContext";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { space } from "../../theme/spacing";

type AuthMode = "login" | "register";

export function AuthScreen() {
  const { isSubmitting, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("demo@cityexplorer.local");
  const [password, setPassword] = useState("demo12345");
  const [fullName, setFullName] = useState("");
  const [city, setCity] = useState("Казань");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);

    try {
      if (mode === "login") {
        await signIn({ email, password });
        return;
      }

      await signUp({
        full_name: fullName.trim(),
        city: city.trim() || "Казань",
        email: email.trim(),
        password
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Не удалось выполнить авторизацию.");
    }
  };

  return (
    <Screen style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>City Explorer</Text>
        <Text style={styles.title}>Backend теперь работает через FastAPI и SQLite</Text>
        <Text style={styles.subtitle}>
          Войди под демо-пользователем или создай свой аккаунт, чтобы получить данные объектов,
          задания и достижения из базы.
        </Text>
      </View>

      <GlassCard style={styles.card}>
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("login")}
            style={[styles.modeButton, mode === "login" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, mode === "login" && styles.modeTextActive]}>Вход</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("register")}
            style={[styles.modeButton, mode === "register" && styles.modeButtonActive]}
          >
            <Text style={[styles.modeText, mode === "register" && styles.modeTextActive]}>Регистрация</Text>
          </Pressable>
        </View>

        {mode === "register" ? (
          <>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Имя"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="words"
            />
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Город"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCapitalize="words"
            />
          </>
        ) : null}

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Пароль"
          placeholderTextColor={colors.muted}
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable onPress={submit} disabled={isSubmitting}>
          <LinearGradient
            colors={[colors.accent2, colors.accent]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.submitButton, isSubmitting && { opacity: 0.6 }]}
          >
            {isSubmitting ? <ActivityIndicator color="#07321D" /> : null}
            <Text style={styles.submitText}>{mode === "login" ? "Войти" : "Создать аккаунт"}</Text>
          </LinearGradient>
        </Pressable>

        <Text style={styles.hint}>
          Демо-доступ: `demo@cityexplorer.local` / `demo12345`
        </Text>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: space.lg
  },
  hero: {
    marginBottom: space.xl
  },
  kicker: {
    color: colors.accent2,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: space.sm
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space.md
  },
  card: {
    padding: space.lg,
    borderRadius: radii.md
  },
  modeRow: {
    flexDirection: "row",
    marginBottom: space.lg
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.pill,
    alignItems: "center"
  },
  modeButtonActive: {
    backgroundColor: "rgba(255,255,255,0.08)"
  },
  modeText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "800"
  },
  modeTextActive: {
    color: colors.text
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    color: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: space.md
  },
  submitButton: {
    minHeight: 52,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row"
  },
  submitText: {
    color: "#07321D",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: space.md
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: space.md
  }
});
