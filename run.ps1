param($Request)

$path = "static/index.html"  # Change to desired static file path
if (Test-Path $path) {
    $content = Get-Content $path -Raw
    return @{
        statusCode = 200
        body = $content
        headers = @{
            "Content-Type" = "text/html"
        }
    }
} else {
    return @{
        statusCode = 404
        body = "File not found"
    }
}
