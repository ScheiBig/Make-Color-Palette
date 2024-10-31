export type OKLCH = { L: number; C: number; H: number }
export type RGB = { R: number; G: number; B: number; hex: string }

export type paletteColor = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

export type palette = Record<paletteColor, OKLCH>

const lightnessMap: Record<paletteColor, number> = {
	"0": 0.950,
	"1": 0.890,
	"2": 0.820,
	"3": 0.740,
	"4": 0.625,
	"5": 0.500,
	"6": 0.400,
	"7": 0.350,
	"8": 0.300,
	"9": 0.250,
}

/** Hue in range 172..227 */
const chromaMapTernary: Record<paletteColor, number> = {
	"0": 0.030,
	"1": 0.040,
	"2": 0.050,
	"3": 0.070,
	"4": 0.100,
	"5": 0.080,
	"6": 0.060,
	"7": 0.050,
	"8": 0.040,
	"9": 0.030,
}

/** Hue in range 57..122 | 156..<172 | 227<..243 */
const chromaMapSecondary: Record<paletteColor, number> = {
	"0": 0.030,
	"1": 0.045,
	"2": 0.060,
	"3": 0.085,
	"4": 0.120,
	"5": 0.096,
	"6": 0.072,
	"7": 0.058,
	"8": 0.044,
	"9": 0.030,
}

/** Hue in range 0..<57 | 122<..<156 | 243<..360 */
const chromaMapPrimary: Record<paletteColor, number> = {
	"0": 0.030,
	"1": 0.053,
	"2": 0.075,
	"3": 0.108,
	"4": 0.150,
	"5": 0.120,
	"6": 0.090,
	"7": 0.070,
	"8": 0.050,
	"9": 0.030,
}

function rgb_sat(rgb: RGB): number {
	let { R, G, B } = rgb
	R /= 255
	G /= 255
	B /= 255

	const max = Math.max(R, G, B)
	const min = Math.min(R, G, B)
	const l = (max + min) / 2

	let s
	if (max === min) s = 0
	else {
		const d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
	}

	return s
}

export function parseRGB(hex: string): RGB {
	if (!/^#[0-9a-z]{6}/.test(hex)) throw new Error(`${hex} is not a proper hex RGB color`)
	return {
		R: +`0x${hex.slice(1, 3)}`,
		G: +`0x${hex.slice(3, 5)}`,
		B: +`0x${hex.slice(5, 7)}`,
		hex,
	}
}

export function oklch_rgb(L: number, C: number, H: number, clipToRGB?: boolean): RGB {
	const a = C * Math.cos(H * Math.PI / 180)
	const b = C * Math.sin(H * Math.PI / 180)

	let l = L + 0.3963377774 * a + 0.2158037573 * b
	let m = L - 0.1055613458 * a - 0.0638541728 * b
	let s = L - 0.0894841775 * a - 1.2914855480 * b

	l = l * l * l
	m = m * m * m
	s = s * s * s

	const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
	const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
	const B = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s

	const toSrgb = (v: number) =>
		v <= 0.0031308 ? 12.92321 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055

	let res = {
		R: Math.round(toSrgb(R) * 255),
		G: Math.round(toSrgb(G) * 255),
		B: Math.round(toSrgb(B) * 255),
		hex: "",
	}

	if (clipToRGB) {
		res.R = Math.min(Math.max(0, res.R), 255)
		res.G = Math.min(Math.max(0, res.G), 255)
		res.B = Math.min(Math.max(0, res.B), 255)
	}

	res.hex = "#" +
		res.R.toString(16).padStart(2, "0") +
		res.G.toString(16).padStart(2, "0") +
		res.B.toString(16).padStart(2, "0")

	return res
}

export function rgb_oklch(R: number, G: number, B: number): OKLCH {
	const toLinear = (v: number) => v <= 0.04045 ? v / 12.92321 : Math.pow((v + 0.055) / 1.055, 2.4)

	R = toLinear(R)
	G = toLinear(G)
	B = toLinear(B)

	let l = 0.4121656120 * R + 0.5362752080 * G + 0.0514575653 * B
	let m = 0.2118591070 * R + 0.6807189584 * G + 0.1074065790 * B
	let s = 0.0883097947 * R + 0.2818474174 * G + 0.6302613616 * B

	l = Math.cbrt(l)
	m = Math.cbrt(m)
	s = Math.cbrt(s)

	const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
	const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
	const b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s

	const C = Math.sqrt(a * a + b * b)
	const h = Math.atan2(b, a) * 180 / Math.PI
	const H = h < 0 ? h + 360 : h

	return { L, C, H }
}

export function makePalette(seedColor: string): palette
export function makePalette(hue: number, saturation: number): palette

export function makePalette(seedOrHue: string | number, saturation?: number): palette {
	let hue: number
	let sat: number
	if (typeof seedOrHue == "number") {
		hue = seedOrHue
		sat = saturation!!
	} else {
		const rgb = parseRGB(seedOrHue)
		hue = rgb_oklch(rgb.R, rgb.G, rgb.B).H
		sat = rgb_sat(rgb)
	}

	let chromaMap: Record<paletteColor, number>
	if (172 <= hue && hue <= 277) {
		chromaMap = chromaMapTernary
	} else if (57 <= hue && hue <= 122 || 156 <= hue && hue < 172 || 227 < hue && hue <= 243) {
		chromaMap = chromaMapSecondary
	} else {
		chromaMap = chromaMapPrimary
	}

	const palette: palette = {} as palette

	for (const k in Object.keys(chromaMap)) {
		const key = k as paletteColor
		palette[key] = {
			L: lightnessMap[key],
			C: chromaMap[key] * sat,
			H: hue,
		}
	}

	return palette
}
