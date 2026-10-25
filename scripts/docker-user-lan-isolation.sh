#!/bin/sh
# Blocks this project's Docker network from reaching any private RFC1918 range
# (the home LAN, other Docker networks on the host, VPNs). Nothing in this stack
# needs anything but the public internet and its own containers, so a
# compromised container can't pivot onto the home network.
#
# Run by docker-compose.prod.yml's `firewall-init` service (host network +
# NET_ADMIN, since DOCKER-USER is a host-level chain) on every `docker compose up`.
# Idempotent (-C before -I), so re-running never stacks duplicate rules.
#
# SUBNET comes from the compose file (DOCKER_SUBNET), which pins the network to it.
#
# The ESTABLISHED,RELATED accept goes in first (evaluated before the DROPs): it
# only allows *replies* to connections opened from outside (e.g. a LAN browser
# hitting a published port); containers still can't open new connections into the LAN.
set -e
SUBNET="${SUBNET:-172.23.0.0/16}"
iptables -C DOCKER-USER -s "$SUBNET" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT 2>/dev/null || \
  iptables -I DOCKER-USER -s "$SUBNET" -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
for dest in 10.0.0.0/8 172.16.0.0/12 192.168.0.0/16; do
  iptables -C DOCKER-USER -s "$SUBNET" -d "$dest" -j DROP 2>/dev/null || \
    iptables -I DOCKER-USER -s "$SUBNET" -d "$dest" -j DROP
done
