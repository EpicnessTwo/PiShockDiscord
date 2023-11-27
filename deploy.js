const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { discordClientId, discordGuildId, discordToken } = require('./config.json');

const commands = [
    {
        name: 'shock',
        description: 'Activate the shock with a specified intensity',
        options: [{
            name: 'intensity',
            type: 4,
            description: 'The intensity of the shock (1-100)',
            required: true,
        }, {
            name: 'duration',
            type: 4,
            description: 'The duration of the shock (1-15)',
            required: true,
        }],
    },
    {
        name: 'vibrate',
        description: 'Activate vibration with a specified intensity',
        options: [{
            name: 'intensity',
            type: 4,
            description: 'The intensity of the vibration (1-100)',
            required: true,
        }, {
            name: 'duration',
            type: 4,
            description: 'The duration of the vibration (1-15)',
            required: true,
        }],
    },
    {
        name: 'beep',
        description: 'Activate a beep sound',
        options: [{
            name: 'duration',
            type: 4,
            description: 'The duration of the beep (1-15)',
            required: true,
        }],
    },
    {
        name: 'info',
        description: 'Get information about the PiShock device',
    },
    {
        name: 'stats',
        description: 'Get stats about the top 10 users',
    },
];

const rest = new REST({ version: '9' }).setToken(discordToken);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationGuildCommands(discordClientId, discordGuildId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

