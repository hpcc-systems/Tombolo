---
sidebar_position: 3
title: HPCC Tools Setup
---

# HPCC Tools Integration: VM & SSH Agent Forwarding

This guide explains how to configure a Linux VM (or local machine) so that Tombolo's Docker containers can securely clone a private GitHub repository at runtime using SSH agent forwarding — without ever copying a private key into a container or image.

---

## 1. Overview

Tombolo's `jobs` service needs access to a private GitHub repository at runtime (not at build time). Rather than embedding credentials in the image, the container authenticates through the host's SSH agent via a forwarded socket.

By default, the HPCC Tools worker uses an SSH repository URL intended for Docker-deployed instances:

`ssh://git@ssh.github.com:443/hpcc-systems/hpcc-tools.git`

This default works with SSH agent forwarding and is the recommended production/deployment setup.

**How it works:**

1. A GitHub deploy key is generated on the VM and added to the private repository.
2. The deploy key is loaded into the VM's SSH agent (`ssh-agent`).
3. Docker Compose mounts the agent's Unix socket (`SSH_AUTH_SOCK`) into the container.
4. When the container runs `git clone`, SSH uses the forwarded agent for authentication — no key material is ever written into the container.

This approach is secure because the private key only exists on the VM's filesystem and in the in-memory agent. The container image itself contains no credentials and is safe to push to any registry.

If you are doing local development and need a different repository URL (for example, HTTPS or another Git endpoint), set the `HPCC_TOOLS_REPO_URL` server environment variable in your `.env` file.

Example:

```bash
HPCC_TOOLS_REPO_URL=https://github.com/hpcc-systems/hpcc-tools.git
```

Only override this value if you are actively using the HPCC Tools integration and have a local workflow that requires a non-default repo URL.

---

## 2. Prerequisites

Before starting, ensure the following are in place:

- A **Linux VM** (or macOS/Linux workstation for local development) with shell access
- **Docker** and **docker-compose** installed and running
- Access to the target **private GitHub repository** with permission to add deploy keys
- **OpenSSH client** tools available (`ssh-keygen`, `ssh-agent`, `ssh-add`)

---

## 3. Generate or Install a GitHub Deploy Key

A deploy key is a repository-scoped SSH key that grants access to a single GitHub repo. It is the least-privilege option for this workflow.

### Generate a new key on the VM

```bash
ssh-keygen -t ed25519 -C "tombolo-hpcc-tools-deploy" -f ~/.ssh/hpcc_tools_deploy_key
```

- When prompted for a passphrase, either leave it empty (simpler for automated use) or add one (and load it manually each session).
- This creates two files:
  - `~/.ssh/hpcc_tools_deploy_key` — **private key** (never share or copy this)
  - `~/.ssh/hpcc_tools_deploy_key.pub` — **public key** (this is what you add to GitHub)

### Add the public key to GitHub

1. Copy the public key contents:
   ```bash
   cat ~/.ssh/hpcc_tools_deploy_key.pub
   ```
2. Open the target repository on GitHub → **Settings** → **Deploy keys** → **Add deploy key**.
3. Paste the public key, give it a descriptive title (e.g. `Tombolo VM - hpcc-tools`), and select **Allow write access** only if the container needs to push. For cloning only, leave it unchecked (read-only).

:::tip Use read-only access
Unless your workflow requires pushing back to the repository, always use a read-only deploy key. This limits the blast radius if the VM is ever compromised.
:::

---

## 4. Configure SSH Agent on the VM

The SSH agent holds decrypted keys in memory so processes (including Docker containers) can authenticate without re-entering passphrases.

### Start the agent

Most Linux systems start `ssh-agent` automatically per login session. If it is not running:

```bash
eval "$(ssh-agent -s)"
```

This sets the `SSH_AUTH_SOCK` and `SSH_AGENT_PID` environment variables in your current shell.

### Add the deploy key

```bash
ssh-add ~/.ssh/hpcc_tools_deploy_key
```

If the key has a passphrase, you will be prompted once. Subsequent uses (including from the container) will not require it.

### Verify the key is loaded

```bash
ssh-add -l
```

You should see an entry for `hpcc_tools_deploy_key`. If the list is empty, run the `ssh-add` command again.

### Optional: confirmation-based access

If you want the agent to prompt you before each use (useful on shared or multi-user VMs):

```bash
ssh-add -c ~/.ssh/hpcc_tools_deploy_key
```

With `-c`, the agent will require a GUI or terminal confirmation each time a process requests the key.

### Persist the agent across sessions

On a deployment VM, you likely want the agent started automatically and the key added on boot. A common pattern in `~/.bashrc` or a systemd user service:

```bash
# In ~/.bashrc or ~/.profile
if [ -z "$SSH_AUTH_SOCK" ]; then
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/hpcc_tools_deploy_key
fi
```

---

## 5. Docker Compose Integration

