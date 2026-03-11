import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";
import MapView, {
  Marker,
  Polyline,
  type LatLng
} from "react-native-maps";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import type { RootStackParamList } from "../navigation/types";
import { Screen } from "../components/Screen";
import { GlassCard } from "../components/GlassCard";
import { IconCircle } from "../components/IconCircle";
import { mapConfig } from "../config/mapConfig";
import type { PointMeta } from "../data/points";
import { colors } from "../theme/colors";
import { space } from "../theme/spacing";
import { radii } from "../theme/radii";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Place = {
  id: string;
  title: string;
  subtitle?: string;
  coordinate: LatLng;
  color: string;
  meta: PointMeta;
};

const GOOGLE_MAP_HIDE_POI_STYLE = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
] as any;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatCoords({ latitude, longitude }: LatLng) {
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function formatPointMeta(meta: PointMeta) {
  return `${meta.category} - ${meta.rewardXp} XP`;
}

async function fetchOsrmRoute(from: LatLng, to: LatLng): Promise<LatLng[]> {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${from.longitude},${from.latitude};${to.longitude},${to.latitude}` +
    `?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Route request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    routes?: Array<{
      geometry?: {
        coordinates?: Array<[number, number]>;
      };
    }>;
  };

  const coords = data.routes?.[0]?.geometry?.coordinates;
  if (!coords || coords.length < 2) {
    throw new Error("No route");
  }

  return coords.map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
}

