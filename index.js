const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const config = require('./config.json');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs');

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

    // Check if the user is banned
    if (config.banned_users.includes(interaction.user.id)) {
        await interaction.reply('You are banned from using this bot.');
    } else {
        switch (commandName) {
            case 'shock':
                await commandShock(interaction, options);
                break;
            case 'vibrate':
                await commandVibrate(interaction, options);
                break;
            case 'beep':
                await commandBeep(interaction, options);
                break;
            case 'stats':
                await commandStats(interaction, options);
                break;
            case 'list':
                await commandList(interaction, options);
                break;
            case 'add':
            case 'adminadd':
                await commandAdd(interaction, options);
                break;
            case 'remove':
            case 'adminremove':
                await commandRemove(interaction, options);
                break;
            case 'debug':
                await commandDebug(interaction, options);
                break;
            case 'shockban':
                await commandShockBan(interaction, options);
                break;
            case 'shockunban':
                await commandShockUnban(interaction, options);
                break;
            case 'config':
                await commandConfig(interaction, options);
                break;
            default:
                break;
        }
    }
});

async function triggerPiShock(action, op, visualOp, intensity, duration, username, sharecode) {
    try {
        const data = {
            Op: op,
            intensity: intensity,
            duration: duration ?? 1,
            Username: config.pishockUsername,
            Name: config.pishockAppName,
            Code: sharecode,
            Apikey: config.pishockApiKey,
        }

        const response = await axios.post('https://do.pishock.com/api/apioperate/', data);

        if (response.status === 200) {
            // TODO: Check response data
        }

        return `${visualOp} **${username}** with intensity ${intensity} and a duration of ${duration}!`; // Customize the response
    } catch (error) {
        console.error('Error triggering PiShock:', error);
        return `Failed to perform ${action}.`;
    }
}

async function debugPiShock(sharecode) {
    try {
        const data = {
            Username: config.pishockUsername,
            Code: sharecode,
            Apikey: config.pishockApiKey,
        }

        const response = await axios.post('https://do.pishock.com/api/apioperate/', data);

        if (response.status === 200) {
            // TODO: Check response data
        }

        return response.data;
    } catch (error) {
        console.error('Error debugging PiShock:', error);
        return `Failed to perform debug.`;
    }
}

