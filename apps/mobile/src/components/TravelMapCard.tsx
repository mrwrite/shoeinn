import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";

import { postAppointmentLocation } from "../api/http";
import { useTheme } from "../theme/theme";
import type { AppointmentStatus } from "../types/booking";
import type { ProviderAppointment } from "../types/company";
import { decodePolyline } from "../utils/decodePolyline";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { SectionHeader } from "./SectionHeader";
import { StatusBadge } from "./StatusBadge";
import { Text } from "./ui/Text";

type TravelMapAppointment = Pick<
  ProviderAppointment,
  | "id"
  | "status"
  | "address_line1"
  | "address_line2"
  | "city"
  | "state"
  | "postal_code"
>;

type Props = {
  appointment: TravelMapAppointment;
  onOpenFullScreenMap?: () => void;
};

const TRAVEL_STATUSES = new Set<AppointmentStatus>(["en_route_pickup", "out_for_delivery"]);
const DIRECTION_REFRESH_MS = 25000;
const LOCATION_REFRESH_MS = 10000;
const MOVE_THRESHOLD_METERS = 50;
const destinationCache = new Map<string, { latitude: number; longitude: number }>();

const buildAddress = (appointment: TravelMapAppointment): string => {
  return [
    appointment.address_line1,
    appointment.address_line2,
    appointment.city,
    appointment.state,
    appointment.postal_code,
  ]
    .filter(Boolean)
    .join(", ");
};

const distanceMeters = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) => {
  const earthRadius = 6371000;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const deltaLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const deltaLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadius * c;
};

