class EventBus {
    clients = [];
    addClient(id, res) {
        this.clients.push({ id, res });
        res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, time: Date.now() })}\n\n`);
    }
    removeClient(id) {
        this.clients = this.clients.filter((c) => c.id !== id);
    }
    broadcast(eventType, data) {
        const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        for (const client of this.clients) {
            try {
                client.res.write(payload);
            }
            catch (err) {
                console.error(`Failed to push to SSE client ${client.id}:`, err);
            }
        }
    }
    getClientCount() {
        return this.clients.length;
    }
}
export const eventBus = new EventBus();
