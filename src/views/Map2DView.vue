<script lang="ts" setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Home from '@arcgis/core/widgets/Home'
import Layer from '@arcgis/core/layers/Layer'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView'
import ScaleBar from '@arcgis/core/widgets/ScaleBar'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { createDefaultLayers } from '@/map/layers'
import {
  formatPointerLocation,
  formatMapExtent,
  handleGetCounties,
  getCountyFeature,
  getTownInfo,
} from '@/map/utils'
import { useMapTools } from '@/map/mapTools'
import LayerList from '@/conponents/LayerList.vue'
import CountyDropdown from '@/conponents/CountyDropdown.vue'
import PlaceInfo from '@/conponents/PlaceInfo.vue'
import SketchTools from '@/conponents/SketchTools.vue'
import MapFooter from '@/conponents/MapFooter.vue'
import CoordinateConverter from '@/conponents/CoordinateConverter.vue'

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
let map: Map
let view: MapView | null

const layers = shallowRef<Layer[]>([])

// GraphicLayer
const graphicsLayer = new GraphicsLayer()

// 初始化 sketch view model
const { init } = useMapTools()

// County 下拉選單 component
const countyDropdownRef = ref<InstanceType<typeof CountyDropdown> | null>(null)

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

// 初始化地圖
const initMap = () => {
  // Create a Map instance
  map = new Map({
    basemap: 'satellite',
  })
  map.add(graphicsLayer)

  // Create a MapView instance
  const newView = new MapView({
    container: mapDiv.value!,
    map: map,
    center: [121, 23.5], // set the center of the map to Taiwan
    zoom: 7,
    ui: {
      components: ['zoom'],
    },
  })

  view = newView

  // 把 view 跟 graphicsLayer 傳給 mapTools
  init(view, graphicsLayer)

  // 設定 widgets
  setupWidgets(view)

  // 綁定事件監聽
  setupEventListeners(newView)
}

// 動態加入/顯示圖層
const handleLayerToggle = (layerId: string, isChecked: boolean) => {
  const layer = map.findLayerById(layerId)

  if (isChecked) {
    if (!layer) {
      const targetLayer = layers.value.find((layer: Layer) => layer.id === layerId)
      if (targetLayer) {
        map.add(targetLayer)
      }
    } else {
      layer.visible = true
    }
  } else {
    if (layer) {
      layer.visible = false
    }
  }
}

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
    view!.goTo({ center: [121, 23.5], zoom: 7 })
    return
  }

  const countyLayer = view!.map?.layers.find((layer) => layer.id === 'countyLayer')

  if (!countyLayer || !countyLayer.visible) {
    window.alert('請先勾選縣市界圖層')
    if (countyDropdownRef.value) {
      countyDropdownRef.value.resetDropdown()
    }
    return
  }

  countyLayer.visible = true

  try {
    const feature = await getCountyFeature(countyCode, countyLayer as FeatureLayer)

    if (feature) {
      // highlight 所選區域
      const layerView = (await view!.whenLayerView(countyLayer!)) as FeatureLayerView
      currentHighlight = layerView.highlight(feature)

      // 前往所選區域
      const targetExtent = feature.geometry!.extent
      view!.goTo(targetExtent!.expand(1.5))
    }
  } catch (error) {
    console.error('查詢區域失敗', error)
  }
}

// 綁定事件監聽
const setupEventListeners = (view: MapView) => {
  // 鼠標移動
  view.on('pointer-move', async (event) => {
    const townLayer = view.map?.layers.find((layer) => layer.id === 'townLayer')
    const countyLayer = view.map?.layers.find((layer) => layer.id === 'countyLayer')

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

  // 滑鼠點擊
  view.on('click', async (event) => {
    const townLayer = view.map?.layers.find((layer) => layer.id === 'townLayer')

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

  // 初始化地圖
  initMap()

  // 取得 counties 下拉選單
  try {
    counties.value = await handleGetCounties()
  } catch (error) {
    console.error('onMounted 失敗', error)
  }
})

onUnmounted(() => {
  if (view) {
    view.destroy()
    view = null
  }
})
</script>
<template>
  <div class="map-container">
    <div ref="mapDiv" class="map"></div>
    <div class="filterContainer">
      <LayerList :layers="layers" @toggleCheckbox="handleLayerToggle"> </LayerList>

      <CountyDropdown :counties="counties" @focusCounty="focusOnCounty" ref="countyDropdownRef">
      </CountyDropdown>

      <PlaceInfo
        v-model:isChoosePlaceMode="isChoosePlaceMode"
        :selectedPlaceInfo="selectedPlaceInfo"
      ></PlaceInfo>

      <CoordinateConverter style="width: 100%"></CoordinateConverter>
    </div>
    <SketchTools
      v-if="view"
      :graphicsLayer="graphicsLayer"
      :mapType="'2D'"
      class="sketch"
    ></SketchTools>

    <MapFooter :mapExtent="mapExtent" :latLng="latLng" class="footer"></MapFooter>
  </div>
</template>

<style lang="scss" scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

.map {
  height: 100vh;
  width: 100%;
}

.filterContainer {
  position: absolute;
  top: 60px;
  left: 30px;
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 14px;
}

.sketch {
  position: absolute;
  top: 20px;
  left: 50%;
  z-index: 99;
}

.footer {
  position: absolute;
  bottom: 30px;
  left: 50%;
}
</style>
