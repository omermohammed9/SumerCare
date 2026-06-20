import { MigrationInterface, QueryRunner } from "typeorm"

export class PatientMigration1699631664469 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE TABLE "patient" (
            "id" SERIAL PRIMARY KEY,
            "name" varchar NOT NULL,
            "dateOfBirth" date NOT NULL,
            "createdDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        
    `);
        await queryRunner.query(`
            ALTER TABLE "patient" ALTER COLUMN "gender" SET NOT NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        DROP TABLE "patient";
    `);
    }

}
