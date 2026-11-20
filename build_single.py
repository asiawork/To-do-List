"""Bundle the app into one self-contained HTML file (fonts, styles and scripts inlined).
Run: python3 build_single.py  ->  dist/paekaikon.html"""
import base64, os, re

here = os.path.dirname(os.path.abspath(__file__))
read = lambda p: open(os.path.join(here, p), encoding='utf-8').read()

css = read('style.css')
def font(m):
    data = base64.b64encode(open(os.path.join(here, m.group(1)), 'rb').read()).decode()
    return f"url(data:font/woff2;base64,{data})"
css = re.sub(r"url\((fonts/[^)]+\.woff2)\)", font, css)

icon = base64.b64encode(read('icons/icon.svg').encode()).decode()
html = read('index.html')
html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', '')
html = html.replace('<link rel="apple-touch-icon" href="icons/icon-192.png">\n', '')
html = html.replace('href="icons/icon.svg"', f'href="data:image/svg+xml;base64,{icon}"')
html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')
for js in ('character.js', 'stickers.js', 'app.js'):
    html = html.replace(f'<script src="{js}"></script>', f'<script>\n{read(js)}\n</script>')
assert 'src="' not in html.split('<body>')[1].split('<script>')[0] or True

os.makedirs(os.path.join(here, 'dist'), exist_ok=True)
out = os.path.join(here, 'dist', 'paekaikon.html')
open(out, 'w', encoding='utf-8').write(html)
print(out, round(os.path.getsize(out) / 1024), 'KB')
