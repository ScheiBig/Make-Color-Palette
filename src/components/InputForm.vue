<script setup lang="ts">
import { ref } from "vue"

defineProps<{
	modelValue: string
	errorMessage?: string
	id: string
	classes?: string
	placeholder?: string
}>()

const emit = defineEmits(["update:modelValue", "keydown"])
const inputRef = ref<HTMLInputElement|null>(null)

const handleKeydown = (e: Event) => emit("keydown", e)
const handleInput = (e: Event) => {
	const input = e.target as HTMLInputElement
	emit("update:modelValue", input.value)
}

defineExpose({
	focus: () => inputRef.value?.focus()
})
</script>

<template>
	<div class="flex flex-col px-4">
		<span class="h-4" />
		<input class="border border-slate-400 rounded-sm flex-1 my-1 bg-slate-700 px-2" :id :placeholder :value="modelValue"
			@keydown="handleKeydown" ref="inputRef" @input="handleInput"/>
		<span v-if="errorMessage" class="h-4 text-xs text-red-400">{{ errorMessage }}</span>
		<span v-if="!errorMessage" class="h-4 text-xs" />
	</div>
</template>
