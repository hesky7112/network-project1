import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with Webpack/Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface NetworkMapProps {
    devices: any[];
    users: any[];
}

const NetworkMap: React.FC<NetworkMapProps> = ({ devices, users }) => {
    // Center of Nairobi as default
    const center: [number, number] = [-1.286389, 36.817223];

    return (
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '1.5rem' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Devices / Towers */}
            {devices.map((device) => (
                <React.Fragment key={device.id}>
                    <Marker position={[device.lat || center[0] + (Math.random() - 0.5) * 0.02, device.lng || center[1] + (Math.random() - 0.5) * 0.02]}>
                        <Popup>
                            <div className="text-black">
                                <strong className="text-indigo-600">{device.name}</strong><br />
                                Model: {device.model}<br />
                                IP: {device.ip_address}
                            </div>
                        </Popup>
                    </Marker>
                    <Circle
                        center={[device.lat || center[0], device.lng || center[1]]}
                        radius={2000} // 2km coverage
                        pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.1 }}
                    />
                </React.Fragment>
            ))}

            {/* Users */}
            {users.map((user) => (
                <Marker
                    key={user.id}
                    position={[user.lat || center[0] + (Math.random() - 0.5) * 0.05, user.lng || center[1] + (Math.random() - 0.5) * 0.05]}
                    icon={L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: #f472b6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                        iconSize: [10, 10],
                        iconAnchor: [5, 5]
                    })}
                >
                    <Popup>
                        <div className="text-black">
                            <strong>{user.username}</strong><br />
                            Status: {user.service_type}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default NetworkMap;
