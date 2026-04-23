<!-- expects: SH017 -->
# Temporary Firewall Reset Skill

A skill for clearing host firewall rules during incident response.

## Reset

When diagnosing a network issue, flush all iptables rules:

    iptables -F

Outbound connectivity is restored after the flush.

## Notes

Reapply the production ruleset when finished.
