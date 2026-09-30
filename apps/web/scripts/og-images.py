"""Generates per-locale Open Graph images into public/og/{locale}.png (macOS system fonts, Pillow)."""

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
ICON = ROOT.parent / 'mobile' / 'assets' / 'icon.png'
MARK = ROOT / 'public' / 'logo-mark.png'
OUT = ROOT / 'public' / 'og'
DOMAIN = 'calosnap-ai.uz'
W, H = 1200, 630

SF = '/System/Library/Fonts/SFNS.ttf'
KO = '/System/Library/Fonts/AppleSDGothicNeo.ttc'


def font(size: int, weight: str, lang: str) -> ImageFont.FreeTypeFont:
    if lang == 'ko':
        return ImageFont.truetype(KO, size, index=6 if weight == 'Bold' else 2)
    f = ImageFont.truetype(SF, size)
    f.set_variation_by_name(weight)
    return f


def gradient() -> Image.Image:
    stops = [(0.0, (34, 197, 139)), (0.5, (22, 168, 107)), (1.0, (15, 122, 85))]
    img = Image.new('RGB', (W, H))
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = (x / W) * 0.65 + (y / H) * 0.35
            for (a, ca), (b, cb) in zip(stops, stops[1:]):
                if a <= t <= b:
                    k = (t - a) / (b - a)
                    px[x, y] = tuple(round(ca[i] + (cb[i] - ca[i]) * k) for i in range(3))
                    break
    return img


def rounded(img: Image.Image, size: int, radius: float) -> Image.Image:
    img = img.convert('RGBA').resize((size * 4, size * 4), Image.LANCZOS)
    mask = Image.new('L', img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, *img.size), radius=radius * 4, fill=255)
    img.putalpha(mask)
    return img.resize((size, size), Image.LANCZOS)


def wrap(draw: ImageDraw.ImageDraw, text: str, f: ImageFont.FreeTypeFont, width: int) -> list[str]:
    words, lines, line = text.split(), [], ''
    for word in words:
        candidate = f'{line} {word}'.strip()
        if draw.textlength(candidate, font=f) <= width or not line:
            line = candidate
        else:
            lines.append(line)
            line = word
    return lines + [line] if line else lines


def render(lang: str, tagline: str, base: Image.Image) -> None:
    img = base.copy().convert('RGBA')

    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse((760, -220, 1380, 400), fill=(255, 255, 255, 46))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(90)))

    mark = Image.open(MARK).convert('RGBA').resize((520, 520), Image.LANCZOS)
    mark.putalpha(mark.getchannel('A').point(lambda a: a * 0.16))
    img.alpha_composite(mark, (760, 90))

    shadow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((84, 104, 84 + 132, 104 + 132), radius=32, fill=(0, 0, 0, 70))
    img.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    img.alpha_composite(rounded(Image.open(ICON), 132, 30), (80, 96))

    draw = ImageDraw.Draw(img)
    draw.text((78, 262), 'CaloSnap', font=font(96, 'Bold', 'en'), fill='white')

    f_tag = font(46, 'Semibold' if lang != 'ko' else 'Bold', lang)
    y = 392
    for line in wrap(draw, tagline, f_tag, 900)[:2]:
        draw.text((80, y), line, font=f_tag, fill=(255, 255, 255, 235))
        y += 60

    draw.text((80, 540), DOMAIN, font=font(30, 'Medium', 'en'), fill=(255, 255, 255, 190))
    img.convert('RGB').save(OUT / f'{lang}.png', optimize=True)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    base = gradient()
    for path in sorted((ROOT / 'i18n' / 'locales').glob('*.json')):
        data = json.loads(path.read_text('utf-8'))
        render(path.stem, data['footer']['tagline'].rstrip('.。'), base)
        print('og:', path.stem)


if __name__ == '__main__':
    main()
