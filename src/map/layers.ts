import Layer from '@arcgis/core/layers/Layer'
import WebTileLayer from '@arcgis/core/layers/WebTileLayer'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import WMSLayer from '@arcgis/core/layers/WMSLayer'
import GeoJSONLayer from '@arcgis/core/layers/GeoJSONLayer'

// 圖層 ==================================================
export const createDefaultLayers = () => {
  // 內政部國土測繪圖資
  const tiledLayer = new WebTileLayer({
    urlTemplate:
      'https://wmts.nlsc.gov.tw/wmts/EMAP2/default/GoogleMapsCompatible/{level}/{row}/{col}',
    id: 'tiledLayer',
    title: '國土測繪圖資',
    visible: false,
  })

  // 鄉鎮市區界圖層
  const townLayer = new MapImageLayer({
    url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_Town_84/MapServer',
    id: 'townLayer',
    title: '鄉鎮市區界圖層',
    visible: false,
    opacity: 0.2,
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
    id: 'gasStationLayer',
    title: '加油站圖層',
    visible: false,
  })

  // 飯店旅館圖層
  const hotelsLayer = new FeatureLayer({
    url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_POI/MapServer/0',
    id: 'hotelsLayer',
    title: '飯店旅館圖層',
    visible: false,
  })

  // 工業區圖層
  const industrialLayer = new WMSLayer({
    url: 'https://richimap1.richitech.com.tw/arcgis/services/CBB_Practice/CBB_Practice_Industry_84/MapServer/WMSServer?request=GetCapabilities&service=WMS',
    id: 'industrialLayer',
    title: '工業區圖層',
    visible: false,
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
    id: 'earthquakeLayer',
    title: '近一個月地震',
    visible: false,
    renderer: earthquakeRenderer as any,
    popupTemplate: earthquakePopup as any,
  })

  // 縣市界圖層
  const countyLayer = new FeatureLayer({
    url: 'https://richimap1.richitech.com.tw/arcgis/rest/services/CBB_Practice/CBB_Practice_County_84/MapServer/0',
    id: 'countyLayer',
    title: '縣市界圖層',
    visible: false,
    opacity: 0.2,
    outFields: ['*'],
  })

  return [
    tiledLayer,
    townLayer,
    gasStationLayer,
    hotelsLayer,
    industrialLayer,
    earthquakeLayer,
    countyLayer,
  ]
}
