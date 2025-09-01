from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from pydantic import BaseModel, Field, EmailStr, HttpUrl    
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session
from typing import List
from database import SessionLocal, engine
import models
import schemas
from schemas import ShipmentCreate, FixedWeightConfig, WeightConfigItem, Truckcreate
from dotenv import load_dotenv
from sqlalchemy import or_, and_, func
from pydantic import BaseModel, Field
import os
import requests
import json
from fastapi import FastAPI
from llm import get_optimal_route_plan
from shipment_delay_checker import assess_shipment_delays

OPENCAGE_API_KEY = os.getenv("OPENCAGE_API_KEY")

from priority_model import calculate_priority_scores
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# Create tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI()

# --- IMPORTANT ---
# Configure CORS to allow only your Vercel frontend URL
# This is a more secure practice than using allow_origins=["*"]
origins = [
    "https://shipment-load-maker.vercel.app",
    "https://shipment-load-maker-khjo.vercel.app" # The URL from your error screenshot
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# insert weight data
@app.post("/weights/fixed/")
def update_fixed_weights(config: FixedWeightConfig, db: Session = Depends(get_db)):
    # ✅ Clear all existing weights
    db.query(models.WeightConfig).delete()

    # ✅ Add new weights from the provided config
    new_weights = [
        models.WeightConfig(feature_name=feature, weight_value=value)
        for feature, value in config.dict().items()
    ]

    db.add_all(new_weights)
    db.commit()
    return {"message": "Weights overwritten successfully."}

# get all weights
@app.get("/weights/get", response_model=list[WeightConfigItem])
def get_all_weights(db: Session = Depends(get_db)):
    return db.query(models.WeightConfig).all()


# 🚀 BULK INSERT ENDPOINT shipment
@app.post("/shipments/bulk/")
def create_bulk_shipments(shipments: List[ShipmentCreate], db: Session = Depends(get_db)):
    shipment_objs = [models.Shipment(**shipment.dict()) for shipment in shipments]
    db.add_all(shipment_objs)
    db.commit()
    return {"message": f"{len(shipment_objs)} shipments inserted successfully"}

# Bulk truck enter

@app.post("/shipments/bulktruck/")
def create_bulk_trucks(trucks: List[Truckcreate], db: Session = Depends(get_db)):
    truck_objs = []

    for truck in trucks:
        truck_data = truck.dict()

        # Convert shipment_ids list to JSON string
        shipment_ids_list = truck_data.get("shipment_ids", [])
        truck_data["shipment_ids"] = json.dumps(shipment_ids_list)

        truck_objs.append(models.Truck(**truck_data))

    db.add_all(truck_objs)
    db.commit()

    return {"message": f"{len(truck_objs)} trucks inserted successfully"}




# ✅ GET all shipments
@app.get("/shipments/", response_model=List[schemas.Shipment])
def get_all_shipments(db: Session = Depends(get_db)):
    return db.query(models.Shipment).all()

@app.get("/shipments/no", response_model=List[schemas.ShipmentNo])
def get_all_shipments(db: Session = Depends(get_db)):
    shipments = db.query(models.Shipment).filter(
        or_(
            models.Shipment.origin_lat == None,
            models.Shipment.origin_lng == None,
            models.Shipment.destination_lat == None,
            models.Shipment.destination_lng == None
        )
    ).all()
    return shipments



# calculate priority scores
@app.post("/shipments/score/")
def calculate_and_update_priority_scores(db: Session = Depends(get_db)):
    shipments = db.query(models.Shipment).all()

    if not shipments:
        return {"message": "No shipments found."}

    scoring_input = []
    for s in shipments:
        scoring_input.append({
            "value": s.value,
            "weight": s.weight,
            "volume": s.volume,
            "shelf_life_days": s.shelf_life_days,
            "delivery_date": s.delivery_date
        })

    scores = calculate_priority_scores(scoring_input, db)

    for shipment, score in zip(shipments, scores):
        shipment.priority_score = float(score)

    db.commit()
    return {"message": f"Updated {len(scores)} shipments with priority scores."}


# cordinate fetch from adress

def get_coordinates_from_address(address: str) -> dict:
    api_key = os.getenv("OPENCAGE_API_KEY")
    if not api_key:
        raise ValueError("Missing OpenCage API key in environment variables.")

    url = "https://api.opencagedata.com/geocode/v1/json"
    params = {"q": address, "key": api_key, "limit": 1}
    response = requests.get(url, params=params)

    if response.status_code == 200:
        results = response.json().get("results")
        if results:
            loc = results[0]["geometry"]
            return {"lat": loc["lat"], "lng": loc["lng"]}
        else:
            return {}
    else:
        raise Exception(f"OpenCage API Error: {response.status_code} - {response.text}")


@app.post("/shipments/fill", response_model=List[schemas.Shipment])
def get_all_shipments(db: Session = Depends(get_db)):
    shipments = db.query(models.Shipment).filter(
        or_(
            models.Shipment.origin_lat == None,
            models.Shipment.origin_lng == None,
            models.Shipment.destination_lat == None,
            models.Shipment.destination_lng == None
        )
    ).all()

    updated_shipments = []
    for shipment in shipments:
        try:
            origin = shipment.origin_address
            dest = shipment.destination_address

            # Fill origin coordinates
            if shipment.origin_lat is None or shipment.origin_lng is None:
                origin_str = f"{origin['street']}, {origin['city']}, {origin['state']}, {origin['pincode']}, {origin['country']}"
                origin_coords = get_coordinates_from_address(origin_str)
                if origin_coords:
                    shipment.origin_lat = origin_coords["lat"]
                    shipment.origin_lng = origin_coords["lng"]

            # Fill destination coordinates
            if shipment.destination_lat is None or shipment.destination_lng is None:
                dest_str = f"{dest['street']}, {dest['city']}, {dest['state']}, {dest['pincode']}, {dest['country']}"
                dest_coords = get_coordinates_from_address(dest_str)
                if dest_coords:
                    shipment.destination_lat = dest_coords["lat"]
                    shipment.destination_lng = dest_coords["lng"]

            shipment.updated_at = datetime.utcnow()
            db.add(shipment)
            updated_shipments.append(shipment)

        except Exception as e:
            print(f"[ERROR] Shipment {shipment.shipment_id} failed to update: {e}")
            continue

    db.commit()
    return updated_shipments


@app.post("/optimize-routes/")
def optimize_routes(db: Session = Depends(get_db)):
    try:
        optimized_routes = get_optimal_route_plan(db)
        return {"optimized_routes": optimized_routes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/delay/")
def check_shipment_delays(db: Session = Depends(get_db)):
    try:
        delay_info = assess_shipment_delays(db)
        return {"shipment_delays": delay_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
