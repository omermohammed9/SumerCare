import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientIndices1781900678808 implements MigrationInterface {
    name = 'AddPatientIndices1781900678808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_6920dd18742108d536d63842e3" ON "patient" ("nationalId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6920dd18742108d536d63842e3"`);
    }

}
