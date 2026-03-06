import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from xgboost import XGBRegressor
import joblib, json, warnings
warnings.filterwarnings("ignore")

print("="*55)
print("  HOUSE PRICE ML TRAINER v4.0")
print("  Dataset: India House Price (12K)")
print("="*55)

# ── Load Data ─────────────────────────────────────────────────
df = pd.read_csv("data/house_price_dataset_india_12k.csv")
print(f"\n✅ Loaded: {df.shape[0]} rows × {df.shape[1]} cols")
print(f"✅ Cities: {df['City'].value_counts().to_dict()}")
print(f"✅ Null values: {df.isnull().sum().sum()} (perfect!)")

# ── Drop unused columns ───────────────────────────────────────
df = df.drop(columns=["House_ID", "Price_per_sqft_INR"])

# ── Remove price outliers (1st–99th percentile) ───────────────
Q1  = df["Market_Price_INR"].quantile(0.01)
Q99 = df["Market_Price_INR"].quantile(0.99)
df  = df[(df["Market_Price_INR"] >= Q1) & (df["Market_Price_INR"] <= Q99)]
print(f"✅ After outlier removal: {len(df)} rows")
print(f"✅ Price range: ₹{df['Market_Price_INR'].min():,.0f} — ₹{df['Market_Price_INR'].max():,.0f}")

# ── Feature Engineering ───────────────────────────────────────

# 1. Area efficiency ratio
df["Area_Efficiency"]    = df["Carpet_Area_sqft"] / df["Super_Area_sqft"]

# 2. Floor ratio (which floor out of total)
df["Floor_Ratio"]        = df["Floor_No"] / df["Total_Floors"].replace(0, 1)

# 3. Rooms per area
df["Rooms_per_100sqft"]  = (df["BHK"] + df["Bathrooms"]) / (df["Super_Area_sqft"] / 100)

# 4. Proximity score (lower distance = better)
df["Proximity_Score"]    = 1 / (df["Distance_to_Metro_km"] + df["Distance_to_CityCenter_km"] + 1)

# 5. Nearby services (school + hospital closeness)
df["Services_Score"]     = 1 / (df["Nearby_School_km"] + df["Nearby_Hospital_km"] + 1)

# 6. Safety score (inverse of crime)
df["Safety_Score"]       = 100 - df["Crime_Rate_Index"]

# 7. Premium location flag
df["Is_Premium"]         = (df["Locality_Tier"] == "Premium").astype(int)
df["Is_Budget"]          = (df["Locality_Tier"] == "Budget").astype(int)

# 8. New property flag
df["Is_New_Property"]    = (df["Property_Age_years"] <= 2).astype(int)

# ── Encode Categorical Columns ────────────────────────────────
le_city        = LabelEncoder()
le_furnishing  = LabelEncoder()
le_locality    = LabelEncoder()

df["City_enc"]        = le_city.fit_transform(df["City"])
df["Furnishing_enc"]  = le_furnishing.fit_transform(df["Furnishing"])
df["Locality_enc"]    = le_locality.fit_transform(df["Locality_Tier"])

# ── City-level price stats (powerful feature) ─────────────────
city_stats = df.groupby("City")["Market_Price_INR"].agg(
    city_median="median", city_mean="mean"
).reset_index()
df = df.merge(city_stats, on="City", how="left")
df["Price_vs_CityMedian"] = df["Market_Price_INR"] / df["city_median"]  # for analysis only

# ── LOG transform target ──────────────────────────────────────
df["log_price"] = np.log1p(df["Market_Price_INR"])

# ── Feature Set ───────────────────────────────────────────────
FEATURES = [
    # Core property
    "BHK",
    "Bathrooms",
    "Super_Area_sqft",
    "Carpet_Area_sqft",
    "Floor_No",
    "Total_Floors",
    "Property_Age_years",
    "Parking",

    # Amenities
    "Lift",
    "Gated_Society",

    # Location
    "City_enc",
    "Locality_enc",
    "Distance_to_Metro_km",
    "Distance_to_CityCenter_km",
    "Nearby_School_km",
    "Nearby_Hospital_km",
    "Crime_Rate_Index",
    "city_median",

    # Engineered
    "Area_Efficiency",
    "Floor_Ratio",
    "Rooms_per_100sqft",
    "Proximity_Score",
    "Services_Score",
    "Safety_Score",
    "Is_Premium",
    "Is_Budget",
    "Is_New_Property",

    # Encoded
    "Furnishing_enc",
]

