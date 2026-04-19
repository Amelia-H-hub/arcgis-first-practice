<script lang="ts" setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Home from '@arcgis/core/widgets/Home';
import WebTileLayer from "@arcgis/core/layers/WebTileLayer.js";
import LayerList from "@arcgis/core/widgets/LayerList";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import WMSLayer from "@arcgis/core/layers/WMSLayer";

const mapDiv = shallowRef<HTMLDivElement | null>(null);
let view: MapView | null = null;

const latLng = ref({ lat: "0.000000", lng: "0.000000" });

onMounted(() => {
  if (!mapDiv.value) {
    return;
  }

  // Create a Map instance
  const map = new Map({
    basemap: 'satellite',
  });

  // Create a MapView instance
  view = new MapView({
    container: mapDiv.value!,
    map: map,
    center: [121, 23.5], // set the center of the map to Taiwan
    zoom: 7,
  });

  // Add Home widget
  const homeBtn = new Home({
    view: view
  });
  view.ui.add(homeBtn, "top-right");

  view.ui.move("zoom", "top-right");

  const layerList = new LayerList({
    view: view,
  });
  view.ui.add(layerList, "top-left");

  // 內政部國土測繪圖資
  const tiledLayer = new WebTileLayer({
    urlTemplate: "https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/{level}/{row}/{col}",
  });
  map.add(tiledLayer);

  // 鄉鎮市區界圖層
  const townLayer = new MapImageLayer({
    url: "https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_Town_84/MapServer/0",
  });
  map.add(townLayer);

  // 加油站圖層
  const gasStationLayer = new FeatureLayer({
    url: "https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_POI/MapServer/1",
  });
  map.add(gasStationLayer);

  // 飯店旅館圖層
  const hotelsLayer = new FeatureLayer({
    url: "https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_POI/MapServer/0",
  });
  map.add(hotelsLayer);

  // 工業區圖層
  const industrialLayer = new WMSLayer({
    url: "https://richimap1.richitech.com.tw/arcgis/services/CBB_Practice/CBB_Practice_Industrial/MapServer/WMSServer",
  });
  map.add(industrialLayer);

  view.on("pointer-move", (event) => {
    const point = view!.toMap({ x: event.x, y: event.y });
    if (point) {
      latLng.value = {
        lat: point.latitude?.toFixed(6) || "0.000000",
        lng: point.longitude?.toFixed(6) || "0.000000",
      };
    }
  })
});

onUnmounted(() => {
  if (view) {
    view.destroy();
  }
})
</script>
<template>
  <div ref="mapDiv" class="map"></div>
  <div class="footer">
    <div class="footer_space"></div>
    <div class="footer__latLng">
      經度: {{ latLng.lat }} | 緯度: {{ latLng.lng }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.map {
  height: 100vh;
  width: 100%;
}
.footer {
  position: absolute;
  bottom: 30px;
  left: 50%;
  display: flex;
  justify-content: space-between;
  align-items: end;
  transform: translateX(-50%);
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px 10px;
  border-radius: 5px;

  &__latLng {
    font-size: 14px;
    color: #333;
  }
}
</style>
