/**
 * Extracts variables, constants, and functions from ink script
 */
export function extractInkIdentifiers(inkScript: string): string[] {
  if (!inkScript) return [];
  
  const identifiers: string[] = [];
  
  // Match variable declarations like VAR health = 100
  const varRegex = /VAR\s+(\w+)\s*=/g;
  let match;
  while ((match = varRegex.exec(inkScript)) !== null) {
    identifiers.push(match[1]);
  }
  
  // Match constant declarations like CONST max_health = 100
  const constRegex = /CONST\s+(\w+)\s*=/g;
  while ((match = constRegex.exec(inkScript)) !== null) {
    identifiers.push(match[1]);
  }
  
  // Match function declarations like === function_name ===
  const funcRegex = /===\s*(\w+)\s*===/g;
  while ((match = funcRegex.exec(inkScript)) !== null) {
    identifiers.push(match[1]);
  }
  
  // Match tag declarations like # tag_name
  const tagRegex = /#\s*(\w+)/g;
  while ((match = tagRegex.exec(inkScript)) !== null) {
    identifiers.push(match[1]);
  }
  
  return Array.from(new Set(identifiers)); // Remove duplicates
}

/**
 * Modifies an ink script to support external function calls
 * This allows game elements to trigger ink functions
 */
export function addExternalFunctionality(inkScript: string, functionNames: string[]): string {
  let modifiedScript = inkScript;
  
  // Add EXTERNAL declarations for functions if they don't exist
  for (const funcName of functionNames) {
    if (!modifiedScript.includes(`EXTERNAL ${funcName}`)) {
      modifiedScript = `EXTERNAL ${funcName}()\n${modifiedScript}`;
    }
  }
  
  return modifiedScript;
}

/**
 * Creates boilerplate ink code for common game mechanics
 */
export function generateInkBoilerplate(): string {
  return `// Game Variables
VAR player_name = "Player"
VAR health = 100
VAR inventory = ()

// Game Constants
CONST max_health = 100

=== function reset_game ===
~ health = max_health
~ inventory = ()
~ return

=== function add_to_inventory(item) ===
~ inventory += (item)
~ return

=== start ===
# game_start
Welcome, {player_name}!
What would you like to do?

* [Explore the forest] -> forest
* [Visit the town] -> town
* [Check inventory] -> check_inventory

=== forest ===
# forest_scene
You enter the dark forest.
The trees tower above you, blocking out most of the sunlight.

* [Go deeper] -> deep_forest
* [Return to crossroads] -> start

=== town ===
# town_scene
The town is bustling with activity.
You see various shops and people going about their business.

* [Visit the shop] -> shop
* [Talk to townspeople] -> townspeople
* [Return to crossroads] -> start

=== check_inventory ===
# inventory_scene
You have:
{inventory:
  - is empty: nothing.
  - else:
    {LIST_COUNT(inventory) == 1: only {inventory}.}
    {LIST_COUNT(inventory) > 1: {inventory}.}
}

* [Return] -> start

=== deep_forest ===
The forest gets darker and more dense.
You hear strange noises around you.

* [Investigate the noises] 
  You find a mysterious glowing mushroom.
  * * [Take it] 
      ~ add_to_inventory("Glowing Mushroom")
      You carefully pick the mushroom and put it in your bag.
      -> deep_forest
  * * [Leave it] -> deep_forest
* [Go back] -> forest

=== shop ===
"Welcome to my shop!" says the merchant.
"What would you like to buy?"

* [Buy health potion]
  ~ health = max_health
  "That'll be 10 gold," says the merchant.
  You pay and drink the potion. Your health is restored!
  -> town
* [Leave] -> town

=== townspeople ===
You talk to various people in town.
They tell you rumors about treasures hidden in the deep forest.

* [Thank them and leave] -> town`;
}
