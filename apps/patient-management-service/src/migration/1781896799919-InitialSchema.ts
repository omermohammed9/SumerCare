import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1781896799919 implements MigrationInterface {
    name = 'InitialSchema1781896799919'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "patient" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "gender" character varying, "dateOfBirth" TIMESTAMP NOT NULL, "phoneNumber" character varying, "email" character varying, "address" character varying, "emergencyContactName" character varying, "emergencyContactPhone" character varying, "bloodType" character varying, "allergies" text, "medicalConditions" character varying, "nationalId" character varying, "createdDate" TIMESTAMP NOT NULL DEFAULT now(), "lastUpdated" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_6920dd18742108d536d63842e31" UNIQUE ("nationalId"), CONSTRAINT "PK_8dfa510bb29ad31ab2139fbfb99" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "patient"`);
    }

}
