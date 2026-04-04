import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "../ProgressBar";
import { colors } from "../../theme/colors";
import { radii } from "../../theme/radii";
import { space } from "../../theme/spacing";
import type { ApiTask } from "../../types/api";

const TASK_DIFFICULTY_LABELS: Record<ApiTask["difficulty"], string> = {
  easy: "Лёгкое",
  medium: "Среднее",
  hard: "Сложное"
};

function difficultyPillStyle(difficulty: ApiTask["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return {
        backgroundColor: "rgba(89,197,145,0.10)",
        borderColor: "rgba(89,197,145,0.20)",
        color: colors.success
      };
    case "medium":
      return {
        backgroundColor: "rgba(255,176,32,0.12)",
        borderColor: "rgba(255,176,32,0.24)",
        color: colors.warning
      };
    case "hard":
      return {
        backgroundColor: "rgba(255,92,92,0.12)",
        borderColor: "rgba(255,92,92,0.24)",
        color: colors.danger
      };
  }
}

function taskStatusMeta(task: ApiTask) {
  if (task.status === "completed") {
    return {
      label: "Завершено",
      backgroundColor: "rgba(89,197,145,0.12)",
      borderColor: "rgba(89,197,145,0.20)",
      color: colors.success
    };
  }

  if (task.progress_value > 0) {
    return {
      label: "В процессе",
      backgroundColor: "rgba(255,176,32,0.12)",
      borderColor: "rgba(255,176,32,0.22)",
      color: colors.warning
    };
  }

  return {
    label: "Доступно",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
    color: colors.textSoft
  };
}

export function LocationTaskCard({ task }: { task: ApiTask }) {
  const difficultyStyle = difficultyPillStyle(task.difficulty);
  const statusStyle = taskStatusMeta(task);
  const progressPercent = Math.round(task.progress * 100);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{task.title}</Text>

        <View style={styles.rewardPill}>
          <Ionicons name="flash" size={13} color={colors.xp} />
          <Text style={styles.rewardPillText}>+{task.reward_xp} XP</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: difficultyStyle.backgroundColor,
              borderColor: difficultyStyle.borderColor
            }
          ]}
        >
          <Text style={[styles.badgeText, { color: difficultyStyle.color }]}>
            {TASK_DIFFICULTY_LABELS[task.difficulty]}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            styles.statusBadge,
            {
              backgroundColor: statusStyle.backgroundColor,
              borderColor: statusStyle.borderColor
            }
          ]}
        >
          <Text style={[styles.badgeText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>{task.subtitle}</Text>

      <View style={styles.progressHeader}>
        <Text style={styles.progressText}>{task.progress_text}</Text>

        <View style={styles.progressMetaGroup}>
          <Ionicons name="time-outline" size={13} color={colors.muted} />
          <Text style={styles.progressMetaText}>{task.time_left}</Text>
          <View style={styles.progressMetaDivider} />
          <Ionicons name="analytics-outline" size={13} color={colors.muted} />
          <Text style={styles.progressMetaText}>{progressPercent}%</Text>
        </View>
      </View>

      <ProgressBar
        value={task.progress}
        height={6}
        fillColors={[colors.ctaStart, colors.success]}
        style={{ marginTop: 10 }}
      />

      <View style={styles.bonusCard}>
        <Ionicons name="gift-outline" size={15} color={colors.textSoft} />
        <Text style={styles.bonusText}>{task.reward_text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: space.md,
    padding: 15,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,16,31,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)"
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  title: {
    flex: 1,
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 21,
    paddingRight: space.sm
  },
  rewardPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: "rgba(201,231,117,0.10)",
    borderWidth: 1,
    borderColor: "rgba(201,231,117,0.16)"
  },
  rewardPillText: {
    color: colors.xp,
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 6
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10
  },
  badge: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  statusBadge: {
    marginLeft: 8
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900"
  },
  subtitle: {
    color: "rgba(230,237,248,0.74)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10
  },
  progressHeader: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "flex-start"
  },
  progressText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    paddingRight: space.sm
  },
  progressMetaGroup: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  progressMetaText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 4
  },
  progressMetaDivider: {
    width: 1,
    height: 10,
    marginHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.10)"
  },
  bonusCard: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)"
  },
  bonusText: {
    flex: 1,
    color: "rgba(230,237,248,0.78)",
    fontSize: 12,
    lineHeight: 19,
    marginLeft: 8
  }
});
