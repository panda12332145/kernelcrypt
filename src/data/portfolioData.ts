import type { PortfolioData } from '../types';
import { apiUrl } from '../lib/api';

export const GITHUB_USERNAME = 'panda12332145';

// Dados padrão que serão usados enquanto a API carrega
const DEFAULT_PORTFOLIO_DATA: PortfolioData = {
  hero: {
    highlight:
      'Cybersecurity Researcher • Reverse Engineer • Low-Level Systems Developer',

    subtitle:
      'Brazilian cybersecurity researcher and systems developer focused on reverse engineering, malware analysis, low-level programming, backend engineering, distributed infrastructures, Linux internals, offensive security research, cryptography, and real-time architectures. Passionate about theoretical physics, astronomy, ethical hacking, AI systems, and high-performance software engineering.',

    tags: [
      'Cybersecurity',
      'Reverse Engineering',
      'Malware Analysis',
      'Python',
      'C',
      'C++',
      'Assembly x86-64',
      'Linux',
      'FastAPI',
      'Cryptography',
      'OSINT',
      'Pentesting',
      'WebRTC',
      'FFmpeg',
      'Docker',
      'Networking',
      'Kernel Research',
      'Red Team',
      'CTF',
      'AI',
      'Distributed Systems',
      'Protocol Engineering',
    ],

    terminalCard: {
      name: 'Athos Dã',
      alias: 'X86BinaryGhost',

      role:
        'Cybersecurity Researcher | Reverse Engineer | Systems Developer',

      education: {
        undergraduate: {
          degree: 'Análise e Desenvolvimento de Sistemas (ADS)',
          institution: 'Estácio',
        },
        postgraduate: {
          degree: 'Pós-graduação em Cibersegurança',
          institution: 'Estácio',
        },
      },

      stack: {
        backend: [
          'Python',
          'FastAPI',
          'Node.js',
          'Redis',
          'PostgreSQL',
          'MySQL',
        ],

        low_level: [
          'C',
          'C++',
          'Assembly x86/x64',
          'Linux Internals',
          'Windows Internals',
          'Linux Kernel',
        ],

        security: [
          'Reverse Engineering',
          'Malware Analysis',
          'OSINT',
          'Red Team',
          'Pentesting',
          'Cryptography',
          'Threat Intelligence',
          'Network Security',
        ],

        realtime: [
          'FFmpeg',
          'WebRTC',
          'GPU Streaming',
          'Socket Programming',
          'Realtime Networking',
        ],

        devops: [
          'Docker',
          'Linux',
          'Git',
          'Virtualization',
          'CI/CD',
        ],
      },

      focus: [
        'cybersecurity research',
        'reverse engineering',
        'malware analysis',
        'ethical hacking',
        'network security',
        'distributed systems',
        'cryptography',
        'low-level programming',
        'linux systems',
        'kernel research',
        'real-time systems',
        'backend engineering',
        'AI systems',
        'automation',
        'protocol engineering',
        'threat intelligence',
        'offensive security',
        'theoretical physics',
      ],

      languages: [
        'Python',
        'C',
        'C++',
        'Assembly x86-64',
        'JavaScript',
        'ShellScript',
        'PowerShell',
        'Lua',
        'Ruby',
      ],

      specialties: [
        'Malware Analysis',
        'Reverse Engineering',
        'Threat Research',
        'Linux Systems',
        'Offensive Security',
        'Protocol Engineering',
        'Automation',
        'CTF Challenges',
        'Network Analysis',
        'Hardware Hacking',
        'Threat Intelligence',
        'Kernel Research',
        'Distributed Architectures',
      ],

      scale:
        'high-performance systems, cybersecurity research & low-level engineering',

      fun_fact:
        'Passionate about cybersecurity, Linux systems, astronomy, philosophy, Beethoven, reverse engineering, and theoretical physics.',
    },

    socialLinks: [
      {
        platform: 'github',
        url: 'https://github.com/panda12332145',
        label: 'GitHub',
        icon: 'github',
      },

      {
        platform: 'youtube',
        url: 'https://www.youtube.com/@X86BinaryGhost',
        label: 'YouTube',
        icon: 'youtube',
      },
    ],
  },

  stats: {
    repositories: 0,
    stars: 0,
    followers: 0,
    contributions: 0,
    downloads: '0',
    forks: 0,
  },

  sectionDesc:
    'Cybersecurity research, malware analysis, reverse engineering, offensive security tooling, distributed systems, backend architectures, Linux internals, cryptography experiments, AI systems, automation frameworks, and low-level software engineering.',

  projects: [
    {
      id: '1',
      name: 'ShadowNet Malware Research Lab',
      description:
        'Cybersecurity research laboratory focused on malware analysis, reverse engineering, persistence techniques, sandbox evasion, encrypted communications, memory inspection, Windows internals and threat intelligence for educational and authorized security research.',
      stars: 980,
      forks: 85,
      commits: 412,
      downloads: '240K+',
      languages: ['Python', 'C++', 'Assembly'],
      topics: [
        'cybersecurity',
        'reverse-engineering',
        'malware-analysis',
        'threat-intelligence',
        'windows-internals',
        'network-security',
      ],
      github: 'https://github.com/panda12332145/shadownet',
      emoji: '🛡️',
      featured: true,
      customTags: [
        'Reverse Engineering',
        'Malware Analysis',
        'Threat Research',
        'Python',
        'C++',
      ],
    },

    {
      id: '2',
      name: 'PyC2 Research Framework',
      description:
        'Distributed command-and-control research framework built for authorized security simulations, red team exercises, encrypted communications, distributed testing and protocol engineering.',
      stars: 540,
      forks: 42,
      commits: 267,
      languages: ['Python', 'C'],
      topics: [
        'security-research',
        'c2-framework',
        'red-team',
        'cryptography',
        'protocol-engineering',
      ],
      github: 'https://github.com/panda12332145/pyc2',
      emoji: '💀',
      featured: true,
      customTags: [
        'Security Research',
        'Red Team',
        'Protocol Engineering',
        'Cryptography',
      ],
    },

    {
      id: '3',
      name: 'Realtime Streaming Engine',
      description:
        'GPU accelerated low-latency real-time streaming infrastructure using FFmpeg, multiprocessing pipelines, distributed media processing, WebRTC communication and realtime networking.',
      stars: 320,
      forks: 30,
      commits: 411,
      languages: ['Python', 'C++'],
      topics: [
        'webrtc',
        'streaming',
        'ffmpeg',
        'distributed-systems',
        'gpu-streaming',
      ],
      github:
        'https://github.com/panda12332145/realtime-streaming-engine',
      emoji: '📡',
      featured: true,
      customTags: [
        'WebRTC',
        'GPU Streaming',
        'FFmpeg',
        'Distributed Systems',
      ],
    },

    {
      id: '4',
      name: 'Kernel Research Toolkit',
      description:
        'Linux kernel experimentation toolkit focused on syscall tracing, memory inspection, debugging, low-level system interaction, process analysis and performance optimization.',
      stars: 214,
      forks: 18,
      commits: 173,
      languages: ['C', 'Assembly x86-64'],
      topics: [
        'linux',
        'kernel',
        'low-level',
        'systems-programming',
        'debugging',
      ],
      github:
        'https://github.com/panda12332145/kernel-research-toolkit',
      emoji: '⚙️',
      featured: false,
      customTags: [
        'Linux Kernel',
        'Assembly',
        'Low-Level',
      ],
    },

    {
      id: '5',
      name: 'Cryptography Laboratory',
      description:
        'Collection of cryptographic implementations, hashing systems, encryption experiments, secure communication protocols and algorithm research projects.',
      stars: 180,
      forks: 16,
      commits: 208,
      languages: ['Python', 'C++'],
      topics: [
        'cryptography',
        'security',
        'algorithms',
        'protocols',
        'encryption',
      ],
      github:
        'https://github.com/panda12332145/cryptography-lab',
      emoji: '🔐',
      featured: false,
      customTags: [
        'Cryptography',
        'Algorithms',
        'Security',
      ],
    },

    {
      id: '6',
      name: 'FastAPI Distributed Infrastructure',
      description:
        'Production-grade distributed backend infrastructure using FastAPI, Redis, PostgreSQL, Docker, async workers, websocket communication and scalable microservices.',
      stars: 390,
      forks: 48,
      commits: 302,
      languages: ['Python'],
      topics: [
        'fastapi',
        'backend',
        'distributed-systems',
        'microservices',
        'websockets',
      ],
      github:
        'https://github.com/panda12332145/distributed-backend',
      website:
        'https://www.meu-site.com/backend',
      emoji: '🚀',
      featured: true,
      customTags: [
        'FastAPI',
        'Backend',
        'Distributed Systems',
        'Microservices',
      ],
    },

    {
      id: '7',
      name: 'OSINT Recon Toolkit',
      description:
        'Open-source intelligence automation toolkit focused on reconnaissance, metadata analysis, public information gathering and threat intelligence workflows.',
      stars: 270,
      forks: 29,
      commits: 167,
      languages: ['Python'],
      topics: [
        'osint',
        'automation',
        'reconnaissance',
        'threat-intelligence',
        'security',
      ],
      github:
        'https://github.com/panda12332145/osint-recon-toolkit',
      emoji: '🛰️',
      featured: true,
      customTags: [
        'OSINT',
        'Automation',
        'Threat Intelligence',
      ],
    },

    {
      id: '8',
      name: 'CTF Toolkit',
      description:
        'Collection of exploit development scripts, binary analysis utilities, reversing tools and notes designed for Capture The Flag competitions and offensive security learning.',
      stars: 350,
      forks: 29,
      commits: 231,
      languages: ['Python', 'C++', 'Shell'],
      topics: [
        'ctf',
        'binary-exploitation',
        'reverse-engineering',
        'offensive-security',
      ],
      github: 'https://github.com/panda12332145/ctf-toolkit',
      emoji: '🏴',
      featured: false,
      customTags: [
        'CTF',
        'Binary Exploitation',
        'Security',
      ],
    },

    {
      id: '9',
      name: 'Neural Bitcoin Predictor',
      description:
        'Experimental PyTorch project using LSTM neural networks to analyze financial market behavior and predict cryptocurrency trends using real-time data pipelines.',
      stars: 170,
      forks: 19,
      commits: 121,
      languages: ['Python'],
      topics: [
        'pytorch',
        'machine-learning',
        'lstm',
        'finance',
        'ai',
      ],
      github:
        'https://github.com/panda12332145/bitcoin-predictor',
      emoji: '🧠',
      featured: false,
      customTags: [
        'PyTorch',
        'AI',
        'LSTM',
      ],
    },
  ],

  skills: [
    {
      name: 'Python',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      iconType: 'url',
      category: 'Languages',
    },

    {
      name: 'C',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
      iconType: 'url',
      category: 'Languages',
    },

    {
      name: 'C++',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
      iconType: 'url',
      category: 'Languages',
    },

    {
      name: 'Assembly x86-64',
      icon: '⚙️',
      iconType: 'emoji',
      category: 'Languages',
    },

    {
      name: 'JavaScript',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      iconType: 'url',
      category: 'Languages',
    },

    {
      name: 'PowerShell',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg',
      iconType: 'url',
      category: 'Languages',
    },

    {
      name: 'Bash',
      icon: '🐧',
      iconType: 'emoji',
      category: 'Languages',
    },

    {
      name: 'Lua',
      icon: '🌙',
      iconType: 'emoji',
      category: 'Languages',
    },

    {
      name: 'FastAPI',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
      iconType: 'url',
      category: 'Backend',
    },

    {
      name: 'Docker',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
      iconType: 'url',
      category: 'DevOps',
    },

    {
      name: 'Linux',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
      iconType: 'url',
      category: 'Systems',
    },

    {
      name: 'Git',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg',
      iconType: 'url',
      category: 'Tools',
    },

    {
      name: 'SQLite',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg',
      iconType: 'url',
      category: 'Databases',
    },

    {
      name: 'MySQL',
      icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      iconType: 'url',
      category: 'Databases',
    },

    {
      name: 'FFmpeg',
      icon: '🎬',
      iconType: 'emoji',
      category: 'Media',
    },

    {
      name: 'WebRTC',
      icon: '📡',
      iconType: 'emoji',
      category: 'Realtime',
    },

    {
      name: 'Cybersecurity',
      icon: '🛡️',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Reverse Engineering',
      icon: '🔍',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Malware Analysis',
      icon: '☣️',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Cryptography',
      icon: '🔐',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'OSINT',
      icon: '🛰️',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Wireshark',
      icon: '🦈',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Metasploit',
      icon: '💣',
      iconType: 'emoji',
      category: 'Security',
    },

    {
      name: 'Networking',
      icon: '🌐',
      iconType: 'emoji',
      category: 'Infrastructure',
    },

    {
      name: 'Virtualization',
      icon: '🖥️',
      iconType: 'emoji',
      category: 'Infrastructure',
    },

    {
      name: 'Threat Intelligence',
      icon: '📊',
      iconType: 'emoji',
      category: 'Security',
    },
  ],

  contacts: [
    {
      platform: 'GitHub',
      value: 'github.com/panda12332145',
      url: 'https://github.com/panda12332145',
      icon: 'github',
    },

    {
      platform: 'YouTube',
      value: '@X86BinaryGhost',
      url: 'https://www.youtube.com/@X86BinaryGhost',
      icon: 'youtube',
    },

    {
      platform: 'Instagram',
      value: '@01pandal10',
      url: 'https://www.instagram.com/01pandal10',
      icon: 'instagram',
    },

    {
      platform: 'Twitter/X',
      value: '@Panda1233212',
      url: 'https://x.com/Panda1233212',
      icon: 'twitter',
    },

    {
      platform: 'Discord',
      value: 'discord.gg/p',
      url: 'https://discord.com/invite/p',
      icon: 'message-circle',
    },

    {
      platform: 'Email',
      value: 'athos.cybersec@gmail.com',
      url: 'mailto:athos.cybersec@gmail.com',
      icon: 'mail',
    },

    {
      platform: 'Proton Mail',
      value: 'AmandaSysCallInjector@proton.me',
      url: 'mailto:AmandaSysCallInjector@proton.me',
      icon: 'mail',
    },

    {
      platform: 'Website',
      value: 'panda-h0me',
      url: 'https://panda-h0me.netlify.app/',
      icon: 'globe',
    },
  ],
};

