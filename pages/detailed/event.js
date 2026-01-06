const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;

/**
 * Collect event raid battles and/or raid schedule data from leekduck event page.
 *
 * @param {string} url leekduck.com url for event specific website.
 * @param {string} id unique event id string.
 * @param {dict} bkp parsed event_min.json. Used for fallback data, if anything goes wrong.
 * @returns {Promise}
 */
function get(url, id, bkp) {
  return new Promise(resolve => {
    JSDOM.fromURL(url, {})
      .then(dom => {
        var eventData = {
          raidSchedule: [],
          raidbattles: []
        };

        var pageContent = dom.window.document.querySelector('.page-content');

        // Global raid hour and bonus info to distribute to applicable days
        var globalInfo = {
          raidHourTime: null,
          raidHourSectionId: null, // Track which section had raid hour text
          raidTypesWithRaidHour: [],
          specialNotes: []
        };

        // Process raid sections using DOM structure
        var raidsH2 = pageContent.querySelector('h2#raids');
        if (raidsH2) {
          var raidElements = collectSectionElements(raidsH2);
          processRaidsSection(raidElements, 'raids', eventData, globalInfo);
        }

        var fiveStarH2 = pageContent.querySelector('h2#appearing-in-5-star-raids');
        if (fiveStarH2) {
          var fiveStarElements = collectSectionElements(fiveStarH2);
          processRaidsSection(fiveStarElements, 'appearing-in-5-star-raids', eventData, globalInfo);
        }

        // Distribute raid hour info based on which section it was found in
        if (globalInfo.raidHourTime) {
          if (globalInfo.raidHourSectionId === 'appearing-in-5-star-raids') {
            // If raid hour was in the dedicated 5-star section, apply to ALL scheduled days
            eventData.raidSchedule.forEach(day => {
              day.hasRaidHour = true;
              day.raidHourTime = globalInfo.raidHourTime;
            });
          } else if (globalInfo.raidHourSectionId === 'raids' && globalInfo.raidTypesWithRaidHour.length > 0) {
            // If raid hour was in general raids section, match by raid type keywords
            eventData.raidSchedule.forEach(day => {
              var dayTypeLower = day.raidType.toLowerCase();
              // Check if any raid type keyword from raid hour text appears in this day's raid type
              var matchesRaidHour = globalInfo.raidTypesWithRaidHour.some(keyword => {
                return dayTypeLower.includes(keyword);
              });

              if (matchesRaidHour) {
                day.hasRaidHour = true;
                day.raidHourTime = globalInfo.raidHourTime;
              }
            });
          }
        }

        // Distribute special bonuses to relevant raid days. Attach a bonus to a
        // day if the note explicitly references a matching boss appearing that day
        globalInfo.specialNotes.forEach(note => {
          var noteLower = note.toLowerCase();
          eventData.raidSchedule.forEach(day => {
            // Check if any boss name from this day appears in the bonus text
            var relevantBonus = day.bosses.some(boss => {
              var bossNameVariants = [
                boss.name.toLowerCase(),
                boss.name.replace(/\s*\(.*\)/, '').toLowerCase()
              ];
              return bossNameVariants.some(variant => noteLower.includes(variant));
            });

            if (relevantBonus) {
              day.bonuses.push(note);
            }
          });
        });

        fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: 'event', data: eventData }), err => {
          if (err) {
            console.error(err);
          }
          resolve();
        });
      })
      .catch(_err => {
        console.log(`Error scraping event ${id}: ${_err}`);
        // On error, check backup data for fallback
        for (var i = 0; i < bkp.length; i++) {
          if (bkp[i].eventID == id && bkp[i].extraData != null) {
            // Check for existing event data in backup data -> use these data instead for temporary json file
            var fallbackData = {};

            // Handle both old nested structure and new flattened structure
            if ('event' in bkp[i].extraData) {
              fallbackData = bkp[i].extraData.event;
            } else {
              // Extract flattened structure
              if ('raidSchedule' in bkp[i].extraData) {
                fallbackData.raidSchedule = bkp[i].extraData.raidSchedule;
              }
              if ('raidbattles' in bkp[i].extraData) {
                fallbackData.raidbattles = bkp[i].extraData.raidbattles;
              }
            }

            if (Object.keys(fallbackData).length > 0) {
              fs.writeFile(
                `files/temp/${id}.json`,
                JSON.stringify({
                  id: id,
                  type: 'event',
                  data: fallbackData
                }),
                err => {
                  if (err) {
                    console.error(err);
                  }
                  resolve();
                }
              );
            }
          }
        }
        resolve();
      });
  });
}

