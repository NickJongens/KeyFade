param($Request)

# Check the requested path
if ($Request.Path -eq "/") {
    $path = "static/index.html"  # Path to your index.html file
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
} elseif ($Request.Path -eq "/app.js") {
    $path = "static/app.js"  # Path to your app.js file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        return @{
            statusCode = 200
            body = $content
            headers = @{
                "Content-Type" = "application/javascript"
            }
        }
    } else {
        return @{
            statusCode = 404
            body = "File not found"
        }
    }
} elseif ($Request.Path -eq "/styles.css") {
    $path = "static/styles.css"  # Path to your styles.css file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        return @{
            statusCode = 200
            body = $content
            headers = @{
                "Content-Type" = "text/css"
            }
        }
    } else {
        return @{
            statusCode = 404
            body = "File not found"
        }
    }
} else {
    return @{
        statusCode = 404
        body = "Not Found"
    }
}
