import type { Region } from "react-native-maps";

import { pointSeeds, type PointMeta } from "../data/points";
import { colors } from "../theme/colors";

const defaultRegion: Region = {
  latitude: 55.751244,
  longitude: 37.618423,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08
};

const customPointMeta: PointMeta = {
  category: "custom",
  difficulty: "medium",
  rewardXp: 100,
  tags: ["user"]
};

export const mapConfig = {
  defaultRegion,
  seedPoints: pointSeeds,
  customPoint: {
    titlePrefix: "Point",
    subtitle: "Added by long press",
    color: colors.accent2,
    meta: customPointMeta
  }
} as const;
