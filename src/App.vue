<script lang="ts" setup>
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import Home from '@arcgis/core/widgets/Home'
import Layer from '@arcgis/core/layers/Layer'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import WMSLayer from '@arcgis/core/layers/WMSLayer'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'
import ScaleBar from '@arcgis/core/widgets/ScaleBar'
import Extent from '@arcgis/core/geometry/Extent'
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import Graphic from '@arcgis/core/Graphic.js'

interface ExtentData {
  xmin: string
  ymin: string
  xmax: string
  ymax: string
}

const mapDiv = shallowRef<HTMLDivElement | null>(null)
let view: MapView | null = null

// 圖層 ==================================================
// 內政部國土測繪圖資
const tiledLayer = new WebTileLayer({
  urlTemplate:
    'https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/{level}/{row}/{col}',
  title: '國土測繪圖資',
  visible: true,
})

// 鄉鎮市區界圖層
const townLayer = new MapImageLayer({
  url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_Town_84/MapServer',
  title: '鄉鎮市區界圖層',
  visible: true,
  opacity: 0.3,
  sublayers: [
    {
      id: 0,
      visible: true,
    },
  ],
})

// 加油站圖層
const gasStationLayer = new FeatureLayer({
  url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_POI/MapServer/1',
  title: '加油站圖層',
  visible: true,
})

// 飯店旅館圖層
const hotelsLayer = new FeatureLayer({
  url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_POI/MapServer/0',
  title: '飯店旅館圖層',
  visible: true,
})

// 工業區圖層
const industrialLayer = new WMSLayer({
  url: 'https://richimap1.richitech.com.tw/arcgis/services/CBB_Practice/CBB_Practice_Industry_84/MapServer/WMSServer?request=GetCapabilities&service=WMS',
  title: '工業區圖層',
  visible: true,
})

// 地震圖層 - Popup 資訊
const earthquakePopup = {
  title: '地震資訊',
  content: `
    <p> 地震規模：{mag} </p>
    <p> 地震時間：{time} </p>
  `,
  fieldInfos: [
    {
      fieldName: 'time',
      format: {
        dateFormat: 'short-date-short-time-24',
      },
    },
  ],
}

// 地震圖層 - 設定顏色
const earthquakeRenderer = {
  type: 'class-breaks',
  field: 'mag',
  classBreakInfos: [
    {
      minValue: 3,
      maxValue: 6.99,
      symbol: { type: 'simple-marker', color: 'yellow' },
    },
    {
      minValue: 7,
      maxValue: 10,
      symbol: { type: 'simple-marker', color: 'red' },
    },
  ],
}

// 地震圖層
const earthquakeLayer = new GeoJSONLayer({
  url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson',
  outFields: ['mag', 'time'],
  definitionExpression: 'mag > 3',
  title: '近一個月地震',
  visible: true,
  renderer: earthquakeRenderer as any,
  popupTemplate: earthquakePopup as any,
})

const layers = ref<Layer[]>([])

// 鼠標經緯度
const latLng = ref({ lat: '0.000000', lng: '0.000000' })

// 地圖範圍 (Extent)
const mapExtent = ref<ExtentData>({
  xmin: '0.000000',
  ymin: '0.000000',
  xmax: '0.000000',
  ymax: '0.000000',
})

// Graphic ==================================================
// GraphicLayer
const graphicsLayer = new GraphicsLayer()

// Sketch View Model
let svm: SketchViewModel

// 控制按鈕 class
const activeTool = ref<string>('')

// 控制能否刪除 graphic
const isDeleteMode = ref<Boolean>(false)

const showNameInput = ref<Boolean>(false)

const graphicName = ref<string>('')

const lastCreatedGraphic = ref<Graphic | null>(null)

// 地震圖層 - Popup 資訊
const graphicPopup = {
  title: '圖形資訊',
  content: `
    <p> GraphicID: {mag} </p>
    <p> Name: {name} </p>
    <p> 型態: {time} </p>
  `,
}

// 加入圖層
const addLayersToMap = (view: MapView) => {
  const allLayers = [
    tiledLayer,
    townLayer,
    gasStationLayer,
    hotelsLayer,
    industrialLayer,
    earthquakeLayer,
  ]
  view.map!.addMany(allLayers)
  layers.value = allLayers
}

// 設定 widgets
const setupWidgets = (view: MapView) => {
  const homeBtn = new Home({ view })
  const scaleBar = new ScaleBar({ view, unit: 'metric' })

  view.ui.add(homeBtn, 'top-right')
  view.ui.add(scaleBar, 'bottom-right')
  view.ui.move('zoom', 'top-right')
}

