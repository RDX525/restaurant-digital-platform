#!/usr/bin/env python3
"""Generate a restaurant-owner pitch PDF for RR NOVA with live product screenshots."""

from __future__ import annotations

from pathlib import Path

from reportlab.lib.colors import Color, HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "presentations" / "assets"
OUT = ROOT / "docs" / "presentations" / "RR-NOVA-Restaurant-Owner-Pitch.pdf"

# Landscape presentation page
PAGE_W, PAGE_H = 13.333 * inch, 7.5 * inch
MARGIN = 0.55 * inch

C = {
    "bg_dark": HexColor("#0F1C18"),
    "bg_dark2": HexColor("#1A2F28"),
    "bg_panel": HexColor("#2A3F37"),
    "pine": HexColor("#4D7764"),
    "pine_deep": HexColor("#3C5F50"),
    "gold": HexColor("#C9A962"),
    "gold_soft": HexColor("#E2D4A8"),
    "cream": HexColor("#F8F5F0"),
    "cream2": HexColor("#FDFCFA"),
    "ink": HexColor("#1A2F28"),
    "muted": HexColor("#6A9480"),
    "muted_dark": HexColor("#97B8A9"),
    "line": HexColor("#E4DCD0"),
    "danger": HexColor("#C45C4A"),
    "success": HexColor("#3DA372"),
}

# Prefer macOS fonts that feel premium; fall back to Helvetica
FONT_SANS = "Helvetica"
FONT_SANS_BOLD = "Helvetica-Bold"
FONT_DISPLAY = "Times-Bold"
FONT_DISPLAY_ITALIC = "Times-Italic"

for name, path in [
    ("Avenir", "/System/Library/Fonts/Avenir Next.ttc"),
    ("Georgia", "/System/Library/Fonts/Supplemental/Georgia.ttf"),
    ("Georgia-Bold", "/System/Library/Fonts/Supplemental/Georgia Bold.ttf"),
    ("Georgia-Italic", "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"),
]:
    try:
        if Path(path).exists():
            pdfmetrics.registerFont(TTFont(name, path))
            if name == "Avenir":
                FONT_SANS = "Avenir"
                FONT_SANS_BOLD = "Avenir"
            if name == "Georgia-Bold":
                FONT_DISPLAY = "Georgia-Bold"
            if name == "Georgia-Italic":
                FONT_DISPLAY_ITALIC = "Georgia-Italic"
            if name == "Georgia" and FONT_DISPLAY == "Times-Bold":
                FONT_DISPLAY = "Georgia"
    except Exception:
        pass


def draw_rect(c: canvas.Canvas, x, y, w, h, fill=None, stroke=None, stroke_width=0.75):
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(stroke_width)
    c.rect(x, y, w, h, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)


def draw_round_rect(c: canvas.Canvas, x, y, w, h, r, fill=None, stroke=None, stroke_width=0.75):
    c.saveState()
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(stroke_width)
    c.roundRect(x, y, w, h, r, fill=1 if fill is not None else 0, stroke=1 if stroke is not None else 0)
    c.restoreState()


def text(c: canvas.Canvas, s, x, y, *, size=12, color=C["ink"], font=FONT_SANS, align="left", bold=False):
    use = FONT_SANS_BOLD if bold and FONT_SANS_BOLD else font
    if bold and font == FONT_DISPLAY:
        use = FONT_DISPLAY
    c.setFont(use, size)
    c.setFillColor(color)
    if align == "center":
        c.drawCentredString(x, y, s)
    elif align == "right":
        c.drawRightString(x, y, s)
    else:
        c.drawString(x, y, s)


def accent_bar(c: canvas.Canvas):
    draw_rect(c, 0, 0, 0.08 * inch, PAGE_H, fill=C["gold"])


def brand_chip(c: canvas.Canvas, x, y, dark=True):
    draw_round_rect(c, x, y, 0.34 * inch, 0.34 * inch, 6, fill=C["gold"])
    text(c, "RR", x + 0.17 * inch, y + 0.09 * inch, size=8, color=C["bg_dark"], bold=True, align="center")
    text(
        c,
        "RR NOVA",
        x + 0.48 * inch,
        y + 0.1 * inch,
        size=13,
        color=white if dark else C["ink"],
        font=FONT_DISPLAY,
        bold=True,
    )


def eyebrow(c: canvas.Canvas, label, x, y, dark=True):
    text(c, label.upper(), x, y, size=9, color=C["gold"] if dark else C["pine"], bold=True)


