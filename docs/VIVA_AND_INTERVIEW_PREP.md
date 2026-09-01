# Viva & Technical Q&A Preparation Cheat Sheet
## Project: Proactive Threat Detection and Log Analysis (ZCS SIEM Lab)

---

### Q1: What is a SIEM, and why did you choose Splunk Enterprise?
**Answer**:
A Security Information and Event Management (SIEM) system centralizes log ingestion, indexing, correlation, and automated alerting across enterprise assets. Splunk Enterprise was selected because of its industry-standard indexing engine, real-time Search Processing Language (SPL), and versatile Dashboard Studio for creating Security Operations Center (SOC) metric widgets.

---

### Q2: Explain the Zimbra vulnerability (CVE-2024-45519) in simple terms.
**Answer**:
ZCS uses internal background scripts (`postjournal`, `snmp_notify`, and `swatchdog`) to monitor service health and send SNMP alerts. The software failed to sanitize user-controlled parameters passed to these internal utilities. Attackers pass Unix shell metacharacters (`;`, `|`, `&&`) which cause the subshell to execute malicious commands with the privileges of the Zimbra service.

---

### Q3: What does the detection search query do, and why is it effective?
**SPL Query**: `source="zimbra_traffic.log" "swatchdog" ("wget" OR "sh" OR "curl" OR "rm")`
**Answer**:
Under normal operations, `swatchdog` outputs status messages and monitoring text, but it should never execute interactive shell interpreters (`sh`, `bash`) or external download utilities (`wget`, `curl`). This query isolates the specific combination of the vulnerable component and dangerous system utilities, yielding high detection accuracy with near-zero false alarms.

---

### Q4: What is a Sigma rule, and why is it valuable to include?
**Answer**:
Sigma is an open, vendor-neutral rule format (in YAML) for expressing log detection signatures. While SPL is proprietary to Splunk, Sigma rules can be automatically converted into Splunk SPL, Elastic Query DSL, Microsoft Sentinel KQL, or QRadar QID. Adding a Sigma rule demonstrates enterprise-grade detection engineering that avoids vendor lock-in.

---

### Q5: How does the Single Value metric on your dashboard work?
**Answer**:
The dashboard uses the aggregation search:
`source="*zimbra*" ("swatchdog" OR "snmp_notify") ("wget" OR "sh" OR "curl" OR "rm") | stats count as "Malicious Payloads Detected"`
When only normal traffic is present, the count returns `0` (configured with green color threshold). When the simulated log containing the malicious payload is ingested, the count increments to `1` (triggering a red alert threshold), visually informing SOC analysts of an incident.

---

### Q6: How would you prevent False Positives in a larger enterprise?
**Answer**:
1. Field Extraction: Use regex field extraction to isolate the exact execution payload field rather than scanning whole raw logs.
2. Baselines: Whitelist legitimate administrative scripts or internal cron jobs if any legitimately invoke curl internally.
3. Correlation: Correlate the swatchdog log event with inbound network traffic and subsequent abnormal child processes spawned by the web server user.

---

### Q7: What are the MITRE ATT&CK techniques mapped in your project?
* **T1190**: Exploit Public-Facing Application (Initial Access vector)
* **T1059.004**: Unix Shell Command and Scripting Interpreter (Execution phase)
* **T1105**: Ingress Tool Transfer (`wget` / `curl` downloading second-stage payloads)

---

### Q8: What is the difference between Defensive Simulation and Live Exploitation?
**Answer**:
Live exploitation involves sending active exploit payloads across a network, which risks crashing services, causing data loss, or triggering legal and safety concerns. Defensive simulation accurately replicates the resulting log artifacts and indicators of compromise (IOCs), allowing security teams to validate detection and alerting rules safely and reliably.