export let portfolioData = DEFAULT_PORTFOLIO_DATA;

/**
 * Carrega dados do portfólio da API
 */
export async function loadPortfolioData(): Promise<void> {
  try {
    // Busca dados gerais do portfólio
    const response = await fetch(apiUrl('/api/portfolio/all'));

    if (!response.ok) {
      console.warn(
        `Falha ao carregar dados da API (${response.status}), usando dados padrão`
      );
    }

    const apiData = response.ok ? await response.json() : {};

    // Busca projetos do DB
    let dbProjects: any[] = [];
    try {
      const projectsRes = await fetch(apiUrl('/api/projects'));
      if (projectsRes.ok) {
        dbProjects = await projectsRes.json();
      }
    } catch {
      console.warn('⚠️ Falha ao buscar projects da API');
    }

    // Mapeia projetos do DB para o formato do frontend
    const mappedProjects: typeof DEFAULT_PORTFOLIO_DATA.projects = dbProjects.length > 0
      ? dbProjects.map((p: any, i: number) => ({
          id: String(p.id || i + 1),
          name: p.nome || '',
          description: p.descricao || '',
          stars: parseInt(p.estrelas) || 0,
          forks: 0,
          commits: parseInt(p.commits) || undefined,
          downloads: p.downloads || undefined,
          languages: Array.isArray(p.linguagens) ? p.linguagens : [],
          topics: Array.isArray(p.tags) ? p.tags : [],
          website: p.weblink || undefined,
          github: p.link || '',
          emoji: p.emoji || '📁',
          featured: Boolean(p.featured),
          customTags: Array.isArray(p.customizado) ? p.customizado : [],
          cveBadge: p.aviso && p.aviso.includes('CVE') ? p.aviso : undefined,
          aviso: p.aviso || undefined,
          avisoCor: p.aviso_cor || undefined,
          frameworks: Array.isArray(p.frameworks) ? p.frameworks : [],
          teamType: p.team_type || undefined,
          tipo: p.tipo || undefined,
          icone: p.icone || undefined,
          colors: p.colors || {},
        }))
      : DEFAULT_PORTFOLIO_DATA.projects;

    // Busca about (terminalCard) do DB
    let dbAbout: any = null;
    try {
      const aboutRes = await fetch(apiUrl('/api/portfolio/about'));
      if (aboutRes.ok) {
        const raw = await aboutRes.json();
        if (raw && raw.name) dbAbout = raw;
      }
    } catch {
      console.warn('⚠️ Falha ao buscar about da API');
    }

    // Mescla dados da API com dados padrão
    portfolioData = {
      ...DEFAULT_PORTFOLIO_DATA,
      hero: {
        ...DEFAULT_PORTFOLIO_DATA.hero,
        ...apiData.hero,
        terminalCard: dbAbout
          ? {
              ...DEFAULT_PORTFOLIO_DATA.hero.terminalCard,
              ...dbAbout,
            }
          : DEFAULT_PORTFOLIO_DATA.hero.terminalCard,
      },
      skills:
        apiData.skills?.length > 0
          ? apiData.skills
          : DEFAULT_PORTFOLIO_DATA.skills,
      contacts:
        apiData.contacts?.length > 0
          ? apiData.contacts
          : DEFAULT_PORTFOLIO_DATA.contacts,
      projects: mappedProjects,
    };

    console.log('✅ Dados do portfólio carregados com sucesso');
    console.log(`📦 ${mappedProjects.length} projetos carregados do ${
      dbProjects.length > 0 ? 'banco de dados' : 'fallback estático'
    }`);
  } catch (error) {
    console.warn('⚠️ Erro ao carregar dados da API, usando dados padrão:', error);
  }
}

/**
 * Retorna os dados do portfólio (carregados da API ou padrão)
 */
export function getPortfolioData(): PortfolioData {
  return portfolioData;
}

export default portfolioData;
