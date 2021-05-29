module.exports = class MessageUpdate {
    constructor (client) {
        this.client = client;
    };

    async run(oldMessage, newMessage) {
    	if (!newMessage) return

        this.client.emit("message", newMessage);
    };
};
