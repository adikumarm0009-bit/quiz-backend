# Aditya Classes — Quiz Backend

Ye ek simple Node.js + Express backend hai jo tumhare Quiz Master app ke liye:
- **Signup/Login** (password hash karke store, JWT token se session)
- **Leaderboard** (sabke score save aur fetch karta hai, permanently)

Database ke liye SQLite use kiya hai — koi alag database server install nahi karna padega, sab ek file (`quiz.db`) mein store hota hai.

---

## 1. Local setup (apne computer pe chalane ke liye)

**Zaroorat**: [Node.js](https://nodejs.org) installed hona chahiye (v18 ya usse upar).

```bash
# 1. Is folder mein jao
cd quiz-backend

# 2. Dependencies install karo
npm install

# 3. .env file banao
cp .env.example .env
```

Ab `.env` file kholo aur `JWT_SECRET` ko ek random secret se replace karo. Random secret generate karne ke liye:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Us output ko copy karke `.env` mein `JWT_SECRET=` ke aage paste kar do.

```bash
# 4. Server start karo
npm start
```

Agar sab sahi hai to terminal mein dikhega: `Quiz backend running on http://localhost:3000`

---

## 2. API test karna (curl se)

**Sign up:**
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name": "Aditya", "password": "mypassword123"}'
```
Response mein ek `token` milega — usse save kar lo, aage use hoga.

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"name": "Aditya", "password": "mypassword123"}'
```

**Score save karna** (token chahiye, upar wale response se copy karo):
```bash
curl -X POST http://localhost:3000/api/scores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer PASTE_YOUR_TOKEN_HERE" \
  -d '{"subject": "history", "level": "easy", "score": 5, "total": 6}'
```

**Leaderboard dekhna** (login ki zaroorat nahi, public hai):
```bash
curl http://localhost:3000/api/leaderboard
curl "http://localhost:3000/api/leaderboard?subject=history&level=easy"
```

---

## 3. Internet pe live/deploy karna

Apne computer ko 24x7 online nahi rakhna padega — ek free hosting service use karo:

### Render.com (recommended, free tier available)
1. GitHub pe ye folder push karo (ek naya repo banao)
2. [render.com](https://render.com) pe account banao aur "New Web Service" choose karo
3. Apna GitHub repo connect karo
4. Build command: `npm install`, Start command: `npm start`
5. Environment tab mein `JWT_SECRET` aur `ALLOWED_ORIGINS` add karo
6. Deploy karo — tumhe ek public URL milega jaise `https://tumhara-app.onrender.com`

### Railway.app
Similar process — GitHub repo connect karo, environment variables set karo, deploy ho jaata hai.

**Important**: Free tier wali services kabhi kabhi "sleep" ho jaati hain agar use na ho, pehli request thodi slow ho sakti hai.

---

## 4. Quiz app (frontend) ko is backend se connect karna

Abhi jo `quiz_app.html` hai wo `window.storage` use karta hai. Isse real backend se connect karne ke liye login/signup aur save-score wale functions ko `fetch()` calls se replace karna hoga. Jaise:

```javascript
const API_BASE = "https://tumhara-app.onrender.com"; // apna deployed URL yahan daalo

// Signup
const res = await fetch(`${API_BASE}/api/auth/signup`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, password })
});
const data = await res.json();
if (res.ok) {
  const token = data.token; // isse localStorage/memory mein save karo, har request ke saath bhejna hoga
}

// Score save karna
await fetch(`${API_BASE}/api/scores`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  },
  body: JSON.stringify({ subject, level, score, total })
});

// Leaderboard fetch karna
const lb = await fetch(`${API_BASE}/api/leaderboard`).then(r => r.json());
```

Agar chaho to main ye poora integration bhi kar sakta hoon — bas apna deployed backend URL de dena, main quiz app ko usse connect kar dunga.

---

## Files in this folder

```
quiz-backend/
├── server.js          # main entry point
├── db.js              # SQLite database setup
├── routes/
│   ├── auth.js        # signup/login
│   └── scores.js      # save score + leaderboard
├── middleware/
│   └── auth.js        # JWT token verification
├── package.json
└── .env.example        # copy to .env and fill in your own secret
```

## Security notes
- Passwords are hashed with bcrypt — plain text kabhi store nahi hota.
- Login attempts are rate-limited to slow down brute-force guessing.
- `.env` file ko kabhi bhi public GitHub repo mein commit mat karna — usme secret keys hain.
