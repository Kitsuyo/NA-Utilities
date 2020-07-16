const {MessageEmbed} = require('discord.js');
const {getDB,createDB,getTime,setTime,saveDB,getUser} = require('../functions/functions.js');
const {prefix} = require('../config.json');
const {writeJson} = require('fs-extra');

module.exports = {
    name: "ban",
    description: "Ban someone from the server",
    usage: "<member> [time] <reason>",
    category: "moderation",
    aliases: ['b', 'banish'],
    guildOnly: true,

    async code(client, message, args, isTest) {
        if (!message.guild.me.hasPermission("BAN_MEMBERS")) return message.channel.send(`oof... no perms...`);
        if (!message.member.hasPermission("BAN_MEMBERS") && isTest !== true) return message.channel.send(`No. Missing permissions: ${message.member.hasPermission("BAN_MEMBERS") ? "" : "Ban Members"}`);
        if (args.length === 0) {
            let embed = new MessageEmbed().setColor("RANDOM").setTitle(`Syntax Error\n${this.name.slice(0,1).toUpperCase()+this.name.slice(1)}`).setDescription(`${this.description}\n\nMember is not defined.`).addField(`Usage`, prefix+this.name+' '+this.usage)
            return message.channel.send(embed);
        }
        var user = await getUser(args[0], client);
        if (!user) {
            let embed = new MessageEmbed().setColor("RANDOM").setTitle(`Syntax Error\n${this.name.slice(0,1).toUpperCase()+this.name.slice(1)}`).setDescription(`${this.description}\n\nMember is not defined.`).addField(`Usage`, prefix+this.name+' '+this.usage)
            return message.channel.send(embed);
        }
        var member = client.guilds.cache.get('713446315496964176').member(user);
        await args.shift();
        var time = await setTime(args[0]);
        if (time !== null) await args.shift();
        var reason = args.slice(0).join(' ');
        if (!reason) {
            let embed = new MessageEmbed().setColor("RANDOM").setTitle(`Syntax Error\n${this.name.slice(0,1).toUpperCase()+this.name.slice(1)}`).setDescription(`${this.description}\n\nReason is not defined.`).addField(`Usage`, prefix+this.name+' '+this.usage)
            return message.channel.send(embed);
        }
        getDB(member.user.id).then(async res => {
            if (!res) res = await createDB(member.id);
            let cases = require('../cases.json');
            cases.cases++;
            res.punishments.bans.push({
                moderator: message.author.id,
                modTag: message.author.tag,
                time: time,
                reason: reason,
                happenedAt: Date.now(),
                caseId: cases.cases
            });
            saveDB(res).then(() => {
                writeJson(`../cases.json`, cases);

                let dmEmbed = new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(`You've been banned from ${message.guild.name} #${cases.cases}`)
                .setDescription(`You've been banned from ${message.guild.name}\nHere are some details to help you catch up on what happened.`)
                .addField(`Moderator`, `${message.author.tag} (${message.author.id})`, true)
                .addField(`Reason`, `${reason}`, true)
                .addField(`Temporary?`, `${time === null ? "No" : "Yes"}`)
                .setFooter(`Expire at: ${time === null ? "Never" : `${new Date(time).toString().slice(0,-40)} | Duration: ${getTime(time)}`}`)
            
                member.user.send(dmEmbed).catch(err => err);

                let embed = new MessageEmbed()
                .setColor("RANDOM")
                .setTitle(`Member Banned #${cases.cases}`)
                .addField(`Member`, `${member.user.tag} (${member.user.id})`)
                .addField(`Moderator`, `${message.author.tag} (${message.author.id})`, true)
                .addField(`Reason`, `${reason}`, true)
                .addField(`Temporary?`, `${time !== null ? "Yes" : "No"}`)
                .setFooter(`Expire at: ${time !== null ? "Never" : `${new Date(time).toString().slice(0,-40)} | Duration: ${getTime(time)}`}`)
            
                message.channel.send(embed).catch(err => err);

                if (isTest === false) console.log('would ban')//member.ban(`Banned by ${message.author.tag} (${message.author.id}) for ${reason}`).catch(err => err);
            });
        });
    }
}