import pool from './db';

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT * FROM training_plan ORDER BY date ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
