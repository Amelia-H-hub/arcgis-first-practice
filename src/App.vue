<script lang="ts" setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Home from '@arcgis/core/widgets/Home'
import { createDefaultLayers } from '@/map/layers'
import {
  formatPointerLocation,
  formatMapExtent,
  handleGetCounties,
  getCountyFeature,
  getTownInfo,
} from '@/map/utils'
import LayerList from '@/conponents/LayerList.vue'
import CountyDropdown from '@/conponents/CountyDropdown.vue'
import PlaceInfo from '@/conponents/PlaceInfo.vue'
import SketchTools from '@/conponents/SketchTools.vue'
import MapFooter from '@/conponents/MapFooter.vue'
import Layer from '@arcgis/core/layers/Layer'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView'
import ScaleBar from '@arcgis/core/widgets/ScaleBar'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import CoordinateConverter from './conponents/CoordinateConverter.vue'

interface ExtentData {
  xmin: string
  ymin: string
  xmax: string
  ymax: string
}

interface County {
  countycode: string
  countyname: string
}

const mapDiv = shallowRef<HTMLDivElement | null>(null)
let view = shallowRef<MapView | null>(null)

const layers = shallowRef<Layer[]>([])

// 縣市下拉選單
const counties = ref<County[]>([])

// Highlight
let currentHighlight: any = null

// 鼠標經緯度
const latLng = ref({ lat: '0.000000', lng: '0.000000' })

// 地圖範圍 (Extent)
const mapExtent = ref<ExtentData>({
  xmin: '0.000000',
  ymin: '0.000000',
  xmax: '0.000000',
  ymax: '0.000000',
})

// 控制是否能選取縣市、鄉鎮
const isChoosePlaceMode = ref<boolean>(false)

// 選中之縣市、鄉鎮資料
const selectedPlaceInfo = ref<any>(null)

// GraphicLayer
const graphicsLayer = new GraphicsLayer()

// 設定 widgets
const setupWidgets = (view: MapView) => {
  const homeBtn = new Home({ view })
  const scaleBar = new ScaleBar({ view, unit: 'metric' })

  view.ui.add(homeBtn, 'top-right')
  view.ui.add(scaleBar, 'bottom-right')
  view.ui.move('zoom', 'top-right')
}

// 聚焦所選縣市
const focusOnCounty = async (countyCode: string) => {
  if (currentHighlight) {
    currentHighlight.remove()
  }

  if (!countyCode || countyCode === '') {
    view.value!.goTo({ center: [121, 23.5], zoom: 7 })
    return
  }

  const countyLayer = view.value!.map?.layers.find((layer) => layer.id === 'countyLayer')

  try {
    const feature = await getCountyFeature(countyCode, countyLayer as FeatureLayer)

    if (feature) {
      // highlight 所選區域
      const layerView = (await view.value!.whenLayerView(countyLayer!)) as FeatureLayerView
      currentHighlight = layerView.highlight(feature)

      // 前往所選區域
      const targetExtent = feature.geometry!.extent
      view.value!.goTo(targetExtent!.expand(1.5))
    }
  } catch (error) {
    console.error('查詢區域失敗', error)
  }
}

// 綁定事件監聽
const setupEventListeners = (view: MapView) => {
  const townLayer = view.map?.layers.find((layer) => layer.id === 'townLayer')
  const countyLayer = view.map?.layers.find((layer) => layer.id === 'countyLayer')

  view.on('pointer-move', async (event) => {
    // 顯示鼠標位置經緯度
    const pointerLocation = formatPointerLocation(view, event.x, event.y)
    if (pointerLocation) {
      latLng.value = pointerLocation
    }

    // 設定游標樣式
    const response = await view!.hitTest(event)
    const hit = response.results.some(
      (result) => result.layer === countyLayer || result.layer === townLayer,
    )

    view.container!.style.cursor = isChoosePlaceMode.value && hit ? 'pointer' : 'default'
  })

  // Get Map Extent
  reactiveUtils.watch(
    () => view?.stationary,
    (stationary) => {
      if (stationary) {
        const extentResult = formatMapExtent(view)
        if (extentResult) {
          mapExtent.value = extentResult
        }
      }
    },
  )

  view.on('click', async (event) => {
    if (isChoosePlaceMode.value) {
      const townAttributes = await getTownInfo(townLayer as MapImageLayer, event.mapPoint, view)
      selectedPlaceInfo.value = townAttributes
      return
    }
  })
}

onMounted(async () => {
  if (!mapDiv.value) {
    return
  }

  // Get layers
  const defaultLayers = createDefaultLayers()
  layers.value = defaultLayers

  // Create a Map instance
  const map = new Map({
    basemap: 'satellite',
    layers: layers.value,
  })
  map.add(graphicsLayer)

  // Create a MapView instance
  const newView = new MapView({
    container: mapDiv.value!,
    map: map,
    center: [121, 23.5], // set the center of the map to Taiwan
    zoom: 7,
  })

  view.value = newView

  // 設定 widgets
  setupWidgets(newView)

  // 綁定事件監聽
  setupEventListeners(newView)

  // 取得 counties 下拉選單
  try {
    counties.value = await handleGetCounties()
  } catch (error) {
    console.error('onMounted 失敗', error)
  }
})

onUnmounted(() => {
  if (view.value) {
    view.value!.destroy()
    view.value = null
  }
})
</script>
<template>
  <div id="app-wrapper">
    <nav class="global-nav">
      <router-link to="/map2d" active-class="active-btn">2D 地圖</router-link>
      <router-link to="/map3d" active-class="active-btn">3D 圖台</router-link>
    </nav>

    <router-view />

    <NotificationOverlay />
  </div>
</template>

<style lang="scss" scoped>
.global-nav {
  position: absolute;
  top: 10px;
  left: 30px;
  z-index: 1000;
  display: flex;
  gap: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);

  a {
    text-decoration: none;
    color: #333;
    padding: 2px 8px;
    border-radius: 6px;
    font-weight: bold;
    transition: all 0.3s ease;

    &:hover {
      background: #d1d1d1;
    }

    &.active-btn {
      background-color: #0079c1; /* ArcGIS 藍 */
      color: white;
    }
  }
}
</style>
