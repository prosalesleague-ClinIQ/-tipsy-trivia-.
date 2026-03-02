/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                display: ['Outfit', 'sans-serif'],
                body: ['Nunito', 'sans-serif'],
            },
            colors: {
                brand: {
                    purple: '#7C3AED',
                    teal: '#0D9488',
                    gold: '#F59E0B',
                    pink: '#EC4899',
                    navy: '#0F172A',
                    dark: '#0A0A1A',
                },
            },
            animation: {
                'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
                'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
                'slide-up': 'slideUp 0.4s ease-out',
                'count-down': 'countDown 1s linear',
                'buzz-shake': 'buzzShake 0.3s ease-in-out',
                'confetti-fall': 'confetti 2s ease-in-out forwards',
            },
            keyframes: {
                bounceIn: {
                    '0%': { opacity: '0', transform: 'scale(0.3)' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                pulseGlow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(124, 58, 237, 0.5)' },
                    '50%': { boxShadow: '0 0 40px rgba(124, 58, 237, 0.9)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                buzzShake: {
                    '0%, 100%': { transform: 'translateX(0)' },
                    '25%': { transform: 'translateX(-8px)' },
                    '75%': { transform: 'translateX(8px)' },
                },
            },
        },
    },
    plugins: [],
};
