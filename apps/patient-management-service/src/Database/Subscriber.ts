import { EntitySubscriberInterface, EventSubscriber, InsertEvent } from "typeorm";
import  Patient  from "@/entity/Patient";

@EventSubscriber()
 class PatientSubscriber implements EntitySubscriberInterface<Patient> {
    listenTo() {
        return Patient;
    }

    afterInsert(event: InsertEvent<Patient>) {
        console.log(`A patient record was inserted:`, event.entity);
    }
}

export default PatientSubscriber;