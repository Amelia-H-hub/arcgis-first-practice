<script lang="ts" setup>
import { ref } from 'vue'

const inputCoordiate = ref('')

const coordinateSystems = ref([
  'twd67 (121)',
  'twd67 (119)',
  'twd97 (121)',
  'twd97 (119)',
  'EPSG:3857',
])
</script>

<template>
  <div>
    <label for="coordinate"></label>
    <input v-model="inputCoordiate" id="coordinate" />
    <select>
      <option v-for="system in coordinateSystems" :key="system">
        {{ system }}
      </option>
    </select>
  </div>
</template>

<style lang="scss" scoped></style>
