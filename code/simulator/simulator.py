import math
import json
import os
import sys
import argparse

SWATCH_SPEC = [
    {"index": "01", "role": "Canvas Background",    "L": 0.985, "C": 0.004},
    {"index": "02", "role": "Neutral Surface",      "L": 0.965, "C": 0.008},
    {"index": "03", "role": "Subtle Surface",       "L": 0.930, "C": 0.012},
    {"index": "04", "role": "Soft Pastel Tint",     "L": 0.890, "C": 0.035},
    {"index": "05", "role": "Medium Pastel Tint",   "L": 0.840, "C": 0.050},
    {"index": "06", "role": "Low Border",           "L": 0.800, "C": 0.025},
    {"index": "07", "role": "Mid Border",           "L": 0.680, "C": 0.040},
    {"index": "08", "role": "High Border",          "L": 0.520, "C": 0.060},
    {"index": "09", "role": "Base Core Tone",       "L": 0.480, "C": 0.070},
    {"index": "10", "role": "Solid Vibrant Tone",   "L": 0.420, "C": 0.060},
    {"index": "11", "role": "Deep Accessible Ink",  "L": 0.320, "C": 0.050},
    {"index": "12", "role": "Dark Canvas Surface",  "L": 0.180, "C": 0.015},
    {"index": "13", "role": "Dark Card Surface",    "L": 0.140, "C": 0.012},
    {"index": "14", "role": "Dark Ground Canvas",   "L": 0.100, "C": 0.008},
    {"index": "15", "role": "Absolute Deep Ink",    "L": 0.060, "C": 0.005},
]

HUES = [
    {"name": "Red",     "hue": 25.0},
    {"name": "Orange",  "hue": 45.0},
    {"name": "Yellow",  "hue": 85.0},
    {"name": "Green",   "hue": 145.0},
    {"name": "Blue",    "hue": 220.0},
    {"name": "Indigo",  "hue": 260.0},
    {"name": "Violet",  "hue": 320.0},
]

W_SRGB = [0.2126, 0.7152, 0.0722]

M1_A = [+0.3963377774, -0.1055613458, -0.0894841775]
M1_B = [+0.2158037573, -0.0638541728, -1.2914855480]

M2 = [
    [+4.0767416621, -3.3077115913, +0.2309699292],
    [-1.2684380046, +2.6097574011, -0.3413193965],
    [-0.0041960863, -0.7034186147, +1.7076147010]
]

P_PROTAN = [
    [0.152286,  1.052583, -0.204868],
    [0.114503,  0.786281,  0.099216],
    [-0.003882, -0.048116,  1.051998]
]

P_DEUTAN = [
    [0.367322,  0.860646, -0.227968],
    [0.280085,  0.672501,  0.047413],
    [-0.011820,  0.042940,  0.968881]
]

P_TRITAN = [
    [1.255528, -0.076749, -0.178779],
    [-0.078411,  0.930809,  0.147602],
    [0.004733,  0.691367,  0.303900]
]

def clamp(val, min_v=0.0, max_v=1.0):
    return max(min_v, min(max_v, val))

def oklch_to_raw_linear_srgb(L, C, h_deg):
    theta = math.radians(h_deg)
    a = C * math.cos(theta)
    b = C * math.sin(theta)

    l_prime = L + M1_A[0] * a + M1_B[0] * b
    m_prime = L + M1_A[1] * a + M1_B[1] * b
    s_prime = L + M1_A[2] * a + M1_B[2] * b

    l = l_prime ** 3
    m = m_prime ** 3
    s = s_prime ** 3

    r = M2[0][0] * l + M2[0][1] * m + M2[0][2] * s
    g = M2[1][0] * l + M2[1][1] * m + M2[1][2] * s
    b_val = M2[2][0] * l + M2[2][1] * m + M2[2][2] * s
    return r, g, b_val

def oklch_to_linear_srgb(L, C, h_deg):
    r, g, b = oklch_to_raw_linear_srgb(L, C, h_deg)
    return clamp(r), clamp(g), clamp(b)

