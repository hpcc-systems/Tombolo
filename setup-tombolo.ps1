#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RepoRoot = (Get-Location).Path
$AppDir   = Join-Path $RepoRoot "Tombolo"
$StateFile = Join-Path $RepoRoot ".tombolo-setup-state.json"

if (-not (Test-Path $AppDir -PathType Container)) {
    Write-Host "Error: expected Tombolo directory at $AppDir"
    exit 1
}

if (-not (Get-Command python3 -ErrorAction SilentlyContinue)) {
    Write-Host "Error: python3 is required but not found. Please install Python 3 and try again."
    exit 1
}

$EnvFile              = Join-Path $AppDir ".env"
$EnvSample            = Join-Path $AppDir ".env.sample"
$ClientEnvFile        = Join-Path $AppDir "client-reactjs\.env"
$ClientEnvSample      = Join-Path $AppDir "client-reactjs\.env.sample"
$NginxDir             = Join-Path $AppDir "client-reactjs\nginx\conf.d"
$NginxTemplate        = Join-Path $NginxDir "nginx.conf.template"
$NginxNoSsl           = Join-Path $NginxDir "nginx.conf.template-no-ssl"
$NginxSsl             = Join-Path $NginxDir "nginx.conf.template-ssl"
$ClusterWhitelist     = Join-Path $AppDir "server\cluster-whitelist.js"
$ClusterWhitelistSample = Join-Path $AppDir "server\cluster-whitelist.sample.js"
$ComposeFile          = Join-Path $AppDir "docker-compose.yml"
$ComposeSample        = Join-Path $AppDir "docker-compose-sample.yml"

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

function Say {
    param([string]$Message = "")
    Write-Host $Message
}

function Prompt-Input {
    param([string]$Message, [string]$DefaultValue = "")
    if ($DefaultValue -ne "") {
        $val = Read-Host "$Message [$DefaultValue]"
        if ([string]::IsNullOrEmpty($val)) { $val = $DefaultValue }
    } else {
        $val = Read-Host $Message
    }
    return $val
}

function Prompt-Required {
    param([string]$Message, [string]$DefaultValue = "")
    while ($true) {
        $val = Prompt-Input $Message $DefaultValue
        if (-not [string]::IsNullOrEmpty($val)) { return $val }
        Say "Value is required."
    }
}

function Prompt-Port {
    param([string]$Message, [string]$DefaultValue = "")
    while ($true) {
        $val = Prompt-Input $Message $DefaultValue
        $n = 0
        if ([int]::TryParse($val, [ref]$n) -and $n -ge 1 -and $n -le 65535) { return $val }
        Say "Please enter a valid port number (1-65535)."
    }
}

function Confirm-Prompt {
    param([string]$Message, [bool]$DefaultYes = $false)
    $suffix = if ($DefaultYes) { "[Y/n]" } else { "[y/N]" }
    $val = Read-Host "$Message $suffix"
    if ([string]::IsNullOrEmpty($val)) { return $DefaultYes }
    return ($val -match '^(y|Y|yes|YES)$')
}

function Ensure-FileFromSample {
    param([string]$Target, [string]$Sample)
    if (Test-Path $Target) {
        if (Confirm-Prompt "$Target exists. Overwrite with sample?" $false) {
            Copy-Item $Sample $Target -Force
            Say "Overwrote $Target from sample."
        } else {
            Say "Keeping existing $Target."
        }
    } else {
        Copy-Item $Sample $Target -Force
        Say "Created $Target from sample."
    }
}

function Set-EnvValue {
    param([string]$FilePath, [string]$Key, [string]$Value)
    $lines = @()
    if (Test-Path $FilePath) { $lines = Get-Content $FilePath -Encoding UTF8 }
    $pattern  = "^\s*$([regex]::Escape($Key))="
    $replaced = $false
    $out = foreach ($line in $lines) {
        if ($line -match $pattern) { "$Key=$Value"; $replaced = $true }
        else { $line }
    }
    if (-not $replaced) { $out = @($out) + "$Key=$Value" }
    $out | Set-Content $FilePath -Encoding UTF8
}

function Read-EnvValue {
    param([string]$FilePath, [string]$Key)
    if (-not (Test-Path $FilePath)) { return "" }
    $pattern = "^\s*$([regex]::Escape($Key))\s*=\s*(.*)\s*$"
    foreach ($line in (Get-Content $FilePath -Encoding UTF8)) {
        if ($line.TrimStart().StartsWith("#")) { continue }
        if ($line -match $pattern) {
            $val = $Matches[1].Trim()
            if (($val.StartsWith("'") -and $val.EndsWith("'")) -or
                ($val.StartsWith('"') -and $val.EndsWith('"'))) {
                $val = $val.Substring(1, $val.Length - 2)
            }
            return $val
        }
    }
    return ""
}

