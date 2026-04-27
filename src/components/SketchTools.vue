<script lang="ts" setup>
import { computed } from 'vue'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import { useMapTools, activeTool, showNameInput, graphicName } from '@/map/mapTools'

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

const {
  toggleStartDraw,
  toggleSaveGraphicName,
  toggleCancelNaming,
  toggleEditGraphic,
  toggleDeleteGraphic,
} = useMapTools()

// 判斷畫點的類型
const currentPointTool = computed(() => {
  return props.mapType === '3D' ? 'point' : 'multipoint'
})

// 畫點、線、面
const startDraw = (type: 'point' | 'multipoint' | 'polyline' | 'polygon') => {
  toggleStartDraw(type)
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
}

// 按下刪除 graphic 按鈕
const deleteGraphic = () => {
  toggleDeleteGraphic()
}
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