def wrapped_paragraph(text_html: str, style: ParagraphStyle, max_width: float) -> Paragraph:
    return Paragraph(text_html, style)


def draw_paragraph(c: canvas.Canvas, html: str, x, y, w, *, size=12, color=C["ink"], leading=None, font=FONT_SANS):
    style = ParagraphStyle(
        "body",
        fontName=font,
        fontSize=size,
        textColor=color,
        leading=leading or size + 4,
        alignment=TA_LEFT,
    )
    p = Paragraph(html, style)
    pw, ph = p.wrap(w, PAGE_H)
    p.drawOn(c, x, y - ph)
    return ph


def fit_image(c: canvas.Canvas, path: Path, x, y, max_w, max_h, radius=8):
    """Draw image scaled to fit inside box, top-aligned, with optional clip."""
    if not path.exists():
        draw_round_rect(c, x, y, max_w, max_h, radius, fill=C["bg_panel"])
        text(c, "Screenshot unavailable", x + max_w / 2, y + max_h / 2, size=11, color=C["muted_dark"], align="center")
        return
    from reportlab.lib.utils import ImageReader

    img = ImageReader(str(path))
    iw, ih = img.getSize()
    scale = min(max_w / iw, max_h / ih)
    dw, dh = iw * scale, ih * scale
    # Center in box
    ox = x + (max_w - dw) / 2
    oy = y + (max_h - dh) / 2
    c.saveState()
    p = c.beginPath()
    p.roundRect(x, y, max_w, max_h, radius)
    c.clipPath(p, stroke=0)
    c.drawImage(img, ox, oy, width=dw, height=dh, mask="auto")
    c.restoreState()
    # subtle frame
    draw_round_rect(c, x, y, max_w, max_h, radius, stroke=C["line"], stroke_width=0.8)


def browser_frame(c: canvas.Canvas, x, y, w, h, url: str, image: Path):
    draw_round_rect(c, x, y, w, h, 10, fill=C["bg_dark2"])
    # title bar
    draw_rect(c, x, y + h - 0.36 * inch, w, 0.36 * inch, fill=C["bg_dark"])
    for i, col in enumerate([C["danger"], C["gold"], C["success"]]):
        draw_round_rect(c, x + 0.14 * inch + i * 0.18 * inch, y + h - 0.24 * inch, 0.1 * inch, 0.1 * inch, 5, fill=col)
    draw_round_rect(
        c,
        x + 0.85 * inch,
        y + h - 0.28 * inch,
        w - 1.1 * inch,
        0.2 * inch,
        4,
        fill=C["bg_panel"],
    )
    text(c, url, x + 0.95 * inch, y + h - 0.24 * inch, size=7, color=C["muted_dark"])
    content_y = y + 0.08 * inch
    content_h = h - 0.44 * inch
    fit_image(c, image, x + 0.08 * inch, content_y, w - 0.16 * inch, content_h, radius=6)


# ── Pages ───────────────────────────────────────────────────────────────────

def page_cover(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["bg_dark"])
    draw_round_rect(c, 8.5 * inch, PAGE_H - 3 * inch, 6 * inch, 4 * inch, 40, fill=C["bg_dark2"])
    draw_round_rect(c, -1 * inch, -1 * inch, 5 * inch, 4 * inch, 40, fill=C["bg_panel"])
    accent_bar(c)

    text(c, "BUILT FOR NEW ZEALAND HOSPITALITY", MARGIN, PAGE_H - 1.8 * inch, size=11, color=C["gold"], bold=True)
    text(c, "RR NOVA", MARGIN, PAGE_H - 2.7 * inch, size=54, color=white, font=FONT_DISPLAY, bold=True)
    draw_paragraph(
        c,
        "The all-in-one platform that turns your restaurant’s website,<br/>menu, orders, and bookings into one growth engine.",
        MARGIN,
        PAGE_H - 3.0 * inch,
        7.5 * inch,
        size=16,
        color=C["muted_dark"],
        leading=22,
    )
    draw_round_rect(c, MARGIN, PAGE_H - 5.35 * inch, 2.6 * inch, 0.48 * inch, 8, fill=C["gold"])
    text(c, "For restaurant owners", MARGIN + 1.3 * inch, PAGE_H - 5.2 * inch, size=11, color=C["bg_dark"], bold=True, align="center")
    text(
        c,
        "Live demo · Harbour Kitchen · Wynyard Quarter, Auckland",
        MARGIN,
        0.55 * inch,
        size=10,
        color=C["muted"],
    )

    browser_frame(
        c,
        7.0 * inch,
        1.2 * inch,
        5.7 * inch,
        4.9 * inch,
        "restaurant-digital-platform-beige.vercel.app",
        ASSETS / "01-landing.png",
    )