function Gen-Secret {
    $bytes = [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)
    return [System.Convert]::ToBase64String($bytes)
}

function Update-ComposeForCustomServices {
    param([string]$FilePath, [bool]$DisableMysql, [bool]$DisableRedis)
    if (-not (Test-Path $FilePath)) { return }

    $lines          = Get-Content $FilePath -Encoding UTF8
    $serviceTargets = @()
    if ($DisableMysql) { $serviceTargets += "mysql_db" }
    if ($DisableRedis) { $serviceTargets += "redis" }

    $out                = [System.Collections.Generic.List[string]]::new()
    $inServiceBlock     = $null
    $serviceIndent      = -1
    $dependsOnIndent    = -1
    $dependsOnBuffer    = [System.Collections.Generic.List[string]]::new()
    $dependsOnKept      = 0
    $skipDepEntry       = $false
    $skipDepEntryIndent = -1

    foreach ($raw in $lines) {
        $stripped = $raw.TrimStart()
        $indent   = $raw.Length - $stripped.Length

        # Track service blocks (2-space indented names)
        if ($raw -match '^\s{2}[A-Za-z0-9_]+:\s*$') {
            $inServiceBlock = $stripped.TrimEnd(':')
            $serviceIndent  = $indent
        } elseif ($null -ne $inServiceBlock -and $stripped.Length -gt 0 -and $indent -le $serviceIndent) {
            $inServiceBlock = $null
            $serviceIndent  = -1
        }

        # Comment out target service blocks
        if ($null -ne $inServiceBlock -and $serviceTargets -contains $inServiceBlock -and $serviceIndent -eq 2) {
            $out.Add((if ($stripped.StartsWith("#")) { $raw } else { "# " + $raw }))
            continue
        }

        # Handle depends_on blocks
        if ($raw -match '^\s*depends_on:\s*$') {
            $dependsOnIndent    = $indent
            $dependsOnBuffer.Clear()
            $dependsOnBuffer.Add($raw)
            $dependsOnKept      = 0
            $skipDepEntry       = $false
            $skipDepEntryIndent = -1
            continue
        }

        if ($dependsOnIndent -ge 0) {
            if ($stripped.Length -gt 0 -and $indent -le $dependsOnIndent) {
                # Flush buffer then fall through
                if ($dependsOnKept -gt 0) { foreach ($bl in $dependsOnBuffer) { $out.Add($bl) } }
                $dependsOnIndent    = -1
                $dependsOnBuffer.Clear()
                $dependsOnKept      = 0
                $skipDepEntry       = $false
                $skipDepEntryIndent = -1
                # fall through to normal processing below
            } else {
                if ($raw -match '^\s*([A-Za-z0-9_]+):\s*$') {
                    $entry = $Matches[1]
                    if ($serviceTargets -contains $entry) {
                        $skipDepEntry       = $true
                        $skipDepEntryIndent = $indent
                    } else {
                        $skipDepEntry       = $false
                        $skipDepEntryIndent = -1
                        $dependsOnKept++
                        $dependsOnBuffer.Add($raw)
                    }
                } elseif ($skipDepEntry -and $skipDepEntryIndent -ge 0 -and $indent -gt $skipDepEntryIndent) {
                    # skip child keys of a removed depends_on entry
                } else {
                    $dependsOnBuffer.Add($raw)
                }
                continue
            }
        }

        # Skip entrypoint/list lines referencing disabled services
        $skip = $false
        if ($DisableMysql -and $raw -match "mysql_db") {
            if ($raw -match 'entrypoint|depends_on')            { $skip = $true }
            if ($stripped -match '^\s*-\s*mysql_db\s*$')        { $skip = $true }
        }
        if ($DisableRedis -and $raw -match "\bredis\b") {
            if ($raw -match 'entrypoint|depends_on')            { $skip = $true }
            if ($stripped -match '^\s*-\s*redis\s*$')           { $skip = $true }
        }
        if (-not $skip) { $out.Add($raw) }
    }

    # Flush a trailing depends_on buffer
    if ($dependsOnIndent -ge 0 -and $dependsOnKept -gt 0) {
        foreach ($bl in $dependsOnBuffer) { $out.Add($bl) }
    }

    $out | Set-Content $FilePath -Encoding UTF8
}

function Prompt-ChangeValue {
    param([string]$FilePath, [string]$Key, [string]$Label, [string]$CurrentValue)
    if (Confirm-Prompt "Change ${Label}?" $false) {
        $val = Prompt-Input $Label $CurrentValue
        Set-EnvValue $FilePath $Key $val
        return $val
    }
    return $CurrentValue
}

