import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
import uvicorn
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Client Intelligence Analyzer API",
    version="1.0.0"
)

class EvidenceItem(BaseModel):
    text: str
    day: Optional[int] = None

class FactTypeItem(BaseModel):
    value: str
    fact_type: str
    evidence: List[EvidenceItem] = []

class MetricAdherence(BaseModel):
    status: str
    details: str
    data_points: List[FactTypeItem]

class KeyBarrier(BaseModel):
    barrier: str
    details: str
    fact_type: str = "AI Inference"
    evidence: List[EvidenceItem]

class PendingAction(BaseModel):
    action: str
    assignee: str
    status: str = "Pending"
    evidence: List[EvidenceItem] = []

class RiskFlag(BaseModel):
    flag: str
    severity: str
    details: str
    evidence: List[EvidenceItem]

class NextAction(BaseModel):
    action: str
    rationale: str
    priority: str

class ClientIntelligence(BaseModel):
    client_name: str
    client_age: Optional[str] = None
    client_occupation: Optional[str] = None
    client_goal: Optional[str] = None
    weekly_summary: str
    engagement_level: FactTypeItem
    nutrition: MetricAdherence
    exercise_steps: MetricAdherence
    sleep: MetricAdherence
    water: MetricAdherence
    symptoms_stress: MetricAdherence
    key_barriers: List[KeyBarrier]
    pending_actions: List[PendingAction]
    risk_flags: List[RiskFlag]
    recommended_next_actions: List[NextAction]

class AnalysisRequest(BaseModel):
    transcript: str

