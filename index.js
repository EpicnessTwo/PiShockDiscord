const { Client, GatewayIntentBits  } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    const guild = client.guilds.cache.get(config.discordGuildId);
    if (!guild) {
        console.log('Bot is not in the specified guild. Generate an invite link to add the bot:');
        console.log(`https://discord.com/oauth2/authorize?client_id=${config.discordClientId}&permissions=551903307776&scope=bot`);
    } else {
        console.log(`Bot is already in the guild: ${guild.name}`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'shock' || commandName === 'vibrate') {
        const intensity = options.getInteger('intensity');
        const duration = options.getInteger('duration');
        if (intensity < 1 || intensity > 100) {
            await interaction.reply('Intensity must be between 1 and 100.');
            return;
        }

        if (duration < 1 || duration > 15) {
            await interaction.reply('Duration must be between 1 and 15.');
            return;
        }

        let op;

        switch (commandName) {
            case 'shock':
                op = 0;
                break;
            case 'vibrate':
                op = 1;
                break;
        }

        const response = await triggerPiShock(commandName, op, intensity, duration);
        await interaction.reply(response);
    } else if (commandName === 'beep') {
        const duration = options.getInteger('duration');

        if (duration < 1 || duration > 15) {
            await interaction.reply('Duration must be between 1 and 15.');
            return;
        }

        const response = await triggerPiShock(commandName, 2, 0, duration);
        await interaction.reply(response);
    } else if (commandName === 'info') {
        await interaction.reply('Here is some info about the PiShock device...');
    }
});

async function triggerPiShock(action, op, intensity, duration) {
    try {
        const data = {
            Op: op,
            intensity: intensity,
            duration: duration ?? 1,
            Username: config.pishockUsername,
            Name: config.pishockAppName,
            Code: config.pishockShareCode,
            Apikey: config.pishockApiKey,
        }

        console.log(data);

        const response = await axios.post('https://do.pishock.com/api/apioperate/', data);
        return `Successfully performed ${action} with intensity ${intensity} and a duration if ${duration}!`; // Customize the response
    } catch (error) {
        console.error('Error triggering PiShock:', error);
        return `Failed to perform ${action}.`;
    }
}

client.login(config.discordToken);
