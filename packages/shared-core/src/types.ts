// Shared types for the microservices
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}

export enum Role {
    ADMIN = 'ADMIN',
    DOCTOR = 'DOCTOR',
    FRONT_DESK = 'FRONT_DESK'
}

export interface PatientDeletedEvent {
    patientId: string;
    deletedAt: Date;
}
