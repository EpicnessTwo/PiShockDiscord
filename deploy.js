const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { discordClientId, discordGuildId, discordToken } = require('./config.json');

const commands = [
    {
        name: 'shock',
        description: 'Activate the shock with a specified intensity and duration (optional: user)',
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
        }, {
            name: 'user',
            type: 3,
            description: 'The user to shock (optional)',
            required: false,
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
        }, {
            name: 'user',
            type: 3,
            description: 'The user to vibrate (optional)',
            required: false,
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
        }, {
            name: 'user',
            type: 3,
            description: 'The user to shock (optional)',
            required: false,
        }],
    },
    {
        name: 'add',
        description: 'Add your PiShock User',
        options: [{
            name: 'sharecode',
            type: 3,
            description: 'The share code of the PiShock User',
            required: true,
        }]
    },
    {
        name: 'remove',
        description: 'Remove your PiShock User'
    },
    {
        name: 'adminadd',
        description: 'Add a new PiShock User',
        options: [{
            name: 'username',
            type: 3,
            description: 'The username of the PiShock User',
            required: true,
        }, {
            name: 'sharecode',
            type: 3,
            description: 'The share code of the PiShock User',
            required: true,
        }]
    },
    {
        name: 'adminremove',
        description: 'Remove a new PiShock User',
        options: [{
            name: 'username',
            type: 3,
            description: 'The username of the PiShock User',
            required: true,
        }]
    },
    {
        name: 'debug',
        description: 'Debug the PiShock device',
        options: [{
            name: 'user',
            type: 3,
            description: 'The user to debug',
            required: true,
        }]
    },
    {
        name: 'stats',
        description: 'Get stats about the top 10 users',
    },
    {
        name: 'list',
        description: 'List all of the known PiShock Users',
    }
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

