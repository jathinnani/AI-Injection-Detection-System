import os

SPLUNK_URL = os.getenv("SPLUNK_URL", "").rstrip("/")
SPLUNK_API_TOKEN = os.getenv("SPLUNK_API_TOKEN", "")
SPLUNK_HEC_URL = os.getenv("SPLUNK_HEC_URL", "").rstrip("/")
SPLUNK_HEC_TOKEN = os.getenv("SPLUNK_HEC_TOKEN", "")
MAX_ALERTS = 50
