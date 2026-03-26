/**
 * Deletes every user and all linked rows (Plaid, widgets, Sage chat, classifications, reset tokens).
 * Does NOT drop tables or migrations.
 *
 * Usage (DATABASE_URL must point at your Postgres):
 *   cd backend && npm run db:wipe
 *
 * Railway: open service shell or run locally with Railway DATABASE_URL pasted once.
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Load backend/.env or export DATABASE_URL.");
    process.exit(1);
  }

  const result = await prisma.$transaction(async (tx) => {
    const w = await tx.dashboardWidget.deleteMany();
    const c = await tx.chatMessage.deleteMany();
    const t = await tx.transactionClassification.deleteMany();
    const p = await tx.passwordResetToken.deleteMany();
    const pl = await tx.plaidItem.deleteMany();
    const u = await tx.user.deleteMany();
    return { widgets: w.count, chats: c.count, classifications: t.count, resetTokens: p.count, plaidItems: pl.count, users: u.count };
  });

  console.log("Wiped rows:", result);
  console.log("Done. Sign up again at /signup — old passwords no longer exist.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
