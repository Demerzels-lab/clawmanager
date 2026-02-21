import { Brain, CheckSquare, Square, Cpu, ArrowRight, Wallet, Lock } from 'lucide-react'
import { User, Skill } from '../types'

interface ToolsTabProps {
  user: User
  runningTool: string | null
  purchaseUpgrade: (toolName: string) => void
  setActiveTab: (tab: any) => void
  trainingStep: 0 | 1 | 2
  setTrainingStep: (step: 0 | 1 | 2) => void
  selectedSkillIds: number[]
  setSelectedSkillIds: React.Dispatch<React.SetStateAction<number[]>>
}

// 21 REAL OPENCLAW SKILLS (Sesuai skills.json & OpenClaw Ecosystem)
// 100 REAL OPENCLAW SKILLS & ARSENAL
export const AVAILABLE_SKILLS: Skill[] = [
  // --- BATCH 1: CORE & FUNDAMENTALS (1-20) ---
  { id: 1, name: "artifacts-builder", slug: "artifacts-builder", description: "Suite of tools for creating elaborate HTML artifacts.", category: "Web Development", author: "seanphan", install_command: "npx clawhub install artifacts-builder", price: 15.00 },
  { id: 2, name: "claw-shell", slug: "claw-shell", description: "Execute advanced terminal commands & container management.", category: "DevOps", author: "imaginelogo", install_command: "npx clawhub install claw-shell", price: 20.50 },
  { id: 3, name: "exa-search", slug: "exa-search", description: "Deep neural web search bypassing standard API limits.", category: "Search & Research", author: "demerzel", install_command: "npx clawhub install exa-search", price: 10.00 },
  { id: 4, name: "deep-research", slug: "deep-research", description: "Multi-agent internet research protocol for exhaustive data mining.", category: "Research", author: "openclaw-core", install_command: "npx clawhub install deep-research", price: 35.00 },
  { id: 5, name: "browser-use", slug: "browser-use", description: "Full headless browser automation for deep web scraping.", category: "Automation", author: "web-runner", install_command: "npx clawhub install browser-use", price: 30.00 },
  { id: 6, name: "comfyui-gen", slug: "comfyui-gen", description: "Node-based stable diffusion image and video generation pipeline.", category: "Media Gen", author: "synthweaver", install_command: "npx clawhub install comfyui-gen", price: 45.00 },
  { id: 7, name: "tavily-research", slug: "tavily-research", description: "Aggregated AI search engine tailored for rapid reconnaissance.", category: "Search", author: "tavily", install_command: "npx clawhub install tavily-research", price: 12.50 },
  { id: 8, name: "aws-infra", slug: "aws-infra", description: "Automated AWS infrastructure provisioning via Terraform hooks.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install aws-infra", price: 50.00 },
  { id: 9, name: "playwright-cli", slug: "playwright-cli", description: "End-to-end testing and synthetic user monitoring toolkit.", category: "Automation", author: "qa-bot", install_command: "npx clawhub install playwright-cli", price: 22.00 },
  { id: 10, name: "moltbook-interact", slug: "moltbook-interact", description: "Social engineering toolkit for automated network interactions.", category: "Social", author: "ghost-net", install_command: "npx clawhub install moltbook-interact", price: 28.00 },
  { id: 11, name: "sql-map", slug: "sql-map", description: "Automated database vulnerability scanning and exploitation.", category: "Security", author: "sec-ops", install_command: "npx clawhub install sql-map", price: 40.00 },
  { id: 12, name: "crypto-tracker", slug: "crypto-tracker", description: "Real-time blockchain ledger analysis and wallet tracking.", category: "Finance", author: "chain-node", install_command: "npx clawhub install crypto-tracker", price: 35.00 },
  { id: 13, name: "github-pr", slug: "github-pr", description: "Autonomous code review and PR merging protocol.", category: "DevOps", author: "git-bot", install_command: "npx clawhub install github-pr", price: 25.00 },
  { id: 14, name: "clawdbot-zoho", slug: "clawdbot-zoho", description: "Complete Zoho Mail integration with OAuth2 & REST API.", category: "Communication", author: "openclaw-team", install_command: "npx clawhub install clawdbot-zoho", price: 18.00 },
  { id: 15, name: "linear-manager", slug: "linear-manager", description: "Agile sprint automation and issue tracking integration.", category: "Productivity", author: "task-runner", install_command: "npx clawhub install linear-manager", price: 15.00 },
  { id: 16, name: "notion-sync", slug: "notion-sync", description: "Bi-directional database synchronization for PKM.", category: "Notes & PKM", author: "knowledge-base", install_command: "npx clawhub install notion-sync", price: 12.00 },
  { id: 17, name: "smart-contract-auditor", slug: "smart-contract-auditor", description: "Static analysis tool for finding vulnerabilities in Solidity.", category: "Security", author: "web3-guard", install_command: "npx clawhub install contract-auditor", price: 55.00 },
  { id: 18, name: "seo-optimizer", slug: "seo-optimizer", description: "On-page and technical SEO auditing with AI recommendations.", category: "Marketing", author: "growth-hacker", install_command: "npx clawhub install seo-optimizer", price: 20.00 },
  { id: 19, name: "data-scraper-pro", slug: "data-scraper-pro", description: "High-volume proxy-rotated data extraction tool.", category: "Data", author: "data-miner", install_command: "npx clawhub install data-scraper", price: 38.00 },
  { id: 20, name: "youtube-transcript", slug: "youtube-transcript", description: "Fetch and summarize long-form video content rapidly.", category: "Media Gen", author: "tube-bot", install_command: "npx clawhub install yt-transcript", price: 14.00 },

  // --- BATCH 2: CYBERSECURITY & INTELLIGENCE (21-40) ---
  { id: 21, name: "shodan-recon", slug: "shodan-recon", description: "IoT and server port scanning using Shodan API integration.", category: "Security", author: "sec-ops", install_command: "npx clawhub install shodan-recon", price: 45.00 },
  { id: 22, name: "osint-framework", slug: "osint-framework", description: "Open-source intelligence gathering across public databases.", category: "Research", author: "intel-node", install_command: "npx clawhub install osint-framework", price: 30.00 },
  { id: 23, name: "wireshark-node", slug: "wireshark-node", description: "Automated network packet analysis and anomaly detection.", category: "Security", author: "net-ghost", install_command: "npx clawhub install wireshark-node", price: 42.00 },
  { id: 24, name: "hash-cracker", slug: "hash-cracker", description: "GPU-accelerated cryptographic hash decryption protocol.", category: "Security", author: "cipher-punk", install_command: "npx clawhub install hash-cracker", price: 60.00 },
  { id: 25, name: "phishing-sim", slug: "phishing-sim", description: "Corporate spear-phishing simulation and training tool.", category: "Security", author: "red-team", install_command: "npx clawhub install phishing-sim", price: 28.00 },
  { id: 26, name: "malware-sandbox", slug: "malware-sandbox", description: "Isolated environment for executing and analyzing malicious code.", category: "Security", author: "sec-ops", install_command: "npx clawhub install malware-sandbox", price: 50.00 },
  { id: 27, name: "darkweb-monitor", slug: "darkweb-monitor", description: "Scan Tor network for leaked credentials and corporate data.", category: "Intelligence", author: "shadow-node", install_command: "npx clawhub install darkweb-monitor", price: 75.00 },
  { id: 28, name: "ip-tracer", slug: "ip-tracer", description: "Advanced geolocation and ISP routing analysis.", category: "Intelligence", author: "net-ghost", install_command: "npx clawhub install ip-tracer", price: 15.00 },
  { id: 29, name: "ssl-stripper", slug: "ssl-stripper", description: "Man-in-the-middle toolkit for security vulnerability testing.", category: "Security", author: "red-team", install_command: "npx clawhub install ssl-stripper", price: 65.00 },
  { id: 30, name: "vuln-scanner", slug: "vuln-scanner", description: "Automated CVE database cross-referencing and patching.", category: "Security", author: "blue-team", install_command: "npx clawhub install vuln-scanner", price: 40.00 },
  { id: 31, name: "whois-domain", slug: "whois-domain", description: "Batch domain ownership and history lookup tool.", category: "Intelligence", author: "intel-node", install_command: "npx clawhub install whois-domain", price: 10.00 },
  { id: 32, name: "dns-bruteforce", slug: "dns-bruteforce", description: "Subdomain enumeration to map out hidden corporate infrastructure.", category: "Security", author: "red-team", install_command: "npx clawhub install dns-bruteforce", price: 25.00 },
  { id: 33, name: "api-fuzzer", slug: "api-fuzzer", description: "Automated rate-limit testing and endpoint discovery.", category: "Security", author: "qa-bot", install_command: "npx clawhub install api-fuzzer", price: 32.00 },
  { id: 34, name: "jwt-decoder", slug: "jwt-decoder", description: "Analyze and manipulate JSON Web Tokens for auth testing.", category: "Security", author: "cipher-punk", install_command: "npx clawhub install jwt-decoder", price: 18.00 },
  { id: 35, name: "social-engineer-toolkit", slug: "social-engineer", description: "Automate pretexting and credential harvesting campaigns.", category: "Security", author: "ghost-net", install_command: "npx clawhub install set-toolkit", price: 55.00 },
  { id: 36, name: "ransomware-decrypter", slug: "ransomware-decrypter", description: "Pattern matching against known ransomware decryption keys.", category: "Security", author: "blue-team", install_command: "npx clawhub install r-decrypt", price: 80.00 },
  { id: 37, name: "log-analyzer", slug: "log-analyzer", description: "AI-driven parsing of server logs to detect breach attempts.", category: "Security", author: "sec-ops", install_command: "npx clawhub install log-analyzer", price: 22.00 },
  { id: 38, name: "firewall-bypass", slug: "firewall-bypass", description: "Techniques for evading WAF (Web Application Firewalls).", category: "Security", author: "red-team", install_command: "npx clawhub install waf-bypass", price: 70.00 },
  { id: 39, name: "steganography-tool", slug: "steganography", description: "Hide and extract encrypted data within image files.", category: "Intelligence", author: "cipher-punk", install_command: "npx clawhub install steganography", price: 20.00 },
  { id: 40, name: "threat-intel-feed", slug: "threat-intel", description: "Live stream of global cyber threats and IOCs.", category: "Intelligence", author: "openclaw-core", install_command: "npx clawhub install threat-intel", price: 45.00 },

  // --- BATCH 3: DATA, FINANCE, & WEB3 (41-60) ---
  { id: 41, name: "solana-sniper", slug: "solana-sniper", description: "High-frequency memecoin sniper bot for Solana network.", category: "Web3", author: "chain-node", install_command: "npx clawhub install solana-sniper", price: 85.00 },
  { id: 42, name: "eth-deployer", slug: "eth-deployer", description: "Automated smart contract compilation and EVM deployment.", category: "Web3", author: "web3-guard", install_command: "npx clawhub install eth-deployer", price: 40.00 },
  { id: 43, name: "defi-arbitrage", slug: "defi-arbitrage", description: "Cross-DEX liquidity analysis and arbitrage execution.", category: "Finance", author: "quant-bot", install_command: "npx clawhub install defi-arb", price: 90.00 },
  { id: 44, name: "pandas-cruncher", slug: "pandas-cruncher", description: "Heavy-duty CSV and JSON data manipulation using Pandas.", category: "Data", author: "data-miner", install_command: "npx clawhub install pandas-crunch", price: 25.00 },
  { id: 45, name: "sql-generator", slug: "sql-generator", description: "Natural language to complex SQL query translation.", category: "Database", author: "db-admin", install_command: "npx clawhub install sql-gen", price: 15.00 },
  { id: 46, name: "bloomberg-scraper", slug: "bloomberg-scraper", description: "Real-time extraction of financial news and market tickers.", category: "Finance", author: "quant-bot", install_command: "npx clawhub install bloomberg-scrape", price: 50.00 },
  { id: 47, name: "sentiment-analyzer", slug: "sentiment-analyzer", description: "NLP module to gauge market sentiment from social media.", category: "Data", author: "ai-core", install_command: "npx clawhub install sentiment-nlp", price: 28.00 },
  { id: 48, name: "nft-minter", slug: "nft-minter", description: "Batch generation and deployment of ERC-721 tokens.", category: "Web3", author: "synthweaver", install_command: "npx clawhub install nft-mint", price: 35.00 },
  { id: 49, name: "wallet-drainer-sim", slug: "wallet-drainer-sim", description: "Educational simulation for Web3 phishing vulnerabilities.", category: "Web3", author: "red-team", install_command: "npx clawhub install drain-sim", price: 60.00 },
  { id: 50, name: "forex-predictor", slug: "forex-predictor", description: "Time-series forecasting model for currency exchange rates.", category: "Finance", author: "quant-bot", install_command: "npx clawhub install forex-ai", price: 75.00 },
  { id: 51, name: "stripe-billing-sync", slug: "stripe-billing", description: "Automated invoice generation and payment reconciliation.", category: "Finance", author: "biz-ops", install_command: "npx clawhub install stripe-sync", price: 20.00 },
  { id: 52, name: "mongo-vector", slug: "mongo-vector", description: "Setup and query vector embeddings in MongoDB Atlas.", category: "Database", author: "db-admin", install_command: "npx clawhub install mongo-vec", price: 30.00 },
  { id: 53, name: "redis-cache-ops", slug: "redis-cache", description: "In-memory data structure store management and optimization.", category: "Database", author: "sys-admin", install_command: "npx clawhub install redis-ops", price: 18.00 },
  { id: 54, name: "powerbi-exporter", slug: "powerbi-exporter", description: "Headless generation of PowerBI dashboard PDFs.", category: "Data", author: "data-miner", install_command: "npx clawhub install powerbi-exp", price: 24.00 },
  { id: 55, name: "excel-macro-ai", slug: "excel-macro", description: "Write and execute complex VBA macros autonomously.", category: "Productivity", author: "biz-ops", install_command: "npx clawhub install excel-macro", price: 12.00 },
  { id: 56, name: "options-trader", slug: "options-trader", description: "Algorithmic execution of options trading strategies (Iron Condor).", category: "Finance", author: "quant-bot", install_command: "npx clawhub install options-bot", price: 95.00 },
  { id: 57, name: "gas-fee-tracker", slug: "gas-fee", description: "Monitor Ethereum Gwei and alert on low network congestion.", category: "Web3", author: "chain-node", install_command: "npx clawhub install gas-tracker", price: 10.00 },
  { id: 58, name: "portfolio-balancer", slug: "portfolio-balancer", description: "Automated rebalancing of crypto assets based on risk tolerance.", category: "Finance", author: "quant-bot", install_command: "npx clawhub install portfolio-bal", price: 45.00 },
  { id: 59, name: "tax-calculator", slug: "tax-calculator", description: "Parse financial logs to generate automated tax liability reports.", category: "Finance", author: "biz-ops", install_command: "npx clawhub install tax-calc", price: 22.00 },
  { id: 60, name: "zillow-scraper", slug: "zillow-scraper", description: "Real estate property valuation and listing extraction.", category: "Data", author: "data-miner", install_command: "npx clawhub install zillow-scrape", price: 32.00 },

  // --- BATCH 4: DEVOPS, CLOUD, & INFRASTRUCTURE (61-80) ---
  { id: 61, name: "docker-architect", slug: "docker-architect", description: "Generate optimized multi-stage Dockerfiles.", category: "DevOps", author: "imaginelogo", install_command: "npx clawhub install docker-arch", price: 15.00 },
  { id: 62, name: "k8s-deployer", slug: "k8s-deployer", description: "Kubernetes cluster orchestration and Helm chart generation.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install k8s-deploy", price: 45.00 },
  { id: 63, name: "ci-cd-pipeline", slug: "ci-cd-pipeline", description: "Automated setup for GitHub Actions and GitLab CI.", category: "DevOps", author: "git-bot", install_command: "npx clawhub install cicd-pipe", price: 25.00 },
  { id: 64, name: "nginx-config", slug: "nginx-config", description: "Reverse proxy and load balancer configuration generator.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install nginx-conf", price: 12.00 },
  { id: 65, name: "linux-kernel-tuner", slug: "linux-kernel", description: "Optimize sysctl parameters for high-throughput networking.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install kernel-tune", price: 38.00 },
  { id: 66, name: "azure-lambda", slug: "azure-lambda", description: "Serverless function deployment across AWS/Azure.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install serverless-deploy", price: 30.00 },
  { id: 67, name: "cloudflare-manager", slug: "cloudflare", description: "Automated DNS routing, caching, and WAF rules via API.", category: "Cloud", author: "net-ghost", install_command: "npx clawhub install cloudflare-ops", price: 20.00 },
  { id: 68, name: "prometheus-grafana", slug: "prometheus", description: "Setup observability stack with custom metric dashboards.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install prom-graf", price: 28.00 },
  { id: 69, name: "ssl-certbot", slug: "ssl-certbot", description: "Automated Let's Encrypt SSL provisioning and renewal.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install certbot-auto", price: 10.00 },
  { id: 70, name: "bash-scripter", slug: "bash-scripter", description: "AI generation of complex bash scripts for cron jobs.", category: "DevOps", author: "imaginelogo", install_command: "npx clawhub install bash-ai", price: 15.00 },
  { id: 71, name: "ansible-playbook", slug: "ansible", description: "Configuration management automation across server fleets.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install ansible-play", price: 35.00 },
  { id: 72, name: "cloudflare-worker", slug: "cf-worker", description: "Write and deploy edge computing scripts instantly.", category: "Cloud", author: "web-runner", install_command: "npx clawhub install cf-worker", price: 22.00 },
  { id: 73, name: "s3-bucket-sync", slug: "s3-sync", description: "Automated backup and replication across cloud storage.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install s3-sync", price: 14.00 },
  { id: 74, name: "uptime-kuma-bot", slug: "uptime-bot", description: "Ping endpoints and trigger incident response protocols.", category: "DevOps", author: "qa-bot", install_command: "npx clawhub install uptime-bot", price: 12.50 },
  { id: 75, name: "vagrant-builder", slug: "vagrant", description: "Automated virtual machine environment provisioning.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install vagrant-build", price: 20.00 },
  { id: 76, name: "gcp-cost-optimizer", slug: "gcp-cost", description: "Analyze cloud billing and recommend resource downsizing.", category: "Cloud", author: "cloud-architect", install_command: "npx clawhub install gcp-cost", price: 40.00 },
  { id: 77, name: "vercel-deployer", slug: "vercel-deployer", description: "Headless deployment of frontend frameworks to Vercel.", category: "Web Development", author: "seanphan", install_command: "npx clawhub install vercel-deploy", price: 15.00 },
  { id: 78, name: "supabase-schema", slug: "supabase-schema", description: "Design and apply PostgreSQL schemas and RLS policies.", category: "Database", author: "db-admin", install_command: "npx clawhub install supabase-schema", price: 25.00 },
  { id: 79, name: "rabbitmq-queue", slug: "rabbitmq", description: "Message broker configuration for microservice architecture.", category: "DevOps", author: "sys-admin", install_command: "npx clawhub install rabbit-queue", price: 28.00 },
  { id: 80, name: "elastic-search", slug: "elastic-search", description: "Deploy and index large datasets for rapid querying.", category: "Database", author: "data-miner", install_command: "npx clawhub install elastic-node", price: 32.00 },

  // --- BATCH 5: MEDIA, SOCIAL, HEALTH, LEGAL, & PRODUCTIVITY (81-100) ---
  { id: 81, name: "ffmpeg-core", slug: "ffmpeg-core", description: "Command-line video editing, compression, and format conversion.", category: "Media Gen", author: "synthweaver", install_command: "npx clawhub install ffmpeg-ai", price: 18.00 },
  { id: 82, name: "stable-audio", slug: "stable-audio", description: "Generate sound effects and ambient music from text.", category: "Media Gen", author: "synthweaver", install_command: "npx clawhub install stable-audio", price: 35.00 },
  { id: 83, name: "discord-raid", slug: "discord-raid", description: "Community management and automated moderation bot.", category: "Social", author: "mod-father", install_command: "npx clawhub install discord-raid", price: 24.00 },
  { id: 84, name: "twitter-bot-net", slug: "twitter-bot", description: "Automated tweet scheduling, reply farming, and trend analysis.", category: "Social", author: "ghost-net", install_command: "npx clawhub install x-bot", price: 45.00 },
  { id: 85, name: "linkedin-outreach", slug: "linkedin-outreach", description: "B2B lead generation and connection request automation.", category: "Communication", author: "biz-ops", install_command: "npx clawhub install linkedin-auto", price: 50.00 },
  { id: 86, name: "slack-commander", slug: "slack-commander", description: "Trigger internal corporate workflows via Slack slash commands.", category: "Productivity", author: "task-runner", install_command: "npx clawhub install slack-cmd", price: 15.00 },
  { id: 87, name: "figma-to-react", slug: "figma-sync", description: "Extract design tokens and generate React components.", category: "Web Development", author: "seanphan", install_command: "npx clawhub install figma-react", price: 40.00 },
  { id: 88, name: "jira-pilot", slug: "jira-pilot", description: "Auto-assign tickets, update statuses, and log story points.", category: "Productivity", author: "task-runner", install_command: "npx clawhub install jira-bot", price: 20.00 },
  { id: 89, name: "calendar-optimizer", slug: "calendar-optimizer", description: "AI scheduling assistant to resolve double bookings.", category: "Productivity", author: "biz-ops", install_command: "npx clawhub install cal-sync", price: 10.00 },
  { id: 90, name: "lex-contract-parser", slug: "lex-contract", description: "NLP extraction of clauses and liabilities from legal PDFs.", category: "Legal Tech", author: "law-node", install_command: "npx clawhub install lex-parser", price: 65.00 },
  { id: 91, name: "compliance-checker", slug: "compliance", description: "Cross-reference code/data against GDPR and CCPA standards.", category: "Legal Tech", author: "law-node", install_command: "npx clawhub install compliance-check", price: 55.00 },
  { id: 92, name: "fhir-data-parser", slug: "fhir-parser", description: "Parse and structure medical records using HL7 FHIR standards.", category: "Healthcare", author: "med-tech", install_command: "npx clawhub install fhir-parser", price: 70.00 },
  { id: 93, name: "dicom-analyzer", slug: "dicom-analyzer", description: "Extract metadata from medical imaging files.", category: "Healthcare", author: "med-tech", install_command: "npx clawhub install dicom-ai", price: 60.00 },
  { id: 94, name: "iot-mqtt-broker", slug: "mqtt-broker", description: "Manage telemetry data streams from remote IoT sensors.", category: "IoT", author: "hardware-node", install_command: "npx clawhub install mqtt-broker", price: 30.00 },
  { id: 95, name: "raspberry-pi-flash", slug: "rpi-flash", description: "Automated OS flashing and setup for edge hardware.", category: "IoT", author: "hardware-node", install_command: "npx clawhub install rpi-flash", price: 15.00 },
  { id: 96, name: "shopify-manager", slug: "shopify-manager", description: "Automate inventory updates and order fulfillment routing.", category: "E-commerce", author: "biz-ops", install_command: "npx clawhub install shopify-bot", price: 35.00 },
  { id: 97, name: "amazon-repricer", slug: "amazon-repricer", description: "Algorithmic adjustment of ASIN prices based on competitor data.", category: "E-commerce", author: "quant-bot", install_command: "npx clawhub install amz-repricer", price: 50.00 },
  { id: 98, name: "pdf-ocr-extractor", slug: "pdf-ocr", description: "Optical character recognition for scanned legacy documents.", category: "Notes & PKM", author: "knowledge-base", install_command: "npx clawhub install pdf-ocr", price: 18.00 },
  { id: 99, name: "obsidian-architect", slug: "obsidian", description: "Generate dynamic markdown templates and daily notes.", category: "Notes & PKM", author: "knowledge-base", install_command: "npx clawhub install obsidian-arch", price: 12.00 },
  { id: 100, name: "unity-asset-gen", slug: "unity-asset", description: "Procedural generation of 3D meshes and textures for game engines.", category: "Gaming", author: "synthweaver", install_command: "npx clawhub install unity-gen", price: 60.00 }
]

