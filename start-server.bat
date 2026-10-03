@echo off
echo Starting local web server for White Birdie Academy...
echo.
echo The portal will open at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server when done.
echo.
python -m http.server 8000
