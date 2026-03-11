export type Partner = {
  id: string;
  name: string;
  category: string;
  offer: string;
  tag: string;
  distanceKm: number;
  bonus: number;
  icon:
    | "basketball"
    | "cafe"
    | "barbell"
    | "bicycle"
    | "book"
    | "storefront"
    | "gift";
  color: string;
};

export const partners: Partner[] = [
  {
    id: "sportmaster",
    name: "Спортмастер",
    category: "Спорт",
    offer: "Скидка на кроссовки",
    tag: "15%",
    distanceKm: 0.8,
    bonus: 100,
    icon: "basketball",
    color: "#00D67D"
  },
  {
    id: "coffee",
    name: "Кофейня",
    category: "Еда и напитки",
    offer: "Кофе в подарок",
    tag: "Бесплатно",
    distanceKm: 0.3,
    bonus: 50,
    icon: "cafe",
    color: "#FF7A00"
  },
  {
    id: "fitness",
    name: "Фитнес-клуб",
    category: "Спорт",
    offer: "Пробная тренировка",
    tag: "Бесплатно",
    distanceKm: 1.2,
    bonus: 150,
    icon: "barbell",
    color: "#2E7DFF"
  },
  {
    id: "bike",
    name: "Велопрокат",
    category: "Активность",
    offer: "30 минут катания",
    tag: "50%",
    distanceKm: 0.5,
    bonus: 80,
    icon: "bicycle",
    color: "#00D67D"
  },
  {
    id: "books",
    name: "Книжный магазин",
    category: "Культура",
    offer: "Скидка на книги",
    tag: "10%",
    distanceKm: 1.5,
    bonus: 60,
    icon: "book",
    color: "#B000FF"
  }
];

export type Leader = {
  id: string;
  name: string;
  initials: string;
  discoveredPercent: number;
  xp: number;
};

export const leaderboardWeek: Leader[] = [
  { id: "elena", name: "Елена", initials: "ЕС", discoveredPercent: 87, xp: 11240 },
  { id: "dmitry", name: "Дмитрий", initials: "ДП", discoveredPercent: 82, xp: 10610 },
  { id: "maria", name: "Мария", initials: "МК", discoveredPercent: 78, xp: 9840 },
  {
    id: "you",
    name: "Александр Иванов (Вы)",
    initials: "АИ",
    discoveredPercent: 67,
    xp: 9320
  },
  { id: "olga", name: "Ольга Новикова", initials: "ОН", discoveredPercent: 64, xp: 8900 },
  { id: "sergey", name: "Сергей Морозов", initials: "СМ", discoveredPercent: 61, xp: 8500 },
  { id: "anna", name: "Анна Волкова", initials: "АВ", discoveredPercent: 58, xp: 7850 },
  { id: "igor", name: "Игорь Соколов", initials: "ИС", discoveredPercent: 55, xp: 7200 }
];

export type TaskDifficulty = "Легко" | "Средне" | "Сложно";

export type Task = {
  id: string;
  title: string;
  subtitle: string;
  difficulty: TaskDifficulty;
  progress: number;
  progressText: string;
  rewardXp: number;
  timeLeft: string;
  icon: "leaf" | "moon" | "business" | "sunny";
};

export const tasks: Task[] = [
  {
    id: "park",
    title: "Исследователь парка",
    subtitle: "Пройди 5 км в парке Горького",
    difficulty: "Легко",
    progress: 0.64,
    progressText: "Прогресс: 3,2 / 5",
    rewardXp: 250,
    timeLeft: "2 дня",
    icon: "leaf"
  },
  {
    id: "night",
    title: "Ночной бегун",
    subtitle: "Пробеги 3 км после 21:00",
    difficulty: "Средне",
    progress: 0.0,
    progressText: "Прогресс: 0 / 3",
    rewardXp: 350,
    timeLeft: "5 часов",
    icon: "moon"
  },
  {
    id: "center",
    title: "Покоритель центра",
    subtitle: "Открой 10 новых локаций в центре города",
    difficulty: "Сложно",
    progress: 0.7,
    progressText: "Прогресс: 7 / 10",
    rewardXp: 500,
    timeLeft: "1 день",
    icon: "business"
  },
  {
    id: "morning",
    title: "Утренняя активность",
    subtitle: "Сделай 10 000 шагов до 12:00",
    difficulty: "Легко",
    progress: 0.64,
    progressText: "Прогресс: 6 420 / 10 000",
    rewardXp: 200,
    timeLeft: "3 часа",
    icon: "sunny"
  }
];

export type Achievement = {
  id: string;
  title: string;
  icon: "walk" | "map" | "run" | "moon" | "trophy" | "diamond";
  tone: "green" | "dark";
};

export const achievements: Achievement[] = [
  { id: "first", title: "Первый шаг", icon: "walk", tone: "green" },
  { id: "explorer", title: "Исследователь", icon: "map", tone: "green" },
  { id: "marathon", title: "Марафонец", icon: "run", tone: "green" },
  { id: "night", title: "Ночной бегун", icon: "moon", tone: "dark" },
  { id: "legend", title: "Легенда", icon: "trophy", tone: "dark" },
  { id: "collector", title: "Коллекционер", icon: "diamond", tone: "dark" }
];

