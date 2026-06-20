export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum Role {
    ADMIN = "ADMIN",
    DOCTOR = "DOCTOR",
    FRONT_DESK = "FRONT_DESK"
}
export interface PatientDeletedEvent {
    patientId: string;
    deletedAt: Date;
}
