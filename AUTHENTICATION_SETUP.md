# Guide d'Installation - Système d'Authentification Sécurisé

Ce guide vous explique comment configurer et utiliser le système d'authentification hautement sécurisé avec JWT tokens.

## 🚀 Installation et Configuration

### 1. Installation des Dépendances

#### Backend (NestJS)
```bash
cd backend
npm install
```

#### Frontend (Next.js)
```bash
npm install
```

### 2. Configuration de l'Environnement

#### Backend - Fichier `.env`
Copiez le fichier `.env.example` vers `.env` dans le dossier `backend/` :

```bash
cd backend
cp .env.example .env
```

Modifiez les valeurs dans `.env` :
```env
# Configuration MySQL pour Laragon
DATABASE_URL="mysql://root:@localhost:3306/hrms_db"

# Port du serveur NestJS
PORT=3001

# JWT Configuration - CHANGEZ CES VALEURS EN PRODUCTION !
JWT_SECRET="votre-secret-jwt-super-securise-changez-moi-en-production-123456789"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="votre-refresh-secret-jwt-super-securise-changez-moi-aussi-987654321"
JWT_REFRESH_EXPIRES_IN="30d"

# CORS Configuration
FRONTEND_URL="http://localhost:3000"
```

#### Frontend - Fichier `.env.local`
Copiez le fichier `.env.local.example` vers `.env.local` :

```bash
cp .env.local.example .env.local
```

Contenu de `.env.local` :
```env
# URL de l'API backend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Configuration de la Base de Données

#### Avec Laragon (Recommandé)
1. Démarrez Laragon
2. Créez une nouvelle base de données nommée `hrms_db`
3. Exécutez les migrations Prisma :

```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Avec une autre configuration MySQL
Modifiez la `DATABASE_URL` dans le fichier `.env` selon votre configuration.

### 4. Démarrage de l'Application

#### Démarrage Complet (Recommandé)
Depuis la racine du projet :
```bash
npm run dev
```

Cette commande démarre automatiquement :
- Le frontend Next.js sur http://localhost:3000
- Le backend NestJS sur http://localhost:3001
- La génération Prisma en mode watch

#### Démarrage Séparé

**Backend uniquement :**
```bash
cd backend
npm run start:dev
```

**Frontend uniquement :**
```bash
npm run dev:frontend
```

## 🔐 Fonctionnalités de Sécurité

### Authentification JWT
- **Access Token** : Valide 7 jours par défaut
- **Refresh Token** : Valide 30 jours par défaut
- **Rotation automatique** des tokens
- **Stockage sécurisé** dans localStorage

### Protection des Routes
- **Protection globale** : Toutes les routes admin nécessitent une authentification
- **Redirection automatique** vers `/signin` si non authentifié
- **Gestion des rôles** : ADMIN, MANAGER, EMPLOYEE

### Hashage des Mots de Passe
- **bcryptjs** avec salt rounds = 12
- **Validation** côté client et serveur
- **Politique de mot de passe** : minimum 6 caractères

## 📱 Utilisation

### Première Connexion

1. **Créer un compte** :
   - Allez sur http://localhost:3000/signup
   - Remplissez le formulaire d'inscription
   - Vous serez automatiquement connecté après inscription

2. **Se connecter** :
   - Allez sur http://localhost:3000/signin
   - Utilisez votre nom d'utilisateur et mot de passe

### Gestion des Utilisateurs

#### Créer un utilisateur via l'API
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "motdepasse123",
    "full_name": "Administrateur Principal",
    "work_email": "admin@example.com",
    "role": "ROLE_ADMIN"
  }'
```

#### Rôles Disponibles
- `ROLE_ADMIN` : Accès complet
- `ROLE_MANAGER` : Accès de gestion
- `ROLE_EMPLOYEE` : Accès employé standard

### Endpoints API

#### Authentification
- `POST /auth/login` - Connexion
- `POST /auth/register` - Inscription
- `POST /auth/refresh` - Rafraîchir le token
- `GET /auth/profile` - Profil utilisateur (protégé)
- `GET /auth/me` - Informations utilisateur courantes (protégé)

#### Exemple de Requête Authentifiée
```javascript
// Utilisation du service d'authentification
import { authService } from '@/lib/auth';

const response = await authService.authenticatedFetch('/api/protected-endpoint');
```

## 🛡️ Sécurité en Production

### Variables d'Environnement Critiques
```env
# Générez des secrets forts et uniques !
JWT_SECRET="votre-secret-production-super-long-et-complexe"
JWT_REFRESH_SECRET="votre-refresh-secret-production-different-du-premier"

# Utilisez HTTPS en production
FRONTEND_URL="https://votre-domaine.com"
```

### Recommandations
1. **Changez TOUS les secrets** avant la mise en production
2. **Utilisez HTTPS** obligatoirement
3. **Configurez CORS** strictement pour votre domaine
4. **Activez les logs** de sécurité
5. **Mettez en place une politique de mots de passe** plus stricte

## 🔧 Personnalisation

### Modifier la Durée des Tokens
Dans `backend/.env` :
```env
JWT_EXPIRES_IN="1h"        # Access token plus court
JWT_REFRESH_EXPIRES_IN="7d" # Refresh token plus court
```

### Ajouter des Champs Utilisateur
1. Modifiez le schéma Prisma dans `backend/prisma/schema.prisma`
2. Mettez à jour les DTOs dans `backend/src/auth/dto/`
3. Exécutez `npx prisma db push`

### Personnaliser les Pages d'Authentification
Les composants sont dans :
- `src/components/auth/SignInForm.tsx`
- `src/components/auth/SignUpForm.tsx`

## 🐛 Dépannage

### Erreurs Communes

#### "Cannot connect to database"
- Vérifiez que MySQL est démarré dans Laragon
- Vérifiez la `DATABASE_URL` dans `.env`

#### "JWT malformed"
- Videz le localStorage du navigateur
- Vérifiez que les secrets JWT sont identiques entre redémarrages

#### "CORS error"
- Vérifiez que `FRONTEND_URL` est correct dans le backend
- Assurez-vous que les ports correspondent

### Réinitialiser l'Authentification
```bash
# Vider la base de données
cd backend
npx prisma db push --force-reset

# Redémarrer les services
npm run dev
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs du backend dans la console
2. Vérifiez les erreurs dans la console du navigateur
3. Consultez la documentation Prisma et NestJS

---

✅ **Votre système d'authentification sécurisé est maintenant prêt !**

L'application redirigera automatiquement vers la page de connexion lors du premier accès, et toutes les routes seront protégées par défaut.
