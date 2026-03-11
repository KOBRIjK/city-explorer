import { colors } from "../../theme/colors";
import type { PointSeed } from "./types";

export const pointSeeds: PointSeed[] = [
  {
    key: "park",
    title: "Park",
    subtitle: "Sample point",
    color: colors.accent,
    delta: { latitude: 0.005, longitude: 0.005 },
    meta: {
      category: "park",
      difficulty: "easy",
      rewardXp: 120,
      tags: ["walk", "green-zone"]
    }
  },
  {
    key: "center",
    title: "Center",
    subtitle: "Sample point",
    color: colors.warning,
    delta: { latitude: -0.004, longitude: -0.003 },
    meta: {
      category: "center",
      difficulty: "medium",
      rewardXp: 160,
      tags: ["landmark", "historic"]
    }
  }
];
