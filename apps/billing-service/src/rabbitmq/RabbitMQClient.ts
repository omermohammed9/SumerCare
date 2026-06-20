import amqp, { Connection, Channel } from 'amqplib';
import { logger } from '../winston/logger';

export class RabbitMQClient {
  private static connection: any;
  private static channel: any;
  private static readonly url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  static async connect() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', error);
      setTimeout(() => this.connect(), 5000); // Retry logic
    }
  }

  static async publish(exchange: string, routingKey: string, message: any) {
    if (!this.channel) await this.connect();
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), { persistent: true });
  }


  static async subscribe(exchange: string, queue: string, routingKey: string, callback: (msg: any) => void) {
    if (!this.channel) await this.connect();
    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    const q = await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(q.queue, exchange, routingKey);
    
    this.channel.consume(q.queue, (msg) => {
      if (msg) {
        callback(JSON.parse(msg.content.toString()));
        this.channel.ack(msg);
      }
    });
  }
}
