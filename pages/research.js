const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/research/", {
        })
        .then((dom) => {

            var list = dom.window.document.querySelectorAll('.task-item');

            var research = [] 
            
            list.forEach (_e =>
            {
                e = _e.querySelector(":scope > .task-item-wrapper");

                var alt = e.getAttribute("alt");

                var text = e.querySelector(":scope > .task-text > div").innerHTML.trim();
                var type = e.querySelector(":scope > .task-text").className;
                type = type.replace("task-text", "").replace("-research-tag", "").replace("hide-task-text-m", "").trim();
                
                var rewards = [];
                if (research.some(r => r.alt == alt))
                {
                    rewards = research.filter(r => r.alt == alt)[0].rewards;
                }

                var rewardWrapper = e.querySelector(":scope > .task-reward")

                var reward = { 
                    name: "",
                    image: "",
                    canBeShiny: false,
                    combatPower: {
                        min: -1,
                        max: -1
                    }
                };

                reward.name = rewardWrapper.querySelector(":scope > .reward-text").innerHTML;
                reward.image = rewardWrapper.querySelector(":scope > .reward-img > img").src;

                var combatPower = rewardWrapper.querySelector(":scope > .reward-cp-range").innerHTML.split('</span>')[1];
                reward.combatPower.min = parseInt(combatPower.split(' - ')[0]);
                reward.combatPower.max = parseInt(combatPower.split(' - ')[1]);
                reward.canBeShiny = rewardWrapper.querySelector(":scope > .shiny-icon") != null

                rewards.push(reward);

                research = research.filter(r => r.alt != alt);

                research.push({ "text": text, "type": type, "rewards": rewards, "alt": alt});
            });

            research.forEach(r => { delete r.alt; });

            fs.writeFile('files/research.json', JSON.stringify(research, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/research.min.json', JSON.stringify(research), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
            {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.min.json", (res) =>
                {
                    let body = "";
                    res.on("data", (chunk) => { body += chunk; });
                
                    res.on("end", () => {
                        try
                        {
                            let json = JSON.parse(body);
    
                            fs.writeFile('files/research.json', JSON.stringify(json, null, 4), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                            fs.writeFile('files/research.min.json', JSON.stringify(json), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                        }
                        catch (error)
                        {
                            console.error(error.message);
                        };
                    });
                
                }).on("error", (error) => {
                    console.error(error.message);
                });
            });
    })
}

module.exports = { get }