MOCK_INTELLIGENCE = {
    "client_name": "Priya Sharma",
    "client_age": "34 yrs",
    "client_occupation": "School Teacher",
    "client_goal": "Fat Loss & Routine Structure",
    "weekly_summary": "Priya Sharma is a school teacher navigating high work pressure (office politics, hectic schedule) alongside her family commitments (daughter's exams). While she demonstrates high initial commitment and positive attitude, her routine collapses under the weight of school mornings and office stress, leading to extreme sleep deprivation (averaging ~5.8 hours, falling asleep at a meeting) and digestive symptoms (acidity, bloating). She experiences frustration over weight fluctuations despite reduced food intake, showing a critical need for education on stress-induced bloating and basic metabolic health.",
    "engagement_level": {
        "value": "High",
        "fact_type": "AI Inference",
        "evidence": [
            {"text": "Please keep sharing your daily updates...", "day": 1},
            {"text": "Walk and water done.", "day": 2},
            {"text": "Forgot to mention, I had roasted chana...", "day": 5},
            {"text": "Sorry I missed your call. There was a stressful situation at work.", "day": 7}
        ]
    },
    "nutrition": {
        "status": "Suboptimal & Inconsistent",
        "details": "Client is eating significantly less ('almost half of what I used to eat') and occasionally skipping meals due to school rushes. Protein is chronically low, especially at breakfast, and veggies/sprouts are inconsistent due to stocking delays. ACV habit is still developing.",
        "data_points": [
            {
                "value": "Eating almost half of normal portions",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "eating almost half of what I used to eat", "day": 5}]
            },
            {
                "value": "Protein intake is low in breakfasts",
                "fact_type": "AI Inference",
                "evidence": [{"text": "Protein seems low in breakfast on some days", "day": 5}, {"text": "I didn't have sprouts today.", "day": 5}]
            },
            {
                "value": "Skips meals and eats small portions at night",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Didn't eat much in the evening. Just a small piece of paneer.", "day": 2}, {"text": "No. I didn't get time [to eat breakfast/lunch].", "day": 3}]
            },
            {
                "value": "Forgot Apple Cider Vinegar (ACV) on Day 3",
                "fact_type": "Confirmed Fact",
                "evidence": [{"text": "Forgot ACV today. Not yet in the habit.", "day": 3}]
            },
            {
                "value": "Stocking vegetables delayed until Day 2",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "No. I still need to stock vegetables properly. Will do it tomorrow.", "day": 1}]
            }
        ]
    },
    "exercise_steps": {
        "status": "Inconsistent (Active but variable)",
        "details": "Movement pattern is high due to house chores (sweeping, mopping) and walks, but structured steps fluctuate between 4,500 and 8,000. Incorporates stretching, breathing, and light running.",
        "data_points": [
            {
                "value": "Average of 7,333 steps on reported days",
                "fact_type": "Confirmed Fact",
                "evidence": [
                    {"text": "Steps around 8,000", "day": 3},
                    {"text": "4,500 steps so far", "day": 4},
                    {"text": "Steps 6,000 today", "day": 7},
                    {"text": "Steps around 8,000", "day": 8}
                ]
            },
            {
                "value": "Performs active domestic labor",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Did some mopping, sweeping, Surya Namaskar and walking inside", "day": 1}, {"text": "Did mopping and sweeping also, lots of movement.", "day": 7}]
            },
            {
                "value": "Incorporates stretching and light running",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Did around 20 minutes walking, stretching and breathing today.", "day": 4}, {"text": "Did 20 minutes stretching and running.", "day": 5}, {"text": "Did 30 minutes exercise.", "day": 8}]
            }
        ]
    },
    "sleep": {
        "status": "Severely Deficient",
        "details": "Client suffers from chronic sleep deprivation, averaging just 5.8 hours per night. This is caused by checking exam prep with her daughter and work-related late nights, leading to a critical fatigue episode where she fell asleep at her desk.",
        "data_points": [
            {
                "value": "5 hours sleep on Day 1 and Day 3",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Slept only around 5 hours last night.", "day": 1}, {"text": "Sleep 5 hours", "day": 3}]
            },
            {
                "value": "5.5 hours sleep on Day 7",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Sleep around 5.5 hours.", "day": 7}]
            },
            {
                "value": "8 hours recovery sleep on Day 8",
                "fact_type": "Confirmed Fact",
                "evidence": [{"text": "Slept better last night, around 8 hours.", "day": 8}]
            },
            {
                "value": "Sleep details missing for Days 2, 4, 5, 6",
                "fact_type": "Missing/Unavailable",
                "evidence": []
            }
        ]
    },
    "water": {
        "status": "Incomplete Data (Estimated Adherent)",
        "details": "Quantified water intake is only reported on Day 3 (4L) and Day 8 (3.5L). Other days are marked as 'done' but without specific volumes, creating a tracking blindspot.",
        "data_points": [
            {
                "value": "Water 4 Litres on Day 3",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Water 4 litres", "day": 3}]
            },
            {
                "value": "Water 3.5 Litres on Day 8",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Water around 3.5 litres.", "day": 8}]
            },
            {
                "value": "Volume missing for Days 1, 2, 4, 5, 6, 7",
                "fact_type": "Missing/Unavailable",
                "evidence": [{"text": "Walk and water done.", "day": 2}]
            }
        ]
    },
    "symptoms_stress": {
        "status": "High Stress & Moderate Digestive Symptoms",
        "details": "Recurrent acidity and bloating, starting on Day 1, which the client attributes to late sleep and high workloads. Stress peaked on Day 7 due to intense office politics, leading to extreme sleepiness.",
        "data_points": [
            {
                "value": "Acidity and bloating recur on Days 1, 2, 6, 8",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "Feeling some acidity since morning", "day": 1}, {"text": "Still having acidity and bloating", "day": 2}, {"text": "Bloating is back", "day": 6}, {"text": "Still having bloating on and off.", "day": 8}]
            },
            {
                "value": "Office politics and pressure at school",
                "fact_type": "Client-Reported",
                "evidence": [{"text": "There is a lot of office pressure and politics going on.", "day": 7}]
            },
            {
                "value": "Acidity triggered by stress and sleep deprivation, not food",
                "fact_type": "AI Inference",
                "evidence": [{"text": "Got up with acidity. Slept very late and did a lot of work today.", "day": 1}]
            }
        ]
    },
    "key_barriers": [
        {
            "barrier": "Hectic Work Schedule & Office Politics",
            "details": "High stress and meeting schedule at her school job deplete her time and energy, causing her to skip meals and miss calls.",
            "evidence": [{"text": "I had to go to school after a few days. Very hectic morning.", "day": 3}, {"text": "There is a lot of office pressure and politics going on.", "day": 7}]
        },
        {
            "barrier": "Lack of meal planning/prep time",
            "details": "Client relies on ordering food/sprouts and admits that she lacks the time to properly prep her meals, which leads to skipping protein.",
            "evidence": [{"text": "I am not getting enough time to plan meals.", "day": 6}]
        },
        {
            "barrier": "Chronic sleep deficit",
            "details": "Sleeping 5-5.5 hours leaves her exhausted, triggering acidity, bloating, and preventing consistent physical performance.",
            "evidence": [{"text": "During a meeting today I was so tired that my head went down on the table and I actually slept for a few seconds.", "day": 7}]
        }
    ],
    "pending_actions": [
        {
            "action": "Stock fresh vegetables for salad",
            "assignee": "Client",
            "status": "Completed",
            "evidence": [{"text": "I still need to stock vegetables properly. Will do it tomorrow.", "day": 1}, {"text": "Lunch had lots of vegetables...", "day": 3}]
        },
        {
            "action": "Set alarms/reminders for ACV",
            "assignee": "Client",
            "status": "Pending",
            "evidence": [{"text": "Set a reminder around meal timings. Yes, will do.", "day": 3}]
        },
        {
            "action": "Adjust daily routine around new school schedule",
            "assignee": "Both",
            "status": "In Progress",
            "evidence": [{"text": "Slowly we need to adjust the routine around your school schedule also.", "day": 3}]
        },
        {
            "action": "Establish consistent tracking for sleep, bloating, meals, and steps",
            "assignee": "Client",
            "status": "In Progress",
            "evidence": [{"text": "Let's continue tracking sleep, bloating, meals and movement consistently.", "day": 8}]
        }
    ],
    "risk_flags": [
        {
            "flag": "High Risk of Burnout & Extreme Fatigue",
            "severity": "Critical",
            "details": "Fell asleep at a conference table for several seconds. Combined with sleeping only 5 hours and experiencing office politics, this represents a severe fatigue risk.",
            "evidence": [{"text": "During a meeting today I was so tired that my head went down on the table and I actually slept for a few seconds.", "day": 7}]
        },
        {
            "flag": "Severe Caloric Under-nourishment",
            "severity": "High",
            "details": "Client claims to be eating 'half of what she used to eat' and skipping meals, yet is frustrated that weight is up. Under-eating and stress are raising cortisol, stalling progress, and causing bloating.",
            "evidence": [{"text": "Weight seems slightly up even though I'm eating almost half of what I used to eat.", "day": 5}, {"text": "Didn't eat much in the evening. Just a small piece of paneer.", "day": 2}]
        }
    ],
    "recommended_next_actions": [
        {
            "action": "Educate client on stress, cortisol, and temporary weight fluctuations",
            "rationale": "She is frustrated by weight gains despite eating less. Explaining that sleep deprivation and stress cause cortisol spikes and water retention will ease her anxiety and stop starvation behaviors.",
            "priority": "High"
        },
        {
            "action": "Transition to a Sleep-First strategy",
            "rationale": "Steps and physical exercise should be secondary to establishing a baseline of 7+ hours of sleep. Sleep debt is the primary driver of her acidity, fatigue, and low morning energy.",
            "priority": "High"
        },
        {
            "action": "Introduce zero-prep protein sources",
            "rationale": "Since meal prep time is her main barrier, recommend simple protein sources like roasted chana, Greek yogurt, or low-fat paneer that fit easily into a school schedule.",
            "priority": "Medium"
        }
    ]
}

