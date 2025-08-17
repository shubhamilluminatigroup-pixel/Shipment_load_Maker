# llm_route_planner.py

import json
import requests
from sqlalchemy.orm import Session
from models import Truck, Shipment
import google.generativeai as genai
import re

# ===================== CONFIGURE GEMINI ===================== #
genai.configure(api_key="AIzaSyCi-t3t3oQw-GGXB3LB4IHsoVIfLJ4sX4E")

model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    system_instruction=(
        "You are a helpful logistics assistant. "
        "Only return valid JSON output. Do not include any explanation, notes, or markdown. "
        "Respond with a plain JSON array of route plans in the format:\n"
        " Just focus on clubbing shipment based on destination, donot consider weight and volume "
        "[\n"
        "  {\n"
        "    \"truck_number\": \"RJ14AB1234\",\n"
        "    \"shipment_ids\": [\"shipment1\", \"shipment2\"],\n"
        "  }\n"
        "]"
    )
)

# ===================== FETCH DB DATA ===================== #
def fetch_truck_shipment_data(db: Session):
    trucks = db.query(Truck).all()
    shipments = db.query(Shipment).all()
    return trucks, shipments

# ===================== FORMAT LLM PROMPT ===================== #
def format_input_for_llm(trucks, shipments):
    data = {
        "trucks": [
            {
                "id": str(truck.truck_id),
                "truck_number": truck.registration_number,
                "capacity_kg": truck.capacity_kg,
                "capacity_volume": truck.available_volume_cubic_m,
                "current_location": {
                    "lat": truck.current_location_lat,
                    "lng": truck.current_location_lng
                },
                "shipment_ids": json.loads(truck.shipment_ids if truck.shipment_ids else "[]")
            } for truck in trucks
        ],
        "shipments": [
            {
                "id": str(shipment.shipment_id),
                "origin_address_city": shipment.origin_address.get("city"),
                "origin_address_state": shipment.origin_address.get("state"),
                "origin_lat": shipment.origin_lat,
                "origin_lng": shipment.origin_lng,
                "destination_address_city": shipment.destination_address.get("city"),
                "destination_address_state": shipment.destination_address.get("state"),
                "destination_lat": shipment.destination_lat,
                "destination_lng": shipment.destination_lng,
                "weight": shipment.weight,
                "volume": shipment.volume,
                "value": shipment.value
            } for shipment in shipments
        ]
    }

    prompt = f"""
You are a logistics optimization expert. Given the following truck and shipment data, generate an optimal route plan.
Make sure to:
- Respect truck weight and volume limits
- Group shipments efficiently by location and capacity
- Minimize total route distance
- Assign multiple shipments to a single truck if they are on same route
- dont assign same truck to shipment with different origin and destination
- Do not assign a shipment if it exceeds the truck’s capacity
- Consider origin and destination coordinates for route planning
- 

### Truck Data:
{json.dumps(data['trucks'], indent=2)}

### Shipment Data:
{json.dumps(data['shipments'], indent=2)}

### Output Format:
Return a list of route plans like this:
[
  {{
    "truck_number": "RJ14AB1234",
    "shipment_ids": ["shipment1", "shipment2"],
  }},
  ...
]
Only respond with valid JSON.
"""
    return prompt

# ===================== CALL GEMINI API ===================== #
def call_gemini_api(prompt: str) -> str:
    try:
        response = model.generate_content(prompt)
        print("Gemini API response:", response.text)  # Debug
        return response.text
    except Exception as e:
        raise RuntimeError(f"Gemini API call failed: {e}")


def extract_json(text: str) -> str:
    """
    Extracts the first valid JSON array or object from the text.
    """
    json_match = re.search(r"(\[.*\]|\{.*\})", text, re.DOTALL)
    if not json_match:
        raise ValueError("No valid JSON structure found in Gemini response")
    return json_match.group(1)



# ===================== MAIN ROUTE PLANNER ===================== #
def get_optimal_route_plan(db: Session):
    # Step 1: Get trucks and shipments
    trucks, shipments = fetch_truck_shipment_data(db)

    # Step 2: Format prompt
    prompt = format_input_for_llm(trucks, shipments)

    # Step 3: Call Gemini API
    llm_response = call_gemini_api(prompt)
    print("LLM Raw Response:", llm_response)  # Debugging log

    # Step 4: Parse LLM JSON (with cleaning)
    try:
        cleaned_response = extract_json(llm_response)
        route_plan = json.loads(cleaned_response)
    except json.JSONDecodeError as e:
        raise ValueError(f"JSON decoding failed: {e}")
    except Exception as e:
        raise ValueError(f"Gemini response error: {e}")

    # Step 5: Update shipment.vehicle_number based on truck_number
    for plan in route_plan:
        truck_number = plan.get("truck_number")
        shipment_ids = plan.get("shipment_ids", [])

        if not truck_number:
            print("Skipping plan with missing truck_number")
            continue

        for sid in shipment_ids:
            shipment = db.query(Shipment).filter_by(shipment_id=sid).first()
            if shipment:
                shipment.vehicle_id = truck_number  # Update
                print(f"Updated shipment {sid} with vehicle {truck_number}")
            else:
                print(f"Shipment ID {sid} not found in DB")

    # Step 6: Commit updates
    db.commit()
    print("Shipment records updated and committed to DB")

    return route_plan
