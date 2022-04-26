import axios from 'axios';
import _ from 'lodash';
let prev_infowindow = null;

const LANGUAGE = 'en'; // real situation will use i18n instead of hardcode

export const getRawHykeBlackSpotsData = async () => {
    const data = await axios.get('https://s3.us-west-2.amazonaws.com/secure.notion-static.com/ca2a3381-0176-41d1-bb5e-b59631fe935a/black-spots.data-item.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220426%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220426T083656Z&X-Amz-Expires=86400&X-Amz-Signature=1ae35bbab71d6c9f7ec436a8f6daef4d454a864417bf3b7c9991c863352fba80&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22black-spots.data-item.json%22&x-id=GetObject')

    if (data.status !== 200) return [];
    return data.data;
}

export const getRawHykeCoveredAreaData = async () => {
    const data = await axios.get('https://s3.us-west-2.amazonaws.com/secure.notion-static.com/a49f138a-e567-475c-a5f8-100d78b5b1e3/covered-areas.data-item.json?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIAT73L2G45EIPT3X45%2F20220426%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20220426T083647Z&X-Amz-Expires=86400&X-Amz-Signature=7cd28f2def1a49d02226c7e13c2908adcf813d80fb91900dfc2650fddbc7d74f&X-Amz-SignedHeaders=host&response-content-disposition=filename%20%3D%22covered-areas.data-item.json%22&x-id=GetObject')

    if (data.status !== 200) return [];
    return data.data;
}

export const drawHykeCoveredArea = async (maps, map) => {
    const rawHykeCoveredAreaData = await getRawHykeCoveredAreaData();
    if (_.isEmpty(rawHykeCoveredAreaData)) return;
    const structuredRegions = []

    // prevent bigO(n^3) -> big(n^2) -> put all the regions in to new arrs.
    _.map(rawHykeCoveredAreaData, (r) => {
        _.map(r.polygonalRegions, ({
            outerRing,
            innerRings
        }) => {
            if (!_.isEmpty(outerRing)) {
                structuredRegions.push({
                    id: r.id,
                    polygonRegion: outerRing,
                    type: 'outerRing'
                })
            }

            if (!_.isEmpty(innerRings)) {
                structuredRegions.push({
                    id: r.id,
                    polygonRegion: innerRings,
                    type: 'innerRing'
                })
            }
        })
    })

    // bigO(n^2) 
    _.map(structuredRegions, ({ polygonRegion }) => {
        // convert to latlng instance, (latitude, longitude) not support from google api standard.
        let path = _.map(polygonRegion, (pos) => {
            const latlng = new maps.LatLng(pos.latitude, pos.longitude)
            return latlng
        })

        const polylines = {
            path,
            geodesic: true,
            strokeColor: "#0CE09B",
            strokeOpacity: 1.0,
            strokeWeight: 3,
            fillColor: "#0CE19B",
        }
        const polyline = new maps.Polygon(polylines)
        polyline.setMap(map)
    })
}

export const draweBlackSpotMarkerWidthInfoWindow = async (maps, map) => {
    const data = await getRawHykeBlackSpotsData();
    if (!data) return null;
    _.map(data, (item) => {
        const { circularRegion } = item;
        const { coordinate, radius } = circularRegion;
        const latlng = new maps.LatLng(coordinate.latitude, coordinate.longitude)

        // circle instance
        new maps.Circle({
            center: latlng,
            radius,
            map,
            fillColor: '#FF0000',
            strokeColor: '#FF0000',
            strokeWeight: 1
        })
        // info window instance
        const infoWindow = new maps.InfoWindow({
            position: latlng,
            maxWidth: 180,
            content: `<div style="text-align: left"><p style="font-size: 14p"><strong>High Risk area(HYKE does not cover)</strong></p>${item.name[LANGUAGE]}</div>`,
            ariaLabel: `High Risk area(HYKE does not cover) \n ${item.name[LANGUAGE]}`,
        })

        // marker instance
        const marker = new maps.Marker({
            icon: {
                url: "https://www.freepnglogos.com/uploads/warning-sign-png/warning-sign-vector-clip-art-22.png",
                scaledSize: new maps.Size(50, 50),
                anchor: new maps.Point(25, 25)
            },
            map,
            position: latlng,
        });

        // add marker listeners
        marker.addListener('click', function () {
            map.setCenter(marker.getPosition())
            if (prev_infowindow) {
                prev_infowindow.close();
            }
            console.log(infoWindow)
            infoWindow.open({
                map,
                anchor: marker,
                shouldFocus: true
            });
            prev_infowindow = infoWindow;
        });
    })
}