function Prompt-ChangePort {
    param([string]$FilePath, [string]$Key, [string]$Label, [string]$CurrentValue)
    if (Confirm-Prompt "Change ${Label}?" $false) {
        $val = Prompt-Port $Label $CurrentValue
        Set-EnvValue $FilePath $Key $val
        return $val
    }
    return $CurrentValue
}

# ---------------------------------------------------------------------------
# State management
# ---------------------------------------------------------------------------

function Get-StateValue {
    param([string]$Key, [string]$Default = "")
    if (-not (Test-Path $StateFile)) { return $Default }
    try {
        $data = Get-Content $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $val  = $data.$Key
        return if ($null -eq $val) { $Default } else { [string]$val }
    } catch { return $Default }
}

function Set-StateValue {
    param([string]$Key, [string]$Value)
    $data = @{}
    if (Test-Path $StateFile) {
        try {
            $existing = Get-Content $StateFile -Raw -Encoding UTF8 | ConvertFrom-Json
            foreach ($prop in $existing.PSObject.Properties) { $data[$prop.Name] = $prop.Value }
        } catch {}
    }
    $data[$Key] = $Value
    $data | ConvertTo-Json | Set-Content $StateFile -Encoding UTF8
}

function Load-State  { return Get-StateValue "step" "0" }
function Write-State { param([string]$Step) Set-StateValue "step" $Step }
function Clear-State { if (Test-Path $StateFile) { Remove-Item $StateFile -Force } }

# ---------------------------------------------------------------------------
# Dependency / daemon checks
# ---------------------------------------------------------------------------

function Check-Dependencies {
    $missing = @()
    if ($installType -eq "docker") {
        if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { $missing += "docker" }
    } else {
        if (-not (Get-Command pnpm  -ErrorAction SilentlyContinue)) { $missing += "pnpm" }
        if (-not (Get-Command node  -ErrorAction SilentlyContinue)) { $missing += "node" }
    }
    if ($missing.Count -gt 0) {
        Say "Error: Missing required dependencies: $($missing -join ', ')"
        Say "Please install them and run this script again."
        exit 1
    }
}

function Wait-ForDockerDaemon {
    while ($true) {
        docker info 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { break }
        Say ""
        Say "Warning: Docker daemon is not running. Please start Docker and press Enter to try again."
        Read-Host | Out-Null
    }
}

