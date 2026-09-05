import React, { useEffect, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { getOpenWeatherTileUrl } from "../api/client.js";

const LAYERS = [
  { id: "temp_new", label: "Temperature", icon: "fa-temperature-half" },
  { id: "clouds_new", label: "Clouds", icon: "fa-cloud" },
  { id: "precipitation_new", label: "Rain", icon: "fa-cloud-rain" },
  { id: "wind_new", label: "Wind", icon: "fa-wind" },
];

function RecenterMap({ lat, lon }) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon], map.getZoom());
  }, [lat, lon, map]);

  return null;
}

export default function OpenWeatherMap({ location, risk }) {
  const [layer, setLayer] = useState("temp_new");

  if (!location || location.lat === null || location.lon === null) {
    return <div className="map-loading">Live GPS location ka wait ho raha hai...</div>;
  }

  return (
    <div className="external-map">
      <div className="map-layer-controls" aria-label="Weather map layers">
        {LAYERS.map((item) => (
          <button
            className={`map-layer-btn${layer === item.id ? " active" : ""}`}
            key={item.id}
            type="button"
            onClick={() => setLayer(item.id)}
            title={`Show ${item.label.toLowerCase()} layer`}
          >
            <i className={`fa-solid ${item.icon}`}></i>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      {risk?.risk_level === "Red" && (
        <div className="map-red-alert" role="alert">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span><strong>Red heat alert</strong> · Current area mein extreme heat risk hai</span>
        </div>
      )}

      <MapContainer
        center={[location.lat, location.lon]}
        zoom={5}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://openweathermap.org/">OpenWeather</a> contributors'
          url={getOpenWeatherTileUrl(layer)}
          opacity={0.82}
          updateWhenIdle={true}
          keepBuffer={0}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          opacity={0.35}
          updateWhenIdle={true}
          keepBuffer={0}
        />
        <RecenterMap lat={location.lat} lon={location.lon} />
        <Marker position={[location.lat, location.lon]}>
          <Popup>{location.label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}