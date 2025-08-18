from flask import Flask, render_template, request, jsonify
import os, re, json, requests, random

app = Flask(__name__, static_folder="static", template_folder="templates")

# ---- Config ----
PEXELS_API_KEY = os.getenv("PEXELS_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# ---- Fallback Images ----
FALLBACK_IMAGES = [
    "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800"
]

# ---- Optional Gemini client ----
HAVE_GEMINI = False
try:
    if GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        HAVE_GEMINI = True
except Exception:
    HAVE_GEMINI = False

# ---------- ICON MAPPING ----------
ICON_MAP = {
    "home": "fa-solid fa-house",
    "about": "fa-solid fa-circle-info",
    "contact": "fa-solid fa-envelope",
    "services": "fa-solid fa-briefcase",
    "gallery": "fa-solid fa-images",
    "blog": "fa-solid fa-blog",
    "faq": "fa-solid fa-question-circle",
    "default": "fa-solid fa-star"
}

# Social icons for contact
CONTACT_SOCIAL_ICONS = [
    {"icon": "fa-brands fa-instagram", "link": "#"},
    {"icon": "fa-brands fa-linkedin", "link": "#"},
    {"icon": "fa-brands fa-facebook", "link": "#"},
    {"icon": "fa-brands fa-google", "link": "#"}
]

# ---------- FALLBACK BLUEPRINT ----------
def _fallback_blueprint(prompt: str) -> dict:
    p = prompt.strip().title() or "Your Website"
    return {
        "siteTitle": p,
        "palette": {"primary": "#2563eb", "accent": "#0f172a", "bg": "#ffffff"},
        "typography": {"heading": "Poppins", "body": "Inter"},
        "sections": {
            "home": {
                "title": f"Welcome to {p}",
                "description": (
                    f"{p} is your ultimate hub for everything about {prompt}. "
                    "Discover engaging content, beautiful layouts, and modern designs "
                    "that make your vision a reality. We blend creativity with technology "
                    "to deliver exceptional user experiences. Our goal is to bring innovation "
                    "and functionality together for seamless navigation and visual appeal."
                ),
                "keywords": [prompt, "modern", "ideas"]
            },
            "about": {
                "title": "About Us",
                "description": (
                    f"At {p}, we combine innovation with simplicity to create websites "
                    "that not only look stunning but also perform flawlessly. "
                    "Our team thrives on creativity, ensuring each design is responsive, "
                    "intuitive, and visually appealing. We believe in building digital experiences "
                    "that leave a lasting impact."
                ),
                "keywords": [prompt, "team", "story"]
            },
            "contact": {
                "title": "Contact",
                "description": (
                    f"Need help with {prompt}? Or have ideas to share? "
                    "Our doors are always open. We prioritize communication and "
                    "are passionate about building lasting connections through design. "
                    "Reach out to us anytime!"
                ),
                "keywords": [prompt, "support", "contact"]
            }
        }
    }

# ---------- GEMINI BLUEPRINT ----------
def gemini_blueprint(prompt: str) -> dict:
    if not HAVE_GEMINI:
        return _fallback_blueprint(prompt)

    instruction = (
        "Return ONLY JSON describing a detailed website structure for the given prompt.\n"
        "Schema:\n"
        "{"
        '"siteTitle":"string",'
        '"palette":{"primary":"#RRGGBB","accent":"#RRGGBB","bg":"#RRGGBB"},'
        '"typography":{"heading":"Font","body":"Font"},'
        '"sections":{'
        '"uniqueKey":{"title":"string","description":"4-5 sentence long","keywords":["k1","k2","k3"]},...'
        "}"
        "}\n"
        "Include Home, About, Services, Contact, and more if relevant."
    )
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        resp = model.generate_content(f"{instruction}\n\nPrompt: {prompt}")
        txt = getattr(resp, "text", "") or ""
        txt = re.sub(r"^```(?:json)?\s*", "", txt.strip())
        txt = re.sub(r"\s*```$", "", txt)
        m = re.search(r"\{[\s\S]*\}\s*$", txt)
        json_text = m.group(0) if m else txt
        data = json.loads(json_text)
        return data
    except Exception:
        return _fallback_blueprint(prompt)

# ---------- IMAGE FETCH ----------
def fetch_pexels_images(query: str, n: int = 2) -> list:
    if not PEXELS_API_KEY:
        return FALLBACK_IMAGES[:n]
    try:
        url = "https://api.pexels.com/v1/search"
        params = {"query": query, "per_page": n, "orientation": "landscape"}
        headers = {"Authorization": PEXELS_API_KEY}
        r = requests.get(url, params=params, headers=headers, timeout=15)
        r.raise_for_status()
        photos = r.json().get("photos", [])
        urls = [p["src"]["large"] for p in photos if p.get("src", {}).get("large")]
        return urls or FALLBACK_IMAGES[:n]
    except Exception:
        return FALLBACK_IMAGES[:n]

# ---------- FINAL STRUCTURED RESPONSE ----------
def assemble_sections(prompt: str) -> dict:
    bp = gemini_blueprint(prompt)
    site_title = bp.get("siteTitle") or prompt.title()
    theme = bp.get("palette", {"primary": "#2563eb", "accent": "#0f172a", "bg": "#ffffff"})
    typography = bp.get("typography", {"heading": "Poppins", "body": "Inter"})

    sections = {}
    animation_styles = ["fade-up", "zoom-in", "slide-right", "slide-left", "flip-up"]

    # Ensure Home is first
    keys_sorted = sorted(bp.get("sections", {}).keys(), key=lambda k: (k != "home", k))

    for key in keys_sorted:
        sec = bp["sections"][key]
        title = sec.get("title") or key.title()
        desc = sec.get("description") or ""
        keywords = sec.get("keywords") or [prompt]
        q = f"{prompt} " + " ".join(keywords[:2])
        images = fetch_pexels_images(q, 2)
        icon = ICON_MAP.get(key.lower(), ICON_MAP["default"])
        animation = random.choice(animation_styles)

        sections[key] = {
            "title": title,
            "description": desc,
            "images": images,
            "keywords": keywords,
            "icon": icon,
            "animation": animation
        }

        if key.lower() == "contact":
            sections[key]["socialIcons"] = CONTACT_SOCIAL_ICONS

    return {
        "siteTitle": site_title,
        "theme": theme,
        "typography": typography,
        "sections": sections
    }

# ---------- ROUTES ----------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate_prototype", methods=["POST"])
def generate_prototype():
    data = request.get_json(silent=True) or {}
    prompt = (data.get("prompt") or "Website").strip()
    payload = assemble_sections(prompt)
    return jsonify(payload)

if __name__ == "__main__":
    app.run(debug=True)
