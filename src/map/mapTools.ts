import { ref } from 'vue'
import MapView from '@arcgis/core/views/MapView'
import SceneView from '@arcgis/core/views/SceneView'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import type { ClickEvent } from '@arcgis/core/views/input/types'

let _view: MapView | SceneView
let _graphicsLayer: GraphicsLayer
let _svm: SketchViewModel

// sketch view model 相關變數
export const activeTool = ref<string>('')
export const lastCreatedGraphic = ref<Graphic | null>(null)
export const showNameInput = ref<Boolean>(false)
export const graphicName = ref<string>('')
export const isDeleteMode = ref<Boolean>(false)

// scale bar 相關變數
export const scaleLabel = ref('')
export const scaleBarWidth = ref(100)

export const useMapTools = () => {
  const init = (view: MapView | SceneView, graphicsLayer: GraphicsLayer) => {
    _view = view
    _graphicsLayer = graphicsLayer

    // 初始化 sketch view model
    _svm = new SketchViewModel({
      view: view,
      layer: graphicsLayer,
      updateOnGraphicClick: false,
      defaultUpdateOptions: {
        tool: 'reshape',
      },
    })

    // 新增圖形時
    _svm.on('create', (event) => {
      if (event.state === 'complete') {
        const newGraphic = event.graphic!
        // 給 ID
        newGraphic.attributes = {
          id: crypto.randomUUID(),
          geometryType: newGraphic.geometry!.type,
        }

        // Popup 資訊
        newGraphic.popupTemplate = {
          title: '圖形資訊',
          content: `
            <p> GraphicID: {id} </p>
            <p> Name: {name} </p>
            <p> 型態: {geometryType} </p>
          `,
        }

        lastCreatedGraphic.value = newGraphic
        graphicName.value = ''
        showNameInput.value = true
      }
    })

    // 監聽 view
    view.on('click', async (event) => {
      // 刪除 Graphic
      if (isDeleteMode.value) {
        await handleDeleteGraphic(event)
      }
    })
  }

  // 控制 svm 按鈕 class
  const selectTool = (tool: string) => {
    _svm.cancel()

    if (activeTool.value === tool) {
      activeTool.value = ''
    } else {
      activeTool.value = tool
    }
  }

  // 畫點、線、面
  const toggleStartDraw = (type: 'point' | 'multipoint' | 'polyline' | 'polygon') => {
    if (activeTool.value === type) {
      activeTool.value = ''
      _svm.cancel()
    } else {
      activeTool.value = type
      _svm.create(type)
    }
    _svm.updateOnGraphicClick = false
    isDeleteMode.value = false
  }

  // 儲存圖形名字
  const toggleSaveGraphicName = () => {
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
        _svm.create(type)
      }
    }

    showNameInput.value = false
  }

  // 取消圖形命名
  const toggleCancelNaming = () => {
    if (lastCreatedGraphic.value) {
      const confirmed = window.confirm('確定取消命名此圖形嗎？(一旦取消命名圖形即同時刪除)')

      if (confirmed) {
        showNameInput.value = false
        _graphicsLayer.remove(lastCreatedGraphic.value as any)
        lastCreatedGraphic.value = null
      }
    }
  }

  // 按下編輯 graphic 按鈕
  const toggleEditGraphic = () => {
    selectTool('edit')
    _svm.updateOnGraphicClick = !_svm.updateOnGraphicClick
    if (_svm.updateOnGraphicClick) {
      _view.popupEnabled = false
    } else {
      _view.popupEnabled = true
    }
    isDeleteMode.value = false
  }

  // 按下刪除 graphic 按鈕
  const toggleDeleteGraphic = () => {
    selectTool('delete')
    isDeleteMode.value = !isDeleteMode.value
    if (isDeleteMode.value) {
      _view.popupEnabled = false
    } else {
      _view.popupEnabled = true
    }
    _svm.updateOnGraphicClick = false
  }

  // 刪除 Graphic
  const handleDeleteGraphic = async (event: ClickEvent) => {
    const response = await _view.hitTest(event)
    const results = response.results.filter((result) => {
      return 'graphic' in result && result.layer === _graphicsLayer
    })

    if (results.length > 0) {
      const target = (results[0] as any).graphic

      if (target) {
        event.stopPropagation()
        const confirmed = window.confirm('確定要刪除此圖形嗎？')
        if (confirmed) {
          _graphicsLayer.remove(target)
        } else {
          _view.closePopup()
        }
      }
    }
  }

  const updateScale = (view: SceneView) => {
    if (!view.ready) {
      return
    }

    const resolution = view.resolution

    if (resolution === undefined) {
      return
    }

    const targetWidthPx = 100
    const actualDistance = resolution * targetWidthPx

    if (actualDistance >= 1000) {
      scaleLabel.value = `${(actualDistance / 1000).toFixed(1)} km`
    } else {
      scaleLabel.value = `${Math.round(actualDistance)} m`
    }
  }

  return {
    init,
    toggleStartDraw,
    toggleSaveGraphicName,
    toggleCancelNaming,
    toggleEditGraphic,
    toggleDeleteGraphic,
    updateScale,
    scaleLabel,
    scaleBarWidth,
  }
}
