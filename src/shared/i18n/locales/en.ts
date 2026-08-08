export default {
  brand: { name: 'Waves Toolkit', tagline: 'WUTHERING WAVES' },
  nav: {
    primary: 'Primary navigation',
    home: 'Home',
    tools: 'Tools',
    data: 'Data status',
    collapse: 'Collapse sidebar',
  },
  header: {
    context: 'A practical planning space for Rovers',
    language: 'Language',
    dataStatus: 'Source connected',
  },
  home: {
    eyebrow: 'WUTHERING WAVES TOOLKIT',
    title: 'Choose a tool. Start planning.',
    intro:
      'Turn complex game data into clear, dependable decisions—from damage estimates to progression materials.',
    section: 'All tools',
    phase: 'Phase 0 · Foundation',
    featured: 'Core tool',
    planned: 'Planned',
    explore: 'View roadmap',
    atlasTitle: 'Wuthering Waves Data Atlas',
    atlasDescription:
      'One entry point for resonators, weapons, Echoes, Sonata Effects, and enemies.',
    atlasAction: 'View data status',
    footer: 'Unofficial community project. Game content and assets belong to Kuro Games.',
    source: 'Primary source: Official Wuthering Waves Wiki',
  },
  tools: {
    damage: {
      name: 'Damage Calculator',
      description:
        'Configure a resonator, weapon, Echoes, and skill timeline for auditable damage plans.',
    },
    material: {
      name: 'Material Planner',
      description: 'Summarize resonator and weapon costs for your next progression goal.',
    },
    echo: {
      name: 'Echo Loadout Analysis',
      description: 'Compare main stats, Sonata Effects, and build directions.',
    },
  },
  data: {
    eyebrow: 'DATA PROVENANCE',
    title: 'Data status',
    intro:
      'Phase 0 establishes the offline data pipeline and validation rules. The deployed app never scrapes the official site at runtime.',
    primary: 'Primary source',
    primaryValue: 'Official Wuthering Waves Wiki / Catalogue',
    scope: 'Initial scope',
    scopeValue: 'Resonators, weapons, Echoes, Sonata Effects, enemies',
    policy: 'Verification policy',
    policyValue: 'Candidate data must be manually reviewed before entering production datasets',
    back: 'Back to tools',
  },
}
