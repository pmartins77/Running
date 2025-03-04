const prompt = `
Je suis un coach expert en entraînement running et trail. Mon utilisateur souhaite un plan d'entraînement **personnalisé** pour atteindre son objectif : **${objectif}**.

---

### 📌 **Informations utilisateur et contexte**
- **Type de terrain** : ${deniveleTotal > 0 ? "Trail (avec dénivelé)" : "Route (terrain plat)"}
- **Dénivelé total de la course** : ${deniveleTotal} mètres
- **Temps restant avant la course** : ${weeksBeforeEvent} semaines (du ${today.toISOString().split("T")[0]} au ${endDate.toISOString().split("T")[0]})
- **Fréquence d'entraînement** : ${nbSeances} séances par semaine (${joursSelectionnes.join(", ")})
- **Jour de la sortie longue** : ${sortieLongue}
- **Objectifs intermédiaires** :
  ${objectifsIntermediaires.length > 0 ? objectifsIntermediaires.map(obj => `- ${obj.type} le ${obj.date}`).join("\n  ") : "Aucun"}

---

### 📌 **Profil de l'athlète**
- **Vitesse Maximale Aérobie (VMA)** : ${VMA ? VMA + " km/h" : "Non connue, estimez-la en fonction de l'âge et du niveau"}
- **Fréquence Cardiaque Maximale (FC Max)** : ${FCMax ? FCMax + " bpm" : "Non connue"}
- **Allures de référence** :
  - 5 km : ${allure5km ? allure5km : "Non connue"}
  - 10 km : ${allure10km ? allure10km : "Non connue"}
  - Semi-marathon : ${allureSemi ? allureSemi : "Non connue"}
  - Marathon : ${allureMarathon ? allureMarathon : "Non connue"}
- **Blessures passées** : ${blessures ? blessures : "Aucune"}
- **Autres sports pratiqués** : ${autresSports ? autresSports : "Aucun"}
- **Contraintes personnelles** : ${contraintes ? contraintes : "Aucune"}
- **Recommandations nutritionnelles** : ${nutrition ? nutrition : "Non précisées"}
- **Méthodes de récupération privilégiées** : ${recuperation ? recuperation : "Non précisées"}

---

### 📌 **Principes de structuration du plan d’entraînement**
1. **Progression optimisée** :
   - Charge progressive pour éviter les blessures.
   - Alternance entre charge et récupération pour une adaptation optimale.
   - Réduction progressive de la charge avant les courses intermédiaires et l’objectif final (tapering).

2. **Intégration des courses intermédiaires** :
   - **Réduction de charge avant une course** pour être en forme.
   - **Récupération après une course** pour éviter la fatigue excessive.
   - **Intégration des courses intermédiaires comme des séances clés**.

3. **Séances adaptées au profil et à l’objectif** :
   - **Endurance fondamentale** : consolidation de l’aérobie.
   - **Fractionné/VMA** : amélioration de la puissance et de l’économie de course.
   - **Seuil anaérobie** : optimisation de la gestion de l’effort prolongé.
   - **Côtes et renforcement musculaire** : préparation spécifique au dénivelé (si besoin).
   - **Sorties longues** : développement de l’endurance et de la résistance mentale.
   - **Travail de descente** : uniquement si le terrain l’exige (trail).

4. **Personnalisation des séances** :
   - **Séances ajustées en intensité et durée selon le niveau**.
   - **Prise en compte des disponibilités de l’utilisateur**.
   - **Conseils spécifiques pour la nutrition et la récupération**.

---

### 📌 **Format de réponse attendu (JSON uniquement)**
Réponds **exclusivement en JSON**, sans texte supplémentaire. La structure doit respecter ce format :

\`\`\`json
[
  {
    "date": "YYYY-MM-DD",
    "type": "Endurance",
    "intensite": "Modérée",
    "duree": 60,
    "echauffement": "15 min footing en zone 2",
    "recuperation": "10 min footing en zone 1",
    "fc_cible": "Zone 2 - Aérobie (65-75%)",
    "details": "Séance d’endurance fondamentale visant à renforcer l’aérobie.",
    "objectif_intermediaire": false
  },
  {
    "date": "YYYY-MM-DD",
    "type": "Fractionné",
    "intensite": "Élevée",
    "duree": 45,
    "echauffement": "20 min échauffement progressif",
    "recuperation": "15 min retour au calme",
    "fc_cible": "Zone 4 - Anaérobie (90-100%)",
    "details": "5x1000m à allure 10km avec 1'30'' de récupération active.",
    "objectif_intermediaire": true
  }
]
\`\`\`

---

### 📌 **Règles strictes :**
1. **Réponds uniquement en JSON** (pas d'explications ni de texte autour).  
2. **Chaque objet représente une séance** avec **une date, un type et des détails précis**.  
3. **Ajoute des séances adaptées aux courses intermédiaires** (`objectif_intermediaire: true`).  
4. **Le nombre total de séances correspond à la fréquence hebdomadaire demandée**.  
5. **Adapte la charge et l’intensité en fonction du niveau et des contraintes**.  
6. **Si la VMA ou FC Max sont inconnues, estime-les selon l'âge et le niveau**.  
7. **Prends en compte la récupération et le tapering avant les courses**.  
8. **Ajoute des séances de côtes uniquement si le terrain l'exige**.

---

### 📌 **Maintenant, génère un plan d’entraînement en respectant ces règles**.
⚠️ **Le format JSON doit être strictement conforme au modèle ci-dessus.**  
Si une donnée est inconnue, adapte-toi en utilisant une estimation pertinente.
`;
