@echo off
cd /d "%~dp0server"
start "" "http://127.0.0.1:8080/index.html"
node server.js
pause