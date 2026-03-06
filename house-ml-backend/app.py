from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import joblib, numpy as np, json, shap, io, datetime, os

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle,
    Paragraph, Spacer, HRFlowable
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

app = FastAPI(title="House Price Predictor API", version="5.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load model & encoders ─────────────────────────────────────
model         = joblib.load("model.pkl")
le_city       = joblib.load("le_city.pkl")
le_furnishing = joblib.load("le_furnishing.pkl")
le_locality   = joblib.load("le_locality.pkl")

with open("metadata.json") as f:
    metadata = json.load(f)

print("⏳ Loading SHAP explainer...")
explainer = shap.TreeExplainer(model)
print("✅ SHAP explainer ready")

# ── Schemas ───────────────────────────────────────────────────
class HouseInput(BaseModel):
    city:                       str
    locality_tier:              str
    bhk:                        int
    bathrooms:                  int
    super_area_sqft:            float
    carpet_area_sqft:           float
    floor_no:                   int
    total_floors:               int
    property_age_years:         float
    parking:                    int
    furnishing:                 str
    lift:                       int
    gated_society:              int
    distance_to_metro_km:       float
    distance_to_city_center_km: float
    nearby_school_km:           float
    nearby_hospital_km:         float
    crime_rate_index:           float

class ChatMessage(BaseModel):
    role:    str
    content: str

class ChatRequest(BaseModel):
    messages:     List[ChatMessage]
    property_ctx: Optional[dict] = None

# ── Helpers ───────────────────────────────────────────────────
def safe_encode(encoder, value, fallback=0):
    try:    return int(encoder.transform([value])[0])
    except: return fallback

def build_features(d: HouseInput):
    city_enc       = safe_encode(le_city,       d.city)
    furnishing_enc = safe_encode(le_furnishing,  d.furnishing)
    locality_enc   = safe_encode(le_locality,    d.locality_tier)
    city_stats     = metadata["city_stats"].get(d.city, {})
    city_median    = city_stats.get("city_median", 8000000)

    area_efficiency   = d.carpet_area_sqft / max(d.super_area_sqft, 1)
    floor_ratio       = d.floor_no / max(d.total_floors, 1)
    rooms_per_100sqft = (d.bhk + d.bathrooms) / max(d.super_area_sqft / 100, 0.1)
    proximity_score   = 1 / (d.distance_to_metro_km + d.distance_to_city_center_km + 1)
    services_score    = 1 / (d.nearby_school_km + d.nearby_hospital_km + 1)
    safety_score      = 100 - d.crime_rate_index
    is_premium        = 1 if d.locality_tier == "Premium" else 0
    is_budget         = 1 if d.locality_tier == "Budget"  else 0
    is_new            = 1 if d.property_age_years <= 2    else 0

    return np.array([[
        d.bhk, d.bathrooms, d.super_area_sqft, d.carpet_area_sqft,
        d.floor_no, d.total_floors, d.property_age_years, d.parking,
        d.lift, d.gated_society, city_enc, locality_enc,
        d.distance_to_metro_km, d.distance_to_city_center_km,
        d.nearby_school_km, d.nearby_hospital_km,
        d.crime_rate_index, city_median,
        area_efficiency, floor_ratio, rooms_per_100sqft,
        proximity_score, services_score, safety_score,
        is_premium, is_budget, is_new, furnishing_enc,
    ]])

FEAT_LABELS = {
    "BHK":"Bedrooms (BHK)","Bathrooms":"Bathrooms",
    "Super_Area_sqft":"Super Area","Carpet_Area_sqft":"Carpet Area",
    "Floor_No":"Floor Number","Total_Floors":"Total Floors",
    "Property_Age_years":"Property Age","Parking":"Parking Spots",
    "Lift":"Lift Available","Gated_Society":"Gated Society",
    "City_enc":"City","Locality_enc":"Locality Tier",
    "Distance_to_Metro_km":"Metro Distance",
    "Distance_to_CityCenter_km":"City Center Distance",
    "Nearby_School_km":"School Proximity","Nearby_Hospital_km":"Hospital Proximity",
    "Crime_Rate_Index":"Crime Rate","city_median":"City Price Level",
    "Area_Efficiency":"Area Efficiency","Floor_Ratio":"Floor Position",
    "Rooms_per_100sqft":"Room Density","Proximity_Score":"Transit Proximity",
    "Services_Score":"Services Nearby","Safety_Score":"Safety Score",
    "Is_Premium":"Premium Locality","Is_Budget":"Budget Locality",
    "Is_New_Property":"New Property","Furnishing_enc":"Furnishing Status",
}

def fmt_inr(v):
    v = float(v)
    if v >= 10000000: return f"Rs {v/10000000:.2f} Cr"
    if v >= 100000:   return f"Rs {v/100000:.2f} L"
    return f"Rs {v:,.0f}"

def calc_emi(p, rate_pct, years):
    r = rate_pct / 12 / 100
    n = years * 12
    if r == 0: return p / n
    return (p * r * (1+r)**n) / ((1+r)**n - 1)

# ── PDF builder ───────────────────────────────────────────────
C_DARK    = colors.HexColor("#0e0e1c")
C_ACCENT  = colors.HexColor("#7c6eff")
C_GREEN   = colors.HexColor("#3ddba5")
C_ROSE    = colors.HexColor("#ff6b8a")
C_TEXT    = colors.HexColor("#1a1a2e")
C_SUBTEXT = colors.HexColor("#6b6b9a")
C_BORDER  = colors.HexColor("#e0e0f0")
C_PANEL   = colors.HexColor("#f4f4ff")
C_PANEL2  = colors.HexColor("#fff9ec")

def make_style(name, **kw):
    defaults = dict(fontName="Helvetica", fontSize=10, textColor=C_TEXT, leading=14)
    defaults.update(kw)
    return ParagraphStyle(name, **defaults)

def _stat_cell(label, value, s_lbl, s_val):
    return Table([[Paragraph(label, s_lbl)],[Paragraph(value, s_val)]])

def build_pdf(data: HouseInput, price: float, shap_data: dict) -> bytes:
    buf  = io.BytesIO()
    doc  = SimpleDocTemplate(buf, pagesize=A4,
        leftMargin=18*mm, rightMargin=18*mm,
        topMargin=22*mm, bottomMargin=18*mm)

    s_h3    = make_style("H3",  fontName="Helvetica-Bold", fontSize=10, textColor=C_SUBTEXT, leading=14)
    s_body  = make_style("BD",  fontSize=9.5, textColor=C_TEXT, leading=14)
    s_small = make_style("SM",  fontSize=8,   textColor=C_SUBTEXT, leading=12)
    s_price = make_style("PR",  fontName="Helvetica-Bold", fontSize=32, textColor=C_ACCENT, leading=40, alignment=TA_CENTER)
    s_range = make_style("RNG", fontSize=9, textColor=C_SUBTEXT, leading=12, alignment=TA_CENTER)
    s_label = make_style("LBL", fontName="Helvetica-Bold", fontSize=7.5, textColor=C_SUBTEXT, leading=10, spaceAfter=1)
    s_val   = make_style("VAL", fontName="Helvetica-Bold", fontSize=11, textColor=C_TEXT, leading=14)
    s_disc  = make_style("DSC", fontSize=7.5, textColor=C_SUBTEXT, leading=11, alignment=TA_CENTER)

    today = datetime.date.today().strftime("%d %B %Y")
    r2    = metadata["model_stats"]["r2"]
    story = []

    # Header
    hdr = Table([[
        Paragraph("<b>ProphetAI</b>", make_style("BRD", fontName="Helvetica-Bold", fontSize=18, textColor=C_ACCENT, leading=22)),
        Paragraph(f"Property Valuation Report<br/><font size='8' color='#6b6b9a'>Generated {today}</font>",
                  make_style("HDR", fontSize=11, textColor=C_TEXT, leading=16, alignment=TA_RIGHT)),
    ]], colWidths=[85*mm, 85*mm])
    hdr.setStyle(TableStyle([
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BACKGROUND",(0,0),(-1,-1),C_PANEL),
        ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10),
        ("LEFTPADDING",(0,0),(0,-1),14),("RIGHTPADDING",(-1,0),(-1,-1),14),
    ]))
    story += [hdr, Spacer(1, 6*mm)]

    # Price hero
    price_low  = price * 0.88
    price_high = price * 1.12
    hero = Table([[Paragraph(fmt_inr(price), s_price)]], colWidths=[170*mm])
    hero.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_PANEL),("ALIGN",(0,0),(-1,-1),"CENTER"),("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),6)]))
    rng = Table([[Paragraph(f"Range: {fmt_inr(price_low)}  –  {fmt_inr(price_high)}", s_range)]], colWidths=[170*mm])
    rng.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_PANEL),("ALIGN",(0,0),(-1,-1),"CENTER"),("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),10)]))
    story += [Paragraph("ESTIMATED MARKET VALUE", s_label), Spacer(1,1*mm), hero, rng, Spacer(1,5*mm)]

    # Stats row
    ppsf  = price / data.super_area_sqft
    stats = [("City",data.city),("Locality",data.locality_tier),(f"Config",f"{data.bhk} BHK/{data.bathrooms}B"),("Price/sqft",fmt_inr(ppsf)),("Confidence",f"{round(r2*100,1)}%"),("Furnishing",data.furnishing)]
    stat_tbl = Table([[_stat_cell(l,v,s_label,s_val) for l,v in stats]], colWidths=[170/6*mm]*6)
    stat_tbl.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,-1),C_PANEL2),("ALIGN",(0,0),(-1,-1),"CENTER"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),8),("BOTTOMPADDING",(0,0),(-1,-1),8),("LINEAFTER",(0,0),(-2,-1),0.5,C_BORDER)]))
    story += [stat_tbl, Spacer(1,6*mm)]

    # Property details
    story.append(Paragraph("PROPERTY DETAILS", s_h3))
    story.append(Spacer(1,2*mm))
    details = [
        ["Super Area",f"{data.super_area_sqft:,.0f} sqft","Carpet Area",f"{data.carpet_area_sqft:,.0f} sqft"],
        ["Floor",f"{data.floor_no} of {data.total_floors}","Property Age",f"{data.property_age_years:.0f} years"],
        ["Parking",str(data.parking),"Lift","Yes" if data.lift else "No"],
        ["Gated Society","Yes" if data.gated_society else "No","Furnishing",data.furnishing],
        ["Metro Distance",f"{data.distance_to_metro_km} km","City Center",f"{data.distance_to_city_center_km} km"],
        ["Nearest School",f"{data.nearby_school_km} km","Nearest Hospital",f"{data.nearby_hospital_km} km"],
        ["Crime Rate Index",str(data.crime_rate_index),"Safety Score",f"{100-data.crime_rate_index:.0f}/100"],
    ]
    det_rows = [[Paragraph(r[0],s_label),Paragraph(r[1],s_val),Paragraph(r[2],s_label),Paragraph(r[3],s_val)] for r in details]
    det_tbl  = Table(det_rows, colWidths=[38*mm,47*mm,38*mm,47*mm])
    det_tbl.setStyle(TableStyle([("LINEBELOW",(0,0),(-1,-2),0.4,C_BORDER),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),6),("BOTTOMPADDING",(0,0),(-1,-1),6),("LEFTPADDING",(0,0),(-1,-1),8),("BOX",(0,0),(-1,-1),0.5,C_BORDER)]))
    story += [det_tbl, Spacer(1,6*mm)]

    # SHAP
    story.append(Paragraph("AI PRICE EXPLANATION (SHAP)", s_h3))
    story.append(Spacer(1,2*mm))
    contribs = shap_data["contributions"][:10]
    max_abs  = max(abs(c["impact_inr"]) for c in contribs) if contribs else 1
    shap_rows = [[Paragraph("FEATURE",s_label),Paragraph("IMPACT",s_label),Paragraph("DIRECTION",s_label)]]
    for c in contribs:
        pos  = c["impact_inr"] >= 0
        col  = C_GREEN if pos else C_ROSE
        bw   = max(3, int(abs(c["impact_inr"])/max_abs*60))
        sign = "+" if pos else "-"
        av   = abs(c["impact_inr"])
        if av>=10000000:   iv=f"{sign}Rs {av/10000000:.2f} Cr"
        elif av>=100000:   iv=f"{sign}Rs {av/100000:.1f} L"
        elif av>=1000:     iv=f"{sign}Rs {av/1000:.1f}K"
        else:              iv=f"{sign}Rs {av:.0f}"
        bs = make_style(f"b{c['raw_name']}", fontName="Helvetica-Bold", fontSize=8, textColor=col, leading=12)
        shap_rows.append([Paragraph(c["feature"],s_body),Paragraph(f"<b>{iv}</b>",bs),Paragraph("▓"*(bw//4) or "▏",bs)])
    shap_tbl = Table(shap_rows, colWidths=[65*mm,40*mm,65*mm])
    shap_tbl.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),C_PANEL),("LINEBELOW",(0,0),(-1,0),0.5,C_ACCENT),("LINEBELOW",(0,1),(-1,-2),0.3,C_BORDER),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8),("BOX",(0,0),(-1,-1),0.5,C_BORDER)]))
    story += [shap_tbl, Spacer(1,6*mm)]

    # EMI
    story.append(Paragraph("EMI BREAKDOWN", s_h3))
    story.append(Spacer(1,2*mm))
    emi_hdr  = [Paragraph(h,s_label) for h in ["DOWN PMT","RATE","TENURE","LOAN AMT","MONTHLY EMI","TOTAL INTEREST"]]
    emi_rows = [emi_hdr]
    for dp,rt,yr in [(20,8.5,10),(20,8.5,20),(20,9.0,20),(30,8.5,20)]:
        loan=price*(1-dp/100); emi=calc_emi(loan,rt,yr); total=emi*yr*12; intr=total-loan
        ev=make_style(f"e{dp}{rt}{yr}",fontName="Helvetica-Bold",fontSize=9.5,textColor=C_ACCENT,leading=14)
        emi_rows.append([Paragraph(f"{dp}%",s_body),Paragraph(f"{rt}% p.a.",s_body),Paragraph(f"{yr} yrs",s_body),Paragraph(fmt_inr(loan),s_body),Paragraph(f"<b>{fmt_inr(emi)}/mo</b>",ev),Paragraph(fmt_inr(intr),s_body)])
    emi_tbl = Table(emi_rows, colWidths=[24*mm,22*mm,22*mm,36*mm,36*mm,30*mm])
    emi_tbl.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),C_PANEL),("LINEBELOW",(0,0),(-1,0),0.5,C_ACCENT),("LINEBELOW",(0,1),(-1,-2),0.3,C_BORDER),("BACKGROUND",(0,1),(-1,1),colors.HexColor("#f0eeff")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("TOPPADDING",(0,0),(-1,-1),5),("BOTTOMPADDING",(0,0),(-1,-1),5),("LEFTPADDING",(0,0),(-1,-1),8),("BOX",(0,0),(-1,-1),0.5,C_BORDER)]))
    story += [emi_tbl, Spacer(1,8*mm)]

    story.append(HRFlowable(width="100%", thickness=0.5, color=C_BORDER))
    story.append(Spacer(1,3*mm))
    story.append(Paragraph(f"Generated by ProphetAI  •  {today}  •  XGBoost R²={round(r2*100,1)}%  •  For informational purposes only.", s_disc))
    doc.build(story)
    buf.seek(0)
    return buf.read()

