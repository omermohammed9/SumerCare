import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWearableTelemetry1781913035646 implements MigrationInterface {
    name = 'AddWearableTelemetry1781913035646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "patient" ADD "wearableTelemetry" jsonb`);
        await queryRunner.query(`CREATE INDEX "IDX_6920dd18742108d536d63842e3" ON "patient" ("nationalId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_6920dd18742108d536d63842e3"`);
        await queryRunner.query(`ALTER TABLE "patient" DROP COLUMN "wearableTelemetry"`);
    }

}