def page_pain(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    accent_bar(c)
    brand_chip(c, MARGIN, PAGE_H - 0.7 * inch, dark=False)
    eyebrow(c, "The problem", MARGIN, PAGE_H - 1.15 * inch, dark=False)
    text(c, "What restaurant owners struggle with", MARGIN, PAGE_H - 1.65 * inch, size=28, color=C["ink"], font=FONT_DISPLAY, bold=True)

    pains = [
        ("Too many tools", "Website builder, PDF menus, booking widgets, delivery apps, and spreadsheets — nothing talks to each other."),
        ("Menu chaos", "Printed menus and third-party apps go stale the moment a dish is 86’d."),
        ("Missed revenue", "Guests bounce to aggregators. You pay commission for customers you already earned."),
        ("Blind service", "No single view of covers, tickets, waitlist, or guest history during a busy service."),
        ("Manual grind", "Staff re-type bookings, chase confirmations, and answer the same phone calls every night."),
        ("No clear ROI", "Hard to see what drives spend, repeat visits, or empty midweek tables."),
    ]
    for i, (title, body) in enumerate(pains):
        row, col = divmod(i, 3)
        x = MARGIN + col * 4.1 * inch
        y = PAGE_H - 4.15 * inch - row * 2.2 * inch
        draw_round_rect(c, x, y, 3.9 * inch, 2.0 * inch, 10, fill=white, stroke=C["line"])
        draw_rect(c, x, y, 0.1 * inch, 2.0 * inch, fill=C["gold"])
        text(c, title, x + 0.3 * inch, y + 1.45 * inch, size=15, color=C["ink"], font=FONT_DISPLAY, bold=True)
        draw_paragraph(c, body, x + 0.3 * inch, y + 1.25 * inch, 3.35 * inch, size=11, color=C["pine_deep"], leading=15)


def page_benefits(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["bg_dark"])
    accent_bar(c)
    brand_chip(c, MARGIN, PAGE_H - 0.7 * inch, dark=True)
    eyebrow(c, "Platform benefits", MARGIN, PAGE_H - 1.15 * inch, dark=True)
    text(c, "One operating system for your venue", MARGIN, PAGE_H - 1.65 * inch, size=28, color=white, font=FONT_DISPLAY, bold=True)

    items = [
        ("Premium guest website", "A branded site that matches your room — not a generic template."),
        ("Live digital & QR menu", "Publish once. Website, QR, and ordering stay in sync."),
        ("Direct online ordering", "Pickup, delivery, and dine-in on your brand — keep the margin."),
        ("Reservations that fit", "Online bookings with capacity rules, confirmations, and calendar control."),
        ("Owner dashboard", "Menus, orders, bookings, guests, analytics, and AI insights in one place."),
        ("NZ-first by design", "Timezone, GST-aware pricing mindset, and Aotearoa hospitality pace."),
    ]
    for i, (title, body) in enumerate(items):
        row, col = divmod(i, 3)
        x = MARGIN + col * 4.1 * inch
        y = PAGE_H - 4.15 * inch - row * 2.2 * inch
        draw_round_rect(c, x, y, 3.9 * inch, 2.0 * inch, 10, fill=C["bg_panel"])
        text(c, title, x + 0.3 * inch, y + 1.4 * inch, size=15, color=C["gold"], font=FONT_DISPLAY, bold=True)
        draw_paragraph(c, body, x + 0.3 * inch, y + 1.2 * inch, 3.35 * inch, size=12, color=C["muted_dark"], leading=16)


def page_sales(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    accent_bar(c)
    brand_chip(c, MARGIN, PAGE_H - 0.7 * inch, dark=False)
    eyebrow(c, "Growth", MARGIN, PAGE_H - 1.15 * inch, dark=False)
    text(c, "How RR NOVA helps you sell more", MARGIN, PAGE_H - 1.65 * inch, size=28, color=C["ink"], font=FONT_DISPLAY, bold=True)

    levers = [
        ("01", "Convert more visitors", "Order Now and Reserve sit on a premium site guests trust — fewer abandoned visits."),
        ("02", "Keep margin in-house", "Direct orders and bookings reduce aggregator fees on guests you already attract."),
        ("03", "Fill quiet sessions", "Live menu, offers, and analytics help shape demand for lunch and midweek."),
        ("04", "Turn covers faster", "QR menus and clear ordering cut friction from table to kitchen."),
        ("05", "Win repeat visits", "Guest profiles, history, and timely follow-ups turn one-offs into regulars."),
        ("06", "Decide with facts", "Revenue, AOV, bestsellers, and funnel metrics — never invented numbers."),
    ]
    for i, (n, title, body) in enumerate(levers):
        row, col = divmod(i, 3)
        x = MARGIN + col * 4.1 * inch
        y = PAGE_H - 4.15 * inch - row * 2.2 * inch
        draw_round_rect(c, x, y, 3.9 * inch, 2.0 * inch, 10, fill=white, stroke=C["line"])
        text(c, n, x + 0.3 * inch, y + 1.5 * inch, size=11, color=C["gold"], bold=True)
        text(c, title, x + 0.3 * inch, y + 1.15 * inch, size=14, color=C["ink"], font=FONT_DISPLAY, bold=True)
        draw_paragraph(c, body, x + 0.3 * inch, y + 1.0 * inch, 3.35 * inch, size=11, color=C["pine_deep"], leading=15)


def page_screenshot(c: canvas.Canvas, *, eyebrow_label: str, title: str, blurb: str, url: str, image: Path, dark=False):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["bg_dark"] if dark else C["cream"])
    accent_bar(c)
    brand_chip(c, MARGIN, PAGE_H - 0.7 * inch, dark=dark)
    eyebrow(c, eyebrow_label, MARGIN, PAGE_H - 1.1 * inch, dark=dark)
    text(c, title, MARGIN, PAGE_H - 1.55 * inch, size=24, color=white if dark else C["ink"], font=FONT_DISPLAY, bold=True)
    draw_paragraph(
        c,
        blurb,
        MARGIN,
        PAGE_H - 1.7 * inch,
        12 * inch,
        size=12,
        color=C["muted_dark"] if dark else C["pine_deep"],
        leading=16,
    )
    browser_frame(c, MARGIN, 0.45 * inch, PAGE_W - 2 * MARGIN, 4.85 * inch, url, image)


def page_before_after(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["cream"])
    accent_bar(c)
    brand_chip(c, MARGIN, PAGE_H - 0.7 * inch, dark=False)
    eyebrow(c, "Transformation", MARGIN, PAGE_H - 1.15 * inch, dark=False)
    text(c, "Before vs after RR NOVA", MARGIN, PAGE_H - 1.65 * inch, size=28, color=C["ink"], font=FONT_DISPLAY, bold=True)

    # Before
    draw_round_rect(c, MARGIN, 0.7 * inch, 5.9 * inch, 4.7 * inch, 12, fill=white, stroke=C["line"])
    text(c, "Before", MARGIN + 0.4 * inch, 4.95 * inch, size=20, color=C["danger"], font=FONT_DISPLAY, bold=True)
    before = [
        "5–10 logins every service",
        "Stale menus & broken booking links",
        "Aggregator fees eating margin",
        "Guest data trapped in inboxes",
        "Managers flying blind on covers",
        "Marketing is an afterthought",
    ]
    for i, line in enumerate(before):
        text(c, f"✕  {line}", MARGIN + 0.4 * inch, 4.35 * inch - i * 0.5 * inch, size=13, color=C["ink"])

    # After
    draw_round_rect(c, 7.0 * inch, 0.7 * inch, 5.9 * inch, 4.7 * inch, 12, fill=C["bg_dark"])
    text(c, "After", 7.4 * inch, 4.95 * inch, size=20, color=C["gold"], font=FONT_DISPLAY, bold=True)
    after = [
        "One dashboard for the whole venue",
        "Live menu, QR, and site in sync",
        "Direct orders with secure checkout",
        "Unified guest profiles & history",
        "Live boards for kitchen & floor",
        "Analytics guiding real decisions",
    ]
    for i, line in enumerate(after):
        text(c, f"✓  {line}", 7.4 * inch, 4.35 * inch - i * 0.5 * inch, size=13, color=white)


def page_cta(c: canvas.Canvas):
    draw_rect(c, 0, 0, PAGE_W, PAGE_H, fill=C["bg_dark"])
    accent_bar(c)
    draw_round_rect(c, 8 * inch, PAGE_H - 3.5 * inch, 7 * inch, 4 * inch, 40, fill=C["bg_panel"])
    text(c, "LET’S GET YOUR VENUE LIVE", MARGIN, PAGE_H - 2.2 * inch, size=11, color=C["gold"], bold=True)
    text(c, "Ready to run your restaurant", MARGIN, PAGE_H - 2.9 * inch, size=30, color=white, font=FONT_DISPLAY, bold=True)
    text(c, "on one platform?", MARGIN, PAGE_H - 3.45 * inch, size=30, color=white, font=FONT_DISPLAY, bold=True)
    draw_paragraph(
        c,
        "Explore the Harbour Kitchen live demo — or start your own workspace.",
        MARGIN,
        PAGE_H - 3.85 * inch,
        8 * inch,
        size=14,
        color=C["muted_dark"],
        leading=20,
    )

    draw_round_rect(c, MARGIN, PAGE_H - 5.3 * inch, 4.6 * inch, 0.55 * inch, 8, fill=C["gold"])
    text(
        c,
        "restaurant-digital-platform-beige.vercel.app",
        MARGIN + 2.3 * inch,
        PAGE_H - 5.12 * inch,
        size=10,
        color=C["bg_dark"],
        bold=True,
        align="center",
    )

    links = [
        "Platform home  ·  /",
        "Guest site  ·  /r/harbour-kitchen",
        "Owner dashboard  ·  /dashboard/menus",
    ]
    for i, line in enumerate(links):
        text(c, line, MARGIN, PAGE_H - 6.0 * inch - i * 0.32 * inch, size=11, color=C["muted_dark"])

    text(c, "RR NOVA  ·  Crafted for Aotearoa New Zealand", MARGIN, 0.5 * inch, size=10, color=C["muted"])


def build():
    ASSETS.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUT), pagesize=(PAGE_W, PAGE_H))
    c.setTitle("RR NOVA — Restaurant Owner Pitch")
    c.setAuthor("RR NOVA")
    c.setSubject("Platform overview for restaurant owners")

    pages = [
        page_cover,
        page_pain,
        page_benefits,
        page_sales,
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Platform home",
            title="Your restaurant, elevated online",
            blurb="The RR NOVA landing experience — premium brand, clear CTAs, and a path into the live demo.",
            url="restaurant-digital-platform-beige.vercel.app",
            image=ASSETS / "01-landing.png",
            dark=True,
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Guest website",
            title="Harbour Kitchen — branded guest site",
            blurb="A full-bleed hero with Order, Reserve, and Menu CTAs — designed to convert discovery into covers and sales.",
            url="…/r/harbour-kitchen",
            image=ASSETS / "02-harbour-kitchen.png",
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Live menu",
            title="Digital menu guests can order from",
            blurb="Dietary filters, allergen notes, popular tags, and Add to order — always in sync with your dashboard.",
            url="…/r/harbour-kitchen/menu",
            image=ASSETS / "02b-harbour-menu.png",
            dark=True,
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Direct ordering",
            title="Checkout on your brand",
            blurb="Cart → details → payment. Guests stay with you instead of leaking to third-party marketplaces.",
            url="…/r/harbour-kitchen/order",
            image=ASSETS / "02c-harbour-order.png",
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Reservations",
            title="Book a table without phone tag",
            blurb="Online reservations with party size, date, and time — capacity rules you control from the dashboard.",
            url="…/r/harbour-kitchen/reservations",
            image=ASSETS / "02d-harbour-reservations.png",
            dark=True,
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Owner dashboard",
            title="One workspace to run service",
            blurb="Menus, orders, reservations, customers, analytics, website, QR, and team — without hopping between apps.",
            url="…/dashboard/menus",
            image=ASSETS / "03-dashboard.png",
        ),
        lambda c: page_screenshot(
            c,
            eyebrow_label="Product · Analytics",
            title="See what actually drives sales",
            blurb="Revenue, AOV, bestsellers, reservations, and conversion funnel — facts from your venue data.",
            url="…/dashboard/analytics",
            image=ASSETS / "03-dashboard-analytics.png",
            dark=True,
        ),
        page_before_after,
        page_cta,
    ]

    for i, fn in enumerate(pages):
        fn(c)
        c.showPage()

    c.save()
    print(f"Wrote {OUT} ({len(pages)} pages)")
    return OUT


if __name__ == "__main__":
    build()