// 綁定事件監聽
const setupEventListeners = (view: MapView) => {
  // 顯示鼠標位置經緯度
  view.on('pointer-move', (event) => {
    const point = view!.toMap({ x: event.x, y: event.y })
    if (point) {
      latLng.value = {
        lat: point.latitude?.toFixed(6) || '0.000000',
        lng: point.longitude?.toFixed(6) || '0.000000',
      }
    }
  })

  // Get Map Extent
  reactiveUtils.watch(
    () => view?.stationary,
    (stationary) => {
      if (stationary) {
        const geoExtent = webMercatorUtils.webMercatorToGeographic(view!.extent) as Extent

        mapExtent.value = {
          xmin: geoExtent?.xmin.toFixed(6) || '0.000000',
          ymin: geoExtent?.ymin.toFixed(6) || '0.000000',
          xmax: geoExtent?.xmax.toFixed(6) || '0.000000',
          ymax: geoExtent?.ymax.toFixed(6) || '0.000000',
        }
      }
    },
  )

  view.on('click', async (event) => {
    if (!isDeleteMode.value) {
      return
    }

    const response = await view.hitTest(event)
    const results = response.results.filter((result) => {
      return 'graphic' in result && result.layer === graphicsLayer
    })

    if (results.length > 0) {
      const hitResult = results[0] as any
      const target = hitResult.graphic

      if (target) {
        const confirmed = window.confirm('確定要刪除此圖形嗎？')
        if (confirmed) {
          graphicsLayer.remove(target)
        }
      }
    }
  })
}

// 初始化繪圖工具
const initSketchTool = (view: MapView) => {
  view.map!.add(graphicsLayer)

  svm = new SketchViewModel({
    view: view,
    layer: graphicsLayer,
    updateOnGraphicClick: false,
    defaultUpdateOptions: {
      tool: 'reshape',
    },
  })

  svm.on('create', (event) => {
    if (event.state === 'complete') {
      const newGraphic = event.graphic!
      newGraphic.attributes = {
        id: crypto.randomUUID(),
      }

      lastCreatedGraphic.value = newGraphic

      graphicName.value = ''
      showNameInput.value = true

      if (event.tool === activeTool.value) {
        svm.create(event.tool)
      }
    }
  })
}

// 控制按鈕 class
const selectTool = (tool: string) => {
  svm.cancel()

  if (activeTool.value === tool) {
    activeTool.value = ''
  } else {
    activeTool.value = tool
  }
}

// 畫點、線、面
const startDraw = (type: 'multipoint' | 'polyline' | 'polygon') => {
  if (activeTool.value === type) {
    activeTool.value = ''
    svm.cancel()
  } else {
    activeTool.value = type
    svm.create(type)
  }
  svm.updateOnGraphicClick = false
  isDeleteMode.value = false
}

// 儲存圖形名字
const saveGraphicName = () => {
  if (lastCreatedGraphic.value && lastCreatedGraphic.value.geometry) {
    if (!graphicName.value) {
      window.alert('請輸入圖形名稱')
      return
    }

    lastCreatedGraphic.value.attributes = {
      ...lastCreatedGraphic.value.attributes,
      name: graphicName.value,
    }

    const type = lastCreatedGraphic.value!.geometry.type

    if (type === 'point' || type === 'polyline' || type === 'polygon' || type === 'multipoint') {
      svm.create(type)
    }
  }

  showNameInput.value = false
}

// 取消圖形命名
const cancelNaming = () => {
  if (lastCreatedGraphic.value) {
    const confirmed = window.confirm('確定取消命名此圖形嗎？(一旦取消命名圖形即同時刪除)')

    if (confirmed) {
      showNameInput.value = false
      graphicsLayer.remove(lastCreatedGraphic.value as any)
      lastCreatedGraphic.value = null
    }
  }
}

// 編輯 graphic
const editGraphic = () => {
  selectTool('edit')
  svm.updateOnGraphicClick = !svm.updateOnGraphicClick
  isDeleteMode.value = false
}

// 刪除 graphic
const deleteGraphic = () => {
  selectTool('delete')
  isDeleteMode.value = !isDeleteMode.value
  svm.updateOnGraphicClick = false
}

onMounted(async () => {
  if (!mapDiv.value) {
    return
  }

  // Create a Map instance
  const map = new Map({
    basemap: 'satellite',
  })

  // Create a MapView instance
  const newView = new MapView({
    container: mapDiv.value!,
    map: map,
    center: [121, 23.5], // set the center of the map to Taiwan
    zoom: 7,
  })

  view = newView

  // 加入圖層
  addLayersToMap(newView)

  // 設定 widgets
  setupWidgets(newView)

  // 綁定事件監聽
  setupEventListeners(newView)

  // 初始化繪圖工具
  initSketchTool(newView)
})

