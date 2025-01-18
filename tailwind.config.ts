import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * 
 * Optimizations made to reduce bundle size:
 * 1. Specific content paths to scan only relevant files
 * 2. Custom transform function to handle dynamic class names
 * 3. Optimized extraction pattern for better class detection
 * 4. Minimal safelist with only essential dynamic classes
 * 5. Modern v3.0 syntax for better tree-shaking
 */
export default {
	darkMode: ["class"],
	content: {
		// Target only specific directories to reduce scanning time
		files: [
			"./src/pages/**/*.{ts,tsx}",
			"./src/components/**/*.{ts,tsx}",
			"./src/app/**/*.{ts,tsx}",
			"./src/contexts/**/*.{ts,tsx}",
			"./src/hooks/**/*.{ts,tsx}"
		],
		// Handle dynamic class names in template literals
		transform: {
			tsx: (content) => content.replace(/className="([^"]*)"/, (match, className) => {
				return className.includes('${') ? match : '';
			})
		},
		// Optimize class extraction pattern
		extract: {
			tsx: (content) => {
				return content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
			}
		}
	},
	// Minimal safelist to prevent purging of essential dynamic classes
	safelist: [
		'prose-invert',   // Typography dark mode
		'prose-zinc',     // Typography color scheme
		'text-zinc-100',  // Text color for messages
		'bg-zinc-800',    // Background for messages
		'bg-zinc-900',    // Background for containers
		'hover:bg-zinc-700' // Hover state for interactive elements
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
