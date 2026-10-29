import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from backend parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

export const runMigrations = async () => {
    console.log('Starting database migrations...');
    
    // Connect with multipleStatements enabled to allow running entire migration scripts
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        // 1. Create migrations tracking table if not exists
        await connection.query(`
            CREATE TABLE IF NOT EXISTS \`schema_migrations\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`migration_name\` varchar(255) NOT NULL,
                \`applied_at\` timestamp DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`uq_migration_name\` (\`migration_name\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        // 2. Read all SQL files in migrations folder
        const migrationsDir = __dirname;
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Run sequentially by name prefix (e.g. 001, 002)

        if (files.length === 0) {
            console.log('No migration files found.');
            return;
        }

        // 3. Run each migration if not already applied
        for (const file of files) {
            const [alreadyApplied] = await connection.query(
                'SELECT 1 FROM schema_migrations WHERE migration_name = ?',
                [file]
            );

            if (alreadyApplied.length > 0) {
                console.log(`Skipped: ${file} (already applied in schema_migrations)`);
                continue;
            }

            console.log(`Applying: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            let sqlContent = fs.readFileSync(filePath, 'utf8');

            // Strip "IF NOT EXISTS" from "ADD COLUMN IF NOT EXISTS" for older MySQL compatibility,
            // we will handle duplicate column errors gracefully instead.
            sqlContent = sqlContent.replace(/ADD COLUMN\s+IF\s+NOT\s+EXISTS/gi, 'ADD COLUMN');

            if (sqlContent.trim().length > 0) {
                try {
                    // Execute migration
                    await connection.query(sqlContent);
                    console.log(`✓ Success: ${file} applied successfully.`);
                } catch (sqlError) {
                    const isDuplicateColumn = sqlError.code === 'ER_DUP_FIELDNAME' || sqlError.errno === 1060;
                    const isDuplicateTable = sqlError.code === 'ER_TABLE_EXISTS_ERROR' || sqlError.errno === 1050;
                    
                    if (isDuplicateColumn || isDuplicateTable) {
                        console.log(`ℹ Note: ${file} warning ignored (${sqlError.message}). Mark as applied.`);
                    } else {
                        // Re-throw any other critical sql errors
                        throw sqlError;
                    }
                }
            }

            // Record as applied
            await connection.query(
                'INSERT INTO schema_migrations (migration_name) VALUES (?)',
                [file]
            );
        }

        console.log('✓ All migrations applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
};

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
    runMigrations();
}

