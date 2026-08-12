<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, useAttrs, watch } from 'vue'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    rootClass?: string
    viewportClass?: string
    showVertical?: boolean
    showHorizontal?: boolean
  }>(),
  {
    rootClass: '',
    viewportClass: '',
    showVertical: true,
    showHorizontal: true,
  },
)
const emit = defineEmits<{ ready: [viewport: HTMLElement] }>()
const attrs = useAttrs()
const viewport = ref<HTMLElement>()
const content = ref<HTMLElement>()
const verticalThumb = ref<HTMLElement>()
const horizontalThumb = ref<HTMLElement>()
const verticalTrack = ref<HTMLElement>()
const horizontalTrack = ref<HTMLElement>()
const hasVertical = ref(false)
const hasHorizontal = ref(false)
let resizeObserver: ResizeObserver | undefined
let mutationObserver: MutationObserver | undefined

function updateThumbs() {
  const element = viewport.value
  if (!element) return
  hasVertical.value = element.scrollHeight > element.clientHeight + 1
  hasHorizontal.value = element.scrollWidth > element.clientWidth + 1
  const verticalTrackSize = verticalTrack.value?.clientHeight ?? element.clientHeight
  const horizontalTrackSize = horizontalTrack.value?.clientWidth ?? element.clientWidth
  const verticalSize = Math.max(
    28,
    (element.clientHeight / element.scrollHeight) * verticalTrackSize,
  )
  const horizontalSize = Math.max(
    28,
    (element.clientWidth / element.scrollWidth) * horizontalTrackSize,
  )
  const verticalRange = Math.max(0, verticalTrackSize - verticalSize)
  const horizontalRange = Math.max(0, horizontalTrackSize - horizontalSize)
  const verticalOffset =
    element.scrollHeight === element.clientHeight
      ? 0
      : (element.scrollTop / (element.scrollHeight - element.clientHeight)) * verticalRange
  const horizontalOffset =
    element.scrollWidth === element.clientWidth
      ? 0
      : (element.scrollLeft / (element.scrollWidth - element.clientWidth)) * horizontalRange
  if (verticalThumb.value) {
    verticalThumb.value.style.height = `${verticalSize}px`
    verticalThumb.value.style.transform = `translateY(${verticalOffset}px)`
  }
  if (horizontalThumb.value) {
    horizontalThumb.value.style.width = `${horizontalSize}px`
    horizontalThumb.value.style.transform = `translateX(${horizontalOffset}px)`
  }
}

function beginThumbDrag(event: PointerEvent, axis: 'vertical' | 'horizontal') {
  const element = viewport.value
  if (!element) return
  event.preventDefault()
  const originPointer = axis === 'vertical' ? event.clientY : event.clientX
  const originScroll = axis === 'vertical' ? element.scrollTop : element.scrollLeft
  const viewportSize = axis === 'vertical' ? element.clientHeight : element.clientWidth
  const scrollSize = axis === 'vertical' ? element.scrollHeight : element.scrollWidth
  const thumbSize =
    axis === 'vertical' ? verticalThumb.value?.offsetHeight : horizontalThumb.value?.offsetWidth
  const trackSize =
    axis === 'vertical'
      ? (verticalTrack.value?.clientHeight ?? viewportSize)
      : (horizontalTrack.value?.clientWidth ?? viewportSize)
  const trackRange = Math.max(1, trackSize - (thumbSize ?? 0))
  const scrollRange = Math.max(0, scrollSize - viewportSize)
  const move = (next: PointerEvent) => {
    const pointer = axis === 'vertical' ? next.clientY : next.clientX
    const value = originScroll + ((pointer - originPointer) / trackRange) * scrollRange
    if (axis === 'vertical') element.scrollTop = value
    else element.scrollLeft = value
  }
  const stop = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', stop)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', stop)
}

onMounted(async () => {
  await nextTick()
  if (!viewport.value || !content.value) return
  emit('ready', viewport.value)
  resizeObserver = new ResizeObserver(updateThumbs)
  resizeObserver.observe(viewport.value)
  resizeObserver.observe(content.value)
  mutationObserver = new MutationObserver(updateThumbs)
  mutationObserver.observe(content.value, { childList: true, subtree: true, attributes: true })
  updateThumbs()
})
watch(
  () => [attrs, props.rootClass, props.viewportClass],
  () => nextTick(updateThumbs),
  { deep: true },
)
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})

defineExpose({ viewport, updateThumbs })
</script>

<template>
  <div class="custom-scroll-area" :class="rootClass">
    <div
      ref="viewport"
      v-bind="attrs"
      class="custom-scroll-viewport"
      :class="viewportClass"
      @scroll.passive="updateThumbs"
    >
      <div ref="content" class="custom-scroll-content"><slot /></div>
    </div>
    <div
      v-if="showVertical"
      ref="verticalTrack"
      class="custom-scroll-track is-vertical"
      :class="{ 'is-idle': !hasVertical }"
    >
      <button
        ref="verticalThumb"
        type="button"
        class="custom-scroll-thumb"
        tabindex="-1"
        aria-hidden="true"
        @pointerdown="hasVertical && beginThumbDrag($event, 'vertical')"
      />
    </div>
    <div
      v-if="showHorizontal"
      ref="horizontalTrack"
      class="custom-scroll-track is-horizontal"
      :class="{ 'is-idle': !hasHorizontal }"
    >
      <button
        ref="horizontalThumb"
        type="button"
        class="custom-scroll-thumb"
        tabindex="-1"
        aria-hidden="true"
        @pointerdown="hasHorizontal && beginThumbDrag($event, 'horizontal')"
      />
    </div>
  </div>
</template>
