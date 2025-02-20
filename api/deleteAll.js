import pool from './db';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Méthode non autorisée' });
  }

  try {
    await pool.query('DELETE FROM training_plan');
    res.status(200).json({ message: 'Toutes les données ont été supprimées' });
  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}
