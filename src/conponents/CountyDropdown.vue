<script lang="ts" setup>
import { ref } from 'vue'
import type { PropType } from 'vue'

interface County {
  countycode: string
  countyname: string
}

const props = defineProps({
  counties: {
    type: Array as PropType<County[]>,
    default: [],
  },
})

const emit = defineEmits(['focusCounty'])

const selectedValue = ref('')

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('focusCounty', target.value)
}

const resetDropdown = () => {
  selectedValue.value = ''
}

defineExpose({
  resetDropdown,
})
</script>

<template>
  <div class="findCounty">
    <h4>尋找城市：</h4>
    <select @change="handleChange($event)" v-model="selectedValue" id="county">
      <option value="">全台灣</option>
      <option v-for="county in counties" :key="county.countycode" :value="county.countycode">
        {{ county.countyname }}
      </option>
    </select>
  </div>
</template>

<style lang="css" scoped>
.findCounty {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  color: #333;
  padding: 8px;
  width: 100%;

  select {
    width: 100%;
  }
}
</style>
