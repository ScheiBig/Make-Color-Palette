<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef, watch } from "vue"
import * as c from "./lib/color-palette.ts"
import InputForm from "./components/InputForm.vue"
import Square from "./components/Square.vue"


const colStyle = (src: c.OKLCH) => `oklch(${src.L} ${src.C} ${src.H})`
const nameRegex = /^[a-z]*$/
const valueRegex = /^(#[0-9a-f]{6}|([0-9]|[1-9][0-9]|[1-2][0-9][0-9]|3[0-5][0-9]|360),(1\.0{0,2}|0\.[0-9]{0,2}))$/
type InputFormType = InstanceType<typeof InputForm>

const colors = ref(new Map<string, { tag: string, palette: c.palette }>())

const currentValue = ref("")
const currentValueError = ref("")
const currentValueRef = useTemplateRef<InputFormType>('currentValue')

const currentName = ref("")
const currentNameError = ref("")
const currentNameRef = useTemplateRef<InputFormType>('currentName')

const outputType = ref<"RGB" | "OKLCH">("RGB")
const outputToggle = ref(false)
const output = ref("")


const locationClass = computed(() => outputToggle.value ? "justify-end" : "justify-start")
const colorClass = computed(() => outputToggle.value ? "bg-gray-500" : "bg-gray-300")


const color = (src: c.OKLCH) => outputType.value == "RGB"
	? `${c.oklch_rgb(src.L, src.C, src.H, true).hex}`
	: `oklch(${src.L.toFixed(4)} ${src.C.toFixed(4)} ${src.H.toFixed(2)})`


onMounted(() => {
	const params = new URLSearchParams(window.location.search)
	for (const [possibleName, possibleColor] of params.entries()) {
		if (!nameRegex.test(possibleName) || !valueRegex.test(possibleColor)) continue

		let palette: c.palette
		if (possibleColor.startsWith("#")) {
			palette = c.makePalette(possibleColor)
		} else {
			const [H, S] = possibleColor.split(",")
			palette = c.makePalette(+H, +S)
		}
		colors.value.set(possibleName, {
			tag: possibleColor,
			palette
		})
	}
})


watch(currentValue, (next) => {
	if (next === "") {
		currentValueError.value = ""
		return
	}
	if (!valueRegex.test(next)) {
		currentValueError.value = "Value must be 6-digit hex code, or hue (0..360) and saturation (0..1) with comma between"
		return
	}
	currentValueError.value = ""
})

watch(currentName, (next) => {
	if (next === "") {
		currentNameError.value = ""
		return
	}
	if (colors.value.has(next)) {
		currentNameError.value = "Color already in palette!"
		return
	}
	if (!nameRegex.test(next)) {
		currentNameError.value = "Color name must be single, lowercase word!"
		return
	}
	currentNameError.value = ""
})

watch([colors, outputType], () => {
	const out: Record<string, Record<c.paletteColor, string>> = {}
	for (const [name, { palette }] of colors.value.entries()) {
		const outPalette = {} as Record<c.paletteColor, string>

		for (const [key, oklch] of Object.entries(palette)) {
			const k = key as c.paletteColor
			outPalette[k] = color(oklch)
		}

		out[name] = outPalette
	}
	output.value = JSON.stringify(out, null, "    ")
}, { deep: true })


const addColor = () => {
	if (currentValueError.value !== "" || currentNameError.value !== "") {
		return
	}
	if (currentValue.value === "") {
		currentValueError.value = "Please provide seed color or hue,saturation"
		currentValueRef.value?.focus()
		return
	}
	if (currentName.value === "") {
		currentNameError.value = "Please provide name for color"
		currentNameRef.value?.focus()
		return
	}
	let palette: c.palette
	if (currentValue.value.startsWith("#")) {
		palette = c.makePalette(currentValue.value)
	} else {
		const [H, S] = currentValue.value.split(",")
		palette = c.makePalette(+H, +S)
	}
	colors.value.set(currentName.value, {
		tag: currentValue.value,
		palette
	})

	const params = new URLSearchParams(window.location.search)
	params.set(currentName.value, currentValue.value)
	window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)

	// currentNameRef.value?.clear()
	currentName.value = ""
	// currentValueRef.value?.clear()
	currentValue.value = ""
}

const switchToggle = () => {
	outputToggle.value = !outputToggle.value
	outputType.value = outputType.value === "RGB" ? "OKLCH" : "RGB"
}
</script>

<template>
	<div class=" bg-slate-600 text-slate-50 font-mono shadow-gray-900/20 flex flex-row"
		style="box-shadow: inset 0 -4px 8px 0px var(--tw-shadow-color);">
		<p class="text-3xl p-10 text-center flex-1">Make-Color-Palette</p>
		<div class="flex-1 bg-slate-950/30 flex flex-row">
			<div class="flex flex-col px-5">
				<label class="flex-1 flex items-center text-end justify-end leading-4" for="cur-val">#SeedColor
					or<br>Hue,Saturation</label>
				<label class="flex-1 flex items-center text-end justify-end leading-4" for="cur-name">Color name</label>
			</div>
			<form class="flex flex-1 flex-col" @submit.prevent="addColor">
				<InputForm id="cur-val" v-model:model-value="currentValue" :error-message="currentValueError"
					class="flex-1" placeholder='ex. "#ff5511" or "269,0.9"' @keydown.enter="addColor"
					ref="currentValueRef"></InputForm>
				<InputForm id="cur-name" v-model:model-value="currentName" :error-message="currentNameError"
					class="flex-1" placeholder='ex. "reddish"' @keydown.enter="addColor" ref="currentNameRef">
				</InputForm>
			</form>
		</div>
	</div>

	<main class="flex flex-row justify-between dark:bg-slate-900 dark:text-slate-300 shadow-lg shadow-black"
		style="min-height: calc(11 * (5.5rem + 2px));">
		<table>
			<thead>
				<tr>
					<th v-for="[key, value] in colors" :key="key" class="h-20 m-1"
						:style="`color: ${color(value.palette[500])}`">
						<span class="font-bold">{{ key }}</span>
						<br>
						<span class="italic font-normal">{{ value.tag }}</span>
					</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[0])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[50])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[100])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[200])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[300])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[400])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[500])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[600])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[700])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[800])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[900])}`" class="text-black" />
					</td>
				</tr>
				<tr>
					<td v-for="[key, value] in colors" :key="key">
						<Square :style="`background: ${colStyle(value.palette[950])}`" class="text-black" />
					</td>
				</tr>
			</tbody>
		</table>
		<div class="w-[64ch] bg-zinc-300 dark:bg-zinc-700 flex flex-col">
			<div class="h-16 bg-black/20 flex flex-row justify-center items-center">
				<span class="inline-block m-2 w-16 text-right">RGB</span>
				<div :class="`flex flex-row m-2 w-14 h-5 rounded-[1.25rem] cursor-pointer ${locationClass} ${colorClass}`"
					@click="switchToggle">
					<div class="inline-block bg-gray-900 w-4 h-4 rounded-[50%] m-0.5" />
				</div>
				<span class="inline-block m-2 w-16">OKLCH</span>
			</div>
			<textarea class="p-[2ch] w-full resize-none bg-zinc-300 dark:bg-zinc-700 flex-1 font-mono" readonly :value="output">

			</textarea>
		</div>
	</main>

</template>
