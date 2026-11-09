export const DEFAULT_SESSIONS = [
  {
    id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
    title: 'Frontier AI & Satellite Telemetry for Climate-Resilient Agriculture',
    speaker_name: 'Dr. Almaz Kebede',
    speaker_role: 'Lead AI Researcher, Global Agritech Initiative',
    organizer_id: 'usr-org-01',
    organizer_name: 'Dr. Almaz Kebede',
    sponsor_name: 'Quantum Nexus Technologies',
    sponsor_logo_url: '/assets/sponsor_quantum_logo.jpg',
    short_code: 'jijiga-2026',
    status: 'published', // 'published' | 'completed' | 'cancelled' | 'pending_approval'
    is_active: true,
    is_approved: true,
    location: 'Grand Hall A · Jijiga Innovation Summit',
    schedule_time: new Date(Date.now() + 3600000 * 4).toISOString(),
    description: 'A deep-dive technical symposium examining sub-meter satellite SAR imagery, localized transformer inference, and low-bandwidth telemetry for drought prediction across East Africa.',
    attendee_count: 342,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    max_audio_minutes: 60,
    audio_minutes_used: 12.5,
    max_budget_usd: 5.00,
    cost_usd_accumulated: 0.18,
    initial_notes: [
      {
        id: 'note-101',
        session_id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
        sequence_number: 1,
        idempotency_hash: 'hash-init-101',
        heading: 'Macro-Climate Shifts & Dryland Agronomy Gaps',
        bullet_points: [
          'Precipitation volatility across arid corridors increased by 34% over the last four seasons, rendering static soil-moisture calendars obsolete.',
          'Smallholder yield variance is largely driven by micro-climatic timing rather than bulk fertilizer volume.',
          'Legacy meteorological models lack hyper-localized spatial resolution below 10-kilometer grid cells.'
        ],
        timestamp_marker: '09:15 AM',
        created_at: new Date(Date.now() - 3600000 * 1.5).toISOString()
      },
      {
        id: 'note-102',
        session_id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
        sequence_number: 2,
        idempotency_hash: 'hash-init-102',
        heading: 'Sub-Meter Synthetic Aperture Radar (SAR) Telemetry',
        bullet_points: [
          'Multi-spectral SAR satellite passes now penetrate cloud cover and night skies to measure root-zone moisture indices with sub-50cm precision.',
          'Coupling Sentinel-1 radar bands with ground IoT moisture probes reduced false positive drought alerts by 61%.',
          'Edge compute micro-gateways on solar towers aggregate sensor readings every 90 seconds without cellular internet dependency.'
        ],
        timestamp_marker: '09:28 AM',
        created_at: new Date(Date.now() - 3600000 * 1.0).toISOString()
      },
      {
        id: 'note-103',
        session_id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
        sequence_number: 3,
        idempotency_hash: 'hash-init-103',
        heading: 'Predictive Crop-Yield Transformers (PCY-v4)',
        bullet_points: [
          'Lightweight transformer networks process localized thermal radiance and historical harvest yields in under 45 milliseconds on mobile devices.',
          'Early-warning blight detection yields an 8-day intervention window before visible leaf yellowing occurs.',
          'Farm-level recommendations are delivered via automated SMS and localized voice synthesized bulletins in Somali, Oromo, and Amharic.'
        ],
        timestamp_marker: '09:42 AM',
        created_at: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'note-104',
        session_id: 'f3a41b55-8962-4217-91a7-17b5e406f901',
        sequence_number: 4,
        idempotency_hash: 'hash-init-104',
        heading: 'Edge-Inference Quantization & Real-Time Actuation',
        bullet_points: [
          '4-bit quantized neural network models deployed on perimeter solar nodes cut round-trip inference latency from 1.4s to 42ms.',
          'Automated pressure regulation valves prevent catastrophic irrigation bursts within a 200ms trigger threshold.',
          'Eliminates dependency on continuous uplink connectivity for time-critical farm safety systems.'
        ],
        timestamp_marker: '09:55 AM',
        created_at: new Date(Date.now() - 600000).toISOString()
      }
    ]
  },
  {
    id: 'e2b31a44-7851-3106-8096-06a4d305e890',
    title: 'Autonomous Systems & Low-Latency Agent Architectures',
    speaker_name: 'Marcus Vance',
    speaker_role: 'VP of AI Architecture, HyperScale Global',
    organizer_id: 'usr-org-02',
    organizer_name: 'Marcus Vance',
    sponsor_name: 'Quantum Nexus Technologies',
    sponsor_logo_url: '/assets/sponsor_quantum_logo.jpg',
    short_code: 'ai-agents-2026',
    status: 'published',
    is_active: true,
    is_approved: true,
    location: 'Main Auditorium · Tech Horizons',
    schedule_time: new Date(Date.now() + 86400000).toISOString(),
    description: 'Architecting ultra-low latency agentic systems with deterministic schema boundaries, graph execution models, and streaming memory persistence.',
    attendee_count: 518,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    max_audio_minutes: 45,
    audio_minutes_used: 8.0,
    max_budget_usd: 4.00,
    cost_usd_accumulated: 0.12,
    initial_notes: [
      {
        id: 'note-201',
        session_id: 'e2b31a44-7851-3106-8096-06a4d305e890',
        sequence_number: 1,
        idempotency_hash: 'hash-init-201',
        heading: 'From Monolithic Prompts to Graph-Based Execution',
        bullet_points: [
          'Single-prompt context stuffing hits non-deterministic reasoning degradation beyond 12 sequential decision hops.',
          'Directed Acyclic Graphs (DAGs) of specialist sub-agents deliver a 4.2x reduction in hallucinations for multi-step financial workflows.',
          'Real-time state validation must enforce deterministic schema barriers between asynchronous agentic tool calls.'
        ],
        timestamp_marker: '10:05 AM',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
]

export const SEMINAR_LIVE_SPEECH_STREAM = [
  {
    transcript: "So when we examine the telemetry from the high-altitude sensors, the primary bottleneck isn't the bandwidth itself, but the round-trip latency of edge model inference. By deploying quantized 4-bit transformer models right at the perimeter station, we achieved a 92% decrease in latency, allowing immediate shutoff valves to activate during irrigation pressure spikes.",
    heading: "Edge-Inference Quantization & Real-Time Actuation",
    bullet_points: [
      "4-bit quantized neural network models deployed on perimeter solar nodes cut round-trip inference latency from 1.4s to 42ms.",
      "Automated pressure regulation valves prevent catastrophic irrigation bursts within a 200ms trigger threshold.",
      "Eliminates dependency on continuous uplink connectivity for time-critical farm safety systems."
    ]
  },
  {
    transcript: "Another key takeaway that attendees must note is the monetization and community stewardship model. Rather than locking farmers into high-fee proprietary SaaS, cooperatives establish shared data trusts where regional anonymized soil metrics are purchased by international climate researchers, creating a recurring dividend pool for local growers.",
    heading: "Decentralized Agricultural Data Trusts & Farmer Dividends",
    bullet_points: [
      "Community data trusts pool anonymized soil telemetry to sell to international climate research consortia.",
      "Generates an estimated $140/hectare annual dividend returned directly to participating smallholders.",
      "Open-source data schemas foster regional interoperability across independent cooperative sensor arrays."
    ]
  },
  {
    transcript: "Finally, let us look at the battery and solar scavenging efficiency. By operating on ultra-narrowband wake-up radios, each sensor node draws less than 12 microamps in idle mode. A miniature 3-watt photovoltaic cell provides continuous indefinite power even throughout protracted monsoon seasons.",
    heading: "Micro-Watt Power Harvesting & Indefinite Sensor Lifespans",
    bullet_points: [
      "Ultra-low power wake-up radios constrain quiescent standby drain to under 12 microamps.",
      "Compact 3-watt solar photovoltaic cells ensure perpetual deployment without battery swaps across a 10-year lifespan.",
      "Ruggedized IP68 enclosure prevents dust ingress and thermal throttling in harsh desert climates."
    ]
  },
  {
    transcript: "Let's discuss real-time protocol integration. Traditional WebSockets can experience packet degradation over 3G networks. Implementing lightweight binary message encoding with automatic local cache reconciliations guarantees that not a single note bullet is dropped when attendees walk through cell-tower dead zones.",
    heading: "Resilient Offline Sync & Zero-Loss Binary Buffering",
    bullet_points: [
      "Binary Delta-compression minimizes network payload size to under 2.4KB per lecture chunk.",
      "Client-side optimistic queue reconciles missed notes instantaneously once 3G/LTE connection restores.",
      "Guarantees seamless note synchronization even in low-bandwidth convention exhibition halls."
    ]
  }
]
