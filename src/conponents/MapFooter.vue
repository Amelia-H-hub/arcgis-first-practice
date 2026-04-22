<script lang="ts" setup>
interface MapExtent {
  xmin: string
  ymin: string
  xmax: string
  ymax: string
}

interface LatLng {
  lat: string
  lng: string
}

const props = defineProps<{
  mapExtent: MapExtent
  latLng: LatLng
}>()
</script>

<template>
  <div>
    <div class="footerContainer">
      <div class="footerContainer__extent">
        <table>
          <tbody>
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
          </tbody>
        </table>
      </div>
      <div class="footerContainer__latLng">
        <p>經度: {{ latLng.lng }}</p>
        <p>緯度: {{ latLng.lat }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.footerContainer {
  display: flex;
  justify-content: center;
  align-items: end;
  gap: 70px;
  transform: translateX(-50%);
  padding: 5px 10px;
  border-radius: 5px;
  height: 50px;

  &__extent {
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(4px);
    border: 1px solid #d1d1d1;
    border-radius: 4px;
    padding: 8px 15px;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;

    table {
      border-collapse: collapse;

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
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
  }
}
</style>
