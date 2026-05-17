/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class',
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				slate: {
					50: '#f8fafc',
					100: '#f1f5f9',
					900: '#0f172a',
					950: '#020617',
				},
			},
		},
	},
	plugins: [],
}
