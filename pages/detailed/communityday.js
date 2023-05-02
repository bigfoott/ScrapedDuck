const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get(url, id, bkp)
{
    return new Promise(resolve => {
        JSDOM.fromURL(url, {
        })
        .then((dom) => {

            var commday = {
                spawns: [],
                bonuses: [],
                bonusDisclaimers: [],
                shinies: [],
                specialresearch: []
            };

            var pageContent = dom.window.document.querySelector('.page-content');

            var lastHeader = "";
            pageContent.childNodes.forEach(n =>
            {
                if (n.className && n.className.includes("event-section-header"))
                {
                    lastHeader = n.id;
                }
                
                if (lastHeader == "spawns" && n.className == "pkmn-list-flex")
                {
                    var spawns = n.querySelectorAll(":scope > .pkmn-list-item");
                    
                    spawns.forEach(s =>
                    {
                        var temp = {};
                        temp.name = s.querySelector(":scope > .pkmn-name").innerHTML;
                        temp.image = s.querySelector(":scope > .pkmn-list-img > img").src;
                        commday.spawns.push(temp);
                    });
                }

                else if (lastHeader == "shiny" && n.className == "pkmn-list-flex")
                {
                    var fam = n.querySelectorAll(":scope > .pkmn-list-item");

                    fam.forEach(f =>
                    {
                        var poke = {};
                        poke.name = f.querySelector(":scope > .pkmn-name").innerHTML;
                        poke.image = f.querySelector(":scope > .pkmn-list-img > img").src;

                        commday.shinies.push(poke);
                    });
                }
            })

            var bonuses = dom.window.document.querySelectorAll('.bonus-item');
            var bonusHasDisclaimer = false;

            for (var i = 0; i < bonuses.length; i++)
            {
                var b = bonuses[i];

                var bonus = {};
                bonus.text = b.querySelector(':scope > .bonus-text').innerHTML;
                bonus.image = b.querySelector(':scope > .item-circle > img').src;
                commday.bonuses.push(bonus);

                if (!bonusHasDisclaimer && bonus.text.includes("*"))
                {
                    bonusHasDisclaimer = true;
                }
            }

            if (bonusHasDisclaimer)
            {
                var bonusTextEle = bonuses[bonuses.length - 1].nextSibling.nextSibling;
                while (bonusTextEle.tagName != "H2" && bonusTextEle.nextSibling != null)
                {
                    if (bonusTextEle.tagName == "P")
                    {
                        if (bonusTextEle.innerHTML.includes("<br>\n"))
                        {
                            var split = bonusTextEle.innerHTML.split("<br>\n");
                            split.forEach(s => {
                                commday.bonusDisclaimers.push(s);
                            });
                        }
                        else
                        {
                            commday.bonusDisclaimers.push(bonusTextEle.innerHTML);
                        }
                    }
                    bonusTextEle = bonusTextEle.nextSibling
                }
            }

            var researchllist = dom.window.document.querySelectorAll('.special-research-list > .step-item');

            researchllist.forEach(r =>
            {
                var research = {
                    name: "",
                    step: 0,
                    tasks: [],
                    rewards: []
                };

                research.step = parseInt(r.querySelector(":scope > .step-label > .step-number").innerHTML);
                research.name = r.querySelector(":scope > .task-reward-wrapper > .step-name").innerHTML;

                var tasks = r.querySelectorAll(":scope > .task-reward-wrapper > .task-reward");

                tasks.forEach(t =>
                {
                    var task = {
                        text: "",
                        reward: {
                            text: "",
                            image: ""
                        }
                    };

                    task.text = t.querySelector(":scope > .task-text").innerHTML;

                    task.text = task.text.replace("\n        ", "").trim();

                    task.reward.text = t.querySelector(":scope > .reward-text > .reward-label").innerHTML;
                    task.reward.text = task.reward.text.replace("<span>", "").replace("</span>", "");
                    task.reward.image = t.querySelector(":scope > .reward-text > .reward-bubble > .reward-image").src;

                    research.tasks.push(task);
                });

                var rewards = r.querySelectorAll(":scope > .page-reward-wrapper > .page-reward-list > .page-reward");

                rewards.forEach(w =>
                {
                    var rew = {
                        text: "",
                        image: ""
                    };

                    rew.text = w.querySelector(":scope > .reward-label > span").innerHTML;
                    rew.image = w.querySelector(":scope > .page-reward-item > .reward-image").src;

                    research.rewards.push(rew);
                });

                commday.specialresearch.push(research);
            });

            if (commday.spawns.length > 0 || commday.bonuses.length > 0 || commday.specialresearch.length > 0)
            {
                fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "community-day", data: commday }), err => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                });
            }
        }).catch(_err =>
        {
            for (var i = 0; i < bkp.length; i++)
            {
                if (bkp[i].eventID == id && bkp[i].extraData != null)
                {
                    fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "community-day", data: bkp[i].extraData.communityday.data }), err => {
                        if (err) {
                            console.error(err); 
                            return;
                        }
                    });
                }
            }
        });
    })
}

module.exports = { get }