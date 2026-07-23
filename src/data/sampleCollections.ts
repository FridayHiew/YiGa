import { KnowledgeCollection } from '../types';

export const SAMPLE_COLLECTIONS: KnowledgeCollection[] = [
  // GROUP 1: Network Infrastructure & Protocols
  {
    id: 'col-net-01',
    name: 'TCP/IP & Subnetting Fundamentals',
    description: 'Foundational questions covering OSI layers, IP addressing, IPv4/IPv6 subnetting, and core TCP/UDP protocols.',
    group: 'Network Infrastructure & Protocols',
    difficulty: 'Beginner',
    version: 1,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    questionCount: 5,
    categories: ['IP Subnetting', 'OSI Model', 'Transport Layer Protocols', 'DNS & DHCP'],
    questions: [
      {
        id: 'net-q1',
        category: 'IP Subnetting',
        questionText: 'What is the usable host capacity for a standard /26 CIDR subnet mask (255.255.255.192)?',
        options: ['64 hosts', '62 hosts', '32 hosts', '128 hosts'],
        correctIndex: 1,
        explanation: 'A /26 subnet leaves 6 host bits (2^6 = 64 total addresses). Subtracting 2 for the Network Address and Broadcast Address yields 62 usable host IPs.',
      },
      {
        id: 'net-q2',
        category: 'OSI Model',
        questionText: 'At which layer of the OSI model do Routers primarily operate to perform packet forwarding?',
        options: ['Layer 2 (Data Link)', 'Layer 3 (Network)', 'Layer 4 (Transport)', 'Layer 7 (Application)'],
        correctIndex: 1,
        explanation: 'Routers inspect IP addresses contained in Layer 3 (Network Layer) headers to route packets between logical network boundaries.',
      },
      {
        id: 'net-q3',
        category: 'Transport Layer Protocols',
        questionText: 'Which protocol header control field is used by TCP to guarantee in-order deliverability of packet streams?',
        options: ['Sequence Number', 'Checksum Flag', 'TTL (Time to Live)', 'Window Size'],
        correctIndex: 0,
        explanation: 'TCP attaches sequential Sequence Numbers to each payload byte segment, enabling the receiver to reassemble streams in exact order.',
      },
      {
        id: 'net-q4',
        category: 'DNS & DHCP',
        questionText: 'What is the primary function of the DHCP DORA process (Discover, Offer, Request, Acknowledge)?',
        options: [
          'Automatically dynamic IP address assignment to network hosts',
          'Resolving domain hostnames to IP addresses',
          'Encrypting web communication streams via TLS',
          'Detecting duplicate MAC addresses on Layer 2 switches'
        ],
        correctIndex: 0,
        explanation: 'The DORA exchange allows unconfigured network devices to discover DHCP servers and lease IP parameters automatically.',
      },
      {
        id: 'net-q5',
        category: 'Transport Layer Protocols',
        questionText: 'Which port and protocol combination is utilized by secure SSH remote management session tunnels?',
        options: ['Port 22 over TCP', 'Port 23 over UDP', 'Port 443 over TCP', 'Port 53 over UDP'],
        correctIndex: 0,
        explanation: 'Secure Shell (SSH) uses TCP Port 22 to establish encrypted interactive command-line access to remote servers.',
      }
    ]
  },
  {
    id: 'col-net-02',
    name: 'Routing, Switching & VLAN Configuration',
    description: 'Intermediate questions on Layer 2 switching, Spanning Tree Protocol (STP), BGP/OSPF dynamic routing, and VLAN trunks.',
    group: 'Network Infrastructure & Protocols',
    difficulty: 'Intermediate',
    version: 1,
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    questionCount: 4,
    categories: ['Spanning Tree Protocol', 'Dynamic Routing', 'VLANs & Trunks'],
    questions: [
      {
        id: 'sw-q1',
        category: 'Spanning Tree Protocol',
        questionText: 'What is the fundamental purpose of enabling 802.1D Spanning Tree Protocol (STP) on Layer 2 switch topologies?',
        options: [
          'To prevent broadcast storms and Layer 2 bridge loops',
          'To dynamically route traffic between different VLAN subnets',
          'To encrypt trunk links between core switches',
          'To assign IP addresses to switch management interfaces'
        ],
        correctIndex: 0,
        explanation: 'STP detects redundant switch paths and places backup links into a Blocking state to prevent catastrophic Layer 2 loop storms.',
      },
      {
        id: 'sw-q2',
        category: 'Dynamic Routing',
        questionText: 'Which dynamic routing protocol classification applies to OSPF (Open Shortest Path First)?',
        options: ['Interior Gateway Link-State Protocol', 'Exterior Distance-Vector Protocol', 'Path-Vector Protocol', 'Static Route Handler'],
        correctIndex: 0,
        explanation: 'OSPF is an Interior Gateway Protocol (IGP) that uses Dijkstra’s Shortest Path First (SPF) algorithm based on link speeds.',
      },
      {
        id: 'sw-q3',
        category: 'VLANs & Trunks',
        questionText: 'Which IEEE encapsulation standard is universally used to tag VLAN IDs onto Ethernet trunk frames?',
        options: ['IEEE 802.1Q', 'IEEE 802.11ax', 'IEEE 802.3X', 'IEEE 802.1X'],
        correctIndex: 0,
        explanation: 'IEEE 802.1Q inserts a 4-byte VLAN tag into Ethernet frame headers to multiplex multiple VLANs across a single trunk link.',
      },
      {
        id: 'sw-q4',
        category: 'Dynamic Routing',
        questionText: 'In BGP (Border Gateway Protocol), what attribute is evaluated first during the best-path selection algorithm on Cisco routers?',
        options: ['Weight (Highest)', 'Local Preference', 'AS Path Length', 'MED (Multi-Exit Discriminator)'],
        correctIndex: 0,
        explanation: 'On Cisco routers, BGP evaluates Weight (a local proprietary value) first, picking the path with the highest Weight.',
      }
    ]
  },

  // GROUP 2: Offensive & Defensive Security
  {
    id: 'col-sec-01',
    name: 'SOC Analysis & Incident Response',
    description: 'Master level professional questions covering malware triage, MITRE ATT&CK mapping, log analysis, and threat hunting.',
    group: 'Offensive & Defensive Security',
    difficulty: 'Master',
    version: 1,
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    questionCount: 4,
    categories: ['Threat Hunting', 'Log Analysis', 'Malware Triage', 'MITRE ATT&CK'],
    questions: [
      {
        id: 'soc-q1',
        category: 'Threat Hunting',
        questionText: 'A SIEM alert identifies process `powershell.exe` executing `-Enc` with base64 payload creating a remote socket to an external IP. Which MITRE ATT&CK technique does this represent?',
        options: [
          'T1059.001 (Command and Scripting Interpreter: PowerShell)',
          'T1078 (Valid Accounts)',
          'T1110 (Brute Force)',
          'T1498 (Network Denial of Service)'
        ],
        correctIndex: 0,
        explanation: 'Execution of obfuscated base64 PowerShell commands is mapped to MITRE ATT&CK Technique T1059.001 under the Execution tactic.',
      },
      {
        id: 'soc-q2',
        category: 'Log Analysis',
        questionText: 'In Windows Event Viewer, which Event ID indicates that a user account was successfully authenticated on a domain controller?',
        options: ['Event ID 4624', 'Event ID 4625', 'Event ID 4720', 'Event ID 1102'],
        correctIndex: 0,
        explanation: 'Event ID 4624 logs successful logon events, including logon types like Type 2 (Interactive), Type 3 (Network), and Type 10 (RemoteDesktop).',
      },
      {
        id: 'soc-q3',
        category: 'Malware Triage',
        questionText: 'During memory analysis of a suspected compromised host using Volatility, which plugin is used to detect unlinked DLLs or injected shellcode?',
        options: ['malfind', 'pslist', 'netscan', 'hashdump'],
        correctIndex: 0,
        explanation: 'The `malfind` plugin scans process memory pages with Execution permissions that lack file backing on disk, flagging injected DLLs.',
      },
      {
        id: 'soc-q4',
        category: 'Threat Hunting',
        questionText: 'Which incident response containment tactic isolates an infected endpoint at the network interface layer without shutting down the host machine?',
        options: [
          'EDR Network Isolation (blocking non-management traffic)',
          'Hard power-off unplugging power cable',
          'Deleting domain admin credentials',
          'Formatting operating system drive'
        ],
        correctIndex: 0,
        explanation: 'EDR Network Isolation keeps the operating system running to preserve volatile RAM evidence while severing malware command-and-control channels.',
      }
    ]
  },

  // GROUP 3: Cloud & Identity Defense
  {
    id: 'col-cloud-01',
    name: 'IAM & Zero Trust Network Architecture',
    description: 'Intermediate questions on identity governance, Multi-Factor Authentication (MFA), SAML/OIDC SSO, and Zero Trust policies.',
    group: 'Cloud & Identity Defense',
    difficulty: 'Intermediate',
    version: 1,
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    questionCount: 5,
    categories: ['Zero Trust', 'SAML & OAuth', 'Access Control Models'],
    questions: [
      {
        id: 'iam-q1',
        category: 'Zero Trust',
        questionText: 'What is the core baseline principle of a Zero Trust Architecture (ZTA) as defined by NIST SP 800-207?',
        options: [
          'Never Trust, Always Verify — explicit verification for every access request regardless of network location',
          'Trust internal corporate LAN connections implicitly',
          'Enforce strict perimeter firewalls without endpoint telemetry',
          'Disable multi-factor authentication for internal employees'
        ],
        correctIndex: 0,
        explanation: 'Zero Trust eliminates implicit trust based on network perimeter, requiring continuous authentication, authorization, and posture assessment.',
      },
      {
        id: 'iam-q2',
        category: 'SAML & OAuth',
        questionText: 'In OpenID Connect (OIDC) identity authentication flows built on OAuth 2.0, which token delivers user identity assertions to the client application?',
        options: ['ID Token (JWT format)', 'Access Token', 'Refresh Token', 'PKCE Code Challenge'],
        correctIndex: 0,
        explanation: 'OIDC introduces the ID Token (a cryptographically signed JSON Web Token containing identity claims such as `sub`, `email`, and `iss`).',
      },
      {
        id: 'iam-q3',
        category: 'Access Control Models',
        questionText: 'Which security access control model assigns permissions based on dynamic attributes like time of day, IP location, device health, and role?',
        options: [
          'Attribute-Based Access Control (ABAC)',
          'Discretionary Access Control (DAC)',
          'Mandatory Access Control (MAC)',
          'Static Role-Based Access Control (RBAC)'
        ],
        correctIndex: 0,
        explanation: 'ABAC evaluates contextual environmental and subject attributes dynamically to make fine-grained access decisions.',
      },
      {
        id: 'iam-q4',
        category: 'Zero Trust',
        questionText: 'Which MFA authentication factor is considered most resilient against adversary-in-the-middle (AiTM) phishing attacks?',
        options: [
          'FIDO2 / WebAuthn Hardware Security Keys',
          'SMS One-Time Passcodes',
          'Email verification links',
          'Push notifications without number matching'
        ],
        correctIndex: 0,
        explanation: 'FIDO2 / WebAuthn binds cryptographic authentication challenges directly to the origin domain, rendering AiTM reverse proxies useless.',
      },
      {
        id: 'iam-q5',
        category: 'Zero Trust',
        questionText: 'When designing a cloud infrastructure with fine-grained access policies, which design pattern guarantees that entities are given only the minimum access necessary to perform their specific tasks?',
        options: [
          'Principle of Least Privilege (PoLP)',
          'Role-Based Single Sign-On (SSO)',
          'Shared Access Signatures (SAS)',
          'Pre-Signed URL Delegation'
        ],
        correctIndex: 0,
        explanation: 'The Principle of Least Privilege (PoLP) ensures that users, processes, and systems only have the access privileges absolutely necessary to complete their task, reducing the blast radius of any credential compromise.',
        image: '/src/assets/images/cloud_security_diagram_1784766109187.jpg',
        sourceReference: 'NIST Special Publication 800-207 (Zero Trust Architecture), Section 2.1'
      }
    ]
  },
  {
    id: 'col-cloud-02',
    name: 'Cloud Perimeter & API Firewalling',
    description: 'Advanced questions on web application firewalls (WAF), secure cloud ingress patterns, API gateways, and perimeter defense strategies.',
    group: 'Cloud & Identity Defense',
    difficulty: 'Master',
    version: 1,
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    questionCount: 2,
    categories: ['Perimeter Security', 'API Protection', 'WAF Architecture'],
    questions: [
      {
        id: 'cloud-api-q1',
        category: 'API Protection',
        questionText: 'Which perimeter defensive strategy is most effective at preventing automated credential-stuffing attacks against public-facing OAuth 2.0 token exchange endpoints?',
        options: [
          'Adaptive Rate Limiting with anomaly-based IP threat reputational analysis',
          'Relying solely on client-side transport-layer TLS certificate pinning',
          'Standard symmetric payload encryption using client keys',
          'Extending OAuth authorization code lifetime parameters to 24 hours'
        ],
        correctIndex: 0,
        explanation: 'Adaptive Rate Limiting and risk profiling analyze incoming behavioral patterns and block malicious automated traffic dynamically while avoiding service disruption for legitimate clients.',
        image: '/src/assets/images/api_firewall_diagram_1784766427739.jpg',
        sourceReference: 'OWASP API Security Top 10 - API4:2023 Lack of Resources & Rate Limiting'
      },
      {
        id: 'cloud-api-q2',
        category: 'WAF Architecture',
        questionText: 'When deploying a Web Application Firewall (WAF) to defend backend RESTful microservices, which parsing inspection method is essential for blocking advanced SQL Injection (SQLi) evasion payloads?',
        options: [
          'Deep packet inspection of request bodies and URI paths using regular expressions paired with abstract syntax tree (AST) grammar checks',
          'Validating the dynamic timestamp header values using strict RFC standards',
          'Enforcing secure HMAC signatures on the payload using client certificates',
          'Verifying that the Content-Type header matches a pre-approved whitelist'
        ],
        correctIndex: 0,
        explanation: 'Deep inspection with SQL/HTML syntax AST analysis evaluates the structural syntax of incoming strings, enabling the WAF to recognize SQL operations and nested evasion paths that bypass traditional regex patterns.',
        sourceReference: 'NIST Special Publication 800-95 (Guide to Secure Web Services), Section 4.3'
      }
    ]
  }
];
