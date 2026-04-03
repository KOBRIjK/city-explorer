import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { fetchTasks } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { CloseButton } from "../components/CloseButton";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";
import type { ApiTask } from "../types/api";

type Nav = NativeStackNavigationProp<RootStackParamList, "TasksModal">;

function difficultyStyle(difficulty: ApiTask["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return { bg: "rgba(0,214,125,0.16)", border: "rgba(0,214,125,0.30)", text: colors.accent, label: "Лёгкое" };
    case "medium":
      return { bg: "rgba(255,176,32,0.14)", border: "rgba(255,176,32,0.30)", text: colors.warning, label: "Среднее" };
    case "hard":
      return { bg: "rgba(255,92,92,0.14)", border: "rgba(255,92,92,0.30)", text: colors.danger, label: "Сложное" };
  }
}

function taskIconName(icon: ApiTask["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "rocket":
      return "rocket-outline";
    case "barbell":
      return "barbell-outline";
    case "flame":
      return "flame-outline";
    case "people":
      return "people-outline";
    case "trophy":
      return "trophy-outline";
    default:
      return "flash-outline";
  }
}

function TaskCard({ task }: { task: ApiTask }) {
  const pill = difficultyStyle(task.difficulty);
  const percent = Math.round(task.progress * 100);

  return (
    <GlassCard style={styles.taskCard}>
      <View style={styles.taskTopRow}>
        <View style={styles.taskTitleRow}>
          <IconCircle
            size={40}
            backgroundColor="rgba(255,255,255,0.06)"
            borderColor="rgba(255,255,255,0.10)"
            style={{ marginRight: space.md }}
          >
            <Ionicons name={taskIconName(task.icon)} size={18} color={colors.accent2} />
          </IconCircle>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
          </View>
        </View>

        <View style={[styles.difficultyPill, { backgroundColor: pill.bg, borderColor: pill.border }]}>
          <Text style={[styles.difficultyText, { color: pill.text }]}>{pill.label}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{task.progress_text}</Text>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
      <ProgressBar value={task.progress} style={{ marginTop: space.sm }} />

      <View style={styles.rewardCard}>
        <Ionicons name="gift-outline" size={16} color={colors.accent} />
        <Text style={styles.rewardText}>{task.reward_text}</Text>
      </View>

      <View style={styles.taskFooterRow}>
        <View style={styles.footerMeta}>
          <Ionicons name="trophy-outline" size={14} color={colors.accent2} />
          <Text style={styles.footerMetaText}>+{task.reward_xp} XP</Text>
        </View>
        <View style={styles.footerMeta}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={[styles.footerMetaText, { color: colors.muted }]}>{task.time_left}</Text>
        </View>
        {task.status === "completed" ? (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>Готово</Text>
          </View>
        ) : null}
      </View>
    </GlassCard>
  );
}

export function TasksScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const authToken = token;

    let isMounted = true;

    async function loadTasks() {
      setIsLoading(true);
      setError(null);

      try {
        const nextTasks = await fetchTasks(authToken);
        if (isMounted) {
          setTasks(nextTasks);
        }
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "Не удалось загрузить задания.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const summary = useMemo(() => {
    const active = tasks.filter((task) => task.status !== "completed").length;
    const completedTasks = tasks.filter((task) => task.status === "completed");
    const completed = completedTasks.length;
    const earnedXp = completedTasks.reduce((sum, task) => sum + task.reward_xp, 0);
    return { active, completed, earnedXp };
  }, [tasks]);

  return (
    <Screen edges={["top", "bottom"]} style={{ flex: 1 }} contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Задания</Text>
          <Text style={styles.subtitle}>Все задания загружаются из backend и связаны с профилем пользователя.</Text>
        </View>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      {isLoading && tasks.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorTitle}>Не удалось загрузить задания</Text>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.lg }}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </ScrollView>
      )}

      <GlassCard style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>{summary.active}</Text>
          <Text style={styles.summaryLabel}>Активных</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryValue, { color: colors.accent2 }]}>{summary.completed}</Text>
          <Text style={styles.summaryLabel}>Выполнено</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>{summary.earnedXp}</Text>
          <Text style={styles.summaryLabel}>XP получено</Text>
        </View>
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.lg
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: space.lg
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    paddingRight: 10
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  errorCard: {
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.lg
  },
  errorTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  errorText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 18
  },
  taskCard: {
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.md
  },
  taskTopRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10
  },
  taskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  taskSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18
  },
  difficultyPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: "900"
  },
  progressRow: {
    marginTop: space.md,
    flexDirection: "row",
    alignItems: "center"
  },
  progressText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12
  },
  progressPercent: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "900"
  },
  rewardCard: {
    marginTop: space.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center"
  },
  rewardText: {
    color: colors.text,
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  },
  taskFooterRow: {
    marginTop: space.md,
    flexDirection: "row",
    alignItems: "center"
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: space.lg
  },
  footerMetaText: {
    color: colors.accent2,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6
  },
  completedBadge: {
    marginLeft: "auto",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(0,214,125,0.16)",
    borderColor: "rgba(0,214,125,0.30)",
    borderWidth: 1
  },
  completedBadgeText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "900"
  },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: space.md,
    borderRadius: radii.md
  },
  summaryCol: {
    alignItems: "center",
    justifyContent: "center"
  },
  summaryValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4
  }
});
