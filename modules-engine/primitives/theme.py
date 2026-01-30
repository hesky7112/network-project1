
import marimo as mo

class Theme:
    """
    Theme Primitive for Alien Net
    Injects branded styles (Tailwind + Custom Colors) into Marimo notebooks.
    """

    @staticmethod
    def get_head():
        """
        Returns a mo.Html object containing the necessary script tags 
        to enable Tailwind and the Alien Net design system.
        """
        return mo.Html("""
        <!-- Tailwind CDN -->
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Google Fonts -->
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Outfit:wght@400;900&display=swap" rel="stylesheet">

        <!-- Tailwind Configuration -->
        <script>
            tailwind.config = {
                darkMode: 'class',
                theme: {
                    extend: {
                        fontFamily: {
                            sans: ['Inter', 'sans-serif'],
                        },
                        colors: {
                            'stardust-violet': '#8A2BE2',
                            'oled-black': '#000000',
                            'alien-green': '#00FF41',
                            'cosmic-red': '#FF4D00',
                            'earth-green': '#2D5A27',
                            'void-indigo': '#4B0082',
                            'nebula-blue': '#001C46',
                            'nebula-purple': '#2D0046',
                            background: '#09090b', // Zinc-950 equivalent for dark mode base
                            foreground: '#fafafa', // Zinc-50
                            primary: '#8A2BE2',
                        }
                    }
                }
            }
        </script>
        
        <!-- Global Styles to Enforce Dark Mode & Fonts -->
        <style>
            body, .marimo {
                font-family: 'Inter', sans-serif;
                background-color: #000000 !important; /* Force OLED Black */
                color: #fafafa;
            }
            h1, h2, h3, h4, h5, h6 {
                font-family: 'Outfit', sans-serif;
                font-weight: 900;
                letter-spacing: -0.05em;
                text-transform: uppercase;
            }
            /* Override Marimo Default Light Theme if present */
            .marimo-app {
                background-color: #000000 !important;
            }
        </style>
        """)

    @staticmethod
    def card(content, title=None, variant="default"):
        """Helper to render a styled card"""
        border_color = "border-white/10"
        if variant == "primary":
            border_color = "border-stardust-violet"
        
        html = f"""
        <div class="p-6 rounded-lg border {border_color} bg-white/5 backdrop-blur-sm">
        """
        if title:
            html += f'<h3 class="text-xl text-white mb-4">{title}</h3>'
        
        html += f'<div class="text-gray-300">{content}</div></div>'
        return mo.Html(html)
