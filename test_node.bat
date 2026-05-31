@echo off
cd /d "c:\Users\hp\Documents\Website mama"
node -e "require('fs').writeFileSync('node_test.txt', 'Node ' + process.version + ' arch=' + process.arch)" 2>nul
if exist node_test.txt (
    type node_test.txt
    del node_test.txt
) else (
    echo Node failed to write file
    echo Trying node -v directly:
    node -v 2>&1
)
