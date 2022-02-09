#!/usr/bin/env python3

# Link: https://gist.github.com/nimatrueway/0e743d92056e2c5f995e25b848a1bdcd

from sys import argv
from pathlib import Path
from PIL import Image, ImageSequence


def webp2gif(path: Path, out: Path):
    img = Image.open(path)

    frames: list[Image.Image] = []
    for frame in ImageSequence.Iterator(img):
        im2 = Image.new("RGB", frame.size, (255, 255, 255))
        im2.paste(frame)
        frames.append(im2.convert('RGB'))

    frames[0].save(out.with_suffix('.gif'),
                   format='gif',
                   save_all=True,
                   append_images=frames[1:],
                   optimize=True,
                   duration=img.info.get("duration", 10),
                   loop=img.info.get("loop", 0),
                   quality=100)

if __name__ == "__main__":
    webp2gif(Path(argv[1]), Path(argv[2]))
