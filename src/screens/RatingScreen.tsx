import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CloseButton } from "../components/CloseButton";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { SegmentedControl } from "../components/SegmentedControl";
import { leaderboardWeek, type Leader } from "../data/mock";
import type { MainTabParamList } from "../navigation/types";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";
import { Screen } from "../components/Screen";

type Nav = BottomTabNavigationProp<MainTabParamList>;
type Period = "week" | "month" | "all";

function getBarHeight(value: number) {
  const base = 70;
  const extra = 120;
  return base + (value / 100) * extra;
}

function PodiumPerson({
  leader,
  place,
  highlight
}: {
  leader: Leader;
  place: 1 | 2 | 3;
  highlight?: boolean;
}) {
  const barHeight = getBarHeight(leader.discoveredPercent);

  return (
    <View style={[styles.podiumCol, highlight && { marginHorizontal: 8 }]}>
      <View style={styles.podiumTop}>
        {place === 1 ? (
          <Text style={styles.crown}>♛</Text>
        ) : (
          <View style={{ height: 18 }} />
        )}

        <View style={styles.podiumAvatarWrap}>
          <IconCircle
            size={highlight ? 62 : 54}
            backgroundColor="rgba(0,214,125,0.18)"
            borderColor="rgba(0,214,125,0.40)"
          >
            <Text style={styles.podiumInitials}>{leader.initials}</Text>
          </IconCircle>
          <View style={styles.placeBadge}>
            <Text style={styles.placeBadgeText}>{place}</Text>
          </View>
        </View>

        <Text style={styles.podiumName}>{leader.name}</Text>
        <Text style={styles.podiumPercent}>{leader.discoveredPercent}%</Text>
      </View>

      <LinearGradient
        colors={["rgba(0,214,125,0.28)", "rgba(0,214,125,0.04)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[styles.podiumBar, { height: barHeight }]}
      />
    </View>
  );
}

function LeaderRow({ leader, index }: { leader: Leader; index: number }) {
  return (
    <GlassCard style={styles.leaderRow}>
      <Text style={styles.leaderRank}>{index + 1}</Text>

      <IconCircle size={38} backgroundColor="rgba(255,255,255,0.08)" borderColor={colors.border}>
        <Text style={styles.leaderInitials}>{leader.initials}</Text>
      </IconCircle>

      <View style={{ flex: 1, marginLeft: space.md }}>
        <Text style={styles.leaderName}>{leader.name}</Text>
        <Text style={styles.leaderMeta}>{leader.discoveredPercent}% открыто</Text>
      </View>

      <Text style={styles.leaderXp}>≈ {leader.xp.toLocaleString("ru-RU")} XP</Text>
    </GlassCard>
  );
}

export function RatingScreen() {
  const navigation = useNavigation<Nav>();
  const [period, setPeriod] = useState<Period>("week");

  const data = useMemo(() => {
    if (period === "week") return leaderboardWeek;
    if (period === "month")
      return leaderboardWeek.map((l) => ({ ...l, xp: Math.round(l.xp * 2.1), discoveredPercent: l.discoveredPercent }));
    return leaderboardWeek.map((l) => ({ ...l, xp: Math.round(l.xp * 3.6), discoveredPercent: l.discoveredPercent }));
  }, [period]);

  const top3 = data.slice(0, 3);
  const rest = data.slice(3);

  return (
    <Screen scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Рейтинг</Text>
        <CloseButton onPress={() => navigation.navigate("Map")} />
      </View>

      <SegmentedControl
        options={[
          { key: "week", label: "Неделя" },
          { key: "month", label: "Месяц" },
          { key: "all", label: "Все время" }
        ]}
        value={period}
        onChange={setPeriod}
      />

      <View style={styles.podium}>
        <PodiumPerson leader={top3[1]} place={2} />
        <PodiumPerson leader={top3[0]} place={1} highlight />
        <PodiumPerson leader={top3[2]} place={3} />
      </View>

      <View style={{ marginTop: space.lg }}>
        {rest.map((l, i) => (
          <LeaderRow key={l.id} leader={l} index={i + 3} />
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
  podium: {
    marginTop: space.lg,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center"
  },
  podiumCol: {
    flex: 1,
    alignItems: "center"
  },
  podiumTop: {
    alignItems: "center",
    marginBottom: space.md
  },
  crown: {
    color: colors.accent2,
    fontSize: 18,
    marginBottom: 4
  },
  podiumAvatarWrap: {
    marginTop: 2
  },
  podiumInitials: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16
  },
  placeBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 99,
    backgroundColor: "rgba(7,11,22,0.70)",
    borderColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  placeBadgeText: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 12
  },
  podiumName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginTop: 10
  },
  podiumPercent: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  podiumBar: {
    width: "86%",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: "rgba(0,214,125,0.22)"
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.md
  },
  leaderRank: {
    width: 22,
    textAlign: "center",
    color: colors.accent,
    fontWeight: "900",
    marginRight: space.md
  },
  leaderInitials: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 12
  },
  leaderName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800"
  },
  leaderMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  leaderXp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800"
  }
});
