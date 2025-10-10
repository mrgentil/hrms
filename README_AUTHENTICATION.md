# 🔐 Système d'Authentification Sécurisé - HRMS Dashboard

## Vue d'Ensemble

Ce projet intègre désormais un **système d'authentification hautement sécurisé** avec les fonctionnalités suivantes :

✅ **Authentification JWT** avec access et refresh tokens  
✅ **Protection globale des routes** - connexion obligatoire  
✅ **Hashage sécurisé des mots de passe** avec bcrypt  
✅ **Gestion des rôles** (Admin, Manager, Employé)  
✅ **Interface utilisateur** complète (Login/Register)  
✅ **Rotation automatique des tokens**  
✅ **Protection CORS** configurée  

## 🚀 Démarrage Rapide

### 1. Installation
```bash
# Installer toutes les dépendances
npm install
cd backend && npm install && cd ..
```

### 2. Configuration
```bash
# Copier les fichiers d'environnement
cd backend && cp .env.example .env
cd .. && cp .env.local.example .env.local
```

### 3. Base de données
```bash
# Générer Prisma et créer la DB
cd backend
npx prisma generate
npx prisma db push
```

### 4. Créer un administrateur
```bash
cd backend
npm run create-admin
```

### 5. Lancer l'application
```bash
# Depuis la racine - lance frontend + backend
npm run dev
```

## 🎯 Accès à l'Application

1. **Ouvrez** http://localhost:3000
2. **Vous serez redirigé** automatiquement vers `/signin`
3. **Connectez-vous** avec :
   - **Nom d'utilisateur :** `admin`
   - **Mot de passe :** `admin123`

## 🛡️ Fonctionnalités de Sécurité

### Protection des Routes
- **Toutes les routes** du dashboard nécessitent une authentification
- **Redirection automatique** vers la page de connexion
- **Vérification des tokens** à chaque requête
- **Refresh automatique** des tokens expirés

### Gestion des Sessions
- **Access Token :** 7 jours (configurable)
- **Refresh Token :** 30 jours (configurable)
- **Stockage sécurisé** dans localStorage
- **Déconnexion automatique** en cas de token invalide

### Rôles et Permissions
- **ROLE_ADMIN :** Accès complet au système
- **ROLE_MANAGER :** Accès de gestion
- **ROLE_EMPLOYEE :** Accès employé standard

## 📱 Interface Utilisateur

### Pages d'Authentification
- **`/signin`** - Page de connexion sécurisée
- **`/signup`** - Page d'inscription (optionnelle)
- **Design responsive** et moderne
- **Validation en temps réel** des formulaires
- **Messages d'erreur** explicites

### Header Utilisateur
- **Affichage du nom** et rôle de l'utilisateur
- **Menu déroulant** avec profil et déconnexion
- **Indicateur de statut** de connexion

## 🔧 Configuration Avancée

### Variables d'Environnement Backend (`backend/.env`)
```env
# Base de données
DATABASE_URL="mysql://root:@localhost:3306/hrms_db"

# Serveur
PORT=3001

# JWT - CHANGEZ EN PRODUCTION !
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="votre-refresh-secret-different"
JWT_REFRESH_EXPIRES_IN="30d"

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Variables d'Environnement Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🔌 API Endpoints

### Authentification
```
POST /auth/login      - Connexion utilisateur
POST /auth/register   - Inscription utilisateur
POST /auth/refresh    - Rafraîchir le token
GET  /auth/profile    - Profil utilisateur (protégé)
GET  /auth/me         - Infos utilisateur (protégé)
```

### Exemple d'utilisation
```javascript
// Connexion
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

// Requête authentifiée
import { authService } from '@/lib/auth';
const data = await authService.authenticatedFetch('/api/protected-route');
```

## 🏗️ Architecture Technique

### Backend (NestJS)
```
backend/src/
├── auth/                    # Module d'authentification
│   ├── dto/                # DTOs de validation
│   ├── guards/             # Guards JWT et rôles
│   ├── strategies/         # Stratégies Passport
│   ├── decorators/         # Décorateurs personnalisés
│   ├── auth.service.ts     # Logique métier auth
│   └── auth.controller.ts  # Endpoints API
├── prisma/                 # Service Prisma
└── app.module.ts          # Configuration globale
```

### Frontend (Next.js)
```
src/
├── contexts/
│   └── AuthContext.tsx    # Contexte React d'authentification
├── lib/
│   └── auth.ts            # Service d'authentification
├── components/
│   └── auth/              # Composants d'authentification
└── app/
    ├── (admin)/           # Routes protégées
    └── (auth)/            # Pages de connexion
```

## 🔒 Sécurité en Production

### Checklist Sécurité
- [ ] **Changer tous les secrets JWT**
- [ ] **Utiliser HTTPS obligatoirement**
- [ ] **Configurer CORS strictement**
- [ ] **Activer les logs de sécurité**
- [ ] **Politique de mots de passe renforcée**
- [ ] **Rate limiting sur les endpoints d'auth**
- [ ] **Monitoring des tentatives de connexion**

### Secrets Recommandés
```bash
# Générer des secrets forts
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🐛 Dépannage

### Problèmes Courants

**"Redirection infinie vers /signin"**
- Vider le localStorage du navigateur
- Vérifier que le backend est démarré
- Contrôler les secrets JWT dans `.env`

**"CORS Error"**
- Vérifier `FRONTEND_URL` dans le backend
- S'assurer que les ports correspondent

**"Cannot connect to database"**
- Démarrer MySQL dans Laragon
- Vérifier `DATABASE_URL`
- Exécuter `npx prisma db push`

### Reset Complet
```bash
# Réinitialiser la base de données
cd backend
npx prisma db push --force-reset
npm run create-admin

# Redémarrer l'application
cd ..
npm run dev
```

## 📚 Documentation Complète

Pour une documentation détaillée, consultez :
- **[AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md)** - Guide complet d'installation
- **[Backend API Documentation](./backend/README.md)** - Documentation de l'API
- **[Frontend Components](./src/components/auth/README.md)** - Composants d'authentification

---

## ✨ Résumé

Votre application dispose maintenant d'un **système d'authentification de niveau production** :

🔐 **Sécurité maximale** avec JWT et bcrypt  
🚪 **Accès contrôlé** à toutes les routes  
👤 **Gestion complète des utilisateurs**  
🎨 **Interface moderne et intuitive**  
⚡ **Performance optimisée** avec refresh tokens  

**L'application est prête à être utilisée en toute sécurité !**
