<script lang="ts" setup>
const props = defineProps({
  isChoosePlaceMode: {
    type: Boolean,
    default: false,
  },
  selectedPlaceInfo: {
    type: Object,
    default: {},
  },
})

const emit = defineEmits(['update:isChoosePlaceMode'])

const toggleMode = () => {
  emit('update:isChoosePlaceMode', !props.isChoosePlaceMode)
}
</script>

<template>
  <div class="placeInfo">
    <div class="placeInfo__title">
      <h4>地圖互動查詢</h4>
      <p>點選台灣地圖獲取資訊</p>
    </div>
    <label class="placeInfo__switch">
      <input :checked="isChoosePlaceMode" @change="toggleMode" type="checkbox" />
      <span></span>
    </label>
    <div v-if="isChoosePlaceMode && selectedPlaceInfo" class="placeInfo__Info">
      <div>
        <h3>{{ selectedPlaceInfo.COUNTYNAME }}</h3>
        <p>城市代號：{{ selectedPlaceInfo.COUNTYCODE }}</p>
      </div>
      <div>
        <h4>{{ selectedPlaceInfo.TOWNNAME }} {{ selectedPlaceInfo.TOWNENG }}</h4>
        <p>鄉鎮市區代號：{{ selectedPlaceInfo.TOWNCODE }}</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.placeInfo {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  width: 100%;

  &__title {
    display: flex;
    flex-direction: column;

    p {
      font-size: 12px;
      color: #444;
    }
  }

  &__switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    width: 50px;
    height: 24px;

    input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    span {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.4s;
      border-radius: 24px;

      &::before {
        position: absolute;
        content: '';
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: 0.4s;
        border-radius: 50%;
      }
    }

    input:checked + span {
      background-color: #60a2d8;

      &::before {
        transform: translateX(26px);
      }
    }
  }

  &__Info {
    display: flex;
    flex-direction: column;
    gap: 6px;

    p {
      font-size: 12px;
    }
  }
}
</style>
