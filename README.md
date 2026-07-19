# FitFlow - Client Intelligence Dashboard

FitFlow is an interactive client intelligence portal designed for health and fitness coaches. It parses daily chat logs between coaches and clients and converts unstructured text into organized, actionable client intelligence metrics.

The system features a **Fact-Checking Hierarchy** (Factual Layering) that separates findings into Confirmed Facts, Client-Reported claims, AI-generated inferences, and Missing Information to ensure safety and precision.

## Key Features

* **Visual Client Dashboard**: A responsive, modern single-page dashboard displaying weekly summaries, sleep, nutrition, steps, water, symptoms, stress, risk flags, barriers, and next coach actions.
* **Factual Layering Badge System**: Color-coded badges classifying each finding's level of certainty.
* **Citations & Evidence Linker**: A slide-out side-drawer that displays the original conversation transcript and highlights the exact quotes supporting any metric card.
* **Human-in-the-Loop Reviews**: Interactive Approve, Edit, and Reject actions on all dashboard items, enabling coaches to audit and override AI outputs.
* **Interactive Editing Modal**: Inline editing modal to modify the text details of any category.
* **JSON Export**: Downloads the audited client report directly to your machine as a serialized dataset.
* **Dual Analysis Modes**:
  * **Live Mode**: Sends transcripts to OpenAI's GPT-4o model for real-time extraction using the API key defined in your `.env`.
  * **Fallback Mode**: Automatically detects if no API key is set and falls back to a pre-compiled JSON response for the 8-day conversation logs, making the system instantly runnable.

## Project Structure

```text
client-intelligence-dashboard/
│
├── app.py                  # FastAPI Python backend (routes, schema, and API controller)
├── requirements.txt        # Python package dependencies
├── .env                    # Local environment config (API Key)
└── static/                 # Frontend SPA directory
    ├── index.html          # Core workspace structure
    ├── style.css           # Styling layout (dark theme, badges, drawers)
    └── app.js              # DOM operations, API callers, and review controllers
```

## Setup & Local Run

### Prerequisites
* Python 3.8+ installed on your system.

### Steps
1. Clone the repository to your local machine.
2. Open your terminal in the project directory.
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your API key (optional) in a `.env` file:
   ```text
   OPENAI_API_KEY="your-api-key-here"
   ```
5. Run the application:
   ```bash
   python app.py
   ```
6. Open your browser and navigate to:
   ```text
   http://127.0.0.1:8000
   ```
