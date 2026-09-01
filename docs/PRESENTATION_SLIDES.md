# Presentation Slide Deck: Proactive Threat Detection and Log Analysis

This document provides the full slide-by-slide structure, visual layout guidelines, and verbatim presenter talking points matching your presentation deck.

---

## Slide 1: Title & Objective

### Visual Content & Slide Layout
* **Title**: Proactive Threat Detection and Log Analysis in Enterprise SIEM
* **Subtitle**: Real-Time Detection & Visualization of Zimbra Command Injection (CVE-2024-45519)
* **Presenter Information**: [Your Name / Department / College / Date]
* **Key Architecture Badges**: Linux VM | Splunk Enterprise | Sigma Rules | MITRE ATT&CK

### What to Say (Presenter Script)
> "Good morning/afternoon everyone. Today, I am presenting my project on **Proactive Threat Detection and Log Analysis**. I built a functional Security Information and Event Management (**SIEM**) pipeline inside a Linux environment. The goal is to detect real-world exploitation attempts targeting a critical command injection flaw discovered in **Zimbra Collaboration Suite**."

---

## Slide 2: The Problem (The Zimbra Flaw)

### Visual Content & Slide Layout
* **Header**: Root Cause Analysis - CVE-2024-45519 (ZCS SNMP / Swatchdog)
* **Visual Attack Vector Flow**:
  1. **Attacker Vector**: Injects shell metacharacters into unsanitized input fields (`; rm -rf /; wget...`).
  2. **Vulnerable Process**: Zimbra `snmp_notify` invokes `swatchdog` log monitor.
  3. **Execution**: Parameter passed directly to `/bin/sh` subshell.
  4. **Impact**: Full unauthenticated Remote Code Execution (RCE) and host takeover.
* **Threat Advisory Badges**:
  * Flagged in the wild by **CERT Polska**
  * Mandated for urgent patching by **CISA KEV Catalog**

### What to Say (Presenter Script)
> "The vulnerability we are focusing on involves improper input handling within Zimbra's SNMP notification system. When an attacker sends a malicious command string, the server passes it directly to system utilities like swatchdog without sanitization. This allows unauthenticated attackers to execute remote code, harvest credentials, and take over the system. It was flagged in the wild by **CERT Polska** and mandated for urgent patching by **CISA**."

---

## Slide 3: Project Architecture & Methodology

### Visual Content & Slide Layout
* **Header**: Defensive Simulation & Ingestion Pipeline
* **3-Phase Architecture Flowchart**:
  * **Phase 1: Environment Setup**: Linux Virtual Machine (VMware) hosting Splunk Enterprise SIEM on port 8000.
  * **Phase 2: Data Ingestion**: Simulated application logs (`zimbra_traffic.log`) containing standard SOAP traffic and injected malicious payloads.
  * **Phase 3: Detection Engineering**: Real-time SPL detection queries and cross-platform Sigma rules.
* **Methodology Highlight**: Safe defensive simulation eliminating live production system downtime.

### What to Say (Presenter Script)
> "Instead of running dangerous live exploits that could crash production systems, my project focuses on **defensive simulation and detection**.
> * First, I deployed a **Linux Virtual Machine** hosting **Splunk Enterprise**.
> * Second, I ingested simulated system and application logs containing both normal traffic and malicious payloads mimicking the attack footprint.
> * Third, I engineered custom **search queries and detection rules** to parse this data in real time."

---

## Slide 4: Demonstration & Detection Logic (Show your Dashboard)

### Visual Content & Slide Layout
* **Header**: Detection Logic & Live SOC Dashboard
* **Detection SPL Search Box**:
  ```spl
  source="zimbra_traffic.log" "swatchdog" ("wget" OR "sh" OR "curl" OR "rm")
  ```
* **Dashboard Visual Elements**:
  * **Single Value Metric**: Visual counter incrementing from `0` (Green - Normal) to `1` (Red - Exploit Detected).
  * **Traffic Breakdown Chart**: Pie chart showing 66% Benign Traffic vs. 33% Critical Exploit Attempts.
  * **Forensics Table**: Structured table displaying Timestamp, Thread, Component (`swatchdog`), and Payload.

### What to Say (Presenter Script)
> "As you can see on the screen, this is the core detection logic. The query scans incoming files for instances where the vulnerable process—swatchdog—interacts with unauthorized system calls like `wget` or `curl`. When an attacker tries to inject a shell script, our rules trigger instantly. This feeds directly into our **Splunk Dashboard**, converting raw text logs into an actionable visual alert for a security operations team."

---

## Slide 5: Conclusion & Future Scope

### Visual Content & Slide Layout
* **Header**: Project Summary & Future Enhancements
* **Key Achievements**:
  * Real-time zero-day exploit detection prior to patch rollouts.
  * Vendor-neutral Sigma signature preventing vendor lock-in.
  * Zero false-positive impact on standard email server operations.
* **Future Scope**:
  * Automated SOAR Integration: Dynamic Linux firewall rules (`iptables` / `nftables`) upon alert trigger.
  * Multi-Node Forwarding: Telemetry aggregation across enterprise clusters via Splunk Universal Forwarder.
  * Behavioral anomaly detection via Splunk Machine Learning Toolkit.

### What to Say (Presenter Script)
> "In conclusion, this project demonstrates that organizations do not have to wait for a software patch to secure their perimeter. By implementing robust log analysis, we can catch and contain threats at the reconnaissance stage. In the future, this project can be expanded by integrating automated firewall blocks whenever an alert is triggered. Thank you, and I am open to any questions."