export function MapScreen() {
  const navigation = useNavigation<Nav>();
  const tabBarHeight = useBottomTabBarHeight();

  const mapRef = useRef<MapView | null>(null);
  const ignoreNextMapPressRef = useRef(false);

  const [locationPermission, setLocationPermission] = useState<
    "unknown" | "granted" | "denied"
  >("unknown");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPlace = useMemo(
    () => places.find((p) => p.id === selectedId) ?? null,
    [places, selectedId]
  );

  const [routeCoords, setRouteCoords] = useState<LatLng[] | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isRouting, setIsRouting] = useState(false);

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

        const coord: LatLng = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude
        };

        setUserLocation(coord);
        mapRef.current?.animateToRegion(
          {
            ...coord,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04
          },
          600
        );

        subscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, distanceInterval: 25 },
          (pos) => {
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
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
    if (!userLocation) return;

    setPlaces((prev) => {
      if (prev.length > 0) return prev;
      return mapConfig.seedPoints.map((seed) => ({
        id: `${seed.key}-${makeId()}`,
        title: seed.title,
        subtitle: seed.subtitle,
        coordinate: {
          latitude: userLocation.latitude + seed.delta.latitude,
          longitude: userLocation.longitude + seed.delta.longitude
        },
        color: seed.color,
        meta: seed.meta
      }));
    });
  }, [userLocation]);

  useEffect(() => {
    setRouteCoords(null);
    setRouteError(null);
  }, [selectedId]);

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

  const buildRoute = async () => {
    if (!selectedPlace || !userLocation) return;

    setIsRouting(true);
    setRouteError(null);

    try {
      const coords = await fetchOsrmRoute(userLocation, selectedPlace.coordinate);
      setRouteCoords(coords);
      mapRef.current?.fitToCoordinates([userLocation, selectedPlace.coordinate], {
        edgePadding: { top: 80, right: 80, bottom: tabBarHeight + 320, left: 80 },
        animated: true
      });
    } catch {
      setRouteCoords(null);
      setRouteError("Не удалось построить маршрут. Проверь интернет или открой в Картах.");
    } finally {
      setIsRouting(false);
    }
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

  return (
    <Screen style={styles.screen} contentContainerStyle={styles.container}>
      {/* <View style={styles.header}>
        
        {/* <Pressable accessibilityRole="button" accessibilityLabel="Профиль">
          <IconCircle size={44} backgroundColor={colors.accent} borderColor="rgba(0,0,0,0)">
            <Ionicons name="person" size={20} color="#062514" />
          </IconCircle>
        </Pressable> 
      </View> */}

      {/* <View style={styles.statsRow}>
        <GlassCard style={[styles.statCard, { marginRight: space.md }]}>
          <Text style={styles.statLabel}>Сегодня шагов</Text>
          <Text style={styles.statValue}>8 420</Text>
        </GlassCard>
        <GlassCard style={styles.statCard}>
          <Text style={styles.statLabel}>Дистанция</Text>
          <Text style={styles.statValue}>5.8 км</Text>
        </GlassCard>
      </View> */}

      <View style={styles.mapArea}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Открой город</Text>
        </View>
        {Platform.OS === "web" ? (
          <View style={styles.mapOverlay}>
            <GlassCard style={styles.overlayCard}>
              <Text style={styles.overlayTitle}>Карта недоступна на Web</Text>
              <Text style={styles.overlayText}>
                react-native-maps работает только на iOS/Android. Открой приложение на устройстве или в эмуляторе.
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
            onLongPress={({ nativeEvent }: { nativeEvent: { coordinate: LatLng } }) => {
              const id = makeId();
              const coordinate = nativeEvent.coordinate;

              setPlaces((prev) => [
                ...prev,
                {
                  id,
                  title: `${mapConfig.customPoint.titlePrefix} ${prev.length + 1}`,
                  subtitle: mapConfig.customPoint.subtitle,
                  coordinate,
                  color: mapConfig.customPoint.color,
                  meta: mapConfig.customPoint.meta
                }
              ]);
              selectPlace(id);
            }}
          >
            {places.map((place) => (
              <Marker
                key={place.id}
                coordinate={place.coordinate}
                title={place.title}
                description={
                  place.subtitle
                    ? `${place.subtitle} - ${formatPointMeta(place.meta)}`
                    : formatPointMeta(place.meta)
                }
                pinColor={place.color}
                onPress={() => selectPlace(place.id)}
              />
            ))}

            {routeCoords && routeCoords.length > 1 ? (
              <Polyline coordinates={routeCoords} strokeColor={colors.accent} strokeWidth={5} />
            ) : null}
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

            {locationPermission === "unknown" ? (
              <View style={styles.mapOverlay}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null}

            {locationPermission === "denied" ? (
              <View style={styles.mapOverlay}>
                <GlassCard style={styles.overlayCard}>
                  <Text style={styles.overlayTitle}>Нужна геолокация</Text>
                  <Text style={styles.overlayText}>
                    Разреши доступ к местоположению, чтобы показывать тебя на карте и строить маршрут.
                  </Text>
                </GlassCard>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      {selectedPlace ? (
        <View style={[styles.placeCardWrap, { bottom: tabBarHeight + 86 }]}>
          <GlassCard style={styles.placeCard}>
            <View style={styles.placeHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeTitle}>{selectedPlace.title}</Text>
                <Text style={styles.placeSubtitle}>
                  {selectedPlace.subtitle ?? formatCoords(selectedPlace.coordinate)}
                </Text>
                <Text style={styles.placeMeta}>{formatPointMeta(selectedPlace.meta)}</Text>
              </View>
              <Pressable
                onPress={() => setSelectedId(null)}
                accessibilityRole="button"
                accessibilityLabel="Закрыть"
                hitSlop={10}
              >
                <IconCircle size={36} backgroundColor="rgba(255,255,255,0.06)" borderColor={colors.border}>
                  <Ionicons name="close" size={18} color={colors.muted} />
                </IconCircle>
              </Pressable>
            </View>

            {routeError ? <Text style={styles.routeError}>{routeError}</Text> : null}

            <View style={styles.placeActions}>
              <Pressable
                onPress={buildRoute}
                accessibilityRole="button"
                accessibilityLabel="Построить маршрут"
                disabled={!userLocation || isRouting}
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={[colors.accent2, colors.accent]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.primaryBtn, (!userLocation || isRouting) && { opacity: 0.55 }]}
                >
                  {isRouting ? (
                    <ActivityIndicator color="#07321D" />
                  ) : (
                    <Ionicons name="git-compare-outline" size={18} color="#07321D" />
                  )}
                  <Text style={styles.primaryBtnText}>Маршрут</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={openInMaps}
                accessibilityRole="button"
                accessibilityLabel="Открыть в Картах"
                style={styles.secondaryBtn}
              >
                <Ionicons name="navigate-outline" size={18} color={colors.text} />
                <Text style={styles.secondaryBtnText}>В картах</Text>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      ) : null}

      <Pressable
        onPress={() => navigation.navigate("TasksModal")}
        accessibilityRole="button"
        accessibilityLabel="Открыть задания"
        style={[styles.tasksBtn, { bottom: tabBarHeight + 18 }]}
      >
        <LinearGradient
          colors={[colors.accent2, colors.accent]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.tasksBtnGradient}
        >
          <Ionicons name="ribbon-outline" size={18} color="#07321D" />
          <Text style={styles.tasksBtnText}>Задания</Text>
          <View style={styles.tasksBadge}>
            <Text style={styles.tasksBadgeText}>3</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: space.lg
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.2
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  },
  statsRow: {
    flexDirection: "row"
  },
  statCard: {
    flex: 1,
    padding: space.md,
    borderRadius: radii.md
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4
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
    zIndex: 30
  },
  placeCard: {
    padding: space.md,
    borderRadius: radii.md
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
  placeSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2
  },
  placeMeta: {
    color: colors.accent,
    fontSize: 11,
    marginTop: 6,
    fontWeight: "700"
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
    marginTop: space.md
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.pill
  },
  primaryBtnText: {
    color: "#07321D",
    fontSize: 14,
    fontWeight: "900",
    marginLeft: 8
  },
  secondaryBtn: {
    marginLeft: space.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: "rgba(7,11,22,0.55)",
    borderColor: colors.border,
    borderWidth: 1
  },
  secondaryBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8
  },
  tasksBtn: {
    position: "absolute",
    alignSelf: "center"
  },
  tasksBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: radii.pill
  },
  tasksBtnText: {
    color: "#07321D",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 8,
    marginRight: 10
  },
  tasksBadge: {
    backgroundColor: "rgba(7,11,22,0.55)",
    borderColor: "rgba(255,255,255,0.20)",
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill
  },
  tasksBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  }
});
