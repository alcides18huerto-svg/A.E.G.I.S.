param(
    [switch]$Serve,
    [switch]$NoBrowser,
    [int]$Port = 4173
)

$ErrorActionPreference = 'Stop'
$dist = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\dist'))
$index = Join-Path $dist 'index.html'
$url = "http://127.0.0.1:$Port/"

if (-not (Test-Path -LiteralPath $index -PathType Leaf)) {
    Write-Error 'Falta dist/index.html. Genera la compilacion del proyecto con npm run build.'
}

if (-not $Serve) {
    $expected = [IO.File]::ReadAllText($index)
    function Test-Preview {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1
            $html = [Text.Encoding]::UTF8.GetString($response.RawContentStream.ToArray())
            return $response.StatusCode -eq 200 -and $html -ceq $expected
        } catch {
            return $false
        }
    }

    if (-not (Test-Preview)) {
        $arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Serve -Port $Port"
        $server = Start-Process -FilePath (Join-Path $PSHOME 'powershell.exe') -ArgumentList $arguments -WindowStyle Hidden -PassThru
        $ready = $false
        for ($attempt = 0; $attempt -lt 20; $attempt++) {
            if (Test-Preview) {
                $ready = $true
                break
            }
            if ($server.HasExited) { break }
            Start-Sleep -Milliseconds 200
        }
        if (-not $ready) {
            Write-Error "No se pudo iniciar A.E.G.I.S. en $url. Comprueba si el puerto $Port esta ocupado."
        }
    }

    if (-not $NoBrowser) { Start-Process $url }
    return
}

$contentTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.json' = 'application/json'
    '.png'  = 'image/png'
    '.svg'  = 'image/svg+xml'
    '.md'   = 'text/plain; charset=utf-8'
}
$listener = [Net.HttpListener]::new()
$listener.Prefixes.Add($url)
try {
    $listener.Start()
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $response = $context.Response
        try {
            $relativePath = [Uri]::UnescapeDataString($context.Request.Url.AbsolutePath).TrimStart('/')
            if (-not $relativePath) { $relativePath = 'index.html' }
            $file = [IO.Path]::GetFullPath((Join-Path $dist $relativePath))
            if (-not $file.StartsWith($dist + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
            } elseif (Test-Path -LiteralPath $file -PathType Leaf) {
                $contentType = $contentTypes[[IO.Path]::GetExtension($file)]
                if (-not $contentType) { $contentType = 'application/octet-stream' }
                $response.ContentType = $contentType
                $response.ContentLength64 = (Get-Item -LiteralPath $file).Length
                if ($context.Request.HttpMethod -ne 'HEAD') {
                    $stream = [IO.File]::OpenRead($file)
                    try { $stream.CopyTo($response.OutputStream) } finally { $stream.Dispose() }
                }
            } else {
                $response.StatusCode = 404
            }
        } catch {
            $response.Abort()
        } finally {
            $response.Close()
        }
    }
} finally {
    $listener.Close()
}