OPENAI_SYSTEM_PROMPT = """
You are an expert Health and Fitness Coach. 
Analyze the coach-client chat history and return a structured JSON object containing client intelligence.

Classify every single finding into one of:
- "Confirmed Fact"
- "Client-Reported"
- "AI Inference"
- "Missing/Unavailable"

Structure requirements:
1. client_name: Extract the client's full name. If not explicitly mentioned, make a guess or use 'Unknown'.
2. client_age: Extract age (e.g. '34 yrs') or leave empty if unknown.
3. client_occupation: Extract occupation (e.g. 'School Teacher') or leave empty.
4. client_goal: Extract primary goal (e.g. 'Fat Loss') or leave empty.
5. weekly_summary: Overall synthesis.
6. engagement_level: {value: str, fact_type: str, evidence: [{text, day}]}
7. nutrition: {status, details, data_points: [{value, fact_type, evidence}]}
8. exercise_steps: {status, details, data_points}
9. sleep: {status, details, data_points}
10. water: {status, details, data_points}
11. symptoms_stress: {status, details, data_points}
12. key_barriers: [{barrier, details, evidence}]
13. pending_actions: [{action, assignee, status, evidence}]
14. risk_flags: [{flag, severity, details, evidence}]
15. recommended_next_actions: [{action, rationale, priority}]

Output raw JSON only. Do not wrap in markdown or backticks.
"""

def call_groq_api(transcript: str, api_key: str) -> dict:
    from openai import OpenAI
    client = OpenAI(
        api_key=api_key,
        base_url="https://api.groq.com/openai/v1"
    )
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": OPENAI_SYSTEM_PROMPT},
            {"role": "user", "content": transcript}
        ],
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)

@app.post("/api/analyze")
def analyze_conversation(request: AnalysisRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key or api_key.strip() == "":
        return MOCK_INTELLIGENCE
    try:
        return call_groq_api(request.transcript, api_key)
    except Exception as e:
        print("Error during Groq API execution:", str(e))
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
def read_index():
    static_index = os.path.join(os.path.dirname(__file__), "static", "index.html")
    if os.path.exists(static_index):
        return FileResponse(static_index)
    return {"message": "Static frontend files missing."}

static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)

app.mount("/", StaticFiles(directory=static_dir), name="static")

if __name__ == "__main__":
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
