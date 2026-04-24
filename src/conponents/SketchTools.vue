<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue'
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import MapView from '@arcgis/core/views/MapView'
import SceneView from '@arcgis/core/views/SceneView'
import type { ClickEvent } from '@arcgis/core/views/input/types'
import {
  useMapTools,
  activeTool,
  isDeleteMode,
  showNameInput,
  graphicName,
  lastCreatedGraphic,
} from '@/map/mapTools'

const props = defineProps({
  graphicsLayer: {
    type: GraphicsLayer,
    required: true,
  },
  mapType: {
    type: String,
    required: true,
  },
})

// Sketch View Model
// let svm: SketchViewModel

const {
  toggleStartDraw,
  toggleSaveGraphicName,
  toggleCancelNaming,
  toggleEditGraphic,
  toggleDeleteGraphic,
} = useMapTools()

// 控制按鈕 class
// const activeTool = ref<string>('')

// 控制能否刪除 graphic
// const isDeleteMode = ref<Boolean>(false)

// const showNameInput = ref<Boolean>(false)

// const graphicName = ref<string>('')

// const lastCreatedGraphic = ref<Graphic | null>(null)

// 判斷畫點的類型
const currentPointTool = computed(() => {
  return props.mapType === '3D' ? 'point' : 'multipoint'
})

// 控制 svm 按鈕 class
// const selectTool = (tool: string) => {
//   svm.cancel()

//   if (activeTool.value === tool) {
//     activeTool.value = ''
//   } else {
//     activeTool.value = tool
//   }
// }

// 畫點、線、面
const startDraw = (type: 'point' | 'multipoint' | 'polyline' | 'polygon') => {
  toggleStartDraw(type)
  // if (activeTool.value === type) {
  //   activeTool.value = ''
  //   svm.cancel()
  // } else {
  //   activeTool.value = type
  //   svm.create(type)
  // }
  // svm.updateOnGraphicClick = false
  // isDeleteMode.value = false
}

// 儲存圖形名字
const saveGraphicName = () => {
  toggleSaveGraphicName()
}

// 取消圖形命名
const cancelNaming = () => {
  toggleCancelNaming()
}

// 按下編輯 graphic 按鈕
const editGraphic = () => {
  toggleEditGraphic()
  //   selectTool('edit')
  //   svm.updateOnGraphicClick = !svm.updateOnGraphicClick
  //   if (svm.updateOnGraphicClick) {
  //     props.view!.popupEnabled = false
  //   } else {
  //     props.view!.popupEnabled = true
  //   }
  //   isDeleteMode.value = false
}

// 按下刪除 graphic 按鈕
const deleteGraphic = () => {
  toggleDeleteGraphic()
  //   selectTool('delete')
  //   isDeleteMode.value = !isDeleteMode.value
  //   if (isDeleteMode.value) {
  //     props.view!.popupEnabled = false
  //   } else {
  //     props.view!.popupEnabled = true
  //   }
  //   svm.updateOnGraphicClick = false
}

// 刪除 Graphic
// const handleDeleteGraphic = async (event: ClickEvent) => {
//   const response = await props.view!.hitTest(event)
//   const results = response.results.filter((result) => {
//     return 'graphic' in result && result.layer === props.graphicsLayer
//   })

//   if (results.length > 0) {
//     const target = (results[0] as any).graphic

//     if (target) {
//       event.stopPropagation()
//       const confirmed = window.confirm('確定要刪除此圖形嗎？')
//       if (confirmed) {
//         props.graphicsLayer!.remove(target)
//       } else {
//         props.view!.closePopup()
//       }
//     }
//   }
// }

onMounted(() => {
  // 初始化 sketch view model
  // svm = new SketchViewModel({
  //   view: props.view,
  //   layer: props.graphicsLayer,
  //   updateOnGraphicClick: false,
  //   defaultUpdateOptions: {
  //     tool: 'reshape',
  //   },
  // })
  // 新增圖形時
  // svm.on('create', (event) => {
  //   if (event.state === 'complete') {
  //     const newGraphic = event.graphic!
  //     // 給 ID
  //     newGraphic.attributes = {
  //       id: crypto.randomUUID(),
  //       geometryType: newGraphic.geometry!.type,
  //     }
  //     // Popup 資訊
  //     newGraphic.popupTemplate = {
  //       title: '圖形資訊',
  //       content: `
  //         <p> GraphicID: {id} </p>
  //         <p> Name: {name} </p>
  //         <p> 型態: {geometryType} </p>
  //       `,
  //     }
  //     lastCreatedGraphic.value = newGraphic
  //     graphicName.value = ''
  //     showNameInput.value = true
  //   }
  // })
  // 監聽 view
  // props.view!.on('click', async (event) => {
  //   // 刪除 Graphic
  //   if (isDeleteMode.value) {
  //     await handleDeleteGraphic(event)
  //   }
  // })
})
</script>

<template>
  <div>
    <div class="sketchTool">
      <button
        @click="startDraw(currentPointTool)"
        class="sketchTool__action"
        :class="{ 'sketchTool__action--active': activeTool === currentPointTool }"
      >
        點
      </button>

      <button
        @click="startDraw('polyline')"
        class="sketchTool__action"
        :class="{ 'sketchTool__action--active': activeTool === 'polyline' }"
      >
        線
      </button>

      <button
        @click="startDraw('polygon')"
        class="sketchTool__action"
        :class="{ 'sketchTool__action--active': activeTool === 'polygon' }"
      >
        面
      </button>

      <button
        @click="editGraphic"
        class="sketchTool__action"
        :class="{ 'sketchTool__action--active': activeTool === 'edit' }"
      >
        編輯
      </button>

      <button
        @click="deleteGraphic"
        class="sketchTool__action"
        :class="{ 'sketchTool__action--active': activeTool === 'delete' }"
      >
        刪除
      </button>
    </div>
    <Teleport to="body">
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
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.sketchTool {
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
    background-color: transparent;
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

  h4 {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  input {
    padding: 4px 8px;
  }

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
</style>
