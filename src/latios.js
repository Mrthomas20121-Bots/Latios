const request = require("./request.js");
const functions = require('./helper/functions');
const fs = require("fs");
const Sweetcord = require("sweetcord");
const auth = require('./auth.json');

// prefix
const prefix = "?";
// max number of pokemon
const maxpoke = 964;

// pokemon name
pokemon = "";

// inv?
var pokemons = {};
var inventory = {};

const ColorRole = ["salmon", "coral", "leafGreen", "fire"];

// Initialize Discord Bot
const bot = new Sweetcord.SweetClient({
  token: auth.token,
  autorun: true
});
+
bot.on("ready", function(event) {
  console.log("Logged in as %s\n", bot.username);
  inventory = JSON.parse(fs.readFileSync("./data/inventory.json", { encoding:'utf8'}));
});
bot.on("message", (user, userID, channelID, message, event) => {
  if (message.startsWith(prefix)) {
    let cmd = message.slice(prefix.length).split(" ");
    if (cmd[0] == "dex") {
      if (cmd.length == 1) {
        bot.sendMessage({
          to: channelID,
          message: "ERROR Missing parametter. `?dex int`"
        });
      } else {
        let url = `https://pokeapi.co/api/v2/pokemon/${cmd[1].toLowerCase()}/`;
        request(url, (err, res, body) => {
          if (JSON.parse(body).hasOwnProperty("detail")) {
            bot.sendMessage({
              to: channelID,
              message: "Error You specified a unknown pokemon name or id"
            });
          } else {
            let result = JSON.parse(body);
            request(
              `https://pokeapi.co/api/v2/pokemon-species/${cmd[1].toLowerCase()}/`,
              (err, res, body1) => {
                let desc = functions.find(JSON.parse(body1).flavor_text_entries);
                let types = functions.getType(result);
                bot.sendMessage({
                  to: channelID,
                  embed: {
                    description: `**${result.name}**`,
                    color: 0x484b51,
                    timestamp: new Date(),
                    thumbnail: {
                      url: result.sprites.front_default
                    },
                    footer: {
                      icon_url: "",
                      text: "Latios Bot"
                    },
                    fields: [
                      {
                        name: "description",
                        value: desc,
                        inline: true
                      },
                      {
                        name: "id",
                        value: result.id,
                        inline: true
                      },
                      {
                        name: "type(s)",
                        value: types,
                        inline: true
                      }
                    ]
                  }
                });
              }
            );
          }
        });
      }
    }
    if (cmd[0] == "walk") {
      let rand = Math.floor(Math.random() * 10);
      if (rand > 4) {
        let randPoke = Math.floor(Math.random() * maxpoke);
        const url = `https://pokeapi.co/api/v2/pokemon/${randPoke}`;
        request(url, (err, res, bdy) => {
          if (err) throw err;
          let result = JSON.parse(bdy);
          pokemon = result.name;
          bot.sendMessage({
            to: channelID,
            embed: {
              description: `a **${result.name}** appeared!`,
              color: 0x484b51,
              timestamp: new Date(),
              thumbnail: {
                url: result.sprites.front_default
              },
              footer: {
                icon_url: "",
                text: "Latios Bot"
              }
            }
          });
          pokemons[userID] = result.name;
        });
      } else {
        bot.sendMessage({
          to: channelID,
          message: "You didn't find any pokemon."
        });
      }
    }
    if (cmd[0] == "item") {
      let uri = `https://pokeapi.co/api/v2/item/${cmd[1].toLowerCase()}`;

      request(uri, (err, res, body) => {
        if (err) throw err;
        let b = JSON.parse(body);
        let desc = b.flavor_text_entries[11].text;
        // console.log(b);
        bot.sendMessage(
          {
            to: channelID,
            embed: {
              description: `**${b.name}**`,
              color: 0x484b51,
              timestamp: new Date(),
              thumbnail: {
                url: b.sprites.default
              },
              footer: {
                icon_url: "",
                text: "Latios Bot"
              },
              fields: [
                {
                  name: "Description",
                  value: `${desc}`,
                  inline: true
                },
                {
                  name: "Effect",
                  value: `${b.effect_entries[0].short_effect}`,
                  inline: false
                }
              ]
            }
          },
          (err, res) => console.log
        );
      });
    }
    if (cmd[0] == "catch") {
      if (cmd.length == 1) {
        bot.sendMessage({
          to: channelID,
          message: "Error, ?catch must use a ball as parametter"
        });
      }
      else {
        let pokeball = cmd[1];
        if (typeof inventory[userID] == "undefined") {
          inventory[userID] = {
            pokeball: 1,
            greatball: 1,
            ultraball: 1,
            masterball: 0
          };
        }
        if(inventory[userID][pokeball] == 0) {
          bot.sendMessage({
            to:channelID,
            message:"You are out of that type of pokeball!"
          });
        }
        else {
          let ball_percent = (50/100);
          if (pokeball == "greatball") {
            ball_percent = (60/100);
          } 
          else if (pokeball == "ultraball") {
            ball_percent = (75/100);
          }
          else if(pokeball == "masterball") {
            ball_percent = 1;
          }
          let result = functions.catchPkmn(pokemon, ball_percent);
          if(result == "caught") {
            inventory[userID][pokemon] = pokemon; 
            bot.sendMessage({
              to:channelID,
              message:`You succefuly caught ${pokemon}`
            });
          }
          else {
            bot.sendMessage({
              to:channelID,
              message:`You didn't catch ${pokemon}. it ran away`
            });
          }
          inventory[userID][pokeball]--;
          functions.saveInventory(inventory)
        }
      }
    }
    if (cmd[0] == "assign" && cmd[1] == "role") {
      if (
        ColorRole.includes(cmd[2]) &&
        bot.servers[bot.channels[channelID].guild_id].members[
          userID
        ].roles.includes(cmd[2]) !== false
      ) {
        bot.addRoleToUser(
          { username: user, channelID, roleName: cmd[2] },
          err => {
            if (err) throw err;
            bot.sendMessage({
              to: channelID,
              message: `Successfully added ${cmd[2]} to your roles.`
            });
          }
        );
      } else {
        bot.sendMessage({
          to: channelID,
          message: "Error you already have that role"
        });
      }
    }
  }
});

bot.on("guildMemberAdd", member => {
  let c = "449119750342180865";
  bot.sendMessage({
    to: c,
    message: `Welcome <@${member.id}> to the server. gotta catch them all`
  });
  bot.addToRole({
    serverID: bot.channels[c].guild_id,
    userID: member.id,
    roleID: "449123584082837505"
  });
});

bot.on("disconnect", function(errMsg, code) {
  if (errMsg) {
    console.log(errMsg);
  }
  console.log(code);
  functions.saveInventory(inventory);
  bot.disconnect();
});
