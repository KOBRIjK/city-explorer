import { Ionicons } from "@expo/vector-icons";
import { type BottomTabNavigationProp, useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  type ImageSourcePropType,
  Linking,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import MapView, {
  Marker,
  type LatLng
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchLocations, fetchTasks } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { LocationTaskCard } from "../components/map/LocationTaskCard";
import { Screen } from "../components/Screen";
import { mapConfig } from "../config/mapConfig";
import type { PointMeta } from "../data/points";
import { hiddenMainTabBarStyle, mainTabBarStyle } from "../navigation/tabBarConfig";
import type { MainTabParamList } from "../navigation/types";
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

const LOCATION_PHOTOS: Record<string, ImageSourcePropType[]> = {
  "rukh-fight-club": [
    require("../assets/rukh/image4.jpeg"),
    require("../assets/rukh/image5.jpeg")
  ],
  "rukh-cyberarena": [require("../assets/rukh/image6.jpeg")]
};

const SHEET_SNAP_POINTS = [0.27, 0.985] as const;
const COLLAPSED_SHEET_MIN_HEIGHT = 180;
const HERO_MEDIA_GAP = 28;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCoords({ latitude, longitude }: LatLng) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
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

function RoutePrimaryButton({ onPress, compact = false }: { onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Построить маршрут">
      <LinearGradient
        colors={[colors.ctaStart, colors.ctaEnd]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.routeButton, compact ? styles.routeButtonCompact : null]}
      >
        <Ionicons name="navigate" size={compact ? 16 : 17} color={colors.textSoft} />
        <Text style={[styles.routeButtonText, compact ? styles.routeButtonTextCompact : null]}>
          Построить маршрут
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

function MetaChip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.metaChip, accent ? styles.metaChipAccent : undefined]}>
      <Text style={[styles.metaChipText, accent ? styles.metaChipTextAccent : undefined]}>
        {label}
      </Text>
    </View>
  );
}

