import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, {
  Marker,
  type LatLng
} from "react-native-maps";

import { fetchLocations, fetchTasks } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { Screen } from "../components/Screen";
import { mapConfig } from "../config/mapConfig";
import type { PointMeta } from "../data/points";
import { colors } from "../theme/colors";
import { radii } from "../theme/radii";
import { space } from "../theme/spacing";
import type { ApiLocation, ApiTask } from "../types/api";

type Place = {
  id: string;
  backendId?: number;
  slug?: string;
  title: string;
  subtitle?: string;
  description?: string;
  address?: string;
  activities: string[];
  photos: ImageSourcePropType[];
  coordinate: LatLng;
  color: string;
  isCustom: boolean;
  meta: PointMeta;
};

const GOOGLE_MAP_HIDE_POI_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
] as any;

const CATEGORY_LABELS: Record<PointMeta["category"], string> = {
  park: "Парк",
  center: "Центр",
  landmark: "Локация",
  sport: "Спорт",
  cybersport: "Киберспорт",
  custom: "Своя точка"
};

const DIFFICULTY_LABELS: Record<PointMeta["difficulty"], string> = {
  easy: "Лёгкая",
  medium: "Средняя",
  hard: "Сложная"
};

const TASK_DIFFICULTY_LABELS: Record<ApiTask["difficulty"], string> = {
  easy: "Лёгкое",
  medium: "Среднее",
  hard: "Сложное"
};

