<script lang="ts" setup>
import { ref, computed } from 'vue'
import proj4 from 'proj4'

// 定義座標
proj4.defs([
  // WGS84
  ['WGS84', '+proj=longlat +datum=WGS84 +no_defs +type=crs'],
  // EPSG:3857
  [
    'EPSG:3857',
    '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
  ],
  // TWD97 (121)
  [
    'twd97 (121)',
    '+proj=tmerc +lat_0=0 +lon_0=121 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  // TWD97 (119)
  [
    'twd97 (119)',
    '+proj=tmerc +lat_0=0 +lon_0=119 +k=0.9999 +x_0=250000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
  ],
  // TWD67 (121)
  ['twd67 (121)', '+proj=longlat +ellps=aust_SA +no_defs +type=crs'],
  // TWD67 (119)
  ['twd67 (119)', '+proj=longlat +ellps=GRS80 +no_defs +type=crs'],
])

const inputLon = ref('')
const inputLat = ref('')

const coordinateSystems = ref([
  'twd67 (121)',
  'twd67 (119)',
  'twd97 (121)',
  'twd97 (119)',
  'EPSG:3857',
])

const selectedFromSystem = ref<string>('')

const result = ref<number[]>([0, 0])

const showResult = ref<boolean>(false)

// 座標驗證：僅限數字及一個小數點
const isValid = (coordinate: string) => {
  if (coordinate === '') return true

  const regex = /^[0-9]*(\.[0-9]*)?$/
  return regex.test(coordinate)
}

const isLonValid = computed(() => isValid(inputLon.value))
const isLatValid = computed(() => isValid(inputLat.value))
const isSubmitDisabled = computed(() => {
  return !isLonValid.value || !isLatValid.value || inputLon.value === '' || inputLat.value === ''
})

// 轉換座標成經緯度
const convertCoordinate = () => {
  if (!selectedFromSystem.value || selectedFromSystem.value === '') {
    window.alert('請選擇欲轉換之座標系統')
    return
  }

  if (!inputLon.value || !inputLat.value) {
    window.alert('請輸入座標')
    return
  }

  const coordinate = [Number(inputLon.value), Number(inputLat.value)]
  try {
    result.value = proj4(selectedFromSystem.value, 'WGS84', coordinate)
    showResult.value = true
  } catch (error) {
    console.error('座標轉換失敗', error)
  }
}
</script>

<template>
  <div class="container">
    <h4>轉換座標至經緯度 (WGS84)</h4>
    <div class="systemSelect">
      <label for="fromSystem"></label>
      <select v-model="selectedFromSystem" id="fromSystem">
        <option disabled value="">請選擇目前座標系統</option>
        <option v-for="system in coordinateSystems" :key="system" :value="system">
          {{ system }}
        </option>
      </select>
    </div>
    <div class="coordinateForm">
      <label>請輸入欲轉換之座標：</label>
      <div class="coordinateForm__inputGroup">
        <div class="coordinateForm__inputGroup--item">
          <span>X:</span>
          <input v-model="inputLon" />
        </div>
        <div class="coordinateForm__inputGroup--item">
          <span>Y:</span>
          <input v-model="inputLat" id="coordinate" />
        </div>
      </div>
      <p v-if="!isLonValid || !isLatValid" class="error-text">
        格式錯誤：請確認是否包含非數字或多個小數點。
      </p>
      <button @click="convertCoordinate" :disabled="isSubmitDisabled">取得經緯度 -></button>
    </div>
    <div v-show="showResult" class="convertResult">
      <p>此 {{ selectedFromSystem }} 座標經緯度為：</p>
      <p class="convertResult__value">經度：{{ result[0]!.toFixed(6) }}</p>
      <p class="convertResult__value">緯度：{{ result[1]!.toFixed(6) }}</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #333;
  padding: 8px;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;

  .systemSelect {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;

    select {
      border-bottom: 1px solid #0f1922;
    }
  }

  .coordinateForm {
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 4px;
    box-sizing: border-box;

    &__inputGroup {
      display: flex;
      gap: 8px;
      width: 100%;

      &--item {
        display: flex;
        align-items: center;
        flex: 1;
        gap: 4px;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 4px;

        span {
          flex-shrink: 0;
          font-weight: bold;
          font-size: 13px;
        }

        input {
          flex: 1;
          border: none;
          outline: none;
          width: 100%;
          padding: 4px;
          font-size: 14px;
          min-width: 0;

          &:focus-within {
            border: 1px solid #0f1922;
          }
        }
      }
    }

    .error-text {
      color: red;
    }

    button {
      padding: 6px 6px;
      border-radius: 6px;
      border: none;
      background-color: rgba(255, 255, 255, 0.6);
      transition: 0.3s;

      &:hover {
        background-color: #60a2d8;
        color: white;
      }
    }
  }
  .convertResult {
    margin-top: 5px;
    background: rgba(33, 150, 243, 0.1);
    border-left: 4px solid #60a2d8;
    border-radius: 4px 8px 8px 4px;
    padding: 6px;

    &__value {
      font-weight: bold;
      color: #0d47a1;
    }
  }
}
</style>
