import os
import math
import shutil
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def create_frames():
    base_dir = "src/assets/avatars"
    out_dir = "src/assets/avatars/frames"
    public_out_dir = "public/avatars/frames"
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(public_out_dir, exist_ok=True)

    # =========================================================================
    # 1. SHINOBI IDLE (6 Frames: Breathing, Hair Sway, Sharingan Eye Blink)
    # =========================================================================
    print("Generating shinobi_idle frames (6 frames)...")
    idle_base = Image.open(f"{base_dir}/shinobi_idle.png").convert("RGBA")
    W, H = idle_base.size

    # Idle cycle: 6 frames
    # Eye blink at frame 3
    # Breath curve: sin wave
    for i in range(6):
        frame = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        
        # Breathing scale and offset
        breath_phase = (i / 6.0) * 2 * math.pi
        scale_y = 1.0 + 0.018 * math.sin(breath_phase)
        scale_x = 1.0 - 0.006 * math.sin(breath_phase)
        
        # Rescale body from anchor bottom-center
        new_w = int(W * scale_x)
        new_h = int(H * scale_y)
        scaled = idle_base.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Position with bottom alignment
        paste_x = (W - new_w) // 2
        paste_y = H - new_h
        frame.paste(scaled, (paste_x, paste_y), scaled)

        # Hair tip subtle sway layer
        if i in [1, 2, 4]:
            hair_shift = 2 if i == 2 else 1
            # Apply subtle lateral drift to spiky hair crest
            hair_crest = idle_base.crop((0, 0, W, int(H * 0.45)))
            shifted_crest = Image.new("RGBA", hair_crest.size, (0, 0, 0, 0))
            shifted_crest.paste(hair_crest, (hair_shift, 0))
            frame.paste(shifted_crest, (0, 0), shifted_crest)

        # Sharingan Eye Blink on frame 3, half-blink on frame 2 & 4
        # Eye center approx (427, 368) on base sprite
        # In scaled coordinates:
        eye_x = int(427 * scale_x + paste_x)
        eye_y = int(368 * scale_y + paste_y)
        
        draw = ImageDraw.Draw(frame)
        if i == 3:
            # Full blink: draw natural anime eyelid over eye (skin/shadow tone)
            # Cover sharingan with skin eyelid and dark curved lash
            eyelid_box = [eye_x - 14, eye_y - 8, eye_x + 14, eye_y + 8]
            draw.chord(eyelid_box, start=0, end=180, fill=(232, 195, 172, 255), outline=(45, 40, 42, 255), width=2)
            # Gentle eyelash curve
            draw.arc([eye_x - 16, eye_y - 5, eye_x + 16, eye_y + 9], start=190, end=350, fill=(35, 30, 32, 255), width=3)
        elif i in [2, 4]:
            # Sharingan intense gleam glint
            glint_alpha = 240 if i == 2 else 180
            draw.ellipse([eye_x - 3, eye_y - 3, eye_x + 3, eye_y + 3], fill=(255, 255, 255, glint_alpha))
            # Tiny cross star gleam
            draw.line([(eye_x - 6, eye_y), (eye_x + 6, eye_y)], fill=(255, 255, 255, glint_alpha), width=1)
            draw.line([(eye_x, eye_y - 6), (eye_x, eye_y + 6)], fill=(255, 255, 255, glint_alpha), width=1)

        # Save frame
        frame.save(f"{out_dir}/shinobi_idle_{i}.png")
        frame.save(f"{public_out_dir}/shinobi_idle_{i}.png")

    # =========================================================================
    # 2. SHINOBI RUN (6 Frames: Stride, Bobbing, Mane Ripple, Wind Speed Lines)
    # =========================================================================
    print("Generating shinobi_run frames (6 frames)...")
    run_base = Image.open(f"{base_dir}/shinobi_run.png").convert("RGBA")
    RW, RH = run_base.size

    # Run cycle: 6 frames
    # Alternating stride bobbing: contact -> down -> pass -> up -> flight -> land
    bob_offsets = [0, 8, -6, 2, -10, 4]
    squash_factors = [1.0, 0.96, 1.025, 0.99, 1.03, 0.97]
    tilt_angles = [0, -2, 2, -1, 3, -1]

    for i in range(6):
        frame = Image.new("RGBA", (RW, RH), (0, 0, 0, 0))
        
        bob = bob_offsets[i]
        squash = squash_factors[i]
        tilt = tilt_angles[i]
        
        # Rescale with squash and stretch
        cur_w = int(RW * (2.0 - squash))
        cur_h = int(RH * squash)
        scaled_run = run_base.resize((cur_w, cur_h), Image.Resampling.LANCZOS)
        
        # Rotate slightly for dynamic running stride
        rotated_run = scaled_run.rotate(tilt, resample=Image.Resampling.BICUBIC, expand=False)
        
        # Place with bottom alignment plus bob
        paste_x = (RW - cur_w) // 2
        paste_y = max(0, min(RH - cur_h + bob, RH - cur_h))
        frame.paste(rotated_run, (paste_x, paste_y), rotated_run)

        # Add anime speed wind streaks and trailing chakra sparks
        draw = ImageDraw.Draw(frame)
        
        # Dynamic hair wave ripple effect on trailing hair (left side of run sprite)
        # Hair mane trailing lines
        line_alpha = 140 if i % 2 == 0 else 200
        streak_y1 = int(RH * 0.35 + (i * 12) % 40)
        streak_y2 = int(RH * 0.48 - (i * 8) % 30)
        
        # Wind streaks behind character (X: 30 to 180)
        draw.line([(30 + (i * 15) % 40, streak_y1), (160 + (i * 15) % 40, streak_y1)], fill=(255, 255, 255, line_alpha), width=2)
        draw.line([(60 + (i * 20) % 50, streak_y2), (210 + (i * 20) % 50, streak_y2)], fill=(255, 255, 255, line_alpha - 40), width=1)
        
        # Foot dash dust puff on contact frames (frames 0 and 3)
        if i in [0, 3]:
            foot_x = int(RW * 0.55 if i == 0 else RW * 0.65)
            foot_y = int(RH * 0.92)
            draw.arc([foot_x - 20, foot_y - 10, foot_x + 10, foot_y + 10], start=120, end=260, fill=(230, 230, 230, 180), width=2)
            draw.arc([foot_x - 35, foot_y - 6, foot_x - 10, foot_y + 8], start=140, end=240, fill=(210, 210, 210, 140), width=2)

        # Save frame
        frame.save(f"{out_dir}/shinobi_run_{i}.png")
        frame.save(f"{public_out_dir}/shinobi_run_{i}.png")

    # =========================================================================
    # 3. SHINOBI SAD (6 Frames: Tears Streaming, Shivering Sob, Dripping Drops)
    # =========================================================================
    print("Generating shinobi_sad frames (6 frames)...")
    sad_base = Image.open(f"{base_dir}/shinobi_sad.png").convert("RGBA")
    SW, SH = sad_base.size

    # Sad cycle: 6 frames
    # Sob heaves and falling teardrops
    sob_heaves = [0, -5, -2, 3, -1, 1]
    shiver_x = [0, 1, -1, 2, -1, 0]

    for i in range(6):
        frame = Image.new("RGBA", (SW, SH), (0, 0, 0, 0))
        
        heave = sob_heaves[i]
        shiver = shiver_x[i]
        
        # Place base with heave & subtle shiver
        paste_x = shiver
        paste_y = heave
        frame.paste(sad_base, (paste_x, paste_y), sad_base)
        
        draw = ImageDraw.Draw(frame)
        
        # Eyes are around (496, 365) and (390, 365)
        # Left eye tear trail and right eye tear trail
        eye_lx, eye_rx = 395 + shiver, 500 + shiver
        base_y = 370 + heave
        
        # Progressive teardrop fall distance
        tear_drop_progress = (i / 6.0)
        tear_y = int(base_y + 35 + tear_drop_progress * 130)
        
        # Flowing tear stream down cheeks
        # Left cheek tear
        draw.line([(eye_lx - 2, base_y + 15), (eye_lx - 4, base_y + 40), (eye_lx - 6, base_y + 70)], fill=(120, 210, 255, 210), width=3)
        draw.line([(eye_lx - 2, base_y + 15), (eye_lx - 4, base_y + 40), (eye_lx - 6, base_y + 70)], fill=(255, 255, 255, 240), width=1)
        
        # Right cheek tear
        draw.line([(eye_rx + 2, base_y + 15), (eye_rx + 5, base_y + 45), (eye_rx + 8, base_y + 75)], fill=(120, 210, 255, 210), width=3)
        draw.line([(eye_rx + 2, base_y + 15), (eye_rx + 5, base_y + 45), (eye_rx + 8, base_y + 75)], fill=(255, 255, 255, 240), width=1)

        # Falling teardrop bead with glint
        if i in [1, 2, 3, 4]:
            drop_x = eye_rx + 7
            draw.ellipse([drop_x - 3, tear_y - 5, drop_x + 3, tear_y + 5], fill=(130, 215, 255, 230))
            draw.ellipse([drop_x - 1, tear_y - 3, drop_x + 1, tear_y], fill=(255, 255, 255, 250))
            
        # Splash droplet on ground on frame 5
        if i == 5:
            splash_x = eye_rx + 7
            splash_y = int(SH * 0.88)
            draw.arc([splash_x - 8, splash_y - 4, splash_x + 8, splash_y + 4], start=180, end=360, fill=(140, 220, 255, 200), width=2)
            draw.point([(splash_x - 6, splash_y - 6), (splash_x + 6, splash_y - 6)], fill=(200, 240, 255, 220))

        # Save frame
        frame.save(f"{out_dir}/shinobi_sad_{i}.png")
        frame.save(f"{public_out_dir}/shinobi_sad_{i}.png")

    # =========================================================================
    # 4. SHINOBI SLEEP (6 Frames: Expanding Snot Bubble, Floating Zzz, Blanket)
    # =========================================================================
    print("Generating shinobi_sleep frames (6 frames)...")
    sleep_base = Image.open(f"{base_dir}/shinobi_sleep.png").convert("RGBA")
    BW, BH = sleep_base.size

    # Sleep cycle: 6 frames
    # Snot bubble radius: 6 -> 12 -> 20 -> 24 (wobble) -> 8 (pop) -> 5
    bubble_radii = [7, 13, 20, 24, 8, 6]
    futon_rises = [0, -3, -5, -4, 1, 0]

    # Face center around (488, 285)
    nose_x = 488
    nose_y = 285

    for i in range(6):
        frame = Image.new("RGBA", (BW, BH), (0, 0, 0, 0))
        
        rise = futon_rises[i]
        
        # Subtle breathing deformation on futon
        frame.paste(sleep_base, (0, rise), sleep_base)
        
        draw = ImageDraw.Draw(frame)
        
        # Snot bubble at nose
        r = bubble_radii[i]
        bx, by = nose_x + 12, nose_y + rise - 4
        
        if i == 4:
            # Pop ripple: small shrinking bubble + pop starburst
            draw.ellipse([bx - r, by - r, bx + r, by + r], outline=(180, 220, 255, 180), width=1)
            # Tiny pop sparkles
            draw.line([(bx - r - 4, by), (bx + r + 4, by)], fill=(200, 235, 255, 220), width=1)
            draw.line([(bx, by - r - 4), (bx, by + r + 4)], fill=(200, 235, 255, 220), width=1)
        else:
            # Glossy anime snot bubble
            wobble_x = 2 if i == 3 else 0
            wobble_y = -1 if i == 3 else 0
            bubble_box = [bx - r - wobble_x, by - r - wobble_y, bx + r + wobble_x, by + r + wobble_y]
            
            # Semi-transparent pale cyan/blue glassy body
            draw.ellipse(bubble_box, fill=(180, 230, 255, 110), outline=(130, 195, 245, 210), width=2)
            # Shiny white curved reflection highlight on top-left of bubble
            if r > 8:
                hl_r = r // 2
                draw.arc([bx - r + 3, by - r + 3, bx, by], start=180, end=290, fill=(255, 255, 255, 240), width=2)
                draw.point([(bx - r // 2, by - r // 2)], fill=(255, 255, 255, 255))

        # Floating "Zzz" sleep characters
        # Drift upward and to the right
        z_y_offset = int((i / 6.0) * 45)
        z1_x, z1_y = 560 + i * 3, 230 + rise - z_y_offset
        z2_x, z2_y = 585 + i * 4, 190 + rise - int(z_y_offset * 1.2)
        z3_x, z3_y = 615 + i * 5, 150 + rise - int(z_y_offset * 1.4)
        
        # Draw stylized cartoon 'Z's with smooth outlines
        def draw_z(x, y, size, alpha):
            if y < 20 or alpha <= 0: return
            half = size // 2
            # Z points: top-left, top-right, bottom-left, bottom-right
            pts = [(x - half, y - half), (x + half, y - half), (x - half, y + half), (x + half, y + half)]
            draw.line([pts[0], pts[1]], fill=(140, 190, 255, alpha), width=3)
            draw.line([pts[1], pts[2]], fill=(140, 190, 255, alpha), width=3)
            draw.line([pts[2], pts[3]], fill=(140, 190, 255, alpha), width=3)
            # Highlight center
            draw.line([pts[0], pts[1]], fill=(255, 255, 255, alpha), width=1)
            draw.line([pts[1], pts[2]], fill=(255, 255, 255, alpha), width=1)
            draw.line([pts[2], pts[3]], fill=(255, 255, 255, alpha), width=1)

        draw_z(z1_x, z1_y, 14, 230 - i * 15)
        if i >= 1:
            draw_z(z2_x, z2_y, 18, 210 - i * 18)
        if i >= 2:
            draw_z(z3_x, z3_y, 22, 180 - i * 22)

        # Save frame
        frame.save(f"{out_dir}/shinobi_sleep_{i}.png")
        frame.save(f"{public_out_dir}/shinobi_sleep_{i}.png")

    print("Successfully built all 24 frames (6 frames x 4 actions) in:")
    print(f" - {out_dir}")
    print(f" - {public_out_dir}")

if __name__ == "__main__":
    create_frames()
