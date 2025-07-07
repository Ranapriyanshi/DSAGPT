@echo off
echo 🚀 Starting DSA GPT Deployment...

REM Check if git is initialized
if not exist ".git" (
    echo ❌ Git repository not found. Please initialize git first:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    echo    git remote add origin ^<your-github-repo-url^>
    echo    git push -u origin main
    pause
    exit /b 1
)

REM Check if backend requirements.txt exists
if not exist "backend\requirements.txt" (
    echo ❌ backend\requirements.txt not found!
    pause
    exit /b 1
)

REM Check if frontend package.json exists
if not exist "frontend\package.json" (
    echo ❌ frontend\package.json not found!
    pause
    exit /b 1
)

echo ✅ Repository structure looks good!

echo.
echo Choose your deployment platform:
echo 1. Render (Recommended for beginners)
echo 2. Railway
echo 3. Vercel + Railway
echo 4. Heroku
echo 5. Just prepare files (manual deployment)

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo 🎯 You chose Render deployment
    echo.
    echo 📋 Next steps:
    echo 1. Go to https://render.com and sign up
    echo 2. Connect your GitHub repository
    echo 3. Create a new Web Service for backend:
    echo    - Environment: Python 3
    echo    - Build Command: pip install -r requirements.txt
    echo    - Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
    echo    - Root Directory: backend
    echo 4. Set environment variables (see backend\env.example)
    echo 5. Create another service for frontend (Static Site)
    echo.
    echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
) else if "%choice%"=="2" (
    echo 🚄 You chose Railway deployment
    echo.
    echo 📋 Next steps:
    echo 1. Go to https://railway.app and sign up
    echo 2. Connect your GitHub repository
    echo 3. Create a new service for backend (set root to 'backend')
    echo 4. Set environment variables (see backend\env.example)
    echo 5. Create another service for frontend (set root to 'frontend')
    echo.
    echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
) else if "%choice%"=="3" (
    echo ⚡ You chose Vercel + Railway deployment
    echo.
    echo 📋 Next steps:
    echo 1. Deploy backend on Railway (see option 2)
    echo 2. Go to https://vercel.com and sign up
    echo 3. Import your GitHub repository
    echo 4. Configure frontend deployment (see DEPLOYMENT_GUIDE.md)
    echo.
    echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
) else if "%choice%"=="4" (
    echo 🔧 You chose Heroku deployment
    echo.
    echo 📋 Next steps:
    echo 1. Install Heroku CLI
    echo 2. Run: heroku login
    echo 3. Follow the Heroku deployment steps in DEPLOYMENT_GUIDE.md
    echo.
    echo 📖 See DEPLOYMENT_GUIDE.md for detailed instructions
) else if "%choice%"=="5" (
    echo 📁 Preparing files for manual deployment...
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)

REM Check if environment files exist
echo.
echo 🔍 Checking environment configuration...

if not exist "backend\.env" (
    echo ⚠️  backend\.env not found. Please create it based on backend\env.example
    echo    copy backend\env.example backend\.env
    echo    # Then edit backend\.env with your actual values
)

if not exist "frontend\.env" (
    echo ⚠️  frontend\.env not found. Please create it based on frontend\env.example
    echo    copy frontend\env.example frontend\.env
    echo    # Then edit frontend\.env with your actual values
)

echo.
echo ✅ Deployment preparation complete!
echo.
echo 📚 Important files created:
echo    - DEPLOYMENT_GUIDE.md (comprehensive deployment guide)
echo    - backend\Dockerfile (for containerized deployment)
echo    - backend\render.yaml (Render configuration)
echo    - frontend\vercel.json (Vercel configuration)
echo    - backend\env.example (environment variables template)
echo    - frontend\env.example (environment variables template)
echo.
echo 🔑 Don't forget to:
echo    1. Get your OpenAI API key from https://platform.openai.com/api-keys
echo    2. Set up environment variables on your chosen platform
echo    3. Update CORS settings with your frontend URL
echo.
echo 🎉 Happy deploying!
pause 