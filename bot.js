const { Client, GatewayIntentBits,Collection } = require('discord.js');

require('dotenv').config();
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
dbName = 'discord';
MongoClient.connect(url, function(err, client) {
    db = client.db(dbName);
    console.log("Connected to db");
  });

const fs = require('fs');


const client = new Client({
    intents:[
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildVoiceStates]
});




const prefix = process.env.PREFIX || '!';


client.commands = new Collection();



const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    if(!command.description){
        console.log(`${file} has no description`);
        continue;
    }
    console.log(`${file} loaded!`);
    client.commands.set(command.name, command);
}



client.on('ready', async (client) =>{


    client.user.setPresence({
        activities: [{ name: "with /help", type: "PLAYING" }],
      });

    const devGuild = await client.guilds.cache.get(process.env.DEV_GUILD);
    devGuild.commands.set(client.commands.map(cmd => cmd));

    console.log("connected as " + client.user.username);
});


client.on('messageCreate', (message) =>{
    if(message.content.startsWith(prefix) && !(message.author.bot)){
    
    const args = message.content.slice(prefix.length).split(/ +/);

    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if(!command){
        message.reply('La commande n\'existe pas');
        return;
    }
    
    try{
        command.execute(message, args,db);
    }
    catch(error){
        console.error(error);
        message.reply(error);
    }
}
});



client.on("interactionCreate", interaction =>{
    if(!interaction.isCommand())
        return

    const command = client.commands.get(interaction.command.name);

    if(!command)
        return;
    try{
        command.executeSlash(interaction, interaction.args);
    }catch(error){
        console.error(error);
        interaction.reply(error);
    }
})

client


client.login(process.env.BOT_TOKEN);
