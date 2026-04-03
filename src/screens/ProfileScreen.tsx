import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { fetchAchievements, fetchProfile } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { ProgressBar } from "../components/ProgressBar";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";
import type { ApiAchievement, ApiProfile } from "../types/api";

function achievementIconName(icon: ApiAchievement["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "search":
      return "search-outline";
    case "phone":
      return "phone-portrait-outline";
    case "trophy":
      return "trophy-outline";
    default:
      return "ribbon-outline";
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function initials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
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

function AchievementTile({ item }: { item: ApiAchievement }) {
  const gradient =
    item.earned
      ? (["#00D67D", "#A6FF00"] as const)
      : (["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"] as const);

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.achievementTile}>
      <Ionicons
        name={achievementIconName(item.icon)}
        size={22}
        color={item.earned ? "#07321D" : colors.accent2}
      />
      <Text style={[styles.achievementText, item.earned ? { color: "#07321D" } : { color: colors.text }]}>
        {item.title}
      </Text>
      <Text style={[styles.achievementHint, item.earned ? { color: "#07321D" } : { color: colors.muted }]}>
        {item.description}
      </Text>
    </LinearGradient>
  );
}

export function ProfileScreen() {
  const { signOut, token } = useAuth();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [achievements, setAchievements] = useState<ApiAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const authToken = token;

    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextProfile, nextAchievements] = await Promise.all([
          fetchProfile(authToken),
          fetchAchievements(authToken)
        ]);

        if (!isMounted) return;
        setProfile(nextProfile);
        setAchievements(nextAchievements);
      } catch (nextError) {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "Не удалось загрузить профиль.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const progress = useMemo(() => {
    if (!profile) return 0;
    return profile.user.xp_next_level > 0 ? profile.user.xp / profile.user.xp_next_level : 0;
  }, [profile]);

  return (
    <Screen scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Профиль</Text>
        <Pressable onPress={signOut} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={16} color={colors.text} />
          <Text style={styles.logoutText}>Выйти</Text>
        </Pressable>
      </View>

      {isLoading && !profile ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error ? (
        <GlassCard style={styles.errorCard}>
          <Text style={styles.errorTitle}>Не удалось загрузить профиль</Text>
          <Text style={styles.errorText}>{error}</Text>
        </GlassCard>
      ) : profile ? (
        <>
          <View style={styles.profileTop}>
            <IconCircle size={72} backgroundColor={colors.accent} borderColor="rgba(0,0,0,0)">
              <Text style={styles.avatarText}>{initials(profile.user.full_name)}</Text>
            </IconCircle>
            <Text style={styles.name}>{profile.user.full_name}</Text>
            <Text style={styles.location}>{profile.user.city}</Text>
          </View>

          <GlassCard style={styles.levelCard}>
            <View style={styles.levelRow}>
              <View style={styles.levelLeft}>
                <IconCircle size={34} backgroundColor="rgba(166,255,0,0.15)" borderColor="rgba(166,255,0,0.30)">
                  <Ionicons name="star-outline" size={18} color={colors.accent2} />
                </IconCircle>
                <View style={{ marginLeft: space.md }}>
                  <Text style={styles.levelTitle}>Уровень {profile.user.level}</Text>
                  <Text style={styles.levelSub}>Данные профиля подтягиваются из SQLite</Text>
                </View>
              </View>
              <Text style={styles.levelXp}>
                {formatNumber(profile.user.xp)} / {formatNumber(profile.user.xp_next_level)} XP
              </Text>
            </View>
            <ProgressBar value={progress} style={{ marginTop: space.md }} />
          </GlassCard>

          <Text style={styles.sectionTitle}>
            <Ionicons name="location-outline" size={14} color={colors.accent} /> Исследование города
          </Text>
          <GlassCard style={styles.exploreCard}>
            <View style={styles.exploreHeaderRow}>
              <Text style={styles.exploreLabel}>Открыто территории</Text>
              <Text style={styles.exploreValue}>{profile.discovered_percent}%</Text>
            </View>
            <ProgressBar value={profile.discovered_percent / 100} style={{ marginTop: space.md }} />

            <View style={styles.exploreStatsRow}>
              <View style={styles.exploreStat}>
                <Text style={styles.exploreStatValue}>{profile.districts_explored}</Text>
                <Text style={styles.exploreStatLabel}>Районов</Text>
              </View>
              <View style={styles.exploreStat}>
                <Text style={styles.exploreStatValue}>{profile.locations_discovered}</Text>
                <Text style={styles.exploreStatLabel}>Локаций</Text>
              </View>
              <View style={styles.exploreStat}>
                <Text style={styles.exploreStatValue}>{profile.secrets_found}</Text>
                <Text style={styles.exploreStatLabel}>Секретов</Text>
              </View>
            </View>
          </GlassCard>

          <Text style={styles.sectionTitle}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.accent} /> Статистика
          </Text>
          <View style={styles.statsGrid}>
            <View style={{ flexDirection: "row" }}>
              <StatTile icon="radio-button-on-outline" value={formatNumber(profile.total_steps)} label="Всего шагов" />
              <View style={{ width: space.md }} />
              <StatTile icon="trending-up-outline" value={`${formatNumber(profile.total_distance_km)} км`} label="Дистанция" />
            </View>
            <View style={{ height: space.md }} />
            <View style={{ flexDirection: "row" }}>
              <StatTile icon="flash-outline" value={String(profile.active_days)} label="Активных дней" />
              <View style={{ width: space.md }} />
              <StatTile
                icon="ribbon-outline"
                value={`${profile.unlocked_achievements}/${profile.total_achievements}`}
                label="Достижения"
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            <Ionicons name="trophy-outline" size={14} color={colors.accent2} /> Достижения
          </Text>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementWrap}>
                <AchievementTile item={achievement} />
              </View>
            ))}
          </View>
        </>
      ) : null}
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
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.04)"
  },
  logoutText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6
  },
  loadingState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center"
  },
  errorCard: {
    padding: space.lg,
    borderRadius: radii.md
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
    width: "50%",
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
    minHeight: 150
  },
  achievementText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "900"
  },
  achievementHint: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 11,
    lineHeight: 16
  }
});
