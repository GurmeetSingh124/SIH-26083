import { useState, useCallback, useEffect } from "react";

const INITIAL_LOCATION = {
  label: "Detecting live GPS location...",
  lat: null,
  lon: null,
};

function formatGpsLabel(latitude, longitude) {
  return `Live GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

async function getAreaName(latitude, longitude) {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: latitude.toString(),
    lon: longitude.toString(),
    zoom: "18",
    addressdetails: "1",
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`);
    if (!response.ok) return null;
    const data = await response.json();
    const address = data.address || {};
    const area = [
      address.neighbourhood,
      address.suburb,
      address.city_district,
      address.town || address.city || address.village,
    ].find(Boolean);
    return area || data.display_name?.split(",").slice(0, 2).join(", ") || null;
  } catch {
    return null;
  }
}

export function useGeolocation() {
  const [location, setLocation] = useState(INITIAL_LOCATION);
  const [status, setStatus] = useState("idle"); // idle | locating | done | denied | error

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLocation({
          label: formatGpsLabel(latitude, longitude),
          lat: latitude,
          lon: longitude,
        });
        setStatus("done");

        getAreaName(latitude, longitude).then((area) => {
          if (area) {
            setLocation((current) => ({
              ...current,
              label: area,
            }));
          }
        });
      },
      () => {
        setStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    useMyLocation();
  }, [useMyLocation]);

  const setManualLocation = useCallback((label, lat, lon) => {
    setLocation({ label, lat, lon });
    setStatus("done");
  }, []);

  return { location, status, useMyLocation, setManualLocation };
}
