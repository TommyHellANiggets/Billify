import os
from PIL import Image
import cairosvg
import io

# Папки для сохранения
FAVICON_DIR = os.path.join('static', 'images', 'favicon')
SVG_PATH = os.path.join(FAVICON_DIR, 'favicon.svg')
ICO_PATH = os.path.join(FAVICON_DIR, 'favicon.ico')

# Создаем директорию, если она не существует
os.makedirs(FAVICON_DIR, exist_ok=True)

def svg_to_png(svg_path, output_path, width, height):
    """Конвертирует SVG в PNG с заданным размером"""
    png_data = cairosvg.svg2png(url=svg_path, output_width=width, output_height=height)
    with open(output_path, 'wb') as f:
        f.write(png_data)
    print(f"Создан {output_path}")
    return output_path

def create_ico(sizes, output_path):
    """Создает ICO файл с различными размерами"""
    images = []
    
    for size in sizes:
        png_path = os.path.join(FAVICON_DIR, f'favicon_{size}x{size}.png')
        img = Image.open(png_path)
        images.append(img)
    
    # Сохраняем как ICO файл
    images[0].save(
        output_path,
        format='ICO',
        sizes=[(img.width, img.height) for img in images],
        append_images=images[1:]
    )
    print(f"Создан {output_path}")

# Создаем PNG изображения разных размеров
sizes = [16, 32, 48, 64, 128, 256]
png_paths = []

for size in sizes:
    png_path = os.path.join(FAVICON_DIR, f'favicon_{size}x{size}.png')
    svg_to_png(SVG_PATH, png_path, size, size)
    png_paths.append(png_path)

# Создаем ICO файл
create_ico(sizes, ICO_PATH)

print("Генерация фавикона завершена!") 