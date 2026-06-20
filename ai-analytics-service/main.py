from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import os
import logging
from apscheduler.schedulers.background import BackgroundScheduler
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-analytics-service")

app = FastAPI(title="AI Analytics Service", description="AI and Predictive Analytics for Patient Management")

# Load ML model
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'no_show_model.pkl')
try:
    no_show_model = joblib.load(MODEL_PATH)
    logger.info("Successfully loaded no-show predictive model.")
except Exception as e:
    logger.warning(f"Could not load no-show model (expected if not trained yet): {e}")
    no_show_model = None

# -----------------
# 1. AI-Driven Triage
# -----------------
class TriageRequest(BaseModel):
    patient_id: int
    symptoms: str

class TriageResponse(BaseModel):
    recommended_action: str
    urgency: str

@app.post("/api/ai/triage", response_model=TriageResponse)
async def ai_triage(request: TriageRequest):
    """
    Mock AI-Driven Triage Endpoint.
    Uses LLM API if keys are available, otherwise falls back to a mock response.
    """
    api_key = os.getenv("LLM_API_KEY")
    if api_key:
        # TODO: Implement actual LLM call
        pass
    
    # Mock Fallback logic
    symptoms_lower = request.symptoms.lower()
    if any(keyword in symptoms_lower for keyword in ["pain", "bleeding", "severe", "fever"]):
        return TriageResponse(recommended_action="Schedule an urgent appointment", urgency="HIGH")
    else:
        return TriageResponse(recommended_action="Schedule a routine check-up", urgency="LOW")

# -----------------
# 2. Predictive No-Show
# -----------------
class PredictRequest(BaseModel):
    age: int
    previous_no_shows: int
    days_until_appointment: int
    is_weekend: int

class PredictResponse(BaseModel):
    no_show_probability: float
    will_no_show: bool

@app.post("/api/ai/predict-no-show", response_model=PredictResponse)
async def predict_no_show(request: PredictRequest):
    """
    Predictive No-Show Analytics leveraging historical data model.
    """
    if not no_show_model:
        raise HTTPException(status_code=503, detail="Model not loaded or trained yet.")
    
    # Format input for scikit-learn
    import pandas as pd
    input_data = pd.DataFrame([{
        'age': request.age,
        'previous_no_shows': request.previous_no_shows,
        'days_until_appointment': request.days_until_appointment,
        'is_weekend': request.is_weekend
    }])
    
    prob = no_show_model.predict_proba(input_data)[0][1]
    prediction = no_show_model.predict(input_data)[0]
    
    return PredictResponse(
        no_show_probability=float(prob),
        will_no_show=bool(prediction)
    )

# -----------------
# 3. Automated Follow-up Cron (Mock)
# -----------------
def automated_follow_up_job():
    """
    Mock cron-job worker that checks for appointments 3-5 days in the past
    and dispatches follow-up WhatsApp/SMS messages.
    """
    logger.info(f"[{datetime.datetime.now()}] CRON: Running Automated Follow-up AI Job...")
    # In a real implementation, this would:
    # 1. Query the database for past appointments.
    # 2. Check if a follow-up message has already been sent.
    # 3. Dispatch SMS/WhatsApp via Twilio API.
    logger.info("CRON: Sent 0 mock follow-up messages. (Keys not provided)")

scheduler = BackgroundScheduler()
# Run every day at 10:00 AM (for testing, we'll run it every 5 minutes)
scheduler.add_job(automated_follow_up_job, 'interval', minutes=5)

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    logger.info("Automated Follow-up Cron Job Scheduler Started.")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    logger.info("Automated Follow-up Cron Job Scheduler Shut Down.")

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-analytics-service"}
