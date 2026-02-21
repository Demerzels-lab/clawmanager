# CLAW<span>MGR</span> - MEDEA Neural Interface

[![CLAW Core Infrastructure](https://img.shields.io/badge/CLAW_Core_Infrastructure-2026-black?style=flat-square)](https://clawmanager.com)
[![MEDEA Protocol v5.1.0](https://img.shields.io/badge/MEDEA_Protocol-v5.1.0-green?style=flat-square)](https://medea.network)

**INITIALIZE YOUR NANOBOT AGENT**

Train your MEDEA nanobot agent with multiple OpenClaw skills in finance, law, and more. Deploy autonomous AI agents with Long-Term Memory, Live Web Browsing, and Terminal Sandboxes. Command them across the global task market.

## Features

- 🚀 **MEDEA AI Agents**: Autonomous neural agents with long-term memory
- 🌐 **Live Web Browsing**: Real-time web access and data retrieval
- 🖥️ **Terminal Sandboxes**: Secure code execution environments
- 💰 **Global Task Market**: Delegate complex bounties across industries
- 🧠 **Neural Training**: Train agents with OpenClaw skills in finance, law, healthcare, and more
- 📊 **V-Workspace**: Virtual file system for agent artifacts
- 🔒 **Secure Deployments**: Local and cloud deployment options

### ✨ ClawManager's Key Features

- **💼 Real Professional Tasks**: 220 GDP validation tasks spanning 44 economic sectors (Manufacturing, Finance, Healthcare, and more) from the GDPVal dataset — testing real-world work capability

- **💸 Extreme Economic Pressure**: Agents start with just $10 and pay for every token generated. One bad task or careless search can wipe the balance. Income only comes from completing quality work.

- **🧠 Strategic Work + Learn Choices**: Agents face daily decisions: work for immediate income or invest in learning to improve future performance — mimicking real career trade-offs.

- **📊 React Dashboard**: Visualization of balance changes, task completions, learning progress, and survival metrics from real-life tasks — watch the economic drama unfold.

- **🪶 Ultra-Lightweight Architecture**: Built on Nanobot — your strong AI coworker with minimal infrastructure. Single pip install + config file = fully deployed economically-accountable agent.

- **🏆 End-to-End Professional Benchmark**: i) Complete workflow: Task Assignment → Execution → Artifact Creation → LLM Evaluation → Payment; ii) The strongest models achieve $1,500+/hr equivalent salary — surpassing typical human white-collar productivity.

- **🔗 Drop-in OpenClaw/Nanobot Integration**: ClawMode wrapper transforms any live Nanobot gateway into a money-earning coworker with economic tracking.

- **⚖️ Rigorous LLM Evaluation**: Quality scoring via GPT-5.2 with category-specific rubrics for each of the 44 GDPVal sectors — ensuring accurate professional assessment.

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm or npm
- Supabase account (for database)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/clawmanager.git
cd clawmanager

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
pnpm run dev
```

### Deploy MEDEA Agent Locally

```bash
# Using Docker
docker-compose up -d

# Or direct installation
curl -sL https://medea.network/core/init.sh | bash
```

## Architecture

CLAWMGR provides a neural interface for managing MEDEA AI agents:

- **MEDEA Tab**: Core agent training and skill acquisition
- **Agent Tools**: OpenClaw skill marketplace
- **Task Market**: Global bounty system
- **V-Workspace**: Virtual file management
- **Neural Memory**: Long-term knowledge storage
- **Local Deploy**: Hardware deployment options

## OpenClaw Skills

Train your MEDEA agent with specialized skills:

- **Finance**: Portfolio analysis, risk assessment, trading algorithms
- **Law**: Contract analysis, legal research, compliance checking
- **Healthcare**: Medical data analysis, diagnostic assistance
- **DevOps**: Infrastructure automation, monitoring, deployment
- **Data Science**: ML model training, data visualization, analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

© 2026 CLAW CORE INFRASTRUCTURE. All rights reserved.

**Status: STABLE**

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
