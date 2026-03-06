<div align="center">

# ⌂ ProphetAI
### *Full-Stack AI Property Valuation Platform*

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_Site-7c6eff?style=for-the-badge)](https://house-price-prediction-nql7ipndg.vercel.app)
[![Backend API](https://img.shields.io/badge/⚡_Backend_API-Render-3ddba5?style=for-the-badge)](https://prophetai-backend.onrender.com/docs)
[![GitHub](https://img.shields.io/badge/GitHub-GAURAVVVVVVVVVVVVV-white?style=for-the-badge&logo=github)](https://github.com/GAURAVVVVVVVVVVVVV)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gaurav_Mehta-0a66c2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/gaurav-mehta-324431318/)

<br/>

![ProphetAI Banner](https://img.shields.io/badge/XGBoost-R²%3D0.984-7c6eff?style=flat-square) ![Records](https://img.shields.io/badge/Training_Data-12K%2B_Records-3ddba5?style=flat-square) ![Features](https://img.shields.io/badge/Engineered_Features-28-f5c842?style=flat-square) ![Cities](https://img.shields.io/badge/Cities_Covered-5-ff6b8a?style=flat-square) ![AI](https://img.shields.io/badge/AI_Features-6-7c6eff?style=flat-square)

<br/>

> **ProphetAI** is not just an ML model — it's a complete production-grade AI platform combining  
> machine learning, explainable AI, computer vision, and a conversational real estate advisor  
> into one cohesive full-stack product. Built entirely from scratch by one developer.

<br/>

</div>

---

## 📸 Screenshots

| Predict Page | SHAP Explainer | What-If Analyzer |
|:---:|:---:|:---:|
| *Price prediction with 18 features* | *AI explains every prediction* | *Live sliders re-predict instantly* |

| Image Analysis | PDF Report | AI Chatbot |
|:---:|:---:|:---:|
| *Gemini Vision scores property condition* | *2-page branded valuation report* | *Context-aware real estate advisor* |

---

## ✦ What Makes This Different

Most ML projects stop at training a model and showing accuracy. **ProphetAI goes 6 layers deeper:**

```
Layer 1 — XGBoost Model          R²=0.984, trained on 12K Indian housing records
Layer 2 — SHAP Explainability    Every prediction explained with feature attribution
Layer 3 — What-If Analyzer       Live sliders, instant re-prediction, price sensitivity
Layer 4 — Vision AI              Gemini Vision scores property photos, adjusts price
Layer 5 — PDF Report Export      Branded 2-page valuation report with EMI scenarios
Layer 6 — AI Chatbot             Context-aware Gemini advisor knows your exact property
```

---

## 🚀 Features

### ⬡ Price Prediction Engine
- XGBoost model trained on **12,000+ Indian housing records** across 5 cities
- **28 engineered features** from 18 raw inputs — proximity scores, area efficiency, safety indices
- Log-price transformation to handle price distribution skewness
- Luxury property multiplier for high-end outlier correction
- Confidence interval with ±12% price range

### 🔬 SHAP Explainable AI
- **TreeExplainer** generates per-prediction feature attribution
- Visual waterfall chart showing which features pushed price up or down
- Answers the question *"Why did the model predict this price?"*
- Top 10 contributing features ranked by impact in ₹

### ⚡ What-If Analyzer
- Live sliders for all 10 continuous features
- **Debounced real-time re-prediction** — price updates 350ms after slider move
- Summary of all changes with before/after comparison
- Total price impact shown in ₹ and percentage

### 📸 Vision AI Image Analysis
- Upload any property photo → **Gemini Vision** analyses condition
- Returns condition score (1–10), price adjustment %, sub-scores across 5 dimensions
- Positive and negative factors with AI observations
- Price impact shown against base ML prediction

### 📄 PDF Report Export
- **2-page branded PDF** generated server-side with ReportLab
- Includes: price hero, property details table, SHAP bar chart, 4 EMI scenarios
- Color-coded layout with ProphetAI branding
- Download with one click

### 💬 AI Real Estate Advisor
- Powered by **Gemini 2.0 Flash**
- Injected with full property context — knows city, price, BHK, all 18 features
- Answers questions about negotiation, investment ROI, rental yield, RERA, buy vs rent
- Markdown rendering with bold text and bullet points

### ◈ City Comparison
- Compare predicted prices across all 5 cities for identical property specs
- Bar chart visualization with price/sqft breakdown

### ◉ Analytics Dashboard
- City-wise price distribution charts
- Feature correlation heatmaps
- Price trends and market insights

---

## 🛠 Tech Stack

### Machine Learning
| Technology | Purpose |
|---|---|
| **XGBoost** | Primary prediction model — R²=0.9841 |
| **SHAP** | Explainable AI — TreeExplainer for feature attribution |
| **Scikit-learn** | Preprocessing, label encoding, train/test split |
| **Pandas & NumPy** | Data cleaning, feature engineering (28 features from 18 raw) |

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11** | Core language |
| **FastAPI** | High-performance async REST API — 7 endpoints |
| **ReportLab** | Server-side PDF generation with Platypus layout engine |
| **Google Generative AI** | Gemini Vision + Gemini Chat integration |
| **python-multipart** | Multipart file upload handling for image analysis |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based UI with hooks |
| **JavaScript ES6+** | Async/await, custom hooks, debouncing |
| **Custom CSS Design System** | Dark theme with CSS variables, animations |
| **Recharts** | Interactive charts — bar, line, area charts |

### Deployment
| Service | Purpose |
|---|---|
| **Render** | Backend hosting — Python web service |
| **Vercel** | Frontend hosting — CDN-distributed React build |
| **GitHub** | Version control and CI/CD trigger |

---

## 📁 Project Structure

```
house-price-prediction/
│
├── house-ml-backend/
│   ├── app.py                  # FastAPI app — 7 endpoints
│   ├── model.pkl               # Trained XGBoost model
│   ├── le_city.pkl             # City label encoder
│   ├── le_furnishing.pkl       # Furnishing label encoder
│   ├── le_locality.pkl         # Locality label encoder
│   ├── metadata.json           # City stats, model metrics, feature names
│   ├── requirements.txt        # Python dependencies
│   └── train.py                # Model training script
│
└── house-frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── ChatBot.jsx         # Floating AI advisor widget
        │   ├── EMICalculator.jsx   # EMI breakdown calculator
        │   ├── PDFReport.jsx       # PDF download button
        │   ├── PriceCard.jsx       # Prediction result hero card
        │   ├── ShapExplainer.jsx   # SHAP waterfall chart
        │   ├── Sidebar.jsx         # Navigation sidebar
        │   ├── TrendChart.jsx      # Price trend visualization
        │   └── WhatIfAnalyzer.jsx  # Live slider re-predictor
        ├── pages/
        │   ├── About.jsx           # Developer profile page
        │   ├── Compare.jsx         # City comparison page
        │   ├── Dashboard.jsx       # Analytics dashboard
        │   ├── ImageAnalysis.jsx   # Vision AI upload page
        │   └── Predict.jsx         # Main prediction page
        ├── utils/
        │   └── api.js              # API utility functions
        ├── App.jsx                 # Root component + shared state
        └── index.css               # Global design system
```

---

## ⚙️ API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `GET` | `/metadata` | Cities, features, model stats |
| `POST` | `/predict` | Price prediction with luxury multiplier |
| `POST` | `/explain` | SHAP feature attribution |
| `POST` | `/report` | PDF report generation |
| `POST` | `/chat` | Gemini AI chatbot |
| `POST` | `/estimate-image` | Vision AI image analysis |
| `GET` | `/compare` | Multi-city price comparison |

---

## 🏃 Run Locally

### Prerequisites
- Python 3.9+
- Node.js 16+
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### Backend Setup
```bash
# Clone the repo
git clone https://github.com/GAURAVVVVVVVVVVVVV/house-price-prediction.git
cd house-price-prediction/house-ml-backend

# Install dependencies
pip install -r requirements.txt

# Set your Gemini API key
# Windows PowerShell:
[System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY","your-key-here","User")

# Start the server
uvicorn app:app --reload
# API running at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Frontend Setup
```bash
cd ../house-frontend

# Install dependencies
npm install

# Start the dev server
npm start
# App running at http://localhost:3000
```

---

## 🧠 Model Details

### Dataset
- **12,000+ records** of Indian residential properties
- **5 cities:** Mumbai, Bangalore, Pune, Hyderabad, Nagpur
- **18 raw features:** BHK, area, location, age, amenities, distances, crime rate

### Feature Engineering (28 total)
```python
area_efficiency       = carpet_area / super_area        # space utilization ratio
floor_ratio           = floor_no / total_floors          # relative floor position
rooms_per_100sqft     = (bhk + bathrooms) / (area/100)  # density metric
proximity_score       = 1 / (metro_dist + city_dist + 1) # transit accessibility
services_score        = 1 / (school_km + hospital_km + 1) # amenity access
safety_score          = 100 - crime_rate_index           # normalized safety
is_premium / is_budget = locality tier binary flags
is_new_property       = age <= 2 years flag
```

### Training
```python
Model:      XGBoost Regressor
Target:     log(price)  ← log transform for price skewness
Train/Test: 80/20 split
R² Score:   0.9841
RMSE:       ~₹2.1L on test set
```

### Luxury Multiplier
For properties outside the typical ₹30L–₹5Cr training range:
```python
if super_area > 3000 or bhk >= 4 or (locality == "Premium" and area > 2000):
    # Apply city × locality × furnishing × amenity × bhk multipliers
    # Blend with base ML prediction weighted by area factor
```

---

## 🌐 Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | `https://house-price-prediction-nql7ipndg.vercel.app` |
| Backend | Render | `https://prophetai-backend.onrender.com` |

> ⚠️ **Note:** Render free tier spins down after 15 minutes of inactivity.  
> First request after idle may take 30–50 seconds to wake up.

---

## 👨‍💻 Developer

<div align="center">

**Gaurav Mehta**  
*Developer & ML Engineer*

[![GitHub](https://img.shields.io/badge/GitHub-GAURAVVVVVVVVVVVVV-181717?style=for-the-badge&logo=github)](https://github.com/GAURAVVVVVVVVVVVVV)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Gaurav_Mehta-0a66c2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/gaurav-mehta-324431318/)
[![Instagram](https://img.shields.io/badge/Instagram-@gauravvmehtaaa-e1306c?style=for-the-badge&logo=instagram)](https://www.instagram.com/gauravvmehtaaa)

*Every line of code, every model weight, every UI component —  
designed, built and shipped by one developer.*

</div>

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**⭐ If you found this project impressive, please star the repository!**

*Built with Python · FastAPI · React · XGBoost · SHAP · Gemini AI*

</div>
