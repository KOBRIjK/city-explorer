export type PointCategory = "park" | "center" | "landmark" | "sport" | "cybersport" | "custom";

export type PointDifficulty = "easy" | "medium" | "hard";

export type PointMeta = {
  category: PointCategory;
  difficulty: PointDifficulty;
  rewardXp: number;
  tags: string[];
};

export type PointSeed = {
  key: string;
  title: string;
  subtitle?: string;
  color: string;
  delta: {
    latitude: number;
    longitude: number;
  };
  meta: PointMeta;
};
