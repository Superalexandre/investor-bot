module.exports = class clickButton {
    constructor(client) {
        this.client = client
    }

    async run(button) {
        const client = this.client

        console.log(button.id)
    }
}