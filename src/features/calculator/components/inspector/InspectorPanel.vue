<script setup lang="ts">
import { computed } from 'vue'
import { yangyangActions } from '../../../../data/versions/v3_5/phaseOne'
import { useTimelineStore } from '../../stores/timeline'
import { useI18n } from 'vue-i18n'
import ToolbarIcon from '../shell/ToolbarIcon.vue'
import EmptyState from '../ui/EmptyState.vue'
import NumericField from '../ui/NumericField.vue'

const props = defineProps<{
  selectedActionId?: string
  naturalEndTimeMs?: number
}>()
const emit = defineEmits<{ delete: [id: string] }>()
const timeline = useTimelineStore()
const { t } = useI18n()
const action = computed(() => timeline.actions.find((item) => item.id === props.selectedActionId))
const definition = computed(() =>
  yangyangActions.find((item) => item.id === action.value?.actionId),
)
</script>

<template>
  <div class="inspector-content-region">
    <div v-if="action" class="inspector-content">
      <h2>{{ definition?.name ?? action.actionId }}</h2>
      <NumericField
        :label="t('workspace.startTime')"
        :model-value="action.startTimeMs"
        :min="0"
        :step="timeline.snapMs"
        unit="ms"
        @update:model-value="timeline.moveAction(action.id, $event)"
      />
      <NumericField
        :label="t('workspace.endTime')"
        :model-value="action.trimmedEndTimeMs ?? naturalEndTimeMs"
        :min="action.startTimeMs"
        :step="timeline.snapMs"
        unit="ms"
        @update:model-value="timeline.trimAction(action.id, $event)"
      />
      <small>{{ t('workspace.trimHint') }}</small>
      <button
        v-if="action.trimmedEndTimeMs !== undefined"
        type="button"
        @click="timeline.trimAction(action.id)"
      >
        <ToolbarIcon name="restore" /><span>{{ t('workspace.restoreLength') }}</span>
      </button>
      <button class="danger" type="button" @click="emit('delete', action.id)">
        <ToolbarIcon name="trash" /><span>{{ t('workspace.deleteAction') }}</span>
      </button>
    </div>
    <EmptyState v-else :text="t('workspace.selectAction')" icon="inspector" />
  </div>
</template>