/**
 * Determine tier from raid label data
 */
function getTierFromRaidType(raidType) {
  if (!raidType) return null;

  var raidTypeLower = raidType.toLowerCase();

  // Extract tier regardless of shadow/regular
  if (raidTypeLower.includes('one-star') || raidTypeLower.includes('1-star')) return 'Tier 1';
  if (raidTypeLower.includes('three-star') || raidTypeLower.includes('3-star')) return 'Tier 3';
  if (raidTypeLower.includes('five-star') || raidTypeLower.includes('5-star')) return 'Tier 5';
  if (raidTypeLower.includes('six-star') || raidTypeLower.includes('6-star')) return 'Tier 6';
  if (raidTypeLower.includes('mega')) return 'Mega';

  return null; // Unknown tier
}

/**
 * Parse raid type and date from header text
 */
function parseRaidHeader(headerText, contextRaidType) {
  // Day name pattern for strict date matching
  var dayPattern = '(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)';
  var datePattern = dayPattern + ',\\s+\\w+\\s+\\d+'; // e.g., "Monday, November 10"
  
  // Try to parse "Type: Date" format first
  // Examples: "Five-Star Raids: Tuesday, November 11" or "Five-Star Shadow Raids: Monday, November 10"
  var typeAndDateMatch = headerText.match(/([^:]+):\s*(.+)/);
  if (typeAndDateMatch) {
    var dateRegex = new RegExp(datePattern, 'i');
    if (dateRegex.test(typeAndDateMatch[2])) {
      return {
        raidType: typeAndDateMatch[1].trim(),
        date: typeAndDateMatch[2].trim()
      };
    }
  }
  
  // Try date-only format when we have context from section headers
  // Examples: "Tuesday, November 19" when contextRaidType is "Five-Star Raids"
  // Must start with a day name to avoid matching "Appearing in X-Star Raids"
  var dateOnlyRegex = new RegExp('^' + datePattern, 'i');
  var dateOnlyMatch = headerText.match(dateOnlyRegex);
  if (dateOnlyMatch && contextRaidType) {
    return {
      raidType: contextRaidType,
      date: dateOnlyMatch[0].trim()
    };
  }
  
  // Try "Appearing in X-Star Raids (DayName)" format
  // Examples: "Appearing in 5-Star Raids (Saturday)", "Appearing in 3-Star Raids (Sunday)"
  var dayInParensRegex = new RegExp('appearing in\\s+([\\w-]+[\\s-]*star[\\s-]*(?:shadow\\s+)?raids?)\\s*\\((' + dayPattern + ')\\)', 'i');
  var dayInParensMatch = headerText.match(dayInParensRegex);
  if (dayInParensMatch) {
    return {
      raidType: dayInParensMatch[1].trim(),
      date: dayInParensMatch[2].trim() // Just the day name, no full date
    };
  }
  
  return null; // Could not parse
}

/**
 * Parse all bosses from a pokemon list element
 */
function parseBossesFromList(pokemonList, raidType) {
  var bosses = pokemonList.querySelectorAll(':scope > .pkmn-list-item');
  
  return Array.from(bosses)
    .map(boss => parseBossFromElement(boss, raidType))
    .filter(parsed => parsed !== null);
}

/**
 * Parse boss data from DOM element
 */
function parseBossFromElement(bossElement, raidType) {
  var nameElement = bossElement.querySelector(':scope > .pkmn-name');
  var imageElement = bossElement.querySelector(':scope > .pkmn-list-img > img');

  if (!nameElement || !imageElement) return null;

  return {
    name: nameElement.innerHTML.trim(),
    image: imageElement.src,
    canBeShiny: bossElement.querySelector(':scope > .shiny-icon') !== null,
    tier: getTierFromRaidType(raidType)
  };
}

/**
 * Collect all elements between an H2 and the next H2
 */
function collectSectionElements(startH2) {
  var elements = [];
  var current = startH2.nextElementSibling;
  
  while (current && current.tagName !== 'H2') {
    elements.push(current);
    current = current.nextElementSibling;
  }
  
  return elements;
}

/**
 * Process a raids section (either "raids" or "appearing-in-5-star-raids")
 */
