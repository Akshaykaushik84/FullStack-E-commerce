# Live Deployment

This project is ready for a single-service deploy where the backend serves the built frontend.

## Recommended: Render

1. Push this project to GitHub.
2. Open Render and create a new `Blueprint` deploy.
3. Select the repository.
4. Render will read [render.yaml](/C:/Users/kaush/OneDrive/Desktop/ecom/render.yaml).
5. Add these environment variables:
   - `MONGO_URL`
   - `JWT_SECRET`
   - `CORS_ORIGIN`

If you are using the same Render service for frontend and backend together, set:

- `CORS_ORIGIN=https://your-render-app.onrender.com`

## Local Production Build Test

```powershell
cd C:\Users\kaush\OneDrive\Desktop\ecom\frontend
npm.cmd install
npm.cmd run build

cd C:\Users\kaush\OneDrive\Desktop\ecom\backend
npm.cmd install
npm.cmd start
```

Then open:

- `http://localhost:5000`

## Notes

- Frontend API base is already set to `/api` by default for production-friendly same-origin deploys.
- Backend serves `frontend/dist` automatically when it exists.
- Uploaded files are served from `/uploads`.
