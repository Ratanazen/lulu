import os
from PIL import Image, ImageFilter
import numpy as np
from collections import deque

def extract_frame(cell_img):
    arr = np.array(cell_img.convert('RGBA'))
    H, W, _ = arr.shape
    
    red = arr[:, :, 0].astype(int)
    green = arr[:, :, 1].astype(int)
    blue = arr[:, :, 2].astype(int)
    diff = np.maximum.reduce([np.abs(red - green), np.abs(green - blue), np.abs(red - blue)])
    mean_val = (red + green + blue) / 3.0
    
    # Background is checkerboard: diff <= 12 and mean >= 195
    is_bg = (diff <= 12) & (mean_val >= 195)
    
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
    
    # Remove number labels in cell corners/edges
    vis = arr[:, :, 3] > 0
    seen = np.zeros((H, W), dtype=bool)
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
                            
                cys = [p[0] for p in comp]
                cxs = [p[1] for p in comp]
                is_near_bottom = min(cys) > H - 35
                is_near_right = max(cxs) > W - 45
                is_near_left = min(cxs) < 25 and min(cys) > H - 35
                if len(comp) < 300 and (is_near_bottom or is_near_right or is_near_left):
                    for py, px in comp:
                        arr[py, px, 3] = 0
                        
    # Soft 1px edge defringing
    alpha_mask = arr[:, :, 3]
    down = np.pad(alpha_mask[1:, :], ((0, 1), (0, 0))) == 0
    up = np.pad(alpha_mask[:-1, :], ((1, 0), (0, 0))) == 0
    right = np.pad(alpha_mask[:, 1:], ((0, 0), (0, 1))) == 0
    left = np.pad(alpha_mask[:, :-1], ((0, 0), (1, 0))) == 0
    boundary = (alpha_mask == 255) & (down | up | right | left)
    fringe = boundary & (diff <= 25) & (mean_val >= 180)
    alpha_mask[fringe] = 0
    arr[:, :, 3] = alpha_mask
    
    # Smooth alpha slightly
    alpha_img = Image.fromarray(alpha_mask).filter(ImageFilter.GaussianBlur(radius=0.5))
    alpha_arr = np.array(alpha_img)
    alpha_arr[alpha_arr < 25] = 0
    alpha_arr[alpha_arr > 230] = 255
    arr[:, :, 3] = alpha_arr
    
    return Image.fromarray(arr)

def process_sheet():
    sheet_path = '/home/reny/.gemini/antigravity/brain/76ae2c8c-2993-4e2f-9c4b-3f0cef6c2491/.user_uploaded/media_1790600993788.jpg'
    sheet = Image.open(sheet_path)
    
    out_dir = 'src/assets/avatars/frames'
    pub_dir = 'public/avatars/frames'
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(pub_dir, exist_ok=True)
    
    row_names = {
        0: 'shinobi_run',    # Row 0: 5 frames running cycle
        1: 'shinobi_walk',   # Row 1: 5 frames walking/stride cycle
        2: 'shinobi_jutsu',  # Row 2: 5 frames hand-signs / jutsu charge
        3: 'shinobi_earth',  # Row 3: 5 frames ground burst / teleport
        4: 'shinobi_dash',   # Row 4: 5 frames fast dash / sprint
    }
    
    for r, name in row_names.items():
        print(f"Processing row {r}: {name}...")
        for c in range(5):
            x1 = int(c * 1024 / 5)
            x2 = int((c + 1) * 1024 / 5)
            y1 = int(r * 1024 / 5)
            y2 = int((r + 1) * 1024 / 5)
            cell = sheet.crop((x1, y1, x2, y2))
            cleaned = extract_frame(cell)
            cleaned.save(f'{out_dir}/{name}_{c}.png')
            cleaned.save(f'{pub_dir}/{name}_{c}.png')
            
    print("All rows from sprite sheet successfully extracted and saved!")

if __name__ == '__main__':
    process_sheet()
