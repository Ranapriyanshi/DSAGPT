# 🚀 DSA GPT Deployment Guide

This guide will help you deploy your DSA GPT application to the cloud. Choose the option that best fits your needs.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
3. **Credit Card** - Required for some platforms (Railway, Heroku)

## 🎯 Option 1: Render (Recommended for Beginners)

### Backend Deployment on Render

1. **Sign up** at [render.com](https://render.com)
2. **Connect your GitHub repository**
3. **Create a new Web Service**
   - Choose your repository
   - Name: `dsa-gpt-backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Root Directory: `backend`

4. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ENVIRONMENT=production
   ```

5. **Deploy** and note your backend URL (e.g., `https://dsa-gpt-backend.onrender.com`)

### Frontend Deployment on Render

1. **Create another Web Service**
   - Choose your repository
   - Name: `dsa-gpt-frontend`
   - Environment: `Static Site`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/build`
   - Root Directory: `frontend`

2. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

3. **Deploy** and get your frontend URL

## 🚄 Option 2: Railway

### Backend Deployment

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect GitHub** and select your repository
3. **Create a new service**
   - Choose your repository
   - Set root directory to `backend`
   - Railway will auto-detect Python

4. **Set Environment Variables:**
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ENVIRONMENT=production
   ```

5. **Deploy** and get your backend URL

### Frontend Deployment

1. **Create another service**
   - Choose your repository
   - Set root directory to `frontend`
   - Railway will auto-detect React

2. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

3. **Deploy** and get your frontend URL

## ⚡ Option 3: Vercel + Railway (Best Performance)

### Backend on Railway
Follow the Railway backend deployment steps above.

### Frontend on Vercel

1. **Sign up** at [vercel.com](https://vercel.com)
2. **Import your GitHub repository**
3. **Configure the project:**
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

4. **Set Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

5. **Deploy** and get your frontend URL

## 🔧 Option 4: Heroku

### Backend Deployment

1. **Sign up** at [heroku.com](https://heroku.com)
2. **Install Heroku CLI**
3. **Create a new app:**
   ```bash
   heroku create dsa-gpt-backend
   ```

4. **Set up the backend:**
   ```bash
   cd backend
   heroku git:remote -a dsa-gpt-backend
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

5. **Set environment variables:**
   ```bash
   heroku config:set OPENAI_API_KEY=your_openai_api_key_here
   heroku config:set SECRET_KEY=your_secret_key_here
   heroku config:set ALGORITHM=HS256
   heroku config:set ACCESS_TOKEN_EXPIRE_MINUTES=30
   heroku config:set ENVIRONMENT=production
   ```

### Frontend Deployment

1. **Create another app:**
   ```bash
   heroku create dsa-gpt-frontend
   ```

2. **Set up the frontend:**
   ```bash
   cd frontend
   heroku git:remote -a dsa-gpt-frontend
   git add .
   git commit -m "Deploy frontend"
   git push heroku main
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set REACT_APP_API_URL=https://your-backend-url.herokuapp.com
   ```

## 🔒 Security Considerations

1. **Environment Variables:** Never commit API keys to your repository
2. **CORS:** Update your backend CORS settings to allow your frontend domain
3. **HTTPS:** All production deployments should use HTTPS
4. **Database:** Consider using a production database (PostgreSQL) instead of SQLite

## 🐛 Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check if all dependencies are in `requirements.txt`
   - Ensure Python version compatibility

2. **CORS Errors:**
   - Update `ALLOWED_ORIGINS` in backend environment variables
   - Include your frontend URL

3. **API Connection Issues:**
   - Verify `REACT_APP_API_URL` is correct
   - Check if backend is running and accessible

4. **Database Issues:**
   - SQLite files may not persist on some platforms
   - Consider migrating to PostgreSQL for production

## 📊 Monitoring

1. **Logs:** Check platform logs for errors
2. **Health Checks:** Monitor your API endpoints
3. **Performance:** Use platform analytics to track usage

## 🔄 Continuous Deployment

All platforms support automatic deployments when you push to your main branch. Just commit and push your changes to trigger a new deployment.

## 💰 Cost Considerations

- **Render:** Free tier available, $7/month for paid
- **Railway:** $5/month after free tier
- **Vercel:** Free tier available, $20/month for paid
- **Heroku:** $7/month minimum

Choose the option that best fits your budget and technical expertise! 