onUnmounted(() => {
  if (view) {
    view.destroy()
  }
})
</script>
<template>
  <div ref="mapDiv" class="map"></div>
  <div class="layerList">
    <ul>
      <li v-for="layer in layers" :key="layer.id" class="layerList__item">
        <input v-model="layer.visible" type="checkbox" :id="layer.id" />
        <label :for="layer.id">{{ layer.title }}</label>
      </li>
    </ul>
  </div>
  <div class="sketch">
    <button
      @click="startDraw('multipoint')"
      class="sketch__action"
      :class="{ 'sketch__action--active': activeTool === 'multipoint' }"
    >
      點
    </button>

    <button
      @click="startDraw('polyline')"
      class="sketch__action"
      :class="{ 'sketch__action--active': activeTool === 'polyline' }"
    >
      線
    </button>

    <button
      @click="startDraw('polygon')"
      class="sketch__action"
      :class="{ 'sketch__action--active': activeTool === 'polygon' }"
    >
      面
    </button>

    <button
      @click="editGraphic"
      class="sketch__action"
      :class="{ 'sketch__action--active': activeTool === 'edit' }"
    >
      編輯
    </button>

    <button
      @click="deleteGraphic"
      class="sketch__action"
      :class="{ 'sketch__action--active': activeTool === 'delete' }"
    >
      刪除
    </button>
  </div>
  <div v-if="showNameInput" class="modal-overlay">
    <div class="modal">
      <div>
        <h4>幫這個圖形取個名字</h4>
        <input v-model="graphicName" required />
      </div>
      <div class="modal__buttons">
        <button @click="saveGraphicName" class="btn-confirm">確定</button>
        <button @click="cancelNaming" class="btn-cancel">取消</button>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer__extent">
      <table>
        <tr>
          <th>XMin</th>
          <td>{{ mapExtent.xmin }}</td>
          <th>YMin</th>
          <td>{{ mapExtent.ymin }}</td>
        </tr>
        <tr>
          <th>XMax</th>
          <td>{{ mapExtent.xmax }}</td>
          <th>YMax</th>
          <td>{{ mapExtent.ymax }}</td>
        </tr>
      </table>
    </div>
    <div class="footer__latLng">經度: {{ latLng.lat }} | 緯度: {{ latLng.lng }}</div>
    <div class="footer_space"></div>
  </div>
</template>

<style lang="scss" scoped>
.map {
  height: 100vh;
  width: 100%;
}

.layerList {
  position: absolute;
  top: 30px;
  left: 30px;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #333;
  padding: 8px;

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0px;
      cursor: pointer;
      user-select: none;

      label {
        cursor: pointer;
      }
    }
  }
}

.sketch {
  position: absolute;
  top: 30px;
  left: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  padding: 6px;

  &__action {
    background-color: rgba(255, 255, 255, 0);
    border: none;
    border-radius: 8px;
    padding: 8px;
    cursor: pointer;

    &:hover {
      background-color: rgba(255, 255, 255, 0.8);
    }

    &--active {
      background-color: rgba(100, 100, 100, 0.5);
      color: #ffffff;
    }
  }
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  &__buttons {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 8px;
    width: 100%;

    button {
      padding: 8px 12px;
      border-radius: 6px;
      border: none;
    }

    .btn-confirm {
      background-color: #0079c1;
      color: white;

      &:hover {
        background-color: #005e95;
        box-shadow: 0 4px 12px rgba(0, 121, 193, 0.3);
      }
    }

    .btn-cancel {
      background-color: #d1d1d1;
      color: #666;

      &:hover {
        background-color: #e8e8e8;
        color: #333;
      }
    }
  }
}

.footer {
  position: absolute;
  bottom: 30px;
  left: 50%;
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 100px;
  transform: translateX(-50%);
  padding: 5px 10px;
  border-radius: 5px;

  &__extent {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border: 1px solid #d1d1d1;
    border-radius: 4px;
    padding: 8px 15px;
    table {
      border-collapse: collapse;
      font-size: 12px;

      th {
        text-align: left;
        color: #888;
        padding-right: 8px;
        font-weight: 500;
      }

      td {
        color: #000;
        padding-right: 20px;
      }
    }
  }

  &__latLng {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border: 1px solid #d1d1d1;
    border-radius: 4px;
    padding: 8px 15px;
    font-size: 14px;
    color: #333;
  }
}
</style>
