import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Platform, StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { useIsFocused } from "@react-navigation/native";
import * as Location from "expo-location";

import { getAppointmentProviderLocation } from "../api/http";
import { useTheme } from "../theme/theme";
import type { AppointmentStatus } from "../types/booking";
import { decodePolyline } from "../utils/decodePolyline";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Text } from "./ui/Text";

type Props = {
  appointment: {
    id: string;
    status: AppointmentStatus;
    address_line1?: string | null;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
  };
};

const TRAVEL_STATUSES = new Set<AppointmentStatus>(["en_route_pickup", "out_for_delivery"]);
const DIRECTION_REFRESH_MS = 25000;
const PROVIDER_REFRESH_MS = 10000;
const MOVE_THRESHOLD_METERS = 50;
const destinationCache = new Map<string, { latitude: number; longitude: number }>();

const buildAddress = (appointment: Props["appointment"]): string => {
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

export function CustomerTravelMapCard({ appointment }: Props) {
  const theme = useTheme();
  const isFocused = useIsFocused();
  const mapRef = useRef<MapView | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDirectionsRef = useRef<{ at: number; origin: { latitude: number; longitude: number } } | null>(null);
  const mountedRef = useRef(true);

  const [providerLocation, setProviderLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destination, setDestination] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationLabel, setDestinationLabel] = useState<string>("Destination pending");
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [eta, setEta] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [usingCustomerGps, setUsingCustomerGps] = useState(false);

  const isTravelStatus = TRAVEL_STATUSES.has(appointment.status);
  const address = useMemo(() => buildAddress(appointment), [appointment]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isTravelStatus) {
      return;
    }

    let isActive = true;
    const resolveDestination = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!isActive) return;

      if (status === "granted") {
        try {
          const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!isActive) return;
          const coords = { latitude: current.coords.latitude, longitude: current.coords.longitude };
          setDestination(coords);
          setDestinationLabel("Your current location");
          setUsingCustomerGps(true);
          setDestinationError(null);
          return;
        } catch (err) {
          // fallback to appointment address
        }
      }

      if (!address) {
        setDestination(null);
        setUsingCustomerGps(false);
        setDestinationLabel("Destination pending");
        setDestinationError("Destination address unavailable.");
        return;
      }

      const cached = destinationCache.get(appointment.id);
      if (cached) {
        setDestination(cached);
        setUsingCustomerGps(false);
        setDestinationLabel(address);
        setDestinationError(null);
        return;
      }

      try {
        const results = await Location.geocodeAsync(address);
        if (!isActive) return;
        if (!results.length) {
          setDestination(null);
          setUsingCustomerGps(false);
          setDestinationLabel(address);
          setDestinationError("Unable to locate appointment address.");
          return;
        }
        const next = { latitude: results[0].latitude, longitude: results[0].longitude };
        destinationCache.set(appointment.id, next);
        setDestination(next);
        setUsingCustomerGps(false);
        setDestinationLabel(address);
        setDestinationError(null);
      } catch (err) {
        if (!isActive) return;
        setDestination(null);
        setUsingCustomerGps(false);
        setDestinationLabel(address);
        setDestinationError("Unable to locate appointment address.");
      }
    };

    resolveDestination();

    return () => {
      isActive = false;
    };
  }, [address, appointment.id, isTravelStatus]);

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
    if (!isTravelStatus || !isFocused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let isActive = true;

    const maybeFetchDirections = async (origin: { latitude: number; longitude: number }) => {
      if (!destination) return;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setDirectionsError(null);
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
          setDirectionsError("Unable to load route right now.");
        }
      } finally {
        if (mountedRef.current) {
          setLoadingDirections(false);
        }
      }
    };

    const refreshProviderLocation = async () => {
      try {
        const response = await getAppointmentProviderLocation(appointment.id);
        const raw = response.location;
        if (!raw) {
          setProviderLocation(null);
          setProviderError("Waiting for provider location…");
          setEta(null);
          setDistance(null);
          setRouteCoords([]);
          return;
        }

        const coords = { latitude: raw.lat, longitude: raw.lng };
        setProviderLocation(coords);
        setProviderError(null);

        if (destination) {
          await maybeFetchDirections(coords);
        }
      } catch (err) {
        if (mountedRef.current) {
          setProviderError("Waiting for provider location…");
        }
      }
    };

    refreshProviderLocation();
    intervalRef.current = setInterval(() => {
      if (isActive) {
        refreshProviderLocation();
      }
    }, PROVIDER_REFRESH_MS);

    return () => {
      isActive = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [appointment.id, destination, isFocused, isTravelStatus]);

  const openInMaps = () => {
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
      const encodedAddress = encodeURIComponent(address);
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

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text weight="semibold">
            {appointment.status === "en_route_pickup" ? "Provider en route to pickup" : "Provider out for delivery"}
          </Text>
          <Text color={theme.colors.mutedText} style={{ marginTop: 4 }}>
            {destinationLabel}
          </Text>
        </View>
      </View>

      <View style={styles.pills}>
        {eta ? (
          <View style={[styles.pill, { backgroundColor: theme.colors.border }]}>
            <Text weight="semibold">{eta}</Text>
          </View>
        ) : null}
        {distance ? (
          <View style={[styles.pill, { backgroundColor: theme.colors.border }]}>
            <Text weight="semibold">{distance}</Text>
          </View>
        ) : null}
      </View>

      {destinationError ? (
        <View style={styles.messageBox}>
          <Text color={theme.colors.mutedText}>{destinationError}</Text>
          <Button label="Open in Maps" variant="secondary" onPress={openInMaps} style={{ marginTop: 12 }} />
        </View>
      ) : providerError && !providerLocation ? (
        <View style={styles.messageBox}>
          <Text color={theme.colors.mutedText}>{providerError}</Text>
          <Button label="Open in Maps" variant="secondary" onPress={openInMaps} style={{ marginTop: 12 }} />
        </View>
      ) : destination ? (
        <View style={styles.mapWrapper}>
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
            {providerLocation ? <Marker coordinate={providerLocation} title="Provider" pinColor={theme.colors.peacockPrimary} /> : null}
            <Marker coordinate={destination} title={usingCustomerGps ? "You" : "Destination"} />
            {routeCoords.length ? (
              <Polyline coordinates={routeCoords} strokeColor={theme.colors.peacockPrimary} strokeWidth={4} />
            ) : null}
          </MapView>
          {loadingDirections ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={theme.colors.peacockPrimary} />
            </View>
          ) : null}
          {directionsError ? (
            <View style={styles.mapFooter}>
              <Text color={theme.colors.mutedText}>{directionsError}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.messageBox}>
          <Text color={theme.colors.mutedText}>Preparing destination…</Text>
        </View>
      )}
      <Button label="Open in Maps" variant="ghost" onPress={openInMaps} style={{ marginTop: 12 }} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
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
    marginTop: 16,
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
  },
  loadingOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 6,
  },
  messageBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
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
