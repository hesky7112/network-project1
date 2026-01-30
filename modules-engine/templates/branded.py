
import marimo as mo
import sys
from pathlib import Path

# Add primitives to path to allow importing Theme
# In production this might be installed or in PYTHONPATH
sys.path.append(str(Path(__file__).parent.parent / "primitives"))

try:
    from theme import Theme
except ImportError:
    # Fallback if theme not found
    class Theme:
        @staticmethod
        def get_head(): return mo.Html("")
        @staticmethod
        def card(c, title=None, variant="default"): return mo.Html(c)

# 1. Inject Branded Theme (Tailwind + Colors)
mo.output.replace(Theme.get_head())

# 2. UI Components
title = mo.md(f"""
# <span class="text-stardust-violet">Alien</span> Module
<p class="text-sm text-gray-400 uppercase tracking-widest font-bold">Powered by Modules Engine</p>
""")

input_section = mo.ui.text_area(label="Input Data", placeholder="Type something...", full_width=True)
process_btn = mo.ui.button(label="Running Process 🚀", kind="success")

# 3. Logic
@mo.reactive
def process(btn, data):
    if not btn.value:
        return None
    
    # Real processing logic: analysis of input data
    word_count = len(data.split())
    char_count = len(data)
    lines = len([line for line in data.split('\n') if line.strip()])
    
    return mo.vstack([
        mo.md(f"### Quantum Analysis Result"),
        mo.md(f"Processed: **{data[:100]}{'...' if len(data) > 100 else ''}**"),
        mo.hstack([
            mo.md(f"**Tokens:** {word_count}"),
            mo.md(f"**Neurons:** {char_count}"),
            mo.md(f"**Layers:** {lines}")
        ], gap="2rem")
    ])

output_area = process(process_btn, input_section.value)

# 4. Layout
app_layout = mo.vstack([
    title,
    mo.hstack([
        Theme.card(mo.vstack([input_section, process_btn]), title="Control Panel"),
        Theme.card(output_area or "Waiting for input...", title="Output", variant="primary")
    ], gap="2rem")
])

app_layout