async function logAction(userId, actionType, intensity, duration, username) {
    const db = await dbPromise;
    const query = `INSERT INTO logs (discord_user_id, type, intensity, duration, pishock_user) VALUES (?, ?, ?, ?, ?)`;

    try {
        await db.run(query, [userId, actionType, intensity, duration, username]);
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
        pishock_user TEXT NOT NULL,
        type TEXT NOT NULL,
        intensity INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    return db;
}

function humanizeDuration(duration) {
    let seconds = duration % 60;
    let minutes = Math.floor(duration / 60);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;

    if (hours > 0) {
        return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    } else if (minutes > 0) {
        return `${minutes} minutes, ${seconds} seconds`;
    } else {
        return `${seconds} seconds`;
    }
}

async function commandShock(interaction, options) {
    const intensity = options.getInteger('intensity') ?? 1;
    const duration = options.getInteger('duration');
    const user = options.getString('user');
    if (intensity < 1 || intensity > 100) {
        await interaction.reply('Intensity must be between 1 and 100.');
        return;
    }

    if (duration < 1 || duration > 15) {
        await interaction.reply('Duration must be between 1 and 15.');
        return;
    }

    if (user === 'all' || !user) {
        // Shock everyone!
        for (const pishock_user of config.pishock_users) {
            await triggerPiShock('shock', 0, 'Shocking', intensity, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
            logAction(interaction.user.id, 'shock', intensity, duration, pishock_user.pishockUsername);
        }

        await interaction.reply(`Shocking **everyone** with intensity ${intensity} and a duration of ${duration}!`);
    } else {
        let found = false;
        for (const pishock_user of config.pishock_users) {
            if (pishock_user.pishockUsername === user) {
                const response = await triggerPiShock('shock', 0, 'Shocking', intensity, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
                await interaction.reply(response);
                logAction(interaction.user.id, 'shock', intensity, duration, pishock_user.pishockUsername);
                found = true;
            }
        }

        if (!found) {
            await interaction.reply('User not found.');
        }
    }
}

async function commandVibrate(interaction, options) {
    const intensity = options.getInteger('intensity') ?? 1;
    const duration = options.getInteger('duration');
    const user = options.getString('user');
    if (intensity < 1 || intensity > 100) {
        await interaction.reply('Intensity must be between 1 and 100.');
        return;
    }

    if (duration < 1 || duration > 15) {
        await interaction.reply('Duration must be between 1 and 15.');
        return;
    }

    if (user === 'all' || !user) {
        // Shock everyone!
        for (const pishock_user of config.pishock_users) {
            await triggerPiShock('vibrate', 1, 'Vibrating', intensity, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
            logAction(interaction.user.id, 'vibrate', intensity, duration, pishock_user.pishockUsername);
        }

        await interaction.reply(`Vibrating **everyone** with intensity ${intensity} and a duration of ${duration}!`);
    } else {
        let found = false;
        for (const pishock_user of config.pishock_users) {
            if (pishock_user.pishockUsername === user) {
                const response = await triggerPiShock('vibrate', 1, 'Vibrating', intensity, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
                await interaction.reply(response);
                logAction(interaction.user.id, 'vibrate', intensity, duration, pishock_user.pishockUsername);
                found = true;
            }
        }

        if (!found) {
            await interaction.reply('User not found.');
        }
    }
}

async function commandBeep(interaction, options) {
    const duration = options.getInteger('duration');
    const user = options.getString('user');

    if (duration < 1 || duration > 15) {
        await interaction.reply('Duration must be between 1 and 15.');
        return;
    }

    if (user === 'all' || !user) {
        // Shock everyone!
        for (const pishock_user of config.pishock_users) {
            await triggerPiShock('beep', 2, 'Beeping', 1, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
            logAction(interaction.user.id, 'beep', 1, duration, pishock_user.pishockUsername);
        }

        await interaction.reply(`Beeping **everyone** with intensity ${intensity} and a duration of ${duration}!`);
    } else {
        let found = false;
        for (const pishock_user of config.pishock_users) {
            if (pishock_user.pishockUsername === user) {
                const response = await triggerPiShock('beep', 2, 'Beeping', 1, duration, pishock_user.pishockUsername, pishock_user.pishockShareCode);
                await interaction.reply(response);
                logAction(interaction.user.id, 'beep', 1, duration, pishock_user.pishockUsername);
                found = true;
            }
        }

        if (!found) {
            await interaction.reply('User not found.');
        }
    }
}

async function commandStats(interaction, options) {
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
                statsEmbed.addFields({ name: `User: ${userName}`, value: `Total Duration: ${humanizeDuration(row.total_duration)}`, inline: false });
            } catch (error) {
                console.error(`Failed to fetch user ${row.discord_user_id}:`, error);
                statsEmbed.addFields({ name: `User ID: ${row.discord_user_id}`, value: `Total Duration: ${humanizeDuration(row.total_duration)} seconds (user fetch failed)`, inline: false });
            }
        }

        await interaction.reply({ embeds: [statsEmbed] });
    } catch (error) {
        console.error('Failed to retrieve stats:', error);
        await interaction.reply('Failed to retrieve stats.');
    }
}

async function commandList(interaction, options) {
    try {
        // Creating an embed
        const statsEmbed = new EmbedBuilder()
            .setColor(0x0099ff) // Use a hexadecimal color
            .setTitle('Connected PiShock Users')
            .setTimestamp();

        let index = 1;
        for (const pishock_user of config.pishock_users) {
            statsEmbed.addFields({ name: '#' + index, value: pishock_user.pishockUsername, inline: false });
            index++;
        }

        await interaction.reply({ embeds: [statsEmbed] });
    } catch (error) {
        console.error('Failed to retrieve stats:', error);
        await interaction.reply('Failed to retrieve stats.');
    }
}

async function commandAdd(interaction, options) {
    const username = (interaction.commandName === 'add') ? interaction.user.username : options.getString('username');
    const sharecode = options.getString('sharecode');

    // Check if the admin is adding a user
    if (interaction.commandName === 'adminadd') {
        const admin = interaction.member;
        if (!admin.roles.cache.some(role => role.id === config.discordAdminRoleId)) {
            await interaction.reply('You must be an admin to use this command.');
            return;
        }
    }

    if (!username || !sharecode) {
        await interaction.reply('Username and sharecode are required.');
        return;
    }

    let found = false;
    for (let i = 0; i < config.pishock_users.length; i++) {
        const pishock_user = config.pishock_users[i];
        if (pishock_user.pishockUsername === username) {
            config.pishock_users[i].pishockShareCode = sharecode;
            found = true;
            break;
        }
    }

    if (found) {
        // Save the config file
        await interaction.reply(`Updated user ${username}!`);
    } else {
        config.pishock_users.push({ pishockUsername: username, pishockShareCode: sharecode });
        await interaction.reply(`Added user ${username}!`);
    }

    fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
}

async function commandRemove(interaction, options) {
    const username = (interaction.commandName === 'remove') ? interaction.user.username : options.getString('username');

    // Check if the admin is adding a user
    if (interaction.commandName === 'adminremove') {
        const admin = interaction.member;
        if (!admin.roles.cache.some(role => role.id === config.discordAdminRoleId)) {
            await interaction.reply('You must be an admin to use this command.');
            return;
        }
    }

    if (!username) {
        await interaction.reply('Username is required.');
        return;
    }

    let found = false;
    for (let i = 0; i < config.pishock_users.length; i++) {
        const pishock_user = config.pishock_users[i];
        if (pishock_user.pishockUsername === username) {
            config.pishock_users.splice(i, 1);
            found = true;
            break;
        }
    }

    if (found) {
        // Save the config file
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        await interaction.reply(`Removed user ${username}!`);
    } else {
        await interaction.reply('User not found.');
    }
}

async function commandDebug(interaction, options) {
    const user = options.getString('user');

    if (!user) {
        await interaction.reply('User is required.');
        return;
    }

    let found = false;
    for (const pishock_user of config.pishock_users) {
        if (pishock_user.pishockUsername === user) {
            const response = await debugPiShock(pishock_user.pishockShareCode);
            await interaction.reply(response);
            console.log(response);
            found = true;
        }
    }

    if (!found) {
        await interaction.reply('User not found.');
    }
}

async function commandShockBan(interaction, options) {
    const user = options.getUser('username');

    // Check if the admin is adding a user
    const admin = interaction.member;
    if (!admin.roles.cache.some(role => role.id === config.discordAdminRoleId)) {
        await interaction.reply('You must be an admin to use this command.');
        return;
    }

    if (!user) {
        await interaction.reply('Username is required.');
        return;
    }

    let found = false;
    for (let i = 0; i < config.banned_users.length; i++) {
        const banned_user = config.banned_users[i];
        if (banned_user === user.id) {
            found = true;
            break;
        }
    }

    if (found) {
        // Save the config file
        await interaction.reply(`${user.username} is already banned!`);
    } else {
        config.banned_users.push(user.id);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        await interaction.reply(`${user.username} has been banned!`);
    }
}

async function commandShockUnban(interaction, options) {
    const user = options.getUser('username');

    // Check if the admin is adding a user
    const admin = interaction.member;
    if (!admin.roles.cache.some(role => role.id === config.discordAdminRoleId)) {
        await interaction.reply('You must be an admin to use this command.');
        return;
    }

    if (!user) {
        await interaction.reply('Username is required.');
        return;
    }

    let found = false;
    for (let i = 0; i < config.banned_users.length; i++) {
        const banned_user = config.banned_users[i];
        if (banned_user === user.id) {
            console.log('Removing banned user:', user.id)
            config.banned_users.splice(i, 1);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
            found = true;
            break;
        }
    }

    if (!found) {
        // Save the config file
        await interaction.reply(`${user.username} is not banned!`);
    } else {
        config.banned_users.push(user.id);
        await interaction.reply(`${user.username} has been unbanned!`);
    }
}

async function commandConfig(interaction, options) {
    const username = interaction.member.username;

    const maxshockintensity = options.getInteger('maxshockintensity');
    const maxshockduration = options.getInteger('maxshockduration');
    const maxvibrateintensity = options.getInteger('maxvibrateintensity');
    const maxvibrateduration = options.getInteger('maxvibrateduration');

    if (!maxshockintensity && !maxshockduration && !maxvibrateintensity && !maxvibrateduration) {
        await interaction.reply('At least one option is required.');
        return;
    }

    let found = false;
    for (let i = 0; i < config.pishock_users.length; i++) {
        const pishock_user = config.pishock_users[i];
        if (pishock_user.pishockUsername === username) {
            let configuser = config.pishock_users[i];

            if (maxshockintensity) {
                configuser.max_shock_intensity = maxshockintensity;
            }

            if (maxshockduration) {
                configuser.max_shock_duration = maxshockduration;
            }

            if (maxvibrateintensity) {
                configuser.max_vibrate_intensity = maxvibrateintensity;
            }

            if (maxvibrateduration) {
                configuser.max_vibrate_duration = maxvibrateduration;
            }
            found = true;
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
            break;
        }
    }

    if (found) {
        // Save the config file
        await interaction.reply(`Updated user ${username}!`);
    } else {
        await interaction.reply(`You're not currently in the database. Please use the /add command to add yourself.`);
    }

}

client.login(config.discordToken);
