'''
Sync the gallery image list in Gallery.tsx with whatever is actually sitting in
public/gallery-images, then build the site.

Images already in the list keep their position, images whose files have gone are
dropped, and anything new is appended to the end.
'''
import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
GALLERY_DIR = PROJECT_ROOT / 'public' / 'gallery-images'
GALLERY_COMPONENT = PROJECT_ROOT / 'src' / 'sections' / 'Gallery.tsx'

# How the paths are written in the component, relative to the built page.
PATH_PREFIX = './gallery-images/'
IMAGE_SUFFIXES = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'}

# Matches `const images = [ ... ]` up to the first closing bracket at column 0.
IMAGES_BLOCK = re.compile(r'(?P<open>const images = \[\n)(?P<body>.*?)(?P<close>\n\])', re.DOTALL)


def find_images_on_disk():
    if not GALLERY_DIR.is_dir():
        raise SystemExit(f'No gallery directory at {GALLERY_DIR}')

    names = [
        entry.name for entry in GALLERY_DIR.iterdir()
        if entry.is_file() and entry.suffix.lower() in IMAGE_SUFFIXES
    ]

    # Sorted so a batch of new images lands in a predictable order.
    return sorted(names, key=str.lower)


def read_listed_images(body):
    return re.findall(r'"' + re.escape(PATH_PREFIX) + r'(.*?)"', body)


def render_images_block(names):
    return '\n'.join(f'    {json.dumps(PATH_PREFIX + name)},' for name in names)


def sync_gallery():
    source = GALLERY_COMPONENT.read_text(encoding='utf-8')
    match = IMAGES_BLOCK.search(source)
    if not match:
        raise SystemExit(f'Could not find `const images = [` in {GALLERY_COMPONENT}')

    listed = read_listed_images(match.group('body'))
    on_disk = find_images_on_disk()
    on_disk_set = set(on_disk)

    # Keep the existing order, drop what no longer exists, append what is new.
    kept = [name for name in listed if name in on_disk_set]
    removed = [name for name in listed if name not in on_disk_set]
    added = [name for name in on_disk if name not in set(listed)]
    updated = kept + added

    for name in removed:
        print(f'  - {name}')
    for name in added:
        print(f'  + {name}')

    if updated == listed:
        print(f'Gallery already lists all {len(updated)} images.')
        return

    rebuilt = match.group('open') + render_images_block(updated) + match.group('close')
    GALLERY_COMPONENT.write_text(source[:match.start()] + rebuilt + source[match.end():], encoding='utf-8')
    print(f'Gallery now lists {len(updated)} images ({len(added)} added, {len(removed)} removed).')


def run_build():
    npm = 'npm.cmd' if os.name == 'nt' else 'npm'
    print('Running `npm run build`...')
    # npm writes straight to the terminal, so flush first to keep the order readable.
    sys.stdout.flush()
    subprocess.run([npm, 'run', 'build'], check=True, cwd=PROJECT_ROOT)


def main():
    sync_gallery()
    try:
        run_build()
    except subprocess.CalledProcessError as error:
        return error.returncode

    return 0


if __name__ == '__main__':
    sys.exit(main())
