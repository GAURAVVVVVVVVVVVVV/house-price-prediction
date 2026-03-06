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
<img width="1918" height="912" alt="image" src="https://github.com/user-attachments/assets/88f00499-57ba-4485-916e-000e582f79be" />
<img width="1919" height="907" alt="image" src="https://github.com/user-attachments/assets/a51ed86b-ff00-42f0-a6ab-7db6d7a47a96" />
<img width="1919" height="915" alt="image" src="https://github.com/user-attachments/assets/7d0c2b76-1f37-4c4a-b0ff-a0c272a1a5aa" />
<img width="1919" height="914" alt="image" src="https://github.com/user-attachments/assets/c3673d47-4483-4674-80a3-e8490deb932f" />


---

## ✦ What Makes This Different

Most ML projects stop at training a model and showing accuracy. **ProphetAI goes 5 layers deeper:**

```
Layer 1 — XGBoost Model          R²=0.984, trained on 12K Indian housing records
Layer 2 — SHAP Explainability    Every prediction explained with feature attribution
Layer 3 — Vision AI              Gemini Vision scores property photos, adjusts price
Layer 4 — PDF Report Export      Branded 2-page valuation report with EMI scenarios
Layer 5 — AI Chatbot             Context-aware Gemini advisor knows your exact property
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

---


---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**⭐ If you found this project impressive, please star the repository!**

*Built with Python · FastAPI · React · XGBoost · SHAP · Gemini AI*

</div>
