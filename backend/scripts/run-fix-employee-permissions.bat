@echo off
echo ========================================
echo Configuration des permissions Employe
echo ========================================
echo.

REM Vérifier que MySQL est accessible
mysql --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] MySQL n'est pas trouve dans le PATH
    echo Veuillez utiliser le chemin complet vers mysql.exe
    pause
    exit /b 1
)

echo [INFO] Execution du script SQL de correction...
echo.

REM Exécuter le script SQL
REM Adapter la commande selon votre configuration
mysql -u root -p hrms < scripts\fix-employee-permissions.sql

if errorlevel 1 (
    echo.
    echo [ERREUR] Le script SQL a echoue
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Permissions configurees avec succes!
echo.
echo Prochaines etapes:
echo 1. Deconnectez-vous de l'application
echo 2. Reconnectez-vous avec un utilisateur Employe
echo 3. Verifiez l'acces aux departements et postes
echo.
pause