function PhotoGallery({
  photos,
  photoWidth,
  photoHeight,
  onPhotoPress,
  compact = false,
  showTitle = true
}: {
  photos: ImageSourcePropType[];
  photoWidth: number;
  photoHeight: number;
  onPhotoPress: (photo: ImageSourcePropType) => void;
  compact?: boolean;
  showTitle?: boolean;
}) {
  if (!photos.length) return null;

  return (
    <>
      {showTitle ? <Text style={styles.sectionTitle}>Фото</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.photosRow, compact ? styles.photosRowCompact : null]}
      >
        {photos.map((photo, index) => (
          <Pressable
            key={`photo-${index}`}
            onPress={() => onPhotoPress(photo)}
            style={({ pressed }) => [
              styles.photoPressable,
              { width: photoWidth, height: photoHeight },
              compact ? styles.photoPressableCompact : null,
              pressed ? styles.photoPressablePressed : null
            ]}
          >
            <Image source={photo} style={styles.photoImage} resizeMode="cover" />
            <LinearGradient
              colors={["rgba(7,11,22,0)", "rgba(7,11,22,0.45)"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.photoOverlay}
            />
            <View style={styles.photoBadge}>
              <Ionicons name="expand-outline" size={14} color={colors.text} />
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </>
  );
}

function PlacePreviewContent({
  place,
  photoWidth,
  photoHeight,
  onPhotoPress,
  compact = false,
  showMeta = true,
  showPhotos = true,
  showPhotoTitle = true
}: {
  place: Place;
  photoWidth: number;
  photoHeight: number;
  onPhotoPress: (photo: ImageSourcePropType) => void;
  compact?: boolean;
  showMeta?: boolean;
  showPhotos?: boolean;
  showPhotoTitle?: boolean;
}) {
  return (
    <>
      {place.subtitle ? (
        <Text
          numberOfLines={compact ? 2 : undefined}
          ellipsizeMode="tail"
          style={compact ? styles.previewDescriptionCompact : styles.previewDescription}
        >
          {place.subtitle}
        </Text>
      ) : null}

      {showMeta ? (
        <View style={styles.metaRow}>
          <MetaChip label={CATEGORY_LABELS[place.meta.category]} />
          <MetaChip label={DIFFICULTY_LABELS[place.meta.difficulty]} />
          <MetaChip label={`${place.meta.rewardXp} XP`} accent />
        </View>
      ) : null}

      {showPhotos ? (
        <PhotoGallery
          photos={place.photos}
          photoWidth={photoWidth}
          photoHeight={photoHeight}
          onPhotoPress={onPhotoPress}
          compact={compact}
          showTitle={showPhotoTitle}
        />
      ) : null}
    </>
  );
}

export function MapScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList, "Map">>();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { token } = useAuth();

  const mapRef = useRef<MapView | null>(null);
  const ignoreNextMapPressRef = useRef(false);
  const hasFittedPlacesRef = useRef(false);
  const currentSheetHeightRef = useRef(0);
  const dragStartHeightRef = useRef(0);

  const [locationPermission, setLocationPermission] = useState<"unknown" | "granted" | "denied">("unknown");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetIndex, setSheetIndex] = useState(0);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [photoViewerSource, setPhotoViewerSource] = useState<ImageSourcePropType | null>(null);

  const animatedSheetHeight = useRef(new Animated.Value(0)).current;
  const heroPhotoWidth = Math.min(Math.max(Math.round(screenWidth * 0.44), 148), 188);
  const heroPhotoHeight = Math.round(heroPhotoWidth * 0.6);
  const isPlaceSelected = !!selectedId;
  const sheetTopOffset = isPlaceSelected ? insets.top + 10 : insets.top + 14;
  const sheetBottomOffset = isPlaceSelected ? 0 : tabBarHeight;
  const sheetAvailableHeight = Math.max(320, screenHeight - sheetTopOffset - sheetBottomOffset);
  const sheetSnapHeights = useMemo(
    () => [
      Math.max(COLLAPSED_SHEET_MIN_HEIGHT, Math.round(sheetAvailableHeight * SHEET_SNAP_POINTS[0])),
      Math.round(sheetAvailableHeight * SHEET_SNAP_POINTS[1])
    ],
    [sheetAvailableHeight]
  );

  const selectedPlace = useMemo(
    () => {
      const place = places.find((item) => item.id === selectedId);
      return place ? normalizePlace(place) : null;
    },
    [places, selectedId]
  );

  const selectedPlaceTasks = useMemo(() => {
    if (!selectedPlace?.backendId) return [];
    return tasks.filter((task) => task.location_id === selectedPlace.backendId);
  }, [selectedPlace, tasks]);

  const distanceEtaLabel = useMemo(() => {
    if (!selectedPlace || !userLocation) return null;
    const distanceM = distanceBetweenMeters(userLocation, selectedPlace.coordinate);
    const etaMin = estimateWalkEtaMinutes(distanceM);
    return `${formatDistance(distanceM)} • ${etaMin} мин пешком`;
  }, [selectedPlace, userLocation]);

  const isCollapsedSheet = sheetIndex === 0;
  const isFullSheet = sheetIndex === 1;
  const collapsedSheetTop = screenHeight - sheetBottomOffset - sheetSnapHeights[0];
  const heroMediaTop = Math.max(insets.top + 56, collapsedSheetTop - heroPhotoHeight - HERO_MEDIA_GAP);
  const heroMediaOpacity = animatedSheetHeight.interpolate({
    inputRange: [sheetSnapHeights[0], sheetSnapHeights[0] + 42, sheetSnapHeights[1]],
    outputRange: [1, 0.55, 0],
    extrapolate: "clamp"
  });
  const heroMediaTranslateY = animatedSheetHeight.interpolate({
    inputRange: [sheetSnapHeights[0], sheetSnapHeights[1]],
    outputRange: [0, -16],
    extrapolate: "clamp"
  });
  const heroMediaScale = animatedSheetHeight.interpolate({
    inputRange: [sheetSnapHeights[0], sheetSnapHeights[1]],
    outputRange: [1, 0.94],
    extrapolate: "clamp"
  });
  const stickyActionInset = Math.max(insets.bottom, space.xs) + 8;
  const stickyActionBarHeight = stickyActionInset + 60;

  useLayoutEffect(() => {
    navigation.setOptions({
      tabBarStyle: isPlaceSelected ? hiddenMainTabBarStyle : mainTabBarStyle
    });

    return () => {
      navigation.setOptions({ tabBarStyle: mainTabBarStyle });
    };
  }, [isPlaceSelected, navigation]);

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
    setPhotoViewerSource(null);
  }, [selectedId]);

  useEffect(() => {
    const listenerId = animatedSheetHeight.addListener(({ value }) => {
      currentSheetHeightRef.current = value;
    });

    return () => {
      animatedSheetHeight.removeListener(listenerId);
    };
  }, [animatedSheetHeight]);

  useEffect(() => {
    if (!selectedPlace) {
      animatedSheetHeight.setValue(0);
      currentSheetHeightRef.current = 0;
      setSheetIndex(0);
      return;
    }

    setSheetIndex(0);
    animatedSheetHeight.setValue(sheetSnapHeights[0]);
    currentSheetHeightRef.current = sheetSnapHeights[0];
  }, [selectedId, selectedPlace, animatedSheetHeight, sheetSnapHeights]);

  useEffect(() => {
    if (!selectedPlace) return;

    const nextHeight = sheetSnapHeights[sheetIndex] ?? sheetSnapHeights[0];
    Animated.spring(animatedSheetHeight, {
      toValue: nextHeight,
      bounciness: 0,
      speed: 18,
      useNativeDriver: false
    }).start();
  }, [animatedSheetHeight, selectedPlace, sheetIndex, sheetSnapHeights]);

  const snapToSheetIndex = (nextIndex: number) => {
    setSheetIndex(clamp(nextIndex, 0, sheetSnapHeights.length - 1));
  };

  const findClosestSheetIndex = (height: number) => {
    let closestIndex = 0;
    let minDelta = Number.POSITIVE_INFINITY;

    sheetSnapHeights.forEach((snapHeight, index) => {
      const delta = Math.abs(snapHeight - height);
      if (delta < minDelta) {
        minDelta = delta;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const cycleSheetState = () => {
    snapToSheetIndex(isFullSheet ? 0 : 1);
  };

  const sheetPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 8 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
        onPanResponderGrant: () => {
          dragStartHeightRef.current = currentSheetHeightRef.current || sheetSnapHeights[sheetIndex];
        },
        onPanResponderMove: (_, gestureState) => {
          const nextHeight = clamp(
            dragStartHeightRef.current - gestureState.dy,
            sheetSnapHeights[0],
            sheetSnapHeights[sheetSnapHeights.length - 1]
          );
          animatedSheetHeight.setValue(nextHeight);
        },
        onPanResponderRelease: (_, gestureState) => {
          const projectedHeight = clamp(
            currentSheetHeightRef.current - gestureState.vy * 48,
            sheetSnapHeights[0],
            sheetSnapHeights[sheetSnapHeights.length - 1]
          );
          snapToSheetIndex(findClosestSheetIndex(projectedHeight));
        },
        onPanResponderTerminate: () => {
          snapToSheetIndex(findClosestSheetIndex(currentSheetHeightRef.current));
        }
      }),
    [animatedSheetHeight, sheetIndex, sheetSnapHeights]
  );

  const onMapPress = () => {
    if (ignoreNextMapPressRef.current) {
      ignoreNextMapPressRef.current = false;
      return;
    }

    setSelectedId(null);
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

  const showTasksSection = !!selectedPlace && !selectedPlace.isCustom && isFullSheet;

  return (
    <>
      <Screen style={styles.screen} contentContainerStyle={styles.container}>
        <View style={styles.mapArea}>
          {!isPlaceSelected ? (
            <View style={styles.mapTitleWrap}>
          <Text style={styles.title}>Открой город</Text>
        </View>
          ) : null}

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
            {!isPlaceSelected ? (
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
            ) : null}

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

        {selectedPlace?.photos.length ? (
          <Animated.View
            pointerEvents={isCollapsedSheet ? "box-none" : "none"}
            style={[
              styles.heroMediaWrap,
              {
                top: heroMediaTop,
                opacity: heroMediaOpacity,
                transform: [{ translateY: heroMediaTranslateY }, { scale: heroMediaScale }]
              }
            ]}
          >
            <PhotoGallery
              photos={selectedPlace.photos}
              photoWidth={heroPhotoWidth}
              photoHeight={heroPhotoHeight}
              onPhotoPress={setPhotoViewerSource}
              compact
              showTitle={false}
            />
          </Animated.View>
        ) : null}

        {selectedPlace ? (
          <View
            pointerEvents="box-none"
            style={[styles.placeCardWrap, { top: sheetTopOffset, bottom: sheetBottomOffset }]}
          >
            <Animated.View style={[styles.placeSheet, { height: animatedSheetHeight }]}>
              <GlassCard style={styles.placeCard}>
                <View style={styles.sheetGrabArea} {...sheetPanResponder.panHandlers}>
                  <View style={styles.sheetHandle} />

                  <View style={styles.placeHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={isCollapsedSheet ? 2 : undefined}
                        style={[styles.placeTitle, isCollapsedSheet ? styles.placeTitleCollapsed : null]}
                      >
                        {selectedPlace.title}
                      </Text>
                      <Text style={[styles.placeDistanceEta, isCollapsedSheet ? styles.placeDistanceEtaCollapsed : null]}>
                        {distanceEtaLabel ?? selectedPlace.address ?? formatCoords(selectedPlace.coordinate)}
                      </Text>
                    </View>
                    <View style={styles.headerActions}>
                      <Pressable
                        onPress={cycleSheetState}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isFullSheet ? "Свернуть карточку" : "Развернуть карточку"
                        }
                        hitSlop={8}
                      >
                        <IconCircle
                          size={30}
                          backgroundColor="rgba(255,255,255,0.025)"
                          borderColor="rgba(255,255,255,0.05)"
                        >
                          <Ionicons
                            name={isFullSheet ? "chevron-down" : "chevron-up"}
                            size={15}
                            color="rgba(244,247,255,0.58)"
                          />
                        </IconCircle>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setSelectedId(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Закрыть"
                        hitSlop={8}
                      >
                        <IconCircle
                          size={30}
                          backgroundColor="rgba(255,255,255,0.025)"
                          borderColor="rgba(255,255,255,0.05)"
                        >
                          <Ionicons name="close" size={15} color="rgba(244,247,255,0.58)" />
                        </IconCircle>
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={[styles.routeSection, { paddingBottom: stickyActionInset }]}>
                  <RoutePrimaryButton onPress={openInMaps} compact={isCollapsedSheet} />
                  {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}
                </View>

                {isCollapsedSheet ? (
                  <Pressable
                    onPress={() => snapToSheetIndex(1)}
                    accessibilityRole="button"
                    accessibilityLabel="Развернуть карточку клуба"
                    style={[styles.collapsedTapArea, { paddingBottom: stickyActionBarHeight - 20 }]}
                    {...sheetPanResponder.panHandlers}
                  >
                    <PlacePreviewContent
                      place={selectedPlace}
                      photoWidth={heroPhotoWidth}
                      photoHeight={heroPhotoHeight}
                      onPhotoPress={setPhotoViewerSource}
                      compact
                      showMeta={false}
                      showPhotos={false}
                    />
                  </Pressable>
                ) : (
                  <ScrollView
                    style={styles.placeDetailsScroll}
                    contentContainerStyle={[styles.placeDetailsContent, { paddingBottom: stickyActionBarHeight }]}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                  >
                    <PlacePreviewContent
                      place={selectedPlace}
                      photoWidth={heroPhotoWidth}
                      photoHeight={heroPhotoHeight}
                      onPhotoPress={setPhotoViewerSource}
                      showPhotos={false}
                    />

                    {selectedPlace.description ? (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Описание</Text>
                        <View style={styles.descriptionBlock}>
                          <Text style={styles.descriptionText}>{selectedPlace.description}</Text>
                        </View>
                      </View>
                    ) : null}

                    {selectedPlace.activities?.length ? (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Чем заняться</Text>
                        <View style={styles.activitiesCard}>
                          {selectedPlace.activities.map((activity, index) => (
                            <View
                              key={activity}
                              style={[styles.activityRow, index > 0 ? styles.activityRowSpaced : null]}
                            >
                              <View style={styles.activityBullet} />
                              <Text style={styles.activityText}>{activity}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : null}

                    {isFullSheet && selectedPlace.address ? (
                      <View style={styles.sectionBlock}>
                        <Text style={styles.sectionTitle}>Адрес</Text>
                        <View style={styles.infoCard}>
                          <Ionicons name="location-outline" size={16} color={colors.success} />
                          <Text style={styles.infoCardText}>{selectedPlace.address}</Text>
                        </View>
                      </View>
                    ) : null}

                    {showTasksSection ? (
                      <View style={styles.sectionBlock}>
                        <View style={styles.sectionTitleRow}>
                          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Задания</Text>
                          <Text style={styles.sectionCaption}>{selectedPlaceTasks.length}</Text>
                        </View>
                        {selectedPlaceTasks.length ? (
                          <View style={styles.taskList}>
                            {selectedPlaceTasks.map((task) => (
                              <LocationTaskCard key={task.id} task={task} />
                            ))}
                          </View>
                        ) : (
                          <View style={styles.emptyTasksState}>
                            <Text style={styles.emptyTasksText}>
                              Для этой локации задания пока не добавлены.
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </ScrollView>
                )}
              </GlassCard>
            </Animated.View>
          </View>
        ) : null}
      </Screen>

      <Modal
        visible={!!photoViewerSource}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoViewerSource(null)}
      >
        <View style={styles.photoModalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={() => setPhotoViewerSource(null)}
            accessibilityRole="button"
            accessibilityLabel="Закрыть просмотр фото"
          />

          <View style={styles.photoModalCard}>
            <Pressable
              onPress={() => setPhotoViewerSource(null)}
              accessibilityRole="button"
              accessibilityLabel="Закрыть просмотр фото"
              style={styles.photoModalClose}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>

            {photoViewerSource ? (
              <Image source={photoViewerSource} resizeMode="contain" style={styles.photoModalImage} />
            ) : null}
          </View>
        </View>
      </Modal>
    </>
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
  mapTitleWrap: {
    position: "absolute",
    top: space.lg,
    left: space.lg,
    right: space.lg,
    zIndex: 12
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
  heroMediaWrap: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    zIndex: 24
  },
  placeSheet: {
    width: "100%"
  },
  placeCard: {
    flex: 1,
    paddingHorizontal: space.md,
    paddingTop: space.xs,
    paddingBottom: 0,
    borderRadius: radii.lg,
    backgroundColor: colors.bg1,
    borderColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10
  },
  sheetGrabArea: {
    paddingBottom: 0
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginBottom: 8
  },
  placeHeader: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  placeTitle: {
    color: colors.textSoft,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28,
    paddingRight: space.sm
  },
  placeTitleCollapsed: {
    fontSize: 20,
    lineHeight: 25
  },
  placeDistanceEta: {
    color: colors.success,
    fontSize: 14,
    marginTop: 6,
    fontWeight: "700"
  },
  placeDistanceEtaCollapsed: {
    marginTop: 4,
    fontSize: 13
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: space.sm,
    gap: 6
  },
  routeSection: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
    paddingHorizontal: space.md,
    paddingTop: space.xs,
    backgroundColor: "rgba(11,18,32,0.94)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -6 },
    elevation: 10
  },
  routeButton: {
    minHeight: 46,
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  routeButtonCompact: {
    minHeight: 40,
    borderRadius: radii.md
  },
  routeButtonText: {
    marginLeft: 8,
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "900"
  },
  routeButtonTextCompact: {
    fontSize: 12
  },
  previewDescription: {
    color: "rgba(230,237,248,0.76)",
    fontSize: 14,
    lineHeight: 22
  },
  previewDescriptionCompact: {
    color: "rgba(230,237,248,0.74)",
    fontSize: 12,
    lineHeight: 17
  },
  collapsedTapArea: {
    paddingTop: 6,
    paddingBottom: 2
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    marginBottom: 14
  },
  metaChip: {
    marginRight: space.xs,
    marginBottom: space.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)"
  },
  metaChipAccent: {
    backgroundColor: "rgba(201,231,117,0.10)",
    borderColor: "rgba(201,231,117,0.16)"
  },
  metaChipText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700"
  },
  metaChipTextAccent: {
    color: colors.xp
  },
  descriptionBlock: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,16,31,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  descriptionText: {
    color: "rgba(230,237,248,0.82)",
    fontSize: 14,
    lineHeight: 23
  },
  photosRow: {
    paddingRight: space.xs,
    paddingBottom: 4
  },
  photosRowCompact: {
    paddingTop: 0
  },
  placeDetailsScroll: {
    flex: 1,
    marginTop: space.sm
  },
  placeDetailsContent: {
    paddingBottom: space.xl
  },
  sectionBlock: {
    marginTop: space.lg
  },
  sectionTitle: {
    color: colors.textSoft,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: space.sm
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.sm
  },
  sectionCaption: {
    minWidth: 28,
    textAlign: "center",
    color: colors.xp,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: "rgba(201,231,117,0.10)",
    borderWidth: 1,
    borderColor: "rgba(201,231,117,0.16)"
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,16,31,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  infoCardText: {
    flex: 1,
    marginLeft: 10,
    color: "rgba(230,237,248,0.78)",
    fontSize: 14,
    lineHeight: 22
  },
  activitiesCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,16,31,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  activityRowSpaced: {
    marginTop: 12
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(89,197,145,0.16)",
    borderWidth: 1,
    borderColor: "rgba(89,197,145,0.36)",
    marginTop: 6,
    marginRight: 10
  },
  activityText: {
    flex: 1,
    color: "rgba(230,237,248,0.74)",
    fontSize: 14,
    lineHeight: 21
  },
  taskList: {
    marginTop: 0
  },
  emptyTasksState: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: radii.md,
    backgroundColor: "rgba(8,16,31,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  emptyTasksText: {
    color: "rgba(230,237,248,0.70)",
    fontSize: 13,
    lineHeight: 20
  },
  routeError: {
    marginTop: space.xs,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  },
  photoPressable: {
    marginRight: 12,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: "rgba(12,22,39,0.92)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4
  },
  photoPressableCompact: {
    marginRight: 8,
    borderRadius: 14,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  },
  photoPressablePressed: {
    opacity: 0.92
  },
  photoImage: {
    width: "100%",
    height: "100%"
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject
  },
  photoBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,11,22,0.56)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
    padding: space.lg
  },
  photoModalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.bg0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)"
  },
  photoModalClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: "rgba(7,11,22,0.76)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)"
  },
  photoModalImage: {
    width: "100%",
    aspectRatio: 1
  }
});