function Detect-ExistingSetup {
    return (Test-Path $EnvFile) -or (Test-Path $ClientEnvFile) -or
           (Test-Path $ClusterWhitelist) -or (Test-Path $ComposeFile) -or
           (Test-Path $NginxTemplate)
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

Say "Tombolo setup helper"

$resumeMode     = $false
$forceCompose   = $false
$useDockerDb    = ""
$useDockerRedis = ""
$installType    = ""

if ((Detect-ExistingSetup) -or (Test-Path $StateFile)) {
    if (Confirm-Prompt "Found existing setup files or state. Continue where you left off?" $true) {
        $resumeMode = $true
    } else {
        Clear-State
        Say "Starting over."
    }
}

$currentStep = [int](Load-State)

if ($resumeMode) {
    $installType    = Get-StateValue "install_type" ""
    $useDockerDb    = Get-StateValue "use_docker_db" ""
    $useDockerRedis = Get-StateValue "use_docker_redis" ""
    $forceCompose   = (Get-StateValue "force_compose" "false") -eq "true"
}

if ($installType -ne "") {
    Say "Using saved install type: $installType"
} else {
    while ($true) {
        $installType = Prompt-Input "Install type (docker/local)" "docker"
        if ($installType -eq "docker" -or $installType -eq "local") { break }
        Say "Invalid install type. Please enter 'docker' or 'local'."
    }
}
Set-StateValue "install_type" $installType

Check-Dependencies

if ($installType -eq "docker") {
    Wait-ForDockerDaemon
}

if ($installType -eq "docker" -and (Test-Path $ComposeFile)) {
    if (-not $forceCompose) {
        if (Confirm-Prompt "docker-compose.yml exists. Overwrite with sample?" $false) {
            $forceCompose = $true
        }
    }
}
Set-StateValue "force_compose" ($forceCompose.ToString().ToLower())

if ($installType -eq "docker") {
    if ($useDockerDb -eq "") {
        $useDockerDb = if (Confirm-Prompt "Use Docker-provided MySQL (mysql_db)?" $true) { "true" } else { "false" }
    } else {
        Say "Using saved Docker MySQL preference: $useDockerDb"
    }
    Set-StateValue "use_docker_db" $useDockerDb

    if ($useDockerRedis -eq "") {
        $useDockerRedis = if (Confirm-Prompt "Use Docker-provided Redis (redis)?" $true) { "true" } else { "false" }
    } else {
        Say "Using saved Docker Redis preference: $useDockerRedis"
    }
    Set-StateValue "use_docker_redis" $useDockerRedis
}

# ---------------------------------------------------------------------------
# Step 1: Ensure .env files
# ---------------------------------------------------------------------------
Say ""
Say "Step 1: Ensure .env files"
if (-not $resumeMode -or $currentStep -lt 1) {
    if ((Test-Path $EnvFile) -or (Test-Path $ClientEnvFile)) {
        if (Confirm-Prompt "Keep existing .env files?" $true) {
            Say "Keeping existing .env files."
        } else {
            Ensure-FileFromSample $EnvFile $EnvSample
            Ensure-FileFromSample $ClientEnvFile $ClientEnvSample
        }
    } else {
        Ensure-FileFromSample $EnvFile $EnvSample
        Ensure-FileFromSample $ClientEnvFile $ClientEnvSample
    }
    Write-State "1"
}

# ---------------------------------------------------------------------------
# Step 2: Configure environment
# ---------------------------------------------------------------------------
Say ""
Say "Step 2: Configure environment"
if (-not $resumeMode -or $currentStep -lt 2) {
    $changeVars = $false
    if ((Test-Path $EnvFile) -or (Test-Path $ClientEnvFile)) {
        if (Confirm-Prompt "Would you like to change any variables?" $false) { $changeVars = $true }
    } else {
        $changeVars = $true
    }

    $hostnameVal      = Read-EnvValue $EnvFile "HOSTNAME"
    $serverPortVal    = Read-EnvValue $EnvFile "SERVER_PORT"
    $httpPortVal      = Read-EnvValue $EnvFile "HTTP_PORT"
    $httpsPortVal     = Read-EnvValue $EnvFile "HTTPS_PORT"
    $certPathVal      = Read-EnvValue $EnvFile "CERT_PATH"
    $certNameVal      = Read-EnvValue $EnvFile "CERTIFICATE_NAME"
    $certKeyVal       = Read-EnvValue $EnvFile "CERTIFICATE_KEY"
    $dbHostnameVal    = Read-EnvValue $EnvFile "DB_HOSTNAME"
    $dbPortVal        = Read-EnvValue $EnvFile "DB_PORT"
    $dbNameVal        = Read-EnvValue $EnvFile "DB_NAME"
    $dbUsernameVal    = Read-EnvValue $EnvFile "DB_USERNAME"
    $dbPasswordVal    = Read-EnvValue $EnvFile "DB_PASSWORD"
    $mysqlSslVal      = Read-EnvValue $EnvFile "MYSQL_SSL_ENABLED"
    $redisHostVal     = Read-EnvValue $EnvFile "REDIS_HOST"
    $redisPortVal     = Read-EnvValue $EnvFile "REDIS_PORT"
    $redisUserVal     = Read-EnvValue $EnvFile "REDIS_USER"
    $redisPasswordVal = Read-EnvValue $EnvFile "REDIS_PASSWORD"
    $redisDbVal       = Read-EnvValue $EnvFile "REDIS_DB"
    $jwtSecretVal     = Read-EnvValue $EnvFile "JWT_SECRET"
    $jwtRefreshVal    = Read-EnvValue $EnvFile "JWT_REFRESH_SECRET"
    $csrfSecretVal    = Read-EnvValue $EnvFile "CSRF_SECRET"
    $encKeyVal        = Read-EnvValue $EnvFile "ENCRYPTION_KEY"
    $tenantIdVal      = Read-EnvValue $EnvFile "TENANT_ID"
    $clientIdVal      = Read-EnvValue $EnvFile "CLIENT_ID"
    $clientSecretVal  = Read-EnvValue $EnvFile "CLIENT_SECRET"
    $redirectUriVal   = Read-EnvValue $EnvFile "REDIRECT_URI"
    $emailSmtpHostVal = Read-EnvValue $EnvFile "EMAIL_SMTP_HOST"
    $emailPortVal     = Read-EnvValue $EnvFile "EMAIL_PORT"
    $emailSenderVal   = Read-EnvValue $EnvFile "EMAIL_SENDER"
    $emailUserVal     = Read-EnvValue $EnvFile "EMAIL_USER"
    $emailPassVal     = Read-EnvValue $EnvFile "EMAIL_PASS"

    # Auto-generate empty secrets for new installs
    $secretsGenerated = $false
    if ([string]::IsNullOrEmpty($jwtSecretVal))  { $jwtSecretVal  = Gen-Secret; Set-EnvValue $EnvFile "JWT_SECRET"         $jwtSecretVal;  $secretsGenerated = $true }
    if ([string]::IsNullOrEmpty($jwtRefreshVal)) { $jwtRefreshVal = Gen-Secret; Set-EnvValue $EnvFile "JWT_REFRESH_SECRET" $jwtRefreshVal; $secretsGenerated = $true }
    if ([string]::IsNullOrEmpty($csrfSecretVal)) { $csrfSecretVal = Gen-Secret; Set-EnvValue $EnvFile "CSRF_SECRET"        $csrfSecretVal; $secretsGenerated = $true }
    if ([string]::IsNullOrEmpty($encKeyVal))     { $encKeyVal     = Gen-Secret; Set-EnvValue $EnvFile "ENCRYPTION_KEY"     $encKeyVal;     $secretsGenerated = $true }
    if ($secretsGenerated) { Say "Auto-generated empty secrets (JWT, CSRF, ENCRYPTION_KEY)." }

    if ($changeVars) {
        $hostnameVal   = Prompt-ChangeValue $EnvFile "HOSTNAME"    "Hostname"    (if ($hostnameVal)   { $hostnameVal }   else { "localhost" })
        $serverPortVal = Prompt-ChangePort  $EnvFile "SERVER_PORT" "Server port" (if ($serverPortVal) { $serverPortVal } else { "3001" })
        $httpPortVal   = Prompt-ChangePort  $EnvFile "HTTP_PORT"   "HTTP port"   (if ($httpPortVal)   { $httpPortVal }   else { "3000" })
        $httpsPortVal  = Prompt-ChangePort  $EnvFile "HTTPS_PORT"  "HTTPS port"  (if ($httpsPortVal)  { $httpsPortVal }  else { "443" })

        if (Confirm-Prompt "Change SSL/Nginx settings?" $false) {
            if (Confirm-Prompt "Use SSL for Nginx?" $false) {
                $certPathVal = Prompt-Required "Cert path"                (if ($certPathVal) { $certPathVal } else { "/certs" })
                $certNameVal = Prompt-Required "Certificate file name"    $certNameVal
                $certKeyVal  = Prompt-Required "Certificate key file name" $certKeyVal
            } else {
                $certPathVal = "/certs"; $certNameVal = ""; $certKeyVal = ""
            }
            Set-EnvValue $EnvFile "CERT_PATH"        $certPathVal
            Set-EnvValue $EnvFile "CERTIFICATE_NAME" $certNameVal
            Set-EnvValue $EnvFile "CERTIFICATE_KEY"  $certKeyVal
        }

        if (Confirm-Prompt "Change database settings?" $false) {
            if ($installType -eq "docker" -and $useDockerDb -eq "true") {
                $dbHostnameVal = "mysql_db"; $dbPortVal = "3306"
            } else {
                $dbHostnameVal = Prompt-Required "DB hostname" (if ($dbHostnameVal) { $dbHostnameVal } else { "localhost" })
                $dbPortVal     = Prompt-Port     "DB port"     (if ($dbPortVal)     { $dbPortVal }     else { "3306" })
            }
            $dbNameVal     = Prompt-Required "DB name"     (if ($dbNameVal)     { $dbNameVal }     else { "tombolo" })
            $dbUsernameVal = Prompt-Required "DB username" (if ($dbUsernameVal) { $dbUsernameVal } else { "database_user" })
            $dbPasswordVal = Prompt-Required "DB password" (if ($dbPasswordVal) { $dbPasswordVal } else { "database_user_password" })
            $mysqlSslVal   = if (Confirm-Prompt "Enable MySQL SSL?" $false) { "true" } else { "false" }
            Set-EnvValue $EnvFile "DB_HOSTNAME"       $dbHostnameVal
            Set-EnvValue $EnvFile "DB_PORT"           $dbPortVal
            Set-EnvValue $EnvFile "DB_NAME"           $dbNameVal
            Set-EnvValue $EnvFile "DB_USERNAME"       $dbUsernameVal
            Set-EnvValue $EnvFile "DB_PASSWORD"       $dbPasswordVal
            Set-EnvValue $EnvFile "MYSQL_SSL_ENABLED" $mysqlSslVal
        }

        if (Confirm-Prompt "Change Redis settings?" $false) {
            if ($installType -eq "docker" -and $useDockerRedis -eq "true") {
                $redisHostVal = "redis"; $redisPortVal = "6379"
            } else {
                $redisHostVal = Prompt-Required "Redis hostname" (if ($redisHostVal) { $redisHostVal } else { "localhost" })
                $redisPortVal = Prompt-Port     "Redis port"     (if ($redisPortVal) { $redisPortVal } else { "6379" })
            }
            $redisUserVal     = Prompt-Input "Redis username (optional)" $redisUserVal
            $redisPasswordVal = Prompt-Input "Redis password (optional)" $redisPasswordVal
            $redisDbVal       = Prompt-Required "Redis DB" (if ($redisDbVal) { $redisDbVal } else { "0" })
            Set-EnvValue $EnvFile "REDIS_HOST"     $redisHostVal
            Set-EnvValue $EnvFile "REDIS_PORT"     $redisPortVal
            Set-EnvValue $EnvFile "REDIS_USER"     $redisUserVal
            Set-EnvValue $EnvFile "REDIS_PASSWORD" $redisPasswordVal
            Set-EnvValue $EnvFile "REDIS_DB"       $redisDbVal
        }

        if (Confirm-Prompt "Change JWT/CSRF/Encryption secrets?" $false) {
            if (Confirm-Prompt "Auto-generate JWT/CSRF secrets and ENCRYPTION_KEY?" $true) {
                $jwtSecretVal  = Gen-Secret
                $jwtRefreshVal = Gen-Secret
                $csrfSecretVal = Gen-Secret
                $encKeyVal     = Gen-Secret
            } else {
                $jwtSecretVal  = Prompt-Required "JWT_SECRET"         $jwtSecretVal
                $jwtRefreshVal = Prompt-Required "JWT_REFRESH_SECRET" $jwtRefreshVal
                $csrfSecretVal = Prompt-Required "CSRF_SECRET"        $csrfSecretVal
                $encKeyVal     = Prompt-Required "ENCRYPTION_KEY"     $encKeyVal
            }
            Set-EnvValue $EnvFile "JWT_SECRET"         $jwtSecretVal
            Set-EnvValue $EnvFile "JWT_REFRESH_SECRET" $jwtRefreshVal
            Set-EnvValue $EnvFile "CSRF_SECRET"        $csrfSecretVal
            Set-EnvValue $EnvFile "ENCRYPTION_KEY"     $encKeyVal
        }

        if (Confirm-Prompt "Change Azure AD authentication settings?" $false) {
            if (Confirm-Prompt "Enable Azure AD authentication?" $false) {
                $tenantIdVal     = Prompt-Required "Tenant ID"     $tenantIdVal
                $clientIdVal     = Prompt-Required "CLIENT_ID"     $clientIdVal
                $clientSecretVal = Prompt-Required "CLIENT_SECRET" $clientSecretVal
                $redirectUriVal  = Prompt-Required "REDIRECT_URI"  (if ($redirectUriVal) { $redirectUriVal } else { "http://localhost:3000" })
            } else {
                $tenantIdVal = ""; $clientIdVal = ""; $clientSecretVal = ""; $redirectUriVal = ""
            }
            Set-EnvValue $EnvFile "TENANT_ID"     $tenantIdVal
            Set-EnvValue $EnvFile "CLIENT_ID"     $clientIdVal
            Set-EnvValue $EnvFile "CLIENT_SECRET" $clientSecretVal
            Set-EnvValue $EnvFile "REDIRECT_URI"  $redirectUriVal
        }

        if (Confirm-Prompt "Change email (SMTP) settings?" $false) {
            if (Confirm-Prompt "Configure email (SMTP) now?" $true) {
                $emailSmtpHostVal = Prompt-Required "Email SMTP host" $emailSmtpHostVal
                $emailPortVal     = Prompt-Port     "Email port"      (if ($emailPortVal)   { $emailPortVal }   else { "25" })
                $emailSenderVal   = Prompt-Required "Email sender"    (if ($emailSenderVal) { $emailSenderVal } else { "donotreply@tombolo.com" })
                $emailUserVal     = Prompt-Input    "Email user (optional)" $emailUserVal
                $emailPassVal     = Prompt-Input    "Email pass (optional)" $emailPassVal
            } else {
                $emailSmtpHostVal = ""; $emailPortVal = ""; $emailSenderVal = "donotreply@tombolo.com"
                $emailUserVal = ""; $emailPassVal = ""
            }
            Set-EnvValue $EnvFile "EMAIL_SMTP_HOST" $emailSmtpHostVal
            Set-EnvValue $EnvFile "EMAIL_PORT"      $emailPortVal
            Set-EnvValue $EnvFile "EMAIL_SENDER"    $emailSenderVal
            Set-EnvValue $EnvFile "EMAIL_USER"      $emailUserVal
            Set-EnvValue $EnvFile "EMAIL_PASS"      $emailPassVal
        }
    }

    $useSsl = (-not [string]::IsNullOrEmpty($certNameVal)) -or (-not [string]::IsNullOrEmpty($certKeyVal))

    if ([string]::IsNullOrEmpty($useDockerDb))    { $useDockerDb    = if ($dbHostnameVal -eq "mysql_db") { "true" } else { "false" } }
    if ([string]::IsNullOrEmpty($useDockerRedis)) { $useDockerRedis = if ($redisHostVal  -eq "redis")    { "true" } else { "false" } }

    # Always force-apply Docker service hostnames
    if ($installType -eq "docker") {
        if ($useDockerDb -eq "true") {
            if ($dbHostnameVal -ne "mysql_db") { Say "Setting DB_HOSTNAME=mysql_db for Docker." }
            $dbHostnameVal = "mysql_db"; $dbPortVal = "3306"
            Set-EnvValue $EnvFile "DB_HOSTNAME" "mysql_db"
            Set-EnvValue $EnvFile "DB_PORT"     "3306"
        }
        if ($useDockerRedis -eq "true") {
            if ($redisHostVal -ne "redis") { Say "Setting REDIS_HOST=redis for Docker." }
            $redisHostVal = "redis"; $redisPortVal = "6379"
            Set-EnvValue $EnvFile "REDIS_HOST" "redis"
            Set-EnvValue $EnvFile "REDIS_PORT" "6379"
        }
    }

    $webScheme  = if ($useSsl) { "https" } else { "http" }
    $webPort    = if ($useSsl) { $httpsPortVal } else { $httpPortVal }
    $webUrlVal  = "${webScheme}://${hostnameVal}:${webPort}"
    Set-EnvValue $EnvFile "WEB_URL" $webUrlVal

    $useAzure = (-not [string]::IsNullOrEmpty($clientIdVal)) -or
                (-not [string]::IsNullOrEmpty($tenantIdVal)) -or
                (-not [string]::IsNullOrEmpty($redirectUriVal))

    Set-EnvValue $ClientEnvFile "PORT"           $httpPortVal
    Set-EnvValue $ClientEnvFile "VITE_PROXY_URL" "http://${hostnameVal}:${serverPortVal}"
    if ($useAzure) {
        Set-EnvValue $ClientEnvFile "VITE_AUTH_METHODS"       "traditional,azure"
        Set-EnvValue $ClientEnvFile "VITE_AZURE_CLIENT_ID"    $clientIdVal
        Set-EnvValue $ClientEnvFile "VITE_AZURE_TENANT_ID"    $tenantIdVal
        Set-EnvValue $ClientEnvFile "VITE_AZURE_REDIRECT_URI" $redirectUriVal
    } else {
        Set-EnvValue $ClientEnvFile "VITE_AUTH_METHODS"       "traditional"
        Set-EnvValue $ClientEnvFile "VITE_AZURE_CLIENT_ID"    ""
        Set-EnvValue $ClientEnvFile "VITE_AZURE_TENANT_ID"    ""
        Set-EnvValue $ClientEnvFile "VITE_AZURE_REDIRECT_URI" ""
    }

    Write-State "2"
} else {
    # Resume path: read back values we need for later steps
    $hostnameVal    = Read-EnvValue $EnvFile "HOSTNAME"
    $serverPortVal  = Read-EnvValue $EnvFile "SERVER_PORT"
    $httpPortVal    = Read-EnvValue $EnvFile "HTTP_PORT"
    $httpsPortVal   = Read-EnvValue $EnvFile "HTTPS_PORT"
    $certNameVal    = Read-EnvValue $EnvFile "CERTIFICATE_NAME"
    $certKeyVal     = Read-EnvValue $EnvFile "CERTIFICATE_KEY"
    $dbHostnameVal  = Read-EnvValue $EnvFile "DB_HOSTNAME"
    $redisHostVal   = Read-EnvValue $EnvFile "REDIS_HOST"
    $clientIdVal    = Read-EnvValue $EnvFile "CLIENT_ID"
    $tenantIdVal    = Read-EnvValue $EnvFile "TENANT_ID"
    $redirectUriVal = Read-EnvValue $EnvFile "REDIRECT_URI"
    $viteAuthMethods = Read-EnvValue $ClientEnvFile "VITE_AUTH_METHODS"

    $useSsl         = (-not [string]::IsNullOrEmpty($certNameVal)) -or (-not [string]::IsNullOrEmpty($certKeyVal))
    $useDockerDb    = if ($dbHostnameVal -eq "mysql_db") { "true" } else { "false" }
    $useDockerRedis = if ($redisHostVal  -eq "redis")    { "true" } else { "false" }
    $useAzure       = ($viteAuthMethods -like "*azure*") -or
                      (-not [string]::IsNullOrEmpty($clientIdVal)) -or
                      (-not [string]::IsNullOrEmpty($tenantIdVal))
}

# ---------------------------------------------------------------------------
# Step 3: Configure Nginx template
# ---------------------------------------------------------------------------
Say ""
Say "Step 3: Configure Nginx template"
if (-not $resumeMode -or $currentStep -lt 3) {
    if ($useSsl) {
        if (Test-Path $NginxSsl) {
            if (Confirm-Prompt "Use SSL Nginx template (overwrite nginx.conf.template)?" $true) {
                Copy-Item $NginxSsl $NginxTemplate -Force
                Say "Updated $NginxTemplate from SSL template."
            }
        } else { Say "Warning: SSL template not found at $NginxSsl" }
    } else {
        if (Test-Path $NginxNoSsl) {
            if (Confirm-Prompt "Use non-SSL Nginx template (overwrite nginx.conf.template)?" $true) {
                Copy-Item $NginxNoSsl $NginxTemplate -Force
                Say "Updated $NginxTemplate from non-SSL template."
            }
        } else { Say "Warning: non-SSL template not found at $NginxNoSsl" }
    }
    Write-State "3"
}

# ---------------------------------------------------------------------------
# Step 4: Cluster whitelist
# ---------------------------------------------------------------------------
Say ""
Say "Step 4: Cluster whitelist"
if (-not $resumeMode -or $currentStep -lt 4) {
    if (Confirm-Prompt "Would you like to add clusters to the whitelist?" $false) {
        $clusters = [System.Collections.Generic.List[hashtable]]::new()
        while ($true) {
            $clusters.Add(@{
                name       = Prompt-Required "Cluster name"
                thor       = Prompt-Required "Thor host (thor)"
                thor_port  = Prompt-Port     "Thor port (thor_port)"  "18010"
                roxie      = Prompt-Required "Roxie host (roxie)"
                roxie_port = Prompt-Port     "Roxie port (roxie_port)" "18002"
            })
            if (-not (Confirm-Prompt "Add another cluster?" $false)) { break }
        }

        $sb = [System.Text.StringBuilder]::new()
        [void]$sb.AppendLine("const clusters = [")
        foreach ($c in $clusters) {
            [void]$sb.AppendLine("  {")
            foreach ($key in @("name","thor","thor_port","roxie","roxie_port")) {
                [void]$sb.AppendLine("    ${key}: $($c[$key] | ConvertTo-Json),")
            }
            [void]$sb.AppendLine("  },")
        }
        [void]$sb.AppendLine("];")
        [void]$sb.AppendLine("")
        [void]$sb.Append("export default clusters;")
        $sb.ToString() | Set-Content $ClusterWhitelist -Encoding UTF8
        Say "Wrote $ClusterWhitelist with your clusters."
    } else {
        if (Test-Path $ClusterWhitelist) {
            if (Confirm-Prompt "Keep existing $ClusterWhitelist?" $true) {
                Say "Keeping existing $ClusterWhitelist."
            } else {
                Copy-Item $ClusterWhitelistSample $ClusterWhitelist -Force
                Say "Overwrote $ClusterWhitelist from sample."
            }
        } else {
            Copy-Item $ClusterWhitelistSample $ClusterWhitelist -Force
            Say "Created $ClusterWhitelist from sample."
        }
    }
    Write-State "4"
}

# ---------------------------------------------------------------------------
# Step 5
# ---------------------------------------------------------------------------
Say ""
if ($installType -eq "docker") {
    Say "Step 5: Docker compose"

    if (-not $resumeMode -or $currentStep -lt 5 -or $forceCompose) {
        if (Test-Path $ComposeFile) {
            if ($forceCompose) { Copy-Item $ComposeSample $ComposeFile -Force; Say "Overwrote $ComposeFile from sample." }
            else               { Say "Found existing $ComposeFile." }
        } else {
            Copy-Item $ComposeSample $ComposeFile -Force
            Say "Created $ComposeFile from sample."
        }
        Write-State "5"
    }

    if (-not $resumeMode -or $currentStep -lt 6) {
        if ($useDockerDb -eq "false" -or $useDockerRedis -eq "false") {
            Update-ComposeForCustomServices $ComposeFile ($useDockerDb -eq "false") ($useDockerRedis -eq "false")
            Say "Updated $ComposeFile to disable custom services."
        }
        Write-State "6"
    }

    if (Confirm-Prompt "Run docker compose build and up -d now?" $false) {
        Push-Location $AppDir
        try {
            if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
                docker-compose build; docker-compose up -d
            } else {
                docker compose build; docker compose up -d
            }
        } finally { Pop-Location }
        Say ""
        Say "Database initialization (create, migrate, seed) runs automatically via the server entrypoint."
        Say "Monitor startup progress with: docker compose logs -f node"
        Write-State "7"
    } else {
        Say "Skipping docker compose."
        Say ""
        Say "When you run 'docker compose up' later, database initialization"
        Say "(create, migrate, seed) will run automatically via the server entrypoint."
    }
} else {
    Say "Step 5: Local dev commands"
    if (Confirm-Prompt "Run pnpm install, pnpm db:init, pnpm dev now?" $false) {
        Push-Location $RepoRoot
        try { pnpm install; pnpm db:init; pnpm dev }
        finally { Pop-Location }
    } else {
        Say "Skipping local dev commands."
        Say ""
        Say "To start manually, run:"
        Say "  pnpm install"
        Say "  pnpm db:init"
        Say "  pnpm dev"
    }
}

Say ""
Say "Setup complete."
