#!/usr/bin/env python3
"""Generate the updated RR NOVA restaurant-owner sales PDF (10 pages, 16:9)."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import HexColor, Color, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "presentations" / "assets"
OUT_DOCS = ROOT / "docs" / "presentations" / "RR-NOVA-Restaurant-Owner-Sales-Deck.pdf"
OUT_DESKTOP = Path.home() / "Desktop" / "RR-NOVA-Restaurant.pdf"

PAGE_W, PAGE_H = 13.333 * inch, 7.5 * inch
MARGIN = 0.65 * inch

C = {
    "cream": HexColor("#F7F3EC"),
    "cream2": HexColor("#FBF8F3"),
    "white": HexColor("#FFFFFF"),
    "charcoal": HexColor("#1C1A17"),
    "ink": HexColor("#2A2723"),
    "muted": HexColor("#7A7368"),
    "muted_soft": HexColor("#A8A094"),
    "line": HexColor("#E6DFD4"),
    "gold": HexColor("#B89B6A"),
    "gold_soft": HexColor("#D4C4A0"),
    "dark": HexColor("#141311"),
    "dark2": HexColor("#22201C"),
    "panel": HexColor("#2C2924"),
    "before_bg": HexColor("#F0EAE2"),
    "danger": HexColor("#A85A4A"),
}

FONT_SANS = "Helvetica"
FONT_SANS_BOLD = "Helvetica-Bold"
FONT_DISPLAY = "Times-Bold"
FONT_DISPLAY_ITALIC = "Times-Italic"

# Prefer system fonts when available
for name, path in [
    ("Georgia", "/System/Library/Fonts/Supplemental/Georgia.ttf"),
    ("Georgia-Bold", "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"),
    ("Georgia-Italic", "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"),
]:
    try:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
            if name == "Georgia-Bold":
                FONT_DISPLAY = "Georgia-Bold"
            if name == "Georgia-Italic":
                FONT_DISPLAY_ITALIC = "Georgia-Italic"
    except Exception:
        pass


def rect(c, x, y, w, h, fill=None, stroke=None, sw=0.75):
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    c.rect(x, y, w, h, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)


def round_rect(c, x, y, w, h, r, fill=None, stroke=None, sw=0.75):
    c.saveState()
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(sw)
    c.roundRect(x, y, w, h, r, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)
    c.restoreState()


def text(c, s, x, y, *, size=12, color=C["ink"], font=FONT_SANS, align="left", bold=False):
    use = FONT_SANS_BOLD if bold and font in (FONT_SANS, FONT_SANS_BOLD) else font
    c.setFont(use, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, s)
    elif align == "right":
        c.drawRightString(x, y, s)
    else:
        c.drawString(x, y, s)


def para(c, html, x, y, w, *, size=12, color=C["ink"], leading=None, font=FONT_SANS, align=TA_LEFT):
    style = ParagraphStyle(
        "p",
        fontName=font,
        fontSize=size,
        textColor=color,
        leading=leading or size + 4,
        alignment=align,
    )
    p = Paragraph(html, style)
    pw, ph = p.wrap(w, PAGE_H)
    p.drawOn(c, x, y - ph)
    return ph


def gold_rule(c, x, y, w=0.7 * inch):
    rect(c, x, y, w, 0.03 * inch, fill=C["gold"])


def brand_mark(c, x, y, dark=False):
    round_rect(c, x, y, 0.28 * inch, 0.28 * inch, 3, fill=C["gold"])
    text(c, "RR", x + 0.14 * inch, y + 0.07 * inch, size=7, color=C["dark"], bold=True, align="center")
    text(c, "RR NOVA", x + 0.38 * inch, y + 0.07 * inch, size=11, color=C["cream"] if dark else C["charcoal"], bold=True)


def slide_num(c, n, total=10, dark=False):
    text(
        c,
        f"{n:02d} / {total:02d}",
        PAGE_W - 0.7 * inch,
        0.35 * inch,
        size=10,
        color=HexColor("#6A645A") if dark else C["muted_soft"],
        align="right",
    )


def fit_image(c, path: Path, x, y, max_w, max_h, radius=6):
    if not path.exists():
        return
    from reportlab.lib.utils import ImageReader

    img = ImageReader(str(path))
    iw, ih = img.getSize()
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    ox = x + (max_w - dw) / 2
    oy = y + (max_h - dh) / 2
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, max_w, max_h, radius)
    c.clipPath(p, stroke=0)
    c.drawImage(img, ox, oy, width=dw, height=dh, mask="auto")
    c.restoreState()


# ── Pages ───────────────────────────────────────────────────────────────────

def page_01(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["dark"])
    round_rect(c, 8.8 * inch, PAGE_H - 3.4 * inch, 5.5 * inch, 4.2 * inch, 28, fill=C["dark2"])
    round_rect(c, -1.2 * inch, -0.8 * inch, 5 * inch, 3.2 * inch, 28, fill=C["panel"])

    text(c, "RR NOVA", MARGIN, PAGE_H - 0.75 * inch, size=12, color=C["gold"], bold=True)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch, 0.9 * inch)

    text(c, "Your restaurant.", MARGIN, PAGE_H - 2.0 * inch, size=40, color=C["cream"], font=FONT_DISPLAY)
    text(c, "Your customers.", MARGIN, PAGE_H - 2.7 * inch, size=40, color=C["cream"], font=FONT_DISPLAY)
    text(c, "Your data.", MARGIN, PAGE_H - 3.4 * inch, size=40, color=C["gold_soft"], font=FONT_DISPLAY)

    para(
        c,
        "One platform to attract customers, take direct orders,<br/>manage reservations, and understand what drives your business.",
        MARGIN,
        PAGE_H - 4.0 * inch,
        7.2 * inch,
        size=15,
        color=C["muted_soft"],
        leading=22,
    )

    steps = ["DISCOVER", "MENU", "ORDER / RESERVE", "CUSTOMER", "REPEAT"]
    x = MARGIN
    for i, step in enumerate(steps):
        text(c, step, x, 1.2 * inch, size=10, color=C["gold"], bold=True)
        if i < len(steps) - 1:
            text(c, "→", x + 1.85 * inch, 1.2 * inch, size=12, color=C["muted_soft"])
            x += 2.2 * inch

    # Subtle product preview
    img = ASSETS / "01-landing.png"
    if img.exists():
        round_rect(c, 8.2 * inch, 1.4 * inch, 4.5 * inch, 3.0 * inch, 8, fill=C["dark2"])
        fit_image(c, img, 8.3 * inch, 1.5 * inch, 4.3 * inch, 2.8 * inch, radius=6)

    slide_num(c, 1, dark=True)


def page_02(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "Your restaurant shouldn't need", MARGIN, PAGE_H - 1.55 * inch, size=28, color=C["charcoal"], font=FONT_DISPLAY)
    text(c, "10 different systems.", MARGIN, PAGE_H - 2.05 * inch, size=28, color=C["charcoal"], font=FONT_DISPLAY)
    para(
        c,
        "Website, menu, bookings, ordering, spreadsheets and customer information often live in separate places.",
        MARGIN,
        PAGE_H - 2.35 * inch,
        11 * inch,
        size=13,
        color=C["muted"],
        leading=18,
    )

    problems = [
        ("Too many tools", "Staff jump between systems and information doesn't talk to each other."),
        ("Menu chaos", "Printed and third-party menus can become stale when dishes change."),
        ("Missed revenue", "Customers can be pushed to aggregators where commissions reduce margin."),
        ("Manual work", "Teams spend time re-entering bookings, chasing confirmations and answering calls."),
        ("Limited visibility", "Owners struggle to see covers, tickets, guest history and performance together."),
        ("Unclear ROI", "It can be difficult to see what drives spend, repeat visits and quiet sessions."),
    ]
    for i, (title, body) in enumerate(problems):
        row, col = divmod(i, 3)
        x = MARGIN + col * 4.05 * inch
        y = PAGE_H - 5.0 * inch - row * 2.0 * inch
        round_rect(c, x, y, 3.85 * inch, 1.8 * inch, 4, fill=C["white"], stroke=C["line"])
        rect(c, x, y, 0.07 * inch, 1.8 * inch, fill=C["gold"])
        text(c, title, x + 0.28 * inch, y + 1.3 * inch, size=14, color=C["charcoal"], font=FONT_DISPLAY)
        para(c, body, x + 0.28 * inch, y + 1.15 * inch, 3.3 * inch, size=11, color=C["muted"], leading=15)

    brand_mark(c, MARGIN, 0.3 * inch)
    slide_num(c, 2)


def page_03(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream2"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "One operating system for your venue.", MARGIN, PAGE_H - 1.55 * inch, size=28, color=C["charcoal"], font=FONT_DISPLAY)
    text(
        c,
        "RR NOVA connects the guest experience and the owner's operations in one place.",
        MARGIN,
        PAGE_H - 2.0 * inch,
        size=13,
        color=C["muted"],
    )

    # Center hub
    round_rect(c, 5.55 * inch, 3.55 * inch, 2.2 * inch, 1.0 * inch, 6, fill=C["dark"])
    text(c, "RR NOVA", 6.65 * inch, 3.9 * inch, size=16, color=C["gold"], bold=True, align="center")

    caps = [
        (0.7, 4.9, "Website", "Premium branded guest experience."),
        (3.5, 4.9, "Live menu", "Website + QR + ordering stay in sync."),
        (8.2, 4.9, "Direct ordering", "Pickup, delivery and dine-in on your brand."),
        (10.7, 4.9, "Reservations", "Capacity rules, confirmations, calendar."),
        (2.0, 1.35, "Owner dashboard", "Menus, orders, bookings, guests and team."),
        (9.2, 1.35, "Analytics", "Revenue, AOV, bestsellers and conversion funnel."),
    ]
    for x_in, y_in, title, body in caps:
        x, y = x_in * inch, y_in * inch
        round_rect(c, x, y, 2.35 * inch, 1.25 * inch, 4, fill=C["white"], stroke=C["line"])
        text(c, title, x + 0.18 * inch, y + 0.8 * inch, size=12, color=C["charcoal"], font=FONT_DISPLAY)
        para(c, body, x + 0.18 * inch, y + 0.7 * inch, 2.0 * inch, size=10, color=C["muted"], leading=13)

    brand_mark(c, MARGIN, 0.3 * inch)
    slide_num(c, 3)


def page_04(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "Keep the customer in your brand.", MARGIN, PAGE_H - 1.55 * inch, size=28, color=C["charcoal"], font=FONT_DISPLAY)
    text(
        c,
        "From discovery to booking or ordering, RR NOVA creates a direct path.",
        MARGIN,
        PAGE_H - 2.0 * inch,
        size=13,
        color=C["muted"],
    )

    stages = [
        ("01", "DISCOVER", "Branded restaurant website."),
        ("02", "BROWSE", "Live menu with dietary and allergen information."),
        ("03", "ACT", "Order directly or reserve a table."),
        ("04", "RETURN", "Use guest history and follow-ups to encourage repeat visits."),
    ]
    for i, (num, title, body) in enumerate(stages):
        x = MARGIN + i * 3.1 * inch
        y = 1.55 * inch
        round_rect(c, x, y, 2.9 * inch, 3.5 * inch, 4, fill=C["white"], stroke=C["line"])
        text(c, num, x + 0.25 * inch, y + 2.95 * inch, size=12, color=C["gold"], bold=True)
        text(c, title, x + 0.25 * inch, y + 2.45 * inch, size=15, color=C["charcoal"], font=FONT_DISPLAY)
        gold_rule(c, x + 0.25 * inch, y + 2.2 * inch, 0.55 * inch)
        para(c, body, x + 0.25 * inch, y + 2.0 * inch, 2.4 * inch, size=12, color=C["muted"], leading=16)
        if i < 3:
            text(c, "→", x + 2.8 * inch, y + 1.6 * inch, size=16, color=C["gold"])

    brand_mark(c, MARGIN, 0.3 * inch)
    slide_num(c, 4)


def page_05(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream2"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "Why send a customer somewhere else to order?", MARGIN, PAGE_H - 1.55 * inch, size=24, color=C["charcoal"], font=FONT_DISPLAY)
    text(
        c,
        "RR NOVA puts direct ordering and reservations on the restaurant's own branded experience.",
        MARGIN,
        PAGE_H - 2.0 * inch,
        size=13,
        color=C["muted"],
    )

    # Ordering
    round_rect(c, MARGIN, 1.7 * inch, 5.85 * inch, 3.4 * inch, 4, fill=C["white"], stroke=C["line"])
    text(c, "Direct ordering", MARGIN + 0.4 * inch, 4.6 * inch, size=17, color=C["charcoal"], font=FONT_DISPLAY)
    text(c, "Keep the ordering experience on your brand.", MARGIN + 0.4 * inch, 4.2 * inch, size=12, color=C["gold"], font=FONT_DISPLAY_ITALIC)
    for i, item in enumerate(["Pickup", "Delivery", "Dine-in"]):
        y = 3.55 * inch - i * 0.45 * inch
        round_rect(c, MARGIN + 0.4 * inch, y, 0.16 * inch, 0.16 * inch, 8, fill=C["gold"])
        text(c, item, MARGIN + 0.75 * inch, y + 0.02 * inch, size=13, color=C["ink"])
    para(
        c,
        "Reduce dependence on third-party marketplaces and retain more of each order.",
        MARGIN + 0.4 * inch,
        2.35 * inch,
        5.0 * inch,
        size=11,
        color=C["muted"],
        leading=15,
    )

    # Reservations
    round_rect(c, 6.9 * inch, 1.7 * inch, 5.85 * inch, 3.4 * inch, 4, fill=C["dark"])
    text(c, "Direct reservations", 7.3 * inch, 4.6 * inch, size=17, color=C["cream"], font=FONT_DISPLAY)
    text(c, "Guests choose", 7.3 * inch, 4.15 * inch, size=11, color=C["gold"], bold=True)
    for i, item in enumerate(["Party size", "Date", "Time"]):
        text(c, f"·  {item}", 7.3 * inch, 3.75 * inch - i * 0.32 * inch, size=12, color=C["cream"])
    text(c, "You control", 7.3 * inch, 2.7 * inch, size=11, color=C["gold"], bold=True)
    for i, item in enumerate(["Capacity rules", "Confirmations", "Calendar flow"]):
        text(c, f"·  {item}", 7.3 * inch, 2.35 * inch - i * 0.3 * inch, size=12, color=C["cream"])

    text(
        c,
        "SELL DIRECTLY   ·   KEEP CONTROL   ·   OWN THE EXPERIENCE",
        PAGE_W / 2,
        1.15 * inch,
        size=11,
        color=C["charcoal"],
        bold=True,
        align="center",
    )
    brand_mark(c, MARGIN, 0.3 * inch)
    slide_num(c, 5)


def page_06(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "Give your team one place to run service.", MARGIN, PAGE_H - 1.55 * inch, size=26, color=C["charcoal"], font=FONT_DISPLAY)
    text(
        c,
        "Less hopping between apps. More visibility during a busy shift.",
        MARGIN,
        PAGE_H - 2.0 * inch,
        size=13,
        color=C["muted"],
    )

    fx, fy = 0.65 * inch, 0.95 * inch
    fw, fh = 12.0 * inch, 4.2 * inch
    round_rect(c, fx, fy, fw, fh, 6, fill=C["dark"])
    rect(c, fx, fy, 2.6 * inch, fh, fill=C["dark2"])

    text(c, "WORKSPACE", fx + 0.25 * inch, fy + fh - 0.4 * inch, size=9, color=C["gold"], bold=True)
    nav = ["Menus", "Orders", "Reservations", "Customers", "Website", "QR", "Analytics", "Team"]
    for i, item in enumerate(nav):
        y = fy + fh - 0.85 * inch - i * 0.38 * inch
        if i == 0:
            round_rect(c, fx + 0.15 * inch, y - 0.08 * inch, 2.3 * inch, 0.34 * inch, 3, fill=C["panel"])
        text(c, item, fx + 0.3 * inch, y, size=11, color=C["cream"] if i == 0 else C["muted_soft"])

    text(c, "OWNER WORKSPACE", fx + 2.95 * inch, fy + fh - 0.45 * inch, size=10, color=C["gold"], bold=True)
    text(c, "One dashboard for the whole venue.", fx + 2.95 * inch, fy + fh - 0.95 * inch, size=20, color=C["cream"], font=FONT_DISPLAY)
    para(
        c,
        "Menus, orders, reservations, customers, website, QR, analytics and team —<br/>in one calm workspace built for service.",
        fx + 2.95 * inch,
        fy + fh - 1.2 * inch,
        8.5 * inch,
        size=12,
        color=C["muted_soft"],
        leading=17,
    )

    tiles = [
        ("Menus", "Keep dishes live everywhere"),
        ("Orders", "Track the live queue"),
        ("Reservations", "Confirm and seat with control"),
        ("Customers", "See profiles & history"),
    ]
    for i, (t, b) in enumerate(tiles):
        x = fx + 2.95 * inch + i * 2.2 * inch
        round_rect(c, x, fy + 0.35 * inch, 2.05 * inch, 1.4 * inch, 4, fill=C["panel"])
        text(c, t, x + 0.15 * inch, fy + 1.3 * inch, size=12, color=C["gold"], font=FONT_DISPLAY)
        para(c, b, x + 0.15 * inch, fy + 1.15 * inch, 1.75 * inch, size=10, color=C["muted_soft"], leading=13)

    # Optional real dashboard screenshot strip
    dash = ASSETS / "03-dashboard.png"
    if dash.exists():
        fit_image(c, dash, fx + 2.9 * inch, fy + 1.9 * inch, 8.7 * inch, 1.55 * inch, radius=4)

    brand_mark(c, MARGIN, 0.28 * inch)
    slide_num(c, 6)


def page_07(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream2"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "The first order shouldn't be", MARGIN, PAGE_H - 1.55 * inch, size=26, color=C["charcoal"], font=FONT_DISPLAY)
    text(c, "the end of the relationship.", MARGIN, PAGE_H - 2.05 * inch, size=26, color=C["charcoal"], font=FONT_DISPLAY)
    text(
        c,
        "Guest profiles and history can help restaurants understand customers and create timely follow-ups.",
        MARGIN,
        PAGE_H - 2.5 * inch,
        size=13,
        color=C["muted"],
    )

    sections = [
        ("KNOW THE GUEST", "Unified profiles and visit/order history give the restaurant a clearer picture of its customers."),
        ("SPOT PATTERNS", "Understand what customers buy, how often they return, and where demand is coming from."),
        ("BRING THEM BACK", "Use timely follow-ups and customer knowledge to turn one-offs into regulars."),
    ]
    for i, (title, body) in enumerate(sections):
        x = MARGIN + i * 4.1 * inch
        y = 1.2 * inch
        round_rect(c, x, y, 3.9 * inch, 3.1 * inch, 4, fill=C["white"], stroke=C["line"])
        text(c, f"0{i+1}", x + 0.35 * inch, y + 2.5 * inch, size=11, color=C["gold"], bold=True)
        text(c, title, x + 0.35 * inch, y + 1.95 * inch, size=15, color=C["charcoal"], font=FONT_DISPLAY)
        gold_rule(c, x + 0.35 * inch, y + 1.7 * inch, 0.6 * inch)
        para(c, body, x + 0.35 * inch, y + 1.5 * inch, 3.2 * inch, size=12, color=C["muted"], leading=16)

    brand_mark(c, MARGIN, 0.3 * inch)
    slide_num(c, 7)


def page_08(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "Stop guessing. Start seeing.", MARGIN, PAGE_H - 1.55 * inch, size=28, color=C["charcoal"], font=FONT_DISPLAY)
    text(c, "RR NOVA brings key venue metrics into one view.", MARGIN, PAGE_H - 2.0 * inch, size=13, color=C["muted"])

    metrics = [
        ("Revenue", "How much the venue is generating."),
        ("AOV", "Average order value."),
        ("Bestsellers", "What customers actually buy."),
        ("Reservations", "Booking activity and demand."),
        ("Conversion", "How visitors turn into actions."),
    ]
    bars = [
        [0.45, 0.7, 0.4, 0.6, 0.85],
        [0.55, 0.4, 0.75, 0.5, 0.65],
        [0.35, 0.8, 0.55, 0.7, 0.9],
        [0.5, 0.6, 0.45, 0.85, 0.55],
        [0.4, 0.55, 0.7, 0.5, 0.95],
    ]
    for i, (title, body) in enumerate(metrics):
        x = MARGIN + i * 2.45 * inch
        y = 2.55 * inch
        round_rect(c, x, y, 2.3 * inch, 2.45 * inch, 4, fill=C["white"], stroke=C["line"])
        for j, h in enumerate(bars[i]):
            bh = h * 0.55 * inch
            bx = x + 0.25 * inch + j * 0.35 * inch
            by = y + 1.15 * inch
            round_rect(c, bx, by, 0.22 * inch, bh, 2, fill=C["gold"] if j == 4 else C["gold_soft"])
        text(c, title, x + 0.2 * inch, y + 0.75 * inch, size=12, color=C["charcoal"], font=FONT_DISPLAY)
        para(c, body, x + 0.2 * inch, y + 0.6 * inch, 1.9 * inch, size=10, color=C["muted"], leading=13)

    round_rect(c, MARGIN, 1.05 * inch, 12.0 * inch, 1.1 * inch, 4, fill=C["dark"])
    text(
        c,
        "Use venue data to shape demand, understand quiet sessions and make real decisions.",
        PAGE_W / 2,
        1.5 * inch,
        size=14,
        color=C["cream"],
        font=FONT_DISPLAY,
        align="center",
    )

    brand_mark(c, MARGIN, 0.28 * inch)
    slide_num(c, 8)


def page_09(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream2"])
    brand_mark(c, MARGIN, PAGE_H - 0.7 * inch)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch)
    text(c, "From fragmented tools to one connected venue.", MARGIN, PAGE_H - 1.55 * inch, size=24, color=C["charcoal"], font=FONT_DISPLAY)

    # Before
    round_rect(c, MARGIN, 0.85 * inch, 5.85 * inch, 4.7 * inch, 4, fill=C["before_bg"])
    text(c, "BEFORE", MARGIN + 0.4 * inch, 5.1 * inch, size=13, color=C["danger"], bold=True)
    before = [
        "5–10 logins every service",
        "Stale menus & broken booking links",
        "Aggregator fees eating margin",
        "Guest data trapped in inboxes",
        "Managers flying blind on covers",
        "Marketing is an afterthought",
    ]
    for i, line in enumerate(before):
        y = 4.45 * inch - i * 0.55 * inch
        round_rect(c, MARGIN + 0.4 * inch, y, 5.05 * inch, 0.42 * inch, 3, fill=C["white"], stroke=C["line"])
        text(c, f"✕   {line}", MARGIN + 0.55 * inch, y + 0.12 * inch, size=12, color=C["ink"])

    # After
    round_rect(c, 6.9 * inch, 0.85 * inch, 5.85 * inch, 4.7 * inch, 4, fill=C["dark"])
    text(c, "AFTER RR NOVA", 7.3 * inch, 5.1 * inch, size=13, color=C["gold"], bold=True)
    after = [
        "One dashboard for the whole venue",
        "Live menu, QR and site in sync",
        "Direct orders with secure checkout",
        "Unified guest profiles & history",
        "Live boards for kitchen & floor",
        "Analytics guiding real decisions",
    ]
    for i, line in enumerate(after):
        text(c, f"✓   {line}", 7.3 * inch, 4.5 * inch - i * 0.5 * inch, size=13, color=C["cream"])

    brand_mark(c, MARGIN, 0.28 * inch)
    slide_num(c, 9)


def page_10(c):
    rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["dark"])
    round_rect(c, 8.5 * inch, PAGE_H - 3 * inch, 6 * inch, 4 * inch, 30, fill=C["dark2"])
    round_rect(c, -1 * inch, -0.8 * inch, 4.5 * inch, 3 * inch, 30, fill=C["panel"])

    text(c, "RR NOVA", MARGIN, PAGE_H - 0.75 * inch, size=12, color=C["gold"], bold=True)
    gold_rule(c, MARGIN, PAGE_H - 0.95 * inch, 0.9 * inch)

    text(c, "What could this look like", MARGIN, PAGE_H - 2.3 * inch, size=32, color=C["cream"], font=FONT_DISPLAY)
    text(c, "for your restaurant?", MARGIN, PAGE_H - 2.95 * inch, size=32, color=C["cream"], font=FONT_DISPLAY)

    para(
        c,
        "Let's look at your current website, ordering and booking journey—<br/>and show you where RR NOVA can simplify the experience.",
        MARGIN,
        PAGE_H - 3.5 * inch,
        9 * inch,
        size=14,
        color=C["muted_soft"],
        leading=20,
    )

    round_rect(c, MARGIN, PAGE_H - 5.15 * inch, 2.6 * inch, 0.55 * inch, 4, fill=C["gold"])
    text(c, "EXPLORE RR NOVA", MARGIN + 1.3 * inch, PAGE_H - 4.95 * inch, size=12, color=C["dark"], bold=True, align="center")
    text(c, "See the Harbour Kitchen live demo", MARGIN + 2.9 * inch, PAGE_H - 4.95 * inch, size=13, color=C["cream"])
    text(c, "restaurant-digital-platform-beige.vercel.app", MARGIN, PAGE_H - 5.55 * inch, size=12, color=C["gold_soft"])

    text(c, "RR NOVA  ·  Crafted for Aotearoa New Zealand", MARGIN, 0.45 * inch, size=11, color=C["muted_soft"])
    slide_num(c, 10, dark=True)


def build():
    OUT_DOCS.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT_DOCS), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("RR NOVA — Restaurant Owner Sales Deck")
    c.setAuthor("RR NOVA")
    c.setSubject("Sales presentation for restaurant owners")

    pages = [page_01, page_02, page_03, page_04, page_05, page_06, page_07, page_08, page_09, page_10]
    for fn in pages:
        fn(c)
        c.showPage()
    c.save()

    # Also write to Desktop
    data = OUT_DOCS.read_bytes()
    OUT_DESKTOP.write_bytes(data)

    print(f"Wrote {OUT_DOCS}")
    print(f"Wrote {OUT_DESKTOP}")
    print(f"{len(pages)} pages · {OUT_DESKTOP.stat().st_size // 1024} KB")
    return OUT_DESKTOP


if __name__ == "__main__":
    build()