export function TravelMapCard({ appointment, onOpenFullScreenMap }: Props) {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const mapRef = useRef<MapView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDirectionsRef = useRef<{ at: number; origin: { latitude: number; longitude: number } } | null>(null);
  const mountedRef = useRef(true);

  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);

  const isTravelStatus = TRAVEL_STATUSES.has(appointment.status);
  const hasDestinationAddress =
    Boolean(appointment.address_line1?.trim()) &&
    Boolean(appointment.city?.trim()) &&
    Boolean(appointment.state?.trim()) &&
    Boolean(appointment.postal_code?.trim());
  const address = useMemo(() => buildAddress(appointment), [appointment]);
  const statusLabel =
    appointment.status === "en_route_pickup" ? "En route to pickup" : "Out for delivery";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isTravelStatus || !isFocused) {
      return;
    }

    let isActive = true;
    const requestPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isActive) return;
      setPermissionStatus(status);
      if (status !== "granted") {
        setLocationError("Location permission denied. Enable location to share your ETA.");
      } else {
        setLocationError(null);
      }
    };

    requestPermission();

    return () => {
      isActive = false;
    };
  }, [isFocused, isTravelStatus]);

  useEffect(() => {
    if (!isTravelStatus) return;
    if (!hasDestinationAddress) {
      setDestination(null);
      setGeocodeError(null);
      return;
    }
    if (!address) {
      setDestination(null);
      setGeocodeError(null);
      return;
    }

    const cached = destinationCache.get(appointment.id);
    if (cached) {
      setDestination(cached);
      return;
    }

    let isActive = true;
    const resolve = async () => {
      try {
        const results = await Location.geocodeAsync(address);
        if (!isActive) return;
        if (!results.length) {
          setGeocodeError("Unable to locate destination.");
          return;
        }
        const next = { latitude: results[0].latitude, longitude: results[0].longitude };
        destinationCache.set(appointment.id, next);
        setDestination(next);
        setGeocodeError(null);
      } catch (err) {
        if (!isActive) return;
        setGeocodeError("Unable to locate destination.");
      }
    };

    resolve();

    return () => {
      isActive = false;
    };
  }, [address, appointment.id, hasDestinationAddress, isTravelStatus]);

  useEffect(() => {
    if (!providerLocation || !destination) {
      return;
    }

    mapRef.current?.fitToCoordinates([providerLocation, destination], {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [providerLocation, destination]);

  useEffect(() => {
    if (!isTravelStatus || !isFocused || permissionStatus !== "granted") {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let isActive = true;
    const sendLocation = async () => {
      try {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };
        if (mountedRef.current) {
          setProviderLocation(coords);
          setLocationError(null);
        }

        await postAppointmentLocation(appointment.id, {
          lat: current.coords.latitude,
          lng: current.coords.longitude,
          heading: current.coords.heading ?? undefined,
          speed: current.coords.speed ?? undefined,
          accuracy: current.coords.accuracy ?? undefined,
        });

        if (destination) {
          await maybeFetchDirections(coords);
        }
      } catch (err) {
        if (mountedRef.current) {
          setLocationError("Unable to read your current location.");
        }
      }
    };

    const maybeFetchDirections = async (origin: { latitude: number; longitude: number }) => {
      if (!destination) return;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setDirectionsError("Google Maps API key missing.");
        return;
      }

      const now = Date.now();
      const last = lastDirectionsRef.current;
      const moved =
        last?.origin ? distanceMeters(last.origin, origin) : Number.POSITIVE_INFINITY;

      if (last && now - last.at < DIRECTION_REFRESH_MS && moved < MOVE_THRESHOLD_METERS) {
        return;
      }

      lastDirectionsRef.current = { at: now, origin };

      try {
        setLoadingDirections(true);
        const url =
          "https://maps.googleapis.com/maps/api/directions/json" +
          `?origin=${origin.latitude},${origin.longitude}` +
          `&destination=${destination.latitude},${destination.longitude}` +
          `&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status !== "OK" || !data.routes?.length) {
          throw new Error(data.status || "No route");
        }
        const route = data.routes[0];
        const leg = route.legs?.[0];
        const points = route.overview_polyline?.points;
        if (points) {
          const decoded = decodePolyline(points);
          if (mountedRef.current) {
            setRouteCoords(decoded);
          }
        }
        if (mountedRef.current) {
          setEta(leg?.duration?.text ?? null);
          setDistance(leg?.distance?.text ?? null);
          setDirectionsError(null);
        }
      } catch (err) {
        if (mountedRef.current) {
          setDirectionsError("Unable to load route.");
        }
      } finally {
        if (mountedRef.current) {
          setLoadingDirections(false);
        }
      }
    };

    sendLocation();
    intervalRef.current = setInterval(() => {
      if (isActive) {
        sendLocation();
      }
    }, LOCATION_REFRESH_MS);

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [appointment.id, destination, isFocused, isTravelStatus, permissionStatus]);

  const openInMaps = () => {
    const encodedAddress = encodeURIComponent(address);
    let url = "";
    if (destination) {
      const coords = `${destination.latitude},${destination.longitude}`;
      url =
        Platform.OS === "ios"
          ? `http://maps.apple.com/?daddr=${coords}`
          : Platform.OS === "android"
            ? `geo:${coords}?q=${coords}`
            : `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
    } else {
      url =
        Platform.OS === "ios"
          ? `http://maps.apple.com/?q=${encodedAddress}`
          : Platform.OS === "android"
            ? `geo:0,0?q=${encodedAddress}`
            : `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    }

    Linking.openURL(url);
  };

  if (!isTravelStatus) {
    return null;
  }

  const showMap = permissionStatus === "granted" && destination && hasDestinationAddress;

  return (
    <Card variant="marketplace" style={styles.card}>
      <View style={styles.header}>
        <SectionHeader title="Route and location" subtitle={address || "Destination pending"} style={styles.headerCopy} />
        <StatusBadge label={statusLabel} tone="primary" />
        {onOpenFullScreenMap ? (
          <Button label="Appointment details" variant="ghost" onPress={onOpenFullScreenMap} />
        ) : null}
      </View>

      <View style={styles.pills}>
        {eta ? (
          <View style={[styles.pill, { backgroundColor: theme.colors.surface }]}>
            <Text weight="semibold">{eta}</Text>
          </View>
        ) : null}
        {distance ? (
          <View style={[styles.pill, { backgroundColor: theme.colors.surface }]}>
            <Text weight="semibold">{distance}</Text>
          </View>
        ) : null}
      </View>

      {!hasDestinationAddress ? (
        <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}>
          <Text color={theme.colors.textSecondary}>Customer address missing. Ask customer to update address.</Text>
          {onOpenFullScreenMap ? (
            <Button label="Open appointment details" variant="secondary" onPress={onOpenFullScreenMap} style={{ marginTop: 12 }} />
          ) : null}
        </View>
      ) : locationError ? (
        <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}>
          <Text color={theme.colors.textSecondary}>{locationError}</Text>
          <Button label="Open in Maps" variant="secondary" onPress={openInMaps} style={{ marginTop: 12 }} />
        </View>
      ) : geocodeError ? (
        <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}>
          <Text color={theme.colors.textSecondary}>{geocodeError}</Text>
          <Button label="Open in Maps" variant="secondary" onPress={openInMaps} style={{ marginTop: 12 }} />
        </View>
      ) : showMap ? (
        <View style={[styles.mapWrapper, { borderColor: theme.colors.border }]}>
          <MapView
            ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: destination.latitude,
              longitude: destination.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }}
          >
            {providerLocation ? (
              <Marker
                coordinate={providerLocation}
                title="You"
                pinColor={theme.colors.primary}
              />
            ) : null}
            <Marker coordinate={destination} title="Destination" />
            {routeCoords.length ? (
              <Polyline coordinates={routeCoords} strokeColor={theme.colors.primary} strokeWidth={4} />
            ) : null}
          </MapView>
          {loadingDirections ? (
            <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.surfaceElevated }]}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : null}
          {directionsError ? (
            <View style={styles.mapFooter}>
              <Text color={theme.colors.textSecondary}>{directionsError}</Text>
              <Button label="Open in Maps" variant="ghost" onPress={openInMaps} style={{ marginTop: 6 }} />
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}>
          <Text color={theme.colors.textSecondary}>Waiting for location permission...</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  pills: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  mapWrapper: {
    marginTop: 4,
    height: 220,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    borderRadius: 16,
    padding: 6,
  },
  messageBox: {
    padding: 16,
    borderRadius: 18,
  },
  mapFooter: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 12,
    padding: 10,
  },
});