def linear_to_display_srgb(c):
    if c <= 0.0031308:
        val = 12.92 * c
    else:
        val = 1.055 * (c ** (1.0 / 2.4)) - 0.055
    return int(round(clamp(val) * 255))

def relative_luminance(r, g, b):
    return W_SRGB[0] * r + W_SRGB[1] * g + W_SRGB[2] * b

def apply_matrix(M, r, g, b):
    r_out = clamp(M[0][0] * r + M[0][1] * g + M[0][2] * b)
    g_out = clamp(M[1][0] * r + M[1][1] * g + M[1][2] * b)
    b_out = clamp(M[2][0] * r + M[2][1] * g + M[2][2] * b)
    return r_out, g_out, b_out

def wcag_contrast(y1, y2):
    lighter = max(y1, y2)
    darker = min(y1, y2)
    return (lighter + 0.05) / (darker + 0.05)

def apca_contrast(y_txt, y_bg):
    if y_bg > y_txt:
        s_c = (y_bg ** 0.56 - y_txt ** 0.57) * 1.14
    else:
        s_c = (y_bg ** 0.65 - y_txt ** 0.62) * 1.14
    return s_c * 100.0

def verify_theorem1(L0=0.890, C0=0.035, steps=3600):
    w_lms = [
        sum(W_SRGB[i] * M2[i][j] for i in range(3))
        for j in range(3)
    ]
    grad_a = sum(w_lms[j] * M1_A[j] for j in range(3))
    grad_b = sum(w_lms[j] * M1_B[j] for j in range(3))
    grad_norm = math.sqrt(grad_a ** 2 + grad_b ** 2)

    bound_factor = 2.0 * 3.0 * grad_norm
    dY_analytical = bound_factor * (L0 ** 2) * C0

    y_values = []
    step_size = 360.0 / steps
    for step in range(steps):
        h = step * step_size
        r, g, b = oklch_to_raw_linear_srgb(L0, C0, h)
        y_values.append(relative_luminance(r, g, b))

    y_min = min(y_values)
    y_max = max(y_values)
    dY_numerical = y_max - y_min
    remainder = abs(dY_analytical - dY_numerical)

    print("=" * 72)
    print("THEOREM 1: LUMINANCE INVARIANCE PROOF")
    print("=" * 72)
    print(f"w_lms:              [{w_lms[0]:.6f}, {w_lms[1]:.6f}, {w_lms[2]:.6f}]")
    print(f"grad_[a,b] Y:       [{grad_a:.6f}, {grad_b:.6f}]")
    print(f"||grad_[a,b] Y||:   {grad_norm:.6f}")
    print(f"Bound factor:       {bound_factor:.5f}")
    print(f"dY analytical:      {dY_analytical:.5f} (L0={L0}, C0={C0})")
    print(f"dY numerical:       {dY_numerical:.5f} ({steps} steps)")
    print(f"Y range:            [{y_min:.5f}, {y_max:.5f}]")
    print(f"Taylor remainder:   {remainder:.5f}")
    print("=" * 72)