# ── ROUTES ────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "House Price Predictor API v5.0 ✅ SHAP + PDF + Gemini Chat"}

@app.get("/metadata")
def get_metadata():
    return metadata

@app.get("/cities")
def get_cities():
    return {"cities": metadata["cities"]}

@app.get("/options")
def get_options():
    return {
        "cities":         metadata["cities"],
        "furnishings":    metadata["furnishings"],
        "locality_tiers": metadata["locality_tiers"],
    }

@app.post("/predict")
def predict(data: HouseInput):
    if data.city not in metadata["cities"]:
        raise HTTPException(400, f"Unknown city: {data.city}")
    try:
        features  = build_features(data)
        log_price = model.predict(features)[0]
        price     = float(np.expm1(log_price))
        price     = max(price, 500000)
        r2        = metadata["model_stats"]["r2"]

        # ── Luxury multiplier ────────────────────────────────
        is_luxury   = False
        luxury_note = ""

        city_multipliers = {
            "Mumbai":    3.2,
            "Bangalore": 2.2,
            "Pune":      1.8,
            "Hyderabad": 1.9,
            "Nagpur":    1.5,
        }

        if (
            data.super_area_sqft > 3000 or
            data.bhk >= 4 or
            (data.locality_tier == "Premium" and data.super_area_sqft > 2000)
        ):
            is_luxury = True

            # Base luxury factor from area
            area_factor = (data.super_area_sqft / 1000) ** 1.35

            # City premium multiplier
            city_factor = city_multipliers.get(data.city, 2.0)

            # Locality boost
            locality_factor = 1.6 if data.locality_tier == "Premium" else 1.2

            # Furnishing boost
            furnishing_factor = (
                1.15 if data.furnishing == "Fully-Furnished"
                else 1.05 if data.furnishing == "Semi-Furnished"
                else 1.0
            )

            # Amenity boost
            amenity_factor = 1.0
            if data.lift:          amenity_factor += 0.04
            if data.gated_society: amenity_factor += 0.05
            if data.parking >= 2:  amenity_factor += 0.04

            # BHK boost
            bhk_factor = 1.0 + (data.bhk - 3) * 0.12 if data.bhk > 3 else 1.0

            # Final luxury price
            luxury_multiplier = (
                area_factor *
                city_factor *
                locality_factor *
                furnishing_factor *
                amenity_factor *
                bhk_factor
            ) / 10  # normalize

            # Blend base price with luxury estimate
            # More luxury → less weight on base ML price
            blend_weight = min(0.15, 1 / area_factor)
            price = (price * blend_weight) + (price * luxury_multiplier * (1 - blend_weight))

            luxury_note = "Luxury multiplier applied"

        return {
            "predicted_price": round(price),
            "price_low":       round(price * 0.88),
            "price_high":      round(price * 1.12),
            "price_per_sqft":  round(price / data.super_area_sqft),
            "city":            data.city,
            "locality_tier":   data.locality_tier,
            "confidence":      round(r2 * 100, 1),
            "is_luxury":       is_luxury,
            "luxury_note":     luxury_note,
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/explain")
def explain(data: HouseInput):
    if data.city not in metadata["cities"]:
        raise HTTPException(400, f"Unknown city: {data.city}")
    try:
        features    = build_features(data)
        log_price   = model.predict(features)[0]
        price       = float(np.expm1(log_price))
        shap_values = explainer.shap_values(features)
        shap_arr    = shap_values[0]
        base_log    = float(explainer.expected_value)
        base_price  = float(np.expm1(base_log))
        contributions = []
        for name, sv in zip(metadata["features"], shap_arr):
            impact_inr = float(np.expm1(base_log + sv) - base_price)
            contributions.append({
                "feature":    FEAT_LABELS.get(name, name),
                "raw_name":   name,
                "shap_value": round(float(sv), 6),
                "impact_inr": round(impact_inr),
            })
        contributions.sort(key=lambda x: abs(x["impact_inr"]), reverse=True)
        return {
            "predicted_price": round(price),
            "base_price":      round(base_price),
            "contributions":   contributions[:14],
        }
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/report")
def generate_report(data: HouseInput):
    if data.city not in metadata["cities"]:
        raise HTTPException(400, f"Unknown city: {data.city}")
    try:
        features    = build_features(data)
        log_price   = model.predict(features)[0]
        price       = float(np.expm1(log_price))
        price       = max(price, 500000)
        shap_values = explainer.shap_values(features)
        shap_arr    = shap_values[0]
        base_log    = float(explainer.expected_value)
        base_price  = float(np.expm1(base_log))
        contributions = []
        for name, sv in zip(metadata["features"], shap_arr):
            impact_inr = float(np.expm1(base_log + sv) - base_price)
            contributions.append({
                "feature":    FEAT_LABELS.get(name, name),
                "raw_name":   name,
                "shap_value": round(float(sv), 6),
                "impact_inr": round(impact_inr),
            })
        contributions.sort(key=lambda x: abs(x["impact_inr"]), reverse=True)
        shap_data = {"base_price": round(base_price), "contributions": contributions}
        pdf_bytes = build_pdf(data, price, shap_data)
        filename  = f"ProphetAI_{data.city}_{data.bhk}bhk.pdf"
        return StreamingResponse(io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'})
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/chat")
async def chat(req: ChatRequest):
    import google.generativeai as genai

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(500,
            "GEMINI_API_KEY not set. In PowerShell run: "
            "[System.Environment]::SetEnvironmentVariable('GEMINI_API_KEY','your-key','User') "
            "then restart VS Code and uvicorn.")

    ctx = req.property_ctx or {}

    def fmt(v):
        v = float(v)
        if v >= 10000000: return f"Rs {v/10000000:.2f} Cr"
        if v >= 100000:   return f"Rs {v/100000:.2f} L"
        return f"Rs {v:,.0f}"

    ctx_block = ""
    if ctx.get("predicted_price"):
        ctx_block = f"""
## Property Being Analysed Right Now
- City: {ctx.get('city','—')}
- Locality Tier: {ctx.get('locality_tier','—')}
- Configuration: {ctx.get('bhk','—')} BHK / {ctx.get('bathrooms','—')} Bathrooms
- Super Area: {ctx.get('super_area_sqft','—')} sqft  |  Carpet: {ctx.get('carpet_area_sqft','—')} sqft
- Floor: {ctx.get('floor_no','—')} of {ctx.get('total_floors','—')}
- Property Age: {ctx.get('property_age_years','—')} years
- Furnishing: {ctx.get('furnishing','—')}
- Parking: {ctx.get('parking','—')}  |  Lift: {'Yes' if ctx.get('lift') else 'No'}  |  Gated: {'Yes' if ctx.get('gated_society') else 'No'}
- Metro Distance: {ctx.get('distance_to_metro_km','—')} km
- City Center: {ctx.get('distance_to_city_center_km','—')} km
- Nearest School: {ctx.get('nearby_school_km','—')} km  |  Hospital: {ctx.get('nearby_hospital_km','—')} km
- Crime Rate Index: {ctx.get('crime_rate_index','—')}
- Predicted Price: {fmt(ctx['predicted_price'])}
- Price Range: {fmt(ctx.get('price_low',0))} – {fmt(ctx.get('price_high',0))}
- Price/sqft: {fmt(ctx.get('price_per_sqft',0))}
- Model Confidence: {ctx.get('confidence','—')}%
"""

    system_prompt = f"""You are ProphetAI Assistant, an expert Indian real estate advisor.
You are embedded in a property valuation platform that uses XGBoost ML with R² = 98.4%.

Your expertise:
- Indian real estate market (Mumbai, Bangalore, Pune, Hyderabad, Nagpur and all major cities)
- Property valuation, price negotiation, home loans and EMI
- RERA regulations, legal aspects of property buying
- Investment ROI, rental yield, buy vs rent analysis
- Interpreting ML predictions and SHAP explanations
- Market trends in Indian metros

{ctx_block}

Response rules:
- Be concise and practical — under 180 words unless genuinely needed
- Use bullet points for lists, bold for key numbers
- Reference the user's specific property when relevant
- Format numbers as: Rs 1.24 Cr, Rs 89 L, Rs 8200/sqft
- Tone: warm, expert advisor — not a salesperson
- If asked about the prediction, explain it using the property context above
"""

    try:
        genai.configure(api_key=api_key)
        model_ai = genai.GenerativeModel(
         model_name="gemini-2.5-flash-lite",
            system_instruction=system_prompt,
        )

        # Build chat history (all messages except the last)
        history = []
        for m in req.messages[:-1]:
            history.append({
                "role":  "user" if m.role == "user" else "model",
                "parts": [m.content],
            })

        chat_session = model_ai.start_chat(history=history)
        response     = chat_session.send_message(req.messages[-1].content)

        return {"reply": response.text}

    except Exception as e:
        raise HTTPException(500, f"Gemini API error: {str(e)}")

@app.get("/compare")
def compare_cities(
    bhk:int=2, super_area_sqft:float=1000, carpet_area_sqft:float=850,
    floor_no:int=3, total_floors:int=10, property_age_years:float=3,
    parking:int=1, bathrooms:int=2, furnishing:str="Semi-Furnished",
    lift:int=1, gated_society:int=1, locality_tier:str="Mid",
    distance_to_metro_km:float=2.0, distance_to_city_center_km:float=5.0,
    nearby_school_km:float=1.5, nearby_hospital_km:float=2.0,
    crime_rate_index:float=35.0,
):
    results = []
    for city in metadata["cities"]:
        try:
            inp = HouseInput(
                city=city, locality_tier=locality_tier,
                bhk=bhk, bathrooms=bathrooms,
                super_area_sqft=super_area_sqft, carpet_area_sqft=carpet_area_sqft,
                floor_no=floor_no, total_floors=total_floors,
                property_age_years=property_age_years, parking=parking,
                furnishing=furnishing, lift=lift, gated_society=gated_society,
                distance_to_metro_km=distance_to_metro_km,
                distance_to_city_center_km=distance_to_city_center_km,
                nearby_school_km=nearby_school_km, nearby_hospital_km=nearby_hospital_km,
                crime_rate_index=crime_rate_index,
            )
            features  = build_features(inp)
            log_price = model.predict(features)[0]
            price     = float(np.expm1(log_price))
            results.append({"city": city, "price": round(price)})
        except:
            pass
    results.sort(key=lambda x: x["price"], reverse=True)
    return {"comparisons": results}

@app.get("/models")
async def list_models():
    import google.generativeai as genai
    genai.configure(api_key=os.getenv("GEMINI_API_KEY",""))
    models = [m.name for m in genai.list_models()]
    return {"models": models}

# ── ADD THESE IMPORTS at the top of app.py ────────────────────
# from fastapi import File, UploadFile

# ── ADD THIS ROUTE anywhere in app.py ─────────────────────────

@app.post("/estimate-image")
async def estimate_image(file: UploadFile = File(...)):
    """
    Accepts a property image, sends to Gemini Vision,
    returns condition score + price adjustment %.
    """
    import google.generativeai as genai
    import base64, json, re

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(500, "GEMINI_API_KEY not set.")

    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (JPG, PNG, WEBP)")

    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(400, "Image must be under 10MB")

    image_b64 = base64.b64encode(image_bytes).decode()

    # Map content type to mime type
    mime_map = {
        "image/jpeg":  "image/jpeg",
        "image/jpg":   "image/jpeg",
        "image/png":   "image/png",
        "image/webp":  "image/webp",
        "image/gif":   "image/gif",
    }
    mime_type = mime_map.get(file.content_type, "image/jpeg")

    prompt = """
You are a real estate property condition analyser for the Indian market.
Analyse this property/room image carefully.

Return ONLY a valid JSON object with NO markdown, NO code fences, NO extra text:

{
  "condition_score": <float 1.0-10.0>,
  "price_adjustment_pct": <float, e.g. 5.5 or -8.2>,
  "summary": "<one sentence description of overall condition>",
  "observations": [
    "<specific observation 1>",
    "<specific observation 2>",
    "<specific observation 3>"
  ],
  "positive_factors": [
    "<positive factor 1>",
    "<positive factor 2>"
  ],
  "negative_factors": [
    "<negative factor 1>",
    "<negative factor 2>"
  ],
  "sub_scores": {
    "Interior Condition": <float 1-10>,
    "Lighting Quality": <float 1-10>,
    "Space & Layout": <float 1-10>,
    "Fixtures & Fittings": <float 1-10>,
    "Cleanliness": <float 1-10>
  }
}

Scoring guide for condition_score:
9.0-10.0: Luxury, brand new, immaculate, premium finishes
7.0-8.9:  Very good, modern, well maintained, clean
5.0-6.9:  Average, some wear and tear, acceptable condition
3.0-4.9:  Below average, needs renovation, visible damage
1.0-2.9:  Poor, major repairs needed, uninhabitable

Price adjustment guide (price_adjustment_pct):
+8 to +15: Exceptional condition, luxury finishes
+3 to +8:  Good condition, modern interiors
-2 to +3:  Average condition, neutral impact
-8 to -2:  Below average, some repairs needed
-15 to -8: Poor condition, major renovation required

Important: Return ONLY the JSON object. No other text whatsoever.
"""

    try:
        genai.configure(api_key=api_key)

        # Try models in order until one works
        VISION_MODELS = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-001",
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
        ]

        response   = None
        last_error = None

        for model_name in VISION_MODELS:
            try:
                model    = genai.GenerativeModel(model_name)
                response = model.generate_content([
                    {"mime_type": mime_type, "data": image_b64},
                    prompt
                ])
                break  # success — stop trying other models
            except Exception as e:
                last_error = e
                continue

        if response is None:
            raise Exception(f"All models exhausted quota. Try again tomorrow. Last error: {last_error}")

        text = response.text.strip()
        # Strip any markdown code fences if model adds them
        text = re.sub(r"```json\s*", "", text)
        text = re.sub(r"```\s*",     "", text)
        text = text.strip()

        data = json.loads(text)

        # Validate and clamp values
        data["condition_score"]      = max(1.0, min(10.0, float(data.get("condition_score", 5.0))))
        data["price_adjustment_pct"] = max(-20.0, min(20.0, float(data.get("price_adjustment_pct", 0.0))))

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Could not parse Gemini response as JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Image analysis failed: {str(e)}")