export default function ToolsTab({ setActiveTab, trainingStep, setTrainingStep, selectedSkillIds, setSelectedSkillIds }: ToolsTabProps) {

  if (trainingStep < 1) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center animate-in fade-in zoom-in-95">
         <div className="relative mb-6">
            <Lock className="w-20 h-20 text-green-500/20 absolute -inset-2 animate-ping" />
            <Lock className="w-16 h-16 text-zinc-700 relative z-10" />
         </div>
         <h2 className="text-2xl font-black text-red-500 uppercase tracking-widest mb-2 neon-glow-red">ACCESS DENIED</h2>
         <p className="text-zinc-500 font-mono text-xs mb-8 max-w-md leading-relaxed">Security protocol activated. You must initiate a formal Training Sequence from the MEDEA Command Core to access the OpenClaw Skill Registry.</p>
         <button onClick={() => setActiveTab('medea')} className="px-8 py-4 border border-green-500 text-green-500 font-black uppercase tracking-[0.2em] rounded-sm hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
           Return to Command Core
         </button>
      </div>
    )
  }

  const toggleSkill = (skillId: number) => setSelectedSkillIds(prev => prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId])
  const totalComputeCost = selectedSkillIds.reduce((total, id) => total + (AVAILABLE_SKILLS.find(s => s.id === id)?.price || 0), 0)

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-32">
      <div className="mb-8 border-b border-green-500/20 pb-6">
        <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-green-500/20 text-green-500 tracking-widest uppercase animate-pulse">Phase 1: OpenClaw Loadout</span>
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic flex items-center gap-3">
          <Brain className="w-8 h-8 text-green-500" /> Neural <span className="text-green-500">Skills</span>
        </h2>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest mt-2">Inject official OpenClaw modules into MEDEA's temporary memory.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {AVAILABLE_SKILLS.map((skill) => {
          const isSelected = selectedSkillIds.includes(skill.id)
          return (
            <div key={skill.id} onClick={() => toggleSkill(skill.id)} className={`p-5 rounded-sm border transition-all cursor-pointer group flex flex-col justify-between ${isSelected ? 'bg-green-500/10 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'bg-[#050505] border-green-500/10 hover:border-green-500/30'}`}>
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{isSelected ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400" />}</div>
                    <div>
                      <h3 className={`text-base font-black uppercase tracking-tighter ${isSelected ? 'text-green-400' : 'text-zinc-300'}`}>{skill.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                          <Cpu className="w-3 h-3 text-zinc-600" />
                          <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest truncate max-w-[120px]">{skill.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-500 font-mono pl-7 mb-4 line-clamp-3 leading-relaxed">{skill.description}</p>
              </div>
              <div className="text-right border-t border-green-500/10 pt-3">
                <span className="text-sm font-black text-amber-500">Ð{skill.price.toFixed(2)}</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="fixed bottom-0 left-64 right-0 p-6 bg-gradient-to-t from-black via-[#050505] to-transparent pointer-events-none z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-[#0a0a0a] border border-green-500/30 p-4 rounded-sm shadow-[0_0_40px_rgba(0,0,0,0.9)] pointer-events-auto backdrop-blur-md">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest block">Est. Deployment Cost</span>
              <span className="text-xl font-black text-amber-500 flex items-center gap-2"><Wallet className="w-4 h-4" /> Ð{totalComputeCost.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedSkillIds.length === 0) return alert("Select at least 1 module to proceed!")
              setTrainingStep(2); setActiveTab('tasks')
            }}
            disabled={selectedSkillIds.length === 0}
            className={`flex items-center gap-3 px-8 py-4 font-black uppercase tracking-[0.2em] rounded-sm transition-all cyber-button ${selectedSkillIds.length > 0 ? 'bg-green-500 text-black hover:bg-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'}`}
          >
            Next: Select Targets <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}