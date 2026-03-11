import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { CloseButton } from "../components/CloseButton";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { tasks, type Task, type TaskDifficulty } from "../data/mock";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";

type Nav = NativeStackNavigationProp<RootStackParamList, "TasksModal">;

function difficultyStyle(difficulty: TaskDifficulty) {
  switch (difficulty) {
    case "Легко":
      return { bg: "rgba(0,214,125,0.16)", border: "rgba(0,214,125,0.30)", text: colors.accent };
    case "Средне":
      return { bg: "rgba(255,176,32,0.14)", border: "rgba(255,176,32,0.30)", text: colors.warning };
    case "Сложно":
      return { bg: "rgba(255,92,92,0.14)", border: "rgba(255,92,92,0.30)", text: colors.danger };
  }
}

function taskIconName(icon: Task["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "leaf":
      return "leaf-outline";
    case "moon":
      return "moon-outline";
    case "business":
      return "business-outline";
    case "sunny":
      return "sunny-outline";
  }
}

function TaskCard({ task }: { task: Task }) {
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
          <Text style={[styles.difficultyText, { color: pill.text }]}>{task.difficulty}</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressText}>{task.progressText}</Text>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>
      <ProgressBar value={task.progress} style={{ marginTop: space.sm }} />

      <View style={styles.taskFooterRow}>
        <View style={styles.footerMeta}>
          <Ionicons name="trophy-outline" size={14} color={colors.accent2} />
          <Text style={styles.footerMetaText}>+{task.rewardXp} XP</Text>
        </View>
        <View style={styles.footerMeta}>
          <Ionicons name="time-outline" size={14} color={colors.muted} />
          <Text style={[styles.footerMetaText, { color: colors.muted }]}>{task.timeLeft}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ marginLeft: "auto" }} />
      </View>
    </GlassCard>
  );
}

export function TasksScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen edges={["top", "bottom"]} style={{ flex: 1 }} contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Задания</Text>
          <Text style={styles.subtitle}>Выполняй задания и зарабатывай очки опыта</Text>
        </View>
        <CloseButton onPress={() => navigation.goBack()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: space.lg }}>
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} />
        ))}
      </ScrollView>

      <GlassCard style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>Активных</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryValue, { color: colors.accent2 }]}>12</Text>
          <Text style={styles.summaryLabel}>Выполнено</Text>
        </View>
        <View style={styles.summaryCol}>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>3.2K</Text>
          <Text style={styles.summaryLabel}>Всего XP</Text>
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
    marginTop: 4
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
