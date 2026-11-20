"""Where each spec's page lives in the WoWSims UI (`/forever/<route>/`).

Share links must point at the right spec page: the sim applies the link's
settings after loading the page's own defaults, so a wrong route would offer
the wrong spec. The routes mirror `ui/specs/<class>/<spec>` in wowsims/forever.
"""

SPEC_ROUTES = {
    'mage-arcane': 'mage/dps', 'mage-fire': 'mage/dps', 'mage-ffb': 'mage/dps', 'mage-frost': 'mage/dps',
    'hunter-dps': 'hunter/dps',
    'paladin-retribution': 'paladin/retribution', 'paladin-protection': 'paladin/protection',
    'warrior-fury': 'warrior/dps', 'warrior-arms': 'warrior/dps', 'warrior-protection': 'warrior/protection',
    'druid-balance': 'druid/balance', 'druid-feralcat': 'druid/feralcat', 'druid-feralbear': 'druid/feralbear',
    'priest-shadow': 'priest/dps',
    'rogue-combat': 'rogue/dps',
    'shaman-elemental': 'shaman/elemental', 'shaman-enhancement': 'shaman/enhancement',
    'warlock-smruin': 'warlock/dps',
}
