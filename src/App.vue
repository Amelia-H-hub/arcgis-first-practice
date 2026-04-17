<script setup>
import { onMounted } from 'vue'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'

onMounted(() => {
  const map = new Map({
    basemap: 'dark-gray-vector',
  })

  const view = new MapView({
    container: 'viewDiv',
    map: map,
    center: [-98, 39],
    zoom: 3,
  })
})
</script>

<template>
  <div id="viewDiv"></div>
</template>

<style lang="scss" scoped>
#viewDiv {
  height: 100vh;
  width: 100%;
}
</style>
