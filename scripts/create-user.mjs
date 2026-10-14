import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { createConnection } from "mysql2/promise";
import { hashPassword } from "../api/auth/password.js";

function promptHidden(label) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Cette commande demande un terminal interactif pour saisir le mot de passe en mode masqué.");
  }

  stdout.write(label);
  stdin.setEncoding("utf8");
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          stdin.removeListener("data", onData);
          stdin.setRawMode(false);
          stdout.write("\n");
          reject(new Error("Opération annulée."));
          return;
        }
        if (character === "\r" || character === "\n") {
          stdin.removeListener("data", onData);
          stdin.setRawMode(false);
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = [...value].slice(0, -1).join("");
        } else if (character >= " ") {
          value += character;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL est requis dans l'environnement ou le fichier .env.");

  const input = createInterface({ input: stdin, output: stdout });
  const email = (await input.question("E-mail du compte : ")).trim().toLowerCase();
  const name = (await input.question("Nom affiché : ")).trim();
  input.close();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
    throw new Error("Adresse e-mail invalide.");
  }
  if (!name || name.length > 255) throw new Error("Le nom doit contenir entre 1 et 255 caractères.");

  const role = process.argv.includes("--admin") ? "admin" : "user";
  if (role === "admin") {
    const adminInput = createInterface({ input: stdin, output: stdout });
    const confirmAdmin = await adminInput.question("Créer ou promouvoir un administrateur plateforme ? (tapez OUI) : ");
    adminInput.close();
    if (confirmAdmin.trim() !== "OUI") throw new Error("Opération annulée.");
  }

  const password = await promptHidden("Mot de passe (12 à 128 caractères) : ");
  const passwordConfirmation = await promptHidden("Confirmer le mot de passe : ");
  if (password !== passwordConfirmation) throw new Error("Les mots de passe ne correspondent pas.");
  if (password.length < 12 || password.length > 128) {
    throw new Error("Le mot de passe doit contenir entre 12 et 128 caractères.");
  }

  const passwordHash = await hashPassword(password);
  const connection = await createConnection(databaseUrl);
  try {
    const [existingRows] = await connection.execute(
      "SELECT `id`, `role` FROM `users` WHERE LOWER(`email`) = ? LIMIT 1",
      [email],
    );
    const existing = Array.isArray(existingRows) ? existingRows[0] : undefined;

    if (existing) {
      const confirmInput = createInterface({ input: stdin, output: stdout });
      const confirmation = await confirmInput.question(`Le compte ${email} existe. Remplacer son mot de passe et son nom ? (tapez OUI) : `);
      confirmInput.close();
      if (confirmation.trim() !== "OUI") throw new Error("Opération annulée.");
      const finalRole = role === "admin" ? "admin" : existing.role;
      await connection.beginTransaction();
      try {
        await connection.execute(
          "UPDATE `users` SET `name` = ?, `email` = ?, `passwordHash` = ?, `role` = ?, `updatedAt` = CURRENT_TIMESTAMP WHERE `id` = ?",
          [name, email, passwordHash, finalRole, existing.id],
        );
        await connection.execute("DELETE FROM `user_sessions` WHERE `userId` = ?", [existing.id]);
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
      stdout.write(`Compte ${email} mis à jour (${finalRole}).\n`);
      return;
    }

    await connection.execute(
      "INSERT INTO `users` (`externalId`, `name`, `email`, `passwordHash`, `role`) VALUES (NULL, ?, ?, ?, ?)",
      [name, email, passwordHash, role],
    );
    stdout.write(`Compte ${email} créé (${role}).\n`);
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  stdout.write(`Échec : ${error instanceof Error ? error.message : "erreur inconnue"}\n`);
  process.exitCode = 1;
});