const LOCATION_PHOTOS: Record<string, ImageSourcePropType[]> = {
  "rukh-fight-club": [
    require("../assets/rukh/image4.jpeg"),
    require("../assets/rukh/image5.jpeg")
  ],
  "rukh-cyberarena": [require("../assets/rukh/image6.jpeg")]
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCoords({ latitude, longitude }: LatLng) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function formatPointMeta(meta: PointMeta) {
  return `${CATEGORY_LABELS[meta.category]} • ${DIFFICULTY_LABELS[meta.difficulty]} • ${meta.rewardXp} XP`;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceBetweenMeters(from: LatLng, to: LatLng) {
  const earthRadiusM = 6371000;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
}

function formatDistance(distanceM: number) {
  if (distanceM < 1000) return `${Math.round(distanceM)} м`;
  return `${(distanceM / 1000).toFixed(1)} км`;
}

function estimateWalkEtaMinutes(distanceM: number) {
  return Math.max(1, Math.round(distanceM / 80));
}

function toMeta(location: ApiLocation): PointMeta {
  return {
    category: location.category === "sport" ? "sport" : location.category === "cybersport" ? "cybersport" : "landmark",
    difficulty: location.difficulty,
    rewardXp: location.reward_xp,
    tags: location.activities.map((item) => item.title)
  };
}

function toPlace(location: ApiLocation): Place {
  return {
    id: `api-${location.id}`,
    backendId: location.id,
    slug: location.slug,
    title: location.title,
    subtitle: location.short_description,
    description: location.description,
    address: location.address,
    activities: location.activities.map((item) => item.title),
    photos: LOCATION_PHOTOS[location.slug] ?? [],
    coordinate: {
      latitude: location.latitude,
      longitude: location.longitude
    },
    color: location.color,
    isCustom: false,
    meta: toMeta(location)
  };
}

function normalizePlace(place: Place): Place {
  return {
    ...place,
    activities: place.activities ?? [],
    photos: place.photos ?? []
  };
}

function difficultyPillStyle(difficulty: ApiTask["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return {
        backgroundColor: "rgba(0,214,125,0.16)",
        borderColor: "rgba(0,214,125,0.30)",
        color: colors.accent
      };
    case "medium":
      return {
        backgroundColor: "rgba(255,176,32,0.14)",
        borderColor: "rgba(255,176,32,0.30)",
        color: colors.warning
      };
    case "hard":
      return {
        backgroundColor: "rgba(255,92,92,0.14)",
        borderColor: "rgba(255,92,92,0.30)",
        color: colors.danger
      };
  }
}

export function MapScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { token } = useAuth();

  const mapRef = useRef<MapView | null>(null);
  const ignoreNextMapPressRef = useRef(false);
  const hasFittedPlacesRef = useRef(false);

  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isPlaceSheetExpanded, setIsPlaceSheetExpanded] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const selectedPlace = useMemo(
    () => {
      const place = places.find((item) => item.id === selectedId);
      return place ? normalizePlace(place) : null;
    },
    [places, selectedId]
  );

  const selectedDistanceEta = useMemo(() => {
    if (!selectedPlace || !userLocation) return null;
    const distanceM = distanceBetweenMeters(userLocation, selectedPlace.coordinate);
    const etaMin = estimateWalkEtaMinutes(distanceM);
    return `${formatDistance(distanceM)} • ${etaMin} мин пешком`;
  }, [selectedPlace, userLocation]);

  const selectedPlaceTasks = useMemo(() => {
    if (!selectedPlace?.backendId) return [];
    return tasks.filter((task) => task.location_id === selectedPlace.backendId);
  }, [selectedPlace, tasks]);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    async function run() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationPermission("denied");
          return;
        }

        setLocationPermission("granted");

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });

        setUserLocation({
          latitude: current.coords.latitude,
          longitude: current.coords.longitude
        });

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          }
        );
      } catch {
        setLocationPermission("denied");
      }
    }

    run();

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const authToken = token;

    let isMounted = true;

    async function loadPlaces() {
      setIsLoadingPlaces(true);
      setPlacesError(null);

      try {
        const [locations, nextTasks] = await Promise.all([
          fetchLocations(authToken),
          fetchTasks(authToken)
        ]);
        if (!isMounted) return;
        setPlaces((prev) => {
          const customPlaces = prev.filter((place) => place.isCustom).map(normalizePlace);
          return [...locations.map(toPlace), ...customPlaces];
        });
        setTasks(nextTasks);
      } catch (error) {
        if (!isMounted) return;
        setPlacesError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить локации из backend."
        );
      } finally {
        if (isMounted) {
          setIsLoadingPlaces(false);
        }
      }
    }

    loadPlaces();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!places.length || hasFittedPlacesRef.current || Platform.OS === "web") return;

    hasFittedPlacesRef.current = true;
    mapRef.current?.fitToCoordinates(
      places.map((place) => place.coordinate),
      {
        edgePadding: { top: 100, right: 60, bottom: tabBarHeight + 260, left: 60 },
        animated: true
      }
    );
  }, [places, tabBarHeight]);

  useEffect(() => {
    setRouteError(null);
  }, [selectedId]);

  useEffect(() => {
    setIsPlaceSheetExpanded(false);
  }, [selectedId]);

  const onMapPress = () => {
    if (ignoreNextMapPressRef.current) {
      ignoreNextMapPressRef.current = false;
      return;
    }

    setSelectedId(null);
    setIsPlaceSheetExpanded(false);
  };

  const selectPlace = (id: string) => {
    ignoreNextMapPressRef.current = true;
    setSelectedId(id);
  };

  const centerOnMe = () => {
    if (!userLocation) return;
    mapRef.current?.animateToRegion(
      {
        ...userLocation,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04
      },
      600
    );
  };

  const openInMaps = async () => {
    if (!selectedPlace) return;

    const { latitude, longitude } = selectedPlace.coordinate;
    const destination = `${latitude},${longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${destination}`
        : `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=walking`;

    try {
      await Linking.openURL(url);
    } catch {
      setRouteError("Не удалось открыть карты на устройстве.");
    }
  };

  const addCustomPoint = (coordinate: LatLng) => {
    const id = `custom-${makeId()}`;
    setPlaces((prev) => [
      ...prev,
      {
        id,
        title: `${mapConfig.customPoint.titlePrefix} ${prev.filter((item) => item.isCustom).length + 1}`,
        subtitle: mapConfig.customPoint.subtitle,
        description: "Пользовательская точка, добавленная долгим нажатием на карту.",
        address: formatCoords(coordinate),
        activities: ["Своя заметка"],
        photos: [],
        coordinate,
        color: mapConfig.customPoint.color,
        isCustom: true,
        meta: mapConfig.customPoint.meta
      }
    ]);
    selectPlace(id);
  };

  return (
    <Screen style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.mapArea}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Открой город</Text>
        </View>

        {Platform.OS === "web" ? (
          <View style={styles.mapOverlay}>
            <GlassCard style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>Карта недоступна на Web</Text>
              <Text style={styles.overlayText}>
                `react-native-maps` работает только на iOS и Android. Открой приложение на
                устройстве или эмуляторе.
              </Text>
            </GlassCard>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFillObject}
            initialRegion={mapConfig.defaultRegion}
            mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
            customMapStyle={Platform.OS === "android" ? GOOGLE_MAP_HIDE_POI_STYLE : undefined}
            userInterfaceStyle={Platform.OS === "ios" ? "dark" : undefined}
            tintColor={Platform.OS === "ios" ? colors.accent : undefined}
            showsCompass={false}
            showsBuildings={false}
            showsPointsOfInterest={false}
            showsTraffic={false}
            showsUserLocation={locationPermission === "granted"}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            onPress={onMapPress}
            onLongPress={({ nativeEvent }) => addCustomPoint(nativeEvent.coordinate)}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={place.coordinate}
                pinColor={place.color}
                onPress={() => selectPlace(place.id)}
              />
            ))}
          </MapView>
        )}

        <LinearGradient
          pointerEvents="none"
          colors={["rgba(7,11,22,0.22)", "rgba(7,11,22,0.55)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        {Platform.OS !== "web" ? (
          <>
            <View style={styles.mapControls}>
              <Pressable
                onPress={centerOnMe}
                accessibilityRole="button"
                accessibilityLabel="Моё местоположение"
                hitSlop={10}
              >
                <IconCircle size={42} backgroundColor="rgba(7,11,22,0.55)" borderColor={colors.border}>
                  <Ionicons name="locate" size={18} color={colors.text} />
                </IconCircle>
              </Pressable>
            </View>

            {locationPermission === "unknown" || (isLoadingPlaces && places.length === 0) ? (
              <View style={styles.mapOverlay}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null}

            {locationPermission === "denied" ? (
              <View style={styles.mapOverlay}>
                <GlassCard style={styles.overlayCard}>
                  <Text style={styles.overlayTitle}>Нужна геолокация</Text>
                  <Text style={styles.overlayText}>
                    Разреши доступ к местоположению, чтобы показывать тебя на карте и строить
                    маршрут.
                  </Text>
                </GlassCard>
              </View>
            ) : null}

            {placesError && places.length === 0 ? (
              <View style={styles.mapOverlay}>
                <GlassCard style={styles.overlayCard}>
                  <Text style={styles.overlayTitle}>Backend недоступен</Text>
                  <Text style={styles.overlayText}>{placesError}</Text>
                </GlassCard>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      {selectedPlace ? (
        <View
          pointerEvents="box-none"
          style={[styles.placeCardWrap, { top: 72, bottom: tabBarHeight }]}
        >
          <GlassCard style={styles.placeCard}>
            <View style={styles.placeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeTitle}>{selectedPlace.title}</Text>
                <Text style={styles.placeDistanceEta}>
                  {selectedDistanceEta ?? selectedPlace.address ?? formatCoords(selectedPlace.coordinate)}
                </Text>
              </View>
              <Pressable
                onPress={() => setIsPlaceSheetExpanded((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel={isPlaceSheetExpanded ? "Свернуть детали" : "Развернуть детали"}
                hitSlop={10}
              >
                <IconCircle size={36} backgroundColor="rgba(255,255,255,0.06)" borderColor={colors.border}>
                  <Ionicons
                    name={isPlaceSheetExpanded ? "chevron-down" : "chevron-up"}
                    size={18}
                    color={colors.muted}
                  />
                </IconCircle>
              </Pressable>
              <Pressable
                onPress={() => {
                  setSelectedId(null);
                  setIsPlaceSheetExpanded(false);
                }}
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
                hitSlop={10}
              >
                <IconCircle size={36} backgroundColor="rgba(255,255,255,0.06)" borderColor={colors.border}>
                  <Ionicons name="close" size={18} color={colors.muted} />
                </IconCircle>
              </Pressable>
            </View>

            {isPlaceSheetExpanded ? (
              <ScrollView
                style={styles.placeDetailsScroll}
                contentContainerStyle={styles.placeDetailsContent}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                <Text style={styles.placeSubtitle}>
                  {selectedPlace.subtitle ?? formatCoords(selectedPlace.coordinate)}
                </Text>
                <Text style={styles.placeMeta}>{formatPointMeta(selectedPlace.meta)}</Text>

                {selectedPlace.photos?.length ? (
                  <>
                    <Text style={styles.sectionLabel}>Фото</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosRow}
                    >
                      {selectedPlace.photos.map((photo, index) => (
                        <Image
                          key={`${selectedPlace.id}-photo-${index}`}
                          source={photo}
                          style={styles.photoCard}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                {selectedPlace.description ? (
                  <>
                    <Text style={styles.sectionLabel}>Описание</Text>
                    <View style={styles.descriptionBlock}>
                      <Text style={[styles.placeBody, styles.descriptionText]}>
                        {selectedPlace.description}
                      </Text>
                    </View>
                  </>
                ) : null}

                {selectedPlace.address ? (
                  <>
                    <Text style={styles.sectionLabel}>Адрес</Text>
                    <Text style={styles.placeBody}>{selectedPlace.address}</Text>
                  </>
                ) : null}

                {selectedPlace.activities?.length ? (
                  <>
                    <Text style={styles.sectionLabel}>Чем заняться</Text>
                    <View style={styles.activitiesList}>
                      {selectedPlace.activities.map((activity) => (
                        <View key={activity} style={styles.activityRow}>
                          <View style={styles.activityDot} />
                          <Text style={styles.activityText}>{activity}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                ) : null}

                <Text style={styles.sectionLabel}>Задания</Text>
                {selectedPlaceTasks.length ? (
                  <View style={styles.taskList}>
                    {selectedPlaceTasks.map((task) => {
                      const pillStyle = difficultyPillStyle(task.difficulty);
                      const progressPercent = Math.round(task.progress * 100);
                      return (
                        <View key={task.id} style={styles.taskCard}>
                          <View style={styles.taskCardHeader}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <View
                              style={[
                                styles.taskDifficultyPill,
                                {
                                  backgroundColor: pillStyle.backgroundColor,
                                  borderColor: pillStyle.borderColor
                                }
                              ]}
                            >
                              <Text style={[styles.taskDifficultyText, { color: pillStyle.color }]}>
                                {TASK_DIFFICULTY_LABELS[task.difficulty]}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.taskSubtitle}>{task.subtitle}</Text>
                          <View style={styles.taskMetaRow}>
                            <Text style={styles.taskReward}>+{task.reward_xp} XP</Text>
                            <Text style={styles.taskMetaText}>{task.time_left}</Text>
                            <Text style={styles.taskMetaText}>{progressPercent}%</Text>
                          </View>
                          <View style={styles.taskRewardBox}>
                            <Ionicons name="gift-outline" size={14} color={colors.accent} />
                            <Text style={styles.taskRewardBoxText}>{task.reward_text}</Text>
                          </View>
                          <Text style={styles.taskProgressText}>{task.progress_text}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View style={styles.emptyTasksState}>
                    <Text style={styles.emptyTasksText}>
                      Для этой локации задания пока не добавлены.
                    </Text>
                  </View>
                )}

                {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}

                <View style={styles.placeActions}>
                  <Pressable
                    onPress={openInMaps}
                    accessibilityRole="button"
                    accessibilityLabel="Открыть в картах"
                    style={styles.secondaryBtnSingle}
                  >
                    <Ionicons name="navigate-outline" size={18} color={colors.text} />
                    <Text style={styles.secondaryBtnText}>В картах</Text>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <>
                <Text style={styles.placeSubtitle}>
                  {selectedPlace.subtitle ?? formatCoords(selectedPlace.coordinate)}
                </Text>
                <Text style={styles.placeMeta}>{formatPointMeta(selectedPlace.meta)}</Text>

                {selectedPlace.photos?.length ? (
                  <>
                    <Text style={styles.sectionLabel}>Фото</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.photosRow}
                    >
                      {selectedPlace.photos.map((photo, index) => (
                        <Image
                          key={`${selectedPlace.id}-preview-photo-${index}`}
                          source={photo}
                          style={styles.photoCard}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <Pressable
                  onPress={() => setIsPlaceSheetExpanded(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Развернуть детали точки"
                  style={styles.sheetExpandHint}
                >
                  <Text style={styles.sheetExpandHintText}>Подробнее</Text>
                  <Ionicons name="chevron-up" size={16} color={colors.muted} />
                </Pressable>
              </>
            )}
          </GlassCard>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  mapArea: {
    flex: 1
  },
  mapControls: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 20
  },
  mapOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg,
    backgroundColor: "rgba(7,11,22,0.25)"
  },
  overlayCard: {
    padding: space.md,
    borderRadius: radii.md
  },
  overlayTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  overlayText: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 6,
    lineHeight: 16
  },
  placeCardWrap: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    zIndex: 30,
    justifyContent: "flex-end"
  },
  placeCard: {
    padding: space.md,
    borderRadius: radii.md,
    backgroundColor: colors.bg1,
    borderColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    maxHeight: "100%"
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "center"
  },
  placeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "900"
  },
  placeDistanceEta: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700"
  },
  placeSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  placeMeta: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 6,
    fontWeight: "700"
  },
  sectionLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: space.md
  },
  placeBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6
  },
  descriptionBlock: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.border
  },
  descriptionText: {
    marginTop: 0
  },
  photosRow: {
    marginTop: 6,
    paddingRight: 4
  },
  placeDetailsScroll: {
    marginTop: space.xs
  },
  placeDetailsContent: {
    paddingBottom: space.xs
  },
  photoCard: {
    width: 220,
    height: 150,
    borderRadius: radii.md,
    marginRight: 10,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.border
  },
  activitiesList: {
    marginTop: space.sm
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent2,
    marginTop: 6,
    marginRight: 8
  },
  activityText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  taskList: {
    marginTop: space.sm
  },
  taskCard: {
    marginBottom: space.sm,
    padding: space.md,
    borderRadius: radii.md,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.border
  },
  taskCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  taskTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    paddingRight: 10
  },
  taskDifficultyPill: {
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  taskDifficultyText: {
    fontSize: 10,
    fontWeight: "900"
  },
  taskSubtitle: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8
  },
  taskMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: space.sm
  },
  taskReward: {
    color: colors.accent2,
    fontSize: 12,
    fontWeight: "900",
    marginRight: 12
  },
  taskMetaText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 12
  },
  taskRewardBox: {
    marginTop: space.sm,
    flexDirection: "row",
    alignItems: "center"
  },
  taskRewardBoxText: {
    flex: 1,
    color: colors.text,
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8
  },
  taskProgressText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: space.sm
  },
  emptyTasksState: {
    marginTop: space.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: radii.md,
    backgroundColor: colors.tabBar,
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyTasksText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  routeError: {
    marginTop: space.sm,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16
  },
  placeActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: space.md,
    justifyContent: "flex-end"
  },
  sheetExpandHint: {
    marginTop: space.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8
  },
  sheetExpandHintText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 4
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8
  },
  secondaryBtnSingle: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: "rgba(7,11,22,0.55)",
    borderColor: colors.border,
    borderWidth: 1
  }
});
