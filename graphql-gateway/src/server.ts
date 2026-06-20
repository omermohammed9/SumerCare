import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import axios from 'axios';

// Services Base URLs
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-management:5000';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-scheduling:8000';

// GraphQL Schema
const typeDefs = `#graphql
  type Patient {
    id: ID!
    nationalId: String!
    name: String!
    createdAt: String!
  }

  type Appointment {
    id: ID!
    patientId: String!
    date: String!
    status: String!
    type: String!
    patient: Patient
  }

  type Query {
    getPatient(id: ID!): Patient
    getAppointment(id: ID!): Appointment
    getAllPatients: [Patient]
    getAllAppointments: [Appointment]
  }

  type Mutation {
    ingestWhatsAppMessage(phoneNumber: String!, message: String!): String
  }
`;

// Resolvers
const resolvers = {
  Query: {
    getPatient: async (_: any, { id }: { id: string }) => {
      const response = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/${id}`);
      return response.data;
    },
    getAppointment: async (_: any, { id }: { id: string }) => {
      const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/${id}`);
      return response.data.data;
    },
    getAllPatients: async () => {
      const response = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/`);
      return response.data;
    },
    getAllAppointments: async () => {
      const response = await axios.get(`${APPOINTMENT_SERVICE_URL}/api/appointments/`);
      return response.data.data;
    }
  },
  Appointment: {
    // Aggregation: Fetch patient details for a given appointment
    patient: async (parent: any) => {
      try {
        const response = await axios.get(`${PATIENT_SERVICE_URL}/api/patients/${parent.patientId}`);
        return response.data;
      } catch (error) {
        return null; // Return null if patient not found (e.g., deleted)
      }
    }
  },
  Mutation: {
    ingestWhatsAppMessage: async (_: any, { phoneNumber, message }: { phoneNumber: string, message: string }) => {
      console.log(`[Omnichannel] Received WhatsApp message from ${phoneNumber}: ${message}`);
      return "Message queued for processing";
    }
  }
};

async function startGateway() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: parseInt(process.env.PORT || '4000') },
  });

  console.log(`🚀 GraphQL Gateway ready at ${url}`);
}

startGateway().catch(console.error);
