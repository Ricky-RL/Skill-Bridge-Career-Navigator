"""Script to seed job postings into Supabase database."""

import json
import os
import sys

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

# Create client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load job postings from JSON
data_path = os.path.join(os.path.dirname(__file__), "..", "data", "job_postings.json")
with open(data_path, "r") as f:
    job_postings = json.load(f)

print(f"Found {len(job_postings)} job postings to seed")

# Clear existing job postings (optional - comment out to append)
print("Clearing existing job postings...")
try:
    supabase.table("job_postings").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    print("Cleared existing job postings")
except Exception as e:
    print(f"Warning: Could not clear existing postings: {e}")

# Insert job postings
print("Inserting job postings...")
for i, posting in enumerate(job_postings):
    try:
        result = supabase.table("job_postings").insert(posting).execute()
        print(f"  [{i+1}/{len(job_postings)}] Inserted: {posting['company']} - {posting['title']}")
    except Exception as e:
        print(f"  [{i+1}/{len(job_postings)}] Error inserting {posting['company']} - {posting['title']}: {e}")

print("\nDone! Job postings seeded successfully.")
