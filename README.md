# 🏢 Human Resource Management System (HRMS)

Une solution HRMS moderne et complète construite avec **Next.js, Node.js, Express et MySQL**. Ce système offre une gestion complète des ressources humaines avec un système de contrôle d'accès basé sur les rôles (RBAC) avancé.

![HRMS Dashboard Preview](./banner.png)

## 📋 Description

Ce système HRMS fournit une solution complète pour la gestion des ressources humaines incluant la gestion des utilisateurs, des départements, des postes, et un système de permissions granulaires. Construit avec les dernières technologies web pour une performance et une sécurité optimales.

## 🚀 Technologies Utilisées

### Frontend
- **Next.js 15** - Framework React avec SSR/SSG
- **React 19** - Bibliothèque UI moderne
- **TypeScript** - Typage statique pour JavaScript
- **Tailwind CSS V4** - Framework CSS utilitaire
- **Prisma** - ORM moderne pour TypeScript

### Backend
- **Node.js** - Runtime JavaScript côté serveur
- **Express.js** - Framework web minimaliste
- **MySQL** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **bcrypt** - Hachage sécurisé des mots de passe

## ✨ Fonctionnalités Principales

### 👥 Gestion des Utilisateurs
- **Système RBAC complet** avec 8 rôles prédéfinis et 47 permissions granulaires
- **Authentification sécurisée** avec JWT et bcrypt
- **Profils utilisateurs** avec photos et informations personnelles
- **Gestion des sessions** et protection des routes

### 🏢 Gestion Organisationnelle
- **Gestion des départements** avec hiérarchie organisationnelle
- **Gestion des postes** et des responsabilités
- **Attribution des rôles** et permissions dynamiques
- **Organigramme** et structure d'entreprise

### 💰 Gestion Financière
- **Suivi des salaires** et des primes
- **Gestion des budgets** par département
- **Rapports financiers** et analyses
- **Historique des transactions**

### 📋 Gestion des Demandes
- **Demandes de congés** avec workflow d'approbation
- **Demandes de formation** et développement
- **Système de tickets** pour le support IT
- **Notifications** en temps réel

### 📊 Tableaux de Bord
- **Dashboard administrateur** avec métriques clés
- **Tableaux de bord** par rôle et département
- **Graphiques interactifs** et statistiques
- **Rapports exportables** en PDF/Excel

## 🚀 Installation et Configuration

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **MySQL** (version 8.0 ou supérieure)
- **npm** ou **yarn**

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/mrgentil/hrms.git
cd hrms
```

2. **Installer les dépendances**
```bash
# Frontend et Backend
npm install
# ou
yarn install
```

3. **Configuration de la base de données**
   - Créer une base de données MySQL nommée `hrms_db`
   - Copier `.env.example` vers `.env`
   - Configurer les variables d'environnement :

```env
# Base de données
DATABASE_URL="mysql://username:password@localhost:3306/hrms_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# API
API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="5MB"
```

4. **Initialiser la base de données**
```bash
# Générer le client Prisma
npx prisma generate

# Exécuter les migrations
npx prisma db push

# Seed de données initiales
npm run seed
```

5. **Lancer l'application**
```bash
# Démarrer le backend
npm run backend

# Dans un autre terminal, démarrer le frontend
npm run dev
```

L'application sera accessible sur :
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 👤 Comptes de Test

Pour tester l'application, utilisez ces comptes prédéfinis :

### Super Administrateur
- **Email**: admin@hrms.com
- **Mot de passe**: admin123
- **Permissions**: Accès total au système

### Administrateur
- **Email**: manager@hrms.com
- **Mot de passe**: manager123
- **Permissions**: Gestion globale

### RH Manager
- **Email**: hr@hrms.com
- **Mot de passe**: hr123
- **Permissions**: Gestion RH complète

### Employé
- **Email**: employee@hrms.com
- **Mot de passe**: employee123
- **Permissions**: Accès de base

## 📱 Utilisation

### Interface Admin
- **Dashboard principal** avec métriques et graphiques
- **Gestion des utilisateurs** et attribution des rôles
- **Configuration système** et paramètres globaux
- **Rapports avancés** et analyses

### Interface Manager
- **Gestion d'équipe** et validation des demandes
- **Suivi des performances** et évaluations
- **Planning** et organisation des ressources
- **Budgets** et gestion financière

### Interface Employee
- **Profil personnel** et informations
- **Demandes** de congés et formations
- **Consultation** des documents RH
- **Communication** interne

## 🛠️ Scripts Disponibles

```bash
# Développement
npm run dev          # Démarrer le frontend
npm run backend      # Démarrer le backend
npm run dev:full     # Démarrer frontend + backend

# Base de données
npm run db:generate  # Générer le client Prisma
npm run db:push      # Pousser le schéma vers la DB
npm run db:seed      # Insérer les données initiales
npm run db:studio    # Ouvrir Prisma Studio

# Production
npm run build        # Construire l'application
npm run start        # Démarrer en production
npm run lint         # Vérifier le code
npm run test         # Exécuter les tests
```

## 📚 Documentation

### Architecture du Système
- **Frontend**: Next.js 15 avec App Router et Server Components
- **Backend**: Express.js avec architecture REST API
- **Base de données**: MySQL avec Prisma ORM
- **Authentification**: JWT avec middleware de sécurité
- **Permissions**: Système RBAC granulaire

### Structure du Projet
```
hrms/
├── src/                    # Code source frontend
│   ├── app/               # Pages Next.js (App Router)
│   ├── components/        # Composants réutilisables
│   ├── services/          # Services API
│   ├── types/             # Types TypeScript
│   └── lib/               # Utilitaires
├── backend/               # Code source backend
│   ├── controllers/       # Contrôleurs API
│   ├── middleware/        # Middleware Express
│   ├── models/           # Modèles Prisma
│   ├── routes/           # Routes API
│   └── utils/            # Utilitaires backend
├── prisma/               # Configuration Prisma
└── public/               # Assets statiques
```

### Système de Permissions
Le système RBAC inclut 47 permissions granulaires organisées en catégories :
- **Utilisateurs** : Création, modification, suppression, consultation
- **Rôles** : Gestion des rôles et permissions
- **Départements** : Gestion organisationnelle
- **Finances** : Gestion budgétaire et salariale
- **Rapports** : Génération et consultation des rapports

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. **Fork** le projet
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines de Contribution
- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire
- S'assurer que tous les tests passent

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Contact

- **Développeur** : Mr. Gentil
- **Email** : contact@mrgentil.dev
- **GitHub** : [@mrgentil](https://github.com/mrgentil)
- **Projet** : [https://github.com/mrgentil/hrms](https://github.com/mrgentil/hrms)

---

⭐ **Si ce projet vous aide, n'hésitez pas à lui donner une étoile sur GitHub !**
