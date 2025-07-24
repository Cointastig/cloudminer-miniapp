# DTX CloudMiner 

A Telegram Mini App for DTX token mining with TON blockchain integration.

## 🚀 Features

- **Mining Simulation**: Interactive mining experience with level progression
- **TON Integration**: Wallet connection and USDT upgrade payments
- **Telegram WebApp**: Native Telegram Mini App experience
- **Real-time Updates**: Live mining statistics and earnings
- **Supabase Backend**: Secure user data storage with RLS
- **Modern UI**: Beautiful animations with Framer Motion

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Vercel Functions + Supabase
- **Blockchain**: TON Connect
- **Authentication**: Custom JWT with Supabase RLS

## 📋 Prerequisites

- Node.js 18+ and npm 8+
- Supabase project
- Telegram Bot (for WebApp)
- TON wallet for testing

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo>
cd dtx-cloudminer
npm install
```

### 2. Environment Configuration

Create `.env.local` file:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Backend Configuration
VITE_BACKEND_URL=/api

# Optional: TON Contract (for production)
TON_CONTRACT_ADDRESS=your_contract_address
```

### 3. Database Setup

Run the SQL commands from `supabase.sql` in your Supabase SQL editor:

```sql
-- This will create:
-- - users table with RLS policies
-- - mining_history table
-- - Helper functions
-- - Leaderboard view
```

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

### 5. Production Deployment

#### Vercel Deployment

1. **Connect Repository** to Vercel
2. **Set Environment Variables** in Vercel Dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   VITE_BACKEND_URL=/api
   ```
3. **Deploy** - Vercel will auto-detect Vite configuration

#### Telegram Bot Setup

1. Create bot with [@BotFather](https://t.me/botfather)
2. Set WebApp URL: `/setmenubutton` → `https://your-app.vercel.app`
3. Configure domain: `/setdomain` → `your-app.vercel.app`

## 📁 Project Structure

```
dtx-cloudminer/
├── src/
│   ├── components/ui/        # Reusable UI components
│   ├── App.tsx              # Main application
│   ├── index.tsx            # Entry point
│   └── styles.css           # Global styles
├── api/                     # Vercel Functions
│   ├── jwt.ts              # JWT token generation
│   └── upgrade-usdt.ts     # TON upgrade handling
├── public/
│   └── tonconnect-manifest.json  # TON Connect configuration
├── supabase.sql            # Database schema
└── vercel.json             # Vercel configuration
```

## 🔒 Security Features

- **Row Level Security (RLS)**: User data isolation
- **JWT Authentication**: Custom token validation
- **Input Validation**: API parameter checking
- **CORS Protection**: Proper header configuration
- **Environment Isolation**: Separate dev/prod configs

## 🚨 Important Security Notes

- **Never commit `.env.local`** - contains sensitive keys
- **Regenerate Supabase keys** if accidentally exposed
- **Use different keys** for development and production
- **Validate all user inputs** on both client and server

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase URL"**
   - Check `.env.local` file exists
   - Verify environment variable names

2. **"JWT Secret not configured"**
   - Add `SUPABASE_JWT_SECRET` to Vercel environment variables
   - Get secret from Supabase → Settings → API → JWT Secret

3. **"CORS Error"**
   - Ensure API functions include proper CORS headers
   - Check Vercel function deployment logs

4. **"Telegram ID not available"**
   - Open app from Telegram (not direct browser)
   - Check Telegram WebApp setup

## 📈 Development Roadmap

- [ ] Complete TON smart contract integration
- [ ] Add referral system
- [ ] Implement mining boosts
- [ ] Add leaderboard UI
- [ ] Multi-language support
- [ ] Push notifications

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@dtx-token.com or join our [Telegram Community](https://t.me/dtx_community).

---

**⚠️ Security Warning**: This repository previously contained exposed API keys. All keys have been regenerated. Always keep your `.env.local` file private!