The `docker-compose-sample.yml` in this repository already includes the SSH agent forwarding configuration for the `jobs` service:

```yaml
jobs:
  # ...
  environment:
    SSH_AUTH_SOCK: /ssh-agent
  volumes:
    - $SSH_AUTH_SOCK:/ssh-agent
```

**What this does:**

- `$SSH_AUTH_SOCK` on the host is the path to the SSH agent's Unix domain socket (e.g. `/run/user/1000/keyring/ssh` or `/tmp/ssh-XXXXXX/agent.12345`).
- The volume mount makes that socket available inside the container at `/ssh-agent`.
- The environment variable tells the SSH client inside the container where to find the agent socket.
- **No key material is transferred** — only a socket connection is forwarded.

:::warning Ensure $SSH_AUTH_SOCK is set
Before running `docker compose up`, confirm the variable is exported in your shell:

```bash
echo $SSH_AUTH_SOCK
# Should print a path like: /run/user/1000/keyring/ssh
```

If empty, start the agent and reload your shell profile (see Section 4).
:::

---

## 6. Container Expectations

For Tombolo Docker deployments, these requirements are already handled by the `jobs` image build:

- `git` and `openssh-client` are installed.
- GitHub SSH host keys are pre-populated in `known_hosts` (including `ssh.github.com:443` for SSH-over-443).
- `docker-compose.yml` and `docker-compose-sample.yml` already wire `SSH_AUTH_SOCK` into the `jobs` container.

In other words, you typically do not need to add extra container-level SSH/Git setup unless you are building a custom image outside the provided Tombolo Docker files.

---

## 7. Running the Workflow

### Steps to bring up the stack

1. Confirm the SSH agent is running and the key is loaded:
   ```bash
   ssh-add -l
   ```
2. Confirm `SSH_AUTH_SOCK` is set in your environment:
   ```bash
   echo $SSH_AUTH_SOCK
   ```
3. Start the services:
   ```bash
   docker compose up -d
   ```

### Verify GitHub access from inside the container

You can exec into the running container to confirm SSH access works:

```bash
docker compose exec jobs ssh -T git@github.com
```

A successful response looks like:

```
Hi org/repo! You've successfully authenticated, but GitHub does not provide shell access.
```

If the container successfully authenticates, the runtime `git clone` will work.

---

## 8. Security Notes & Common Mistakes

### Things you must NEVER do

| Do NOT                                                                                 | Why                                                                                       |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Copy the private key file into the container                                           | The key becomes part of the image layer and is exposed to anyone with registry access     |
| Use `COPY ~/.ssh /root/.ssh` in a Dockerfile                                           | Same as above — image layers are permanent and inspectable                                |
| Commit private keys to the repository                                                  | Exposed to all repository collaborators and git history forever                           |
| Use `ssh-agent` forwarding with `AllowAgentForwarding yes` on an untrusted remote host | A compromised remote host can use the forwarded agent to impersonate you                  |
| Use a personal SSH key as a deploy key                                                 | A personal key grants access to all your repositories; a deploy key is scoped to one repo |
| Give the deploy key write access unnecessarily                                         | Increases risk if the agent socket is ever compromised                                    |

### Why agent forwarding is preferred

Agent forwarding keeps the private key exclusively on the VM. The container only ever holds a socket-based reference that becomes invalid as soon as the host agent is stopped or the session ends. This means:

- Revoking access is instant (remove the key from `ssh-agent` or from GitHub).
- The container image is stateless with respect to credentials.
- Rotating keys does not require rebuilding or redeploying images.

### Troubleshooting common SSH errors

| Error                                     | Likely cause                                                      | Fix                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `Permission denied (publickey)`           | Deploy key not added to GitHub, or key not loaded in agent        | Run `ssh-add -l` and verify the key appears; re-add if missing                |
| `$SSH_AUTH_SOCK` is empty in container    | Agent not running or variable not set before `docker compose up`  | Start agent, re-export variable, then restart the container                   |
| `Host key verification failed`            | `known_hosts` not populated in the container                      | Add `ssh-keyscan github.com` to the Dockerfile                                |
| `Bad permissions` on socket               | Socket path permissions issue                                     | Check host socket permissions: `ls -la $SSH_AUTH_SOCK`                        |
| Agent works in shell but not in container | Variable set in interactive shell but not in systemd/cron context | Ensure the agent env vars are set in the startup context that launches Docker |

---

## 9. Key Takeaways

- **SSH private keys belong on the VM only** — never in images, containers, or source control.
- Use a **repository-scoped deploy key** with the minimum required permissions (read-only when possible).
- The `SSH_AUTH_SOCK` volume mount is a socket, not a file — no key material crosses into the container.
- Populate `known_hosts` at build time to avoid interactive prompts at runtime.
- Revoking access is simple: remove the deploy key from GitHub or clear the agent.

Following these practices keeps your container images credential-free and safe to distribute through any registry.
