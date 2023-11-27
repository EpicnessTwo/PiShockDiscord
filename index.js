const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

const dbPromise = initializeDatabase();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
    // await setupDatabase();
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

        logAction(interaction.user.id, commandName, intensity, duration);
    } else if (commandName === 'beep') {
        const duration = options.getInteger('duration');

        if (duration < 1 || duration > 15) {
            await interaction.reply('Duration must be between 1 and 15.');
            return;
        }

        const response = await triggerPiShock(commandName, 2, 0, duration);
        await interaction.reply(response);

        logAction(interaction.user.id, commandName, 0, duration);
    } else if (commandName === 'info') {
        await interaction.reply('Here is some info about the PiShock device...');
    } else if (interaction.commandName === 'stats') {
        try {
            const db = await dbPromise;
            const rows = await db.all(
                `SELECT discord_user_id, SUM(duration) as total_duration 
                 FROM logs 
                 WHERE type IN ('shock', 'vibrate') 
                 GROUP BY discord_user_id 
                 ORDER BY total_duration DESC 
                 LIMIT 10`
            );

            // Creating an embed
            const statsEmbed = new EmbedBuilder()
                .setColor(0x0099ff) // Use a hexadecimal color
                .setTitle('Top 10 Users: Shock & Vibrate Duration')
                .setDescription('Users with the most total time spent using shock and vibrate commands')
                .setTimestamp();

            for (const row of rows) {
                try {
                    const user = await client.users.fetch(row.discord_user_id);
                    const userName = user ? user.username : 'Unknown User';
                    statsEmbed.addFields({ name: `User: ${userName}`, value: `Total Duration: ${row.total_duration} seconds`, inline: false });
                } catch (error) {
                    console.error(`Failed to fetch user ${row.discord_user_id}:`, error);
                    statsEmbed.addFields({ name: `User ID: ${row.discord_user_id}`, value: `Total Duration: ${row.total_duration} seconds (user fetch failed)`, inline: false });
                }
            }

            await interaction.reply({ embeds: [statsEmbed] });
        } catch (error) {
            console.error('Failed to retrieve stats:', error);
            await interaction.reply('Failed to retrieve stats.');
        }
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

        if (response.status === 200) {
            console.log(response.data);
        }

        return `Successfully performed ${action} with intensity ${intensity} and a duration if ${duration}!`; // Customize the response
    } catch (error) {
        console.error('Error triggering PiShock:', error);
        return `Failed to perform ${action}.`;
    }
}

async function logAction(userId, actionType, intensity, duration) {
    const db = await dbPromise;
    const query = `INSERT INTO logs (discord_user_id, type, intensity, duration) VALUES (?, ?, ?, ?)`;

    try {
        await db.run(query, [userId, actionType, intensity, duration]);
        console.log('Action logged successfully.');
    } catch (err) {
        console.error('Error logging action:', err.message);
    }
}

async function initializeDatabase() {
    const db = await open({
        filename: './pishock_logs.db',
        driver: sqlite3.Database
    });

    await db.exec(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    return db;
}

client.login(config.discordToken);
