param(
    [Parameter(Mandatory = $true)][string]$Manifest,
    [Parameter(Mandatory = $true)][string]$Schema
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$schemas = [System.Xml.Schema.XmlSchemaSet]::new()
$schemas.XmlResolver = [System.Xml.XmlUrlResolver]::new()
[void]$schemas.Add('http://www.omg.org/spec/BPMN/20100524/MODEL', (Resolve-Path $Schema).Path)
$schemas.Compile()
$files = Get-Content -LiteralPath $Manifest -Raw | ConvertFrom-Json
$results = foreach ($file in $files) {
    $errors = [System.Collections.Generic.List[string]]::new()
    $settings = [System.Xml.XmlReaderSettings]::new()
    $settings.Schemas = $schemas
    $settings.ValidationType = [System.Xml.ValidationType]::Schema
    $settings.DtdProcessing = [System.Xml.DtdProcessing]::Prohibit
    $settings.XmlResolver = $null
    $settings.add_ValidationEventHandler({
        param($sender, $eventArgs)
        if ($eventArgs.Severity -eq [System.Xml.Schema.XmlSeverityType]::Error) {
            $errors.Add($eventArgs.Message)
        }
    })
    $reader = $null
    try {
        $reader = [System.Xml.XmlReader]::Create($file, $settings)
        while ($reader.Read()) { }
    } catch {
        $errors.Add($_.Exception.Message)
    } finally {
        if ($null -ne $reader) { $reader.Dispose() }
    }
    [PSCustomObject]@{ path = $file; status = $(if ($errors.Count -eq 0) { 'PASS' } else { 'FAIL' }); errors = @($errors.ToArray()) }
}
ConvertTo-Json -InputObject @($results) -Depth 5 -Compress