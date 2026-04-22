<script lang="ts" setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import Map from '@arcgis/core/Map'
import SceneView from '@arcgis/core/views/SceneView'
import Home from '@arcgis/core/widgets/Home'
import ScaleBar from '@arcgis/core/widgets/ScaleBar'
import Layer from '@arcgis/core/layers/Layer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import FeatureLayerView from '@arcgis/core/views/layers/FeatureLayerView'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
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
import CoordinateConverter from '@/conponents/CoordinateConverter.vue'

interface County {
  countycode: string
  countyname: string
}

interface ExtentData {
  xmin: string
  ymin: string
  xmax: string
  ymax: string
}

const mapDiv = shallowRef<HTMLDivElement | null>(null)
let view = shallowRef<SceneView | null>(null)

const layers = shallowRef<Layer[]>([])

// GraphicLayer
const graphicsLayer = new GraphicsLayer()

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

// 設定 widgets
const setupWidgets = (view: SceneView) => {
  view.when(() => {
    const homeBtn = new Home({ view })
    // const scaleBar = new ScaleBar({
    //   view: view as any,
    //   unit: 'metric',
    //   style: 'line',
    // })

    view.ui.add(homeBtn, 'top-right')
    // view.ui.add(scaleBar, 'bottom-right')
    view.ui.move('zoom', 'top-right')
  })
}

// 綁定事件監聽
const setupEventListeners = (view: SceneView) => {
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
  const newView = new SceneView({
    container: mapDiv.value!,
    map: map,
    center: [121, 23.5], // set the center of the map to Taiwan
    zoom: 7,
    ui: {
      components: ['zoom'],
    },
  })

  view.value = newView

  // 設定 widgets
  setupWidgets(view.value)

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
  <div class="map-container">
    <div ref="mapDiv" class="map"></div>
    <div class="filterContainer">
      <LayerList :layers="layers"> </LayerList>

      <CountyDropdown :counties="counties" @focusCounty="focusOnCounty"> </CountyDropdown>

      <PlaceInfo
        v-model:isChoosePlaceMode="isChoosePlaceMode"
        :selectedPlaceInfo="selectedPlaceInfo"
      ></PlaceInfo>

      <CoordinateConverter style="width: 100%"></CoordinateConverter>
    </div>
    <SketchTools
      v-if="view"
      :graphicsLayer="graphicsLayer"
      :view="view"
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
