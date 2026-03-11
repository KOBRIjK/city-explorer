import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";

import type { MainTabParamList } from "../navigation/types";
import { partners, type Partner } from "../data/mock";
import { CloseButton } from "../components/CloseButton";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { Screen } from "../components/Screen";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";

type Nav = BottomTabNavigationProp<MainTabParamList>;

function partnerIconName(icon: Partner["icon"]): keyof typeof Ionicons.glyphMap {
  switch (icon) {
    case "basketball":
      return "basketball-outline";
    case "cafe":
      return "cafe-outline";
    case "barbell":
      return "barbell-outline";
    case "bicycle":
      return "bicycle-outline";
    case "book":
      return "book-outline";
    case "storefront":
      return "storefront-outline";
    case "gift":
      return "gift-outline";
  }
}

function PartnerCard({ item }: { item: Partner }) {
  const tagIsPercent = item.tag.includes("%");
  return (
    <GlassCard style={styles.partnerCard}>
      <View style={styles.partnerHeaderRow}>
        <IconCircle
          size={46}
          backgroundColor={`${item.color}22`}
          borderColor={`${item.color}44`}
          style={{ marginRight: space.md }}
        >
          <Ionicons name={partnerIconName(item.icon)} size={22} color={item.color} />
        </IconCircle>

        <View style={{ flex: 1 }}>
          <Text style={styles.partnerName}>{item.name}</Text>
          <Text style={styles.partnerCategory}>{item.category}</Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      </View>

      <View style={styles.offerRow}>
        <Text style={styles.offerText}>{item.offer}</Text>
        <View
          style={[
            styles.offerTag,
            tagIsPercent
              ? { backgroundColor: "rgba(0,214,125,0.16)", borderColor: "rgba(0,214,125,0.28)" }
              : { backgroundColor: "rgba(0,214,125,0.14)", borderColor: "rgba(0,214,125,0.18)" }
          ]}
        >
          <Text style={styles.offerTagText}>{item.tag}</Text>
        </View>
      </View>

      <View style={styles.partnerFooterRow}>
        <View style={styles.partnerMeta}>
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text style={styles.partnerMetaText}>{item.distanceKm.toFixed(1)} км</Text>
        </View>
        <View style={styles.partnerMeta}>
          <Ionicons name="sparkles-outline" size={14} color={colors.accent} />
          <Text style={[styles.partnerMetaText, { color: colors.accent }]}>+{item.bonus} баллов</Text>
        </View>
      </View>
    </GlassCard>
  );
}

export function PartnersScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <Screen scroll contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Партнёры <Text style={{ color: colors.accent }}>✦</Text>
          </Text>
          <Text style={styles.subtitle}>Посещай партнёрские точки и получай бонусы</Text>
        </View>
        <CloseButton onPress={() => navigation.navigate("Map")} />
      </View>

      <LinearGradient
        colors={["#00D67D", "#00A85F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.bonusCard}
      >
        <View style={styles.bonusLeft}>
          <View style={styles.bonusLabelRow}>
            <Ionicons name="gift-outline" size={16} color="#052012" />
            <Text style={styles.bonusLabel}>Ваши бонусы</Text>
          </View>
          <Text style={styles.bonusValue}>420 баллов</Text>
        </View>
        <Pressable accessibilityRole="button" style={styles.useBtn}>
          <Text style={styles.useBtnText}>Использовать</Text>
        </Pressable>
      </LinearGradient>

      <View style={{ marginTop: space.lg }}>
        {partners.map((p) => (
          <PartnerCard key={p.id} item={p} />
        ))}
      </View>

      <Text style={styles.footerHint}>Посети партнёрские точки на карте и получи бонусные баллы</Text>
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
  bonusCard: {
    borderRadius: radii.md,
    padding: space.lg,
    flexDirection: "row",
    alignItems: "center"
  },
  bonusLeft: {
    flex: 1
  },
  bonusLabelRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  bonusLabel: {
    color: "#052012",
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700"
  },
  bonusValue: {
    color: "#052012",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 6
  },
  useBtn: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.pill
  },
  useBtnText: {
    color: "#052012",
    fontSize: 12,
    fontWeight: "800"
  },
  partnerCard: {
    padding: space.lg,
    borderRadius: radii.md,
    marginBottom: space.md
  },
  partnerHeaderRow: {
    flexDirection: "row",
    alignItems: "center"
  },
  partnerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  partnerCategory: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  offerRow: {
    marginTop: space.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderRadius: radii.md,
    padding: space.md,
    flexDirection: "row",
    alignItems: "center"
  },
  offerText: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    paddingRight: 10
  },
  offerTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1
  },
  offerTagText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "800"
  },
  partnerFooterRow: {
    marginTop: space.md,
    flexDirection: "row",
    alignItems: "center"
  },
  partnerMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: space.lg
  },
  partnerMetaText: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "700"
  },
  footerHint: {
    color: "rgba(143,161,191,0.75)",
    fontSize: 11,
    textAlign: "center",
    marginTop: space.xl
  }
});
