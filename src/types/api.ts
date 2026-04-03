export type ApiUser = {
  id: number;
  email: string;
  full_name: string;
  city: string;
  level: number;
  xp: number;
  xp_next_level: number;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: ApiUser;
};

export type LocationActivity = {
  id: number;
  title: string;
};

export type ApiLocation = {
  id: number;
  slug: string;
  title: string;
  short_description: string;
  description: string;
  address: string;
  color: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  reward_xp: number;
  latitude: number;
  longitude: number;
  activities: LocationActivity[];
};

export type ApiTask = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  difficulty: "easy" | "medium" | "hard";
  reward_xp: number;
  reward_text: string;
  time_left: string;
  icon: string;
  progress: number;
  progress_value: number;
  progress_target: number;
  progress_text: string;
  status: "active" | "completed";
  location_id: number | null;
};

export type ApiAchievement = {
  id: number;
  slug: string;
  title: string;
  description: string;
  condition_text: string;
  icon: string;
  tone: "green" | "dark";
  earned: boolean;
};

export type ApiProfile = {
  user: ApiUser;
  active_days: number;
  total_steps: number;
  total_distance_km: number;
  discovered_percent: number;
  districts_explored: number;
  locations_discovered: number;
  secrets_found: number;
  unlocked_achievements: number;
  total_achievements: number;
};
