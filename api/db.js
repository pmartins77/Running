import pool from './db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    const { trainings } = req.body;

    for (const training of trainings) {
      await pool.query(
        `INSERT INTO training_plan (date, type, warmup, main, recovery, advice) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (date) DO UPDATE 
         SET type = EXCLUDED.type, warmup = EXCLUDED.warmup, 
             main = EXCLUDED.main, recovery = EXCLUDED.recovery, advice = EXCLUDED.advice`,
        [training.date, training.type, training.warmup, training.main, training.recovery, training.advice]
      );
    }

    res.status(200).json({ message: 'Données insérées avec succès' });
  } catch (error) {
    console.error('Erreur lors de l’insertion des données:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
