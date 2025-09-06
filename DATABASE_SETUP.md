# 🗄️ Database Setup Instructions

## ✅ Database Status: Ready!

Your PostgreSQL database on Render is now **Available** and ready for connections.

## 📋 Connection Details

- **Database ID**: `dpg-d2ua1k7fte5s73avjp4g-a`
- **Database Name**: `diemvision_production_db`
- **Username**: `diemvision_production_db_user`
- **Host**: `dpg-d2ua1k7fte5s73avjp4g-a.oregon-postgres.render.com`
- **Port**: `5432`
- **Region**: Oregon (US West)
- **PostgreSQL Version**: 16

## 🔐 Get Your Password

1. Go to your Render dashboard: https://dashboard.render.com/d/dpg-d2ua1k7fte5s73avjp4g-a
2. Click on the "Connect" button (top right)
3. Copy the **External Database URL** - it will look like:
   ```
   postgresql://diemvision_production_db_user:YOUR_PASSWORD@dpg-d2ua1k7fte5s73avjp4g-a.oregon-postgres.render.com:5432/diemvision_production_db
   ```

## ⚙️ Environment Variables Setup

### For Local Development (.env.local):
```bash
DATABASE_URL=postgresql://diemvision_production_db_user:YOUR_PASSWORD@dpg-d2ua1k7fte5s73avjp4g-a.oregon-postgres.render.com:5432/diemvision_production_db?sslmode=require
```

### For Vercel Production:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name**: `DATABASE_URL`
   - **Value**: `postgresql://diemvision_production_db_user:YOUR_PASSWORD@dpg-d2ua1k7fte5s73avjp4g-a.oregon-postgres.render.com:5432/diemvision_production_db?sslmode=require`
   - **Environment**: Production

## 🚀 Initialize Your Database

After setting up the environment variables:

### Local Testing:
1. Add the `DATABASE_URL` to your `.env.local` file
2. Run: `npm run dev`
3. Visit: `http://localhost:3000/admin`
4. Click "Initialize Database" button

### Production:
1. Deploy to Vercel with the environment variable
2. Visit: `https://your-app.vercel.app/admin`
3. Click "Initialize Database" button

## 🔧 Database Schema

The following tables will be created:

### `user_sessions`
- `id` (Primary Key)
- `session_id` (Unique)
- `timestamp`
- `user_agent`
- `ip_address`

### `user_analytics`
- `id` (Primary Key)
- `session_id` (Foreign Key)
- `front_face_photo`
- `side_face_photo`
- `full_body_photo`
- `prompt_text`
- `generated_image`
- `success`
- `error_message`
- `processing_time`
- `timestamp`

## 📊 Admin Dashboard Features

Access at `/admin`:
- View all user sessions
- See uploaded photos and prompts
- Monitor success/failure rates
- Track processing times
- View user metadata

## 🔒 Security Notes

- Database requires SSL/TLS connections
- Free plan expires on **October 6, 2025**
- Consider upgrading to a paid plan for production use
- Admin dashboard should be protected in production

## 🆘 Troubleshooting

If you get SSL errors:
- Ensure `?sslmode=require` is in your connection string
- Check that your environment variable is set correctly
- For Node.js apps, the `pg` library handles SSL automatically with the connection string

## ✅ Next Steps

1. ✅ Database created
2. ⏳ Get password from Render dashboard
3. ⏳ Set environment variable
4. ⏳ Deploy and initialize
5. ⏳ Start collecting user analytics!
