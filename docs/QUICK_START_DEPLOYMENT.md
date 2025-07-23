# 🚀 Quick Start: Deploy Your DSA GPT App

## 🎯 Recommended: Render (Easiest & Free)

### Step 1: Prepare Your Code
1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Get your OpenAI API key** from [OpenAI Platform](https://platform.openai.com/api-keys)

### Step 2: Deploy Backend on Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `dsa-gpt-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory**: `backend`

5. **Add Environment Variables**:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   SECRET_KEY=your_secret_key_here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ENVIRONMENT=production
   ```

6. Click "Create Web Service" and wait for deployment
7. **Note your backend URL** (e.g., `https://dsa-gpt-backend.onrender.com`)

### Step 3: Deploy Frontend on Render
1. Click "New +" → "Static Site"
2. Connect the same GitHub repository
3. Configure the service:
   - **Name**: `dsa-gpt-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
   - **Root Directory**: `frontend`

4. **Add Environment Variable**:
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

5. Click "Create Static Site" and wait for deployment
6. **Your app is live!** 🎉

## 🔧 Alternative: Railway (Better Performance)

### Backend on Railway
1. Go to [railway.app](https://railway.app) and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Set root directory to `backend`
5. Add environment variables (same as Render)
6. Deploy and note your backend URL

### Frontend on Railway
1. Add another service to the same project
2. Set root directory to `frontend`
3. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app`
4. Deploy

## ⚡ Best Performance: Vercel + Railway

1. Deploy backend on Railway (see above)
2. Go to [vercel.com](https://vercel.com) and sign up
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add environment variable: `REACT_APP_API_URL=https://your-backend-url.railway.app`
6. Deploy

## 🐛 Troubleshooting

### Common Issues:
1. **Build fails**: Check if all dependencies are in `requirements.txt`
2. **CORS errors**: Update `ALLOWED_ORIGINS` in backend environment variables
3. **API not found**: Verify `REACT_APP_API_URL` is correct
4. **Database issues**: SQLite may not persist on some platforms

### Quick Fixes:
- **Backend not starting**: Check logs for missing environment variables
- **Frontend can't connect**: Verify backend URL and CORS settings
- **OpenAI errors**: Ensure API key is valid and has credits

## 📞 Need Help?

1. Check the detailed `DEPLOYMENT_GUIDE.md`
2. Run `deploy.bat` (Windows) for interactive guidance
3. Check platform-specific documentation
4. Review logs in your deployment platform

## 🎉 Success!

Once deployed, your DSA GPT app will be accessible at your frontend URL. Users can:
- Register and login
- Practice DSA problems
- Get AI-powered explanations
- Track their progress
- Use emotion-aware features

**Happy coding! 🚀** 