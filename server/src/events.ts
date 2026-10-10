import { Response } from 'express';

interface SseClient {
  id: string;
  res: Response;
}

class EventBus {
  private clients: SseClient[] = [];

  addClient(id: string, res: Response) {
    this.clients.push({ id, res });
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, time: Date.now() })}\n\n`);
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((c) => c.id !== id);
  }

  broadcast(eventType: string, data: any) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error(`Failed to push to SSE client ${client.id}:`, err);
      }
    }
  }

  getClientCount(): number {
    return this.clients.length;
  }
}

export const eventBus = new EventBus();
