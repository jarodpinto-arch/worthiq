# WorthIQ 💰

**Your Personal Finance Command Center**

WorthIQ is a modern personal finance dashboard that connects to your bank accounts via Plaid, giving you real-time insights into your spending, budgets, and net worth.

![WorthIQ Dashboard](docs/dashboard-preview.png)

## ✨ Features

- **🏦 Bank Connection** - Securely link all your bank accounts via Plaid
- **📊 Custom Dashboard** - Drag-and-drop widgets like Tableau for your finances
- **💳 Transaction Tracking** - Automatic categorization of all transactions
- **📈 Spending Insights** - Visual breakdowns by category, merchant, and time
- **💰 Budget Management** - Set and track monthly category budgets
- **📱 Responsive Design** - Works beautifully on desktop and mobile

## 🛠 Tech Stack

**Frontend**
- React 19 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Plaid Link for bank connections

**Backend**
- NestJS framework
- Prisma ORM
- PostgreSQL database
- JWT authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Plaid API credentials ([Sign up free](https://dashboard.plaid.com))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/worthiq.git
   cd worthiq
   ```

2. **Set up the backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your credentials
   npm install
   npx prisma migrate dev
   npm run start:dev
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   cp .env.example .env.local
   # Edit .env.local with your API URL
   npm install
   npm start
   ```

4. **Open your browser**
   ```
   http://localhost:3000
   ```

### Production Deployment

See [QUICKSTART.md](QUICKSTART.md) for a 30-minute deployment guide, or [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive documentation.

## 📁 Project Structure

```
worthiq/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── Dashboard/   # Customizable dashboard widgets
│   │   │   ├── Auth/        # Login/Register forms
│   │   │   └── ...
│   │   ├── context/         # React context providers
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
│   └── public/
│
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/            # Authentication module
│   │   ├── plaid/           # Plaid integration
│   │   └── prisma/          # Database service
│   └── prisma/
│       └── schema.prisma    # Database schema
│
└── docs/                     # Documentation
```

## 🔒 Security

- All bank connections are handled through Plaid's secure infrastructure
- Passwords are hashed using bcrypt
- JWT tokens for API authentication
- HTTPS enforced in production
- No sensitive financial credentials stored on our servers

## 💰 Pricing Model

WorthIQ is designed to run as a SaaS product:

| Plan | Price | Features |
|------|-------|----------|
| Free | $0/mo | 1 bank account, basic dashboard |
| Pro | $9/mo | Unlimited accounts, custom widgets, export |
| Family | $19/mo | Up to 5 users, shared dashboards |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Plaid](https://plaid.com) for financial data infrastructure
- [Recharts](https://recharts.org) for beautiful charts
- [Tailwind CSS](https://tailwindcss.com) for utility-first styling

---

**Built with ❤️ by the WorthIQ Team**
