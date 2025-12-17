# 🌱 Seeder Départements et Postes

## Fichiers Créés

- ✅ `prisma/seeders/departments-positions.seed.ts`

## Contenu du Seeder

### **20 Départements**
1. Direction Générale (DG)
2. Ressources Humaines (RH)
3. Informatique (IT)
4. Juridique (JUR)
5. Finance et Comptabilité (FIN)
6. Commercial et Ventes (COM)
7. Marketing (MKT)
8. Production (PROD)
9. Logistique (LOG)
10. Qualité (QUA)
11. Recherche et Développement (R&D)
12. Service Client (SAV)
13. Achats (ACH)
14. Communication (COM-EXT)
15. Sécurité et Environnement (HSE)
16. Formation (FORM)
17. Maintenance (MAINT)
18. Administration (ADM)
19. Innovation Digitale (INNOV)
20. Relations Publiques (RP)

### **20 Postes**
1. Directeur Général (Executive)
2. Directeur des Ressources Humaines (Executive)
3. Directeur Informatique / CTO (Executive)
4. Directeur Juridique (Executive)
5. Directeur Financier / CFO (Executive)
6. Chef de Projet (Manager)
7. Développeur Full Stack (Technical)
8. Développeur Frontend (Technical)
9. Développeur Backend (Technical)
10. DevOps Engineer (Technical)
11. Data Scientist (Technical)
12. Designer UX/UI (Technical)
13. Responsable Marketing (Manager)
14. Commercial (Operational)
15. Comptable (Operational)
16. Juriste (Operational)
17. Chargé de Recrutement (Operational)
18. Responsable Qualité (Manager)
19. Technicien Support (Operational)
20. Analyste Business (Technical)

## Comment Exécuter

### **Méthode 1 : Commande directe**
```bash
cd backend
npx ts-node prisma/seeders/departments-positions.seed.ts
```

### **Méthode 2 : Script npm** (à ajouter)
Ajoutez dans `package.json` :
```json
"scripts": {
  ...
  "seed:dept": "ts-node prisma/seeders/departments-positions.seed.ts"
}
```

Puis exécutez :
```bash
npm run seed:dept
```

## Résultat Attendu

```
🌱 Début du seeding...
📦 Création des départements...
  ✓ Direction Générale (DG)
  ✓ Ressources Humaines (RH)
  ✓ Informatique (IT)
  ...

💼 Création des postes...
  ✓ Directeur Général (Executive)
  ✓ Directeur des Ressources Humaines (Executive)
  ✓ Directeur Informatique (CTO) (Executive)
  ...

📊 Résumé du seeding :
  ✓ 20 départements créés
  ✓ 20 postes créés

✅ Seeding terminé avec succès !
```

## Caractéristiques

- ✅ **Upsert** : Ne crée pas de doublons (utilise le code comme clé unique)
- ✅ **Codes uniques** : Chaque département/poste a un code abrégé
- ✅ **Descriptions** : Toutes les entrées ont une description claire
- ✅ **Niveaux** : Les postes sont catégorisés (Executive, Manager, Technical, Operational)
- ✅ **Timestamps** : created_at et updated_at automatiques
