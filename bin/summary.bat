@REM Runs the gpt complete chat command
@echo off

@REM Get the current directory
set currentDir=%cd%

@REM Get the current drive
set currentDrive=%cd:~0,1%

@REM Ensure you are on correct drive
D:

@REM Navigate to root for windows
cd /

@REM TODO: Navigate to project root
cd {INPUT DIRECTORY}

@REM Run the command
node .\lib\scripts\summarization.js %*

@REM Navigate back to original drive
%currentDrive%:

@REM Navigate back to original directory
cd %currentDir%