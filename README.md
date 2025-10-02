# 🏢 Human Resource Management System (HRMS)

<div align="center">

![HRMS Banner](https://github.com/vasilismantz/testgif2/blob/master/thesis-large.gif?raw=true)

**Une solution HRMS moderne et complète construite avec React, Node.js, Express et MySQL**

[![GitHub license](https://img.shields.io/github/license/mrgentil/hrms)](https://github.com/mrgentil/hrms/blob/master/LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D%2014.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-16.13.1-blue)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/mysql-8.0+-orange)](https://www.mysql.com/)

</div>

## 📋 Description

Ce système de gestion des ressources humaines (HRMS) est une solution complète développée avec des technologies modernes. Il offre une interface intuitive pour gérer tous les aspects des ressources humaines d'une organisation.

### 🚀 Technologies Utilisées

**Frontend:**
- React 16.13.1 avec Hooks
- Bootstrap 4 pour le design responsive
- Material-UI pour les composants avancés
- Chart.js pour les visualisations
- Axios pour les requêtes HTTP

**Backend:**
- Node.js avec Express.js
- Sequelize ORM pour MySQL
- JWT pour l'authentification
- Bcrypt pour le chiffrement des mots de passe
- Multer pour la gestion des fichiers

**Base de données:**
- MySQL 8.0+
- Structure relationnelle optimisée

## ✨ Fonctionnalités Principales

### 👥 Gestion des Utilisateurs
- ✅ Authentification sécurisée avec JWT
- ✅ Rôles multiples (Admin, Manager, Employee)
- ✅ Profils utilisateurs complets
- ✅ Gestion des permissions

### 🏢 Gestion Organisationnelle
- ✅ Gestion des départements
- ✅ Postes et descriptions de poste
- ✅ Hiérarchie organisationnelle
- ✅ Annonces départementales

### 💰 Gestion Financière
- ✅ Calculs de paie automatisés
- ✅ Gestion des allocations et déductions
- ✅ Historique des paiements
- ✅ Rapports financiers détaillés

### 📋 Gestion des Demandes
- ✅ Demandes de congés
- ✅ Workflow d'approbation
- ✅ Suivi des statuts
- ✅ Notifications automatiques

### 📊 Tableaux de Bord
- ✅ KPIs en temps réel
- ✅ Graphiques interactifs
- ✅ Rapports personnalisables
- ✅ Export des données

## 🚀 Installation et Configuration

### Prérequis
- Node.js (version 14 ou supérieure)
- MySQL (version 8.0 ou supérieure)
- npm ou yarn

### Installation

1. **Cloner le repository**
```bash
git clone https://github.com/mrgentil/hrms.git
cd hrms
```

2. **Installer les dépendances**
```bash
# Backend
npm install

# Frontend
npm run client-install
```

3. **Configuration de la base de données**
- Créer une base de données MySQL nommée `hrms_db`
- Copier `.env.example` vers `.env`
- Configurer les variables d'environnement :

```env
HOST=localhost
DATABASE_USER=root
DATABASE_PASSWORD=your_password
DATABASE=hrms_db
SECRET_KEY=your_secret_key
```

4. **Initialiser la base de données**
```bash
npm run seed
```

5. **Lancer l'application**
```bash
npm run dev
```

L'application sera accessible sur :
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 👤 Comptes de Test

| Rôle | Username | Mot de passe | Description |
|------|----------|--------------|-------------|
| Admin | `bill` | `pass123!` | Accès complet au système |
| Manager | `alice` | `pass123!` | Gestion d'équipe et rapports |
| Employee | `john` | `pass123!` | Accès employé standard |

## 📱 Utilisation

### Interface Admin
- Gestion complète des utilisateurs
- Configuration des départements
- Rapports financiers globaux
- Paramètres système

### Interface Manager
- Gestion de l'équipe
- Approbation des demandes
- Rapports départementaux
- Gestion des plannings

### Interface Employee
- Profil personnel
- Demandes de congés
- Consultation des fiches de paie
- Calendrier personnel

## 🛠️ Scripts Disponibles

```bash
npm run dev          # Lance frontend + backend
npm run server       # Lance uniquement le backend
npm run client       # Lance uniquement le frontend
npm run seed         # Initialise la base de données
npm start           # Lance en mode production
```

## 📚 Documentation

Ce projet dispose d'une documentation complète de 70 pages couvrant :
- Analyse des besoins
- Conception de l'architecture
- Manuel utilisateur détaillé
- Guide de développement

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

**Développeur** - [@mrgentil](https://github.com/mrgentil)

**Lien du projet** - [https://github.com/mrgentil/hrms](https://github.com/mrgentil/hrms)
