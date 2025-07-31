# 🐾 PetCare - Plugin-Based Pet Management System

A comprehensive, modern pet management web application built with **Next.js**, **TypeScript**, and a **plugin-based architecture**. Manage your pets' health, appointments, expenses, and more with features that can be dynamically enabled or disabled through an admin panel.

![PetCare Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=PetCare+Dashboard)

## ✨ **Key Features**

### 🔧 **Plugin Architecture**
- **Dynamic Feature Management**: Enable/disable features without code changes
- **Admin Panel**: Visual interface to manage plugins and features
- **Dependency Management**: Features can depend on other features
- **User-Specific Features**: Different users can have different feature sets

### 🏥 **Core Features**
- **Pet Profiles**: Comprehensive pet information management
- **Health Tracking**: Vaccinations, vet visits, medications
- **Appointment Scheduling**: Never miss important vet appointments
- **Expense Tracking**: Monitor pet-related expenses
- **Document Management**: Store certificates and important documents
- **Reminders & Notifications**: Automated alerts for important tasks
- **Activity Tracking**: Monitor walks, exercise, and daily activities

### 🔐 **Authentication & Security**
- **NextAuth.js Integration**: Secure authentication system
- **Admin Role Management**: Protected admin routes and features
- **Session Management**: Secure user sessions

## 🚀 **Quick Start**

### **Option 1: One-Click Launch (Recommended)**

```bash
# Make the script executable and run it
chmod +x launch.sh
./launch.sh
```

The launch script will:
1. ✅ Check prerequisites (Node.js, npm)
2. 📦 Install all dependencies
3. 🗄️ Set up the database
4. 🌱 Seed features and create admin user
5. 🚀 Start the development server

### **Option 2: Manual Setup**

```bash
# 1. Install dependencies
npm install

# 2. Set up database
npx prisma generate
npx prisma db push

# 3. Seed features
npx tsx src/lib/seed-features.ts

# 4. Create admin user
npx tsx src/lib/create-admin.ts

# 5. Start development server
npm run dev
```

## 🔑 **Admin Access**

### **Demo Admin Credentials:**
- **Email**: `malinovskis@me.com`
- **Password**: `Millie1991`

### **Admin Panel URL:**
```
http://localhost:3000/admin
```

## 📱 **Application URLs**

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `http://localhost:3000` | Main dashboard with overview |
| **Sign In** | `http://localhost:3000/auth/signin` | User authentication |
| **Admin Panel** | `http://localhost:3000/admin` | Feature management (admin only) |

## 🧩 **Available Plugins/Features**

### **Core Features** (Always Enabled)
- ✅ **Dashboard** - Main overview and statistics
- ✅ **Pet Management** - Pet profiles and basic information
- ✅ **Settings** - Application settings and preferences

### **Health Features**
- 🏥 **Health Tracking** - Vaccinations, medical records
- 📅 **Appointments** - Vet appointment scheduling
- 💊 **Medications** - Medication tracking and reminders
- 🍽️ **Feeding Schedule** - Meal planning and dietary management
- 🏃 **Activity Tracking** - Exercise and activity monitoring

### **Finance Features**
- 💰 **Expense Tracking** - Pet-related expense management and reporting

### **Advanced Features**
- 📄 **Document Management** - Store and organize pet documents
- 🔔 **Reminders & Notifications** - Automated alerts and reminders

### **Social Features**
- 👥 **Social Profiles** - Share pet profiles with others
- 🚨 **Lost Pet Alerts** - Report and find missing pets

## 🛠️ **Technology Stack**

### **Frontend**
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library

### **Backend**
- **NextAuth.js** - Authentication and session management
- **Prisma** - Type-safe database ORM
- **SQLite** - Local database (easily changeable to PostgreSQL/MySQL)

### **Plugin System**
- **Feature Manager** - Dynamic feature loading and management
- **Dependency Resolution** - Automatic dependency checking
- **Database-Driven Config** - Feature settings stored in database

## 📁 **Project Structure**

```
pet-management-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   ├── auth/              # Authentication pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── admin/             # Admin-specific components
│   │   └── ui/                # Reusable UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility libraries
│   │   ├── features.ts        # Plugin system core
│   │   ├── auth.ts            # Authentication config
│   │   └── prisma.ts          # Database client
│   └── types/                 # TypeScript type definitions
├── prisma/
│   └── schema.prisma          # Database schema
├── launch.sh                  # One-click setup script
└── README.md                  # This file
```

## 🔧 **Plugin Development**

### **Adding a New Feature/Plugin**

1. **Define the feature** in `src/lib/features.ts`:

```typescript
{
  id: 'my-new-feature',
  name: 'my-new-feature',
  displayName: 'My New Feature',
  description: 'Description of what this feature does',
  category: 'advanced',
  isCore: false,
  version: '1.0.0',
  routes: ['/my-feature', '/my-feature/settings'],
  dependencies: ['pets'] // Optional dependencies
}
```

2. **Create the components** and pages for your feature

3. **Add navigation items** if needed

4. **The feature will automatically appear in the admin panel** for enabling/disabling

### **Feature Categories**
- `core` - Essential features (cannot be disabled)
- `health` - Health and medical related features
- `finance` - Financial and expense features
- `social` - Social and community features
- `advanced` - Advanced functionality

## 🗄️ **Database Schema**

The application uses a comprehensive database schema with the following main entities:

- **Users** - User accounts and authentication
- **Features** - Plugin/feature definitions and settings
- **UserFeatures** - User-specific feature preferences
- **Pets** - Pet profiles and information
- **HealthRecords** - Medical history and health tracking
- **Appointments** - Vet appointments and scheduling
- **Medications** - Medication tracking
- **Expenses** - Financial tracking
- **Documents** - File storage and management
- **Reminders** - Notification and reminder system

## 🔐 **Environment Variables**

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

## 🚀 **Deployment**

### **Vercel (Recommended)**

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy!

### **Docker**

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-repo/pet-management-app/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

## 🎉 **Getting Started Checklist**

- [ ] Run `./launch.sh` or follow manual setup
- [ ] Access the app at `http://localhost:3000`
- [ ] Sign in with admin credentials
- [ ] Visit admin panel at `/admin`
- [ ] Toggle features on/off to see the plugin system in action
- [ ] Add your first pet
- [ ] Explore the different features

---

**Built with ❤️ by the PetCare team**