def verify_gamut_closure(steps=3600):
    print("=" * 78)
    print("sRGB GAMUT CLOSURE SWEEP (3600 STEPS)")
    print("=" * 78)
    print(f"{'Idx':<4} {'Role':<22} {'L':<6} {'C':<6} {'Min RGB':<12} {'Status':<8} {'Worst Hue':<10}")
    print("-" * 78)

    step_size = 360.0 / steps
    all_passed = True

    for swatch in SWATCH_SPEC:
        idx = swatch["index"]
        role = swatch["role"]
        L = swatch["L"]
        C = swatch["C"]

        min_val = 1.0
        worst_h = 0.0

        for step in range(steps):
            h = step * step_size
            r, g, b = oklch_to_raw_linear_srgb(L, C, h)
            lowest = min(r, g, b)
            if lowest < min_val:
                min_val = lowest
                worst_h = h

        in_gamut = (min_val >= 0.0)
        status = "PASS" if in_gamut else "FAIL"
        if not in_gamut:
            all_passed = False

        print(f"{idx:<4} {role:<22} {L:<6.3f} {C:<6.3f} {min_val:>9.5f}   {status:<8} {worst_h:>6.1f} deg")

    print("-" * 78)

    def max_c_at_hue(L_val, h_val):
        low, high = 0.0, 0.20
        for _ in range(35):
            mid = (low + high) / 2.0
            r, g, b = oklch_to_raw_linear_srgb(L_val, mid, h_val)
            if 0.0 <= r <= 1.0 and 0.0 <= g <= 1.0 and 0.0 <= b <= 1.0:
                low = mid
            else:
                high = mid
        return low

    c_ceilings = [max_c_at_hue(0.320, s * step_size) for s in range(steps)]
    worst_c_max = min(c_ceilings)
    worst_angle = c_ceilings.index(worst_c_max) * step_size

    print(f"Swatch 11 (L=0.320) ceiling: C_max = {worst_c_max:.4f} at {worst_angle:.1f} deg")
    print(f"Swatch 11 calibrated C:     C     = 0.0500")
    print(f"Clearance:                  {worst_c_max - 0.0500:+.4f}")
    print("=" * 78)
    return all_passed