function processRaidsSection(elements, sectionId, eventData, globalInfo) {
  var contextRaidType = sectionId === 'appearing-in-5-star-raids' ? 'Five-Star Raids' : null;
  var currentDate = null;
  var currentRaidType = null;
  
  elements.forEach(element => {
    // Handle H3 headers
    if (element.tagName === 'H3' && element.textContent) {
      var h3Text = element.textContent.trim();
      
      // Try to parse as a date header first
      var parsedHeader = parseRaidHeader(h3Text, contextRaidType);
      if (parsedHeader) {
        // This is a daily schedule header
        currentDate = parsedHeader.date;
        currentRaidType = parsedHeader.raidType;
        
        var dayEntry = {
          date: currentDate,
          raidType: currentRaidType,
          bosses: [],
          hasRaidHour: false,
          raidHourTime: null,
          bonuses: []
        };
        eventData.raidSchedule.push(dayEntry);
      } else {
        // Not a date header, might be a raid type header like "Appearing in 3-Star Raids" or "Three-Star Raids"
        currentDate = null;
        currentRaidType = null;
        
        // Update context if it's a raid type header
        var h3Lower = h3Text.toLowerCase();
        
        // Check for "Appearing in X-Star Raids" format
        if (h3Lower.includes('appearing in') && h3Lower.includes('raids')) {
          var typeMatch = h3Text.match(/appearing in\s+([\w-]+)[\s-]*raids?/i);
          if (typeMatch) {
            var base = typeMatch[1]
              .toLowerCase()
              .replace(/-star$/i, '')
              .replace(/\s+star$/i, '')
              .trim();
            contextRaidType = base.charAt(0).toUpperCase() + base.slice(1) + '-Star Raids';
          }
        }
        // Check for direct "X-Star Raids" format (e.g., "One-Star Raids", "Three-Star Raids")
        else if (h3Lower.includes('star') && h3Lower.includes('raids')) {
          // Match patterns like "One-Star Raids", "3-Star Raids", "Five-Star Shadow Raids"
          var directMatch = h3Text.match(/([\w-]+[\s-]*star[\s-]*(?:shadow\s+)?raids?)/i);
          if (directMatch) {
            contextRaidType = directMatch[1].trim();
          }
        }
      }
    }
    
    // Handle Pokemon lists
    if (element.className === 'pkmn-list-flex') {
      if (currentDate) {
        // This list is part of a daily schedule
        var currentDayEntry = eventData.raidSchedule[eventData.raidSchedule.length - 1];
        var bossData = parseBossesFromList(element, currentRaidType);
        currentDayEntry.bosses.push(...bossData);
      } else {
        // This is a static raid list
        var bosses = parseBossesFromList(element, contextRaidType);
        bosses.forEach(bossData => {
          if (!eventData.raidbattles.some(existing => existing.name === bossData.name)) {
            eventData.raidbattles.push(bossData);
          }
        });
      }
    }
    
    // Handle raid hour information
    if (element.tagName === 'P' && element.textContent.includes('Raid Hour')) {
      var raidHourText = element.textContent.trim();
      var raidHourLower = raidHourText.toLowerCase();
      
      // Track which section this raid hour belongs to
      globalInfo.raidHourSectionId = sectionId;
      
      // Extract time
      var timeMatch = raidHourText.match(/from ([\d:]+\s+[ap]\.m\.\s+to\s+[\d:]+\s+[ap]\.m\.)/i);
      if (timeMatch) {
        globalInfo.raidHourTime = timeMatch[1] + ' local time';
      }
      
      // Extract raid type keywords mentioned in the raid hour text
      // Look for common raid type indicators
      if (raidHourLower.includes('five-star') || raidHourLower.includes('5-star')) {
        if (!globalInfo.raidTypesWithRaidHour.includes('five-star')) {
          globalInfo.raidTypesWithRaidHour.push('five-star');
        }
      }
      if (raidHourLower.includes('shadow')) {
        if (!globalInfo.raidTypesWithRaidHour.includes('shadow')) {
          globalInfo.raidTypesWithRaidHour.push('shadow');
        }
      }
      if (raidHourLower.includes('mega')) {
        if (!globalInfo.raidTypesWithRaidHour.includes('mega')) {
          globalInfo.raidTypesWithRaidHour.push('mega');
        }
      }
      // Add more raid types as needed
    }
    
    // Handle special bonus notes
    if (element.tagName === 'P') {
      var noteTextLower = element.textContent.toLowerCase();
      if (
        noteTextLower.includes('fusion energy') ||
        noteTextLower.includes('mega energy') ||
        noteTextLower.includes('primal energy') ||
        noteTextLower.includes('adventure effect move')
      ) {
        var noteText = element.textContent.trim();
        if (noteText.length > 10) {
          globalInfo.specialNotes.push(noteText);
        }
      }
    }
  });
}

module.exports = { get };
