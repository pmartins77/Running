router.post("/login", async (req, res) => {
    try {
        console.log("📌 Tentative de connexion avec :", req.body);

        const { email, password } = req.body;

        if (!email || !password) {
            console.error("❌ Erreur : Email ou mot de passe manquant.");
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) {
            console.error(`❌ Erreur : Aucun utilisateur trouvé pour l'email ${email}`);
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];
        console.log("✅ Utilisateur trouvé :", user.email);

        const validPassword = await bcrypt.compare(password, user.mot_de_passe);
        if (!validPassword) {
            console.error("❌ Erreur : Mot de passe incorrect.");
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Connexion réussie, token généré.");
        res.status(200).json({ token, user });
    } catch (error) {
        console.error("❌ ERREUR lors de la connexion :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
});