def run_benchmarks(write_json=True):
    canvas_light = oklch_to_linear_srgb(0.985, 0.004, 85.0)
    y_canvas_light = relative_luminance(*canvas_light)

    swatch_data = []

    for swatch in SWATCH_SPEC:
        idx = swatch["index"]
        role = swatch["role"]
        L = swatch["L"]
        C = swatch["C"]

        hue_metrics = []
        for h_info in HUES:
            h_name = h_info["name"]
            h_val = h_info["hue"]

            r, g, b = oklch_to_linear_srgb(L, C, h_val)
            R = linear_to_display_srgb(r)
            G = linear_to_display_srgb(g)
            B = linear_to_display_srgb(b)
            hex_code = f"#{R:02X}{G:02X}{B:02X}"

            y_norm = relative_luminance(r, g, b)

            r_p, g_p, b_p = apply_matrix(P_PROTAN, r, g, b)
            y_protan = relative_luminance(r_p, g_p, b_p)

            r_d, g_d, b_d = apply_matrix(P_DEUTAN, r, g, b)
            y_deutan = relative_luminance(r_d, g_d, b_d)

            r_t, g_t, b_t = apply_matrix(P_TRITAN, r, g, b)
            y_tritan = relative_luminance(r_t, g_t, b_t)

            cr_light = wcag_contrast(y_norm, y_canvas_light)
            cr_deutan = wcag_contrast(y_deutan, y_canvas_light)
            apca_val = apca_contrast(y_norm, y_canvas_light)

            hue_metrics.append({
                "hue": h_name,
                "hex": hex_code,
                "Y_norm": round(y_norm, 4),
                "Y_protan": round(y_protan, 4),
                "Y_deutan": round(y_deutan, 4),
                "Y_tritan": round(y_tritan, 4),
                "cr_light": round(cr_light, 2),
                "cr_deutan": round(cr_deutan, 2),
                "apca": round(apca_val, 1)
            })

        y_values = [m["Y_norm"] for m in hue_metrics]
        y_mean = sum(y_values) / len(y_values)
        y_variance = sum((y - y_mean) ** 2 for y in y_values) / len(y_values)
        y_std = math.sqrt(y_variance)
        max_dev = max(abs(y - y_mean) for y in y_values)

        swatch_data.append({
            "index": idx,
            "role": role,
            "L": L,
            "C": C,
            "y_mean": round(y_mean, 4),
            "y_std": round(y_std, 4),
            "max_dev": round(max_dev, 4),
            "hues": hue_metrics
        })

    if write_json:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        out_path = os.path.join(script_dir, "benchmarkResults.json")
        with open(out_path, "w") as f:
            json.dump(swatch_data, f, indent=2)

    print("=" * 86)
    print("TABLE 1: LUMINANCE STABILITY (KEY OPERATIONAL LAYERS)")
    print("=" * 86)
    print(f"{'Idx':<4} {'Role':<20} {'L':<6} {'C':<6} {'Y_mean':<10} {'sigma_Y':<10} {'Span':<14} {'Gamut'}")
    print("-" * 86)

    table1_indices = ["01", "02", "04", "07", "11", "14"]
    for s in swatch_data:
        if s["index"] in table1_indices:
            idx = s["index"]
            role = s["role"]
            L = s["L"]
            C = s["C"]
            y_mean = s["y_mean"]
            y_std = s["y_std"]
            max_dev = s["max_dev"]
            min_r = min(min(oklch_to_raw_linear_srgb(L, C, step * 0.1)) for step in range(3600))
            gamut_note = f"In-Gamut (>{min_r:.4f})" if min_r >= 0 else "FAIL"
            print(f"{idx:<4} {role:<20} {L:<6.3f} {C:<6.3f} {y_mean:<10.4f} {y_std:<10.4f} +/- {max_dev:<9.4f} {gamut_note}")

    print("-" * 86 + "\n")

    print("=" * 96)
    print("TABLE 2: CVD PROJECTIONS (SWATCH 11: L=0.320, C=0.050)")
    print("=" * 96)
    print(f"{'Hue':<16} {'Hex':<11} {'Std Y':<9} {'Protan Y':<10} {'Deutan Y':<10} {'Tritan Y':<10} {'WCAG Std':<12} {'WCAG Deutan'}")
    print("-" * 96)

    swatch11 = next(s for s in swatch_data if s["index"] == "11")
    for m in swatch11["hues"]:
        hue_name = f"{m['hue']} ({next(h['hue'] for h in HUES if h['name'] == m['hue']):.0f} deg)"
        print(f"{hue_name:<16} {m['hex']:<11} {m['Y_norm']:<9.4f} {m['Y_protan']:<10.4f} {m['Y_deutan']:<10.4f} {m['Y_tritan']:<10.4f} {m['cr_light']:>5.2f} : 1     {m['cr_deutan']:>5.2f} : 1")

    print("-" * 96 + "\n")

    print("=" * 82)
    print("TABLE 3: COMPONENT CONTRAST (SWATCH 04 ON SWATCH 11)")
    print("=" * 82)
    print(f"{'Hue':<16} {'Surface Y':<12} {'Ink Y':<10} {'WCAG':<12} {'Deutan':<12} {'APCA Lc'}")
    print("-" * 82)

    swatch04 = next(s for s in swatch_data if s["index"] == "04")
    for i, h_info in enumerate(HUES):
        h_name = f"{h_info['name']} ({h_info['hue']:.0f} deg)"
        y_04 = swatch04["hues"][i]["Y_norm"]
        y_11 = swatch11["hues"][i]["Y_norm"]
        wcag = wcag_contrast(y_04, y_11)

        yd_04 = swatch04["hues"][i]["Y_deutan"]
        yd_11 = swatch11["hues"][i]["Y_deutan"]
        wcag_d = wcag_contrast(yd_04, yd_11)

        apca = apca_contrast(y_11, y_04)
        print(f"{h_name:<16} {y_04:<12.4f} {y_11:<10.4f} {wcag:>5.2f} : 1    {wcag_d:>5.2f} : 1    {apca:>5.1f}")

    print("-" * 82)
    if write_json:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        out_path = os.path.join(script_dir, "benchmarkResults.json")
        print(f"Output: {out_path}\n")