print(f"\n✅ Total features: {len(FEATURES)}")

X = df[FEATURES].fillna(0)
y = df["log_price"]

# ── Train / Test Split ────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"✅ Train: {len(X_train)} | Test: {len(X_test)}")

# ── Train XGBoost ─────────────────────────────────────────────
print("\n🚀 Training XGBoost model...")
model = XGBRegressor(
    n_estimators     = 1000,
    learning_rate    = 0.02,
    max_depth        = 7,
    subsample        = 0.85,
    colsample_bytree = 0.8,
    min_child_weight = 3,
    gamma            = 0.05,
    reg_alpha        = 0.1,
    reg_lambda       = 1.0,
    random_state     = 42,
    verbosity        = 0,
    early_stopping_rounds = 50,
    eval_metric      = "rmse",
)
model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    verbose=False
)

# ── Evaluate ──────────────────────────────────────────────────
y_pred_log    = model.predict(X_test)
y_pred_actual = np.expm1(y_pred_log)
y_test_actual = np.expm1(y_test)

r2   = r2_score(y_test_actual, y_pred_actual)
mae  = mean_absolute_error(y_test_actual, y_pred_actual)
rmse = np.sqrt(mean_squared_error(y_test_actual, y_pred_actual))
mape = np.mean(np.abs((y_test_actual - y_pred_actual) / y_test_actual)) * 100

print(f"\n{'='*55}")
print(f"  MODEL PERFORMANCE")
print(f"{'='*55}")
print(f"  R² Score  : {r2:.4f}   {'✅ GREAT!' if r2>=0.8 else '✅ GOOD' if r2>=0.65 else '⚠️  OK'}")
print(f"  MAE       : ₹{mae:,.0f}")
print(f"  RMSE      : ₹{rmse:,.0f}")
print(f"  MAPE      : {mape:.1f}%")
print(f"{'='*55}")

# ── Feature Importance ────────────────────────────────────────
importances = dict(zip(FEATURES, model.feature_importances_))
importances_sorted = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))
print(f"\n✅ Top 10 Feature Importances:")
for i, (feat, imp) in enumerate(importances_sorted.items()):
    if i >= 10: break
    bar = "█" * int(imp * 80)
    print(f"  {feat:<30} {bar} {imp:.4f}")

# ── City-wise stats ───────────────────────────────────────────
print(f"\n✅ City-wise Median Prices:")
for _, row in city_stats.iterrows():
    print(f"  {row['City']:<15} ₹{row['city_median']:,.0f}")

# ── Unique values for API ─────────────────────────────────────
cities        = sorted(df["City"].unique().tolist())
furnishings   = sorted(df["Furnishing"].unique().tolist())
locality_tiers= sorted(df["Locality_Tier"].unique().tolist())

print(f"\n✅ Cities:         {cities}")
print(f"✅ Furnishings:    {furnishings}")
print(f"✅ Locality Tiers: {locality_tiers}")

# ── Save everything ───────────────────────────────────────────
joblib.dump(model,          "model.pkl")
joblib.dump(le_city,        "le_city.pkl")
joblib.dump(le_furnishing,  "le_furnishing.pkl")
joblib.dump(le_locality,    "le_locality.pkl")

city_stats_dict = {
    row["City"]: {
        "city_median": float(row["city_median"]),
        "city_mean":   float(row["city_mean"]),
    }
    for _, row in city_stats.iterrows()
}

metadata = {
    "features":           FEATURES,
    "cities":             cities,
    "furnishings":        furnishings,
    "locality_tiers":     locality_tiers,
    "model_stats": {
        "r2":               round(r2, 4),
        "mae":              round(float(mae), 0),
        "rmse":             round(float(rmse), 0),
        "mape":             round(float(mape), 2),
        "training_samples": len(X_train),
        "test_samples":     len(X_test),
    },
    "feature_importances": {
        k: round(float(v), 4) for k, v in importances_sorted.items()
    },
    "city_stats": city_stats_dict,
}

with open("metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print(f"\n✅ model.pkl              saved")
print(f"✅ le_city.pkl            saved")
print(f"✅ le_furnishing.pkl      saved")
print(f"✅ le_locality.pkl        saved")
print(f"✅ metadata.json          saved")
print(f"\n🎉 Training complete!")
print(f"   Next step: uvicorn app:app --reload")