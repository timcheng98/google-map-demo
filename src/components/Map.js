import React, { useState, useEffect } from 'react';
import GoogleMapReact from 'google-map-react';
import * as MapApi from '../core/api/Map'

const Map = () => {
    const [map, setMap] = useState(null);
    const [maps, setMaps] = useState(null);
    const [center, setCenter] = useState({ lat: 22.302711, lng: 114.177216 })
    const [zoom, setZoom] = useState(12);


    useEffect(() => {
        if (!maps || !map) return;
        MapApi.drawHykeCoveredArea(maps, map);
        MapApi.draweBlackSpotMarkerWidthInfoWindow(maps, map);
    }, [maps, map])


    const handleApiLoaded = (map, maps) => {
        // use map and maps objects
        setMap(map)
        setMaps(maps)
    };


    return (
        // Important! Always set the container height explicitly
        <div style={{
            height: '100vh',
            transition: 'all 0.2s ease-in',
            width: '100%',
            touchAction: 'none'
        }}
        >
            <GoogleMapReact
                yesIWantToUseGoogleMapApiInternals
                bootstrapURLKeys={{ key: process.env.REACT_APP_GOOGLE_API_KEY }}
                center={center}
                zoom={zoom}
                options={{
                    zoomControl: false,
                    fullscreenControl: false,
                }}
                onDragEnd={(map) => setCenter(map.center.toJSON())}
                onZoomAnimationEnd={(value) => setZoom(value)}
                onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
            />
        </div>
    );
}


export default Map;
