#!/usr/bin/env python3
"""
Extract 100 Authentic Frames across 5 Companion Styles (20 frames each)
Directly from User-Provided Sprite Sheets:
- Run: 20 frames (frames 0..19)
- Sleep: 20 frames (frames 0..19)
- Happy: 20 frames (frames 0..19)
- Music: 20 frames (frames 0..19)
- Sad / Emotions: 20 frames (frames 0..19)

Also updates sub-categories (walk, idle, protect, pet).
Removes checkerboard background, tint glows, and corner numbers (1..20).
"""

import os
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def extract_clean_cell(sheet, row, col):
    x1 = int(col * 1024 / 5)
    x2 = int((col + 1) * 1024 / 5)
    y1 = int(row * 1024 / 5)
    y2 = int((row + 1) * 1024 / 5)
    cell = sheet.crop((x1, y1, x2, y2))
    
    arr = np.array(cell.convert('RGBA'))
    H, W, _ = arr.shape
    
    red = arr[:, :, 0].astype(int)
    green = arr[:, :, 1].astype(int)
    blue = arr[:, :, 2].astype(int)
    diff = np.maximum.reduce([np.abs(red - green), np.abs(green - blue), np.abs(red - blue)])
    mean_val = (red + green + blue) / 3.0
    
    # 1) Standard checkerboard (neutral gray/white)
    is_cb = (diff <= 14) & (mean_val >= 175)
    # 2) Glow/tint on checkerboard (handles warm/pink glow in music and sad)
    is_glow = (green >= 135) & (blue >= 135) & (np.abs(green - blue) <= 18) & (red >= 155)
    
    is_bg = is_cb | is_glow
    
    visited = np.zeros((H, W), dtype=bool)
    q = deque()
    for x in range(W):
        if is_bg[0, x]: q.append((0, x)); visited[0, x] = True
        if is_bg[H-1, x]: q.append((H-1, x)); visited[H-1, x] = True
    for y in range(H):
        if is_bg[y, 0]: q.append((y, 0)); visited[y, 0] = True
        if is_bg[y, W-1]: q.append((y, W-1)); visited[y, W-1] = True
        
    neighbors = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
    while q:
        cy, cx = q.popleft()
        for dy, dx in neighbors:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < H and 0 <= nx < W and not visited[ny, nx] and is_bg[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))
                
    alpha = (~visited).astype(np.uint8) * 255
    arr[:, :, 3] = alpha
    
    # Remove corner numbers and stray background artifacts
    vis = arr[:, :, 3] > 0
    seen = np.zeros((H, W), dtype=bool)
    components = []
    for y in range(H):
        for x in range(W):
            if vis[y, x] and not seen[y, x]:
                cq = deque([(y, x)])
                seen[y, x] = True
                comp = []
                while cq:
                    py, px = cq.popleft()
                    comp.append((py, px))
                    for dy, dx in [(-1,0), (1,0), (0,-1), (0,1)]:
                        ny, nx = py + dy, px + dx
                        if 0 <= ny < H and 0 <= nx < W and vis[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            cq.append((ny, nx))
                components.append(comp)
                
    components.sort(key=lambda c: len(c), reverse=True)
    for comp in components[1:]:
        cys = [p[0] for p in comp]
        cxs = [p[1] for p in comp]
        if len(comp) < 650:
            if min(cys) < 35 or max(cys) > H - 35 or min(cxs) < 35 or max(cxs) > W - 35:
                for py, px in comp: arr[py, px, 3] = 0
            elif len(comp) < 100:
                for py, px in comp: arr[py, px, 3] = 0
                
    # 1px boundary defringe
    alpha_mask = arr[:, :, 3]
    down = np.pad(alpha_mask[1:, :], ((0, 1), (0, 0))) == 0
    up = np.pad(alpha_mask[:-1, :], ((1, 0), (0, 0))) == 0
    right = np.pad(alpha_mask[:, 1:], ((0, 0), (0, 1))) == 0
    left = np.pad(alpha_mask[:, :-1], ((0, 0), (1, 0))) == 0
    boundary = (alpha_mask == 255) & (down | up | right | left)
    fringe = boundary & (diff <= 25) & (mean_val >= 180)
    alpha_mask[fringe] = 0
    arr[:, :, 3] = alpha_mask
    
    alpha_img = Image.fromarray(alpha_mask).filter(ImageFilter.GaussianBlur(radius=0.5))
    alpha_arr = np.array(alpha_img)
    alpha_arr[alpha_arr < 25] = 0
    alpha_arr[alpha_arr > 230] = 255
    arr[:, :, 3] = alpha_arr
    return Image.fromarray(arr)

def main():
    uploaded_dir = '/home/reny/.gemini/antigravity/brain/76ae2c8c-2993-4e2f-9c4b-3f0cef6c2491/.user_uploaded'
    base_src = 'src/assets/avatars/animations'
    base_pub = 'public/avatars/animations'
    
    styles_config = {
        'run': ('media_1790600993788.jpg', [0, 1, 2, 4]),
        'sleep': ('uploaded_media_1790601074618.jpg', [0, 1, 2, 4]),
        'happy': ('media_1790601117371.jpg', [0, 1, 2, 4]),
        'music': ('media_1790601293536.jpg', [0, 2, 3, 4]),
        'sad': ('media_1790601350320.jpg', [0, 1, 3, 4]),
    }
    
    for style_name, (fname, rows) in styles_config.items():
        sheet = Image.open(f'{uploaded_dir}/{fname}')
        src_dir = f'{base_src}/{style_name}'
        pub_dir = f'{base_pub}/{style_name}'
        os.makedirs(src_dir, exist_ok=True)
        os.makedirs(pub_dir, exist_ok=True)
        frame_num = 0
        for r in rows:
            for c in range(5):
                clean_cell = extract_clean_cell(sheet, r, c)
                clean_cell.save(f'{src_dir}/{style_name}_{frame_num}.png')
                clean_cell.save(f'{pub_dir}/{style_name}_{frame_num}.png')
                frame_num += 1
        print(f'Extracted 20 frames for {style_name}')
        
    # Extract 20 additional combat/fast-dash frames for run from media_1790601175987.jpg (frames 21..40)
    sheet_combat = Image.open(f'{uploaded_dir}/media_1790601175987.jpg')
    run_src = f'{base_src}/run'
    run_pub = f'{base_pub}/run'
    run_frame_num = 20
    for r in [0, 1, 2, 4]:
        for c in range(5):
            clean_cell = extract_clean_cell(sheet_combat, r, c)
            clean_cell.save(f'{run_src}/run_{run_frame_num}.png')
            clean_cell.save(f'{run_pub}/run_{run_frame_num}.png')
            run_frame_num += 1
    print(f'Extracted 40 frames total for run (frames 0..39)!')
        'walk': ('media_1790600993788.jpg', 1),
        'idle': ('media_1790601350320.jpg', 1),
        'protect': ('media_1790601117371.jpg', 4),
        'pet': ('media_1790601350320.jpg', 2),
    }
    for name, (fname, row) in sub_categories.items():
        sheet = Image.open(f'{uploaded_dir}/{fname}')
        src_dir = f'{base_src}/{name}'
        pub_dir = f'{base_pub}/{name}'
        for c in range(5):
            clean_cell = extract_clean_cell(sheet, row, c)
            clean_cell.save(f'{src_dir}/{name}_{c}.png')
            clean_cell.save(f'{pub_dir}/{name}_{c}.png')
        print(f'Extracted subcategory {name}')

    print('All 100 frames + subcategories extracted successfully!')

if __name__ == '__main__':
    main()
