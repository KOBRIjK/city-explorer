import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

import type { MainTabParamList } from "../navigation/types";
import { achievements, type Achievement } from "../data/mock";
import { CloseButton } from "../components/CloseButton";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";

type Nav = BottomTabNavigationProp<MainTabParamList>;

function achievementIconName(icon: Achievement["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "walk":
      return "footsteps-outline";
    case "map":
      return "map-outline";
    case "run":
      return "walk-outline";
    case "moon":
      return "moon-outline";
    case "trophy":
      return "trophy-outline";
    case "diamond":
      return "diamond-outline";
  }
}

function StatTile({
  icon,
  value,
  label
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <GlassCard style={styles.statTile}>
      <Ionicons name={icon} size={18} color={colors.accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </GlassCard>
  );
}

function AchievementTile({ item }: { item: Achievement }) {
  const gradient =
    item.tone === "green"
      ? (["#00D67D", "#A6FF00"] as const)
      : (["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"] as const);

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.achievementTile}>
      <Ionicons
        name={achievementIconName(item.icon)}
        size={22}
        color={item.tone === "green" ? "#07321D" : colors.accent2}
      />
      <Text style={[styles.achievementText, item.tone === "green" ? { color: "#07321D" } : { color: colors.text }]}>
        {item.title}
      </Text>
    </LinearGradient>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Профиль</Text>
        <CloseButton onPress={() => navigation.navigate("Map")} />
      </View>

      <View style={styles.profileTop}>
        <IconCircle size={72} backgroundColor={colors.accent} borderColor="rgba(0,0,0,0)">
          <Text style={styles.avatarText}>АИ</Text>
        </IconCircle>
        <Text style={styles.name}>Александр Иванов</Text>
        <Text style={styles.location}>Москва, Россия</Text>
      </View>

      <GlassCard style={styles.levelCard}>
        <View style={styles.levelRow}>
          <View style={styles.levelLeft}>
            <IconCircle size={34} backgroundColor="rgba(166,255,0,0.15)" borderColor="rgba(166,255,0,0.30)">
              <Ionicons name="star-outline" size={18} color={colors.accent2} />
            </IconCircle>
            <View style={{ marginLeft: space.md }}>
              <Text style={styles.levelTitle}>Уровень 12</Text>
              <Text style={styles.levelSub}>Активный исследователь</Text>
            </View>
          </View>
          <Text style={styles.levelXp}>3 250 / 5 000 XP</Text>
        </View>
        <ProgressBar value={0.65} style={{ marginTop: space.md }} />
      </GlassCard>

      <Text style={styles.sectionTitle}>
        <Ionicons name="location-outline" size={14} color={colors.accent} /> Исследование города
      </Text>
      <GlassCard style={styles.exploreCard}>
        <View style={styles.exploreHeaderRow}>
          <Text style={styles.exploreLabel}>Открыто территории</Text>
          <Text style={styles.exploreValue}>67%</Text>
        </View>
        <ProgressBar value={0.67} style={{ marginTop: space.md }} />

        <View style={styles.exploreStatsRow}>
          <View style={styles.exploreStat}>
            <Text style={styles.exploreStatValue}>8</Text>
            <Text style={styles.exploreStatLabel}>Районов</Text>
          </View>
          <View style={styles.exploreStat}>
            <Text style={styles.exploreStatValue}>142</Text>
            <Text style={styles.exploreStatLabel}>Локаций</Text>
          </View>
          <View style={styles.exploreStat}>
            <Text style={styles.exploreStatValue}>23</Text>
            <Text style={styles.exploreStatLabel}>Секретов</Text>
          </View>
        </View>
      </GlassCard>

      <Text style={styles.sectionTitle}>
        <Ionicons name="stats-chart-outline" size={14} color={colors.accent} /> Статистика
      </Text>
      <View style={styles.statsGrid}>
        <View style={{ flexDirection: "row" }}>
          <StatTile icon="radio-button-on-outline" value="847K" label="Всего шагов" />
          <View style={{ width: space.md }} />
          <StatTile icon="trending-up-outline" value="342 км" label="Дистанция" />
        </View>
        <View style={{ height: space.md }} />
        <View style={{ flexDirection: "row" }}>
          <StatTile icon="flash-outline" value="45" label="Активных дней" />
          <View style={{ width: space.md }} />
          <StatTile icon="ribbon-outline" value="3/24" label="Достижения" />
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        <Ionicons name="trophy-outline" size={14} color={colors.accent2} /> Достижения
      </Text>
      <View style={styles.achievementsGrid}>
        {achievements.map((a) => (
          <View key={a.id} style={styles.achievementWrap}>
            <AchievementTile item={a} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: 120
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.lg
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  profileTop: {
    alignItems: "center",
    marginBottom: space.lg
  },
  avatarText: {
    color: "#07321D",
    fontSize: 20,
    fontWeight: "900"
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12
  },
  location: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6
  },
  levelCard: {
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.lg
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  levelLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center"
  },
  levelTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  levelSub: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  levelXp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: space.md
  },
  exploreCard: {
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.lg
  },
  exploreHeaderRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  exploreLabel: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700"
  },
  exploreValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  exploreStatsRow: {
    marginTop: space.lg,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  exploreStat: {
    alignItems: "center",
    flex: 1
  },
  exploreStatValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  exploreStatLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4
  },
  statsGrid: {
    marginBottom: space.lg
  },
  statTile: {
    flex: 1,
    padding: space.lg,
    borderRadius: radii.md
  },
  statValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12
  },
  statLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4
  },
  achievementsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: space.md
  },
  achievementWrap: {
    width: "33.3333%",
    paddingRight: 10,
    paddingBottom: 10
  },
  achievementTile: {
    borderRadius: radii.md,
    padding: space.lg,
    alignItems: "center",
    justifyContent: "center",
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    minHeight: 110
  },
  achievementText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "900"
  }
});
