// ✅ Route de connexion (login)
router.post("/login", async (req, res) => {
    try {
        console.log("📌 Tentative de connexion :", req.body);

        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email et mot de passe requis." });
        }

        // ✅ Vérification de la connexion à PostgreSQL
        try {
            const testDB = await pool.query("SELECT NOW()");
            console.log("📌 Connexion DB OK, timestamp:", testDB.rows[0].now);
        } catch (err) {
            console.error("❌ ERREUR Connexion DB :", err);
            return res.status(500).json({ error: "Problème de connexion à la base de données." });
        }

        // ✅ Vérifier si l'utilisateur existe
        console.log("📌 Vérification de l'utilisateur :", email);
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        console.log("📌 Résultat de la requête :", userResult.rows);

        if (userResult.rows.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé." });
        }

        const user = userResult.rows[0];

        // ✅ Vérifier le mot de passe
        console.log("📌 Vérification du mot de passe...");
        console.log("Mot de passe haché en base :", user.mot_de_passe);
        const validPassword = await bcrypt.compare(password, user.mot_de_passe);

        if (!validPassword) {
            return res.status(401).json({ error: "Mot de passe incorrect." });
        }

        // ✅ Générer un token JWT
        const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: "7d" });

        console.log("✅ Connexion réussie :", user.email);
        res.status(200).json({ token, user });

    } catch (error) {
        console.error("❌ ERREUR lors de la connexion :", error);
        res.status(500).json({ error: "Erreur serveur lors de la connexion." });
    }
});
