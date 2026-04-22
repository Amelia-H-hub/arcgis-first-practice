<script lang="ts" setup>
import type { PropType } from 'vue'
import Layer from '@arcgis/core/layers/Layer'

const props = defineProps({
  layers: {
    type: Array as PropType<Layer[]>,
    default: [],
  },
})
</script>

<template>
  <div class="layerList">
    <h4>選擇圖層：</h4>
    <ul>
      <li v-for="layer in layers" :key="layer.id">
        <input v-model="layer.visible" type="checkbox" :id="layer.id" />
        <label :for="layer.id">{{ layer.title }}</label>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.layerList {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #333;
  padding: 8px;
  width: 100%;

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
</style>
