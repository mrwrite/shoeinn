import { useEffect, useState } from "react";
import * as Location from "expo-location";

interface CityState {
  city: string | null;
  state: string | null;
  loading: boolean;
  error: string | null;
}

export function useCityState(): CityState {
  const [city, setCity] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          return;
        }

        const position = await Location.getCurrentPositionAsync({});
        const results = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        const place = results[0];
        if (!cancelled && place) {
          setCity(place.city ?? null);
          setState(place.region ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  return { city, state, loading, error };
}