def inspect_single_color(L, C, h_deg):
    r_lin, g_lin, b_lin = oklch_to_raw_linear_srgb(L, C, h_deg)
    in_gamut = (0.0 <= r_lin <= 1.0 and 0.0 <= g_lin <= 1.0 and 0.0 <= b_lin <= 1.0)
    min_comp = min(r_lin, g_lin, b_lin)

    r_c, g_c, b_c = clamp(r_lin), clamp(g_lin), clamp(b_lin)
    R = linear_to_display_srgb(r_c)
    G = linear_to_display_srgb(g_c)
    B = linear_to_display_srgb(b_c)
    hex_code = f"#{R:02X}{G:02X}{B:02X}"
    y_norm = relative_luminance(r_c, g_c, b_c)

    rp, gp, bp = apply_matrix(P_PROTAN, r_c, g_c, b_c)
    hex_p = f"#{linear_to_display_srgb(rp):02X}{linear_to_display_srgb(gp):02X}{linear_to_display_srgb(bp):02X}"
    y_protan = relative_luminance(rp, gp, bp)

    rd, gd, bd = apply_matrix(P_DEUTAN, r_c, g_c, b_c)
    hex_d = f"#{linear_to_display_srgb(rd):02X}{linear_to_display_srgb(gd):02X}{linear_to_display_srgb(bd):02X}"
    y_deutan = relative_luminance(rd, gd, bd)

    rt, gt, bt = apply_matrix(P_TRITAN, r_c, g_c, b_c)
    hex_t = f"#{linear_to_display_srgb(rt):02X}{linear_to_display_srgb(gt):02X}{linear_to_display_srgb(bt):02X}"
    y_tritan = relative_luminance(rt, gt, bt)

    canvas_light = oklch_to_linear_srgb(0.985, 0.004, 85.0)
    y_ground = relative_luminance(*canvas_light)

    ink_deep = oklch_to_linear_srgb(0.320, 0.050, h_deg)
    y_ink = relative_luminance(*ink_deep)

    cr_ground = wcag_contrast(y_norm, y_ground)
    cr_ink = wcag_contrast(y_norm, y_ink)
    apca_ink = apca_contrast(y_ink, y_norm)

    print("=" * 64)
    print(f"OKLCH:       L={L:.3f}, C={C:.3f}, h={h_deg:.1f} deg")
    print(f"sRGB:        {hex_code} (R={R}, G={G}, B={B})")
    print(f"Luminance Y: {y_norm:.4f}")
    gamut_str = f"PASS (min={min_comp:+.5f})" if in_gamut else f"FAIL (min={min_comp:+.5f})"
    print(f"Gamut:       {gamut_str}")
    print("-" * 64)
    print(f"Protanopia:  {hex_p} | Y={y_protan:.4f}")
    print(f"Deuteranopia:{hex_d} | Y={y_deutan:.4f}")
    print(f"Tritanopia:  {hex_t} | Y={y_tritan:.4f}")
    print("-" * 64)
    chroma_status = "PASS (C <= 0.065)" if C <= 0.065 else "WARN (C > 0.065)"
    print(f"Chroma bound: {chroma_status}")
    print(f"WCAG vs Ground (01): {cr_ground:.2f} : 1")
    print(f"WCAG vs Ink (11):    {cr_ink:.2f} : 1")
    print(f"APCA vs Ink:         Lc = {apca_ink:.1f}")
    print("=" * 64)

def export_css():
    print(":root {")
    print("  --surface-ground: oklch(0.985 0.004 85);")
    print("  --ink-primary:    oklch(0.320 0.050 85);")
    print("  --badge-green-bg:  oklch(0.890 0.035 145);")
    print("  --badge-green-ink: oklch(0.320 0.050 145);")
    print("  --badge-amber-bg:  oklch(0.890 0.035 85);")
    print("  --badge-amber-ink: oklch(0.320 0.050 85);")
    print("  --badge-red-bg:    oklch(0.890 0.035 25);")
    print("  --badge-red-ink:   oklch(0.320 0.050 25);")
    print("}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--benchmarks", action="store_true")
    parser.add_argument("--theorem1", action="store_true")
    parser.add_argument("--gamut", action="store_true")
    parser.add_argument("--calc", nargs=3, type=float, metavar=("L", "C", "H"))
    parser.add_argument("--css", action="store_true")

    args = parser.parse_args()

    if args.theorem1:
        verify_theorem1()
    elif args.gamut:
        verify_gamut_closure()
    elif args.calc:
        inspect_single_color(args.calc[0], args.calc[1], args.calc[2])
    elif args.css:
        export_css()
    else:
        run_benchmarks(write_json=True)
