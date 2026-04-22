import MapView from '@arcgis/core/views/MapView'
import MapImageLayer from '@arcgis/core/layers/MapImageLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Point from '@arcgis/core/geometry/Point'
import { identify } from '@arcgis/core/rest/identify'
import IdentifyParameters from '@arcgis/core/rest/support/IdentifyParameters'
import { getCounties } from '@/api/arcgis'
import * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils'
import Extent from '@arcgis/core/geometry/Extent'

// 取得鼠標位置經緯度
export const formatPointerLocation = (view: MapView, x: number, y: number) => {
  const point = view.toMap({ x, y })
  if (point) {
    return {
      lat: point.latitude?.toFixed(6) || '0.000000',
      lng: point.longitude?.toFixed(6) || '0.000000',
    }
  }
}

// 取得地圖 extent
export const formatMapExtent = (view: MapView) => {
  const geoExtent = webMercatorUtils.webMercatorToGeographic(view.extent) as Extent

  return {
    xmin: geoExtent?.xmin.toFixed(6) || '0.000000',
    ymin: geoExtent?.ymin.toFixed(6) || '0.000000',
    xmax: geoExtent?.xmax.toFixed(6) || '0.000000',
    ymax: geoExtent?.ymax.toFixed(6) || '0.000000',
  }
}

// 取得縣市下拉選單資料
export const handleGetCounties = async () => {
  const tempCounties = []

  const response = await getCounties()
  const xmlString = await response.data

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

  const items = xmlDoc.getElementsByTagName('countyItem')

  for (let i = 0; i < items.length; i++) {
    const code = items[i]?.getElementsByTagName('countycode01')[0]?.textContent || ''
    const name = items[i]?.getElementsByTagName('countyname')[0]?.textContent || ''

    tempCounties.push({
      countycode: code,
      countyname: name,
    })
  }

  return tempCounties
}

// 查詢縣市 feature
export const getCountyFeature = async (countycode: string, countyLayer: FeatureLayer) => {
  const query = countyLayer.createQuery()
  query.where = `COUNTYCODE = '${countycode}'`
  query.returnGeometry = true

  try {
    const result = await countyLayer.queryFeatures(query)
    return result.features.length > 0 ? result.features[0] : null
  } catch (error) {
    console.error('查詢區域失敗', error)
  }
}

// 取得縣市、鄉鎮資訊
export const getTownInfo = async (layer: MapImageLayer, mapPoint: Point, view: MapView) => {
  const params = new IdentifyParameters({
    tolerance: 3,
    layerIds: [0],
    layerOption: 'top',
    width: view.width,
    height: view.height,
    mapExtent: view.extent,
    geometry: mapPoint,
  })

  try {
    const response = await identify(layer.url!, params)
    if (response.results.length > 0) {
      const result = response.results[0]
      const townGraphic = result?.feature
      return townGraphic?.attributes
    }
  } catch (error) {
    throw error
  }
}
